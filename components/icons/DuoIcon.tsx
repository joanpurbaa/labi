import { StyleProp, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { duoIcons, type DuoIconName } from "./duoIconData";

export type { DuoIconName };

type DuoIconProps = {
	name: DuoIconName;
	size?: number;
	line: string;
	tint: string;
	style?: StyleProp<ViewStyle>;
};

export function DuoIcon({
	name,
	size = 24,
	line,
	tint,
	style,
}: DuoIconProps) {
	const glyph = duoIcons[name];
	return (
		<Svg width={size} height={size} viewBox="0 0 256 256" style={style}>
			<Path d={glyph.tintD} fill={tint} />
			<Path d={glyph.lineD} fill={line} />
		</Svg>
	);
}