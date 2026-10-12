import type { ImageSourcePropType } from "react-native";

// Registry foto editorial. Sumber: assets/photos (hasil optimasi WebP dari
// assets/photos-src). Fokus = titik yang harus tetap terlihat saat di-crop.
// `contentPosition` memakai format expo-image { top, left } dalam persen.
//
// DILEWATI (tidak pernah di-import ke app) — dilaporkan ke pengguna:
//   lansia6 (scan otak → kesan diagnosis), lansia7 (kesan permainan/"CAO"),
//   lansia8 (distress + sofa hijau), lansia9 (botol obat), lansia1 (crop tidak
//   dapat diverifikasi tanpa penglihatan; butuh crop manual).

export type PhotoKey = "lansia2" | "lansia3" | "lansia5" | "lansia10" | "lansia4";

export type PhotoMeta = {
	key: PhotoKey;
	source: ImageSourcePropType;
	ratio: number;
	focus: { x: number; y: number };
	tone: "warm" | "very-warm" | "calm";
	allowedIn: string[];
	alt: string;
};

export const photoRegistry: Record<PhotoKey, PhotoMeta> = {
	lansia2: {
		key: "lansia2",
		source: require("../../assets/photos/lansia2.webp"),
		ratio: 3 / 2,
		focus: { x: 55, y: 40 },
		tone: "warm",
		allowedIn: ["hero onboarding/login/register", "empty state Riwayat"],
		alt: "Seorang ibu lansia berhijab tersenyum lembut di sebuah acara",
	},
	lansia3: {
		key: "lansia3",
		source: require("../../assets/photos/lansia3.webp"),
		ratio: 5 / 8,
		focus: { x: 45, y: 30 },
		tone: "very-warm",
		allowedIn: ["kartu Panduan", "empty state", "Hobi/topik obrolan"],
		alt: "Seorang kakek bermain catur di meja kayu bulat",
	},
	lansia5: {
		key: "lansia5",
		source: require("../../assets/photos/lansia5.webp"),
		ratio: 3 / 2,
		focus: { x: 70, y: 40 },
		tone: "warm",
		allowedIn: ["Hobi/topik obrolan", "kartu Panduan"],
		alt: "Seorang kakek berbaju warna-warni memegang kubus Rubik",
	},
	lansia10: {
		key: "lansia10",
		source: require("../../assets/photos/lansia10.webp"),
		ratio: 3 / 2,
		focus: { x: 50, y: 40 },
		tone: "calm",
		allowedIn: [
			"header Persiapan konsultasi",
			"Laporan untuk dokter",
		],
		alt: "Dokter berjas putih berbincang dengan seorang pendamping di ruang tunggu",
	},
	lansia4: {
		key: "lansia4",
		source: require("../../assets/photos/lansia4.webp"),
		ratio: 3 / 2,
		focus: { x: 40, y: 30 },
		tone: "calm",
		allowedIn: ["kartu artikel Panduan (khusus pendamping)"],
		alt: "Seorang kakek tampak cemas ditemani seorang ibu",
	},
};

// Foto yang sengaja tidak dipakai, dicatat agar keputusan mudah diaudit.
export const skippedPhotos = [
	{ key: "lansia1", reason: "Crop wajah/latar (teks SAMSUNG, jaket ojol) belum dapat diverifikasi tanpa penglihatan — butuh crop manual." },
	{ key: "lansia6", reason: "Kesan scan otak/diagnosis, tidak cocok di layar penyintas." },
	{ key: "lansia7", reason: "Kesan permainan/kuis, bukan interaksi nyata." },
	{ key: "lansia8", reason: "Nuansa distress + sofa hijau dominan." },
	{ key: "lansia9", reason: "Botol obat, bernuansa medis/negatif." },
] as const;
