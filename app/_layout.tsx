import {
	PlusJakartaSans_800ExtraBold,
	PlusJakartaSans_700Bold,
	PlusJakartaSans_600SemiBold,
	PlusJakartaSans_400Regular,
} from "@expo-google-fonts/plus-jakarta-sans";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { AnimatedSplash } from "../components/AnimatedSplash";
import { colors } from "../constants/theme";
import { AuthProvider, useAuth } from "../lib/auth";
import { CenterAuditBanner } from "../lib/centerAudit";
import { loadHapticsPreference } from "../lib/haptics";

function RootNavigator() {
	const { user, isReady } = useAuth();
	const isLoggedIn = user !== null;

	if (!isReady) {
		return null;
	}

	return (
		<Stack
			screenOptions={{
				headerShown: false,
				contentStyle: { backgroundColor: colors.background },
			}}
		>
			<Stack.Protected guard={isLoggedIn}>
				<Stack.Screen name="(tabs)" />
				<Stack.Screen name="sesi-pilih" />
				<Stack.Screen name="sesi-bercerita" />
				<Stack.Screen name="sesi-proses" />
				<Stack.Screen name="sesi-nilai" />
				<Stack.Screen name="sesi-hasil" />
				<Stack.Screen name="sesi-detail" />
				<Stack.Screen name="notifikasi" />
				<Stack.Screen name="pertanyaan-dokter" />
				<Stack.Screen name="laporan-dokter" />
				<Stack.Screen name="sesi-konteks" />
				<Stack.Screen name="riwayat" />
				<Stack.Screen name="perkembangan" />
				<Stack.Screen name="panduan" />
				<Stack.Screen name="dev-api" />
			</Stack.Protected>
			<Stack.Protected guard={isLoggedIn}>
				<Stack.Screen name="personalization" />
			</Stack.Protected>
			<Stack.Protected guard={!isLoggedIn}>
				<Stack.Screen name="(auth)" />
			</Stack.Protected>
			<Stack.Screen name="index" />
		</Stack>
	);
}

export default function RootLayout() {
	const [fontsLoaded] = useFonts({
		PlusJakartaSans_800ExtraBold,
		PlusJakartaSans_700Bold,
		PlusJakartaSans_600SemiBold,
		PlusJakartaSans_400Regular,
	});
	const [showSplash, setShowSplash] = useState(true);

	useEffect(() => {
		loadHapticsPreference();
	}, []);

	if (!fontsLoaded) {
		return null;
	}

	return (
		<AuthProvider>
			<View style={styles.root}>
				<StatusBar style="dark" />
				<RootNavigator />
				{showSplash ? (
					<AnimatedSplash onFinish={() => setShowSplash(false)} />
				) : null}
				<CenterAuditBanner />
			</View>
		</AuthProvider>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: colors.background,
	},
});
