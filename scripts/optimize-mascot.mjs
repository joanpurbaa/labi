// Optimasi maskot LABI ke WebP (jaga alpha, 512 px sisi).
// Pakai: node scripts/optimize-mascot.mjs assets/image assets/mascot
//
// Sumber ada di assets/image (PNG atau WebP, transparan). Hasil ditulis ke
// assets/mascot sebagai WebP agar bisa di-require oleh mascotRegistry.
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
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
const QUALITY = 90;
const ALPHA_QUALITY = 100;

async function optimize(file) {
	const input = join(SRC, file);
	const source = sharp(input);
	const meta = await source.metadata();
	if (extname(file).toLowerCase() === ".webp" && meta.width <= MAX_SIDE && meta.height <= MAX_SIDE) {
		return readFileSync(input);
	}
	const resize = { width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true };
	return source
		.resize(resize)
		.webp({ quality: QUALITY, alphaQuality: ALPHA_QUALITY, effort: 6 })
		.toBuffer();
}

mkdirSync(OUT, { recursive: true });

const sourceFiles = new Set(readdirSync(SRC));
const files = KEYS.map((key) =>
	[sourceFiles.has(`${key}.webp`) ? `${key}.webp` : null, sourceFiles.has(`${key}.png`) ? `${key}.png` : null].find(Boolean),
).filter((file) => file !== undefined && file !== null);
const report = [];
let total = 0;

for (const file of files) {
	const key = basename(file, extname(file));
	const buf = await optimize(file);
	const meta = await sharp(buf).metadata();
	const output = join(OUT, `${key}.webp`);
	writeFileSync(output, buf);
	total += buf.length;
	report.push({ key, bytes: buf.length, width: meta.width, height: meta.height, alpha: meta.hasAlpha });
}

console.log("Maskot diproses:");
for (const row of report) {
	console.log(
		`  ${row.key}: ${(row.bytes / 1024).toFixed(1)} KB (${row.width}x${row.height}, alpha=${row.alpha})`,
	);
}
console.log(`Total WebP: ${(total / 1024).toFixed(1)} KB`);
console.log(`Ukuran PNG sumber: ${(files.reduce((sum, file) => sum + statSync(join(SRC, file)).size, 0) / 1024).toFixed(1)} KB`);
