import { Button } from "./ui/Button";

type PrimaryButtonProps = {
	label: string;
	onPress: () => void;
	disabled?: boolean;
	loading?: boolean;
};

export function PrimaryButton({
	label,
	onPress,
	disabled,
	loading,
}: PrimaryButtonProps) {
	return (
		<Button
			label={label}
			onPress={onPress}
			disabled={disabled}
			loading={loading}
			fullWidth
		/>
	);
}
