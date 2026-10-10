import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, layout } from "../constants/theme";
import { EmptyState } from "./ui/EmptyState";
import type { IllustrationName } from "./ui/Illustration";
import type { IconName } from "./Icon";

type Props = {
	icon: IconName;
	title: string;
	description: string;
	action?: ReactNode;
};

const ILLUSTRATION_BY_ICON: Partial<Record<IconName, IllustrationName>> = {
	session: "session",
	chart: "journey",
	progress: "journey",
};

export function ComingSoon({ icon, title, description, action }: Props) {
	return (
		<SafeAreaView style={styles.safe} edges={["top"]}>
			<View style={styles.content}>
				<EmptyState
					illustration={ILLUSTRATION_BY_ICON[icon] ?? "conversation"}
					title={title}
					description={description}
					action={action}
				/>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: {
		flex: 1,
		backgroundColor: colors.background,
	},
	content: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: layout.screenPadding + 20,
	},
});
