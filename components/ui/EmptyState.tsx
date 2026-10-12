import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
	Easing,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";
import { colors, type } from "../../constants/theme";
import { Photo } from "../photo/Photo";
import type { PhotoKey } from "../photo/photoRegistry";
import { Illustration, type IllustrationName } from "./Illustration";

type EmptyStateProps = {
	illustration?: IllustrationName;
	photo?: PhotoKey;
	title: string;
	description: string;
	action?: React.ReactNode;
};

export function EmptyState({
	illustration = "conversation",
	photo,
	title,
	description,
	action,
}: EmptyStateProps) {
	const reduceMotion = useReducedMotion();
	const float = useSharedValue(0);

	useEffect(() => {
		if (reduceMotion) {
			return;
		}
		float.value = withRepeat(
			withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.ease) }),
			-1,
			true,
		);
	}, [reduceMotion, float]);

	const floatStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: -6 * float.value }],
	}));

	return (
		<View style={styles.wrap}>
			{photo ? (
				<View style={styles.photoWrap}>
					<Photo photo={photo} radius="lg" label />
				</View>
			) : (
				<Animated.View style={floatStyle}>
					<Illustration name={illustration} size={168} />
				</Animated.View>
			)}
			<Text style={[type.h3, styles.title]}>{title}</Text>
			<Text style={[type.body, styles.description]}>{description}</Text>
			{action ? <View style={styles.action}>{action}</View> : null}
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {
		alignItems: "center",
		paddingVertical: 12,
	},
	photoWrap: {
		alignSelf: "stretch",
	},
	title: {
		color: colors.textPrimary,
		textAlign: "center",
		marginTop: 16,
	},
	description: {
		color: colors.textSecondary,
		textAlign: "center",
		marginTop: 8,
		maxWidth: 300,
	},
	action: {
		marginTop: 18,
		alignSelf: "stretch",
	},
});
