import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../components/Icon";
import { AppHeader } from "../components/ui/AppHeader";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { StatusChip } from "../components/ui/StatusChip";
import {
	colors,
	layout,
	radii,

	spacing,
	type,
} from "../constants/theme";
import * as api from "../lib/api";
import type {
	AssessmentItemIn,
	AssessmentStatus,
	IuSuggestionRead,
	StoryDetail,
	TranscriptRead,
} from "../lib/api";
import { useAuth } from "../lib/auth";
import { successHaptic, tapHaptic } from "../lib/haptics";

const STATUS_OPTIONS: {
	value: AssessmentStatus;
	label: string;
	bg: string;
	fg: string;
}[] = [
		{ value: "met", label: "Diingat", bg: colors.leafSoft, fg: colors.leafDark },
		{ value: "not_met", label: "Belum", bg: colors.dangerSoft, fg: colors.danger },
	];

function isAssessmentStatus(value: string): value is AssessmentStatus {
	return value === "met" || value === "not_met" || value === "unclear";
}

function toBinaryStatus(status: AssessmentStatus): AssessmentStatus {
	return status === "unclear" ? "not_met" : status;
}

function sanitizeStatuses(
	statuses: Record<number, AssessmentStatus>,
): Record<number, AssessmentStatus> {
	return Object.fromEntries(
		Object.entries(statuses).map(([key, status]) => [
			key,
			toBinaryStatus(status),
		]),
	) as Record<number, AssessmentStatus>;
}

export default function SesiNilaiScreen() {
	const router = useRouter();
	const { sessionId, storyId } = useLocalSearchParams<{
		sessionId: string;
		storyId: string;
	}>();
	const { token } = useAuth();

	const [story, setStory] = useState<StoryDetail | null>(null);
	const [transcript, setTranscript] = useState<TranscriptRead | null>(null);
	const [suggestions, setSuggestions] = useState<Record<number, IuSuggestionRead>>({});
	const [statuses, setStatuses] = useState<Record<number, AssessmentStatus>>({});
	const [changedIds, setChangedIds] = useState<number[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [draftSaved, setDraftSaved] = useState(false);

	const numericStoryId = Number(storyId);
	const numericSessionId = Number(sessionId);

	useEffect(() => {
		let active = true;
		const controller = new AbortController();
		if (!token || !Number.isFinite(numericSessionId)) {
			return;
		}
		(async () => {
			try {
				const session = await api.getSession(token, numericSessionId, controller.signal);
				if (session.status === "completed") {
					router.replace({ pathname: "/sesi-hasil", params: { sessionId: String(numericSessionId) } });
					return;
				}
				if (session.status === "created") {
					router.replace({ pathname: "/sesi-bercerita", params: { sessionId: String(numericSessionId), storyId: String(session.story_id) } });
					return;
				}
				const [detail, analysis] = await Promise.all([
					api.getStory(token, Number.isFinite(numericStoryId) ? numericStoryId : session.story_id, controller.signal),
					api.getAnalysis(token, numericSessionId, controller.signal),
				]);
				if (analysis.status !== "completed") {
					router.replace({ pathname: "/sesi-proses", params: { sessionId: String(numericSessionId), storyId: String(session.story_id) } });
					return;
				}
				// Transkrip HANYA diambil setelah status completed.
				const transcriptData = await api.getTranscript(token, numericSessionId, controller.signal).catch(() => null);
				if (active) {
					setStory(detail);
					setTranscript(transcriptData);
				}
				const suggestionsById = Object.fromEntries(analysis.iu_suggestions.map((item) => [item.iu_id, item]));
				const stored = await AsyncStorage.getItem(`@labi/assessment/${numericSessionId}`);
				const draft = stored ? JSON.parse(stored) as { statuses?: Record<number, AssessmentStatus>; changedIds?: number[]; applied?: boolean } : null;
				if (active) {
					setSuggestions(suggestionsById);
					const suggestedStatuses = sanitizeStatuses(
						Object.fromEntries(
							analysis.iu_suggestions
								.filter((item) => isAssessmentStatus(item.suggested_status))
								.map((item) => [item.iu_id, item.suggested_status as AssessmentStatus]),
						),
					);
					setStatuses(
						draft?.statuses ? sanitizeStatuses(draft.statuses) : suggestedStatuses,
					);
					setChangedIds(draft?.changedIds ?? []);
					setDraftSaved(Boolean(draft?.applied));
				}
			} catch (err) {
				if (active && !api.isAbortError(err)) setError(api.errorMessage(err));
			}
		})();
		return () => {
			active = false;
			controller.abort();
		};
	}, [token, numericStoryId, numericSessionId, router]);

	const setStatus = (iuId: number, status: AssessmentStatus) => {
		tapHaptic();
		setStatuses((current) => ({ ...current, [iuId]: status }));
		setChangedIds((current) => current.includes(iuId) ? current : [...current, iuId]);
		setDraftSaved(false);
	};

	const assessmentItems = (): AssessmentItemIn[] => (story?.ius ?? []).map((iu) => ({
		iu_id: iu.id,
		status: toBinaryStatus(statuses[iu.id] ?? "not_met"),
		evidence_note: suggestions[iu.id]?.evidence_quote ?? undefined,
	}));

	const saveDraft = async () => {
		if (!token || !story || saving) {
			return;
		}
		if (!Number.isFinite(numericSessionId)) {
			setError("Sesi tidak ditemukan.");
			return;
		}
		setSaving(true);
		setError(null);
		try {
			await api.putAssessment(token, numericSessionId, assessmentItems());
			await AsyncStorage.setItem(`@labi/assessment/${numericSessionId}`, JSON.stringify({ statuses, changedIds, applied: true }));
			setDraftSaved(true);
		} catch (err) {
			setError(api.errorMessage(err));
		} finally {
			setSaving(false);
		}
	};

	const acceptSuggestions = async () => {
		if (!token || saving || !Number.isFinite(numericSessionId)) {
			return;
		}
		setSaving(true);
		setError(null);
		try {
			await api.applyIuSuggestions(token, numericSessionId);
			const next = sanitizeStatuses(
				Object.fromEntries(
					Object.values(suggestions)
						.filter((item) => isAssessmentStatus(item.suggested_status))
						.map((item) => [item.iu_id, item.suggested_status as AssessmentStatus]),
				),
			);
			setStatuses(next);
			setChangedIds([]);
			await AsyncStorage.setItem(`@labi/assessment/${numericSessionId}`, JSON.stringify({ statuses: next, changedIds: [], applied: true }));
			setDraftSaved(true);
		} catch (err) {
			setError(`${api.errorMessage(err)} Kamu tetap bisa menilai tiap bagian secara manual.`);
		} finally {
			setSaving(false);
		}
	};

	const complete = async () => {
		if (!token || !story || saving || !Number.isFinite(numericSessionId)) return;
		// Semua item dijamin biner (met/not_met): saran unclear di-fallback
		// saat dimuat, jadi kunci langsung kirim PUT lalu complete.
		setSaving(true);
		setError(null);
		try {
			if (!draftSaved) {
				await api.putAssessment(token, numericSessionId, assessmentItems());
				await AsyncStorage.setItem(`@labi/assessment/${numericSessionId}`, JSON.stringify({ statuses, changedIds, applied: true }));
			}
			await api.completeSession(token, numericSessionId, true);
			successHaptic();
			router.replace({ pathname: "/sesi-hasil", params: { sessionId: String(numericSessionId) } });
		} catch (err) {
			setError(api.errorMessage(err));
		} finally {
			setSaving(false);
		}
	};

	const hasSuggestions = Object.keys(suggestions).length > 0;

	const loading = story === null && error === null;

	return (
		<SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
			<AppHeader title="Nilai cerita" onBack={() => router.back()} />

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<Text style={[type.body, styles.intro]}>
					Periksa bersama bagian cerita yang sudah diingat. Saran ini bisa diubah kapan saja.
				</Text>

				{transcript ? (
					<Card style={styles.transcriptCard}>
						<Text style={[type.bodyStrong, styles.iuTitle]}>Cerita yang terdengar</Text>
						<Text style={[type.body, styles.transcriptText]}>{transcript.text}</Text>
					</Card>
				) : null}

				{error ? (
					<View style={styles.error}>
						<Icon name="info" size={18} color={colors.danger} />
						<Text style={[type.body, styles.errorText]}>{error}</Text>
					</View>
				) : null}

				{loading ? (
					<View style={styles.loading}>
						<ActivityIndicator color={colors.primary} />
					</View>
				) : null}

				{story
					? story.ius.map((iu) => {
						const selected = toBinaryStatus(statuses[iu.id] ?? "not_met");
						const aiUnsure = suggestions[iu.id]?.suggested_status === "unclear";
						return (
							<View key={iu.id}>
								<Card style={styles.iuCard}>
									<Text style={[type.bodyStrong, styles.iuTitle]}>
										{iu.description}
									</Text>
									{aiUnsure && !changedIds.includes(iu.id) ? (
										<View style={styles.unsureRow}>
											<StatusChip tone="watch" label="AI ragu-ragu, silakan cek" />
										</View>
									) : null}
									{suggestions[iu.id] && !changedIds.includes(iu.id) ? (
										<Text style={[type.small, styles.suggestionLabel]}>Saran otomatis</Text>
									) : null}
									{suggestions[iu.id]?.evidence_quote ? (
										<Text style={[type.small, styles.evidence]}>{`“${suggestions[iu.id].evidence_quote}”`}</Text>
									) : null}
									<View style={styles.options}>
										{STATUS_OPTIONS.map((option) => {
											const active = selected === option.value;
											return (
												<Pressable
													key={option.value}
													accessibilityRole="button"
													accessibilityState={{ selected: active }}
													onPress={() => setStatus(iu.id, option.value)}
													style={[
														styles.option,
														active
															? { backgroundColor: option.bg }
															: styles.optionIdle,
													]}
												>
													<Text
														style={[
															type.small,
															styles.optionText,
															active ? { color: option.fg } : null,
														]}
													>
														{option.label}
													</Text>
												</Pressable>
											);
										})}
									</View>
								</Card>
							</View>
						);
					})
					: null}
			</ScrollView>

			<View style={styles.footer}>
				{hasSuggestions ? (
					<Button
						label={draftSaved && changedIds.length === 0 ? "Saran otomatis tersimpan" : "Gunakan saran otomatis"}
						variant="secondary"
						fullWidth
						disabled={saving}
						onPress={acceptSuggestions}
						style={styles.suggestionButton}
					/>
				) : null}

				<Button
					label={saving ? "Menyimpan…" : "Simpan perubahan"}
					fullWidth
					loading={saving}
					disabled={story === null || saving}
					onPress={saveDraft}
				/>

				<Button
					label="Kunci sesi"
					fullWidth
					loading={saving}
					disabled={story === null || saving}
					onPress={complete}
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
	content: {
		paddingHorizontal: layout.screenPadding,
		paddingBottom: spacing.xxxl,
	},
	intro: {
		color: colors.textSecondary,
		marginBottom: spacing.lg,
	},
	transcriptCard: {
		marginBottom: spacing.lg,
	},
	transcriptText: {
		color: colors.textSecondary,
		marginTop: spacing.sm,
	},
	iuCard: {
		marginBottom: 12,
	},
	unsureRow: {
		alignItems: "flex-start",
		marginTop: 8,
	},
	iuTitle: {
		color: colors.textPrimary,
	},
	suggestionLabel: {
		color: colors.primary,
		marginTop: 5,
	},
	evidence: {
		color: colors.textSecondary,
		fontStyle: "italic",
		marginTop: 8,
	},
	options: {
		flexDirection: "row",
		gap: 8,
		marginTop: 14,
	},
	option: {
		flex: 1,
		paddingVertical: 12,
		borderRadius: radii.sm,
		alignItems: "center",
		justifyContent: "center",
	},
	optionIdle: {
		backgroundColor: colors.background,
		borderWidth: 1,
		borderColor: colors.border,
	},
	optionText: {
		color: colors.textSecondary,
		fontWeight: "600",
	},
	loading: {
		paddingVertical: spacing.xxxl,
	},
	error: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 8,
		padding: 14,
		borderRadius: radii.cardSmall,
		backgroundColor: colors.dangerSoft,
		marginBottom: spacing.lg,
	},
	errorText: {
		flex: 1,
		color: colors.danger,
	},
	footer: {
		paddingHorizontal: layout.screenPadding,
		paddingTop: spacing.md,
		paddingBottom: spacing.md,
		gap: 12,
	},
	suggestionButton: {
		marginBottom: 0,
	},
	pressed: {
		opacity: 0.7,
	},
});
