import { Image } from "expo-image";
import { useEffect } from "react";
import {
	StyleSheet,
	View,
	type StyleProp,
	type ViewStyle,
} from "react-native";
import Animated, {
	Easing,
	interpolate,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withRepeat,
	withSequence,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { useCenterAudit } from "../../lib/centerAudit";
import { mascotRegistry, type MascotKey } from "./mascotRegistry";

type MascotProps = {
	expression: MascotKey;
	size?: number;
	label?: string;
	decorative?: boolean;
	auditLabel?: string;
	style?: StyleProp<ViewStyle>;
};

export function Mascot({
	expression,
	size = 96,
	label,
	decorative = false,
	auditLabel,
	style,
}: MascotProps) {
	const meta = mascotRegistry[expression];
	const reduceMotion = useReducedMotion();
	const appear = useSharedValue(reduceMotion ? 1 : 0);
	const float = useSharedValue(0);
	const { onOuterLayout, onInnerLayout } = useCenterAudit(
		auditLabel ?? `mascot:${expression}`,
	);

	useEffect(() => {
		if (reduceMotion) {
			appear.value = 1;
			return;
		}
		appear.value = 0;
		appear.value = withSpring(1, { damping: 14, stiffness: 180 });
	}, [appear, expression, reduceMotion]);

	useEffect(() => {
		if (reduceMotion) {
			float.value = 0;
			return;
		}
		float.value = withRepeat(
			withSequence(
				withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.ease) }),
				withTiming(0, { duration: 1700, easing: Easing.inOut(Easing.ease) }),
			),
			-1,
			false,
		);
	}, [float, reduceMotion]);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: appear.value,
		transform: [
			{ translateY: interpolate(float.value, [0, 1], [0, -6]) },
			{ scale: interpolate(appear.value, [0, 1], [0.92, 1]) },
		],
	}));

	return (
		<View
			onLayout={onOuterLayout}
			accessible={!decorative}
			accessibilityRole={decorative ? "none" : "image"}
			accessibilityLabel={decorative ? undefined : (label ?? meta.accessibilityLabel)}
			accessibilityElementsHidden={decorative}
			importantForAccessibility={decorative ? "no-hide-descendants" : "yes"}
			style={[styles.container, { width: size, height: size }, style]}
		>
			<View
				pointerEvents="none"
				style={[
					styles.ground,
					{
						width: size * 0.52,
						height: size * 0.1,
						borderRadius: size,
						bottom: size * 0.03,
					},
				]}
			/>
			<Animated.View onLayout={onInnerLayout} style={[styles.image, animatedStyle]}>
				<Image
					source={meta.source}
					style={StyleSheet.absoluteFill}
					contentFit="contain"
					transition={reduceMotion ? 0 : 180}
					accessibilityIgnoresInvertColors
				/>
			</Animated.View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		alignItems: "center",
		justifyContent: "center",
	},
	image: {
		width: "100%",
		height: "100%",
	},
	ground: {
		position: "absolute",
		backgroundColor: "rgba(120,60,20,0.10)",
	},
});
