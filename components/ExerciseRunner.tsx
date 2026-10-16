import { useEffect, useRef, useState } from "react";
import {
	Alert,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "./Icon";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { colors, radii, spacing, type } from "../constants/theme";
import * as api from "../lib/api";
import { successHaptic, tapHaptic } from "../lib/haptics";
import type { ExerciseViewModel } from "../lib/sessionDetailPresenter";

type ExerciseRunnerProps = {
	token: string;
	sessionId: number;
	exercise: ExerciseViewModel;
	onClose: () => void;
	onCompleted: () => void;
};

const FEEDBACK = [
	{ value: "mudah", label: "Mudah" },
	{ value: "pas", label: "Pas" },
	{ value: "sulit", label: "Sulit" },
] as const;

function formatClock(totalSeconds: number): string {
	const safe = Math.max(0, totalSeconds);
	const minutes = Math.floor(safe / 60);
	const seconds = safe % 60;
	const pad = (value: number) => String(value).padStart(2, "0");
	return `${pad(minutes)}:${pad(seconds)}`;
}

export function ExerciseRunner({
	token,
	sessionId,
	exercise,
	onClose,
	onCompleted,
}: ExerciseRunnerProps) {
	const totalSeconds = Math.max(60, exercise.durationMin * 60);
	const [remaining, setRemaining] = useState(totalSeconds);
	const [running, setRunning] = useState(false);
	const [checked, setChecked] = useState<Record<number, boolean>>({});
	const [feedback, setFeedback] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [done, setDone] = useState(false);
	const [announcement, setAnnouncement] = useState("");
	const remainingRef = useRef(totalSeconds);
	const lastMinute = useRef(Math.ceil(totalSeconds / 60));

	useEffect(() => {
		if (!running) {
			return;
		}
		const timer = setInterval(() => {
			const next = Math.max(0, remainingRef.current - 1);
			remainingRef.current = next;
			setRemaining(next);
			if (next === 0) {
				clearInterval(timer);
				setRunning(false);
				successHaptic();
				setAnnouncement("Waktu latihan selesai.");
				return;
			}
			const minuteLeft = Math.ceil(next / 60);
			if (minuteLeft < lastMinute.current) {
				lastMinute.current = minuteLeft;
				setAnnouncement(`Sisa waktu ${minuteLeft} menit.`);
			}
		}, 1000);
		return () => clearInterval(timer);
	}, [running]);

	const resetClock = () => {
		remainingRef.current = totalSeconds;
		lastMinute.current = Math.ceil(totalSeconds / 60);
		setRemaining(totalSeconds);
		setAnnouncement("");
	};

	const toggleStep = (index: number) => {
		tapHaptic();
		setChecked((current) => ({ ...current, [index]: !current[index] }));
	};

	const requestClose = () => {
		if (running) {
			Alert.alert(
				"Keluar dari latihan?",
				"Timer sedang berjalan. Progres checklist akan hilang.",
				[
					{ text: "Tetap di sini", style: "cancel" },
					{ text: "Keluar", style: "destructive", onPress: onClose },
				],
			);
			return;
		}
		onClose();
	};

	const submitDone = async () => {
		if (!feedback || saving) {
			return;
		}
		setSaving(true);
		try {
			await api.createTrainingLog(token, sessionId, {
				training_mode: exercise.mode,
				title: exercise.title,
				status: "completed",
				duration_minutes: exercise.durationMin,
				notes: `Umpan balik: ${feedback}`,
			});
			successHaptic();
			setDone(true);
			onCompleted();
		} catch (err) {
			Alert.alert("Gagal menyimpan", api.errorMessage(err));
		} finally {
			setSaving(false);
		}
	};

	return (
		<SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
			<View style={styles.header}>
				<View style={styles.headText}>
					<Text style={[type.small, styles.kicker]}>{exercise.levelTitle}</Text>
					<Text style={[type.h2, styles.title]}>{exercise.title}</Text>
				</View>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Tutup latihan"
					onPress={requestClose}
					style={({ pressed }) => [styles.close, pressed && styles.pressed]}
				>
					<Icon name="check" size={18} color={colors.textSecondary} />
				</Pressable>
			</View>

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<Card style={styles.timerCard}>
					<Text
						style={[type.display, styles.clock]}
						accessibilityLiveRegion="polite"
					>
						{formatClock(remaining)}
					</Text>
					<Text style={[type.small, styles.announced]}>{announcement}</Text>
					<View style={styles.timerRow}>
						<Button
							label={running ? "Jeda" : "Mulai"}
							onPress={() => {
								tapHaptic();
								if (!running && remaining === 0) {
									resetClock();
								}
								setRunning((value) => !value);
							}}
							style={styles.timerButton}
						/>
						<Button
							label="Ulangi"
							variant="secondary"
							onPress={() => {
								setRunning(false);
								resetClock();
							}}
							style={styles.timerButton}
						/>
					</View>
				</Card>

				<Text style={[type.h3, styles.sectionTitle]}>Langkah latihan</Text>
				{exercise.steps.map((step, index) => {
					const active = Boolean(checked[index]);
					return (
						<Pressable
							key={index}
							accessibilityRole="checkbox"
							accessibilityState={{ checked: active }}
							accessibilityLabel={`Langkah ${index + 1}: ${step}`}
							onPress={() => toggleStep(index)}
							style={({ pressed }) => [
								styles.step,
								pressed && styles.pressed,
							]}
						>
							<View style={[styles.box, active && styles.boxActive]}>
								{active ? (
									<Icon name="check" size={15} color={colors.surface} />
								) : null}
							</View>
							<Text style={[type.body, styles.stepText]}>{step}</Text>
						</Pressable>
					);
				})}

				<Text style={[type.h3, styles.sectionTitle]}>Bagaimana latihannya?</Text>
				<View style={styles.feedbackRow}>
					{FEEDBACK.map((option) => {
						const active = feedback === option.value;
						return (
							<Pressable
								key={option.value}
								accessibilityRole="radio"
								accessibilityState={{ selected: active }}
								accessibilityLabel={option.label}
								onPress={() => setFeedback(option.value)}
								style={[
									styles.feedback,
									active && styles.feedbackActive,
								]}
							>
								<Text
									style={[
										type.bodyStrong,
										styles.feedbackText,
										active && styles.feedbackTextActive,
									]}
								>
									{option.label}
								</Text>
							</Pressable>
						);
					})}
				</View>

				<Button
					label={done ? "✓ Selesai hari ini" : "Tandai selesai"}
					fullWidth
					loading={saving}
					disabled={!feedback || saving || done}
					onPress={submitDone}
					style={styles.doneButton}
				/>
			</ScrollView>
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
		alignItems: "flex-start",
		gap: 12,
		paddingHorizontal: 20,
		paddingTop: 8,
	},
	content: {
		paddingHorizontal: 20,
		paddingBottom: spacing.xxxl,
	},
	headText: {
		flex: 1,
	},
	kicker: {
		color: colors.primary,
		fontWeight: "600",
	},
	title: {
		color: colors.textPrimary,
		marginTop: 2,
	},
	close: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: colors.surface,
		alignItems: "center",
		justifyContent: "center",
	},
	timerCard: {
		marginTop: 16,
		alignItems: "center",
	},
	clock: {
		color: colors.textPrimary,
	},
	announced: {
		color: colors.textSecondary,
		marginTop: 4,
		minHeight: 18,
	},
	timerRow: {
		flexDirection: "row",
		gap: 10,
		marginTop: 12,
	},
	timerButton: {
		flex: 1,
	},
	sectionTitle: {
		color: colors.textPrimary,
		marginTop: spacing.xl,
		marginBottom: 12,
	},
	step: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 12,
		paddingVertical: 14,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
		minHeight: 44,
	},
	box: {
		width: 26,
		height: 26,
		borderRadius: 8,
		borderWidth: 2,
		borderColor: colors.borderStrong,
		alignItems: "center",
		justifyContent: "center",
		marginTop: 1,
	},
	boxActive: {
		backgroundColor: colors.primary,
		borderColor: colors.primary,
	},
	stepText: {
		flex: 1,
		color: colors.textPrimary,
	},
	feedbackRow: {
		flexDirection: "row",
		gap: 8,
	},
	feedback: {
		flex: 1,
		minHeight: 52,
		borderRadius: radii.button,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.surface,
		alignItems: "center",
		justifyContent: "center",
	},
	feedbackActive: {
		backgroundColor: colors.primary,
		borderColor: colors.primary,
	},
	feedbackText: {
		color: colors.textPrimary,
	},
	feedbackTextActive: {
		color: colors.surface,
	},
	doneButton: {
		marginTop: spacing.lg,
	},
	pressed: {
		opacity: 0.7,
	},
});
