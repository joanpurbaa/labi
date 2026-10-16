import { router } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import {
	Alert,
	Pressable,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon, type IconName } from "../../components/Icon";
import { Icon3D } from "../../components/icons/Icon3D";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { FadeIn } from "../../components/ui/FadeIn";
import { IconBadge, type BadgeTone } from "../../components/ui/IconBadge";
import {
	colors,
	layout,
	radii,
	spacing,
	type,
} from "../../constants/theme";
import { useAuth } from "../../lib/auth";
import * as api from "../../lib/api";
import { formatName } from "../../lib/formatName";
import { resolveParticipantId } from "../../lib/participant";
import {
	isHapticsEnabled,
	loadHapticsPreference,
	setHapticsEnabled,
} from "../../lib/haptics";
import {
	AGE_RANGE_OPTIONS,
	DURATION_OPTIONS,
	GOAL_OPTIONS,
	INSTRUCTION_OPTIONS,
	LANGUAGE_OPTIONS,
	MODE_OPTIONS,
	TOPIC_OPTIONS,
	optionLabel,
	optionLabels,
} from "../../lib/survivorOptions";

const MONTHS = [
	"Januari",
	"Februari",
	"Maret",
	"April",
	"Mei",
	"Juni",
	"Juli",
	"Agustus",
	"September",
	"Oktober",
	"November",
	"Desember",
];

function formatDateTime(iso: string): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) {
		return "-";
	}
	const pad = (value: number) => String(value).padStart(2, "0");
	return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}, ${pad(date.getHours())}.${pad(date.getMinutes())}`;
}

function Section({
	title,
	icon,
	children,
}: {
	title: string;
	icon: IconName;
	children: ReactNode;
}) {
	return (
		<View style={styles.section}>
			<View style={styles.sectionHead}>
				<IconBadge icon={icon} tone="primary" size={34} />
				<Text style={[type.h3, styles.sectionTitle]}>{title}</Text>
			</View>
			<Card padded={false} style={styles.card}>
				{children}
			</Card>
		</View>
	);
}

function InfoRow({
	label,
	value,
	last,
}: {
	label: string;
	value: string | null;
	last?: boolean;
}) {
	const filled = Boolean(value && value.trim());
	return (
		<View style={[styles.row, !last && styles.rowDivider]}>
			<Text style={[type.body, styles.rowLabel]}>{label}</Text>
			<Text
				style={[
					type.bodyStrong,
					styles.rowValue,
					!filled && styles.rowValueEmpty,
				]}
			>
				{filled ? value : "Belum diisi"}
			</Text>
		</View>
	);
}

function ChipRow({
	label,
	values,
	emptyText,
	last,
	tone = "primary",
}: {
	label: string;
	values: string[];
	emptyText: string;
	last?: boolean;
	tone?: BadgeTone;
}) {
	return (
		<View style={[styles.row, styles.rowBlock, !last && styles.rowDivider]}>
			<Text style={[type.body, styles.rowLabel]}>{label}</Text>
			{values.length > 0 ? (
				<View style={styles.chips}>
					{values.map((value) => (
						<View key={value} style={styles.chip}>
							<Text style={[type.small, styles.chipText]}>{value}</Text>
						</View>
					))}
				</View>
			) : (
				<Text style={[type.body, styles.rowValue, styles.rowValueEmpty]}>
					{emptyText}
				</Text>
			)}
		</View>
	);
}

export default function ProfilScreen() {
	const { user, token, survivorProfile, logout, deleteAccount } = useAuth();
	const [deleting, setDeleting] = useState(false);
	const [haptics, setHaptics] = useState(isHapticsEnabled());
	const [recommendations, setRecommendations] = useState<
		api.SessionTrainingRecommendationRead[] | null
	>(null);

	useEffect(() => {
		let active = true;
		if (!token || !user) {
			return;
		}
		(async () => {
			try {
				const participantId = await resolveParticipantId(token, user.id);
				if (participantId === null) {
					if (active) {
						setRecommendations([]);
					}
					return;
				}
				const list = await api.listParticipantRecommendations(
					token,
					participantId,
				);
				if (active) {
					setRecommendations(list);
				}
			} catch {
				if (active) {
					setRecommendations([]);
				}
			}
		})();
		return () => {
			active = false;
		};
	}, [token, user]);

	useEffect(() => {
		loadHapticsPreference().then(setHaptics);
	}, []);

	const companionName = formatName(user?.name ?? "Pendamping");
	const companionEmail = user?.email ?? "-";
	const survivorName = formatName(survivorProfile?.survivorNickname ?? "penyintas");

	const runDelete = async () => {
		setDeleting(true);
		const result = await deleteAccount();
		setDeleting(false);
		if (!result.ok) {
			Alert.alert("Gagal", result.error);
			return;
		}
		router.replace("/login");
	};

	const handleLogout = async () => {
		await logout();
		router.replace("/login");
	};

	const confirmDelete = () => {
		Alert.alert(
			"Hapus akun & data?",
			`Akun pendamping dan data ${survivorName} akan dihapus dari perangkat ini.`,
			[
				{ text: "Batal", style: "cancel" },
				{
					text: "Lanjut",
					style: "destructive",
					onPress: () =>
						Alert.alert(
							"Yakin ingin menghapus?",
							"Setelah dihapus, kamu bisa mendaftar lagi dengan email yang sama, tetapi data tidak bisa dikembalikan.",
							[
								{ text: "Batal", style: "cancel" },
								{ text: "Ya, hapus", style: "destructive", onPress: runDelete },
							],
						),
				},
			],
		);
	};

	return (
		<SafeAreaView style={styles.safe} edges={["top"]}>
			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<FadeIn>
					<View style={styles.hero}>
						<View style={styles.avatarRing}>
							<Avatar name={companionName} size={84} />
						</View>
						<Text style={[type.h1, styles.name]}>{companionName}</Text>
						<Text
							style={[type.body, styles.email]}
							numberOfLines={1}
							adjustsFontSizeToFit
							minimumFontScale={0.85}
						>
							{companionEmail}
						</Text>
						<View style={styles.badge}>
							<Icon name="profile" size={14} color={colors.primary} />
							<Text style={[type.small, styles.badgeText]}>Pendamping</Text>
						</View>
					</View>
				</FadeIn>

				<FadeIn delay={60}>
					<Section title="Akun pendamping" icon="profile">
						<InfoRow label="Nama" value={companionName} />
						<InfoRow label="Email" value={companionEmail} last />
					</Section>
				</FadeIn>

				<FadeIn delay={120}>
					<Section title={`Data ${survivorName}`} icon="heart">
						{survivorProfile ? (
							<>
								<InfoRow
									label="Nama panggilan"
									value={formatName(survivorProfile.survivorNickname)}
								/>
								<InfoRow
									label="Rentang usia"
									value={optionLabel(
										AGE_RANGE_OPTIONS,
										survivorProfile.ageRange,
									)}
								/>
								<InfoRow
									label="Bahasa utama"
									value={optionLabel(
										LANGUAGE_OPTIONS,
										survivorProfile.primaryLanguage,
									)}
								/>
								<InfoRow
									label="Preferensi instruksi"
									value={optionLabel(
										INSTRUCTION_OPTIONS,
										survivorProfile.instructionPreference,
									)}
								/>
								<InfoRow
									label="Durasi sesi"
									value={optionLabel(
										DURATION_OPTIONS,
										survivorProfile.preferredSessionDuration,
									)}
								/>
								<InfoRow
									label="Mode latihan"
									value={optionLabel(MODE_OPTIONS, survivorProfile.practiceMode)}
								/>
								<ChipRow
									label="Tujuan komunikasi"
									values={optionLabels(
										GOAL_OPTIONS,
										survivorProfile.communicationGoals,
									)}
									emptyText="Belum dipilih"
								/>
								<ChipRow
									label="Topik percakapan"
									values={optionLabels(
										TOPIC_OPTIONS,
										survivorProfile.preferredTopics,
									)}
									emptyText="Belum dipilih"
								/>
								<InfoRow
									label="Konfirmasi personalisasi"
									value={
										survivorProfile.personalizationConfirmed
											? "Sudah dijelaskan ke penyintas"
											: "Belum dikonfirmasi"
									}
								/>
								<InfoRow
									label="Terakhir diperbarui"
									value={formatDateTime(survivorProfile.updatedAt)}
									last
								/>
							</>
						) : (
							<View style={styles.emptyRow}>
								<Text style={[type.body, styles.emptyText]}>
									Belum ada data personalisasi penyintas untuk akun ini.
								</Text>
							</View>
						)}
					</Section>
					<Button
						label={
							survivorProfile
								? "Ubah Data Penyintas"
								: "Tambah Data Penyintas"
						}
						variant="secondary"
						fullWidth
						onPress={() => router.push("/personalization?mode=edit")}
						style={styles.editAction}
					/>
				</FadeIn>

				{recommendations !== null ? (
					<FadeIn delay={150}>
						<Section title="Riwayat rekomendasi terapi" icon="book">
							{recommendations.length === 0 ? (
								<View style={styles.emptyRow}>
									<Text style={[type.body, styles.emptyText]}>
										Belum ada rekomendasi terapi untuk penyintas ini.
									</Text>
								</View>
							) : null}
							{recommendations.map((rec, index) => (
								<Pressable
									key={rec.id}
									accessibilityRole="button"
									accessibilityLabel={`Rekomendasi ${rec.primary_mode} sesi ${rec.session_id}`}
									onPress={() =>
										router.push({
											pathname: "/sesi-hasil",
											params: { sessionId: String(rec.session_id) },
										})
									}
									style={({ pressed }) => [
										styles.recRow,
										index < recommendations.length - 1 && styles.rowDivider,
										pressed && styles.pressed,
									]}
								>
									<View style={styles.recBody}>
										<Text style={[type.bodyStrong, styles.recMode]}>
											{rec.primary_mode.toUpperCase()}
											{rec.secondary_mode
												? ` + ${rec.secondary_mode.toUpperCase()}`
												: ""}
										</Text>
										<Text
											style={[type.small, styles.rowValueEmpty]}
											numberOfLines={2}
										>
											{rec.target_goal}
										</Text>
										<Text style={[type.small, styles.rowValueEmpty]}>
											{formatDateTime(rec.created_at)}
										</Text>
									</View>
									<Icon name="chevron" size={18} color={colors.textSecondary} />
								</Pressable>
							))}
						</Section>
					</FadeIn>
				) : null}

				<FadeIn delay={180}>
					<Section title="Preferensi" icon="sparkles">
						<View style={[styles.row, styles.switchRow]}>
							<View style={styles.switchBody}>
								<Text style={[type.bodyStrong, styles.rowLabel]}>
									Getaran saat menekan
								</Text>
								<Text style={[type.small, styles.rowValueEmpty]}>
									Matikan bila tidak ingin ada getaran.
								</Text>
							</View>
							<Switch
								value={haptics}
								onValueChange={(value) => {
									setHaptics(value);
									setHapticsEnabled(value);
								}}
								accessibilityLabel="Getaran saat menekan tombol"
								trackColor={{ true: colors.primary, false: colors.borderStrong }}
								thumbColor={colors.surface}
							/>
						</View>
					</Section>
				</FadeIn>

				<View style={styles.note}>
					<View style={styles.noteTile}>
						<Icon3D name="locked" size={40} />
					</View>
					<View style={styles.noteBody}>
						<Text style={[type.bodyStrong, styles.noteTitle]}>
							Data aman di perangkat ini
						</Text>
						<Text style={[type.small, styles.noteText]}>
							Data hanya disimpan di perangkat ini, tidak dibagikan.
						</Text>
					</View>
				</View>

				<Button
					label="Keluar"
					variant="secondary"
					icon="logout"
					fullWidth
					onPress={handleLogout}
					style={styles.action}
				/>

				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Hapus akun dan data lokal"
					accessibilityState={{ disabled: deleting }}
					disabled={deleting}
					onPress={confirmDelete}
					style={({ pressed }) => [
						styles.deleteButton,
						(pressed || deleting) && styles.pressed,
					]}
				>
					<Icon name="trash" size={20} color={colors.danger} />
					<Text style={[type.bodyStrong, styles.deleteText]}>
						{deleting ? "Menghapus..." : "Hapus akun & data"}
					</Text>
				</Pressable>
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
		paddingTop: spacing.xxl,
		paddingHorizontal: layout.screenPadding,
		paddingBottom: 128,
	},
	hero: {
		alignItems: "center",
		marginBottom: spacing.xxl,
	},
	avatarRing: {
		padding: 6,
		borderRadius: 999,
		borderWidth: 2,
		borderColor: colors.primarySoft,
		backgroundColor: colors.surface,
	},
	name: {
		color: colors.textPrimary,
		textAlign: "center",
		marginTop: 14,
	},
	email: {
		color: colors.textSecondary,
		marginTop: 4,
		textAlign: "center",
		alignSelf: "center",
	},
	badge: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		marginTop: 12,
		paddingVertical: 7,
		paddingHorizontal: 14,
		borderRadius: 999,
		backgroundColor: colors.primarySoft,
	},
	badgeText: {
		color: colors.primary,
		fontWeight: "600",
	},
	section: {
		marginBottom: layout.sectionGap,
	},
	sectionHead: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		marginBottom: 12,
	},
	sectionTitle: {
		color: colors.textPrimary,
	},
	card: {
		paddingHorizontal: spacing.lg,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 16,
		minHeight: 56,
		paddingVertical: 14,
	},
	rowDivider: {
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	rowBlock: {
		flexDirection: "column",
		alignItems: "stretch",
	},
	rowLabel: {
		color: colors.textSecondary,
	},
	rowValue: {
		flexShrink: 1,
		color: colors.textPrimary,
		textAlign: "right",
	},
	rowValueEmpty: {
		color: colors.textSecondary,
	},
	switchRow: {
		minHeight: 68,
	},
	switchBody: {
		flex: 1,
		gap: 2,
	},
	chips: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		marginTop: 10,
	},
	chip: {
		paddingVertical: 7,
		paddingHorizontal: 14,
		borderRadius: 999,
		backgroundColor: colors.primarySoft,
	},
	chipText: {
		color: colors.primaryDark,
		fontWeight: "600",
	},
	emptyRow: {
		paddingVertical: 18,
	},
	recRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingVertical: 14,
	},
	recBody: {
		flex: 1,
		gap: 2,
	},
	recMode: {
		color: colors.primary,
	},
	emptyText: {
		color: colors.textSecondary,
	},
	note: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		padding: 16,
		borderRadius: radii.cardSmall,
		backgroundColor: colors.surface,
		marginBottom: spacing.xl,
	},
	noteTile: {
		width: 56,
		height: 56,
		borderRadius: 28,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.leafSoft,
	},
	noteBody: {
		flex: 1,
		gap: 2,
	},
	noteTitle: {
		color: colors.textPrimary,
	},
	noteText: {
		color: colors.textSecondary,
	},
	action: {
		marginBottom: 12,
	},
	editAction: {
		marginTop: 16,
		marginBottom: 32,
	},
	deleteButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		minHeight: 54,
		borderRadius: radii.button,
		backgroundColor: colors.dangerSoft,
	},
	deleteText: {
		color: colors.danger,
	},
	pressed: {
		opacity: 0.7,
	},
});
