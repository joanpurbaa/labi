import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, type } from "../constants/theme";
import type { SelectOption } from "../lib/survivorOptions";
import { Icon } from "./Icon";

type ChoiceGroupProps = {
	options: SelectOption[];
	selected: string[];
	onChange: (values: string[]) => void;
	multi?: boolean;
	error?: string;
};

export function ChoiceGroup({
	options,
	selected,
	onChange,
	multi = false,
	error,
}: ChoiceGroupProps) {
	const toggle = (value: string) => {
		if (multi) {
			onChange(
				selected.includes(value)
					? selected.filter((entry) => entry !== value)
					: [...selected, value],
			);
			return;
		}
		onChange([value]);
	};

	return (
		<View>
			<View style={styles.wrap}>
				{options.map((option) => {
					const active = selected.includes(option.value);
					return (
						<Pressable
							key={option.value}
							accessibilityRole={multi ? "checkbox" : "radio"}
							accessibilityLabel={option.label}
							accessibilityState={
								multi ? { checked: active } : { selected: active }
							}
							onPress={() => toggle(option.value)}
							style={({ pressed }) => [
								styles.chip,
								active && styles.chipActive,
								pressed && styles.chipPressed,
							]}
						>
							{multi ? (
								<View style={[styles.box, active && styles.boxActive]}>
									{active ? (
										<Icon name="check" size={15} color={colors.surface} />
									) : null}
								</View>
							) : null}
							<Text
								style={[type.body, active ? styles.chipTextActive : styles.chipText]}
							>
								{option.label}
							</Text>
						</Pressable>
					);
				})}
			</View>
			{error ? <Text style={[type.small, styles.error]}>{error}</Text> : null}
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 10,
	},
	chip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		minHeight: 50,
		paddingVertical: 10,
		paddingHorizontal: 16,
		borderRadius: radii.pill,
		borderWidth: 2,
		borderColor: colors.borderStrong,
		backgroundColor: colors.surface,
	},
	chipActive: {
		borderColor: colors.primary,
		backgroundColor: colors.primarySoft,
	},
	chipPressed: {
		opacity: 0.75,
	},
	chipText: {
		color: colors.textPrimary,
	},
	chipTextActive: {
		color: colors.primaryDark,
		fontFamily: type.bodyStrong.fontFamily,
	},
	box: {
		width: 22,
		height: 22,
		borderRadius: 7,
		borderWidth: 2,
		borderColor: colors.borderStrong,
		alignItems: "center",
		justifyContent: "center",
	},
	boxActive: {
		backgroundColor: colors.primary,
		borderColor: colors.primary,
	},
	error: {
		color: colors.danger,
		marginTop: 8,
	},
});
