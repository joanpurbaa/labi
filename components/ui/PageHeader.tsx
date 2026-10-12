import { useEffect } from "react";
import {
	StyleSheet,
	Text,
	View,
	type StyleProp,
	type ViewStyle,
} from "react-native";
import Animated, {
	Easing,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";
import { colors, type } from "../../constants/theme";
import { Icon3D, type Icon3DName } from "../icons/Icon3D";
import { Avatar } from "./Avatar";
import { IconButton } from "./IconButton";

type PageHeaderProps = {
	avatarName: string;
	greeting: string;
	name: string;
	greetingIcon?: Icon3DName;
	onPressNotification?: () => void;
	style?: StyleProp<ViewStyle>;
};

function GreetingIcon({ name }: { name: Icon3DName }) {
	const reduceMotion = useReducedMotion();
	const float = useSharedValue(0);

	useEffect(() => {
		if (reduceMotion) {
			float.value = 0;
			return;
		}
		float.value = withRepeat(
			withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
			-1,
			true,
		);
	}, [reduceMotion, float]);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: -3 * float.value }],
	}));

	return (
		<Animated.View style={animatedStyle} accessibilityElementsHidden>
			<Icon3D name={name} size={28} />
		</Animated.View>
	);
}

export function PageHeader({
	avatarName,
	greeting,
	name,
	greetingIcon,
	onPressNotification,
	style,
}: PageHeaderProps) {
	return (
		<View style={[styles.header, style]}>
			<View style={styles.left}>
				<Avatar name={avatarName} size={52} />
				<View style={styles.text}>
					<View style={styles.greetRow}>
						{greetingIcon ? <GreetingIcon name={greetingIcon} /> : null}
						<Text style={[type.small, styles.greeting]}>{greeting}</Text>
					</View>
					<Text style={[type.h2, styles.name]} numberOfLines={1}>
						{name}
					</Text>
				</View>
			</View>
			{onPressNotification ? (
				<IconButton
					icon="notification"
					threeD="bell"
					label="Notifikasi"
					onPress={onPressNotification}
				/>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 12,
	},
	left: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		flexShrink: 1,
	},
	text: {
		flexShrink: 1,
	},
	greetRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	greeting: {
		color: colors.textSecondary,
	},
	name: {
		color: colors.textPrimary,
		marginTop: 2,
	},
});