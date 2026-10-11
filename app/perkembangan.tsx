import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
import { StatusChip } from "../components/ui/StatusChip";
import { StatTile } from "../components/ui/StatTile";
import {
	colors,
	layout,
	radii,
	shadows,
	spacing,
	type,
} from "../constants/theme";
import { useAuth } from "../lib/auth";
import { formatName } from "../lib/formatName";
import { statusToExpression } from "../lib/mascotMood";

const WEEK_LABELS = ["4 mg lalu", "3 mg lalu", "2 mg lalu", "1 mg lalu", "Minggu ini"];
const TREND_VALUES = [2, 2.4, 2.2, 3.4, 4.1];

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

function TrendChart({ width, height = 168 }: { width: number; height?: number }) {
	const padX = 10;
	const padTop = 18;
	const padBottom = 30;
	const innerW = Math.max(width - padX * 2, 1);
	const innerH = Math.max(height - padTop - padBottom, 1);
	const max = Math.max(...TREND_VALUES);
	const min = Math.min(...TREND_VALUES);
	const range = Math.max(max - min, 1);

	const points: Point[] = TREND_VALUES.map((value, index) => ({
		x: padX + (innerW * index) / (TREND_VALUES.length - 1),
		y: padTop + innerH * (1 - (value - min) / range),
	}));

	const line = smoothPath(points);
	const last = points[points.length - 1];
	const area = `${line} L ${last.x} ${padTop + innerH} L ${points[0].x} ${padTop + innerH} Z`;

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
	const { survivorProfile } = useAuth();
	const survivorName = formatName(survivorProfile?.survivorNickname ?? "penyintas");
	const [chartWidth, setChartWidth] = useState(0);

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
				<FadeIn>
					<Card>
						<View style={styles.summaryTop}>
							<Mascot expression={statusToExpression("stable")} size={48} />
							<StatusChip tone="stable" label="Perubahan ringan" />
						</View>
						<Text style={[type.body, styles.summaryText]}>
							Dibanding minggu-minggu sebelumnya, {survivorName} bercerita
							sedikit lebih panjang. Perubahannya ringan dan masih dalam
							kebiasaan yang wajar.
						</Text>
					</Card>
				</FadeIn>

				<FadeIn delay={60}>
					<View style={styles.statsRow}>
						<StatTile label="Sesi tercatat" value="5" icon="history" tone="primary" />
						<StatTile label="Rata-rata" value="3 menit" icon="clock" tone="accent" />
					</View>
				</FadeIn>

				<FadeIn delay={120}>
					<Card style={styles.chartCard}>
						<Text style={[type.bodyStrong, styles.chartTitle]}>
							Perubahan dari kebiasaan {survivorName}
						</Text>
						<Text style={[type.small, styles.chartHint]}>
							Semakin ke atas, semakin banyak ia bercerita.
						</Text>

						<View
							style={styles.chartArea}
							onLayout={(event) =>
								setChartWidth(event.nativeEvent.layout.width)
							}
						>
							{chartWidth > 0 ? <TrendChart width={chartWidth} /> : null}
						</View>

						<View style={styles.axisRow}>
							{WEEK_LABELS.map((label) => (
								<Text key={label} style={[type.small, styles.axisLabel]}>
									{label}
								</Text>
							))}
						</View>

						<View style={styles.legendRow}>
							<View style={styles.legendDot} />
							<Text style={[type.small, styles.legendText]}>
								Titik oranye menandai sesi terbaru.
							</Text>
						</View>
					</Card>
				</FadeIn>

				<View style={styles.note}>
					<Icon name="info" size={16} color={colors.textSecondary} />
					<Text style={[type.small, styles.noteText]}>
						Ini bukan diagnosis. Bawa ringkasan ini saat berkonsultasi dengan
						dokter.
					</Text>
				</View>
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
	axisRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: 4,
	},
	axisLabel: {
		color: colors.textSecondary,
	},
	legendRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginTop: 12,
	},
	legendDot: {
		width: 12,
		height: 12,
		borderRadius: 6,
		backgroundColor: colors.accent,
		borderWidth: 2,
		borderColor: colors.primary,
	},
	legendText: {
		color: colors.textSecondary,
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
	pressed: {
		opacity: 0.7,
	},
});
