"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { combineVenueAndLocation } from "@/lib/mappers";
import { findFirstEmail } from "@/utils/contact";
import { extractFirstPhoneNumber } from "@/utils/phone";
import { buildCalendarLinks, ensureEndIso } from "@/utils/calendar-links";
import { openAppleCalendarIcs } from "@/utils/calendar-open";
import { useSession } from "next-auth/react";

try {
  const globalObj = globalThis as typeof globalThis & {
    findPhone?: () => string | null;
  };
  if (globalObj && typeof globalObj.findPhone !== "function") {
    globalObj.findPhone = () => null;
  }
} catch {
  // Ignore if globalThis is not available.
}

type EventFields = {
  title: string;
  start: string | null;
  end: string | null;
  startISO?: string | null;
  endISO?: string | null;
  date?: string | null;
  time?: string | null;
  allDay?: boolean;
  recurrence?: string | null;
  location?: string | null;
  venue?: string | null;
  description?: string | null;
  timezone?: string | null;
  reminders?: { minutes: number }[] | null;
  rsvp?: string | null;
};

type CalendarProvider = "apple" | "google" | "microsoft";
type CalendarConnectionStatus = {
  google: boolean;
  microsoft: boolean;
  apple: boolean;
};
type CalendarPreference = {
  provider: CalendarProvider;
  remember: boolean;
};

const CALENDAR_DEFAULT_STORAGE_KEY = "envitefy:event-actions:calendar-default:v1";

const normalizeCalendarProvider = (value: unknown): CalendarProvider | null => {
  if (typeof value !== "string") return null;
  const provider = value.trim().toLowerCase();
  if (
    provider === "apple" ||
    provider === "google" ||
    provider === "microsoft"
  ) {
    return provider;
  }
  return null;
};

export default function EventActions({
  shareUrl,
  event,
  className,
  historyId,
  variant = "default",
  tone = "default",
  showLabels = false,
}: {
  shareUrl: string;
  event: EventFields | null;
  className?: string;
  historyId?: string;
  variant?: "default" | "compact";
  tone?: "default" | "light";
  showLabels?: boolean;
}) {
  const normalizeDateLike = (value: string | null | undefined): string | null => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return null;
    return trimmed;
  };

  const buildStartFromDateTime = (
    date: string | null | undefined,
    time: string | null | undefined
  ): string | null => {
    if (typeof date !== "string" || !date.trim()) return null;
    const datePart = date.trim();
    const timePart = typeof time === "string" && time.trim() ? time.trim() : "14:00";
    const parsed = new Date(`${datePart}T${timePart}`);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString();
  };

  // No visible inputs; infer contact targets from event details
  const { data: session } = useSession();
  const isSignedIn = Boolean(session?.user?.email);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [rememberCalendarDefault, setRememberCalendarDefault] = useState(true);
  const [defaultCalendarProvider, setDefaultCalendarProvider] =
    useState<CalendarProvider | null>(null);
  const [connectedCalendars, setConnectedCalendars] =
    useState<CalendarConnectionStatus | null>(null);
  const firstCalendarOptionRef = useRef<HTMLButtonElement | null>(null);
  const lastCalendarOpenRef = useRef<{ href: string; ts: number } | null>(null);
  const absoluteUrl = useMemo(() => {
    try {
      if (!shareUrl) return "";
      if (/^https?:\/\//i.test(shareUrl)) return shareUrl;
      if (typeof window !== "undefined") {
        return new URL(shareUrl, window.location.origin).toString();
      }
      return shareUrl;
    } catch {
      return shareUrl;
    }
  }, [shareUrl]);

  const combinedLocation = useMemo(() => {
    return combineVenueAndLocation(
      event?.venue ?? null,
      event?.location ?? null
    );
  }, [event?.venue, event?.location]);

  const safeEvent = useMemo(() => {
    if (!event) return null;
    const start =
      normalizeDateLike(event.start) ||
      normalizeDateLike(event.startISO) ||
      buildStartFromDateTime(event.date, event.time);
    if (!start) return null;
    const end = normalizeDateLike(event.end) || normalizeDateLike(event.endISO);
    const computedEnd = ensureEndIso(
      start,
      end,
      Boolean(event.allDay)
    );

    return {
      ...event,
      start,
      end: computedEnd,
      location: combinedLocation,
    } as EventFields;
  }, [combinedLocation, event]);

  const calendarLinks = useMemo(() => {
    if (!safeEvent?.start || !safeEvent?.end) return null;
    const reminders = Array.isArray(safeEvent.reminders)
      ? safeEvent.reminders
          .map((item) => (typeof item?.minutes === "number" ? item.minutes : null))
          .filter((minutes): minutes is number => minutes !== null && minutes > 0)
      : null;
    return buildCalendarLinks({
      title: safeEvent.title || "Event",
      description: safeEvent.description || "",
      location: safeEvent.location || "",
      startIso: safeEvent.start,
      endIso: safeEvent.end,
      timezone: safeEvent.timezone || "",
      allDay: Boolean(safeEvent.allDay),
      reminders,
      recurrence: safeEvent.recurrence || null,
    });
  }, [safeEvent]);

  const readLocalCalendarDefault = useCallback(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(CALENDAR_DEFAULT_STORAGE_KEY);
      return normalizeCalendarProvider(raw);
    } catch {
      return null;
    }
  }, []);

  const writeLocalCalendarDefault = useCallback((provider: CalendarProvider | null) => {
    if (typeof window === "undefined") return;
    try {
      if (!provider) {
        window.localStorage.removeItem(CALENDAR_DEFAULT_STORAGE_KEY);
        return;
      }
      window.localStorage.setItem(CALENDAR_DEFAULT_STORAGE_KEY, provider);
    } catch {
      // ignore storage failures
    }
  }, []);

  const syncProfileCalendarDefault = useCallback(
    async (provider: CalendarProvider | null) => {
      if (!isSignedIn) return;
      try {
        await fetch("/api/user/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferredProvider: provider }),
        });
      } catch {
        // non-blocking fallback to local storage only
      }
    },
    [isSignedIn]
  );

  const fetchConnectedCalendars = useCallback(async () => {
    if (!isSignedIn) return null;
    try {
      const res = await fetch("/api/calendars", { credentials: "include" });
      if (!res.ok) return null;
      const json = await res.json().catch(() => ({}));
      const next: CalendarConnectionStatus = {
        google: Boolean(json?.google),
        microsoft: Boolean(json?.microsoft),
        apple: Boolean(json?.apple),
      };
      setConnectedCalendars(next);
      return next;
    } catch {
      return null;
    }
  }, [isSignedIn]);

  const isProviderValid = useCallback(
    (
      provider: CalendarProvider | null | undefined,
      connections?: CalendarConnectionStatus | null
    ) => {
      if (!provider) return false;
      if (provider === "apple") return true;
      if (!isSignedIn) return true;
      return Boolean(connections?.[provider]);
    },
    [isSignedIn]
  );

  const hydrateDefaultFromProfile = useCallback(async () => {
    if (!isSignedIn) return null;
    try {
      const res = await fetch("/api/user/profile", { cache: "no-store" });
      if (!res.ok) return null;
      const json = await res.json().catch(() => ({}));
      const provider = normalizeCalendarProvider(json?.preferredProvider);
      if (provider) {
        setDefaultCalendarProvider(provider);
        writeLocalCalendarDefault(provider);
        return provider;
      }
    } catch {
      // non-blocking fallback
    }
    return null;
  }, [isSignedIn, writeLocalCalendarDefault]);

  const rsvpEmail = useMemo(() => {
    const candidates: unknown[] = [
      event?.rsvp ?? null,
      event?.description ?? null,
      event?.location ?? null,
      combinedLocation || null,
    ];
    for (const candidate of candidates) {
      const found = findFirstEmail(candidate);
      if (found) return found;
    }
    return findFirstEmail(event);
  }, [combinedLocation, event]);

  const rsvpPhone = useMemo(() => {
    const rsvp = event?.rsvp || "";
    const text = `${rsvp} ${event?.description || ""} ${
      combinedLocation || ""
    }`;
    return extractFirstPhoneNumber(text);
  }, [combinedLocation, event]);
  const hasRsvpContact = useMemo(
    () => Boolean(rsvpPhone || rsvpEmail),
    [rsvpPhone, rsvpEmail]
  );

  useEffect(() => {
    if (!event) return;
    // Provide diagnostics while we trace email RSVP detection issues.
    console.debug("[EventActions] RSVP detection", {
      eventId: historyId,
      rsvpField: event?.rsvp,
      descriptionHasEmail: Boolean(findFirstEmail(event?.description ?? null)),
      detectedEmail: rsvpEmail,
      detectedPhone: rsvpPhone,
    });
  }, [event, historyId, rsvpEmail, rsvpPhone]);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    const localProvider = readLocalCalendarDefault();
    if (localProvider) {
      setDefaultCalendarProvider(localProvider);
      return;
    }

    if (!isSignedIn) {
      return;
    }

    void hydrateDefaultFromProfile();
  }, [hydrateDefaultFromProfile, isSignedIn, readLocalCalendarDefault]);

  useEffect(() => {
    if (!isSignedIn) {
      setConnectedCalendars(null);
      return;
    }
    void fetchConnectedCalendars();
  }, [fetchConnectedCalendars, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) return;
    if (!defaultCalendarProvider) return;
    if (!connectedCalendars) return;
    if (isProviderValid(defaultCalendarProvider, connectedCalendars)) return;
    setDefaultCalendarProvider(null);
    writeLocalCalendarDefault(null);
    void syncProfileCalendarDefault(null);
  }, [
    connectedCalendars,
    defaultCalendarProvider,
    isProviderValid,
    isSignedIn,
    syncProfileCalendarDefault,
    writeLocalCalendarDefault,
  ]);

  useEffect(() => {
    if (!calendarModalOpen) return;
    const onKeyDown = (evt: KeyboardEvent) => {
      if (evt.key === "Escape") setCalendarModalOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [calendarModalOpen]);

  useEffect(() => {
    if (!calendarModalOpen) return;
    setRememberCalendarDefault(true);
    setTimeout(() => {
      firstCalendarOptionRef.current?.focus();
    }, 0);
  }, [calendarModalOpen]);

  // Legacy RSVP logic used a phone lookup helper. Keep a stub so any stale bundles
  // referencing `findPhone` during hot reloads keep working without throwing.
  const legacyFindPhone = (): string | null => rsvpPhone;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const findPhone = legacyFindPhone;

  const formatDateRange = (
    startIso: string | null | undefined,
    endIso: string | null | undefined,
    timeZone?: string
  ): string => {
    try {
      if (!startIso) return "";
      const start = new Date(startIso);
      const end = endIso ? new Date(endIso) : null;
      const dateFmt = new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: timeZone || undefined,
      });
      const sameDay =
        end &&
        start.getFullYear() === end.getFullYear() &&
        start.getMonth() === end.getMonth() &&
        start.getDate() === end.getDate();
      if (end) {
        if (sameDay) {
          const dayPart = new Intl.DateTimeFormat(undefined, {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "2-digit",
            timeZone: timeZone || undefined,
          }).format(start);
          const timeFmt = new Intl.DateTimeFormat(undefined, {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZone: timeZone || undefined,
          });
          return `${dayPart}, ${timeFmt.format(start)} - ${timeFmt.format(
            end
          )} ${timeZone ? `(${timeZone})` : ""}`.trim();
        }
        return `${dateFmt.format(start)} - ${dateFmt.format(end)} ${
          timeZone ? `(${timeZone})` : ""
        }`.trim();
      }
      return `${dateFmt.format(start)} ${
        timeZone ? `(${timeZone})` : ""
      }`.trim();
    } catch {
      return `${startIso || ""}${endIso ? ` - ${endIso}` : ""}`;
    }
  };

  const extractRsvpSubject = (title?: string | null): string => {
    try {
      const t = (title || "").trim();
      if (!t) return "the event";
      // Try to extract a name prior to 's (e.g., "Livia's Birthday Party")
      const m = t.match(/([^\s][^']*?)\s*(?:'s|’s)\b/i);
      if (m && m[1]) {
        const name = m[1].trim();
        return `${name}'s birthday`;
      }
      // Otherwise fall back to the full title
      return t;
    } catch {
      return title || "the event";
    }
  };

  const userFullName = useMemo(() => {
    const name = (session?.user?.name as string) || "";
    return name.trim();
  }, [session]);

  const onEmail = () => {
    const to = rsvpEmail || "";
    const title = event?.title || "Event";
    const whenLine = formatDateRange(
      safeEvent?.start || null,
      safeEvent?.end || null,
      event?.timezone || undefined
    );
    const locationLine = combinedLocation;
    const parts = [
      `${title}`,
      "",
      whenLine ? `Date: ${whenLine}` : undefined,
      locationLine ? `Location: ${locationLine}` : undefined,
      event?.description ? "" : undefined,
      event?.description ? `${event.description}` : undefined,
      "",
      absoluteUrl ? `Event link: ${absoluteUrl}` : undefined,
      "",
      "—",
      "Sent via SnapMyDate · envitefy.com",
    ].filter(Boolean) as string[];
    const body = encodeURIComponent(parts.join("\n"));
    const subject = encodeURIComponent(title);
    window.location.href = `mailto:${encodeURIComponent(
      to
    )}?subject=${subject}&body=${body}`;
  };

  const onRsvp = () => {
    const rsvpTarget = extractRsvpSubject(event?.title);
    const introParts = [
      "Hi there,",
      userFullName ? `this is ${userFullName}.` : undefined,
      `I'm reaching out to RSVP for ${rsvpTarget}.`,
    ].filter(Boolean);
    const message = [
      introParts.join(" "),
      absoluteUrl ? `\n${absoluteUrl}` : undefined,
    ]
      .filter(Boolean)
      .join("");
    const phone = rsvpPhone;
    const email = rsvpEmail;
    if (phone) {
      const smsUrl = `sms:${encodeURIComponent(
        phone
      )}?&body=${encodeURIComponent(message)}`;
      try {
        window.location.href = smsUrl;
        return;
      } catch {}
    }
    if (!email) return;
    const subject = encodeURIComponent(event?.title || "Event RSVP");
    window.location.href = `mailto:${encodeURIComponent(
      email
    )}?subject=${subject}&body=${encodeURIComponent(message)}`;
  };

  const onShareLink = async () => {
    try {
      const url =
        absoluteUrl ||
        (typeof window !== "undefined" ? window.location.href : "");
      if (
        typeof navigator !== "undefined" &&
        "share" in navigator &&
        typeof navigator.share === "function"
      ) {
        await navigator.share({ title: event?.title || "Event", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard");
    } catch {}
  };

  const getCalendarHref = (provider: CalendarProvider) => {
    if (!calendarLinks) return "";
    if (provider === "apple") return calendarLinks.appleInline;
    if (provider === "google") return calendarLinks.google;
    return calendarLinks.outlook;
  };

  const openCalendarProvider = (provider: CalendarProvider) => {
    const href = getCalendarHref(provider);
    if (!href) return;
    const now = Date.now();
    const previous = lastCalendarOpenRef.current;
    if (previous && previous.href === href && now - previous.ts < 1200) {
      return;
    }
    lastCalendarOpenRef.current = { href, ts: now };

    if (provider === "apple") {
      openAppleCalendarIcs(href);
      return;
    }
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const persistCalendarPreference = (preference: CalendarPreference) => {
    if (preference.remember) {
      setDefaultCalendarProvider(preference.provider);
      writeLocalCalendarDefault(preference.provider);
      void syncProfileCalendarDefault(preference.provider);
      return;
    }

    setDefaultCalendarProvider(null);
    writeLocalCalendarDefault(null);
    void syncProfileCalendarDefault(null);
  };

  const openCalendarModal = () => {
    setRememberCalendarDefault(true);
    setCalendarModalOpen(true);
  };

  const onCalendarPrimaryClick = () => {
    if (!calendarLinks) return;
    openCalendarModal();
  };

  const onCalendarProviderSelect = (provider: CalendarProvider) => {
    const preference: CalendarPreference = {
      provider,
      remember: rememberCalendarDefault,
    };
    setCalendarModalOpen(false);
    persistCalendarPreference(preference);
    openCalendarProvider(provider);
  };

  const innerClassName =
    variant === "compact"
      ? "flex items-center gap-2"
      : "flex flex-wrap items-center justify-center gap-10";

  const buttonClassName =
    variant === "compact"
      ? tone === "light"
        ? "inline-flex items-center gap-2 px-3 py-1.5 text-sm text-white hover:text-white/90 hover:bg-white/15 drop-shadow transition-colors"
        : "inline-flex items-center gap-2 rounded-lg border border-[#ddd4f8] bg-white/90 px-3 py-1.5 text-sm font-medium text-[#4f3f7a] shadow-sm transition hover:border-[#cabcf0] hover:bg-[#f7f2ff] hover:text-[#2f2550]"
      : tone === "light"
      ? "inline-flex items-center gap-2 text-white hover:text-white/90 drop-shadow"
      : "inline-flex items-center gap-2 text-neutral-900 hover:text-black";

  const labelClassName = showLabels ? "inline" : "hidden sm:inline";

  return (
    <div className={className}>
      <div className={innerClassName}>
        {calendarLinks && (
          <button
            type="button"
            onClick={onCalendarPrimaryClick}
            className={buttonClassName}
            aria-label="Add to calendar"
            title="Add to calendar"
            aria-haspopup="dialog"
            aria-expanded={calendarModalOpen}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <line x1="12" y1="14" x2="12" y2="20" />
              <line x1="9" y1="17" x2="15" y2="17" />
            </svg>
            <span className={labelClassName}>Calendar</span>
          </button>
        )}

        <button type="button" onClick={onShareLink} className={buttonClassName}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span className={labelClassName}>Share</span>
        </button>

        <button type="button" onClick={onEmail} className={buttonClassName}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <polyline points="22,7 12,13 2,7" />
          </svg>
          <span className={labelClassName}>Email</span>
        </button>

        {/* RSVP button removed from bottom action bar - RSVP is now handled via EventRsvpPrompt component with Yes/No/Maybe buttons */}
        {false && hasRsvpContact && (
          <button
            type="button"
            onClick={onRsvp}
            className="inline-flex items-center gap-2 text-foreground/90 hover:text-foreground"
          >
            <svg
              fill="currentColor"
              viewBox="0 0 14 14"
              role="img"
              focusable="false"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
            >
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g
                id="SVGRepo_tracerCarrier"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></g>
              <g id="SVGRepo_iconCarrier">
                <path d="m 4.315027,12.158602 c -0.9166805,-0.4626 -1.7278542,-0.903 -1.8026191,-0.9788 -0.1478698,-0.1498 -1.4890884,-4.2157996 -1.4890884,-4.5141996 0,-0.1794 1.9277474,-3.8667 2.4722734,-4.7288 0.3461929,-0.5482 0.6940858,-0.7692 1.21135,-0.7696 0.5126739,-6e-4 0.816424,0.1402 0.816424,0.3779 0,0.2828 -0.1781318,0.3785 -0.5974395,0.3211 -0.3147608,-0.043 -0.4060468,-0.021 -0.5947593,0.1457 -0.272448,0.2404 -2.4114894,4.1964 -2.3740869,4.3907 0.015001,0.078 0.3915959,0.3334 0.8590168,0.5825 0.9503928,0.5065 1.2472424,0.7564 1.3812813,1.1626 0.1429494,0.4331 0.029302,0.8899 -0.4433493,1.7825 -0.3793751,0.7163996 -0.4144374,0.8241996 -0.3094305,0.9506996 0.1626808,0.1961 2.7174796,1.4529 2.9532752,1.4529 0.2985297,0 0.5355554,-0.2492 0.9499528,-0.9982 0.2111439,-0.3817 0.4437293,-0.7314 0.5168441,-0.7769 0.1642809,-0.1024 0.575408,-0.01 0.575388,0.1307 -10e-6,0.056 -0.2263849,0.5054 -0.5030632,0.9976 -0.5994196,1.0664 -0.8889088,1.3136 -1.5371216,1.313 -0.363884,-7e-4 -0.6345119,-0.1095 -2.0848478,-0.8414 z M 7.7463238,9.5757024 c -0.6336519,-0.2163 -1.1689373,-0.4103 -1.1895286,-0.4309 -0.055904,-0.056 0.084306,-0.1509 1.1332649,-0.7682 l 0.9583433,-0.564 1.8750236,-0.1997 c 1.031268,-0.1098 1.96831,-0.1894 2.082317,-0.1769 0.201354,0.022 0.210294,0.051 0.311551,1.0195 0.0573,0.5482 0.0765,1.0223 0.0427,1.0535 -0.0339,0.031 -0.961564,0.1475 -2.061576,0.2584 l -2.0000221,0.2016 -1.1520861,-0.3933 z m 0.9846951,-0.054 c -0.1324288,-0.3207 -0.2165143,-0.825 -0.1737115,-1.0417 0.024902,-0.126 0.029702,-0.2291 0.010701,-0.2291 -0.019001,0 -0.3439127,0.1859 -0.7220077,0.4132 -0.5619572,0.3378 -0.6583435,0.4244 -0.5280049,0.4744 0.087706,0.034 0.4229179,0.1628 0.7449292,0.2868 0.7139172,0.2751 0.7436392,0.2794 0.6680942,0.096 z m 0.9681139,-2.2614 c -0.093306,-0.061 -0.024102,-0.249 0.3541732,-0.9637 0.537145,-1.0149 0.586078,-1.3287 0.261787,-1.6787 -0.227535,-0.2455 -0.263567,-0.4452 -0.108337,-0.6004 0.165851,-0.1659 0.353683,-0.1144 0.623661,0.1708 0.577718,0.6104 0.581129,0.9106 0.0231,2.0345 -0.231266,0.4657 -0.465991,0.8846 -0.521605,0.9307 -0.15836,0.1314 -0.5051427,0.1899 -0.6328112,0.1068 z m -3.9426405,-1.0845 c -1.3871717,-0.712 -1.8892649,-1.0083 -1.7086629,-1.0083 0.1192979,0 3.4755697,1.7091 3.4755697,1.7699 0,0.1262 -0.2339055,0.025 -1.7669068,-0.7616 z m 1.8294009,0.4017 c -0.1566504,-0.091 -0.2008133,-0.3266 -0.061304,-0.3266 0.1328988,0 0.4184977,-0.5259 0.3694845,-0.6803 -0.072005,-0.2268 0.1014167,-0.254 0.4584402,-0.072 0.4303885,0.2195 0.5359555,0.5407 0.2530268,0.7699 -0.106127,0.086 -0.2430361,0.1358 -0.3042301,0.1109 -0.061204,-0.025 -0.1675211,-0.068 -0.2362756,-0.096 -0.092106,-0.037 -0.1249983,0.01 -0.1249983,0.1667 0,0.2286 -0.1114174,0.2686 -0.3541734,0.1272 z m 0.817004,-0.584 c 0.030802,-0.05 0.012701,-0.1338 -0.040203,-0.1868 -0.072705,-0.073 -0.1143675,-0.067 -0.1705813,0.024 -0.079405,0.1285 -0.039403,0.2532 0.081305,0.2532 0.040403,0 0.098707,-0.041 0.1294886,-0.091 z m -1.7025725,0.099 c -0.093906,-0.06 -0.098006,-0.1677 -0.022301,-0.5973 0.090706,-0.515 0.066304,-0.7167 -0.061704,-0.5097 -0.086906,0.1406 -0.3163809,0.043 -0.3686343,-0.1568 -0.023102,-0.089 -0.083106,-0.161 -0.1332089,-0.161 -0.1407393,0 -0.1082871,0.1254 0.075505,0.2918 0.317011,0.2869 0.166031,0.7083 -0.2537567,0.7083 -0.2601372,0 -0.4962528,-0.2311 -0.4962528,-0.4857 0,-0.2566 0.2362256,-0.228 0.3384923,0.041 0.063604,0.1672 0.1079872,0.1983 0.1801719,0.1261 0.072205,-0.072 0.048303,-0.1463 -0.096606,-0.3006 -0.2234648,-0.2378 -0.1875824,-0.5881 0.068605,-0.6694 0.211694,-0.067 0.5775382,0.1095 0.6410624,0.3098 0.036002,0.1133 0.077905,0.136 0.1389991,0.075 0.061004,-0.061 0.1592006,-0.05 0.3250615,0.035 0.2599272,0.1344 0.2986798,0.2408 0.1251783,0.3436 -0.1248682,0.074 -0.2616273,0.525 -0.1592105,0.525 0.078105,0 0.2976897,-0.3302 0.3238214,-0.4868 0.010301,-0.062 0.035402,-0.1285 0.055804,-0.1489 0.057004,-0.057 0.4753614,0.1523 0.4753614,0.2378 0,0.098 -0.8500762,0.8909 -0.9583433,0.8934 -0.045803,0 -0.134959,-0.031 -0.1980631,-0.071 z m -1.6264575,-0.8663 c -0.094306,-0.069 -0.136229,-0.1905 -0.1189179,-0.3445 0.015401,-0.1368 -0.017601,-0.2537 -0.077405,-0.2747 -0.065904,-0.023 -0.1041669,0.043 -0.1041669,0.1789 0,0.2321 -0.085406,0.2646 -0.3388224,0.129 -0.182202,-0.098 -0.2185944,-0.3305 -0.051603,-0.3305 0.1379791,0 0.4017566,-0.5402 0.3410426,-0.6984 -0.085806,-0.2235 0.1312186,-0.2261 0.5065734,-0.01 0.3067003,0.1797 0.3761649,0.2644 0.3761649,0.4584 0,0.132 -0.059704,0.2713 -0.1341289,0.313 -0.073805,0.041 -0.1399292,0.1906 -0.1470297,0.3318 -0.016301,0.3251 -0.069505,0.3764 -0.2516766,0.2432 z m 0.1995032,-0.9245 c 0,-0.1575 -0.2255849,-0.2344 -0.2790285,-0.095 -0.050403,0.1314 0.013001,0.2112 0.1679111,0.2112 0.061104,0 0.1111174,-0.052 0.1111174,-0.116 z m 3.601918,0.2363 c -0.2627774,-0.184 -0.2331554,-0.463 0.120658,-1.1362 0.4462095,-0.8492 0.8352452,-1.0216 1.1660466,-0.5167 0.127968,0.1953 0.119808,0.2336 -0.1778913,0.836 -0.4634407,0.9377 -0.6939359,1.1076 -1.1088133,0.8169 z m -1.1933089,-1.3112 c -0.5219145,-0.2992 -0.741929,-0.4653 -0.741929,-0.56 0,-0.035 0.067505,-0.1473 0.1499899,-0.1852 l 0.1499799,-0.1852 0.6870454,0.3454 c 0.7041866,0.354 0.8527864,0.5114 0.7053666,0.7471 -0.137129,0.2191 -0.45407,0.1864 -0.9504528,-0.098 z m -2.0548158,-0.3219 c -0.2223046,-0.2223 -0.023902,-0.8755 0.4707412,-1.5497 0.2968096,-0.4045 0.5676375,-0.462 0.8493761,-0.1803 0.2178944,0.2179 0.1765917,0.4139 -0.2531967,1.2012 -0.30199,0.5531 -0.3351122,0.5846 -0.6407924,0.6079 -0.1785118,0.014 -0.3686444,-0.022 -0.4261282,-0.079 z"></path>
              </g>
            </svg>
            <span className="hidden sm:inline">RSVP</span>
          </button>
        )}
      </div>
      {portalReady &&
        calendarModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[13000] flex items-center justify-center bg-black/50 p-4"
            onClick={() => setCalendarModalOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Add to calendar"
              className="w-full max-w-sm rounded-xl border border-[#ddd4f8] bg-white p-4 shadow-2xl"
              onClick={(evt) => evt.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#2f2550]">
                  Add to calendar
                </h3>
                <button
                  type="button"
                  onClick={() => setCalendarModalOpen(false)}
                  className="rounded-md p-1 text-[#6f5ba3] transition hover:bg-[#f7f2ff]"
                  aria-label="Close"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="space-y-2">
                <button
                  ref={firstCalendarOptionRef}
                  type="button"
                  onClick={() => void onCalendarProviderSelect("apple")}
                  className="flex w-full items-center justify-between rounded-lg border border-[#ddd4f8] px-3 py-2 text-left text-sm font-medium text-[#4f3f7a] transition hover:bg-[#f7f2ff]"
                >
                  <span>Apple Calendar</span>
                </button>
                <button
                  type="button"
                  onClick={() => void onCalendarProviderSelect("google")}
                  className="flex w-full items-center justify-between rounded-lg border border-[#ddd4f8] px-3 py-2 text-left text-sm font-medium text-[#4f3f7a] transition hover:bg-[#f7f2ff]"
                >
                  <span>Google Calendar</span>
                </button>
                <button
                  type="button"
                  onClick={() => void onCalendarProviderSelect("microsoft")}
                  className="flex w-full items-center justify-between rounded-lg border border-[#ddd4f8] px-3 py-2 text-left text-sm font-medium text-[#4f3f7a] transition hover:bg-[#f7f2ff]"
                >
                  <span>Outlook</span>
                </button>
              </div>

              <label className="mt-4 flex items-start gap-2 text-sm text-[#4f3f7a]">
                <input
                  type="checkbox"
                  checked={rememberCalendarDefault}
                  onChange={(evt) => setRememberCalendarDefault(evt.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[#cdbff0] text-[#7f8cff]"
                />
                <span>Use this as my default for next time</span>
              </label>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setCalendarModalOpen(false)}
                  className="rounded-lg border border-[#ddd4f8] px-3 py-1.5 text-sm font-medium text-[#4f3f7a] transition hover:bg-[#f7f2ff]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
