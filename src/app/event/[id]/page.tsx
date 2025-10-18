import { notFound } from "next/navigation";
import EventActions from "@/components/EventActions";
import ThumbnailModal from "@/components/ThumbnailModal";
import EventEditModal from "@/components/EventEditModal";
import EventDeleteModal from "@/components/EventDeleteModal";
import EventRsvpPrompt from "@/components/EventRsvpPrompt";
import LocationLink from "@/components/LocationLink";
import ReadOnlyBanner from "./ReadOnlyBanner";
import ReadOnlyEventLogo from "@/components/ReadOnlyEventLogo";
import { combineVenueAndLocation } from "@/lib/mappers";
import {
  listSharesByOwnerForEvents,
  isEventSharedWithUser,
  isEventSharePendingForUser,
  listShareRecipientsForEvent,
  revokeShareByOwner,
  acceptEventShare,
  revokeEventShare,
} from "@/lib/db";
import {
  getEventHistoryBySlugOrId,
  getUserIdByEmail,
  getUserById,
} from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { extractFirstPhoneNumber } from "@/utils/phone";
import { getEventTheme } from "@/lib/event-theme";
import {
  getRegistryBrandByUrl,
  normalizeRegistryLinks,
} from "@/utils/registry-links";
import type { CSSProperties } from "react";

export const dynamic = "force-dynamic";

const RSVP_OPTION_START_REGEX = /[✅❌🤔•]/;
const RSVP_OPTION_PHRASES = [
  /\bwill\s+attend\b/gi,
  /\bwill\s+not\s+attend\b/gi,
  /\bwill\s+not\s+be\s+able\s+to\s+attend\b/gi,
  /\bwon't\s+be\s+able\s+to\s+attend\b/gi,
  /\bmight\s+be\s+able\s+to\s+attend\b/gi,
  /\bmay\s+be\s+able\s+to\s+attend\b/gi,
  /\bpossibly\b/gi,
  /\bmaybe\b/gi,
];

const cleanRsvpContactLabel = (raw: string): string => {
  let working = raw;
  const optionIndex = working.search(RSVP_OPTION_START_REGEX);
  if (optionIndex >= 0) {
    working = working.slice(0, optionIndex);
  }
  for (const pattern of RSVP_OPTION_PHRASES) {
    working = working.replace(pattern, "");
  }
  working = working.replace(/[✅❌🤔•]/g, "");
  working = working.replace(/\s{2,}/g, " ").trim();
  working = working.replace(/[:;,.-]+$/, "").trim();
  return working;
};

const FLOATING_ISO_REGEX =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/;

const parseDatePreserveFloating = (
  input: string
): { date: Date; floating: boolean } => {
  const floatingMatch = FLOATING_ISO_REGEX.exec(input);
  if (floatingMatch) {
    const [, y, m, d, hh, mm, ss] = floatingMatch;
    const date = new Date(
      Date.UTC(
        Number(y),
        Number(m) - 1,
        Number(d),
        Number(hh),
        Number(mm),
        Number(ss || "0")
      )
    );
    return { date, floating: true };
  }
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("invalid date");
  }
  return { date: parsed, floating: false };
};

const TIME_TOKEN_GLOBAL_REGEX =
  /\b(\d{1,2})(?::(\d{2}))?\s*(?:a\.?m\.?|p\.?m\.?)\b|\b([01]?\d|2[0-3]):([0-5]\d)\b/gi;

const extractTimeTokens = (value?: string | null): string[] => {
  if (!value) return [];
  const tokens: string[] = [];
  TIME_TOKEN_GLOBAL_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TIME_TOKEN_GLOBAL_REGEX.exec(value))) {
    tokens.push(match[0]);
  }
  return tokens;
};

const normalizeTimeToken = (token: string | null | undefined): number | null => {
  if (!token) return null;
  const trimmed = token.trim().toLowerCase().replace(/\s+/g, " ");
  const ampmMatch =
    trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)$/i) || null;
  if (ampmMatch) {
    let hour = Number.parseInt(ampmMatch[1], 10);
    if (Number.isNaN(hour)) return null;
    const minute = Number.parseInt(ampmMatch[2] ?? "0", 10);
    if (Number.isNaN(minute)) return null;
    const suffix = (ampmMatch[3] || "").toLowerCase();
    hour %= 12;
    if (suffix.startsWith("p")) hour += 12;
    return hour * 60 + minute;
  }
  const militaryMatch =
    trimmed.match(/^([01]?\d|2[0-3]):([0-5]\d)$/) || null;
  if (militaryMatch) {
    const hour = Number.parseInt(militaryMatch[1], 10);
    const minute = Number.parseInt(militaryMatch[2], 10);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
    return hour * 60 + minute;
  }
  return null;
};

const timeTokensEquivalent = (
  a: string | null | undefined,
  b: string | null | undefined
): boolean => {
  if (!a || !b) return false;
  const m1 = normalizeTimeToken(a);
  const m2 = normalizeTimeToken(b);
  if (m1 !== null && m2 !== null) {
    return Math.abs(m1 - m2) <= 1;
  }
  const normalize = (s: string) =>
    s.trim().toLowerCase().replace(/\./g, "").replace(/\s+/g, " ");
  return normalize(a) === normalize(b);
};

const buildFallbackRangeLabel = (
  startLabel?: string | null,
  endLabel?: string | null
): string | null => {
  if (!startLabel) return null;
  const trimmedStart = startLabel.trim();
  if (!trimmedStart) return null;
  if (!endLabel) return trimmedStart;
  const trimmedEnd = endLabel.trim();
  if (!trimmedEnd) return trimmedStart;

  const startTokens = extractTimeTokens(trimmedStart);
  const endTokens = extractTimeTokens(trimmedEnd);
  const startTime = startTokens[0] || null;
  const endTime = endTokens[0] || null;

  if (startTime && endTime) {
    const startParts = trimmedStart
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (
      startParts.length &&
      extractTimeTokens(startParts[startParts.length - 1]).length > 0
    ) {
      startParts.pop();
    }
    const datePart = startParts.join(", ");
    const endRemainder = trimmedEnd
      .replace(endTime, "")
      .replace(/,\s*$/, "")
      .trim();
    if (endRemainder && endRemainder !== datePart) {
      const prefix = datePart ? `${datePart}, ${startTime}` : startTime;
      return `${prefix} – ${trimmedEnd}`;
    }
    const prefix = datePart ? `${datePart}, ` : "";
    return `${prefix}${startTime} – ${endTime}`;
  }

  if (startTime && !endTime) {
    const startParts = trimmedStart
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (
      startParts.length &&
      extractTimeTokens(startParts[startParts.length - 1]).length > 0
    ) {
      startParts.pop();
    }
    const datePart = startParts.join(", ");
    const prefix = datePart ? `${datePart}, ` : "";
    return `${prefix}${startTime}`;
  }

  return `${trimmedStart} – ${trimmedEnd}`;
};

function formatEventRangeDisplay(
  startInput: string | null | undefined,
  endInput: string | null | undefined,
  options?: { timeZone?: string | null; allDay?: boolean }
): string | null {
  const { timeZone, allDay } = options || {};
  if (!startInput) return null;
  try {
    const startParsed = parseDatePreserveFloating(startInput);
    const start = startParsed.date;
    const startFloating = startParsed.floating;
    if (Number.isNaN(start.getTime())) throw new Error("invalid start");
    const endParsed = endInput ? parseDatePreserveFloating(endInput) : null;
    const end = endParsed ? endParsed.date : null;
    const endFloating = endParsed ? endParsed.floating : false;
    const sameDay =
      !!end &&
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate();
    const useFloatingTz = startFloating || endFloating;
    const tz = useFloatingTz ? "UTC" : timeZone || undefined;
    if (allDay) {
      const dateFmt = new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: tz,
      });
      const label =
        end && !sameDay
          ? `${dateFmt.format(start)} – ${dateFmt.format(end)}`
          : dateFmt.format(start);
      return `${label} (all day)`;
    }
    const dateFmt = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: tz,
    });
    const timeFmt = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: tz,
    });
    if (end) {
      if (sameDay) {
        return `${dateFmt.format(start)}, ${timeFmt.format(
          start
        )} – ${timeFmt.format(end)}`;
      }
      const dateTimeFmt = new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: tz,
      });
      return `${dateTimeFmt.format(start)} – ${dateTimeFmt.format(end)}`;
    }
    const dateTimeFmt = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: tz,
    });
    return dateTimeFmt.format(start);
  } catch {
    const startStr = (startInput || "").toString();
    if (!endInput) return startStr || null;
    const startPrefix = startStr.split(",")[0]?.trim?.() ?? startStr;
    const endStr = (endInput || "").toString();
    if (startPrefix && endStr.startsWith(startPrefix)) {
      const suffix = endStr.slice(startPrefix.length).replace(/^\s*,\s*/g, "");
      return suffix ? `${startStr} – ${suffix}` : startStr;
    }
    return endStr ? `${startStr} – ${endStr}` : startStr;
  }
}

export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }> | { id: string };
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
}) {
  const awaitedParams = await params;
  const awaitedSearchParams = await (searchParams as any);
  const acceptRaw = String(
    ((awaitedSearchParams as any)?.accept ?? "") as string
  )
    .trim()
    .toLowerCase();
  const autoAccept = acceptRaw === "1" || acceptRaw === "true";
  // Try to resolve by slug, slug-id, or id; prefer user context for slug-only matches
  const session: any = await getServerSession(authOptions as any);
  const sessionEmail = (session?.user?.email as string | undefined) || null;
  const userId = sessionEmail ? await getUserIdByEmail(sessionEmail) : null;
  const row = await getEventHistoryBySlugOrId({
    value: awaitedParams.id,
    userId,
  });
  if (!row) return notFound();
  const isOwner = Boolean(userId && row.user_id && userId === row.user_id);
  const ownerUser =
    !isOwner && row.user_id ? await getUserById(row.user_id) : null;
  const ownerDisplayName = (() => {
    if (!ownerUser) return "Unknown";
    const full = [ownerUser.first_name || "", ownerUser.last_name || ""]
      .join(" ")
      .trim();
    return full || ownerUser.email || "Unknown";
  })();
  let recipientAccepted = false;
  let recipientPending = false;
  let isReadOnly = false; // Read-only mode for non-authenticated users
  const isShared = Boolean((row.data as any)?.shared);
  const isSharedOut = Boolean((row.data as any)?.sharedOut);
  if (!isOwner) {
    if (!userId) {
      // Allow viewing in read-only mode for non-authenticated users
      isReadOnly = true;
    } else {
      const access = await isEventSharedWithUser(row.id, userId);
      if (access === true) {
        // ok
        recipientAccepted = true;
      } else if (access === false) {
        const pending = await isEventSharePendingForUser(row.id, userId);
        if (pending) {
          recipientPending = true;
          if (autoAccept) {
            try {
              await fetch(`/api/events/share/accept`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ eventId: row.id }),
                cache: "no-store",
              });
            } catch {}
          }
        } else {
          // Not shared with this user, allow read-only access
          isReadOnly = true;
        }
      } else if (access === null) {
        // No shares table → allow read-only access
        isReadOnly = true;
      }
    }
  }
  let shareStats: { accepted_count: number; pending_count: number } | null =
    null;
  if (isOwner) {
    try {
      const stats = await listSharesByOwnerForEvents(userId!, [row.id]);
      const s = stats.find((x) => x.event_id === row.id);
      if (s)
        shareStats = {
          accepted_count: s.accepted_count,
          pending_count: s.pending_count,
        };
    } catch {}
  }
  const title = row.title as string;
  const createdAt = row.created_at as string | undefined;
  const data = row.data as any;
  const attachmentInfo = (() => {
    const raw = data?.attachment;
    if (
      raw &&
      typeof raw === "object" &&
      typeof raw.dataUrl === "string"
    ) {
      return {
        name:
          typeof raw.name === "string" && raw.name.trim()
            ? raw.name
            : "Attachment",
        type:
          typeof raw.type === "string" && raw.type.trim()
            ? raw.type
            : "application/octet-stream",
        dataUrl: raw.dataUrl as string,
      };
    }
    return null;
  })();
  const categoryRaw = typeof data?.category === "string" ? data.category : "";
  const categoryNormalized = categoryRaw.toLowerCase();
  const registriesAllowed =
    categoryNormalized === "birthdays" || categoryNormalized === "weddings";
  const registryLinksRaw = Array.isArray(data?.registries)
    ? (data.registries as any[])
    : [];
  const registryLinks = registriesAllowed
    ? normalizeRegistryLinks(
        registryLinksRaw.map((item: any) => ({
          label: typeof item?.label === "string" ? item.label : "",
          url: typeof item?.url === "string" ? item.url : "",
        }))
      )
    : [];
  const registryCards = registryLinks.map((link) => {
    const brand = getRegistryBrandByUrl(link.url);
    let host = "";
    try {
      host = new URL(link.url).hostname.replace(/^www\./, "");
    } catch {
      host = link.url;
    }
    const badgeText = (brand?.defaultLabel || link.label || host || "R")
      .trim()
      .slice(0, 1)
      .toUpperCase();
    return {
      ...link,
      host,
      badgeText,
      accentColor: brand?.accentColor || "#334155",
      textColor: brand?.foregroundColor || "#FFFFFF",
      brandLabel: brand?.defaultLabel || null,
    };
  });
  const startForDisplay =
    (typeof data?.startISO === "string" && data.startISO) ||
    (typeof data?.start === "string" && data.start) ||
    null;
  const endForDisplay =
    (typeof data?.endISO === "string" && data.endISO) ||
    (typeof data?.end === "string" && data.end) ||
    null;
  let whenLabel = formatEventRangeDisplay(startForDisplay, endForDisplay, {
    timeZone:
      (typeof data?.timezone === "string" && data.timezone) || undefined,
    allDay: Boolean(data?.allDay),
  });
  const rawStartLabel =
    typeof data?.start === "string" ? (data.start as string) : null;
  const rawEndLabel =
    typeof data?.end === "string" ? (data.end as string) : null;
  const fallbackRangeLabel = buildFallbackRangeLabel(
    rawStartLabel,
    rawEndLabel
  );
  if (fallbackRangeLabel) {
    if (!whenLabel) {
      whenLabel = fallbackRangeLabel;
    } else {
      const computedTokens = extractTimeTokens(whenLabel);
      const computedStartToken = computedTokens[0] || null;
      const computedEndToken =
        computedTokens.length > 1
          ? computedTokens[computedTokens.length - 1]
          : computedTokens[0] || null;
      const rawStartToken = extractTimeTokens(rawStartLabel)[0] || null;
      const rawEndToken = extractTimeTokens(rawEndLabel)[0] || null;
      const mismatch =
        (rawStartToken &&
          (!computedStartToken ||
            !timeTokensEquivalent(rawStartToken, computedStartToken))) ||
        (rawEndToken &&
          (!computedEndToken ||
            !timeTokensEquivalent(rawEndToken, computedEndToken)));
      if (mismatch) {
        whenLabel = fallbackRangeLabel;
      }
    }
  }
  const slugify = (t: string) =>
    (t || "event")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  const slug = slugify(title);
  const base = process.env.NEXT_PUBLIC_BASE_URL || "";
  const canonical = `/event/${slug}-${row.id}`;
  const shareUrl = `${base}${canonical}`;

  // Redirect to canonical slug-id URL if needed
  if (awaitedParams.id !== `${slug}-${row.id}`) {
    redirect(canonical);
  }
  if (autoAccept) {
    redirect(canonical);
  }

  // Detect RSVP phone and build SMS/Call links
  // First try the rsvp field, then fall back to searching description/location
  const rsvpField = (data?.rsvp as string | undefined) || "";
  const aggregateContactText = `${rsvpField} ${
    (data?.description as string | undefined) || ""
  } ${(data?.location as string | undefined) || ""}`.trim();
  const rsvpPhone = extractFirstPhoneNumber(aggregateContactText);

  // Extract just the name from RSVP field (remove "RSVP:" prefix, phone number, and option text)
  const rsvpNameRaw = rsvpField
    ? rsvpField
        .replace(/^RSVP:?\s*/i, "") // Remove "RSVP:" or "RSVP" prefix
        .replace(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g, "") // Remove phone number
        .replace(/\(\d{3}\)\s*\d{3}[-.\s]?\d{4}/g, "") // Remove (555) 123-4567 format
        .trim()
    : "";
  const rsvpName = rsvpNameRaw ? cleanRsvpContactLabel(rsvpNameRaw) : "";
  const userName = ((session as any)?.user?.name as string | undefined) || "";
  const smsIntroParts = [
    "Hi, there,",
    userName ? ` this is ${userName},` : "",
    " RSVP-ing for ",
    title || "the event",
  ];
  const isSignedIn = Boolean(sessionEmail);
  const eventTheme = getEventTheme(
    (data?.category as string | undefined) || null
  );
  const categoryLabel = eventTheme.categoryLabel;
  const themeStyleVars = {
    "--event-header-gradient-light": eventTheme.headerLight,
    "--event-header-gradient-dark": eventTheme.headerDark,
    "--event-card-bg-light": eventTheme.cardLight,
    "--event-card-bg-dark": eventTheme.cardDark,
    "--event-border-light": eventTheme.borderLight,
    "--event-border-dark": eventTheme.borderDark,
    "--event-chip-light": eventTheme.chipLight,
    "--event-chip-dark": eventTheme.chipDark,
    "--event-text-light": eventTheme.textLight,
    "--event-text-dark": eventTheme.textDark,
  } satisfies Record<string, string>;

  // Determine whether the event is in the future for conditional rendering
  const isFutureEvent = (() => {
    try {
      const startIso = (data?.startISO as string | undefined) || null;
      const rawStart = (data?.start as string | undefined) || null;
      const parsed = startIso
        ? new Date(startIso)
        : rawStart
        ? new Date(rawStart)
        : null;
      return parsed ? parsed.getTime() > Date.now() : false;
    } catch {
      return false;
    }
  })();

  // Compute a right padding to avoid text flowing under the thumbnail overlay
  const detailsExtraPaddingRight = data?.thumbnail ? " pr-40 sm:pr-48" : "";

  const calendarStartIso = normalizeIso(
    (data?.startISO as string | undefined) ||
      (typeof data?.start === "string" ? data.start : null)
  );
  const rawEndIso =
    (data?.endISO as string | undefined) ||
    (typeof data?.end === "string" ? data.end : null);
  const calendarEndIso = calendarStartIso
    ? ensureEndIso(
        calendarStartIso,
        normalizeIso(rawEndIso),
        Boolean(data?.allDay)
      )
    : null;
  const calendarLinks =
    calendarStartIso && calendarEndIso
      ? buildCalendarLinks({
          title: title || (data?.title as string) || "Event",
          description: (data?.description as string | undefined) || "",
          location: (data?.location as string | undefined) || "",
          startIso: calendarStartIso,
          endIso: calendarEndIso,
          timezone: (data?.timezone as string | undefined) || "",
          allDay: Boolean(data?.allDay),
          reminders: Array.isArray((data as any)?.reminders)
            ? ((data as any).reminders as { minutes?: number }[])
                .map((r) => (typeof r?.minutes === "number" ? r.minutes : null))
                .filter((n): n is number => typeof n === "number" && n > 0)
            : null,
          recurrence:
            typeof (data as any)?.recurrence === "string"
              ? ((data as any)?.recurrence as string)
              : null,
        })
      : null;

  return (
    <main className="max-w-3xl mx-auto px-10 py-14 ipad-gutters pl-[calc(2rem+env(safe-area-inset-left))] pr-[calc(2rem+env(safe-area-inset-right))] pt-[calc(3.5rem+env(safe-area-inset-top))] pb-[calc(3.5rem+env(safe-area-inset-bottom))]">
      {isReadOnly && <ReadOnlyEventLogo />}
      <div
        className="event-theme-scope space-y-6"
        style={themeStyleVars as CSSProperties}
      >
        <section className="event-theme-header relative overflow-hidden rounded-2xl border shadow-lg px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="event-theme-chip flex h-14 w-14 items-center justify-center rounded-full text-3xl shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                  <span aria-hidden="true">{eventTheme.icon}</span>
                  <span className="sr-only">{categoryLabel} icon</span>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
                  {categoryLabel}
                </p>
              </div>
              {!isReadOnly && isOwner && (
                <div className="flex items-center gap-2 text-sm font-medium">
                  <EventEditModal
                    eventId={row.id}
                    eventData={data}
                    eventTitle={title}
                  />
                  <EventDeleteModal eventId={row.id} eventTitle={title} />
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold leading-tight sm:text-2xl">
                {title}
              </h1>
              {(isShared || isSharedOut) && (
                <svg
                  viewBox="0 0 25.274 25.274"
                  fill="currentColor"
                  className="h-6 w-6 opacity-70"
                  aria-hidden="true"
                  aria-label="Shared event"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M24.989,15.893c-0.731-0.943-3.229-3.73-4.34-4.96c0.603-0.77,0.967-1.733,0.967-2.787c0-2.503-2.03-4.534-4.533-4.534 c-2.507,0-4.534,2.031-4.534,4.534c0,1.175,0.455,2.24,1.183,3.045l-1.384,1.748c-0.687-0.772-1.354-1.513-1.792-2.006 c0.601-0.77,0.966-1.733,0.966-2.787c-0.001-2.504-2.03-4.535-4.536-4.535c-2.507,0-4.536,2.031-4.536,4.534 c0,1.175,0.454,2.24,1.188,3.045L0.18,15.553c0,0-0.406,1.084,0,1.424c0.36,0.3,0.887,0.81,1.878,0.258 c-0.107,0.974-0.054,2.214,0.693,2.924c0,0,0.749,1.213,2.65,1.456c0,0,2.1,0.244,4.543-0.367c0,0,1.691-0.312,2.431-1.794 c0.113,0.263,0.266,0.505,0.474,0.705c0,0,0.751,1.213,2.649,1.456c0,0,2.103,0.244,4.54-0.367c0,0,2.102-0.38,2.65-2.339 c0.297-0.004,0.663-0.097,1.149-0.374C24.244,18.198,25.937,17.111,24.989,15.893z M13.671,8.145c0-1.883,1.527-3.409,3.409-3.409 c1.884,0,3.414,1.526,3.414,3.409c0,1.884-1.53,3.411-3.414,3.411C15.198,11.556,13.671,10.029,13.671,8.145z M13.376,12.348 l0.216,0.516c0,0-0.155,0.466-0.363,1.069c-0.194-0.217-0.388-0.437-0.585-0.661L13.376,12.348z M3.576,8.145 c0-1.883,1.525-3.409,3.41-3.409c1.881,0,3.408,1.526,3.408,3.409c0,1.884-1.527,3.411-3.408,3.411 C5.102,11.556,3.576,10.029,3.576,8.145z M2.186,16.398c-0.033,0.07-0.065,0.133-0.091,0.177c-0.801,0.605-1.188,0.216-1.449,0 c-0.259-0.216,0-0.906,0-0.906l2.636-3.321l0.212,0.516c0,0-0.227,0.682-0.503,1.47l-0.665,1.49 C2.325,15.824,2.257,16.049,2.186,16.398z M9.299,20.361c-2.022,0.507-3.758,0.304-3.758,0.304 c-1.574-0.201-2.196-1.204-2.196-1.204c-1.121-1.066-0.348-3.585-0.348-3.585l1.699-3.823c0.671,0.396,1.451,0.627,2.29,0.627 c0.584,0,1.141-0.114,1.656-0.316l2.954,5.417C11.482,19.968,9.299,20.361,9.299,20.361z M9.792,12.758l0.885-0.66 c0,0,2.562,2.827,3.181,3.623c0.617,0.794-0.49,1.501-0.75,1.723c-0.259,0.147-0.464,0.206-0.635,0.226L9.792,12.758z M19.394,20.361c-2.018,0.507-3.758,0.304-3.758,0.304c-1.569-0.201-2.191-1.204-2.191-1.204c-0.182-0.175-0.311-0.389-0.403-0.624 c0.201-0.055,0.433-0.15,0.698-0.301c0.405-0.337,2.102-1.424,1.154-2.643c-0.24-0.308-0.678-0.821-1.184-1.405l1.08-2.435 c0.674,0.396,1.457,0.627,2.293,0.627c0.585,0,1.144-0.114,1.654-0.316l2.955,5.417C21.582,19.968,19.394,20.361,19.394,20.361z M23.201,17.444c-0.255,0.147-0.461,0.206-0.63,0.226l-2.68-4.912l0.879-0.66c0,0,2.562,2.827,3.181,3.623 C24.57,16.516,23.466,17.223,23.201,17.444z"></path>
                </svg>
              )}
            </div>
            {createdAt && isSignedIn && (
              <p className="text-sm opacity-80">
                Created {new Date(createdAt).toLocaleString()}
              </p>
            )}
            {!isOwner && ownerDisplayName && (
              <p className="text-sm opacity-80">Hosted by {ownerDisplayName}</p>
            )}
          </div>
        </section>

        <section
          className={`event-theme-card rounded-2xl border px-6 py-6 shadow-sm`}
        >
          <dl className="grid grid-cols-1 gap-5 text-sm sm:grid-cols-2">
            {data?.allDay && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide opacity-70">
                  When
                </dt>
                <dd className="mt-1 text-base font-semibold">All day event</dd>
              </div>
            )}
            {whenLabel ? (
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide opacity-70">
                  When
                </dt>
                <dd className="mt-1 break-all text-base font-semibold">
                  {whenLabel}
                </dd>
              </div>
            ) : (
              <>
                {data?.start && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide opacity-70">
                      Start
                    </dt>
                    <dd className="mt-1 break-all text-base font-semibold">
                      {data.start}
                    </dd>
                  </div>
                )}
                {data?.end && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide opacity-70">
                      End
                    </dt>
                    <dd className="mt-1 break-all text-base font-semibold">
                      {data.end}
                    </dd>
                  </div>
                )}
              </>
            )}
            {data?.venue && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide opacity-70">
                  Venue
                </dt>
                <dd className="mt-1 text-base font-semibold">{data.venue}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide opacity-70">
                {data?.venue ? "Address" : "Location"}
              </dt>
              <dd className="mt-1">
                <LocationLink
                  location={data?.location}
                  query={combineVenueAndLocation(
                    (typeof data?.venue === "string" && data.venue) || null,
                    (typeof data?.location === "string" && data.location) ||
                      null
                  )}
                  className="text-base font-semibold"
                />
              </dd>
            </div>
            {calendarLinks && (
              <div className="sm:col-start-1">
                <dt className="text-xs font-semibold uppercase tracking-wide opacity-70">
                  Add to calendar
                </dt>
                <dd className="mt-1  space-y-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={calendarLinks.appleInline}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface/80 text-foreground/80 transition-colors hover:bg-foreground/5"
                      aria-label="Add to Apple Calendar"
                      title="Apple Calendar"
                    >
                      <CalendarIconApple className="h-5 w-5" />
                    </a>
                    <a
                      href={calendarLinks.google}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface/80 text-foreground/80 transition-colors hover:bg-foreground/5"
                      aria-label="Add to Google Calendar"
                      title="Google Calendar"
                    >
                      <CalendarIconGoogle className="h-5 w-5" />
                    </a>
                    <a
                      href={calendarLinks.outlook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface/80 text-foreground/80 transition-colors hover:bg-foreground/5"
                      aria-label="Add to Outlook Calendar"
                      title="Outlook Calendar"
                    >
                      <CalendarIconOutlook className="h-5 w-5" />
                    </a>
                  </div>
                </dd>
              </div>
            )}
            {(rsvpName || rsvpPhone) && (
              <div className="sm:col-start-2">
                <dt className="text-xs font-semibold uppercase tracking-wide opacity-70">
                  RSVP
                </dt>
                <dd className="mt-1">
                  <EventRsvpPrompt
                    rsvpName={rsvpName}
                    rsvpPhone={rsvpPhone}
                    eventTitle={title}
                    shareUrl={shareUrl}
                  />
                </dd>
              </div>
            )}
          </dl>
          {attachmentInfo && false && (
            <div className="mt-6 border-t border-black/10 pt-4 text-sm leading-relaxed dark:border-white/15">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                Attachment
              </p>
              <a
                href={attachmentInfo.dataUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={attachmentInfo.name}
                className="mt-2 inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:border-foreground/50 hover:bg-surface/80"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs">
                  {attachmentInfo.type.startsWith("image/") ? "🖼" : "📄"}
                </span>
                <span className="truncate" title={attachmentInfo.name}>
                  {attachmentInfo.name}
                </span>
              </a>
            </div>
          )}
          {data?.description && (
            <div className="mt-6 border-t border-black/10 pt-4 text-sm leading-relaxed dark:border-white/15">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                Description
              </p>
              <p className="mt-2 whitespace-pre-wrap">{data.description}</p>
            </div>
          )}
          {registriesAllowed && registryCards.length > 0 && (
            <div className="mt-6 border-t border-black/10 pt-4 text-sm leading-relaxed dark:border-white/15">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                Registries
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {registryCards.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:border-foreground/40 hover:bg-surface/80"
                  >
                    <span
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                      style={{ backgroundColor: link.accentColor, color: link.textColor }}
                      aria-hidden="true"
                    >
                      {link.badgeText}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 text-sm font-semibold text-foreground group-hover:text-foreground">
                        {link.label}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4 opacity-60 transition-opacity group-hover:opacity-90"
                          aria-hidden="true"
                        >
                          <path d="M8.5 5.5L12.5 10l-4 4.5" />
                        </svg>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-foreground/60">
                        {link.host}
                      </span>
                    </span>
                  </a>
                ))}
              </div>
              <p className="mt-3 text-xs text-foreground/60">
                These links open in a new tab. Registries must stay public or shareable so guests can view them.
              </p>
            </div>
          )}

          {data?.thumbnail && (
            <div className="mt-6 flex justify-center">
              <ThumbnailModal
                src={data.thumbnail as string}
                alt={`${title} flyer`}
                className="relative rounded border border-border bg-surface px-2 py-2 shadow"
              />
            </div>
          )}

          <EventActions
            shareUrl={shareUrl}
            event={data as any}
            className="mt-6 w-full"
            historyId={!isReadOnly ? row.id : undefined}
          />
        </section>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {!isReadOnly && isOwner && (
          <section className="rounded border border-border p-3 bg-surface">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground/80">
                Guests invited:
              </h3>
            </div>
            {/* Recipient list (server-rendered) */}
            {(() => {
              const List = () => null; // noop placeholder for JSX lints
              return null;
            })()}
            {shareStats ? (
              <div className="mt-2">
                {/* Detailed list with remove buttons */}
                <ul className="space-y-1">
                  {(
                    await (async () => {
                      try {
                        return await listShareRecipientsForEvent(
                          userId!,
                          row.id
                        );
                      } catch {
                        return [] as any[];
                      }
                    })()
                  ).map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="truncate">
                        {r.name} —{"\u00a0"}
                        {r.status === "accepted" ? "Accepted" : "Pending"}
                      </span>
                      <form
                        action={async () => {
                          "use server";
                          try {
                            await revokeShareByOwner(r.id, userId!);
                          } catch {}
                          try {
                            revalidatePath(canonical);
                          } catch {}
                          redirect(canonical);
                        }}
                      >
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors rounded-md"
                          title="Remove access"
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
                            <polyline points="3,6 5,6 21,6" />
                            <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </form>
                    </li>
                  ))}
                  <li className="pt-1">
                    <span className="text-xs text-foreground/70">
                      Use the "Invite" button above to add more participants.
                    </span>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="mt-2 text-xs text-foreground/70">
                No guests invited yet. Use the "Invite" button above to add
                guests.
              </div>
            )}
          </section>
        )}
        {/* +Add has been moved to the Shared with box header */}
        {!isReadOnly && !isOwner ? (
          <section className="rounded border border-border p-3 bg-surface">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground/80">
                Shared by:
              </h3>
              {(isShared || recipientAccepted) && (
                <form
                  action={async () => {
                    "use server";
                    try {
                      await revokeEventShare({
                        eventId: row.id,
                        byUserId: userId!,
                      });
                    } catch {}
                    try {
                      revalidatePath(canonical);
                    } catch {}
                    redirect(canonical);
                  }}
                >
                  <button
                    type="submit"
                    className="inline-flex items-center gap-3 rounded-lg px-3 py-2 text-red-500 hover:bg-red-500/10"
                    title="Remove this shared event from my calendar"
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
                      <path d="M3 6h18" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </form>
              )}
            </div>
            <ul className="mt-2 space-y-1">
              <li className="flex items-center justify-between text-sm">
                <span className="truncate">
                  {ownerDisplayName} —{"\u00a0"}
                  {recipientPending ? "Pending" : "Accepted"}
                </span>
                {recipientPending && (
                  <form
                    action={async () => {
                      "use server";
                      try {
                        await acceptEventShare({
                          eventId: row.id,
                          recipientUserId: userId!,
                        });
                      } catch {}
                      try {
                        revalidatePath(canonical);
                      } catch {}
                      redirect(canonical);
                    }}
                  >
                    <button
                      type="submit"
                      className="text-xs rounded border border-border bg-surface px-3 py-1 hover:bg-foreground/5"
                      title="Accept and add to my calendar"
                    >
                      Accept
                    </button>
                  </form>
                )}
              </li>
            </ul>
          </section>
        ) : null}
      </div>
      {isReadOnly && (
        <div className="mt-6">
          <ReadOnlyBanner />
        </div>
      )}
    </main>
  );
}

type CalendarLinkArgs = {
  title: string;
  description: string;
  location: string;
  startIso: string;
  endIso: string;
  timezone?: string;
  allDay: boolean;
  reminders: number[] | null;
  recurrence: string | null;
};

type CalendarLinkSet = {
  appleInline: string;
  appleDownload: string;
  google: string;
  outlook: string;
};

function normalizeIso(input: unknown): string | null {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const d = new Date(trimmed);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

function ensureEndIso(
  startIso: string,
  endIso: string | null,
  allDay: boolean
): string {
  if (endIso) return endIso;
  try {
    const start = new Date(startIso);
    if (Number.isNaN(start.getTime())) return startIso;
    if (allDay) {
      start.setUTCDate(start.getUTCDate() + 1);
    } else {
      start.setUTCMinutes(start.getUTCMinutes() + 90);
    }
    return start.toISOString();
  } catch {
    return endIso || startIso;
  }
}

function buildCalendarLinks(args: CalendarLinkArgs): CalendarLinkSet {
  const { title, description, location, startIso, endIso, timezone, allDay } =
    args;
  const google = buildGoogleCalendarUrl({
    title,
    description,
    location,
    startIso,
    endIso,
    allDay,
    timezone: timezone || "",
  });
  const outlook = buildOutlookComposeUrl({
    title,
    description,
    location,
    startIso,
    endIso,
    allDay,
  });
  const ics = buildIcsLinks({
    title,
    description,
    location,
    startIso,
    endIso,
    reminders: args.reminders,
    recurrence: args.recurrence,
  });
  return {
    appleInline: ics.inlineUrl,
    appleDownload: ics.downloadUrl,
    google,
    outlook,
  };
}

function buildGoogleCalendarUrl({
  title,
  description,
  location,
  startIso,
  endIso,
  allDay,
  timezone,
}: {
  title: string;
  description: string;
  location: string;
  startIso: string;
  endIso: string;
  allDay: boolean;
  timezone: string;
}): string {
  const encode = encodeURIComponent;
  const dates = allDay
    ? `${toGoogleDateOnly(startIso)}/${toGoogleDateOnly(endIso)}`
    : `${toGoogleTimestamp(startIso)}/${toGoogleTimestamp(endIso)}`;
  let url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encode(
    title || "Event"
  )}&details=${encode(description || "")}&location=${encode(
    location || ""
  )}&dates=${dates}`;
  if (timezone) {
    url += `&ctz=${encode(timezone)}`;
  }
  return url;
}

function buildOutlookComposeUrl({
  title,
  description,
  location,
  startIso,
  endIso,
  allDay,
}: {
  title: string;
  description: string;
  location: string;
  startIso: string;
  endIso: string;
  allDay: boolean;
}): string {
  const params = new URLSearchParams({
    rru: "addevent",
    allday: String(Boolean(allDay)),
    subject: title || "Event",
    startdt: toOutlookParam(startIso),
    enddt: toOutlookParam(endIso),
    location: location || "",
    body: description || "",
    path: "/calendar/view/Month",
  }).toString();
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params}`;
}

function buildIcsLinks({
  title,
  description,
  location,
  startIso,
  endIso,
  reminders,
  recurrence,
}: {
  title: string;
  description: string;
  location: string;
  startIso: string;
  endIso: string;
  reminders: number[] | null;
  recurrence: string | null;
}): { downloadUrl: string; inlineUrl: string } {
  const params = new URLSearchParams({
    title: title || "Event",
    start: startIso,
    end: endIso,
    location: location || "",
    description: description || "",
    timezone: "",
    floating: "1",
  });
  if (reminders && reminders.length) {
    params.set("reminders", reminders.join(","));
  }
  if (recurrence) {
    params.set("recurrence", recurrence);
  }
  const base = `/api/ics?${params.toString()}`;
  return {
    downloadUrl: base,
    inlineUrl: `${base}${base.includes("?") ? "&" : "?"}disposition=inline`,
  };
}

function toGoogleTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) throw new Error("Invalid date");
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
}

function toGoogleDateOnly(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) throw new Error("Invalid date");
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
      `${d.getUTCFullYear()}` +
      `${pad(d.getUTCMonth() + 1)}` +
      `${pad(d.getUTCDate())}`
    );
  } catch {
    return iso.slice(0, 10).replace(/-/g, "");
  }
}

function toOutlookParam(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) throw new Error("Invalid date");
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
}

function CalendarIconGoogle({ className }: { className?: string }) {
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

function CalendarIconOutlook({ className }: { className?: string }) {
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

function CalendarIconApple({ className }: { className?: string }) {
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

