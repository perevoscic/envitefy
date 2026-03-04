"use client";

import type { ChangeEvent, KeyboardEvent, MouseEvent } from "react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Globe, PenTool, Check, ArrowRight, X, Loader2 } from "lucide-react";

type PathId = "upload" | "url" | "scratch";

export default function GymnasticsEntryPage() {
  const router = useRouter();
  const [selectedPath, setSelectedPath] = useState<PathId>("upload");
  const [discoverUrl, setDiscoverUrl] = useState("");
  const [discoverFile, setDiscoverFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleParse = async (source?: { file?: File | null; url?: string }) => {
    if (busy) return;

    setError("");
    const selectedFile = source?.file ?? discoverFile;
    const trimmedUrl = (source?.url ?? discoverUrl ?? "").trim();

    if (!selectedFile && !trimmedUrl) {
      setError("Upload a file or paste a URL.");
      return;
    }
    if (selectedFile && trimmedUrl) {
      setError("Use one source at a time (file or URL).");
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setStatusMessage("Analyzing source...");

    try {
      const formData = new FormData();
      if (selectedFile) formData.append("file", selectedFile);
      else formData.append("url", trimmedUrl);

      const ingestRes = await fetch("/api/ingest?mode=meet_discovery", {
        method: "POST",
        body: formData,
        credentials: "include",
        signal: controller.signal,
      });
      const ingestJson = await ingestRes.json().catch(() => ({}));
      if (!ingestRes.ok || !ingestJson?.eventId) {
        throw new Error(ingestJson?.error || "Failed to ingest source");
      }

      const eventId = String(ingestJson.eventId);
      setStatusMessage("Building event...");

      const parseRes = await fetch(`/api/parse/${eventId}`, {
        method: "POST",
        credentials: "include",
        signal: controller.signal,
      });
      const parseJson = await parseRes.json().catch(() => ({}));
      if (!parseRes.ok) {
        throw new Error(parseJson?.error || "Failed to parse source");
      }

      router.push(`/event/${eventId}`);
    } catch (err: unknown) {
      if (
        (typeof err === "object" &&
          err !== null &&
          "name" in err &&
          (err as { name?: string }).name === "AbortError") ||
        controller.signal.aborted
      ) {
        setError("Upload canceled by user.");
        return;
      }

      const message =
        typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof (err as { message?: unknown }).message === "string"
          ? (err as { message: string }).message
          : String(err || "Failed to create event");
      setError(message);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setBusy(false);
      setStatusMessage("");
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setDiscoverFile(file);
      setFileName(file.name);
      setDiscoverUrl("");
      setSelectedPath("upload");
      void handleParse({ file, url: "" });
    }
    e.currentTarget.value = "";
  };

  const triggerFileSelect = () => {
    if (busy) return;
    fileInputRef.current?.click();
  };

  const clearFile = (e: MouseEvent<SVGSVGElement>) => {
    e.stopPropagation();
    if (busy) return;
    setDiscoverFile(null);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const cancelParse = () => {
    abortRef.current?.abort();
  };

  const handleUrlKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    void handleParse({ url: discoverUrl, file: null });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F8FAFC] font-sans">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-12 pt-16 md:pb-24 md:pt-24">
        <div className="mb-16 max-w-4xl">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-6xl">
            How would you like to <br />
            <span className="text-violet-600">build your gymnast event?</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
          <div
            onClick={() => setSelectedPath("upload")}
            className={`relative flex cursor-pointer flex-col rounded-[2.5rem] border-2 p-8 transition-all duration-300 ${
              selectedPath === "upload"
                ? "z-10 scale-[1.01] border-violet-600 bg-white shadow-2xl"
                : "border-slate-100 bg-white/50 hover:border-slate-300"
            }`}
          >
            <div className="absolute -top-3 left-8 rounded-full bg-violet-600 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
              Recommended
            </div>

            <div className="mb-6 flex items-center justify-between">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${
                  selectedPath === "upload"
                    ? "bg-violet-600 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <Upload className="h-6 w-6" />
              </div>
              {selectedPath === "upload" && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <p
                className={`mb-1 text-[10px] font-black uppercase tracking-widest ${
                  selectedPath === "upload" ? "text-violet-600" : "text-slate-400"
                }`}
              >
                Fastest Setup
              </p>
              <h3 className="mb-3 text-2xl font-bold text-slate-900">
                Upload your meet info.
              </h3>
              <p className="text-sm leading-relaxed text-slate-500">
                Upload your meet packet (PDF/JPG) and let us extract the schedule
                and rosters.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <button
                onClick={triggerFileSelect}
                disabled={busy}
                className={`group/upload relative flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 transition-all ${
                  fileName
                    ? "border-green-200 bg-green-50"
                    : "border-violet-200 bg-violet-50/50 hover:border-violet-400 hover:bg-violet-50"
                } ${busy ? "cursor-not-allowed opacity-70" : ""}`}
              >
                <div className="mb-1 flex items-center gap-3">
                  {fileName ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <Upload className="h-5 w-5 text-violet-600" />
                  )}
                  <span
                    className={`max-w-[180px] truncate text-sm font-bold ${
                      fileName ? "text-green-900" : "text-violet-900"
                    }`}
                  >
                    {fileName ? fileName : "Click to Upload File"}
                  </span>
                  {fileName && !busy && (
                    <X
                      onClick={clearFile}
                      className="ml-1 h-4 w-4 text-slate-400 transition-colors hover:text-red-500"
                    />
                  )}
                </div>
                {!fileName && (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-violet-500">
                    PDF, JPG, PNG
                  </p>
                )}
                {fileName && !busy && (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-green-600">
                    Ready to process
                  </p>
                )}
                {busy && (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                    {statusMessage || "Analyzing source..."}
                  </p>
                )}
              </button>

              {busy && (
                <button
                  type="button"
                  onClick={cancelParse}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 p-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-slate-700"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Cancel</span>
                </button>
              )}
            </div>
          </div>

          <div
            onClick={() => setSelectedPath("url")}
            className={`relative flex cursor-pointer flex-col rounded-[2.5rem] border-2 p-8 transition-all duration-300 ${
              selectedPath === "url"
                ? "z-10 scale-[1.01] border-violet-600 bg-white shadow-2xl"
                : "border-slate-100 bg-white/50 hover:border-slate-300"
            }`}
          >
            <div className="mb-6 flex items-center justify-between">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${
                  selectedPath === "url"
                    ? "bg-violet-600 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <Globe className="h-6 w-6" />
              </div>
              {selectedPath === "url" && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <p
                className={`mb-1 text-[10px] font-black uppercase tracking-widest ${
                  selectedPath === "url" ? "text-violet-600" : "text-slate-400"
                }`}
              >
                External Integration
              </p>
              <h3 className="mb-3 text-2xl font-bold text-slate-900">Live URL Sync</h3>
              <p className="text-sm leading-relaxed text-slate-500">
                Paste a link to an existing meet page to sync data.
              </p>
            </div>

            <div className="mt-6">
              <div className="group relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Globe className="h-4 w-4 text-slate-400 transition-colors group-focus-within:text-violet-500" />
                </div>
                <input
                  type="text"
                  value={discoverUrl}
                  disabled={busy}
                  placeholder="https://gym-results.com/meet/123"
                  onFocus={() => setSelectedPath("url")}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDiscoverUrl(value);
                    if (value.trim()) {
                      setDiscoverFile(null);
                      setFileName(null);
                      setSelectedPath("url");
                    }
                  }}
                  onKeyDown={handleUrlKeyDown}
                  className="block w-full rounded-2xl border-2 border-slate-100 bg-slate-50 py-4 pl-11 pr-4 text-sm outline-none transition-all focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
                />
              </div>
            </div>
          </div>

          <div
            onClick={() => setSelectedPath("scratch")}
            className={`relative flex cursor-pointer flex-col rounded-[2.5rem] border-2 p-8 transition-all duration-300 ${
              selectedPath === "scratch"
                ? "z-10 scale-[1.01] border-violet-600 bg-white shadow-2xl"
                : "border-slate-100 bg-white/50 hover:border-slate-300"
            }`}
          >
            <div className="mb-6 flex items-center justify-between">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${
                  selectedPath === "scratch"
                    ? "bg-violet-600 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <PenTool className="h-6 w-6" />
              </div>
              {selectedPath === "scratch" && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <p
                className={`mb-1 text-[10px] font-black uppercase tracking-widest ${
                  selectedPath === "scratch" ? "text-violet-600" : "text-slate-400"
                }`}
              >
                Custom Design
              </p>
              <h3 className="mb-3 text-2xl font-bold text-slate-900">Visual Builder</h3>
              <p className="text-sm leading-relaxed text-slate-500">
                The ultimate control. Design your meet page block-by-block using
                our template gallery.
              </p>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push("/event/gymnastics/customize");
                }}
                className={`group flex w-full items-center justify-center gap-2 rounded-2xl p-4 text-sm font-bold text-white shadow-lg transition-all ${
                  selectedPath === "scratch"
                    ? "bg-violet-600 shadow-violet-200 hover:bg-violet-500"
                    : "bg-slate-800 shadow-slate-200 hover:bg-slate-700"
                }`}
              >
                <span>Open Template Builder</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}
