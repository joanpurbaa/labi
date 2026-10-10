import { StyleSheet, Text, View } from "react-native";
import { statusColors, type, type StatusTone } from "../../constants/theme";
import { Icon, type IconName } from "../Icon";

const DEFAULT_ICON: Record<StatusTone, IconName> = {
	stable: "check",
	watch: "eye",
	consult: "heart",
};

type StatusChipProps = {
	tone: StatusTone;
	label: string;
	icon?: IconName;
};

export function StatusChip({ tone, label, icon }: StatusChipProps) {
	const palette = statusColors[tone];
	return (
		<View style={[styles.chip, { backgroundColor: palette.bg }]}>
			<Icon name={icon ?? DEFAULT_ICON[tone]} size={16} color={palette.fg} />
			<Text style={[type.small, styles.text, { color: palette.fg }]}>
				{label}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	chip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		alignSelf: "flex-start",
		paddingVertical: 7,
		paddingHorizontal: 12,
		borderRadius: 999,
	},
	text: {
		fontWeight: "600",
	},
});
