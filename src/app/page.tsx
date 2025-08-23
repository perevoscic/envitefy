"use client";
import { useMemo, useRef, useState } from "react";
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

  const openCamera = () => cameraInputRef.current?.click();
  const openUpload = () => fileInputRef.current?.click();

  const parseStartToIso = (value: string | null, timezone: string) => {
    if (!value) return null;
    try {
      const isoDate = new Date(value);
      if (!isNaN(isoDate.getTime())) return isoDate.toISOString();
    } catch {}
    const parsed = chrono.parseDate(value, new Date(), { forwardDate: true });
    return parsed ? new Date(parsed.getTime()).toISOString() : null;
  };

  const normalizeAddress = (raw: string) => {
    if (!raw) return "";
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
    signIn("google", { callbackUrl: "/" } as any);
  };

  const connectOutlook = () => {
    signIn("azure-ad", { callbackUrl: "/" } as any);
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
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return;
    if ((j as any).htmlLink) window.open((j as any).htmlLink, "_blank");
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
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return;
    if ((j as any).webLink) window.open((j as any).webLink, "_blank");
  };

  return (
    <main className="min-h-screen w-full bg-neutral-950 text-white flex items-center justify-center p-6">
      <section className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="order-2 lg:order-1 text-center lg:text-left">
          <div className="bg-gradient-to-tr from-fuchsia-500/20 via-sky-400/20 to-violet-500/20 rounded-3xl p-1">
            <div className="rounded-3xl bg-neutral-900/70 backdrop-blur-sm p-8">
              <h1 className="text-6xl sm:text-7xl font-extrabold leading-[1.05] tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-sky-200 to-fuchsia-300">
                  Snap a flyer.
                </span>
                <br />
                <span className="text-white">Save the date.</span>
              </h1>
              <p className="mt-5 text-lg sm:text-xl text-white/80 max-w-2xl">
                Turn any flyer or appointment card into a calendar event in
                seconds. Works with Google, Apple, and Outlook Calendars.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center lg:justify-start">
                <button
                  onClick={openCamera}
                  aria-label="Open camera to snap a flyer"
                  className="group inline-flex items-center justify-center rounded-2xl px-7 py-3.5 text-lg font-semibold bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-neutral-900 shadow-lg shadow-teal-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 transition"
                >
                  Snap It Now
                </button>

                <button
                  onClick={openUpload}
                  aria-label="Upload a flyer or card image from your device"
                  className="inline-flex items-center justify-center rounded-2xl px-7 py-3.5 text-lg font-semibold border border-violet-400/70 text-violet-200 hover:text-white hover:border-white/80 bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 transition"
                >
                  Upload from Device
                </button>
              </div>
              {/* Calendar buttons appear after a successful scan below with the form */}
            </div>
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

          {loading && (
            <div role="status" aria-live="polite" className="mt-8">
              <div className="scan-inline" style={{ height: 10 }}>
                <div className="scan-beam" />
              </div>
            </div>
          )}
          {error && (
            <div className="mt-3 p-3 rounded border border-red-500/40 bg-red-500/10 text-red-200">
              {error}
            </div>
          )}

          {event && (
            <section className="mt-8 space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-base text-white/90 hover:text-white hover:border-white/40"
                  onClick={connected.google ? addGoogle : connectGoogle}
                >
                  {connected.google ? "Add to Google" : "Connect to Google"}
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-base text-white/90 hover:text-white hover:border-white/40"
                  onClick={dlIcs}
                >
                  Connect to Apple Calendar
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-base text-white/90 hover:text-white hover:border-white/40"
                  onClick={connected.microsoft ? addOutlook : connectOutlook}
                >
                  {connected.microsoft
                    ? "Add to Outlook"
                    : "Connect to Outlook"}
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label
                    htmlFor="event-title"
                    className="text-sm text-white/70"
                  >
                    Title
                  </label>
                  <input
                    id="event-title"
                    className="w-full border border-white/15 bg-neutral-900/60 text-white p-2 rounded"
                    value={event.title}
                    onChange={(e) =>
                      setEvent({ ...event, title: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="event-start"
                    className="text-sm text-white/70"
                  >
                    Start
                  </label>
                  <input
                    id="event-start"
                    className="w-full border border-white/15 bg-neutral-900/60 text-white p-2 rounded"
                    value={event.start || ""}
                    onChange={(e) =>
                      setEvent({ ...event, start: e.target.value })
                    }
                  />
                </div>

                {Boolean(event.end) && (
                  <div className="space-y-1">
                    <label
                      htmlFor="event-end"
                      className="text-sm text-white/70"
                    >
                      End
                    </label>
                    <input
                      id="event-end"
                      className="w-full border border-white/15 bg-neutral-900/60 text-white p-2 rounded"
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
                    className="text-sm text-white/70"
                  >
                    Address
                  </label>
                  <input
                    id="event-location"
                    className="w-full border border-white/15 bg-neutral-900/60 text-white p-2 rounded"
                    value={event.location}
                    onChange={(e) =>
                      setEvent({ ...event, location: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="event-description"
                    className="text-sm text-white/70"
                  >
                    Description
                  </label>
                  <textarea
                    id="event-description"
                    className="w-full border border-white/15 bg-neutral-900/60 text-white p-2 rounded"
                    rows={4}
                    value={event.description}
                    onChange={(e) =>
                      setEvent({ ...event, description: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-white/70">Reminders</label>
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
                            className="border border-white/15 bg-neutral-900/60 text-white p-2 rounded"
                            value={currentDays}
                            onChange={(e) => {
                              const days = Math.max(
                                1,
                                Number(e.target.value) || 1
                              );
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
                            className="px-2 py-2 text-sm bg-neutral-900/60 border border-white/15 rounded hover:opacity-80"
                            onClick={() => {
                              const next = (event.reminders || []).filter(
                                (_, i) => i !== idx
                              );
                              setEvent({ ...event, reminders: next });
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                    <div>
                      <button
                        className="px-3 py-1 text-sm bg-neutral-900/60 border border-white/15 rounded hover:opacity-80"
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
              </div>
            </section>
          )}
        </div>

        <div className="order-1 lg:order-2 hidden md:flex justify-center lg:justify-end">
          <PhoneMockup />
        </div>
      </section>

      {event && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setEvent(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-2xl rounded-2xl bg-neutral-900/95 ring-1 ring-white/10 p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl font-semibold">Review details</h2>
              <button
                aria-label="Close"
                className="rounded-lg px-3 py-1.5 bg-white/10 hover:bg-white/20"
                onClick={() => setEvent(null)}
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              <div className="space-y-1">
                <label htmlFor="event-title" className="text-sm text-white/70">
                  Title
                </label>
                <input
                  id="event-title"
                  className="w-full border border-white/15 bg-neutral-900/60 text-white p-2 rounded"
                  value={event.title}
                  onChange={(e) =>
                    setEvent({ ...event, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="event-start" className="text-sm text-white/70">
                  Start
                </label>
                <input
                  id="event-start"
                  className="w-full border border-white/15 bg-neutral-900/60 text-white p-2 rounded"
                  value={event.start || ""}
                  onChange={(e) =>
                    setEvent({ ...event, start: e.target.value })
                  }
                />
              </div>

              {Boolean(event.end) && (
                <div className="space-y-1">
                  <label htmlFor="event-end" className="text-sm text-white/70">
                    End
                  </label>
                  <input
                    id="event-end"
                    className="w-full border border-white/15 bg-neutral-900/60 text-white p-2 rounded"
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
                  className="text-sm text-white/70"
                >
                  Address
                </label>
                <input
                  id="event-location"
                  className="w-full border border-white/15 bg-neutral-900/60 text-white p-2 rounded"
                  value={event.location}
                  onChange={(e) =>
                    setEvent({ ...event, location: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="event-description"
                  className="text-sm text-white/70"
                >
                  Description
                </label>
                <textarea
                  id="event-description"
                  className="w-full border border-white/15 bg-neutral-900/60 text-white p-2 rounded"
                  rows={4}
                  value={event.description}
                  onChange={(e) =>
                    setEvent({ ...event, description: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-white/70">Reminders</label>
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
                          className="border border-white/15 bg-neutral-900/60 text-white p-2 rounded"
                          value={currentDays}
                          onChange={(e) => {
                            const days = Math.max(
                              1,
                              Number(e.target.value) || 1
                            );
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
                          className="px-2 py-2 text-sm bg-neutral-900/60 border border-white/15 rounded hover:opacity-80"
                          onClick={() => {
                            const next = (event.reminders || []).filter(
                              (_, i) => i !== idx
                            );
                            setEvent({ ...event, reminders: next });
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                  <div>
                    <button
                      className="px-3 py-1 text-sm bg-neutral-900/60 border border-white/15 rounded hover:opacity-80"
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
            </div>

            <div className="mt-6 flex items-center gap-3 flex-wrap justify-end">
              <button
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-base text-white/90 hover:text-white hover:border-white/40"
                onClick={connected.google ? addGoogle : connectGoogle}
              >
                {connected.google ? "Add to Google" : "Connect to Google"}
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-base text-white/90 hover:text-white hover:border-white/40"
                onClick={dlIcs}
              >
                Connect to Apple Calendar
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-base text-white/90 hover:text-white hover:border-white/40"
                onClick={connected.microsoft ? addOutlook : connectOutlook}
              >
                {connected.microsoft ? "Add to Outlook" : "Connect to Outlook"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function PhoneMockup() {
  const flyer = "/window.svg";
  return (
    <div className="relative w-[300px] sm:w-[340px] aspect-[9/19.5] rounded-[38px] bg-neutral-800 shadow-2xl shadow-black/50 ring-1 ring-white/10 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-2 h-6 w-40 rounded-full bg-black/70" />

      <div className="absolute inset-[14px] rounded-[28px] overflow-hidden">
        <img
          src={flyer}
          alt="Flyer being scanned"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="scanwrap absolute inset-0" aria-hidden="true">
          <div className="scanline"></div>
          <div className="scanglow"></div>
        </div>
      </div>

      <div className="absolute right-0 top-24 h-16 w-1.5 rounded-l bg-white/20" />

      <style>{`
        .scanwrap { contain: content; pointer-events: none; }
        .scanline {
          position: absolute; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.95), rgba(255,255,255,0));
          transform: translate3d(0,-6%,0);
          animation: scan 2.2s linear infinite;
          will-change: transform;
        }
        .scanglow {
          position: absolute; left: 0; right: 0; height: 56px; top: -28px;
          background: radial-gradient(ellipse at center, rgba(255,255,255,0.16), rgba(255,255,255,0) 60%);
          transform: translate3d(0,-6%,0);
          animation: scan 2.2s linear infinite;
          mix-blend-mode: screen; opacity: .9;
          will-change: transform;
        }
        @keyframes scan {
          0% { transform: translate3d(0,-6%,0); }
          100% { transform: translate3d(0,106%,0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .scanline, .scanglow { animation: none; transform: translate3d(0,30%,0); }
        }
      `}</style>
    </div>
  );
}

function BadgeGoogle() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 bg-white/5">
      <span className="text-xs text-white/80">Google Calendar</span>
    </div>
  );
}

function BadgeApple() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 bg-white/5">
      <span className="text-xs text-white/80">Apple Calendar</span>
    </div>
  );
}

function BadgeOutlook() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 bg-white/5">
      <span className="text-xs text-white/80">Outlook Calendar</span>
    </div>
  );
}
