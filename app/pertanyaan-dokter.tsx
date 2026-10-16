import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { Mascot } from "../components/mascot/Mascot";
import { AppHeader } from "../components/ui/AppHeader";
import { Button } from "../components/ui/Button";
import { TextField } from "../components/TextField";
import { Card } from "../components/ui/Card";
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

type QuestionItem = {
	id: string;
	question: string;
	note?: string;
};

type QuestionGroup = {
	id: string;
	title: string;
	icon: IconName;
	items: QuestionItem[];
};

function storageKey(userId: number): string {
	return `@labi/doctor-questions/${userId}`;
}

function buildSuggestions(
	survivorName: string,
	sessions: api.SessionHistoryItem[],
	deltaRecall: number | null,
	sessionCount: number,
): QuestionItem[] {
	const items: QuestionItem[] = [];
	const completed = sessions.filter((session) => session.completed_at);
	if (deltaRecall !== null && deltaRecall < -3) {
		items.push({
			id: "s-trend-down",
			question: `Ingatan ${survivorName} turun ${Math.abs(Math.round(deltaRecall))}% dibanding sesi pertama, apakah masih wajar?`,
			note: `Berdasarkan ${sessionCount} sesi tercatat.`,
		});
	}
	const low = completed.find(
		(session) =>
			typeof session.iu_recall_percent === "number" &&
			session.iu_recall_percent < 40,
	);
	if (low) {
		items.push({
			id: `s-low-${low.id}`,
			question: `Sesi ${formatSessionDate(low.completed_at)} hanya ${Math.round(low.iu_recall_percent as number)}% yang diingat, apa yang perlu diperbaiki?`,
			note: low.story_title ?? undefined,
		});
	}
	if (completed.length > 0 && items.length === 0) {
		const last = completed[0];
		const recall =
			typeof last.iu_recall_percent === "number"
				? `${Math.round(last.iu_recall_percent)}% diingat`
				: "belum dinilai";
		items.push({
			id: "s-review",
			question: `Minta evaluasi dokter atas ${completed.length} sesi terakhir (${recall})?`,
			note: `Sesi terakhir ${formatSessionDate(last.completed_at)}.`,
		});
	}
	return items;
}

export default function PertanyaanDokterScreen() {
	const router = useRouter();
	const { token, user, survivorProfile } = useAuth();
	const [groups, setGroups] = useState<QuestionGroup[] | null>(null);
	const [checked, setChecked] = useState<Record<string, boolean>>({});
	const [draft, setDraft] = useState("");
	const [ready, setReady] = useState(false);

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
				const [stored, participantId] = await Promise.all([
					AsyncStorage.getItem(storageKey(user.id)),
					resolveParticipantId(token, user.id),
				]);
				const parsed = stored ? JSON.parse(stored) as {
					custom?: { id: string; question: string }[];
					checked?: Record<string, boolean>;
				} : null;
				const custom = Array.isArray(parsed?.custom) ? parsed!.custom : [];
				const [sessions, trend] = await Promise.all([
					api.listSessions(token, {
						...(participantId === null ? {} : { participant_id: participantId }),
						page: 1,
						page_size: 5,
					}),
					participantId === null
						? Promise.resolve(null)
						: api.getParticipantTrend(token, participantId).catch(() => null),
				]);
				const baseline = trend?.baseline?.iu_recall_percent ?? null;
				const latest = trend?.latest?.iu_recall_percent ?? null;
				const delta =
					baseline !== null && latest !== null ? latest - baseline : null;
				const suggestions = buildSuggestions(
					survivorName,
					sessions.data,
					delta,
					trend?.session_count ?? 0,
				);
				if (active) {
					const next: QuestionGroup[] = [];
					if (suggestions.length > 0) {
						next.push({
							id: "saran",
							title: "Saran dari data sesi",
							icon: "chart",
							items: suggestions,
						});
					}
					next.push({
						id: "catatan",
						title: "Catatanmu",
						icon: "heart",
						items: custom,
					});
					setGroups(next);
					setChecked(parsed?.checked ?? {});
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
	}, [token, user, survivorName]);

	const persist = async (
		custom: { id: string; question: string }[],
		nextChecked: Record<string, boolean>,
	) => {
		if (!user) {
			return;
		}
		try {
			await AsyncStorage.setItem(
				storageKey(user.id),
				JSON.stringify({ custom, checked: nextChecked }),
			);
		} catch {
			// penyimpanan lokal gagal — status layar tetap berlaku sesi ini
		}
	};

	const total = (groups ?? []).reduce(
		(sum, group) => sum + group.items.length,
		0,
	);
	const done = Object.values(checked).filter(Boolean).length;

	const toggle = (id: string) => {
		setChecked((current) => {
			const next = { ...current, [id]: !current[id] };
			const custom = (groups ?? [])
				.find((group) => group.id === "catatan")
				?.items.map((item) => ({ id: item.id, question: item.question })) ?? [];
			void persist(custom, next);
			return next;
		});
	};

	const addCustom = () => {
		const question = draft.trim();
		if (!question) {
			return;
		}
		const entry = { id: `c-${Date.now()}`, question };
		setGroups((current) => {
			const next = (current ?? []).map((group) =>
				group.id === "catatan"
					? { ...group, items: [...group.items, entry] }
					: group,
			);
			const withGroup = next.some((group) => group.id === "catatan")
				? next
				: [
					...next,
					{ id: "catatan", title: "Catatanmu", icon: "heart" as IconName, items: [entry] },
				];
			void persist(
				withGroup
					.find((group) => group.id === "catatan")
					?.items.map((item) => ({ id: item.id, question: item.question })) ?? [],
				checked,
			);
			return withGroup;
		});
		setDraft("");
	};

	return (
		<SafeAreaView style={styles.safe} edges={["top"]}>
			<AppHeader title="Pertanyaan untuk dokter" onBack={() => router.back()} />

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<Mascot
					expression="menenangkan"
					size={96}
					decorative
					style={styles.heroMascot}
				/>

				<Text style={[type.body, styles.intro]}>
					Tandai hal yang ingin kamu tanyakan, agar tidak terlewat saat
					bertemu dokter.
				</Text>

				<Card style={styles.progressCard}>
					<View style={styles.progressRow}>
						<Text style={[type.bodyStrong, styles.progressValue]}>
							{done} dari {total} ditandai
						</Text>
						<Text style={[type.small, styles.progressHint]}>
							Bisa diubah kapan saja
						</Text>
					</View>
				</Card>

				{!ready ? (
					<View style={styles.loadingRow}>
						<ActivityIndicator color={colors.primary} />
					</View>
				) : null}

				{ready && total === 0 ? (
					<Card style={styles.progressCard}>
						<Text style={[type.body, styles.emptyText]}>
							Belum ada saran pertanyaan. Selesaikan satu sesi dulu, atau
							tambahkan pertanyaanmu sendiri di bawah.
						</Text>
					</Card>
				) : null}

				{(groups ?? []).map((group, groupIndex) => (
					<FadeIn key={group.id} delay={groupIndex * 60}>
						<View style={styles.group}>
							<View style={styles.groupHead}>
								<IconBadge icon={group.icon} tone="primary" size={34} />
								<Text style={[type.h3, styles.groupTitle]}>
									{group.title}
								</Text>
							</View>
							<Card padded={false} style={styles.card}>
								{group.items.map((item, index) => {
									const active = checked[item.id];
									const last = index === group.items.length - 1;
									return (
										<Pressable
											key={item.id}
											accessibilityRole="checkbox"
											accessibilityState={{ checked: active }}
											accessibilityLabel={item.question}
											onPress={() => toggle(item.id)}
											style={({ pressed }) => [
												styles.item,
												!last && styles.itemDivider,
												pressed && styles.pressed,
											]}
										>
											<View
												style={[
													styles.checkbox,
													active && styles.checkboxActive,
												]}
											>
												{active ? (
													<Icon
														name="check"
														size={16}
														color={colors.surface}
													/>
												) : null}
											</View>
											<View style={styles.itemBody}>
												<Text
													style={[
														type.body,
														styles.itemQuestion,
														active && styles.itemQuestionActive,
													]}
												>
													{item.question}
												</Text>
												{item.note ? (
													<Text style={[type.small, styles.itemNote]}>
														{item.note}
													</Text>
												) : null}
											</View>
										</Pressable>
									);
								})}
							</Card>
						</View>
					</FadeIn>
				))}

				<View style={styles.addRow}>
					<View style={styles.addField}>
						<TextField
							label="Pertanyaan baru"
							value={draft}
							onChangeText={setDraft}
							placeholder="Tulis hal yang ingin ditanyakan"
							returnKeyType="done"
							onSubmitEditing={addCustom}
						/>
					</View>
					<Button
						label="Tambah"
						onPress={addCustom}
						disabled={draft.trim().length === 0}
						style={styles.addButton}
					/>
				</View>

				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Buka laporan untuk dokter"
					onPress={() => router.push("/laporan-dokter")}
					style={({ pressed }) => [styles.link, pressed && styles.pressed]}
				>
					<Icon name="doc" size={20} color={colors.primary} />
					<Text style={[type.bodyStrong, styles.linkText]}>
						Buka laporan untuk dokter
					</Text>
					<Icon name="chevron" size={18} color={colors.primary} />
				</Pressable>

				<View style={styles.note}>
					<Icon name="info" size={16} color={colors.textSecondary} />
					<Text style={[type.small, styles.noteText]}>
						Tandai hal yang ingin kamu tanyakan, agar tidak terlewat saat
						bertemu dokter.
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
	progressCard: {
		marginBottom: spacing.xxl,
	},
	progressRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	heroMascot: {
		alignSelf: "center",
		marginBottom: 12,
	},
	progressValue: {
		color: colors.primary,
	},
	progressHint: {
		color: colors.textSecondary,
	},
	loadingRow: {
		paddingVertical: 24,
		alignItems: "center",
	},
	emptyText: {
		color: colors.textSecondary,
	},
	addRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 10,
		marginTop: spacing.xxl,
		marginBottom: spacing.lg,
	},
	addField: {
		flex: 1,
	},
	addButton: {
		marginTop: 26,
	},
	group: {
		marginBottom: layout.sectionGap,
	},
	groupHead: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		marginBottom: 12,
	},
	groupTitle: {
		color: colors.textPrimary,
		flexShrink: 1,
	},
	card: {
		paddingHorizontal: spacing.lg,
	},
	item: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 12,
		paddingVertical: 16,
	},
	itemDivider: {
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	checkbox: {
		width: 26,
		height: 26,
		borderRadius: 8,
		borderWidth: 2,
		borderColor: colors.borderStrong,
		alignItems: "center",
		justifyContent: "center",
		marginTop: 1,
	},
	checkboxActive: {
		backgroundColor: colors.primary,
		borderColor: colors.primary,
	},
	itemBody: {
		flex: 1,
	},
	itemQuestion: {
		color: colors.textPrimary,
	},
	itemQuestionActive: {
		color: colors.textSecondary,
	},
	itemNote: {
		color: colors.textSecondary,
		marginTop: 4,
	},
	link: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingVertical: 16,
		paddingHorizontal: 18,
		borderRadius: radii.cardSmall,
		backgroundColor: colors.surface,
		marginTop: spacing.sm,
	},
	linkText: {
		color: colors.primary,
		flex: 1,
	},
	note: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 8,
		marginTop: 16,
		padding: 14,
		borderRadius: radii.cardSmall,
		backgroundColor: colors.surfaceWarm,
	},
	noteText: {
		color: colors.textSecondary,
		flexShrink: 1,
	},
	pressed: {
		opacity: 0.7,
	},
});
