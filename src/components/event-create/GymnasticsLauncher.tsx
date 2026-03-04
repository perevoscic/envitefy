"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Globe,
  Sparkles,
  Upload,
} from "lucide-react";

type GymnasticsLauncherProps = {
  forwardQueryString?: string;
  defaultDateParam?: string;
};

type DiscoveryInput = { file?: File; url?: string };
type DiscoveryProgressHandler = (progress: number, status: string) => void;

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

  const toErrorMessage = (err: unknown, fallback: string) => {
    if (err instanceof Error && err.message) return err.message;
    if (typeof err === "string" && err.trim()) return err;
    return fallback;
  };

  const startDiscovery = async ({
    file,
    url,
    onProgress,
  }: DiscoveryInput & { onProgress?: DiscoveryProgressHandler }) => {
    const reportProgress = (progress: number, status: string) => {
      if (!onProgress) return;
      onProgress(Math.max(0, Math.min(100, Math.round(progress))), status);
    };
    const formData = new FormData();
    if (file) formData.append("file", file);
    if (url) formData.append("url", url);

    let ingestJson: { eventId?: string; error?: string } = {};

    if (file) {
      reportProgress(4, "Uploading meet file...");
      ingestJson = await new Promise<{ eventId?: string; error?: string }>(
        (resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", "/api/ingest?mode=meet_discovery", true);
          xhr.withCredentials = true;

          xhr.upload.onprogress = (event) => {
            if (!event.lengthComputable) return;
            const ratio = event.loaded / event.total;
            reportProgress(5 + ratio * 65, "Uploading meet file...");
          };

          xhr.onerror = () => {
            reject(new Error("Network error while uploading file"));
          };

          xhr.onload = () => {
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
    } else {
      reportProgress(20, "Submitting meet URL...");
      const ingestRes = await fetch("/api/ingest?mode=meet_discovery", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      ingestJson = await ingestRes.json().catch(() => ({}));
      if (!ingestRes.ok || !ingestJson?.eventId) {
        throw new Error(ingestJson?.error || "Failed to ingest source");
      }
    }

    const eventId = String(ingestJson.eventId);
    reportProgress(72, "Processing meet file...");
    let parseProgress = 72;
    const parseProgressTimer = setInterval(() => {
      parseProgress = Math.min(parseProgress + 3, 96);
      reportProgress(parseProgress, "Processing meet file...");
    }, 700);

    try {
      const parseRes = await fetch(`/api/parse/${eventId}`, {
        method: "POST",
        credentials: "include",
      });
      const parseJson = await parseRes.json().catch(() => ({}));
      if (!parseRes.ok) {
        throw new Error(parseJson?.error || "Failed to parse source");
      }
    } finally {
      clearInterval(parseProgressTimer);
    }

    reportProgress(100, "Opening meet builder...");
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
    try {
      await startDiscovery({
        file: pickedFile,
        onProgress: (progress, status) => {
          setUploadProgress(progress);
          setUploadStatus(status);
        },
      });
    } catch (err: unknown) {
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
                  {uploadBusy
                    ? "Uploading and parsing..."
                    : "Click to Upload File"}
                </div>
                <p className="mt-1 text-center text-xs font-medium text-[#7d7a92]">
                  PDF, JPG, PNG
                </p>
              </button>
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
              {uploadBusy ? (
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-[#6a6782]">
                    <span>{uploadStatus || "Processing meet file..."}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#ebe7f8]">
                    <div
                      className="h-full rounded-full bg-[#6d35f5] transition-[width] duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
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
                className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${
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
