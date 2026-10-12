const FIELD_LABELS: Record<string, string> = {
	username: "Nama lengkap",
	email: "Email",
	password: "Password",
};

export class ApiError extends Error {
	readonly status: number;
	readonly data: unknown;

	constructor(message: string, status: number, data: unknown = null) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.data = data;
	}
}

function detailValue(data: unknown): unknown {
	if (data && typeof data === "object" && "detail" in data) {
		return (data as { detail: unknown }).detail;
	}
	return null;
}

function validationMessage(detail: unknown): string {
	if (Array.isArray(detail) && detail.length > 0) {
		const first = detail[0] as { loc?: unknown };
		const loc = Array.isArray(first?.loc) ? first.loc : [];
		const field = String(loc[loc.length - 1] ?? "");
		const label = FIELD_LABELS[field];
		if (label) {
			return `${label} yang dimasukkan tidak valid.`;
		}
	}
	return "Data yang dimasukkan tidak valid.";
}

export function errorMessage(error: unknown): string {
	if (error instanceof ApiError) {
		if (error.status === 422) {
			return validationMessage(detailValue(error.data));
		}
		if (error.status === 401) {
			return "Email atau password salah.";
		}
		if (error.status === 400 || error.status === 409) {
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
