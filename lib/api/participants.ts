import { request } from "./client";
import type {
	ParticipantCreate,
	ParticipantRead,
	ParticipantTrendRead,
} from "./types";

export function listParticipants(token: string): Promise<ParticipantRead[]> {
	return request<ParticipantRead[]>("/participants", { method: "GET", token });
}

export function createParticipant(
	token: string,
	payload: ParticipantCreate,
): Promise<ParticipantRead> {
	return request<ParticipantRead>("/participants", {
		method: "POST",
		token,
		body: payload,
	});
}

export function getParticipant(
	token: string,
	participantId: number,
): Promise<ParticipantRead> {
	return request<ParticipantRead>(`/participants/${participantId}`, {
		method: "GET",
		token,
	});
}

export function getParticipantTrend(
	token: string,
	participantId: number,
	signal?: AbortSignal,
): Promise<ParticipantTrendRead> {
	return request<ParticipantTrendRead>(
		`/participants/${participantId}/analysis-trend`,
		{ method: "GET", token, signal },
	);
}
