import { useEffect, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
	Easing,
	useAnimatedProps,
	useReducedMotion,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { colors, motion } from "../../constants/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type ProgressRingProps = {
	progress: number;
	size?: number;
	strokeWidth?: number;
	color?: string;
	trackColor?: string;
	children?: ReactNode;
};

export function ProgressRing({
	progress,
	size = 132,
	strokeWidth = 12,
	color = colors.primary,
	trackColor = "rgba(27,110,100,0.16)",
	children,
}: ProgressRingProps) {
	const reduceMotion = useReducedMotion();
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const clamped = Math.max(0, Math.min(1, progress));
	const value = useSharedValue(0);

	useEffect(() => {
		value.value = reduceMotion
			? clamped
			: withTiming(clamped, {
					duration: motion.ringDuration,
					easing: Easing.out(Easing.cubic),
				});
	}, [clamped, reduceMotion, value]);

	const animatedProps = useAnimatedProps(() => ({
		strokeDashoffset: circumference * (1 - value.value),
	}));

	return (
		<View style={[styles.wrap, { width: size, height: size }]}>
			<Svg width={size} height={size} style={StyleSheet.absoluteFill}>
				<Circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					stroke={trackColor}
					strokeWidth={strokeWidth}
					fill="none"
				/>
				<AnimatedCircle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					stroke={color}
					strokeWidth={strokeWidth}
					strokeLinecap="round"
					fill="none"
					strokeDasharray={circumference}
					animatedProps={animatedProps}
					transform={`rotate(-90 ${size / 2} ${size / 2})`}
				/>
			</Svg>
			<View style={styles.center}>{children}</View>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {
		alignItems: "center",
		justifyContent: "center",
	},
	center: {
		alignItems: "center",
		justifyContent: "center",
	},
});
