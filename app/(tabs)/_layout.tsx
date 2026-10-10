import { Tabs } from "expo-router/js-tabs";
import { CustomTabBar } from "../../components/CustomTabBar";
import { colors } from "../../constants/theme";

export default function TabsLayout() {
	return (
		<Tabs
			tabBar={(props) => <CustomTabBar {...props} />}
			screenOptions={{
				headerShown: false,
				sceneStyle: { backgroundColor: colors.background },
			}}
		>
			<Tabs.Screen name="index" options={{ title: "Beranda" }} />
			<Tabs.Screen name="sesi" options={{ title: "Sesi" }} />
			<Tabs.Screen name="profil" options={{ title: "Profil" }} />
		</Tabs>
	);
}
