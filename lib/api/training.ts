import { request } from "./client";
import { ApiError } from "./errors";
import type {
	SessionTrainingRecommendationRead,
	TrainingLogCreate,
	TrainingLogRead,
} from "./types";

export function getSessionRecommendation(
	token: string,
	sessionId: number,
	signal?: AbortSignal,
): Promise<SessionTrainingRecommendationRead | null> {
	return request<SessionTrainingRecommendationRead>(
		`/sessions/${sessionId}/recommendation`,
		{ method: "GET", token, signal },
	).catch((error: unknown) => {
		if (error instanceof ApiError && error.status === 404) {
			return null;
		}
		throw error;
	});
}

export function listSessionRecommendations(
	token: string,
	sessionId: number,
	signal?: AbortSignal,
): Promise<SessionTrainingRecommendationRead[]> {
	return request<SessionTrainingRecommendationRead[]>(
		`/sessions/${sessionId}/recommendations`,
		{ method: "GET", token, signal },
	);
}

export function listParticipantRecommendations(
	token: string,
	participantId: number,
	signal?: AbortSignal,
): Promise<SessionTrainingRecommendationRead[]> {
	return request<SessionTrainingRecommendationRead[]>(
		`/participants/${participantId}/recommendations`,
		{ method: "GET", token, signal },
	);
}

export function listTrainingLogs(
	token: string,
	sessionId: number,
	signal?: AbortSignal,
): Promise<TrainingLogRead[]> {
	return request<TrainingLogRead[]>(`/sessions/${sessionId}/training-logs`, {
		method: "GET",
		token,
		signal,
	});
}

export function createTrainingLog(
	token: string,
	sessionId: number,
	payload: TrainingLogCreate,
	signal?: AbortSignal,
): Promise<TrainingLogRead> {
	return request<TrainingLogRead>(`/sessions/${sessionId}/training-logs`, {
		method: "POST",
		token,
		body: payload,
		signal,
	});
}
