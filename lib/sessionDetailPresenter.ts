/**
 * Presenter halaman Detail Sesi: mengubah respons API mentah menjadi
 * view-model siap tampil. Komponen UI hanya boleh membaca view-model ini.
 *
 * Field API yang dipakai (lihat lib/api/schema.d.ts):
 * - SessionRead: id, story_id, status, created_at
 * - ResultRead: iu_recall_percent, met_count, not_met_count, unclear_count,
 *   story_title, items[] { iu_id, description, status }
 * - SessionTrainingRecommendationRead: urgency_level, primary_mode,
 *   secondary_mode, target_goal, overall_interpretation, medical_alert,
 *   home_trainings[] { training_mode, level, level_title, title,
 *   target_area, instructions, frequency, duration_minutes, method_basis }
 * - TrendPoint (untuk delta): session_id, iu_recall_percent, completed_at
 * - SurvivorProfile.survivorNickname untuk nama (fallback "Beliau")
 *
 * ASUMSI (tidak ada field-nya di API, dihitung di FE):
 * - severity banner: high bila medical_alert ada, moderate bila delta < -3,
 *   selain itu info.
 * - hint per item belum-diingat: tidak ada field-nya di API, pakai template
 *   generik (HINT_TEMPLATE, [REVIEW KONTEN]).
 * - shortLabel chip: pemendekan mekanis (truncate), bukan mapping semantik.
 */

import type {
	ResultRead,
	SessionTrainingRecommendationRead,
	TrendPoint,
} from "./api";
import { formatSessionDate } from "./sessionDisplay";

export type AttentionSeverity = "info" | "moderate" | "high";

export type ScoreViewModel = {
	percent: number | null;
	recalledCount: number;
	totalCount: number;
	label: string;
	summarySentence: string;
	deltaVsPrevious: number | null;
	ariaLabel: string;
};

export type AttentionViewModel = {
	show: boolean;
	shortText: string;
	severity: AttentionSeverity;
	fullText: string;
};

export type ExerciseViewModel = {
	key: string;
	mode: string;
	modeTag: string;
	levelTitle: string;
	title: string;
	durationMin: number;
	frequency: string;
	targetArea: string;
	steps: string[];
	tip: string | null;
	reference: string;
};

export type MissedItemViewModel = {
	id: number;
	shortLabel: string;
	fullLabel: string;
};

export type RecalledItemViewModel = {
	id: number;
	label: string;
	recalled: boolean;
};

export type MetricViewModel = {
	key: string;
	label: string;
	value: string;
	/** [REVIEW KONTEN] penjelasan awam, validasi tim klinis sebelum rilis. */
	explanation: string;
};

export type ReferenceViewModel = {
	method: string;
	citation: string;
};

export type SessionDetailViewModel = {
	header: { date: string; storyTitle: string };
	score: ScoreViewModel;
	attention: AttentionViewModel | null;
	todayExercise: ExerciseViewModel | null;
	otherExercises: ExerciseViewModel[];
	missedItems: MissedItemViewModel[];
	allItems: RecalledItemViewModel[];
	analysis: { text: string; metrics: MetricViewModel[] };
	references: ReferenceViewModel[];
};

export const DISCLAIMER_TEXT =
	"Ini bukan diagnosis. Catatan hanya untuk melihat kebiasaan.";

/** [REVIEW KONTEN] template generik, validasi tim klinis sebelum rilis. */
export const MISSED_HINT_TEMPLATE =
	"Bacakan kembali bagian ini, beri jeda beberapa detik, lalu minta diulang dengan kata sendiri.";

const MODE_TAGS: Record<string, string> = {
	sfa: "Latihan menamai benda",
};

const MAX_SHORT_LABEL = 34;

export function scoreLabel(percent: number | null): string {
	if (percent === null || !Number.isFinite(percent)) {
		return "Belum dinilai";
	}
	if (percent >= 70) {
		return "Sangat baik";
	}
	if (percent >= 40) {
		return "Cukup baik, ada ruang berkembang";
	}
	return "Perlu banyak bantuan";
}

export function shortLabel(text: string): string {
	const clean = text.trim();
	if (clean.length <= MAX_SHORT_LABEL) {
		return clean;
	}
	return `${clean.slice(0, MAX_SHORT_LABEL).trimEnd()}…`;
}

function splitSteps(instructions: string): string[] {
	return instructions
		.split(/(?<=[.!?])\s+/)
		.map((step) => step.trim())
		.filter((step) => step.length > 0);
}

function toExercise(
	training: SessionTrainingRecommendationRead["home_trainings"][number],
	index: number,
): ExerciseViewModel {
	return {
		key: `${training.level}-${index}`,
		mode: training.training_mode,
		modeTag: MODE_TAGS[training.training_mode] ?? training.training_mode.toUpperCase(),
		levelTitle: training.level_title,
		title: training.title,
		durationMin: training.duration_minutes,
		frequency: training.frequency,
		targetArea: training.target_area,
		steps: splitSteps(training.instructions),
		tip: null,
		reference: training.method_basis,
	};
}

/** Delta vs sesi selesai sebelumnya (dari series tren). null bila tak ada data. */
export function deltaVsPrevious(
	series: TrendPoint[] | null | undefined,
	sessionId: number,
): number | null {
	if (!series || series.length === 0) {
		return null;
	}
	const ordered = [...series]
		.filter((point) => typeof point.iu_recall_percent === "number")
		.sort((a, b) => (a.session_id ?? 0) - (b.session_id ?? 0));
	const index = ordered.findIndex((point) => point.session_id === sessionId);
	if (index <= 0) {
		return null;
	}
	const current = ordered[index].iu_recall_percent as number;
	const previous = ordered[index - 1].iu_recall_percent as number;
	return Math.round(current - previous);
}

export function buildSessionDetailViewModel(args: {
	sessionId: number;
	storyTitle: string;
	createdAt?: string | null;
	survivorName?: string | null;
	result: ResultRead | null;
	recommendation: SessionTrainingRecommendationRead | null;
	series?: TrendPoint[] | null;
}): SessionDetailViewModel {
	const name =
		args.survivorName && args.survivorName.trim()
			? args.survivorName.trim()
			: "Beliau";
	const result = args.result;
	const totalCount = result?.items.length ?? 0;
	const recalledCount =
		typeof result?.met_count === "number"
			? result.met_count
			: (result?.items.filter((item) => item.status === "met").length ?? 0);
	const percent =
		typeof result?.iu_recall_percent === "number" ? result.iu_recall_percent : null;
	const delta = deltaVsPrevious(args.series, args.sessionId);

	const summarySentence =
		totalCount > 0
			? `${name} mengingat ${recalledCount} dari ${totalCount} bagian cerita.`
			: `${name} belum memiliki rincian penilaian.`;

	const medicalAlert =
		args.recommendation?.medical_alert?.trim() || null;
	let attention: SessionDetailViewModel["attention"] = null;
	if (medicalAlert || (delta !== null && delta < -3)) {
		attention = {
			show: true,
			shortText: "Daya ingat cerita menurun dibanding biasanya.",
			severity: medicalAlert ? "high" : "moderate",
			fullText: medicalAlert ?? "",
		};
	} else if (percent !== null && percent < 40) {
		attention = {
			show: true,
			shortText: "Daya ingat cerita masih rendah, latihan rutin membantu.",
			severity: "info",
			fullText: "",
		};
	}

	const exercises = (args.recommendation?.home_trainings ?? []).map(toExercise);

	const missedItems: MissedItemViewModel[] = (result?.items ?? [])
		.filter((item) => item.status !== "met")
		.map((item) => ({
			id: item.iu_id,
			shortLabel: shortLabel(item.description),
			fullLabel: item.description,
		}));

	const allItems: RecalledItemViewModel[] = (result?.items ?? []).map(
		(item) => ({
			id: item.iu_id,
			label: item.description,
			recalled: item.status === "met",
		}),
	);

	const metrics: MetricViewModel[] = [];
	if (percent !== null) {
		metrics.push({
			key: "recall",
			label: "Daya ingat",
			value: `${Math.round(percent)}%`,
			explanation:
				"Persentase bagian cerita yang berhasil diingat kembali.",
		});
	}
	if (delta !== null) {
		metrics.push({
			key: "delta",
			label: "Perubahan vs sesi lalu",
			value: `${delta > 0 ? "+" : ""}${delta}%`,
			explanation:
				"Selisih daya ingat sesi ini dibanding sesi selesai sebelumnya.",
		});
	}
	if (result) {
		metrics.push({
			key: "counts",
			label: "Rincian",
			value: `${result.met_count} diingat · ${result.not_met_count} belum · ${result.unclear_count} tidak jelas`,
			explanation: "Jumlah bagian cerita per status penilaian.",
		});
	}

	const seen = new Set<string>();
	const references: ReferenceViewModel[] = [];
	for (const training of args.recommendation?.home_trainings ?? []) {
		const citation = training.method_basis?.trim();
		if (!citation || seen.has(citation)) {
			continue;
		}
		seen.add(citation);
		references.push({
			method: training.training_mode.toUpperCase(),
			citation,
		});
	}

	return {
		header: {
			date: formatSessionDate(args.createdAt),
			storyTitle: args.storyTitle,
		},
		score: {
			percent,
			recalledCount,
			totalCount,
			label: scoreLabel(percent),
			summarySentence,
			deltaVsPrevious: delta,
			ariaLabel:
				percent === null
					? "Skor ingatan belum tersedia"
					: `Skor ingatan ${Math.round(percent)} persen, ${recalledCount} dari ${totalCount} bagian cerita diingat`,
		},
		attention,
		todayExercise: exercises[0] ?? null,
		otherExercises: exercises.slice(1),
		missedItems,
		allItems,
		analysis: {
			text: args.recommendation?.overall_interpretation ?? "",
			metrics,
		},
		references,
	};
}
