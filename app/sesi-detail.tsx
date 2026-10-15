import { useLocalSearchParams, useRouter } from "expo-router";
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
import { Icon } from "../components/Icon";
import { Mascot } from "../components/mascot/Mascot";
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
import * as api from "../lib/api";
import type { ResultRead, SessionRead } from "../lib/api";
import { useAuth } from "../lib/auth";
import { statusToExpression } from "../lib/mascotMood";
import {
	formatSessionDate,
	recallLabel,
	recallTone,
	resultItemLabel,
	resultItemTone,
} from "../lib/sessionDisplay";

export default function SesiDetailScreen() {
	const router = useRouter();
	const { token } = useAuth();
	const { id } = useLocalSearchParams<{ id?: string }>();
	const numericSessionId = Number(id);

	const [session, setSession] = useState<SessionRead | null>(null);
	const [result, setResult] = useState<ResultRead | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [ready, setReady] = useState(false);

	const hasValidId = Boolean(token) && Number.isFinite(numericSessionId);

	useEffect(() => {
		if (!token || !Number.isFinite(numericSessionId)) {
			return;
		}
		let active = true;
		(async () => {
			try {
				const loaded = await api.getSession(token, numericSessionId);
				if (!active) {
					return;
				}
				setSession(loaded);
				if (loaded.status !== "completed") {
					return;
				}
				const resultData = await api
					.getResult(token, numericSessionId)
					.catch(() => null);
				if (active && resultData) {
					setResult(resultData);
				}
			} catch (err) {
				if (active) {
					setError(api.errorMessage(err));
				}
			} finally {
				if (active) {
					setReady(true);
				}
			}
		})();
		return () => {
			active = false;
		};
	}, [token, numericSessionId]);

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
				<Text style={[type.h2, styles.headerTitle]}>Detail sesi</Text>
			</View>

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				{!hasValidId ? (
					<EmptyState
						title="Sesi tidak ditemukan"
						description="Catatan sesi ini tidak tersedia. Kembali ke Riwayat untuk memilih sesi lain."
					/>
				) : null}

				{error ? (
					<View style={styles.error}>
						<Icon name="info" size={18} color={colors.danger} />
						<Text style={[type.body, styles.errorText]}>{error}</Text>
					</View>
				) : null}

				{hasValidId && !ready && !error ? (
					<View style={styles.loading}>
						<ActivityIndicator color={colors.primary} />
					</View>
				) : null}

				{session ? (
					<>
						<FadeIn>
							<Card>
								<View style={styles.topRow}>
									<Mascot
										expression={statusToExpression(
											recallTone(result?.iu_recall_percent, session.status),
										)}
										size={48}
									/>
									<View style={styles.dateBlock}>
										<Text style={[type.bodyStrong, styles.when]}>
											{formatSessionDate(session.created_at)}
										</Text>
										<Text style={[type.small, styles.date]}>
											{result?.story_title ?? "Cerita"}
										</Text>
									</View>
									<StatusChip
										tone={recallTone(result?.iu_recall_percent, session.status)}
										label={recallLabel(result?.iu_recall_percent)}
									/>
								</View>
							</Card>
						</FadeIn>

						{result ? (
							<>
								<FadeIn delay={60}>
									<View style={styles.percentCard}>
										<Text style={[type.display, styles.percent]}>
											{Math.round(result.iu_recall_percent ?? 0)}%
										</Text>
										<Text style={[type.small, styles.percentLabel]}>
											bagian cerita diingat
										</Text>
									</View>
								</FadeIn>

								<FadeIn delay={90}>
									<View style={styles.chipRow}>
										<View style={styles.chip}>
											<Icon
												name="check"
												size={14}
												color={colors.textSecondary}
											/>
											<Text style={[type.small, styles.chipText]}>
												Diingat: {result.met_count}
											</Text>
										</View>
										<View style={styles.chip}>
											<Icon name="info" size={14} color={colors.textSecondary} />
											<Text style={[type.small, styles.chipText]}>
												Belum: {result.not_met_count}
											</Text>
										</View>
										<View style={styles.chip}>
											<Icon name="eye" size={14} color={colors.textSecondary} />
											<Text style={[type.small, styles.chipText]}>
												Tidak jelas: {result.unclear_count}
											</Text>
										</View>
									</View>
								</FadeIn>

								<FadeIn delay={120}>
									<View style={styles.section}>
										<Text style={[type.h3, styles.sectionTitle]}>
											Rincian ingatan
										</Text>
										<Card>
											{result.items.map((item, index) => (
												<View
													key={item.iu_id}
													style={[
														styles.itemRow,
														index < result.items.length - 1 &&
															styles.itemDivider,
													]}
												>
													<Text style={[type.body, styles.itemText]}>
														{item.description}
													</Text>
													<StatusChip
														tone={resultItemTone(item.status)}
														label={resultItemLabel(item.status)}
													/>
												</View>
											))}
										</Card>
									</View>
								</FadeIn>
							</>
						) : (
							<FadeIn delay={60}>
								<Card style={styles.pendingCard}>
									<Text style={[type.body, styles.pendingText]}>
										Sesi ini belum memiliki hasil penilaian.
									</Text>
								</Card>
							</FadeIn>
						)}

						<View style={styles.note}>
							<Icon name="info" size={16} color={colors.textSecondary} />
							<Text style={[type.small, styles.noteText]}>
								Ini bukan diagnosis. Catatan hanya untuk melihat kebiasaan.
							</Text>
						</View>
					</>
				) : null}

				{ready && !session && !error && hasValidId ? (
					<EmptyState
						title="Sesi tidak ditemukan"
						description="Catatan sesi ini tidak tersedia. Kembali ke Riwayat untuk memilih sesi lain."
					/>
				) : null}
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
	topRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 12,
	},
	dateBlock: {
		flex: 1,
	},
	when: {
		color: colors.textPrimary,
	},
	date: {
		color: colors.textSecondary,
		marginTop: 2,
	},
	percentCard: {
		marginTop: spacing.lg,
		padding: spacing.lg,
		borderRadius: radii.card,
		backgroundColor: colors.surface,
		alignItems: "center",
		...shadows.card,
	},
	percent: {
		color: colors.primary,
	},
	percentLabel: {
		color: colors.textSecondary,
	},
	chipRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		marginTop: spacing.lg,
	},
	chip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingVertical: 8,
		paddingHorizontal: 14,
		borderRadius: radii.pill,
		backgroundColor: colors.surface,
	},
	chipText: {
		color: colors.textSecondary,
	},
	section: {
		marginTop: spacing.xxl,
	},
	sectionTitle: {
		color: colors.textPrimary,
		marginBottom: 12,
	},
	itemRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingVertical: 12,
	},
	itemDivider: {
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	itemText: {
		flex: 1,
		color: colors.textPrimary,
	},
	pendingCard: {
		marginTop: spacing.lg,
	},
	pendingText: {
		color: colors.textSecondary,
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
