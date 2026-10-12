import type { StyleProp, ViewStyle } from "react-native";
import { duoColors, type DuoTone } from "../constants/theme";
import { DuoIcon, type DuoIconName } from "./icons/DuoIcon";

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

const GLYPH: Record<IconName, DuoIconName> = {
	brand: "chat-circle",
	notification: "bell",
	mic: "microphone",
	history: "clock-counter-clockwise",
	chart: "chart-bar",
	book: "book-open",
	progress: "chart-line-up",
	chevron: "caret-right",
	home: "house",
	session: "chat-circle",
	profile: "user",
	eye: "eye",
	eyeOff: "eye-slash",
	logout: "sign-out",
	check: "check",
	trash: "trash",
	heart: "heart",
	lock: "lock",
	clock: "clock",
	calendar: "calendar",
	sparkles: "sparkle",
	smile: "smiley",
	moon: "moon",
	star: "star",
	waveform: "waveform",
	info: "info",
	doc: "file-text",
	arrowRight: "arrow-right",
};

const TONE: Record<IconName, DuoTone> = {
	brand: "primary",
	notification: "history",
	mic: "primary",
	history: "history",
	chart: "chart",
	book: "info",
	progress: "chart",
	chevron: "neutral",
	home: "primary",
	session: "primary",
	profile: "primary",
	eye: "neutral",
	eyeOff: "neutral",
	logout: "neutral",
	check: "primary",
	trash: "neutral",
	heart: "primary",
	lock: "neutral",
	clock: "history",
	calendar: "history",
	sparkles: "info",
	smile: "info",
	moon: "history",
	star: "info",
	waveform: "primary",
	info: "info",
	doc: "info",
	arrowRight: "primary",
};

type IconProps = {
	name: IconName;
	size?: number;
	color?: string;
	tint?: string;
	tone?: DuoTone;
	style?: StyleProp<ViewStyle>;
};

export function Icon({
	name,
	size = 22,
	color,
	tint,
	tone,
	style,
}: IconProps) {
	const category = duoColors[tone ?? TONE[name]];
	const lineColor = color ?? category.line;
	const tintColor = tint ?? category.tint;
	return (
		<DuoIcon
			name={GLYPH[name]}
			size={size}
			line={lineColor}
			tint={tintColor}
			style={style}
		/>
	);
}