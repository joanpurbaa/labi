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
