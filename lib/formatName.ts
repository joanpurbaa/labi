export function formatName(value: string): string {
	if (!value) {
		return "";
	}
	return value.replace(/\b\w/g, (char) => char.toUpperCase());
}