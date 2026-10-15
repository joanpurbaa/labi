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
import { Card } from "../components/ui/Card";
import { FadeIn } from "../components/ui/FadeIn";
import { StatusChip } from "../components/ui/StatusChip";
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
import type { ResultRead, SpeechMetricsRead } from "../lib/api";
import { useAuth } from "../lib/auth";
import { clearActiveSession } from "../lib/activeSession";

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

	const numericSessionId = Number(sessionId);

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
				const [loaded, analysis] = await Promise.all([
					api.getResult(token, numericSessionId, controller.signal),
					api.getAnalysis(token, numericSessionId, controller.signal).catch(() => null),
				]);
				if (active) {
					setResult(loaded);
					setMetrics(analysis?.speech_metrics ?? null);
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

	return (
		<SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
			<View style={styles.header}>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Kembali"
					onPress={() => router.replace("/")}
					style={({ pressed }) => [styles.back, pressed && styles.pressed]}
				>
					<Icon name="chevron" size={22} color={colors.textPrimary} />
				</Pressable>
				<Text style={[type.h2, styles.headerTitle]}>Hasil cerita</Text>
			</View>

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
	header: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: layout.screenPadding,
		paddingTop: spacing.sm,
		paddingBottom: spacing.sm,
	},
	back: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: colors.surface,
		alignItems: "center",
		justifyContent: "center",
		transform: [{ scaleX: -1 }],
		...shadows.pill,
	},
	headerTitle: {
		color: colors.textPrimary,
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
