import AsyncStorage from "@react-native-async-storage/async-storage";

export type ActiveSession = {
	sessionId: number;
	storyId: number;
	recordingUri?: string;
	recordingDurationMs?: number;
};

function activeSessionKey(userId: number): string {
	return `@labi/active-session/${userId}`;
}

export async function setActiveSession(
	userId: number,
	session: ActiveSession,
): Promise<void> {
	try {
		await AsyncStorage.setItem(
			activeSessionKey(userId),
			JSON.stringify(session),
		);
	} catch {
		/* ignore */
	}
}

export async function getActiveSession(
	userId: number,
): Promise<ActiveSession | null> {
	try {
		const raw = await AsyncStorage.getItem(activeSessionKey(userId));
		if (!raw) {
			return null;
		}
		const parsed = JSON.parse(raw) as Partial<ActiveSession>;
		const sessionId = Number(parsed.sessionId);
		const storyId = Number(parsed.storyId);
		if (!Number.isFinite(sessionId) || !Number.isFinite(storyId)) {
			return null;
		}
		return {
			sessionId,
			storyId,
			recordingUri:
				typeof parsed.recordingUri === "string" ? parsed.recordingUri : undefined,
			recordingDurationMs:
				typeof parsed.recordingDurationMs === "number" ? parsed.recordingDurationMs : undefined,
		};
	} catch {
		return null;
	}
}

export async function clearActiveSession(userId: number): Promise<void> {
	try {
		await AsyncStorage.removeItem(activeSessionKey(userId));
	} catch {
		/* ignore */
	}
}
