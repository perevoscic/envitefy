import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import nextDynamic from "next/dynamic";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import type { CSSProperties } from "react";
import { cache } from "react";
import AccessCodeGate from "@/components/AccessCodeGate";
import AppleCalendarLink from "@/components/AppleCalendarLink";
import { BIRTHDAY_THEMES } from "@/components/birthdays/birthdayThemes";
import {
  CalendarIconApple,
  CalendarIconGoogle,
  CalendarIconOutlook,
} from "@/components/CalendarIcons";
import EventActions from "@/components/EventActions";
import EventDeleteModal from "@/components/EventDeleteModal";
import EventMap from "@/components/EventMap";
import EventRsvpDashboard from "@/components/EventRsvpDashboard";
import EventRsvpPrompt from "@/components/EventRsvpPrompt";
import { isGymMeetTemplateId } from "@/components/gym-meet-templates/registry";
import LocationLink from "@/components/LocationLink";
import SponsoredSupplies from "@/components/SponsoredSupplies";
import ThumbnailModal from "@/components/ThumbnailModal";
import { absoluteUrl } from "@/lib/absolute-url";
import { authOptions } from "@/lib/auth";
import { isOcrBirthdayRenderer, selectBirthdayOcrThemeId } from "@/lib/birthday-ocr-template";
import { invalidateUserDashboard } from "@/lib/dashboard-cache";
import { isScannedInviteCreatedVia, normalizeDashboardEventOwnership } from "@/lib/dashboard-data";
import {
  acceptEventShare,
  getEventHistoryPublicRenderBySlugOrId,
  getUserById,
  getUserIdByEmail,
  isEventSharedWithUser,
  isEventSharePendingForUser,
  revokeEventShare,
} from "@/lib/db";
import { redactDiscoverySourceForPublicView } from "@/lib/discovery-public-redact";
import { getEventAccessCookieName, verifyEventAccessCookieValue } from "@/lib/event-access";
import { getEventTheme } from "@/lib/event-theme";
import { invalidateUserHistory } from "@/lib/history-cache";
import { combineVenueAndLocation } from "@/lib/mappers";
import { createServerTimingTracker } from "@/lib/server-timing";
import { resolveEventThemeColor } from "@/lib/theme-color";
import type { SignupForm } from "@/types/signup";
import { decorateAmazonUrl } from "@/utils/affiliates";
import { buildCalendarLinks, ensureEndIso } from "@/utils/calendar-links";
import { findFirstEmail } from "@/utils/contact";
import { buildEditLink, resolveEditHref } from "@/utils/event-edit-route";
import { buildEventPath, buildEventSlugSegment } from "@/utils/event-url";
import type { ImageColors } from "@/utils/image-colors";
import { extractFirstPhoneNumber } from "@/utils/phone";
import { getRegistryBrandByUrl, normalizeRegistryLinks } from "@/utils/registry-links";
import { cleanRsvpContactLabel } from "@/utils/rsvp";
import { sanitizeSignupForm } from "@/utils/signup";
import { resolveFootballSeasonTemplateChrome } from "../football-season/customize/footballSeasonTemplateTheme";
import ReadOnlyBanner from "./ReadOnlyBanner";

const SignupViewer = nextDynamic(() => import("@/components/smart-signup-form/SignupViewer"), {
  loading: () => null,
});
const BirthdayTemplateView = nextDynamic(() => import("@/components/BirthdayTemplateView"), {
  loading: () => null,
});
const WeddingTemplateView = nextDynamic(() => import("@/components/WeddingTemplateView"), {
  loading: () => null,
});
const SimpleTemplateView = nextDynamic(() => import("@/components/SimpleTemplateView"), {
  loading: () => null,
});
const FootballDiscoveryContent = nextDynamic(
  () => import("@/components/football-discovery/FootballDiscoveryContent"),
  { loading: () => null },
);
const BabyShowerTemplateView = nextDynamic(() => import("@/components/BabyShowerTemplateView"), {
  loading: () => null,
});
const BirthdayRenderer = nextDynamic(() => import("@/components/birthdays/BirthdayRenderer"), {
  loading: () => null,
});
const EventOwnerWorkspace = nextDynamic(() => import("@/components/EventOwnerWorkspace"), {
  loading: () => null,
});
const DiscoveryEventEditLayout = nextDynamic(
  () => import("@/components/DiscoveryEventEditLayout"),
  { loading: () => null },
);

export const dynamic = "force-dynamic";
const EVENT_PAGE_TIMING_ENV = process.env.EVENT_PAGE_TIMING === "1";

const getCachedEventHistoryBySlugOrId = cache(async (value: string, userId?: string | null) =>
  getEventHistoryPublicRenderBySlugOrId({
    value,
    userId: userId || undefined,
  }),
);

const FLOATING_ISO_REGEX = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/;

const parseDatePreserveFloating = (input: string): { date: Date; floating: boolean } => {
  const floatingMatch = FLOATING_ISO_REGEX.exec(input);
  if (floatingMatch) {
    const [, y, m, d, hh, mm, ss] = floatingMatch;
    const date = new Date(
      Date.UTC(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss || "0")),
    );
    return { date, floating: true };
  }
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("invalid date");
  }
  return { date: parsed, floating: false };
};

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const timing = createServerTimingTracker(EVENT_PAGE_TIMING_ENV);
  const awaitedParams = await props.params;
  const row = await timing.time("metadata_event_lookup", () =>
    getCachedEventHistoryBySlugOrId(awaitedParams.id, null),
  );
  const data: any = row?.data || {};
  const title = (typeof data?.title === "string" && data.title) || row?.title || "Event";

  // Only expose a generic description publicly to avoid leaking private details
  const description = "View the event details, schedule, and RSVP right here.";

  // Generate OG image URL
  const img = await absoluteUrl(`/event/${encodeURIComponent(awaitedParams.id)}/opengraph-image`);

  // Generate canonical URL
  const url = await absoluteUrl(`/event/${encodeURIComponent(awaitedParams.id)}`);

  if (timing.enabled) {
    console.info("[event-page][metadata]", {
      id: awaitedParams.id,
      timings: timing.toObject(),
    });
  }

  return {
    title: `${title} — Envitefy`,
    description,
    openGraph: {
      title: `${title} — Envitefy`,
      description,
      url,
      siteName: "Envitefy",
      images: [
        {
          url: img,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — Envitefy`,
      description,
      images: [img],
    },
    alternates: {
      canonical: url,
    },
  };
}

export async function generateViewport(props: { params: Promise<{ id: string }> }) {
  const awaitedParams = await props.params;
  const row = await getCachedEventHistoryBySlugOrId(awaitedParams.id, null);

  return {
    themeColor: resolveEventThemeColor(row?.data || null),
  };
}

const TIME_TOKEN_GLOBAL_REGEX =
  /\b(\d{1,2})(?::(\d{2}))?\s*(?:a\.?m\.?|p\.?m\.?)\b|\b([01]?\d|2[0-3]):([0-5]\d)\b/gi;

const extractTimeTokens = (value?: string | null): string[] => {
  if (!value) return [];
  const tokens: string[] = [];
  TIME_TOKEN_GLOBAL_REGEX.lastIndex = 0;
  let match = TIME_TOKEN_GLOBAL_REGEX.exec(value);
  while (match) {
    tokens.push(match[0]);
    match = TIME_TOKEN_GLOBAL_REGEX.exec(value);
  }
  return tokens;
};

const normalizeTimeToken = (token: string | null | undefined): number | null => {
  if (!token) return null;
  const trimmed = token.trim().toLowerCase().replace(/\s+/g, " ");
  const ampmMatch = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)$/i) || null;
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
  const militaryMatch = trimmed.match(/^([01]?\d|2[0-3]):([0-5]\d)$/) || null;
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
  b: string | null | undefined,
): boolean => {
  if (!a || !b) return false;
  const m1 = normalizeTimeToken(a);
  const m2 = normalizeTimeToken(b);
  if (m1 !== null && m2 !== null) {
    return Math.abs(m1 - m2) <= 1;
  }
  const normalize = (s: string) => s.trim().toLowerCase().replace(/\./g, "").replace(/\s+/g, " ");
  return normalize(a) === normalize(b);
};

const buildFallbackRangeLabel = (
  startLabel?: string | null,
  endLabel?: string | null,
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
    if (startParts.length && extractTimeTokens(startParts[startParts.length - 1]).length > 0) {
      startParts.pop();
    }
    const datePart = startParts.join(", ");
    const endRemainder = trimmedEnd.replace(endTime, "").replace(/,\s*$/, "").trim();
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
    if (startParts.length && extractTimeTokens(startParts[startParts.length - 1]).length > 0) {
      startParts.pop();
    }
    const datePart = startParts.join(", ");
    const prefix = datePart ? `${datePart}, ` : "";
    return `${prefix}${startTime}`;
  }

  return `${trimmedStart} – ${trimmedEnd}`;
};

function formatTimeAndDate(
  startInput: string | null | undefined,
  endInput: string | null | undefined,
  options?: { timeZone?: string | null; allDay?: boolean },
): { time: string | null; date: string | null } {
  const { timeZone, allDay } = options || {};
  if (!startInput) return { time: null, date: null };

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
      const dateFmt = new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: tz,
      });
      const dateLabel =
        end && !sameDay
          ? `${dateFmt.format(start)} – ${dateFmt.format(end)}`
          : dateFmt.format(start);
      return { time: null, date: `${dateLabel} (all day)` };
    }

    const dateFmt = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: tz,
    });
    const timeFmt = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: tz,
    });

    let time: string | null = null;
    let date: string | null = null;

    if (end) {
      if (sameDay) {
        time = `${timeFmt.format(start)} – ${timeFmt.format(end)}`;
        date = dateFmt.format(start);
      } else {
        time = `${timeFmt.format(start)} – ${timeFmt.format(end)}`;
        date = `${dateFmt.format(start)} – ${dateFmt.format(end)}`;
      }
    } else {
      time = timeFmt.format(start);
      date = dateFmt.format(start);
    }

    return { time, date };
  } catch {
    return { time: null, date: null };
  }
}

function splitAddress(address: string | null | undefined): {
  street: string;
  cityStateZip: string;
} {
  if (!address) return { street: "", cityStateZip: "" };

  // Try to split by comma - usually address is "street, city, state zip"
  const parts = address.split(",").map((p) => p.trim());

  if (parts.length >= 3) {
    // Likely "street, city, state zip"
    const lastPart = parts[parts.length - 1];
    // Check if last part has a zip code (5 digits)
    const zipMatch = lastPart.match(/\b\d{5}(?:-\d{4})?\b/);

    if (zipMatch) {
      // Format: "street, city, state zip"
      const street = parts[0]; // First part is street
      const cityStateZip = parts.slice(1).join(", "); // Rest is city, state zip
      return { street, cityStateZip };
    }
  }

  if (parts.length >= 2) {
    // Last part is usually "state zip" or just "city"
    const lastPart = parts[parts.length - 1];
    // Check if last part has a zip code (5 digits)
    const zipMatch = lastPart.match(/\b\d{5}(?:-\d{4})?\b/);

    if (zipMatch) {
      // Format: "street, state zip" (no city, or city is in street)
      const street = parts[0];
      const cityStateZip = parts[parts.length - 1];
      return { street, cityStateZip };
    }
  }

  // Fallback: return as-is if we can't parse
  return { street: address, cityStateZip: "" };
}

function formatEventRangeDisplay(
  startInput: string | null | undefined,
  endInput: string | null | undefined,
  options?: { timeZone?: string | null; allDay?: boolean },
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
        return `${dateFmt.format(start)}, ${timeFmt.format(start)} – ${timeFmt.format(end)}`;
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
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const baseTiming = createServerTimingTracker(EVENT_PAGE_TIMING_ENV);
  const awaitedParams = await params;
  const awaitedSearchParams = await searchParams;
  const timingRequestedRaw = String(((awaitedSearchParams as any)?.timing ?? "") as string)
    .trim()
    .toLowerCase();
  const timingRequested = timingRequestedRaw === "1" || timingRequestedRaw === "true";
  const timing =
    timingRequested && !baseTiming.enabled ? createServerTimingTracker(true) : baseTiming;
  const acceptRaw = String(((awaitedSearchParams as any)?.accept ?? "") as string)
    .trim()
    .toLowerCase();
  const createdFlag = String(((awaitedSearchParams as any)?.created ?? "") as string)
    .trim()
    .toLowerCase();
  const createdParam = createdFlag === "1" || createdFlag === "true";
  const autoAccept = acceptRaw === "1" || acceptRaw === "true";
  // Try to resolve by slug, slug-id, or id; prefer user context for slug-only matches
  const session: any = await timing.time("session", () => getServerSession(authOptions as any));
  const sessionEmail = (session?.user?.email as string | undefined) || null;
  const userId = sessionEmail
    ? await timing.time("user_lookup", () => getUserIdByEmail(sessionEmail))
    : null;
  const row = await timing.time("event_lookup", () =>
    getCachedEventHistoryBySlugOrId(awaitedParams.id, userId),
  );
  if (!row) return notFound();
  const isOwner = Boolean(userId && row.user_id && userId === row.user_id);
  const ownerUserId = typeof row.user_id === "string" ? row.user_id : null;
  const ownerUser =
    !isOwner && ownerUserId
      ? await timing.time("owner_lookup", () => getUserById(ownerUserId))
      : null;
  const ownerDisplayName = (() => {
    if (!ownerUser) return "Unknown";
    const full = [ownerUser.first_name || "", ownerUser.last_name || ""].join(" ").trim();
    return full || ownerUser.email || "Unknown";
  })();
  let recipientAccepted = false;
  let recipientPending = false;
  let isReadOnly = false; // Read-only mode for non-authenticated users
  const isShared = Boolean((row.data as any)?.shared);
  const _isSharedOut = Boolean((row.data as any)?.sharedOut);
  let hasShareRelation = isShared;
  if (!isOwner) {
    if (!userId) {
      // Allow viewing in read-only mode for non-authenticated users
      isReadOnly = true;
    } else {
      const access = await timing.time("share_access_lookup", () =>
        isEventSharedWithUser(row.id, userId),
      );
      if (access === true) {
        // ok
        recipientAccepted = true;
        hasShareRelation = true;
      } else if (access === false) {
        const pending = await timing.time("share_pending_lookup", () =>
          isEventSharePendingForUser(row.id, userId),
        );
        if (pending) {
          recipientPending = true;
          hasShareRelation = true;
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
  const title = row.title as string;
  const _createdAt = row.created_at as string | undefined;
  const data = (() => {
    if (!row.data) return {};
    if (typeof row.data === "string") {
      try {
        const parsed = JSON.parse(row.data);
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch {
        return {};
      }
    }
    return typeof row.data === "object" ? (row.data as any) : {};
  })();
  const media = row.media;
  const buildMediaUrl = (
    variant?: "thumbnail" | "attachment" | "profile" | "hero" | "signup-header",
  ) => {
    const params = new URLSearchParams();
    if (variant) params.set("variant", variant);
    const sig =
      variant === "attachment"
        ? media.attachmentSig
        : variant === "profile"
          ? media.profileImageSig
          : variant === "hero"
            ? media.customHeroImageSig || media.heroImageSig
            : variant === "signup-header"
              ? media.signupHeaderSig
              : media.thumbnailSig || media.attachmentSig;
    if (sig) params.set("v", sig);
    const qs = params.toString();
    return `/api/events/${row.id}/thumbnail${qs ? `?${qs}` : ""}`;
  };

  if (media.thumbnailInline) {
    (data as any).thumbnail = buildMediaUrl("thumbnail");
  }
  if (media.attachmentInline && data?.attachment && typeof data.attachment === "object") {
    data.attachment = {
      ...data.attachment,
      dataUrl: buildMediaUrl("attachment"),
    };
  }
  if (media.profileImageInline && data?.profileImage && typeof data.profileImage === "object") {
    data.profileImage = {
      ...data.profileImage,
      dataUrl: buildMediaUrl("profile"),
    };
  }
  if (media.heroImageInline) {
    (data as any).heroImage = buildMediaUrl("hero");
  }
  if (media.customHeroImageInline) {
    (data as any).customHeroImage = buildMediaUrl("hero");
  }
  const requestedTab = String(((awaitedSearchParams as any)?.tab ?? "") as string)
    .trim()
    .toLowerCase();
  const ownerWorkspaceTab =
    requestedTab === "dashboard" ||
    requestedTab === "guests" ||
    requestedTab === "communications" ||
    requestedTab === "settings"
      ? (requestedTab as "dashboard" | "guests" | "communications" | "settings")
      : null;

  // Handle edit redirect - if edit param is present and user is owner, redirect to customize
  // (except for discovery gymnastics events: they stay on the event URL and get an inline edit sidebar)
  const editParam = String(((awaitedSearchParams as any)?.edit ?? "") as string).trim();
  const discoveryCreatedVia = String((data as any)?.createdVia || "").toLowerCase();
  const isScannedInviteEvent =
    normalizeDashboardEventOwnership(
      (data as any)?.ownership,
      discoveryCreatedVia,
      (data as any)?.invitedFromScan,
    ) === "invited";
  const canManageCreatedEvent = isOwner && !isScannedInviteEvent;
  const discoveryWorkflow = String((data as any)?.discoverySource?.workflow || "").toLowerCase();
  const discoveryCategory = String((data as any)?.category || "").toLowerCase();
  const discoveryTemplateId = String((data as any)?.templateId || "").toLowerCase();
  const hasDiscoveryInput = Boolean((data as any)?.discoverySource?.input);
  const isGymnasticsDiscoveryTemplate =
    (discoveryCreatedVia === "meet-discovery" ||
      discoveryWorkflow === "gymnastics" ||
      hasDiscoveryInput) &&
    (discoveryCategory === "sport_gymnastics_schedule" ||
      discoveryCategory === "sport_gymnastics" ||
      discoveryCategory === "gymnastics" ||
      discoveryTemplateId === "gymnastics-schedule" ||
      discoveryTemplateId === "gymnastics");
  const isFootballDiscoveryTemplate =
    (discoveryCreatedVia === "football-discovery" ||
      discoveryWorkflow === "football" ||
      hasDiscoveryInput) &&
    (discoveryCategory === "sport_football_season" ||
      discoveryTemplateId === "football-season" ||
      discoveryTemplateId === "football");
  const isFootballSeasonTemplate =
    discoveryCategory === "sport_football_season" ||
    discoveryTemplateId === "football-season" ||
    discoveryTemplateId === "football";
  const rawFootballPageTemplateId = (data as any)?.pageTemplateId;
  const footballPageTemplateId = isGymMeetTemplateId(rawFootballPageTemplateId)
    ? rawFootballPageTemplateId
    : null;
  const footballPublicChrome = footballPageTemplateId
    ? resolveFootballSeasonTemplateChrome(footballPageTemplateId)
    : null;
  const discoveryEditConfig: { customizeUrl: string; workflow: "gymnastics" | "football" } | null =
    editParam && canManageCreatedEvent
      ? (() => {
          if (isGymnasticsDiscoveryTemplate) {
            return {
              customizeUrl: `/event/gymnastics/customize?edit=${encodeURIComponent(
                row.id,
              )}&embed=1`,
              workflow: "gymnastics",
            } as const;
          }

          if (isFootballDiscoveryTemplate) {
            return {
              customizeUrl: `/event/football/customize?edit=${encodeURIComponent(row.id)}&embed=1`,
              workflow: "football",
            } as const;
          }

          return null;
        })()
      : null;
  if (editParam && canManageCreatedEvent && !discoveryEditConfig) {
    const editUrl = resolveEditHref(row.id, data, title);
    redirect(editUrl);
  }

  if (canManageCreatedEvent && ownerWorkspaceTab) {
    return (
      <EventOwnerWorkspace
        eventId={row.id}
        eventTitle={title}
        eventData={data}
        eventHref={buildEventPath(row.id, title)}
        initialTab={ownerWorkspaceTab}
      />
    );
  }

  const rawThumbnailValue =
    typeof (data as any)?.thumbnail === "string" ? ((data as any).thumbnail as string) : null;
  const thumbnailIsInline =
    typeof rawThumbnailValue === "string" && rawThumbnailValue.trim().startsWith("data:");
  const rawAttachment = data && typeof data.attachment === "object" ? data.attachment : null;
  const attachmentDataUrl =
    rawAttachment && typeof rawAttachment.dataUrl === "string"
      ? (rawAttachment.dataUrl as string)
      : null;
  const attachmentIsInline =
    typeof attachmentDataUrl === "string" && attachmentDataUrl.trim().startsWith("data:");
  if (thumbnailIsInline) {
    (data as any).thumbnail = undefined;
  }
  if (attachmentIsInline && rawAttachment) {
    data.attachment = {
      ...rawAttachment,
      dataUrl: undefined,
    };
  }
  const accessControlRaw =
    data && typeof data.accessControl === "object" ? { ...data.accessControl } : null;
  const requiresPasscode = Boolean(
    accessControlRaw?.requirePasscode && accessControlRaw?.passcodeHash,
  );
  let hasPasscodeAccess = false;
  if (!requiresPasscode) {
    hasPasscodeAccess = true;
  } else if (isOwner || recipientAccepted) {
    hasPasscodeAccess = true;
  } else if (typeof accessControlRaw?.passcodeHash === "string") {
    const cookieStore = await cookies();
    const accessCookieName = getEventAccessCookieName(row.id);
    const accessCookieValue = cookieStore.get(accessCookieName)?.value;
    hasPasscodeAccess = verifyEventAccessCookieValue(
      accessCookieValue,
      row.id,
      accessControlRaw.passcodeHash,
    );
  }

  const passcodeLocked = requiresPasscode && !hasPasscodeAccess && !isOwner && !recipientAccepted;

  if (passcodeLocked) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <section className="rounded-2xl border border-border bg-surface p-6 md:p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
            Private Event
          </p>
          <h1 className="mt-2 text-2xl md:text-3xl font-semibold text-foreground">{title}</h1>
          <p className="mt-3 text-sm text-foreground/75 leading-relaxed">
            This event requires an access code. Enter the code shared by the organizer to continue.
          </p>
          <div className="mt-6">
            <AccessCodeGate
              eventId={row.id}
              hint={
                typeof accessControlRaw?.passcodeHint === "string"
                  ? accessControlRaw.passcodeHint
                  : null
              }
            />
          </div>
        </section>
      </main>
    );
  }

  if (data?.accessControl) {
    data.accessControl = {
      ...accessControlRaw,
      passcodeHash: undefined,
      passcodePlain: undefined,
    };
  }
  const numberOfGuests =
    typeof data?.numberOfGuests === "number" && data.numberOfGuests > 0 ? data.numberOfGuests : 0;
  const isOcrEvent = isScannedInviteCreatedVia((data as any)?.createdVia);
  const attachmentInfo = (() => {
    const raw = data?.attachment;
    if (!raw || typeof raw !== "object") return null;
    const type =
      typeof raw.type === "string" && raw.type.trim()
        ? (raw.type as string)
        : "application/octet-stream";
    const name =
      typeof raw.name === "string" && raw.name.trim() ? (raw.name as string) : "Attachment";
    const previewUrl = attachmentIsInline
      ? buildMediaUrl("attachment")
      : typeof raw.dataUrl === "string" && raw.dataUrl
        ? (raw.dataUrl as string)
        : thumbnailIsInline
          ? buildMediaUrl("thumbnail")
          : null;
    return { name, type, dataUrl: previewUrl };
  })();
  const locationText = typeof data?.location === "string" ? (data.location as string) : "";
  const venueText = typeof data?.venue === "string" ? (data.venue as string) : "";
  const hasMapLocation = Boolean(venueText?.trim() || locationText?.trim());
  const categoryRaw = typeof data?.category === "string" ? data.category : "";
  const categoryNormalized = categoryRaw.toLowerCase();
  const registriesAllowed =
    categoryNormalized === "birthdays" ||
    categoryNormalized === "weddings" ||
    categoryNormalized === "baby showers";
  const registryLinksRaw = Array.isArray(data?.registries) ? (data.registries as any[]) : [];
  const registryLinks = registriesAllowed
    ? normalizeRegistryLinks(
        registryLinksRaw.map((item: any) => ({
          label: typeof item?.label === "string" ? item.label : "",
          url: typeof item?.url === "string" ? item.url : "",
        })),
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
  // Smart sign-up content may exist, but the event header no longer reads or renders signup header styles/images
  // For the Event page, we still allow rendering the sign-up board if present.
  const signupForm: SignupForm | null = (() => {
    const raw = data?.signupForm;
    if (raw && typeof raw === "object") {
      try {
        const sanitized = sanitizeSignupForm({
          ...(raw as SignupForm),
          enabled: true,
        });
        if (sanitized.sections.length > 0) {
          return sanitized;
        }
      } catch {}
    }
    return null;
  })();
  const headerUserStyleSeed: CSSProperties = {
    backgroundColor: undefined,
  } as CSSProperties;
  const startForDisplay =
    (typeof data?.startISO === "string" && data.startISO) ||
    (typeof data?.start === "string" && data.start) ||
    null;
  const endForDisplay =
    (typeof data?.endISO === "string" && data.endISO) ||
    (typeof data?.end === "string" && data.end) ||
    null;
  const formattedTimeAndDate = formatTimeAndDate(startForDisplay, endForDisplay, {
    timeZone: (typeof data?.timezone === "string" && data.timezone) || undefined,
    allDay: Boolean(data?.allDay),
  });
  let whenLabel = formatEventRangeDisplay(startForDisplay, endForDisplay, {
    timeZone: (typeof data?.timezone === "string" && data.timezone) || undefined,
    allDay: Boolean(data?.allDay),
  });
  const rawStartLabel = typeof data?.start === "string" ? (data.start as string) : null;
  const rawEndLabel = typeof data?.end === "string" ? (data.end as string) : null;
  const fallbackRangeLabel = buildFallbackRangeLabel(rawStartLabel, rawEndLabel);
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
          (!computedStartToken || !timeTokensEquivalent(rawStartToken, computedStartToken))) ||
        (rawEndToken &&
          (!computedEndToken || !timeTokensEquivalent(rawEndToken, computedEndToken)));
      if (mismatch) {
        whenLabel = fallbackRangeLabel;
      }
    }
  }
  const canonicalSegment = buildEventSlugSegment(row.id, title);
  const canonical = buildEventPath(row.id, title);
  const shareUrl = await absoluteUrl(canonical);

  if (timing.enabled) {
    console.info("[event-page][render]", {
      id: awaitedParams.id,
      tab: requestedTab || null,
      timings: timing.toObject(),
    });
  }
  const editHref = buildEditLink(row.id, data, title);

  // Redirect to canonical slug-id URL if needed, preserving key query params
  if (awaitedParams.id !== canonicalSegment || autoAccept) {
    const next = buildEventPath(row.id, title, createdParam ? { created: true } : undefined);
    redirect(next);
  }

  // Detect RSVP phone and build SMS/Call links
  // First try the rsvp field, then fall back to searching description/location
  const rsvpField = typeof data?.rsvp === "string" ? data.rsvp : "";
  const aggregateContactText = `${rsvpField} ${
    (data?.description as string | undefined) || ""
  } ${(data?.location as string | undefined) || ""}`.trim();
  const rsvpPhone = extractFirstPhoneNumber(aggregateContactText);
  const rsvpEmail =
    findFirstEmail(rsvpField) ?? findFirstEmail(aggregateContactText) ?? findFirstEmail(data);

  const rsvpContactSource = rsvpField || rsvpEmail || "";
  // Extract just the name from RSVP field (remove "RSVP:" prefix, phone number, and option text)
  const rsvpNameRaw = rsvpContactSource
    ? rsvpContactSource
        .replace(/^RSVP:?\s*/i, "") // Remove "RSVP:" or "RSVP" prefix
        .replace(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g, "") // Remove phone number
        .replace(/\(\d{3}\)\s*\d{3}[-.\s]?\d{4}/g, "") // Remove (555) 123-4567 format
        .trim()
    : "";
  const rsvpName = rsvpNameRaw ? cleanRsvpContactLabel(rsvpNameRaw) : "";
  const userName = ((session as any)?.user?.name as string | undefined) || "";
  const _smsIntroParts = [
    "Hi, there,",
    userName ? ` this is ${userName},` : "",
    " RSVP-ing for ",
    title || "the event",
  ];
  const _isSignedIn = Boolean(sessionEmail);
  const eventTheme = getEventTheme((data?.category as string | undefined) || null);
  const _categoryLabel = eventTheme.categoryLabel;

  // Check if image colors are available (from uploaded image)
  const imageColors = (() => {
    const raw = data?.imageColors;
    if (
      raw &&
      typeof raw === "object" &&
      typeof raw.headerLight === "string" &&
      typeof raw.headerDark === "string"
    ) {
      return raw as ImageColors;
    }
    return null;
  })();

  // Birthday editor can persist explicit gradient/color selections
  const headerBgCss: string | null =
    typeof (data as any)?.headerBgCss === "string" && (data as any).headerBgCss
      ? ((data as any).headerBgCss as string)
      : null;
  const headerBgColor: string | null =
    typeof (data as any)?.headerBgColor === "string" && (data as any).headerBgColor
      ? ((data as any).headerBgColor as string)
      : null;
  const templateBackgroundCss: string | null =
    typeof (data as any)?.templateBackgroundCss === "string" && (data as any).templateBackgroundCss
      ? ((data as any).templateBackgroundCss as string)
      : null;
  const profileImageUrl: string | null =
    typeof (data as any)?.profileImage === "object" &&
    typeof (data as any)?.profileImage?.dataUrl === "string"
      ? ((data as any).profileImage.dataUrl as string)
      : null;

  // Title style from Birthday editor
  const titleStyle: any = (data as any)?.titleStyle || {};
  const titleColor: string | null =
    typeof titleStyle?.color === "string" && titleStyle.color ? (titleStyle.color as string) : null;
  const titleFont: string =
    typeof titleStyle?.font === "string" ? (titleStyle.font as string) : "auto";
  const titleWeight: string =
    typeof titleStyle?.weight === "string" ? (titleStyle.weight as string) : "semibold";
  const titleHAlign: "left" | "center" | "right" =
    titleStyle?.hAlign === "left" || titleStyle?.hAlign === "right" ? titleStyle.hAlign : "center";
  const titleVAlign: "top" | "middle" | "bottom" =
    titleStyle?.vAlign === "top" || titleStyle?.vAlign === "bottom" ? titleStyle.vAlign : "middle";
  const titleSize: number = typeof titleStyle?.size === "number" ? (titleStyle.size as number) : 28;

  const headerGradientCss =
    headerBgCss ||
    templateBackgroundCss ||
    (headerBgColor ? `linear-gradient(0deg, ${headerBgColor}, ${headerBgColor})` : null);

  const themedHeaderGradient =
    imageColors?.headerLight || headerGradientCss || (eventTheme.headerLight as string);
  const eventPageThemeColor = resolveEventThemeColor(data);

  const themeStyleVars = {
    "--event-header-gradient-light": themedHeaderGradient,
    "--event-header-gradient-dark": themedHeaderGradient,
    "--event-card-bg-light":
      "linear-gradient(145deg, rgba(255,255,255,0.96), rgba(245,238,255,0.94))",
    "--event-card-bg-dark":
      "linear-gradient(145deg, rgba(255,255,255,0.96), rgba(245,238,255,0.94))",
    "--event-border-light": "#ddd5ff",
    "--event-border-dark": "#ddd5ff",
    "--event-chip-light": "rgba(255,255,255,0.9)",
    "--event-chip-dark": "rgba(255,255,255,0.9)",
    "--event-text-light": "#2b2350",
    "--event-text-dark": "#2b2350",
  } satisfies Record<string, string>;

  // Now finalize header style: prefer explicit header image (thumbnail) over flyer
  const headerImageUrl: string | null = thumbnailIsInline
    ? buildMediaUrl("thumbnail")
    : rawThumbnailValue;
  const headerUserStyle: CSSProperties = {
    backgroundImage: headerImageUrl
      ? `url(${headerImageUrl})`
      : headerUserStyleSeed.backgroundImage ||
        headerBgCss ||
        templateBackgroundCss ||
        (headerBgColor
          ? `linear-gradient(0deg, ${headerBgColor}, ${headerBgColor})`
          : imageColors
            ? imageColors.headerLight
            : eventTheme.headerLight),
    backgroundSize: headerImageUrl ? "cover" : undefined,
    backgroundPosition: headerImageUrl ? "center" : undefined,
    backgroundRepeat: headerImageUrl ? "no-repeat" : undefined,
    backgroundColor: headerImageUrl
      ? undefined
      : headerUserStyleSeed.backgroundColor || headerBgColor || undefined,
    position: "relative",
  } as CSSProperties;

  // Add overlay for readability when image is used as background
  const headerOverlayStyle: CSSProperties = headerImageUrl
    ? {
        position: "absolute",
        inset: 0,
        background: "rgba(0, 0, 0, 0.3)",
        borderRadius: "inherit",
      }
    : {};

  // Header content should be relative to overlay
  const headerContentStyle: CSSProperties = {
    position: "relative",
    zIndex: 1,
  };

  // Determine whether the event is in the future for conditional rendering
  const _isFutureEvent = (() => {
    try {
      const startIso = (data?.startISO as string | undefined) || null;
      const rawStart = (data?.start as string | undefined) || null;
      const parsed = startIso ? new Date(startIso) : rawStart ? new Date(rawStart) : null;
      return parsed ? parsed.getTime() > Date.now() : false;
    } catch {
      return false;
    }
  })();

  // Compute a right padding to avoid text flowing under the thumbnail overlay
  const _detailsExtraPaddingRight = headerImageUrl ? " pr-40 sm:pr-48" : "";

  const calendarStartIso = normalizeIso(
    (data?.startISO as string | undefined) || (typeof data?.start === "string" ? data.start : null),
  );
  const rawEndIso =
    (data?.endISO as string | undefined) || (typeof data?.end === "string" ? data.end : null);
  const calendarEndIso = calendarStartIso
    ? ensureEndIso(calendarStartIso, normalizeIso(rawEndIso), Boolean(data?.allDay))
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

  const viewerKind: "owner" | "guest" | "readonly" = canManageCreatedEvent
    ? "owner"
    : isReadOnly
      ? "readonly"
      : "guest";

  const clientSafeEventData = canManageCreatedEvent
    ? data
    : redactDiscoverySourceForPublicView(data);

  const _heroDateLine = formattedTimeAndDate.date || whenLabel || null;
  const _heroTimeLine =
    formattedTimeAndDate.time && (formattedTimeAndDate.date || !whenLabel)
      ? formattedTimeAndDate.time
      : null;
  const locationForHero = typeof data?.location === "string" ? (data.location as string) : "";
  const { street: heroLocationStreet, cityStateZip: heroLocationCity } =
    splitAddress(locationForHero);
  const heroLocationSegments: string[] = [];
  const pushLocationSegment = (value?: string | null) => {
    if (typeof value !== "string") return;
    const trimmed = value.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    if (heroLocationSegments.some((segment) => segment.toLowerCase() === lower)) {
      return;
    }
    heroLocationSegments.push(trimmed);
  };
  if (typeof data?.venue === "string") {
    pushLocationSegment(data.venue as string);
  }
  pushLocationSegment(heroLocationStreet);
  pushLocationSegment(heroLocationCity);
  if (!heroLocationStreet && !heroLocationCity) {
    pushLocationSegment(locationForHero);
  }

  const templateId =
    typeof (data as any)?.templateId === "string" ? (data as any).templateId : null;
  const variationId =
    typeof (data as any)?.variationId === "string" ? (data as any).variationId : null;
  const createdVia =
    typeof (data as any)?.createdVia === "string" ? (data as any).createdVia : null;
  const isBirthdayTemplate =
    templateId &&
    variationId &&
    categoryNormalized === "birthdays" &&
    createdVia !== "simple-template";
  const isBirthdayRendererEvent =
    categoryNormalized === "birthdays" &&
    (createdVia === "birthday-renderer" || isOcrBirthdayRenderer(createdVia));
  const isWeddingTemplate = templateId && variationId && categoryNormalized === "weddings";
  const isDiscoverySimpleTemplate = isGymnasticsDiscoveryTemplate || isFootballDiscoveryTemplate;
  const isSimpleTemplate =
    (createdVia === "simple-template" || createdVia === "template" || isDiscoverySimpleTemplate) &&
    templateId &&
    !isBirthdayTemplate &&
    !isWeddingTemplate;

  const shouldRenderFootballPage =
    Boolean(isFootballDiscoveryTemplate) || Boolean(isFootballSeasonTemplate);

  // If it's a birthday template, render the template view
  if (isBirthdayTemplate || isBirthdayRendererEvent) {
    const birthdayAudience =
      typeof (data as any)?.birthdayAudience === "string"
        ? ((data as any).birthdayAudience as string)
        : null;
    const birthdayHintThemeId =
      typeof (data as any)?.birthdayTemplateHint?.themeId === "string"
        ? ((data as any).birthdayTemplateHint.themeId as string)
        : null;
    const birthdayThemeId =
      variationId ||
      birthdayHintThemeId ||
      selectBirthdayOcrThemeId(
        birthdayAudience === "girl" || birthdayAudience === "boy" ? birthdayAudience : "neutral",
      );
    const birthdayTheme = data.theme?.id
      ? data.theme
      : BIRTHDAY_THEMES.find((t) => t.id === birthdayThemeId) || BIRTHDAY_THEMES[0];

    if (isBirthdayRendererEvent || data.theme?.layout) {
      return (
        <BirthdayRenderer
          template={birthdayTheme}
          eventId={row.id}
          heroImageUrl={
            isOcrBirthdayRenderer(createdVia)
              ? attachmentInfo?.dataUrl || headerImageUrl || null
              : null
          }
          event={{
            headlineTitle: title || data.headlineTitle,
            date:
              data.startISO || (data.date && data.time ? `${data.date}T${data.time}` : data.date),
            location:
              data.location ||
              [data.venue, data.address, data.city, data.state].filter(Boolean).join(", "),
            story: data.story || data.description || data.partyDetails?.notes,
            schedule: data.schedule,
            registries: data.registries,
            rsvpEnabled: Boolean(data.rsvpEnabled) || Boolean(data.rsvp?.isEnabled || data.rsvp),
            rsvpLink: "#rsvp",
            birthdayName: data.birthdayName || data.childName || "Birthday Star",
            age: data.age,
            party: data.party || data.partyDetails,
            thingsToDo: data.thingsToDo || data.partyDetails?.activities,
            hosts: data.hosts,
            gallery: Array.isArray(data.gallery)
              ? data.gallery.map((item: any) => (typeof item === "string" ? item : item.url))
              : [],
            rsvpDeadline: data.rsvpDeadline || data.rsvp?.deadline,
            numberOfGuests: data.numberOfGuests || 0,
          }}
          isOwner={isOwner}
          calendarLinks={calendarLinks}
          coordinates={data?.coordinates || null}
          venueText={typeof data?.venue === "string" ? data.venue : null}
          locationText={typeof data?.location === "string" ? data.location : null}
          actions={
            !isReadOnly &&
            isOwner && (
              <div className="flex items-center gap-2 sm:gap-3 text-sm font-medium bg-white/90 backdrop-blur rounded-md px-2 sm:px-3 py-1.5 shadow">
                {canManageCreatedEvent && (
                  <Link
                    href={buildEditLink(row.id, data, title)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-neutral-800/80 hover:text-neutral-900 hover:bg-black/5 transition-colors"
                    title="Edit event"
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
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <span className="hidden sm:inline">Edit</span>
                  </Link>
                )}
                <EventDeleteModal eventId={row.id} eventTitle={title} />
                <EventActions
                  shareUrl={shareUrl}
                  event={data as any}
                  historyId={!isReadOnly ? row.id : undefined}
                  className=""
                  variant="compact"
                  tone={"default" as any}
                />
              </div>
            )
          }
        />
      );
    }

    return (
      <BirthdayTemplateView
        eventId={row.id}
        eventData={clientSafeEventData}
        eventTitle={title}
        templateId={templateId || "party-pop"}
        variationId={variationId || "classic"}
        isOwner={isOwner}
        canEdit={canManageCreatedEvent}
        isReadOnly={isReadOnly}
        viewerKind={viewerKind}
        shareUrl={shareUrl}
        sessionEmail={sessionEmail}
      />
    );
  }

  // If it's a wedding template, render the template view
  if (isWeddingTemplate) {
    return (
      <WeddingTemplateView
        eventId={row.id}
        eventData={clientSafeEventData}
        eventTitle={title}
        templateId={templateId}
        variationId={variationId}
        isOwner={isOwner}
        canEdit={canManageCreatedEvent}
        isReadOnly={isReadOnly}
        viewerKind={viewerKind}
        shareUrl={shareUrl}
        sessionEmail={sessionEmail}
      />
    );
  }

  const isBabyShowerTemplate =
    categoryNormalized === "baby showers" && templateId && createdVia === "template";

  if (isBabyShowerTemplate) {
    return (
      <BabyShowerTemplateView
        eventId={row.id}
        eventTitle={title}
        eventData={clientSafeEventData}
        shareUrl={shareUrl}
        isOwner={isOwner}
        canEdit={canManageCreatedEvent}
        isReadOnly={isReadOnly}
        editHref={editHref}
      />
    );
  }

  if (shouldRenderFootballPage) {
    const footballEventView = (
      <FootballDiscoveryContent
        eventData={clientSafeEventData}
        eventTitle={title}
        eventId={row.id}
        pageTemplateId={footballPageTemplateId}
        shareUrl={shareUrl}
        sessionEmail={sessionEmail}
        isOwner={isOwner}
        isReadOnly={isReadOnly}
        editHref={editHref}
        hideOwnerActions={Boolean(discoveryEditConfig)}
        chrome={footballPublicChrome}
      />
    );
    if (discoveryEditConfig) {
      return (
        <DiscoveryEventEditLayout eventId={row.id} customizeUrl={discoveryEditConfig.customizeUrl}>
          {footballEventView}
        </DiscoveryEventEditLayout>
      );
    }
    return footballEventView;
  }

  // If it's a simple template (gymnastics, football practice, etc.), render with SimpleTemplateView
  if (isSimpleTemplate) {
    const eventView = (
      <SimpleTemplateView
        eventId={row.id}
        eventData={clientSafeEventData}
        eventTitle={title}
        isOwner={isOwner}
        isReadOnly={isReadOnly}
        viewerKind={viewerKind}
        shareUrl={shareUrl}
        sessionEmail={sessionEmail}
        hideOwnerActions={Boolean(discoveryEditConfig)}
        disableThemeBackground={Boolean(discoveryEditConfig)}
      />
    );
    if (discoveryEditConfig) {
      return (
        <DiscoveryEventEditLayout eventId={row.id} customizeUrl={discoveryEditConfig.customizeUrl}>
          {eventView}
        </DiscoveryEventEditLayout>
      );
    }
    return eventView;
  }

  return (
    <main
      className={`event-modern-page w-full px-5 sm:px-10 py-10 md:py-14 ipad-gutters pl-[calc(1rem+env(safe-area-inset-left))] sm:pl-[calc(2rem+env(safe-area-inset-left))] pr-[calc(1rem+env(safe-area-inset-right))] sm:pr-[calc(2rem+env(safe-area-inset-right))] pt-[calc(2.6rem+env(safe-area-inset-top))] ${
        isReadOnly
          ? "pb-[calc(1em+env(safe-area-inset-bottom))]"
          : "pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-[calc(1em+env(safe-area-inset-bottom))]"
      }`}
      data-theme-color={eventPageThemeColor}
      style={
        {
          // Keep page chrome in the white/purple family for scanned event views.
          "--theme-hero-gradient": "linear-gradient(180deg, #f7f3ff 0%, #ffffff 55%, #f8f5ff 100%)",
        } as CSSProperties
      }
    >
      <style>{`
        html {
          --theme-hero-gradient: linear-gradient(
            180deg,
            #f7f3ff 0%,
            #ffffff 55%,
            #f8f5ff 100%
          );
        }
      `}</style>
      <div className="event-theme-scope space-y-6" style={themeStyleVars as CSSProperties}>
        <section
          className="event-theme-header relative overflow-visible rounded-2xl border shadow-lg px-1 py-6 sm:px-2 min-h-[220px] sm:min-h-[280px]"
          style={headerUserStyle}
        >
          {headerImageUrl && <div style={headerOverlayStyle} />}
          {/* Profile image should anchor to the header section bounds (not inner wrapper) */}
          {profileImageUrl && (
            <div
              className="absolute left-4 bottom-[-12px] sm:left-6 sm:bottom-[-16px]"
              style={{ zIndex: 2 }}
            >
              <img
                src={profileImageUrl}
                alt="profile"
                className="w-24 h-24 sm:w-36 sm:h-36 rounded-xl border-2 border-border object-cover shadow-md"
              />
            </div>
          )}
          <div style={headerContentStyle}>
            <div
              className={`absolute inset-0 flex h-full w-full px-1 sm:px-2 ${
                titleVAlign === "top"
                  ? "items-start"
                  : titleVAlign === "middle"
                    ? "items-center"
                    : "items-end"
              } ${
                titleHAlign === "left"
                  ? "justify-start"
                  : titleHAlign === "center"
                    ? "justify-center"
                    : "justify-end"
              }`}
            >
              <h1
                className={`${
                  titleWeight === "bold"
                    ? "font-bold"
                    : titleWeight === "semibold"
                      ? "font-semibold"
                      : "font-normal"
                } ${
                  titleHAlign === "center"
                    ? "text-center"
                    : titleHAlign === "right"
                      ? "text-right"
                      : "text-left"
                } ${
                  titleColor && !isOcrEvent
                    ? ""
                    : isOcrEvent || headerImageUrl
                      ? "text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]"
                      : "text-foreground"
                }`}
                style={{
                  color: isOcrEvent ? "#ffffff" : titleColor || undefined,
                  fontFamily:
                    titleFont === "pacifico"
                      ? "var(--font-pacifico)"
                      : titleFont === "montserrat"
                        ? "var(--font-montserrat)"
                        : titleFont === "geist"
                          ? "var(--font-geist-sans)"
                          : titleFont === "mono"
                            ? "var(--font-geist-mono)"
                            : titleFont === "poppins"
                              ? "var(--font-poppins)"
                              : titleFont === "raleway"
                                ? "var(--font-raleway)"
                                : titleFont === "playfair"
                                  ? "var(--font-playfair)"
                                  : titleFont === "dancing"
                                    ? "var(--font-dancing)"
                                    : titleFont === "serif"
                                      ? 'Georgia, Cambria, "Times New Roman", Times, serif'
                                      : titleFont === "system"
                                        ? 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji"'
                                        : undefined,
                  fontSize: `${titleSize || 28}px`,
                  transform: titleVAlign === "middle" ? "translateY(94px)" : undefined,
                }}
              >
                {title}
              </h1>
            </div>
          </div>
          {/* Actions pinned to bottom-right of header */}
          <div className="absolute bottom-3 right-3 z-40 hidden md:block">
            <div className="flex items-center gap-2 sm:gap-3 text-sm font-medium rounded-xl border border-[#ddd4f8] bg-white/92 backdrop-blur px-2 sm:px-3 py-1.5 shadow-[0_12px_26px_rgba(76,55,134,0.22)]">
              {!isReadOnly && canManageCreatedEvent && !isOcrEvent && (
                <Link
                  href={buildEditLink(row.id, data, title)}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-[#4f3f7a] transition hover:bg-[#f6f1ff] hover:text-[#2f2550]"
                  title="Edit event"
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
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  <span className="hidden sm:inline">Edit</span>
                </Link>
              )}
              {!isReadOnly && isOwner && <EventDeleteModal eventId={row.id} eventTitle={title} />}
              <EventActions
                shareUrl={shareUrl}
                event={data as any}
                historyId={!isReadOnly ? row.id : undefined}
                className=""
                variant="compact"
                tone={"default" as any}
              />
            </div>
          </div>
        </section>

        <section className="event-theme-card rounded-[28px] border border-[#ddd5ff] bg-gradient-to-br from-[#ffffff] via-[#f8f4ff] to-[#f3edff] px-3 py-6 shadow-[0_22px_56px_rgba(84,61,140,0.14)] sm:px-6">
          {data?.description && (
            <div className="mb-6 border-b border-[#e7defb] pb-4 text-sm leading-relaxed">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                Description
              </p>
              <p className="mt-2 whitespace-pre-wrap">{data.description}</p>
            </div>
          )}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Left column: Event details */}
            <div className="lg:col-span-1">
              <dl className="grid grid-cols-2 gap-4 text-sm">
                {data?.allDay && (
                  <div className="col-span-2">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-[#7a6da8]">
                      When
                    </dt>
                    <dd className="mt-1 text-base font-semibold">All day event</dd>
                  </div>
                )}
                {whenLabel ? (
                  (() => {
                    const timeAndDate = formatTimeAndDate(startForDisplay, endForDisplay, {
                      timeZone: (typeof data?.timezone === "string" && data.timezone) || undefined,
                      allDay: Boolean(data?.allDay),
                    });

                    return (
                      <div className="col-span-2">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-[#7a6da8]">
                          When
                        </dt>
                        <dd className="mt-1 break-all text-base font-semibold">
                          {timeAndDate.time && <div>{timeAndDate.time}</div>}
                          {timeAndDate.date && (
                            <div className="mt-1 text-sm text-[#6e629c]">{timeAndDate.date}</div>
                          )}
                          {!timeAndDate.time && !timeAndDate.date && whenLabel}
                        </dd>
                      </div>
                    );
                  })()
                ) : (
                  <>
                    {data?.start && (
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-[#7a6da8]">
                          Start
                        </dt>
                        <dd className="mt-1 break-all text-base font-semibold">{data.start}</dd>
                      </div>
                    )}
                    {data?.end && (
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-[#7a6da8]">
                          End
                        </dt>
                        <dd className="mt-1 break-all text-base font-semibold">{data.end}</dd>
                      </div>
                    )}
                  </>
                )}
                {/* Calendar + RSVP moved to separate two-column row below */}
              </dl>
            </div>
            {/* Right column: Location */}
            <div className="lg:col-span-1 lg:self-start">
              <div className="rounded-2xl bg-white/92 p-5">
                <dd>
                  {(() => {
                    const { street, cityStateZip } = splitAddress(locationText);
                    const fullQuery = combineVenueAndLocation(
                      venueText || null,
                      locationText || null,
                    );

                    return (
                      <>
                        {venueText && (
                          <div className="mb-2 text-xl font-semibold text-[#2b2350]">
                            {venueText}
                          </div>
                        )}
                        {street && (
                          <div className="text-base font-semibold">
                            <LocationLink
                              location={street}
                              query={fullQuery}
                              className="font-semibold"
                            />
                          </div>
                        )}
                        {cityStateZip && (
                          <div className="mt-1 text-sm text-[#6e629c]">
                            <LocationLink location={cityStateZip} query={fullQuery} className="" />
                          </div>
                        )}
                        {!street && !cityStateZip && locationText && (
                          <LocationLink
                            location={locationText}
                            query={fullQuery}
                            className="text-base font-semibold"
                          />
                        )}
                        {!venueText && !locationText && (
                          <p className="text-sm text-[#6e629c]">Location TBD</p>
                        )}
                      </>
                    );
                  })()}
                </dd>
              </div>
            </div>
          </div>
          {/* Second row: RSVP (left) and Add to calendar (right) */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            {(rsvpName || rsvpPhone || rsvpEmail) && (
              <div id="event-rsvp">
                <dt className="text-xs font-semibold uppercase tracking-wide text-[#7a6da8]">
                  RSVP
                </dt>
                <dd className="mt-1">
                  <EventRsvpPrompt
                    eventId={row.id}
                    rsvpName={rsvpName}
                    rsvpPhone={rsvpPhone}
                    rsvpEmail={rsvpEmail}
                    eventTitle={title}
                    shareUrl={shareUrl}
                  />
                </dd>
              </div>
            )}
            {calendarLinks && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-[#7a6da8]">
                  Add to calendar
                </dt>
                <dd className="mt-1  space-y-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <AppleCalendarLink
                      href={calendarLinks.appleInline}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d5c9f7] bg-white text-[#433468] shadow-sm transition hover:border-[#beaee8] hover:bg-[#f7f2ff]"
                      aria-label="Add to Apple Calendar"
                      title="Apple Calendar"
                    >
                      <CalendarIconApple className="h-5 w-5" />
                    </AppleCalendarLink>
                    <a
                      href={calendarLinks.google}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d5c9f7] bg-white text-[#433468] shadow-sm transition hover:border-[#beaee8] hover:bg-[#f7f2ff]"
                      aria-label="Add to Google Calendar"
                      title="Google Calendar"
                    >
                      <CalendarIconGoogle className="h-5 w-5" />
                    </a>
                    <a
                      href={calendarLinks.outlook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d5c9f7] bg-white text-[#433468] shadow-sm transition hover:border-[#beaee8] hover:bg-[#f7f2ff]"
                      aria-label="Add to Outlook Calendar"
                      title="Outlook Calendar"
                    >
                      <CalendarIconOutlook className="h-5 w-5" />
                    </a>
                  </div>
                </dd>
              </div>
            )}
          </div>
          {/* Share/Email actions moved to header top-right */}
          {attachmentInfo && false && (
            <div className="mt-6 border-t border-[#e7defb] pt-4 text-sm leading-relaxed">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Attachment</p>
              <a
                href={attachmentInfo?.dataUrl ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                download={attachmentInfo?.name}
                className="mt-2 inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:border-foreground/50 hover:bg-surface/80"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs">
                  {attachmentInfo?.type?.startsWith("image/") ? "🖼" : "📄"}
                </span>
                <span className="truncate" title={attachmentInfo?.name || "Attachment"}>
                  {attachmentInfo?.name || "Attachment"}
                </span>
              </a>
            </div>
          )}
          {((attachmentInfo?.type?.startsWith?.("image/") && attachmentInfo?.dataUrl) ||
            hasMapLocation) && (
            <div className="mt-6 border-t border-[#e7defb] pt-4 text-sm leading-relaxed">
              {(attachmentInfo?.type?.startsWith?.("image/") && attachmentInfo?.dataUrl) ||
              hasMapLocation ? (
                <div className="grid justify-items-center gap-4 md:grid-cols-2">
                  {attachmentInfo?.type?.startsWith?.("image/") && attachmentInfo?.dataUrl && (
                    <div className="flex justify-center">
                      <ThumbnailModal
                        src={attachmentInfo.dataUrl}
                        alt={`${title} flyer`}
                        className="relative block w-full max-w-[220px] overflow-hidden rounded-2xl shadow-[0_14px_32px_rgba(79,58,134,0.12)]"
                      />
                    </div>
                  )}
                  {hasMapLocation && (
                    <EventMap
                      coordinates={data?.coordinates}
                      venue={venueText || null}
                      location={locationText || null}
                      mapWidth={320}
                      mapHeight={280}
                      className="w-full max-w-[220px] overflow-hidden rounded-2xl border border-[#ddd5ff] bg-white/90 p-1 shadow-[0_14px_32px_rgba(79,58,134,0.12)]"
                    />
                  )}
                </div>
              ) : null}
            </div>
          )}
          {signupForm && (
            <div className="mt-6">
              <SignupViewer
                eventId={row.id}
                initialForm={signupForm}
                viewerKind={viewerKind}
                viewerId={userId}
                viewerName={(session?.user?.name as string | undefined) || null}
                viewerEmail={sessionEmail}
              />
            </div>
          )}

          {/* Sponsored supplies block: show to owner right after creation */}
          {!isReadOnly && canManageCreatedEvent && createdParam && (
            <SponsoredSupplies
              placement="confirm"
              category={categoryRaw}
              viewer="owner"
              title={title}
              description={(data?.description as string | undefined) || null}
            />
          )}
          {/* Sponsored supplies block for guests (always visible to non-owners) */}
          {!canManageCreatedEvent && (
            <SponsoredSupplies
              placement="confirm"
              category={categoryRaw}
              viewer="guest"
              title={title}
              description={(data?.description as string | undefined) || null}
            />
          )}
          {registriesAllowed && registryCards.length > 0 && (
            <div className="mt-6 border-t border-[#e7defb] pt-4 text-sm leading-relaxed">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Registries</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {registryCards.map((link) => {
                  const decorated = decorateAmazonUrl(link.url, {
                    category: categoryRaw,
                    viewer: viewerKind as any,
                    placement: "registry_card",
                    // Allow fallback to default tag when category-specific envs are not set
                    strictCategoryOnly: false,
                  });
                  return (
                    <a
                      key={link.url}
                      href={decorated}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-3 rounded-xl border border-[#ddd4f8] bg-white/90 p-3 transition hover:border-[#cabcf0] hover:bg-[#f7f2ff]"
                    >
                      <span
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                        style={{
                          backgroundColor: link.accentColor,
                          color: link.textColor,
                        }}
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
                        <span className="mt-0.5 block truncate text-xs text-foreground">
                          {link.host}
                        </span>
                      </span>
                    </a>
                  );
                })}
              </div>
              {!isReadOnly && (
                <p className="mt-3 text-xs text-foreground/60">
                  These links open in a new tab. Registries must stay public or shareable so guests
                  can view them.
                </p>
              )}
            </div>
          )}
        </section>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {canManageCreatedEvent && numberOfGuests > 0 && (
          <EventRsvpDashboard eventId={row.id} initialNumberOfGuests={numberOfGuests} />
        )}
        {/* +Add has been moved to the Shared with box header */}
        {!isReadOnly && !isOwner ? (
          <section className="rounded border border-border p-3 bg-surface">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground/80">Shared by:</h3>
              {(isShared || recipientAccepted) && (
                <form
                  action={async () => {
                    "use server";
                    try {
                      await revokeEventShare({
                        eventId: row.id,
                        byUserId: userId!,
                      });
                      invalidateUserHistory(userId!);
                      invalidateUserDashboard(userId!);
                      if (ownerUserId) {
                        invalidateUserHistory(ownerUserId);
                        invalidateUserDashboard(ownerUserId);
                      }
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
                        invalidateUserHistory(userId!);
                        invalidateUserDashboard(userId!);
                        if (ownerUserId) {
                          invalidateUserHistory(ownerUserId);
                          invalidateUserDashboard(ownerUserId);
                        }
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
        {isReadOnly && !isOwner ? (
          <section className="rounded border border-border bg-surface p-3 text-sm text-foreground/70">
            <h3 className="text-sm font-semibold text-foreground/80">View-only access</h3>
            <p className="mt-2">
              {hasShareRelation
                ? "This event is available in view-only mode right now."
                : "This event was opened from a direct link, so it is view-only right now."}{" "}
              It will only appear on Home or under Invited Events after it is shared to this
              account.
            </p>
          </section>
        ) : null}
      </div>
      {!isReadOnly && (
        <div className="event-modern-mobile-bar md:hidden">
          <div className="mx-auto flex max-w-3xl items-center gap-2">
            {(rsvpName || rsvpPhone || rsvpEmail) && (
              <a
                href="#event-rsvp"
                className="inline-flex shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                RSVP
              </a>
            )}
            {canManageCreatedEvent && !isOcrEvent && (
              <Link
                href={buildEditLink(row.id, data, title)}
                className="inline-flex shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Edit
              </Link>
            )}
            {isOwner && <EventDeleteModal eventId={row.id} eventTitle={title} />}
            <div className="min-w-0 flex-1">
              <EventActions
                shareUrl={shareUrl}
                event={data as any}
                historyId={!isReadOnly ? row.id : undefined}
                className="w-full justify-center"
                variant="compact"
                tone={"default" as any}
              />
            </div>
          </div>
        </div>
      )}
      {!isReadOnly && <div className="event-modern-mobile-spacer md:hidden" />}
      {isReadOnly && (
        <div className="mt-6">
          <ReadOnlyBanner />
        </div>
      )}
      {isReadOnly && (
        <p
          className="mt-4 md:mt-6 text-3xl md:text-4xl tracking-tight text-foreground pb-3 pt-2 text-center"
          role="heading"
          aria-level={1}
        >
          <span className="font-pacifico">
            <span className="text-[#0e7bc4]">Env</span>
            <span className="text-[#ee3c2b]">i</span>
            <span className="text-[#0e7bc4]">tefy</span>
          </span>
        </p>
      )}
    </main>
  );
}
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
