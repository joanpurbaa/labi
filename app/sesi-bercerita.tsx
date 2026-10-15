import {
	RecordingPresets,
	requestRecordingPermissionsAsync,
	setAudioModeAsync,
	useAudioRecorder,
	useAudioRecorderState,
} from "expo-audio";
import { File } from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
	AppState,
	Linking,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import Animated, {
	Easing,
	FadeIn,
	FadeInRight,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withRepeat,
	withTiming,
	type SharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../components/Icon";
import { Mascot } from "../components/mascot/Mascot";
import { Button } from "../components/ui/Button";
import { ProgressRing } from "../components/ui/ProgressRing";
import { colors, radii, shadows, spacing, type } from "../constants/theme";
import * as api from "../lib/api";
import type { StoryDetail } from "../lib/api";
import { clearActiveSession, getActiveSession, setActiveSession } from "../lib/activeSession";
import { useAuth } from "../lib/auth";
import { formatName } from "../lib/formatName";
import { successHaptic, tapHaptic } from "../lib/haptics";
import { sessionDestination } from "../lib/sessionFlow";

const TOTAL_STEPS = 3;
const SESSION_SECONDS = 180;

const ENCOURAGEMENTS = [
	"Bagus, silakan lanjut.",
	"Pelan-pelan saja, tidak apa-apa.",
	"Tidak usah terburu-buru.",
	"Kami masih mendengarkan.",
];

const RECORDING_OPTIONS = {
	...RecordingPresets.HIGH_QUALITY,
	directory: "document" as const,
	numberOfChannels: 1,
	android: {
		...RecordingPresets.HIGH_QUALITY.android,
		extension: ".m4a",
		outputFormat: "mpeg4" as const,
		audioEncoder: "aac" as const,
	},
	ios: {
		...RecordingPresets.HIGH_QUALITY.ios,
		extension: ".m4a",
	},
};

type WaveBarProps = {
	wave: SharedValue<number>;
	phase: number;
};

function WaveBar({ wave, phase }: WaveBarProps) {
	const animatedStyle = useAnimatedStyle(() => {
		const value = 0.5 + 0.5 * Math.sin(wave.value * Math.PI * 2 + phase);
		return { transform: [{ scaleY: 0.35 + value * 0.65 }] };
	});
	return <Animated.View style={[styles.waveBar, animatedStyle]} />;
}

function StepDots({ step }: { step: number }) {
	return (
		<View
			style={styles.dots}
			accessible
			accessibilityLabel={`Langkah ${step + 1} dari ${TOTAL_STEPS}`}
		>
			{Array.from({ length: TOTAL_STEPS }).map((_, index) => (
				<View
					key={index}
					style={[styles.dot, index <= step && styles.dotActive]}
				/>
			))}
		</View>
	);
}

function recordingFile(uri: string, sessionId: number) {
	const ext = uri.split(".").pop()?.split("?")[0]?.toLowerCase() || "m4a";
	const name = `cerita-${sessionId}.${ext}`;
	const mime =
		ext === "m4a" ? "audio/mp4" : ext === "caf" ? "audio/x-caf" : `audio/${ext}`;
	return { name, mime };
}

export default function SesiBerceritaScreen() {
	const router = useRouter();
	const reduceMotion = useReducedMotion();
	const { sessionId, storyId } = useLocalSearchParams<{
		sessionId: string;
		storyId: string;
	}>();
	const { token, user, survivorProfile } = useAuth();

	const survivorName = formatName(
		survivorProfile?.survivorNickname ?? "Bapak/Ibu",
	);
	const assisted =
		survivorProfile?.practiceMode === "companion" ||
		survivorProfile?.instructionPreference === "companion_assistance";

	const numericSessionId = Number(sessionId);
	const numericStoryId = Number(storyId);

	const [step, setStep] = useState(0);
	const [story, setStory] = useState<StoryDetail | null>(null);
	const [phase, setPhase] = useState<"idle" | "uploading">("idle");
	const [uploadProgress, setUploadProgress] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [permissionSettings, setPermissionSettings] = useState(false);
	const [savedUri, setSavedUri] = useState<string | null>(null);
	const [savedDurationMs, setSavedDurationMs] = useState(0);
	const uploadRef = useRef<AbortController | null>(null);
	const finishingRef = useRef(false);
	const [encouragement, setEncouragement] = useState(ENCOURAGEMENTS[0]);
	const progress = useSharedValue(0);
	const breath = useSharedValue(0);
	const wave = useSharedValue(0);
	const encourageTimer = useRef<ReturnType<typeof setInterval> | null>(null);
	const recorder = useAudioRecorder(RECORDING_OPTIONS, (status) => {
		if (status.hasError || status.mediaServicesDidReset) {
			setError("Rekaman sempat terhenti. Rekaman yang tersimpan tetap bisa dicoba lagi.");
		}
	});
	const recorderState = useAudioRecorderState(recorder);
	const recording = recorderState.isRecording;
	const elapsedSeconds = Math.floor(recorderState.durationMillis / 1000);

	useEffect(() => {
		let active = true;
		if (!token || !Number.isFinite(numericStoryId)) {
			return;
		}
		(async () => {
			try {
				const detail = await api.getStory(token, numericStoryId);
				if (active) {
					setStory(detail);
				}
			} catch (err) {
				if (active) {
					setError(api.errorMessage(err));
				}
			}
		})();
		return () => {
			active = false;
		};
	}, [token, numericStoryId]);

	useEffect(() => {
		const ratio = Math.min(
			recorderState.durationMillis / (SESSION_SECONDS * 1000),
			1,
		);
		progress.value = reduceMotion ? ratio : withTiming(ratio, { duration: 400 });
	}, [recorderState.durationMillis, progress, reduceMotion]);

	useEffect(() => {
		if (recording && !reduceMotion) {
			breath.value = withRepeat(
				withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
				-1,
				true,
			);
			wave.value = withRepeat(
				withTiming(1, { duration: 1600, easing: Easing.linear }),
				-1,
				false,
			);
		} else {
			breath.value = withTiming(0, { duration: 200 });
			wave.value = 0;
		}
	}, [recording, reduceMotion, breath, wave]);

	useEffect(() => {
		if (!recording) {
			if (encourageTimer.current) {
				clearInterval(encourageTimer.current);
				encourageTimer.current = null;
			}
			return;
		}
		let index = 0;
		encourageTimer.current = setInterval(() => {
			index = (index + 1) % ENCOURAGEMENTS.length;
			setEncouragement(ENCOURAGEMENTS[index]);
		}, 22000);
		return () => {
			if (encourageTimer.current) {
				clearInterval(encourageTimer.current);
				encourageTimer.current = null;
			}
		};
	}, [recording]);

	useEffect(() => {
		return () => {
			uploadRef.current?.abort();
			void setAudioModeAsync({ allowsRecording: false });
		};
	}, []);

	useEffect(() => {
		let active = true;
		if (!user) return;
		void (async () => {
			const session = await getActiveSession(user.id);
			if (active && session?.sessionId === numericSessionId && session.recordingUri) {
				setSavedUri(session.recordingUri);
				setSavedDurationMs(session.recordingDurationMs ?? 0);
				setStep(2);
			}
		})();
		return () => {
			active = false;
		};
	}, [user, numericSessionId]);

	useEffect(() => {
		if (!token || !user || !Number.isFinite(numericSessionId)) return;
		let active = true;
		const checkSession = async () => {
			try {
				const session = await api.getSession(token, numericSessionId);
				if (!active || session.status === "created") return;
				const destination = sessionDestination(session.status);
				if (destination === "sesi-hasil") await clearActiveSession(user.id);
				router.replace({
					pathname: `/${destination}`,
					params: { sessionId: String(session.id), storyId: String(session.story_id) },
				});
			} catch (err) {
				if (active && !(err instanceof api.ApiError && err.status === 404)) {
					setError(api.errorMessage(err));
				}
			}
		};
		void checkSession();
		const subscription = AppState.addEventListener("change", (state) => {
			if (state === "active") void checkSession();
		});
		return () => {
			active = false;
			subscription.remove();
		};
	}, [token, user, numericSessionId, router]);

	useEffect(() => {
		const subscription = AppState.addEventListener("change", (nextState) => {
			if (nextState !== "active" && recorderState.isRecording) {
				recorder.pause();
				setError("Rekaman dijeda saat aplikasi tidak terbuka. Lanjutkan ketika siap.");
			}
		});
		return () => subscription.remove();
	}, [recorder, recorderState.isRecording]);

	const breathStyle = useAnimatedStyle(() => ({
		transform: [{ scale: 1 + breath.value * 0.04 }],
	}));

	const goNext = () => setStep((value) => Math.min(value + 1, TOTAL_STEPS - 1));
	const goBack = () => setStep((value) => Math.max(value - 1, 0));

	const beginRecording = async () => {
		try {
			const permission = await requestRecordingPermissionsAsync();
			if (!permission.granted) {
				setPermissionSettings(!permission.canAskAgain);
				setError("Izinkan akses mikrofon agar cerita dapat direkam.");
				return;
			}
			setPermissionSettings(false);
			await setAudioModeAsync({
				allowsRecording: true,
				playsInSilentMode: true,
			});
			await recorder.prepareToRecordAsync();
			recorder.record();
			setError(null);
		} catch (err) {
			setError(api.errorMessage(err));
		}
	};

	const enterStep = () => {
		tapHaptic();
		if (step === 1) {
			goNext();
			void beginRecording();
			return;
		}
		goNext();
	};

	const handleMicPress = () => {
		tapHaptic();
		if (recorderState.isRecording) {
			recorder.pause();
			return;
		}
		if (recorderState.durationMillis > 0) {
			recorder.record();
			return;
		}
		void beginRecording();
	};

	const restartRecording = async () => {
		tapHaptic();
		setError(null);
		setSavedUri(null);
		try {
			await recorder.prepareToRecordAsync();
			recorder.record();
		} catch (err) {
			setError(api.errorMessage(err));
		}
	};

	const finishSession = async () => {
		if (!token || finishingRef.current || phase !== "idle") {
			return;
		}
		if (!Number.isFinite(numericSessionId)) {
			setError("Sesi tidak ditemukan.");
			return;
		}
		finishingRef.current = true;
		setPhase("uploading");
		setUploadProgress(0);
		setError(null);
		const controller = new AbortController();
		uploadRef.current = controller;
		try {
			if (!savedUri && (recorderState.isRecording || recorderState.durationMillis > 0)) {
				await recorder.stop();
			}
			const uri = savedUri ?? recorder.uri;
			if (!uri) {
				throw new Error("Rekaman belum tersedia.");
			}
			setSavedUri(uri);
			if (user) {
				await setActiveSession(user.id, {
					sessionId: numericSessionId,
					storyId: numericStoryId,
					recordingUri: uri,
					recordingDurationMs: recorderState.durationMillis,
				});
			}
			const file = recordingFile(uri, numericSessionId);
			await api.uploadRecording(
				token,
				numericSessionId,
				{ uri, name: file.name, type: file.mime },
				{
					durationMs: savedDurationMs || recorderState.durationMillis,
					onProgress: (fraction) => setUploadProgress(fraction),
					signal: controller.signal,
				},
			);
			const session = await api.getSession(token, numericSessionId);
			if (session.status !== "recording_uploaded" && session.status !== "running") {
				throw new Error("Rekaman belum terkonfirmasi tersimpan. Coba lagi.");
			}
			try {
				new File(uri).delete();
			} catch {}
			if (user) {
				await setActiveSession(user.id, {
					sessionId: numericSessionId,
					storyId: numericStoryId,
				});
			}
			successHaptic();
			router.replace({
				pathname: "/sesi-proses",
				params: { sessionId: String(numericSessionId), storyId: String(numericStoryId) },
			});
		} catch (err) {
			if (!api.isAbortError(err)) {
				setError(api.errorMessage(err));
			}
		} finally {
			uploadRef.current = null;
			finishingRef.current = false;
			setPhase("idle");
		}
	};

	const openMicrophoneSettings = () => void Linking.openSettings();

	const exiting = reduceMotion
		? FadeIn.duration(200)
		: FadeInRight.duration(300).easing(Easing.out(Easing.cubic));

	const canFinish = Boolean(savedUri) || recorderState.durationMillis > 0 || recording;

	return (
		<SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
			<View style={styles.header}>
				<StepDots step={step} />
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Keluar dari sesi"
					onPress={() => router.back()}
					style={({ pressed }) => [styles.close, pressed && styles.pressed]}
				>
					<Icon name="logout" size={22} color={colors.textSecondary} />
				</Pressable>
			</View>

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<Animated.View key={step} entering={exiting} style={styles.stepWrap}>
					{step === 0 ? (
						<View style={styles.centerTop}>
							<Mascot expression="menyambut" size={160} decorative />
							<Text style={[type.survivorTitle, styles.title]}>
								Halo, {survivorName}.
							</Text>
							<Text style={[type.survivorBody, styles.body]}>
								Yuk, kita bercerita sebentar. Tidak ada salah atau benar di
								sini.
							</Text>
						</View>
					) : null}

					{step === 1 ? (
						<View style={styles.centerTop}>
							<Mascot
									expression="mendengar"
								size={120}
								decorative
								style={styles.sessionMascot}
							/>
							<Text style={[type.survivorBody, styles.instruction]}>
								Bacakan cerita ini, lalu minta {survivorName} menceritakannya
								kembali.
							</Text>
							<View style={styles.stimulus}>
								<Text style={[type.survivorTitle, styles.storyTitle]}>
									{story?.title ?? "Memuat cerita…"}
								</Text>
								<Text style={[type.survivorBody, styles.storyText]}>
									{story?.story_text ?? "…"}
								</Text>
							</View>
							{assisted ? (
								<View style={styles.assistRow}>
									<Icon name="heart" size={18} color={colors.primary} />
									<Text style={[type.survivorBody, styles.assistText]}>
										Dampingi dengan sabar
									</Text>
								</View>
							) : null}
						</View>
					) : null}

					{step === 2 ? (
						<View style={styles.centerTop}>
							<Mascot
								expression="berbicara"
								size={120}
								decorative
								style={styles.sessionMascot}
							/>
							<Text style={[type.survivorBody, styles.instruction]}>
								{encouragement}
							</Text>
							<View style={styles.micArea}>
								<ProgressRing
									progress={recorderState.durationMillis / (SESSION_SECONDS * 1000)}
									size={240}
									strokeWidth={16}
									color={colors.primary}
									trackColor={colors.primarySoft}
								>
									<Animated.View style={breathStyle}>
										<Pressable
											accessibilityRole="button"
											accessibilityLabel={
												recording ? "Jeda merekam" : "Lanjut merekam"
											}
											onPress={handleMicPress}
											style={[
												styles.micButton,
												recording && styles.micButtonActive,
											]}
										>
											<Icon
												name={recording ? "check" : "mic"}
												size={56}
												color={colors.surface}
											/>
										</Pressable>
									</Animated.View>
								</ProgressRing>
							</View>
							<View style={styles.waveRow}>
								{[0, 0.6, 1.2, 1.8, 2.4].map((phase) => (
									<WaveBar key={phase} wave={wave} phase={phase} />
								))}
							</View>
							<Text style={[type.survivorBody, styles.assistText]}>
								{recording
									? "Sedang merekam…"
									: recorderState.durationMillis > 0
										? `Jeda di ${elapsedSeconds} detik`
										: "Tekan mikrofon untuk mulai"}
							</Text>
						</View>
					) : null}

				</Animated.View>
			</ScrollView>

			<View style={styles.footer}>
				{error ? (
					<View style={styles.errorBox}>
						<Icon name="info" size={18} color={colors.danger} />
						<Text style={[type.small, styles.errorText]}>{error}</Text>
					</View>
				) : null}
				{permissionSettings ? (
					<Button label="Buka pengaturan mikrofon" variant="ghost" fullWidth onPress={openMicrophoneSettings} />
				) : null}

				{step === 0 ? (
					<Button label="Mulai" size="large" fullWidth onPress={enterStep} />
				) : null}

				{step === 1 ? (
					<Button
						label="Mulai bercerita"
						size="large"
						fullWidth
						onPress={enterStep}
					/>
				) : null}

				{step === 2 ? (
					<View style={styles.footerStack}>
						{phase === "uploading" ? (
							<Text style={[type.small, styles.phaseText]}>
								Mengunggah rekaman… {Math.round(uploadProgress * 100)}%
							</Text>
						) : null}
						<Button
							label={
								phase === "uploading"
									? "Menyimpan…"
									: error
										? "Coba lagi"
										: "Stop & simpan"
							}
							size="large"
							fullWidth
							loading={phase !== "idle"}
							onPress={finishSession}
							disabled={!canFinish || phase !== "idle"}
						/>
						<View style={styles.footerRow}>
							<Button
								label="Ulangi"
								variant="ghost"
								onPress={restartRecording}
								style={styles.footerGhost}
							/>
							<Button
								label={recording ? "Jeda" : "Lanjut merekam"}
								variant="ghost"
								onPress={handleMicPress}
								style={styles.footerGhost}
							/>
						</View>
					</View>
				) : null}

				{step > 0 ? (
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="Kembali"
						onPress={goBack}
						style={({ pressed }) => [styles.back, pressed && styles.pressed]}
					>
						<Text style={[type.survivorBody, styles.backText]}>Kembali</Text>
					</Pressable>
				) : null}
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
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: spacing.xl,
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
	dots: {
		flexDirection: "row",
		gap: 8,
	},
	dot: {
		width: 10,
		height: 10,
		borderRadius: 5,
		backgroundColor: colors.borderStrong,
	},
	dotActive: {
		backgroundColor: colors.primary,
		width: 24,
	},
	content: {
		flexGrow: 1,
		justifyContent: "center",
		paddingHorizontal: spacing.xxl,
		paddingVertical: spacing.xl,
	},
	stepWrap: {
		alignItems: "center",
	},
	centerTop: {
		alignItems: "center",
	},
	title: {
		color: colors.textPrimary,
		textAlign: "center",
		marginTop: 24,
	},
	body: {
		color: colors.textSecondary,
		textAlign: "center",
		marginTop: 12,
	},
	instruction: {
		color: colors.textPrimary,
		textAlign: "center",
		marginBottom: 20,
	},
	sessionMascot: {
		marginBottom: 8,
	},
	stimulus: {
		backgroundColor: colors.surface,
		borderRadius: radii.card,
		padding: spacing.lg,
		...shadows.card,
	},
	storyTitle: {
		color: colors.textPrimary,
		textAlign: "center",
		marginBottom: 12,
	},
	storyText: {
		color: colors.textSecondary,
	},
	assistRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginTop: 20,
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 999,
		backgroundColor: colors.primarySoft,
	},
	assistText: {
		color: colors.primaryDark,
		textAlign: "center",
	},
	micArea: {
		alignItems: "center",
		justifyContent: "center",
		marginVertical: 12,
	},
	micButton: {
		width: 132,
		height: 132,
		borderRadius: 66,
		backgroundColor: colors.primary,
		alignItems: "center",
		justifyContent: "center",
		...shadows.hero,
	},
	micRipple: {
		width: 132,
		height: 132,
		borderRadius: 66,
		borderWidth: 2,
		borderColor: colors.marigold,
	},
	micButtonActive: {
		backgroundColor: colors.primaryDark,
	},
	waveRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginTop: 20,
		marginBottom: spacing.md,
		height: 36,
	},
	waveBar: {
		width: 8,
		height: 32,
		borderRadius: 4,
		backgroundColor: colors.accent,
	},
	footer: {
		paddingHorizontal: spacing.xxl,
		paddingBottom: spacing.xl,
		paddingTop: spacing.sm,
		gap: spacing.sm,
	},
	footerStack: {
		gap: spacing.sm,
	},
	footerRow: {
		flexDirection: "row",
		gap: 12,
		justifyContent: "center",
	},
	footerGhost: {
		flex: 1,
	},
	back: {
		alignItems: "center",
		justifyContent: "center",
		minHeight: 52,
	},
	backText: {
		color: colors.textSecondary,
	},
	pressed: {
		opacity: 0.7,
	},
	errorBox: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 8,
		padding: 14,
		borderRadius: radii.cardSmall,
		backgroundColor: colors.dangerSoft,
	},
	errorText: {
		flex: 1,
		color: colors.danger,
	},
	phaseText: {
		color: colors.textSecondary,
		textAlign: "center",
	},
	celebration: {
		position: "absolute",
		left: 0,
		right: 0,
		top: 40,
		bottom: 0,
		alignItems: "center",
	},
	star: {
		position: "absolute",
		top: 0,
	},
});
