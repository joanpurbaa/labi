import { StyleSheet, Text, type TextProps, type TextStyle } from "react-native";
import { type } from "../../constants/theme";

export type AppTextVariant =
	| "display"
	| "heading"
	| "body"
	| "bodyStrong"
	| "caption"
	| "numeric";

const VARIANT_STYLES: Record<AppTextVariant, TextStyle> = {
	display: type.display,
	heading: type.h2,
	body: type.body,
	bodyStrong: type.bodyStrong,
	caption: type.caption,
	numeric: { ...type.h2, fontVariant: ["tabular-nums"] },
};

type AppTextProps = TextProps & {
	variant?: AppTextVariant;
	children: string | number | (string | number)[];
};

export function AppText({
	variant = "body",
	style,
	children,
	...rest
}: AppTextProps) {
	return (
		<Text style={[styles.base, VARIANT_STYLES[variant], style]} {...rest}>
			{children}
		</Text>
	);
}

const styles = StyleSheet.create({
	base: {
		includeFontPadding: false,
	},
});