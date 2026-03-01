"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Link as LinkIcon, Upload, LayoutTemplate } from "lucide-react";

export default function GymnasticsEntryPage() {
  const router = useRouter();
  const [discoverUrl, setDiscoverUrl] = useState("");
  const [discoverFile, setDiscoverFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const selectedSourceLabel = useMemo(() => {
    if (discoverFile) return `File: ${discoverFile.name}`;
    if (discoverUrl.trim()) return "URL ready";
    return "No source selected";
  }, [discoverFile, discoverUrl]);

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

      router.push(`/event/gymnastics/customize?edit=${eventId}`);
    } catch (err: any) {
      setError(String(err?.message || err || "Failed to create event"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-serif font-semibold text-slate-900 sm:text-3xl">
            Create Gymnastics Event
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Choose how to start: upload a file, paste a meet URL, or build from
            the existing template.
          </p>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 lg:col-span-2">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Upload size={16} />
                Upload
              </div>
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg,image/jpg"
                onChange={(e) => {
                  const picked = e.target.files?.[0] || null;
                  setDiscoverFile(picked);
                  if (picked) setDiscoverUrl("");
                }}
                className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <div className="my-4 flex items-center gap-2 text-xs text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                OR
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <LinkIcon size={16} />
                Paste URL
              </div>
              <input
                type="url"
                value={discoverUrl}
                onChange={(e) => {
                  setDiscoverUrl(e.target.value);
                  if (e.target.value.trim()) setDiscoverFile(null);
                }}
                placeholder="https://example.com/meet-page"
                className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <p className="mt-3 text-xs text-slate-500">{selectedSourceLabel}</p>

              {error ? (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleParse}
                disabled={busy}
                className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? "Creating Event..." : "Create from Upload / URL"}
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <LayoutTemplate size={16} />
                Create from Template
              </div>
              <p className="text-sm text-slate-600">
                Opens the current “Build Your Meet Page” flow with the right-side
                builder menu and live preview.
              </p>
              <button
                type="button"
                onClick={() => router.push("/event/gymnastics/customize")}
                className="mt-6 w-full rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
              >
                Open Template Builder
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
