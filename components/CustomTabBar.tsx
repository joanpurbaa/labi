import type { BottomTabBarProps } from "expo-router/js-tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, shadows, type } from "../constants/theme";
import { tapHaptic } from "../lib/haptics";
import { Icon, type IconName } from "./Icon";

const TABS: Record<string, { label: string; icon: IconName }> = {
	index: { label: "Beranda", icon: "home" },
	sesi: { label: "Sesi", icon: "session" },
	profil: { label: "Profil", icon: "profile" },
};

export function CustomTabBar({ state, navigation, insets }: BottomTabBarProps) {
	return (
		<View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
			{state.routes.map((route, index) => {
				const config = TABS[route.name] ?? {
					label: route.name,
					icon: "home" as IconName,
				};
				const focused = state.index === index;
				const tint = focused ? colors.primaryDark : colors.textSecondary;

				return (
					<Pressable
						key={route.key}
						accessibilityRole="tab"
						accessibilityLabel={config.label}
						accessibilityState={{ selected: focused }}
						onPress={() => {
							const event = navigation.emit({
								type: "tabPress",
								target: route.key,
								canPreventDefault: true,
							});

							if (!focused && !event.defaultPrevented) {
								tapHaptic();
								navigation.navigate(route.name);
							}
						}}
						style={({ pressed }) => [
							styles.item,
							pressed && styles.itemPressed,
						]}
					>
						<View style={[styles.pill, focused && styles.pillActive]}>
							<Icon name={config.icon} size={24} color={tint} />
						</View>
						<Text
							style={[
								type.small,
								styles.label,
								focused && styles.labelActive,
								{ color: tint },
							]}
						>
							{config.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	bar: {
		flexDirection: "row",
		alignItems: "flex-start",
		backgroundColor: colors.surface,
		paddingTop: 10,
		paddingHorizontal: 8,
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		...shadows.nav,
	},
	item: {
		flex: 1,
		minHeight: 56,
		alignItems: "center",
		justifyContent: "center",
		gap: 2,
	},
	itemPressed: {
		opacity: 0.7,
	},
	pill: {
		minWidth: 56,
		height: 34,
		borderRadius: radii.pill,
		alignItems: "center",
		justifyContent: "center",
	},
	pillActive: {
		backgroundColor: colors.primarySoft,
	},
	label: {
		color: colors.textSecondary,
	},
	labelActive: {
		fontFamily: type.bodyStrong.fontFamily,
	},
});
