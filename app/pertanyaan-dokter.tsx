import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../components/Icon";
import { Mascot } from "../components/mascot/Mascot";
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
import { DUMMY_DOCTOR_QUESTIONS } from "../lib/dummyData";

function buildState() {
	const map: Record<string, boolean> = {};
	for (const group of DUMMY_DOCTOR_QUESTIONS) {
		for (const item of group.items) {
			map[item.id] = item.done;
		}
	}
	return map;
}

export default function PertanyaanDokterScreen() {
	const router = useRouter();
	const [checked, setChecked] = useState<Record<string, boolean>>(buildState);

	const total = DUMMY_DOCTOR_QUESTIONS.reduce(
		(sum, group) => sum + group.items.length,
		0,
	);
	const done = Object.values(checked).filter(Boolean).length;

	const toggle = (id: string) => {
		setChecked((current) => ({ ...current, [id]: !current[id] }));
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
				<Text style={[type.h2, styles.headerTitle]}>Pertanyaan untuk dokter</Text>
			</View>

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

				{DUMMY_DOCTOR_QUESTIONS.map((group, groupIndex) => (
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
						Daftar ini contoh. Sesuaikan dengan yang paling penting bagi{" "}
						Bu Siti.
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
		flexShrink: 1,
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