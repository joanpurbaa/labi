import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import {
	colors,
	gradients,
	radii,
	shadows,
	spacing,
} from "../../constants/theme";

type CardVariant = "default" | "hero" | "warm";

type CardProps = {
	children: ReactNode;
	variant?: CardVariant;
	style?: StyleProp<ViewStyle>;
	padded?: boolean;
};

export function Card({
	children,
	variant = "default",
	style,
	padded = true,
}: CardProps) {
	if (variant === "hero" || variant === "warm") {
		const gradient = variant === "hero" ? gradients.hero : gradients.warm;
		return (
			<View style={[styles.base, styles.hero, shadows.hero, style]}>
				<LinearGradient
					colors={gradient}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={StyleSheet.absoluteFill}
				/>
				<View style={padded ? styles.pad : undefined}>{children}</View>
			</View>
		);
	}

	return (
		<View style={[styles.base, shadows.card, style]}>
			<View style={padded ? styles.pad : undefined}>{children}</View>
		</View>
	);
}

const styles = StyleSheet.create({
	base: {
		borderRadius: radii.card,
		backgroundColor: colors.surface,
		overflow: "hidden",
	},
	hero: {
		backgroundColor: colors.surfaceWarm,
	},
	pad: {
		padding: spacing.xl,
	},
});
