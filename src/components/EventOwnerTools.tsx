"use client";

import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  LayoutDashboard,
  Link2,
  Loader2,
  type LucideIcon,
  MapPin,
  MessageSquare,
  Palette,
  Pencil,
  Save,
  Share2,
  Users,
  WandSparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { type EventContextTab, useSidebar } from "@/app/sidebar-context";
import EventDeleteModal from "@/components/EventDeleteModal";
import EventResponseDashboard from "@/components/EventResponseDashboard";
import OwnerPreviewMobileTopbarSuppressor from "@/components/OwnerPreviewMobileTopbarSuppressor";
import { SharedStudioCardFrame } from "@/components/studio/SharedStudioCardPage";
import { hasActionableRsvp } from "@/lib/dashboard-data";
import { resolveArtworkEditHref, resolveEditHref } from "@/utils/event-edit-route";
import { buildStudioCardPath } from "@/utils/event-url";

type EventOwnerToolsProps = {
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
  labelWidth: number;
  tabWidth: number;
};

const OWNER_WORKSPACE_TABS: OwnerWorkspaceTabConfig[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, labelWidth: 78, tabWidth: 122 },
  { key: "rsvps", label: "RSVPs", icon: Users, labelWidth: 50, tabWidth: 94 },
  { key: "messages", label: "Messages", icon: MessageSquare, labelWidth: 76, tabWidth: 120 },
  { key: "design", label: "Design", icon: Palette, labelWidth: 54, tabWidth: 98 },
];

const OWNER_TAB_HINT_INTERVAL_MS = 2000;
const OWNER_TAB_HINT_CYCLES = 3;
const OWNER_TAB_COMPACT_WIDTH = 44;

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

const CARD_FIRST_OUTPUTS = new Set([
  "live_card",
  "digital_flyer",
  "printable_flyer",
  "invitation",
  "instagram_story",
  "thank_you_card",
  "menu",
  "welcome_sign",
]);

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

function normalizeProductOutput(value: unknown): string {
  return readString(value)
    .toLowerCase()
    .replace(/\//g, "_")
    .replace(/[\s-]+/g, "_");
}

function readOutputValues(data: Record<string, unknown> | null): string[] {
  if (!data) return [];
  return [
    ...(Array.isArray(data.requestedOutputs) ? data.requestedOutputs : []),
    ...(Array.isArray(data.outputs) ? data.outputs : []),
  ]
    .map(normalizeProductOutput)
    .filter(Boolean);
}

function isCardFirstProduct(data: Record<string, unknown> | null): boolean {
  if (!data) return false;
  const publicEvent = asRecord(data.publicEvent);
  const primaryOutput = normalizeProductOutput(
    firstString(
      publicEvent?.primaryOutput,
      publicEvent?.renderer,
      data.primaryOutput,
      data.productType,
      data.publicRenderer,
    ),
  );
  const outputs = readOutputValues(data);
  return (
    CARD_FIRST_OUTPUTS.has(primaryOutput) ||
    outputs.some((output) => CARD_FIRST_OUTPUTS.has(output))
  );
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
      rsvpName: firstString(data.rsvpName, rsvp?.name),
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
    title: firstString(eventDetails?.eventTitle, eventData?.title, eventTitle),
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

function shouldOpenPreviewInStudioCard(
  eventData: Record<string, unknown> | null,
  preview: ProductPreviewModel,
): boolean {
  const publicEvent = asRecord(eventData?.publicEvent);
  const ownerDefaultSurface = firstString(
    publicEvent?.ownerDefaultSurface,
    eventData?.ownerDefaultSurface,
  ).toLowerCase();
  if (ownerDefaultSurface === "card") return Boolean(preview.imageUrl);
  if (ownerDefaultSurface === "event" || ownerDefaultSurface === "signup") return false;

  return Boolean(
    preview.imageUrl && (asRecord(eventData?.studioCard) || isCardFirstProduct(eventData)),
  );
}

export default function EventOwnerTools({
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
  const resolvedEditHref = useMemo(
    () => resolveEditHref(eventId, eventData, eventTitle),
    [eventData, eventId, eventTitle],
  );
  const resolvedArtworkEditHref = useMemo(
    () => resolveArtworkEditHref(eventId, eventData),
    [eventData, eventId],
  );
  const ownerHref = eventOwnerHref || `/event/${encodeURIComponent(eventId)}`;
  const designHref = buildOwnerTabHref(ownerHref, eventId, "design");
  const primaryEditHref = resolvedArtworkEditHref ? designHref : resolvedEditHref;
  const [currentEventTitle, setCurrentEventTitle] = useState(eventTitle);
  const [designPreviewOverride, setDesignPreviewOverride] =
    useState<Partial<ProductPreviewModel> | null>(null);
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);
  const [publicUrlOverride, setPublicUrlOverride] = useState<string | null>(null);
  const preview = useMemo(() => buildProductPreviewModel(eventData), [eventData]);
  const effectivePreview = useMemo(
    () => (designPreviewOverride ? { ...preview, ...designPreviewOverride } : preview),
    [designPreviewOverride, preview],
  );
  const rsvpEnabled = hasActionableRsvp(eventData, numberOfGuests);
  const publicUrl = useMemo(() => {
    if (publicUrlOverride) return publicUrlOverride;
    if (shouldOpenPreviewInStudioCard(eventData, effectivePreview)) {
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
    () => firstString(eventData?.publicSlug, eventData?.public_slug, readSlugFromHref(publicUrl)),
    [eventData, publicUrl],
  );
  const activeOwnerTab: EventContextTab =
    rsvpEnabled || initialTab === "design" ? initialTab : "design";
  const ownerWorkspaceTabs = useMemo(
    () =>
      rsvpEnabled
        ? OWNER_WORKSPACE_TABS
        : OWNER_WORKSPACE_TABS.filter((tab) => tab.key === "design"),
    [rsvpEnabled],
  );
  const ownerReturnHref = buildOwnerTabHref(ownerHref, eventId, activeOwnerTab);
  const previewHref = buildOwnerPreviewHref(publicUrl, ownerReturnHref);
  const openMobilePreview = () => setIsMobilePreviewOpen(true);
  const closeMobilePreview = () => setIsMobilePreviewOpen(false);

  useEffect(() => {
    setCurrentEventTitle(eventTitle);
    setDesignPreviewOverride(null);
    setPublicUrlOverride(null);
  }, [eventData, eventId, eventTitle, preview]);

  useEffect(() => {
    setSelectedEventId(eventId);
    setSelectedEventTitle(currentEventTitle || "Untitled event");
    setSelectedEventHref(publicUrl);
    setSelectedEventOwnerHref(ownerHref);
    setSelectedEventEditHref(primaryEditHref);
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
  ]);

  async function copyPublicLink() {
    const url = absoluteBrowserUrl(publicUrl);
    try {
      await navigator.clipboard.writeText(url);
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
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
      await copyPublicLink();
    } catch {}
  }

  return (
    <main className="min-h-[100dvh] w-full px-3 pb-5 pt-[calc(var(--app-mobile-topbar-offset,4rem)+1.35rem)] text-slate-950 sm:px-6 lg:px-8 lg:py-5">
      <div
        className={`mx-auto grid w-full max-w-[1380px] gap-4 transition-transform duration-300 ease-out motion-reduce:transition-none lg:translate-x-0 lg:grid-cols-[minmax(0,1fr)_minmax(300px,410px)] xl:grid-cols-[minmax(0,1fr)_430px] ${
          isMobilePreviewOpen ? "-translate-x-10" : "translate-x-0"
        }`}
      >
        <section className="min-w-0 space-y-3 sm:space-y-4">
          <OwnerWorkspaceHeader
            eventId={eventId}
            title={currentEventTitle}
            dateLine={effectivePreview.dateLine}
            timeLine={effectivePreview.timeLine}
            locationLine={effectivePreview.locationLine}
            previewHref={previewHref}
            editHref={primaryEditHref}
            detailsEditHref={resolvedArtworkEditHref ? resolvedEditHref : null}
            onPreview={openMobilePreview}
            onShare={sharePublicLink}
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
              eventId={eventId}
              activeTab={activeOwnerTab}
              publicSlug={publicSlug}
              publicUrl={publicUrl}
              onUpdated={(nextPath) => setPublicUrlOverride(nextPath)}
            />
          ) : null}
          <OwnerTabContent
            activeTab={activeOwnerTab}
            eventId={eventId}
            eventTitle={currentEventTitle}
            eventData={eventData}
            numberOfGuests={numberOfGuests}
            rsvpEnabled={rsvpEnabled}
            editHref={resolvedEditHref}
            preview={preview}
            onDesignUpdated={(next) => {
              if (typeof next.title === "string") setCurrentEventTitle(next.title);
              setDesignPreviewOverride(next.preview);
              if (next.persisted) {
                window.dispatchEvent(
                  new CustomEvent("history:updated", { detail: { id: eventId } }),
                );
                router.refresh();
              }
            }}
          />
        </section>

        <aside className="hidden min-w-0 lg:sticky lg:top-5 lg:flex lg:h-[calc(100dvh-2.5rem)] lg:translate-x-6 lg:items-center lg:justify-end lg:self-start xl:translate-x-10">
          <EventProductPreview
            eventTitle={currentEventTitle}
            preview={effectivePreview}
            publicUrl={publicUrl}
          />
        </aside>
      </div>
      <MobileOwnerPreviewDrawer
        open={isMobilePreviewOpen}
        eventTitle={currentEventTitle}
        preview={effectivePreview}
        publicUrl={publicUrl}
        onClose={closeMobilePreview}
      />
      {isMobilePreviewOpen ? <OwnerPreviewMobileTopbarSuppressor /> : null}
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
  const [hintTab, setHintTab] = useState<EventContextTab | null>(null);

  useEffect(() => {
    if (activeTab !== "dashboard" || tabs.length < 2) {
      setHintTab(null);
      return;
    }

    let step = tabs.findIndex((tab) => tab.key === activeTab) + 1;
    const maxSteps = tabs.length * OWNER_TAB_HINT_CYCLES;
    setHintTab(tabs[step % tabs.length]?.key ?? null);

    const timer = window.setInterval(() => {
      step += 1;

      if (step >= maxSteps) {
        window.clearInterval(timer);
        setHintTab(null);
        return;
      }

      setHintTab(tabs[step % tabs.length]?.key ?? null);
    }, OWNER_TAB_HINT_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [activeTab, tabs]);

  return (
    <nav
      className="owner-workspace-glass relative w-full overflow-hidden rounded-[22px] border border-white/75 bg-white/92 p-1.5 shadow-[0_16px_42px_rgba(79,70,128,0.10)] backdrop-blur-xl"
      aria-label="Owner workspace sections"
    >
      <div
        className="flex w-full items-center justify-between gap-1 sm:hidden"
        role="tablist"
        aria-label="Owner workspace sections"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const isHinted = hintTab === tab.key && !isActive;
          const isRevealed = isActive || isHinted;
          return (
            <Link
              key={tab.key}
              href={buildOwnerTabHref(ownerHref, eventId, tab.key)}
              role="tab"
              aria-selected={isActive}
              className={`inline-flex min-h-11 shrink-0 items-center justify-center overflow-hidden rounded-[16px] px-3 text-[0.72rem] font-black uppercase tracking-[0.12em] transition-[width,background-color,color,box-shadow] duration-300 ease-out ${
                isActive
                  ? "bg-slate-950 text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)]"
                  : isHinted
                    ? "bg-slate-100 text-slate-700 shadow-[0_10px_22px_rgba(79,70,128,0.10)]"
                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
              }`}
              style={{ width: `${isRevealed ? tab.tabWidth : OWNER_TAB_COMPACT_WIDTH}px` }}
            >
              <Icon size={16} strokeWidth={2} aria-hidden="true" />
              <span
                className={`overflow-hidden whitespace-nowrap transition-[width,opacity,margin-left] duration-300 ease-out ${
                  isRevealed ? "ml-2 opacity-100" : "ml-0 opacity-0"
                }`}
                style={{ width: `${isRevealed ? tab.labelWidth : 0}px` }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
      <div
        className="hidden w-full grid-cols-4 gap-1 sm:grid"
        role="tablist"
        aria-label="Owner workspace sections"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <Link
              key={tab.key}
              href={buildOwnerTabHref(ownerHref, eventId, tab.key)}
              role="tab"
              aria-selected={isActive}
              className={`inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-[16px] px-3 text-[0.72rem] font-black uppercase tracking-[0.12em] transition ${
                isActive
                  ? "bg-slate-950 text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)]"
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <Icon size={16} strokeWidth={2} aria-hidden="true" />
              <span className="truncate">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function EventProductPreview({
  eventTitle,
  preview,
  publicUrl,
  className = "",
  heightMode = "fixed",
}: {
  eventTitle: string;
  preview: ProductPreviewModel;
  publicUrl: string;
  className?: string;
  heightMode?: "fixed" | "auto";
}) {
  const autoHeight = heightMode === "auto";

  return (
    <section
      className={`owner-workspace-glass relative overflow-hidden rounded-[28px] border border-white/70 bg-slate-950 shadow-[0_24px_70px_rgba(79,70,128,0.16)] backdrop-blur-xl ${
        autoHeight
          ? "h-auto min-h-0 !border-0 !bg-transparent !shadow-none !backdrop-blur-none before:!hidden"
          : "h-[min(680px,calc(100dvh-5rem))] min-h-[480px] lg:h-[min(760px,calc(100dvh-2.5rem))] lg:max-h-[760px]"
      } ${className}`.trim()}
      aria-label="Product preview"
    >
      <div
        className={
          autoHeight
            ? "flex w-full items-center justify-center"
            : "flex h-full w-full items-center justify-center"
        }
      >
        {preview.imageUrl ? (
          <SharedStudioCardFrame
            title={eventTitle}
            imageUrl={preview.imageUrl}
            invitationData={preview.invitationData as any}
            positions={preview.positions as any}
            shareUrl={publicUrl}
            className={
              autoHeight
                ? "flex w-full items-center justify-center"
                : "flex h-full w-full items-center justify-center"
            }
            frameClassName={
              autoHeight
                ? "!aspect-[9/17] !w-full !max-w-full !rounded-[28px] !border-0 shadow-none sm:!aspect-[9/16]"
                : "!h-full !w-auto !max-w-full !rounded-[28px] !border-0 shadow-none"
            }
            style={autoHeight ? undefined : { width: "100%", height: "100%" }}
          />
        ) : (
          <div className="flex h-full w-auto max-w-full flex-col justify-between rounded-[28px] border border-slate-200 bg-gradient-to-b from-white via-violet-50 to-slate-100 p-5 text-slate-950 shadow-2xl">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">
                Event page
              </p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight">{eventTitle}</h2>
            </div>
            <div className="space-y-3 rounded-3xl border border-white/80 bg-white/75 p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Live details
              </p>
              <p className="text-sm font-semibold text-slate-700">
                {[preview.dateLine, preview.timeLine].filter(Boolean).join(" at ") ||
                  "Date pending"}
              </p>
              {preview.locationLine ? (
                <p className="text-sm text-slate-500">{preview.locationLine}</p>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function OwnerDetailChip({
  icon: Icon,
  iconClassName,
  label,
  value,
}: {
  icon: LucideIcon;
  iconClassName: string;
  label: string;
  value: string;
}) {
  return (
    <span
      className="owner-workspace-glass-chip group inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-full bg-white px-3 text-[13px] font-semibold text-slate-600 shadow-[0_8px_18px_rgba(15,23,42,0.08)] transition"
      title={`${label}: ${value}`}
    >
      <Icon
        size={14}
        strokeWidth={2.2}
        className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${iconClassName}`}
        aria-hidden
      />
      <span className="truncate">{value}</span>
    </span>
  );
}

function OwnerWorkspaceHeader({
  eventId,
  title,
  dateLine,
  timeLine,
  locationLine,
  previewHref,
  editHref,
  detailsEditHref,
  onPreview,
  onShare,
}: {
  eventId: string;
  title: string;
  dateLine: string;
  timeLine: string;
  locationLine: string;
  previewHref: string;
  editHref: string;
  detailsEditHref: string | null;
  onPreview: () => void;
  onShare: () => void;
}) {
  const actionButtonClassName =
    "h-10 w-10 items-center justify-center gap-0 rounded-full px-0 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 sm:w-auto sm:gap-1.5 sm:px-3";
  const deleteButtonClassName =
    "inline-flex h-10 w-10 items-center justify-center gap-0 rounded-full px-0 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 sm:w-auto sm:gap-1.5 sm:px-3";

  return (
    <header className="owner-workspace-glass owner-workspace-summary-card relative overflow-hidden rounded-[24px] border border-white/75 bg-white/92 p-4 shadow-[0_16px_46px_rgba(79,70,128,0.10)] backdrop-blur-xl sm:p-5 lg:rounded-[28px]">
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[0.66rem] font-black uppercase tracking-[0.16em] text-[#786bd6]">
            Owner workspace
          </p>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {!detailsEditHref ? (
              <Link
                href={editHref}
                aria-label="Edit"
                title="Edit"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-violet-700 transition hover:text-violet-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200"
              >
                <Pencil size={20} strokeWidth={2.2} aria-hidden="true" />
              </Link>
            ) : null}
            <EventDeleteModal
              eventId={eventId}
              eventTitle={title}
              buttonClassName={deleteButtonClassName}
              labelClassName="hidden sm:inline"
            />
            <button
              type="button"
              onClick={onShare}
              aria-label="Share"
              title="Share"
              className="inline-flex h-10 w-10 items-center justify-center gap-0 rounded-full px-0 text-sm font-semibold text-slate-950 transition hover:bg-violet-50 hover:text-[#786bd6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 sm:w-auto sm:gap-1.5 sm:px-3"
            >
              <Share2 size={21} strokeWidth={2.3} aria-hidden="true" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              type="button"
              onClick={onPreview}
              aria-label="Preview"
              title="Preview"
              className={`inline-flex ${actionButtonClassName} lg:hidden`}
            >
              <ExternalLink size={20} strokeWidth={2.2} aria-hidden="true" />
              <span className="hidden sm:inline">Preview</span>
            </button>
            <Link
              href={previewHref}
              aria-label="Preview"
              title="Preview"
              className={`hidden ${actionButtonClassName} lg:inline-flex`}
            >
              <ExternalLink size={20} strokeWidth={2.2} aria-hidden="true" />
              <span className="hidden sm:inline">Preview</span>
            </Link>
          </div>
        </div>
        <div className="min-w-0">
          <h2 className="line-clamp-2 text-[1.65rem] font-semibold leading-tight text-slate-950 sm:text-3xl">
            {title || "Untitled event"}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
            <OwnerDetailChip
              icon={CalendarDays}
              iconClassName="text-[#6366f1]"
              label="Date"
              value={dateLine || "Date pending"}
            />
            {timeLine ? (
              <OwnerDetailChip
                icon={Clock3}
                iconClassName="text-[#10b981]"
                label="Time"
                value={timeLine}
              />
            ) : null}
            {locationLine ? (
              <OwnerDetailChip
                icon={MapPin}
                iconClassName="text-[#f59e0b]"
                label="Location"
                value={locationLine}
              />
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

function OwnerPublicLinkPanel({
  eventId,
  activeTab,
  publicSlug,
  publicUrl,
  onUpdated,
}: {
  eventId: string;
  activeTab: EventContextTab;
  publicSlug: string;
  publicUrl: string;
  onUpdated: (nextPath: string) => void;
}) {
  const router = useRouter();
  const [slug, setSlug] = useState(publicSlug);
  const [origin, setOrigin] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    setSlug(publicSlug);
    setError("");
    setStatus("idle");
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
    if (!normalizedSlug || normalizedSlug === "event" || !hasChanges) return;
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

      const nextPath = currentPath.startsWith("/card/")
        ? data.cardPath || data.eventPath
        : currentPath.startsWith("/smart-signup-form/")
          ? data.signupFormPath || data.eventPath
          : data.eventPath;
      onUpdated(nextPath || `/event/${normalizedSlug}`);
      window.dispatchEvent(new CustomEvent("history:updated", { detail: { id: eventId } }));
      setStatus("saved");
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
    <section className="owner-workspace-glass relative overflow-hidden rounded-[22px] border border-white/75 bg-white/92 p-3 shadow-[0_14px_38px_rgba(79,70,128,0.09)] backdrop-blur-xl sm:p-4">
      <form className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]" onSubmit={handleSubmit}>
        <div className="flex items-center gap-2 text-[0.66rem] font-black uppercase tracking-[0.16em] text-[#786bd6]">
          <Link2 size={16} aria-hidden="true" />
          Public link
        </div>
        <label className="min-w-0">
          <span className="sr-only">Public link slug</span>
          <div className="flex min-h-11 min-w-0 items-center overflow-hidden rounded-2xl border border-violet-900/20 bg-white/68 text-sm font-semibold text-slate-950 shadow-[inset_0_1px_3px_rgba(76,29,149,0.16)]">
            <span className="hidden shrink-0 pl-3 pr-1 text-slate-400 sm:inline">
              {origin || "https://envitefy.com"}/{publicPathPrefix}/
            </span>
            <input
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              className="min-w-0 flex-1 bg-transparent px-3 py-2 outline-none sm:px-1"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
        </label>
        <button
          type="submit"
          disabled={!hasChanges || status === "saving" || !normalizedSlug}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(15,23,42,0.14)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {status === "saving" ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            <Save size={16} aria-hidden="true" />
          )}
          {status === "saving" ? "Saving" : "Save link"}
        </button>
      </form>
      {status === "saved" || error ? (
        <p
          className={`mt-2 inline-flex items-start gap-2 text-sm font-semibold ${
            error ? "text-rose-700" : "text-emerald-700"
          }`}
          role={error ? "alert" : undefined}
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

function OwnerTabContent({
  activeTab,
  eventId,
  eventTitle,
  eventData,
  numberOfGuests,
  rsvpEnabled,
  editHref,
  preview,
  onDesignUpdated,
}: {
  activeTab: EventContextTab;
  eventId: string;
  eventTitle: string;
  eventData: Record<string, unknown> | null;
  numberOfGuests: number;
  rsvpEnabled: boolean;
  editHref: string;
  preview: ProductPreviewModel;
  onDesignUpdated: (next: {
    title?: string;
    preview: Partial<ProductPreviewModel> | null;
    persisted?: boolean;
  }) => void;
}) {
  if (!rsvpEnabled || activeTab === "design") {
    return (
      <OwnerDesignPanel
        eventId={eventId}
        eventTitle={eventTitle}
        eventData={eventData}
        preview={preview}
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

function MobileOwnerPreviewDrawer({
  open,
  eventTitle,
  preview,
  publicUrl,
  onClose,
}: {
  open: boolean;
  eventTitle: string;
  preview: ProductPreviewModel;
  publicUrl: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  return (
    <div
      className={`fixed inset-0 z-[7000] lg:hidden ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-slate-950/20 transition-opacity duration-300 motion-reduce:transition-none ${
          open ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Close preview"
        onClick={onClose}
        tabIndex={open ? 0 : -1}
      />
      <section
        className={`owner-workspace-glass absolute inset-y-0 right-0 flex w-full flex-col bg-white/95 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+1rem)] shadow-[-28px_0_70px_rgba(15,23,42,0.22)] backdrop-blur-xl transition-transform duration-300 ease-out motion-reduce:transition-none ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Preview"
      >
        <div className="flex h-12 shrink-0 items-center justify-start">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back to dashboard"
            title="Back to dashboard"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-bold text-slate-700 transition hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
          >
            <ArrowLeft size={20} strokeWidth={2.4} aria-hidden="true" />
            <span>Dashboard</span>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <div className="flex min-h-full items-center justify-center">
            <EventProductPreview
              eventTitle={eventTitle}
              preview={preview}
              publicUrl={publicUrl}
              className="mx-auto w-full max-w-[430px]"
              heightMode="auto"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function OwnerDesignPanel({
  eventId,
  eventTitle,
  eventData,
  preview,
  detailsEditHref,
  onDesignUpdated,
}: {
  eventId: string;
  eventTitle: string;
  eventData: Record<string, unknown> | null;
  preview: ProductPreviewModel;
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
  const isBusy = status === "previewing" || status === "saving";
  const hasDesignChanges = !designFormsMatch(form, baselineForm);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentImageUrl || isBusy) return;

    if (!hasDesignChanges) {
      setError("No design changes requested.");
      return;
    }

    const fields = buildDesignEditFields(form);
    setStatus("previewing");
    setError("");

    try {
      const response = await fetch(`/api/events/${encodeURIComponent(eventId)}/card/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "preview",
          fields,
        }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(readString(json?.error) || "The card could not be updated.");
      }

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
    if (!candidate || isBusy) return;

    setStatus("saving");
    setError("");

    try {
      const response = await fetch(`/api/events/${encodeURIComponent(eventId)}/card/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "save",
          fields: candidate.fields,
          imageDataUrl: candidate.imageDataUrl,
        }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(readString(json?.error) || "The card changes could not be saved.");
      }

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
    <section className="owner-workspace-glass relative overflow-hidden rounded-[28px] border border-white/75 bg-white/92 p-4 shadow-[0_20px_58px_rgba(79,70,128,0.10)] backdrop-blur-xl sm:p-5">
      <div className="grid gap-5">
        <form className="min-w-0 space-y-4" onSubmit={handleSubmit}>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
              <Palette size={20} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[0.66rem] font-black uppercase tracking-[0.16em] text-[#786bd6]">
                Design
              </p>
              <h3 className="text-2xl font-semibold text-slate-950">Edit card</h3>
            </div>
          </div>

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
            <label className="col-span-2 block text-xs font-black uppercase tracking-[0.13em] text-slate-500 md:col-span-3">
              Title
              <input
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                className="mt-2 min-h-11 w-full rounded-2xl border border-violet-900/20 bg-white/62 px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 shadow-[inset_0_1px_3px_rgba(76,29,149,0.20)] outline-none backdrop-blur-md transition focus:border-violet-500/40 focus:bg-white/80 focus:ring-4 focus:ring-violet-200/60"
              />
            </label>

            <label className="col-span-2 block text-xs font-black uppercase tracking-[0.13em] text-slate-500 md:col-span-1">
              Date
              <input
                type="date"
                value={form.eventDate}
                onChange={(event) => updateField("eventDate", event.target.value)}
                className="mt-2 min-h-11 w-full rounded-2xl border border-violet-900/20 bg-white/62 px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 shadow-[inset_0_1px_3px_rgba(76,29,149,0.20)] outline-none backdrop-blur-md transition focus:border-violet-500/40 focus:bg-white/80 focus:ring-4 focus:ring-violet-200/60"
              />
            </label>

            <label className="block min-w-0 text-xs font-black uppercase tracking-[0.13em] text-slate-500">
              Start time
              <input
                type="time"
                value={form.startTime}
                onChange={(event) => updateField("startTime", event.target.value)}
                className="mt-2 min-h-11 w-full rounded-2xl border border-violet-900/20 bg-white/62 px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 shadow-[inset_0_1px_3px_rgba(76,29,149,0.20)] outline-none backdrop-blur-md transition focus:border-violet-500/40 focus:bg-white/80 focus:ring-4 focus:ring-violet-200/60"
              />
            </label>

            <label className="block min-w-0 text-xs font-black uppercase tracking-[0.13em] text-slate-500">
              End time
              <input
                type="time"
                value={form.endTime}
                onChange={(event) => updateField("endTime", event.target.value)}
                className="mt-2 min-h-11 w-full rounded-2xl border border-violet-900/20 bg-white/62 px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 shadow-[inset_0_1px_3px_rgba(76,29,149,0.20)] outline-none backdrop-blur-md transition focus:border-violet-500/40 focus:bg-white/80 focus:ring-4 focus:ring-violet-200/60"
              />
            </label>

            <label className="col-span-2 block text-xs font-black uppercase tracking-[0.13em] text-slate-500 md:col-span-1">
              Venue
              <input
                value={form.venueName}
                onChange={(event) => updateField("venueName", event.target.value)}
                className="mt-2 min-h-11 w-full rounded-2xl border border-violet-900/20 bg-white/62 px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 shadow-[inset_0_1px_3px_rgba(76,29,149,0.20)] outline-none backdrop-blur-md transition focus:border-violet-500/40 focus:bg-white/80 focus:ring-4 focus:ring-violet-200/60"
              />
            </label>

            <label className="col-span-2 block text-xs font-black uppercase tracking-[0.13em] text-slate-500 md:col-span-2">
              Address
              <input
                value={form.location}
                onChange={(event) => updateField("location", event.target.value)}
                className="mt-2 min-h-11 w-full rounded-2xl border border-violet-900/20 bg-white/62 px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 shadow-[inset_0_1px_3px_rgba(76,29,149,0.20)] outline-none backdrop-blur-md transition focus:border-violet-500/40 focus:bg-white/80 focus:ring-4 focus:ring-violet-200/60"
              />
            </label>

            <label className="col-span-2 block text-xs font-black uppercase tracking-[0.13em] text-slate-500 md:col-span-3">
              Enter your change
              <input
                value={form.designIdea}
                onChange={(event) => updateField("designIdea", event.target.value)}
                placeholder='e.g. Change the bottom sentence to "Join us to celebrate Lara turning 7."'
                className="mt-2 min-h-11 w-full rounded-2xl border border-violet-900/20 bg-white/62 px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 shadow-[inset_0_1px_3px_rgba(76,29,149,0.20)] outline-none backdrop-blur-md transition focus:border-violet-500/40 focus:bg-white/80 focus:ring-4 focus:ring-violet-200/60"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:justify-end">
            {status === "ready" ? (
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
                <CheckCircle2 size={16} aria-hidden="true" />
                Preview ready
              </p>
            ) : null}
            {status === "saved" ? (
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <CheckCircle2 size={16} aria-hidden="true" />
                Changes saved
              </p>
            ) : null}
            <button
              type="submit"
              disabled={!currentImageUrl || isBusy || !hasDesignChanges}
              className="inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-bold text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 sm:px-5"
            >
              {status === "previewing" ? (
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              ) : (
                <WandSparkles size={16} aria-hidden="true" />
              )}
              {status === "previewing" ? "Previewing" : "Preview"}
            </button>
            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={!candidate || isBusy}
              className="inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-2xl bg-violet-700 px-4 text-sm font-bold text-white shadow-[0_14px_30px_rgba(109,40,217,0.18)] transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:bg-slate-300 sm:px-5"
            >
              {status === "saving" ? (
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              ) : (
                <Save size={16} aria-hidden="true" />
              )}
              {status === "saving" ? "Saving" : "Save"}
            </button>
          </div>

          {error ? (
            <p
              role="alert"
              className="inline-flex w-full items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
