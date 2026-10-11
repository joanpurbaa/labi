import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import {
	StyleSheet,
	View,
	type StyleProp,
	type ViewStyle,
} from "react-native";
import Animated, {
	Easing,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { colors, radii, shadows, type } from "../../constants/theme";
import { CenterAudit } from "../../lib/centerAudit";
import { photoRegistry, type PhotoKey } from "./photoRegistry";

type PhotoRadius = "sm" | "lg" | "xl";

type PhotoProps = {
	photo: PhotoKey;
	radius?: PhotoRadius;
	ratio?: number;
	height?: number;
	label?: boolean;
	scrim?: boolean;
	kenBurns?: boolean;
	decorative?: boolean;
	style?: StyleProp<ViewStyle>;
	children?: React.ReactNode;
};

const radiusMap: Record<PhotoRadius, number> = {
	sm: radii.sm,
	lg: radii.lg,
	xl: radii.xl,
};

export function Photo({
	photo,
	radius = "lg",
	ratio,
	height,
	label = false,
	scrim = false,
	kenBurns = false,
	decorative = false,
	style,
	children,
}: PhotoProps) {
	const meta = photoRegistry[photo];
	const reduceMotion = useReducedMotion();
	const scale = useSharedValue(1);

	useEffect(() => {
		if (reduceMotion || !kenBurns) {
			scale.value = 1;
			return;
		}
		scale.value = withTiming(1.05, {
			duration: 12000,
			easing: Easing.inOut(Easing.ease),
		});
	}, [kenBurns, reduceMotion, scale]);

	const zoomStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	const hasText = children != null;
	const showScrim = scrim || hasText;

	return (
		<View
			accessible={!decorative}
			accessibilityRole={decorative ? "none" : "image"}
			accessibilityLabel={decorative ? undefined : meta.alt}
			accessibilityElementsHidden={decorative}
			importantForAccessibility={decorative ? "no-hide-descendants" : "yes"}
			style={[styles.shadow, { borderRadius: radiusMap[radius] }, style]}
		>
			<View
				style={[
					styles.clip,
					{ borderRadius: radiusMap[radius] },
					height != null ? { height } : { aspectRatio: ratio ?? meta.ratio },
				]}
			>
				<Animated.View style={[StyleSheet.absoluteFill, zoomStyle]}>
					<Image
						source={meta.source}
						style={StyleSheet.absoluteFill}
						contentFit="cover"
						contentPosition={{
							top: `${meta.focus.y}%`,
							left: `${meta.focus.x}%`,
						}}
						transition={reduceMotion ? 0 : 220}
						accessibilityIgnoresInvertColors
					/>
				</Animated.View>
				<View pointerEvents="none" style={styles.tint} />
				{showScrim ? (
					<LinearGradient
						pointerEvents="none"
						colors={["rgba(43,34,32,0)", "rgba(43,34,32,0.72)"]}
						start={{ x: 0.5, y: 0 }}
						end={{ x: 0.5, y: 1 }}
						style={StyleSheet.absoluteFill}
					/>
				) : null}
				{hasText ? (
					<CenterAudit label={`photo:${photo}`} style={styles.overlay}>
						{children}
					</CenterAudit>
				) : null}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	shadow: {
		...shadows.hero,
		backgroundColor: colors.surfaceWarm,
	},
	clip: {
		width: "100%",
		overflow: "hidden",
		backgroundColor: colors.surfaceWarm,
	},
	tint: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: colors.orange,
		opacity: 0.12,
	},
	overlay: {
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 0,
		paddingHorizontal: 16,
		paddingBottom: 14,
	},
	pill: {
		position: "absolute",
		left: 12,
		bottom: 12,
		backgroundColor: "rgba(43,34,32,0.72)",
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: radii.pill,
	},
	pillText: {
		...type.small,
		color: colors.surface,
	},
});