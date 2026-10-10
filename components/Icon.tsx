import {
	SymbolView,
	type AndroidSymbol,
	type SFSymbol,
} from "expo-symbols";
import type { StyleProp, ViewStyle } from "react-native";

export type IconName =
	| "brand"
	| "notification"
	| "mic"
	| "history"
	| "chart"
	| "book"
	| "progress"
	| "chevron"
	| "home"
	| "session"
	| "profile"
	| "eye"
	| "eyeOff"
	| "logout"
	| "check"
	| "trash"
	| "heart"
	| "lock"
	| "clock"
	| "calendar"
	| "sparkles"
	| "smile"
	| "moon"
	| "star"
	| "waveform"
	| "info"
	| "doc"
	| "arrowRight";

const glyphs: Record<
	IconName,
	{ ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol }
> = {
	brand: {
		ios: "bubble.left.and.bubble.right.fill",
		android: "forum",
		web: "forum",
	},
	notification: { ios: "bell", android: "notifications", web: "notifications" },
	mic: { ios: "mic.fill", android: "mic", web: "mic" },
	history: { ios: "clock.arrow.circlepath", android: "history", web: "history" },
	chart: { ios: "chart.bar.fill", android: "bar_chart", web: "bar_chart" },
	book: { ios: "book.fill", android: "menu_book", web: "menu_book" },
	progress: {
		ios: "chart.line.uptrend.xyaxis",
		android: "monitoring",
		web: "monitoring",
	},
	chevron: { ios: "chevron.right", android: "chevron_right", web: "chevron_right" },
	home: { ios: "house.fill", android: "home", web: "home" },
	session: { ios: "bubble.left.fill", android: "chat_bubble", web: "chat_bubble" },
	profile: { ios: "person.fill", android: "person", web: "person" },
	eye: { ios: "eye", android: "visibility", web: "visibility" },
	eyeOff: { ios: "eye.slash", android: "visibility_off", web: "visibility_off" },
	logout: {
		ios: "rectangle.portrait.and.arrow.right",
		android: "logout",
		web: "logout",
	},
	check: { ios: "checkmark", android: "check", web: "check" },
	trash: { ios: "trash", android: "delete", web: "delete" },
	heart: { ios: "heart.fill", android: "favorite", web: "favorite" },
	lock: { ios: "lock.fill", android: "lock", web: "lock" },
	clock: { ios: "clock", android: "schedule", web: "schedule" },
	calendar: { ios: "calendar", android: "event", web: "event" },
	sparkles: { ios: "sparkles", android: "auto_awesome", web: "auto_awesome" },
	smile: { ios: "face.smiling", android: "mood", web: "mood" },
	moon: { ios: "moon.fill", android: "dark_mode", web: "dark_mode" },
	star: { ios: "star.fill", android: "star", web: "star" },
	waveform: { ios: "waveform", android: "graphic_eq", web: "graphic_eq" },
	info: { ios: "info.circle.fill", android: "info", web: "info" },
	doc: { ios: "doc.text.fill", android: "description", web: "description" },
	arrowRight: { ios: "arrow.right", android: "arrow_forward", web: "arrow_forward" },
};

type IconProps = {
	name: IconName;
	size?: number;
	color?: string;
	style?: StyleProp<ViewStyle>;
};

export function Icon({ name, size = 22, color, style }: IconProps) {
	return (
		<SymbolView name={glyphs[name]} size={size} tintColor={color} style={style} />
	);
}
