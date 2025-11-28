import { notFound } from "next/navigation";
import { createHash } from "crypto";
import type { Metadata } from "next";
import EventActions from "@/components/EventActions";
import ThumbnailModal from "@/components/ThumbnailModal";
import EventDeleteModal from "@/components/EventDeleteModal";
import EventRsvpPrompt from "@/components/EventRsvpPrompt";
import LocationLink from "@/components/LocationLink";
import EventMap from "@/components/EventMap";
import ReadOnlyBanner from "./ReadOnlyBanner";
import Image from "next/image";
import Link from "next/link";
import { combineVenueAndLocation } from "@/lib/mappers";
import {
  isEventSharedWithUser,
  isEventSharePendingForUser,
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
import { revalidatePath } from "next/cache";
import { findFirstEmail } from "@/utils/contact";
import { extractFirstPhoneNumber } from "@/utils/phone";
import { getEventTheme } from "@/lib/event-theme";
import {
  getRegistryBrandByUrl,
  normalizeRegistryLinks,
} from "@/utils/registry-links";
import { resolveEditHref, buildEditLink } from "@/utils/event-edit-route";
import type { CSSProperties } from "react";
import type { ImageColors } from "@/utils/image-colors";
import { decorateAmazonUrl } from "@/utils/affiliates";
import SponsoredSupplies from "@/components/SponsoredSupplies";
import SignupViewer from "@/components/smart-signup-form/SignupViewer";
import { absoluteUrl } from "@/lib/absolute-url";
import type { SignupForm } from "@/types/signup";
import { sanitizeSignupForm } from "@/utils/signup";
import EventRsvpDashboard from "@/components/EventRsvpDashboard";
import {
  CalendarIconGoogle,
  CalendarIconOutlook,
  CalendarIconApple,
} from "@/components/CalendarIcons";
import BirthdayTemplateView from "@/components/BirthdayTemplateView";
import WeddingTemplateView from "@/components/WeddingTemplateView";
import SimpleTemplateView from "@/components/SimpleTemplateView";
import { buildCalendarLinks, ensureEndIso } from "@/utils/calendar-links";
import { cleanRsvpContactLabel } from "@/utils/rsvp";
import { buildEventPath, buildEventSlugSegment } from "@/utils/event-url";
import BabyShowerTemplateView from "@/components/BabyShowerTemplateView";

export const dynamic = "force-dynamic";

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

export async function generateMetadata(props: {
  params: Promise<{ id: string }> | { id: string };
}): Promise<Metadata> {
  const awaitedParams = await (props as any).params;
  const row = await getEventHistoryBySlugOrId({ value: awaitedParams.id });
  const data: any = row?.data || {};
  const title =
    (typeof data?.title === "string" && data.title) || row?.title || "Event";

  // Only expose a generic description publicly to avoid leaking private details
  const description = "View the event details, schedule, and RSVP right here.";

  // Generate OG image URL
  const img = await absoluteUrl(
    `/event/${encodeURIComponent(awaitedParams.id)}/opengraph-image`
  );

  // Generate canonical URL
  const url = await absoluteUrl(
    `/event/${encodeURIComponent(awaitedParams.id)}`
  );

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

const normalizeTimeToken = (
  token: string | null | undefined
): number | null => {
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

function formatTimeAndDate(
  startInput: string | null | undefined,
  endInput: string | null | undefined,
  options?: { timeZone?: string | null; allDay?: boolean }
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
      const dateFmt = new Intl.DateTimeFormat(undefined, {
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
  const createdFlag = String(
    ((awaitedSearchParams as any)?.created ?? "") as string
  )
    .trim()
    .toLowerCase();
  const createdParam = createdFlag === "1" || createdFlag === "true";
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
  const title = row.title as string;
  const createdAt = row.created_at as string | undefined;
  const data = row.data as any;

  // Handle edit redirect - if edit param is present and user is owner, redirect to customize
  const editParam = String(
    ((awaitedSearchParams as any)?.edit ?? "") as string
  ).trim();
  if (editParam && isOwner) {
    const editUrl = resolveEditHref(row.id, data, title);
    redirect(editUrl);
  }

  const rawThumbnailValue =
    typeof (data as any)?.thumbnail === "string"
      ? ((data as any).thumbnail as string)
      : null;
  const thumbnailIsInline =
    typeof rawThumbnailValue === "string" &&
    rawThumbnailValue.trim().startsWith("data:");
  const rawAttachment =
    data && typeof data.attachment === "object" ? data.attachment : null;
  const attachmentDataUrl =
    rawAttachment && typeof rawAttachment.dataUrl === "string"
      ? (rawAttachment.dataUrl as string)
      : null;
  const attachmentIsInline =
    typeof attachmentDataUrl === "string" &&
    attachmentDataUrl.trim().startsWith("data:");
  const thumbnailSignature =
    thumbnailIsInline && rawThumbnailValue
      ? createHash("sha1").update(rawThumbnailValue).digest("hex")
      : null;
  const attachmentSignature =
    attachmentIsInline && attachmentDataUrl
      ? createHash("sha1").update(attachmentDataUrl).digest("hex")
      : null;
  const buildMediaUrl = (variant?: "thumbnail" | "attachment") => {
    const params = new URLSearchParams();
    if (variant === "attachment") params.set("variant", "attachment");
    if (variant === "thumbnail") params.set("variant", "thumbnail");
    const sig =
      variant === "attachment"
        ? attachmentSignature
        : thumbnailSignature || attachmentSignature;
    if (sig) params.set("v", sig);
    const qs = params.toString();
    return `/api/events/${row.id}/thumbnail${qs ? `?${qs}` : ""}`;
  };
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
    data && typeof data.accessControl === "object"
      ? { ...data.accessControl }
      : null;
  if (data?.accessControl) {
    data.accessControl = {
      ...accessControlRaw,
      passcodeHash: undefined,
      passcodePlain: undefined,
    };
  }
  const numberOfGuests =
    typeof data?.numberOfGuests === "number" && data.numberOfGuests > 0
      ? data.numberOfGuests
      : 0;
  const attachmentInfo = (() => {
    const raw = data?.attachment;
    if (!raw || typeof raw !== "object") return null;
    const type =
      typeof raw.type === "string" && raw.type.trim()
        ? (raw.type as string)
        : "application/octet-stream";
    const name =
      typeof raw.name === "string" && raw.name.trim()
        ? (raw.name as string)
        : "Attachment";
    const previewUrl = attachmentIsInline
      ? buildMediaUrl("attachment")
      : typeof raw.dataUrl === "string" && raw.dataUrl
      ? (raw.dataUrl as string)
      : thumbnailIsInline
      ? buildMediaUrl("thumbnail")
      : null;
    return { name, type, dataUrl: previewUrl };
  })();
  const categoryRaw = typeof data?.category === "string" ? data.category : "";
  const categoryNormalized = categoryRaw.toLowerCase();
  const registriesAllowed =
    categoryNormalized === "birthdays" ||
    categoryNormalized === "weddings" ||
    categoryNormalized === "baby showers";
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
  const formattedTimeAndDate = formatTimeAndDate(
    startForDisplay,
    endForDisplay,
    {
      timeZone:
        (typeof data?.timezone === "string" && data.timezone) || undefined,
      allDay: Boolean(data?.allDay),
    }
  );
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
  const canonicalSegment = buildEventSlugSegment(row.id, title);
  const canonical = buildEventPath(row.id, title);
  const shareUrl = await absoluteUrl(canonical);
  const editHref = buildEditLink(row.id, data, title);

  // Redirect to canonical slug-id URL if needed, preserving key query params
  if (awaitedParams.id !== canonicalSegment || autoAccept) {
    const next = buildEventPath(
      row.id,
      title,
      createdParam ? { created: true } : undefined
    );
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
    findFirstEmail(rsvpField) ??
    findFirstEmail(aggregateContactText) ??
    findFirstEmail(data);

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
    typeof (data as any)?.headerBgColor === "string" &&
    (data as any).headerBgColor
      ? ((data as any).headerBgColor as string)
      : null;
  const templateBackgroundCss: string | null =
    typeof (data as any)?.templateBackgroundCss === "string" &&
    (data as any).templateBackgroundCss
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
    typeof titleStyle?.color === "string" && titleStyle.color
      ? (titleStyle.color as string)
      : null;
  const titleFont: string =
    typeof titleStyle?.font === "string" ? (titleStyle.font as string) : "auto";
  const titleWeight: string =
    typeof titleStyle?.weight === "string"
      ? (titleStyle.weight as string)
      : "semibold";
  const titleHAlign: "left" | "center" | "right" =
    titleStyle?.hAlign === "left" || titleStyle?.hAlign === "right"
      ? titleStyle.hAlign
      : "center";
  const titleVAlign: "top" | "middle" | "bottom" =
    titleStyle?.vAlign === "top" || titleStyle?.vAlign === "bottom"
      ? titleStyle.vAlign
      : "middle";
  const titleSize: number =
    typeof titleStyle?.size === "number" ? (titleStyle.size as number) : 28;

  // Use image colors if available, otherwise fall back to category theme
  const cardBackgroundImage =
    imageColors?.headerLight ||
    headerBgCss ||
    templateBackgroundCss ||
    eventTheme.headerLight;

  const headerGradientCss =
    headerBgCss ||
    templateBackgroundCss ||
    (headerBgColor
      ? `linear-gradient(0deg, ${headerBgColor}, ${headerBgColor})`
      : null);

  const themeStyleVars = (
    imageColors
      ? {
          "--event-header-gradient-light": imageColors.headerLight,
          "--event-header-gradient-dark": imageColors.headerDark,
          "--event-card-bg-light": imageColors.cardLight,
          "--event-card-bg-dark": imageColors.cardDark,
          "--event-border-light": imageColors.borderLight,
          "--event-border-dark": imageColors.borderDark,
          "--event-chip-light": imageColors.chipLight,
          "--event-chip-dark": imageColors.chipDark,
          "--event-text-light": imageColors.textLight,
          "--event-text-dark": imageColors.textDark,
        }
      : headerGradientCss
      ? {
          "--event-header-gradient-light": headerGradientCss,
          "--event-header-gradient-dark": headerGradientCss,
          "--event-card-bg-light": eventTheme.cardLight,
          "--event-card-bg-dark": eventTheme.cardDark,
          "--event-border-light": eventTheme.borderLight,
          "--event-border-dark": eventTheme.borderDark,
          "--event-chip-light": eventTheme.chipLight,
          "--event-chip-dark": eventTheme.chipDark,
          "--event-text-light": eventTheme.textLight,
          "--event-text-dark": eventTheme.textDark,
        }
      : {
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
        }
  ) satisfies Record<string, string>;

  // Mirror editor page background (hero) gradient
  const heroGradient: string =
    headerGradientCss ||
    (imageColors?.headerLight as string | undefined) ||
    (eventTheme.headerLight as string);

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
  const detailsExtraPaddingRight = headerImageUrl ? " pr-40 sm:pr-48" : "";

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

  const viewerKind: "owner" | "guest" | "readonly" = isOwner
    ? "owner"
    : isReadOnly
    ? "readonly"
    : "guest";

  const clientSafeEventData = data;

  const heroDateLine = formattedTimeAndDate.date || whenLabel || null;
  const heroTimeLine =
    formattedTimeAndDate.time && (formattedTimeAndDate.date || !whenLabel)
      ? formattedTimeAndDate.time
      : null;
  const locationForHero =
    typeof data?.location === "string" ? (data.location as string) : "";
  const { street: heroLocationStreet, cityStateZip: heroLocationCity } =
    splitAddress(locationForHero);
  const heroLocationSegments: string[] = [];
  const pushLocationSegment = (value?: string | null) => {
    if (typeof value !== "string") return;
    const trimmed = value.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    if (
      heroLocationSegments.some((segment) => segment.toLowerCase() === lower)
    ) {
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
    typeof (data as any)?.templateId === "string"
      ? (data as any).templateId
      : null;
  const variationId =
    typeof (data as any)?.variationId === "string"
      ? (data as any).variationId
      : null;
  const createdVia =
    typeof (data as any)?.createdVia === "string"
      ? (data as any).createdVia
      : null;
  const isBirthdayTemplate =
    templateId &&
    variationId &&
    categoryNormalized === "birthdays" &&
    createdVia !== "simple-template";
  const isWeddingTemplate =
    templateId && variationId && categoryNormalized === "weddings";
  const isSimpleTemplate =
    (createdVia === "simple-template" || createdVia === "template") &&
    templateId &&
    !isBirthdayTemplate &&
    !isWeddingTemplate;

  // If it's a birthday template, render the template view
  if (isBirthdayTemplate) {
    return (
      <BirthdayTemplateView
        eventId={row.id}
        eventData={clientSafeEventData}
        eventTitle={title}
        templateId={templateId}
        variationId={variationId}
        isOwner={isOwner}
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
        isReadOnly={isReadOnly}
        editHref={editHref}
      />
    );
  }

  // If it's a simple template (gymnastics, football practice, etc.), render with SimpleTemplateView
  if (isSimpleTemplate) {
    return (
      <SimpleTemplateView
        eventId={row.id}
        eventData={clientSafeEventData}
        eventTitle={title}
        isOwner={isOwner}
        isReadOnly={isReadOnly}
        viewerKind={viewerKind}
        shareUrl={shareUrl}
        sessionEmail={sessionEmail}
      />
    );
  }

  return (
    <main
      className="max-w-3xl mx-auto px-5 sm:px-10 py-14 ipad-gutters pl-[calc(1rem+env(safe-area-inset-left))] sm:pl-[calc(2rem+env(safe-area-inset-left))] pr-[calc(1rem+env(safe-area-inset-right))] sm:pr-[calc(2rem+env(safe-area-inset-right))] pt-[calc(3.5rem+env(safe-area-inset-top))] pb-[calc(1em+env(safe-area-inset-bottom))]"
      style={
        {
          // Ensure the page background matches the editor's chosen header gradient
          ["--theme-hero-gradient"]: heroGradient,
        } as CSSProperties
      }
    >
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function(){
              var value = ${JSON.stringify(heroGradient)};
              function apply(){
                try { document.documentElement.style.setProperty('--theme-hero-gradient', value); } catch {}
              }
              try { apply(); setTimeout(apply, 0); setTimeout(apply, 200); } catch {}
            })();
          `,
        }}
      />
      <div
        className="event-theme-scope space-y-6"
        style={themeStyleVars as CSSProperties}
      >
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
                  titleColor
                    ? ""
                    : headerImageUrl
                    ? "text-white drop-shadow-lg"
                    : "text-foreground"
                }`}
                style={{
                  color: titleColor || undefined,
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
                  transform:
                    titleVAlign === "middle" ? "translateY(94px)" : undefined,
                }}
              >
                {title}
              </h1>
            </div>
          </div>
          {/* Actions pinned to bottom-right of header */}
          <div className="absolute bottom-3 right-3 z-40">
            <div className="flex items-center gap-2 sm:gap-3 text-sm font-medium bg-white/90 backdrop-blur rounded-md px-2 sm:px-3 py-1.5 shadow">
              {!isReadOnly && isOwner && (
                <>
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
                  <EventDeleteModal eventId={row.id} eventTitle={title} />
                </>
              )}
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

        <section
          className={`event-theme-card rounded-2xl border px-3 sm:px-6 py-6 shadow-sm`}
          style={{
            backgroundImage: cardBackgroundImage,
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left column: Event details */}
            <div className="lg:col-span-1">
              <dl className="grid grid-cols-1 gap-5 text-sm sm:grid-cols-2">
                {data?.allDay && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold uppercase tracking-wide opacity-70">
                      When
                    </dt>
                    <dd className="mt-1 text-base font-semibold">
                      All day event
                    </dd>
                  </div>
                )}
                {whenLabel ? (
                  (() => {
                    const timeAndDate = formatTimeAndDate(
                      startForDisplay,
                      endForDisplay,
                      {
                        timeZone:
                          (typeof data?.timezone === "string" &&
                            data.timezone) ||
                          undefined,
                        allDay: Boolean(data?.allDay),
                      }
                    );

                    return (
                      <div className="sm:col-span-2">
                        <dt className="text-xs font-semibold uppercase tracking-wide opacity-70">
                          When
                        </dt>
                        <dd className="mt-1 break-all text-base font-semibold">
                          {timeAndDate.time && <div>{timeAndDate.time}</div>}
                          {timeAndDate.date && (
                            <div className="text-sm mt-1 opacity-80">
                              {timeAndDate.date}
                            </div>
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
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold uppercase tracking-wide opacity-70">
                      Venue
                    </dt>
                    <dd className="mt-1 text-2xl font-semibold">
                      {data.venue}
                    </dd>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide opacity-70">
                    {data?.venue ? "Address" : "Location"}
                  </dt>
                  <dd className="mt-1">
                    {(() => {
                      const locationStr =
                        typeof data?.location === "string" ? data.location : "";
                      const { street, cityStateZip } =
                        splitAddress(locationStr);
                      const fullQuery = combineVenueAndLocation(
                        (typeof data?.venue === "string" && data.venue) || null,
                        locationStr || null
                      );

                      return (
                        <>
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
                            <div className="text-sm mt-1 opacity-80">
                              <LocationLink
                                location={cityStateZip}
                                query={fullQuery}
                                className=""
                              />
                            </div>
                          )}
                          {!street && !cityStateZip && locationStr && (
                            <LocationLink
                              location={locationStr}
                              query={fullQuery}
                              className="text-base font-semibold"
                            />
                          )}
                        </>
                      );
                    })()}
                  </dd>
                </div>
                {/* Calendar + RSVP moved to separate two-column row below */}
              </dl>
            </div>
            {/* Right column: Map */}
            <div className="lg:col-span-1 lg:self-start">
              <EventMap
                coordinates={data?.coordinates}
                venue={data?.venue}
                location={data?.location}
                className="sticky top-4"
              />
            </div>
          </div>
          {/* Second row: RSVP (left) and Add to calendar (right) */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {(rsvpName || rsvpPhone || rsvpEmail) && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide opacity-70">
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
                <dt className="text-xs font-semibold uppercase tracking-wide opacity-70">
                  Add to calendar
                </dt>
                <dd className="mt-1  space-y-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={calendarLinks.appleInline}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface/30 text-foreground transition-colors hover:bg-surface/50"
                      aria-label="Add to Apple Calendar"
                      title="Apple Calendar"
                    >
                      <CalendarIconApple className="h-5 w-5" />
                    </a>
                    <a
                      href={calendarLinks.google}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface/30 text-foreground transition-colors hover:bg-surface/50"
                      aria-label="Add to Google Calendar"
                      title="Google Calendar"
                    >
                      <CalendarIconGoogle className="h-5 w-5" />
                    </a>
                    <a
                      href={calendarLinks.outlook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface/30 text-foreground transition-colors hover:bg-surface/50"
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
            <div className="mt-6 border-t border-black/10 pt-4 text-sm leading-relaxed dark:border-white/15">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                Attachment
              </p>
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
                <span
                  className="truncate"
                  title={attachmentInfo?.name || "Attachment"}
                >
                  {attachmentInfo?.name || "Attachment"}
                </span>
              </a>
            </div>
          )}
          {(data?.description ||
            (attachmentInfo?.type?.startsWith?.("image/") &&
              attachmentInfo?.dataUrl)) && (
            <div className="mt-6 border-t border-black/10 pt-4 text-sm leading-relaxed dark:border-white/15">
              {data?.description && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                    Description
                  </p>
                  <p className="mt-2 whitespace-pre-wrap">{data.description}</p>
                </div>
              )}
              {attachmentInfo?.type?.startsWith?.("image/") &&
                attachmentInfo?.dataUrl && (
                  <div
                    className={
                      data?.description
                        ? "mt-6 flex justify-center"
                        : "flex justify-center"
                    }
                  >
                    <ThumbnailModal
                      src={attachmentInfo.dataUrl}
                      alt={`${title} flyer`}
                      className="relative rounded max-w-md w-auto"
                    />
                  </div>
                )}
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
          {!isReadOnly && isOwner && createdParam && (
            <SponsoredSupplies
              placement="confirm"
              category={categoryRaw}
              viewer="owner"
              title={title}
              description={(data?.description as string | undefined) || null}
            />
          )}
          {/* Sponsored supplies block for guests (always visible to non-owners) */}
          {!isOwner && (
            <SponsoredSupplies
              placement="confirm"
              category={categoryRaw}
              viewer="guest"
              title={title}
              description={(data?.description as string | undefined) || null}
            />
          )}
          {registriesAllowed && registryCards.length > 0 && (
            <div className="mt-6 border-t border-black/10 pt-4 text-sm leading-relaxed dark:border-white/15">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                Registries
              </p>
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
                      className="group flex items-start gap-3 rounded-lg border border-border bg-surface/30 p-3 transition-colors hover:border-foreground/40 hover:bg-surface/50"
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
                  These links open in a new tab. Registries must stay public or
                  shareable so guests can view them.
                </p>
              )}
            </div>
          )}
        </section>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {isOwner && numberOfGuests > 0 && (
          <EventRsvpDashboard
            eventId={row.id}
            initialNumberOfGuests={numberOfGuests}
          />
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
