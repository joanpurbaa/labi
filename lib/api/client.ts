import { ApiError } from "./errors";

const RAW_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

export const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");

const DEFAULT_TIMEOUT_MS = 20000;
const unauthorizedHandlers = new Set<() => void>();

export function registerUnauthorizedHandler(handler: () => void): () => void {
	unauthorizedHandlers.add(handler);
	return () => unauthorizedHandlers.delete(handler);
}

function notifyUnauthorized(): void {
	for (const handler of unauthorizedHandlers) handler();
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
	method?: HttpMethod;
	body?: unknown;
	form?: Record<string, string>;
	formData?: FormData;
	token?: string | null;
	signal?: AbortSignal;
	timeoutMs?: number;
};

function log(...args: unknown[]): void {
	if (__DEV__) {
		console.log("[api]", ...args);
	}
}

const PRIVATE_LOG_KEYS =
	/authorization|token|password|secret|email|username|display.?name|(^|_)name$|survivor|participant_name|transcript|story_text|evidence|rationale|playback_url|recording_uri|file|audio|date_of_birth|phone|address|^text$|^input$|^msg$|^message$|error_message/i;
const SAFE_LOG_STRING_KEYS = new Set([
	"status",
	"error_code",
	"assessment_status",
	"task_type",
	"source",
	"review_status",
	"quality_flag",
	"storage_status",
	"mime_type",
	"content_type",
	"type",
	"code",
	"role",
]);

function safeLogValue(value: unknown, key = ""): unknown {
	if (PRIVATE_LOG_KEYS.test(key)) {
		return "[REDACTED]";
	}
	if (Array.isArray(value)) {
		return value.map((item) => safeLogValue(item));
	}
	if (value && typeof value === "object") {
		return Object.fromEntries(
			Object.entries(value).map(([childKey, childValue]) => [
				childKey,
				safeLogValue(childValue, childKey),
			]),
		);
	}
	if (typeof value === "string") {
		if (!SAFE_LOG_STRING_KEYS.has(key)) return "[REDACTED]";
		return /^[A-Za-z0-9_.-]{1,64}$/.test(value) ? value : "[REDACTED]";
	}
	return value;
}

function logRequest(method: string, path: string, body?: unknown): void {
	log("request", method, path, body === undefined ? "(no body)" : safeLogValue(body));
}

function logResponse(
	method: string,
	path: string,
	status: number | string,
	body: unknown,
): void {
	let safeBody: unknown = safeLogValue(body);
	try {
		const serialized = JSON.stringify(safeBody);
		if (serialized && serialized.length > 4000) {
			safeBody = `${serialized.slice(0, 4000)}… [truncated]`;
		}
	} catch {
		safeBody = "[unavailable]";
	}
	log("response", method, path, status, safeBody);
}

function isJsonContent(response: Response): boolean {
	return (response.headers.get("content-type") ?? "").includes(
		"application/json",
	);
}

function looksLikeHtml(text: string): boolean {
	const head = text.slice(0, 200).trimStart().toLowerCase();
	return head.startsWith("<!doctype") || head.startsWith("<html");
}

async function readBody(response: Response): Promise<unknown> {
	if (isJsonContent(response)) {
		return response.json().catch(() => null);
	}
	const text = await response.text().catch(() => "");
	if (looksLikeHtml(text)) {
		return { __html: true };
	}
	return text || null;
}

export async function request<T>(
	path: string,
	options: RequestOptions = {},
): Promise<T> {
	const method = options.method ?? "GET";
	const requestBody = options.form ?? options.body;
	logRequest(method, path, requestBody);
	if (!API_BASE_URL) {
		logResponse(method, path, "NO_RESPONSE", { code: "missing_api_url" });
		throw new ApiError(
			"Alamat API belum diatur. Set EXPO_PUBLIC_API_URL di file .env.",
			0,
			null,
			"config",
		);
	}

	const headers: Record<string, string> = { Accept: "application/json" };
	let body: BodyInit | undefined;

	if (options.formData) {
		body = options.formData;
	} else if (options.form) {
		headers["Content-Type"] = "application/x-www-form-urlencoded";
		body = new URLSearchParams(options.form).toString();
	} else if (options.body !== undefined) {
		headers["Content-Type"] = "application/json";
		body = JSON.stringify(options.body);
	}

	if (options.token) {
		headers.Authorization = `Bearer ${options.token}`;
	}

	const controller = new AbortController();
	const timeout = setTimeout(
		() => controller.abort(),
		options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
	);
	const externalSignal = options.signal;
	const onExternalAbort = () => controller.abort();
	if (externalSignal) {
		if (externalSignal.aborted) {
			controller.abort();
		} else {
			externalSignal.addEventListener("abort", onExternalAbort);
		}
	}

	let response: Response;
	try {
		response = await fetch(`${API_BASE_URL}${path}`, {
			method: options.method ?? "GET",
			headers,
			body,
			signal: controller.signal,
			redirect: "error",
		});
	} catch (error) {
		const name = (error as { name?: string })?.name;
		if (externalSignal?.aborted || name === "AbortError") {
			const cancelled = externalSignal?.aborted === true;
			logResponse(method, path, "NO_RESPONSE", {
				code: cancelled ? "aborted" : "timeout",
			});
			throw new ApiError(
				cancelled ? "Permintaan dibatalkan." : "Waktu koneksi habis.",
				0,
				null,
				cancelled ? "aborted" : "timeout",
			);
		}
		logResponse(method, path, "NO_RESPONSE", { code: "network_error" });
		throw new ApiError(
			"Tidak dapat terhubung ke server.",
			0,
			null,
			"network",
		);
	} finally {
		clearTimeout(timeout);
		externalSignal?.removeEventListener("abort", onExternalAbort);
	}

	const data = await readBody(response);
	logResponse(method, path, response.status, data);
	if (response.status === 401) notifyUnauthorized();

	if (isHtmlPayload(data)) {
		log("unexpected HTML response", path, response.status);
		throw new ApiError(
			"Server mengirim halaman tak dikenal. Periksa koneksi lalu coba lagi.",
			response.status,
			null,
			"invalid_response",
		);
	}

	if (!response.ok) {
		throw new ApiError(
			`Permintaan gagal (${response.status}).`,
			response.status,
			data,
		);
	}

	return data as T;
}

function isHtmlPayload(data: unknown): boolean {
	return (
		!!data &&
		typeof data === "object" &&
		(data as { __html?: boolean }).__html === true
	);
}

type UploadOptions = {
	token?: string | null;
	onProgress?: (fraction: number) => void;
	signal?: AbortSignal;
};

export function upload<T>(
	path: string,
	formData: FormData,
	options: UploadOptions = {},
): Promise<T> {
	if (!API_BASE_URL) {
		logRequest("POST", path, {
			content_type: "multipart/form-data",
			file: "[REDACTED]",
		});
		logResponse("POST", path, "NO_RESPONSE", { code: "missing_api_url" });
		return Promise.reject(
			new ApiError(
				"Alamat API belum diatur. Set EXPO_PUBLIC_API_URL di file .env.",
				0,
				null,
				"config",
			),
		);
	}

	return new Promise<T>((resolve, reject) => {
		if (options.signal?.aborted) {
			logRequest("POST", path, {
				content_type: "multipart/form-data",
				file: "[REDACTED]",
			});
			logResponse("POST", path, "NO_RESPONSE", { code: "aborted" });
			reject(new ApiError("Permintaan dibatalkan.", 0, null, "aborted"));
			return;
		}

		const xhr = new XMLHttpRequest();
		const url = `${API_BASE_URL}${path}`;
		xhr.open("POST", url);
		xhr.timeout = 60000;
		logRequest("POST", path, {
			content_type: "multipart/form-data",
			file: "[REDACTED]",
		});
		const cleanup = () => options.signal?.removeEventListener("abort", onAbort);
		const onAbort = () => xhr.abort();
		xhr.setRequestHeader("Accept", "application/json");
		if (options.token) {
			xhr.setRequestHeader("Authorization", `Bearer ${options.token}`);
		}

		xhr.upload.onprogress = (event) => {
			if (event.lengthComputable && event.total > 0) {
				options.onProgress?.(event.loaded / event.total);
			}
		};

		xhr.onload = () => {
			cleanup();
			if (xhr.status === 401) notifyUnauthorized();
			if (xhr.responseURL && xhr.responseURL !== url) {
				logResponse("POST", path, xhr.status, { code: "redirected_response" });
				reject(new ApiError("Server mengarahkan permintaan ke alamat lain.", xhr.status, null, "invalid_response"));
				return;
			}
			let data: unknown = null;
			const raw = xhr.responseText;
			if (raw) {
				try {
					data = JSON.parse(raw);
				} catch {
					data = looksLikeHtml(raw) ? { __html: true } : raw;
				}
			}
			logResponse("POST", path, xhr.status, data);
			if (isHtmlPayload(data)) {
				reject(
					new ApiError(
						"Server mengirim halaman tak dikenal.",
						xhr.status,
						null,
						"invalid_response",
					),
				);
				return;
			}
			if (xhr.status >= 200 && xhr.status < 300) {
				resolve(data as T);
				return;
			}
			reject(
				new ApiError(`Permintaan gagal (${xhr.status}).`, xhr.status, data),
			);
		};

		xhr.onerror = () => {
			cleanup();
			logResponse("POST", path, "NO_RESPONSE", { code: "network_error" });
			reject(
				new ApiError("Tidak dapat terhubung ke server.", 0, null, "network"),
			);
		};

		xhr.onabort = () => {
			cleanup();
			logResponse("POST", path, "NO_RESPONSE", { code: "aborted" });
			reject(new ApiError("Permintaan dibatalkan.", 0, null, "aborted"));
		};

		xhr.ontimeout = () => {
			cleanup();
			logResponse("POST", path, "NO_RESPONSE", { code: "timeout" });
			reject(new ApiError("Waktu koneksi habis.", 0, null, "timeout"));
		};

		options.signal?.addEventListener("abort", onAbort);
		xhr.send(formData);
	});
}

export function health(): Promise<{ status: string }> {
	return request<{ status: string }>("/health", { timeoutMs: 8000 });
}
