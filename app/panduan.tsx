import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../components/Icon";
import { Photo } from "../components/photo/Photo";
import type { PhotoKey } from "../components/photo/photoRegistry";
import { Mascot } from "../components/mascot/Mascot";
import { Card } from "../components/ui/Card";
import { FadeIn } from "../components/ui/FadeIn";
import {
	colors,
	layout,
	radii,
	shadows,
	spacing,
	type,
} from "../constants/theme";

type Article = {
	id: string;
	title: string;
	body: string;
	photo?: PhotoKey;
	companionOnly?: boolean;
};

const ARTICLES: Article[] = [
	{
		id: "conversation",
		title: "Memulai percakapan nyaman",
		body: "Pilih waktu yang tenang dan mulai dari hal kecil yang akrab, agar obrolan terasa ringan.",
		photo: "lansia3",
	},
	{
		id: "topics",
		title: "Kegiatan yang enak diobrolkan",
		body: "Angkat kegiatan sehari-hari atau hobi sederhana agar percakapan mengalir sendiri.",
		photo: "lansia5",
	},
	{
		id: "doctor",
		title: "Menemani saat ke dokter",
		body: "Catat pertanyaan dan perubahan yang terlihat, agar tidak terlewat saat bertemu.",
		photo: "lansia10",
	},
	{
		id: "walking",
		title: "Mendampingi saat berjalan",
		body: "Berjalan pelan bersama menjaga keseimbangan dan membuat percakapan terasa ringan.",
	},
	{
		id: "anxious",
		title: "Saat lansia tampak cemas",
		body: "Dampingi dengan tenang, dengar tanpa menghakimi, dan beri waktu sebelum bertanya lagi.",
		photo: "lansia4",
		companionOnly: true,
	},
];

const HOBBY_TILES: { photo: PhotoKey; label: string }[] = [
	{ photo: "lansia3", label: "Bermain catur" },
	{ photo: "lansia5", label: "Main rubik" },
];

export default function PanduanScreen() {
	const router = useRouter();

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
				<Text style={[type.h2, styles.headerTitle]}>Panduan</Text>
			</View>

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<Text style={[type.body, styles.intro]}>
					Cara sederhana menemani percakapan sehari-hari bersama lansia.
				</Text>

				<Mascot
					expression="menenangkan"
					size={96}
					decorative
					style={styles.introMascot}
				/>

				{ARTICLES.map((article, index) => (
					<FadeIn key={article.id} delay={index * 60}>
						<Card style={styles.articleCard}>
							<View style={styles.articleRow}>
								{article.photo ? (
									<View style={styles.thumb}>
										<Photo photo={article.photo} radius="sm" height={72} />
									</View>
								) : null}
								<View style={styles.articleBody}>
									<Text style={[type.bodyStrong, styles.articleTitle]}>
										{article.title}
									</Text>
									<Text style={[type.body, styles.articleText]}>
										{article.body}
									</Text>
								</View>
							</View>
						</Card>
					</FadeIn>
				))}

				<View style={styles.section}>
					<Text style={[type.h3, styles.sectionTitle]}>
						Ide kegiatan untuk diobrolkan
					</Text>
					<View style={styles.hobbyRow}>
						{HOBBY_TILES.map((tile) => (
							<View key={tile.label} style={styles.hobbyItem}>
								<View style={styles.hobbyThumb}>
									<Photo photo={tile.photo} radius="sm" height={72} label />
								</View>
								<Text style={[type.small, styles.hobbyLabel]}>
									{tile.label}
								</Text>
							</View>
						))}
					</View>
				</View>

				<View style={styles.note}>
					<Icon name="info" size={16} color={colors.textSecondary} />
					<Text style={[type.small, styles.noteText]}>
						Panduan ini bersifat umum. Ikuti anjuran dokter untuk kebutuhan
						khusus.
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
	introMascot: {
		alignSelf: "center",
		marginBottom: 16,
	},
	articleCard: {
		marginBottom: 12,
	},
	articleRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
	},
	thumb: {
		width: 96,
	},
	articleBody: {
		flex: 1,
	},
	articleTitle: {
		color: colors.textPrimary,
	},
	articleText: {
		color: colors.textSecondary,
		marginTop: 4,
	},
	section: {
		marginTop: spacing.xxl,
	},
	sectionTitle: {
		color: colors.textPrimary,
		marginBottom: 14,
	},
	hobbyRow: {
		flexDirection: "row",
		gap: 16,
	},
	hobbyItem: {
		alignItems: "center",
	},
	hobbyThumb: {
		width: 72,
	},
	hobbyLabel: {
		color: colors.textSecondary,
		marginTop: 8,
		textAlign: "center",
	},
	note: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 8,
		marginTop: 24,
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