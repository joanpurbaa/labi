import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AuthScreen } from "../../components/AuthScreen";
import { PrimaryButton } from "../../components/PrimaryButton";
import { TextField } from "../../components/TextField";
import { colors, radii } from "../../constants/theme";
import { useAuth } from "../../lib/auth";
import { useFocusGuard } from "../../lib/focusGuard";

export default function LoginScreen() {
	const { login } = useAuth();
	const guard = useFocusGuard<"email" | "password">();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const clearError = () => {
		if (error) {
			setError(null);
		}
	};

	const handleSubmit = async () => {
		if (submitting) {
			return;
		}

		setError(null);

		if (!email.trim() || !password) {
			setError("Email dan password wajib diisi.");
			return;
		}

		setSubmitting(true);
		const result = await login({ email, password });
		setSubmitting(false);

		if (!result.ok) {
			setError(result.error);
		}
	};

	return (
		<AuthScreen
			title="Masuk"
			subtitle="Lanjutkan latihan komunikasimu bersama LABI."
		>
			<TextField
				ref={guard.setRef("email")}
				onFocus={guard.onFocus("email")}
				onPressIn={guard.onPressIn("email")}
				label="Email"
				value={email}
				onChangeText={(value) => {
					setEmail(value);
					clearError();
				}}
				placeholder="nama@email.com"
				keyboardType="email-address"
				autoCapitalize="none"
				autoCorrect={false}
				autoComplete="off"
				textContentType="emailAddress"
				importantForAutofill="no"
				returnKeyType="next"
			/>
			<TextField
				ref={guard.setRef("password")}
				onFocus={guard.onFocus("password")}
				onPressIn={guard.onPressIn("password")}
				label="Password"
				value={password}
				onChangeText={(value) => {
					setPassword(value);
					clearError();
				}}
				placeholder="Masukkan password"
				secure
				autoCapitalize="none"
				autoComplete="off"
				textContentType="password"
				importantForAutofill="no"
				returnKeyType="done"
				onSubmitEditing={handleSubmit}
			/>

			{error ? (
				<View style={styles.errorBox}>
					<Text style={styles.errorText}>{error}</Text>
				</View>
			) : null}

			<PrimaryButton
				label="Masuk"
				onPress={handleSubmit}
				loading={submitting}
			/>

			<View style={styles.footer}>
				<Text style={styles.footerText}>Belum punya akun? </Text>
				<Pressable
					accessibilityRole="link"
					hitSlop={8}
					onPress={() => router.push("/register")}
				>
					<Text style={styles.footerLink}>Daftar</Text>
				</Pressable>
			</View>
		</AuthScreen>
	);
}

const styles = StyleSheet.create({
	errorBox: {
		backgroundColor: colors.dangerSoft,
		borderRadius: radii.icon,
		paddingVertical: 12,
		paddingHorizontal: 14,
		marginBottom: 18,
	},
	errorText: {
		fontSize: 15,
		lineHeight: 21,
		color: colors.danger,
	},
	footer: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		marginTop: 24,
	},
	footerText: {
		fontSize: 16,
		color: colors.textSecondary,
	},
	footerLink: {
		fontSize: 16,
		fontWeight: "600",
		color: colors.primary,
	},
});
