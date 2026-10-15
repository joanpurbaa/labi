import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

function readEnvBaseUrl() {
	if (process.env.EXPO_PUBLIC_API_URL) {
		return process.env.EXPO_PUBLIC_API_URL;
	}
	const envPath = resolve(root, ".env");
	if (!existsSync(envPath)) {
		return "";
	}
	for (const line of readFileSync(envPath, "utf8").split("\n")) {
		const match = line.match(/^\s*EXPO_PUBLIC_API_URL\s*=\s*(.+)\s*$/);
		if (match) {
			return match[1].trim();
		}
	}
	return "";
}

const baseUrl = readEnvBaseUrl().replace(/\/+$/, "");
if (!baseUrl) {
	console.error(
		"EXPO_PUBLIC_API_URL tidak ditemukan. Set di .env atau sebagai env var.",
	);
	process.exit(1);
}

const origin = new URL(baseUrl).origin;
const specUrl = `${origin}/openapi.json`;
const outFile = resolve(root, "lib/api/schema.d.ts");

console.log(`Mengambil spesifikasi dari ${specUrl}`);
execFileSync(
	"npx",
	["--yes", "openapi-typescript@7", specUrl, "-o", outFile],
	{ stdio: "inherit", cwd: root },
);
console.log(`Tipe tersimpan di ${outFile}`);
