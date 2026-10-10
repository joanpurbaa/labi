import { router, type Href } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon, type IconName } from "../../components/Icon";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { FadeIn } from "../../components/ui/FadeIn";
import { IconBadge, type BadgeTone } from "../../components/ui/IconBadge";
import { Illustration } from "../../components/ui/Illustration";
import { PageHeader } from "../../components/ui/PageHeader";
import { ProgressRing } from "../../components/ui/ProgressRing";
import {
	colors,
	layout,
	radii,
	shadows,
	spacing,
	type,
} from "../../constants/theme";
import { useAuth } from "../../lib/auth";
import { getGreeting } from "../../lib/greeting";

type QuickAction = {
	key: string;
	label: string;
	icon: IconName;
	tone: BadgeTone;
	route?: Href;
	message?: string;
};

const QUICK_ACTIONS: QuickAction[] = [
	{
		key: "start",
		label: "Mulai sesi",
		icon: "mic",
		tone: "primary",
		route: "/sesi-bercerita",
	},
	{
		key: "history",
		label: "Riwayat",
		icon: "history",
		tone: "accent",
		route: "/riwayat",
	},
	{
		key: "progress",
		label: "Perkembangan",
		icon: "chart",
		tone: "mint",
		route: "/perkembangan",
	},
	{
		key: "guide",
		label: "Panduan",
		icon: "book",
		tone: "warm",
		message: "Panduan penggunaan segera hadir.",
	},
];

export default function HomeScreen() {
	const { user, survivorProfile } = useAuth();
	const [notice, setNotice] = useState<string | null>(null);
	const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const survivorName = survivorProfile?.survivorNickname ?? "orang yang kamu dampingi";
	const companionName = user?.name ?? "Pendamping";

	const showNotice = useCallback((message: string) => {
		setNotice(message);
		if (noticeTimer.current) {
			clearTimeout(noticeTimer.current);
		}
		noticeTimer.current = setTimeout(() => setNotice(null), 2600);
	}, []);

	useEffect(() => {
		return () => {
			if (noticeTimer.current) {
				clearTimeout(noticeTimer.current);
			}
		};
	}, []);

	const handleQuickAction = useCallback(
		(action: QuickAction) => {
			if (action.route) {
				router.push(action.route);
				return;
			}
			if (action.message) {
				showNotice(action.message);
			}
		},
		[showNotice],
	);

	return (
		<SafeAreaView style={styles.safe} edges={["top"]}>
			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<FadeIn>
					<PageHeader
						avatarName={survivorName}
						greeting={getGreeting()}
						name={companionName}
						onPressNotification={() =>
							showNotice("Belum ada notifikasi baru.")
						}
					/>
				</FadeIn>

				<FadeIn delay={60}>
					<Card variant="hero" style={styles.heroCard}>
						<Text style={[type.h2, styles.heroTitle]}>
							{survivorName} hari ini
						</Text>
						<Text style={[type.body, styles.heroDescription]}>
							Sempatkan bercerita bersama, lalu catat sebentar bagaimana
							keadaannya.
						</Text>

						<View style={styles.ringRow}>
							<ProgressRing progress={0} size={124}>
								<Text style={[type.h1, styles.ringValue]}>0</Text>
								<Text style={[type.small, styles.ringLabel]}>
									dari 1 sesi
								</Text>
							</ProgressRing>
							<View style={styles.ringSide}>
								<Text style={[type.bodyStrong, styles.ringSideTitle]}>
									Sesi minggu ini
								</Text>
								<Text style={[type.body, styles.ringSideText]}>
									Belum ada sesi minggu ini. Yuk, mulai bercerita bersama.
								</Text>
							</View>
						</View>

						<Button
							label={`Mulai sesi bersama ${survivorName}`}
							onPress={() => router.push("/sesi-bercerita")}
							fullWidth
							style={styles.heroButton}
						/>
					</Card>
				</FadeIn>

				<FadeIn delay={120}>
					<View style={styles.section}>
						<Text style={[type.h3, styles.sectionTitle]}>Akses cepat</Text>
						<View style={styles.quickRow}>
							{QUICK_ACTIONS.map((action) => (
								<Pressable
									key={action.key}
									accessibilityRole="button"
									accessibilityLabel={action.label}
									onPress={() => handleQuickAction(action)}
									style={({ pressed }) => [
										styles.quickItem,
										pressed && styles.pressed,
									]}
								>
									<IconBadge icon={action.icon} tone={action.tone} size={54} />
									<Text style={[type.small, styles.quickLabel]}>
										{action.label}
									</Text>
								</Pressable>
							))}
						</View>
					</View>
				</FadeIn>

				<FadeIn delay={180}>
					<View style={styles.section}>
						<Text style={[type.h3, styles.sectionTitle]}>
							Ringkasan minggu ini
						</Text>
						<Card style={styles.summaryCard}>
							<View style={styles.summaryBody}>
								<Text style={[type.bodyStrong, styles.summaryTitle]}>
									Belum ada gambaran minggu ini
								</Text>
								<Text style={[type.body, styles.summaryText]}>
									Setelah sesi pertama, di sini akan muncul gambaran
									perubahan cara bicara {survivorName}.
								</Text>
							</View>
							<Illustration name="journey" size={132} />
						</Card>
					</View>
				</FadeIn>

				<FadeIn delay={240}>
					<View style={styles.section}>
						<Text style={[type.h3, styles.sectionTitle]}>
							Persiapan konsultasi
						</Text>
						<Card style={styles.doctorCard}>
							<View style={styles.doctorRow}>
								<IconBadge icon="doc" tone="primary" size={48} />
								<View style={styles.doctorBody}>
									<Text style={[type.bodyStrong, styles.doctorTitle]}>
										Pertanyaan untuk dokter
									</Text>
									<Text style={[type.body, styles.doctorText]}>
										Kumpulkan hal yang ingin kamu tanyakan, agar tidak
										terlupa saat bertemu.
									</Text>
								</View>
							</View>
							<Pressable
								accessibilityRole="button"
								accessibilityLabel="Lihat daftar pertanyaan"
								onPress={() =>
									showNotice("Daftar pertanyaan tersedia setelah sesi pertama.")
								}
								style={({ pressed }) => [
									styles.linkRow,
									pressed && styles.pressed,
								]}
							>
								<Text style={[type.bodyStrong, styles.link]}>
									Lihat daftar pertanyaan
								</Text>
								<Icon name="chevron" size={16} color={colors.primary} />
							</Pressable>
						</Card>

						<Card style={styles.doctorCard}>
							<View style={styles.doctorRow}>
								<IconBadge icon="book" tone="mint" size={48} />
								<View style={styles.doctorBody}>
									<Text style={[type.bodyStrong, styles.doctorTitle]}>
										Laporan untuk dokter
									</Text>
									<Text style={[type.body, styles.doctorText]}>
										Ringkasan perjalanan bicara {survivorName} yang bisa dibawa
										saat berkonsultasi.
									</Text>
								</View>
							</View>
							<Pressable
								accessibilityRole="button"
								accessibilityLabel="Lihat laporan"
								onPress={() =>
									showNotice("Laporan tersedia setelah sesi pertama.")
								}
								style={({ pressed }) => [
									styles.linkRow,
									pressed && styles.pressed,
								]}
							>
								<Text style={[type.bodyStrong, styles.link]}>
									Lihat laporan
								</Text>
								<Icon name="chevron" size={16} color={colors.primary} />
							</Pressable>
						</Card>
					</View>
				</FadeIn>
			</ScrollView>

			{notice ? (
				<View
					style={styles.notice}
					accessibilityLiveRegion="polite"
					pointerEvents="none"
				>
					<Text style={[type.body, styles.noticeText]}>{notice}</Text>
				</View>
			) : null}
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
		paddingTop: 8,
		paddingBottom: 28,
	},
	heroCard: {
		marginTop: 20,
	},
	heroTitle: {
		color: colors.textPrimary,
	},
	heroDescription: {
		color: colors.textSecondary,
		marginTop: 6,
	},
	ringRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 18,
		marginTop: 20,
	},
	ringValue: {
		color: colors.primary,
	},
	ringLabel: {
		color: colors.textSecondary,
	},
	ringSide: {
		flex: 1,
	},
	ringSideTitle: {
		color: colors.textPrimary,
	},
	ringSideText: {
		color: colors.textSecondary,
		marginTop: 4,
	},
	heroButton: {
		marginTop: 20,
	},
	section: {
		marginTop: spacing.xxl,
	},
	sectionTitle: {
		color: colors.textPrimary,
		marginBottom: 14,
	},
	quickRow: {
		flexDirection: "row",
		gap: 8,
	},
	quickItem: {
		flex: 1,
		alignItems: "center",
		minHeight: 48,
		gap: 8,
	},
	quickLabel: {
		color: colors.textPrimary,
		textAlign: "center",
	},
	pressed: {
		opacity: 0.65,
	},
	summaryCard: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 12,
	},
	summaryBody: {
		flex: 1,
	},
	summaryTitle: {
		color: colors.textPrimary,
	},
	summaryText: {
		color: colors.textSecondary,
		marginTop: 6,
	},
	doctorCard: {
		marginBottom: 12,
	},
	doctorRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 14,
	},
	doctorBody: {
		flex: 1,
	},
	doctorTitle: {
		color: colors.textPrimary,
	},
	doctorText: {
		color: colors.textSecondary,
		marginTop: 4,
	},
	linkRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		marginTop: 14,
		minHeight: 24,
		alignSelf: "flex-start",
	},
	link: {
		color: colors.primary,
	},
	notice: {
		position: "absolute",
		left: layout.screenPadding,
		right: layout.screenPadding,
		bottom: 16,
		backgroundColor: colors.textPrimary,
		borderRadius: radii.input,
		paddingVertical: 14,
		paddingHorizontal: 16,
		...shadows.card,
	},
	noticeText: {
		color: colors.surface,
	},
});
