import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import sharp from "sharp";

const ROOT = resolve(process.argv[2] ?? ".");
const SRC = join(ROOT, "assets/mascot/menyambut.png");
const OUT = join(ROOT, "assets/icons");

const CREAM = "#FFF8EE";
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

const LAYERS = [
	{ file: "icon.png", size: 1024, ratio: 0.72, background: CREAM, alpha: false },
	{ file: "adaptive-foreground.png", size: 1024, ratio: 0.56, background: TRANSPARENT, alpha: true },
	{ file: "splash-icon.png", size: 1024, ratio: 0.6, background: TRANSPARENT, alpha: true },
	{ file: "favicon.png", size: 48, ratio: 0.72, background: CREAM, alpha: false },
];

mkdirSync(OUT, { recursive: true });

async function loadMascot() {
	const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
	const { width, height, channels } = info;
	let minX = width;
	let minY = height;
	let maxX = -1;
	let maxY = -1;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (data[(y * width + x) * channels + 3] > 0) {
				if (x < minX) minX = x;
				if (x > maxX) maxX = x;
				if (y < minY) minY = y;
				if (y > maxY) maxY = y;
			}
		}
	}
	const bw = maxX - minX + 1;
	const bh = maxY - minY + 1;
	const buf = await sharp(data, { raw: { width, height, channels } })
		.extract({ left: minX, top: minY, width: bw, height: bh })
		.png()
		.toBuffer();
	return {
		data: buf,
		width: bw,
		height: bh,
		offsetLeft: minX,
		offsetTop: minY,
		sourceWidth: width,
		sourceHeight: height,
		marginLeft: minX,
		marginRight: width - maxX - 1,
		marginTop: minY,
		marginBottom: height - maxY - 1,
	};
}

async function scaled(mascot, box) {
	const scale = box / Math.max(mascot.width, mascot.height);
	const width = Math.max(1, Math.round(mascot.width * scale));
	const height = Math.max(1, Math.round(mascot.height * scale));
	return {
		buf: await sharp(mascot.data).resize({ width, height, fit: "fill" }).png().toBuffer(),
		width,
		height,
	};
}

async function place(mascot, size, ratio, background, alpha) {
	const layer = await scaled(mascot, Math.round(size * ratio));
	const left = Math.round((size - layer.width) / 2);
	const top = Math.round((size - layer.height) / 2);
	let pipeline = sharp({
		create: { width: size, height: size, channels: 4, background },
	}).composite([{ input: layer.buf, left, top }]);
	if (!alpha) {
		pipeline = pipeline.flatten({ background: CREAM }).removeAlpha();
	}
	return pipeline.png({ compressionLevel: 9 }).toBuffer();
}

async function monochrome(mascot, size, ratio) {
	const layer = await scaled(mascot, Math.round(size * ratio));
	const left = Math.round((size - layer.width) / 2);
	const top = Math.round((size - layer.height) / 2);
	const base = await sharp({
		create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 } },
	})
		.png()
		.toBuffer();
	return sharp(base)
		.composite([{ input: layer.buf, left, top, blend: "dest-in" }])
		.png({ compressionLevel: 9 })
		.toBuffer();
}

const mascot = await loadMascot();

const report = [];
for (const layer of LAYERS) {
	const buf = await place(mascot, layer.size, layer.ratio, layer.background, layer.alpha);
	const path = join(OUT, layer.file);
	writeFileSync(path, buf);
	const meta = await sharp(buf).metadata();
	report.push({
		file: layer.file,
		bytes: statSync(path).size,
		width: meta.width,
		height: meta.height,
		hasAlpha: meta.hasAlpha,
		channels: meta.channels,
	});
}

const monoBuf = await monochrome(mascot, 1024, 0.56);
const monoPath = join(OUT, "adaptive-monochrome.png");
writeFileSync(monoPath, monoBuf);
const monoMeta = await sharp(monoBuf).metadata();
report.push({
	file: "adaptive-monochrome.png",
	bytes: statSync(monoPath).size,
	width: monoMeta.width,
	height: monoMeta.height,
	hasAlpha: monoMeta.hasAlpha,
	channels: monoMeta.channels,
});

console.log("Sumber maskot:");
console.log(`  ukuran ${mascot.sourceWidth}x${mascot.sourceHeight}, bbox alpha ${mascot.width}x${mascot.height}`);
console.log(
	`  margin kiri ${mascot.marginLeft}px, kanan ${mascot.marginRight}px, atas ${mascot.marginTop}px, bawah ${mascot.marginBottom}px`,
);
console.log("Aset ikon:");
for (const row of report) {
	console.log(
		`  ${row.file}: ${row.width}x${row.height} ${row.channels}ch alpha=${row.hasAlpha} ${(row.bytes / 1024).toFixed(1)} KB`,
	);
}
