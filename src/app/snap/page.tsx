"use client";
import { useEffect, useRef, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import * as chrono from "chrono-node";
import { useTheme } from "../providers";
import Image from "next/image";
import Link from "next/link";
import Logo from "@/assets/logo.png";
import { preparePickedImage } from "@/utils/pickImage";

type EventFields = {
  title: string;
  start: string | null;
  end: string | null;
  location: string;
  description: string;
  timezone: string;
  reminders?: { minutes: number }[] | null;
};

export default function SnapPage() {
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
  const [credits, setCredits] = useState<number | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [bulkEvents, setBulkEvents] = useState<any[] | null>(null);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const flag = localStorage.getItem("welcomeAfterSignup");
        if (flag === "1") {
          setShowWelcome(true);
          localStorage.removeItem("welcomeAfterSignup");
        }
      }
    } catch {}
  }, []);
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
  // Load remaining credits (signed-in users)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/user/profile", { cache: "no-store" });
        if (!cancelled && res.ok) {
          const j = await res.json().catch(() => ({}));
          if (typeof (j as any)?.credits === "number") {
            setCredits((j as any).credits as number);
          }
        }
      } catch {}
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
  // Modal a11y + helpers
  const reviewModalRef = useRef<HTMLDivElement | null>(null);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  // Track first-open focus and original body overflow to avoid re-focusing on every state change
  const modalOpenedRef = useRef(false);
  const bodyOverflowOriginalRef = useRef<string | null>(null);
  // Location helpers
  const [placeSuggestions, setPlaceSuggestions] = useState<
    { label: string; lat: number; lon: number }[]
  >([]);
  const [selectedPlace, setSelectedPlace] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  useEffect(() => {
    try {
      const v = window.localStorage.getItem("appleLinked");
      if (v === "1") setAppleLinked(true);
    } catch {}
  }, []);
  useEffect(() => {
    const t = descriptionRef.current;
    if (!t) return;
    t.style.height = "auto";
    t.style.height = t.scrollHeight + "px";
  }, [event?.description]);
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
    // Only show the phone mockup on desktop (lg and up: >= 1024px)
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setShowPhoneMockup(mq.matches);
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

  // Lock body scroll while the review modal is open and focus first field only once on open
  useEffect(() => {
    try {
      if (event) {
        if (bodyOverflowOriginalRef.current === null) {
          bodyOverflowOriginalRef.current = document.body.style.overflow || "";
        }
        document.body.style.overflow = "hidden";
        if (!modalOpenedRef.current) {
          // Focus first field when modal opens (do not re-focus on subsequent edits)
          setTimeout(() => firstFieldRef.current?.focus(), 10);
          modalOpenedRef.current = true;
        }
      } else {
        if (bodyOverflowOriginalRef.current !== null) {
          document.body.style.overflow = bodyOverflowOriginalRef.current;
          bodyOverflowOriginalRef.current = null;
        }
        modalOpenedRef.current = false;
      }
    } catch {}
  }, [event]);

  // Modal focus trap + Esc to close
  useEffect(() => {
    if (!event) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setEvent(null);
        return;
      }
      if (e.key === "Tab") {
        const container = reviewModalRef.current;
        if (!container) return;
        const focusables = container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [event]);

  // Smart casing and apostrophes for title/location
  const toSmartApostrophes = (text: string) =>
    text.replace(/\b(\w+)'s\b/gi, (_, w) => `${w}’s`).replace(/'/g, "’");

  const titleCasePreserveAcronyms = (text: string) => {
    return text
      .toLowerCase()
      .split(/(\s+|[-–—]|\.|,)/)
      .map((part) => {
        if (!part || /\s|[-–—]|\.|,/.test(part)) return part;
        if (/^[A-Z0-9]{2,}$/.test(part)) return part; // already acronym
        if (/^[a-z0-9]{2,}$/.test(part))
          return part.charAt(0).toUpperCase() + part.slice(1);
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join("");
  };

  const normalizeCapsInput = (raw: string) => {
    if (!raw) return "";
    const mostlyCaps = /[A-Z]{3,}/.test(raw) && raw === raw.toUpperCase();
    const base = mostlyCaps ? titleCasePreserveAcronyms(raw) : raw;
    return toSmartApostrophes(base);
  };

  const resetForm = () => {
    setEvent(null);
    setBulkEvents(null);
    setOcrText("");
    setError(null);
    setFile(null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const redirectIfNoCredits = (): boolean => {
    try {
      if (typeof credits === "number" && credits <= 0) {
        window.location.href = "/subscription";
        return true;
      }
    } catch {}
    return false;
  };

  const onFile = async (f: File | null) => {
    if (redirectIfNoCredits()) return;
    // Always clear inputs so selecting the same file again triggers onChange
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!f) {
      setFile(null);
      return;
    }
    try {
      // Pass PDFs straight through; convert and downscale images
      if (/pdf/i.test(f.type)) {
        setFile(f);
        await ingest(f);
        return;
      }
      const prepared = await preparePickedImage(f, {
        maxSide: 2000,
        quality: 0.85,
      });
      setFile(prepared.file);
      await ingest(prepared.file);
    } catch {
      // Fallback to original if processing fails
      setFile(f);
      await ingest(f);
    }
  };

  const ingest = async (f?: File | null) => {
    const currentFile = f ?? file;
    if (!currentFile) return;
    setLoading(true);
    setError(null);
    const form = new FormData();
    form.append("file", currentFile);
    let res: Response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);
      res = await fetch("/api/ocr", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (e) {
      setError(
        "Upload failed. Please check your connection or try a different image."
      );
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
    const createThumbnailDataUrl = async (
      sourceFile: File,
      maxSize: number = 1024
    ): Promise<string | null> => {
      try {
        if (!sourceFile.type.startsWith("image/")) return null;
        const blobUrl = URL.createObjectURL(sourceFile);
        const img = document.createElement("img");
        const loaded: HTMLImageElement = await new Promise(
          (resolve, reject) => {
            img.onload = () => resolve(img);
            img.onerror = reject as any;
            img.src = blobUrl;
          }
        );
        const { width, height } = loaded;
        const scale = Math.min(1, maxSize / Math.max(width, height));
        const w = Math.max(1, Math.round(width * scale));
        const h = Math.max(1, Math.round(height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.drawImage(loaded, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/webp", 0.82);
        try {
          URL.revokeObjectURL(blobUrl);
        } catch {}
        return dataUrl;
      } catch {
        return null;
      }
    };
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
    // Prepare bulk events when provided by OCR schedule
    const normalizedBulk: any[] = Array.isArray((data as any).events)
      ? ((data as any).events as any[])
          .map((ev) => {
            try {
              const startIso = typeof ev.start === "string" ? ev.start : null;
              if (!startIso) return null;
              const endIso =
                (typeof ev.end === "string" && ev.end) ||
                new Date(
                  new Date(startIso).getTime() + 90 * 60 * 1000
                ).toISOString();
              return {
                title:
                  (ev.title as string) ||
                  (adjusted?.title as string) ||
                  "Event",
                start: startIso,
                end: endIso,
                allDay: Boolean(ev.allDay),
                timezone: (ev.timezone as string) || tz,
                location: (ev.location as string) || "",
                description:
                  (ev.description as string) || (data?.ocrText as string) || "",
                reminders: [{ minutes: 1440 }],
              } as any;
            } catch {
              return null;
            }
          })
          .filter(Boolean)
      : [];
    setBulkEvents(normalizedBulk.length > 1 ? normalizedBulk : null);
    setEvent(adjusted);
    // Save history for authenticated users (server will associate user if signed in)
    try {
      const thumbnail = await createThumbnailDataUrl(currentFile).catch(
        () => null
      );
      const baseData = adjusted || data?.fieldsGuess || null;
      const category = (data && (data as any).category) || null;
      // Also keep original ISO datetimes for future filtering
      const startISO = (data?.fieldsGuess?.start as string | null) || null;
      const endISO = (data?.fieldsGuess?.end as string | null) || null;
      const payload = {
        title:
          (adjusted && adjusted.title) || data?.fieldsGuess?.title || "Event",
        data: baseData
          ? { ...baseData, thumbnail, category, startISO, endISO }
          : { thumbnail, category, startISO, endISO },
      };
      const r = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => ({}));
      // Optionally expose the new id to enable share link in-session later
      (window as any).__lastEventId = j?.id;
      try {
        const createdId = (j as any)?.id;
        const createdTitle = (j as any)?.title || payload.title;
        const createdAt = (j as any)?.created_at || new Date().toISOString();
        const createdStart =
          (j as any)?.data?.start || (payload as any)?.data?.start || null;
        if (createdId && typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("history:created", {
              detail: {
                id: createdId,
                title: createdTitle,
                created_at: createdAt,
                start: createdStart,
              },
            })
          );
        }
      } catch {}
    } catch {}
    setOcrText(data.ocrText || "");
    setLoading(false);
  };

  const openCamera = () => {
    if (redirectIfNoCredits()) return;
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    cameraInputRef.current?.click();
  };
  const openUpload = () => {
    if (redirectIfNoCredits()) return;
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

  // Autocomplete places (OSM Nominatim)
  useEffect(() => {
    const q = (event?.location || "").trim();
    if (!event || q.length < 3) {
      setPlaceSuggestions([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(
            q
          )}`,
          {
            headers: { "Accept-Language": navigator.language || "en" },
            signal: ctrl.signal,
          }
        );
        const data: any[] = await res.json();
        const mapped = (data || []).map((d) => ({
          label: d.display_name as string,
          lat: Number(d.lat),
          lon: Number(d.lon),
        }));
        setPlaceSuggestions(mapped);
      } catch {}
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [event?.location]);

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
    // Prefer the consumer Outlook host to avoid sign-in loops on personal accounts.
    // Microsoft docs: use outlook.live.com for Outlook.com (MSA) and outlook.office.com for Microsoft 365 (AAD).
    // The live.com host will redirect appropriately for many org accounts as well.
    return `https://outlook.live.com/calendar/0/deeplink/compose?${q}`;
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
    // If we already have an event, carry it through OAuth so the callback can create it
    let url = "/api/google/auth";
    try {
      if (event) {
        const ready = buildSubmissionEvent(event);
        if (ready) {
          let state = "";
          try {
            state = btoa(encodeURIComponent(JSON.stringify(ready)));
          } catch {}
          url = `/api/google/auth?consent=1${
            state ? `&state=${encodeURIComponent(state)}` : ""
          }`;
        }
      }
    } catch {}
    window.location.href = url;
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
          // On Android, loading the Calendar event link directly will hand off to the app
          // when installed. If not installed, fall back to Play Store after a short delay.
          const fallback = setTimeout(() => {
            try {
              if (document.visibilityState === "visible") {
                window.location.assign(play);
              }
            } catch {}
          }, 1200);
          try {
            window.location.assign(htmlLink);
          } finally {
            setTimeout(() => clearTimeout(fallback), 2000);
          }
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
        // Prefer native Outlook when available, else fall back to web
        if (isIOS || isAndroid) {
          // On mobile, Outlook supports universal links and will usually capture the webLink
          window.location.assign(webLink);
          return;
        }
        // Desktop (macOS/Windows): try to open native Outlook, else open web
        const openWeb = () => window.open(webLink, "_blank");
        const trySchemeViaIframe = (uri: string, onFail: () => void) => {
          const failTimer = setTimeout(() => {
            try {
              if (document.visibilityState === "visible") onFail();
            } finally {
              clearTimeout(failTimer);
            }
          }, 900);
          try {
            const iframe = document.createElement("iframe");
            iframe.style.display = "none";
            iframe.src = uri;
            document.body.appendChild(iframe);
            setTimeout(() => {
              try {
                document.body.removeChild(iframe);
              } catch {}
            }, 1200);
          } catch {
            onFail();
          }
        };
        if (isWindows) {
          // Windows: try legacy and modern schemes
          trySchemeViaIframe("outlook://", () => {
            trySchemeViaIframe("ms-outlook://", openWeb);
          });
        } else {
          // macOS: try scheme and then fall back to web
          try {
            const t = setTimeout(openWeb, 700);
            window.location.href = "ms-outlook://";
            setTimeout(() => {
              try {
                if (document.visibilityState === "visible") openWeb();
              } finally {
                clearTimeout(t);
              }
            }, 1200);
          } catch {
            openWeb();
          }
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

  // ---------- Bulk actions ----------
  const addGoogleBulk = async () => {
    const list = Array.isArray(bulkEvents) ? bulkEvents : [];
    if (!list.length) return;
    try {
      const res = await fetch("/api/events/google/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ events: list }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((j as any).error || "Failed to add events to Google");
        return;
      }
      window.alert("Google: bulk events processed. Check your calendar.");
    } catch {
      setError("Failed to add events to Google");
    }
  };

  const addOutlookBulk = async () => {
    const list = Array.isArray(bulkEvents) ? bulkEvents : [];
    if (!list.length) return;
    try {
      const res = await fetch("/api/events/outlook/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ events: list }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((j as any).error || "Failed to add events to Outlook");
        return;
      }
      window.alert("Outlook: bulk events processed. Check your calendar.");
    } catch {
      setError("Failed to add events to Outlook");
    }
  };

  const dlIcsBulk = async () => {
    const list = Array.isArray(bulkEvents) ? bulkEvents : [];
    if (!list.length) return;
    try {
      const res = await fetch("/api/events/ics/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: list, filename: "events" }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError((j as any).error || "Failed to generate ICS");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "events.ics";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        try {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch {}
      }, 500);
      try {
        window.localStorage.setItem("appleLinked", "1");
        setAppleLinked(true);
      } catch {}
    } catch {
      setError("Failed to generate ICS");
    }
  };

  // ---------- Open provider compose pages (one-by-one approvals) ----------
  const toGCalTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      const pad = (n: number) => String(n).padStart(2, "0");
      return (
        `${d.getUTCFullYear()}` +
        `${pad(d.getUTCMonth() + 1)}` +
        `${pad(d.getUTCDate())}` +
        "T" +
        `${pad(d.getUTCHours())}` +
        `${pad(d.getUTCMinutes())}` +
        `${pad(d.getUTCSeconds())}` +
        "Z"
      );
    } catch {
      return iso.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    }
  };

  const openGoogleDrafts = async () => {
    const list = Array.isArray(bulkEvents) ? bulkEvents : [];
    if (!list.length) return;
    if (
      !window.confirm(
        `We will open ${list.length} Google Calendar tabs for you to approve.`
      )
    )
      return;
    for (const ev of list) {
      const title = encodeURIComponent((ev.title as string) || "Event");
      const details = encodeURIComponent((ev.description as string) || "");
      const location = encodeURIComponent((ev.location as string) || "");
      let dates = "";
      if (ev.allDay) {
        const s = (ev.start as string).slice(0, 10).replace(/-/g, "");
        const e = (ev.end as string).slice(0, 10).replace(/-/g, "");
        dates = `${s}/${e}`;
      } else {
        dates = `${toGCalTimestamp(ev.start as string)}/${toGCalTimestamp(
          ev.end as string
        )}`;
      }
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dates}`;
      window.open(url, "_blank");
      await new Promise((r) => setTimeout(r, 350));
    }
  };

  const toOutlookParamIso = (iso: string): string => {
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

  const buildOutlookComposeFromNormalized = (ev: any) => {
    const q = new URLSearchParams({
      rru: "addevent",
      allday: String(Boolean(ev.allDay)),
      subject: (ev.title as string) || "Event",
      startdt: toOutlookParamIso(ev.start as string),
      enddt: toOutlookParamIso(ev.end as string),
      location: (ev.location as string) || "",
      body: (ev.description as string) || "",
      path: "/calendar/view/Month",
    }).toString();
    return `https://outlook.live.com/calendar/0/deeplink/compose?${q}`;
  };

  const openOutlookDrafts = async () => {
    const list = Array.isArray(bulkEvents) ? bulkEvents : [];
    if (!list.length) return;
    if (
      !window.confirm(
        `We will open ${list.length} Outlook compose tabs for you to approve.`
      )
    )
      return;
    for (const ev of list) {
      const url = buildOutlookComposeFromNormalized(ev);
      window.open(url, "_blank");
      await new Promise((r) => setTimeout(r, 350));
    }
  };

  return (
    <main className="min-h-screen w-full bg-background text-foreground landing-dark-gradient flex items-center justify-center p-6">
      <section className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
        <div className="order-2 lg:order-1 text-center lg:text-center">
          <Link
            href="/snap"
            className="flex items-center gap-4 mb-8 justify-center -mt-6 sm:mt-0 md:mt-4 lg:mt-0"
          >
            <Image
              src={Logo}
              alt="Snap My Date"
              width={64}
              height={64}
              className="drop-shadow-fore-subtle"
            />
            <span className="text-4xl sm:text-5xl md:text-6xl text-foreground">
              <span className="font-pacifico">Snap</span>
              <span> </span>
              <span className="font-montserrat font-semibold">My Date</span>
            </span>
          </Link>
          <p className="-mt-6 sm:-mt-2 md:mt-0 pb-4 text-sm sm:text-base text-foreground/70">
            From papers to reminders.
          </p>
          <div className="bg-gradient-to-tr from-fuchsia-500/20 via-sky-400/20 to-violet-500/20 rounded-3xl p-1 shadow-lg  ">
            <div className="rounded-3xl bg-surface/70 backdrop-blur-sm p-8 ring-1 ring-border">
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold leading-[1.05] tracking-tight text-foreground">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-sky-200 to-fuchsia-300">
                  Snap a flyer.
                </span>
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-sky-200 to-fuchsia-300">
                  Save the date.
                </span>
              </h1>
              <p className="mt-5 text-lg sm:text-xl text-foreground/80 max-w-2xl">
                Turn any flyer or appointment card into a calendar event in
                seconds. Works with Google, Apple, and Outlook Calendars.
              </p>

              {/* Credits pill */}
              <div className="mt-6 flex justify-center">
                <Link
                  href="/subscription"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 text-foreground/90 text-xs px-3 py-1.5 hover:bg-surface"
                >
                  <span aria-hidden>🎟️</span>
                  {typeof credits === "number" ? (
                    <>
                      <span className="font-semibold">{credits}</span>
                      <span>credits left. Subscribe</span>
                    </>
                  ) : session?.user ? (
                    <>
                      <span>Checking credits…</span>
                    </>
                  ) : (
                    <>
                      <span>Free trial:</span>
                      <span className="font-semibold">3</span>
                      <span>credits</span>
                    </>
                  )}
                  <span aria-hidden>→</span>
                </Link>
              </div>

              <div className="mt-8 flex flex-row gap-3 justify-center lg:justify-center">
                <button
                  onClick={openCamera}
                  disabled={Boolean(session?.user) && credits === null}
                  aria-label="Open camera to snap a flyer"
                  className="btn btn-primary inline-flex items-center gap-2 whitespace-nowrap appearance-none px-3 py-2 rounded-2xl font-semibold text-sm bg-primary text-on-primary shadow-md shadow-primary/25"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 16C13.6569 16 15 14.6569 15 13C15 11.3431 13.6569 10 12 10C10.3431 10 9 11.3431 9 13C9 14.6569 10.3431 16 12 16Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M3 16.8V9.2C3 8.0799 3 7.51984 3.21799 7.09202C3.40973 6.71569 3.71569 6.40973 4.09202 6.21799C4.51984 6 5.0799 6 6.2 6H7.25464C7.37758 6 7.43905 6 7.49576 5.9935C7.79166 5.95961 8.05705 5.79559 8.21969 5.54609C8.25086 5.49827 8.27836 5.44328 8.33333 5.33333C8.44329 5.11342 8.49827 5.00346 8.56062 4.90782C8.8859 4.40882 9.41668 4.08078 10.0085 4.01299C10.1219 4 10.2448 4 10.4907 4H13.5093C13.7552 4 13.8781 4 13.9915 4.01299C14.5833 4.08078 15.1141 4.40882 15.4394 4.90782C15.5017 5.00345 15.5567 5.11345 15.6667 5.33333C15.7216 5.44329 15.7491 5.49827 15.7803 5.54609C15.943 5.79559 16.2083 5.95961 16.5042 5.9935C16.561 6 16.6224 6 16.7454 6H17.8C18.9201 6 19.4802 6 19.908 6.21799C20.2843 6.40973 20.5903 6.71569 20.782 7.09202C21 7.51984 21 8.0799 21 9.2V16.8C21 17.9201 21 18.4802 20.782 18.908C20.5903 19.2843 20.2843 19.5903 19.908 19.782C19.4802 20 18.9201 20 17.8 20H6.2C5.0799 20 4.51984 20 4.09202 19.782C3.71569 19.5903 3.40973 19.2843 3.21799 18.908C3 18.4802 3 17.9201 3 16.8Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Snap It Now</span>
                </button>

                <button
                  onClick={openUpload}
                  disabled={Boolean(session?.user) && credits === null}
                  aria-label="Upload a flyer or card image from your device"
                  className="btn btn-outline inline-flex items-center gap-2 whitespace-nowrap appearance-none px-3 py-2 rounded-2xl font-semibold text-sm border border-border bg-surface/80 text-foreground"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18.5 20L18.5 14M18.5 14L21 16.5M18.5 14L16 16.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 19H5C3.89543 19 3 18.1046 3 17V7C3 5.89543 3.89543 5 5 5H9.58579C9.851 5 10.1054 5.10536 10.2929 5.29289L12 7H19C20.1046 7 21 7.89543 21 9V11"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Upload</span>
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
              {Array.isArray(bulkEvents) && bulkEvents.length > 1 && (
                <div className="mt-3 flex items-center gap-3 flex-nowrap">
                  <span className="text-sm text-foreground/70 whitespace-nowrap">
                    Bulk ({bulkEvents.length})
                  </span>
                  <button
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm whitespace-nowrap ${
                      connected.google
                        ? "border border-primary/60 bg-primary text-on-primary hover:opacity-95 active:opacity-90 shadow-md shadow-primary/25"
                        : "border border-border bg-surface/70 text-foreground/90 hover:text-foreground hover:bg-surface"
                    }`}
                    onClick={connected.google ? addGoogleBulk : connectGoogle}
                  >
                    <span>Add all to</span>
                    <IconGoogleMono className="h-4 w-4" />
                  </button>
                  <button
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm whitespace-nowrap border border-border bg-surface/70 text-foreground/90 hover:text-foreground hover:bg-surface`}
                    onClick={openGoogleDrafts}
                  >
                    <span>Open GCal drafts</span>
                  </button>
                  {!isAndroid && !isWindows && (
                    <button
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm whitespace-nowrap ${
                        appleLinked
                          ? "border border-primary/60 bg-primary text-on-primary hover:opacity-95 active:opacity-90 shadow-md shadow-primary/25"
                          : "border border-border bg-surface/70 text-foreground/90 hover:text-foreground hover:bg-surface"
                      }`}
                      onClick={dlIcsBulk}
                    >
                      <span>Add all to</span>
                      <IconAppleMono className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm whitespace-nowrap ${
                      connected.microsoft
                        ? "border border-primary/60 bg-primary text-on-primary hover:opacity-95 active:opacity-90 shadow-md shadow-primary/25"
                        : "border border-border bg-surface/70 text-foreground/90 hover:text-foreground hover:bg-surface"
                    }`}
                    onClick={
                      connected.microsoft ? addOutlookBulk : connectOutlook
                    }
                  >
                    <span>Add all to</span>
                    <IconMicrosoftMono className="h-4 w-4" />
                  </button>
                  <button
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm whitespace-nowrap border border-border bg-surface/70 text-foreground/90 hover:text-foreground hover:bg-surface`}
                    onClick={openOutlookDrafts}
                  >
                    <span>Open Outlook drafts</span>
                  </button>
                </div>
              )}

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
          <div className="order-1 lg:order-2 hidden lg:flex justify-center lg:justify-end">
            <PhoneMockup />
          </div>
        )}
      </section>

      {showWelcome && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 landing-dark-gradient bg-background/70 backdrop-blur-sm"
            onClick={() => setShowWelcome(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Welcome to Snap My Date"
            className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl ring-1 ring-border/60"
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
                  Welcome to
                  <span className="block text-3xl md:text-4xl">
                    <span className="font-pacifico"> Snap</span>
                    <span> </span>
                    <span className="font-montserrat">My Date</span>
                  </span>
                </h2>
                <button
                  aria-label="Close"
                  className="rounded-xl px-3 py-1.5 border border-border bg-surface/70 hover:bg-surface text-foreground/80 hover:text-foreground transition"
                  onClick={() => setShowWelcome(false)}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="px-6 pb-6 space-y-4">
              <p className="text-foreground/80 text-center">
                You’re all set.
                <br />
                Let’s snap your first event and turn it into a reminder!
              </p>
            </div>
          </div>
        </div>
      )}

      {event && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 landing-dark-gradient bg-background/70 backdrop-blur-sm"
            onClick={() => setEvent(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-heading"
            aria-describedby="review-sub"
            ref={reviewModalRef}
            className="relative w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl ring-1 ring-border/60"
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
                <h2
                  id="review-heading"
                  className="text-2xl font-bold tracking-tight"
                >
                  Review event
                </h2>
                <button
                  aria-label="Close"
                  className="rounded-xl px-3 py-1.5 border border-border bg-surface/70 hover:bg-surface text-foreground/80 hover:text-foreground transition"
                  onClick={() => setEvent(null)}
                >
                  ✕
                </button>
              </div>
              <p id="review-sub" className="sr-only">
                Confirm and edit event details before adding to your calendar.
              </p>
            </div>

            <div className="px-6 pb-6 max-h-[70vh] overflow-y-auto no-scrollbar pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left column: Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground/80">
                    Details
                  </h3>
                  <div className="space-y-1">
                    <label
                      htmlFor="event-title"
                      className="text-sm text-foreground/70 flex items-center gap-2"
                    >
                      <span className="inline-block" aria-hidden>
                        📝
                      </span>
                      <span>Title</span>
                    </label>
                    <input
                      id="event-title"
                      ref={firstFieldRef}
                      className="w-full border border-border/80 bg-surface/90 text-foreground p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition"
                      value={event.title}
                      onChange={(e) =>
                        setEvent({ ...event, title: e.target.value })
                      }
                      onBlur={(e) =>
                        setEvent({
                          ...event,
                          title: normalizeCapsInput(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="event-start"
                      className="text-sm text-foreground/70 flex items-center gap-2"
                    >
                      <span aria-hidden>📅</span>
                      <span>Start</span>
                    </label>
                    <input
                      id="event-start"
                      className="w-full border border-border/80 bg-surface/90 text-foreground p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition"
                      value={event.start || ""}
                      onChange={(e) =>
                        setEvent({ ...event, start: e.target.value })
                      }
                    />
                    <p className="text-xs text-foreground/60">
                      Times in{" "}
                      {event.timezone ||
                        Intl.DateTimeFormat().resolvedOptions().timeZone ||
                        "your timezone"}
                    </p>
                  </div>

                  {Boolean(event.end) && (
                    <div className="space-y-1">
                      <label
                        htmlFor="event-end"
                        className="text-sm text-foreground/70 flex items-center gap-2"
                      >
                        <span aria-hidden>⏰</span>
                        <span>End</span>
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

                  <div className="space-y-1 relative">
                    <label
                      htmlFor="event-location"
                      className="text-sm text-foreground/70 flex items-center gap-2"
                    >
                      <span aria-hidden>📍</span>
                      <span>Address</span>
                    </label>
                    <input
                      id="event-location"
                      className="w-full border border-border/80 bg-surface/90 text-foreground p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition"
                      value={event.location}
                      onChange={(e) =>
                        setEvent({ ...event, location: e.target.value })
                      }
                      onBlur={(e) =>
                        setEvent({
                          ...event,
                          location: normalizeCapsInput(e.target.value),
                        })
                      }
                      aria-autocomplete="list"
                      aria-expanded={placeSuggestions.length > 0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && placeSuggestions.length > 0) {
                          e.preventDefault();
                          const s = placeSuggestions[0];
                          setSelectedPlace({ lat: s.lat, lon: s.lon });
                          setPlaceSuggestions([]);
                          setEvent({ ...event, location: s.label });
                        }
                      }}
                    />
                    {/* helper hint removed per request */}
                    {/* address suggestions list removed per request */}
                    {selectedPlace && (
                      <div className="mt-2 rounded-xl overflow-hidden border border-border">
                        <iframe
                          title="Map preview"
                          aria-label="Map preview"
                          src={`https://www.openstreetmap.org/export/embed.html?layer=mapnik&marker=${selectedPlace.lat},${selectedPlace.lon}`}
                          className="w-full h-36"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Right column: Description + Reminders */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground/80">
                    Description
                  </h3>
                  <div className="space-y-1">
                    <label
                      htmlFor="event-description"
                      className="text-sm text-foreground/70 flex items-center gap-2"
                    >
                      <span aria-hidden>🗒️</span>
                      <span>Notes</span>
                    </label>
                    <textarea
                      id="event-description"
                      ref={descriptionRef}
                      className="w-full border border-border/80 bg-surface/90 text-foreground p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition overflow-hidden resize-none"
                      rows={4}
                      placeholder="What’s happening? Add notes, RSVP info, etc."
                      value={event.description}
                      onInput={(e) => {
                        const t = e.currentTarget;
                        t.style.height = "auto";
                        t.style.height = t.scrollHeight + "px";
                      }}
                      onChange={(e) =>
                        setEvent({ ...event, description: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground/80">
                      Reminders
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "1 H", minutes: 60 },
                        { label: "3 Hs", minutes: 180 },
                        { label: "1 D", minutes: 1440 },
                        { label: "2 Ds", minutes: 2880 },
                        { label: "1 Wk", minutes: 10080 },
                      ].map((chip) => {
                        const isSelected = (event.reminders || []).some(
                          (r) => r.minutes === chip.minutes
                        );
                        return (
                          <button
                            key={chip.minutes}
                            className={`px-3 py-1.5 rounded-full border text-sm ${
                              isSelected
                                ? "bg-primary text-on-primary border-primary/60"
                                : "bg-surface/80 text-foreground/90 border-border/70 hover:bg-surface"
                            }`}
                            onClick={() => {
                              const list = Array.isArray(event.reminders)
                                ? [...event.reminders]
                                : ([] as { minutes: number }[]);
                              if (isSelected) {
                                setEvent({
                                  ...event,
                                  reminders: list.filter(
                                    (r) => r.minutes !== chip.minutes
                                  ),
                                });
                              } else {
                                setEvent({
                                  ...event,
                                  reminders: [
                                    ...list,
                                    { minutes: chip.minutes },
                                  ],
                                });
                              }
                            }}
                            aria-pressed={isSelected}
                          >
                            {chip.label}
                          </button>
                        );
                      })}
                    </div>

                    {(event.reminders || []).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(event.reminders || []).map((r, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-border/70 bg-surface/80 text-sm"
                          >
                            <span>
                              {r.minutes >= 1440
                                ? `${Math.round(r.minutes / 1440)} day${
                                    r.minutes === 1440 ? "" : "s"
                                  }`
                                : r.minutes >= 60
                                ? `${Math.round(r.minutes / 60)} h`
                                : `${r.minutes} m`}{" "}
                              before
                            </span>
                            <button
                              aria-label="Delete reminder"
                              className="inline-flex items-center justify-center h-6 w-6 rounded-full border border-border hover:bg-surface"
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
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
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
                          </span>
                        ))}
                      </div>
                    )}
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
    <div className="phone-shell relative w-[280px] sm:w-[320px] aspect-[9/19.5] rounded-[38px] bg-neutral-800 shadow-2xl shadow-black/50 ring-1 ring-white/10 overflow-hidden">
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
