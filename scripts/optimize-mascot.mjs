// Optimasi maskot LABI ke PNG (jaga alpha, 512 px sisi, target <= 120 KB).
// Pakai: node scripts/optimize-mascot.mjs assets/image assets/mascot
//
// Sumber asli ada di assets/image (500x500, transparan). Hasil ditulis ke
// assets/mascot sebagai PNG agar bisa di-require oleh mascotRegistry.
import { mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import sharp from "sharp";

const SRC = resolve(process.argv[2] ?? "assets/image");
const OUT = resolve(process.argv[3] ?? "assets/mascot");

const KEYS = [
	"menyambut",
	"mendengar",
	"berbicara",
	"berpikir",
	"gembira",
	"terimakasih",
	"peduli",
	"menenangkan",
	"mengantuk",
];

const MAX_SIDE = 512;
const MAX_BYTES = 120 * 1024;
const TOTAL_TARGET = 1024 * 1024;

async function optimize(file) {
	const input = join(SRC, file);
	const resize = { width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true };

	const lossless = await sharp(input)
		.resize(resize)
		.png({ compressionLevel: 9, adaptiveFiltering: true })
		.toBuffer();
	if (lossless.length <= MAX_BYTES) {
		return { buf: lossless, mode: "lossless" };
	}

	const paletted = await sharp(input)
		.resize(resize)
		.png({ compressionLevel: 9, palette: true, quality: 92, effort: 10 })
		.toBuffer();
	return { buf: paletted, mode: "palette" };
}

mkdirSync(OUT, { recursive: true });

const files = readdirSync(SRC).filter(
	(f) => KEYS.includes(basename(f, extname(f))) && extname(f).toLowerCase() === ".png",
);
const report = [];
let total = 0;

for (const file of files) {
	const key = basename(file, extname(file));
	const { buf, mode } = await optimize(file);
	const meta = await sharp(buf).metadata();
	writeFileSync(join(OUT, `${key}.png`), buf);
	total += buf.length;
	report.push({ key, bytes: buf.length, mode, width: meta.width, height: meta.height, alpha: meta.hasAlpha });
}

console.log("Maskot diproses:");
for (const row of report) {
	console.log(
		`  ${row.key}: ${(row.bytes / 1024).toFixed(1)} KB (${row.mode}, ${row.width}x${row.height}, alpha=${row.alpha})`,
	);
}
console.log(`Total: ${(total / 1024).toFixed(1)} KB (target <= ${(TOTAL_TARGET / 1024).toFixed(0)} KB)`);
console.log(`Ukuran sumber: ${(statSync(SRC).size / 1024).toFixed(0)} KB (indikatif)`);
