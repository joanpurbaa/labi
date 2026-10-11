export function getGreeting(date: Date = new Date()): string {
	const hour = date.getHours();
	if (hour >= 4 && hour <= 10) {
		return "Selamat pagi";
	}
	if (hour >= 11 && hour <= 14) {
		return "Selamat siang";
	}
	if (hour >= 15 && hour <= 17) {
		return "Selamat sore";
	}
	return "Selamat malam";
}

export type GreetingKey = "pagi" | "siang" | "sore" | "malam";

export function getGreetingKey(date: Date = new Date()): GreetingKey {
	const hour = date.getHours();
	if (hour >= 4 && hour <= 10) {
		return "pagi";
	}
	if (hour >= 11 && hour <= 14) {
		return "siang";
	}
	if (hour >= 15 && hour <= 17) {
		return "sore";
	}
	return "malam";
}
