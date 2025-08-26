"use client";
import { useEffect, useRef, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import * as chrono from "chrono-node";
import { useTheme } from "./providers";
import Image from "next/image";
import Link from "next/link";
import Logo from "@/assets/logo.png";

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
  const { theme, setTheme } = useTheme();
  const [file, setFile] = useState<File | null>(null);
  const [event, setEvent] = useState<EventFields | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string>("");
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { data: session } = useSession();
  const [connected, setConnected] = useState({
    google: false,
    microsoft: false,
  });
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/calendars", { cache: "no-store" });
        const j = await res.json().catch(() => ({}));
        if (!cancelled)
          setConnected({
            google: Boolean((j as any).google),
            microsoft: Boolean((j as any).microsoft),
          });
      } catch {
        if (!cancelled)
          setConnected({
            google: Boolean((session as any)?.providers?.google),
            microsoft: Boolean((session as any)?.providers?.microsoft),
          });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);
  const [appleLinked, setAppleLinked] = useState(false);
  const [showPhoneMockup, setShowPhoneMockup] = useState(true);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isWindows, setIsWindows] = useState(false);
  useEffect(() => {
    try {
      const v = window.localStorage.getItem("appleLinked");
      if (v === "1") setAppleLinked(true);
    } catch {}
  }, []);
  useEffect(() => {
    // Platform detection
    try {
      const ua = navigator.userAgent || "";
      setIsIOS(/iPhone|iPad|iPod/i.test(ua));
      setIsAndroid(/Android/i.test(ua));
      setIsWindows(/Windows NT|Win64|Win32/i.test(ua));
    } catch {}

    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    )
      return;
    const mq = window.matchMedia(
      "(orientation: portrait) and (min-width: 768px)"
    );
    const update = () => setShowPhoneMockup(!mq.matches);
    update();
    try {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    } catch {
      // Safari < 14 fallback
      mq.addListener(update as any);
      return () => mq.removeListener(update as any);
    }
  }, []);

  // Lock body scroll while the review modal is open
  useEffect(() => {
    try {
      const original = document.body.style.overflow;
      if (event) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = original || "";
      }
      return () => {
        document.body.style.overflow = original || "";
      };
    } catch {}
  }, [event]);

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
    // Always clear inputs so selecting the same file again triggers onChange
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
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
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    cameraInputRef.current?.click();
  };
  const openUpload = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    fileInputRef.current?.click();
  };

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

  const toOutlookParam = (iso: string): string => {
    try {
      const d = new Date(iso);
      const pad = (n: number) => String(n).padStart(2, "0");
      return (
        `${d.getFullYear()}-` +
        `${pad(d.getMonth() + 1)}-` +
        `${pad(d.getDate())}T` +
        `${pad(d.getHours())}:` +
        `${pad(d.getMinutes())}:` +
        `${pad(d.getSeconds())}`
      );
    } catch {
      return iso.replace(/\.\d{3}Z$/, "");
    }
  };

  const buildOutlookComposeUrl = (e: EventFields) => {
    const q = new URLSearchParams({
      rru: "addevent",
      allday: "false",
      subject: e.title || "Event",
      startdt: toOutlookParam(e.start!),
      enddt: toOutlookParam(e.end!),
      location: e.location || "",
      body: e.description || "",
      path: "/calendar/view/Month",
    }).toString();
    return `https://outlook.office.com/calendar/0/deeplink/compose?${q}`;
  };

  const dlIcs = async () => {
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
    const path = `/api/ics?${q}`;
    try {
      window.localStorage.setItem("appleLinked", "1");
      setAppleLinked(true);
    } catch {}
    const ua = navigator.userAgent || "";
    const isApple = /iPhone|iPad|iPod|Mac/i.test(ua);
    const isMac = /Macintosh|Mac OS X/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isSafari =
      /Safari\//.test(ua) && !/Chrome\//.test(ua) && !/Chromium\//.test(ua);

    // Apple handling:
    // - iOS: use plain https to import a single .ics (avoids subscription prompt)
    // - macOS Safari: use webcal:// which opens Calendar and is fine on desktop
    if (isIOS) {
      window.location.href = path;
      return;
    }
    if (isMac && isSafari) {
      const absolute = `${window.location.origin}${path}`;
      const webcalUrl = absolute.replace(/^https?:\/\//i, "webcal://");
      window.location.href = webcalUrl;
      return;
    }

    // Non-Apple devices: just navigate to the ICS URL
    window.location.href = path;
  };

  const connectGoogle = () => {
    // Use calendar-specific OAuth to ensure we have calendar.events scope + refresh token
    window.location.href = "/api/google/auth";
  };

  const connectOutlook = () => {
    signIn("azure-ad", { callbackUrl: "/" } as any);
  };

  const closeAfter = (fn: () => void | Promise<void>) => {
    return async () => {
      try {
        await fn();
      } finally {
        resetForm();
      }
    };
  };

  const addGoogle = async () => {
    if (!event?.start) return;
    const ready = buildSubmissionEvent(event);
    if (!ready) return;
    const toGoogleDateTime = (iso: string) => {
      try {
        const s = new Date(iso).toISOString();
        // YYYYMMDDTHHmmssZ
        return s.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
      } catch {
        return iso;
      }
    };

    try {
      const res = await fetch("/api/events/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(ready),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = (j as any).error || "Failed to add to Google";
        setError(message);
        if (
          res.status === 400 ||
          res.status === 401 ||
          /Unauthorized|not connected/i.test(String(message))
        ) {
          // Carry the pending event through OAuth using the state param
          let state = "";
          try {
            state = btoa(encodeURIComponent(JSON.stringify(ready)));
          } catch {}
          const url = `/api/google/auth?consent=1${
            state ? `&state=${encodeURIComponent(state)}` : ""
          }`;
          window.location.href = url;
          return;
        }
        // Do not open draft template; surface error instead
        return;
      }
      if ((j as any).htmlLink) {
        const htmlLink = (j as any).htmlLink as string;
        if (isIOS) {
          const scheme = "comgooglecalendar://";
          const store =
            "https://apps.apple.com/app/google-calendar/id909319292";
          const timer = setTimeout(() => {
            window.location.assign(htmlLink);
          }, 700);
          window.location.href = scheme;
          setTimeout(() => {
            try {
              if (document.visibilityState === "visible") {
                window.location.href = store;
              }
            } catch {}
            clearTimeout(timer);
          }, 1200);
          return;
        }
        if (isAndroid) {
          const play =
            "https://play.google.com/store/apps/details?id=com.google.android.calendar";
          const intent =
            "intent://#Intent;scheme=content;package=com.google.android.calendar;end";
          const timer = setTimeout(() => {
            window.location.assign(htmlLink);
          }, 700);
          const iframe = document.createElement("iframe");
          iframe.style.display = "none";
          iframe.src = intent;
          document.body.appendChild(iframe);
          setTimeout(() => {
            try {
              if (document.visibilityState === "visible") {
                window.location.href = play;
              }
            } catch {}
            document.body.removeChild(iframe);
            clearTimeout(timer);
          }, 1200);
          return;
        }
        // Desktop/web: open in a new tab instead of replacing current page
        window.open(htmlLink, "_blank");
      } else {
        setError("Event created, but no link returned.");
      }
    } catch {
      setError("Failed to add to Google");
    }
  };

  const addOutlook = async () => {
    if (!event?.start) return;
    const ready = buildSubmissionEvent(event);
    if (!ready) return;
    const composeUrl = buildOutlookComposeUrl(ready);
    try {
      const res = await fetch("/api/events/outlook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(ready),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = (j as any).error || "Failed to add to Outlook";
        setError(message);
        // Fallback to Outlook Web compose when API fails
        window.location.assign(composeUrl);
        return;
      }
      if ((j as any).webLink) {
        const webLink = (j as any).webLink as string;
        // Try to open Outlook app first; if not installed, fall back to web link
        if (isIOS) {
          const scheme = "ms-outlook://";
          const t = setTimeout(() => {
            window.location.assign(webLink);
          }, 700);
          window.location.href = scheme;
          setTimeout(() => {
            try {
              if (document.visibilityState === "visible") {
                window.location.assign(webLink);
              }
            } catch {}
            clearTimeout(t);
          }, 1200);
          return;
        }
        if (isAndroid) {
          const intent =
            "intent://#Intent;scheme=mailto;package=com.microsoft.office.outlook;end";
          const t = setTimeout(() => {
            window.location.assign(webLink);
          }, 700);
          const iframe = document.createElement("iframe");
          iframe.style.display = "none";
          iframe.src = intent;
          document.body.appendChild(iframe);
          setTimeout(() => {
            try {
              if (document.visibilityState === "visible") {
                window.location.assign(webLink);
              }
            } catch {}
            document.body.removeChild(iframe);
            clearTimeout(t);
          }, 1200);
          return;
        }
        // Desktop: attempt to open Outlook if present, otherwise open web link
        try {
          const scheme = "ms-outlook://";
          const t = setTimeout(() => {
            window.open(webLink, "_blank");
          }, 700);
          // Attempt app open via navigation
          window.location.href = scheme;
          setTimeout(() => {
            try {
              if (document.visibilityState === "visible") {
                window.open(webLink, "_blank");
              }
            } catch {}
            clearTimeout(t);
          }, 1200);
        } catch {
          window.open(webLink, "_blank");
        }
      } else {
        setError("Event created, but no link returned.");
        window.location.assign(composeUrl);
      }
    } catch {
      setError("Failed to add to Outlook");
      window.location.assign(composeUrl);
    }
  };

  return (
    <main className="min-h-screen w-full bg-background text-foreground flex items-center justify-center p-6">
      <section className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="order-2 lg:order-1 text-center lg:text-center">
          <Link
            href="/"
            className="flex items-center gap-4 mb-8 justify-center -mt-6 sm:mt-0 md:-mt-4 lg:mt-0"
          >
            <Image src={Logo} alt="Snap My Date" width={64} height={64} />
            <span className="text-4xl sm:text-5xl md:text-6xl text-foreground">
              <span className="font-pacifico">Snap</span>
              <span> </span>
              <span className="font-montserrat font-semibold">My Date</span>
            </span>
          </Link>
          <div className="bg-gradient-to-tr from-fuchsia-500/20 via-sky-400/20 to-violet-500/20 rounded-3xl p-1">
            <div className="rounded-3xl bg-surface/70 backdrop-blur-sm p-8 ring-1 ring-border">
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold leading-[1.05] tracking-tight text-foreground">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-sky-200 to-fuchsia-300">
                  Snap a flyer.
                </span>
                <br />
                <span className="text-foreground">Save the date.</span>
              </h1>
              <p className="mt-5 text-lg sm:text-xl text-foreground/80 max-w-2xl">
                Turn any flyer or appointment card into a calendar event in
                seconds. Works with Google, Apple, and Outlook Calendars.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center lg:justify-start">
                <button
                  onClick={openCamera}
                  aria-label="Open camera to snap a flyer"
                  className="group inline-flex items-center justify-center rounded-2xl px-7 py-3.5 text-lg font-semibold bg-primary hover:opacity-95 active:opacity-90 text-on-primary shadow-lg shadow-teal-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition"
                >
                  Snap It Now
                </button>

                <button
                  onClick={openUpload}
                  aria-label="Upload a flyer or card image from your device"
                  className="inline-flex items-center justify-center rounded-2xl px-7 py-3.5 text-lg font-semibold border border-border text-foreground/80 hover:text-foreground hover:bg-surface/70 bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-border/50 transition"
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
            <div className="mt-3 p-3 rounded border border-error/40 bg-error/10 text-error">
              {error}
            </div>
          )}

          {event && (
            <section className="mt-8 space-y-4">
              <div className="flex items-center gap-3 flex-nowrap">
                <button
                  className={`inline-flex items-center gap-2 sm:gap-3 rounded-full px-4 sm:px-5 py-2 text-sm sm:text-base whitespace-nowrap ${
                    connected.google
                      ? "border border-primary/60 bg-primary text-on-primary hover:opacity-95 active:opacity-90 shadow-md shadow-primary/25"
                      : "border border-border bg-surface/70 text-foreground/90 hover:text-foreground hover:bg-surface"
                  }`}
                  onClick={connected.google ? addGoogle : connectGoogle}
                >
                  {connected.google ? (
                    <>
                      <span>Add to</span>
                      <IconGoogleMono className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <span>Connect to</span>
                      <IconGoogleMono className="h-4 w-4" />
                    </>
                  )}
                </button>
                {!isAndroid && !isWindows && (
                  <button
                    className={`inline-flex items-center gap-2 sm:gap-3 rounded-full px-4 sm:px-5 py-2 text-sm sm:text-base whitespace-nowrap ${
                      appleLinked
                        ? "border border-primary/60 bg-primary text-on-primary hover:opacity-95 active:opacity-90 shadow-md shadow-primary/25"
                        : "border border-border bg-surface/70 text-foreground/90 hover:text-foreground hover:bg-surface"
                    }`}
                    onClick={dlIcs}
                  >
                    {appleLinked ? (
                      <>
                        <span>Add to</span>
                        <IconAppleMono className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        <span>Connect to</span>
                        <IconAppleMono className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
                <button
                  className={`inline-flex items-center gap-2 sm:gap-3 rounded-full px-4 sm:px-5 py-2 text-sm sm:text-base whitespace-nowrap ${
                    connected.microsoft
                      ? "border border-primary/60 bg-primary text-on-primary hover:opacity-95 active:opacity-90 shadow-md shadow-primary/25"
                      : "border border-border bg-surface/70 text-foreground/90 hover:text-foreground hover:bg-surface"
                  }`}
                  onClick={connected.microsoft ? addOutlook : connectOutlook}
                >
                  {connected.microsoft ? (
                    <>
                      <span>Add to</span>
                      <IconMicrosoftMono className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <span>Connect to</span>
                      <IconMicrosoftMono className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label
                    htmlFor="event-title"
                    className="text-sm text-foreground/70"
                  >
                    Title
                  </label>
                  <input
                    id="event-title"
                    className="w-full border border-border bg-surface text-foreground p-2 rounded"
                    value={event.title}
                    onChange={(e) =>
                      setEvent({ ...event, title: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="event-start"
                    className="text-sm text-foreground/70"
                  >
                    Start
                  </label>
                  <input
                    id="event-start"
                    className="w-full border border-border bg-surface text-foreground p-2 rounded"
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
                      className="text-sm text-foreground/70"
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
                    className="text-sm text-foreground/70"
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
                    className="text-sm text-foreground/70"
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
                  <label className="text-sm text-foreground/70">
                    Reminders
                  </label>
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
                            className="px-2 py-2 text-sm bg-surface border border-border rounded hover:opacity-80"
                            onClick={() => {
                              const next = (event.reminders || []).filter(
                                (_, i) => i !== idx
                              );
                              setEvent({ ...event, reminders: next });
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              aria-hidden="true"
                              className="h-4 w-4"
                            >
                              <path
                                d="M6 7h12M9 7V6a3 3 0 0 1 3-3 3 3 0 0 1 3 3v1m-9 0h12l-1 13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7m5 4v6m4-6v6"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
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
              </div>
            </section>
          )}
        </div>

        {showPhoneMockup && (
          <div className="order-1 lg:order-2 hidden md:flex justify-center lg:justify-end hide-phone-portrait-tablet">
            <PhoneMockup />
          </div>
        )}
      </section>

      {event && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gradient-to-br from-background/70 via-black/30 to-accent/30 backdrop-blur-sm"
            onClick={() => setEvent(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl ring-1 ring-border/60"
            style={{
              background:
                "linear-gradient(180deg, color-mix(in oklab, var(--surface) 92%, black 8%), color-mix(in oklab, var(--surface) 84%, black 16%))",
            }}
          >
            <div className="relative p-6 pb-4">
              <div
                className="absolute inset-x-0 -top-24 h-32 pointer-events-none select-none"
                aria-hidden="true"
              >
                <div
                  className="mx-auto h-full w-[80%] rounded-full blur-3xl opacity-40"
                  style={{
                    background:
                      "radial-gradient(closest-side, color-mix(in oklab, var(--accent) 45%, transparent), transparent), radial-gradient(closest-side, color-mix(in oklab, var(--secondary) 35%, transparent), transparent)",
                  }}
                />
              </div>

              <div className="flex items-start justify-between gap-4">
                <h2 className="text-2xl font-bold tracking-tight">
                  Review details
                </h2>
                <button
                  aria-label="Close"
                  className="rounded-xl px-3 py-1.5 border border-border bg-surface/70 hover:bg-surface text-foreground/80 hover:text-foreground transition"
                  onClick={() => setEvent(null)}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="px-6 pb-6 space-y-3 max-h-[70vh] overflow-y-auto no-scrollbar pr-2">
              <div className="space-y-1">
                <label
                  htmlFor="event-title"
                  className="text-sm text-foreground/70"
                >
                  Title
                </label>
                <input
                  id="event-title"
                  className="w-full border border-border/80 bg-surface/90 text-foreground p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition"
                  value={event.title}
                  onChange={(e) =>
                    setEvent({ ...event, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="event-start"
                  className="text-sm text-foreground/70"
                >
                  Start
                </label>
                <input
                  id="event-start"
                  className="w-full border border-border/80 bg-surface/90 text-foreground p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition"
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
                    className="text-sm text-foreground/70"
                  >
                    End
                  </label>
                  <input
                    id="event-end"
                    className="w-full border border-border/80 bg-surface/90 text-foreground p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition"
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
                  className="text-sm text-foreground/70"
                >
                  Address
                </label>
                <input
                  id="event-location"
                  className="w-full border border-border/80 bg-surface/90 text-foreground p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition"
                  value={event.location}
                  onChange={(e) =>
                    setEvent({ ...event, location: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="event-description"
                  className="text-sm text-foreground/70"
                >
                  Description
                </label>
                <textarea
                  id="event-description"
                  className="w-full border border-border/80 bg-surface/90 text-foreground p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition"
                  rows={4}
                  value={event.description}
                  onChange={(e) =>
                    setEvent({ ...event, description: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-foreground/70">Reminders</label>
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
                          className="border border-border/80 bg-surface/90 text-foreground p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition"
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
                          className="px-3 py-2 text-sm rounded-lg border border-border/80 bg-surface/80 hover:bg-surface transition"
                          onClick={() => {
                            const next = (event.reminders || []).filter(
                              (_, i) => i !== idx
                            );
                            setEvent({ ...event, reminders: next });
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                            className="h-4 w-4"
                          >
                            <path
                              d="M6 7h12M9 7V6a3 3 0 0 1 3-3 3 3 0 0 1 3 3v1m-9 0h12l-1 13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7m5 4v6m4-6v6"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                  <div>
                    <button
                      className="px-3 py-1.5 text-sm rounded-lg border border-border/80 bg-surface/80 hover:bg-surface transition"
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

            <div className="mt-6 flex items-center gap-3 flex-nowrap justify-end p-6 pt-4 border-t border-border/60 bg-gradient-to-b from-transparent to-background/30">
              <button
                className={`inline-flex items-center gap-2 sm:gap-3 rounded-full border px-4 sm:px-5 py-2 text-sm sm:text-base whitespace-nowrap hover:opacity-95 active:opacity-90 shadow-md ${
                  connected.google
                    ? "border-primary/60 bg-primary text-on-primary shadow-primary/25"
                    : "border-border/70 bg-surface/80 text-foreground/90 hover:bg-surface"
                }`}
                onClick={closeAfter(
                  connected.google ? addGoogle : connectGoogle
                )}
              >
                {connected.google ? (
                  <>
                    <span>Add to </span>
                    <IconGoogleMono className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <span>Connect to </span>
                    <IconGoogleMono className="h-4 w-4" />
                  </>
                )}
              </button>
              {!isAndroid && !isWindows && (
                <button
                  className={`inline-flex items-center gap-2 sm:gap-3 rounded-full border px-4 sm:px-5 py-2 text-sm sm:text-base whitespace-nowrap ${
                    appleLinked
                      ? "border-primary/60 bg-primary text-on-primary hover:opacity-95 active:opacity-90 shadow-md shadow-primary/25"
                      : "border-border/70 bg-surface/80 text-foreground/90 hover:bg-surface"
                  }`}
                  onClick={closeAfter(dlIcs)}
                >
                  {appleLinked ? (
                    <>
                      <span>Add to </span>
                      <IconAppleMono className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <span>Connect to </span>
                      <IconAppleMono className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}
              <button
                className={`inline-flex items-center gap-2 sm:gap-3 rounded-full border px-4 sm:px-5 py-2 text-sm sm:text-base whitespace-nowrap ${
                  connected.microsoft
                    ? "border-primary/60 bg-primary text-on-primary hover:opacity-95 active:opacity-90 shadow-md shadow-primary/25"
                    : "border-border/70 bg-surface/80 text-foreground/90 hover:bg-surface"
                }`}
                onClick={closeAfter(
                  connected.microsoft ? addOutlook : connectOutlook
                )}
              >
                {connected.microsoft ? (
                  <>
                    <span>Add to </span>
                    <IconMicrosoftMono className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <span>Connect to </span>
                    <IconMicrosoftMono className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function PhoneMockup() {
  const flyer = "/flyer.jpg";
  return (
    <div className="phone-shell relative w-[300px] sm:w-[340px] aspect-[9/19.5] rounded-[38px] bg-neutral-800 shadow-2xl shadow-black/50 ring-1 ring-white/10 overflow-hidden">
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
          top: 0%;
          animation: scan 2.2s linear infinite alternate;
          will-change: top;
        }
        .scanglow {
          position: absolute; left: 0; right: 0; height: 56px; top: -28px;
          background: radial-gradient(ellipse at center, rgba(255,255,255,0.16), rgba(255,255,255,0) 60%);
          animation: scanGlow 2.2s linear infinite alternate;
          mix-blend-mode: screen; opacity: .9;
          will-change: top;
        }
        @keyframes scan {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        @keyframes scanGlow {
          0% { top: -28px; }
          100% { top: calc(100% - 28px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .scanline, .scanglow { animation: none; }
          .scanline { top: 30%; }
          .scanglow { top: calc(30% - 28px); }
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

function IconGoogleMono({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 48 48"
      className={className}
    >
      <path
        fill="currentColor"
        d="M43.611 20.083H24v8h11.303C33.654 32.74 29.223 36.083 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C32.651 6.053 28.478 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

function IconMicrosoftMono({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 23 23"
      className={className}
    >
      <rect width="10" height="10" x="1" y="1" fill="currentColor" />
      <rect width="10" height="10" x="12" y="1" fill="currentColor" />
      <rect width="10" height="10" x="1" y="12" fill="currentColor" />
      <rect width="10" height="10" x="12" y="12" fill="currentColor" />
    </svg>
  );
}

function IconAppleMono({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="-2 0 26 24"
      fill="currentColor"
      className={className}
    >
      <path d="M16.365 1.43c0 1.14-.467 2.272-1.169 3.093-.75.883-2.02 1.57-3.257 1.479-.14-1.1.43-2.265 1.112-3.03.79-.9 2.186-1.58 3.314-1.542zM20.54 17.1c-.59 1.36-.88 1.97-1.65 3.18-1.07 1.71-2.59 3.84-4.46 3.85-1.68.02-2.12-1.12-4.41-1.11-2.29.01-2.78 1.13-4.47 1.09-1.87-.05-3.3-1.94-4.37-3.65-2.38-3.78-2.63-8.22-1.16-10.56 1.04-1.67 2.7-2.65 4.57-2.67 1.8-.03 3.5 1.19 4.41 1.19.92 0 2.56-1.47 4.31-1.25.73.03 2.79.29 4.11 2.21-.11.07-2.45 1.43-2.43 4.28.03 3.41 2.98 4.54 3.07 4.58z" />
    </svg>
  );
}
