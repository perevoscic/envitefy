"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import * as chrono from "chrono-node";

type EventFields = {
  title: string;
  start: string | null;
  end: string | null;
  location: string;
  description: string;
  timezone: string;
  reminders?: { minutes: number }[] | null;
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [event, setEvent] = useState<EventFields | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string>("");
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

  const resetForm = () => {
    setEvent(null);
    setOcrText("");
    setError(null);
    setFile(null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onFile = (f: File | null) => {
    setFile(f);
    if (f) ingest(f);
  };

  const ingest = async (f?: File | null) => {
    const currentFile = f ?? file;
    if (!currentFile) return;
    setLoading(true);
    setError(null);
    const form = new FormData();
    form.append("file", currentFile);
    const res = await fetch("/api/ocr", { method: "POST", body: form });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError((j as any).error || "Failed to scan file");
      setLoading(false);
      return;
    }
    const data = await res.json();
    const tz =
      data?.fieldsGuess?.timezone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      "UTC";
    const formatIsoForInput = (iso: string | null, timezone: string) => {
      if (!iso) return null;
      try {
        const dt = new Date(iso);
        if (isNaN(dt.getTime())) return iso;
        return new Intl.DateTimeFormat(undefined, {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone: timezone,
        }).format(dt);
      } catch {
        return iso;
      }
    };
    const adjusted = data.fieldsGuess
      ? {
          ...data.fieldsGuess,
          start: formatIsoForInput(data.fieldsGuess.start, tz),
          end: formatIsoForInput(data.fieldsGuess.end, tz),
          reminders: [{ minutes: 1440 }],
        }
      : null;
    setEvent(adjusted);
    setOcrText(data.ocrText || "");
    setLoading(false);
  };

  const openCamera = () => {
    resetForm();
    cameraInputRef.current?.click();
  };

  const openUpload = () => {
    resetForm();
    fileInputRef.current?.click();
  };

  const parseStartToIso = (value: string | null, timezone: string) => {
    if (!value) return null;
    try {
      // Try ISO first
      const isoDate = new Date(value);
      if (!isNaN(isoDate.getTime())) return isoDate.toISOString();
    } catch {}
    const parsed = chrono.parseDate(value, new Date(), { forwardDate: true });
    return parsed ? new Date(parsed.getTime()).toISOString() : null;
  };

  const normalizeAddress = (raw: string) => {
    if (!raw) return "";
    // If the string contains a street number, extract from there forward
    const fromNumber = raw.match(/\b\d{1,6}[^\n]*/);
    const candidate = fromNumber ? fromNumber[0] : raw;
    const streetSuffix =
      /(Ave(nue)?|St(reet)?|Blvd|Road|Rd|Drive|Dr|Ct|Court|Ln|Lane|Way|Pl|Place|Ter(race)?|Pkwy|Parkway|Hwy|Highway)/i;
    if (streetSuffix.test(candidate)) {
      return candidate
        .replace(/^[^\d]*?(?=\d)/, "")
        .replace(/\s{2,}/g, " ")
        .trim();
    }
    return candidate.trim();
  };

  const buildSubmissionEvent = (e: EventFields) => {
    const timezone =
      e.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const startIso = parseStartToIso(e.start, timezone);
    if (!startIso) return null;
    const endIso = e.end
      ? parseStartToIso(e.end, timezone) ||
        new Date(new Date(startIso).getTime() + 90 * 60 * 1000).toISOString()
      : new Date(new Date(startIso).getTime() + 90 * 60 * 1000).toISOString();
    const location = normalizeAddress(e.location || "");
    return {
      ...e,
      start: startIso,
      end: endIso,
      location,
      timezone,
    } as EventFields;
  };

  const dlIcs = () => {
    if (!event?.start) return;
    const ready = buildSubmissionEvent(event);
    if (!ready) return;
    const q = new URLSearchParams({
      title: ready.title || "Event",
      start: ready.start!,
      end: ready.end!,
      location: ready.location || "",
      description: ready.description || "",
      timezone: ready.timezone || "America/Chicago",
      ...(ready.reminders && ready.reminders.length
        ? { reminders: ready.reminders.map((r) => String(r.minutes)).join(",") }
        : {}),
    }).toString();
    window.location.href = `/api/ics?${q}`;
  };

  const connectGoogle = () => {
    signIn("google", { callbackUrl: "/", prompt: "consent" } as any);
  };

  const connectOutlook = () => {
    // Request consent the first time to ensure a refresh token is issued
    signIn("azure-ad", { callbackUrl: "/", prompt: "consent" } as any);
  };

  const addGoogle = async () => {
    if (!event?.start) return;
    const ready = buildSubmissionEvent(event);
    if (!ready) return;
    const res = await fetch("/api/events/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(ready),
    });
    let j: any = {};
    try {
      j = await res.json();
    } catch {}
    if (!res.ok) {
      setError(j.error || "Failed to add to Google Calendar");
      return;
    }
    if (j.htmlLink) window.open(j.htmlLink, "_blank");
  };

  const addOutlook = async () => {
    if (!event?.start) return;
    const ready = buildSubmissionEvent(event);
    if (!ready) return;
    const res = await fetch("/api/events/outlook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(ready),
    });
    let j: any = {};
    try {
      j = await res.json();
    } catch {}
    if (!res.ok) {
      const detail = j?.error || "Failed to add to Outlook Calendar";
      setError(typeof detail === "string" ? detail : JSON.stringify(detail));
      return;
    }
    if (j.webLink) window.open(j.webLink, "_blank");
  };

  useEffect(() => {
    // No-op; just ensure session is read early
  }, [session]);

  return (
    <main className="mx-auto max-w-4xl p-4 space-y-8">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent text-white p-8 md:p-12">
        <div className="relative z-10 text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-shadow-soft">
            Snap a flyer.
            <br />
            Save the date.
          </h1>
          <p className="text-white/90 max-w-2xl mx-auto text-shadow-soft">
            Turn any flyer or appointment card into a calendar event in seconds.
            <br />
            Works with Google, Apple and Outlook Calendars.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center gap-3">
        <button
          className="px-5 py-3 bg-primary text-white font-semibold rounded shadow-md hover:opacity-90 text-shadow-subtle"
          onClick={openCamera}
        >
          Snap it
        </button>
        <button
          className="px-5 py-3 bg-secondary text-white font-semibold rounded hover:opacity-90 shadow-md text-shadow-subtle"
          onClick={openUpload}
        >
          Upload from device
        </button>
      </section>

      <section id="scan" className="space-y-4">
        <div className="space-y-3">
          {error && (
            <div className="p-3 rounded border border-error bg-surface text-error">
              {error}
            </div>
          )}
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

          {loading && (
            <div role="status" aria-live="polite" className="mt-3">
              <div className="scan-inline">
                <div className="scan-beam" />
              </div>
            </div>
          )}

          {/* Actions moved to bottom with the Apple button */}
        </div>

        {event && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label
                htmlFor="event-title"
                className="text-sm text-muted-foreground"
              >
                Title
              </label>
              <input
                id="event-title"
                className="w-full border border-border bg-surface text-foreground p-2 rounded"
                value={event.title}
                onChange={(e) => setEvent({ ...event, title: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="event-start"
                className="text-sm text-muted-foreground"
              >
                Start
              </label>
              <input
                id="event-start"
                className="w-full border border-border bg-surface text-foreground p-2 rounded"
                value={event.start || ""}
                onChange={(e) => setEvent({ ...event, start: e.target.value })}
              />
            </div>
            {Boolean(event.end) && (
              <div className="space-y-1">
                <label
                  htmlFor="event-end"
                  className="text-sm text-muted-foreground"
                >
                  End
                </label>
                <input
                  id="event-end"
                  className="w-full border border-border bg-surface text-foreground p-2 rounded"
                  value={event.end || ""}
                  onChange={(e) =>
                    setEvent({ ...event, end: e.target.value || null })
                  }
                />
              </div>
            )}
            <div className="space-y-1">
              <label
                htmlFor="event-location"
                className="text-sm text-muted-foreground"
              >
                Address
              </label>
              <input
                id="event-location"
                className="w-full border border-border bg-surface text-foreground p-2 rounded"
                value={event.location}
                onChange={(e) =>
                  setEvent({ ...event, location: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="event-description"
                className="text-sm text-muted-foreground"
              >
                Description
              </label>
              <textarea
                id="event-description"
                className="w-full border border-border bg-surface text-foreground p-2 rounded"
                rows={4}
                value={event.description}
                onChange={(e) =>
                  setEvent({ ...event, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Reminders</label>
              <div className="space-y-2">
                {(event.reminders || []).map((r, idx) => {
                  const dayOptions = [1, 2, 3, 7, 14, 30];
                  const currentDays = Math.max(
                    1,
                    Math.round((r.minutes || 0) / 1440) || 1
                  );
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        className="border border-border bg-surface text-foreground p-2 rounded"
                        value={currentDays}
                        onChange={(e) => {
                          const days = Math.max(1, Number(e.target.value) || 1);
                          const next = [...(event.reminders || [])];
                          next[idx] = { minutes: days * 1440 };
                          setEvent({ ...event, reminders: next });
                        }}
                      >
                        {dayOptions.map((d) => (
                          <option key={d} value={d}>
                            {d} day{d === 1 ? "" : "s"} before
                          </option>
                        ))}
                      </select>
                      <button
                        aria-label="Delete reminder"
                        className="px-2 py-2 text-sm bg-surface border border-border rounded hover:opacity-80"
                        onClick={() => {
                          const next = (event.reminders || []).filter(
                            (_, i) => i !== idx
                          );
                          setEvent({ ...event, reminders: next });
                        }}
                      >
                        <svg
                          aria-hidden="true"
                          focusable="false"
                          className="octicon octicon-trash h-4 w-4"
                          viewBox="0 0 16 16"
                          width="16"
                          height="16"
                          fill="currentColor"
                          overflow="visible"
                          style={{ verticalAlign: "text-bottom" }}
                        >
                          <path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z"></path>
                        </svg>
                      </button>
                    </div>
                  );
                })}
                <div>
                  <button
                    className="px-3 py-1 text-sm bg-surface border border-border rounded hover:opacity-80"
                    onClick={() => {
                      const base = Array.isArray(event.reminders)
                        ? (event.reminders as { minutes: number }[])
                        : ([] as { minutes: number }[]);
                      const next = [...base, { minutes: 1440 }];
                      setEvent({ ...event, reminders: next });
                    }}
                  >
                    + Add reminder
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {connected.google ? (
                <button
                  className="px-4 py-2 bg-primary text-white rounded shadow-sm text-shadow-subtle"
                  onClick={addGoogle}
                >
                  Add to Google
                </button>
              ) : (
                <button
                  className="px-4 py-2 bg-primary text-white rounded shadow-sm text-shadow-subtle"
                  onClick={connectGoogle}
                >
                  Connect to Google
                </button>
              )}
              {connected.microsoft ? (
                <button
                  className="px-4 py-2 bg-secondary text-white rounded shadow-sm text-shadow-subtle"
                  onClick={addOutlook}
                >
                  Add to Outlook
                </button>
              ) : (
                <button
                  className="px-4 py-2 bg-secondary text-white rounded shadow-sm text-shadow-subtle"
                  onClick={connectOutlook}
                >
                  Connect to Outlook
                </button>
              )}
              <button
                className="px-4 py-2 bg-accent text-white rounded shadow-sm text-shadow-subtle"
                onClick={dlIcs}
              >
                Connect to Apple Calendar
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
// Theme toggle is now housed in the left sidebar
