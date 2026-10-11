import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AuthScreen } from "../../components/AuthScreen";
import { PrimaryButton } from "../../components/PrimaryButton";
import { TextField } from "../../components/TextField";
import { colors, radii } from "../../constants/theme";
import { useAuth } from "../../lib/auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = {
	name?: string;
	email?: string;
	password?: string;
	general?: string;
};

export default function RegisterScreen() {
	const { register } = useAuth();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [errors, setErrors] = useState<FieldErrors>({});
	const [submitting, setSubmitting] = useState(false);

	const update = (field: keyof FieldErrors, setter: (value: string) => void) => {
		return (value: string) => {
			setter(value);
			if (errors[field] || errors.general) {
				setErrors((current) => ({ ...current, [field]: undefined, general: undefined }));
			}
		};
	};

	const handleSubmit = async () => {
		if (submitting) {
			return;
		}

		const next: FieldErrors = {};

		const cleanName = name.trim();

		if (!cleanName) {
			next.name = "Nama lengkap wajib diisi.";
		} else if (cleanName.length < 3) {
			next.name = "Nama lengkap minimal 3 karakter.";
		} else if (cleanName.length > 50) {
			next.name = "Nama lengkap maksimal 50 karakter.";
		}

		if (!email.trim()) {
			next.email = "Email wajib diisi.";
		} else if (!EMAIL_PATTERN.test(email.trim())) {
			next.email = "Format email tidak valid.";
		} else if (email.trim().length > 100) {
			next.email = "Email maksimal 100 karakter.";
		}

		if (!password) {
			next.password = "Password wajib diisi.";
		} else if (password.length < 8) {
			next.password = "Password minimal 8 karakter.";
		} else if (password.length > 72) {
			next.password = "Password maksimal 72 karakter.";
		}

		setErrors(next);

		if (Object.keys(next).length > 0) {
			return;
		}

		setSubmitting(true);
		const result = await register({ name, email, password });
		setSubmitting(false);

		if (!result.ok) {
			setErrors({ general: result.error });
		}
	};

	return (
		<AuthScreen
			title="Daftar"
			subtitle="Buat akun pendamping untuk mulai mendampingi."
		>
			<TextField
				label="Nama lengkap pendamping"
				value={name}
				onChangeText={update("name", setName)}
				placeholder="Nama lengkap"
				autoCapitalize="words"
				autoComplete="off"
				textContentType="name"
				importantForAutofill="no"
				returnKeyType="next"
				error={errors.name}
			/>
			<TextField
				label="Email"
				value={email}
				onChangeText={update("email", setEmail)}
				placeholder="nama@email.com"
				keyboardType="email-address"
				autoCapitalize="none"
				autoCorrect={false}
				autoComplete="off"
				textContentType="emailAddress"
				importantForAutofill="no"
				returnKeyType="next"
				error={errors.email}
			/>
			<TextField
				label="Password"
				value={password}
				onChangeText={update("password", setPassword)}
				placeholder="Minimal 8 karakter"
				secure
				autoCapitalize="none"
				autoComplete="off"
				textContentType="newPassword"
				importantForAutofill="no"
				returnKeyType="done"
				onSubmitEditing={handleSubmit}
				error={errors.password}
			/>

			{errors.general ? (
				<View style={styles.errorBox}>
					<Text style={styles.errorText}>{errors.general}</Text>
				</View>
			) : null}

			<PrimaryButton
				label="Daftar"
				onPress={handleSubmit}
				loading={submitting}
			/>

			<View style={styles.footer}>
				<Text style={styles.footerText}>Sudah punya akun? </Text>
				<Pressable
					accessibilityRole="link"
					hitSlop={8}
					onPress={() => router.push("/login")}
				>
					<Text style={styles.footerLink}>Masuk</Text>
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
