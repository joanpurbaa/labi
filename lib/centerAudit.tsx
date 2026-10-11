import { useCallback, useEffect, useState } from "react";
import {
	StyleSheet,
	Text,
	View,
	type LayoutChangeEvent,
	type StyleProp,
	type ViewStyle,
} from "react-native";
import { colors, radii } from "../constants/theme";

// Utilitas dev untuk memastikan anak yang seharusnya center benar-benar center
// di dalam wadahnya. Hanya aktif saat __DEV__; tanpa dampak di produksi.

export type AuditResult = {
	label: string;
	ok: boolean;
	dx: number;
	dy: number;
};

type Box = { x: number; y: number; width: number; height: number };

const store = new Map<string, AuditResult>();
const listeners = new Set<() => void>();

function publish(result: AuditResult) {
	store.set(result.label, result);
	for (const listener of listeners) {
		listener();
	}
}

export function useCenterAuditResults(): AuditResult[] {
	const [, force] = useState(0);
	useEffect(() => {
		const listener = () => force((value) => value + 1);
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	}, []);
	return [...store.values()];
}

// Hook inti: pasang `onOuterLayout` pada wadah dan `onInnerLayout` pada anak yang
// harus center. Keduanya diukur di dalam `CenterAudit`/layar pemakai.
export function useCenterAudit(label: string, tolerance = 2) {
	const [outer, setOuter] = useState<Box | null>(null);
	const [inner, setInner] = useState<Box | null>(null);

	useEffect(() => {
		if (!__DEV__ || !outer || !inner) {
			return;
		}
		const dx = Math.abs(inner.x + inner.width / 2 - outer.width / 2);
		const dy = Math.abs(inner.y + inner.height / 2 - outer.height / 2);
		publish({ label, ok: dx <= tolerance && dy <= tolerance, dx, dy });
	}, [label, tolerance, outer, inner]);

	const onOuterLayout = useCallback((event: LayoutChangeEvent) => {
		setOuter(event.nativeEvent.layout);
	}, []);
	const onInnerLayout = useCallback((event: LayoutChangeEvent) => {
		setInner(event.nativeEvent.layout);
	}, []);

	return { onOuterLayout, onInnerLayout };
}

type CenterAuditProps = {
	label: string;
	tolerance?: number;
	style?: StyleProp<ViewStyle>;
	children: React.ReactNode;
};

// Bungkus anak yang harus center: <CenterAudit label="...">…</CenterAudit>
export function CenterAudit({
	label,
	tolerance = 2,
	style,
	children,
}: CenterAuditProps) {
	const { onOuterLayout, onInnerLayout } = useCenterAudit(label, tolerance);
	return (
		<View style={[styles.outer, style]} onLayout={onOuterLayout}>
			<View style={styles.inner} onLayout={onInnerLayout}>
				{children}
			</View>
		</View>
	);
}

export function CenterAuditBanner() {
	const results = useCenterAuditResults();
	if (!__DEV__) {
		return null;
	}
	const failing = results.filter((result) => !result.ok);
	if (failing.length === 0) {
		return null;
	}
	return (
		<View pointerEvents="none" style={styles.banner}>
			<Text style={styles.bannerText}>
				{failing
					.map(
						(result) =>
							`${result.label} dx${result.dx.toFixed(1)} dy${result.dy.toFixed(1)}`,
					)
					.join("  ·  ")}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	outer: {
		alignSelf: "stretch",
		alignItems: "center",
		justifyContent: "center",
	},
	inner: {
		alignItems: "center",
		justifyContent: "center",
	},
	banner: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		zIndex: 9999,
		alignItems: "center",
		paddingTop: 4,
	},
	bannerText: {
		fontSize: 11,
		color: colors.surface,
		backgroundColor: "rgba(43,34,32,0.72)",
		paddingHorizontal: 10,
		paddingVertical: 3,
		borderRadius: radii.pill,
		overflow: "hidden",
	},
});