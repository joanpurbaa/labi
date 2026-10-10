import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon, type IconName } from "../components/Icon";
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
import { useAuth } from "../lib/auth";

type SessionItem = {
	id: string;
	when: string;
	duration: string;
	mood: string;
	sleep: string;
	tone: StatusTone;
	status: string;
};

const SESSIONS: SessionItem[] = [
	{
		id: "s4",
		when: "Minggu ini · 5 Okt",
		duration: "3 menit",
		mood: "Tenang",
		sleep: "Nyenyak",
		tone: "stable",
		status: "Sesuai kebiasaan",
	},
	{
		id: "s3",
		when: "28 Sep",
		duration: "3 menit",
		mood: "Lelah",
		sleep: "Kurang",
		tone: "watch",
		status: "Perlu dicermati",
	},
	{
		id: "s2",
		when: "21 Sep",
		duration: "2 menit",
		mood: "Senang",
		sleep: "Cukup",
		tone: "stable",
		status: "Sesuai kebiasaan",
	},
	{
		id: "s1",
		when: "14 Sep",
		duration: "3 menit",
		mood: "Cemas",
		sleep: "Sulit tidur",
		tone: "consult",
		status: "Bisa dibawa ke dokter",
	},
];

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
	const survivorName = survivorProfile?.survivorNickname ?? "penyintas";

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

				{SESSIONS.map((item, index) => (
					<FadeIn key={item.id} delay={index * 60}>
						<Card style={styles.sessionCard}>
							<View style={styles.sessionTop}>
								<View>
									<Text style={[type.bodyStrong, styles.sessionWhen]}>
										{item.when}
									</Text>
									<View style={styles.durationRow}>
										<Icon name="clock" size={14} color={colors.textSecondary} />
										<Text style={[type.small, styles.durationText]}>
											{item.duration}
										</Text>
									</View>
								</View>
								<StatusChip tone={item.tone} label={item.status} />
							</View>

							<View style={styles.chipRow}>
								<ContextChip icon="smile" label={`Mood: ${item.mood}`} />
								<ContextChip icon="moon" label={`Tidur: ${item.sleep}`} />
							</View>
						</Card>
					</FadeIn>
				))}

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
