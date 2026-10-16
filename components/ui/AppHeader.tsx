import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, layout, shadows, spacing, type } from "../../constants/theme";
import { Icon } from "../Icon";

type AppHeaderProps = {
	title: string;
	subtitle?: string;
	onBack: () => void;
	backLabel?: string;
	action?: ReactNode;
};

export function AppHeader({ title, subtitle, onBack, backLabel = "Kembali", action }: AppHeaderProps) {
	return (
		<View style={styles.header}>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={backLabel}
				onPress={onBack}
				style={({ pressed }) => [styles.back, pressed && styles.pressed]}
			>
				<Icon name="chevron" size={22} color={colors.textPrimary} />
			</Pressable>
			<View style={styles.titles}>
				<Text
					style={[type.h2, styles.headerTitle]}
					numberOfLines={1}
					ellipsizeMode="tail"
				>
					{title}
				</Text>
				{subtitle ? (
					<Text style={[type.small, styles.subtitle]} numberOfLines={1}>
						{subtitle}
					</Text>
				) : null}
			</View>
			{action ? <View style={styles.action}>{action}</View> : null}
		</View>
	);
}

const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		minHeight: 56,
		paddingHorizontal: layout.screenPadding,
		paddingTop: spacing.sm,
		paddingBottom: spacing.sm,
	},
	back: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: colors.surface,
		alignItems: "center",
		justifyContent: "center",
		transform: [{ scaleX: -1 }],
		...shadows.pill,
	},
	titles: {
		flex: 1,
		minWidth: 0,
	},
	headerTitle: {
		color: colors.textPrimary,
	},
	subtitle: {
		color: colors.textSecondary,
		marginTop: 2,
	},
	action: {
		marginLeft: "auto",
		justifyContent: "center",
	},
	pressed: {
		opacity: 0.7,
	},
});
