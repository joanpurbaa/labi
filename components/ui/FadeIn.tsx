import { useEffect, type ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, {
	Easing,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withDelay,
	withTiming,
} from "react-native-reanimated";
import { motion } from "../../constants/theme";

type FadeInProps = {
	children: ReactNode;
	delay?: number;
	offset?: number;
	style?: StyleProp<ViewStyle>;
};

export function FadeIn({ children, delay = 0, offset = 12, style }: FadeInProps) {
	const reduceMotion = useReducedMotion();
	const progress = useSharedValue(0);

	useEffect(() => {
		if (reduceMotion) {
			progress.value = 1;
			return;
		}
		progress.value = withDelay(
			delay,
			withTiming(1, {
				duration: motion.enterDuration,
				easing: Easing.out(Easing.cubic),
			}),
		);
	}, [delay, reduceMotion, progress]);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: progress.value,
		transform: [{ translateY: (1 - progress.value) * offset }],
	}));

	return (
		<Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
	);
}
