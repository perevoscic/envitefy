"use client";
import { useRef, useState } from "react";

type DemoEvent = {
  title: string;
  start: string | null;
  end: string | null;
  location: string;
  description: string;
  timezone: string;
};

export default function Demo() {
  const [event, setEvent] = useState<DemoEvent | null>(null);
  const [ocrText, setOcrText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onPick = () => fileInputRef.current?.click();

  const ingest = async (file: File) => {
    setLoading(true);
    setError(null);
    setEvent(null);
    const form = new FormData();
    form.append("file", file);
    let res: Response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);
      res = await fetch("/api/ocr", {
        method: "POST",
        body: form,
        signal: controller.signal,
        mode: "cors",
        credentials: "include",
      });
      clearTimeout(timeoutId);
    } catch (e) {
      setError("Upload failed. Please try a different image.");
      setLoading(false);
      return;
    }
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError((j as any).error || "Failed to scan file");
      setLoading(false);
      return;
    }
    const data = await res.json();
    const e: DemoEvent = {
      title: data?.fieldsGuess?.title || "Event",
      start: data?.fieldsGuess?.start || null,
      end: data?.fieldsGuess?.end || null,
      location: data?.fieldsGuess?.location || "",
      description: data?.fieldsGuess?.description || "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    };
    setEvent(e);
    setOcrText(data?.ocrText || "");
    setLoading(false);
  };

  return (
    <section id="demo" aria-labelledby="live-demo" className="w-full">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h2
          id="live-demo"
          className="text-2xl sm:text-3xl font-bold text-center"
        >
          Live demo
        </h2>
        <p className="mt-2 text-center text-foreground/70 max-w-2xl mx-auto">
          Upload an image from your device. We only use uploads to extract
          details.
        </p>

        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-xl border border-border px-4 py-2 bg-surface/70 hover:bg-surface"
              onClick={onPick}
            >
              Upload from device
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) ingest(f);
            }}
          />
        </div>

        {loading && (
          <div role="status" aria-live="polite" className="mt-8">
            <div className="scan-inline" style={{ height: 10 }}>
              <div className="scan-beam" />
            </div>
          </div>
        )}
        {error && (
          <div className="mt-3 p-3 rounded border border-error/40 bg-error/10 text-error text-center">
            {error}
          </div>
        )}

        {event && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-surface/70 border border-border p-6">
              <h3 className="text-lg font-semibold">Detected details</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex gap-2">
                  <dt className="text-foreground/60 w-24">Title</dt>
                  <dd className="flex-1">{event.title}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-foreground/60 w-24">Start</dt>
                  <dd className="flex-1">{event.start || "—"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-foreground/60 w-24">End</dt>
                  <dd className="flex-1">{event.end || "—"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-foreground/60 w-24">Location</dt>
                  <dd className="flex-1">{event.location || "—"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-foreground/60 w-24">Timezone</dt>
                  <dd className="flex-1">{event.timezone}</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-2xl bg-surface/70 border border-border p-6">
              <h3 className="text-lg font-semibold">Extracted text</h3>
              <pre className="mt-3 text-sm whitespace-pre-wrap text-foreground/70 max-h-80 overflow-auto">
                {ocrText || "(No text)"}
              </pre>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
