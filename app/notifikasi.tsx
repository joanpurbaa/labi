import { useRouter, type Href } from "expo-router";
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
import type { IconName } from "../components/Icon";
import { AppHeader } from "../components/ui/AppHeader";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { FadeIn } from "../components/ui/FadeIn";
import { IconBadge } from "../components/ui/IconBadge";
import {
	colors,
	layout,
	radii,

	spacing,
	type,
} from "../constants/theme";
import * as api from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatName } from "../lib/formatName";
import { resolveParticipantId } from "../lib/participant";
import { formatSessionDate } from "../lib/sessionDisplay";

type AppNotification = {
	id: string;
	title: string;
	body: string;
	time: string;
	icon: IconName;
	tone: "primary" | "accent" | "leaf" | "orange";
	unread: boolean;
	route: Href;
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function relativeTime(iso: string): string {
	const time = new Date(iso).getTime();
	if (!Number.isFinite(time)) {
		return formatSessionDate(iso);
	}
	const days = Math.floor((Date.now() - time) / DAY_MS);
	if (days <= 0) {
		return "Hari ini";
	}
	if (days === 1) {
		return "Kemarin";
	}
	if (days < 7) {
		return `${days} hari lalu`;
	}
	return formatSessionDate(iso);
}

function buildNotifications(
	survivorName: string,
	sessions: api.SessionHistoryItem[],
	deltaRecall: number | null,
): AppNotification[] {
	const completed = sessions.filter((session) => session.completed_at);
	const items: AppNotification[] = [];
	if (completed.length === 0) {
		items.push({
			id: "welcome",
			title: "Selamat datang di LABI",
			body: `Mulai sesi bercerita pertama bersama ${survivorName}, kapan pun ia siap.`,
			time: "Baru saja",
			icon: "heart",
			tone: "primary",
			unread: true,
			route: "/sesi-pilih",
		});
		return items;
	}
	const last = completed[0];
	const lastTime = new Date(last.completed_at as string).getTime();
	const daysSince = Number.isFinite(lastTime)
		? Math.floor((Date.now() - lastTime) / DAY_MS)
		: 0;
	if (daysSince >= 7) {
		items.push({
			id: "nudge",
			title: "Waktunya sesi",
			body: `Sudah ${daysSince} hari sejak sesi terakhir bersama ${survivorName}. Ajak bercerita hari ini.`,
			time: relativeTime(last.completed_at as string),
			icon: "session",
			tone: "primary",
			unread: true,
			route: "/sesi-pilih",
		});
	}
	items.push({
		id: "last",
		title: "Sesi selesai dicatat",
		body: `Sesi ${formatSessionDate(last.completed_at)} tersimpan untuk ${survivorName}.`,
		time: relativeTime(last.completed_at as string),
		icon: "check",
		tone: "primary",
		unread: daysSince <= 1,
		route: "/riwayat",
	});
	if (deltaRecall !== null && deltaRecall < -3) {
		items.push({
			id: "trend",
			title: "Perubahan perlu perhatian",
			body: `Ingatan turun ${Math.abs(Math.round(deltaRecall))}% dibanding awal. Lihat perkembangannya.`,
			time: relativeTime(last.completed_at as string),
			icon: "chart",
			tone: "orange",
			unread: true,
			route: "/perkembangan",
		});
	}
	const weekly = completed.filter((session) => {
		const time = new Date(session.completed_at as string).getTime();
		return Number.isFinite(time) && Date.now() - time < WEEK_MS;
	});
	if (weekly.length > 0) {
		items.push({
			id: "weekly",
			title: "Ringkasan mingguan siap",
			body: `${weekly.length} sesi minggu ini sudah tercatat. Lihat perkembangannya.`,
			time: relativeTime(last.completed_at as string),
			icon: "chart",
			tone: "accent",
			unread: true,
			route: "/perkembangan",
		});
	}
	return items;
}

export default function NotifikasiScreen() {
	const router = useRouter();
	const { token, user, survivorProfile } = useAuth();
	const [items, setItems] = useState<AppNotification[] | null>(null);

	const survivorName = formatName(
		survivorProfile?.survivorNickname ?? "penyintas",
	);

	useEffect(() => {
		let active = true;
		if (!token || !user) {
			return;
		}
		(async () => {
			try {
				const participantId = await resolveParticipantId(token, user.id);
				const [sessions, trend] = await Promise.all([
					api.listSessions(token, {
						...(participantId === null ? {} : { participant_id: participantId }),
						page: 1,
						page_size: 20,
					}),
					participantId === null
						? Promise.resolve(null)
						: api.getParticipantTrend(token, participantId).catch(() => null),
				]);
				const baseline = trend?.baseline?.iu_recall_percent ?? null;
				const latest = trend?.latest?.iu_recall_percent ?? null;
				const delta =
					baseline !== null && latest !== null ? latest - baseline : null;
				if (active) {
					setItems(buildNotifications(survivorName, sessions.data, delta));
				}
			} catch {
				if (active) {
					setItems([]);
				}
			}
		})();
		return () => {
			active = false;
		};
	}, [token, user, survivorName]);

	const unreadCount = (items ?? []).filter((entry) => entry.unread).length;

	const openItem = (item: AppNotification) => {
		setItems((current) =>
			(current ?? []).map((entry) =>
				entry.id === item.id ? { ...entry, unread: false } : entry,
			),
		);
		router.push(item.route);
	};

	const markAllRead = () => {
		setItems((current) =>
			(current ?? []).map((entry) => ({ ...entry, unread: false })),
		);
	};

	return (
		<SafeAreaView style={styles.safe} edges={["top"]}>
			<AppHeader
				title="Notifikasi"
				subtitle={
					unreadCount > 0 ? `${unreadCount} belum dibaca` : "Semua sudah dibaca"
				}
				onBack={() => router.back()}
				action={
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
				}
			/>

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				{items === null ? (
					<View style={styles.loadingRow}>
						<ActivityIndicator color={colors.primary} />
					</View>
				) : null}

				{items !== null && items.length === 0 ? (
					<EmptyState
						title="Belum ada notifikasi"
						description="Notifikasi akan muncul berdasarkan aktivitas sesi pendampingan."
					/>
				) : null}

				{(items ?? []).map((item, index) => (
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
	markAll: {
		minHeight: 44,
		justifyContent: "center",
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
	loadingRow: {
		paddingVertical: 32,
		alignItems: "center",
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
