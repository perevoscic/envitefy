"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

type EventFields = {
  title: string;
  start: string | null;
  end: string | null;
  location: string;
  description: string;
  timezone: string;
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [event, setEvent] = useState<EventFields | null>(null);
  const [loading, setLoading] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { data: session } = useSession();
  const connected = useMemo(
    () => ({
      google: Boolean((session as any)?.providers?.google),
      microsoft: Boolean((session as any)?.providers?.microsoft),
    }),
    [session]
  );

  const onFile = (f: File | null) => {
    setFile(f);
    if (f) ingest(f);
  };

  const ingest = async (f?: File | null) => {
    const currentFile = f ?? file;
    if (!currentFile) return;
    setLoading(true);
    const form = new FormData();
    form.append("file", currentFile);
    const res = await fetch("/api/ocr", { method: "POST", body: form });
    const data = await res.json();
    setEvent(data.fieldsGuess);
    setLoading(false);
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  const openUpload = () => {
    fileInputRef.current?.click();
  };

  const dlIcs = () => {
    if (!event?.start || !event?.end) return;
    const q = new URLSearchParams({
      title: event.title || "Event",
      start: event.start,
      end: event.end,
      location: event.location || "",
      description: event.description || "",
      timezone: event.timezone || "America/Chicago",
    }).toString();
    window.location.href = `/api/ics?${q}`;
  };

  const addGoogle = async () => {
    if (!event?.start || !event?.end) return;
    const res = await fetch("/api/events/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
    const j = await res.json();
    if (j.htmlLink) window.open(j.htmlLink, "_blank");
  };

  const addOutlook = async () => {
    if (!event?.start || !event?.end) return;
    const res = await fetch("/api/events/outlook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
    const j = await res.json();
    if (j.webLink) window.open(j.webLink, "_blank");
  };

  useEffect(() => {
    // No-op; just ensure session is read early
  }, [session]);

  return (
    <main className="mx-auto max-w-4xl p-4 space-y-8">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 text-white p-8 md:p-12">
        <div className="relative z-10 text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Snap a flyer. Save the date.
          </h1>
          <p className="text-white/90 max-w-2xl mx-auto">
            Turn any flyer or appointment card into a calendar event in seconds.
            Works with Google Calendar or download .ics for Apple and Outlook.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              className="px-5 py-3 bg-white text-indigo-700 font-semibold rounded shadow hover:opacity-90"
              onClick={openCamera}
            >
              Snap a flyer
            </button>
            <button
              className="px-5 py-3 bg-white/10 backdrop-blur border border-white/20 text-white font-semibold rounded hover:bg-white/15"
              onClick={openUpload}
            >
              Upload from device
            </button>
          </div>
        </div>
      </section>

      <section id="scan" className="space-y-4">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded"
              onClick={openCamera}
            >
              Snap it
            </button>
            <button
              className="px-4 py-2 bg-gray-200 text-gray-900 rounded"
              onClick={openUpload}
            >
              Upload from device
            </button>
          </div>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => onFile(e.target.files?.[0] || null)}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => onFile(e.target.files?.[0] || null)}
            className="hidden"
          />
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            onClick={() => ingest()}
            disabled={!file || loading}
          >
            {loading ? "Scanning..." : "Scan"}
          </button>
        </div>

        {event && (
          <div className="space-y-2">
            <input
              className="w-full border p-2 rounded"
              value={event.title}
              onChange={(e) => setEvent({ ...event, title: e.target.value })}
            />
            <input
              className="w-full border p-2 rounded"
              value={event.start || ""}
              onChange={(e) => setEvent({ ...event, start: e.target.value })}
            />
            <input
              className="w-full border p-2 rounded"
              value={event.end || ""}
              onChange={(e) => setEvent({ ...event, end: e.target.value })}
            />
            <input
              className="w-full border p-2 rounded"
              value={event.location}
              onChange={(e) => setEvent({ ...event, location: e.target.value })}
            />
            <textarea
              className="w-full border p-2 rounded"
              rows={4}
              value={event.description}
              onChange={(e) =>
                setEvent({ ...event, description: e.target.value })
              }
            />
            <div className="flex flex-wrap gap-2 items-center">
              {!connected.google && (
                <button
                  className="px-4 py-2 bg-gray-700 text-white rounded"
                  onClick={() => signIn("google")}
                >
                  Connect Google
                </button>
              )}
              {!connected.microsoft && (
                <button
                  className="px-4 py-2 bg-blue-700 text-white rounded"
                  onClick={() => signIn("azure-ad")}
                >
                  Connect Outlook
                </button>
              )}
              {connected.google && (
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded"
                  onClick={addGoogle}
                >
                  Add to Google
                </button>
              )}
              {connected.microsoft && (
                <button
                  className="px-4 py-2 bg-sky-600 text-white rounded"
                  onClick={addOutlook}
                >
                  Add to Outlook
                </button>
              )}
              <button
                className="px-4 py-2 bg-indigo-600 text-white rounded"
                onClick={dlIcs}
              >
                Download .ics
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
