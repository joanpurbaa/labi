import AsyncStorage from "@react-native-async-storage/async-storage";
import { createParticipant } from "./api";

function participantKey(userId: number): string {
	return `@labi/participant/${userId}`;
}

export async function getParticipantId(userId: number): Promise<number | null> {
	try {
		const raw = await AsyncStorage.getItem(participantKey(userId));
		if (!raw) {
			return null;
		}
		const id = Number(raw);
		return Number.isFinite(id) ? id : null;
	} catch {
		return null;
	}
}

export async function ensureParticipant(
	token: string,
	userId: number,
	displayName: string,
	preferredLanguage: string,
): Promise<number> {
	const cached = await getParticipantId(userId);
	if (cached !== null) {
		return cached;
	}
	const created = await createParticipant(token, {
		display_name: displayName,
		preferred_language: preferredLanguage,
	});
	await AsyncStorage.setItem(participantKey(userId), String(created.id));
	return created.id;
}

export async function clearParticipant(userId: number): Promise<void> {
	try {
		await AsyncStorage.removeItem(participantKey(userId));
	} catch {
		/* ignore */
	}
}
