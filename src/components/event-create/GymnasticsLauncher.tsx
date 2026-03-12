"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Globe,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

type GymnasticsLauncherProps = {
  forwardQueryString?: string;
  defaultDateParam?: string;
};

type DiscoveryInput = { file?: File; url?: string };
type DiscoveryProgressHandler = (progress: number, status: string) => void;
const GYM_DISCOVERY_LOG_PREFIX = "[gymnastics-launcher]";

export default function GymnasticsLauncher({
  forwardQueryString,
  defaultDateParam,
}: GymnasticsLauncherProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedPath, setSelectedPath] = useState<
    "upload" | "url" | "scratch"
  >("upload");
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [urlBusy, setUrlBusy] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [meetUrl, setMeetUrl] = useState("");
  const discoveryBusy = uploadBusy || urlBusy;
  const uploadXhrRef = useRef<XMLHttpRequest | null>(null);
  const ingestAbortRef = useRef<AbortController | null>(null);
  const parseAbortRef = useRef<AbortController | null>(null);
  const parseProgressTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const cancelRequestedRef = useRef(false);
  const discoveryLogStateRef = useRef<{
    status: string;
    bucket: number;
  }>({ status: "", bucket: -1 });

  const toErrorMessage = (err: unknown, fallback: string) => {
    if (err instanceof Error && err.message) return err.message;
    if (typeof err === "string" && err.trim()) return err;
    return fallback;
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
    if (parseProgressTimerRef.current) {
      clearInterval(parseProgressTimerRef.current);
      parseProgressTimerRef.current = null;
    }
  };

  const cancelDiscovery = () => {
    console.log(`${GYM_DISCOVERY_LOG_PREFIX} cancel requested`);
    cancelRequestedRef.current = true;
    clearDiscoveryHandles();
    setUploadBusy(false);
    setUrlBusy(false);
    setUploadProgress(0);
    setUploadStatus("");
    setUploadError("");
    setUrlError("");
  };

  useEffect(() => {
    return () => {
      cancelRequestedRef.current = true;
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
      if (lastState.status !== status || lastState.bucket !== bucket || progress === 96 || progress === 100) {
        log(`progress ${progress}%`, { status });
        discoveryLogStateRef.current = { status, bucket };
      }
      if (!onProgress) return;
      onProgress(Math.max(0, Math.min(100, Math.round(progress))), status);
    };
    const throwIfCancelled = () => {
      if (cancelRequestedRef.current) throw abortError();
    };
    log("starting discovery", file
      ? {
          inputType: "file",
          fileName: file.name,
          sizeBytes: file.size,
          mimeType: file.type || "application/octet-stream",
        }
      : {
          inputType: "url",
          url,
        });
    const formData = new FormData();
    if (file) formData.append("file", file);
    if (url) formData.append("url", url);

    let ingestJson: { eventId?: string; error?: string } = {};
    cancelRequestedRef.current = false;
    discoveryLogStateRef.current = { status: "", bucket: -1 };

    if (file) {
      reportProgress(4, "Uploading meet file...");
      log("starting ingest upload request");
      ingestJson = await new Promise<{ eventId?: string; error?: string }>(
        (resolve, reject) => {
          const xhr = new XMLHttpRequest();
          uploadXhrRef.current = xhr;
          xhr.open("POST", "/api/ingest?mode=meet_discovery", true);
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
        }
      );
      throwIfCancelled();
    } else {
      reportProgress(20, "Submitting meet URL...");
      log("starting ingest url request");
      ingestAbortRef.current = new AbortController();
      const ingestRes = await fetch("/api/ingest?mode=meet_discovery", {
        method: "POST",
        body: formData,
        credentials: "include",
        signal: ingestAbortRef.current.signal,
      }).finally(() => {
        ingestAbortRef.current = null;
      });
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
    reportProgress(72, "Processing meet file...");
    log("starting parse request", { eventId });
    let parseProgress = 72;
    parseProgressTimerRef.current = setInterval(() => {
      parseProgress = Math.min(parseProgress + 3, 96);
      reportProgress(parseProgress, "Processing meet file...");
    }, 700);

    try {
      parseAbortRef.current = new AbortController();
      const parseStartedAt = Date.now();
      const parseRes = await fetch(`/api/parse/${eventId}`, {
        method: "POST",
        credentials: "include",
        signal: parseAbortRef.current.signal,
      }).finally(() => {
        parseAbortRef.current = null;
      });
      const parseJson = await parseRes.json().catch(() => ({}));
      log("parse request completed", {
        status: parseRes.status,
        durationMs: Date.now() - parseStartedAt,
        modelUsed: parseJson?.modelUsed || null,
        repaired: parseJson?.repaired ?? null,
        phase: parseJson?.phase || null,
        enrichmentPending: parseJson?.enrichment?.pending ?? null,
      });
      if (!parseRes.ok) {
        throw new Error(parseJson?.error || "Failed to parse source");
      }
      throwIfCancelled();
    } finally {
      if (parseProgressTimerRef.current) {
        clearInterval(parseProgressTimerRef.current);
        parseProgressTimerRef.current = null;
      }
    }

    reportProgress(100, "Opening meet builder...");
    log("routing to builder", { eventId });
    await new Promise((resolve) => setTimeout(resolve, 350));
    throwIfCancelled();
    router.push(
      `/event/gymnastics/customize?edit=${encodeURIComponent(eventId)}`
    );
  };

  const handleUploadPick = async (pickedFile: File | null) => {
    if (discoveryBusy) return;
    if (!pickedFile) return;
    setSelectedPath("upload");
    setUploadError("");
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
        return;
      }
      console.error(`${GYM_DISCOVERY_LOG_PREFIX} discovery failed`, err);
      setUploadError(toErrorMessage(err, "Failed to parse file"));
      setUploadStatus("");
    } finally {
      setUploadBusy(false);
    }
  };

  const handleUrlSync = async () => {
    if (discoveryBusy) return;
    setSelectedPath("url");
    setUrlError("");
    const trimmed = meetUrl.trim();
    if (!trimmed) {
      setUrlError("Paste a meet URL to continue.");
      return;
    }
    try {
      // Validate before sending to API for a tighter UX loop.
      new URL(trimmed);
    } catch {
      setUrlError("Enter a valid URL.");
      return;
    }

    setUrlBusy(true);
    try {
      await startDiscovery({ url: trimmed });
    } catch (err: unknown) {
      if (isAbortError(err)) return;
      setUrlError(toErrorMessage(err, "Failed to sync URL"));
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
    <main className="min-h-screen bg-[#f3f4f8] px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <h1 className="max-w-3xl text-4xl font-black leading-tight text-[#0f1935] sm:text-5xl md:text-6xl">
          How would you like to
          <br />
          <span className="text-[#6d35f5]">build your gymnast event?</span>
        </h1>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section
            onClick={() => setSelectedPath("upload")}
            className={`rounded-[2rem] bg-white p-6 transition-all ${
              selectedPath === "upload"
                ? "border-2 border-[#7e3af2] shadow-[0_15px_45px_rgba(108,45,232,0.18)]"
                : "border border-[#e5e6ef]"
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
              <span
                className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${
                  selectedPath === "upload"
                    ? "bg-[#f3ebff] text-[#6d35f5]"
                    : "bg-[#eef0f5] text-[#8c94a8]"
                }`}
              >
                <Upload className="h-5 w-5" />
              </span>
              {selectedPath === "upload" ? (
                <CheckCircle2 className="h-5 w-5 text-[#6d35f5]" />
              ) : null}
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8d8ba4]">
              Fastest setup
            </p>
            <h2 className="mt-2 text-3xl font-bold text-[#0f1935]">
              Upload meet file.
            </h2>
            <p className="mt-3 text-base text-[#66677f]">
              Upload your meet packet (PDF/JPG) and let us extract the schedule
              and rosters.
            </p>

            <div className="mt-7">
              {!uploadBusy ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPath("upload");
                    fileInputRef.current?.click();
                  }}
                  disabled={discoveryBusy}
                  className="w-full rounded-2xl border-2 border-dashed border-[#d7d4e5] bg-[#f8f8fc] px-4 py-5 text-left transition hover:border-[#6d35f5] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <div className="flex items-center justify-center gap-2 text-sm font-semibold text-[#5530a8]">
                    <Upload className="h-4 w-4" />
                    Click to Upload File
                  </div>
                  <p className="mt-1 text-center text-xs font-medium text-[#7d7a92]">
                    PDF, JPG, PNG
                  </p>
                </button>
              ) : (
                <div className="w-full rounded-2xl border-2 border-dashed border-[#d7d4e5] bg-[#f8f8fc] px-4 py-4">
                  <div className="mx-auto w-full max-w-sm">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[#5530a8]">
                      <span>{uploadStatus || "Processing meet file..."}</span>
                      <div className="flex items-center gap-2">
                        <span>{uploadProgress}%</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelDiscovery();
                          }}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#d9cdfc] bg-white text-[#6d35f5] hover:bg-[#f3ebff]"
                          aria-label="Cancel upload"
                          title="Cancel"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#e6defa]">
                      <div
                        className="h-full rounded-full bg-[#6d35f5] transition-[width] duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={(e) => {
                  const picked = e.target.files?.[0] || null;
                  void handleUploadPick(picked);
                  e.currentTarget.value = "";
                }}
              />
              {uploadFileName ? (
                <p className="mt-2 truncate text-xs text-[#6a6782]">
                  Selected: {uploadFileName}
                </p>
              ) : null}
              {uploadError ? (
                <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {uploadError}
                </p>
              ) : null}
            </div>
          </section>

          <section
            onClick={() => setSelectedPath("url")}
            className={`flex flex-col rounded-[2rem] bg-[#f9fafc] p-6 transition-all ${
              selectedPath === "url"
                ? "border-2 border-[#7e3af2] shadow-[0_15px_45px_rgba(108,45,232,0.18)]"
                : "border border-[#e5e6ef]"
            }`}
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef0f5] text-[#8c94a8]">
              <Globe className="h-5 w-5" />
            </div>
            {selectedPath === "url" ? (
              <div className="-mt-16 mb-10 flex justify-end">
                <CheckCircle2 className="h-5 w-5 text-[#6d35f5]" />
              </div>
            ) : null}
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#a0a5b6]">
              External integration
            </p>
            <h2 className="mt-2 text-3xl font-bold text-[#0f1935]">
              Live URL Sync
            </h2>
            <p className="mt-3 text-base text-[#66677f]">
              Paste a link to an existing meet page to sync data.
            </p>
            <div className="mt-auto space-y-3 pt-6 pb-2">
              <input
                type="url"
                value={meetUrl}
                onChange={(e) => setMeetUrl(e.target.value)}
                onFocus={() => setSelectedPath("url")}
                placeholder="https://gym-results.com/meet/123"
                className="w-full rounded-2xl border border-[#d7d9e5] bg-white px-4 py-3 text-sm text-[#1c2040] outline-none ring-[#6d35f5] placeholder:text-[#a3a7b8] focus:ring-2"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleUrlSync();
                }}
                disabled={discoveryBusy}
                className="inline-flex w-full items-center justify-center rounded-xl bg-[#0f1935] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0b1430] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {urlBusy ? "Syncing..." : "Sync URL"}
              </button>
              {urlBusy ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelDiscovery();
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#d7d9e5] bg-white px-4 py-2.5 text-xs font-semibold text-[#4c5370] hover:bg-slate-50"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel Sync
                </button>
              ) : null}
              {urlError ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {urlError}
                </p>
              ) : null}
            </div>
          </section>

          <section
            onClick={() => setSelectedPath("scratch")}
            className={`flex flex-col rounded-[2rem] bg-[#f9fafc] p-6 transition-all ${
              selectedPath === "scratch"
                ? "border-2 border-[#7e3af2] shadow-[0_15px_45px_rgba(108,45,232,0.18)]"
                : "border border-[#e5e6ef]"
            }`}
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef0f5] text-[#8c94a8]">
              <Sparkles className="h-5 w-5" />
            </div>
            {selectedPath === "scratch" ? (
              <div className="-mt-16 mb-10 flex justify-end">
                <CheckCircle2 className="h-5 w-5 text-[#6d35f5]" />
              </div>
            ) : null}
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#a0a5b6]">
              Custom design
            </p>
            <h2 className="mt-2 text-3xl font-bold text-[#0f1935]">
              Visual Builder
            </h2>
            <p className="mt-3 text-base text-[#66677f]">
              The ultimate control. Design your meet page block-by-block using
              our template gallery.
            </p>
            <div className="mt-auto pt-6 pb-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openTemplateBuilder();
                }}
                disabled={discoveryBusy}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${
                  selectedPath === "scratch"
                    ? "bg-[#6d35f5] hover:bg-[#5f2ed7]"
                    : "bg-[#0f1935] hover:bg-[#0b1430]"
                }`}
              >
                Open Template Builder
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
