import { useRouter } from "expo-router";
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
import Svg, {
	Circle,
	Defs,
	LinearGradient,
	Path,
	Stop,
} from "react-native-svg";
import { Icon } from "../components/Icon";
import { Mascot } from "../components/mascot/Mascot";
import { Card } from "../components/ui/Card";
import { FadeIn } from "../components/ui/FadeIn";
import { StatTile } from "../components/ui/StatTile";
import { StatusChip } from "../components/ui/StatusChip";
import {
	colors,
	layout,
	radii,
	shadows,
	spacing,
	type,
} from "../constants/theme";
import * as api from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatName } from "../lib/formatName";
import {
	recallLabel,
	recallTone,
} from "../lib/sessionDisplay";
import { statusToExpression } from "../lib/mascotMood";
import { getParticipantId } from "../lib/participant";
import { WEEKLY_SUMMARY } from "../lib/dummyData";

type Point = { x: number; y: number };

function smoothPath(points: Point[]): string {
	if (points.length < 2) {
		return "";
	}
	const commands = [`M ${points[0].x} ${points[0].y}`];
	for (let i = 0; i < points.length - 1; i++) {
		const p0 = points[i - 1] ?? points[i];
		const p1 = points[i];
		const p2 = points[i + 1];
		const p3 = points[i + 2] ?? p2;
		const cp1x = p1.x + (p2.x - p0.x) / 6;
		const cp1y = p1.y + (p2.y - p0.y) / 6;
		const cp2x = p2.x - (p3.x - p1.x) / 6;
		const cp2y = p2.y - (p3.y - p1.y) / 6;
		commands.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`);
	}
	return commands.join(" ");
}

function TrendChart({
	width,
	values,
	height = 168,
}: {
	width: number;
	values: number[];
	height?: number;
}) {
	const padX = 10;
	const padTop = 18;
	const padBottom = 30;
	const innerW = Math.max(width - padX * 2, 1);
	const innerH = Math.max(height - padTop - padBottom, 1);
	const max = Math.max(...values);
	const min = Math.min(...values);
	const range = Math.max(max - min, 1);

	const points: Point[] = values.map((value, index) => ({
		x: padX + (innerW * index) / Math.max(values.length - 1, 1),
		y: padTop + innerH * (1 - (value - min) / range),
	}));

	const line = smoothPath(points);
	const last = points[points.length - 1];
	const first = points[0];
	const area = `${line} L ${last.x} ${padTop + innerH} L ${first.x} ${padTop + innerH} Z`;

	return (
		<Svg width={width} height={height}>
			<Defs>
				<LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
					<Stop offset="0" stopColor={colors.primary} stopOpacity={0.22} />
					<Stop offset="1" stopColor={colors.primary} stopOpacity={0} />
				</LinearGradient>
			</Defs>
			<Path d={area} fill="url(#area)" />
			<Path
				d={line}
				stroke={colors.primary}
				strokeWidth={4}
				fill="none"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			{points.map((point, index) => {
				const isLast = index === points.length - 1;
				return (
					<Circle
						key={index}
						cx={point.x}
						cy={point.y}
						r={isLast ? 8 : 4}
						fill={isLast ? colors.accent : colors.surface}
						stroke={colors.primary}
						strokeWidth={isLast ? 3 : 2}
					/>
				);
			})}
		</Svg>
	);
}

export default function PerkembanganScreen() {
	const router = useRouter();
	const { token, user, survivorProfile } = useAuth();
	const survivorName = formatName(survivorProfile?.survivorNickname ?? "penyintas");
	const [chartWidth, setChartWidth] = useState(0);
	const [trend, setTrend] = useState<api.ParticipantTrendRead | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [ready, setReady] = useState(false);
	const [showExample, setShowExample] = useState(false);
	useEffect(() => {
		let active = true;
		const controller = new AbortController();
		if (!token || !user) {
			return;
		}
		(async () => {
			try {
				const participantId = await getParticipantId(user.id);
				if (participantId === null) {
					if (active) setShowExample(true);
					return;
				}
				const completed = await api.listSessions(token, {
					participant_id: participantId,
					status: "completed",
					page: 1,
					page_size: 1,
					signal: controller.signal,
				});
				if (completed.data.length === 0) {
					if (active) setShowExample(true);
					return;
				}
				const loaded = await api.getParticipantTrend(token, participantId, controller.signal);
				if (active) {
					setTrend(loaded);
				}
			} catch (err) {
				if (active) {
					setError(api.errorMessage(err));
				}
			} finally {
				if (active) {
					setReady(true);
				}
			}
		})();
		return () => {
			active = false;
			controller.abort();
		};
	}, [token, user]);

	const values = (trend?.series ?? []).map(
		(point) => point.iu_recall_percent ?? 0,
	);

	return (
		<SafeAreaView style={styles.safe} edges={["top"]}>
			<View style={styles.header}>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Kembali"
					onPress={() => router.back()}
					style={({ pressed }) => [styles.back, pressed && styles.pressed]}
				>
					<Icon name="chevron" size={22} color={colors.textPrimary} />
				</Pressable>
				<Text style={[type.h2, styles.headerTitle]}>Perkembangan</Text>
			</View>

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				{!ready ? (
					<View style={styles.loading}>
						<ActivityIndicator color={colors.primary} />
					</View>
				) : null}

				{error ? (
					<View style={styles.error}>
						<Icon name="info" size={18} color={colors.danger} />
						<Text style={[type.body, styles.errorText]}>{error}</Text>
					</View>
				) : null}

				{ready && showExample ? (
					<FadeIn>
						<Card style={styles.exampleCard}>
							<Text style={[type.small, styles.exampleLabel]}>Contoh tampilan</Text>
							<Text style={[type.bodyStrong, styles.chartTitle]}>{WEEKLY_SUMMARY.title}</Text>
							<Text style={[type.body, styles.summaryText]}>{WEEKLY_SUMMARY.body}</Text>
							<Text style={[type.small, styles.exampleHint]}>Catatan sesi dan perubahan akan muncul setelah sesi pertama selesai.</Text>
						</Card>
					</FadeIn>
				) : null}

				{ready && !error && !showExample ? (
					<>
						<FadeIn>
							<Card>
								<View style={styles.summaryTop}>
									<Mascot
										expression={statusToExpression(
											recallTone(trend?.latest?.iu_recall_percent ?? null),
										)}
										size={48}
									/>
									<StatusChip
										tone={recallTone(trend?.latest?.iu_recall_percent ?? null)}
										label={recallLabel(trend?.latest?.iu_recall_percent ?? null)}
									/>
								</View>
								<Text style={[type.body, styles.summaryText]}>
									{summaryMessage(survivorName, trend)}
								</Text>
							</Card>
						</FadeIn>

						<FadeIn delay={60}>
							<View style={styles.statsRow}>
								<StatTile
									label="Sesi tercatat"
									value={String(trend?.session_count ?? 0)}
									icon="history"
									tone="primary"
								/>
								<StatTile
									label="Ingatan terakhir"
									value={
										typeof trend?.latest?.iu_recall_percent === "number"
											? `${Math.round(trend.latest.iu_recall_percent)}%`
											: "—"
									}
									icon="clock"
									tone="accent"
								/>
							</View>
						</FadeIn>

						<FadeIn delay={120}>
							<Card style={styles.chartCard}>
								<Text style={[type.bodyStrong, styles.chartTitle]}>
									Perubahan dari kebiasaan {survivorName}
								</Text>
								<Text style={[type.small, styles.chartHint]}>
									Semakin ke atas, semakin banyak bagian cerita yang diingat.
								</Text>

								{values.length >= 2 ? (
									<View
										style={styles.chartArea}
										onLayout={(event) =>
											setChartWidth(event.nativeEvent.layout.width)
										}
									>
										{chartWidth > 0 ? (
											<TrendChart width={chartWidth} values={values} />
										) : null}
									</View>
								) : (
									<Text style={[type.body, styles.emptyChart]}>
										Belum cukup sesi untuk menggambar grafik. Butuh minimal
										dua sesi selesai.
									</Text>
								)}
							</Card>
						</FadeIn>

						<View style={styles.note}>
							<Icon name="info" size={16} color={colors.textSecondary} />
							<Text style={[type.small, styles.noteText]}>
								Ringkasan ini membantu melihat perubahan dari sesi ke sesi.
							</Text>
						</View>
					</>
				) : null}
			</ScrollView>
		</SafeAreaView>
	);
}

function summaryMessage(
	name: string,
	trend: api.ParticipantTrendRead | null,
): string {
	const count = trend?.session_count ?? 0;
	const latest = trend?.latest?.iu_recall_percent ?? null;
	const baseline = trend?.baseline?.iu_recall_percent ?? null;
	if (count < 2 || latest === null || baseline === null) {
		return `Belum cukup data untuk melihat perubahan ${name}. Ajak bercerita beberapa kali lagi.`;
	}
	const delta = latest - baseline;
	if (delta > 3) {
		return `Dibanding awal, ${name} mengingat bagian cerita lebih banyak. Perubahannya ringan dan masih wajar.`;
	}
	if (delta < -3) {
		return `Ingatan ${name} sedikit menurun dibanding awal. Tetap dampingi dengan sabar.`;
	}
	return `Ingatan ${name} cenderung stabil dibanding awal.`;
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
	summaryTop: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		marginBottom: 12,
	},
	summaryText: {
		color: colors.textPrimary,
	},
	statsRow: {
		flexDirection: "row",
		gap: 12,
		marginTop: 12,
	},
	chartCard: {
		marginTop: 12,
	},
	exampleCard: {
		marginTop: spacing.lg,
	},
	exampleLabel: {
		color: colors.primary,
		marginBottom: spacing.sm,
	},
	exampleHint: {
		color: colors.textSecondary,
		marginTop: spacing.lg,
	},
	chartTitle: {
		color: colors.textPrimary,
	},
	chartHint: {
		color: colors.textSecondary,
		marginTop: 4,
	},
	chartArea: {
		marginTop: 16,
	},
	emptyChart: {
		color: colors.textSecondary,
		marginTop: 16,
	},
	note: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 8,
		marginTop: 20,
		padding: 14,
		borderRadius: radii.cardSmall,
		backgroundColor: colors.surface,
	},
	noteText: {
		color: colors.textSecondary,
		flexShrink: 1,
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
	pressed: {
		opacity: 0.7,
	},
});
