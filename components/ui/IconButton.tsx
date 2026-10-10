import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { colors, shadows } from "../../constants/theme";
import { tapHaptic } from "../../lib/haptics";
import { Icon, type IconName } from "../Icon";

type IconButtonProps = {
	icon: IconName;
	label: string;
	onPress: () => void;
	size?: number;
	color?: string;
	style?: StyleProp<ViewStyle>;
};

export function IconButton({
	icon,
	label,
	onPress,
	size = 48,
	color = colors.textPrimary,
	style,
}: IconButtonProps) {
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={label}
			onPress={() => {
				tapHaptic();
				onPress();
			}}
			style={({ pressed }) => [
				styles.button,
				{ width: size, height: size, borderRadius: size / 2 },
				pressed && styles.pressed,
				style,
			]}
		>
			<Icon name={icon} size={22} color={color} />
		</Pressable>
	);
}

const styles = StyleSheet.create({
	button: {
		backgroundColor: colors.surface,
		alignItems: "center",
		justifyContent: "center",
		...shadows.pill,
	},
	pressed: {
		opacity: 0.7,
	},
});
