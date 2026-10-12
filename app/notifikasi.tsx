import { useRouter, type Href } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../components/Icon";
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
import {
	DUMMY_NOTIFICATIONS,
	type AppNotification,
} from "../lib/dummyData";

const ROUTES: Record<string, Href> = {
	n1: "/sesi-bercerita",
	n2: "/perkembangan",
	n3: "/laporan-dokter",
	n4: "/panduan",
	n5: "/riwayat",
	n6: "/panduan",
};

export default function NotifikasiScreen() {
	const router = useRouter();
	const [items, setItems] = useState<AppNotification[]>(() =>
		DUMMY_NOTIFICATIONS.map((entry) => ({ ...entry })),
	);

	const unreadCount = items.filter((entry) => entry.unread).length;

	const openItem = (item: AppNotification) => {
		setItems((current) =>
			current.map((entry) =>
				entry.id === item.id ? { ...entry, unread: false } : entry,
			),
		);
		const target = ROUTES[item.id];
		if (target) {
			router.push(target);
		}
	};

	const markAllRead = () => {
		setItems((current) =>
			current.map((entry) => ({ ...entry, unread: false })),
		);
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
				<View style={styles.headerText}>
					<Text style={[type.h2, styles.headerTitle]}>Notifikasi</Text>
					<Text style={[type.small, styles.headerSub]}>
						{unreadCount > 0
							? `${unreadCount} belum dibaca`
							: "Semua sudah dibaca"}
					</Text>
				</View>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Tandai semua sudah dibaca"
					onPress={markAllRead}
					disabled={unreadCount === 0}
					style={({ pressed }) => [
						styles.markAll,
						(pressed || unreadCount === 0) && styles.pressed,
					]}
				>
					<Text style={[type.small, styles.markAllText]}>Tandai dibaca</Text>
				</Pressable>
			</View>

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				{items.map((item, index) => (
					<FadeIn key={item.id} delay={index * 50}>
						<Pressable
							accessibilityRole="button"
							accessibilityLabel={`${item.title}. ${item.body}`}
							onPress={() => openItem(item)}
							style={({ pressed }) => [pressed && styles.pressed]}
						>
							<Card style={styles.card}>
								<View style={styles.row}>
									<IconBadge icon={item.icon} tone={item.tone} />
									<View style={styles.body}>
										<View style={styles.titleRow}>
											<Text
												style={[type.bodyStrong, styles.title]}
												numberOfLines={1}
											>
												{item.title}
											</Text>
											{item.unread ? <View style={styles.dot} /> : null}
										</View>
										<Text style={[type.body, styles.bodyText]}>
											{item.body}
										</Text>
										<Text style={[type.small, styles.time]}>{item.time}</Text>
									</View>
								</View>
							</Card>
						</Pressable>
					</FadeIn>
				))}
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
	headerText: {
		flex: 1,
	},
	headerTitle: {
		color: colors.textPrimary,
	},
	headerSub: {
		color: colors.textSecondary,
		marginTop: 2,
	},
	markAll: {
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: radii.pill,
		backgroundColor: colors.surface,
	},
	markAllText: {
		color: colors.primary,
		fontWeight: "600",
	},
	content: {
		paddingHorizontal: layout.screenPadding,
		paddingTop: spacing.sm,
		paddingBottom: spacing.xxxl,
	},
	card: {
		marginBottom: 12,
	},
	row: {
		flexDirection: "row",
		gap: 14,
	},
	body: {
		flex: 1,
	},
	titleRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	title: {
		color: colors.textPrimary,
		flexShrink: 1,
	},
	dot: {
		width: 9,
		height: 9,
		borderRadius: 5,
		backgroundColor: colors.primary,
	},
	bodyText: {
		color: colors.textSecondary,
		marginTop: 4,
	},
	time: {
		color: colors.textSecondary,
		marginTop: 8,
	},
	pressed: {
		opacity: 0.7,
	},
});