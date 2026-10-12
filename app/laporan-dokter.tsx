import { useRouter } from "expo-router";
import {
	Pressable,
	ScrollView,
	Share,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../components/Icon";
import { Mascot } from "../components/mascot/Mascot";
import { Card } from "../components/ui/Card";
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
import { DUMMY_REPORT } from "../lib/dummyData";

function buildShareText(): string {
	const lines: string[] = [
		"Laporan untuk dokter — LABI",
		`Periode: ${DUMMY_REPORT.period}`,
		`Jumlah sesi: ${DUMMY_REPORT.sessions}`,
		`Durasi rata-rata: ${DUMMY_REPORT.averageDuration}`,
		"",
	];
	for (const section of DUMMY_REPORT.sections) {
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

	const share = async () => {
		try {
			await Share.share({
				title: "Laporan untuk dokter",
				message: buildShareText(),
			});
		} catch {
			// pengguna membatalkan atau berbagi gagal; tidak ada aksi lain
		}
	};

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
				<Text style={[type.h2, styles.headerTitle]}>Laporan dokter</Text>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Bagikan laporan"
					onPress={share}
					style={({ pressed }) => [styles.share, pressed && styles.pressed]}
				>
					<Icon name="doc" size={20} color={colors.primary} />
				</Pressable>
			</View>

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
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
							Bu Siti · {DUMMY_REPORT.period}
						</Text>
						<View style={styles.statsRow}>
							<View style={styles.stat}>
								<Text style={[type.h1, styles.statValue]}>
									{DUMMY_REPORT.sessions}
								</Text>
								<Text style={[type.small, styles.statLabel]}>
									sesi tercatat
								</Text>
							</View>
							<View style={styles.statDivider} />
							<View style={styles.stat}>
								<Text style={[type.h1, styles.statValue]}>
									{DUMMY_REPORT.averageDuration}
								</Text>
								<Text style={[type.small, styles.statLabel]}>
									rata-rata
								</Text>
							</View>
						</View>
					</Card>
				</FadeIn>

				{DUMMY_REPORT.sections.map((section, index) => (
					<FadeIn key={section.id} delay={(index + 1) * 50}>
						<View style={styles.section}>
							<View style={styles.sectionHead}>
								<IconBadge icon={section.icon} tone="primary" size={34} />
								<Text style={[type.h3, styles.sectionTitle]}>
									{section.title}
								</Text>
							</View>
							<Card>
								{section.lines.map((line, lineIndex) => (
									<View
										key={line}
										style={[
											styles.lineRow,
											lineIndex < section.lines.length - 1 &&
												styles.lineDivider,
										]}
									>
										<View style={styles.bullet} />
										<Text style={[type.body, styles.lineText]}>{line}</Text>
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
						Ini bukan diagnosis. Dibuat {DUMMY_REPORT.generatedAt}. Bawa saat
						berkonsultasi dengan dokter.
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
		flex: 1,
		color: colors.textPrimary,
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
	pressed: {
		opacity: 0.7,
	},
});