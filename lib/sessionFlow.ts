export const SESSION_STATUS = {
	created: "created",
	recordingUploaded: "recording_uploaded",
	running: "running",
	completed: "completed",
	failed: "failed",
	cancelled: "cancelled",
} as const;

export type SessionStatus = (typeof SESSION_STATUS)[keyof typeof SESSION_STATUS];

export type SessionDestination =
	| "sesi-bercerita"
	| "sesi-proses"
	| "sesi-hasil"
	| "sesi-pilih";

export function sessionDestination(status?: string | null): SessionDestination {
	switch (status) {
		case "created":
			return "sesi-bercerita";
		case "recording_uploaded":
		case "running":
		case "failed":
			return "sesi-proses";
		case "completed":
			return "sesi-hasil";
		case "cancelled":
		default:
			return "sesi-pilih";
	}
}

export function isSessionActive(status?: string | null): boolean {
	return (
		status === "created" ||
		status === "recording_uploaded" ||
		status === "running" ||
		status === "failed"
	);
}

export function isAnalysisDone(status?: string | null): boolean {
	return status === "completed";
}

export function isAnalysisFailed(status?: string | null): boolean {
	return status === "failed";
}

export function analysisErrorText(
	code?: string | null,
	fallback?: string | null,
): string {
	void fallback;
	const safeCode = code && /^[A-Za-z0-9_.-]{1,64}$/.test(code) ? code : null;
	return safeCode
		? `Proses belum berhasil (kode ${safeCode}). Coba proses lagi.`
		: "Proses belum berhasil. Coba proses lagi.";
}
