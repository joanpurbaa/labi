import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon, type IconName } from "../components/Icon";
import { Button } from "../components/ui/Button";
import { ChoiceGroup } from "../components/ChoiceGroup";
import { FadeIn } from "../components/ui/FadeIn";
import {
	colors,
	layout,
	radii,
	shadows,
	spacing,
	type,
} from "../constants/theme";
import { useAuth } from "../lib/auth";
import { tapHaptic } from "../lib/haptics";

type Question = {
	key: string;
	prompt: string;
	helper: string;
	icon: IconName;
	options: { value: string; label: string }[];
};

const QUESTIONS: Question[] = [
	{
		key: "mood",
		prompt: "Bagaimana suasana hati hari ini?",
		helper: "Pilih yang paling mendekati, boleh dilewati.",
		icon: "smile",
		options: [
			{ value: "tenang", label: "Tenang" },
			{ value: "senang", label: "Senang" },
			{ value: "cemas", label: "Cemas" },
			{ value: "sedih", label: "Sedih" },
			{ value: "lelah", label: "Lelah" },
		],
	},
	{
		key: "sleep",
		prompt: "Bagaimana tidurnya semalam?",
		helper: "Ini membantu melihat konteks, bukan untuk menilai.",
		icon: "moon",
		options: [
			{ value: "nyenyak", label: "Nyenyak" },
			{ value: "cukup", label: "Cukup" },
			{ value: "kurang", label: "Kurang" },
			{ value: "sulit", label: "Sulit tidur" },
		],
	},
	{
		key: "activity",
		prompt: "Ada kegiatan lain hari ini?",
		helper: "Pilih satu atau lebih, atau lewati saja.",
		icon: "calendar",
		options: [
			{ value: "jalan", label: "Jalan pagi" },
			{ value: "keluarga", label: "Berkumpul keluarga" },
			{ value: "kebun", label: "Berkebun" },
			{ value: "menonton", label: "Menonton" },
			{ value: "tidak", label: "Tidak ada" },
		],
	},
];

export default function SesiKonteksScreen() {
	const router = useRouter();
	const { survivorProfile } = useAuth();
	const survivorName = survivorProfile?.survivorNickname ?? "penyintas";

	const [step, setStep] = useState(0);
	const [answers, setAnswers] = useState<Record<string, string>>({});

	const question = QUESTIONS[step];
	const isLast = step === QUESTIONS.length - 1;
	const selected = answers[question.key];

	const setAnswer = (value: string | undefined) => {
		setAnswers((current) => {
			const next = { ...current };
			if (value === undefined) {
				delete next[question.key];
			} else {
				next[question.key] = value;
			}
			return next;
		});
	};

	const advance = () => {
		tapHaptic();
		if (isLast) {
			router.replace("/");
			return;
		}
		setStep(step + 1);
	};

	const skip = () => {
		setAnswer(undefined);
		advance();
	};

	return (
		<SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
			<View style={styles.header}>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Kembali"
					onPress={() => (step > 0 ? setStep(step - 1) : router.back())}
					style={({ pressed }) => [styles.close, pressed && styles.pressed]}
				>
					<Icon name="chevron" size={22} color={colors.textPrimary} />
				</Pressable>
				<Text style={[type.small, styles.stepLabel]}>
					Langkah {step + 1} dari {QUESTIONS.length}
				</Text>
			</View>

			<FadeIn key={step} style={styles.content}>
				<View style={styles.iconWrap}>
					<Icon name={question.icon} size={28} color={colors.primary} />
				</View>
				<Text style={[type.h1, styles.prompt]}>{question.prompt}</Text>
				<Text style={[type.body, styles.helper]}>{question.helper}</Text>

				<View style={styles.options}>
					<ChoiceGroup
						options={question.options}
						selected={selected ? [selected] : []}
						onChange={(values) => setAnswer(values[0])}
					/>
				</View>

				<View style={styles.noteRow}>
					<Icon name="heart" size={16} color={colors.textSecondary} />
					<Text style={[type.small, styles.noteText]}>
						Catatan ini membantu melihat kebiasaan {survivorName}, bukan
						penilaian.
					</Text>
				</View>
			</FadeIn>

			<View style={styles.footer}>
				<Button label={isLast ? "Simpan" : "Lanjut"} fullWidth onPress={advance} />
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Lewati pertanyaan ini"
					onPress={skip}
					style={({ pressed }) => [styles.skip, pressed && styles.pressed]}
				>
					<Text style={[type.bodyStrong, styles.skipText]}>Lewati</Text>
				</Pressable>
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
		gap: 12,
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
		transform: [{ scaleX: -1 }],
		...shadows.pill,
	},
	stepLabel: {
		color: colors.textSecondary,
	},
	content: {
		flex: 1,
		paddingHorizontal: layout.screenPadding,
		paddingTop: spacing.xxxl,
	},
	iconWrap: {
		width: 56,
		height: 56,
		borderRadius: radii.icon,
		backgroundColor: colors.primarySoft,
		alignItems: "center",
		justifyContent: "center",
	},
	prompt: {
		color: colors.textPrimary,
		marginTop: 18,
	},
	helper: {
		color: colors.textSecondary,
		marginTop: 8,
	},
	options: {
		marginTop: 24,
	},
	noteRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginTop: 28,
	},
	noteText: {
		color: colors.textSecondary,
		flexShrink: 1,
	},
	footer: {
		paddingHorizontal: layout.screenPadding,
		paddingTop: spacing.md,
		paddingBottom: spacing.md,
		gap: 8,
	},
	skip: {
		minHeight: 52,
		alignItems: "center",
		justifyContent: "center",
	},
	skipText: {
		color: colors.textSecondary,
	},
	pressed: {
		opacity: 0.7,
	},
});
