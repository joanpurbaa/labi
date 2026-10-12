import type { MascotKey } from "../components/mascot/mascotRegistry";
import type { StatusTone } from "../constants/theme";

export function isSleepyHour(date: Date = new Date()): boolean {
	const hour = date.getHours();
	return hour >= 21 || hour <= 4;
}

export function statusToExpression(tone: StatusTone): MascotKey {
	switch (tone) {
		case "stable":
			return "gembira";
		case "watch":
			return "peduli";
		case "consult":
			return "menenangkan";
		default:
			return "menyambut";
	}
}

export function mascotForHome(
	tone: StatusTone,
	date: Date = new Date(),
): MascotKey {
	if (isSleepyHour(date)) {
		return "mengantuk";
	}
	return statusToExpression(tone);
}
