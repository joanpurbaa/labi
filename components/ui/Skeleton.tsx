import { useEffect } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
	Easing,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";
import { colors, radii } from "../../constants/theme";

type SkeletonProps = {
	width?: number | `${number}%`;
	height?: number;
	radius?: number;
	style?: StyleProp<ViewStyle>;
};

export function Skeleton({
	width = "100%",
	height = 16,
	radius = radii.icon,
	style,
}: SkeletonProps) {
	const reduceMotion = useReducedMotion();
	const pulse = useSharedValue(0.5);

	useEffect(() => {
		if (reduceMotion) {
			pulse.value = 0.75;
			return;
		}
		pulse.value = withRepeat(
			withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
			-1,
			true,
		);
	}, [reduceMotion, pulse]);

	const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

	return (
		<Animated.View
			accessibilityElementsHidden
			importantForAccessibility="no-hide-descendants"
			style={[
				styles.base,
				{ width, height, borderRadius: radius },
				animatedStyle,
				style,
			]}
		/>
	);
}

const styles = StyleSheet.create({
	base: {
		backgroundColor: colors.primarySoft,
	},
});
