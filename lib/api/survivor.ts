import type { SurvivorProfile, SurvivorProfileInput } from "../survivor";
import { request } from "./client";
import { ApiError } from "./errors";
import type { SurvivorProfileRead, SurvivorProfileUpsert } from "./types";

function toProfile(
	read: SurvivorProfileRead,
	companionEmail: string,
): SurvivorProfile {
	return {
		companionEmail,
		survivorNickname: read.name,
		ageRange: read.age_range ?? undefined,
		primaryLanguage: read.primary_language ?? undefined,
		communicationGoals: read.communication_goals ?? [],
		instructionPreference: read.instruction_preference ?? undefined,
		preferredSessionDuration: read.preferred_session_duration ?? undefined,
		preferredTopics: read.preferred_topics ?? [],
		practiceMode: read.practice_mode ?? undefined,
		personalizationConfirmed: read.personalization_confirmed,
		updatedAt: read.updated_at,
	};
}

function toUpsert(input: SurvivorProfileInput): SurvivorProfileUpsert {
	return {
		name: input.survivorNickname,
		age_range: (input.ageRange as SurvivorProfileUpsert["age_range"]) ?? null,
		primary_language:
			(input.primaryLanguage as SurvivorProfileUpsert["primary_language"]) ??
			null,
		communication_goals: input.communicationGoals,
		instruction_preference: input.instructionPreference ?? null,
		preferred_session_duration: input.preferredSessionDuration ?? null,
		preferred_topics: input.preferredTopics,
		practice_mode: input.practiceMode ?? null,
		personalization_confirmed: input.personalizationConfirmed,
	};
}

export function getSurvivorProfile(
	token: string,
	companionEmail: string,
): Promise<SurvivorProfile | null> {
	return request<SurvivorProfileRead>("/me/survivor-profile", {
		method: "GET",
		token,
	})
		.then((read) => toProfile(read, companionEmail))
		.catch((error: unknown) => {
			if (error instanceof ApiError && error.status === 404) {
				return null;
			}
			throw error;
		});
}

export async function upsertSurvivorProfile(
	token: string,
	input: SurvivorProfileInput,
	companionEmail: string,
): Promise<SurvivorProfile> {
	const read = await request<SurvivorProfileRead>("/me/survivor-profile", {
		method: "PUT",
		token,
		body: toUpsert(input),
	});
	return toProfile(read, companionEmail);
}

export async function deleteSurvivorProfile(token: string): Promise<void> {
	await request<unknown>("/me/survivor-profile", { method: "DELETE", token });
}
