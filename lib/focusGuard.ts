import { useCallback, useRef } from "react";
import { Platform, type TextInput } from "react-native";

export function useFocusGuard<K extends string>() {
	const refs = useRef<Partial<Record<K, TextInput | null>>>({});
	const pressAt = useRef<Partial<Record<K, number>>>({});
	const last = useRef<{ key: K; at: number } | null>(null);

	const setRef = useCallback(
		(key: K) =>
			(node: TextInput | null) => {
				refs.current[key] = node;
			},
		[],
	);

	const onPressIn = useCallback(
		(key: K) => () => {
			pressAt.current[key] = Date.now();
		},
		[],
	);

	const onFocus = useCallback(
		(key: K) => () => {
			if (Platform.OS !== "android") {
				return;
			}
			setTimeout(() => {
				const now = Date.now();
				const pressed = now - (pressAt.current[key] ?? -Infinity) < 500;

				if (pressed) {
					last.current = { key, at: now };
					return;
				}

				const previous = last.current;
				if (previous && previous.key !== key && now - previous.at < 400) {
					refs.current[key]?.blur();
					return;
				}

				last.current = { key, at: now };
			}, 0);
		},
		[],
	);

	return { setRef, onPressIn, onFocus };
}
