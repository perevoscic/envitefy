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
  type CSSProperties,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { CalendarIconGoogle } from "@/components/CalendarIcons";
import { EnvitefyBuilderHero } from "@/components/home/EnvitefyBuilderHero";
import { SportsPracticeHero } from "@/components/home/SportsPracticeHero";
import { AppointmentsGeneralHero } from "@/components/home/AppointmentsGeneralHero";
import { SnapHero } from "@/components/home/SnapHero";
import { UploadHero } from "@/components/home/UploadHero";
import { SmartSignupHero } from "@/components/home/SmartSignupHero";
import {
  CreateEventIllustration,
  ScanIllustration,
  SignUpIllustration,
  UploadIllustration,
} from "@/components/landing/action-illustrations";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import * as chrono from "chrono-node";
import { createThumbnailDataUrl, readFileAsDataUrl } from "@/utils/thumbnail";
import { extractFirstPhoneNumber } from "@/utils/phone";
import { findFirstEmail } from "@/utils/contact";
import { buildEventPath } from "@/utils/event-url";
import {
  SnapProcessingCard,
  type SnapPreviewKind,
  type SnapProcessingStatus,
} from "@/components/snap/SnapProcessingCard";
import {
  TEMPLATE_DEFINITIONS,
  TEMPLATE_KEYS,
  type TemplateKey,
  inferTemplateKeyFromEventData,
} from "@/config/feature-visibility";
import { useFeatureVisibility } from "@/hooks/useFeatureVisibility";

type EventFields = {
  title: string;
  start: string | null;
  end: string | null;
  location: string;
  description: string;
  timezone: string;
  numberOfGuests: number;
  reminders?: { minutes: number }[] | null;
  rsvp?: string | null;
};

type UpcomingItem = {
  id: string;
  title: string;
  start: string;
  category: string | null;
};

type HighlightTone = "primary" | "secondary" | "accent" | "success";

const TONE_STYLES: Record<
  HighlightTone,
  { iconBg: string; cardSurface: string; accent: string }
> = {
  primary: {
    iconBg: "bg-[#e6f3ee]",
    cardSurface:
      "linear-gradient(145deg, rgba(255,255,255,0.94), rgba(171, 208, 193, 0.25))",
    accent: "rgba(105, 166, 159, 0.65)",
  },
  secondary: {
    iconBg: "bg-[#ede8fb]",
    cardSurface:
      "linear-gradient(145deg, rgba(255,255,255,0.94), rgba(183, 171, 220, 0.25))",
    accent: "rgba(123, 104, 196, 0.55)",
  },
  accent: {
    iconBg: "bg-[#fde8f1]",
    cardSurface:
      "linear-gradient(145deg, rgba(255,255,255,0.94), rgba(238, 169, 183, 0.25))",
    accent: "rgba(210, 105, 140, 0.58)",
  },
  success: {
    iconBg: "bg-[#e6f6f0]",
    cardSurface:
      "linear-gradient(145deg, rgba(255,255,255,0.94), rgba(170, 214, 196, 0.25))",
    accent: "rgba(94, 154, 127, 0.55)",
  },
};

declare global {
  interface Window {
    __openCreateEvent?: () => void;
    __openSnapCamera?: () => void;
    __openSnapUpload?: () => void;
  }
}

export default function Dashboard() {
  const { data: session } = useSession();
  const isSignedIn = Boolean(session?.user);
  const {
    loading: visibilityLoading,
    required: onboardingRequired,
    completed: onboardingCompleted,
    persona,
    personas,
    promptDismissedAt,
    visibleTemplateKeys,
    dashboardLayout,
    refresh: refreshVisibility,
  } = useFeatureVisibility();
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [event, setEvent] = useState<EventFields | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setOcrText] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [ocrCategory, setOcrCategory] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<SnapProcessingStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<SnapPreviewKind>(null);
  const uploadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeOcrAbortRef = useRef<AbortController | null>(null);
  const cancelledByUserRef = useRef(false);
  const currentPreviewUrlRef = useRef<string | null>(null);
  const scanStartedAtRef = useRef<number | null>(null);
  const scanStatusRef = useRef<SnapProcessingStatus>("idle");
  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);
  const [softPromptDismissed, setSoftPromptDismissed] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingItem[]>([]);

  useEffect(() => {
    scanStatusRef.current = scanStatus;
  }, [scanStatus]);

  useEffect(() => {
    if (!isSignedIn || visibilityLoading) return;
    setOnboardingModalOpen(Boolean(onboardingRequired));
  }, [isSignedIn, visibilityLoading, onboardingRequired]);

  const clearScanTimers = useCallback(() => {
    if (uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current);
      uploadIntervalRef.current = null;
    }
  }, []);

  const resetScanUi = useCallback(
    (clearPreview = true) => {
      clearScanTimers();
      setScanStatus("idle");
      setUploadProgress(0);
      scanStartedAtRef.current = null;
      if (clearPreview) {
        if (currentPreviewUrlRef.current) {
          URL.revokeObjectURL(currentPreviewUrlRef.current);
        }
        currentPreviewUrlRef.current = null;
        setPreviewUrl(null);
        setPreviewKind(null);
      }
    },
    [clearScanTimers]
  );

  const startScanUi = useCallback(
    (selected: File) => {
      clearScanTimers();
      scanStartedAtRef.current = null;

      if (currentPreviewUrlRef.current) {
        URL.revokeObjectURL(currentPreviewUrlRef.current);
      }
      currentPreviewUrlRef.current = null;

      const nextPreviewKind: SnapPreviewKind = selected.type.startsWith("image/")
        ? "image"
        : selected.type === "application/pdf"
          ? "pdf"
          : "file";
      setPreviewKind(nextPreviewKind);
      if (nextPreviewKind === "image") {
        const nextPreviewUrl = URL.createObjectURL(selected);
        currentPreviewUrlRef.current = nextPreviewUrl;
        setPreviewUrl(nextPreviewUrl);
      } else {
        setPreviewUrl(null);
      }

      setUploadProgress(0);
      setScanStatus("uploading");
      uploadIntervalRef.current = setInterval(() => {
        setUploadProgress((prev) => {
          const next = Math.min(100, prev + 6);
          if (next >= 100) {
            if (uploadIntervalRef.current) {
              clearInterval(uploadIntervalRef.current);
              uploadIntervalRef.current = null;
            }
            setScanStatus("scanning");
            scanStartedAtRef.current = Date.now();
          }
          return next;
        });
      }, 100);
    },
    [clearScanTimers]
  );

  const finishScanUi = useCallback(async () => {
    if (uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current);
      uploadIntervalRef.current = null;
    }
    setUploadProgress(100);

    if (scanStatusRef.current !== "scanning") {
      setScanStatus("scanning");
      scanStartedAtRef.current = Date.now();
    }

    const minScanRevealMs = 1200;
    const elapsed = scanStartedAtRef.current
      ? Date.now() - scanStartedAtRef.current
      : 0;
    if (elapsed < minScanRevealMs) {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, minScanRevealMs - elapsed);
      });
    }
  }, []);

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

  const [connected, setConnected] = useState<{
    google: boolean;
    microsoft: boolean;
  }>({
    google: false,
    microsoft: false,
  });

  useEffect(() => {
    const fetchConnected = async () => {
      try {
        const res = await fetch("/api/calendars", { credentials: "include" });
        const data = await res.json();
        setConnected({
          google: Boolean(data?.google),
          microsoft: Boolean(data?.microsoft),
        });
      } catch (err) {
        console.error("Failed to fetch connected calendars:", err);
      }
    };
    fetchConnected();
  }, [session]);

  useEffect(() => {
    if (!isSignedIn) return;
    const loadUpcoming = async () => {
      try {
        const res = await fetch("/api/history?view=calendar&limit=100", {
          credentials: "include",
          cache: "no-store",
        });
        const json = await res.json().catch(() => ({ items: [] }));
        const now = Date.now();
        const items = (Array.isArray(json?.items) ? json.items : [])
          .map((row: any) => {
            const data = row?.data || {};
            const startRaw =
              data?.startISO ||
              data?.start ||
              data?.fieldsGuess?.start ||
              data?.event?.start ||
              null;
            const startDate = startRaw ? new Date(startRaw) : null;
            if (!startDate || Number.isNaN(startDate.getTime())) return null;
            if (startDate.getTime() < now) return null;
            const category = String(data?.category || row?.category || "");
            const inferred = inferTemplateKeyFromEventData({
              category,
              title: row?.title || data?.title || null,
            });
            if (inferred && !visibleTemplateKeys.includes(inferred)) return null;
            return {
              id: row.id,
              title: row.title || "Event",
              start: startDate.toISOString(),
              category: category || null,
            } as UpcomingItem;
          })
          .filter(Boolean) as UpcomingItem[];
        items.sort((a, b) => +new Date(a.start) - +new Date(b.start));
        setUpcomingEvents(items.slice(0, 5));
      } catch {
        setUpcomingEvents([]);
      }
    };
    void loadUpcoming();
  }, [isSignedIn, visibleTemplateKeys]);

  const visibleTemplateHrefs = useMemo(() => {
    const visible = new Set<TemplateKey>(visibleTemplateKeys);
    return TEMPLATE_DEFINITIONS.filter((d) => visible.has(d.key)).map(
      (d) => d.href
    );
  }, [visibleTemplateKeys]);

  const moduleOrder = useMemo(() => {
    const personaSet = new Set(personas);
    if (
      personaSet.has("sports_staff") ||
      persona === "sports_staff" ||
      dashboardLayout === "sports_focused"
    ) {
      return ["sports", "milestones", "appointments"] as const;
    }
    if (personaSet.has("couples") || persona === "couples") {
      return ["milestones", "appointments", "sports"] as const;
    }
    if (
      personaSet.has("business_teams") ||
      personaSet.has("organizers") ||
      persona === "business_teams" ||
      persona === "organizers"
    ) {
      return ["appointments", "milestones", "sports"] as const;
    }
    return ["milestones", "sports", "appointments"] as const;
  }, [dashboardLayout, persona, personas]);

  const router = useRouter();
  const openCreateEvent = useCallback(() => {
    try {
      router.push("/event/new");
    } catch {}
  }, [router]);

  const resetForm = useCallback(() => {
    cancelledByUserRef.current = true;
    activeOcrAbortRef.current?.abort();
    activeOcrAbortRef.current = null;
    resetScanUi();
    setEvent(null);
    setModalOpen(false);
    setLoading(false);
    setError(null);
    setOcrText("");
    setUploadedFile(null);
    setOcrCategory(null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [resetScanUi]);

  useEffect(
    () => () => {
      activeOcrAbortRef.current?.abort();
      activeOcrAbortRef.current = null;
      clearScanTimers();
      if (currentPreviewUrlRef.current) {
        URL.revokeObjectURL(currentPreviewUrlRef.current);
      }
      currentPreviewUrlRef.current = null;
    },
    [clearScanTimers]
  );

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
    cancelledByUserRef.current = false;

    // Validate file size before upload (10 MB limit)
    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (incoming.size > maxSize) {
      setError("File is too large. Please upload a file smaller than 10 MB.");
      resetScanUi();
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
      activeOcrAbortRef.current = controller;
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
        if (fetchErr instanceof Error && fetchErr.name === "AbortError") {
          if (cancelledByUserRef.current) {
            throw new Error("__scan_cancelled__");
          }
          throw new Error(
            "Upload timed out. Please check your connection and try again."
          );
        }
        logUploadIssue(fetchErr, "fetch", {
          fileName: incoming.name,
          fileSize: incoming.size,
          fileType: incoming.type,
        });
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
      // Clean RSVP field: extract ONLY phone number (digits only) or email (no "RSVP:", names, etc.)
      // This ensures the field contains ONLY the contact info that can be used directly for SMS/email
      const cleanRsvp = (
        rsvpText: string | null | undefined
      ): string | null => {
        if (!rsvpText) return null;
        // Try to extract phone number first
        const phone = extractFirstPhoneNumber(rsvpText);
        if (phone) {
          // Return only digits (no formatting, no prefixes) - ready for SMS links
          const digits = phone.replace(/\D/g, "");
          if (digits.length === 11 && digits.startsWith("1")) {
            // Remove leading 1, return 10 digits only
            return digits.slice(1);
          }
          if (digits.length >= 10) {
            // Return last 10 digits only
            return digits.slice(-10);
          }
          return digits;
        }
        // Try to extract email (just the email address, no prefixes)
        const email = findFirstEmail(rsvpText);
        if (email) return email;
        // If neither found, return null
        return null;
      };

      const cleanedRsvp = data?.fieldsGuess?.rsvp
        ? cleanRsvp(data.fieldsGuess.rsvp)
        : null;

      const adjusted = data?.fieldsGuess
        ? {
            ...data.fieldsGuess,
            start: formatIsoForInput(data.fieldsGuess.start, tz),
            end: formatIsoForInput(data.fieldsGuess.end, tz),
            reminders: [{ minutes: 1440 }],
            numberOfGuests: 0, // Keep in state for compatibility, but won't be saved
            rsvp: cleanedRsvp,
          }
        : null;
      await finishScanUi();
      resetScanUi();
      setEvent(adjusted);
      setModalOpen(Boolean(adjusted));
      setOcrText(data.ocrText || "");
      setUploadedFile(fileToUpload);
      setOcrCategory(data?.category || null);
    } catch (err) {
      if (err instanceof Error && err.message === "__scan_cancelled__") {
        setEvent(null);
        setModalOpen(false);
        setError(null);
        return;
      }
      resetScanUi();
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
      activeOcrAbortRef.current = null;
      cancelledByUserRef.current = false;
      setLoading(false);
    }
  }, [finishScanUi, logUploadIssue, resetScanUi]);

  const onFile = useCallback(
    (selected: File | null) => {
      if (!selected) {
        // User cancelled file selection - silently return
        return;
      }
      startScanUi(selected);
      void ingest(selected);
    },
    [ingest, startScanUi]
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

  const addAppleCalendar = useCallback(() => {
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
      disposition: "inline",
      ...(ready.reminders && ready.reminders.length
        ? {
            reminders: ready.reminders.map((r) => String(r.minutes)).join(","),
          }
        : {}),
    }).toString();

    // On macOS Safari, opening the ICS endpoint with disposition=inline
    // in a new window should trigger Calendar.app
    // Using window.open() gives Safari a better chance to intercept and open natively
    const url = `${window.location.origin}/api/ics?${q}`;
    window.open(url, "_blank");
  }, [event, buildSubmissionEvent, setError]);

  const connectGoogle = useCallback(() => {
    if (!event?.start) return;
    const ready = buildSubmissionEvent(event);
    if (!ready) {
      setError("Missing start time for Google Calendar");
      return;
    }

    // Encode event data as base64 JSON for OAuth state
    const eventData = {
      title: ready.title || "Event",
      start: ready.start,
      end: ready.end,
      location: ready.location || "",
      description: event.description || "",
      timezone: ready.timezone || "UTC",
      reminders: event.reminders || null,
      allDay: false,
      recurrence: null,
    };
    // Browser-compatible base64 encoding matching callback's decodeURIComponent expectation
    // The callback decodes: Buffer.from(state, "base64").toString("utf8") then JSON.parse(decodeURIComponent(json))
    const jsonStr = JSON.stringify(eventData);
    // Use btoa with encodeURIComponent for proper UTF-8 handling
    const stateParam = btoa(encodeURIComponent(jsonStr));
    window.open(
      `/api/google/auth?state=${encodeURIComponent(stateParam)}`,
      "_blank"
    );
  }, [event, buildSubmissionEvent, setError]);

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

    // Save to Envitefy history first
    let eventId: string | undefined;
    let savedTitle: string | undefined;
    try {
      const timezone =
        event.timezone ||
        Intl.DateTimeFormat().resolvedOptions().timeZone ||
        "UTC";

      // Create thumbnail if file is an image
      let thumbnail: string | undefined;
      let attachment:
        | { name: string; type: string; dataUrl: string }
        | undefined;
      if (uploadedFile && uploadedFile.type.startsWith("image/")) {
        try {
          thumbnail =
            (await createThumbnailDataUrl(uploadedFile, 1200, 0.85)) ||
            undefined;
          const dataUrl = await readFileAsDataUrl(uploadedFile);
          attachment = {
            name: uploadedFile.name,
            type: uploadedFile.type,
            dataUrl,
          };
        } catch (err) {
          console.error("Failed to create thumbnail:", err);
        }
      }

      const payload: any = {
        title: event.title || "Event",
        data: {
          category: ocrCategory || undefined,
          startISO: ready.start,
          endISO: ready.end,
          location: ready.location || undefined,
          description: event.description || undefined,
          timezone,
          reminders: event.reminders || undefined,
          createdVia: "ocr",
          thumbnail,
          attachment,
        },
      };

      const historyRes = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const historyData: any = await historyRes.json().catch(() => ({}));
      eventId = (historyData as any)?.id as string | undefined;
      if (typeof historyData?.title === "string") {
        savedTitle = historyData.title as string;
      }

      // Emit event for sidebar refresh
      if (eventId && typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("history:created", {
            detail: {
              id: eventId,
              title: historyData?.title || payload.title,
              created_at: historyData?.created_at || new Date().toISOString(),
              start: ready.start,
              category: ocrCategory || null,
              data: payload.data,
            },
          })
        );
      }
    } catch (err) {
      console.error("Failed to save to Envitefy history:", err);
      // Continue even if history save fails
    }

    // Add to Google Calendar
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

    // Open Google Calendar in a new tab
    if (payload?.htmlLink) {
      window.open(payload.htmlLink, "_blank");
    }

    // Close modal and navigate to event page
    if (eventId) {
      const eventTitle = savedTitle || payload.title;
      resetForm();
      router.push(buildEventPath(eventId, eventTitle, { created: true }));
    } else {
      resetForm();
    }
  }, [
    event,
    buildSubmissionEvent,
    uploadedFile,
    ocrCategory,
    setError,
    resetForm,
    router,
  ]);

  const addOutlook = useCallback(async () => {
    if (!event?.start) return;
    const ready = buildSubmissionEvent(event);
    if (!ready) {
      setError("Missing start time for Outlook Calendar");
      return;
    }

    // Save to Envitefy history first
    let eventId: string | undefined;
    let savedTitle: string | undefined;
    try {
      const timezone =
        event.timezone ||
        Intl.DateTimeFormat().resolvedOptions().timeZone ||
        "UTC";

      // Create thumbnail if file is an image
      let thumbnail: string | undefined;
      let attachment:
        | { name: string; type: string; dataUrl: string }
        | undefined;
      if (uploadedFile && uploadedFile.type.startsWith("image/")) {
        try {
          thumbnail =
            (await createThumbnailDataUrl(uploadedFile, 1200, 0.85)) ||
            undefined;
          const dataUrl = await readFileAsDataUrl(uploadedFile);
          attachment = {
            name: uploadedFile.name,
            type: uploadedFile.type,
            dataUrl,
          };
        } catch (err) {
          console.error("Failed to create thumbnail:", err);
        }
      }

      const payload: any = {
        title: event.title || "Event",
        data: {
          category: ocrCategory || undefined,
          startISO: ready.start,
          endISO: ready.end,
          location: ready.location || undefined,
          description: event.description || undefined,
          timezone,
          reminders: event.reminders || undefined,
          createdVia: "ocr",
          thumbnail,
          attachment,
        },
      };

      const historyRes = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const historyData: any = await historyRes.json().catch(() => ({}));
      eventId = (historyData as any)?.id as string | undefined;
      if (typeof historyData?.title === "string") {
        savedTitle = historyData.title as string;
      }

      // Emit event for sidebar refresh
      if (eventId && typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("history:created", {
            detail: {
              id: eventId,
              title: historyData?.title || payload.title,
              created_at: historyData?.created_at || new Date().toISOString(),
              start: ready.start,
              category: ocrCategory || null,
              data: payload.data,
            },
          })
        );
      }
    } catch (err) {
      console.error("Failed to save to Envitefy history:", err);
      // Continue even if history save fails
    }

    // Add to Outlook Calendar
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

    // Open Outlook Calendar in a new tab
    if (payload?.webLink) {
      window.open(payload.webLink, "_blank");
    }

    // Close modal and navigate to event page
    if (eventId) {
      const eventTitle = savedTitle || payload.title;
      resetForm();
      router.push(buildEventPath(eventId, eventTitle, { created: true }));
    } else {
      resetForm();
    }
  }, [
    event,
    buildSubmissionEvent,
    uploadedFile,
    ocrCategory,
    setError,
    resetForm,
    router,
  ]);

  const saveToEnvitefy = useCallback(async () => {
    if (!event?.start) return;
    const ready = buildSubmissionEvent(event);
    if (!ready) {
      setError("Missing start time to save event");
      return;
    }

    try {
      const timezone =
        event.timezone ||
        Intl.DateTimeFormat().resolvedOptions().timeZone ||
        "UTC";

      // Create thumbnail if file is an image
      let thumbnail: string | undefined;
      let attachment:
        | { name: string; type: string; dataUrl: string }
        | undefined;
      if (uploadedFile && uploadedFile.type.startsWith("image/")) {
        try {
          thumbnail =
            (await createThumbnailDataUrl(uploadedFile, 1200, 0.85)) ||
            undefined;
          const dataUrl = await readFileAsDataUrl(uploadedFile);
          attachment = {
            name: uploadedFile.name,
            type: uploadedFile.type,
            dataUrl,
          };
        } catch (err) {
          console.error("Failed to create thumbnail:", err);
        }
      }

      const payload: any = {
        title: event.title || "Event",
        data: {
          category: ocrCategory || undefined,
          startISO: ready.start,
          endISO: ready.end,
          location: ready.location || undefined,
          description: event.description || undefined,
          rsvp: event.rsvp || undefined,
          timezone,
          numberOfGuests: event.numberOfGuests || 0,
          reminders: event.reminders || undefined,
          createdVia: "ocr",
          thumbnail,
          attachment,
        },
      };

      const historyRes = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const historyData: any = await historyRes.json().catch(() => ({}));
      const eventId = (historyData as any)?.id as string | undefined;
      const savedTitle =
        typeof historyData?.title === "string"
          ? (historyData.title as string)
          : undefined;

      // Emit event for sidebar refresh
      if (eventId && typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("history:created", {
            detail: {
              id: eventId,
              title: historyData?.title || payload.title,
              created_at: historyData?.created_at || new Date().toISOString(),
              start: ready.start,
              category: ocrCategory || null,
              data: payload.data,
            },
          })
        );
      }

      // Navigate to event page if saved successfully
      if (eventId) {
        const eventTitle = savedTitle || payload.title;
        resetForm();
        router.push(buildEventPath(eventId, eventTitle, { created: true }));
      } else {
        resetForm();
      }
    } catch (err: any) {
      console.error("Failed to save event:", err);
      setError(err?.message || "Failed to save event. Please try again.");
    }
  }, [
    event,
    buildSubmissionEvent,
    setError,
    resetForm,
    uploadedFile,
    ocrCategory,
    router,
  ]);

  useEffect(() => {
    // Touch the session so provider connections hydrate promptly
  }, [session]);

  const showScanSection = Boolean(
    error || loading || scanStatus !== "idle" || (modalOpen && event)
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 1023px)");
    const handler = () => {};
    media.addEventListener("change", handler);
    return () => {
      media.removeEventListener("change", handler);
    };
  }, []);

  const showSoftPrompt =
    isSignedIn &&
    !visibilityLoading &&
    !onboardingRequired &&
    !onboardingCompleted &&
    !promptDismissedAt &&
    !softPromptDismissed;

  const handleDismissPrompt = useCallback(async () => {
    try {
      await fetch("/api/user/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "dismiss_prompt" }),
      });
    } catch {
      // ignore network errors for dismiss
    } finally {
      setSoftPromptDismissed(true);
      void refreshVisibility();
    }
  }, [refreshVisibility]);

  const handleOnboardingComplete = useCallback(async () => {
    setOnboardingModalOpen(false);
    await refreshVisibility();
  }, [refreshVisibility]);

  return (
    <main className="relative flex min-h-[100dvh] w-full flex-col items-center bg-gradient-to-b from-[#F8F5FF] via-white to-white px-3 pb-20 pt-2 text-foreground md:px-8 md:pt-16">
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
      {/* Welcome message */}
      {isSignedIn && (
        <div className="w-full max-w-6xl mb-8 flex flex-col items-start gap-4 md:mb-10 mt-0">
          <div className="flex flex-col items-start text-left pt-10">
            <div
              className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight"
              style={{
                fontFamily: '"Venturis ADF", "Venturis ADF Fallback", serif',
              }}
            >
              <span className="text-[#1b1540]">Welcome Back,</span>
              <br />
              <span className="text-[#7F8CFF] italic">
                {(session?.user?.name as string) ||
                  (session?.user?.email as string)?.split("@")[0] ||
                  "there"}
              </span>
            </div>
            <p className="text-lg sm:text-xl md:text-xl text-[#1b1540] mt-2">
              Let's create something unforgettable.
            </p>
          </div>
        </div>
      )}
      {isSignedIn && (
        <div className="w-full max-w-6xl mb-6 flex flex-col gap-6 md:mb-8 md:gap-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            <SnapHero onSnap={openCamera} className="h-full" />
            <UploadHero onUpload={openUpload} className="h-full" />
            <SmartSignupHero className="h-full" />
          </div>
          {moduleOrder.map((section: (typeof moduleOrder)[number]) => {
            if (section === "milestones") {
              return (
                <EnvitefyBuilderHero
                  key={section}
                  allowedHrefs={visibleTemplateHrefs}
                />
              );
            }
            if (section === "sports") {
              return (
                <SportsPracticeHero
                  key={section}
                  allowedHrefs={visibleTemplateHrefs}
                />
              );
            }
            return (
              <AppointmentsGeneralHero
                key={section}
                allowedHrefs={visibleTemplateHrefs}
              />
            );
          })}
          <UpcomingEventsPanel items={upcomingEvents} />
        </div>
      )}
      {scanStatus !== "idle" && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-[#120b1e]/55 p-4 backdrop-blur-sm">
          <div role="status" aria-live="polite" className="w-full max-w-md">
            <SnapProcessingCard
              status={scanStatus}
              progress={uploadProgress}
              previewUrl={previewUrl}
              previewKind={previewKind}
              onCancel={resetForm}
            />
          </div>
        </div>
      )}

      {showScanSection && (
        <section id="scan" className="mt-12 w-full max-w-4xl space-y-5">
          <div className="space-y-3">
            {error && (
              <div className="rounded border border-error bg-surface/90 p-3 text-sm text-error">
                {error}
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
            addAppleCalendar={addAppleCalendar}
            buildSubmissionEvent={buildSubmissionEvent}
            setError={setError}
            saveToEnvitefy={saveToEnvitefy}
            resetForm={resetForm}
          />
        </section>
      )}
      <OnboardingModal
        open={onboardingModalOpen}
        visibleTemplateKeys={visibleTemplateKeys}
        required={onboardingRequired}
        onClose={() => {
          if (!onboardingRequired) setOnboardingModalOpen(false);
        }}
        onComplete={handleOnboardingComplete}
      />
      <OnboardingPromptPopup
        open={showSoftPrompt && !onboardingModalOpen}
        onStart={() => setOnboardingModalOpen(true)}
        onDismiss={handleDismissPrompt}
      />
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
  addAppleCalendar?: () => void;
  buildSubmissionEvent: (input: EventFields) => any;
  setError: (error: string | null) => void;
  saveToEnvitefy: () => void;
  resetForm: () => void;
};

type OnboardingModalProps = {
  open: boolean;
  required: boolean;
  visibleTemplateKeys: TemplateKey[];
  onClose: () => void;
  onComplete: () => void;
};

function OnboardingModal({
  open,
  required,
  visibleTemplateKeys,
  onClose,
  onComplete,
}: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<TemplateKey[]>(
    visibleTemplateKeys.length > 0 ? visibleTemplateKeys : [...TEMPLATE_KEYS]
  );

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setSelectedKeys(
      visibleTemplateKeys.length > 0 ? visibleTemplateKeys : [...TEMPLATE_KEYS]
    );
  }, [open, visibleTemplateKeys]);

  if (!open) return null;

  const save = async () => {
    if (!selectedKeys.length) return;
    setSaving(true);
    try {
      const res = await fetch("/api/user/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "complete",
          persona: "general",
          personas: ["general"],
          visibleTemplateKeys: selectedKeys,
        }),
      });
      if (!res.ok) throw new Error("Failed to save onboarding");
      onComplete();
    } catch (err) {
      console.error("[onboarding] save failed", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-[#e2dafb] bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7F8CFF]">
              Onboarding
            </p>
            <h2 className="text-2xl font-semibold text-[#1b1540]">
              Personalize your workspace
            </h2>
          </div>
          {!required && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#e6ddff] px-3 py-1 text-sm"
            >
              Close
            </button>
          )}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-[#4f456f]">
              Step 1: Choose the features you want visible.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {TEMPLATE_DEFINITIONS.map((item) => {
                const checked = selectedKeys.includes(item.key);
                return (
                  <label
                    key={item.key}
                    className="flex items-center gap-3 rounded-xl border border-[#ebe6fb] px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setSelectedKeys((prev) => {
                          if (e.target.checked) {
                            if (prev.includes(item.key)) return prev;
                            return [...prev, item.key];
                          }
                          return prev.filter((k) => k !== item.key);
                        });
                      }}
                    />
                    <span>{item.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-[#4f456f]">
              Step 2: Confirm and apply your feature visibility.
            </p>
            <p className="text-sm text-[#1b1540]">
              You can update this anytime in Settings.
            </p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => (s === 1 ? 1 : ((s - 1) as 1 | 2)))}
            className="rounded-lg border border-[#e6ddff] px-3 py-1.5 text-sm"
            disabled={step === 1 || saving}
          >
            Back
          </button>
          {step < 2 ? (
            <button
              type="button"
              onClick={() => setStep((s) => ((s + 1) as 1 | 2))}
              disabled={step === 1 && selectedKeys.length === 0}
              className="rounded-lg bg-[#7F8CFF] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={save}
              disabled={saving || selectedKeys.length === 0}
              className="rounded-lg bg-[#7F8CFF] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Finish"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function UpcomingEventsPanel({ items }: { items: UpcomingItem[] }) {
  if (!items.length) return null;
  return (
    <section className="rounded-3xl border border-[#e7defb] bg-white/80 p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-[#1b1540]">Upcoming events</h3>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/event/${item.id}`}
            className="flex items-center justify-between rounded-xl border border-[#f1edff] bg-white px-3 py-2 text-sm hover:bg-[#faf8ff]"
          >
            <span className="font-medium text-[#2f1d47]">{item.title}</span>
            <span className="text-[#6b5c9a]">
              {new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              }).format(new Date(item.start))}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function OnboardingPromptPopup({
  open,
  onStart,
  onDismiss,
}: {
  open: boolean;
  onStart: () => void;
  onDismiss: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[79] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-[#e2dafb] bg-white p-6 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7F8CFF]">
          Quick Setup
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-[#1b1540]">
          Personalize your workspace
        </h3>
        <p className="mt-3 text-sm text-[#4f456f]">
          Select the event features you want visible, and we will personalize
          create menus and dashboard sections.
        </p>
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg border border-[#d8d2ef] px-3 py-1.5 text-sm font-semibold text-[#4a406b]"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={onStart}
            className="rounded-lg bg-[#7F8CFF] px-3 py-1.5 text-sm font-semibold text-white"
          >
            Start onboarding
          </button>
        </div>
      </div>
    </div>
  );
}

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
  addAppleCalendar,
  buildSubmissionEvent,
  setError,
  saveToEnvitefy,
  resetForm,
}: SnapEventModalProps) {
  const router = useRouter();
  const [isAppleDevice, setIsAppleDevice] = useState(false);
  const [connectedCalendars, setConnectedCalendars] = useState<{
    google: boolean;
    microsoft: boolean;
    apple: boolean;
  }>({
    google: connected.google,
    microsoft: connected.microsoft,
    apple: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const nav = window.navigator;
    const ua = nav.userAgent || (nav as any).vendor || "";
    const uaLower = ua.toLowerCase();
    const platform = (nav.platform || "").toLowerCase();
    const maxTouchPoints =
      typeof nav.maxTouchPoints === "number" ? nav.maxTouchPoints : 0;

    // First, check if it's clearly NOT an Apple device - exclude these explicitly
    const isNotApple =
      uaLower.includes("android") ||
      uaLower.includes("windows") ||
      uaLower.includes("linux") ||
      uaLower.includes("cros") || // Chrome OS
      uaLower.includes("x11") || // Unix-like systems
      platform.includes("win") ||
      platform.includes("linux") ||
      platform.includes("android");

    if (isNotApple) {
      setIsAppleDevice(false);
      return;
    }

    // Detect iPad (including iPadOS)
    // iPadOS 13+ reports as "MacIntel" but has touch support
    const isIpadLike =
      uaLower.includes("ipad") ||
      platform === "ipad" ||
      (platform === "macintel" && maxTouchPoints > 1);

    // Detect iPhone/iPod Touch (strict iOS check)
    const isIOS =
      /iPhone|iPod/.test(ua) ||
      platform === "iphone" ||
      uaLower.includes("iphone") ||
      uaLower.includes("ipod");

    // Detect macOS (but exclude touch-enabled Macs which are actually iPads)
    const isMacOS =
      (/Mac OS X|Macintosh/.test(ua) ||
        platform.startsWith("mac") ||
        platform === "macintel") &&
      !isIpadLike; // Exclude touch-enabled Macs that are actually iPads

    // Only set to true if it's definitively an Apple device
    const isApple = isIOS || isIpadLike || isMacOS;

    setIsAppleDevice(isApple);
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

  // Fetch connected calendars when modal opens
  useEffect(() => {
    if (!open) return;
    const fetchConnected = async () => {
      try {
        const res = await fetch("/api/calendars", { credentials: "include" });
        const data = await res.json();
        setConnectedCalendars({
          google: Boolean(data?.google),
          microsoft: Boolean(data?.microsoft),
          apple: Boolean(data?.apple),
        });
      } catch (err) {
        console.error("Failed to fetch connected calendars:", err);
      }
    };
    fetchConnected();

    // Refresh connection status when window regains focus (after OAuth)
    const handleFocus = () => {
      fetchConnected();
    };
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [open]);

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
    <div className="fixed inset-0 z-[70] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-3 sm:p-5 md:px-8">
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#2f1d47]/62 via-[#3c2b5f]/58 to-[#2d2346]/62 backdrop-blur-xl"
          onClick={onClose}
        />

        <div
          className="relative z-10 w-full max-w-3xl h-[90dvh] max-h-[90dvh] rounded-[32px] border border-[#ddd5f6] bg-gradient-to-bl from-[#f3efff] via-[#ffffff] to-[#f7f3ff] shadow-[0_25px_60px_rgba(101,67,145,0.20)] backdrop-blur-2xl overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex h-full flex-col">
            <div className="sticky top-0 z-20 flex items-start justify-between gap-4 border-b border-[#e3dbf8] bg-gradient-to-r from-[#ffffff]/95 via-[#f4efff]/92 to-[#ffffff]/90 backdrop-blur-xl px-5 py-4 sm:px-7">
              <div className="flex-1 pt-1">
                <h2
                  className="text-lg sm:text-2xl font-semibold text-[#3e2f68] mb-1 tracking-tight"
                  style={{ fontFamily: '"Venturis ADF", "Venturis ADF Fallback", serif' }}
                >
                  Review Event Details
                </h2>
                <p className="text-sm text-[#7f73a9] leading-relaxed">
                  Tweak anything before you save or send to a calendar.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close event editor"
                className="rounded-2xl border border-[#ddd5f6] bg-white/90 hover:bg-[#f7f3ff] shadow-sm hover:shadow-md transition-all p-2.5 text-[#7f73a9] hover:text-[#3e2f68] hover:scale-105"
                onClick={onClose}
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 px-5 py-6 sm:px-7 sm:py-7 space-y-6">
              <div className="space-y-2.5">
                <label
                  htmlFor="snap-event-title"
                  className="text-sm font-semibold text-[#43336d] block"
                >
                  Title
                </label>
                <input
                  id="snap-event-title"
                  className="w-full rounded-xl border border-[#d8d1f3] bg-white backdrop-blur-sm text-[#3f3269] px-4 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#bba9eb]/55 focus:border-[#a18ddf] shadow-sm hover:shadow-md focus:shadow-lg"
                  value={event.title}
                  onChange={(e) =>
                    updateEvent((current) => ({
                      ...current,
                      title: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
                <div className="space-y-2.5">
                  <label
                    htmlFor="snap-event-start"
                    className="text-sm font-semibold text-[#43336d] block"
                  >
                    Start
                  </label>
                  <input
                    id="snap-event-start"
                    className="w-full rounded-xl border border-[#d8d1f3] bg-white backdrop-blur-sm text-[#3f3269] px-4 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#bba9eb]/55 focus:border-[#a18ddf] shadow-sm hover:shadow-md focus:shadow-lg"
                    value={event.start || ""}
                    onChange={(e) => {
                      const value = e.target.value || null;
                      updateEvent((current) => ({ ...current, start: value }));
                    }}
                  />
                </div>
                <div className="space-y-2.5">
                  <label
                    htmlFor="snap-event-end"
                    className="text-sm font-semibold text-[#43336d] block"
                  >
                    End (optional)
                  </label>
                  <input
                    id="snap-event-end"
                    className="w-full rounded-xl border border-[#d8d1f3] bg-white backdrop-blur-sm text-[#3f3269] px-4 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#bba9eb]/55 focus:border-[#a18ddf] shadow-sm hover:shadow-md focus:shadow-lg"
                    value={event.end || ""}
                    onChange={(e) => {
                      const value = e.target.value || null;
                      updateEvent((current) => ({ ...current, end: value }));
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <label
                  htmlFor="snap-event-location"
                  className="text-sm font-semibold text-[#43336d] block"
                >
                  Location
                </label>
                <input
                  id="snap-event-location"
                  className="w-full rounded-xl border border-[#d8d1f3] bg-white backdrop-blur-sm text-[#3f3269] px-4 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#bba9eb]/55 focus:border-[#a18ddf] shadow-sm hover:shadow-md focus:shadow-lg"
                  value={event.location}
                  onChange={(e) =>
                    updateEvent((current) => ({
                      ...current,
                      location: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2.5">
                <label
                  htmlFor="snap-event-description"
                  className="text-sm font-semibold text-[#43336d] block"
                >
                  Description
                </label>
                <textarea
                  id="snap-event-description"
                  className="w-full rounded-xl border border-[#d8d1f3] bg-white backdrop-blur-sm text-[#3f3269] px-4 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#bba9eb]/55 focus:border-[#a18ddf] shadow-sm hover:shadow-md focus:shadow-lg resize-none"
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

              <div className="space-y-2.5">
                <label
                  htmlFor="snap-event-rsvp"
                  className="text-sm font-semibold text-[#43336d] block"
                >
                  RSVP (Phone or Email)
                </label>
                <input
                  id="snap-event-rsvp"
                  type="text"
                  inputMode="tel"
                  maxLength={64}
                  style={{ minWidth: "14ch" }}
                  className="w-full rounded-xl border border-[#d8d1f3] bg-white backdrop-blur-sm text-[#3f3269] px-4 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#bba9eb]/55 focus:border-[#a18ddf] shadow-sm hover:shadow-md focus:shadow-lg"
                  placeholder="e.g., RSVP: Taya 850-555-8888 or contact@example.com"
                  value={event.rsvp || ""}
                  onChange={(e) =>
                    updateEvent((current) => ({
                      ...current,
                      rsvp: e.target.value || null,
                    }))
                  }
                />
                <p className="text-xs text-[#8a7fb3] mt-1.5 pl-1">
                  Phone number or email for RSVP. Detected info is pre-filled.
                </p>
              </div>

              <div className="space-y-3">
                <span className="text-sm font-semibold text-[#43336d] block">
                  Reminders
                </span>
                <div className="space-y-3">
                  {(event.reminders || []).map((reminder, idx) => {
                    const dayOptions = [1, 2, 3, 7, 14, 30];
                    const currentDays = Math.max(
                      1,
                      Math.round((reminder.minutes || 0) / 1440) || 1
                    );
                    return (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <select
                          className="w-full sm:w-[240px] rounded-xl border border-[#d8d1f3] bg-white backdrop-blur-sm text-[#3f3269] px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#bba9eb]/55 focus:border-[#a18ddf] shadow-sm hover:shadow-md focus:shadow-lg"
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
                          className="self-start sm:self-auto rounded-xl border border-red-200/70 bg-red-50/80 hover:bg-red-100 px-3.5 py-2.5 text-sm text-red-700 hover:text-red-800 transition-all hover:border-red-300 hover:scale-105 shadow-sm"
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
                      className="rounded-xl border border-[#c8baf0] bg-[#f2edff] hover:bg-[#ebe3ff] px-4 py-2.5 text-sm text-[#6a58a8] font-semibold transition-all hover:border-[#b8a5ea] hover:scale-105 shadow-sm"
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

            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-7 sm:py-6 border-t border-[#e3dbf8] bg-gradient-to-r from-[#ffffff]/90 via-[#f5f1ff]/90 to-[#ffffff]/90 backdrop-blur-md">
              <div className="flex flex-wrap items-center gap-3">
                {connectedCalendars.google ? (
                  <button
                    type="button"
                    className="rounded-xl bg-[#8667d8] hover:bg-[#7657cb] px-5 py-3 text-sm text-white font-semibold shadow-lg shadow-[#8667d8]/30 flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-xl hover:shadow-[#8667d8]/40 hover:scale-105 active:scale-100"
                    onClick={addGoogle}
                  >
                    <span>Add to</span>
                    <CalendarIconGoogle className="h-5 w-5 text-white" />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="rounded-xl bg-[#8667d8] hover:bg-[#7657cb] px-5 py-3 text-sm text-white font-semibold shadow-lg shadow-[#8667d8]/30 flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-xl hover:shadow-[#8667d8]/40 hover:scale-105 active:scale-100"
                    onClick={connectGoogle}
                  >
                    <span>Connect to</span>
                    <CalendarIconGoogle className="h-5 w-5 text-white" />
                  </button>
                )}
                {connectedCalendars.microsoft ? (
                  <button
                    type="button"
                    className="rounded-xl bg-[#8667d8] hover:bg-[#7657cb] px-5 py-3 text-sm text-white font-semibold shadow-lg shadow-[#8667d8]/30 flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-xl hover:shadow-[#8667d8]/40 hover:scale-105 active:scale-100"
                    onClick={addOutlook}
                  >
                    <span>Add to</span>
                    <Image
                      src="/brands/microsoft-white.svg"
                      alt="Microsoft"
                      width={20}
                      height={20}
                    />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="rounded-xl bg-[#8667d8] hover:bg-[#7657cb] px-5 py-3 text-sm text-white font-semibold shadow-lg shadow-[#8667d8]/30 flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-xl hover:shadow-[#8667d8]/40 hover:scale-105 active:scale-100"
                    onClick={connectOutlook}
                  >
                    <span>Connect to</span>
                    <Image
                      src="/brands/microsoft-white.svg"
                      alt="Microsoft"
                      width={20}
                      height={20}
                    />
                  </button>
                )}
                {isAppleDevice && (
                  <button
                    type="button"
                    className="rounded-xl bg-[#8667d8] hover:bg-[#7657cb] px-5 py-3 text-sm text-white font-semibold shadow-lg shadow-[#8667d8]/30 flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-xl hover:shadow-[#8667d8]/40 hover:scale-105 active:scale-100"
                    onClick={addAppleCalendar || dlIcs}
                  >
                    <span>Add to</span>
                    <Image
                      src="/brands/apple-white.svg"
                      alt="Apple"
                      width={20}
                      height={20}
                    />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={!event?.start}
                  className="rounded-xl bg-[#8667d8] hover:bg-[#7657cb] px-5 py-3 text-sm text-white font-semibold shadow-lg shadow-[#8667d8]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-xl hover:shadow-[#8667d8]/40 hover:scale-105 active:scale-100"
                  onClick={saveToEnvitefy}
                >
                  <span>Save to Envitefy</span>
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-[#d8d1f3] bg-white/90 hover:bg-[#f4efff] backdrop-blur-sm px-5 py-3 text-sm text-[#4b3f72] font-semibold transition-all hover:border-[#c7b9ed] hover:scale-105 active:scale-100 shadow-sm"
                  onClick={onClose}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
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
  ctaLabel,
  ctaColor,
  onClick,
}: {
  href?: string;
  title: string;
  artwork: ReactNode;
  details?: string[];
  tone?: HighlightTone;
  ctaLabel?: string;
  ctaColor?: string;
  onClick?: () => void;
}) {
  const toneClass = TONE_STYLES[tone] ?? TONE_STYLES.primary;
  const [showDetails, setShowDetails] = useState(false);
  const buttonLabel = ctaLabel ?? title;

  const iconWrapperClass = [
    "mx-auto flex h-28 w-28 items-center justify-center rounded-3xl border border-dashed bg-white/90 text-foreground/80 shadow-inner transition group-hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80",
    toneClass.iconBg,
  ]
    .filter(Boolean)
    .join(" ");

  const description = details?.length ? (
    <div className="space-y-1 text-sm leading-relaxed text-muted-foreground">
      {details.map((item, index) => (
        <p key={`${title}-${index}`}>{item}</p>
      ))}
    </div>
  ) : null;

  const buttonClass =
    "inline-flex items-center justify-center rounded-full px-6 py-2 text-center text-xs font-semibold uppercase tracking-wide text-white whitespace-nowrap shadow-[0_12px_30px_rgba(15,23,42,0.35)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(15,23,42,0.45)] focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus:outline-none disabled:opacity-70";

  const buttonStyle = { backgroundColor: ctaColor ?? toneClass.accent };

  const cardSurfaceStyle: CSSProperties = {
    borderColor: toneClass.accent,
    background: toneClass.cardSurface,
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    transform: "translateZ(0)",
  };

  const handlePrimaryAction = (
    event: MouseEvent<HTMLButtonElement | HTMLAnchorElement>
  ) => {
    event.stopPropagation();
    if (showDetails) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onClick?.();
  };

  const cta = href ? (
    <Link
      href={href}
      className={buttonClass}
      style={buttonStyle}
      onClick={handlePrimaryAction}
      tabIndex={showDetails ? -1 : undefined}
    >
      {buttonLabel}
    </Link>
  ) : (
    <button
      type="button"
      onClick={handlePrimaryAction}
      className={buttonClass}
      style={buttonStyle}
      tabIndex={showDetails ? -1 : undefined}
    >
      {buttonLabel}
    </button>
  );

  const openDetails = () => setShowDetails(true);

  const handleFrontCardClick = () => {
    if (!showDetails) {
      openDetails();
    }
  };

  const handleInfoPointer = (
    event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    openDetails();
  };

  const handleInfoKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      handleInfoPointer(event);
    }
  };

  const closeDetails = (
    event?: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>
  ) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setShowDetails(false);
  };

  const baseCardClass =
    "group relative flex h-full flex-col overflow-hidden rounded-[32px] border text-foreground shadow-[0_25px_80px_rgba(15,13,9,0.35)] ring-1 ring-black/5 backdrop-blur-sm";

  const frontCard = (
    <article
      className={baseCardClass}
      style={cardSurfaceStyle}
      onClick={handleFrontCardClick}
    >
      <button
        type="button"
        aria-label="Show details"
        className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-white/70 text-foreground/60 transition hover:border-white hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        onClick={handleInfoPointer}
        onKeyDown={handleInfoKeyDown}
      >
        <FlipHintIcon className="h-4 w-4" />
      </button>
      <div className="flex flex-1 flex-col items-center gap-5 px-6 pb-4 pt-8 text-center">
        {href ? (
          <Link
            href={href}
            className={iconWrapperClass}
            style={{ borderColor: toneClass.accent }}
            onClick={handlePrimaryAction}
            tabIndex={showDetails ? -1 : undefined}
            aria-label={buttonLabel}
          >
            <div className="w-20">{artwork}</div>
          </Link>
        ) : (
          <button
            type="button"
            className={iconWrapperClass}
            style={{ borderColor: toneClass.accent }}
            onClick={handlePrimaryAction}
            tabIndex={showDetails ? -1 : undefined}
            aria-label={buttonLabel}
          >
            <div className="w-20">{artwork}</div>
          </button>
        )}
        <div className="flex flex-col items-center gap-3">
          <h2
            className="text-base font-semibold leading-tight tracking-[-0.02em] text-foreground sm:text-xl sm:tracking-tight whitespace-nowrap"
            style={{
              fontFamily: '"Venturis ADF", "Venturis ADF Fallback", serif',
            }}
          >
            {title}
          </h2>
        </div>
      </div>
      <div className="flex items-center justify-center border-t border-white/50 bg-white/40 px-6 py-4">
        {cta}
      </div>
    </article>
  );

  const backCard = (
    <article
      className={baseCardClass}
      style={cardSurfaceStyle}
      role="button"
      tabIndex={0}
      onClick={closeDetails}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          closeDetails(event);
        }
      }}
    >
      <button
        type="button"
        aria-label="Hide details"
        className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-white/70 text-foreground/60 transition hover:border-white hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        onClick={closeDetails}
      >
        <CloseIcon className="h-4 w-4" />
      </button>
      <div className="flex flex-1 flex-col items-center gap-4 px-6 pb-4 pt-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <h2
            className="text-base font-semibold leading-tight tracking-[-0.02em] text-foreground sm:text-xl sm:tracking-tight whitespace-nowrap"
            style={{
              fontFamily: '"Venturis ADF", "Venturis ADF Fallback", serif',
            }}
          >
            {title}
          </h2>
          {description}
        </div>
      </div>
    </article>
  );

  return (
    <div className="relative h-full w-full [perspective:2000px]">
      <div
        className="relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]"
        style={{
          transform: showDetails ? "rotateY(180deg)" : "rotateY(0deg)",
          willChange: "transform",
        }}
      >
        <div
          className="relative h-full w-full"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            pointerEvents: showDetails ? "none" : "auto",
          }}
        >
          {frontCard}
        </div>
        <div
          className="absolute inset-0 h-full w-full"
          style={{
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            pointerEvents: showDetails ? "auto" : "none",
          }}
        >
          {backCard}
        </div>
      </div>
    </div>
  );
}
