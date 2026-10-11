import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../components/Icon";
import { Mascot } from "../components/mascot/Mascot";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { FadeIn } from "../components/ui/FadeIn";
import { StatusChip } from "../components/ui/StatusChip";
import {
	colors,
	layout,
	radii,
	shadows,
	spacing,
	type,
} from "../constants/theme";
import { DUMMY_SESSIONS } from "../lib/dummyData";
import { statusToExpression } from "../lib/mascotMood";

export default function SesiDetailScreen() {
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id?: string }>();
	const session = DUMMY_SESSIONS.find((entry) => entry.id === id);

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
				<Text style={[type.h2, styles.headerTitle]}>Detail sesi</Text>
			</View>

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				{session ? (
					<>
						<FadeIn>
							<Card>
								<View style={styles.topRow}>
									<Mascot
										expression={statusToExpression(session.tone)}
										size={48}
									/>
									<View style={styles.dateBlock}>
										<Text style={[type.bodyStrong, styles.when]}>
											{session.when}
										</Text>
										<Text style={[type.small, styles.date]}>
											{session.date}
										</Text>
									</View>
									<StatusChip tone={session.tone} label={session.status} />
								</View>
								<View style={styles.durationRow}>
									<Icon name="clock" size={14} color={colors.textSecondary} />
									<Text style={[type.small, styles.durationText]}>
										Durasi {session.duration}
									</Text>
								</View>
							</Card>
						</FadeIn>

						<FadeIn delay={60}>
							<View style={styles.chipRow}>
								<View style={styles.chip}>
									<Icon name="smile" size={14} color={colors.textSecondary} />
									<Text style={[type.small, styles.chipText]}>
										Mood: {session.mood}
									</Text>
								</View>
								<View style={styles.chip}>
									<Icon name="moon" size={14} color={colors.textSecondary} />
									<Text style={[type.small, styles.chipText]}>
										Tidur: {session.sleep}
									</Text>
								</View>
								<View style={styles.chip}>
									<Icon
										name="calendar"
										size={14}
										color={colors.textSecondary}
									/>
									<Text style={[type.small, styles.chipText]}>
										{session.activity}
									</Text>
								</View>
							</View>
						</FadeIn>

						<FadeIn delay={100}>
							<View style={styles.section}>
								<Text style={[type.h3, styles.sectionTitle]}>Catatan sesi</Text>
								<Card>
									<Text style={[type.body, styles.summary]}>
										{session.summary}
									</Text>
								</Card>
							</View>
						</FadeIn>

						<FadeIn delay={140}>
							<View style={styles.section}>
								<Text style={[type.h3, styles.sectionTitle]}>
									Yang terlihat
								</Text>
								<Card>
									{session.highlights.map((highlight, index) => (
										<View
											key={highlight}
											style={[
												styles.highlightRow,
												index < session.highlights.length - 1 &&
													styles.highlightDivider,
											]}
										>
											<Icon name="check" size={18} color={colors.primary} />
											<Text style={[type.body, styles.highlightText]}>
												{highlight}
											</Text>
										</View>
									))}
								</Card>
							</View>
						</FadeIn>

						<View style={styles.note}>
							<Icon name="info" size={16} color={colors.textSecondary} />
							<Text style={[type.small, styles.noteText]}>
								Ini bukan diagnosis. Catatan hanya untuk melihat kebiasaan.
							</Text>
						</View>
					</>
				) : (
					<EmptyState
						title="Sesi tidak ditemukan"
						description="Catatan sesi ini tidak tersedia. Kembali ke Riwayat untuk memilih sesi lain."
					/>
				)}
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
	topRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 12,
	},
	dateBlock: {
		flex: 1,
	},
	when: {
		color: colors.textPrimary,
	},
	date: {
		color: colors.textSecondary,
		marginTop: 2,
	},
	durationRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		marginTop: 12,
	},
	durationText: {
		color: colors.textSecondary,
	},
	chipRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		marginTop: 16,
	},
	chip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingVertical: 8,
		paddingHorizontal: 14,
		borderRadius: radii.pill,
		backgroundColor: colors.surface,
	},
	chipText: {
		color: colors.textSecondary,
	},
	section: {
		marginTop: spacing.xxl,
	},
	sectionTitle: {
		color: colors.textPrimary,
		marginBottom: 12,
	},
	summary: {
		color: colors.textPrimary,
	},
	highlightRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingVertical: 12,
	},
	highlightDivider: {
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	highlightText: {
		flex: 1,
		color: colors.textPrimary,
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