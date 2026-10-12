import { ApiError } from "./errors";

const RAW_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

export const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
	method?: HttpMethod;
	body?: unknown;
	form?: Record<string, string>;
	token?: string | null;
	signal?: AbortSignal;
};

function log(...args: unknown[]): void {
	if (__DEV__) {
		console.log("[api]", ...args);
	}
}

if (__DEV__) {
	log("base URL:", API_BASE_URL || "(kosong — cek EXPO_PUBLIC_API_URL di .env)");
}

function isJson(response: Response): boolean {
	return (response.headers.get("content-type") ?? "").includes("application/json");
}

function errorHint(data: unknown): string {
	if (data && typeof data === "object" && "detail" in data) {
		const detail = (data as { detail: unknown }).detail;
		if (typeof detail === "string") {
			return detail;
		}
		if (Array.isArray(detail)) {
			return `${detail.length} error validasi`;
		}
	}
	return "";
}

export async function request<T>(
	path: string,
	options: RequestOptions = {},
): Promise<T> {
	if (!API_BASE_URL) {
		throw new ApiError(
			"Alamat API belum diatur. Set EXPO_PUBLIC_API_URL di file .env.",
			0,
		);
	}

	const headers: Record<string, string> = { Accept: "application/json" };
	let body: string | undefined;

	if (options.form) {
		headers["Content-Type"] = "application/x-www-form-urlencoded";
		body = Object.entries(options.form)
			.map(
				([key, value]) =>
					`${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
			)
			.join("&");
	} else if (options.body !== undefined) {
		headers["Content-Type"] = "application/json";
		body = JSON.stringify(options.body);
	}

	if (options.token) {
		headers.Authorization = `Bearer ${options.token}`;
	}

	const method = options.method ?? "GET";
	const url = `${API_BASE_URL}${path}`;
	const startedAt = Date.now();
	console.log(`[api] -> ${method} ${url}`);

	let response: Response;
	try {
		response = await fetch(url, {
			method,
			headers,
			body,
			signal: options.signal,
		});
	} catch (error) {
		const cause = error as { name?: string; message?: string };
		console.log(
			`[api] xx ${method} ${path} GAGAL (${Date.now() - startedAt}ms): ${cause?.name ?? "Error"} - ${cause?.message ?? String(error)}`,
		);
		throw new ApiError(
			"Tidak dapat terhubung ke server. Periksa koneksi internetmu.",
			0,
		);
	}

	console.log(
		`[api] <- ${method} ${path} ${response.status} (${Date.now() - startedAt}ms)`,
	);

	const data = isJson(response)
		? await response.json().catch(() => null)
		: await response.text().catch(() => null);

	if (!response.ok) {
		console.log(`[api] xx ${method} ${path} ${response.status} ${errorHint(data)}`);
		throw new ApiError(
			`Permintaan gagal (${response.status}).`,
			response.status,
			data,
		);
	}

	return data as T;
}
