import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, type } from "../../constants/theme";
import { Avatar } from "./Avatar";
import { IconButton } from "./IconButton";

type PageHeaderProps = {
	avatarName: string;
	greeting: string;
	name: string;
	onPressNotification?: () => void;
	style?: StyleProp<ViewStyle>;
};

export function PageHeader({
	avatarName,
	greeting,
	name,
	onPressNotification,
	style,
}: PageHeaderProps) {
	return (
		<View style={[styles.header, style]}>
			<View style={styles.left}>
				<Avatar name={avatarName} size={52} />
				<View style={styles.text}>
					<Text style={[type.small, styles.greeting]}>{greeting}</Text>
					<Text style={[type.h2, styles.name]} numberOfLines={1}>
						{name}
					</Text>
				</View>
			</View>
			{onPressNotification ? (
				<IconButton
					icon="notification"
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
	greeting: {
		color: colors.textSecondary,
	},
	name: {
		color: colors.textPrimary,
		marginTop: 2,
	},
});
