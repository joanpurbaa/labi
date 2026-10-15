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
	console.error("EXPO_PUBLIC_API_URL tidak ditemukan di .env atau environment.");
	process.exit(1);
}

const origin = new URL(baseUrl).origin;
let failed = false;

async function check(label, url) {
	try {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), 15000);
		const response = await fetch(url, { signal: controller.signal });
		clearTimeout(timer);
		const text = await response.text();
		let summary = text.slice(0, 120).replace(/\s+/g, " ");
		try {
			const json = JSON.parse(text);
			summary = JSON.stringify(json).slice(0, 120);
		} catch {
			/* keep text summary */
		}
		const ok = response.ok;
		failed = failed || !ok;
		console.log(
			`${ok ? "OK " : "FAIL"}  ${response.status}  ${label}  ${summary}`,
		);
	} catch (error) {
		failed = true;
		console.log(`FAIL  ---  ${label}  ${error?.message ?? error}`);
	}
}

console.log(`Base URL: ${baseUrl}`);
await check("health", `${baseUrl}/health`);
await check("openapi", `${origin}/openapi.json`);

process.exit(failed ? 1 : 0);
