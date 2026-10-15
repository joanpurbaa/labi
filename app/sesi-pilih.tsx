import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
import {
	colors,
	layout,
	radii,
	shadows,
	spacing,
	type,
} from "../constants/theme";
import * as api from "../lib/api";
import type { StoryListItem } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatName } from "../lib/formatName";
import { tapHaptic } from "../lib/haptics";
import { ensureParticipant } from "../lib/participant";
import { clearActiveSession, getActiveSession, setActiveSession } from "../lib/activeSession";
import { sessionDestination } from "../lib/sessionFlow";

export default function SesiPilihScreen() {
	const router = useRouter();
	const { token, user, survivorProfile } = useAuth();

	const [stories, setStories] = useState<StoryListItem[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [startingId, setStartingId] = useState<number | null>(null);
	const startingRef = useRef(false);

	const survivorName = formatName(
		survivorProfile?.survivorNickname ?? "penyintas",
	);

	useEffect(() => {
		let active = true;
		if (!token) {
			return;
		}
		(async () => {
			try {
				const loaded = await api.listStories(token);
				if (active) {
					setStories(loaded);
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

	const start = async (story: StoryListItem) => {
		if (!token || !user || startingRef.current) {
			return;
		}
		startingRef.current = true;
		tapHaptic();
		setError(null);
		setStartingId(story.id);
		try {
			const resumable = await resumeIfActive(user.id);
			if (resumable) {
				return;
			}
			const participantId = await ensureParticipant(
				token,
				user.id,
				survivorProfile?.survivorNickname ?? user.name,
				survivorProfile?.primaryLanguage ?? "id",
			);
			const session = await api.createSession(token, {
				participant_id: participantId,
				story_id: story.id,
			});
			await setActiveSession(user.id, {
				sessionId: session.id,
				storyId: story.id,
			});
			router.replace({
				pathname: "/sesi-bercerita",
				params: { sessionId: String(session.id), storyId: String(story.id) },
			});
		} catch (err) {
			setError(api.errorMessage(err));
		} finally {
			startingRef.current = false;
			setStartingId(null);
		}
	};

	const resumeIfActive = async (userId: number): Promise<boolean> => {
		if (!token) {
			return false;
		}
		const existing = await getActiveSession(userId);
		if (!existing) return false;
		const session = await api.getSession(token, existing.sessionId).catch((err) => {
			if (err instanceof api.ApiError && err.status === 404) return null;
			throw err;
		});
		if (!session) {
			await clearActiveSession(userId);
			return false;
		}
		const destination = sessionDestination(session.status);
		if (destination === "sesi-pilih") {
			await clearActiveSession(userId);
			return false;
		}
		if (destination === "sesi-hasil") {
			await clearActiveSession(userId);
			router.replace({
				pathname: "/sesi-hasil",
				params: { sessionId: String(existing.sessionId) },
			});
			return true;
		}
		if (destination === "sesi-bercerita") {
			router.replace({
				pathname: "/sesi-bercerita",
				params: {
					sessionId: String(existing.sessionId),
					storyId: String(existing.storyId),
				},
			});
			return true;
		}
		router.replace({
			pathname: "/sesi-proses",
			params: {
				sessionId: String(existing.sessionId),
				storyId: String(existing.storyId),
			},
		});
		return true;
	};

	const loading = stories === null && error === null;

	return (
		<SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
			<View style={styles.header}>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Kembali"
					onPress={() => router.back()}
					style={({ pressed }) => [styles.back, pressed && styles.pressed]}
				>
					<Icon name="chevron" size={22} color={colors.textPrimary} />
				</Pressable>
				<Text style={[type.h2, styles.headerTitle]}>Pilih cerita</Text>
			</View>

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.hero}>
					<Mascot expression="menyambut" size={96} decorative />
					<Text style={[type.body, styles.intro]}>
						Pilih satu cerita untuk diceritakan ulang oleh {survivorName}.
					</Text>
				</View>

				{error ? (
					<View style={styles.error}>
						<Icon name="info" size={18} color={colors.danger} />
						<Text style={[type.body, styles.errorText]}>{error}</Text>
					</View>
				) : null}

				{loading ? (
					<View style={styles.loading}>
						<ActivityIndicator color={colors.primary} />
						<Text style={[type.body, styles.loadingText]}>
							Memuat cerita…
						</Text>
					</View>
				) : null}

				{stories && stories.length === 0 ? (
					<EmptyState
						title="Belum ada cerita"
						description="Belum ada cerita yang bisa dipakai. Coba lagi nanti."
					/>
				) : null}

				{stories
					? stories.map((story, index) => (
							<FadeIn key={story.id}>
								<Pressable
									accessibilityRole="button"
									accessibilityLabel={`Mulai cerita ${story.title}`}
									disabled={startingId !== null}
									onPress={() => start(story)}
									style={({ pressed }) => [
										pressed && styles.pressed,
										startingId !== null &&
											startingId !== story.id &&
											styles.dim,
									]}
								>
									<Card style={styles.storyCard}>
										<View style={styles.iconWrap}>
											<Icon name="book" size={24} color={colors.primary} />
										</View>
										<View style={styles.storyText}>
											<Text style={[type.bodyStrong, styles.storyTitle]}>
												{story.title}
											</Text>
											<Text style={[type.small, styles.storyMeta]}>
												{typeof story.version === "number"
													? `Versi ${story.version}`
													: "Siap diceritakan"}
											</Text>
										</View>
										{startingId === story.id ? (
											<ActivityIndicator color={colors.primary} />
										) : (
											<Icon
												name="chevron"
												size={18}
												color={colors.textSecondary}
											/>
										)}
									</Card>
								</Pressable>
							</FadeIn>
						))
					: null}
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
	hero: {
		flexDirection: "row",
		alignItems: "center",
		gap: 16,
		marginBottom: spacing.xl,
	},
	intro: {
		flex: 1,
		color: colors.textSecondary,
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
	loading: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingVertical: spacing.xl,
	},
	loadingText: {
		color: colors.textSecondary,
	},
	storyCard: {
		marginBottom: 12,
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
	},
	iconWrap: {
		width: 52,
		height: 52,
		borderRadius: radii.icon,
		backgroundColor: colors.primarySoft,
		alignItems: "center",
		justifyContent: "center",
	},
	storyText: {
		flex: 1,
	},
	storyTitle: {
		color: colors.textPrimary,
	},
	storyMeta: {
		color: colors.textSecondary,
		marginTop: 2,
	},
	dim: {
		opacity: 0.5,
	},
	pressed: {
		opacity: 0.7,
	},
});
