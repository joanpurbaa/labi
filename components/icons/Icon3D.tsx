import { Image, type ImageStyle, type StyleProp } from "react-native";

const ICON3D = {
	"studio-microphone": require("../../assets/icons3d/studio-microphone.png"),
	"spiral-calendar": require("../../assets/icons3d/spiral-calendar.png"),
	"bar-chart": require("../../assets/icons3d/bar-chart.png"),
	"open-book": require("../../assets/icons3d/open-book.png"),
	memo: require("../../assets/icons3d/memo.png"),
	clipboard: require("../../assets/icons3d/clipboard.png"),
	bell: require("../../assets/icons3d/bell.png"),
	sunrise: require("../../assets/icons3d/sunrise.png"),
	sun: require("../../assets/icons3d/sun.png"),
	"hot-beverage": require("../../assets/icons3d/hot-beverage.png"),
	"crescent-moon": require("../../assets/icons3d/crescent-moon.png"),
	"red-heart": require("../../assets/icons3d/red-heart.png"),
	sparkles: require("../../assets/icons3d/sparkles.png"),
	locked: require("../../assets/icons3d/locked.png"),
} as const;

export type Icon3DName = keyof typeof ICON3D;

type Icon3DProps = {
	name: Icon3DName;
	size?: number;
	style?: StyleProp<ImageStyle>;
};

export function Icon3D({ name, size = 64, style }: Icon3DProps) {
	return (
		<Image
			source={ICON3D[name]}
			style={[
				{ width: size, height: size, resizeMode: "contain" },
				style,
			]}
			accessibilityIgnoresInvertColors
		/>
	);
}