import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors } from "../../constants/theme";
import { Icon, type IconName } from "../Icon";

export type BadgeTone = "primary" | "accent" | "leaf" | "orange";

const TONES: Record<BadgeTone, { bg: string; fg: string }> = {
	primary: { bg: colors.primarySoft, fg: colors.primary },
	accent: { bg: colors.accentSoft, fg: colors.text },
	leaf: { bg: colors.leafSoft, fg: colors.text },
	orange: { bg: colors.orangeSoft, fg: colors.text },
};

type IconBadgeProps = {
	icon: IconName;
	tone?: BadgeTone;
	size?: number;
	style?: StyleProp<ViewStyle>;
};

export function IconBadge({
	icon,
	tone = "primary",
	size = 52,
	style,
}: IconBadgeProps) {
	const palette = TONES[tone];
	return (
		<View
			style={[
				styles.badge,
				{
					width: size,
					height: size,
					borderRadius: size / 3,
					backgroundColor: palette.bg,
				},
				style,
			]}
		>
			<Icon name={icon} size={size * 0.44} color={palette.fg} />
		</View>
	);
}

const styles = StyleSheet.create({
	badge: {
		alignItems: "center",
		justifyContent: "center",
	},
});
