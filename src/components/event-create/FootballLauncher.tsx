"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Globe,
  Upload,
  X,
} from "lucide-react";

type FootballLauncherProps = {
  forwardQueryString?: string;
  defaultDateParam?: string;
};

type DiscoveryInput = { file?: File; url?: string };
type DiscoveryProgressHandler = (progress: number, status: string) => void;

export default function FootballLauncher({
  forwardQueryString,
  defaultDateParam,
}: FootballLauncherProps) {
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
  const [sourceUrl, setSourceUrl] = useState("");
  const uploadXhrRef = useRef<XMLHttpRequest | null>(null);
  const ingestAbortRef = useRef<AbortController | null>(null);
  const parseAbortRef = useRef<AbortController | null>(null);
  const parseProgressTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const cancelRequestedRef = useRef(false);
  const discoveryBusy = uploadBusy || urlBusy;

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
    const reportProgress = (progress: number, status: string) => {
      if (!onProgress) return;
      onProgress(Math.max(0, Math.min(100, Math.round(progress))), status);
    };
    const throwIfCancelled = () => {
      if (cancelRequestedRef.current) throw abortError();
    };
    const formData = new FormData();
    if (file) formData.append("file", file);
    if (url) formData.append("url", url);

    let ingestJson: { eventId?: string; error?: string } = {};
    cancelRequestedRef.current = false;

    if (file) {
      reportProgress(4, "Uploading football file...");
      ingestJson = await new Promise<{ eventId?: string; error?: string }>(
        (resolve, reject) => {
          const xhr = new XMLHttpRequest();
          uploadXhrRef.current = xhr;
          xhr.open("POST", "/api/ingest?mode=football_discovery", true);
          xhr.withCredentials = true;
          xhr.upload.onprogress = (event) => {
            if (!event.lengthComputable) return;
            const ratio = event.loaded / event.total;
            reportProgress(5 + ratio * 65, "Uploading football file...");
          };
          xhr.onabort = () => reject(abortError());
          xhr.onerror = () =>
            reject(new Error("Network error while uploading file"));
          xhr.onload = () => {
            uploadXhrRef.current = null;
            try {
              const json = JSON.parse(xhr.responseText || "{}") as {
                eventId?: string;
                error?: string;
              };
              if (xhr.status >= 200 && xhr.status < 300 && json?.eventId) {
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
      reportProgress(20, "Submitting football URL...");
      ingestAbortRef.current = new AbortController();
      const ingestRes = await fetch("/api/ingest?mode=football_discovery", {
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
      throwIfCancelled();
    }

    const eventId = String(ingestJson.eventId);
    reportProgress(72, "Processing football file...");
    let parseProgress = 72;
    parseProgressTimerRef.current = setInterval(() => {
      parseProgress = Math.min(parseProgress + 3, 96);
      reportProgress(parseProgress, "Processing football file...");
    }, 700);

    try {
      parseAbortRef.current = new AbortController();
      const parseRes = await fetch(`/api/parse/${eventId}`, {
        method: "POST",
        credentials: "include",
        signal: parseAbortRef.current.signal,
      }).finally(() => {
        parseAbortRef.current = null;
      });
      const parseJson = await parseRes.json().catch(() => ({}));
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

    reportProgress(100, "Opening football builder...");
    await new Promise((resolve) => setTimeout(resolve, 350));
    throwIfCancelled();
    router.push(`/event/football/customize?edit=${encodeURIComponent(eventId)}`);
  };

  const handleUploadPick = async (pickedFile: File | null) => {
    if (discoveryBusy || !pickedFile) return;
    setSelectedPath("upload");
    setUploadError("");
    setUploadBusy(true);
    setUploadFileName(pickedFile.name);
    setUploadProgress(0);
    setUploadStatus("Uploading football file...");
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
        setUploadStatus("");
        setUploadProgress(0);
        return;
      }
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
    const trimmed = sourceUrl.trim();
    if (!trimmed) {
      setUrlError("Paste a football schedule or packet URL to continue.");
      return;
    }
    try {
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
    router.push(`/event/football/customize${qs ? `?${qs}` : ""}`);
  };

  return (
    <main className="min-h-screen bg-[#eff3f8] px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <h1 className="max-w-3xl text-4xl font-black leading-tight text-[#0f1935] sm:text-5xl md:text-6xl">
          How would you like to
          <br />
          <span className="text-[#d44f19]">build your football page?</span>
        </h1>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section
            onClick={() => setSelectedPath("upload")}
            className={`rounded-[2rem] bg-white p-6 transition-all ${
              selectedPath === "upload"
                ? "border-2 border-[#d44f19] shadow-[0_15px_45px_rgba(212,79,25,0.18)]"
                : "border border-[#e5e6ef]"
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
              <span
                className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${
                  selectedPath === "upload"
                    ? "bg-[#ffede4] text-[#d44f19]"
                    : "bg-[#eef0f5] text-[#8c94a8]"
                }`}
              >
                <Upload className="h-5 w-5" />
              </span>
              {selectedPath === "upload" ? (
                <CheckCircle2 className="h-5 w-5 text-[#d44f19]" />
              ) : null}
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8d8ba4]">
              Fastest setup
            </p>
            <h2 className="mt-2 text-3xl font-bold text-[#0f1935]">
              Upload football file.
            </h2>
            <p className="mt-3 text-base text-[#66677f]">
              Upload a game packet, season schedule, roster sheet, or parent
              memo and prefill the football page.
            </p>

            <div className="mt-7">
              {!uploadBusy ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  disabled={discoveryBusy}
                  className="w-full rounded-2xl border-2 border-dashed border-[#d7d4e5] bg-[#f8f8fc] px-4 py-5 text-left transition hover:border-[#d44f19] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <div className="flex items-center justify-center gap-2 text-sm font-semibold text-[#a23a13]">
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
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[#a23a13]">
                      <span>{uploadStatus || "Processing football file..."}</span>
                      <div className="flex items-center gap-2">
                        <span>{uploadProgress}%</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelDiscovery();
                          }}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#f2c7b7] bg-white text-[#d44f19] hover:bg-[#ffede4]"
                          aria-label="Cancel upload"
                          title="Cancel"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#f8d8ca]">
                      <div
                        className="h-full rounded-full bg-[#d44f19] transition-[width] duration-300 ease-out"
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
                ? "border-2 border-[#d44f19] shadow-[0_15px_45px_rgba(212,79,25,0.18)]"
                : "border border-[#e5e6ef]"
            }`}
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef0f5] text-[#8c94a8]">
              <Globe className="h-5 w-5" />
            </div>
            {selectedPath === "url" ? (
              <div className="-mt-16 mb-10 flex justify-end">
                <CheckCircle2 className="h-5 w-5 text-[#d44f19]" />
              </div>
            ) : null}
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8d8ba4]">
              Sync from web
            </p>
            <h2 className="mt-2 text-3xl font-bold text-[#0f1935]">
              Paste football URL.
            </h2>
            <p className="mt-3 text-base text-[#66677f]">
              Use an existing schedule page, roster page, or travel packet URL
              and sync the core details.
            </p>
            <div className="mt-7 flex flex-1 flex-col gap-3">
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://school.edu/football/schedule"
                className="w-full rounded-2xl border border-[#d7d4e5] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#d44f19]"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleUrlSync();
                }}
                disabled={discoveryBusy}
                className="mt-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[#d44f19] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#ba4313] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {urlBusy ? "Syncing..." : "Sync URL"}
                <ArrowRight className="h-4 w-4" />
              </button>
              {urlError ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {urlError}
                </p>
              ) : null}
            </div>
          </section>

          <section
            onClick={openTemplateBuilder}
            className={`flex flex-col rounded-[2rem] bg-white p-6 transition-all ${
              selectedPath === "scratch"
                ? "border-2 border-[#d44f19] shadow-[0_15px_45px_rgba(212,79,25,0.18)]"
                : "border border-[#e5e6ef]"
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
              <span
                className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${
                  selectedPath === "scratch"
                    ? "bg-[#ffede4] text-[#d44f19]"
                    : "bg-[#eef0f5] text-[#8c94a8]"
                }`}
              >
                <ArrowRight className="h-5 w-5" />
              </span>
              {selectedPath === "scratch" ? (
                <CheckCircle2 className="h-5 w-5 text-[#d44f19]" />
              ) : null}
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8d8ba4]">
              Full control
            </p>
            <h2 className="mt-2 text-3xl font-bold text-[#0f1935]">
              Start from scratch.
            </h2>
            <p className="mt-3 text-base text-[#66677f]">
              Build the page manually with game schedule, roster, travel,
              equipment, and volunteer sections.
            </p>
            <div className="mt-7 flex flex-1 flex-col">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openTemplateBuilder();
                }}
                className="mt-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[#d44f19] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#ba4313] disabled:cursor-not-allowed disabled:opacity-70"
              >
                Open Builder
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
