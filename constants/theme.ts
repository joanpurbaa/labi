import type { ViewStyle } from "react-native";
import { type, fonts } from "./typography";

export { type, fonts }; // single source: constants/typography.ts

// ── ATURAN EMAS WORKLETS (react-native-reanimated / react-native-worklets) ──────
// Di dalam useAnimatedStyle, useAnimatedProps, useDerivedValue, useAnimatedReaction,
// useAnimatedScrollHandler, callback withTiming/withSpring/withSequence/withRepeat,
// handler gesture, dan worklet lain, HANYA boleh dipakai:
//   (a) SharedValue (baca/tulis lewat .value),
//   (b) nilai primitif (angka/string/boolean) yang di-capture dari luar,
//   (c) fungsi diberi direktif "worklet" yang hanya memakai (a)/(b) atau worklet lain,
//   (d) API Reanimated/Math bawaan (interpolate, Math.min, dsb).
// DILARANG memanggil fungsi biasa (helper tema/format/closure komponen) di thread UI;
// hitung geometri di thread JS → kirim via SharedValue yang di-set dari useEffect/handler.
// Efek samping JS (haptic, setState, navigasi) dari worklet WAJIB via runOnJS/scheduleOnRN.
// ─────────────────────────────────────────────────────────────────────────────────

export const colors = {
	background: "#FFF8EE",
	bg: "#FFF8EE",
	surface: "#FFFFFF",
	card: "#FFFFFF",
	surfaceWarm: "#FFEFD9",
	accentSoft: "#FFE6D0",
	textPrimary: "#2B2220",
	text: "#2B2220",
	textSecondary: "#6B5B55",
	textMuted: "#6B5B55",
	border: "#F0E2D2",
	borderStrong: "#E3D1BC",
	primary: "#C73E25",
	primaryDark: "#A5301B",
	primarySoft: "#FFE3D8",
	accent: "#EE8A3A",
	marigold: "#F5B83D",
	marigoldSoft: "#FFF0C7",
	orange: "#EE8A3A",
	orangeSoft: "#FFE6D0",
	leaf: "#8CC063",
	leafSoft: "#E8F4DA",
	berry: "#8B3A62",
	berrySoft: "#F7E6EE",
	success: "#8CC063",
	danger: "#B23A2A",
	dangerSoft: "#FBEAE4",
	watchFg: "#7A4B00",
	orangeDark: "#AE5621",
	leafDark: "#5B8A34",
	amberDark: "#9A6200",
	marigoldLow: "rgba(245, 184, 61, 0.22)",
} as const;

// Kategori warna ikon duotone (garis + isian lembut). Jangan hardcode warna ini di layar.
export const duoColors = {
	primary: { line: colors.primaryDark, tint: colors.marigold },
	history: { line: colors.orangeDark, tint: colors.marigold },
	chart: { line: colors.amberDark, tint: colors.marigold },
	info: { line: colors.leafDark, tint: colors.leaf },
	neutral: { line: colors.textMuted, tint: colors.marigoldLow },
} as const;

export type DuoTone = keyof typeof duoColors;

export const statusColors = {
	stable: { bg: colors.leafSoft, fg: colors.text },
	watch: { bg: colors.marigoldSoft, fg: colors.watchFg },
	consult: { bg: colors.berrySoft, fg: colors.berry },
} as const;

export type StatusTone = keyof typeof statusColors;

export const radii = {
	xs: 10,
	sm: 14,
	md: 18,
	lg: 24,
	xl: 32,
	pill: 999,
	button: 999,
	input: 16,
	icon: 14,
	card: 24,
	cardSmall: 18,
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

export const shadows: Record<"card" | "hero" | "pill" | "nav", ViewStyle> = {
	card: {
		shadowColor: "#783C14",
		shadowOpacity: 0.1,
		shadowRadius: 20,
		shadowOffset: { width: 0, height: 6 },
		elevation: 3,
	},
	hero: {
		shadowColor: "#783C14",
		shadowOpacity: 0.12,
		shadowRadius: 24,
		shadowOffset: { width: 0, height: 8 },
		elevation: 5,
	},
	pill: {
		shadowColor: "#783C14",
		shadowOpacity: 0.1,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 4 },
		elevation: 2,
	},
	nav: {
		shadowColor: "#783C14",
		shadowOpacity: 0.12,
		shadowRadius: 18,
		shadowOffset: { width: 0, height: -4 },
		elevation: 8,
	},
};

export const gradients = {
	hero: ["#FFF8EE", "#FFF0C7", "#FFE6D0"] as const,
	warm: ["#FFF8EE", "#FFEFD9"] as const,
	splash: ["#F5B83D", "#EE8A3A"] as const,
};

export const motion = {
	fast: 120,
	base: 250,
	slow: 450,
	enterDuration: 320,
	stagger: 60,
	pressScale: 0.97,
	ringDuration: 700,
	springSoft: { damping: 14, stiffness: 120, mass: 1 } as const,
	springSnappy: { damping: 18, stiffness: 260, mass: 0.8 } as const,
	maxFontScale: 1.4,
} as const;