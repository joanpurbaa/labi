import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
	AppState,
	ActivityIndicator,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../components/Icon";
import { Mascot } from "../components/mascot/Mascot";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { colors, layout, shadows, spacing, type } from "../constants/theme";
import * as api from "../lib/api";
import type { AnalysisRead } from "../lib/api";
import { useAuth } from "../lib/auth";
import { clearActiveSession, setActiveSession } from "../lib/activeSession";
import {
	analysisErrorText,
	isAnalysisDone,
	isAnalysisFailed,
	sessionDestination,
} from "../lib/sessionFlow";
import { ANALYSIS_TIMEOUT_MESSAGE } from "../lib/useAnalysisPolling";

const POLL_INTERVAL_MS = 3000;
const MAX_WAIT_MS = 240000;
const MAX_POLL_ATTEMPTS = 80;

function progressText(elapsedSec: number): string {
	if (elapsedSec <= 15) {
		return "Menyiapkan transkripsi audio...";
	}
	if (elapsedSec <= 35) {
		return "Menganalisis jeda hening dan ritme bicara...";
	}
	return "Mengevaluasi unit informasi klinis dengan AI lokal (proses ini membutuhkan waktu 2–3 menit)...";
}

type FlowState = "checking" | "working" | "slow" | "failed" | "error";

function isTransientFetchError(err: unknown): boolean {
	if (!(err instanceof api.ApiError)) {
		return true;
	}
	if (err.code === "network" || err.code === "timeout") {
		return true;
	}
	return err.status === 0 || err.status >= 500;
}

const MAX_AUTO_RESTARTS = 2;

// Kode yang jelas-jelas salah input (rekaman bermasalah) → langsung vonis.
// Kode lain (INTERNAL, timeout, provider, atau tidak dikenal) → transient,
// jangan vonis gagal, tunggu + restart otomatis.
const FATAL_ANALYSIS_CODES = new Set([
	"NO_AUDIO",
	"EMPTY_AUDIO",
	"AUDIO_TOO_SHORT",
	"TOO_SHORT",
	"UNSUPPORTED_FORMAT",
	"INVALID_AUDIO",
	"BAD_AUDIO",
	"NO_SPEECH",
	"NO_SPEECH_DETECTED",
	"DURATION_TOO_SHORT",
]);

function isFatalAnalysisFailure(code?: string | null): boolean {
	if (!code) {
		return false;
	}
	return FATAL_ANALYSIS_CODES.has(code.trim().toUpperCase());
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		if (signal.aborted) {
			reject(new Error("aborted"));
			return;
		}
		const timer = setTimeout(() => {
			signal.removeEventListener("abort", onAbort);
			resolve();
		}, ms);
		const onAbort = () => {
			clearTimeout(timer);
			reject(new Error("aborted"));
		};
		signal.addEventListener("abort", onAbort);
	});
}

export default function SesiProsesScreen() {
	const router = useRouter();
	const { sessionId, storyId } = useLocalSearchParams<{
		sessionId: string;
		storyId: string;
	}>();
	const { token, user } = useAuth();

	const numericSessionId = Number(sessionId);
	const numericStoryId = Number(storyId);

	const [state, setState] = useState<FlowState>("checking");
	const [message, setMessage] = useState<string | null>(null);
	const [retryKey, setRetryKey] = useState(0);
	const [resumeKey, setResumeKey] = useState(0);
	const [elapsedSec, setElapsedSec] = useState(0);
	const abortRef = useRef<AbortController | null>(null);
	const skipStartRef = useRef(false);

	useEffect(() => {
		if (!token || !user || !Number.isFinite(numericSessionId)) {
			return;
		}
		const controller = new AbortController();
		abortRef.current = controller;
		let active = true;
		let autoRestarts = 0;

		const showFailed = (analysis: AnalysisRead) => {
			if (active) {
				setMessage(
					analysisErrorText(analysis.error_code, analysis.error_message),
				);
				setState("failed");
			}
		};

		// return true = berhenti (sudah vonis / abort / sesi hilang),
		// false = lanjut polling dengan UI "harap tunggu".
		const recoverFromFailure = async (
			analysis: AnalysisRead,
		): Promise<boolean> => {
			if (isFatalAnalysisFailure(analysis.error_code)) {
				showFailed(analysis);
				return true;
			}
			if (autoRestarts >= MAX_AUTO_RESTARTS) {
				showFailed(analysis);
				return true;
			}
			autoRestarts += 1;
			if (active) {
				setState("working");
			}
			try {
				await api.startAnalysis(
					token,
					numericSessionId,
					undefined,
					controller.signal,
				);
			} catch (err) {
				if (api.isAbortError(err)) {
					return true;
				}
				if (err instanceof api.ApiError && err.status === 404) {
					if (active) {
						setMessage(api.errorMessage(err));
						setState("error");
					}
					return true;
				}
				if (__DEV__) {
					console.log(
						"[sesi-proses] restart analisis otomatis gagal, lanjut polling:",
						err,
					);
				}
			}
			return false;
		};

		const poll = async () => {
			const startedAt = Date.now();
			let attempts = 0;
			while (active && !controller.signal.aborted && attempts < MAX_POLL_ATTEMPTS) {
				if (Date.now() - startedAt > MAX_WAIT_MS) {
					if (active) {
						setState("slow");
					}
					return;
				}
				try {
					await sleep(POLL_INTERVAL_MS, controller.signal);
				} catch {
					return;
				}
				if (!active || controller.signal.aborted) {
					return;
				}
				attempts += 1;
				if (active) {
					setElapsedSec(Math.floor((Date.now() - startedAt) / 1000));
				}
				let analysis: AnalysisRead;
				try {
					analysis = await api.getAnalysis(token, numericSessionId, controller.signal);
				} catch (err) {
					if (api.isAbortError(err)) {
						return;
					}
					continue;
				}
				if (isAnalysisDone(analysis.status)) {
					await setActiveSession(user.id, {
						sessionId: numericSessionId,
						storyId: numericStoryId,
					});
					if (active) {
						router.replace({
							pathname: "/sesi-nilai",
							params: {
								sessionId: String(numericSessionId),
								storyId: String(numericStoryId),
							},
						});
					}
					return;
				}
				if (isAnalysisFailed(analysis.status)) {
					if (await recoverFromFailure(analysis)) {
						return;
					}
					continue;
				}
			}
			if (active && !controller.signal.aborted) {
				setState("slow");
			}
		};

		const loadSession = async () => {
			let lastError: unknown = null;
			for (let attempt = 0; attempt < 3; attempt += 1) {
				try {
					return await api.getSession(
						token,
						numericSessionId,
						controller.signal,
					);
				} catch (err) {
					if (api.isAbortError(err)) {
						throw err;
					}
					lastError = err;
					if (
						!isTransientFetchError(err) ||
						!active ||
						controller.signal.aborted
					) {
						throw err;
					}
					try {
						await sleep(800 * (attempt + 1), controller.signal);
					} catch {
						throw err;
					}
				}
			}
			throw lastError;
		};

		const run = async () => {
			setState("checking");
			setMessage(null);
			setElapsedSec(0);
			const skipStart = skipStartRef.current;
			skipStartRef.current = false;
			try {
				const session = await loadSession();
				if (!active || controller.signal.aborted) {
					return;
				}
				const destination = sessionDestination(session.status);
				if (destination === "sesi-bercerita") {
					router.replace({
						pathname: "/sesi-bercerita",
						params: {
							sessionId: String(numericSessionId),
							storyId: String(numericStoryId),
						},
					});
					return;
				}
				if (session.status === "completed") {
					await clearActiveSession(user.id);
					if (active) {
						router.replace({
							pathname: "/sesi-hasil",
							params: { sessionId: String(numericSessionId) },
						});
					}
					return;
				}
				if (sessionDestination(session.status) === "sesi-pilih") {
					await clearActiveSession(user.id);
					if (active) {
						router.replace("/sesi-pilih");
					}
					return;
				}
				setState("working");
				let analysis: AnalysisRead | null = null;
				try {
					analysis = await api.getAnalysis(token, numericSessionId, controller.signal);
				} catch (err) {
					if (api.isAbortError(err)) {
						return;
					}
					// Gagal baca sekali (404 = run belum ada, 500/network =
					// transient) bukan vonis gagal — lanjut ke start/polling.
					if (__DEV__) {
						console.log("[sesi-proses] getAnalysis awal gagal, lanjut polling:", err);
					}
					analysis = null;
				}
				if (analysis && isAnalysisFailed(analysis.status)) {
					if (await recoverFromFailure(analysis)) {
						return;
					}
					// Recovery sudah restart run baru — langsung polling,
					// jangan start dua kali.
					await poll();
					return;
				}
				if (analysis && isAnalysisDone(analysis.status)) {
					router.replace({
						pathname: "/sesi-nilai",
						params: { sessionId: String(numericSessionId), storyId: String(numericStoryId) },
					});
					return;
				}
				if (
					!skipStart &&
					((!analysis && session.status === "recording_uploaded") ||
						isAnalysisFailed(analysis?.status))
				) {
					try {
						analysis = await api.startAnalysis(token, numericSessionId, undefined, controller.signal);
					} catch (err) {
						if (api.isAbortError(err)) {
							return;
						}
						if (err instanceof api.ApiError && err.status === 404) {
							setMessage(api.errorMessage(err));
							setState("error");
							return;
						}
						// Start gagal transient (atau run sudah jalan = 409):
						// jangan vonis error — polling yang menentukan.
						if (__DEV__) {
							console.log("[sesi-proses] startAnalysis gagal, lanjut polling:", err);
						}
					}
				}
				if (!active || controller.signal.aborted) {
					return;
				}
				if (analysis && isAnalysisDone(analysis.status)) {
					await setActiveSession(user.id, {
						sessionId: numericSessionId,
						storyId: numericStoryId,
					});
					if (active) {
						router.replace({
							pathname: "/sesi-nilai",
							params: {
								sessionId: String(numericSessionId),
								storyId: String(numericStoryId),
							},
						});
					}
					return;
				}
				if (analysis && isAnalysisFailed(analysis.status)) {
					if (await recoverFromFailure(analysis)) {
						return;
					}
				}
				await poll();
			} catch (err) {
				if (!active || api.isAbortError(err)) {
					return;
				}
				setMessage(api.errorMessage(err));
				setState("error");
			}
		};

		void run();

		return () => {
			active = false;
			controller.abort();
		};
	}, [token, user, numericSessionId, numericStoryId, retryKey, resumeKey, router]);

	useEffect(() => {
		const subscription = AppState.addEventListener("change", (nextState) => {
			if (nextState !== "active") abortRef.current?.abort();
			else setRetryKey((value) => value + 1);
		});
		return () => subscription.remove();
	}, []);

	const retry = () => setRetryKey((value) => value + 1);

	// Timeout 240 dtk: lanjutkan polling murni tanpa restart run baru.
	const continueWaiting = () => {
		skipStartRef.current = true;
		setResumeKey((value) => value + 1);
	};

	const leave = async () => {
		abortRef.current?.abort();
		if (user) {
			await clearActiveSession(user.id);
		}
		router.replace("/");
	};

	return (
		<SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
			<View style={styles.header}>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Keluar"
					onPress={leave}
					style={({ pressed }) => [styles.close, pressed && styles.pressed]}
				>
					<Icon name="logout" size={22} color={colors.textSecondary} />
				</Pressable>
			</View>

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<Mascot
					expression={state === "failed" ? "menenangkan" : "berpikir"}
					size={140}
					decorative
				/>
				<Text style={[type.h2, styles.title]}>
					{state === "failed"
						? "Cerita belum bisa diproses"
						: state === "error"
							? "Tidak bisa memuat progres"
							: state === "slow"
								? "Masih kami siapkan"
						: "Sedang menyusun hasil bicara Ibu…"}
				</Text>
				<Text style={[type.body, styles.body]}>
					{state === "failed"
						? (message ??
							"Ada kendala kecil saat memproses cerita. Coba lagi ya.")
						: state === "error"
							? (message ??
								"Ada kendala saat memuat progres analisis. Coba lagi ya.")
							: state === "slow"
								? ANALYSIS_TIMEOUT_MESSAGE
							: progressText(elapsedSec)}
				</Text>

				{state === "checking" || state === "working" ? (
					<View style={styles.loadingRow}>
						<ActivityIndicator color={colors.primary} />
					</View>
				) : null}

				{state === "slow" ? (
					<Card style={styles.noteCard}>
						<View style={styles.noteRow}>
							<Icon name="info" size={16} color={colors.textSecondary} />
							<Text style={[type.small, styles.noteText]}>
								Rekaman tetap tersimpan. Sesi bisa dilanjutkan lagi kapan saja.
							</Text>
						</View>
					</Card>
				) : null}
			</ScrollView>

			<View style={styles.footer}>
				{state === "slow" ? (
					<>
						<Button
							label="Lanjutkan Menunggu"
							size="large"
							fullWidth
							onPress={continueWaiting}
							style={styles.retry}
						/>
						<Button
							label="Muat Ulang Halaman"
							variant="secondary"
							fullWidth
							onPress={retry}
							style={styles.retry}
						/>
					</>
				) : null}
				{state === "failed" || state === "error" ? (
					<Button
						label={state === "failed" ? "Proses ulang" : "Coba lagi"}
						size="large"
						fullWidth
						onPress={retry}
						style={styles.retry}
					/>
				) : null}
				<Button
					label={state === "failed" || state === "error" ? "Nanti saja" : "Ke beranda"}
					variant="ghost"
					fullWidth
					onPress={leave}
				/>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: {
		flex: 1,
		backgroundColor: colors.background,
	},
	header: {
		flexDirection: "row",
		justifyContent: "flex-end",
		paddingHorizontal: layout.screenPadding,
		paddingTop: spacing.sm,
	},
	close: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: colors.surface,
		alignItems: "center",
		justifyContent: "center",
		...shadows.pill,
	},
	content: {
		flexGrow: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: layout.screenPadding,
		paddingBottom: spacing.xxl,
	},
	title: {
		color: colors.textPrimary,
		textAlign: "center",
		marginTop: spacing.xl,
	},
	body: {
		color: colors.textSecondary,
		textAlign: "center",
		marginTop: spacing.sm,
	},
	loadingRow: {
		marginTop: spacing.xl,
	},
	noteCard: {
		marginTop: spacing.xxl,
		alignSelf: "stretch",
	},
	noteRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	noteText: {
		flex: 1,
		color: colors.textSecondary,
	},
	footer: {
		paddingHorizontal: layout.screenPadding,
		paddingBottom: spacing.lg,
		gap: spacing.sm,
	},
	retry: {
		marginBottom: spacing.xs,
	},
	pressed: {
		opacity: 0.7,
	},
});
