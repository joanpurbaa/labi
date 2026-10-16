import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	Share,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon, type IconName } from "../components/Icon";
import { Mascot } from "../components/mascot/Mascot";
import { AppHeader } from "../components/ui/AppHeader";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { FadeIn } from "../components/ui/FadeIn";
import { IconBadge } from "../components/ui/IconBadge";
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
import { resolveParticipantId } from "../lib/participant";
import { formatSessionDate, recallLabel } from "../lib/sessionDisplay";

type ReportSection = {
	id: string;
	title: string;
	icon: IconName;
	lines: string[];
};

type DoctorReport = {
	name: string;
	period: string;
	sessions: number;
	averageRecall: string;
	generatedAt: string;
	sections: ReportSection[];
};

function formatDateTime(iso: Date): string {
	const pad = (value: number) => String(value).padStart(2, "0");
	return `${formatSessionDate(iso.toISOString())} · ${pad(iso.getHours())}.${pad(iso.getMinutes())}`;
}

function buildReport(
	name: string,
	sessions: api.SessionHistoryItem[],
	trend: api.ParticipantTrendRead | null,
): DoctorReport {
	const completed = sessions.filter((session) => session.completed_at);
	const dates = completed
		.map((session) => session.completed_at as string)
		.sort();
	const period =
		dates.length > 0
			? `${formatSessionDate(dates[0])} – ${formatSessionDate(dates[dates.length - 1])}`
			: "Belum ada sesi";
	const recalls = completed
		.map((session) => session.iu_recall_percent)
		.filter((value): value is number => typeof value === "number");
	const averageRecall =
		recalls.length > 0
			? `${Math.round(recalls.reduce((sum, value) => sum + value, 0) / recalls.length)}%`
			: "—";

	const summaryLines = [
		`${name} mengikuti ${completed.length} sesi bercerita tercatat.`,
		recalls.length > 0
			? `Rata-rata ingatan ${averageRecall} per sesi.`
			: "Belum ada nilai ingatan tercatat.",
	];
	const latest = completed[completed.length - 1];
	if (latest) {
		summaryLines.push(
			`Sesi terakhir ${formatSessionDate(latest.completed_at)}: ${recallLabel(latest.iu_recall_percent)}.`,
		);
	}

	const changeLines: string[] = [];
	const baseline = trend?.baseline?.iu_recall_percent ?? null;
	const latestRecall = trend?.latest?.iu_recall_percent ?? null;
	if (
		(trend?.session_count ?? 0) >= 2 &&
		baseline !== null &&
		latestRecall !== null
	) {
		const delta = Math.round(latestRecall - baseline);
		if (delta > 3) {
			changeLines.push(
				`Ingatan naik ${delta}% dibanding sesi pertama. Perubahan ringan dan positif.`,
			);
		} else if (delta < -3) {
			changeLines.push(
				`Ingatan turun ${Math.abs(delta)}% dibanding sesi pertama. Perlu dicermati.`,
			);
		} else {
			changeLines.push("Ingatan cenderung stabil dibanding sesi pertama.");
		}
	} else {
		changeLines.push("Butuh minimal dua sesi selesai untuk melihat perubahan.");
	}

	const detailLines = completed.slice(-5).map((session) => {
		const recall =
			typeof session.iu_recall_percent === "number"
				? `${Math.round(session.iu_recall_percent)}%`
				: "belum dinilai";
		return `${formatSessionDate(session.completed_at)} · ${session.story_title ?? "Cerita"} · ${recall}.`;
	});
	if (detailLines.length === 0) {
		detailLines.push("Belum ada sesi selesai yang bisa dirincikan.");
	}

	return {
		name,
		period,
		sessions: completed.length,
		averageRecall,
		generatedAt: formatDateTime(new Date()),
		sections: [
			{ id: "ringkasan", title: "Ringkasan", icon: "chart", lines: summaryLines },
			{ id: "perubahan", title: "Perubahan dibanding awal", icon: "progress", lines: changeLines },
			{ id: "rincian", title: "Rincian sesi", icon: "history", lines: detailLines },
		],
	};
}

function toDisplayText(
	sectionId: string,
	lineIndex: number,
	line: unknown,
): string {
	if (typeof line === "string") {
		return line;
	}
	if (typeof line === "number" || typeof line === "boolean") {
		return String(line);
	}
	if (__DEV__) {
		console.log("[laporan-dokter] format baris tak dikenal:", {
			sectionId,
			lineIndex,
			line,
		});
	}
	try {
		return JSON.stringify(line) ?? "";
	} catch {
		return "";
	}
}

function buildShareText(report: DoctorReport): string {
	const lines: string[] = [
		"Laporan untuk dokter — LABI",
		`${report.name} · ${report.period}`,
		`Jumlah sesi: ${report.sessions}`,
		`Rata-rata ingatan: ${report.averageRecall}`,
		"",
	];
	for (const section of report.sections) {
		lines.push(`${section.title}:`);
		for (const line of section.lines) {
			lines.push(`- ${line}`);
		}
		lines.push("");
	}
	lines.push("Catatan: ini ringkasan latihan, bukan diagnosis.");
	return lines.join("\n");
}

export default function LaporanDokterScreen() {
	const router = useRouter();
	const { token, user, survivorProfile } = useAuth();
	const [report, setReport] = useState<DoctorReport | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [ready, setReady] = useState(false);

	const survivorName = formatName(survivorProfile?.survivorNickname ?? "penyintas");

	useEffect(() => {
		let active = true;
		if (!token || !user) {
			return;
		}
		(async () => {
			try {
				const participantId = await resolveParticipantId(token, user.id);
				const [sessions, trend] = await Promise.all([
					api.listSessions(token, {
						...(participantId === null ? {} : { participant_id: participantId }),
						page: 1,
						page_size: 100,
					}),
					participantId === null
						? Promise.resolve(null)
						: api.getParticipantTrend(token, participantId).catch(() => null),
				]);
				if (active) {
					setReport(buildReport(survivorName, sessions.data, trend));
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
		};
	}, [token, user, survivorName]);

	const share = async () => {
		if (!report) {
			return;
		}
		try {
			await Share.share({
				title: "Laporan untuk dokter",
				message: buildShareText(report),
			});
		} catch {
			// pengguna membatalkan atau berbagi gagal; tidak ada aksi lain
		}
	};

	return (
		<SafeAreaView style={styles.safe} edges={["top"]}>
			<AppHeader
				title="Laporan dokter"
				onBack={() => router.back()}
				action={
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="Bagikan laporan"
						onPress={share}
						style={({ pressed }) => [styles.share, pressed && styles.pressed]}
					>
						<Icon name="doc" size={20} color={colors.primary} />
					</Pressable>
				}
			/>

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				{!ready && !error ? (
					<View style={styles.loadingRow}>
						<ActivityIndicator color={colors.primary} />
					</View>
				) : null}

				{error ? (
					<View style={styles.errorBox}>
						<Icon name="info" size={18} color={colors.danger} />
						<Text style={[type.body, styles.errorText]}>{error}</Text>
					</View>
				) : null}

				{ready && !error && (!report || report.sessions === 0) ? (
					<EmptyState
						title="Belum ada sesi selesai"
						description="Laporan dokter akan tersusun otomatis setelah sesi pertama selesai dan dinilai."
					/>
				) : null}

				{report && report.sessions > 0 ? (
					<>
						<FadeIn>
							<Card variant="hero" style={styles.heroCard}>
								<Mascot
									expression="menenangkan"
									size={96}
									decorative
									style={styles.heroMascot}
								/>
								<Text style={[type.h3, styles.heroTitle]}>
									Ringkasan perjalanan bicara
								</Text>
								<Text style={[type.body, styles.heroSub]}>
									{report.name} · {report.period}
								</Text>
								<View style={styles.statsRow}>
									<View style={styles.stat}>
										<Text style={[type.h1, styles.statValue]}>
											{report.sessions}
										</Text>
										<Text style={[type.small, styles.statLabel]}>
											sesi tercatat
										</Text>
									</View>
									<View style={styles.statDivider} />
									<View style={styles.stat}>
										<Text style={[type.h1, styles.statValue]}>
											{report.averageRecall}
										</Text>
										<Text style={[type.small, styles.statLabel]}>
											rata-rata ingatan
										</Text>
									</View>
								</View>
							</Card>
						</FadeIn>

						{report.sections.map((section, index) => (
							<FadeIn key={section.id} delay={(index + 1) * 50}>
								<View style={styles.section}>
									<View style={styles.sectionHead}>
										<IconBadge icon={section.icon} tone="primary" size={34} />
										<Text style={[type.h3, styles.sectionTitle]}>
											{section.title}
										</Text>
									</View>
									<Card>
										{(section.lines ?? []).map((line, lineIndex) => (
											<View
												key={`${section.id}-${lineIndex}`}
												style={[
													styles.lineRow,
													lineIndex < (section.lines ?? []).length - 1 &&
														styles.lineDivider,
												]}
											>
												<View style={styles.bullet} />
												<Text style={[type.body, styles.lineText]}>
													{toDisplayText(section.id, lineIndex, line)}
												</Text>
											</View>
										))}
									</Card>
								</View>
							</FadeIn>
						))}

						<Pressable
							accessibilityRole="button"
							accessibilityLabel="Bagikan laporan"
							onPress={share}
							style={({ pressed }) => [styles.shareButton, pressed && styles.pressed]}
						>
							<Icon name="doc" size={20} color={colors.surface} />
							<Text style={[type.bodyStrong, styles.shareText]}>
								Bagikan laporan
							</Text>
						</Pressable>

						<View style={styles.note}>
							<Icon name="info" size={16} color={colors.textSecondary} />
							<Text style={[type.small, styles.noteText]}>
								Ini bukan diagnosis. Dibuat {report.generatedAt}. Bawa saat
								berkonsultasi dengan dokter.
							</Text>
						</View>
					</>
				) : null}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: {
		flex: 1,
		backgroundColor: colors.background,
	},
	share: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: colors.surface,
		alignItems: "center",
		justifyContent: "center",
		...shadows.pill,
	},
	content: {
		paddingHorizontal: layout.screenPadding,
		paddingBottom: spacing.xxxl,
	},
	heroCard: {
		marginBottom: spacing.lg,
	},
	heroMascot: {
		alignSelf: "center",
		marginBottom: 4,
	},
	heroTitle: {
		color: colors.textPrimary,
	},
	heroSub: {
		color: colors.textSecondary,
		marginTop: 4,
	},
	statsRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 18,
	},
	stat: {
		flex: 1,
	},
	statDivider: {
		width: 1,
		height: 44,
		backgroundColor: colors.borderStrong,
		marginHorizontal: 16,
	},
	statValue: {
		color: colors.primary,
	},
	statLabel: {
		color: colors.textSecondary,
		marginTop: 2,
	},
	section: {
		marginBottom: layout.sectionGap,
	},
	sectionHead: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		marginBottom: 12,
	},
	sectionTitle: {
		color: colors.textPrimary,
	},
	lineRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 12,
		paddingVertical: 12,
	},
	lineDivider: {
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	bullet: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: colors.accent,
		marginTop: 8,
	},
	lineText: {
		flex: 1,
		color: colors.textPrimary,
	},
	shareButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 10,
		paddingVertical: 16,
		borderRadius: radii.cardSmall,
		backgroundColor: colors.primary,
		marginTop: 8,
	},
	shareText: {
		color: colors.surface,
	},
	note: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 8,
		marginTop: 8,
		padding: 14,
		borderRadius: radii.cardSmall,
		backgroundColor: colors.surface,
	},
	noteText: {
		color: colors.textSecondary,
		flexShrink: 1,
	},
	loadingRow: {
		paddingVertical: 32,
		alignItems: "center",
	},
	errorBox: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 8,
		padding: 14,
		borderRadius: radii.cardSmall,
		backgroundColor: colors.dangerSoft,
		marginBottom: 12,
	},
	errorText: {
		flex: 1,
		color: colors.danger,
	},
	pressed: {
		opacity: 0.7,
	},
});