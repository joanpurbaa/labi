import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../../components/Icon";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { FadeIn } from "../../components/ui/FadeIn";
import { IconBadge } from "../../components/ui/IconBadge";
import { ProgressRing } from "../../components/ui/ProgressRing";
import {
	colors,
	layout,
	radii,
	spacing,
	type,
} from "../../constants/theme";
import { useAuth } from "../../lib/auth";
import {
	DUMMY_SESSIONS,
	DUMMY_TOPICS,
	WEEKLY_PROGRESS,
} from "../../lib/dummyData";
import { formatName } from "../../lib/formatName";

export default function SesiScreen() {
	const { survivorProfile } = useAuth();
	const survivorName = formatName(survivorProfile?.survivorNickname ?? "penyintas");
	const recent = DUMMY_SESSIONS.slice(0, 3);
	const progress = WEEKLY_PROGRESS.done / WEEKLY_PROGRESS.target;

	return (
		<SafeAreaView style={styles.safe} edges={["top"]}>
			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<FadeIn>
					<Text style={[type.h2, styles.pageTitle]}>Sesi komunikasi</Text>
					<Text style={[type.body, styles.pageSub]}>
						Latihan berbicara bersama {survivorName}, kapan pun ia siap.
					</Text>
				</FadeIn>

				<FadeIn delay={60}>
					<Card variant="hero" style={styles.heroCard}>
						<View style={styles.heroTop}>
							<ProgressRing progress={progress} size={112}>
								<Text style={[type.h1, styles.ringValue]}>
									{WEEKLY_PROGRESS.done}
								</Text>
								<Text style={[type.small, styles.ringLabel]}>
									dari {WEEKLY_PROGRESS.target}
								</Text>
							</ProgressRing>
							<View style={styles.heroSide}>
								<Text style={[type.bodyStrong, styles.heroSideTitle]}>
									Target {WEEKLY_PROGRESS.label}
								</Text>
								<Text style={[type.body, styles.heroSideText]}>
									{WEEKLY_PROGRESS.done} dari {WEEKLY_PROGRESS.target} sesi
									selesai. Satu sesi lagi untuk genap.
								</Text>
							</View>
						</View>
						<Button
							label={`Mulai sesi bersama ${survivorName}`}
							size="large"
							fullWidth
							onPress={() => router.push("/sesi-bercerita")}
							style={styles.heroButton}
						/>
					</Card>
				</FadeIn>

				<FadeIn delay={120}>
					<View style={styles.section}>
						<View style={styles.sectionHead}>
							<Text style={[type.h3, styles.sectionTitle]}>
								Sesi terakhir
							</Text>
							<Pressable
								accessibilityRole="button"
								accessibilityLabel="Lihat semua riwayat"
								onPress={() => router.push("/riwayat")}
								style={({ pressed }) => [pressed && styles.pressed]}
							>
								<Text style={[type.small, styles.link]}>Lihat semua</Text>
							</Pressable>
						</View>
						{recent.map((session) => (
							<Pressable
								key={session.id}
								accessibilityRole="button"
								accessibilityLabel={`Detail sesi ${session.when}`}
								onPress={() =>
									router.push({
										pathname: "/sesi-detail",
										params: { id: session.id },
									})
								}
								style={({ pressed }) => [pressed && styles.pressed]}
							>
								<Card style={styles.sessionCard}>
									<View style={styles.sessionRow}>
										<IconBadge
											icon="session"
											tone={
												session.tone === "stable"
													? "leaf"
													: session.tone === "watch"
														? "accent"
														: "orange"
											}
											size={44}
										/>
										<View style={styles.sessionBody}>
											<Text style={[type.bodyStrong, styles.sessionWhen]}>
												{session.when}
											</Text>
											<Text style={[type.small, styles.sessionMeta]}>
												{session.duration} · Mood: {session.mood}
											</Text>
										</View>
										<Icon
											name="chevron"
											size={18}
											color={colors.textSecondary}
										/>
									</View>
								</Card>
							</Pressable>
						))}
					</View>
				</FadeIn>

				<FadeIn delay={180}>
					<View style={styles.section}>
						<Text style={[type.h3, styles.sectionTitle]}>
							Ide topik obrolan
						</Text>
						<Card>
							{DUMMY_TOPICS.map((topic, index) => (
								<View
									key={topic.id}
									style={[
										styles.topicRow,
										index < DUMMY_TOPICS.length - 1 &&
											styles.topicDivider,
									]}
								>
									<IconBadge icon={topic.icon} tone="primary" size={40} />
									<View style={styles.topicBody}>
										<Text style={[type.bodyStrong, styles.topicTitle]}>
											{topic.title}
										</Text>
										<Text style={[type.small, styles.topicPrompt]}>
											{topic.prompt}
										</Text>
									</View>
								</View>
							))}
						</Card>
					</View>
				</FadeIn>

				<FadeIn delay={240}>
					<View style={styles.note}>
						<Icon name="info" size={16} color={colors.textSecondary} />
						<Text style={[type.small, styles.noteText]}>
							Lakukan saat {survivorName} tenang dan tidak terburu-buru. Tidak
							ada salah atau benar.
						</Text>
					</View>
				</FadeIn>
			</ScrollView>
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
		paddingTop: spacing.md,
		paddingBottom: 88,
	},
	pageTitle: {
		color: colors.textPrimary,
	},
	pageSub: {
		color: colors.textSecondary,
		marginTop: 6,
	},
	heroCard: {
		marginTop: 20,
	},
	heroTop: {
		flexDirection: "row",
		alignItems: "center",
		gap: 18,
	},
	ringValue: {
		color: colors.primary,
	},
	ringLabel: {
		color: colors.textSecondary,
	},
	heroSide: {
		flex: 1,
	},
	heroSideTitle: {
		color: colors.textPrimary,
	},
	heroSideText: {
		color: colors.textSecondary,
		marginTop: 4,
	},
	heroButton: {
		marginTop: 20,
	},
	section: {
		marginTop: spacing.xxl,
	},
	sectionHead: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 14,
	},
	sectionTitle: {
		color: colors.textPrimary,
	},
	link: {
		color: colors.primary,
		fontWeight: "600",
	},
	sessionCard: {
		marginBottom: 12,
	},
	sessionRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	sessionBody: {
		flex: 1,
	},
	sessionWhen: {
		color: colors.textPrimary,
	},
	sessionMeta: {
		color: colors.textSecondary,
		marginTop: 2,
	},
	topicRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingVertical: 12,
	},
	topicDivider: {
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	topicBody: {
		flex: 1,
	},
	topicTitle: {
		color: colors.textPrimary,
	},
	topicPrompt: {
		color: colors.textSecondary,
		marginTop: 2,
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
