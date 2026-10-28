"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  MapPin,
  Send,
  CheckCircle2,
  Copy,
  Eye,
  LayoutDashboard,
  Link2,
  Loader2,
  type LucideIcon,
  MessageSquare,
  Palette,
  Pencil,
  Save,
  Share2,
  Users,
  WandSparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { isPastEvent } from "@/lib/event-edit-lock";
import { useRouter } from "next/navigation";
import { type CSSProperties, type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { type EventContextTab, useSidebar } from "@/app/sidebar-context";
import ArtworkPreviewDialog from "@/components/ArtworkPreviewDialog";
import ArtworkDownloadButton from "@/components/ArtworkDownloadButton";
import ownerStyles from "./EventOwnerTools.module.css";
import EventDeleteModal from "@/components/EventDeleteModal";
import EventAccessDialog from "@/components/EventAccessDialog";
import EventResponseDashboard from "@/components/EventResponseDashboard";
import OwnerPreviewMobileTopbarSuppressor from "@/components/OwnerPreviewMobileTopbarSuppressor";
import OwnerCardPreviewTeaser from "@/components/OwnerCardPreviewTeaser";
import { SharedStudioCardFrame } from "@/components/studio/SharedStudioCardPage";
import { useArtworkAspectRatio } from "@/hooks/use-artwork-aspect-ratio";
import { useMobilePreviewSwipe } from "@/hooks/useMobilePreviewSwipe";
import { requestCardEdit } from "@/lib/card-edit-client";
import { hasActionableRsvp } from "@/lib/dashboard-data";
import {
  getPrimaryEventProductOutput,
  isCardFirstEventProduct,
} from "@/utils/event-product-route";
import { resolveArtworkEditHref, resolveOwnerEditHref } from "@/utils/event-edit-route";
import { trackEventInteraction } from "@/utils/event-tracking-client";
import { buildStudioCardPath } from "@/utils/event-url";

type EventOwnerToolsProps = {
  isOwner?: boolean;
  canManageAccess?: boolean;
  eventId: string;
  eventTitle: string;
  eventData: Record<string, unknown> | null;
  eventHref: string;
  eventOwnerHref?: string;
  initialTab: EventContextTab;
  numberOfGuests: number;
};

type ProductPreviewModel = {
  imageUrl: string | null;
  invitationData: Record<string, unknown> | null;
  positions: Record<string, unknown> | null;
  surface: "studio-card" | "event-page";
  dateLine: string;
  timeLine: string;
  locationLine: string;
  categoryLine: string;
};

type DesignFormState = {
  title: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venueName: string;
  location: string;
  designIdea: string;
};

type DesignEditFields = {
  title: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venueName: string;
  location: string;
  theme?: string;
};

type DesignPreviewCandidate = {
  revision?: string;
  imageDataUrl: string;
  fields: DesignEditFields;
  title: string;
  invitationData: Record<string, unknown> | null;
  positions: Record<string, unknown> | null;
  details: Record<string, unknown> | null;
  dateLine: string;
  timeLine: string;
  locationLine: string;
};

type OwnerWorkspaceTabConfig = {
  key: EventContextTab;
  label: string;
  icon: LucideIcon;
};

const OWNER_WORKSPACE_TABS: OwnerWorkspaceTabConfig[] = [
  { key: "dashboard", label: "Overview", icon: LayoutDashboard },
  { key: "rsvps", label: "Guests", icon: Users },
  { key: "messages", label: "Messages", icon: MessageSquare },
  { key: "design", label: "Invitation", icon: Palette },
];

function OwnerEditLink({ href, disabled, className, children, ...props }: {
  href: string; disabled: boolean; className?: string; children: ReactNode;
  "aria-label"?: string; title?: string;
}) {
  return disabled ? <button type="button" disabled className={`${className || ""} owner-edit-disabled`} {...props} title="Past event">{children}</button>
    : <Link href={href} className={className} {...props}>{children}</Link>;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    const text = readString(value);
    if (text) return text;
  }
  return "";
}

function inferOwnerEventYear(...values: unknown[]): number | null {
  for (const value of values) {
    const text = readString(value);
    const yearMatch = text.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch) return Number(yearMatch[1]);
  }
  return null;
}

function formatOwnerCalendarDate(year: number, monthIndex: number, day: number): string {
  const date = new Date(Date.UTC(year, monthIndex, day));
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== monthIndex ||
    date.getUTCDate() !== day
  ) {
    return "";
  }
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

const OWNER_MONTH_INDEX_BY_NAME: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

function stripOwnerTimeFromDateText(value: string): string {
  return value
    .replace(/\b\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\b/gi, "")
    .replace(/\bat\b/gi, "")
    .replace(/,\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatOwnerDateChipValue(value: unknown, fallbackYear: number | null): string {
  const raw = readString(value);
  if (!raw) return "";

  const isoDateMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateMatch) {
    return formatOwnerCalendarDate(
      Number(isoDateMatch[1]),
      Number(isoDateMatch[2]) - 1,
      Number(isoDateMatch[3]),
    );
  }

  if (/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(raw)) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      return new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(parsed);
    }
  }

  const text = stripOwnerTimeFromDateText(raw);
  const monthNameMatch = text.match(
    /\b(?:sun(?:day)?|mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?)?,?\s*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t)?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:,\s*(\d{4}))?\b/i,
  );
  if (monthNameMatch) {
    const monthIndex = OWNER_MONTH_INDEX_BY_NAME[monthNameMatch[1].replace(".", "").toLowerCase()];
    const year = monthNameMatch[3] ? Number(monthNameMatch[3]) : fallbackYear;
    if (typeof monthIndex === "number" && year) {
      return formatOwnerCalendarDate(year, monthIndex, Number(monthNameMatch[2]));
    }
  }

  const numericDateMatch = text.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?$/);
  if (numericDateMatch) {
    const rawYear = numericDateMatch[3];
    const year = rawYear ? Number(rawYear.length === 2 ? `20${rawYear}` : rawYear) : fallbackYear;
    if (year) {
      return formatOwnerCalendarDate(
        year,
        Number(numericDateMatch[1]) - 1,
        Number(numericDateMatch[2]),
      );
    }
  }

  return text || raw;
}

function formatOwnerTimeChipValue(value: unknown): string {
  const raw = readString(value);
  if (!raw) return "";

  const meridiemMatch = raw.match(/\b(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m\.?\b/i);
  if (meridiemMatch) {
    const hour = Number(meridiemMatch[1]);
    const minute = Number(meridiemMatch[2] || "0");
    if (hour >= 1 && hour <= 12 && minute >= 0 && minute <= 59) {
      return `${hour}:${String(minute).padStart(2, "0")} ${meridiemMatch[3].toUpperCase()}M`;
    }
  }

  const twentyFourHourMatch = raw.match(/\b([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?\b/);
  if (twentyFourHourMatch) {
    const hour = Number(twentyFourHourMatch[1]);
    const minute = Number(twentyFourHourMatch[2]);
    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
  }

  return "";
}

const PREVIEW_IMAGE_BY_CATEGORY: Record<string, string> = {
  birthday: "/studio/birthday.webp",
  birthdays: "/studio/birthday.webp",
  wedding: "/studio/wedding.webp",
  weddings: "/studio/wedding.webp",
  "baby shower": "/studio/baby-shower.webp",
  baby_shower: "/studio/baby-shower.webp",
  "baby showers": "/studio/baby-shower.webp",
  "gender reveal": "/studio/baby-shower.webp",
  gender_reveal: "/studio/baby-shower.webp",
  "bridal shower": "/studio/bridal-shower.webp",
  bridal_shower: "/studio/bridal-shower.webp",
  "game day": "/studio/game-day.webp",
  game_day: "/studio/game-day.webp",
  football: "/studio/game-day.webp",
  sport_event: "/studio/game-day.webp",
  "field trip/day": "/studio/field-trip-day.webp",
  field_trip: "/studio/field-trip-day.webp",
  "open house": "/studio/open-house.webp",
  open_house: "/studio/open-house.webp",
  housewarming: "/studio/housewarming.webp",
  anniversary: "/studio/anniversary.webp",
};

function isCardFirstProduct(data: Record<string, unknown> | null): boolean {
  if (!data) return false;
  return isCardFirstEventProduct(getPrimaryEventProductOutput(data));
}

function resolveProductPreviewImageUrl(
  data: Record<string, unknown> | null,
  studioCard: Record<string, unknown> | null,
): string | null {
  const explicit =
    firstString(
      data?.coverImageUrl,
      studioCard?.imageUrl,
      data?.customHeroImage,
      data?.heroImage,
      data?.thumbnail,
    ) || null;
  if (explicit) return explicit;
  if (!isCardFirstProduct(data)) return null;

  const category = firstString(data?.eventType, data?.category).toLowerCase();
  return PREVIEW_IMAGE_BY_CATEGORY[category] || "/studio/custom-invite.webp";
}

function resolveProductPreviewSurface(
  data: Record<string, unknown> | null,
  imageUrl: string | null,
): ProductPreviewModel["surface"] {
  const publicEvent = asRecord(data?.publicEvent);
  const ownerDefaultSurface = firstString(
    publicEvent?.ownerDefaultSurface,
    data?.ownerDefaultSurface,
  ).toLowerCase();
  if (ownerDefaultSurface === "card" && imageUrl) return "studio-card";
  if (ownerDefaultSurface === "event" || ownerDefaultSurface === "signup") return "event-page";

  const primaryOutput = getPrimaryEventProductOutput(data);
  if (primaryOutput && !isCardFirstEventProduct(primaryOutput)) return "event-page";

  return imageUrl && (asRecord(data?.studioCard) || isCardFirstProduct(data))
    ? "studio-card"
    : "event-page";
}

function buildFallbackInvitationData(
  data: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!data) return null;
  const liveCard = asRecord(data.liveCard);
  const publicEvent = asRecord(data.publicEvent);
  const previewCopy = asRecord(data.previewCopy);
  const title = firstString(
    liveCard?.headline,
    publicEvent?.headline,
    data.headlineTitle,
    data.title,
  );
  const subtitle = firstString(
    liveCard?.subheadline,
    publicEvent?.subheadline,
    previewCopy?.subheadline,
  );
  const description = firstString(
    liveCard?.body,
    publicEvent?.body,
    previewCopy?.body,
    data.description,
  );
  const scheduleLine = firstString(
    liveCard?.scheduleLine,
    publicEvent?.scheduleLine,
    data.scheduleLine,
    data.whenLabel,
  );
  const locationLine = firstString(
    liveCard?.locationLine,
    publicEvent?.locationLine,
    data.locationLabel,
    data.placeName,
    data.venue,
    data.location,
  );
  const rsvp = asRecord(data.rsvp);
  return {
    title: title || "Invitation",
    subtitle,
    description,
    scheduleLine,
    locationLine,
    heroTextMode: firstString(data.heroTextMode) || (isCardFirstProduct(data) ? "image" : ""),
    theme: {
      themeStyle: firstString(data.themeStyle),
    },
    interactiveMetadata: {
      ctaLabel: firstString(rsvp?.cta, liveCard?.cta) || "RSVP",
      shareNote: description,
    },
    eventDetails: {
      category: firstString(data.category),
      eventTitle: title,
      eventDate: firstString(data.startISO, data.startAt, data.start).slice(0, 10),
      venueName: firstString(data.venue),
      location: locationLine,
      detailsDescription: description,
      rsvpEnabled: data.rsvpEnabled === true || rsvp?.isEnabled === true || rsvp?.enabled === true,
      rsvpMode: firstString(rsvp?.mode) || "envitefy",
      rsvpName: typeof data.rsvpName === "string" ? data.rsvpName.trim() : firstString(rsvp?.name),
      rsvpContact: firstString(data.rsvpContact, rsvp?.contact),
      rsvpDeadline: firstString(data.rsvpDeadline, rsvp?.deadline),
      registryLink:
        Array.isArray(data.registries) && asRecord(data.registries[0])
          ? firstString(asRecord(data.registries[0])?.url)
          : firstString(data.registryLink),
    },
  };
}

function formatDateLine(data: Record<string, unknown> | null): string {
  const raw = firstString(data?.startAt, data?.startISO, data?.start, data?.dateText, data?.date);
  if (!raw) return "";
  return formatOwnerDateChipValue(raw, inferOwnerEventYear(raw));
}

function formatTimeLine(data: Record<string, unknown> | null): string {
  return formatOwnerTimeChipValue(
    firstString(
      data?.startTime,
      data?.timeText,
      data?.time,
      data?.startAt,
      data?.startISO,
      data?.start,
    ),
  );
}

function buildProductPreviewModel(eventData: Record<string, unknown> | null): ProductPreviewModel {
  const studioCard = asRecord(eventData?.studioCard);
  const publicEvent = asRecord(eventData?.publicEvent);
  const invitationData =
    asRecord(studioCard?.invitationData) || buildFallbackInvitationData(eventData);
  const eventDetails = asRecord(studioCard?.eventDetails) || asRecord(invitationData?.eventDetails);
  const positions = asRecord(studioCard?.positions);
  const imageUrl = resolveProductPreviewImageUrl(eventData, studioCard);
  const surface = resolveProductPreviewSurface(eventData, imageUrl);
  const eventYear = inferOwnerEventYear(
    eventData?.eventYear,
    eventData?.startAt,
    eventData?.startISO,
    eventData?.start,
    eventDetails?.eventYear,
    eventDetails?.eventDate,
    publicEvent?.dateLine,
    publicEvent?.scheduleLine,
  );
  const rawDateLine = firstString(
    eventDetails?.eventDate,
    publicEvent?.dateLine,
    publicEvent?.scheduleLine,
    eventData?.dateText,
    eventData?.date,
    eventData?.startAt,
    eventData?.startISO,
    eventData?.start,
  );
  const rawTimeLine = firstString(
    eventDetails?.startTime,
    publicEvent?.timeLine,
    eventData?.startTime,
    eventData?.timeText,
    eventData?.time,
    publicEvent?.scheduleLine,
    publicEvent?.dateLine,
    eventData?.startAt,
    eventData?.startISO,
    eventData?.start,
  );

  return {
    imageUrl,
    invitationData,
    positions,
    surface,
    dateLine:
      formatOwnerDateChipValue(rawDateLine, eventYear) ||
      formatDateLine(eventData) ||
      "Date pending",
    timeLine: formatOwnerTimeChipValue(rawTimeLine) || formatTimeLine(eventData),
    locationLine: firstString(
      eventDetails?.venueName,
      eventDetails?.locationName,
      publicEvent?.locationLine,
      eventData?.venue,
      eventData?.placeName,
      eventData?.location,
    ),
    categoryLine: firstString(
      eventData?.category,
      eventData?.eventType,
      publicEvent?.primaryOutput,
    ),
  };
}

function formatDesignDateInput(value: unknown): string {
  const raw = readString(value);
  if (!raw) return "";
  const dateOnly = raw.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
  if (dateOnly) return dateOnly;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function formatDesignTimeInput(value: unknown): string {
  const raw = readString(value);
  if (!raw) return "";
  const timeOnly = raw.match(/T(\d{2}:\d{2})/)?.[1] || raw.match(/^(\d{2}:\d{2})/)?.[1];
  if (timeOnly) return timeOnly;
  const meridiemMatch = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m\.?$/i);
  if (meridiemMatch) {
    const hour = Number(meridiemMatch[1]);
    const minute = meridiemMatch[2] || "00";
    if (hour >= 1 && hour <= 12) {
      const normalizedHour =
        meridiemMatch[3].toLowerCase() === "p"
          ? hour === 12
            ? 12
            : hour + 12
          : hour === 12
            ? 0
            : hour;
      return `${String(normalizedHour).padStart(2, "0")}:${minute.padStart(2, "0")}`;
    }
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return `${String(parsed.getHours()).padStart(2, "0")}:${String(parsed.getMinutes()).padStart(
    2,
    "0",
  )}`;
}

function splitDesignVenueAndAddress(venueName: unknown, location: unknown) {
  const venue = readString(venueName);
  const address = readString(location);
  if (venue && address && venue.toLowerCase() !== address.toLowerCase()) {
    return { venueName: venue, location: address };
  }

  const combined = venue || address;
  const commaIndex = combined.indexOf(",");
  if (commaIndex > 0 && commaIndex < combined.length - 1) {
    return {
      venueName: combined.slice(0, commaIndex).trim(),
      location: combined.slice(commaIndex + 1).trim(),
    };
  }

  return { venueName: venue, location: address };
}

function buildDesignEditFields(form: DesignFormState): DesignEditFields {
  const splitLocation = splitDesignVenueAndAddress(form.venueName, form.location);
  const fields: DesignEditFields = {
    title: form.title,
    eventDate: form.eventDate,
    startTime: form.startTime,
    endTime: form.endTime,
    venueName: splitLocation.venueName,
    location: splitLocation.location,
  };
  const requestedCardChange = readString(form.designIdea);
  if (requestedCardChange) fields.theme = requestedCardChange;
  return fields;
}

function designFormsMatch(left: DesignFormState, right: DesignFormState): boolean {
  const leftFields = buildDesignEditFields(left);
  const rightFields = buildDesignEditFields(right);
  return (Object.keys(leftFields) as Array<keyof DesignEditFields>).every(
    (key) => readString(leftFields[key]) === readString(rightFields[key]),
  );
}

function extractDesignEventDetails(eventData: Record<string, unknown> | null) {
  const studioCard = asRecord(eventData?.studioCard);
  const invitationData = asRecord(studioCard?.invitationData);
  return asRecord(invitationData?.eventDetails) || asRecord(studioCard?.eventDetails);
}

function resolveDesignCardTitle(
  eventTitle: string,
  eventData: Record<string, unknown> | null,
): string {
  const studioCard = asRecord(eventData?.studioCard);
  const invitationData = asRecord(studioCard?.invitationData);
  const eventDetails = asRecord(invitationData?.eventDetails) || asRecord(studioCard?.eventDetails);
  const liveCard = asRecord(eventData?.liveCard);
  const publicEvent = asRecord(eventData?.publicEvent);
  const previewCopy = asRecord(eventData?.previewCopy);

  return firstString(
    eventDetails?.eventTitle,
    invitationData?.title,
    liveCard?.headline,
    publicEvent?.headline,
    previewCopy?.headline,
    eventData?.headlineTitle,
    eventData?.title,
    eventTitle,
  );
}

function buildDesignFormState(
  eventTitle: string,
  eventData: Record<string, unknown> | null,
  preview: ProductPreviewModel,
): DesignFormState {
  const eventDetails = extractDesignEventDetails(eventData);
  const startValue = firstString(
    eventDetails?.eventDate,
    eventData?.startISO,
    eventData?.startAt,
    eventData?.start,
    eventData?.date,
  );
  const endValue = firstString(eventData?.endISO, eventData?.endAt, eventData?.end);

  return {
    title: resolveDesignCardTitle(eventTitle, eventData),
    eventDate: formatDesignDateInput(startValue),
    startTime: formatDesignTimeInput(
      firstString(eventDetails?.startTime, eventData?.startTime, startValue),
    ),
    endTime: formatDesignTimeInput(
      firstString(eventDetails?.endTime, eventData?.endTime, endValue),
    ),
    ...splitDesignVenueAndAddress(
      firstString(eventDetails?.venueName, eventData?.venue, eventData?.placeName),
      firstString(
        eventDetails?.location,
        eventData?.location,
        eventData?.address,
        preview.locationLine,
      ),
    ),
    designIdea: "",
  };
}

function absoluteBrowserUrl(path: string): string {
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).toString();
}

function readSlugFromHref(path: string): string {
  try {
    const parsed = new URL(path || "/", "https://envitefy.local");
    const segment = parsed.pathname.split("/").filter(Boolean).at(-1) || "";
    return decodeURIComponent(segment)
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  } catch {
    return "";
  }
}

function buildOwnerTabHref(baseHref: string, eventId: string, tab: EventContextTab): string {
  const fallbackPath = `/event/${encodeURIComponent(eventId)}`;
  try {
    const parsed = new URL(baseHref || fallbackPath, "https://envitefy.local");
    parsed.searchParams.set("tab", tab);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return `${fallbackPath}?tab=${encodeURIComponent(tab)}`;
  }
}

function buildOwnerPreviewHref(publicUrl: string, returnHref: string): string {
  try {
    const parsed = new URL(publicUrl || "/", "https://envitefy.local");
    parsed.searchParams.set("preview", "owner");
    parsed.searchParams.set("returnTo", returnHref);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return publicUrl || "/";
  }
}

function buildOwnerEmbeddedPreviewHref(publicUrl: string, returnHref: string): string {
  try {
    const parsed = new URL(buildOwnerPreviewHref(publicUrl, returnHref), "https://envitefy.local");
    parsed.searchParams.set("embed", "dashboard-preview");
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return buildOwnerPreviewHref(publicUrl, returnHref);
  }
}

function shouldOpenPreviewInStudioCard(preview: ProductPreviewModel): boolean {
  return preview.surface === "studio-card" && Boolean(preview.imageUrl);
}

export default function EventOwnerTools({
  isOwner = true,
  canManageAccess = false,
  eventId,
  eventTitle,
  eventData,
  eventHref,
  eventOwnerHref,
  initialTab,
  numberOfGuests,
}: EventOwnerToolsProps) {
  const router = useRouter();
  const {
    setSelectedEventId,
    setSelectedEventTitle,
    setSelectedEventHref,
    setSelectedEventOwnerHref,
    setSelectedEventEditHref,
    setActiveEventTab,
  } = useSidebar();
  const editLocked = isPastEvent(eventData);
  const ownerHref = eventOwnerHref || `/event/${encodeURIComponent(eventId)}`;
  const resolvedEditHref = useMemo(
    () => resolveOwnerEditHref(eventId, eventData, eventTitle, ownerHref),
    [eventData, eventId, eventTitle, ownerHref],
  );
  const resolvedArtworkEditHref = useMemo(
    () => resolveArtworkEditHref(eventId, eventData),
    [eventData, eventId],
  );
  const designHref = buildOwnerTabHref(ownerHref, eventId, "design");
  const primaryEditHref = resolvedArtworkEditHref ? designHref : resolvedEditHref;
  const [currentEventTitle, setCurrentEventTitle] = useState(eventTitle);
  const [designPreviewOverride, setDesignPreviewOverride] =
    useState<Partial<ProductPreviewModel> | null>(null);
  const [productViewerMode, setProductViewerMode] = useState<"current" | "changes" | null>(null);
  const [savedProductOverride, setSavedProductOverride] = useState<{
    title?: string;
    preview: Partial<ProductPreviewModel> | null;
  } | null>(null);
  const productViewerTrigger = useRef<HTMLElement | null>(null);
  const productViewerScroll = useRef({ x: 0, y: 0 });
  const cardTeaserTrigger = useRef<HTMLButtonElement | null>(null);
  const [publicUrlOverride, setPublicUrlOverride] = useState<string | null>(null);
  const preview = useMemo(() => buildProductPreviewModel(eventData), [eventData]);
  const effectivePreview = useMemo(
    () => (designPreviewOverride ? { ...preview, ...designPreviewOverride } : preview),
    [designPreviewOverride, preview],
  );
  const measuredArtworkRatio = useArtworkAspectRatio(effectivePreview.imageUrl, 2 / 3);
  const artworkRatio = effectivePreview.invitationData?.sharedDesign ? 2 / 3 : measuredArtworkRatio;
  const rsvpEnabled = hasActionableRsvp(eventData, numberOfGuests);
  const [justPublished, setJustPublished] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("published") !== "1") return;
    setJustPublished(true);
  }, []);
  const publicUrl = useMemo(() => {
    if (publicUrlOverride) return publicUrlOverride;
    if (shouldOpenPreviewInStudioCard(effectivePreview)) {
      return buildStudioCardPath(
        eventId,
        currentEventTitle || eventTitle,
        undefined,
        firstString(eventData?.publicSlug, eventData?.public_slug),
      );
    }
    return eventHref || ownerHref;
  }, [
    currentEventTitle,
    effectivePreview,
    eventData,
    eventHref,
    eventId,
    eventTitle,
    ownerHref,
    publicUrlOverride,
  ]);
  const publicSlug = useMemo(
    () => publicUrlOverride ? readSlugFromHref(publicUrlOverride) : firstString(eventData?.publicSlug, eventData?.public_slug, readSlugFromHref(publicUrl)),
    [eventData, publicUrl, publicUrlOverride],
  );
  const activeOwnerTab: EventContextTab = initialTab;
  const ownerWorkspaceTabs = OWNER_WORKSPACE_TABS;
  const ownerReturnHref = buildOwnerTabHref(ownerHref, eventId, activeOwnerTab);
  const embeddedPreviewHref = buildOwnerEmbeddedPreviewHref(publicUrl, ownerReturnHref);
  const currentProduct = savedProductOverride?.preview
    ? { ...preview, ...savedProductOverride.preview }
    : preview;
  const productName = preview.surface === "studio-card" ? "card" : "event";
  const openProductViewer = (mode: "current" | "changes", trigger?: HTMLElement | null) => {
    productViewerTrigger.current =
      trigger || (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    productViewerScroll.current = { x: window.scrollX, y: window.scrollY };
    setProductViewerMode(mode);
  };
  const hasCardPreview = shouldOpenPreviewInStudioCard(currentProduct);
  const previewSwipe = useMobilePreviewSwipe({
    enabled: hasCardPreview && productViewerMode === null,
    direction: "left",
    onSwipe: () => openProductViewer("current", cardTeaserTrigger.current),
  });

  useEffect(() => {
    setCurrentEventTitle(eventTitle);
    setDesignPreviewOverride(null);
    setSavedProductOverride(null);
    setPublicUrlOverride(null);
  }, [eventData, eventId, eventTitle, preview]);

  useEffect(() => {
    setSelectedEventId(eventId);
    setSelectedEventTitle(currentEventTitle || "Untitled event");
    setSelectedEventHref(publicUrl);
    setSelectedEventOwnerHref(ownerHref);
    setSelectedEventEditHref(editLocked ? null : primaryEditHref);
    setActiveEventTab(activeOwnerTab);
  }, [
    activeOwnerTab,
    eventId,
    currentEventTitle,
    ownerHref,
    primaryEditHref,
    publicUrl,
    setActiveEventTab,
    setSelectedEventEditHref,
    setSelectedEventHref,
    setSelectedEventId,
    setSelectedEventOwnerHref,
    setSelectedEventTitle,
    editLocked,
  ]);

  async function copyPublicLink() {
    const url = absoluteBrowserUrl(publicUrl);
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
    } catch {
      window.prompt("Copy your event link:", url);
    }
  }

  async function sharePublicLink() {
    const url = absoluteBrowserUrl(publicUrl);
    const data = {
      title: currentEventTitle || "Event",
      text: `You're invited to ${currentEventTitle || "this event"}.`,
      url,
    };
    try {
      trackEventInteraction({
        eventId,
        eventName: "share_link_click",
        targetUrl: url,
        targetLabel: currentEventTitle || "Event",
        sourceSurface: "owner_workspace_header",
      });
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
      await copyPublicLink();
    } catch {}
  }

  return (
    <main
      {...previewSwipe}
      data-owner-card-swipe={hasCardPreview ? "true" : undefined}
      className={`${ownerStyles.workspace} ${ownerStyles.swipeSurface} min-h-[100dvh] w-full px-3 pb-5 pt-[calc(var(--app-mobile-topbar-offset,4rem)+1.35rem)] text-slate-950 dark:text-slate-100 sm:px-6 lg:px-8 lg:py-5`}
    >
      <div
        className={`${effectivePreview.surface === "studio-card" ? ownerStyles.cardWorkspace : ""} mx-auto grid w-full max-w-[1380px] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,410px)] xl:grid-cols-[minmax(0,1fr)_430px]`}
        style={{ "--owner-artwork-ratio": artworkRatio } as CSSProperties}
      >
        <section className={`${ownerStyles.content} min-w-0 space-y-3 sm:space-y-4`}>
          {justPublished && (
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-emerald-900">
              <p role="status" className="text-sm font-semibold">Published. Your invitation is ready to share.</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => {
                  setJustPublished(false);
                  const url = new URL(window.location.href);
                  url.searchParams.delete("published");
                  window.history.replaceState(window.history.state, "", url);
                }} className="min-h-11 rounded-lg px-3 text-sm">Dismiss</button>
              </div>
            </div>
          )}
          <OwnerWorkspaceHeader
            editLocked={editLocked}
            eventId={eventId}
            isOwner={isOwner}
            canManageAccess={canManageAccess}
            title={currentEventTitle}
            editHref={primaryEditHref}
            detailsEditHref={resolvedArtworkEditHref ? resolvedEditHref : null}
            onViewCurrent={() => openProductViewer("current")}
            onShare={sharePublicLink}
            mobileCardPreview={hasCardPreview && currentProduct.imageUrl ? (
              <OwnerCardPreviewTeaser
                imageUrl={currentProduct.imageUrl}
                previewOpen={productViewerMode !== null}
                triggerRef={cardTeaserTrigger}
                onOpen={() => openProductViewer("current", cardTeaserTrigger.current)}
              />
            ) : null}
          />
          {ownerWorkspaceTabs.length > 1 ? (
            <OwnerWorkspaceTabs
              activeTab={activeOwnerTab}
              ownerHref={ownerHref}
              eventId={eventId}
              tabs={ownerWorkspaceTabs}
            />
          ) : null}
          {activeOwnerTab === "design" ? (
            <OwnerPublicLinkPanel
              key={eventId}
              linkCopied={linkCopied}
              onCopy={copyPublicLink}
              onCopiedChange={setLinkCopied}
              editLocked={editLocked || !isOwner}
              eventId={eventId}
              activeTab={activeOwnerTab}
              publicSlug={publicSlug}
              publicUrl={publicUrl}
              onUpdated={(nextPath) => setPublicUrlOverride(nextPath)}
            />
          ) : null}
          <OwnerTabContent
            ownerHref={ownerHref}
            activeTab={activeOwnerTab}
            eventId={eventId}
            eventTitle={currentEventTitle}
            eventData={eventData}
            numberOfGuests={numberOfGuests}
            rsvpEnabled={rsvpEnabled}
            editHref={resolvedEditHref}
            preview={preview}
            onViewChanges={() => openProductViewer("changes")}
            onDesignUpdated={(next) => {
              if (typeof next.title === "string") setCurrentEventTitle(next.title);
              setDesignPreviewOverride(next.preview);
              if (next.persisted) {
                setSavedProductOverride({ title: next.title, preview: next.preview });
                window.dispatchEvent(
                  new CustomEvent("history:updated", { detail: { id: eventId } }),
                );
                router.refresh();
              }
            }}
          />
        </section>

        <aside className="hidden w-full min-w-0 lg:sticky lg:top-5 lg:flex lg:h-[calc(100dvh-2.5rem)] lg:items-center lg:justify-end lg:self-start">
          <EventProductPreview
            canDownload={isOwner}
            eventId={eventId}
            eventTitle={currentEventTitle}
            preview={effectivePreview}
            publicUrl={publicUrl}
            embeddedPreviewUrl={embeddedPreviewHref}
          />
        </aside>
      </div>
      <OwnerProductViewer
        canDownload={isOwner}
        open={productViewerMode !== null}
        heading={productViewerMode === "changes" ? "Proposed changes" : `Current ${productName}`}
        description={
          productViewerMode === "changes"
            ? "Review your changes before saving."
            : "The saved version your guests can open."
        }
        returnLabel={activeOwnerTab === "design" ? "Back to invitation" : "Back to overview"}
        eventId={eventId}
        eventTitle={
          productViewerMode === "changes"
            ? currentEventTitle
            : savedProductOverride?.title || eventTitle
        }
        preview={productViewerMode === "changes" ? effectivePreview : currentProduct}
        publicUrl={publicUrl}
        embeddedPreviewUrl={embeddedPreviewHref}
        onClose={() => setProductViewerMode(null)}
        onReturnFocus={() => {
          productViewerTrigger.current?.focus({ preventScroll: true });
          window.scrollTo({ left: productViewerScroll.current.x, top: productViewerScroll.current.y, behavior: "instant" });
        }}
      />
      {/* Artwork is already a fixed portal above navigation. Collapsing the
          workspace chrome underneath its slide would move the dashboard. */}
      {productViewerMode !== null && !hasCardPreview ? <OwnerPreviewMobileTopbarSuppressor /> : null}
    </main>
  );
}

function OwnerWorkspaceTabs({
  activeTab,
  ownerHref,
  eventId,
  tabs,
}: {
  activeTab: EventContextTab;
  ownerHref: string;
  eventId: string;
  tabs: OwnerWorkspaceTabConfig[];
}) {
  return (
    <nav className={ownerStyles.tabs} aria-label="Owner workspace sections">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <Link
            key={tab.key}
            href={buildOwnerTabHref(ownerHref, eventId, tab.key)}
            aria-label={tab.label}
            aria-current={isActive ? "page" : undefined}
            className={ownerStyles.tab}
          >
            <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function EventProductPreview({
  canDownload,
  eventId,
  eventTitle,
  preview,
  publicUrl,
  embeddedPreviewUrl,
  className = "",
  heightMode = "fixed",
}: {
  canDownload: boolean;
  eventId: string;
  eventTitle: string;
  preview: ProductPreviewModel;
  publicUrl: string;
  embeddedPreviewUrl: string;
  className?: string;
  heightMode?: "fixed" | "auto";
}) {
  const autoHeight = heightMode === "auto";
  const isStudioCard = preview.surface === "studio-card" && Boolean(preview.imageUrl);

  return (
    <section
      className={`${isStudioCard ? "" : "owner-workspace-glass"} relative w-full rounded-[28px] ${
        autoHeight || isStudioCard
          ? "overflow-visible !border-0 !bg-transparent !shadow-none !backdrop-blur-none before:!hidden"
          : "overflow-hidden border border-white/70 bg-slate-950 shadow-[0_24px_70px_rgba(79,70,128,0.16)] backdrop-blur-xl"
      } ${
        autoHeight || isStudioCard
          ? "h-auto min-h-0"
          : "h-[min(680px,calc(100dvh-5rem))] min-h-[480px] lg:h-[min(760px,calc(100dvh-2.5rem))] lg:max-h-[760px]"
      } ${className}`.trim()}
      aria-label="Product preview"
    >
      <div
        className={
          autoHeight || isStudioCard
            ? "flex w-full items-center justify-center"
            : "flex h-full w-full items-center justify-center"
        }
      >
        {isStudioCard && preview.imageUrl ? (
          <SharedStudioCardFrame
            eventId={eventId}
            title={eventTitle}
            imageUrl={preview.imageUrl}
            invitationData={preview.invitationData as any}
            positions={preview.positions as any}
            shareUrl={publicUrl}
            embeddedPreview
            canDownload={canDownload}
            fitToWorkspace
            actionsPlacement="overlay"
            className="flex w-full items-center justify-center"
            frameClassName="!h-auto !w-full !max-w-full !rounded-[28px] !border-0 !bg-transparent shadow-none"
          />
        ) : publicUrl ? (
          <div
            className={
              autoHeight
                ? "relative aspect-[9/17] w-full overflow-hidden rounded-[28px] bg-white shadow-2xl sm:aspect-[9/16]"
                : "relative h-full w-auto max-w-full aspect-[9/16] overflow-hidden rounded-[28px] bg-white shadow-2xl"
            }
          >
            <iframe
              src={embeddedPreviewUrl}
              title={`${eventTitle || "Event"} preview`}
              className="h-full w-full border-0 bg-white"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="flex h-full w-auto max-w-full flex-col justify-between rounded-[28px] border border-slate-200 bg-gradient-to-b from-white via-violet-50 to-slate-100 p-5 text-slate-950 dark:text-slate-100 shadow-2xl">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">
                Event page
              </p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight">{eventTitle}</h2>
            </div>
            <div className="space-y-3 rounded-3xl border border-white/80 bg-white/75 p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-300">
                Live details
              </p>
              <p className="text-sm font-semibold text-slate-700">
                {[preview.dateLine, preview.timeLine].filter(Boolean).join(" at ") ||
                  "Date pending"}
              </p>
              {preview.locationLine ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-300">{preview.locationLine}</p>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function OwnerWorkspaceHeader({
  editLocked,
  isOwner = true,
  canManageAccess = false,
  eventId,
  title,
  editHref,
  detailsEditHref,
  onViewCurrent,
  onShare,
  mobileCardPreview,
}: {
  isOwner?: boolean;
  canManageAccess?: boolean;
  eventId: string;
  title: string;
  editHref: string;
  detailsEditHref: string | null;
  onViewCurrent: () => void;
  onShare: () => void;
  mobileCardPreview?: ReactNode;
  editLocked: boolean;
}) {
  const deleteButtonClassName =
    "inline-flex h-10 w-10 items-center justify-center gap-0 rounded-full px-0 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 sm:w-auto sm:gap-1.5 sm:px-3";

  return (
    <header className={ownerStyles.header}>
      <div className={ownerStyles.headerLayout}>
        <div className={ownerStyles.headerMeta}>
          <p className={ownerStyles.eyebrow}>
            {isOwner ? "Owner workspace" : "Co-host workspace"}
          </p>
          <div className={`flex shrink-0 flex-wrap items-center justify-end gap-2 ${ownerStyles.headerActions}`}>
            <OwnerEditLink disabled={editLocked}
                href={detailsEditHref || editHref}
                aria-label="Edit invitation"
                title="Edit invitation"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-violet-700 dark:text-violet-300 transition hover:text-violet-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200"
              >
                <Pencil size={20} strokeWidth={2.2} aria-hidden="true" />
            </OwnerEditLink>
            <button
              type="button"
              onClick={onViewCurrent}
              aria-label="Preview"
              aria-haspopup="dialog"
              className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold text-slate-950 dark:text-slate-100 transition hover:bg-violet-50 hover:text-[#786bd6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200"
            >
              <Eye size={20} strokeWidth={2.2} aria-hidden="true" />
              <span>Preview</span>
            </button>
            {canManageAccess && <EventAccessDialog eventId={eventId} eventTitle={title} />}
            {isOwner && <EventDeleteModal
              eventId={eventId}
              eventTitle={title}
              buttonClassName={deleteButtonClassName}
              labelClassName="hidden sm:inline"
            />}
            <button
              type="button"
              onClick={onShare}
              aria-label="Share"
              title="Share"
              className="inline-flex h-10 w-10 items-center justify-center gap-0 rounded-full px-0 text-sm font-semibold text-slate-950 dark:text-slate-100 transition hover:bg-violet-50 hover:text-[#786bd6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 sm:w-auto sm:gap-1.5 sm:px-3"
            >
              <Share2 size={21} strokeWidth={2.3} aria-hidden="true" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>
        <div className={ownerStyles.headerTitle}>
          <h2 className={ownerStyles.eventTitle}>
            {title || "Untitled event"}
          </h2>
          {mobileCardPreview}
        </div>
      </div>
    </header>
  );
}

function OwnerPublicLinkPanel({
  linkCopied,
  onCopy,
  onCopiedChange: setLinkCopied,
  editLocked,
  eventId,
  activeTab,
  publicSlug,
  publicUrl,
  onUpdated,
}: {
  editLocked: boolean;
  eventId: string;
  activeTab: EventContextTab;
  publicSlug: string;
  publicUrl: string;
  onUpdated: (nextPath: string) => void;
  linkCopied: boolean;
  onCopy: () => Promise<void>;
  onCopiedChange: (copied: boolean) => void;
}) {
  const router = useRouter();
  const [slug, setSlug] = useState(publicSlug);
  const [origin, setOrigin] = useState("");
  const changeLinkTrigger = useRef<HTMLButtonElement | null>(null);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    setSlug(publicSlug);
    setError("");
  }, [publicSlug]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setOrigin(window.location.origin);
  }, []);

  const normalizedSlug = slug
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const hasChanges = normalizedSlug !== publicSlug;
  const currentPath = useMemo(() => {
    try {
      return new URL(publicUrl || "/", "https://envitefy.local").pathname;
    } catch {
      return "";
    }
  }, [publicUrl]);
  const publicPathPrefix = currentPath.startsWith("/card/")
    ? "card"
    : currentPath.startsWith("/smart-signup-form/")
      ? "smart-signup-form"
      : "event";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editLocked || !normalizedSlug || normalizedSlug === "event" || !hasChanges) return;
    setStatus("saving");
    setError("");
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(eventId)}/public-slug`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ publicSlug: normalizedSlug }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data?.error === "string" ? data.error : "The event link could not be updated.",
        );
      }

      const nextPath = data.publicPath || (currentPath.startsWith("/card/")
        ? data.cardPath || data.eventPath
        : currentPath.startsWith("/smart-signup-form/")
          ? data.signupFormPath || data.eventPath
          : data.eventPath);
      onUpdated(nextPath || `/event/${normalizedSlug}`);
      window.dispatchEvent(new CustomEvent("history:updated", { detail: { id: eventId } }));
      setStatus("saved");
      setEditing(false);
      changeLinkTrigger.current?.focus();
      setLinkCopied(false);
      if (data.eventPath) {
        router.replace(`${data.eventPath}?tab=${activeTab}`);
        router.refresh();
      }
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "The event link could not be updated.");
    }
  }

  return (
    <section className={ownerStyles.utilityPanel} aria-label="Share invitation">
      <div className={ownerStyles.linkRow}>
        <div className={ownerStyles.linkLabel}><Link2 size={16} aria-hidden="true" />Guest link</div>
        <a className={ownerStyles.guestLink} href={publicUrl}>{origin || "https://envitefy.com"}{currentPath}</a>
        <div className={ownerStyles.linkActions}>
          <button type="button" className={ownerStyles.linkAction} onClick={() => void onCopy()}><Copy size={16} aria-hidden="true" />Copy link</button>
          <button ref={changeLinkTrigger} type="button" className={ownerStyles.linkAction} disabled={editLocked}
            aria-expanded={editing} onClick={() => { setEditing(true); setStatus("idle"); setLinkCopied(false); }}>
            Change link
          </button>
        </div>
      </div>
      {linkCopied && <p role="status" className="mt-2 text-sm">Link copied</p>}
      {editing && <form aria-label="Change guest link" className={ownerStyles.linkEditor} onSubmit={handleSubmit}>
        <label className="min-w-0">
          <span className="sr-only">Public link slug</span>
          <div className={ownerStyles.linkField}>
            <span className="hidden shrink-0 pl-3 pr-1 text-slate-400 dark:text-slate-300 sm:inline">
              {origin || "https://envitefy.com"}/{publicPathPrefix}/
            </span>
            <input autoFocus disabled={editLocked || status === "saving"} value={slug}
              onChange={(event) => setSlug(event.target.value)}
              className="min-w-0 flex-1 bg-transparent px-3 py-2 outline-none sm:px-1"
              autoCapitalize="none" autoCorrect="off" spellCheck={false} />
          </div>
        </label>
        <div className={ownerStyles.linkActions}>
          <button type="button" className={ownerStyles.linkAction} disabled={status === "saving"}
            onClick={() => { setSlug(publicSlug); setError(""); setStatus("idle"); setEditing(false); changeLinkTrigger.current?.focus(); }}>Cancel</button>
          <button type="submit" disabled={editLocked || !hasChanges || status === "saving" || !normalizedSlug || normalizedSlug === "event"}
            className={ownerStyles.saveLink}>
            {status === "saving" ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
            {status === "saving" ? "Saving" : "Save link"}
          </button>
        </div>
      </form>}
      {status === "saved" || error ? (
        <p
          className={`mt-2 inline-flex items-start gap-2 text-sm font-semibold ${
            error ? "text-rose-700 dark:text-rose-300" : "text-emerald-700 dark:text-emerald-300"
          }`}
          role={error ? "alert" : "status"}
        >
          {error ? (
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          ) : (
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          )}
          <span>{error || "Link updated"}</span>
        </p>
      ) : null}
    </section>
  );
}

function OwnerEventBrief({ eventTitle, eventData, preview, editHref, invitation }: {
  eventTitle: string; eventData: Record<string, unknown> | null; preview: ProductPreviewModel; editHref: string; invitation: boolean;
}) {
  const savedForm = asRecord(asRecord(eventData?.liveCardBuilder)?.form);
  const details = asRecord(preview.invitationData?.eventDetails);
  const message = firstString(savedForm?.overview, eventData?.overview, details?.description, eventData?.description);
  const published = eventData?.status === "published";
  return <section className={ownerStyles.eventBrief} aria-label={invitation ? "Invitation details" : "Event overview"}>
    <div className={ownerStyles.briefHero}>
      {preview.imageUrl && <img className={ownerStyles.briefThumbnail} src={preview.imageUrl} alt="" />}
      <div className={ownerStyles.briefHeading}>
        <span className={ownerStyles.publicationState} data-published={published}><span aria-hidden="true" />{published ? "Published" : eventData?.status === "draft" ? "Draft" : "Saved invitation"}</span>
        <h2>{invitation ? "Your invitation" : "Your event at a glance"}</h2>
        <p>{eventTitle}</p>
      </div>
      <OwnerEditLink disabled={isPastEvent(eventData)} href={editHref} className={ownerStyles.briefEdit}><Pencil size={16} aria-hidden="true" /><span>Edit details</span></OwnerEditLink>
    </div>
    <dl className={ownerStyles.eventFacts}>
      <div className={ownerStyles.eventFact}><dt><span className={ownerStyles.factIcon}><CalendarDays size={23} aria-hidden="true" /></span><span>Date & time</span></dt><dd>{preview.dateLine || "Date to be added"}<p><Clock3 size={14} aria-hidden="true" />{preview.timeLine || "Time to be added"}</p></dd></div>
      <div className={ownerStyles.eventFact}><dt><span className={ownerStyles.factIcon}><MapPin size={23} aria-hidden="true" /></span><span>Location</span></dt><dd>{preview.locationLine || "Location to be added"}{firstString(savedForm?.address, details?.address) && <p>{firstString(savedForm?.address, details?.address)}</p>}</dd></div>
    </dl>
    {message && <div className={ownerStyles.guestNote}><MessageSquare size={19} aria-hidden="true" /><div><h3>Message to guests</h3><p>{message}</p></div></div>}
  </section>;
}

function OwnerTabContent({
  ownerHref,
  activeTab,
  eventId,
  eventTitle,
  eventData,
  numberOfGuests,
  rsvpEnabled,
  editHref,
  preview,
  onViewChanges,
  onDesignUpdated,
}: {
  ownerHref: string;
  activeTab: EventContextTab;
  eventId: string;
  eventTitle: string;
  eventData: Record<string, unknown> | null;
  numberOfGuests: number;
  rsvpEnabled: boolean;
  editHref: string;
  preview: ProductPreviewModel;
  onViewChanges: () => void;
  onDesignUpdated: (next: {
    title?: string;
    preview: Partial<ProductPreviewModel> | null;
    persisted?: boolean;
  }) => void;
}) {
  if (activeTab === "dashboard") return <div className={ownerStyles.overviewLayout}>
    <OwnerEventBrief eventTitle={eventTitle} eventData={eventData} preview={preview} editHref={editHref} invitation={false} />
    {rsvpEnabled && <EventResponseDashboard activeTab={activeTab} eventId={eventId} eventTitle={eventTitle} eventData={eventData} numberOfGuests={numberOfGuests} rsvpEnabled={rsvpEnabled} editHref={editHref} />}
    <nav className={ownerStyles.hostActions} aria-label="Hosting shortcuts">
      {[
        { tab: "design" as const, title: "Review invitation", detail: "Design & guest link", Icon: Palette },
        { tab: "rsvps" as const, title: "Manage guests", detail: rsvpEnabled ? "Responses & RSVP settings" : "RSVP is off · manage settings", Icon: Users },
        { tab: "messages" as const, title: "Message guests", detail: "Updates & announcements", Icon: Send },
      ].map(({ tab, title, detail, Icon }) => <Link key={tab} href={buildOwnerTabHref(ownerHref, eventId, tab)} className={ownerStyles.hostAction}>
        <Icon size={21} aria-hidden="true" /><span><strong>{title}</strong><small>{detail}</small></span><ArrowUpRight size={17} aria-hidden="true" />
      </Link>)}
    </nav>
  </div>;
  if (activeTab === "design") {
    if (preview.invitationData?.sharedDesign) {
      return <OwnerEventBrief eventTitle={eventTitle} eventData={eventData} preview={preview} editHref={editHref} invitation />;
    }
    return (
      <OwnerDesignPanel
        eventId={eventId}
        eventTitle={eventTitle}
        eventData={eventData}
        preview={preview}
        onViewChanges={onViewChanges}
        detailsEditHref={editHref}
        onDesignUpdated={onDesignUpdated}
      />
    );
  }

  return (
    <EventResponseDashboard
      activeTab={activeTab}
      eventId={eventId}
      eventTitle={eventTitle}
      eventData={eventData}
      numberOfGuests={numberOfGuests}
      rsvpEnabled={rsvpEnabled}
      editHref={editHref}
    />
  );
}

function OwnerProductViewer({
  canDownload,
  open,
  heading,
  description,
  returnLabel,
  eventId,
  eventTitle,
  preview,
  publicUrl,
  embeddedPreviewUrl,
  onClose,
  onReturnFocus,
}: {
  canDownload: boolean;
  open: boolean;
  heading: string;
  description: string;
  returnLabel: string;
  eventId: string;
  eventTitle: string;
  preview: ProductPreviewModel;
  publicUrl: string;
  embeddedPreviewUrl: string;
  onClose: () => void;
  onReturnFocus: () => void;
}) {
  if (preview.surface === "studio-card" && preview.imageUrl) {
    return (
      <ArtworkPreviewDialog
        open={open}
        mobileSwipeNavigation
        title={heading}
        imageUrl={preview.imageUrl}
        aspectRatio={preview.invitationData?.heroTextMode === "overlay" ? 9 / 16 : 2 / 3}
        onClose={onClose}
        onReturnFocus={onReturnFocus}
        downloadAction={canDownload ? (
          <ArtworkDownloadButton
            variant="icon"
            imageUrl={preview.imageUrl}
            title={eventTitle}
            invitationData={preview.invitationData ? { ...preview.invitationData, publicUrl } : null}
          />
        ) : undefined}
      >
        <SharedStudioCardFrame
          eventId={eventId}
          title={eventTitle}
          imageUrl={preview.imageUrl}
          invitationData={preview.invitationData}
          positions={preview.positions}
          shareUrl={publicUrl}
          embeddedPreview
          actionsPlacement="overlay"
          frameClassName="!w-full !rounded-[1.5rem]"
          style={{ width: "100%" }}
        />
      </ArtworkPreviewDialog>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[7000] bg-slate-950/40 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed inset-0 z-[7001] flex flex-col bg-[#f5f3ff] pt-[env(safe-area-inset-top)] shadow-2xl outline-none sm:inset-x-auto sm:inset-y-4 sm:left-1/2 sm:w-[min(560px,calc(100%-2rem))] sm:-translate-x-1/2 sm:rounded-[28px]"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            onReturnFocus();
          }}
        >
          <div className="shrink-0 border-b border-violet-100 px-4 pb-4 pt-2">
            <Dialog.Close asChild>
              <button
                type="button"
                className="-ml-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-bold text-violet-700 dark:text-violet-300 transition hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                <ArrowLeft size={20} strokeWidth={2.4} aria-hidden="true" />
                <span>{returnLabel}</span>
              </button>
            </Dialog.Close>
            <Dialog.Title className="mt-1 text-xl font-semibold text-slate-950 dark:text-slate-100">
              {heading}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {description}
            </Dialog.Description>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            <div className="flex min-h-full items-center justify-center">
              <EventProductPreview
                canDownload={canDownload}
                eventId={eventId}
                eventTitle={eventTitle}
                preview={preview}
                publicUrl={publicUrl}
                embeddedPreviewUrl={embeddedPreviewUrl}
                className="mx-auto w-full max-w-[430px]"
                heightMode="auto"
              />
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function OwnerDesignPanel({
  eventId,
  eventTitle,
  eventData,
  preview,
  onViewChanges,
  detailsEditHref,
  onDesignUpdated,
}: {
  eventId: string;
  eventTitle: string;
  eventData: Record<string, unknown> | null;
  preview: ProductPreviewModel;
  onViewChanges: () => void;
  detailsEditHref: string;
  onDesignUpdated: (next: {
    title?: string;
    preview: Partial<ProductPreviewModel> | null;
    persisted?: boolean;
  }) => void;
}) {
  const [form, setForm] = useState<DesignFormState>(() =>
    buildDesignFormState(eventTitle, eventData, preview),
  );
  const [currentImageUrl, setCurrentImageUrl] = useState(preview.imageUrl);
  const [currentInvitationData, setCurrentInvitationData] = useState(preview.invitationData);
  const [currentPositions, setCurrentPositions] = useState(preview.positions);
  const [baselineForm, setBaselineForm] = useState<DesignFormState>(() =>
    buildDesignFormState(eventTitle, eventData, preview),
  );
  const [candidate, setCandidate] = useState<DesignPreviewCandidate | null>(null);
  const [status, setStatus] = useState<"idle" | "previewing" | "ready" | "saving" | "saved">(
    "idle",
  );
  const [error, setError] = useState("");
  const editLocked = isPastEvent(eventData);
  const isBusy = status === "previewing" || status === "saving";
  const hasDesignChanges = !designFormsMatch(form, baselineForm);
  const canCancelDesignChanges =
    !isBusy && (hasDesignChanges || Boolean(candidate) || Boolean(error));

  useEffect(() => {
    const nextForm = buildDesignFormState(eventTitle, eventData, preview);
    setForm(nextForm);
    setBaselineForm(nextForm);
    setCurrentImageUrl(preview.imageUrl);
    setCurrentInvitationData(preview.invitationData);
    setCurrentPositions(preview.positions);
    setCandidate(null);
    setStatus("idle");
    setError("");
  }, [eventData, eventId]);

  function updateField(key: keyof DesignFormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    if (candidate) {
      setCandidate(null);
      setCurrentImageUrl(preview.imageUrl);
      setCurrentInvitationData(preview.invitationData);
      setCurrentPositions(preview.positions);
      onDesignUpdated({
        title: baselineForm.title || eventTitle,
        preview: null,
      });
    }
    if (status === "ready" || status === "saved") setStatus("idle");
    if (error) setError("");
  }

  function handleCancelChanges() {
    if (isBusy) return;
    setForm(baselineForm);
    setCurrentImageUrl(preview.imageUrl);
    setCurrentInvitationData(preview.invitationData);
    setCurrentPositions(preview.positions);
    setCandidate(null);
    setStatus("idle");
    setError("");
    onDesignUpdated({
      title: baselineForm.title || eventTitle,
      preview: null,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editLocked || !currentImageUrl || isBusy) return;

    if (!hasDesignChanges) {
      setError("No design changes requested.");
      return;
    }

    const fields = buildDesignEditFields(form);
    setStatus("previewing");
    setError("");

    try {
      const json = await requestCardEdit(eventId, {
        action: "preview",
        fields,
      });

      const details = asRecord(json?.details);
      const nextImageDataUrl = firstString(json?.imageDataUrl);
      if (!nextImageDataUrl) {
        throw new Error("The card preview could not be generated.");
      }
      const nextInvitationData = asRecord(json?.invitationData) || currentInvitationData;
      const nextPositions = asRecord(json?.positions) || currentPositions;
      const nextTitle = firstString(details?.eventTitle, json?.title, form.title, eventTitle);
      const nextDateLine =
        formatOwnerDateChipValue(
          details?.eventDate || form.eventDate,
          inferOwnerEventYear(details?.eventDate || form.eventDate),
        ) || preview.dateLine;
      const nextTimeLine =
        formatOwnerTimeChipValue(details?.startTime || form.startTime) || preview.timeLine;
      const nextLocationLine = firstString(
        details?.venueName,
        details?.location,
        form.venueName,
        form.location,
        preview.locationLine,
      );

      setCurrentImageUrl(nextImageDataUrl);
      setCurrentInvitationData(nextInvitationData);
      setCurrentPositions(nextPositions);
      const nextForm = {
        ...form,
        title: nextTitle,
        eventDate: formatDesignDateInput(details?.eventDate) || form.eventDate,
        startTime: formatDesignTimeInput(details?.startTime) || form.startTime,
        endTime: formatDesignTimeInput(details?.endTime) || form.endTime,
        venueName: firstString(details?.venueName, form.venueName),
        location: firstString(details?.location, form.location),
        designIdea: firstString(details?.theme, form.designIdea),
      };
      const nextFields = buildDesignEditFields(nextForm);
      setForm(nextForm);
      setCandidate({
        revision: typeof json.revision === "string" ? json.revision : undefined,
        imageDataUrl: nextImageDataUrl,
        fields: nextFields,
        title: nextTitle,
        invitationData: nextInvitationData,
        positions: nextPositions,
        details,
        dateLine: nextDateLine,
        timeLine: nextTimeLine,
        locationLine: nextLocationLine,
      });
      setStatus("ready");
      onDesignUpdated({
        title: nextTitle,
        preview: {
          imageUrl: nextImageDataUrl,
          invitationData: nextInvitationData,
          positions: nextPositions,
          dateLine: nextDateLine,
          timeLine: nextTimeLine,
          locationLine: nextLocationLine,
        },
        persisted: false,
      });
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "The card could not be updated.");
    }
  }

  async function handleSaveChanges() {
    if (editLocked || !candidate || isBusy) return;

    setStatus("saving");
    setError("");

    try {
      const json = await requestCardEdit(eventId, {
        action: "save",
        expectedRevision: candidate.revision,
        fields: candidate.fields,
        imageDataUrl: candidate.imageDataUrl,
      });

      const details = asRecord(json?.details) || candidate.details;
      const nextImageUrl = firstString(json?.imageUrl, candidate.imageDataUrl);
      const nextInvitationData = asRecord(json?.invitationData) || candidate.invitationData;
      const nextPositions = asRecord(json?.positions) || candidate.positions;
      const nextTitle = firstString(details?.eventTitle, json?.title, candidate.title);
      const nextDateLine =
        formatOwnerDateChipValue(
          details?.eventDate || candidate.fields.eventDate,
          inferOwnerEventYear(details?.eventDate || candidate.fields.eventDate),
        ) || candidate.dateLine;
      const nextTimeLine =
        formatOwnerTimeChipValue(details?.startTime || candidate.fields.startTime) ||
        candidate.timeLine;
      const nextLocationLine = firstString(
        details?.venueName,
        details?.locationName,
        details?.location,
        candidate.locationLine,
      );
      const nextForm = {
        title: nextTitle,
        eventDate: formatDesignDateInput(details?.eventDate) || candidate.fields.eventDate,
        startTime: formatDesignTimeInput(details?.startTime) || candidate.fields.startTime,
        endTime: formatDesignTimeInput(details?.endTime) || candidate.fields.endTime,
        venueName: firstString(details?.venueName, candidate.fields.venueName),
        location: firstString(details?.location, candidate.fields.location),
        designIdea: "",
      };

      setCurrentImageUrl(nextImageUrl);
      setCurrentInvitationData(nextInvitationData);
      setCurrentPositions(nextPositions);
      setForm(nextForm);
      setBaselineForm(nextForm);
      setCandidate(null);
      setStatus("saved");
      onDesignUpdated({
        title: nextTitle,
        preview: {
          imageUrl: nextImageUrl,
          invitationData: nextInvitationData,
          positions: nextPositions,
          dateLine: nextDateLine,
          timeLine: nextTimeLine,
          locationLine: nextLocationLine,
        },
        persisted: true,
      });
    } catch (err) {
      setStatus("ready");
      setError(err instanceof Error ? err.message : "The card changes could not be saved.");
    }
  }

  return (
    <section className={ownerStyles.invitationEditor}>
      <div className="grid gap-5">
        <form className="min-w-0" onSubmit={handleSubmit}><fieldset disabled={editLocked} className="space-y-4">
          <h3 className={ownerStyles.sectionTitle}>Invitation details</h3>

          {!currentImageUrl ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm font-semibold text-amber-900 sm:flex-row sm:items-center sm:justify-between">
              <span className="inline-flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>Add card artwork before using Design edits.</span>
              </span>
              <Link
                href={detailsEditHref}
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-white px-3 text-xs font-black uppercase tracking-[0.12em] text-amber-900 shadow-sm transition hover:bg-amber-100"
              >
                Open details
              </Link>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <label className="col-span-2 block text-xs font-black uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400 dark:text-slate-300 md:col-span-3">
              Title
              <input
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                className="mt-2 min-h-11 w-full rounded-2xl border border-violet-900/20 bg-white/62 px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 dark:text-slate-100 shadow-[inset_0_1px_3px_rgba(76,29,149,0.20)] outline-none backdrop-blur-md transition focus:border-violet-500/40 focus:bg-white/80 focus:ring-4 focus:ring-violet-200/60"
              />
            </label>

            <label className="col-span-2 block text-xs font-black uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400 dark:text-slate-300 md:col-span-1">
              Date
              <input
                type="date"
                value={form.eventDate}
                onChange={(event) => updateField("eventDate", event.target.value)}
                className="mt-2 min-h-11 w-full rounded-2xl border border-violet-900/20 bg-white/62 px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 dark:text-slate-100 shadow-[inset_0_1px_3px_rgba(76,29,149,0.20)] outline-none backdrop-blur-md transition focus:border-violet-500/40 focus:bg-white/80 focus:ring-4 focus:ring-violet-200/60"
              />
            </label>

            <label className="block min-w-0 text-xs font-black uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400 dark:text-slate-300">
              Start time
              <input
                type="time"
                value={form.startTime}
                onChange={(event) => updateField("startTime", event.target.value)}
                className="mt-2 min-h-11 w-full rounded-2xl border border-violet-900/20 bg-white/62 px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 dark:text-slate-100 shadow-[inset_0_1px_3px_rgba(76,29,149,0.20)] outline-none backdrop-blur-md transition focus:border-violet-500/40 focus:bg-white/80 focus:ring-4 focus:ring-violet-200/60"
              />
            </label>

            <label className="block min-w-0 text-xs font-black uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400 dark:text-slate-300">
              End time
              <input
                type="time"
                value={form.endTime}
                onChange={(event) => updateField("endTime", event.target.value)}
                className="mt-2 min-h-11 w-full rounded-2xl border border-violet-900/20 bg-white/62 px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 dark:text-slate-100 shadow-[inset_0_1px_3px_rgba(76,29,149,0.20)] outline-none backdrop-blur-md transition focus:border-violet-500/40 focus:bg-white/80 focus:ring-4 focus:ring-violet-200/60"
              />
            </label>

            <label className="col-span-2 block text-xs font-black uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400 dark:text-slate-300 md:col-span-1">
              Venue
              <input
                value={form.venueName}
                onChange={(event) => updateField("venueName", event.target.value)}
                className="mt-2 min-h-11 w-full rounded-2xl border border-violet-900/20 bg-white/62 px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 dark:text-slate-100 shadow-[inset_0_1px_3px_rgba(76,29,149,0.20)] outline-none backdrop-blur-md transition focus:border-violet-500/40 focus:bg-white/80 focus:ring-4 focus:ring-violet-200/60"
              />
            </label>

            <label className="col-span-2 block text-xs font-black uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400 dark:text-slate-300 md:col-span-2">
              Address
              <input
                value={form.location}
                onChange={(event) => updateField("location", event.target.value)}
                className="mt-2 min-h-11 w-full rounded-2xl border border-violet-900/20 bg-white/62 px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 dark:text-slate-100 shadow-[inset_0_1px_3px_rgba(76,29,149,0.20)] outline-none backdrop-blur-md transition focus:border-violet-500/40 focus:bg-white/80 focus:ring-4 focus:ring-violet-200/60"
              />
            </label>

            <label className="col-span-2 block text-xs font-black uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400 dark:text-slate-300 md:col-span-3">
              Enter your change
              <input
                value={form.designIdea}
                onChange={(event) => updateField("designIdea", event.target.value)}
                placeholder='e.g. Change the bottom sentence to "Join us to celebrate Lara turning 7."'
                className="mt-2 min-h-11 w-full rounded-2xl border border-violet-900/20 bg-white/62 px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 dark:text-slate-100 shadow-[inset_0_1px_3px_rgba(76,29,149,0.20)] outline-none backdrop-blur-md transition focus:border-violet-500/40 focus:bg-white/80 focus:ring-4 focus:ring-violet-200/60"
              />
            </label>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)] gap-2 sm:flex sm:items-center sm:justify-end sm:gap-3">
            {status === "ready" ? (
              <button
                type="button"
                onClick={onViewChanges}
                aria-haspopup="dialog"
                className="col-span-full inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-bold text-violet-700 dark:text-violet-300 transition hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                <Eye size={18} aria-hidden="true" />
                View changes
              </button>
            ) : null}
            {status === "saved" ? (
              <p className="col-span-full inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <CheckCircle2 size={16} aria-hidden="true" />
                Changes saved
              </p>
            ) : null}
            <button
              type="button"
              onClick={handleCancelChanges}
              disabled={!canCancelDesignChanges}
              className="inline-flex min-h-12 min-w-0 items-center justify-center gap-1 rounded-2xl border border-slate-300 bg-white/80 px-2 text-xs font-bold text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition hover:bg-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-white/50 disabled:text-slate-300 sm:gap-2 sm:px-5 sm:text-sm"
            >
              <X size={16} aria-hidden="true" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={!currentImageUrl || isBusy || !hasDesignChanges}
              className="inline-flex min-h-12 min-w-0 items-center justify-center gap-1 rounded-2xl bg-slate-950 px-2 text-xs font-bold text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 sm:gap-2 sm:px-5 sm:text-sm"
            >
              {status === "previewing" ? (
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              ) : (
                <WandSparkles size={16} aria-hidden="true" />
              )}
              <span>{status === "previewing" ? "Previewing" : "Preview changes"}</span>
            </button>
            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={!candidate || isBusy}
              className="inline-flex min-h-12 min-w-0 items-center justify-center gap-1 rounded-2xl bg-violet-700 px-2 text-xs font-bold text-white shadow-[0_14px_30px_rgba(109,40,217,0.18)] transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:bg-slate-300 sm:gap-2 sm:px-5 sm:text-sm"
            >
              {status === "saving" ? (
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              ) : (
                <Save size={16} aria-hidden="true" />
              )}
              {status === "saving" ? "Saving" : "Save"}
            </button>
          </div>

          {status === "previewing" ? (
            <p role="status" className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Updating your card artwork. This can take a few minutes. Keep this page open.
            </p>
          ) : null}
          {error ? (
            <p
              role="alert"
              className="inline-flex w-full items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </p>
          ) : null}
        </fieldset></form>
      </div>
    </section>
  );
}
