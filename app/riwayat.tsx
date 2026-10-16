import { useRouter } from "expo-router";
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
import { Icon, type IconName } from "../components/Icon";
import { AppHeader } from "../components/ui/AppHeader";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { FadeIn } from "../components/ui/FadeIn";
import { StatusChip } from "../components/ui/StatusChip";
import {
	colors,
	layout,
	radii,

	spacing,
	type,
} from "../constants/theme";
import * as api from "../lib/api";
import type { SessionHistoryItem } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatName } from "../lib/formatName";
import { formatSessionDate, recallLabel, recallTone } from "../lib/sessionDisplay";

const PAGE_SIZE = 20;

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
	const { token, survivorProfile } = useAuth();
	const survivorName = formatName(survivorProfile?.survivorNickname ?? "penyintas");

	const [sessions, setSessions] = useState<SessionHistoryItem[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);

	useEffect(() => {
		let active = true;
		if (!token) {
			return;
		}
		(async () => {
			try {
				const loaded = await api.listSessions(token, {
					page: 1,
					page_size: PAGE_SIZE,
				});
				if (active) {
					setSessions(loaded.data);
					setPage(1);
					setHasMore(Boolean(loaded.pagination.has_next));
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

	const loadMore = async () => {
		if (!token || loadingMore || !hasMore) {
			return;
		}
		setLoadingMore(true);
		try {
			const nextPage = page + 1;
			const loaded = await api.listSessions(token, {
				page: nextPage,
				page_size: PAGE_SIZE,
			});
			setSessions((current) => [...(current ?? []), ...loaded.data]);
			setPage(nextPage);
			setHasMore(Boolean(loaded.pagination.has_next));
		} catch (err) {
			setError(api.errorMessage(err));
		} finally {
			setLoadingMore(false);
		}
	};

	const loading = sessions === null && error === null;

	return (
		<SafeAreaView style={styles.safe} edges={["top"]}>
			<AppHeader title="Riwayat sesi" onBack={() => router.back()} />

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<Text style={[type.body, styles.intro]}>
					Inilah catatan sesi bercerita {survivorName}.
				</Text>

				{error ? (
					<View style={styles.error}>
						<Icon name="info" size={18} color={colors.danger} />
						<Text style={[type.body, styles.errorText]}>{error}</Text>
					</View>
				) : null}

				{loading ? (
					<View style={styles.loading}>
						<ActivityIndicator color={colors.primary} />
					</View>
				) : null}

				{sessions && sessions.length === 0 ? (
					<EmptyState
						photo="lansia3"
						title="Belum ada catatan"
						description="Setelah sesi pertama, ringkasan sesi akan muncul di sini."
					/>
				) : null}

				{sessions
					? sessions.map((item, index) => (
							<FadeIn key={item.id} delay={index * 60}>
								<Pressable
									accessibilityRole="button"
									accessibilityLabel={`Detail sesi ${formatSessionDate(item.completed_at)}`}
									onPress={() =>
										router.push({
											pathname: "/sesi-detail",
											params: { id: String(item.id) },
										})
									}
									style={({ pressed }) => [pressed && styles.pressed]}
								>
									<Card style={styles.sessionCard}>
										<View style={styles.sessionTop}>
											<View style={styles.sessionHead}>
												<Text style={[type.bodyStrong, styles.sessionWhen]}>
													{formatSessionDate(item.completed_at)}
												</Text>
												<Text style={[type.small, styles.sessionStory]}>
													{item.story_title ?? "Cerita"}
												</Text>
											</View>
											<View style={styles.sessionEnd}>
												<StatusChip
													tone={recallTone(item.iu_recall_percent, item.status)}
													label={recallLabel(item.iu_recall_percent)}
												/>
												<Icon
													name="chevron"
													size={18}
													color={colors.textSecondary}
												/>
											</View>
										</View>

										<View style={styles.chipRow}>
											<ContextChip
												icon="book"
												label={item.story_title ?? "Cerita"}
											/>
											{item.has_recording ? (
												<ContextChip icon="mic" label="Ada rekaman" />
											) : null}
										</View>
									</Card>
								</Pressable>
							</FadeIn>
						))
					: null}

				{hasMore ? (
					<Button
						label={loadingMore ? "Memuat…" : "Muat lebih banyak"}
						variant="ghost"
						fullWidth
						loading={loadingMore}
						onPress={loadMore}
						style={styles.loadMore}
					/>
				) : null}

				<View style={styles.note}>
					<Icon name="info" size={16} color={colors.textSecondary} />
					<Text style={[type.small, styles.noteText]}>
						Catatan ini merangkum sesi bercerita yang sudah selesai.
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
	content: {
		paddingHorizontal: layout.screenPadding,
		paddingBottom: spacing.xxxl,
	},
	intro: {
		color: colors.textSecondary,
		marginBottom: 16,
	},
	loading: {
		paddingVertical: spacing.xxxl,
		alignItems: "center",
	},
	error: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 8,
		padding: 14,
		borderRadius: radii.cardSmall,
		backgroundColor: colors.dangerSoft,
		marginBottom: spacing.lg,
	},
	errorText: {
		flex: 1,
		color: colors.danger,
	},
	sessionCard: {
		marginBottom: 12,
	},
	sessionTop: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 12,
	},
	sessionHead: {
		flex: 1,
		minWidth: 0,
	},
	sessionEnd: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	sessionWhen: {
		color: colors.textPrimary,
	},
	sessionStory: {
		color: colors.textSecondary,
		marginTop: 2,
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
	loadMore: {
		marginTop: 12,
	},
	noteText: {
		color: colors.textSecondary,
		flexShrink: 1,
	},
	pressed: {
		opacity: 0.7,
	},
});
