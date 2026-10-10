import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { colors } from "../constants/theme";
import { AuthProvider, useAuth } from "../lib/auth";
import { loadHapticsPreference } from "../lib/haptics";

function RootNavigator() {
	const { user, isReady, needsOnboarding } = useAuth();
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
			<Stack.Protected guard={isLoggedIn && !needsOnboarding}>
				<Stack.Screen name="(tabs)" />
				<Stack.Screen name="sesi-bercerita" />
				<Stack.Screen name="sesi-konteks" />
				<Stack.Screen name="riwayat" />
				<Stack.Screen name="perkembangan" />
			</Stack.Protected>
			<Stack.Protected guard={isLoggedIn && needsOnboarding}>
				<Stack.Screen name="personalization" />
			</Stack.Protected>
			<Stack.Protected guard={!isLoggedIn}>
				<Stack.Screen name="(auth)" />
			</Stack.Protected>
		</Stack>
	);
}

export default function RootLayout() {
	const [fontsLoaded] = useFonts({
		"PlusJakartaSans-Regular": require("../assets/fonts/PlusJakartaSans-Regular.ttf"),
		"PlusJakartaSans-Medium": require("../assets/fonts/PlusJakartaSans-Medium.ttf"),
		"PlusJakartaSans-SemiBold": require("../assets/fonts/PlusJakartaSans-SemiBold.ttf"),
		"PlusJakartaSans-Bold": require("../assets/fonts/PlusJakartaSans-Bold.ttf"),
		"AtkinsonHyperlegible-Regular": require("../assets/fonts/AtkinsonHyperlegible-Regular.ttf"),
		"AtkinsonHyperlegible-Bold": require("../assets/fonts/AtkinsonHyperlegible-Bold.ttf"),
	});

	useEffect(() => {
		loadHapticsPreference();
	}, []);

	if (!fontsLoaded) {
		return null;
	}

	return (
		<AuthProvider>
			<StatusBar style="dark" />
			<RootNavigator />
		</AuthProvider>
	);
}
