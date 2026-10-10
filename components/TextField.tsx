import { forwardRef, useState, type ComponentProps } from "react";
import {
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
	type StyleProp,
	type TextStyle,
} from "react-native";
import { colors, fonts, radii, shadows, type } from "../constants/theme";
import { Icon } from "./Icon";

type TextFieldProps = ComponentProps<typeof TextInput> & {
	label: string;
	error?: string;
	secure?: boolean;
};

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
	{ label, error, secure, onFocus, onBlur, style, ...rest },
	ref,
) {
	const [focused, setFocused] = useState(false);
	const [hidden, setHidden] = useState(Boolean(secure));

	return (
		<View style={styles.wrapper}>
			<Text style={[type.label, styles.label]}>{label}</Text>
			<View
				style={[
					styles.inputRow,
					focused && styles.inputRowFocused,
					error ? styles.inputRowError : null,
				]}
			>
				<TextInput
					ref={ref}
					{...rest}
					secureTextEntry={secure ? hidden : false}
					placeholderTextColor={colors.textSecondary}
					onFocus={(event) => {
						setFocused(true);
						onFocus?.(event);
					}}
					onBlur={(event) => {
						setFocused(false);
						onBlur?.(event);
					}}
					style={[styles.input, style as StyleProp<TextStyle>]}
				/>
				{secure ? (
					<Pressable
						accessibilityRole="button"
						accessibilityLabel={
							hidden ? "Tampilkan password" : "Sembunyikan password"
						}
						hitSlop={10}
						onPress={() => setHidden((value) => !value)}
						style={({ pressed }) => [
							styles.toggle,
							pressed && styles.togglePressed,
						]}
					>
						<Icon
							name={hidden ? "eye" : "eyeOff"}
							size={22}
							color={colors.textSecondary}
						/>
					</Pressable>
				) : null}
			</View>
			{error ? <Text style={[type.small, styles.error]}>{error}</Text> : null}
		</View>
	);
});

const styles = StyleSheet.create({
	wrapper: {
		marginBottom: 18,
	},
	label: {
		color: colors.textPrimary,
		marginBottom: 8,
	},
	inputRow: {
		flexDirection: "row",
		alignItems: "center",
		minHeight: 54,
		borderWidth: 2,
		borderColor: colors.borderStrong,
		borderRadius: radii.input,
		backgroundColor: colors.surface,
		paddingHorizontal: 16,
	},
	inputRowFocused: {
		borderColor: colors.primary,
		...shadows.pill,
	},
	inputRowError: {
		borderColor: colors.danger,
	},
	input: {
		flex: 1,
		fontSize: 17,
		lineHeight: 24,
		fontFamily: fonts.body,
		color: colors.textPrimary,
		paddingVertical: 14,
	},
	toggle: {
		paddingLeft: 12,
	},
	togglePressed: {
		opacity: 0.6,
	},
	error: {
		color: colors.danger,
		marginTop: 6,
	},
});
