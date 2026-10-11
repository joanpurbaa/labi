import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors } from "../../constants/theme";
import { Icon, type IconName } from "../Icon";
import { IconBadge, type BadgeTone } from "./IconBadge";
import { AppText } from "./AppText";

type StatTileProps = {
	label: string;
	value: string;
	icon: IconName;
	tone?: BadgeTone;
	helper?: string;
	style?: StyleProp<ViewStyle>;
};

export function StatTile({
	label,
	value,
	icon,
	tone = "primary",
	helper,
	style,
}: StatTileProps) {
	return (
		<View style={[styles.tile, style]}>
			<IconBadge icon={icon} tone={tone} size={44} />
			<AppText variant="numeric" style={[styles.value]}>{value}</AppText>
			<AppText variant="caption" style={[styles.label]}>{label}</AppText>
			{helper ? (
				<View style={styles.helper}>
					<Icon name="info" size={14} color={colors.textSecondary} />
					<AppText variant="caption" style={[styles.helperText]}>
						{helper}
					</AppText>
				</View>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	tile: {
		flex: 1,
		backgroundColor: colors.surface,
		borderRadius: 20,
		padding: 16,
		gap: 6,
	},
	value: {
		color: colors.textPrimary,
		marginTop: 6,
	},
	label: {
		color: colors.textSecondary,
	},
	helper: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		marginTop: 2,
	},
	helperText: {
		color: colors.textSecondary,
		flexShrink: 1,
	},
});
