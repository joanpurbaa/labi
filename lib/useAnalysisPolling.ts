import { useCallback, useEffect, useRef, useState } from "react";
import * as api from "./api";
import type { AnalysisRead, TranscriptRead } from "./api";
import {
	analysisErrorText,
	isAnalysisDone,
	isAnalysisFailed,
} from "./sessionFlow";

export const ANALYSIS_POLL_INTERVAL_MS = 3000;
export const ANALYSIS_POLL_TIMEOUT_MS = 240000;

export const ANALYZING_MESSAGE =
	"Sedang menganalisis audio, transkripsi, dan panduan latihan klinis... (Perkiraan: 20-40 detik)";
export const ANALYSIS_TIMEOUT_MESSAGE =
	"Proses memakan waktu lebih lama dari biasanya. Silakan muat ulang halaman beberapa saat lagi.";

export type AnalysisPhase =
	| "idle"
	| "checking"
	| "not-started"
	| "starting"
	| "analyzing"
	| "completed"
	| "failed"
	| "timeout"
	| "error";

type UseAnalysisPollingOptions = {
	token: string | null;
	sessionId: number;
	autoResume?: boolean;
};

function sleepMs(ms: number, signal: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		if (signal.aborted) {
			reject(new Error("aborted"));
			return;
		}
		const timer = setTimeout(() => {
			signal.removeEventListener("abort", onAbort);
			resolve();
		}, ms);
		const onAbort = () => {
			clearTimeout(timer);
			reject(new Error("aborted"));
		};
		signal.addEventListener("abort", onAbort);
	});
}

function isStartFatal(err: unknown): boolean {
	if (!(err instanceof api.ApiError)) {
		return false;
	}
	// 409 / "already running" = run sudah jalan → bukan error, langsung polling.
	// network/timeout/5xx = transient → polling yang menentukan.
	if (
		err.status === 409 ||
		err.code === "network" ||
		err.code === "timeout" ||
		isAlreadyRunningMessage(err.data)
	) {
		return false;
	}
	return err.status !== 0 && err.status < 500;
}

function isAlreadyRunningMessage(data: unknown): boolean {
	if (data && typeof data === "object" && "detail" in data) {
		const detail = (data as { detail: unknown }).detail;
		if (typeof detail === "string") {
			return detail.toLowerCase().includes("already running");
		}
	}
	return false;
}

export function useAnalysisPolling({
	token,
	sessionId,
	autoResume = false,
}: UseAnalysisPollingOptions) {
	const [phase, setPhase] = useState<AnalysisPhase>("idle");
	const [analysis, setAnalysis] = useState<AnalysisRead | null>(null);
	const [transcript, setTranscript] = useState<TranscriptRead | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const genRef = useRef(0);
	const abortRef = useRef<AbortController | null>(null);
	const isTriggeringRef = useRef(false);

	const isCurrent = useCallback(
		(gen: number): boolean =>
			genRef.current === gen && !abortRef.current?.signal.aborted,
		[],
	);

	const finishCompleted = useCallback(
		async (
			tk: string,
			gen: number,
			current: AnalysisRead,
			ctrl: AbortController,
		): Promise<void> => {
			setAnalysis(current);
			// Transkrip HANYA diambil setelah status completed.
			try {
				const data = await api.getTranscript(tk, sessionId, ctrl.signal);
				if (genRef.current === gen) {
					setTranscript(data);
				}
			} catch (err) {
				if (__DEV__) {
					console.log("[analysis] getTranscript gagal:", err);
				}
				if (genRef.current === gen) {
					setTranscript(null);
				}
			}
			if (genRef.current === gen && !ctrl.signal.aborted) {
				setMessage(null);
				setPhase("completed");
			}
		},
		[sessionId],
	);

	const failWith = useCallback(
		(gen: number, current: AnalysisRead): void => {
			if (genRef.current !== gen) {
				return;
			}
			setMessage(
				analysisErrorText(current.error_code, current.error_message),
			);
			setPhase("failed");
		},
		[],
	);

	const pollUntilDone = useCallback(
		async (
			tk: string,
			gen: number,
			ctrl: AbortController,
		): Promise<void> => {
			const startedAt = Date.now();
			setPhase("analyzing");
			for (;;) {
				if (Date.now() - startedAt > ANALYSIS_POLL_TIMEOUT_MS) {
					if (genRef.current === gen) {
						setMessage(ANALYSIS_TIMEOUT_MESSAGE);
						setPhase("timeout");
					}
					return;
				}
				try {
					await sleepMs(ANALYSIS_POLL_INTERVAL_MS, ctrl.signal);
				} catch {
					return;
				}
				if (genRef.current !== gen) {
					return;
				}
				let current: AnalysisRead;
				try {
					current = await api.getAnalysis(tk, sessionId, ctrl.signal);
				} catch (err) {
					if (api.isAbortError(err) || genRef.current !== gen) {
						return;
					}
					// 404/transient di tengah polling → tetap tunggu, jangan vonis.
					continue;
				}
				if (genRef.current !== gen) {
					return;
				}
				setAnalysis(current);
				if (isAnalysisDone(current.status)) {
					await finishCompleted(tk, gen, current, ctrl);
					return;
				}
				if (isAnalysisFailed(current.status)) {
					failWith(gen, current);
					return;
				}
			}
		},
		[sessionId, finishCompleted, failWith],
	);

	const isAnalyzing =
		phase === "checking" || phase === "starting" || phase === "analyzing";

	const start = useCallback(async (): Promise<void> => {
		const tk = token;
		if (!tk || !Number.isFinite(sessionId)) {
			return;
		}
		// Single-flight guard sinkron: cegah double-tap sebelum state update.
		if (isTriggeringRef.current || isAnalyzing) {
			return;
		}
		isTriggeringRef.current = true;
		abortRef.current?.abort();
		const ctrl = new AbortController();
		abortRef.current = ctrl;
		const gen = (genRef.current += 1);
		setMessage(null);
		setTranscript(null);
		setPhase("starting");
		try {
			try {
				const initial = await api.startAnalysis(
					tk,
					sessionId,
					undefined,
					ctrl.signal,
				);
				if (!isCurrent(gen)) {
					return;
				}
				setAnalysis(initial);
				if (isAnalysisDone(initial.status)) {
					await finishCompleted(tk, gen, initial, ctrl);
					return;
				}
				if (isAnalysisFailed(initial.status)) {
					failWith(gen, initial);
					return;
				}
				await pollUntilDone(tk, gen, ctrl);
			} catch (err) {
				if (!isCurrent(gen) || api.isAbortError(err)) {
					return;
				}
				if (!isStartFatal(err)) {
					await pollUntilDone(tk, gen, ctrl);
					return;
				}
				setMessage(api.errorMessage(err));
				setPhase("error");
			}
		} finally {
			isTriggeringRef.current = false;
		}
	}, [token, sessionId, isAnalyzing, isCurrent, finishCompleted, failWith, pollUntilDone]);

	const resume = useCallback(async (): Promise<void> => {
		const tk = token;
		if (!tk || !Number.isFinite(sessionId)) {
			return;
		}
		abortRef.current?.abort();
		const ctrl = new AbortController();
		abortRef.current = ctrl;
		const gen = (genRef.current += 1);
		setMessage(null);
		setPhase("checking");
		try {
			const current = await api.getAnalysis(tk, sessionId, ctrl.signal);
			if (!isCurrent(gen)) {
				return;
			}
			setAnalysis(current);
			if (isAnalysisDone(current.status)) {
				await finishCompleted(tk, gen, current, ctrl);
				return;
			}
			if (isAnalysisFailed(current.status)) {
				failWith(gen, current);
				return;
			}
			// running → polling otomatis kembali, jangan sentuh /transcript.
			await pollUntilDone(tk, gen, ctrl);
		} catch (err) {
			if (!isCurrent(gen) || api.isAbortError(err)) {
				return;
			}
			if (err instanceof api.ApiError && err.status === 404) {
				// Belum pernah dianalisis → tampilkan tombol, bukan error.
				setPhase("not-started");
				return;
			}
			setMessage(api.errorMessage(err));
			setPhase("error");
		}
	}, [token, sessionId, isCurrent, finishCompleted, failWith, pollUntilDone]);

	const stop = useCallback((): void => {
		genRef.current += 1;
		abortRef.current?.abort();
		abortRef.current = null;
	}, []);

	useEffect(() => {
		if (autoResume) {
			void resume();
		}
	}, [autoResume, resume]);

	useEffect(
		() => () => {
			genRef.current += 1;
			abortRef.current?.abort();
			abortRef.current = null;
		},
		[],
	);

	return {
		phase,
		analysis,
		transcript,
		message,
		isAnalyzing,
		start,
		resume,
		/** Alias spek: polling langsung tanpa POST (run sudah running). */
		resumePolling: resume,
		stop,
	};
}
