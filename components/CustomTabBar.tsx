import type { BottomTabBarProps } from "expo-router/js-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Animated, {
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { colors, motion, radii, shadows, type } from "../constants/theme";
import { tapHaptic } from "../lib/haptics";
import { Icon, type IconName } from "./Icon";
import { AppText } from "./ui/AppText";

const TABS: Record<string, { label: string; icon: IconName }> = {
	index: { label: "Beranda", icon: "home" },
	sesi: { label: "Sesi", icon: "session" },
	profil: { label: "Profil", icon: "profile" },
};

const TAB_COUNT = 3;
const CENTER_INDEX = 1;
const BAR_HEIGHT = 72;
const CIRCLE = 56;
const ICON = 26;

function indicatorWidth(itemW: number): number {
	return Math.max(0, Math.min(itemW - 16, 112));
}

function targetX(index: number, full: number): number {
	const itemW = full / TAB_COUNT;
	const indW = indicatorWidth(itemW);
	return Math.max(
		0,
		Math.min(index * itemW + (itemW - indW) / 2, full - indW),
	);
}

type TabItemProps = {
	config: { label: string; icon: IconName };
	index: number;
	focused: boolean;
	onPress: () => void;
	onPressIn: () => void;
	onPressOut: () => void;
};

function TabItem({
	config,
	index,
	focused,
	onPress,
	onPressIn,
	onPressOut,
}: TabItemProps) {
	const iconScale = useSharedValue(1);

	useEffect(() => {
		if (focused) {
			iconScale.value = withSpring(1.08, motion.springSoft);
		} else {
			iconScale.value = withTiming(1, { duration: motion.fast });
		}
	}, [focused, iconScale]);

	const iconStyle = useAnimatedStyle(() => ({
		transform: [{ scale: iconScale.value }],
	}));
	const tint = focused ? colors.primaryDark : colors.textSecondary;
	const bubble = focused ? colors.marigold : colors.marigoldLow;
	const isCenter = index === CENTER_INDEX;

	return (
		<Pressable
			accessibilityRole="tab"
			accessibilityLabel={config.label}
			accessibilityState={{ selected: focused }}
			onPress={onPress}
			onPressIn={onPressIn}
			onPressOut={onPressOut}
			style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
		>
			{isCenter ? (
				<View style={styles.iconWrap} />
			) : (
				<Animated.View style={[styles.iconWrap, iconStyle]}>
					<Icon name={config.icon} size={24} color={tint} tint={bubble} />
				</Animated.View>
			)}
			<AppText
				style={[styles.label, focused && styles.labelActive, { color: tint }]}
				numberOfLines={1}
			>
				{config.label}
			</AppText>
			{isCenter ? (
				<View pointerEvents="none" style={styles.centerCircle}>
					<Animated.View style={[styles.circle, iconStyle]}>
						<Icon
							name={config.icon}
							size={ICON}
							color={colors.surface}
							tint={colors.marigold}
						/>
					</Animated.View>
				</View>
			) : null}
		</Pressable>
	);
}

export function CustomTabBar({ state, navigation, insets }: BottomTabBarProps) {
	const reduceMotion = useReducedMotion();
	const barWidth = useSharedValue(0);
	const indicatorW = useSharedValue(0);
	const slide = useSharedValue(0);
	const pillOpacity = useSharedValue(1);
	const pillScale = useSharedValue(1);
	const focusedIndex = state.index;

	const setPill = (index: number, full: number, animated: boolean) => {
		if (index === CENTER_INDEX) {
			pillOpacity.value = animated
				? withTiming(0, { duration: motion.fast })
				: 0;
			return;
		}
		pillOpacity.value = animated
			? withTiming(1, { duration: motion.fast })
			: 1;
		slide.value = animated
			? withSpring(targetX(index, full), motion.springSoft)
			: targetX(index, full);
	};

	const handleBarLayout = (event: LayoutChangeEvent) => {
		const full = event.nativeEvent.layout.width;
		barWidth.value = full;
		indicatorW.value = indicatorWidth(full / TAB_COUNT);
		setPill(focusedIndex, full, false);
	};

	const handleSelect = (index: number, name: string) => {
		const full = barWidth.value;
		if (full === 0) {
			return;
		}
		if (focusedIndex === index) {
			return;
		}
		tapHaptic();
		if (reduceMotion) {
			setPill(index, full, false);
		} else {
			setPill(index, full, true);
		}
		navigation.navigate(name);
	};

	const pillStyle = useAnimatedStyle(() => {
		const full = barWidth.value;
		if (full === 0) {
			return { opacity: 0, width: 0, transform: [{ translateX: 0 }] };
		}
		return {
			opacity: pillOpacity.value,
			width: indicatorW.value,
			transform: [
				{ translateX: Math.min(slide.value, full) },
				{ scale: pillScale.value },
			],
		};
	});

	const handlePressIn = () => {
		if (reduceMotion) {
			return;
		}
		pillScale.set(withTiming(0.96, { duration: motion.fast }));
	};
	const handlePressOut = () => {
		if (reduceMotion) {
			pillScale.set(1);
			return;
		}
		pillScale.set(withSpring(1, motion.springSnappy));
	};

	return (
		<View
			style={[
				styles.shell,
				{ paddingBottom: Math.max(insets.bottom + 12, 12) },
			]}
		>
			<LinearGradient
				pointerEvents="none"
				colors={[colors.background, "transparent"]}
				start={{ x: 0.5, y: 1 }}
				end={{ x: 0.5, y: 0 }}
				style={styles.fade}
			/>
			<View style={styles.bar} onLayout={handleBarLayout}>
				<Animated.View style={[styles.indicator, pillStyle]} />
				{state.routes.map((route, index) => {
					const config = TABS[route.name] ?? {
						label: route.name,
						icon: "home" as IconName,
					};
					return (
						<TabItem
							key={route.key}
							config={config}
							index={index}
							focused={focusedIndex === index}
							onPress={() => {
								const event = navigation.emit({
									type: "tabPress",
									target: route.key,
									canPreventDefault: true,
								});
								if (focusedIndex !== index && !event.defaultPrevented) {
									handleSelect(index, route.name);
								}
							}}
							onPressIn={handlePressIn}
							onPressOut={handlePressOut}
						/>
					);
				})}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	shell: {
		paddingHorizontal: 16,
	},
	fade: {
		position: "absolute",
		top: -40,
		left: 0,
		right: 0,
		height: 40,
	},
	bar: {
		flexDirection: "row",
		height: BAR_HEIGHT,
		backgroundColor: colors.surface,
		borderRadius: radii.pill,
		borderWidth: 1,
		borderColor: colors.border,
		...shadows.nav,
	},
	item: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: 4,
	},
	itemPressed: {
		opacity: 0.85,
	},
	indicator: {
		position: "absolute",
		top: 8,
		bottom: 8,
		left: 0,
		borderRadius: radii.pill,
		backgroundColor: colors.primarySoft,
		zIndex: 0,
	},
	iconWrap: {
		alignItems: "center",
		justifyContent: "center",
		width: 28,
		height: 28,
	},
	centerCircle: {
		position: "absolute",
		top: -20,
		left: 0,
		right: 0,
		alignItems: "center",
		zIndex: 2,
	},
	circle: {
		width: CIRCLE,
		height: CIRCLE,
		borderRadius: CIRCLE / 2,
		backgroundColor: colors.primary,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 4,
		borderColor: colors.background,
	},
	label: {
		color: colors.textSecondary,
		fontSize: 13,
	},
	labelActive: {
		fontFamily: type.bodyStrong.fontFamily,
		fontSize: 13,
	},
});