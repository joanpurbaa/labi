import type { StatusTone } from "../constants/theme";

const MONTHS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"Mei",
	"Jun",
	"Jul",
	"Agu",
	"Sep",
	"Okt",
	"Nov",
	"Des",
];

export function formatSessionDate(iso?: string | null): string {
	if (!iso) {
		return "Belum selesai";
	}
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) {
		return "Belum selesai";
	}
	return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function recallTone(
	percent?: number | null,
	status?: string,
): StatusTone {
	if (status === "cancelled") {
		return "watch";
	}
	if (typeof percent !== "number") {
		return "watch";
	}
	if (percent >= 70) {
		return "stable";
	}
	if (percent >= 40) {
		return "watch";
	}
	return "consult";
}

export function recallLabel(percent?: number | null): string {
	if (typeof percent !== "number") {
		return "Belum dinilai";
	}
	return `${Math.round(percent)}% diingat`;
}

export function resultItemTone(status: string): StatusTone {
	if (status === "met") {
		return "stable";
	}
	if (status === "not_met") {
		return "consult";
	}
	return "watch";
}

export function resultItemLabel(status: string): string {
	if (status === "met") {
		return "Diingat";
	}
	if (status === "not_met") {
		return "Belum diingat";
	}
	return "Tidak jelas";
}
