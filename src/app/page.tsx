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
    try {
      const form = new FormData();
      form.append("file", incoming);
      const res = await fetch("/api/ocr", { method: "POST", body: form });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(
          (payload as { error?: string })?.error || "Failed to scan file"
        );
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
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to scan file");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const onFile = useCallback(
    (selected: File | null) => {
      if (!selected) return;
      void ingest(selected);
    },
    [ingest]
  );

  const openCamera = useCallback(() => {
    resetForm();
    cameraInputRef.current?.click();
  }, [resetForm]);

  const openUpload = useCallback(() => {
    resetForm();
    fileInputRef.current?.click();
  }, [resetForm]);

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
    window.location.href = "/api/google/auth";
  }, []);

  const connectOutlook = useCallback(() => {
    window.location.href = "/api/outlook/auth";
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
          className="mt-2 text-7xl md:text-9xl tracking-tight text-white pb-3 pt-2"
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
      <div className="grid w-full max-w-6xl grid-cols-2 gap-2 md:gap-4 lg:grid-cols-4">
        <OptionCard
          title="Snap Event"
          description="Add it to your calendar instantly."
          details={[
            "Use your camera to capture invitations right into Envitefy.",
            "Extracts dates, locations, and RSVP details automatically.",
          ]}
          artwork={<ScanIllustration />}
          tone="primary"
          onClick={openCamera}
        />
        <OptionCard
          title="Upload Event"
          description="Turn a saved flyer into an event."
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
          description="Use advanced creation tools."
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
          description="Perfect for school events or volunteers."
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-10 md:px-8">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 flex w-full max-w-3xl flex-col gap-5 overflow-hidden rounded-3xl border border-border bg-surface/95 p-6 shadow-[0_45px_90px_-40px_rgba(0,0,0,0.6)] backdrop-blur">
        <div className="flex items-start justify-between gap-4">
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

        <div className="flex flex-col gap-4 overflow-y-auto pr-1 md:max-h-[60vh]">
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

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            {connected.google ? (
              <button
                type="button"
                className="rounded bg-primary px-4 py-2 text-white text-shadow-subtle shadow-sm"
                onClick={addGoogle}
              >
                Add to Google
              </button>
            ) : (
              <button
                type="button"
                className="rounded bg-primary px-4 py-2 text-white text-shadow-subtle shadow-sm"
                onClick={connectGoogle}
              >
                Connect to Google
              </button>
            )}
            {connected.microsoft ? (
              <button
                type="button"
                className="rounded bg-secondary px-4 py-2 text-white text-shadow-subtle shadow-sm"
                onClick={addOutlook}
              >
                Add to Outlook
              </button>
            ) : (
              <button
                type="button"
                className="rounded bg-secondary px-4 py-2 text-white text-shadow-subtle shadow-sm"
                onClick={connectOutlook}
              >
                Connect to Outlook
              </button>
            )}
            <button
              type="button"
              className="rounded border border-border bg-surface px-4 py-2 text-sm hover:opacity-80"
              onClick={dlIcs}
            >
              Download ICS
            </button>
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
  description,
  details,
  tone = "primary",
  onClick,
}: {
  href?: string;
  title: string;
  artwork: ReactNode;
  description: string;
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
        <h2 className="text-sm md:text-base font-semibold text-foreground">
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
          <h2 className="text-base md:text-lg font-semibxold text-foreground">
            {title}
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        {details?.length ? (
          <ul className="space-y-1.5 md:space-y-2 text-left text-xs md:text-sm text-muted-foreground">
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
