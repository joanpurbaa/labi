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

const MAX_WAIT_MS = 120000;
const MAX_POLL_ATTEMPTS = 45;
const POLL_START_MS = 1200;
const POLL_MAX_MS = 4000;

type FlowState = "checking" | "working" | "slow" | "failed" | "error";

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
	const abortRef = useRef<AbortController | null>(null);

	useEffect(() => {
		if (!token || !user || !Number.isFinite(numericSessionId)) {
			return;
		}
		const controller = new AbortController();
		abortRef.current = controller;
		let active = true;
		const poll = async () => {
			const startedAt = Date.now();
			let delay = POLL_START_MS;
			let attempts = 0;
			while (active && !controller.signal.aborted && attempts < MAX_POLL_ATTEMPTS) {
				if (Date.now() - startedAt > MAX_WAIT_MS) {
					if (active) {
						setState("slow");
					}
					return;
				}
				try {
					await sleep(delay, controller.signal);
				} catch {
					return;
				}
				if (!active || controller.signal.aborted) {
					return;
				}
				attempts += 1;
				let analysis: AnalysisRead;
				try {
					analysis = await api.getAnalysis(token, numericSessionId, controller.signal);
				} catch (err) {
					if (api.isAbortError(err)) {
						return;
					}
					delay = Math.min(Math.round(delay * 1.4), POLL_MAX_MS);
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
					if (active) {
						setMessage(
							analysisErrorText(analysis.error_code, analysis.error_message),
						);
						setState("failed");
					}
					return;
				}
				delay = Math.min(Math.round(delay * 1.4), POLL_MAX_MS);
			}
			if (active && !controller.signal.aborted) {
				setState("slow");
			}
		};

		const run = async () => {
			setState("checking");
			setMessage(null);
			try {
				const session = await api.getSession(token, numericSessionId, controller.signal);
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
					if (!(err instanceof api.ApiError) || err.status !== 404) {
						setMessage(api.errorMessage(err));
						setState("error");
						return;
					}
				}
				if (analysis && isAnalysisFailed(analysis.status) && retryKey === 0) {
					setMessage(analysisErrorText(analysis.error_code, analysis.error_message));
					setState("failed");
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
					(!analysis && session.status === "recording_uploaded") ||
					isAnalysisFailed(analysis?.status)
				) {
					try {
						analysis = await api.startAnalysis(token, numericSessionId, undefined, controller.signal);
					} catch (err) {
						if (api.isAbortError(err)) {
							return;
						}
						setMessage(api.errorMessage(err));
						setState("error");
						return;
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
					setMessage(
						analysisErrorText(analysis.error_code, analysis.error_message),
					);
					setState("failed");
					return;
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
	}, [token, user, numericSessionId, numericStoryId, retryKey, router]);

	useEffect(() => {
		const subscription = AppState.addEventListener("change", (nextState) => {
			if (nextState !== "active") abortRef.current?.abort();
			else setRetryKey((value) => value + 1);
		});
		return () => subscription.remove();
	}, []);

	const retry = () => setRetryKey((value) => value + 1);

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
						: state === "slow"
							? "Masih kami siapkan"
					: "Sedang menyusun hasil bicara Ibu…"}
				</Text>
				<Text style={[type.body, styles.body]}>
					{state === "failed"
						? (message ??
							"Ada kendala kecil saat memproses cerita. Coba lagi ya.")
						: state === "slow"
							? "Prosesnya lebih lama dari biasanya. Kamu boleh menunggu atau mencoba lagi nanti."
						: "Hasilnya boleh dilihat nanti. Proses tetap berjalan meski aplikasi ditutup."}
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
				{state === "failed" || state === "error" || state === "slow" ? (
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
