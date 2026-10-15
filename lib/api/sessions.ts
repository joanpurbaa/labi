import { request, upload } from "./client";
import type {
	AnalysisRead,
	AnalysisRunIn,
	AssessmentItemIn,
	AssessmentRead,
	CompleteOut,
	PaginatedSessions,
	RecordingRead,
	ResultRead,
	SessionCreate,
	SessionRead,
	TranscriptRead,
	TranscriptUpsert,
} from "./types";

export type SessionListParams = {
	participant_id?: number;
	status?: string;
	page?: number;
	page_size?: number;
	signal?: AbortSignal;
};

export type CreateSessionInput = Omit<SessionCreate, "task_type"> & {
	task_type?: string;
};

export function createSession(
	token: string,
	payload: CreateSessionInput,
): Promise<SessionRead> {
	return request<SessionRead>("/sessions", {
		method: "POST",
		token,
		body: { task_type: "immediate_recall", ...payload },
	});
}

export async function listSessions(
	token: string,
	params: SessionListParams = {},
): Promise<PaginatedSessions> {
	const query = new URLSearchParams();
	if (params.participant_id !== undefined) {
		query.set("participant_id", String(params.participant_id));
	}
	if (params.status) {
		query.set("status", params.status);
	}
	if (params.page !== undefined) {
		query.set("page", String(params.page));
	}
	if (params.page_size !== undefined) {
		query.set("page_size", String(params.page_size));
	}
	const suffix = query.toString() ? `?${query.toString()}` : "";
	const data = await request<PaginatedSessions>(`/sessions${suffix}`, {
		method: "GET",
		token,
		signal: params.signal,
	});
	const pagination = data?.pagination ?? {};
	const currentPage = Number(pagination.page ?? params.page ?? 1);
	const totalPages = Number(pagination.total_pages ?? 1);
	const hasNext =
		typeof pagination.has_next === "boolean"
			? pagination.has_next
			: Number.isFinite(totalPages) && currentPage < totalPages;
	return {
		data: Array.isArray(data?.data) ? data.data : [],
		pagination: {
			...pagination,
			page: Number.isFinite(currentPage) ? currentPage : 1,
			total_items: Number(pagination.total_items ?? 0),
			has_next: hasNext,
		},
	};
}

export function getSession(
	token: string,
	sessionId: number,
	signal?: AbortSignal,
): Promise<SessionRead> {
	return request<SessionRead>(`/sessions/${sessionId}`, {
		method: "GET",
		token,
		signal,
	});
}

export function cancelSession(
	token: string,
	sessionId: number,
): Promise<SessionRead> {
	return request<SessionRead>(`/sessions/${sessionId}/cancel`, {
		method: "POST",
		token,
	});
}

export type UploadRecordingOptions = {
	durationMs?: number;
	recordedAt?: string;
	transcriptText?: string;
	onProgress?: (fraction: number) => void;
	signal?: AbortSignal;
};

export async function uploadRecording(
	token: string,
	sessionId: number,
	file: { uri: string; name: string; type: string },
	options: UploadRecordingOptions = {},
): Promise<RecordingRead> {
	const form = new FormData();
	if (file.uri.startsWith("blob:")) {
		const blob = await (await fetch(file.uri)).blob();
		form.append("file", blob, file.name);
	} else {
		form.append(
			"file",
			{ uri: file.uri, name: file.name, type: file.type } as unknown as Blob,
		);
	}
	if (typeof options.durationMs === "number" && Number.isFinite(options.durationMs)) {
		form.append("duration_ms", String(Math.round(options.durationMs)));
	}
	form.append("recorded_at", options.recordedAt ?? new Date().toISOString());
	if (options.transcriptText) {
		form.append("transcript_text", options.transcriptText);
	}
	return upload<RecordingRead>(`/sessions/${sessionId}/recording`, form, {
		token,
		onProgress: options.onProgress,
		signal: options.signal,
	});
}

export function getRecording(
	token: string,
	sessionId: number,
): Promise<string> {
	return request<string>(`/sessions/${sessionId}/recording`, {
		method: "GET",
		token,
	});
}

export function getTranscript(
	token: string,
	sessionId: number,
	signal?: AbortSignal,
): Promise<TranscriptRead> {
	return request<TranscriptRead>(`/sessions/${sessionId}/transcript`, {
		method: "GET",
		token,
		signal,
	});
}

export function upsertTranscript(
	token: string,
	sessionId: number,
	payload: TranscriptUpsert,
): Promise<TranscriptRead> {
	return request<TranscriptRead>(`/sessions/${sessionId}/transcript`, {
		method: "POST",
		token,
		body: payload,
	});
}

export function startAnalysis(
	token: string,
	sessionId: number,
	body?: AnalysisRunIn,
	signal?: AbortSignal,
): Promise<AnalysisRead> {
	return request<AnalysisRead>(`/sessions/${sessionId}/analysis`, {
		method: "POST",
		token,
		body,
		signal,
	});
}

export function getAnalysis(
	token: string,
	sessionId: number,
	signal?: AbortSignal,
): Promise<AnalysisRead> {
	return request<AnalysisRead>(`/sessions/${sessionId}/analysis`, {
		method: "GET",
		token,
		signal,
	});
}

export function putAssessment(
	token: string,
	sessionId: number,
	items: AssessmentItemIn[],
): Promise<AssessmentRead> {
	return request<AssessmentRead>(`/sessions/${sessionId}/assessment`, {
		method: "PUT",
		token,
		body: { items },
	});
}

export function applyIuSuggestions(
	token: string,
	sessionId: number,
): Promise<AssessmentRead> {
	return request<AssessmentRead>(
		`/sessions/${sessionId}/assessment/from-suggestions`,
		{ method: "POST", token },
	);
}

export function completeSession(
	token: string,
	sessionId: number,
	confirm = true,
): Promise<CompleteOut> {
	return request<CompleteOut>(`/sessions/${sessionId}/complete`, {
		method: "POST",
		token,
		body: { confirm },
	});
}

export function getResult(token: string, sessionId: number, signal?: AbortSignal): Promise<ResultRead> {
	return request<ResultRead>(`/sessions/${sessionId}/result`, {
		method: "GET",
		token,
		signal,
	});
}
