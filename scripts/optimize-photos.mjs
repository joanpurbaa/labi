// Optimasi foto editorial ke WebP.
// Pakai: node scripts/optimize-photos.mjs assets/photos-src assets/photos
//
// Hanya key di USED yang diproses. lansia6/7/8/9 sengaja dilewati (lihat docs/photo-credits.md),
// dan lansia1 dilewati karena crop belum bisa diverifikasi tanpa penglihatan.
import { mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import sharp from "sharp";

const SRC = resolve(process.argv[2] ?? "assets/photos-src");
const OUT = resolve(process.argv[3] ?? "assets/photos");

// key -> { maxSide, quality }  hero = 1080, kartu = 640
const USED = {
	"lansia2": { maxSide: 1080, quality: 72 },
	"lansia10": { maxSide: 1080, quality: 72 },
	"lansia3": { maxSide: 640, quality: 74 },
	"lansia5": { maxSide: 640, quality: 74 },
	"lansia4": { maxSide: 640, quality: 74 },
};

const MAX_BYTES = 150 * 1024;
const TOTAL_TARGET = 1.2 * 1024 * 1024;

async function optimize(file, { maxSide, quality }) {
	const input = join(SRC, file);
	let q = quality;
	let buf;
	for (let i = 0; i < 8; i++) {
		buf = await sharp(input)
			.resize({ width: maxSide, height: maxSide, fit: "inside", withoutEnlargement: true })
			.webp({ quality: q, effort: 5 })
			.toBuffer();
		if (buf.length <= MAX_BYTES || q <= 40) {
			break;
		}
		q -= 6;
	}
	return { buf, quality: q };
}

mkdirSync(OUT, { recursive: true });

const files = readdirSync(SRC).filter((f) => /^lansia\d+\.(webp|jpg|jpeg|png)$/i.test(f));
const report = [];
let total = 0;

for (const file of files) {
	const key = basename(file, extname(file));
	const config = USED[key];
	if (!config) {
		report.push({ key, status: "skip" });
		continue;
	}
	const { buf, quality } = await optimize(file, config);
	const outPath = join(OUT, `${key}.webp`);
	writeFileSync(outPath, buf);
	total += buf.length;
	report.push({ key, status: "ok", bytes: buf.length, quality });
}

console.log("Foto diproses:");
for (const row of report) {
	if (row.status === "ok") {
		console.log(`  ${row.key}: ${(row.bytes / 1024).toFixed(1)} KB (q=${row.quality})`);
	} else {
		console.log(`  ${row.key}: DILEWATI`);
	}
}
console.log(`Total: ${(total / 1024).toFixed(1)} KB (target <= ${(TOTAL_TARGET / 1024).toFixed(0)} KB)`);
console.log(`Ukuran sumber: ${(statSync(SRC).size / 1024).toFixed(0)} KB (indikatif)`);