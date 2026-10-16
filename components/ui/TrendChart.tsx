import Svg, {
	Circle,
	Defs,
	LinearGradient,
	Path,
	Stop,
} from "react-native-svg";
import { colors } from "../../constants/theme";

type Point = { x: number; y: number };

function smoothPath(points: Point[]): string {
	if (points.length < 2) {
		return "";
	}
	const commands = [`M ${points[0].x} ${points[0].y}`];
	for (let i = 0; i < points.length - 1; i++) {
		const p0 = points[i - 1] ?? points[i];
		const p1 = points[i];
		const p2 = points[i + 1];
		const p3 = points[i + 2] ?? p2;
		const cp1x = p1.x + (p2.x - p0.x) / 6;
		const cp1y = p1.y + (p2.y - p0.y) / 6;
		const cp2x = p2.x - (p3.x - p1.x) / 6;
		const cp2y = p2.y - (p3.y - p1.y) / 6;
		commands.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`);
	}
	return commands.join(" ");
}

export function TrendChart({
	width,
	values,
	height = 168,
}: {
	width: number;
	values: number[];
	height?: number;
}) {
	const padX = 10;
	const padTop = 18;
	const padBottom = 30;
	const innerW = Math.max(width - padX * 2, 1);
	const innerH = Math.max(height - padTop - padBottom, 1);
	const max = Math.max(...values);
	const min = Math.min(...values);
	const range = Math.max(max - min, 1);

	const points: Point[] = values.map((value, index) => ({
		x: padX + (innerW * index) / Math.max(values.length - 1, 1),
		y: padTop + innerH * (1 - (value - min) / range),
	}));

	const line = smoothPath(points);
	const last = points[points.length - 1];
	const first = points[0];
	const area = `${line} L ${last.x} ${padTop + innerH} L ${first.x} ${padTop + innerH} Z`;

	return (
		<Svg width={width} height={height}>
			<Defs>
				<LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
					<Stop offset="0" stopColor={colors.primary} stopOpacity={0.22} />
					<Stop offset="1" stopColor={colors.primary} stopOpacity={0} />
				</LinearGradient>
			</Defs>
			<Path d={area} fill="url(#area)" />
			<Path
				d={line}
				stroke={colors.primary}
				strokeWidth={4}
				fill="none"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			{points.map((point, index) => {
				const isLast = index === points.length - 1;
				return (
					<Circle
						key={index}
						cx={point.x}
						cy={point.y}
						r={isLast ? 8 : 4}
						fill={isLast ? colors.accent : colors.surface}
						stroke={colors.primary}
						strokeWidth={isLast ? 3 : 2}
					/>
				);
			})}
		</Svg>
	);
}
