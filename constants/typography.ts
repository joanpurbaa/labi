import type { TextStyle } from "react-native";

type TypographyVariant = TextStyle & { maxFontSizeMultiplier?: number };

export const MAX_FONT_SCALE = 1.4;

export const fonts = {
	display: "PlusJakartaSans_800ExtraBold",
	heading: "PlusJakartaSans_700Bold",
	bodyStrong: "PlusJakartaSans_600SemiBold",
	body: "PlusJakartaSans_400Regular",
} as const;

export const type = {
	display: {
		fontFamily: fonts.display,
		fontSize: 28,
		lineHeight: 38,
		includeFontPadding: false,
	},
	h1: {
		fontFamily: fonts.heading,
		fontSize: 24,
		lineHeight: 33,
		includeFontPadding: false,
	},
	h2: {
		fontFamily: fonts.heading,
		fontSize: 20,
		lineHeight: 28,
		includeFontPadding: false,
	},
	h3: {
		fontFamily: fonts.heading,
		fontSize: 17,
		lineHeight: 24,
		includeFontPadding: false,
	},
	body: {
		fontFamily: fonts.body,
		fontSize: 16,
		lineHeight: 24,
		includeFontPadding: false,
	},
	bodyStrong: {
		fontFamily: fonts.bodyStrong,
		fontSize: 16,
		lineHeight: 24,
		includeFontPadding: false,
	},
	label: {
		fontFamily: fonts.bodyStrong,
		fontSize: 15,
		lineHeight: 21,
		includeFontPadding: false,
		maxFontSizeMultiplier: MAX_FONT_SCALE,
	},
	small: {
		fontFamily: fonts.body,
		fontSize: 14,
		lineHeight: 20,
		includeFontPadding: false,
		maxFontSizeMultiplier: MAX_FONT_SCALE,
	},
	caption: {
		fontFamily: fonts.body,
		fontSize: 14,
		lineHeight: 20,
		includeFontPadding: false,
		maxFontSizeMultiplier: MAX_FONT_SCALE,
	},
	survivorTitle: {
		fontFamily: fonts.heading,
		fontSize: 20,
		lineHeight: 28,
		includeFontPadding: false,
	},
	survivorBody: {
		fontFamily: fonts.body,
		fontSize: 20,
		lineHeight: 28,
		includeFontPadding: false,
	},
	survivorButton: {
		fontFamily: fonts.heading,
		fontSize: 20,
		lineHeight: 28,
		includeFontPadding: false,
	},
} satisfies Record<string, TypographyVariant>;