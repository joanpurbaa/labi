import type { TextStyle, ViewStyle } from "react-native";

export const colors = {
	background: "#FBF6EF",
	bg: "#FBF6EF",
	surface: "#FFFFFF",
	card: "#FFFFFF",
	surfaceWarm: "#FFF1E3",
	accentSoft: "#FDE7D3",
	textPrimary: "#1F2A28",
	text: "#1F2A28",
	textSecondary: "#5A6663",
	textMuted: "#5A6663",
	border: "#ECE4DA",
	borderStrong: "#E0D6C8",
	primary: "#1B6E64",
	primaryDark: "#14544C",
	primarySoft: "#E3F1EE",
	accent: "#F6B27A",
	success: "#1E6B3A",
	danger: "#9C3F2B",
	dangerSoft: "#FBE9E3",
} as const;

export const statusColors = {
	stable: { bg: "#E4F3E8", fg: "#1E6B3A" },
	watch: { bg: "#FFF3DC", fg: "#8A5200" },
	consult: { bg: "#FBE9E3", fg: "#9C3F2B" },
} as const;

export type StatusTone = keyof typeof statusColors;

export const radii = {
	card: 24,
	cardSmall: 18,
	button: 999,
	pill: 999,
	input: 16,
	icon: 14,
} as const;

export const layout = {
	screenPadding: 20,
	sectionGap: 24,
	maxContentWidth: 520,
} as const;

export const spacing = {
	xs: 4,
	sm: 8,
	md: 12,
	lg: 16,
	xl: 20,
	xxl: 24,
	xxxl: 32,
} as const;

export const fonts = {
	heading: "PlusJakartaSans-Bold",
	semibold: "PlusJakartaSans-SemiBold",
	medium: "PlusJakartaSans-Medium",
	body: "PlusJakartaSans-Regular",
	survivor: "AtkinsonHyperlegible-Regular",
	survivorBold: "AtkinsonHyperlegible-Bold",
} as const;

export const type = {
	display: {
		fontFamily: fonts.heading,
		fontSize: 30,
		lineHeight: 38,
	},
	h1: { fontFamily: fonts.heading, fontSize: 25, lineHeight: 32 },
	h2: { fontFamily: fonts.semibold, fontSize: 20, lineHeight: 28 },
	h3: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 24 },
	body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24 },
	bodyStrong: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 24 },
	label: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21 },
	small: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
	survivorTitle: {
		fontFamily: fonts.survivorBold,
		fontSize: 31,
		lineHeight: 46,
	},
	survivorBody: {
		fontFamily: fonts.survivor,
		fontSize: 22,
		lineHeight: 35,
	},
	survivorButton: {
		fontFamily: fonts.survivorBold,
		fontSize: 23,
		lineHeight: 30,
	},
} satisfies Record<string, TextStyle>;

export const shadows: Record<"card" | "hero" | "pill" | "nav", ViewStyle> = {
	card: {
		shadowColor: "#785028",
		shadowOpacity: 0.08,
		shadowRadius: 24,
		shadowOffset: { width: 0, height: 6 },
		elevation: 3,
	},
	hero: {
		shadowColor: "#B07A45",
		shadowOpacity: 0.14,
		shadowRadius: 28,
		shadowOffset: { width: 0, height: 10 },
		elevation: 5,
	},
	pill: {
		shadowColor: "#785028",
		shadowOpacity: 0.1,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 4 },
		elevation: 2,
	},
	nav: {
		shadowColor: "#785028",
		shadowOpacity: 0.1,
		shadowRadius: 18,
		shadowOffset: { width: 0, height: -4 },
		elevation: 8,
	},
};

export const gradients = {
	hero: ["#FFF3E6", "#FBF6EF"] as const,
	warm: ["#FBF6EF", "#FDE7D3"] as const,
	mint: ["#FBF6EF", "#E3F1EE"] as const,
};

export const motion = {
	enterDuration: 340,
	stagger: 60,
	pressScale: 0.97,
	ringDuration: 700,
} as const;
