"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Link as LinkIcon,
  Layout,
  ChevronRight,
  Globe,
  MousePointer2,
  CheckCircle2,
  FileText,
} from "lucide-react";

export default function GymnasticsEntryPage() {
  const router = useRouter();
  const [activeSource, setActiveSource] = useState<"upload" | "url" | null>(null);
  const [discoverUrl, setDiscoverUrl] = useState("");
  const [discoverFile, setDiscoverFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleParse = async () => {
    if (busy) return;
    setError("");
    const trimmedUrl = discoverUrl.trim();
    if (!discoverFile && !trimmedUrl) {
      setError("Upload a file or paste a URL.");
      return;
    }
    if (discoverFile && trimmedUrl) {
      setError("Use one source at a time (file or URL).");
      return;
    }

    setBusy(true);
    try {
      const formData = new FormData();
      if (discoverFile) formData.append("file", discoverFile);
      else formData.append("url", trimmedUrl);

      const ingestRes = await fetch("/api/ingest?mode=meet_discovery", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const ingestJson = await ingestRes.json().catch(() => ({}));
      if (!ingestRes.ok || !ingestJson?.eventId) {
        throw new Error(ingestJson?.error || "Failed to ingest source");
      }

      const eventId = String(ingestJson.eventId);
      const parseRes = await fetch(`/api/parse/${eventId}`, {
        method: "POST",
        credentials: "include",
      });
      const parseJson = await parseRes.json().catch(() => ({}));
      if (!parseRes.ok) {
        throw new Error(parseJson?.error || "Failed to parse source");
      }

      router.push(`/event/${eventId}`);
    } catch (err: any) {
      setError(String(err?.message || err || "Failed to create event"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center md:text-left">
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-slate-900">
            Create Gymnastics Event
          </h1>
          <p className="max-w-2xl text-lg text-slate-600">
            Launch your meet in minutes. Choose your starting point to begin
            building your professional event page.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-7">
            <div
              className={`group relative cursor-pointer rounded-2xl border-2 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                activeSource === "upload"
                  ? "border-indigo-600 ring-4 ring-indigo-50"
                  : "border-slate-100 hover:border-indigo-200"
              }`}
              onClick={() => document.getElementById("gym-file-upload")?.click()}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`rounded-xl p-3 transition-colors ${
                    activeSource === "upload"
                      ? "bg-indigo-600 text-white"
                      : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100"
                  }`}
                >
                  <Upload size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 text-xl font-semibold">Upload Result/Schedule</h3>
                  <p className="mb-4 text-sm text-slate-500">
                    Supports PDF, JPG/JPEG, and PNG source files.
                  </p>

                  <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 transition-colors group-hover:border-indigo-300 group-hover:bg-white">
                    <FileText size={16} className="text-slate-400" />
                    <span className="truncate text-sm italic text-slate-500">
                      {discoverFile
                        ? discoverFile.name
                        : "Click to browse your source file..."}
                    </span>
                    {discoverFile && (
                      <CheckCircle2 size={16} className="ml-auto text-green-500" />
                    )}
                  </div>
                </div>
              </div>

              <input
                id="gym-file-upload"
                type="file"
                accept=".pdf,image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={(e) => {
                  const picked = e.target.files?.[0] || null;
                  setDiscoverFile(picked);
                  if (picked) {
                    setDiscoverUrl("");
                    setActiveSource("upload");
                  }
                }}
              />
            </div>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm uppercase">
                <span className="bg-slate-50 px-4 font-bold tracking-widest text-slate-400">
                  OR
                </span>
              </div>
            </div>

            <div
              className={`group rounded-2xl border-2 bg-white p-6 transition-all duration-300 ${
                activeSource === "url"
                  ? "border-indigo-600 ring-4 ring-indigo-50"
                  : "border-slate-100 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl"
              }`}
            >
              <div className="mb-4 flex items-start gap-4">
                <div
                  className={`rounded-xl p-3 transition-colors ${
                    activeSource === "url"
                      ? "bg-indigo-600 text-white"
                      : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100"
                  }`}
                >
                  <Globe size={24} />
                </div>
                <div>
                  <h3 className="mb-1 text-xl font-semibold">Import via URL</h3>
                  <p className="text-sm text-slate-500">
                    Paste a link to an existing meet page or results portal.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <LinkIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="url"
                  value={discoverUrl}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDiscoverUrl(value);
                    if (value.trim()) {
                      setDiscoverFile(null);
                      setActiveSource("url");
                    }
                  }}
                  onFocus={() => setActiveSource("url")}
                  placeholder="https://example.com/meet-results"
                  className="block w-full rounded-xl border border-slate-200 bg-white py-4 pl-10 pr-3 text-sm leading-5 placeholder-slate-400 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleParse}
              disabled={busy || (!discoverFile && !discoverUrl.trim())}
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-lg font-bold shadow-lg transition-all ${
                discoverFile || discoverUrl.trim()
                  ? "bg-slate-900 text-white active:scale-[0.98] hover:bg-slate-800"
                  : "cursor-not-allowed bg-slate-200 text-slate-400"
              }`}
            >
              {busy ? "Initializing..." : "Initialize Event Creation"}
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="lg:col-span-5">
            <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-indigo-100 bg-indigo-50 p-8">
              <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-indigo-100 opacity-60 blur-3xl transition-colors group-hover:bg-indigo-200"></div>

              <div className="relative z-10 flex h-full flex-col">
                <div className="mb-6 w-fit rounded-2xl bg-white p-4 shadow-sm">
                  <Layout className="text-indigo-600" size={32} />
                </div>

                <h3 className="mb-4 text-2xl font-bold text-slate-900">
                  Start from Scratch
                </h3>
                <p className="mb-8 leading-relaxed text-slate-600">
                  Prefer more control? Use our visual builder to design your
                  meet page block-by-block with a live preview.
                </p>

                <ul className="mb-10 space-y-4">
                  {[
                    "Visual Page Editor",
                    "Live Theme Customization",
                    "Real-time Preview",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-slate-700">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600">
                        <CheckCircle2 size={12} className="text-white" />
                      </div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => router.push("/event/gymnastics/customize")}
                  className="group/btn mt-auto flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-6 py-4 text-lg font-bold text-indigo-600 shadow-md transition-all hover:bg-indigo-600 hover:text-white"
                >
                  Open Template Builder
                  <MousePointer2
                    size={18}
                    className="transition-transform group-hover/btn:-translate-y-1 group-hover/btn:translate-x-1"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
