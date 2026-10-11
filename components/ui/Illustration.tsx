import { View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { colors } from "../../constants/theme";

export type IllustrationName = "conversation" | "journey" | "session";

type IllustrationProps = {
	name: IllustrationName;
	size?: number;
};

export function Illustration({ name, size = 160 }: IllustrationProps) {
	const height = Math.round(size * 0.78);

	return (
		<View
			style={{ width: size, height }}
			accessible={false}
			importantForAccessibility="no-hide-descendants"
		>
			<Svg width={size} height={height} viewBox="0 0 200 156">
				{name === "conversation" ? (
					<>
						<Rect
							x={12}
							y={26}
							width={112}
							height={62}
							rx={24}
							fill={colors.accentSoft}
						/>
						<Circle cx={44} cy={57} r={6} fill={colors.orange} />
						<Circle cx={68} cy={57} r={6} fill={colors.orange} />
						<Circle cx={92} cy={57} r={6} fill={colors.orange} />
						<Rect
							x={76}
							y={72}
							width={112}
							height={62}
							rx={24}
							fill={colors.primarySoft}
						/>
						<Circle cx={108} cy={103} r={6} fill={colors.primary} />
						<Circle cx={132} cy={103} r={6} fill={colors.primary} />
						<Circle cx={156} cy={103} r={6} fill={colors.primary} />
						<Path
							d="M170 24 l3.5 8 8 3.5 -8 3.5 -3.5 8 -3.5 -8 -8 -3.5 8 -3.5 z"
							fill={colors.accent}
						/>
					</>
				) : null}

				{name === "journey" ? (
					<>
						<Rect
							x={0}
							y={0}
							width={200}
							height={156}
							rx={20}
							fill={colors.primarySoft}
							opacity={0.5}
						/>
						<Path
							d="M20 122 C58 122 58 78 100 78 C142 78 142 40 180 40"
							stroke={colors.primary}
							strokeWidth={7}
							strokeLinecap="round"
							fill="none"
						/>
						<Circle cx={20} cy={122} r={9} fill={colors.primary} />
						<Circle cx={100} cy={78} r={9} fill={colors.primary} />
						<Circle
							cx={180}
							cy={40}
							r={12}
							fill={colors.accent}
							stroke={colors.surface}
							strokeWidth={4}
						/>
					</>
				) : null}

				{name === "session" ? (
					<>
						<Circle cx={100} cy={78} r={62} fill={colors.primarySoft} />
						<Rect
							x={82}
							y={46}
							width={36}
							height={30}
							rx={15}
							fill={colors.primary}
						/>
						<Path
							d="M74 76 a26 26 0 0 0 52 0"
							stroke={colors.primary}
							strokeWidth={7}
							strokeLinecap="round"
							fill="none"
						/>
						<Path
							d="M100 102 V112"
							stroke={colors.primary}
							strokeWidth={7}
							strokeLinecap="round"
						/>
						<Path
							d="M166 30 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z"
							fill={colors.orange}
						/>
						<Path
							d="M34 30 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z"
							fill={colors.orange}
						/>
					</>
				) : null}
			</Svg>
		</View>
	);
}
