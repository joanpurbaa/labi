export type SelectOption = {
	value: string;
	label: string;
};

export const AGE_RANGE_OPTIONS: SelectOption[] = [
	{ value: "60-69", label: "60–69 tahun" },
	{ value: "70-79", label: "70–79 tahun" },
	{ value: "80+", label: "80 tahun ke atas" },
];

export const LANGUAGE_OPTIONS: SelectOption[] = [
	{ value: "id", label: "Bahasa Indonesia" },
	{ value: "jv", label: "Bahasa Jawa" },
	{ value: "su", label: "Bahasa Sunda" },
	{ value: "md", label: "Bahasa Madura" },
	{ value: "bug", label: "Bahasa Bugis" },
	{ value: "other", label: "Bahasa lain" },
];

export const GOAL_OPTIONS: SelectOption[] = [
	{ value: "everyday_storytelling", label: "Menceritakan kegiatan sehari-hari" },
	{ value: "answering_questions", label: "Menjawab pertanyaan" },
	{ value: "retelling_story", label: "Menceritakan ulang sebuah cerita" },
	{ value: "expressing_needs", label: "Menyampaikan kebutuhan" },
	{ value: "explore_first", label: "Menjelajah latihan dulu" },
];

export const INSTRUCTION_OPTIONS: SelectOption[] = [
	{ value: "independent", label: "Instruksi mandiri" },
	{ value: "short_simple", label: "Instruksi singkat dan sederhana" },
	{ value: "companion_assistance", label: "Dibantu pendamping" },
	{ value: "unknown", label: "Belum diketahui" },
];

export const DURATION_OPTIONS: SelectOption[] = [
	{ value: "3", label: "3 menit" },
	{ value: "5", label: "5 menit" },
	{ value: "10", label: "10 menit" },
	{ value: "unknown", label: "Belum tahu" },
];

export const TOPIC_OPTIONS: SelectOption[] = [
	{ value: "family", label: "Keluarga" },
	{ value: "hobbies", label: "Hobi" },
	{ value: "food", label: "Makanan" },
	{ value: "daily_activities", label: "Kegiatan harian" },
	{ value: "memories", label: "Kenangan" },
	{ value: "other", label: "Topik lain" },
];

export const MODE_OPTIONS: SelectOption[] = [
	{ value: "independent", label: "Mandiri" },
	{ value: "companion", label: "Dengan pendamping" },
	{ value: "both", label: "Keduanya" },
];

export function optionLabel(
	options: SelectOption[],
	value?: string | null,
): string | null {
	if (!value) {
		return null;
	}
	return options.find((option) => option.value === value)?.label ?? null;
}

export function optionLabels(
	options: SelectOption[],
	values: string[],
): string[] {
	return values
		.map((value) => optionLabel(options, value))
		.filter((label): label is string => Boolean(label));
}
