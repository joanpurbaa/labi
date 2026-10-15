import { Redirect } from "expo-router";
import { useAuth } from "../lib/auth";

export default function Index() {
	const { user, isReady } = useAuth();

	if (!isReady) {
		return null;
	}

	if (!user) {
		return <Redirect href="/login" />;
	}

	return <Redirect href="/(tabs)" />;
}
