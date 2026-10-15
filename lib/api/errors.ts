export type ApiErrorCode =
	| "config"
	| "aborted"
	| "timeout"
	| "network"
	| "invalid_response"
	| "http";

const FIELD_LABELS: Record<string, string> = {
	username: "Nama lengkap",
	email: "Email",
	password: "Password",
	name: "Nama panggilan",
	display_name: "Nama panggilan",
	date_of_birth: "Tanggal lahir",
	preferred_language: "Bahasa",
	participant_id: "Peserta",
	story_id: "Cerita",
	session_id: "Sesi",
	text: "Teks transkrip",
	file: "Rekaman",
	age_range: "Rentang usia",
	communication_goals: "Tujuan komunikasi",
	instruction_preference: "Preferensi instruksi",
	preferred_session_duration: "Durasi sesi",
	preferred_topics: "Topik",
	practice_mode: "Mode latihan",
	items: "Penilaian",
};

export class ApiError extends Error {
	readonly status: number;
	readonly data: unknown;
	readonly code: ApiErrorCode;

	constructor(
		message: string,
		status: number,
		data: unknown = null,
		code: ApiErrorCode = "http",
	) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.data = data;
		this.code = code;
	}
}

function detailValue(data: unknown): unknown {
	if (data && typeof data === "object" && "detail" in data) {
		return (data as { detail: unknown }).detail;
	}
	return null;
}

type ValidationIssue = { loc?: unknown; msg?: unknown };

function validationIssues(detail: unknown): ValidationIssue[] {
	return Array.isArray(detail) ? (detail as ValidationIssue[]) : [];
}

function fieldName(issue: ValidationIssue): string {
	const loc = Array.isArray(issue.loc) ? issue.loc : [];
	const last = loc[loc.length - 1];
	return typeof last === "string" ? last : "";
}

export function errorFields(error: unknown): Record<string, string> {
	const fields: Record<string, string> = {};
	if (!(error instanceof ApiError) || error.status !== 422) {
		return fields;
	}
	for (const issue of validationIssues(detailValue(error.data))) {
		const field = fieldName(issue);
		if (!field || fields[field]) {
			continue;
		}
		fields[field] = `${FIELD_LABELS[field] ?? field} tidak valid.`;
	}
	return fields;
}

function validationMessage(detail: unknown): string {
	const issues = validationIssues(detail);
	if (issues.length > 0) {
		const label = FIELD_LABELS[fieldName(issues[0])];
		if (label) {
			return `${label} yang dimasukkan tidak valid.`;
		}
	}
	return "Data yang dimasukkan tidak valid.";
}

export function isAuthError(error: unknown): boolean {
	return error instanceof ApiError && error.status === 401;
}

export function isAbortError(error: unknown): boolean {
	return error instanceof ApiError && error.code === "aborted";
}

export function errorMessage(error: unknown): string {
	if (error instanceof ApiError) {
		if (error.code === "aborted") {
			return "Permintaan dibatalkan.";
		}
		if (error.code === "timeout") {
			return "Koneksi lambat. Periksa jaringan lalu coba lagi.";
		}
		if (error.code === "network" || error.status === 0) {
			return "Tidak dapat terhubung ke server. Periksa jaringanmu lalu coba lagi.";
		}
		if (error.code === "config") {
			return error.message;
		}
		if (error.code === "invalid_response") {
			return "Server mengirim respons yang tidak dikenal. Coba lagi nanti.";
		}
		if (error.status === 422) {
			return validationMessage(detailValue(error.data));
		}
		if (error.status === 401) {
			return "Sesi tidak valid. Silakan masuk lagi.";
		}
		if (error.status === 403) {
			return "Kamu tidak punya akses untuk tindakan ini.";
		}
		if (error.status === 404) {
			return "Data yang diminta tidak ditemukan.";
		}
		if (error.status === 409) {
			return "Email atau nama sudah terdaftar. Coba masuk saja.";
		}
		if (error.status === 400) {
			const detail = detailValue(error.data);
			if (typeof detail === "string") {
				return detail;
			}
			return "Permintaan tidak dapat diproses. Periksa kembali datamu.";
		}
		if (error.status >= 500) {
			return "Server sedang bermasalah. Coba lagi nanti.";
		}
		return error.message;
	}
	return "Terjadi kesalahan. Coba lagi.";
}
