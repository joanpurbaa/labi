import { useState } from "react";
import {
	ActivityIndicator,
	Pressable,
	StyleSheet,
	Text,
	View,
	type StyleProp,
	type ViewStyle,
} from "react-native";
import Animated, {
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { colors, motion, radii, shadows, type } from "../../constants/theme";
import { tapHaptic } from "../../lib/haptics";
import { Icon, type IconName } from "../Icon";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "medium" | "large";

type ButtonProps = {
	label: string;
	onPress: () => void;
	variant?: ButtonVariant;
	size?: ButtonSize;
	icon?: IconName;
	disabled?: boolean;
	loading?: boolean;
	fullWidth?: boolean;
	style?: StyleProp<ViewStyle>;
};

export function Button({
	label,
	onPress,
	variant = "primary",
	size = "medium",
	icon,
	disabled,
	loading,
	fullWidth,
	style,
}: ButtonProps) {
	const reduceMotion = useReducedMotion();
	const scale = useSharedValue(1);
	const [focused, setFocused] = useState(false);

	const isDisabled = Boolean(disabled) || Boolean(loading);
	const isLarge = size === "large";

	const textColor =
		variant === "primary" ? colors.surface : colors.primary;

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	const handlePressIn = () => {
		if (isDisabled || reduceMotion) {
			return;
		}
		scale.set(withTiming(motion.pressScale, { duration: 120 }));
	};

	const handlePressOut = () => {
		if (reduceMotion) {
			return;
		}
		scale.set(withSpring(1, { damping: 14, stiffness: 180 }));
	};

	return (
		<Animated.View
			style={[fullWidth && styles.fullWidth, animatedStyle, style]}
		>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={label}
				accessibilityState={{ disabled: isDisabled, busy: Boolean(loading) }}
				disabled={isDisabled}
				onPress={() => {
					tapHaptic();
					onPress();
				}}
				onPressIn={handlePressIn}
				onPressOut={handlePressOut}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				style={[
					styles.base,
					isLarge && styles.large,
					variantStyles[variant],
					focused && {
						borderColor:
							variant === "primary" ? colors.accent : colors.primary,
					},
					isDisabled && styles.disabled,
				]}
			>
				{loading ? (
					<ActivityIndicator color={textColor} />
				) : (
					<View style={styles.content}>
						{icon ? (
							<Icon name={icon} size={isLarge ? 26 : 20} color={textColor} />
						) : null}
						<Text
							style={[
								type.bodyStrong,
								isLarge && styles.labelLarge,
								{ color: textColor },
							]}
						>
							{label}
						</Text>
					</View>
				)}
			</Pressable>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	fullWidth: {
		alignSelf: "stretch",
	},
	base: {
		minHeight: 50,
		borderRadius: radii.button,
		borderWidth: 2,
		borderColor: "transparent",
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 22,
	},
	large: {
		minHeight: 68,
		paddingHorizontal: 28,
	},
	content: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	labelLarge: {
		fontSize: type.survivorButton.fontSize,
		lineHeight: type.survivorButton.lineHeight,
		fontFamily: type.survivorButton.fontFamily,
	},
	disabled: {
		opacity: 0.5,
	},
});

const variantStyles: Record<ButtonVariant, ViewStyle> = {
	primary: {
		backgroundColor: colors.primary,
		...shadows.pill,
	},
	secondary: {
		backgroundColor: colors.surface,
		borderColor: colors.borderStrong,
	},
	ghost: {
		backgroundColor: "transparent",
	},
};
