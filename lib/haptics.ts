import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

const HAPTICS_KEY = "@labi/haptics-enabled";

let enabled = true;

export async function loadHapticsPreference(): Promise<boolean> {
	try {
		const raw = await AsyncStorage.getItem(HAPTICS_KEY);
		enabled = raw !== "false";
	} catch {
		enabled = true;
	}
	return enabled;
}

export function isHapticsEnabled(): boolean {
	return enabled;
}

export async function setHapticsEnabled(value: boolean): Promise<void> {
	enabled = value;
	try {
		await AsyncStorage.setItem(HAPTICS_KEY, value ? "true" : "false");
	} catch {
		// Persisting the preference is best-effort.
	}
}

export function tapHaptic(): void {
	if (!enabled) {
		return;
	}
	Haptics.selectionAsync().catch(() => {});
}

export function successHaptic(): void {
	if (!enabled) {
		return;
	}
	Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
		() => {},
	);
}
