import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../components/Icon";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { colors, layout, spacing, type } from "../constants/theme";
import * as api from "../lib/api";
import { useAuth } from "../lib/auth";

type Probe = { label: string; ok: boolean; detail: string };

export default function DevApiScreen() {
	const router = useRouter();
	const { token, user } = useAuth();
	const [probes, setProbes] = useState<Probe[]>([]);
	const [checking, setChecking] = useState(false);

	if (!__DEV__) {
		return null;
	}

	const run = async () => {
		setChecking(true);
		const results: Probe[] = [];

		try {
			const response = await api.health();
			results.push({
				label: "GET /health",
				ok: response?.status === "ok",
				detail: response?.status ?? "tidak ada status",
			});
		} catch (error) {
			results.push({
				label: "GET /health",
				ok: false,
				detail: api.errorMessage(error),
			});
		}

		if (token) {
			try {
				const me = await api.me(token);
				results.push({
					label: "GET /auth/me",
					ok: true,
					detail: `${me.username} (${me.role})`,
				});
			} catch (error) {
				results.push({
					label: "GET /auth/me",
					ok: false,
					detail: api.errorMessage(error),
				});
			}
		}

		setProbes(results);
		setChecking(false);
	};

	return (
		<SafeAreaView style={styles.safe} edges={["top"]}>
			<View style={styles.header}>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Kembali"
					onPress={() => router.back()}
					style={({ pressed }) => [styles.back, pressed && styles.pressed]}
				>
					<Icon name="chevron" size={22} color={colors.textPrimary} />
				</Pressable>
				<Text style={[type.h2, styles.headerTitle]}>Dev · API</Text>
			</View>

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<Card>
					<Text style={[type.small, styles.label]}>Base URL</Text>
					<Text style={[type.body, styles.value]}>
						{api.API_BASE_URL || "(kosong)"}
					</Text>
					<Text style={[type.small, styles.label, styles.spaced]}>Token</Text>
					<Text style={[type.body, styles.value]}>
						{token ? "tersimpan" : "belum ada"}
					</Text>
					<Text style={[type.small, styles.label, styles.spaced]}>Pengguna</Text>
					<Text style={[type.body, styles.value]}>
						{user ? user.email : "belum masuk"}
					</Text>
				</Card>

				<Button
					label={checking ? "Memeriksa…" : "Cek koneksi"}
					loading={checking}
					fullWidth
					onPress={run}
					style={styles.button}
				/>

				{probes.map((probe) => (
					<Card key={probe.label} style={styles.probe}>
						<View style={styles.probeRow}>
							<Icon
								name={probe.ok ? "check" : "info"}
								size={18}
								color={probe.ok ? colors.leafDark : colors.danger}
							/>
							<Text style={[type.bodyStrong, styles.probeLabel]}>
								{probe.label}
							</Text>
						</View>
						<Text style={[type.small, styles.probeDetail]}>{probe.detail}</Text>
					</Card>
				))}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: {
		flex: 1,
		backgroundColor: colors.background,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: layout.screenPadding,
		paddingTop: spacing.sm,
		paddingBottom: spacing.sm,
	},
	back: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: colors.surface,
		alignItems: "center",
		justifyContent: "center",
		transform: [{ scaleX: -1 }],
	},
	headerTitle: {
		color: colors.textPrimary,
	},
	content: {
		paddingHorizontal: layout.screenPadding,
		paddingBottom: spacing.xxxl,
	},
	label: {
		color: colors.textSecondary,
	},
	value: {
		color: colors.textPrimary,
		marginTop: 2,
	},
	spaced: {
		marginTop: 14,
	},
	button: {
		marginTop: spacing.lg,
	},
	probe: {
		marginTop: 12,
	},
	probeRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	probeLabel: {
		color: colors.textPrimary,
	},
	probeDetail: {
		color: colors.textSecondary,
		marginTop: 6,
	},
	pressed: {
		opacity: 0.7,
	},
});
