"use client";

import {
  useCallback,
  useEffect,
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
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [event, setEvent] = useState<EventFields | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setOcrText] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [ocrCategory, setOcrCategory] = useState<string | null>(null);

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

  const router = useRouter();
  const openCreateEvent = useCallback(() => {
    try {
      router.push("/event/new");
    } catch {}
  }, [router]);

  const resetForm = useCallback(() => {
    setEvent(null);
    setModalOpen(false);
    setError(null);
    setOcrText("");
    setUploadedFile(null);
    setOcrCategory(null);
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
      setEvent(adjusted);
      setModalOpen(Boolean(adjusted));
      setOcrText(data.ocrText || "");
      setUploadedFile(fileToUpload);
      setOcrCategory(data?.category || null);
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

  const showScanSection = Boolean(error || loading || (modalOpen && event));

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 1023px)");
    const handler = () => {};
    media.addEventListener("change", handler);
    return () => {
      media.removeEventListener("change", handler);
    };
  }, []);

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
          <EnvitefyBuilderHero />
          <SportsPracticeHero />
          <AppointmentsGeneralHero />
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
            addAppleCalendar={addAppleCalendar}
            buildSubmissionEvent={buildSubmissionEvent}
            setError={setError}
            saveToEnvitefy={saveToEnvitefy}
            resetForm={resetForm}
          />
        </section>
      )}
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:py-10 md:px-8">
      <div
        className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70 backdrop-blur-lg transition-opacity"
        onClick={onClose}
      />
      <div
        className="relative z-10 flex w-full max-w-3xl max-h-[calc(100vh-2rem)] sm:max-h-[85vh] flex-col gap-6 overflow-hidden rounded-2xl border-2 border-white/20 bg-gradient-to-br from-surface via-surface to-surface-alt/50 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] p-8"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset",
        }}
      >
        <div className="flex items-start justify-between gap-4 shrink-0 pb-4 border-b-2 border-border/30 bg-gradient-to-r from-transparent via-white/5 to-transparent">
          <div className="flex-1 pt-1">
            <h2 className="text-2xl font-bold text-foreground mb-1.5 tracking-tight">
              Review Event Details
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Make any tweaks before sending it to your calendar.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close event editor"
            className="rounded-xl border-2 border-border/40 bg-white/50 hover:bg-white/80 backdrop-blur-sm transition-all p-2.5 text-foreground/80 hover:text-foreground hover:border-border hover:scale-105 shrink-0 shadow-sm"
            onClick={onClose}
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-6 overflow-y-auto pr-2 min-h-0 flex-1 scrollbar-thin scrollbar-thumb-border/40 scrollbar-track-transparent">
          <div className="space-y-2.5">
            <label
              htmlFor="snap-event-title"
              className="text-sm font-semibold text-foreground block"
            >
              Title
            </label>
            <input
              id="snap-event-title"
              className="w-full rounded-xl border-2 border-border/50 bg-white/60 backdrop-blur-sm text-foreground px-4 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary shadow-sm hover:shadow-md focus:shadow-lg focus:bg-white/80"
              value={event.title}
              onChange={(e) =>
                updateEvent((current) => ({
                  ...current,
                  title: e.target.value,
                }))
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2.5">
              <label
                htmlFor="snap-event-start"
                className="text-sm font-semibold text-foreground block"
              >
                Start
              </label>
              <input
                id="snap-event-start"
                className="w-full rounded-xl border-2 border-border/50 bg-white/60 backdrop-blur-sm text-foreground px-4 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary shadow-sm hover:shadow-md focus:shadow-lg focus:bg-white/80"
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
                className="text-sm font-semibold text-foreground block"
              >
                End (optional)
              </label>
              <input
                id="snap-event-end"
                className="w-full rounded-xl border-2 border-border/50 bg-white/60 backdrop-blur-sm text-foreground px-4 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary shadow-sm hover:shadow-md focus:shadow-lg focus:bg-white/80"
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
              className="text-sm font-semibold text-foreground block"
            >
              Location
            </label>
            <input
              id="snap-event-location"
              className="w-full rounded-xl border-2 border-border/50 bg-white/60 backdrop-blur-sm text-foreground px-4 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary shadow-sm hover:shadow-md focus:shadow-lg focus:bg-white/80"
              value={event.location}
              onChange={(e) =>
                updateEvent((current) => ({
                  ...current,
                  location: e.target.value,
                }))
              }
            />
          </div>

          {/* Number of guests field removed - not needed for scanned events */}

          <div className="space-y-2.5">
            <label
              htmlFor="snap-event-description"
              className="text-sm font-semibold text-foreground block"
            >
              Description
            </label>
            <textarea
              id="snap-event-description"
              className="w-full rounded-xl border-2 border-border/50 bg-white/60 backdrop-blur-sm text-foreground px-4 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary shadow-sm hover:shadow-md focus:shadow-lg focus:bg-white/80 resize-none"
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
              className="text-sm font-semibold text-foreground block"
            >
              RSVP (Phone or Email)
            </label>
            <input
              id="snap-event-rsvp"
              type="text"
              className="w-1/3 rounded-xl border-2 border-border/50 bg-white/60 backdrop-blur-sm text-foreground px-4 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary shadow-sm hover:shadow-md focus:shadow-lg focus:bg-white/80 placeholder:text-muted-foreground/50"
              placeholder="e.g., RSVP: Taya 850-555-8888 or contact@example.com"
              value={event.rsvp || ""}
              onChange={(e) =>
                updateEvent((current) => ({
                  ...current,
                  rsvp: e.target.value || null,
                }))
              }
            />
            <p className="text-xs text-muted-foreground/70 mt-1.5 pl-1">
              Phone number or email for RSVP. If detected from scan, it will be
              filled automatically.
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-sm font-semibold text-foreground block">
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
                  <div key={idx} className="flex items-center gap-3">
                    <select
                      className="w-1/3 rounded-xl border-2 border-border/50 bg-white/60 backdrop-blur-sm text-foreground px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary shadow-sm hover:shadow-md focus:shadow-lg focus:bg-white/80"
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
                      className="rounded-xl border-2 border-red-200/60 bg-red-50/60 hover:bg-red-100/80 px-3.5 py-2.5 text-sm text-red-700 hover:text-red-800 transition-all hover:border-red-300 hover:scale-105 shadow-sm"
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
                  className="rounded-xl border-2 border-primary/40 bg-primary/10 hover:bg-primary/20 px-4 py-2.5 text-sm text-primary font-semibold transition-all hover:border-primary/60 hover:scale-105 shadow-sm"
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

        <div className="flex flex-wrap items-center justify-between gap-4 pt-5 shrink-0 border-t-2 border-border/30 bg-gradient-to-r from-transparent via-white/5 to-transparent">
          <div className="flex flex-wrap items-center gap-3">
            {connectedCalendars.google ? (
              <button
                type="button"
                className="rounded-xl bg-primary hover:bg-primary/90 px-5 py-3 text-sm text-white font-semibold shadow-lg shadow-primary/30 flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-xl hover:shadow-primary/40 hover:scale-105 active:scale-100"
                onClick={addGoogle}
              >
                <span>Add to</span>
                <CalendarIconGoogle className="h-5 w-5 text-white" />
              </button>
            ) : (
              <button
                type="button"
                className="rounded-xl bg-primary hover:bg-primary/90 px-5 py-3 text-sm text-white font-semibold shadow-lg shadow-primary/30 flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-xl hover:shadow-primary/40 hover:scale-105 active:scale-100"
                onClick={connectGoogle}
              >
                <span>Connect to</span>
                <CalendarIconGoogle className="h-5 w-5 text-white" />
              </button>
            )}
            {connectedCalendars.microsoft ? (
              <button
                type="button"
                className="rounded-xl bg-secondary hover:bg-secondary/90 px-5 py-3 text-sm text-white font-semibold shadow-lg shadow-secondary/30 flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-xl hover:shadow-secondary/40 hover:scale-105 active:scale-100"
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
                className="rounded-xl bg-secondary hover:bg-secondary/90 px-5 py-3 text-sm text-white font-semibold shadow-lg shadow-secondary/30 flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-xl hover:shadow-secondary/40 hover:scale-105 active:scale-100"
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
                className="rounded-xl bg-secondary hover:bg-secondary/90 px-5 py-3 text-sm text-white font-semibold shadow-lg shadow-secondary/30 flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-xl hover:shadow-secondary/40 hover:scale-105 active:scale-100"
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
              className="rounded-xl bg-secondary hover:bg-secondary/90 px-5 py-3 text-sm text-white font-semibold shadow-lg shadow-secondary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-xl hover:shadow-secondary/40 hover:scale-105 active:scale-100"
              onClick={saveToEnvitefy}
            >
              <span>Save to Envitefy</span>
            </button>
            <button
              type="button"
              className="rounded-xl border-2 border-border/50 bg-white/60 hover:bg-white/80 backdrop-blur-sm px-5 py-3 text-sm text-foreground font-semibold transition-all hover:border-border hover:scale-105 active:scale-100 shadow-sm"
              onClick={onClose}
            >
              Cancel
            </button>
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
