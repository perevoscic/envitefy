"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
  type ReactNode,
  type MouseEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/assets/logo.png";
import {
  CreateEventIllustration,
  ScanIllustration,
  SignUpIllustration,
  UploadIllustration,
} from "@/components/landing/action-illustrations";
import { useSession } from "next-auth/react";
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

type HighlightTone = "primary" | "secondary" | "accent" | "success";

const TONE_STYLES: Record<HighlightTone, { iconBg: string }> = {
  primary: {
    iconBg: "bg-primary/15",
  },
  secondary: {
    iconBg: "bg-secondary/15",
  },
  accent: {
    iconBg: "bg-accent/15",
  },
  success: {
    iconBg: "bg-success/15",
  },
};

declare global {
  interface Window {
    __openCreateEvent?: () => void;
    __openSnapCamera?: () => void;
    __openSnapUpload?: () => void;
  }
}

export default function Home() {
  const { data: session } = useSession();
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [event, setEvent] = useState<EventFields | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setOcrText] = useState<string>("");

  const logUploadIssue = useCallback(
    (err: unknown, stage: string, details?: Record<string, unknown>) => {
      const payload: Record<string, unknown> = {
        stage,
        details,
        timestamp: new Date().toISOString(),
      };
      if (err instanceof Error) {
        payload.errorName = err.name;
        payload.errorMessage = err.message;
        payload.errorStack = err.stack;
      }
      if (typeof window !== "undefined") {
        const globalNavigator = window.navigator as Navigator & {
          connection?: {
            effectiveType?: string;
            downlink?: number;
            rtt?: number;
            saveData?: boolean;
          };
        };
        payload.onLine = globalNavigator.onLine;
        payload.userAgent = globalNavigator.userAgent;
        if (globalNavigator.connection) {
          payload.connection = {
            effectiveType: globalNavigator.connection.effectiveType,
            downlink: globalNavigator.connection.downlink,
            rtt: globalNavigator.connection.rtt,
            saveData: globalNavigator.connection.saveData,
          };
        }
      }
      if (err && typeof err === "object") {
        try {
          Reflect.set(err as object, "__snapUploadLogged", true);
        } catch {
          // ignore reflecting failures
        }
      }
      console.error("[snap-upload]", payload, err);
    },
    []
  );

  const connected = useMemo(
    () => ({
      google: Boolean((session as any)?.providers?.google),
      microsoft: Boolean((session as any)?.providers?.microsoft),
    }),
    [session]
  );

  const openCreateEvent = useCallback(() => {
    try {
      window.__openCreateEvent?.();
    } catch {
      // noop
    }
  }, []);

  const resetForm = useCallback(() => {
    setEvent(null);
    setModalOpen(false);
    setError(null);
    setOcrText("");
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const parseStartToIso = useCallback(
    (value: string | null, timezone: string) => {
      if (!value) return null;
      try {
        const isoDate = new Date(value);
        if (!Number.isNaN(isoDate.getTime())) return isoDate.toISOString();
      } catch {
        // ignore
      }
      const parsed = chrono.parseDate(value, new Date(), { forwardDate: true });
      return parsed ? new Date(parsed.getTime()).toISOString() : null;
    },
    []
  );

  const normalizeAddress = useCallback((raw: string) => {
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
  }, []);

  const buildSubmissionEvent = useCallback(
    (input: EventFields) => {
      const timezone =
        input.timezone ||
        Intl.DateTimeFormat().resolvedOptions().timeZone ||
        "UTC";
      const startIso = parseStartToIso(input.start, timezone);
      if (!startIso) return null;
      const endIso = input.end
        ? parseStartToIso(input.end, timezone) ||
          new Date(new Date(startIso).getTime() + 90 * 60 * 1000).toISOString()
        : new Date(new Date(startIso).getTime() + 90 * 60 * 1000).toISOString();
      const location = normalizeAddress(input.location || "");
      return {
        ...input,
        start: startIso,
        end: endIso,
        location,
        timezone,
      } as EventFields;
    },
    [normalizeAddress, parseStartToIso]
  );

  const ingest = useCallback(async (incoming: File) => {
    setLoading(true);
    setError(null);

    // Validate file size before upload (10 MB limit)
    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (incoming.size > maxSize) {
      setError("File is too large. Please upload a file smaller than 10 MB.");
      setLoading(false);
      return;
    }

    try {
      // On Android, file objects from file inputs can become invalid during async upload.
      // Read the file into memory first to capture the data before it becomes stale.
      let fileToUpload: File = incoming;
      try {
        // Read file into ArrayBuffer, then create a new File from it
        // This ensures the data is captured in memory before the original file reference becomes stale
        const arrayBuffer = await incoming.arrayBuffer();
        fileToUpload = new File([arrayBuffer], incoming.name, {
          type: incoming.type || "application/octet-stream",
          lastModified: incoming.lastModified,
        });
      } catch (readErr) {
        // If reading fails, fall back to using the original file object
        // (works on most platforms but may fail on Android)
        console.warn(
          "Failed to read file into memory, using original file object:",
          readErr
        );
      }

      const form = new FormData();
      form.append("file", fileToUpload);

      // Add timeout handling for mobile/network issues
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      let res: Response;
      try {
        res = await fetch("/api/ocr", {
          method: "POST",
          body: form,
          signal: controller.signal,
          mode: "cors",
          // Ensure credentials are included for authenticated requests
          credentials: "include",
        });
        clearTimeout(timeoutId);
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        logUploadIssue(fetchErr, "fetch", {
          fileName: incoming.name,
          fileSize: incoming.size,
          fileType: incoming.type,
        });
        if (fetchErr instanceof Error && fetchErr.name === "AbortError") {
          throw new Error(
            "Upload timed out. Please check your connection and try again."
          );
        }
        // Network errors, CORS issues, etc.
        const errorMessage =
          fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
        throw new Error(
          `Upload failed: ${errorMessage}. Please check your connection and try again.`
        );
      }

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const errorMsg =
          (payload as { error?: string })?.error ||
          `Server error (${res.status})`;
        logUploadIssue(new Error(errorMsg || "HTTP error"), "http", {
          status: res.status,
          statusText: res.statusText,
          fileName: incoming.name,
          fileSize: incoming.size,
          fileType: incoming.type,
        });
        throw new Error(errorMsg || "Failed to scan file");
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
          if (Number.isNaN(dt.getTime())) return iso;
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
      const adjusted = data?.fieldsGuess
        ? {
            ...data.fieldsGuess,
            start: formatIsoForInput(data.fieldsGuess.start, tz),
            end: formatIsoForInput(data.fieldsGuess.end, tz),
            reminders: [{ minutes: 1440 }],
          }
        : null;
      setEvent(adjusted);
      setModalOpen(Boolean(adjusted));
      setOcrText(data.ocrText || "");
    } catch (err) {
      setEvent(null);
      setModalOpen(false);
      const alreadyLogged =
        err instanceof Error &&
        Boolean(
          (err as Error & { __snapUploadLogged?: boolean }).__snapUploadLogged
        );
      if (!alreadyLogged) {
        logUploadIssue(err, "ingest-final", {
          fileName: incoming.name,
          fileSize: incoming.size,
          fileType: incoming.type,
        });
      }
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to scan file. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const onFile = useCallback(
    (selected: File | null) => {
      if (!selected) {
        // User cancelled file selection - silently return
        return;
      }
      void ingest(selected);
    },
    [ingest]
  );

  const openCamera = useCallback(() => {
    resetForm();
    // Use setTimeout to ensure the click happens within the user gesture context on mobile
    setTimeout(() => {
      if (cameraInputRef.current) {
        try {
          cameraInputRef.current.click();
        } catch (err) {
          console.error("Failed to open camera:", err);
          setError("Unable to open camera. Please try again.");
        }
      }
    }, 0);
  }, [resetForm, setError]);

  const openUpload = useCallback(() => {
    resetForm();
    // Use setTimeout to ensure the click happens within the user gesture context on mobile
    // This is necessary for iOS Safari and some Android browsers
    setTimeout(() => {
      if (fileInputRef.current) {
        try {
          fileInputRef.current.click();
        } catch (err) {
          console.error("Failed to open file picker:", err);
          setError("Unable to open file picker. Please try again.");
        }
      }
    }, 0);
  }, [resetForm, setError]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as any;
    w.__openSnapCamera = openCamera;
    w.__openSnapUpload = openUpload;
    return () => {
      if (w.__openSnapCamera === openCamera) {
        delete w.__openSnapCamera;
      }
      if (w.__openSnapUpload === openUpload) {
        delete w.__openSnapUpload;
      }
    };
  }, [openCamera, openUpload]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const action = (params.get("action") || "").toLowerCase();
      if (!action) return;
      const cleanup = () => {
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete("action");
          window.history.replaceState({}, "", url.toString());
        } catch {
          // noop
        }
      };
      if (action === "camera") {
        openCamera();
        cleanup();
      } else if (action === "upload") {
        openUpload();
        cleanup();
      }
    } catch {
      // noop
    }
  }, [openCamera, openUpload]);

  useEffect(() => {
    if (!event && modalOpen) {
      setModalOpen(false);
    }
  }, [event, modalOpen]);

  useEffect(() => {
    if (!modalOpen) return;
    if (typeof document === "undefined") return;
    const { body } = document;
    const previous = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = previous;
    };
  }, [modalOpen]);

  const dlIcs = useCallback(() => {
    if (!event?.start) return;
    const ready = buildSubmissionEvent(event);
    if (!ready) {
      setError("Missing start time for calendar export");
      return;
    }
    const q = new URLSearchParams({
      title: ready.title || "Event",
      start: ready.start ?? "",
      end: ready.end ?? "",
      location: ready.location || "",
      description: ready.description || "",
      timezone: ready.timezone || "America/Chicago",
      ...(ready.reminders && ready.reminders.length
        ? {
            reminders: ready.reminders.map((r) => String(r.minutes)).join(","),
          }
        : {}),
    }).toString();
    window.location.href = `/api/ics?${q}`;
  }, [event, buildSubmissionEvent]);

  const connectGoogle = useCallback(() => {
    window.open("/api/google/auth", "_blank");
  }, []);

  const connectOutlook = useCallback(() => {
    window.open("/api/outlook/auth", "_blank");
  }, []);

  const addGoogle = useCallback(async () => {
    if (!event?.start) return;
    const ready = buildSubmissionEvent(event);
    if (!ready) {
      setError("Missing start time for Google Calendar");
      return;
    }
    const res = await fetch("/api/events/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(ready),
    });
    let payload: any = {};
    try {
      payload = await res.json();
    } catch {
      // ignore
    }
    if (!res.ok) {
      setError(payload?.error || "Failed to add to Google Calendar");
      return;
    }
    if (payload?.htmlLink) {
      window.open(payload.htmlLink, "_blank");
    }
  }, [event, buildSubmissionEvent]);

  const addOutlook = useCallback(async () => {
    if (!event?.start) return;
    const ready = buildSubmissionEvent(event);
    if (!ready) {
      setError("Missing start time for Outlook Calendar");
      return;
    }
    const res = await fetch("/api/events/outlook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ready),
    });
    let payload: any = {};
    try {
      payload = await res.json();
    } catch {
      // ignore
    }
    if (!res.ok) {
      setError(payload?.error || "Failed to add to Outlook Calendar");
      return;
    }
    if (payload?.webLink) {
      window.open(payload.webLink, "_blank");
    }
  }, [event, buildSubmissionEvent]);

  useEffect(() => {
    // Touch the session so provider connections hydrate promptly
  }, [session]);

  return (
    <main className="landing-dark-gradient relative flex min-h-[100dvh] w-full flex-col items-center px-3 pb-20 pt-12 text-foreground md:px-8 md:pt-16">
      <div className="mb-8 md:mb-12 flex flex-col items-center text-center">
        <Image src={Logo} alt="Envitefy logo" width={100} height={100} />
        <p
          className="mt-2 text-6xl md:text-7xl tracking-tight text-white pb-3 pt-2"
          role="heading"
          aria-level={1}
        >
          <span className="font-pacifico">
            <span className="text-[#0e7bc4]">Env</span>
            <span className="text-[#ee3c2b]">i</span>
            <span className="text-[#0e7bc4]">tefy</span>
          </span>
        </p>
      </div>
      <div className="grid max-w-6xl grid-cols-2 gap-3 md:gap-8 lg:grid-cols-4">
        <OptionCard
          title="Snap Event"
          details={[
            "Use your camera to",
            "Extracts dates, locations, and RSVP details automatically.",
          ]}
          artwork={<ScanIllustration />}
          tone="primary"
          onClick={openCamera}
        />
        <OptionCard
          title="Upload Event"
          details={[
            "Drop PDFs, screenshots, or photos from your library.",
            "Smart cleanup handles decorative fonts and tricky layouts.",
          ]}
          artwork={<UploadIllustration />}
          tone="secondary"
          onClick={openUpload}
        />
        <OptionCard
          title="Create Event"
          details={[
            "Start from scratch with precise times, reminders, and notes.",
            "Add recurrence rules, categories, and custom reminders.",
          ]}
          artwork={<CreateEventIllustration />}
          tone="accent"
          onClick={openCreateEvent}
        />
        <OptionCard
          title="Sign-Up Form"
          details={[
            "Build RSVP and volunteer sheets with slot limits and questions.",
            "Share a single link that syncs responses in real time.",
          ]}
          artwork={<SignUpIllustration />}
          tone="success"
          href="/smart-signup-form"
        />
      </div>

      <section id="scan" className="mt-12 w-full max-w-4xl space-y-5">
        <div className="space-y-3">
          {error && (
            <div className="rounded border border-error bg-surface/90 p-3 text-sm text-error">
              {error}
            </div>
          )}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => onFile(event.target.files?.[0] ?? null)}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={(event) => onFile(event.target.files?.[0] ?? null)}
            className="hidden"
          />
          {loading && (
            <div role="status" aria-live="polite" className="mt-3">
              <div className="scan-inline" style={{ height: 10 }}>
                <div className="scan-beam" />
              </div>
            </div>
          )}
        </div>

        <SnapEventModal
          open={modalOpen && Boolean(event)}
          event={event}
          onClose={resetForm}
          setEvent={setEvent}
          connected={connected}
          addGoogle={addGoogle}
          connectGoogle={connectGoogle}
          addOutlook={addOutlook}
          connectOutlook={connectOutlook}
          dlIcs={dlIcs}
        />
      </section>
    </main>
  );
}

type SnapEventModalProps = {
  open: boolean;
  event: EventFields | null;
  onClose: () => void;
  setEvent: Dispatch<SetStateAction<EventFields | null>>;
  connected: { google: boolean; microsoft: boolean };
  addGoogle: () => void;
  connectGoogle: () => void;
  addOutlook: () => void;
  connectOutlook: () => void;
  dlIcs: () => void;
};

function SnapEventModal({
  open,
  event,
  onClose,
  setEvent,
  connected,
  addGoogle,
  connectGoogle,
  addOutlook,
  connectOutlook,
  dlIcs,
}: SnapEventModalProps) {
  const [isAppleDevice, setIsAppleDevice] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent || (navigator as any).vendor || "";
    const platform = (navigator.platform || "").toLowerCase();
    const maxTouchPoints =
      typeof navigator.maxTouchPoints === "number"
        ? navigator.maxTouchPoints
        : 0;
    const isTouchMac = platform === "macintel" && maxTouchPoints > 1;
    const isIpadLike =
      ua.toLowerCase().includes("ipad") || platform === "ipad" || isTouchMac;

    const isIOS = /iPhone|iPod/.test(ua) || platform === "iphone";
    const isIPadOS = isIpadLike;
    const isMacOS =
      (/Mac OS X|Macintosh/.test(ua) || platform.startsWith("mac")) &&
      !isTouchMac;

    setIsAppleDevice(isIOS || isIPadOS || isMacOS);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const updateEvent = useCallback(
    (mutator: (current: EventFields) => EventFields) => {
      setEvent((prev) => {
        if (!prev) return prev;
        return mutator(prev);
      });
    },
    [setEvent]
  );

  if (!open || !event) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center px-4 py-4 sm:py-10 md:px-8">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative z-10 flex w-full max-w-3xl max-h-[90vh] sm:max-h-[85vh] flex-col gap-5 overflow-hidden rounded-3xl border border-border bg-surface/95 p-6 shadow-[0_45px_90px_-40px_rgba(0,0,0,0.6)] backdrop-blur"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Review Event Details
            </h2>
            <p className="text-sm text-muted-foreground">
              Make any tweaks before sending it to your calendar.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close event editor"
            className="rounded-full border border-border bg-surface p-2 text-sm text-foreground hover:bg-surface/80"
            onClick={onClose}
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto pr-1 min-h-0 flex-1 max-h-[calc(90vh-240px)] sm:max-h-[60vh]">
          <div className="space-y-1">
            <label
              htmlFor="snap-event-title"
              className="text-sm text-muted-foreground"
            >
              Title
            </label>
            <input
              id="snap-event-title"
              className="w-full rounded border border-border bg-surface text-foreground p-2"
              value={event.title}
              onChange={(e) =>
                updateEvent((current) => ({
                  ...current,
                  title: e.target.value,
                }))
              }
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label
                htmlFor="snap-event-start"
                className="text-sm text-muted-foreground"
              >
                Start
              </label>
              <input
                id="snap-event-start"
                className="w-full rounded border border-border bg-surface text-foreground p-2"
                value={event.start || ""}
                onChange={(e) => {
                  const value = e.target.value || null;
                  updateEvent((current) => ({ ...current, start: value }));
                }}
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="snap-event-end"
                className="text-sm text-muted-foreground"
              >
                End (optional)
              </label>
              <input
                id="snap-event-end"
                className="w-full rounded border border-border bg-surface text-foreground p-2"
                value={event.end || ""}
                onChange={(e) => {
                  const value = e.target.value || null;
                  updateEvent((current) => ({ ...current, end: value }));
                }}
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label
                htmlFor="snap-event-location"
                className="text-sm text-muted-foreground"
              >
                Location
              </label>
              <input
                id="snap-event-location"
                className="w-full rounded border border-border bg-surface text-foreground p-2"
                value={event.location}
                onChange={(e) =>
                  updateEvent((current) => ({
                    ...current,
                    location: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="snap-event-timezone"
                className="text-sm text-muted-foreground"
              >
                Timezone
              </label>
              <input
                id="snap-event-timezone"
                className="w-full rounded border border-border bg-surface text-foreground p-2"
                value={event.timezone}
                onChange={(e) =>
                  updateEvent((current) => ({
                    ...current,
                    timezone: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="snap-event-description"
              className="text-sm text-muted-foreground"
            >
              Description
            </label>
            <textarea
              id="snap-event-description"
              className="w-full rounded border border-border bg-surface text-foreground p-2"
              rows={4}
              value={event.description}
              onChange={(e) =>
                updateEvent((current) => ({
                  ...current,
                  description: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">Reminders</span>
            <div className="space-y-2">
              {(event.reminders || []).map((reminder, idx) => {
                const dayOptions = [1, 2, 3, 7, 14, 30];
                const currentDays = Math.max(
                  1,
                  Math.round((reminder.minutes || 0) / 1440) || 1
                );
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      className="rounded border border-border bg-surface text-foreground p-2"
                      value={currentDays}
                      onChange={(e) => {
                        const days = Math.max(1, Number(e.target.value) || 1);
                        updateEvent((current) => {
                          const next = [...(current.reminders || [])];
                          next[idx] = { minutes: days * 1440 };
                          return { ...current, reminders: next };
                        });
                      }}
                    >
                      {dayOptions.map((d) => (
                        <option key={d} value={d}>
                          {d} day{d === 1 ? "" : "s"} before
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      aria-label="Delete reminder"
                      className="rounded border border-border bg-surface px-2 py-2 text-sm hover:opacity-80"
                      onClick={() =>
                        updateEvent((current) => ({
                          ...current,
                          reminders: (current.reminders || []).filter(
                            (_, i) => i !== idx
                          ),
                        }))
                      }
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        className="h-4 w-4"
                      >
                        <path
                          d="M6 7h12M9 7l1-2h4l1 2m-9 0l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M10 11v6m4-6v6"
                          strokeWidth="1.8"
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
                  type="button"
                  className="rounded border border-border bg-surface px-3 py-1 text-sm hover:opacity-80"
                  onClick={() =>
                    updateEvent((current) => {
                      const base = Array.isArray(current.reminders)
                        ? [...current.reminders]
                        : [];
                      return {
                        ...current,
                        reminders: [...base, { minutes: 1440 }],
                      };
                    })
                  }
                >
                  + Add reminder
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {connected.google ? (
              <button
                type="button"
                className="rounded bg-primary px-4 py-2 text-white text-shadow-subtle shadow-sm flex items-center gap-2"
                onClick={addGoogle}
              >
                <span>Add to</span>
                <Image
                  src="/brands/google.svg"
                  alt="Google"
                  width={20}
                  height={20}
                />
              </button>
            ) : (
              <button
                type="button"
                className="rounded bg-primary px-4 py-2 text-white text-shadow-subtle shadow-sm flex items-center gap-2"
                onClick={connectGoogle}
              >
                <span>Connect to</span>
                <Image
                  src="/brands/google.svg"
                  alt="Google"
                  width={20}
                  height={20}
                />
              </button>
            )}
            {connected.microsoft ? (
              <button
                type="button"
                className="rounded bg-secondary px-4 py-2 text-white text-shadow-subtle shadow-sm flex items-center gap-2"
                onClick={addOutlook}
              >
                <span>Add to</span>
                <Image
                  src="/brands/microsoft.svg"
                  alt="Microsoft"
                  width={20}
                  height={20}
                />
              </button>
            ) : (
              <button
                type="button"
                className="rounded bg-secondary px-4 py-2 text-white text-shadow-subtle shadow-sm flex items-center gap-2"
                onClick={connectOutlook}
              >
                <span>Connect to</span>
                <Image
                  src="/brands/microsoft.svg"
                  alt="Microsoft"
                  width={20}
                  height={20}
                />
              </button>
            )}
            {isAppleDevice && (
              <button
                type="button"
                className="rounded border border-border bg-surface px-4 py-2 text-sm hover:opacity-80 flex items-center gap-2"
                onClick={dlIcs}
              >
                <span>Connect to</span>
                <Image
                  src="/brands/apple-black.svg"
                  alt="Apple"
                  width={20}
                  height={20}
                  className="show-light"
                />
                <Image
                  src="/brands/apple-white.svg"
                  alt=""
                  width={20}
                  height={20}
                  className="show-dark"
                  aria-hidden="true"
                />
              </button>
            )}
          </div>
          <button
            type="button"
            className="rounded border border-border bg-surface px-4 py-2 text-sm hover:opacity-80"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function FlipHintIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M7 5h9.5a.5.5 0 01.5.5V11" />
      <path d="M16 9l2 2 2-2" />
      <path d="M17 19H7.5a.5.5 0 01-.5-.5V13" />
      <path d="M8 15l-2-2-2 2" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M6 6L18 18" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

function OptionCard({
  href,
  title,
  artwork,
  details,
  tone = "primary",
  onClick,
}: {
  href?: string;
  title: string;
  artwork: ReactNode;
  details?: string[];
  tone?: HighlightTone;
  onClick?: () => void;
}) {
  const toneClass = TONE_STYLES[tone] ?? TONE_STYLES.primary;
  const [showDetails, setShowDetails] = useState(false);

  const handlePrimaryAction = (
    event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>
  ) => {
    if (showDetails) {
      event.preventDefault();
      setShowDetails(false);
      return;
    }
    onClick?.();
  };

  const openDetails = () => setShowDetails(true);

  const handleInfoPointer = (
    event: MouseEvent<HTMLSpanElement> | KeyboardEvent<HTMLSpanElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (!showDetails) {
      openDetails();
    }
  };

  const handleInfoKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      handleInfoPointer(event);
    }
  };

  const closeDetails = (
    event?:
      | MouseEvent<HTMLButtonElement | HTMLDivElement>
      | KeyboardEvent<HTMLDivElement>
  ) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setShowDetails(false);
  };

  const primaryWrapperClass = [
    "group block h-full w-full text-left focus:outline-none",
    showDetails ? "pointer-events-none select-none" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const primaryTabIndex = showDetails ? -1 : undefined;

  const frontCard = (
    <div
      className="relative overflow-hidden rounded-2xl border border-border/60 bg-surface/90 px-2 py-2 md:px-2.5 md:py-2.5 shadow-[0_24px_50px_-32px_var(--theme-card-glow)] backdrop-blur-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_32px_65px_-28px_var(--theme-card-glow)]"
      data-card-tone={tone}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-70"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 0%, var(--theme-overlay) 0%, transparent 60%)",
        }}
        aria-hidden
      />
      <span
        role="button"
        tabIndex={showDetails ? -1 : 0}
        aria-label="Show details"
        className="absolute right-2 top-2 z-10 inline-flex items-center justify-center bg-transparent p-1 text-[#0e7bc4] transition hover:text-[#0e7bc4] focus:outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[#0e7bc4]/50 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:text-[#0e7bc4] dark:hover:text-[#0e7bc4] dark:focus-visible:ring-[#0e7bc4]/60 dark:focus-visible:ring-offset-0"
        onClick={handleInfoPointer}
        onKeyDown={handleInfoKeyDown}
      >
        <FlipHintIcon className="h-5 w-5" />
      </span>
      <div className="relative flex flex-col items-center space-y-1.5 md:space-y-2 text-center">
        <div
          className={[
            "relative flex w-full max-w-[120px] md:max-w-[140px] items-center justify-center overflow-hidden rounded-xl bg-surface/70 p-1.5 md:p-2 transition-all duration-300 group-hover:scale-[1.02]",
            toneClass.iconBg,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-white/5 opacity-0 transition-opacity duration-300 group-hover:opacity-70" />
          <div className="relative w-full">{artwork}</div>
        </div>
        <h2 className="text-xs md:text-sm font-semibold text-foreground">
          {title}
        </h2>
      </div>
    </div>
  );

  const backCard = (
    <div
      role="button"
      tabIndex={0}
      onClick={closeDetails}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          closeDetails(event);
        }
      }}
      className="absolute inset-0 flex h-full w-full cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-surface/95 px-2 py-2 md:px-2.5 md:py-2.5 text-left shadow-[0_24px_50px_-32px_var(--theme-card-glow)] backdrop-blur-sm transition-transform duration-300 hover:shadow-[0_32px_65px_-28px_var(--theme-card-glow)]"
      data-card-tone={tone}
      style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}
    >
      <button
        type="button"
        aria-label="Hide details"
        className="absolute right-2 top-2 inline-flex items-center justify-center bg-transparent p-1 text-[#0e7bc4] transition hover:text-[#0e7bc4] focus:outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[#0e7bc4]/50 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:text-[#0e7bc4] dark:hover:text-[#0e7bc4] dark:focus-visible:ring-[#0e7bc4]/60 dark:focus-visible:ring-offset-0"
        onClick={closeDetails}
      >
        <CloseIcon className="h-4 w-4" />
      </button>
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(140% 140% at 50% 15%, var(--theme-overlay) 0%, transparent 65%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto flex max-w-xs flex-1 flex-col justify-center gap-3 md:gap-4 text-center">
        <div className="space-y-1.5 md:space-y-2">
          <h2 className="text-sm md:text-base font-semibold text-foreground">
            {title}
          </h2>
        </div>
        {details?.length ? (
          <ul className="space-y-1.5 md:space-y-2 text-left text-xs text-muted-foreground">
            {details.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-[0.35rem] md:mt-[0.45rem] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-current opacity-60" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );

  const frontWrapper = href ? (
    <Link
      href={href}
      onClick={handlePrimaryAction}
      className={primaryWrapperClass}
      tabIndex={primaryTabIndex}
    >
      {frontCard}
    </Link>
  ) : (
    <button
      type="button"
      onClick={handlePrimaryAction}
      className={primaryWrapperClass}
      tabIndex={showDetails ? -1 : 0}
    >
      {frontCard}
    </button>
  );

  return (
    <div className="relative h-full w-full [perspective:2000px]">
      <div
        className="relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]"
        style={{ transform: showDetails ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        <div
          className="relative h-full w-full"
          style={{ backfaceVisibility: "hidden" }}
        >
          {frontWrapper}
        </div>
        {backCard}
      </div>
    </div>
  );
}
