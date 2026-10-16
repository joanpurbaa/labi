import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Modal,
	Pressable,
	ScrollView,
	Share,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";
import { Icon } from "../components/Icon";
import { Mascot } from "../components/mascot/Mascot";
import { AppHeader } from "../components/ui/AppHeader";
import { BottomSheet } from "../components/ui/BottomSheet";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { CollapsibleSection } from "../components/ui/CollapsibleSection";
import { EmptyState } from "../components/ui/EmptyState";
import { FadeIn } from "../components/ui/FadeIn";
import { ProgressRing } from "../components/ui/ProgressRing";
import { ExerciseRunner } from "../components/ExerciseRunner";
import {
	colors,
	layout,
	radii,

	spacing,
	type,
} from "../constants/theme";
import * as api from "../lib/api";
import type { ResultRead, SessionRead, TrendPoint } from "../lib/api";
import { trackEvent } from "../lib/analytics";
import { useAuth } from "../lib/auth";
import { formatName } from "../lib/formatName";
import { statusToExpression } from "../lib/mascotMood";
import { resolveParticipantId } from "../lib/participant";
import { recallTone } from "../lib/sessionDisplay";
import {
	ANALYZING_MESSAGE,
	useAnalysisPolling,
} from "../lib/useAnalysisPolling";
import {
	DISCLAIMER_TEXT,
	MISSED_HINT_TEMPLATE,
	buildSessionDetailViewModel,
	type ExerciseViewModel,
} from "../lib/sessionDetailPresenter";

function isToday(iso: string): boolean {
	const date = new Date(iso);
	const now = new Date();
	return (
		date.getFullYear() === now.getFullYear() &&
		date.getMonth() === now.getMonth() &&
		date.getDate() === now.getDate()
	);
}

function SkeletonBox({ height }: { height: number }) {
	const reduceMotion = useReducedMotion();
	const opacity = useSharedValue(1);
	opacity.value = reduceMotion
		? 1
		: withRepeat(withTiming(0.45, { duration: 900 }), -1, true);
	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
	}));
	return <Animated.View style={[styles.skeleton, { height }, animatedStyle]} />;
}

export default function SesiDetailScreen() {
	const router = useRouter();
	const { token, user, survivorProfile } = useAuth();
	const { id } = useLocalSearchParams<{ id?: string }>();
	const numericSessionId = Number(id);

	const [session, setSession] = useState<SessionRead | null>(null);
	const [result, setResult] = useState<ResultRead | null>(null);
	const [recommendation, setRecommendation] =
		useState<api.SessionTrainingRecommendationRead | null>(null);
	const [series, setSeries] = useState<TrendPoint[]>([]);
	const [doneTitles, setDoneTitles] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [ready, setReady] = useState(false);

	const [selectedKey, setSelectedKey] = useState<string | null>(null);
	const [showOthers, setShowOthers] = useState(false);
	const [runnerOpen, setRunnerOpen] = useState(false);
	const [sheet, setSheet] = useState<
		| { kind: "attention" }
		| { kind: "missed"; title: string; body: string }
		| null
	>(null);
	const [analysisOpen, setAnalysisOpen] = useState(false);
	const [methodsOpen, setMethodsOpen] = useState(false);
	const [recallOpen, setRecallOpen] = useState(false);

	const analysisPoll = useAnalysisPolling({
		token,
		sessionId: numericSessionId,
	});
	const resumeAnalysis = analysisPoll.resume;
	const analysisPhase = analysisPoll.phase;

	const hasValidId = Boolean(token) && Number.isFinite(numericSessionId);
	const survivorName = formatName(
		survivorProfile?.survivorNickname ?? "penyintas",
	);

	const goBack = () => {
		if (router.canGoBack()) {
			router.back();
			return;
		}
		router.replace("/");
	};

	useEffect(() => {
		if (!token || !Number.isFinite(numericSessionId)) {
			return;
		}
		let active = true;
		const controller = new AbortController();
		(async () => {
			try {
				const loaded = await api.getSession(
					token,
					numericSessionId,
					controller.signal,
				);
				if (!active) {
					return;
				}
				setSession(loaded);
				if (loaded.status !== "completed") {
					return;
				}
				const [resultData, recData] = await Promise.all([
					api.getResult(token, numericSessionId, controller.signal).catch(() => null),
					api.getSessionRecommendation(token, numericSessionId, controller.signal),
				]);
				if (active) {
					if (resultData) {
						setResult(resultData);
					}
					setRecommendation(recData);
				}
			} catch (err) {
				if (active && !api.isAbortError(err)) {
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
			controller.abort();
		};
	}, [token, numericSessionId]);

	useEffect(() => {
		if (!session || session.status === "completed") {
			return;
		}
		void resumeAnalysis();
	}, [session, resumeAnalysis]);

	useEffect(() => {
		if (analysisPhase !== "completed" || !token) {
			return;
		}
		let active = true;
		api
			.getResult(token, numericSessionId)
			.then((data) => {
				if (active) {
					setResult(data);
				}
			})
			.catch(() => {});
		return () => {
			active = false;
		};
	}, [analysisPhase, token, numericSessionId]);

	useEffect(() => {
		if (!token || !user || !session || session.status !== "completed") {
			return;
		}
		let active = true;
		const controller = new AbortController();
		(async () => {
			try {
				const participantId = await resolveParticipantId(token, user.id);
				const [trend, sessionLogs] = await Promise.all([
					participantId === null
						? Promise.resolve(null)
						: api
								.getParticipantTrend(token, participantId, controller.signal)
								.catch(() => null),
					api
						.listTrainingLogs(token, numericSessionId, controller.signal)
						.catch(() => []),
				]);
				if (active) {
					setSeries(trend?.series ?? []);
					setDoneTitles(
						sessionLogs.filter((log) => isToday(log.logged_at)).map((log) => log.title),
					);
				}
			} catch {
				// Data pelengkap gagal — halaman utama tetap tampil.
			}
		})();
		return () => {
			active = false;
			controller.abort();
		};
	}, [token, user, session, numericSessionId]);

	const vm = useMemo(() => {
		if (!session || session.status !== "completed") {
			return null;
		}
		return buildSessionDetailViewModel({
			sessionId: numericSessionId,
			storyTitle: result?.story_title ?? "Cerita",
			createdAt: session.created_at,
			survivorName,
			result,
			recommendation,
			series,
		});
	}, [session, result, recommendation, series, numericSessionId, survivorName]);

	useEffect(() => {
		if (ready && session && vm) {
			trackEvent("session_detail_viewed", { sessionId: numericSessionId });
		}
	}, [ready, session, vm, numericSessionId]);

	const effectiveKey = selectedKey ?? vm?.todayExercise?.key ?? null;

	if (!hasValidId) {
		return (
			<SafeAreaView style={styles.safe} edges={["top"]}>
				<EmptyState
					title="Sesi tidak ditemukan"
					description="Catatan sesi ini tidak tersedia. Kembali ke Riwayat untuk memilih sesi lain."
				/>
			</SafeAreaView>
		);
	}

	const selectedExercise: ExerciseViewModel | null =
		vm?.todayExercise?.key === effectiveKey
			? (vm?.todayExercise ?? null)
			: (vm?.otherExercises.find((item) => item.key === effectiveKey) ?? null);
	const exerciseDoneToday = selectedExercise
		? doneTitles.includes(selectedExercise.title)
		: false;

	const shareSummary = async () => {
		if (!vm) {
			return;
		}
		trackEvent("doctor_cta_clicked", { sessionId: numericSessionId });
		const lines = [
			`Ringkasan sesi ${vm.header.storyTitle} — LABI`,
			vm.score.summarySentence,
			"",
		];
		const allTrainings = vm.todayExercise
			? [vm.todayExercise, ...vm.otherExercises]
			: [];
		for (const training of allTrainings) {
			lines.push(`- ${training.title} (${training.durationMin} menit)`);
		}
		if (vm.attention?.fullText) {
			lines.push("", `Catatan: ${vm.attention.fullText}`);
		}
		lines.push("", DISCLAIMER_TEXT);
		try {
			await Share.share({ message: lines.filter(Boolean).join("\n") });
		} catch {
			// pengguna membatalkan berbagi
		}
	};

	return (
		<SafeAreaView style={styles.safe} edges={["top"]}>
			<AppHeader title="Detail sesi" onBack={goBack} />

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				{!ready ? (
					<>
						<SkeletonBox height={150} />
						<SkeletonBox height={64} />
						<SkeletonBox height={220} />
					</>
				) : null}

				{error ? (
					<View style={styles.error}>
						<Icon name="info" size={18} color={colors.danger} />
						<Text style={[type.body, styles.errorText]}>{error}</Text>
					</View>
				) : null}

				{session ? (
					<FadeIn>
						<Card>
							<View style={styles.topRow}>
								<Mascot
									expression={statusToExpression(
										recallTone(vm?.score.percent ?? null, session.status),
									)}
									size={48}
								/>
								<View style={styles.dateBlock}>
									<Text style={[type.bodyStrong, styles.when]}>
										{vm?.header.date ?? ""}
									</Text>
									<Text style={[type.small, styles.date]}>
										{vm?.header.storyTitle ?? "Cerita"}
									</Text>
								</View>
							</View>
						</Card>
					</FadeIn>
				) : null}

				{vm ? (
					<>
						<FadeIn delay={40}>
							<Card style={styles.heroCard}>
								<View accessible accessibilityLabel={vm.score.ariaLabel}>
									<ProgressRing
										progress={(vm.score.percent ?? 0) / 100}
										size={148}
									>
										<Text style={[type.display, styles.percent]}>
											{vm.score.percent === null
												? "—"
												: `${Math.round(vm.score.percent)}%`}
										</Text>
									</ProgressRing>
								</View>
								<Text style={[type.h3, styles.heroLabel]}>
									{vm.score.label}
								</Text>
								<Text style={[type.body, styles.heroSentence]}>
									{vm.score.summarySentence}
								</Text>
								{vm.score.deltaVsPrevious !== null ? (
									<Text style={[type.small, styles.delta]}>
										{vm.score.deltaVsPrevious > 0 ? "▲ " : "▼ "}
										{Math.abs(vm.score.deltaVsPrevious)}% dari sesi lalu
									</Text>
								) : null}
							</Card>
						</FadeIn>

						{vm.attention ? (
							<FadeIn delay={80}>
								<Pressable
									accessibilityRole="button"
									accessibilityLabel={`Perhatian: ${vm.attention.shortText}. Ketuk untuk saran.`}
									onPress={() => {
										trackEvent("attention_banner_opened", {
											sessionId: numericSessionId,
										});
										setSheet({ kind: "attention" });
									}}
									style={({ pressed }) => [
										styles.banner,
										(vm.attention?.severity === "high" ||
											vm.attention?.severity === "moderate") &&
											styles.bannerStrong,
										pressed && styles.pressed,
									]}
								>
									<Icon name="info" size={18} color={colors.watchFg} />
									<Text style={[type.body, styles.bannerText]} numberOfLines={2}>
										{vm.attention.shortText}
									</Text>
									<Icon name="chevron" size={18} color={colors.watchFg} />
								</Pressable>
							</FadeIn>
						) : null}

						{selectedExercise ? (
							<FadeIn delay={120}>
								<Card style={styles.exerciseCard}>
									<Text style={[type.small, styles.kicker]}>
										Latihan hari ini · {selectedExercise.levelTitle}
									</Text>
									<Text style={[type.h3, styles.exerciseTitle]}>
										{selectedExercise.title}
									</Text>
									<View style={styles.badgeRow}>
										<View style={styles.badge}>
											<Text style={[type.small, styles.badgeText]}>
												{selectedExercise.durationMin} menit
											</Text>
										</View>
										<View style={styles.badge}>
											<Text style={[type.small, styles.badgeText]}>
												{selectedExercise.frequency}
											</Text>
										</View>
										<View style={styles.badge}>
											<Text style={[type.small, styles.badgeText]}>
												{selectedExercise.modeTag}
											</Text>
										</View>
									</View>
									{exerciseDoneToday ? (
										<>
											<Text style={[type.bodyStrong, styles.doneText]}>
												✓ Selesai hari ini
											</Text>
											{vm.otherExercises.length > 0 ? (
												<Button
													label="Lanjut ke latihan berikutnya"
													variant="secondary"
													fullWidth
													onPress={() => {
														const next =
															vm.otherExercises.find(
																(item) => item.key !== effectiveKey,
															) ?? vm.otherExercises[0];
														if (next) {
															setSelectedKey(next.key);
														}
													}}
													style={styles.ctaGap}
												/>
											) : null}
										</>
									) : (
										<Button
											label={`Mulai latihan • ${selectedExercise.durationMin} menit`}
											fullWidth
											onPress={() => {
												trackEvent("primary_cta_clicked", {
													sessionId: numericSessionId,
												});
												setRunnerOpen(true);
											}}
											style={styles.ctaGap}
										/>
									)}
									{vm.otherExercises.length > 0 ? (
										<Pressable
											accessibilityRole="button"
											accessibilityLabel={`Lihat ${vm.otherExercises.length} latihan lainnya`}
											onPress={() => setShowOthers((value) => !value)}
											style={({ pressed }) => [
												styles.linkRow,
												pressed && styles.pressed,
											]}
										>
											<Text style={[type.bodyStrong, styles.link]}>
												{showOthers
													? "Sembunyikan"
													: `Lihat ${vm.otherExercises.length} latihan lainnya`}
											</Text>
										</Pressable>
									) : null}
									{showOthers
										? vm.otherExercises.map((item) => (
												<Pressable
													key={item.key}
													accessibilityRole="button"
													accessibilityLabel={`Pilih ${item.title}`}
													onPress={() => {
														setSelectedKey(item.key);
														setShowOthers(false);
													}}
													style={({ pressed }) => [
														styles.otherRow,
														item.key === effectiveKey && styles.otherActive,
														pressed && styles.pressed,
													]}
												>
													<Text style={[type.body, styles.otherTitle]}>
														{item.title}
													</Text>
													<Text style={[type.small, styles.otherMeta]}>
														{item.durationMin} menit · {item.frequency}
													</Text>
												</Pressable>
											))
										: null}
								</Card>
							</FadeIn>
						) : (
							<FadeIn delay={120}>
								<Card>
									<Text style={[type.body, styles.mutedText]}>
										Belum ada rekomendasi latihan untuk sesi ini.
									</Text>
								</Card>
							</FadeIn>
						)}

						{vm.missedItems.length > 0 ? (
							<FadeIn delay={160}>
								<Text style={[type.h3, styles.sectionTitle]}>
									Yang belum diingat ({vm.missedItems.length})
								</Text>
								<View style={styles.chips}>
									{vm.missedItems.map((item) => (
										<Pressable
											key={item.id}
											accessibilityRole="button"
											accessibilityLabel={`${item.shortLabel}. Ketuk untuk tips.`}
											onPress={() => {
												trackEvent("missed_item_tapped", {
													sessionId: numericSessionId,
												});
												setSheet({
													kind: "missed",
													title: item.shortLabel,
													body: `${item.fullLabel}\n\n${MISSED_HINT_TEMPLATE}`,
												});
											}}
											style={({ pressed }) => [
												styles.missedChip,
												pressed && styles.pressed,
											]}
										>
											<Text style={[type.small, styles.missedText]}>
												{item.shortLabel}
											</Text>
										</Pressable>
									))}
								</View>
								<Pressable
									accessibilityRole="button"
									accessibilityLabel={`Lihat semua ${vm.allItems.length} bagian`}
									onPress={() => setRecallOpen((value) => !value)}
									style={({ pressed }) => [
										styles.linkRow,
										pressed && styles.pressed,
									]}
								>
									<Text style={[type.bodyStrong, styles.link]}>
										{recallOpen
											? "Sembunyikan"
											: `Lihat semua ${vm.allItems.length} bagian`}
									</Text>
								</Pressable>
								{recallOpen
									? vm.allItems.map((item) => (
											<View key={item.id} style={styles.recallRow}>
												<Icon
													name={item.recalled ? "check" : "heart"}
													size={16}
													color={
														item.recalled ? colors.leafDark : colors.primary
													}
												/>
												<Text style={[type.body, styles.recallText]}>
													{item.label}
												</Text>
											</View>
										))
									: null}
							</FadeIn>
						) : null}

						<FadeIn delay={200}>
							<Card>
								<CollapsibleSection
									id="analisis-lengkap"
									title="Analisis lengkap"
									expanded={analysisOpen}
									onToggle={() => {
										const next = !analysisOpen;
										setAnalysisOpen(next);
										if (next) {
											trackEvent("analysis_expanded", {
												sessionId: numericSessionId,
											});
										}
									}}
								>
									{vm.analysis.text ? (
										<Text style={[type.body, styles.analysisText]}>
											{vm.analysis.text}
										</Text>
									) : null}
									{vm.analysis.metrics.map((metric) => (
										<View key={metric.key} style={styles.metricBlock}>
											<View style={styles.metricHead}>
												<Text style={[type.bodyStrong, styles.metricLabel]}>
													{metric.label}
												</Text>
												<Text style={[type.bodyStrong, styles.metricValue]}>
													{metric.value}
												</Text>
											</View>
											<Text style={[type.small, styles.metricExplain]}>
												{metric.explanation}
											</Text>
										</View>
									))}
								</CollapsibleSection>
								{vm.references.length > 0 ? (
									<>
										<View style={styles.accordionDivider} />
										<CollapsibleSection
											id="metode-latihan"
											title="Tentang metode latihan"
											expanded={methodsOpen}
											onToggle={() => setMethodsOpen((value) => !value)}
										>
											{vm.references.map((ref, index) => (
												<Text
													key={`${ref.method}-${index}`}
													style={[type.small, styles.refText]}
												>
													{ref.method} — {ref.citation}
												</Text>
											))}
										</CollapsibleSection>
									</>
								) : null}
							</Card>
						</FadeIn>

						<View style={styles.note}>
							<Icon name="info" size={16} color={colors.textSecondary} />
							<Text style={[type.small, styles.noteText]}>{DISCLAIMER_TEXT}</Text>
						</View>
					</>
				) : null}

				{session && session.status !== "completed" ? (
					<FadeIn delay={30}>
						<Card style={styles.analysisCard}>
							{analysisPoll.isAnalyzing ? (
								<View style={styles.analyzingRow}>
									<ActivityIndicator color={colors.primary} />
									<Text style={[type.body, styles.analysisTextMuted]}>
										{ANALYZING_MESSAGE}
									</Text>
								</View>
							) : null}
							{analysisPhase === "not-started" ? (
								<>
									<Text style={[type.body, styles.analysisTextMuted]}>
										Sesi ini belum dianalisis. Mulai analisis untuk
										memproses rekaman menjadi transkrip dan panduan
										latihan.
									</Text>
									<Button
										label="Mulai Analisis"
										fullWidth
										disabled={analysisPoll.isAnalyzing}
										onPress={() => void analysisPoll.start()}
										style={styles.analysisButton}
									/>
								</>
							) : null}
							{analysisPhase === "failed" ? (
								<>
									<Text style={[type.body, styles.analysisError]}>
										{analysisPoll.message ?? "Analisis gagal. Coba lagi ya."}
									</Text>
									<Button
										label="Analisis Ulang"
										fullWidth
										disabled={analysisPoll.isAnalyzing}
										onPress={() => void analysisPoll.start()}
										style={styles.analysisButton}
									/>
								</>
							) : null}
							{analysisPhase === "timeout" ? (
								<>
									<Text style={[type.body, styles.analysisTextMuted]}>
										{analysisPoll.message}
									</Text>
									<Button
										label="Muat ulang status"
										variant="secondary"
										fullWidth
										onPress={() => void analysisPoll.resume()}
										style={styles.analysisButton}
									/>
								</>
							) : null}
							{analysisPhase === "error" ? (
								<>
									<Text style={[type.body, styles.analysisError]}>
										{analysisPoll.message ?? "Gagal memuat status analisis."}
									</Text>
									<Button
										label="Coba lagi"
										variant="secondary"
										fullWidth
										onPress={() => void analysisPoll.resume()}
										style={styles.analysisButton}
									/>
								</>
							) : null}
							{analysisPhase === "completed" && analysisPoll.transcript ? (
								<>
									<Text style={[type.bodyStrong, styles.transcriptTitle]}>
										Transkrip
									</Text>
									<Text style={[type.body, styles.transcriptText]}>
										{analysisPoll.transcript.text}
									</Text>
								</>
							) : null}
						</Card>
					</FadeIn>
				) : null}

				{ready && !session && !error && hasValidId ? (
					<EmptyState
						title="Sesi tidak ditemukan"
						description="Catatan sesi ini tidak tersedia. Kembali ke Riwayat untuk memilih sesi lain."
					/>
				) : null}
			</ScrollView>

			<BottomSheet
				visible={sheet?.kind === "attention"}
				title="Saran untuk langkah berikutnya"
				onClose={() => setSheet(null)}
			>
				{vm?.attention?.fullText ? (
					<Text style={[type.body, styles.sheetText]}>
						{vm.attention.fullText}
					</Text>
				) : null}
				<Text style={[type.bodyStrong, styles.sheetHead]}>
					Yang bisa dilakukan
				</Text>
				<Text style={[type.body, styles.sheetText]}>
					• Diskusikan hasil ini dengan dokter atau terapis wicara.{"\n"}•
					Lanjutkan latihan harian sesuai anjuran di halaman ini.
				</Text>
				<Button
					label="Simpan ringkasan untuk dokter"
					fullWidth
					onPress={() => {
						void shareSummary().then(() => setSheet(null));
					}}
					style={styles.sheetCta}
				/>
				<Text style={[type.small, styles.sheetNote]}>{DISCLAIMER_TEXT}</Text>
			</BottomSheet>

			<BottomSheet
				visible={sheet?.kind === "missed"}
				title={sheet?.kind === "missed" ? sheet.title : ""}
				onClose={() => setSheet(null)}
			>
				{sheet?.kind === "missed" ? (
					<Text style={[type.body, styles.sheetText]}>{sheet.body}</Text>
				) : null}
			</BottomSheet>

			<Modal
				visible={runnerOpen}
				animationType="slide"
				presentationStyle="pageSheet"
				onRequestClose={() => setRunnerOpen(false)}
			>
				{runnerOpen && selectedExercise && token ? (
					<ExerciseRunner
						token={token}
						sessionId={numericSessionId}
						exercise={selectedExercise}
						onClose={() => setRunnerOpen(false)}
						onCompleted={() => {
							trackEvent("exercise_completed", {
								sessionId: numericSessionId,
							});
							setDoneTitles((current) =>
								current.includes(selectedExercise.title)
									? current
									: [...current, selectedExercise.title],
							);
						}}
					/>
				) : null}
			</Modal>
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
	heroCard: {
		marginTop: spacing.lg,
		alignItems: "center",
	},
	percent: {
		color: colors.primary,
	},
	heroLabel: {
		color: colors.textPrimary,
		marginTop: 12,
		textAlign: "center",
	},
	heroSentence: {
		color: colors.textSecondary,
		textAlign: "center",
		marginTop: 6,
	},
	delta: {
		color: colors.primary,
		fontWeight: "600",
		marginTop: 6,
	},
	banner: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		marginTop: spacing.lg,
		paddingVertical: 12,
		paddingHorizontal: 14,
		borderRadius: radii.cardSmall,
		backgroundColor: colors.marigoldSoft,
		minHeight: 56,
	},
	bannerStrong: {
		borderWidth: 1,
		borderColor: colors.marigold,
	},
	bannerText: {
		flex: 1,
		color: colors.watchFg,
	},
	exerciseCard: {
		marginTop: spacing.lg,
	},
	kicker: {
		color: colors.primary,
		fontWeight: "600",
	},
	exerciseTitle: {
		color: colors.textPrimary,
		marginTop: 4,
	},
	badgeRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		marginTop: 10,
	},
	badge: {
		paddingVertical: 7,
		paddingHorizontal: 14,
		borderRadius: 999,
		backgroundColor: colors.primarySoft,
	},
	badgeText: {
		color: colors.primaryDark,
		fontWeight: "600",
	},
	ctaGap: {
		marginTop: spacing.md,
	},
	otherRow: {
		marginTop: 8,
		padding: 12,
		borderRadius: radii.cardSmall,
		backgroundColor: colors.background,
	},
	otherActive: {
		borderWidth: 1,
		borderColor: colors.primary,
	},
	otherTitle: {
		color: colors.textPrimary,
	},
	otherMeta: {
		color: colors.textSecondary,
		marginTop: 2,
	},
	mutedText: {
		color: colors.textSecondary,
	},
	refText: {
		color: colors.textSecondary,
		marginTop: 6,
	},
	doneText: {
		color: colors.leafDark,
		marginTop: spacing.md,
	},
	linkRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		marginTop: 12,
		minHeight: 44,
		alignSelf: "center",
	},
	link: {
		color: colors.primary,
	},
	sectionTitle: {
		color: colors.textPrimary,
		marginTop: spacing.xl,
		marginBottom: 12,
	},
	chips: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	missedChip: {
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 999,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		minHeight: 44,
		justifyContent: "center",
	},
	missedText: {
		color: colors.textPrimary,
	},
	recallRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	recallText: {
		flex: 1,
		color: colors.textPrimary,
	},
	analysisText: {
		color: colors.textPrimary,
	},
	metricBlock: {
		marginTop: 12,
	},
	metricHead: {
		flexDirection: "row",
		justifyContent: "space-between",
		gap: 12,
	},
	metricLabel: {
		color: colors.textSecondary,
		flex: 1,
	},
	metricValue: {
		color: colors.textPrimary,
	},
	metricExplain: {
		color: colors.textSecondary,
		marginTop: 2,
	},
	accordionDivider: {
		height: 1,
		backgroundColor: colors.border,
		marginVertical: 4,
	},
	analysisCard: {
		marginTop: spacing.lg,
	},
	analyzingRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 12,
	},
	analysisTextMuted: {
		flex: 1,
		color: colors.textSecondary,
	},
	analysisError: {
		color: colors.danger,
	},
	analysisButton: {
		marginTop: spacing.md,
	},
	transcriptTitle: {
		color: colors.textPrimary,
	},
	transcriptText: {
		color: colors.textSecondary,
		marginTop: spacing.sm,
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
	sheetText: {
		color: colors.textPrimary,
	},
	sheetHead: {
		color: colors.textPrimary,
		marginTop: spacing.md,
	},
	sheetCta: {
		marginTop: spacing.lg,
	},
	sheetNote: {
		color: colors.textSecondary,
		marginTop: spacing.md,
	},
	skeleton: {
		borderRadius: radii.cardSmall,
		backgroundColor: colors.border,
		marginTop: spacing.md,
	},
	pressed: {
		opacity: 0.7,
	},
});
