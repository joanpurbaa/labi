import { router } from "expo-router";
import { ComingSoon } from "../../components/ComingSoon";
import { Button } from "../../components/ui/Button";

export default function SesiScreen() {
	return (
		<ComingSoon
			icon="session"
			title="Sesi komunikasi"
			description="Mulai latihan berbicara bersama penyintas saat ia sudah siap dan merasa nyaman."
			action={
				<Button
					label="Mulai sesi sekarang"
					fullWidth
					onPress={() => router.push("/sesi-bercerita")}
				/>
			}
		/>
	);
}
