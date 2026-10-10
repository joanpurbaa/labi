import { useRef, useState } from "react";
import {
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChoiceGroup } from "../components/ChoiceGroup";
import { Icon } from "../components/Icon";
import { Button } from "../components/ui/Button";
import { FadeIn } from "../components/ui/FadeIn";
import { TextField } from "../components/TextField";
import {
	colors,
	layout,
	radii,
	spacing,
	type,
} from "../constants/theme";
import { useAuth } from "../lib/auth";
import type {
	CommunicationGoal,
	ConversationTopic,
	InstructionPreference,
	PracticeMode,
	PreferredSessionDuration,
} from "../lib/survivor";
import {
	AGE_RANGE_OPTIONS,
	DURATION_OPTIONS,
	GOAL_OPTIONS,
	INSTRUCTION_OPTIONS,
	LANGUAGE_OPTIONS,
	MODE_OPTIONS,
	TOPIC_OPTIONS,
} from "../lib/survivorOptions";

const STEPS = [
	{
		key: "profile",
		title: "Profil penyintas",
		subtitle: "Informasi tentang penyintas yang kamu dampingi.",
	},
	{
		key: "communication",
		title: "Kebutuhan komunikasi",
		subtitle: "Tujuan berbicara dan cara instruksi disampaikan.",
	},
	{
		key: "preferences",
		title: "Preferensi latihan",
		subtitle: "Pengaturan latihan yang paling nyaman bagi penyintas.",
	},
	{
		key: "confirmation",
		title: "Konfirmasi",
		subtitle: "Satu langkah terakhir sebelum mulai berlatih.",
	},
] as const;

function FieldLabel({ children, hint }: { children: string; hint?: string }) {
	return (
		<View style={styles.fieldLabelRow}>
			<Text style={[type.label, styles.fieldLabel]}>{children}</Text>
			{hint ? <Text style={[type.small, styles.fieldHint]}>{hint}</Text> : null}
		</View>
	);
}

export default function PersonalizationScreen() {
	const { saveSurvivorProfile } = useAuth();
	const scrollRef = useRef<ScrollView>(null);

	const [step, setStep] = useState(0);
	const [survivorNickname, setSurvivorNickname] = useState("");
	const [ageRange, setAgeRange] = useState<string | undefined>(undefined);
	const [primaryLanguage, setPrimaryLanguage] = useState<string | undefined>(
		undefined,
	);
	const [communicationGoals, setCommunicationGoals] = useState<
		CommunicationGoal[]
	>([]);
	const [instructionPreference, setInstructionPreference] = useState<
		InstructionPreference | undefined
	>(undefined);
	const [preferredSessionDuration, setPreferredSessionDuration] = useState<
		PreferredSessionDuration | undefined
	>(undefined);
	const [preferredTopics, setPreferredTopics] = useState<ConversationTopic[]>(
		[],
	);
	const [practiceMode, setPracticeMode] = useState<PracticeMode | undefined>(
		undefined,
	);
	const [confirmed, setConfirmed] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	const scrollToTop = () => {
		scrollRef.current?.scrollTo({ y: 0, animated: true });
	};

	const validateNickname = () => {
		if (!survivorNickname.trim()) {
			return "Nama panggilan penyintas wajib diisi.";
		}
		return null;
	};

	const handleSave = async () => {
		if (saving) {
			return;
		}

		const nicknameError = validateNickname();
		if (nicknameError) {
			setStep(0);
			setError(nicknameError);
			scrollToTop();
			return;
		}

		if (!confirmed) {
			setError("Mohon centang konfirmasi sebelum menyimpan.");
			return;
		}

		setError(null);
		setSaving(true);
		const result = await saveSurvivorProfile({
			survivorNickname,
			ageRange,
			primaryLanguage,
			communicationGoals,
			instructionPreference,
			preferredSessionDuration,
			preferredTopics,
			practiceMode,
			personalizationConfirmed: confirmed,
		});
		setSaving(false);

		if (!result.ok) {
			setError(result.error);
		}
	};

	const handleNext = () => {
		const nicknameError = validateNickname();
		if (step === 0 && nicknameError) {
			setError(nicknameError);
			return;
		}

		setError(null);

		if (step < STEPS.length - 1) {
			setStep(step + 1);
			scrollToTop();
			return;
		}

		handleSave();
	};

	const handleBack = () => {
		if (step === 0) {
			return;
		}
		setError(null);
		setStep(step - 1);
		scrollToTop();
	};

	const renderProfileStep = () => (
		<>
			<View style={styles.note}>
				<Icon name="brand" size={20} color={colors.primary} />
				<Text style={[type.body, styles.noteText]}>
					Isi data tentang penyintas (orang yang kamu dampingi), bukan tentang
					akun pendampingmu.
				</Text>
			</View>

			<TextField
				label="Nama panggilan penyintas"
				value={survivorNickname}
				onChangeText={(value) => {
					setSurvivorNickname(value);
					if (error) {
						setError(null);
					}
				}}
				placeholder="Contoh: Bu Siti"
				autoCapitalize="words"
				returnKeyType="next"
			/>

			<FieldLabel hint="opsional">Rentang usia</FieldLabel>
			<View style={styles.group}>
				<ChoiceGroup
					options={AGE_RANGE_OPTIONS}
					selected={ageRange ? [ageRange] : []}
					onChange={(values) => setAgeRange(values[0])}
				/>
			</View>

			<FieldLabel hint="opsional">Bahasa utama</FieldLabel>
			<View style={styles.group}>
				<ChoiceGroup
					options={LANGUAGE_OPTIONS}
					selected={primaryLanguage ? [primaryLanguage] : []}
					onChange={(values) => setPrimaryLanguage(values[0])}
				/>
			</View>
		</>
	);

	const renderCommunicationStep = () => (
		<>
			<FieldLabel>Tujuan komunikasi</FieldLabel>
			<View style={styles.group}>
				<ChoiceGroup
					multi
					options={GOAL_OPTIONS}
					selected={communicationGoals}
					onChange={(values) =>
						setCommunicationGoals(values as CommunicationGoal[])
					}
				/>
			</View>

			<FieldLabel>Preferensi instruksi</FieldLabel>
			<View style={styles.group}>
				<ChoiceGroup
					options={INSTRUCTION_OPTIONS}
					selected={instructionPreference ? [instructionPreference] : []}
					onChange={(values) =>
						setInstructionPreference(
							values[0] as InstructionPreference | undefined,
						)
					}
				/>
			</View>
		</>
	);

	const renderPreferencesStep = () => (
		<>
			<FieldLabel>Durasi sesi yang disukai</FieldLabel>
			<View style={styles.group}>
				<ChoiceGroup
					options={DURATION_OPTIONS}
					selected={preferredSessionDuration ? [preferredSessionDuration] : []}
					onChange={(values) =>
						setPreferredSessionDuration(
							values[0] as PreferredSessionDuration | undefined,
						)
					}
				/>
			</View>

			<FieldLabel>Topik percakapan</FieldLabel>
			<View style={styles.group}>
				<ChoiceGroup
					multi
					options={TOPIC_OPTIONS}
					selected={preferredTopics}
					onChange={(values) =>
						setPreferredTopics(values as ConversationTopic[])
					}
				/>
			</View>

			<FieldLabel>Mode latihan</FieldLabel>
			<View style={styles.group}>
				<ChoiceGroup
					options={MODE_OPTIONS}
					selected={practiceMode ? [practiceMode] : []}
					onChange={(values) =>
						setPracticeMode(values[0] as PracticeMode | undefined)
					}
				/>
			</View>
		</>
	);

	const renderConfirmationStep = () => (
		<>
			<View style={styles.infoCard}>
				<Text style={[type.body, styles.infoText]}>
					Preferensi ini membantu LABI menyesuaikan latihan bicara agar sesuai
					dengan penyintas. Kamu bisa mengubahnya nanti.
				</Text>
			</View>

			<Pressable
				accessibilityRole="checkbox"
				accessibilityState={{ checked: confirmed }}
				accessibilityLabel="Konfirmasi personalisasi sudah dijelaskan kepada penyintas"
				onPress={() => {
					setConfirmed((value) => !value);
					if (error) {
						setError(null);
					}
				}}
				style={({ pressed }) => [
					styles.checkRow,
					pressed && styles.checkRowPressed,
				]}
			>
				<View style={[styles.checkbox, confirmed && styles.checkboxActive]}>
					{confirmed ? (
						<Icon name="check" size={16} color={colors.surface} />
					) : null}
				</View>
				<Text style={[type.body, styles.checkText]}>
					Saya sudah menjelaskan proses personalisasi ini kepada penyintas dan
					penyintas menyetujuinya sejauh memungkinkan.
				</Text>
			</Pressable>

			<Text style={[type.small, styles.disclaimer]}>
				Konfirmasi ini bukan persetujuan untuk merekam atau membagikan data
				suara penyintas.
			</Text>
		</>
	);

	return (
		<SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
			<KeyboardAvoidingView
				style={styles.flex}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<View style={styles.header}>
					<View style={styles.brandRow}>
						<View style={styles.brandMark}>
							<Icon name="brand" size={20} color={colors.primary} />
						</View>
						<Text style={[type.h3, styles.brandName]}>LABI</Text>
					</View>

					<Text style={[type.small, styles.stepLabel]}>
						Langkah {step + 1} dari {STEPS.length}
					</Text>
					<View style={styles.progress}>
						{STEPS.map((entry, index) => (
							<View
								key={entry.key}
								style={[
									styles.progressSegment,
									index <= step && styles.progressSegmentActive,
								]}
							/>
						))}
					</View>

					<Text style={[type.h1, styles.title]}>{STEPS[step].title}</Text>
					<Text style={[type.body, styles.subtitle]}>
						{STEPS[step].subtitle}
					</Text>
				</View>

				<ScrollView
					ref={scrollRef}
					style={styles.flex}
					contentContainerStyle={styles.content}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					<FadeIn key={step}>
						{step === 0 ? renderProfileStep() : null}
						{step === 1 ? renderCommunicationStep() : null}
						{step === 2 ? renderPreferencesStep() : null}
						{step === 3 ? renderConfirmationStep() : null}
					</FadeIn>
				</ScrollView>

				<View style={styles.footer}>
					{error ? (
						<View style={styles.errorBox}>
							<Text style={[type.body, styles.errorText]}>{error}</Text>
						</View>
					) : null}
					<View style={styles.actions}>
						{step > 0 ? (
							<Pressable
								accessibilityRole="button"
								accessibilityLabel="Kembali"
								onPress={handleBack}
								style={({ pressed }) => [
									styles.backButton,
									pressed && styles.backPressed,
								]}
							>
								<Text style={[type.bodyStrong, styles.backText]}>Kembali</Text>
							</Pressable>
						) : null}
						<View style={styles.primaryWrap}>
							<Button
								label={step === STEPS.length - 1 ? "Simpan" : "Lanjut"}
								onPress={handleNext}
								loading={saving}
								fullWidth
							/>
						</View>
					</View>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: {
		flex: 1,
		backgroundColor: colors.background,
	},
	flex: {
		flex: 1,
	},
	header: {
		paddingHorizontal: layout.screenPadding,
		paddingTop: spacing.xl,
	},
	brandRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	brandMark: {
		width: 40,
		height: 40,
		borderRadius: radii.icon,
		backgroundColor: colors.primarySoft,
		alignItems: "center",
		justifyContent: "center",
	},
	brandName: {
		color: colors.textPrimary,
		letterSpacing: 0.2,
	},
	stepLabel: {
		color: colors.textSecondary,
		marginTop: spacing.xl,
	},
	progress: {
		flexDirection: "row",
		gap: 6,
		marginTop: 8,
	},
	progressSegment: {
		flex: 1,
		height: 5,
		borderRadius: 3,
		backgroundColor: colors.border,
	},
	progressSegmentActive: {
		backgroundColor: colors.primary,
	},
	title: {
		color: colors.textPrimary,
		marginTop: 18,
	},
	subtitle: {
		color: colors.textSecondary,
		marginTop: 6,
	},
	content: {
		paddingHorizontal: layout.screenPadding,
		paddingTop: spacing.xxl,
		paddingBottom: spacing.xxl,
	},
	note: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 10,
		backgroundColor: colors.primarySoft,
		borderRadius: radii.cardSmall,
		padding: 16,
		marginBottom: spacing.xl,
	},
	noteText: {
		flex: 1,
		color: colors.textPrimary,
	},
	fieldLabelRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 10,
	},
	fieldLabel: {
		color: colors.textPrimary,
	},
	fieldHint: {
		color: colors.textSecondary,
	},
	group: {
		marginBottom: spacing.xxl,
	},
	infoCard: {
		backgroundColor: colors.surface,
		borderRadius: radii.cardSmall,
		padding: 18,
		marginBottom: spacing.xl,
	},
	infoText: {
		color: colors.textPrimary,
	},
	checkRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 12,
		backgroundColor: colors.surface,
		borderRadius: radii.cardSmall,
		padding: 16,
		minHeight: 56,
	},
	checkRowPressed: {
		opacity: 0.8,
	},
	checkbox: {
		width: 26,
		height: 26,
		borderRadius: 8,
		borderWidth: 2,
		borderColor: colors.borderStrong,
		alignItems: "center",
		justifyContent: "center",
		marginTop: 1,
	},
	checkboxActive: {
		backgroundColor: colors.primary,
		borderColor: colors.primary,
	},
	checkText: {
		flex: 1,
		color: colors.textPrimary,
	},
	disclaimer: {
		color: colors.textSecondary,
		marginTop: 12,
	},
	footer: {
		paddingHorizontal: layout.screenPadding,
		paddingTop: spacing.md,
		paddingBottom: spacing.md,
		borderTopWidth: 1,
		borderTopColor: colors.border,
		backgroundColor: colors.background,
	},
	errorBox: {
		backgroundColor: colors.dangerSoft,
		borderRadius: radii.input,
		paddingVertical: 12,
		paddingHorizontal: 14,
		marginBottom: 12,
	},
	errorText: {
		color: colors.danger,
	},
	actions: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	backButton: {
		minHeight: 52,
		paddingHorizontal: 22,
		borderRadius: radii.button,
		borderWidth: 2,
		borderColor: colors.borderStrong,
		backgroundColor: colors.surface,
		alignItems: "center",
		justifyContent: "center",
	},
	backPressed: {
		opacity: 0.7,
	},
	backText: {
		color: colors.textPrimary,
	},
	primaryWrap: {
		flex: 1,
	},
});
