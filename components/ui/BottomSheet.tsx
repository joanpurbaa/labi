import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../Icon";
import { colors, radii, spacing, type } from "../../constants/theme";

type BottomSheetProps = {
	visible: boolean;
	title: string;
	onClose: () => void;
	children: ReactNode;
};

export function BottomSheet({
	visible,
	title,
	onClose,
	children,
}: BottomSheetProps) {
	return (
		<Modal
			visible={visible}
			animationType="slide"
			transparent
			statusBarTranslucent
			accessibilityViewIsModal
			onRequestClose={onClose}
		>
			<View style={styles.backdrop}>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Tutup"
					onPress={onClose}
					style={styles.backdropTap}
				/>
				<View accessibilityLabel={title} style={styles.sheet}>
					<SafeAreaView edges={["bottom"]} style={styles.safe}>
						<View style={styles.handle} />
						<View style={styles.head}>
							<Text style={[type.h3, styles.title]}>{title}</Text>
							<Pressable
								accessibilityRole="button"
								accessibilityLabel="Tutup panel"
								onPress={onClose}
								hitSlop={12}
								style={({ pressed }) => [
									styles.close,
									pressed && styles.pressed,
								]}
							>
								<Icon name="check" size={18} color={colors.textSecondary} />
							</Pressable>
						</View>
						<View style={styles.body}>{children}</View>
					</SafeAreaView>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		justifyContent: "flex-end",
		backgroundColor: "rgba(30, 20, 10, 0.45)",
	},
	backdropTap: {
		flex: 1,
	},
	sheet: {
		maxHeight: "85%",
		backgroundColor: colors.surface,
		borderTopLeftRadius: radii.card,
		borderTopRightRadius: radii.card,
	},
	safe: {
		paddingHorizontal: 20,
		paddingBottom: spacing.lg,
	},
	handle: {
		width: 44,
		height: 5,
		borderRadius: 3,
		backgroundColor: colors.border,
		alignSelf: "center",
		marginTop: 10,
	},
	head: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 12,
		paddingVertical: 12,
	},
	title: {
		color: colors.textPrimary,
		flexShrink: 1,
	},
	close: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: colors.background,
		alignItems: "center",
		justifyContent: "center",
	},
	body: {
		paddingBottom: 8,
	},
	pressed: {
		opacity: 0.7,
	},
});
