/**
 * Stub analitik: belum ada infrastruktur, event hanya dicatat di dev.
 * Ganti isi trackEvent dengan SDK analitik bila sudah tersedia.
 */
export type AnalyticsEvent =
	| "session_detail_viewed"
	| "primary_cta_clicked"
	| "exercise_started"
	| "exercise_completed"
	| "attention_banner_opened"
	| "doctor_cta_clicked"
	| "analysis_expanded"
	| "missed_item_tapped"
	| "scroll_depth";

export function trackEvent(
	event: AnalyticsEvent,
	params?: Record<string, string | number | boolean>,
): void {
	if (__DEV__) {
		console.log("[analytics]", event, params ?? {});
	}
}
