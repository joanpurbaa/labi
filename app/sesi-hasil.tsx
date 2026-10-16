import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import { Mascot } from "../components/mascot/Mascot";
import { AppHeader } from "../components/ui/AppHeader";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { FadeIn } from "../components/ui/FadeIn";
import { StatusChip } from "../components/ui/StatusChip";
import { ChoiceGroup } from "../components/ChoiceGroup";
import { TextField } from "../components/TextField";
import {
	colors,
	layout,
	radii,
	shadows,
	spacing,
	type,
	type StatusTone,
} from "../constants/theme";
import * as api from "../lib/api";
import type {
	ResultRead,
	SessionTrainingRecommendationRead,
	SpeechMetricsRead,
	TrainingLogRead,
} from "../lib/api";
import { useAuth } from "../lib/auth";
import { clearActiveSession } from "../lib/activeSession";
import { successHaptic } from "../lib/haptics";
import { formatSessionDate } from "../lib/sessionDisplay";

const STATUS_META: Record<
	string,
	{ tone: StatusTone; label: string; text: string }
> = {
	met: { tone: "stable", label: "Diingat", text: "Diingat" },
	not_met: { tone: "consult", label: "Belum", text: "Belum diingat" },
	unclear: { tone: "watch", label: "Tidak jelas", text: "Tidak jelas" },
};

export default function SesiHasilScreen() {
	const router = useRouter();
	const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
	const { token, user } = useAuth();

	const [result, setResult] = useState<ResultRead | null>(null);
	const [metrics, setMetrics] = useState<SpeechMetricsRead | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [recommendation, setRecommendation] =
		useState<SessionTrainingRecommendationRead | null>(null);
	const [logs, setLogs] = useState<TrainingLogRead[]>([]);
	const [logMode, setLogMode] = useState("sfa");
	const [logTitle, setLogTitle] = useState("");
	const [logStatus, setLogStatus] = useState("completed");
	const [logDuration, setLogDuration] = useState("");
	const [logNotes, setLogNotes] = useState("");
	const [logError, setLogError] = useState<string | null>(null);
	const [logSubmitting, setLogSubmitting] = useState(false);

	const numericSessionId = Number(sessionId);

const MODE_OPTIONS = [
		{ value: "sfa", label: "SFA" },
		{ value: "srt", label: "SRT" },
		{ value: "cst", label: "CST" },
	];

	const LOG_STATUS_OPTIONS = [
		{ value: "completed", label: "Selesai" },
		{ value: "partial", label: "Sebagian" },
		{ value: "skipped", label: "Dilewati" },
	];

	function logStatusLabel(status: string): string {
		return (
			LOG_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
			status
		);
	}

	useEffect(() => {
		let active = true;
		const controller = new AbortController();
		if (!token || !user || !Number.isFinite(numericSessionId)) {
			return;
		}
		(async () => {
			try {
				const session = await api.getSession(token, numericSessionId, controller.signal);
				if (session.status !== "completed") {
					if (session.status === "created") {
						router.replace({ pathname: "/sesi-bercerita", params: { sessionId: String(session.id), storyId: String(session.story_id) } });
						return;
					}
					const analysis = await api.getAnalysis(token, numericSessionId, controller.signal).catch(() => null);
					if (analysis?.status === "completed") {
						router.replace({ pathname: "/sesi-nilai", params: { sessionId: String(session.id), storyId: String(session.story_id) } });
					} else {
						router.replace({ pathname: "/sesi-proses", params: { sessionId: String(session.id), storyId: String(session.story_id) } });
					}
					return;
				}
				await clearActiveSession(user.id);
				const [loaded, analysis, rec, sessionLogs] = await Promise.all([
					api.getResult(token, numericSessionId, controller.signal),
					api.getAnalysis(token, numericSessionId, controller.signal).catch(() => null),
					api.getSessionRecommendation(token, numericSessionId, controller.signal),
					api.listTrainingLogs(token, numericSessionId, controller.signal).catch(() => []),
				]);
				if (active) {
					setResult(loaded);
					setMetrics(analysis?.speech_metrics ?? null);
					setRecommendation(rec);
					setLogs(sessionLogs);
				}
			} catch (err) {
				if (active) {
					if (!api.isAbortError(err)) setError(api.errorMessage(err));
				}
			}
		})();
		return () => {
			active = false;
			controller.abort();
		};
	}, [token, user, numericSessionId, router]);

	const loading = result === null && error === null;
	const percent = result?.iu_recall_percent;

	const submitLog = async () => {
		if (!token || logSubmitting || !Number.isFinite(numericSessionId)) {
			return;
		}
		const title = logTitle.trim();
		if (!title) {
			setLogError("Judul latihan wajib diisi.");
			return;
		}
		let duration: number | null = null;
		if (logDuration.trim()) {
			const parsed = Number(logDuration.trim());
			if (!Number.isFinite(parsed) || parsed < 1 || parsed > 180) {
				setLogError("Durasi 1–180 menit.");
				return;
			}
			duration = Math.round(parsed);
		}
		setLogSubmitting(true);
		setLogError(null);
		try {
			const created = await api.createTrainingLog(token, numericSessionId, {
				training_mode: logMode,
				title,
				status: logStatus,
				duration_minutes: duration,
				notes: logNotes.trim() ? logNotes.trim() : null,
			});
			setLogs((current) => [created, ...current]);
			setLogTitle("");
			setLogDuration("");
			setLogNotes("");
			successHaptic();
		} catch (err) {
			setLogError(api.errorMessage(err));
		} finally {
			setLogSubmitting(false);
		}
	};

	return (
		<SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
			<AppHeader title="Hasil cerita" onBack={() => router.replace("/")} />

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
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

				{result ? (
					<>
						<FadeIn>
							<Card style={styles.heroCard}>
								<Mascot expression="terimakasih" size={80} decorative />
								<View style={styles.percentWrap}>
									<Text style={[type.display, styles.percent]}>
										{typeof percent === "number" ? `${Math.round(percent)}%` : "—"}
									</Text>
									<Text style={[type.small, styles.percentLabel]}>
										bagian cerita diingat
									</Text>
								</View>
							</Card>
						</FadeIn>

						<View style={styles.summaryRow}>
							<View style={[styles.summary, styles.summaryStable]}>
								<Text style={[type.h2, styles.summaryNumber]}>
									{result.met_count}
								</Text>
								<Text style={[type.small, styles.summaryLabel]}>Diingat</Text>
							</View>
							<View style={[styles.summary, styles.summaryConsult]}>
								<Text style={[type.h2, styles.summaryNumber]}>
									{result.not_met_count}
								</Text>
								<Text style={[type.small, styles.summaryLabel]}>Belum</Text>
							</View>
							<View style={[styles.summary, styles.summaryWatch]}>
								<Text style={[type.h2, styles.summaryNumber]}>
									{result.unclear_count}
								</Text>
								<Text style={[type.small, styles.summaryLabel]}>Tidak jelas</Text>
							</View>
						</View>

						<Text style={[type.small, styles.storyLabel]}>
							{result.story_title}
						</Text>
						<View style={styles.resultStatus}>
							<StatusChip tone="watch" label="Hasil sesi tersimpan" />
						</View>

						{metrics ? (
							<Card style={styles.metricsCard}>
								<Text style={[type.bodyStrong, styles.itemText]}>Catatan bicara</Text>
								<Metric label="Kecepatan bicara" value={formatMetric(metrics.speech_rate_wpm ?? metrics.speech_rate, " kata/menit")} />
								<Metric label="Frekuensi jeda" value={formatMetric(metrics.pause_rate_per_100_words, " per 100 kata")} />
								<Metric label="Durasi jeda diam" value={formatDuration(metrics.silent_pause_total_ms)} />
								<Metric label="Jumlah jeda diam" value={String(metrics.silent_pause_count)} />
								{metrics.silent_pauses.map((pause) => (
									<Text key={pause.ordinal} style={[type.small, styles.metricNote]}>
										Jeda {pause.ordinal}: {formatDuration(pause.duration_ms)}
									</Text>
								))}
							</Card>
						) : null}

						{result.items.map((item) => {
							const meta = STATUS_META[item.status] ?? STATUS_META.unclear;
							return (
								<Card key={item.iu_id} style={styles.itemCard}>
									<View style={styles.itemRow}>
										<Text style={[type.body, styles.itemText]}>
											{item.description}
										</Text>
									</View>
									<StatusChip tone={meta.tone} label={STATUS_META[item.status]?.label ?? "Tidak jelas"} />
								</Card>
							);
						})}

						<Text style={[type.h3, styles.sectionTitle]}>
							Rekomendasi terapi
						</Text>

						{recommendation ? (
							<>
								<Card style={styles.blockCard}>
									<View style={styles.modeRow}>
										<StatusChip tone="stable" label={recommendation.primary_mode.toUpperCase()} />
										{recommendation.secondary_mode ? (
											<StatusChip tone="watch" label={recommendation.secondary_mode.toUpperCase()} />
										) : null}
									</View>
									<Text style={[type.bodyStrong, styles.itemText]}>
										{recommendation.target_goal}
									</Text>
									<Text style={[type.body, styles.recText]}>
										{recommendation.overall_interpretation}
									</Text>
								</Card>

								{recommendation.medical_alert ? (
									<View style={styles.warnBox}>
										<Icon name="info" size={18} color={colors.danger} />
										<Text style={[type.body, styles.warnText]}>
											{recommendation.medical_alert}
										</Text>
									</View>
								) : null}

								{recommendation.home_trainings.map((training, index) => (
									<Card key={`${training.level}-${index}`} style={styles.blockCard}>
										<Text style={[type.small, styles.levelLabel]}>
											{training.level_title}
										</Text>
										<Text style={[type.bodyStrong, styles.itemText]}>
											{training.title}
										</Text>
										<Text style={[type.small, styles.recMeta]}>
											{training.target_area} · {training.frequency} · {training.duration_minutes} menit
										</Text>
										<Text style={[type.body, styles.recText]}>
											{training.instructions}
										</Text>
										<Text style={[type.small, styles.recMeta]}>
											{training.method_basis}
										</Text>
										<Pressable
											accessibilityRole="button"
											accessibilityLabel={`Catat latihan ${training.title}`}
											onPress={() => {
												setLogMode(training.training_mode);
												setLogTitle(training.title);
												setLogError(null);
											}}
											style={({ pressed }) => [
												styles.useTraining,
												pressed && styles.pressed,
											]}
										>
											<Text style={[type.bodyStrong, styles.useTrainingText]}>
												Catat latihan ini
											</Text>
										</Pressable>
									</Card>
								))}
							</>
						) : (
							<Card style={styles.blockCard}>
								<Text style={[type.body, styles.recText]}>
									Rekomendasi terapi belum tersedia untuk sesi ini.
								</Text>
							</Card>
						)}

						<Text style={[type.h3, styles.sectionTitle]}>
							Catat latihan di rumah
						</Text>
						<Card style={styles.blockCard}>
							<Text style={[type.label, styles.fieldLabel]}>Mode latihan</Text>
							<View style={styles.group}>
								<ChoiceGroup
									options={MODE_OPTIONS}
									selected={[logMode]}
									onChange={(values) => {
										if (values[0]) {
											setLogMode(values[0]);
										}
									}}
								/>
							</View>
							<TextField
								label="Judul latihan"
								value={logTitle}
								onChangeText={(value) => {
									setLogTitle(value);
									if (logError) {
										setLogError(null);
									}
								}}
								placeholder="Contoh: Tebak ciri objek sekitar"
								returnKeyType="next"
							/>
							<Text style={[type.label, styles.fieldLabel]}>Status</Text>
							<View style={styles.group}>
								<ChoiceGroup
									options={LOG_STATUS_OPTIONS}
									selected={[logStatus]}
									onChange={(values) => {
										if (values[0]) {
											setLogStatus(values[0]);
										}
									}}
								/>
							</View>
							<TextField
								label="Durasi (menit, opsional)"
								value={logDuration}
								onChangeText={setLogDuration}
								placeholder="Contoh: 15"
								keyboardType="numeric"
								returnKeyType="next"
							/>
							<TextField
								label="Catatan (opsional)"
								value={logNotes}
								onChangeText={setLogNotes}
								placeholder="Contoh: lancar menyebutkan ciri sendok"
								multiline
								returnKeyType="done"
								onSubmitEditing={submitLog}
							/>
							{logError ? (
								<Text style={[type.body, styles.logError]}>{logError}</Text>
							) : null}
							<Button
								label="Simpan catatan latihan"
								onPress={submitLog}
								loading={logSubmitting}
								fullWidth
							/>
						</Card>

						<Text style={[type.h3, styles.sectionTitle]}>
							Riwayat latihan sesi ini
						</Text>
						{logs.length === 0 ? (
							<Card style={styles.blockCard}>
								<Text style={[type.body, styles.recText]}>
									Belum ada catatan latihan untuk sesi ini.
								</Text>
							</Card>
						) : null}
						{logs.map((log) => (
							<Card key={log.id} style={styles.blockCard}>
								<View style={styles.logRow}>
									<View style={styles.logBody}>
										<Text style={[type.bodyStrong, styles.itemText]}>
											{log.title}
										</Text>
										<Text style={[type.small, styles.recMeta]}>
											{logStatusLabel(log.status)}
											{typeof log.duration_minutes === "number"
												? ` · ${log.duration_minutes} menit`
												: ""}
											{" · "}
											{formatSessionDate(log.logged_at)}
										</Text>
										{log.notes ? (
											<Text style={[type.body, styles.recText]}>
												{log.notes}
											</Text>
										) : null}
									</View>
									<StatusChip
										tone={log.status === "completed" ? "stable" : "watch"}
										label={logStatusLabel(log.status)}
									/>
								</View>
							</Card>
						))}
					</>
				) : null}
			</ScrollView>

			<View style={styles.footer}>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Selesai"
					onPress={() => router.replace("/")}
					style={({ pressed }) => [
						styles.doneButton,
						pressed && styles.pressed,
					]}
				>
					<Text style={[type.bodyStrong, styles.doneLabel]}>Selesai</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

function Metric({ label, value }: { label: string; value: string }) {
	return (
		<View style={styles.metricRow}>
			<Text style={[type.small, styles.metricLabel]}>{label}</Text>
			<Text style={[type.small, styles.metricValue]}>{value}</Text>
		</View>
	);
}

function formatMetric(value: number | null | undefined, unit: string): string {
	return typeof value === "number" ? `${value.toFixed(1)}${unit}` : "Belum tersedia";
}

function formatDuration(value: number | null | undefined): string {
	return typeof value === "number" ? `${(value / 1000).toFixed(1)} detik` : "Belum tersedia";
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
	heroCard: {
		flexDirection: "row",
		alignItems: "center",
		gap: 16,
		marginBottom: spacing.lg,
	},
	percentWrap: {
		flex: 1,
	},
	percent: {
		color: colors.primary,
	},
	percentLabel: {
		color: colors.textSecondary,
	},
	summaryRow: {
		flexDirection: "row",
		gap: 10,
		marginBottom: spacing.lg,
	},
	summary: {
		flex: 1,
		borderRadius: radii.cardSmall,
		paddingVertical: 14,
		alignItems: "center",
	},
	summaryStable: {
		backgroundColor: colors.leafSoft,
	},
	summaryConsult: {
		backgroundColor: colors.dangerSoft,
	},
	summaryWatch: {
		backgroundColor: colors.marigoldSoft,
	},
	summaryNumber: {
		color: colors.textPrimary,
	},
	summaryLabel: {
		color: colors.textSecondary,
	},
	storyLabel: {
		color: colors.textSecondary,
		marginBottom: spacing.sm,
	},
	resultStatus: {
		alignItems: "flex-start",
		marginBottom: spacing.md,
	},
	metricsCard: {
		marginBottom: spacing.lg,
	},
	metricRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		gap: 12,
		marginTop: spacing.md,
	},
	metricLabel: {
		color: colors.textSecondary,
		flex: 1,
	},
	metricValue: {
		color: colors.textPrimary,
		textAlign: "right",
	},
	metricNote: {
		color: colors.textSecondary,
		marginTop: 8,
	},
	itemCard: {
		marginBottom: 10,
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	blockCard: {
		marginBottom: 10,
	},
	sectionTitle: {
		color: colors.textPrimary,
		marginTop: spacing.xl,
		marginBottom: 12,
	},
	modeRow: {
		flexDirection: "row",
		gap: 8,
		marginBottom: 10,
	},
	recText: {
		color: colors.textPrimary,
		marginTop: 8,
	},
	recMeta: {
		color: colors.textSecondary,
		marginTop: 6,
	},
	levelLabel: {
		color: colors.primary,
		fontWeight: "600",
	},
	warnBox: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 8,
		padding: 14,
		borderRadius: radii.cardSmall,
		backgroundColor: colors.dangerSoft,
		marginBottom: 10,
	},
	warnText: {
		flex: 1,
		color: colors.danger,
	},
	useTraining: {
		marginTop: 12,
		alignSelf: "flex-start",
	},
	useTrainingText: {
		color: colors.primary,
	},
	fieldLabel: {
		color: colors.textPrimary,
		marginBottom: 10,
	},
	group: {
		marginBottom: 4,
	},
	logError: {
		color: colors.danger,
		marginBottom: 12,
	},
	logRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 12,
	},
	logBody: {
		flex: 1,
	},
	itemRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	itemText: {
		flex: 1,
		color: colors.textPrimary,
	},
	loading: {
		paddingVertical: spacing.xxxl,
		alignItems: "center",
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
		paddingVertical: spacing.md,
	},
	doneButton: {
		height: 56,
		borderRadius: 999,
		backgroundColor: colors.primary,
		alignItems: "center",
		justifyContent: "center",
		...shadows.pill,
	},
	doneLabel: {
		color: colors.surface,
	},
	pressed: {
		opacity: 0.7,
	},
});
