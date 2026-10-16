import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { Icon } from "../Icon";
import { colors, type } from "../../constants/theme";

type CollapsibleSectionProps = {
	id: string;
	title: string;
	expanded: boolean;
	onToggle: () => void;
	children: ReactNode;
};

export function CollapsibleSection({
	id,
	title,
	expanded,
	onToggle,
	children,
}: CollapsibleSectionProps) {
	const reduceMotion = useReducedMotion();
	const rotation = useSharedValue(expanded ? 1 : 0);
	rotation.value = reduceMotion
		? expanded
			? 1
			: 0
		: withTiming(expanded ? 1 : 0, { duration: 200 });
	const chevronStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${rotation.value * 90}deg` }],
	}));

	return (
		<View>
			<Pressable
				accessibilityRole="button"
				accessibilityState={{ expanded }}
				accessibilityLabel={title}
				aria-expanded={expanded}
				aria-controls={id}
				onPress={onToggle}
				style={({ pressed }) => [
					styles.header,
					pressed && styles.pressed,
				]}
			>
				<Text style={[type.h3, styles.title]}>{title}</Text>
				<Animated.View style={chevronStyle}>
					<Icon name="chevron" size={20} color={colors.textSecondary} />
				</Animated.View>
			</Pressable>
			{expanded ? <View nativeID={id}>{children}</View> : null}
		</View>
	);
}

const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 12,
		minHeight: 56,
		paddingVertical: 12,
	},
	title: {
		color: colors.textPrimary,
		flexShrink: 1,
	},
	pressed: {
		opacity: 0.7,
	},
});
