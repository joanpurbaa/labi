import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
	Easing,
	useAnimatedProps,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withDelay,
	withRepeat,
	withSequence,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import Svg, {
	Circle,
	Defs,
	Ellipse,
	LinearGradient,
	Path,
	RadialGradient,
	Rect,
	Stop,
} from "react-native-svg";
import { colors, fonts, type } from "../constants/theme";

const RIPPLE_COUNT = 3;
const RIPPLE_START = 500;
const RIPPLE_GAP = 260;
const RIPPLE_DURATION = 900;
const RIPPLE_MAX_SCALE = 2.1;
const RIPPLE_STROKE = 2;
const EXIT_DURATION = 350;
const WORDMARK_RISE = 18;
const SUN_RISE = 90;
const WORDMARK_GAP = 56;
const OVERALL_MS = 3400;
const RAY_COUNT = 16;
const RAY_WIDTH = 7;
const WAVE_LENGTH = 200;
const WAVE_PATH = "M4 14 Q24 -2 44 14 T84 14 T124 14 T164 14";
const SKY_BOTTOM = "#FFE3D0";
const BERRY_RED = "#C73E25";
const LEAF = "#8CC063";

const SPARKS = [
	{
		x: 0.12,
		size: 10,
		color: colors.marigold,
		delay: 700,
		duration: 2600,
		rise: 260,
		phase: 0.2,
	},
	{
		x: 0.24,
		size: 7,
		color: colors.orange,
		delay: 1100,
		duration: 2300,
		rise: 220,
		phase: 1.4,
	},
	{
		x: 0.36,
		size: 12,
		color: BERRY_RED,
		delay: 900,
		duration: 2900,
		rise: 300,
		phase: 2.6,
	},
	{
		x: 0.5,
		size: 8,
		color: colors.marigold,
		delay: 1400,
		duration: 2500,
		rise: 240,
		phase: 3.1,
	},
	{
		x: 0.62,
		size: 11,
		color: colors.orange,
		delay: 800,
		duration: 2700,
		rise: 280,
		phase: 4.2,
	},
	{
		x: 0.74,
		size: 7,
		color: LEAF,
		delay: 1300,
		duration: 2400,
		rise: 210,
		phase: 5.0,
	},
	{
		x: 0.86,
		size: 10,
		color: colors.marigold,
		delay: 1000,
		duration: 3000,
		rise: 290,
		phase: 0.9,
	},
	{
		x: 0.3,
		size: 6,
		color: colors.marigold,
		delay: 1700,
		duration: 2200,
		rise: 190,
		phase: 3.7,
	},
	{
		x: 0.68,
		size: 6,
		color: BERRY_RED,
		delay: 1600,
		duration: 2400,
		rise: 200,
		phase: 2.2,
	},
];

const AnimatedPath = Animated.createAnimatedComponent(Path);

function even(value: number): number {
	return Math.max(0, Math.round(value / 2) * 2);
}

function Ripple({
	index,
	size,
	reduceMotion,
}: {
	index: number;
	size: number;
	reduceMotion: boolean;
}) {
	const progress = useSharedValue(0);

	useEffect(() => {
		if (reduceMotion) {
			progress.set(0);
			return;
		}
		progress.set(
			withDelay(
				RIPPLE_START + index * RIPPLE_GAP,
				withTiming(1, {
					duration: RIPPLE_DURATION,
					easing: Easing.out(Easing.cubic),
				}),
			),
		);
	}, [index, progress, reduceMotion]);

	const rippleStyle = useAnimatedStyle(() => ({
		opacity: 0.4 * (1 - progress.value),
		transform: [
			{
				scale: 1 + (RIPPLE_MAX_SCALE - 1) * progress.value,
			},
		],
	}));

	return (
		<Animated.View
			pointerEvents="none"
			style={[
				styles.ripple,
				{
					width: size,
					height: size,
					borderRadius: size / 2,
					borderColor: index % 2 === 0 ? colors.marigold : colors.orange,
				},
				rippleStyle,
			]}
		/>
	);
}

function Ray({
	index,
	box,
	innerRadius,
	baseLength,
	amplitude,
	reveal,
	boost,
	reduceMotion,
}: {
	index: number;
	box: number;
	innerRadius: number;
	baseLength: number;
	amplitude: number;
	reveal: SharedValue<number>;
	boost: SharedValue<number>;
	reduceMotion: boolean;
}) {
	const wave = useSharedValue(0);
	const angle = (index * 360) / RAY_COUNT;
	const shortFactor = index % 2 === 0 ? 1 : 0.62;
	const color = index % 2 === 0 ? colors.marigold : colors.orange;
	const half = box / 2;

	useEffect(() => {
		if (reduceMotion) {
			wave.set(0);
			return;
		}
		wave.set(
			withDelay(
				1000 + index * 75,
				withRepeat(
					withSequence(
						withTiming(1, {
							duration: 460,
							easing: Easing.inOut(Easing.quad),
						}),
						withTiming(0, {
							duration: 460,
							easing: Easing.inOut(Easing.quad),
						}),
					),
					-1,
					false,
				),
			),
		);
	}, [index, reduceMotion, wave]);

	const barStyle = useAnimatedStyle(() => {
		const length =
			(baseLength * shortFactor +
				amplitude * wave.value +
				amplitude * 0.9 * boost.value) *
			reveal.value;
		return {
			height: length,
			top: half - innerRadius - length,
			opacity: 0.35 + 0.65 * reveal.value,
		};
	});

	return (
		<View
			pointerEvents="none"
			style={{
				position: "absolute",
				left: 0,
				top: 0,
				width: box,
				height: box,
				transform: [{ rotate: `${angle}deg` }],
			}}>
			<Animated.View
				style={[
					{
						position: "absolute",
						left: half - RAY_WIDTH / 2,
						width: RAY_WIDTH,
						borderRadius: RAY_WIDTH / 2,
						backgroundColor: color,
					},
					barStyle,
				]}
			/>
		</View>
	);
}

function Spark({
	x,
	size,
	color,
	delay,
	duration,
	rise,
	phase,
	left,
	top,
	reduceMotion,
}: {
	x: number;
	size: number;
	color: string;
	delay: number;
	duration: number;
	rise: number;
	phase: number;
	left: number;
	top: number;
	reduceMotion: boolean;
}) {
	const progress = useSharedValue(0);

	useEffect(() => {
		if (reduceMotion) {
			progress.set(0);
			return;
		}
		progress.set(
			withDelay(
				delay,
				withRepeat(
					withTiming(1, {
						duration,
						easing: Easing.out(Easing.quad),
					}),
					-1,
					false,
				),
			),
		);
	}, [delay, duration, progress, reduceMotion]);

	const sparkStyle = useAnimatedStyle(() => ({
		opacity: Math.sin(Math.PI * progress.value) * 0.85,
		transform: [
			{ translateY: -rise * progress.value },
			{ translateX: Math.sin(progress.value * 6.28 + phase) * 9 },
			{ scale: 0.6 + 0.7 * progress.value },
		],
	}));

	return (
		<Animated.View
			pointerEvents="none"
			style={[
				{
					position: "absolute",
					left: left + x,
					top,
					width: size,
					height: size,
					borderRadius: size / 2,
					backgroundColor: color,
				},
				sparkStyle,
			]}
		/>
	);
}

type AnimatedSplashProps = {
	onFinish: () => void;
};

export function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
	const reduceMotion = useReducedMotion();
	const { width, height } = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const sunSize = even(width * 0.38);
	const rayBox = even(sunSize * 1.9);
	const rayOffset = (rayBox - sunSize) / 2;
	const opacity = useSharedValue(1);
	const exitScale = useSharedValue(1);
	const sunRiseY = useSharedValue(reduceMotion ? 0 : SUN_RISE);
	const sunRiseScale = useSharedValue(reduceMotion ? 1 : 0.6);
	const sunOpacity = useSharedValue(reduceMotion ? 1 : 0);
	const pressScale = useSharedValue(1);
	const touchX = useSharedValue(0);
	const touchY = useSharedValue(0);
	const boost = useSharedValue(0);
	const reveal = useSharedValue(reduceMotion ? 1 : 0);
	const spin = useSharedValue(0);
	const wordmarkY = useSharedValue(reduceMotion ? 0 : WORDMARK_RISE);
	const wordmarkScale = useSharedValue(reduceMotion ? 1 : 0.7);
	const wordmarkOpacity = useSharedValue(reduceMotion ? 1 : 0);
	const drawWave = useSharedValue(reduceMotion ? 1 : 0);
	const taglineOpacity = useSharedValue(reduceMotion ? 1 : 0);
	const taglineY = useSharedValue(reduceMotion ? 0 : 10);
	const [fading, setFading] = useState(false);
	const finishedRef = useRef(false);
	const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

	const beginFadeOut = () => {
		if (finishedRef.current) {
			return;
		}
		finishedRef.current = true;
		timersRef.current.forEach(clearTimeout);
		setFading(true);
		if (reduceMotion) {
			opacity.set(withTiming(0, { duration: 300 }));
		} else {
			opacity.set(withTiming(0, { duration: EXIT_DURATION }));
			exitScale.set(
				withTiming(1.06, {
					duration: EXIT_DURATION,
					easing: Easing.out(Easing.cubic),
				}),
			);
		}
		timersRef.current.push(
			setTimeout(onFinish, (reduceMotion ? 300 : EXIT_DURATION) + 40),
		);
	};
	const beginFadeOutRef = useRef(beginFadeOut);

	useEffect(() => {
		beginFadeOutRef.current = beginFadeOut;
	});

	useEffect(() => {
		const timers = timersRef.current;
		if (reduceMotion) {
			timers.push(setTimeout(() => beginFadeOutRef.current(), 300));
			return () => timers.forEach(clearTimeout);
		}
		sunOpacity.set(withTiming(1, { duration: 350 }));
		sunRiseY.set(withSpring(0, { damping: 11, stiffness: 120, mass: 0.9 }));
		sunRiseScale.set(withSpring(1, { damping: 9, stiffness: 130, mass: 0.9 }));
		reveal.set(
			withDelay(
				450,
				withTiming(1, {
					duration: 700,
					easing: Easing.out(Easing.back(1.6)),
				}),
			),
		);
		spin.set(
			withRepeat(
				withTiming(360, { duration: 26000, easing: Easing.linear }),
				-1,
				false,
			),
		);
		wordmarkY.set(withDelay(800, withSpring(0, { damping: 12, stiffness: 140 })));
		wordmarkScale.set(
			withDelay(800, withSpring(1, { damping: 8, stiffness: 150 })),
		);
		wordmarkOpacity.set(
			withDelay(
				800,
				withTiming(1, {
					duration: 300,
					easing: Easing.out(Easing.cubic),
				}),
			),
		);
		drawWave.set(
			withDelay(
				1250,
				withTiming(1, {
					duration: 800,
					easing: Easing.out(Easing.cubic),
				}),
			),
		);
		taglineOpacity.set(
			withDelay(
				1700,
				withTiming(1, {
					duration: 400,
					easing: Easing.out(Easing.cubic),
				}),
			),
		);
		taglineY.set(
			withDelay(
				1700,
				withTiming(0, {
					duration: 400,
					easing: Easing.out(Easing.cubic),
				}),
			),
		);
		timers.push(setTimeout(() => beginFadeOutRef.current(), OVERALL_MS));
		return () => timers.forEach(clearTimeout);
	}, [
		drawWave,
		reduceMotion,
		reveal,
		spin,
		sunOpacity,
		sunRiseScale,
		sunRiseY,
		taglineOpacity,
		taglineY,
		wordmarkOpacity,
		wordmarkScale,
		wordmarkY,
	]);

	const overlayStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
	}));
	const exitStyle = useAnimatedStyle(() => ({
		transform: [{ scale: exitScale.value }],
	}));
	const sunStyle = useAnimatedStyle(() => ({
		opacity: sunOpacity.value,
		transform: [
			{ translateX: touchX.value },
			{ translateY: sunRiseY.value + touchY.value },
			{ scale: sunRiseScale.value * pressScale.value },
		],
	}));
	const spinStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${spin.value}deg` }],
	}));
	const wordmarkStyle = useAnimatedStyle(() => ({
		opacity: wordmarkOpacity.value,
		transform: [{ translateY: wordmarkY.value }, { scale: wordmarkScale.value }],
	}));
	const taglineStyle = useAnimatedStyle(() => ({
		opacity: taglineOpacity.value,
		transform: [{ translateY: taglineY.value }],
	}));
	const waveProps = useAnimatedProps(() => ({
		strokeDashoffset: WAVE_LENGTH * (1 - drawWave.value),
	}));

	const skip = () => beginFadeOutRef.current();

	const follow = (pageX: number, pageY: number) => {
		const dx = (pageX - width / 2) * 0.06;
		const dy = (pageY - height / 2) * 0.04;
		touchX.set(
			withSpring(Math.max(-16, Math.min(16, dx)), { damping: 14, stiffness: 160 }),
		);
		touchY.set(
			withSpring(Math.max(-12, Math.min(12, dy)), { damping: 14, stiffness: 160 }),
		);
	};

	const glowRadius = sunSize * 0.74;
	const coreRadius = sunSize * 0.5;
	const canvas = even(sunSize * 1.6);
	const canvasOffset = (canvas - sunSize) / 2;
	const center = canvas / 2;
	const innerRadius = coreRadius * 1.16;
	const baseLength = sunSize * 0.1;
	const amplitude = sunSize * 0.11;
	const sparkTop = height * 0.74;

	return (
		<Animated.View
			style={[styles.fill, overlayStyle]}
			pointerEvents={fading ? "none" : "auto"}>
			<Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
				<Defs>
					<LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
						<Stop offset="0" stopColor={colors.background} />
						<Stop offset="0.55" stopColor={colors.background} />
						<Stop offset="1" stopColor={SKY_BOTTOM} />
					</LinearGradient>
				</Defs>
				<Rect x="0" y="0" width="100%" height="100%" fill="url(#sky)" />
			</Svg>
			{SPARKS.map((spark, index) => (
				<Spark
					key={index}
					x={0}
					size={spark.size}
					color={spark.color}
					delay={spark.delay}
					duration={spark.duration}
					rise={spark.rise}
					phase={spark.phase}
					left={width * spark.x}
					top={sparkTop}
					reduceMotion={reduceMotion}
				/>
			))}
			<Pressable
				style={styles.fill}
				onPress={skip}
				onPressIn={() => {
					pressScale.set(withSpring(0.9, { damping: 10, stiffness: 220 }));
					boost.set(withSpring(1, { damping: 8, stiffness: 160 }));
				}}
				onPressOut={() => {
					pressScale.set(withSpring(1, { damping: 7, stiffness: 160 }));
					boost.set(withTiming(0, { duration: 600 }));
					touchX.set(withSpring(0));
					touchY.set(withSpring(0));
				}}
				onTouchStart={(event) =>
					follow(event.nativeEvent.pageX, event.nativeEvent.pageY)
				}
				onTouchMove={(event) =>
					follow(event.nativeEvent.pageX, event.nativeEvent.pageY)
				}
				accessibilityRole="button"
				accessibilityLabel="Lewati">
				<Animated.View
					style={[styles.centerGroup, { gap: WORDMARK_GAP }, exitStyle]}>
					<Animated.View
						style={[styles.sunWrap, { width: sunSize, height: sunSize }, sunStyle]}>
						<Animated.View
							pointerEvents="none"
							style={[
								{
									position: "absolute",
									left: -rayOffset,
									top: -rayOffset,
									width: rayBox,
									height: rayBox,
								},
								spinStyle,
							]}>
							{Array.from({ length: RAY_COUNT }, (_, index) => (
								<Ray
									key={index}
									index={index}
									box={rayBox}
									innerRadius={innerRadius}
									baseLength={baseLength}
									amplitude={amplitude}
									reveal={reveal}
									boost={boost}
									reduceMotion={reduceMotion}
								/>
							))}
						</Animated.View>
						<Svg
							width={canvas}
							height={canvas}
							style={{
								position: "absolute",
								left: -canvasOffset,
								top: -canvasOffset,
							}}
							pointerEvents="none">
							<Defs>
								<RadialGradient id="core" cx="50%" cy="50%" r="50%">
									<Stop offset="0" stopColor={colors.marigold} />
									<Stop offset="0.55" stopColor={colors.marigold} />
									<Stop offset="0.82" stopColor={colors.orange} />
									<Stop offset="1" stopColor={colors.orange} />
								</RadialGradient>
								<RadialGradient id="glow" cx="50%" cy="50%" r="50%">
									<Stop offset="0" stopColor={colors.orange} stopOpacity={0.4} />
									<Stop offset="0.6" stopColor={colors.orange} stopOpacity={0.18} />
									<Stop offset="1" stopColor={colors.orange} stopOpacity={0} />
								</RadialGradient>
							</Defs>
							<Circle cx={center} cy={center} r={glowRadius} fill="url(#glow)" />
							<Circle cx={center} cy={center} r={coreRadius} fill="url(#core)" />
							<Ellipse
								cx={center - sunSize * 0.14}
								cy={center - sunSize * 0.16}
								rx={coreRadius * 0.34}
								ry={coreRadius * 0.22}
								fill="#FFFFFF"
								opacity={0.3}
							/>
						</Svg>
						{!reduceMotion
							? Array.from({ length: RIPPLE_COUNT }, (_, index) => (
									<Ripple
										key={index}
										index={index}
										size={sunSize}
										reduceMotion={false}
									/>
								))
							: null}
					</Animated.View>
					<View style={styles.wordGroup}>
						<Animated.Text style={[styles.wordmark, wordmarkStyle]}>
							labi
						</Animated.Text>
						<Svg width={168} height={28} style={styles.wave}>
							<Defs>
								<LinearGradient id="wave" x1="0" y1="0" x2="1" y2="0">
									<Stop offset="0" stopColor={colors.marigold} />
									<Stop offset="0.5" stopColor={colors.orange} />
									<Stop offset="1" stopColor={BERRY_RED} />
								</LinearGradient>
							</Defs>
							<AnimatedPath
								d={WAVE_PATH}
								stroke="url(#wave)"
								strokeWidth={5}
								strokeLinecap="round"
								fill="none"
								strokeDasharray={WAVE_LENGTH}
								animatedProps={waveProps}
							/>
						</Svg>
					</View>
				</Animated.View>
				<Animated.Text
					style={[styles.tagline, taglineStyle, { bottom: insets.bottom + 32 }]}>
					LANSIA BERBICARA
				</Animated.Text>
			</Pressable>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	fill: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: colors.background,
	},
	centerGroup: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	sunWrap: {
		alignItems: "center",
		justifyContent: "center",
	},
	wordGroup: {
		alignItems: "center",
		justifyContent: "center",
	},
	wordmark: {
		fontFamily: fonts.display,
		fontSize: 52,
		lineHeight: 64,
		color: colors.text,
		letterSpacing: 0.5,
		textAlign: "center",
		alignSelf: "center",
		includeFontPadding: false,
		width: 240,
	},
	wave: {
		alignSelf: "center",
		marginTop: 2,
	},
	tagline: {
		position: "absolute",
		alignSelf: "center",
		fontFamily: type.label.fontFamily,
		fontSize: type.label.fontSize,
		lineHeight: type.label.lineHeight,
		color: colors.textSecondary,
		letterSpacing: 1,
		textAlign: "center",
	},
	ripple: {
		position: "absolute",
		borderWidth: RIPPLE_STROKE,
	},
});
