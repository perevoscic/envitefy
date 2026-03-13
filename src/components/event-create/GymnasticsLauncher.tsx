"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Inter, Sora } from "next/font/google";
import { ArrowRight, CheckCircle2, Globe, LayoutTemplate, Upload, X } from "lucide-react";
import Hero from "./gymnastics-landing/Hero";
import HowItWorks from "./gymnastics-landing/HowItWorks";
import FeatureGrid from "./gymnastics-landing/FeatureGrid";
import ExampleMeet from "./gymnastics-landing/ExampleMeet";
import Benefits from "./gymnastics-landing/Benefits";
import CTA from "./gymnastics-landing/CTA";

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-gym-display",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-gym-body",
});

type GymnasticsLauncherProps = {
  forwardQueryString?: string;
  defaultDateParam?: string;
};

type DiscoveryInput = { file?: File; url?: string };
type DiscoveryProgressHandler = (progress: number, status: string) => void;

const GYM_DISCOVERY_LOG_PREFIX = "[gymnastics-launcher]";
const PROCESSING_PROGRESS_CAP = 90;
const SHOW_LIVE_URL_SYNC = false;

const quickFacts = [
  "Built for meet directors, gyms, and coaches",
  "Structured for parents, athletes, and spectators",
  "Designed around gymnastics sessions and logistics",
];

const organizerOptions = [
  {
    title: "Upload meet packet",
    copy: "Best when you already have the schedule, packet, or PDF ready to go.",
    action: "Upload file",
    icon: Upload,
    tone: "primary" as const,
  },
  {
    title: "Open visual builder",
    copy: "Use the template builder when you want to shape the page manually.",
    action: "Open builder",
    icon: LayoutTemplate,
    tone: "secondary" as const,
  },
];

export default function GymnasticsLauncher({
  forwardQueryString,
  defaultDateParam,
}: GymnasticsLauncherProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadXhrRef = useRef<XMLHttpRequest | null>(null);
  const ingestAbortRef = useRef<AbortController | null>(null);
  const parseAbortRef = useRef<AbortController | null>(null);
  const parseProgressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelRequestedRef = useRef(false);
  const discoveryLogStateRef = useRef<{ status: string; bucket: number }>({
    status: "",
    bucket: -1,
  });

  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [urlBusy, setUrlBusy] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [meetUrl, setMeetUrl] = useState("");

  const discoveryBusy = uploadBusy || urlBusy;
  const uploadIndeterminate =
    uploadBusy &&
    uploadStatus === "Processing..." &&
    uploadProgress >= PROCESSING_PROGRESS_CAP;

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
      if (
        lastState.status !== status ||
        lastState.bucket !== bucket ||
        progress === PROCESSING_PROGRESS_CAP ||
        progress === 100
      ) {
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

          xhr.onabort = () => reject(abortError());
          xhr.onerror = () => reject(new Error("Network error while uploading file"));

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
        },
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
      parseProgress = Math.min(parseProgress + 3, PROCESSING_PROGRESS_CAP);
      reportProgress(
        parseProgress,
        parseProgress >= PROCESSING_PROGRESS_CAP
          ? "Processing..."
          : "Processing meet file...",
      );
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
    router.push(`/event/gymnastics/customize?edit=${encodeURIComponent(eventId)}`);
  };

  const handleUploadPick = async (pickedFile: File | null) => {
    if (discoveryBusy || !pickedFile) return;
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
    setUrlError("");
    const trimmed = meetUrl.trim();
    if (!trimmed) {
      setUrlError("Paste a meet URL to continue.");
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
    const params = new URLSearchParams(forwardQueryString || "");
    if (!forwardQueryString && defaultDateParam) {
      params.set("d", defaultDateParam);
    }
    const qs = params.toString();
    router.push(`/event/gymnastics/customize${qs ? `?${qs}` : ""}`);
  };

  return (
    <main
      className={`${sora.variable} ${inter.variable} min-h-screen bg-[linear-gradient(180deg,#f7f8ff_0%,#f8fafc_50%,#ffffff_100%)] text-[#17153f] [font-family:var(--font-gym-body)]`}
    >
      <Hero
        fileInputRef={fileInputRef}
        discoveryBusy={discoveryBusy}
        uploadBusy={uploadBusy}
        uploadFileName={uploadFileName}
        uploadProgress={uploadProgress}
        uploadStatus={uploadStatus}
        uploadError={uploadError}
        uploadIndeterminate={uploadIndeterminate}
        onPickUpload={() => fileInputRef.current?.click()}
        onCancelDiscovery={cancelDiscovery}
        onFileChange={(file) => {
          void handleUploadPick(file);
        }}
        onOpenBuilder={openTemplateBuilder}
      />

      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-[#dde2f4] bg-white p-6 shadow-[0_18px_40px_rgba(30,27,75,0.05)]">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#4f46e5]">
              Why this feels different
            </p>
            <h2 className="mt-4 font-[var(--font-gym-display)] text-3xl font-bold tracking-[-0.035em] text-[#1e1b4b]">
              Made for gymnastics movement, timing, and meet-day logistics
            </h2>
            <div className="mt-5 space-y-3">
              {quickFacts.map((fact) => (
                <div
                  key={fact}
                  className="flex items-start gap-3 rounded-[1.25rem] border border-[#edf0fb] bg-[#f9faff] px-4 py-3"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#4f46e5]" />
                  <p className="text-sm leading-6 text-[#53607d]">{fact}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {organizerOptions.map(({ title, copy, action, icon: Icon, tone }) => (
              <article
                key={title}
                className={`rounded-[2rem] border p-6 shadow-[0_18px_40px_rgba(30,27,75,0.05)] ${
                  tone === "primary"
                    ? "border-[#23205a] bg-[#1e1b4b] text-white"
                    : "border-[#dde2f4] bg-white text-[#1e1b4b]"
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    tone === "primary"
                      ? "bg-white/10 text-[#d4af37]"
                      : "bg-[#efeeff] text-[#4f46e5]"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-[var(--font-gym-display)] text-2xl font-bold tracking-[-0.03em]">
                  {title}
                </h3>
                <p
                  className={`mt-3 text-sm leading-7 ${
                    tone === "primary" ? "text-[#dee2ff]" : "text-[#586581]"
                  }`}
                >
                  {copy}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (tone === "primary") {
                      fileInputRef.current?.click();
                      return;
                    }
                    openTemplateBuilder();
                  }}
                  disabled={discoveryBusy}
                  className={`mt-6 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${
                    tone === "primary"
                      ? "bg-[#d4af37] text-[#3a2f05] hover:bg-[#e0bc50]"
                      : "bg-[#1e1b4b] text-white hover:bg-[#16133a]"
                  }`}
                >
                  {action}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <HowItWorks />
      <FeatureGrid />
      <ExampleMeet />
      <Benefits />

      {SHOW_LIVE_URL_SYNC ? (
        <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-5xl rounded-[2rem] border border-[#dde2f4] bg-white p-8 shadow-[0_18px_45px_rgba(30,27,75,0.05)]">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#4f46e5]">
                Live URL Sync
              </p>
              <h2 className="mt-4 font-[var(--font-gym-display)] text-3xl font-bold tracking-[-0.035em] text-[#1e1b4b]">
                Already have a meet page somewhere else?
              </h2>
              <p className="mt-4 text-base leading-7 text-[#586581]">
                Paste a URL and let Envitefy attempt to sync the meet details into a cleaner gymnastics event page.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-[1fr_auto]">
              <label className="rounded-[1.3rem] border border-[#dbe0f1] bg-[#f8f9ff] px-4 py-3">
                <span className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7f88a7]">
                  <Globe className="h-4 w-4" />
                  Meet URL
                </span>
                <input
                  type="url"
                  value={meetUrl}
                  onChange={(e) => setMeetUrl(e.target.value)}
                  placeholder="https://example-meet.com"
                  className="w-full bg-transparent text-sm text-[#1e1b4b] outline-none placeholder:text-[#98a1bd]"
                />
              </label>

              <div className="flex gap-3 md:flex-col">
                <button
                  type="button"
                  onClick={() => {
                    void handleUrlSync();
                  }}
                  disabled={discoveryBusy}
                  className="inline-flex items-center justify-center gap-2 rounded-[1.2rem] bg-[#1e1b4b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#16133a] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {urlBusy ? "Syncing..." : "Sync URL"}
                </button>
                {urlBusy ? (
                  <button
                    type="button"
                    onClick={cancelDiscovery}
                    className="inline-flex items-center justify-center gap-2 rounded-[1.2rem] border border-[#dde2f4] bg-white px-5 py-3 text-sm font-semibold text-[#1e1b4b] hover:bg-[#f8f9ff]"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                ) : null}
              </div>
            </div>

            {urlError ? (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {urlError}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      <CTA
        discoveryBusy={discoveryBusy}
        onUploadClick={() => fileInputRef.current?.click()}
      />

      <style jsx>{`
        @keyframes launcher-indeterminate {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(280%);
          }
        }
        .launcher-indeterminate-bar {
          animation: launcher-indeterminate 1.15s linear infinite;
        }
      `}</style>
    </main>
  );
}
