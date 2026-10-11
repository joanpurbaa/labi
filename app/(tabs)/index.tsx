import { router, type Href } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "../../components/ui/AppText";
import { Icon } from "../../components/Icon";
import { Icon3D, type Icon3DName } from "../../components/icons/Icon3D";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { FadeIn } from "../../components/ui/FadeIn";
import { Illustration } from "../../components/ui/Illustration";
import { PageHeader } from "../../components/ui/PageHeader";
import { Photo } from "../../components/photo/Photo";
import { Mascot } from "../../components/mascot/Mascot";
import { ProgressRing } from "../../components/ui/ProgressRing";
import {
	colors,
	layout,
	spacing,
	type,
} from "../../constants/theme";
import { useAuth } from "../../lib/auth";
import { WEEKLY_PROGRESS, WEEKLY_SUMMARY } from "../../lib/dummyData";
import { formatName } from "../../lib/formatName";
import { getGreeting } from "../../lib/greeting";
import { mascotForHome } from "../../lib/mascotMood";

type QuickAction = {
	key: string;
	label: string;
	threeD: Icon3DName;
	tile: string;
	route: Href;
};

const QUICK_ACTIONS: QuickAction[] = [
	{
		key: "start",
		label: "Mulai sesi",
		threeD: "studio-microphone",
		tile: colors.primarySoft,
		route: "/sesi-bercerita",
	},
	{
		key: "history",
		label: "Riwayat",
		threeD: "spiral-calendar",
		tile: colors.orangeSoft,
		route: "/riwayat",
	},
	{
		key: "progress",
		label: "Perkembangan",
		threeD: "bar-chart",
		tile: colors.marigoldSoft,
		route: "/perkembangan",
	},
	{
		key: "guide",
		label: "Panduan",
		threeD: "open-book",
		tile: colors.leafSoft,
		route: "/panduan",
	},
];

function QuickTile({
	action,
	onPress,
}: {
	action: QuickAction;
	onPress: () => void;
}) {
	const reduceMotion = useReducedMotion();
	const press = useSharedValue(0);

	const tileStyle = useAnimatedStyle(() => ({
		transform: [
			{ translateY: -2 * press.value },
			{ rotate: `${3 * press.value}deg` },
		],
	}));

	const pressIn = () => {
		if (!reduceMotion) {
			press.value = withSpring(1, { damping: 12, stiffness: 320 });
		}
	};
	const pressOut = () => {
		if (!reduceMotion) {
			press.value = withSpring(0, { damping: 12, stiffness: 320 });
		}
	};

	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={action.label}
			onPress={onPress}
			onPressIn={pressIn}
			onPressOut={pressOut}
			style={({ pressed }) => [styles.quickItem, pressed && styles.pressed]}
		>
			<Animated.View
				style={[
					styles.quickTile,
					{ backgroundColor: action.tile },
					tileStyle,
				]}
			>
				<Icon3D name={action.threeD} size={56} />
			</Animated.View>
			<AppText
				style={[styles.quickLabel]}
				numberOfLines={1}
				adjustsFontSizeToFit
				minimumFontScale={0.85}
			>
				{action.label}
			</AppText>
		</Pressable>
	);
}

export default function HomeScreen() {
	const { user, survivorProfile } = useAuth();

	const survivorName = formatName(
		survivorProfile?.survivorNickname ?? "orang yang kamu dampingi",
	);
	const companionName = formatName(user?.name ?? "Pendamping");
	const homeMascot = mascotForHome(WEEKLY_SUMMARY.tone);

	const handleQuickAction = (action: QuickAction) => {
		router.push(action.route);
	};

	return (
		<SafeAreaView style={styles.safe} edges={["top"]}>
			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<FadeIn>
					<PageHeader
						avatarName={companionName}
						greeting={getGreeting()}
						name={companionName}
						onPressNotification={() => router.push("/notifikasi")}
					/>
				</FadeIn>

				<FadeIn delay={60}>
					<Card variant="hero" style={styles.heroCard}>
						<View
							pointerEvents="none"
							accessibilityElementsHidden
							importantForAccessibility="no-hide-descendants"
							style={styles.heroSparkles}
						>
							<Icon3D name="sparkles" size={40} />
						</View>
						<View style={styles.heroMascot}>
							<Mascot expression={homeMascot} size={88} />
						</View>
						<Text style={[type.h2, styles.heroTitle]}>
							{survivorName} hari ini
						</Text>
						<Text style={[type.body, styles.heroDescription]}>
							Sempatkan bercerita bersama, lalu catat sebentar bagaimana
							keadaannya.
						</Text>

						<View style={styles.ringRow}>
							<ProgressRing
								progress={WEEKLY_PROGRESS.done / WEEKLY_PROGRESS.target}
								size={124}
							>
								<Text style={[type.h1, styles.ringValue]}>
									{WEEKLY_PROGRESS.done}
								</Text>
								<Text style={[type.small, styles.ringLabel]}>
									dari {WEEKLY_PROGRESS.target} sesi
								</Text>
							</ProgressRing>
							<View style={styles.ringSide}>
								<Text style={[type.bodyStrong, styles.ringSideTitle]}>
									Sesi minggu ini
								</Text>
								<Text style={[type.body, styles.ringSideText]}>
									{WEEKLY_PROGRESS.done} dari {WEEKLY_PROGRESS.target} sesi
									selesai. Satu sesi lagi untuk mencapai target.
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
						<View style={styles.quickGrid}>
							{QUICK_ACTIONS.map((action) => (
								<QuickTile
									key={action.key}
									action={action}
									onPress={() => handleQuickAction(action)}
								/>
							))}
						</View>
					</View>
				</FadeIn>

				<FadeIn delay={180}>
					<View style={styles.section}>
						<Text style={[type.h3, styles.sectionTitle]}>
							Ringkasan minggu ini
						</Text>
						<Card>
							<View style={styles.summaryBody}>
								<Text style={[type.bodyStrong, styles.summaryTitle]}>
									{WEEKLY_SUMMARY.title}
								</Text>
								<Text style={[type.body, styles.summaryText]}>
									{WEEKLY_SUMMARY.body}
								</Text>
								<View style={styles.summaryStat}>
									<Icon name="sparkles" size={14} color={colors.primary} />
									<Text style={[type.small, styles.summaryStatText]}>
										{WEEKLY_SUMMARY.status}
									</Text>
								</View>
							</View>
							<View style={styles.summaryIllustration}>
								<Illustration name="journey" size={136} />
							</View>
						</Card>
					</View>
				</FadeIn>

				<FadeIn delay={240}>
					<View style={styles.section}>
						<Text style={[type.h3, styles.sectionTitle]}>
							Persiapan konsultasi
						</Text>
						<Photo
							photo="lansia10"
							radius="lg"
							height={150}
							label
							style={styles.prepPhoto}
						/>
						<Card style={styles.doctorCard}>
							<View style={styles.doctorRow}>
								<View
									style={[
										styles.doctorTile,
										{ backgroundColor: colors.primarySoft },
									]}
								>
									<Icon3D name="memo" size={44} />
								</View>
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
								onPress={() => router.push("/pertanyaan-dokter")}
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
								<View
									style={[
										styles.doctorTile,
										{ backgroundColor: colors.leafSoft },
									]}
								>
									<Icon3D name="clipboard" size={44} />
								</View>
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
								onPress={() => router.push("/laporan-dokter")}
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
		paddingBottom: 88,
	},
	heroCard: {
		marginTop: 20,
	},
	heroSparkles: {
		position: "absolute",
		top: 14,
		right: 16,
	},
	heroMascot: {
		alignSelf: "center",
		marginBottom: 4,
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
	quickGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 14,
	},
	quickItem: {
		width: "47.5%",
		alignItems: "center",
		justifyContent: "center",
		gap: 10,
		minHeight: 96,
	},
	quickTile: {
		width: 84,
		height: 84,
		borderRadius: 32,
		alignItems: "center",
		justifyContent: "center",
	},
	quickLabel: {
		color: colors.textPrimary,
		textAlign: "center",
	},
	pressed: {
		opacity: 0.65,
	},
	summaryBody: {
		alignSelf: "stretch",
	},
	summaryTitle: {
		color: colors.textPrimary,
	},
	summaryText: {
		color: colors.textSecondary,
		marginTop: 6,
	},
	summaryStat: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		marginTop: 10,
	},
	summaryStatText: {
		color: colors.primary,
		fontWeight: "600",
	},
	summaryIllustration: {
		alignItems: "center",
		marginTop: 16,
	},
	doctorCard: {
		marginBottom: 12,
	},
	prepPhoto: {
		marginBottom: 16,
	},
	doctorRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 14,
	},
	doctorTile: {
		width: 60,
		height: 60,
		borderRadius: 30,
		alignItems: "center",
		justifyContent: "center",
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
});
