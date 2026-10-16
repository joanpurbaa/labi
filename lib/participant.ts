import AsyncStorage from "@react-native-async-storage/async-storage";
import { createParticipant, listParticipants } from "./api";

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

async function setParticipantId(userId: number, id: number): Promise<void> {
	try {
		await AsyncStorage.setItem(participantKey(userId), String(id));
	} catch {
		// cache lokal gagal — id tetap valid untuk sesi ini
	}
}

/**
 * Kembalikan participant_id yang valid di backend. ID cache lama
 * (mis. database di-reset / partisipan diarsipkan) diverifikasi dulu
 * lewat GET /participants; kalau tidak ada, cache dibuang.
 */
export async function resolveParticipantId(
	token: string,
	userId: number,
): Promise<number | null> {
	const cached = await getParticipantId(userId);
	let list: Awaited<ReturnType<typeof listParticipants>> | null = null;
	try {
		list = await listParticipants(token);
	} catch {
		// Daftar gagal dimuat (mis. offline) — pakai cache apa adanya.
		return cached;
	}
	if (cached !== null && list.some((entry) => entry.id === cached)) {
		return cached;
	}
	if (cached !== null) {
		await clearParticipant(userId);
	}
	if (list.length === 0) {
		return null;
	}
	await setParticipantId(userId, list[0].id);
	return list[0].id;
}

export async function ensureParticipant(
	token: string,
	userId: number,
	displayName: string,
	preferredLanguage: string,
): Promise<number> {
	const existing = await resolveParticipantId(token, userId);
	if (existing !== null) {
		return existing;
	}
	const created = await createParticipant(token, {
		display_name: displayName,
		preferred_language: preferredLanguage,
	});
	await setParticipantId(userId, created.id);
	return created.id;
}

export async function clearParticipant(userId: number): Promise<void> {
	try {
		await AsyncStorage.removeItem(participantKey(userId));
	} catch {
		/* ignore */
	}
}
