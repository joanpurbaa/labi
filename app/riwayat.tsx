import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon, type IconName } from "../components/Icon";
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
import { useAuth } from "../lib/auth";
import { DUMMY_SESSIONS } from "../lib/dummyData";
import { formatName } from "../lib/formatName";

function ContextChip({ icon, label }: { icon: IconName; label: string }) {
	return (
		<View style={styles.contextChip}>
			<Icon name={icon} size={14} color={colors.textSecondary} />
			<Text style={[type.small, styles.contextText]}>{label}</Text>
		</View>
	);
}

export default function RiwayatScreen() {
	const router = useRouter();
	const { survivorProfile } = useAuth();
	const survivorName = formatName(survivorProfile?.survivorNickname ?? "penyintas");

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
				<Text style={[type.h2, styles.headerTitle]}>Riwayat sesi</Text>
			</View>

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<Text style={[type.body, styles.intro]}>
					Inilah catatan perubahan dari kebiasaan {survivorName} tiap minggu.
				</Text>

				{DUMMY_SESSIONS.length === 0 ? (
					<EmptyState
						photo="lansia3"
						title="Belum ada catatan"
						description="Setelah sesi pertama, ringkasan perubahan akan muncul di sini."
					/>
				) : (
					DUMMY_SESSIONS.map((item, index) => (
						<FadeIn key={item.id} delay={index * 60}>
							<Pressable
								accessibilityRole="button"
								accessibilityLabel={`Detail sesi ${item.when}`}
								onPress={() =>
									router.push({
										pathname: "/sesi-detail",
										params: { id: item.id },
									})
								}
								style={({ pressed }) => [pressed && styles.pressed]}
							>
								<Card style={styles.sessionCard}>
									<View style={styles.sessionTop}>
										<View style={styles.sessionHead}>
											<Text style={[type.bodyStrong, styles.sessionWhen]}>
												{item.when}
											</Text>
											<View style={styles.durationRow}>
												<Icon
													name="clock"
													size={14}
													color={colors.textSecondary}
												/>
												<Text style={[type.small, styles.durationText]}>
													{item.duration}
												</Text>
											</View>
										</View>
										<View style={styles.sessionEnd}>
											<StatusChip tone={item.tone} label={item.status} />
											<Icon
												name="chevron"
												size={18}
												color={colors.textSecondary}
											/>
										</View>
									</View>

									<View style={styles.chipRow}>
										<ContextChip icon="smile" label={`Mood: ${item.mood}`} />
										<ContextChip icon="moon" label={`Tidur: ${item.sleep}`} />
									</View>
								</Card>
							</Pressable>
						</FadeIn>
					))
				)}

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
	intro: {
		color: colors.textSecondary,
		marginBottom: 16,
	},
	sessionCard: {
		marginBottom: 12,
	},
	sessionTop: {
		flexDirection: "row",
		alignItems: "flex-start",
		justifyContent: "space-between",
		gap: 12,
	},
	sessionHead: {
		flex: 1,
	},
	sessionEnd: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	sessionWhen: {
		color: colors.textPrimary,
	},
	durationRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		marginTop: 6,
	},
	durationText: {
		color: colors.textSecondary,
	},
	chipRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		marginTop: 14,
	},
	contextChip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 999,
		backgroundColor: colors.primarySoft,
	},
	contextText: {
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
