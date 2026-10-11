import type { IconName } from "../components/Icon";
import type { StatusTone } from "../constants/theme";

export type SessionRecord = {
	id: string;
	when: string;
	date: string;
	duration: string;
	mood: string;
	sleep: string;
	activity: string;
	tone: StatusTone;
	status: string;
	summary: string;
	highlights: string[];
};

export const DUMMY_SESSIONS: SessionRecord[] = [
	{
		id: "s5",
		when: "Minggu ini · 5 Okt",
		date: "5 Oktober 2025",
		duration: "3 menit",
		mood: "Tenang",
		sleep: "Nyenyak",
		activity: "Jalan pagi",
		tone: "stable",
		status: "Sesuai kebiasaan",
		summary:
			"Bu Siti bercerita lebih panjang dari biasanya. Ia menyebut kegiatan jalan pagi dan bercerita tentang cucunya yang datang berkunjung.",
		highlights: [
			"Menyebut lima kegiatan berbeda",
			"Bicara lebih lancar di awal sesi",
			"Sempat berhenti sejenak lalu melanjutkan sendiri",
		],
	},
	{
		id: "s4",
		when: "28 Sep",
		date: "28 September 2025",
		duration: "3 menit",
		mood: "Lelah",
		sleep: "Kurang",
		activity: "Di rumah",
		tone: "watch",
		status: "Perlu dicermati",
		summary:
			"Bu Siti tampak lelah dan beberapa kali mengulang kata. Ini tercatat bersamaan dengan tidur yang kurang.",
		highlights: [
			"Lebih banyak jeda",
			"Mengulang dua kata",
			"Tidur kurang semalam",
		],
	},
	{
		id: "s3",
		when: "21 Sep",
		date: "21 September 2025",
		duration: "3 menit",
		mood: "Senang",
		sleep: "Cukup",
		activity: "Berkebun",
		tone: "stable",
		status: "Sesuai kebiasaan",
		summary:
			"Bu Siti bercerita tentang tanaman di kebun. Nada suaranya lebih hidup dibanding sesi sebelumnya.",
		highlights: [
			"Bercerita tentang kebun",
			"Nada suara lebih hidup",
		],
	},
	{
		id: "s2",
		when: "14 Sep",
		date: "14 September 2025",
		duration: "2 menit",
		mood: "Cemas",
		sleep: "Sulit tidur",
		activity: "Berkumpul keluarga",
		tone: "consult",
		status: "Bisa dibawa ke dokter",
		summary:
			"Bu Siti beberapa kali menyebut sulit tidur. Ia tampak kurang tenang, namun mau menyelesaikan sesi.",
		highlights: [
			"Beberapa kali menyebut sulit tidur",
			"Nada suara lebih pelan",
			"Bersedia dibantu pendamping",
		],
	},
	{
		id: "s1",
		when: "7 Sep",
		date: "7 September 2025",
		duration: "2 menit",
		mood: "Senang",
		sleep: "Cukup",
		activity: "Berkebun",
		tone: "stable",
		status: "Sesuai kebiasaan",
		summary:
			"Sesi pertama. Bu Siti sesekali merasa canggung, tetapi mau ikut bercerita sampai selesai.",
		highlights: [
			"Mau mencoba hal baru",
			"Bercerita tentang kebun",
		],
	},
];

export type AppNotification = {
	id: string;
	title: string;
	body: string;
	time: string;
	icon: IconName;
	tone: "primary" | "accent" | "leaf" | "orange";
	unread: boolean;
};

export const DUMMY_NOTIFICATIONS: AppNotification[] = [
	{
		id: "n1",
		title: "Waktunya sesi mingguan",
		body: "Sudah 7 hari sejak sesi terakhir bersama Bu Siti. Ajak bercerita hari ini.",
		time: "Hari ini · 08.00",
		icon: "session",
		tone: "primary",
		unread: true,
	},
	{
		id: "n2",
		title: "Ringkasan mingguan siap",
		body: "Perubahan percakapan Bu Siti minggu ini sudah bisa kamu lihat.",
		time: "Hari ini · 07.30",
		icon: "chart",
		tone: "accent",
		unread: true,
	},
	{
		id: "n3",
		title: "Catatan konsultasi bertambah",
		body: "Laporan untuk dokter diperbarui. Bawa saat kontrol berikutnya.",
		time: "Kemarin · 19.12",
		icon: "doc",
		tone: "orange",
		unread: true,
	},
	{
		id: "n4",
		title: "Tips pendamping",
		body: "Coba mulai obrolan dari kegiatan pagi hari, biasanya lebih mudah mengalir.",
		time: "2 hari lalu",
		icon: "book",
		tone: "leaf",
		unread: false,
	},
	{
		id: "n5",
		title: "Sesi selesai dicatat",
		body: "Sesi 28 Sep tersimpan. Ada catatan tidur yang perlu dicermati.",
		time: "28 Sep · 16.40",
		icon: "check",
		tone: "primary",
		unread: false,
	},
	{
		id: "n6",
		title: "Selamat datang di LABI",
		body: "Mulai dari sesi 3 menit bersama Bu Siti, kapan pun ia siap.",
		time: "7 Sep",
		icon: "heart",
		tone: "orange",
		unread: false,
	},
];

export type DoctorQuestionItem = {
	id: string;
	question: string;
	note?: string;
	done: boolean;
};

export type DoctorQuestionGroup = {
	id: string;
	title: string;
	icon: IconName;
	items: DoctorQuestionItem[];
};

export const DUMMY_DOCTOR_QUESTIONS: DoctorQuestionGroup[] = [
	{
		id: "perubahan",
		title: "Perubahan yang ingin ditanyakan",
		icon: "chart",
		items: [
			{
				id: "q1",
				question: "Apakah makin sering berhenti saat bercerita masih wajar?",
				note: "Terlihat pada sesi 28 Sep.",
				done: false,
			},
			{
				id: "q2",
				question: "Apakah mengulang kata saat lelah perlu diperiksa?",
				note: "Muncul ketika tidur kurang.",
				done: false,
			},
		],
	},
	{
		id: "tidur",
		title: "Tidur & suasana hati",
		icon: "moon",
		items: [
			{
				id: "q3",
				question: "Apakah masalah tidur memengaruhi cara bicara?",
				note: "Dua sesi terakhir bersamaan dengan tidur kurang.",
				done: false,
			},
			{
				id: "q4",
				question: "Apakah ada kebiasaan sebelum tidur yang sebaiknya dicoba?",
				done: false,
			},
		],
	},
	{
		id: "lanjutan",
		title: "Langkah berikutnya",
		icon: "heart",
		items: [
			{
				id: "q5",
				question: "Apakah latihan bercerita 3 menit masih sesuai?",
				done: false,
			},
			{
				id: "q6",
				question: "Apa tanda yang perlu segera dibawa ke dokter?",
				done: false,
			},
		],
	},
];

export type ReportSection = {
	id: string;
	title: string;
	icon: IconName;
	lines: string[];
};

export type DoctorReport = {
	period: string;
	sessions: number;
	averageDuration: string;
	generatedAt: string;
	sections: ReportSection[];
};

export const DUMMY_REPORT: DoctorReport = {
	period: "7 Sep – 5 Okt 2025",
	sessions: 5,
	averageDuration: "2,6 menit",
	generatedAt: "5 Okt 2025 · 16.45",
	sections: [
		{
			id: "ringkasan",
			title: "Ringkasan",
			icon: "chart",
			lines: [
				"Bu Siti mengikuti 5 sesi bercerita dalam 5 minggu terakhir.",
				"Durasi rata-rata 2,6 menit per sesi.",
				"Perubahan terlihat ringan dan masih dalam kebiasaan yang wajar.",
			],
		},
		{
			id: "pola",
			title: "Pola yang terlihat",
			icon: "clock",
			lines: [
				"Bercerita lebih panjang saat tidur cukup.",
				"Beberapa kali mengulang kata ketika lelah.",
				"Lebih nyaman bercerita tentang kegiatan pagi dan kebun.",
			],
		},
		{
			id: "perhatian",
			title: "Hal yang perlu dicermati",
			icon: "info",
			lines: [
				"Sesi 28 Sep: tidur kurang, lebih banyak jeda.",
				"Sesi 14 Sep: suasana hati cemas, sulit tidur.",
			],
		},
		{
			id: "pertanyaan",
			title: "Pertanyaan untuk dokter",
			icon: "doc",
			lines: [
				"Apakah perubahan ini masih dalam batas wajar?",
				"Apakah perlu pemeriksaan lanjutan terkait tidur?",
				"Latihan komunikasi apa yang cocok dilanjutkan di rumah?",
			],
		},
		{
			id: "langkah",
			title: "Langkah selanjutnya",
			icon: "heart",
			lines: [
				"Lanjutkan sesi 3 menit, satu kali per minggu.",
				"Utamakan sesi saat tidur cukup.",
				"Catat perubahan setelah kontrol dokter.",
			],
		},
	],
};

export type TopicIdea = {
	id: string;
	title: string;
	prompt: string;
	icon: IconName;
};

export const DUMMY_TOPICS: TopicIdea[] = [
	{
		id: "morning",
		title: "Kegiatan pagi",
		prompt: "Apa yang tadi dikerjakan setelah bangun tidur?",
		icon: "clock",
	},
	{
		id: "family",
		title: "Keluarga",
		prompt: "Siapa yang terakhir datang berkunjung?",
		icon: "heart",
	},
	{
		id: "food",
		title: "Makanan favorit",
		prompt: "Masakan apa yang paling disukai akhir-akhir ini?",
		icon: "smile",
	},
	{
		id: "garden",
		title: "Tanaman & kebun",
		prompt: "Tanaman mana yang sedang tumbuh di rumah?",
		icon: "sparkles",
	},
	{
		id: "memories",
		title: "Kenangan lama",
		prompt: "Ada acara lama yang masih diingat?",
		icon: "book",
	},
];

export const WEEKLY_PROGRESS = {
	done: 3,
	target: 4,
	label: "sesi minggu ini",
};

export const WEEKLY_SUMMARY = {
	title: "Perubahan ringan dan positif",
	body:
		"Percakapan minggu ini terasa lebih lancar. Ada satu catatan tidur yang perlu dicermati.",
	status: "Semakin banyak ia bercerita",
	tone: "watch",
} as const;
