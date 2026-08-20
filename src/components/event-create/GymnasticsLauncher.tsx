"use client";

import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  Globe,
  ShieldCheck,
  Sparkles,
  Upload,
  WandSparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import CopyButton from "@/components/CopyButton";
import DiscoveryProgressPanel, {
  type DiscoveryProgressTheme,
} from "@/components/event-create/DiscoveryProgressPanel";
import {
  createDiscoveryStatusClientError,
  type DiscoveryUiError,
  toDiscoveryUiError,
} from "@/components/event-create/discovery-client-error";
import {
  getDiscoveryStageLabel,
  resolveGymnasticsPipelineProgress,
} from "@/components/event-create/discovery-progress";
import { resolveDiscoveryClientParseTimeoutMs } from "@/lib/discovery-budget";

type GymnasticsLauncherProps = {
  forwardQueryString?: string;
  defaultDateParam?: string;
};

type DiscoveryInput = { file?: File; url?: string };
type DiscoveryProgressHandler = (progress: number, status: string) => void;
const GYM_DISCOVERY_LOG_PREFIX = "[gymnastics-launcher]";
const INGEST_REQUEST_TIMEOUT_MS = 15_000;
const GYMNASTICS_DEMO_DRAFT_STORAGE_KEY = "envitefy:gymnastics-demo-draft:v1";
const LIGHT_RAISED_BUTTON_CLASS =
  "group inline-flex min-h-12 w-fit max-w-full items-center justify-center gap-2.5 rounded-full border border-white/90 bg-[#f0eef5] px-6 py-3 text-sm font-semibold shadow-[8px_8px_18px_rgba(45,38,74,0.18),-8px_-8px_18px_rgba(255,255,255,0.98)] transition-all duration-300 hover:scale-[0.98] hover:shadow-[4px_4px_10px_rgba(45,38,74,0.15),-4px_-4px_10px_rgba(255,255,255,0.94)] active:scale-95 active:shadow-[inset_2px_2px_5px_rgba(45,38,74,0.12),inset_-2px_-2px_5px_rgba(255,255,255,0.85)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d35f5]/35 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100";
const GYM_DISCOVERY_PROGRESS_THEME: DiscoveryProgressTheme = {
  badgeBackground: "rgba(255,255,255,0.12)",
  badgeBorder: "rgba(255,255,255,0.22)",
  baseBackground: "#4a526d",
  borderColor: "#5f6784",
  cancelBorderColor: "#d7d9e5",
  cancelHoverBackground: "#f7f3ff",
  cancelTextColor: "#4c5370",
  fillEnd: "#cab9ff",
  fillMiddle: "#8e63ff",
  fillStart: "#6d35f5",
  textColor: "#ffffff",
};

function GradientCardBorder({
  active,
  end,
  id,
  middle,
  start,
}: {
  active: boolean;
  end: string;
  id: string;
  middle: string;
  start: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 h-full w-full"
      focusable="false"
    >
      <defs>
        <linearGradient id={id} x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor={start} />
          <stop offset="52%" stopColor={middle} />
          <stop offset="100%" stopColor={end} />
        </linearGradient>
      </defs>
      <rect
        x="1"
        y="1"
        width="calc(100% - 2px)"
        height="calc(100% - 2px)"
        rx="26"
        fill="none"
        opacity={active ? 1 : 0.48}
        stroke={`url(#${id})`}
        strokeWidth={active ? 2 : 1}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export default function GymnasticsLauncher({
  forwardQueryString,
  defaultDateParam,
}: GymnasticsLauncherProps) {
  const router = useRouter();
  const { status } = useSession();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedPath, setSelectedPath] = useState<"upload" | "url" | "scratch">("upload");
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadError, setUploadError] = useState<DiscoveryUiError | null>(null);
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [urlBusy, setUrlBusy] = useState(false);
  const [urlProgress, setUrlProgress] = useState(0);
  const [urlStatus, setUrlStatus] = useState("");
  const [urlError, setUrlError] = useState<DiscoveryUiError | null>(null);
  const [meetUrl, setMeetUrl] = useState("");
  const discoveryBusy = uploadBusy || urlBusy;
  const uploadXhrRef = useRef<XMLHttpRequest | null>(null);
  const ingestAbortRef = useRef<AbortController | null>(null);
  const parseAbortRef = useRef<AbortController | null>(null);
  const cancelRequestedRef = useRef(false);
  const currentDiscoveryEventIdRef = useRef<string | null>(null);
  const discoveryLogStateRef = useRef<{
    status: string;
    bucket: number;
  }>({ status: "", bucket: -1 });
  const uploadStageLabel =
    uploadStatus || getDiscoveryStageLabel("gymnastics-upload", uploadProgress);
  const urlStageLabel = urlStatus || getDiscoveryStageLabel("gymnastics-url", urlProgress);
  const resolveParseTimeoutMs = (inputType: "file" | "url") =>
    resolveDiscoveryClientParseTimeoutMs(inputType);

  const toErrorMessage = (err: unknown, fallback: string) => {
    if (err instanceof Error && err.message) return err.message;
    if (typeof err === "string" && err.trim()) return err;
    return fallback;
  };

  const renderDiscoveryError = (error: DiscoveryUiError | null) => {
    if (!error) return null;
    return (
      <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
        <p>{error.message}</p>
        {status === "authenticated" && error.technicalDetails ? (
          <details className="mt-2 rounded border border-red-100 bg-white/70 p-2">
            <summary className="cursor-pointer font-semibold text-red-800">
              Technical details
            </summary>
            <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded bg-slate-950/90 p-2 text-[11px] text-slate-100">
              {error.technicalDetails}
            </pre>
            <div className="mt-2 flex justify-end">
              <CopyButton
                text={error.technicalDetails}
                className="rounded border border-red-200 bg-white px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50"
              >
                Copy technical details
              </CopyButton>
            </div>
          </details>
        ) : null}
      </div>
    );
  };

  const isAbortError = (err: unknown) => {
    if (err instanceof DOMException && err.name === "AbortError") return true;
    if (err instanceof Error && err.name === "AbortError") return true;
    const message = toErrorMessage(err, "").toLowerCase();
    return message.includes("cancel") || message.includes("abort");
  };

  const abortError = () => {
    const err = new Error("Discovery cancelled");
    (err as Error & { name: string }).name = "AbortError";
    return err;
  };

  const buildTimeoutError = (phase: "ingest" | "parse") => {
    if (phase === "ingest") {
      return new Error(
        "Live URL Sync timed out before the server responded. Check that your local Next server is healthy and retry.",
      );
    }
    return new Error(
      "Meet discovery timed out while waiting for the server. Check the Next server logs for extraction progress and retry.",
    );
  };

  const clearDiscoveryHandles = () => {
    if (uploadXhrRef.current) {
      uploadXhrRef.current.abort();
      uploadXhrRef.current = null;
    }
    if (ingestAbortRef.current) {
      ingestAbortRef.current.abort();
      ingestAbortRef.current = null;
    }
    if (parseAbortRef.current) {
      parseAbortRef.current.abort();
      parseAbortRef.current = null;
    }
  };

  const requestDiscoveryCancel = async (eventId: string | null) => {
    if (!eventId) return;
    try {
      await fetch(`/api/discovery/${eventId}/cancel`, {
        method: "POST",
        credentials: "include",
        keepalive: true,
      });
    } catch {
      // Best effort only. Local abort still clears the UI immediately.
    }
  };

  const cancelDiscovery = () => {
    console.log(`${GYM_DISCOVERY_LOG_PREFIX} cancel requested`);
    cancelRequestedRef.current = true;
    const eventId = currentDiscoveryEventIdRef.current;
    currentDiscoveryEventIdRef.current = null;
    void requestDiscoveryCancel(eventId);
    clearDiscoveryHandles();
    setUploadBusy(false);
    setUrlBusy(false);
    setUploadProgress(0);
    setUploadStatus("");
    setUrlProgress(0);
    setUrlStatus("");
    setUploadError(null);
    setUrlError(null);
  };

  useEffect(() => {
    return () => {
      cancelRequestedRef.current = true;
      const eventId = currentDiscoveryEventIdRef.current;
      currentDiscoveryEventIdRef.current = null;
      void requestDiscoveryCancel(eventId);
      clearDiscoveryHandles();
    };
  }, []);

  const startDiscovery = async ({
    file,
    url,
    onProgress,
  }: DiscoveryInput & { onProgress?: DiscoveryProgressHandler }) => {
    const traceId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const log = (message: string, detail?: unknown) => {
      if (detail === undefined) {
        console.log(`${GYM_DISCOVERY_LOG_PREFIX} [${traceId}] ${message}`);
        return;
      }
      console.log(`${GYM_DISCOVERY_LOG_PREFIX} [${traceId}] ${message}`, detail);
    };
    const reportProgress = (progress: number, status: string) => {
      const bucket = Math.floor(progress / 10);
      const lastState = discoveryLogStateRef.current;
      if (lastState.status !== status || lastState.bucket !== bucket || progress === 100) {
        log(`progress ${progress}%`, { status });
        discoveryLogStateRef.current = { status, bucket };
      }
      if (!onProgress) return;
      onProgress(Math.max(0, Math.min(100, Math.round(progress))), status);
    };
    const throwIfCancelled = () => {
      if (cancelRequestedRef.current) throw abortError();
    };
    log(
      "starting discovery",
      file
        ? {
            inputType: "file",
            fileName: file.name,
            sizeBytes: file.size,
            mimeType: file.type || "application/octet-stream",
          }
        : {
            inputType: "url",
            url,
          },
    );
    const formData = new FormData();
    if (file) formData.append("file", file);
    if (url) formData.append("url", url);

    let ingestJson: { eventId?: string; discoveryId?: string; error?: string } = {};
    cancelRequestedRef.current = false;
    discoveryLogStateRef.current = { status: "", bucket: -1 };

    if (file) {
      reportProgress(4, "Uploading meet file...");
      log("starting ingest upload request");
      ingestJson = await new Promise<{ eventId?: string; error?: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        uploadXhrRef.current = xhr;
        xhr.open("POST", "/api/discovery/intake", true);
        xhr.withCredentials = true;

        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          const ratio = event.loaded / event.total;
          reportProgress(5 + ratio * 65, "Uploading meet file...");
        };

        xhr.onabort = () => {
          reject(abortError());
        };

        xhr.onerror = () => {
          reject(new Error("Network error while uploading file"));
        };

        xhr.onload = () => {
          uploadXhrRef.current = null;
          try {
            const json = JSON.parse(xhr.responseText || "{}") as {
              eventId?: string;
              discoveryId?: string;
              error?: string;
            };
            if (xhr.status >= 200 && xhr.status < 300 && json?.eventId) {
              log("ingest upload completed", {
                status: xhr.status,
                eventId: json.eventId,
              });
              resolve(json);
              return;
            }
            reject(new Error(json?.error || "Failed to ingest source"));
          } catch {
            reject(new Error("Failed to parse ingest response"));
          }
        };

        xhr.send(formData);
      });
      throwIfCancelled();
    } else {
      reportProgress(20, "Submitting meet URL...");
      log("starting ingest url request");
      ingestAbortRef.current = new AbortController();
      let ingestTimedOut = false;
      const ingestTimeoutId = window.setTimeout(() => {
        ingestTimedOut = true;
        log("ingest url request timed out", { timeoutMs: INGEST_REQUEST_TIMEOUT_MS });
        ingestAbortRef.current?.abort();
      }, INGEST_REQUEST_TIMEOUT_MS);
      let ingestRes: Response;
      try {
        ingestRes = await fetch("/api/discovery/intake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
          credentials: "include",
          signal: ingestAbortRef.current.signal,
        });
      } catch (err) {
        if (ingestTimedOut) throw buildTimeoutError("ingest");
        throw err;
      } finally {
        window.clearTimeout(ingestTimeoutId);
        ingestAbortRef.current = null;
      }
      ingestJson = await ingestRes.json().catch(() => ({}));
      if (!ingestRes.ok || !ingestJson?.eventId) {
        throw new Error(ingestJson?.error || "Failed to ingest source");
      }
      log("ingest url completed", {
        status: ingestRes.status,
        eventId: ingestJson.eventId,
      });
      throwIfCancelled();
    }

    const eventId = String(ingestJson.eventId);
    currentDiscoveryEventIdRef.current = eventId;
    log("starting discovery pipeline", {
      eventId,
      discoveryId: ingestJson.discoveryId || null,
    });
    const parseStartedAt = Date.now();
    const sourceType = file ? "file" : "url";
    const initialPipelineProgress = resolveGymnasticsPipelineProgress(sourceType, "ingested");
    reportProgress(initialPipelineProgress.progress, initialPipelineProgress.label);

    try {
      parseAbortRef.current = new AbortController();
      const parseTimeoutMs = resolveParseTimeoutMs(file ? "file" : "url");
      const runInit: RequestInit = {
        method: "POST",
        credentials: "include",
        signal: parseAbortRef.current.signal,
      };
      const runRes = await fetch(`/api/discovery/${eventId}/run`, runInit);
      const runJson = await runRes.json().catch(() => ({}));
      if (!runRes.ok) {
        throw new Error(runJson?.error || "Failed to start discovery pipeline");
      }
      while (Date.now() - parseStartedAt < parseTimeoutMs) {
        throwIfCancelled();
        const statusRes = await fetch(`/api/discovery/${eventId}/status`, {
          credentials: "include",
          signal: parseAbortRef.current.signal,
          cache: "no-store",
        });
        const statusJson = await statusRes.json().catch(() => ({}));
        if (!statusRes.ok) {
          throw new Error(statusJson?.error || "Failed to poll discovery status");
        }
        if (statusJson?.errorCode) {
          throw createDiscoveryStatusClientError(statusJson, "Meet discovery failed.");
        }
        log("status poll", {
          processingStage: statusJson?.processingStage ?? null,
          lastSuccessfulStage: statusJson?.lastSuccessfulStage ?? null,
          needsHumanReview: statusJson?.needsHumanReview ?? null,
          draftReady: statusJson?.draftReady ?? null,
          builderReady: statusJson?.builderReady ?? null,
        });
        const pipelineProgress = resolveGymnasticsPipelineProgress(
          sourceType,
          statusJson?.processingStage,
          statusJson?.lastSuccessfulStage,
        );
        reportProgress(pipelineProgress.progress, pipelineProgress.label);
        if (statusJson?.draftReady === true || statusJson?.builderReady === true) {
          break;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 1500));
      }
      if (Date.now() - parseStartedAt >= parseTimeoutMs) {
        log("discovery pipeline timed out", { eventId, timeoutMs: parseTimeoutMs });
        throw buildTimeoutError("parse");
      }
    } finally {
      parseAbortRef.current = null;
    }

    log("routing to builder", { eventId });
    reportProgress(100, "Opening meet builder...");
    await new Promise((resolve) => setTimeout(resolve, 350));
    throwIfCancelled();
    currentDiscoveryEventIdRef.current = null;
    const baseUrl = `/event/gymnastics/customize?edit=${encodeURIComponent(eventId)}&new=1`;
    if (status === "authenticated") {
      router.push(baseUrl);
      return;
    }

    try {
      window.localStorage.setItem(GYMNASTICS_DEMO_DRAFT_STORAGE_KEY, eventId);
    } catch {
      // best effort only
    }
    router.push(`${baseUrl}&demo=1`);
  };

  const handleUploadPick = async (pickedFile: File | null) => {
    if (discoveryBusy) return;
    if (!pickedFile) return;
    setSelectedPath("upload");
    setUploadError(null);
    setUploadBusy(true);
    setUploadFileName(pickedFile.name);
    setUploadProgress(0);
    setUploadStatus("Uploading meet file...");
    console.log(`${GYM_DISCOVERY_LOG_PREFIX} selected file`, {
      fileName: pickedFile.name,
      sizeBytes: pickedFile.size,
      mimeType: pickedFile.type || "application/octet-stream",
    });
    try {
      await startDiscovery({
        file: pickedFile,
        onProgress: (progress, status) => {
          setUploadProgress(progress);
          setUploadStatus(status);
        },
      });
    } catch (err: unknown) {
      if (isAbortError(err)) {
        console.log(`${GYM_DISCOVERY_LOG_PREFIX} discovery cancelled by user`);
        setUploadStatus("");
        setUploadProgress(0);
        currentDiscoveryEventIdRef.current = null;
        return;
      }
      console.error(`${GYM_DISCOVERY_LOG_PREFIX} discovery failed`, err);
      setUploadError(toDiscoveryUiError(err, "Failed to parse file"));
      setUploadStatus("");
      currentDiscoveryEventIdRef.current = null;
    } finally {
      setUploadBusy(false);
    }
  };

  const handleUrlSync = async () => {
    if (discoveryBusy) return;
    setSelectedPath("url");
    setUrlError(null);
    const trimmed = meetUrl.trim();
    if (!trimmed) {
      setUrlError({ message: "Paste a meet URL to continue.", technicalDetails: null });
      return;
    }
    try {
      // Validate before sending to API for a tighter UX loop.
      new URL(trimmed);
    } catch {
      setUrlError({ message: "Enter a valid URL.", technicalDetails: null });
      return;
    }

    setUrlBusy(true);
    setUrlProgress(0);
    setUrlStatus("");
    console.log(`${GYM_DISCOVERY_LOG_PREFIX} URL sync requested`, {
      url: trimmed,
      ingestTimeoutMs: INGEST_REQUEST_TIMEOUT_MS,
      parseTimeoutMs: resolveParseTimeoutMs("url"),
    });
    try {
      await startDiscovery({
        url: trimmed,
        onProgress: (progress, status) => {
          setUrlProgress(progress);
          setUrlStatus(status);
        },
      });
    } catch (err: unknown) {
      if (isAbortError(err)) {
        setUrlProgress(0);
        setUrlStatus("");
        currentDiscoveryEventIdRef.current = null;
        return;
      }
      setUrlError(toDiscoveryUiError(err, "Failed to sync URL"));
      setUrlStatus("");
      currentDiscoveryEventIdRef.current = null;
    } finally {
      setUrlBusy(false);
    }
  };

  const openTemplateBuilder = () => {
    setSelectedPath("scratch");
    const params = new URLSearchParams(forwardQueryString || "");
    if (!forwardQueryString && defaultDateParam) {
      params.set("d", defaultDateParam);
    }
    const qs = params.toString();
    router.push(`/event/gymnastics/customize${qs ? `?${qs}` : ""}`);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f5f5fa] px-4 pb-5 pt-24 sm:px-6 sm:pb-10 sm:pt-24 lg:px-10 lg:pt-10">
      <div className="pointer-events-none absolute -top-40 right-[-8rem] h-[32rem] w-[32rem] rounded-full bg-[#a986ff]/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-14rem] left-[12%] h-[28rem] w-[28rem] rounded-full bg-[#7cc7ff]/10 blur-3xl" />

      <div className="relative mx-auto w-full max-w-7xl">
        <header className="max-w-4xl">
          <div className="hidden items-center gap-2 rounded-full border border-[#ded6f5] bg-white/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#6240ad] shadow-sm backdrop-blur sm:inline-flex">
            <Sparkles className="h-3.5 w-3.5" />
            Gymnastics meet builder
          </div>
          <h1 className="mt-1 text-[1.75rem] font-black leading-[1.08] tracking-[-0.03em] text-[#17112f] sm:mt-5 sm:text-5xl sm:leading-[1.02] sm:tracking-[-0.035em] lg:text-6xl">
            Create your meet page.
            <span className="mt-1.5 block text-[#6d35f5] sm:mt-0">Choose how to start.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#66677f] sm:mt-4 sm:text-lg">
            Bring a packet or public link and we’ll build an editable first draft—or start with a
            blank canvas for full control.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-semibold text-[#68677d] sm:mt-4 sm:gap-x-5 sm:gap-y-2 sm:text-xs">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Nothing publishes automatically
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#6d35f5]" />
              Every detail stays editable
            </span>
          </div>
        </header>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:mt-8 sm:gap-5 lg:grid-cols-3">
          <section
            aria-label="Upload a meet packet"
            className={`relative isolate flex min-h-0 flex-col overflow-hidden rounded-[1.35rem] bg-[radial-gradient(circle_at_12%_8%,rgba(126,58,242,0.16),transparent_38%),linear-gradient(145deg,#ffffff_25%,#f7f2ff_100%)] p-4 transition-all duration-200 sm:rounded-[1.75rem] sm:p-7 lg:min-h-[28rem] ${
              selectedPath === "upload"
                ? "border-2 border-transparent shadow-[0_20px_55px_rgba(108,45,232,0.16)]"
                : "border-2 border-transparent shadow-[0_12px_35px_rgba(21,18,48,0.06)] hover:-translate-y-0.5"
            }`}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-14 -top-16 -z-10 h-44 w-44 rounded-full border-[26px] border-[rgba(140,99,237,0.07)]"
            />
            <GradientCardBorder
              active={selectedPath === "upload"}
              end="#38a3ff"
              id="gym-upload-card-border"
              middle="#a986ff"
              start="#7e3af2"
            />
            <div className="absolute right-4 top-4 rounded-full bg-[#efe7ff] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#6934d5] sm:right-5 sm:top-5 sm:px-3 sm:text-[10px] sm:tracking-[0.14em]">
              Recommended
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#f2ebff] text-[#6d35f5] sm:h-12 sm:w-12 sm:rounded-2xl">
                <Upload className="h-5 w-5" />
              </span>
              <span className="text-xs font-black tabular-nums text-[#aaa5ba]">01</span>
            </div>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8d8ba4] sm:mt-5 sm:text-[11px] sm:tracking-[0.2em]">
              Fastest setup
            </p>
            <h2 className="mt-1.5 text-xl font-black tracking-tight text-[#17112f] sm:mt-2 sm:text-3xl">
              Upload a meet packet
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[#66677f] sm:mt-3 sm:text-[15px]">
              Best for PDF packets, schedules, and parent information sheets.
            </p>
            <ul className="mt-5 hidden space-y-2.5 text-sm text-[#52526a] lg:block">
              {[
                "Dates, times & venue",
                "Admission & spectator policies",
                "Parking, hotels & travel",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#efe9ff] text-[#6d35f5]">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-4 text-center sm:pt-6">
              {!uploadBusy ? (
                <p className="mb-3 text-[11px] font-medium text-[#858197]">
                  PDF, JPG or PNG · Usually under 1 minute
                </p>
              ) : null}
              {!uploadBusy ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPath("upload");
                    fileInputRef.current?.click();
                  }}
                  disabled={discoveryBusy}
                  className={`${LIGHT_RAISED_BUTTON_CLASS} text-[#6840c2] hover:bg-[#eee9fb]`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Upload className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110" />
                    <span className="sm:hidden">Upload packet</span>
                    <span className="hidden sm:inline">Choose packet</span>
                  </span>
                </button>
              ) : (
                <DiscoveryProgressPanel
                  cancelLabel="Cancel upload"
                  expectation="Core draft usually opens in under a minute"
                  label={uploadStageLabel}
                  onCancel={() => cancelDiscovery()}
                  progress={uploadProgress}
                  theme={GYM_DISCOVERY_PROGRESS_THEME}
                />
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={(event) => {
                  const picked = event.target.files?.[0] || null;
                  void handleUploadPick(picked);
                  event.currentTarget.value = "";
                }}
              />
              {uploadFileName ? (
                <div
                  className="mt-3 flex items-center gap-2 rounded-xl bg-[#f5f2fb] px-3 py-2 text-xs text-[#5f5b74]"
                  title={uploadFileName}
                >
                  <FileText className="h-4 w-4 shrink-0 text-[#7754bd]" />
                  <span className="min-w-0 truncate">{uploadFileName}</span>
                </div>
              ) : null}
              {renderDiscoveryError(uploadError)}
            </div>
          </section>

          <section
            aria-label="Sync a public meet URL"
            className={`relative isolate flex min-h-0 flex-col overflow-hidden rounded-[1.35rem] bg-[radial-gradient(circle_at_88%_8%,rgba(67,104,176,0.15),transparent_38%),linear-gradient(145deg,#ffffff_25%,#f2f7ff_100%)] p-4 transition-all duration-200 sm:rounded-[1.75rem] sm:p-7 lg:min-h-[28rem] ${
              selectedPath === "url"
                ? "border-2 border-transparent shadow-[0_20px_55px_rgba(108,45,232,0.14)]"
                : "border-2 border-transparent shadow-[0_12px_35px_rgba(21,18,48,0.05)] hover:-translate-y-0.5"
            } ${discoveryBusy && !urlBusy ? "opacity-60" : ""}`}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-14 -top-16 -z-10 h-44 w-44 rounded-full border-[26px] border-[rgba(67,104,176,0.07)]"
            />
            <GradientCardBorder
              active={selectedPath === "url"}
              end="#38a3ff"
              id="gym-url-card-border"
              middle="#6f63ff"
              start="#7e3af2"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf3ff] text-[#4368b0] sm:h-12 sm:w-12 sm:rounded-2xl">
                  <Globe className="h-5 w-5" />
                </span>
                <span className="text-xs font-black tabular-nums text-[#aaa5ba]">02</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#76758a]">
                <Clock3 className="h-3.5 w-3.5" />
                About 1–2 min
              </span>
            </div>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8d8ba4] sm:mt-5 sm:text-[11px] sm:tracking-[0.2em]">
              Import from the web
            </p>
            <h2 className="mt-1.5 text-xl font-black tracking-tight text-[#17112f] sm:mt-2 sm:text-3xl">
              Sync a live meet URL
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[#66677f] sm:mt-3 sm:text-[15px]">
              Use a public organizer, results, or event-information page.
            </p>
            <div className="mt-5 hidden rounded-2xl border border-[#e4e5ed] bg-[#f8f9fc] p-3 text-xs leading-relaxed text-[#727187] lg:block">
              We’ll follow relevant public links and bring the useful details into one editable
              draft.
            </div>

            <div className="mt-auto hidden space-y-3 pt-6 text-center lg:block">
              <label className="block text-left">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-[#77758b]">
                  Public meet URL
                </span>
                <input
                  type="url"
                  value={meetUrl}
                  onChange={(event) => setMeetUrl(event.target.value)}
                  onFocus={() => setSelectedPath("url")}
                  placeholder="https://meet-site.com/event"
                  className="w-full rounded-xl border border-[#d7d9e5] bg-white px-4 py-3 text-sm text-[#1c2040] outline-none transition placeholder:text-[#a3a7b8] focus:border-[#8c63ed] focus:ring-2 focus:ring-[#8c63ed]/20"
                />
              </label>
              {renderDiscoveryError(urlError)}
              {urlBusy ? (
                <DiscoveryProgressPanel
                  cancelLabel="Cancel sync"
                  label={urlStageLabel}
                  onCancel={() => cancelDiscovery()}
                  progress={urlProgress}
                  showDetails={false}
                  theme={GYM_DISCOVERY_PROGRESS_THEME}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => void handleUrlSync()}
                  disabled={discoveryBusy}
                  className={`${LIGHT_RAISED_BUTTON_CLASS} text-[#345f9d] hover:bg-[#eaf1fb]`}
                >
                  Sync public page
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </button>
              )}
            </div>

            <div className="mt-4 lg:hidden">
              <div className="space-y-3 text-center">
                <label className="block text-left">
                  <span className="sr-only">Public meet URL</span>
                  <input
                    type="url"
                    value={meetUrl}
                    onChange={(event) => setMeetUrl(event.target.value)}
                    onFocus={() => setSelectedPath("url")}
                    placeholder="Paste public meet URL"
                    className="min-h-11 w-full rounded-xl border border-[#d7d9e5] bg-white px-4 py-2.5 text-left text-base text-[#1c2040] outline-none transition placeholder:text-[#a3a7b8] focus:border-[#8c63ed] focus:ring-2 focus:ring-[#8c63ed]/20"
                  />
                </label>
                {renderDiscoveryError(urlError)}
                {urlBusy ? (
                  <DiscoveryProgressPanel
                    cancelLabel="Cancel sync"
                    label={urlStageLabel}
                    onCancel={() => cancelDiscovery()}
                    progress={urlProgress}
                    showDetails={false}
                    theme={GYM_DISCOVERY_PROGRESS_THEME}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleUrlSync()}
                    disabled={discoveryBusy}
                    className={`${LIGHT_RAISED_BUTTON_CLASS} text-[#345f9d] hover:bg-[#eaf1fb]`}
                  >
                    Build from this link
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </button>
                )}
              </div>
            </div>
          </section>

          <section
            aria-label="Start with the visual builder"
            className={`relative isolate flex min-h-0 flex-col overflow-hidden rounded-[1.35rem] bg-[radial-gradient(circle_at_88%_10%,rgba(59,128,103,0.15),transparent_38%),linear-gradient(145deg,#ffffff_25%,#f1faf6_100%)] p-4 transition-all duration-200 sm:rounded-[1.75rem] sm:p-7 lg:min-h-[28rem] ${
              selectedPath === "scratch"
                ? "border-2 border-transparent shadow-[0_20px_55px_rgba(108,45,232,0.14)]"
                : "border-2 border-transparent shadow-[0_12px_35px_rgba(21,18,48,0.05)] hover:-translate-y-0.5"
            } ${discoveryBusy ? "opacity-60" : ""}`}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-14 -top-16 -z-10 h-44 w-44 rounded-full border-[26px] border-[rgba(59,128,103,0.07)]"
            />
            <GradientCardBorder
              active={selectedPath === "scratch"}
              end="#76d3ad"
              id="gym-template-card-border"
              middle="#35a47a"
              start="#6d35f5"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef7f3] text-[#3b8067] sm:h-12 sm:w-12 sm:rounded-2xl">
                  <WandSparkles className="h-5 w-5" />
                </span>
                <span className="text-xs font-black tabular-nums text-[#aaa5ba]">03</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#467662]">
                <Sparkles className="h-3.5 w-3.5" />
                Starts instantly
              </span>
            </div>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8d8ba4] sm:mt-5 sm:text-[11px] sm:tracking-[0.2em]">
              Full creative control
            </p>
            <h2 className="mt-1.5 text-xl font-black tracking-tight text-[#17112f] sm:mt-2 sm:text-3xl">
              Start with a template
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[#66677f] sm:mt-3 sm:text-[15px]">
              Pick a polished layout and build the page section by section.
            </p>
            <ul className="mt-5 hidden space-y-2.5 text-sm text-[#52526a] lg:block">
              {[
                "Choose a visual theme",
                "Edit every page section",
                "Add your own images & details",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e9f4ef] text-[#3b8067]">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-4 text-center sm:pt-6">
              <button
                type="button"
                onClick={openTemplateBuilder}
                disabled={discoveryBusy}
                className={`${LIGHT_RAISED_BUTTON_CLASS} text-[#33705b] hover:bg-[#eaf4ef]`}
              >
                Browse templates
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>
            </div>
          </section>
        </div>

        <p className="mt-5 text-center text-xs text-[#77758a]">
          Not sure where to start? Uploading the organizer’s packet usually produces the most
          complete first draft.
        </p>
      </div>
    </main>
  );
}
