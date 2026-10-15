import { request } from "./client";
import type { StoryDetail, StoryListItem } from "./types";

function toStory(raw: unknown): StoryListItem | null {
	if (!raw || typeof raw !== "object") {
		return null;
	}
	const entry = raw as Record<string, unknown>;
	const id = Number(entry.id ?? entry.story_id);
	if (!Number.isFinite(id)) {
		return null;
	}
	return {
		id,
		title: typeof entry.title === "string" ? entry.title : "Cerita",
		version:
			typeof entry.version === "number"
				? entry.version
				: typeof entry.version_number === "number"
					? entry.version_number
					: undefined,
		status: typeof entry.status === "string" ? entry.status : undefined,
	};
}

function normalizeList(data: unknown): StoryListItem[] {
	if (Array.isArray(data)) {
		return data
			.map(toStory)
			.filter((story): story is StoryListItem => story !== null);
	}
	if (data && typeof data === "object") {
		const record = data as Record<string, unknown>;
		const direct = record.items ?? record.results ?? record.data;
		const source = Array.isArray(direct) ? direct : Object.values(record);
		return source
			.map(toStory)
			.filter((story): story is StoryListItem => story !== null);
	}
	return [];
}

export async function listStories(token: string, signal?: AbortSignal): Promise<StoryListItem[]> {
	const data = await request<unknown>("/stories", { method: "GET", token, signal });
	return normalizeList(data);
}

export function getStory(token: string, storyId: number, signal?: AbortSignal): Promise<StoryDetail> {
	return request<StoryDetail>(`/stories/${storyId}`, { method: "GET", token, signal });
}
