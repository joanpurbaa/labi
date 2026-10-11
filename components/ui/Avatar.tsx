import { StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../../constants/theme";

type AvatarProps = {
	name: string;
	size?: number;
	backgroundColor?: string;
	color?: string;
};

function initialsOf(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) {
		return "L";
	}
	return parts
		.slice(0, 2)
		.map((part) => part[0])
		.join("")
		.toUpperCase();
}

export function Avatar({
	name,
	size = 56,
	backgroundColor = colors.surfaceWarm,
	color = colors.text,
}: AvatarProps) {
	return (
		<View
			style={[
				styles.avatar,
				{
					width: size,
					height: size,
					borderRadius: size / 2,
					backgroundColor,
				},
			]}
		>
			<Text
				style={[
					styles.text,
					{ fontSize: Math.round(size * 0.38), color },
				]}
			>
				{initialsOf(name)}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	avatar: {
		alignItems: "center",
		justifyContent: "center",
	},
	text: {
		fontFamily: fonts.bodyStrong,
	},
});
