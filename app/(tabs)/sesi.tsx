import { router } from "expo-router";
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
import * as api from "../../lib/api";
import type { SessionHistoryItem } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { formatName } from "../../lib/formatName";
import { TOPIC_OPTIONS } from "../../lib/survivorOptions";
import type { IconName } from "../../components/Icon";
import {
	formatSessionDate,
	recallLabel,
	recallTone,
} from "../../lib/sessionDisplay";

const TOPIC_PROMPTS: Record<string, string> = {
	family: "Siapa yang terakhir datang berkunjung?",
	hobbies: "Kegiatan apa yang paling disukai akhir-akhir ini?",
	food: "Masakan apa yang paling disukai akhir-akhir ini?",
	daily_activities: "Apa yang tadi dikerjakan setelah bangun tidur?",
	memories: "Ada acara lama yang masih diingat?",
	other: "Hal apa yang ingin diobrolkan hari ini?",
};

const TOPIC_ICONS: Record<string, IconName> = {
	family: "heart",
	hobbies: "sparkles",
	food: "smile",
	daily_activities: "clock",
	memories: "book",
	other: "session",
};

type TopicIdea = {
	id: string;
	title: string;
	prompt: string;
	icon: IconName;
};

function topicsFor(values: string[] | undefined): TopicIdea[] {
	if (!values || values.length === 0) {
		return [];
	}
	return values.flatMap((value) => {
		const label = TOPIC_OPTIONS.find((option) => option.value === value)?.label;
		if (!label) {
			return [];
		}
		return [
			{
				id: value,
				title: label,
				prompt: TOPIC_PROMPTS[value] ?? "Apa yang ingin diobrolkan hari ini?",
				icon: TOPIC_ICONS[value] ?? "sparkles",
			},
		];
	});
}

const WEEKLY_TARGET = 4;
const TONE_TO_BADGE = {
	stable: "leaf",
	watch: "accent",
	consult: "orange",
} as const;

export default function SesiScreen() {
	const { token, survivorProfile } = useAuth();
	const survivorName = formatName(survivorProfile?.survivorNickname ?? "penyintas");

	const [sessions, setSessions] = useState<SessionHistoryItem[] | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let active = true;
		if (!token) {
			return;
		}
		(async () => {
			try {
				const loaded = await api.listSessions(token, {
					page: 1,
					page_size: 20,
				});
				if (active) {
					setSessions(loaded.data);
				}
			} catch (err) {
				if (active) {
					setError(api.errorMessage(err));
				}
			}
		})();
		return () => {
			active = false;
		};
	}, [token]);

	const recent = (sessions ?? []).slice(0, 3);
	const doneCount = (sessions ?? []).filter(
		(session) => session.completed_at,
	).length;
	const progress = Math.min(doneCount / WEEKLY_TARGET, 1);
	const topics = topicsFor(survivorProfile?.preferredTopics);

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
							<ProgressRing progress={progress}>
								<Text style={[type.display, styles.ringValue]}>
									{doneCount}
								</Text>
								<Text style={[type.small, styles.ringLabel]}>
									dari {WEEKLY_TARGET}
								</Text>
							</ProgressRing>
							<View style={styles.heroSide}>
								<Text style={[type.bodyStrong, styles.heroSideTitle]}>
									Sesi selesai
								</Text>
								<Text style={[type.small, styles.heroSideText]}>
									{doneCount} dari {WEEKLY_TARGET} sesi mingguan sudah
									tersimpan.
								</Text>
							</View>
						</View>
						<Button
							label={`Mulai sesi bersama ${survivorName}`}
							size="large"
							fullWidth
							onPress={() => router.push("/sesi-pilih")}
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
						{sessions === null && !error ? (
							<View style={styles.loadingRow}>
								<ActivityIndicator color={colors.primary} />
							</View>
						) : null}
						{error ? (
							<Text style={[type.small, styles.emptyText]}>{error}</Text>
						) : null}
						{sessions && recent.length === 0 ? (
							<Text style={[type.small, styles.emptyText]}>
								Belum ada sesi tersimpan.
							</Text>
						) : null}
						{recent.map((session) => (
							<Pressable
								key={session.id}
								accessibilityRole="button"
								accessibilityLabel={`Detail sesi ${formatSessionDate(session.completed_at)}`}
								onPress={() =>
									router.push({
										pathname: "/sesi-detail",
										params: { id: String(session.id) },
									})
								}
								style={({ pressed }) => [pressed && styles.pressed]}
							>
								<Card style={styles.sessionCard}>
									<View style={styles.sessionRow}>
										<IconBadge
											icon="session"
											tone={
												TONE_TO_BADGE[
													recallTone(session.iu_recall_percent, session.status)
												]
											}
											size={44}
										/>
										<View style={styles.sessionBody}>
											<Text style={[type.bodyStrong, styles.sessionWhen]}>
												{formatSessionDate(session.completed_at)}
											</Text>
											<Text style={[type.small, styles.sessionMeta]}>
												{session.story_title ?? "Cerita"} ·{" "}
												{recallLabel(session.iu_recall_percent)}
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
							{topics.length === 0 ? (
								<Text style={[type.small, styles.emptyText]}>
									Lengkapi topik favorit di data penyintas untuk melihat
									ide obrolan di sini.
								</Text>
							) : null}
							{topics.map((topic, index) => (
								<View
									key={topic.id}
									style={[
										styles.topicRow,
										index < topics.length - 1 &&
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
		paddingBottom: 128,
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
	loadingRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingVertical: 12,
	},
	emptyText: {
		color: colors.textSecondary,
	},
	pressed: {
		opacity: 0.7,
	},
});
