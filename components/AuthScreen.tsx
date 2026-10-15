import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import {
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, gradients, layout, radii, type } from "../constants/theme";
import { Mascot } from "./mascot/Mascot";

type AuthScreenProps = {
	title: string;
	subtitle: string;
	children: ReactNode;
};

function AuthContent({ title, subtitle, children }: AuthScreenProps) {
	return (
		<>
			{/* <View style={styles.brandRow}>
				<View style={styles.brandMark}>
					<Icon name="brand" size={24} color={colors.primary} />
				</View>
				<View>
					<Text style={[type.h3, styles.brandName]}>LABI</Text>
					<Text style={[type.small, styles.brandTagline]}>Lansia Berbicara</Text>
				</View>
			</View> */}

			{/* <Photo photo="lansia2" radius="xl" kenBurns label style={styles.heroPhoto} /> */}

			<Mascot expression="menyambut" size={160} decorative style={styles.mascot} />

			<Text style={[type.display, styles.title]}>{title}</Text>
			<Text style={[type.body, styles.subtitle]}>{subtitle}</Text>

			<View style={styles.form}>{children}</View>
		</>
	);
}

export function AuthScreen(props: AuthScreenProps) {
	return (
		<SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
			<LinearGradient
				colors={gradients.warm}
				start={{ x: 0, y: 0 }}
				end={{ x: 0.6, y: 1 }}
				style={StyleSheet.absoluteFill}
			/>
			{Platform.OS === "android" ? (
				<ScrollView
					contentContainerStyle={styles.content}
					keyboardShouldPersistTaps="always"
					showsVerticalScrollIndicator={false}
				>
					<AuthContent {...props} />
				</ScrollView>
			) : (
				<KeyboardAvoidingView style={styles.flex} behavior="padding">
					<ScrollView
						contentContainerStyle={styles.content}
						keyboardShouldPersistTaps="always"
						showsVerticalScrollIndicator={false}
					>
						<AuthContent {...props} />
					</ScrollView>
				</KeyboardAvoidingView>
			)}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: {
		flex: 1,
		backgroundColor: colors.background,
	},
	flex: {
		flex: 1,
	},
	content: {
		flexGrow: 1,
		paddingHorizontal: layout.screenPadding,
		paddingTop: 28,
		paddingBottom: 32,
	},
	brandRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	brandMark: {
		width: 48,
		height: 48,
		borderRadius: radii.icon,
		backgroundColor: colors.primarySoft,
		alignItems: "center",
		justifyContent: "center",
	},
	brandName: {
		color: colors.textPrimary,
	},
	brandTagline: {
		color: colors.textSecondary,
		marginTop: 1,
	},
	heroPhoto: {
		marginTop: 24,
	},
	mascot: {
		alignSelf: "center",
		marginTop: 20,
	},
	title: {
		color: colors.textPrimary,
		marginTop: 32,
	},
	subtitle: {
		color: colors.textSecondary,
		marginTop: 8,
	},
	form: {
		marginTop: 28,
	},
});
