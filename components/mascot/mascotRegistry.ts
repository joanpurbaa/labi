import type { ImageSourcePropType } from "react-native";

export type MascotKey =
	| "menyambut"
	| "mendengar"
	| "berbicara"
	| "berpikir"
	| "gembira"
	| "terimakasih"
	| "peduli"
	| "menenangkan"
	| "mengantuk";

export type MascotDefinition = {
	key: MascotKey;
	source: ImageSourcePropType;
	accessibilityLabel: string;
	meaning: string;
	allowedIn: string[];
};

export const mascotRegistry: Record<MascotKey, MascotDefinition> = {
	menyambut: {
		key: "menyambut",
		source: require("../../assets/mascot/menyambut.png"),
		accessibilityLabel: "Maskot LABI melambaikan tangan menyambut",
		meaning: "Sapaan hangat untuk memulai.",
		allowedIn: ["login", "register", "onboarding", "beranda", "sesi-menunggu"],
	},
	mendengar: {
		key: "mendengar",
		source: require("../../assets/mascot/mendengar.png"),
		accessibilityLabel: "Maskot LABI mendengarkan dengan ramah",
		meaning: "Menemani saat penyintas sedang bercerita.",
		allowedIn: ["sesi-merekam"],
	},
	berbicara: {
		key: "berbicara",
		source: require("../../assets/mascot/berbicara.png"),
		accessibilityLabel: "Maskot LABI menjelaskan dengan ramah",
		meaning: "Menjelaskan instruksi atau langkah berikutnya.",
		allowedIn: ["sesi-instruksi"],
	},
	berpikir: {
		key: "berpikir",
		source: require("../../assets/mascot/berpikir.png"),
		accessibilityLabel: "Maskot LABI sedang berpikir",
		meaning: "Sedang menyusun atau menganalisis catatan.",
		allowedIn: ["analisis", "menyiapkan-laporan"],
	},
	gembira: {
		key: "gembira",
		source: require("../../assets/mascot/gembira.png"),
		accessibilityLabel: "Maskot LABI tersenyum gembira",
		meaning: "Perubahan sesuai kebiasaan atau sesi berjalan baik.",
		allowedIn: ["beranda", "perkembangan", "sesi-detail", "sesi-selesai"],
	},
	terimakasih: {
		key: "terimakasih",
		source: require("../../assets/mascot/terimakasih.png"),
		accessibilityLabel: "Maskot LABI berterima kasih",
		meaning: "Sesi tersimpan atau catatan selesai dibuat.",
		allowedIn: ["sesi-selesai", "sesi-konteks", "laporan"],
	},
	peduli: {
		key: "peduli",
		source: require("../../assets/mascot/peduli.png"),
		accessibilityLabel: "Maskot LABI menunjukkan perhatian",
		meaning: "Ada perubahan yang perlu dicermati.",
		allowedIn: ["beranda", "perkembangan", "sesi-detail"],
	},
	menenangkan: {
		key: "menenangkan",
		source: require("../../assets/mascot/menenangkan.png"),
		accessibilityLabel: "Maskot LABI menenangkan",
		meaning: "Ajak membawa catatan ke dokter atau baca panduan dengan tenang.",
		allowedIn: ["beranda", "laporan-dokter", "pertanyaan-dokter", "panduan"],
	},
	mengantuk: {
		key: "mengantuk",
		source: require("../../assets/mascot/mengantuk.png"),
		accessibilityLabel: "Maskot LABI mengantuk",
		meaning: "Waktu malam atau pengingat tidur.",
		allowedIn: ["beranda", "notifikasi-tidur"],
	},
};
