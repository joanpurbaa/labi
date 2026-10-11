import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
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
	withDelay,
	withRepeat,
	withTiming,
	type SharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../components/Icon";
import { Mascot } from "../components/mascot/Mascot";
import { Button } from "../components/ui/Button";
import { Illustration } from "../components/ui/Illustration";
import { ProgressRing } from "../components/ui/ProgressRing";
import {
	colors,
	radii,
	shadows,
	spacing,
	type,
} from "../constants/theme";
import { useAuth } from "../lib/auth";
import { formatName } from "../lib/formatName";
import { successHaptic, tapHaptic } from "../lib/haptics";

const TOTAL_STEPS = 4;
const SESSION_SECONDS = 180;

const ENCOURAGEMENTS = [
	"Bagus, silakan lanjut.",
	"Pelan-pelan saja, tidak apa-apa.",
	"Tidak usah terburu-buru.",
	"Kami masih mendengarkan.",
];

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

export default function SesiBerceritaScreen() {
	const router = useRouter();
	const reduceMotion = useReducedMotion();
	const { user, survivorProfile } = useAuth();

	const survivorName = formatName(survivorProfile?.survivorNickname ?? "Bapak/Ibu");
	const companionName = formatName(user?.name ?? "pendamping");
	const assisted =
		survivorProfile?.practiceMode === "companion" ||
		survivorProfile?.instructionPreference === "companion_assistance";

	const [step, setStep] = useState(0);
	const [elapsed, setElapsed] = useState(0);
	const [recording, setRecording] = useState(false);
	const [encouragement, setEncouragement] = useState(ENCOURAGEMENTS[0]);
	const progress = useSharedValue(0);
	const breath = useSharedValue(0);
	const wave = useSharedValue(0);
	const encourageTimer = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		if (!recording) {
			return;
		}
		const timer = setInterval(() => {
			setElapsed((value) => Math.min(value + 1, SESSION_SECONDS));
		}, 1000);
		return () => clearInterval(timer);
	}, [recording]);

	useEffect(() => {
		progress.value = reduceMotion
			? elapsed / SESSION_SECONDS
			: withTiming(elapsed / SESSION_SECONDS, { duration: 900 });
	}, [elapsed, progress, reduceMotion]);

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

	function MicRipple({
		wave,
		phase,
		index,
	}: {
		wave: SharedValue<number>;
		phase: number;
		index: number;
	}) {
		const ringStyle = useAnimatedStyle(() => {
			const t = (wave.value + phase) % 1;
			return {
				opacity: 0.35 * (1 - t),
				transform: [{ scale: 1 + 0.7 * t }],
			};
		});
		return (
			<Animated.View
				pointerEvents="none"
				style={[
					styles.micRipple,
					{
						borderColor: index % 2 === 0 ? colors.marigold : colors.orange,
					},
					ringStyle,
				]}
			/>
		);
	}

	const breathStyle = useAnimatedStyle(() => ({
		transform: [{ scale: 1 + breath.value * 0.06 }],
	}));

	const goNext = () => {
		if (step < TOTAL_STEPS - 1) {
			setStep(step + 1);
		}
	};

	const goBack = () => {
		if (step > 0) {
			setStep(step - 1);
		}
	};

	const exiting = reduceMotion
		? FadeIn.duration(200)
		: FadeInRight.duration(300).easing(Easing.out(Easing.cubic));

	const enterStep = () => {
		tapHaptic();
		goNext();
	};

	const finishSession = () => {
		successHaptic();
		setRecording(false);
		goNext();
	};

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
							<Mascot expression="berbicara" size={120} decorative style={styles.sessionMascot} />
							<Text style={[type.survivorBody, styles.instruction]}>
								Ceritakan apa saja yang terlihat di gambar ini.
							</Text>
							<View style={styles.stimulus}>
								<Illustration name="conversation" size={260} />
							</View>
							{assisted ? (
								<View style={styles.assistRow}>
									<Icon name="heart" size={18} color={colors.primary} />
									<Text style={[type.survivorBody, styles.assistText]}>
										Didampingi {companionName}
									</Text>
								</View>
							) : null}
						</View>
					) : null}

					{step === 2 ? (
						<View style={styles.centerTop}>
							<Mascot expression="mendengar" size={140} decorative style={styles.sessionMascot} />
							<Text style={[type.survivorBody, styles.instruction]}>
								{encouragement}
							</Text>
							<View style={styles.micArea}>
<ProgressRing
								progress={elapsed / SESSION_SECONDS}
								size={252}
								strokeWidth={14}
								color={colors.primary}
								trackColor={`${colors.primary}26`}
								overlay={
									recording && !reduceMotion
										? [0, 0.34, 0.66].map((phase, index) => (
												<MicRipple
													key={index}
													wave={wave}
													phase={phase}
													index={index}
												/>
											))
										: undefined
								}
							>
									<Animated.View style={breathStyle}>
										<Pressable
											accessibilityRole="button"
											accessibilityLabel={
												recording ? "Jeda merekam" : "Mulai merekam"
											}
											onPress={() => {
												tapHaptic();
												setRecording((value) => !value);
											}}
											style={[
												styles.micButton,
												recording && styles.micButtonActive,
											]}
										>
											<Icon
												name={recording ? "check" : "mic"}
												size={64}
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
								{recording ? "Sedang merekam..." : "Tekan mikrofon untuk mulai"}
							</Text>
						</View>
					) : null}

					{step === 3 ? <Celebration /> : null}

					{step === 3 ? (
						<View style={styles.centerTop}>
							<Mascot expression="terimakasih" size={160} decorative />
							<Text style={[type.survivorTitle, styles.title]}>
								Terima kasih, {survivorName}.
							</Text>
							<Text style={[type.survivorBody, styles.body]}>
								Ceritamu tadi bagus sekali. Sampai ketemu minggu depan.
							</Text>
						</View>
					) : null}
				</Animated.View>
			</ScrollView>

			<View style={styles.footer}>
				{step === 0 ? (
					<Button
						label="Mulai"
						size="large"
						fullWidth
						onPress={enterStep}
					/>
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
						<Button
							label="Selesai"
							size="large"
							fullWidth
							onPress={finishSession}
							disabled={!recording && elapsed === 0}
						/>
						<View style={styles.footerRow}>
							<Button
								label="Ulangi"
								variant="ghost"
								onPress={() => {
									tapHaptic();
									setElapsed(0);
									setRecording(true);
								}}
								style={styles.footerGhost}
							/>
							<Button
								label={recording ? "Jeda" : "Lanjut merekam"}
								variant="ghost"
								onPress={() => {
									tapHaptic();
									setRecording((value) => !value);
								}}
								style={styles.footerGhost}
							/>
						</View>
					</View>
				) : null}

				{step === 3 ? (
					<Button
						label="Selesai"
						size="large"
						fullWidth
						onPress={() => router.replace("/sesi-konteks")}
					/>
				) : null}

				{step > 0 && step < 3 ? (
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

function Celebration() {
	const reduceMotion = useReducedMotion();
	const stars = [0, 1, 2, 3, 4, 5, 6];
	return (
		<View
			style={styles.celebration}
			pointerEvents="none"
			accessible={false}
			importantForAccessibility="no-hide-descendants"
		>
			{stars.map((index) => (
				<FallingStar key={index} index={index} reduceMotion={reduceMotion} />
			))}
		</View>
	);
}

function FallingStar({
	index,
	reduceMotion,
}: {
	index: number;
	reduceMotion: boolean;
}) {
	const fall = useSharedValue(0);
	useEffect(() => {
		if (reduceMotion) {
			fall.value = 0.6;
			return;
		}
		fall.value = withDelay(
			index * 90,
			withTiming(1, { duration: 1500, easing: Easing.out(Easing.quad) }),
		);
	}, [fall, index, reduceMotion]);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: 1 - fall.value,
		transform: [{ translateY: fall.value * 180 }],
	}));

	const left = `${8 + index * 12}%` as const;

	return (
		<Animated.View style={[styles.star, { left }, animatedStyle]}>
			<Icon name="star" size={20} color={colors.accent} />
		</Animated.View>
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
	},
	micArea: {
		alignItems: "center",
		justifyContent: "center",
		marginVertical: 12,
	},
	micButton: {
		width: 150,
		height: 150,
		borderRadius: 75,
		backgroundColor: colors.primary,
		alignItems: "center",
		justifyContent: "center",
		...shadows.hero,
	},
	micRipple: {
		width: 150,
		height: 150,
		borderRadius: 75,
		borderWidth: 2,
		position: "absolute",
	},
	micButtonActive: {
		backgroundColor: colors.primaryDark,
	},
	waveRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		height: 48,
		marginTop: 16,
	},
	waveBar: {
		width: 8,
		height: 40,
		borderRadius: 4,
		backgroundColor: colors.accent,
	},
	footer: {
		paddingHorizontal: spacing.xxl,
		paddingTop: spacing.md,
		paddingBottom: spacing.md,
		gap: 12,
	},
	footerStack: {
		gap: 12,
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
