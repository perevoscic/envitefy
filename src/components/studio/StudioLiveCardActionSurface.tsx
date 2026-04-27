"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { PanInfo } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  Gift,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Share2,
  X,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import { supportsStudioCategoryRsvp } from "@/app/studio/studio-workspace-field-config";
import { CalendarIconApple, CalendarIconGoogle, CalendarIconOutlook } from "@/components/CalendarIcons";
import { buildLiveCardDetailsWelcomeMessage } from "@/lib/live-card-event-details";
import {
  buildLiveCardDirectionsHref,
  buildLiveCardLocationActions,
} from "@/lib/live-card-locations";
import { getLiveCardRailLayout } from "@/lib/live-card-rail-layout";
import {
  buildLiveCardRsvpOutboundHref,
  LIVE_CARD_RSVP_CHOICES,
  parseLiveCardRsvpContact,
  shouldShowLiveCardDescriptionSection,
} from "@/lib/live-card-rsvp";
import { buildCalendarLinks } from "@/utils/calendar-links";
import { openAppleCalendarIcs } from "@/utils/calendar-open";
import { formatTimeLabelEn, formatWeekdayMonthDayOrdinalEn } from "@/utils/format-month-day-ordinal";
import { isRsvpMailtoHref, openRsvpMailtoHref } from "@/utils/rsvp-mailto";

export type LiveCardActiveTab =
  | "none"
  | "location"
  | "calendar"
  | "registry"
  | "share"
  | "details"
  | "rsvp";

export type LiveCardButtonKey = Exclude<LiveCardActiveTab, "none">;

export type LiveCardButtonPosition = {
  x: number;
  y: number;
};

export type LiveCardButtonPositions = Partial<Record<LiveCardButtonKey, LiveCardButtonPosition>>;

export type LiveCardEventDetails = {
  category?: string;
  occasion?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  venueName?: string;
  location?: string;
  rsvpName?: string;
  rsvpContact?: string;
  rsvpDeadline?: string;
  detailsDescription?: string;
  guestImageUrls?: string[];
  message?: string;
  registryLink?: string;
  [key: string]: unknown;
};

export type LiveCardInvitationData = {
  title?: string;
  subtitle?: string;
  description?: string;
  scheduleLine?: string;
  locationLine?: string;
  heroTextMode?: "image" | "overlay";
  theme?: {
    themeStyle?: string;
  };
  interactiveMetadata?: {
    rsvpMessage?: string;
    ctaLabel?: string;
    shareNote?: string;
  };
  eventDetails?: LiveCardEventDetails | null;
};

type LiveCardShareState = "idle" | "pending" | "success";

type StudioLiveCardActionSurfaceProps = {
  title: string;
  invitationData?: LiveCardInvitationData | null;
  activeTab: LiveCardActiveTab;
  onActiveTabChange: (tab: LiveCardActiveTab) => void;
  positions?: LiveCardButtonPositions | null;
  shareUrl?: string | null;
  fallbackShareUrlToWindowLocation?: boolean;
  onShare?: () => void;
  shareState?: LiveCardShareState;
  isDesignMode?: boolean;
  showcaseMode?: boolean;
  buttonChromeSize?: "default" | "compact";
  onDragEnd?: (key: LiveCardButtonKey, position: LiveCardButtonPosition) => void;
  showExtendedDetails?: boolean;
  registryHelperText?: string | null;
};

const EMPTY_POSITIONS: Record<LiveCardButtonKey, LiveCardButtonPosition> = {
  rsvp: { x: 0, y: 0 },
  location: { x: 0, y: 0 },
  share: { x: 0, y: 0 },
  calendar: { x: 0, y: 0 },
  registry: { x: 0, y: 0 },
  details: { x: 0, y: 0 },
};

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeComparableText(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function formatDate(dateStr: string) {
  if (!dateStr || !dateStr.includes("-")) return dateStr;
  const [year, month, day] = dateStr.split("-");
  return `${month}.${day}.${year}`;
}

function formatCalendarSummary(dateStr: string, timeStr: string) {
  const dateLabel = formatWeekdayMonthDayOrdinalEn(dateStr);
  if (!dateLabel) return "";
  const timeLabel = formatTimeLabelEn(timeStr);
  return timeLabel ? `${dateLabel} at ${timeLabel}` : dateLabel;
}

function getRegistryText(details: LiveCardEventDetails | null | undefined) {
  const link = normalizeLiveCardExternalHref(details?.registryLink);
  if (!link) return "Registry details will be shared by the host.";
  try {
    const url = new URL(link);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return link;
  }
}

function normalizeLiveCardExternalHref(value: unknown): string | null {
  const raw = readString(value);
  if (!raw) return null;
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw.replace(/^\/+/, "")}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:") return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function getRegistryActionLabel(details: LiveCardEventDetails | null | undefined) {
  const normalized = readString(details?.category).toLowerCase();
  return normalized === "birthday" || normalized === "birthdays" || normalized === "housewarming"
    ? "Gift List"
    : "Registry";
}

function getRegistryPanelTitle(details: LiveCardEventDetails | null | undefined) {
  return getRegistryActionLabel(details) === "Gift List" ? "Gift List" : "Gift Registry";
}

function resolveLiveCardCalendarMeta(invitationData?: LiveCardInvitationData | null): {
  startIso: string;
  endIso: string;
  location: string;
  description: string;
} | null {
  const details = invitationData?.eventDetails;
  const eventDate = readString(details?.eventDate);
  if (!eventDate) return null;

  let start = readString(details?.startTime)
    ? new Date(`${eventDate}T${readString(details?.startTime)}`)
    : new Date(`${eventDate}T14:00`);

  if (Number.isNaN(start.getTime())) {
    start = new Date(eventDate);
  }
  if (Number.isNaN(start.getTime())) return null;

  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const location = readString(details?.location) || readString(details?.venueName);
  const description =
    readString(invitationData?.description) || readString(details?.detailsDescription);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    location,
    description,
  };
}

function buildLiveCardCalendarLinks(title: string, invitationData?: LiveCardInvitationData | null) {
  const calendarMeta = resolveLiveCardCalendarMeta(invitationData);
  if (!calendarMeta) return null;
  return buildCalendarLinks({
    title: title || "Event",
    description: calendarMeta.description,
    location: calendarMeta.location,
    startIso: calendarMeta.startIso,
    endIso: calendarMeta.endIso,
    allDay: false,
    reminders: null,
    recurrence: null,
  });
}

function openDefaultCalendarApp(href: string) {
  if (typeof window === "undefined" || !href) return;

  const absoluteHref = /^https?:\/\//i.test(href) ? href : new URL(href, window.location.origin).href;
  const webcalHref = absoluteHref.replace(/^https?:\/\//i, "webcal://");
  let settled = false;

  const cleanup = () => {
    settled = true;
    window.clearTimeout(timer);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      cleanup();
    }
  };
  const timer = window.setTimeout(() => {
    if (settled) return;
    cleanup();
    openAppleCalendarIcs(absoluteHref);
  }, 700);

  document.addEventListener("visibilitychange", onVisibilityChange);

  try {
    window.location.href = webcalHref;
  } catch {
    cleanup();
    openAppleCalendarIcs(absoluteHref);
  }
}

function accentClassForRsvpChoice(choice: "yes" | "no" | "maybe") {
  if (choice === "yes") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (choice === "no") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

export function isPosterFirstHeroCard(invitationData?: LiveCardInvitationData | null) {
  if (invitationData?.heroTextMode !== "image") return false;
  const blob = [
    readString(invitationData?.eventDetails?.category),
    readString(invitationData?.eventDetails?.occasion),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return (
    /\bbirthday\b/.test(blob) ||
    /\bwedding|weddings|bridal|ceremony|reception|save the date|engagement\b/.test(blob)
  );
}

function renderExtraDetailFields(details: LiveCardEventDetails | null | undefined) {
  if (!details) return null;
  const entries = Object.entries(details).filter(([key, value]) => {
    if (!value || typeof value === "boolean") return false;
    if (Array.isArray(value)) return false;
    return ![
      "category",
      "name",
      "age",
      "detailsDescription",
      "guestImageUrls",
      "coupleNames",
      "eventDate",
      "startTime",
      "endTime",
      "location",
      "venueName",
      "rsvpName",
      "rsvpContact",
      "rsvpDeadline",
      "registryLink",
      "message",
      "specialInstructions",
      "orientation",
      "colors",
      "style",
      "visualPreferences",
      "sourceMediaMode",
      "sourceFlyerUrl",
      "sourceFlyerName",
      "sourceFlyerPreviewUrl",
      "subjectTransformMode",
      "likenessStrength",
      "visualStyleMode",
      "theme",
      "gender",
    ].includes(key);
  });

  if (entries.length === 0 && !readString(details.message)) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-xl border border-neutral-100 bg-neutral-50 p-3">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            {key
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (char) => char.toUpperCase())}
          </p>
          <p className="text-sm text-neutral-900">{String(value)}</p>
        </div>
      ))}
      {readString(details.message) ? (
        <div className="rounded-xl border border-[#e2d5c7] bg-[#f7efe7] p-4 italic">
          <p className="text-xs text-[#8C7B65]">"{readString(details.message)}"</p>
        </div>
      ) : null}
    </div>
  );
}

export default function StudioLiveCardActionSurface(props: StudioLiveCardActionSurfaceProps) {
  const invitationData = props.invitationData || null;
  const details = invitationData?.eventDetails || null;
  const calendarLinks = useMemo(
    () => buildLiveCardCalendarLinks(props.title, invitationData),
    [props.title, invitationData],
  );
  const posterFirstHeroCard = isPosterFirstHeroCard(invitationData);
  const categorySupportsRsvp = supportsStudioCategoryRsvp(readString(details?.category));
  const detailsDescription = readString(details?.detailsDescription);
  const secondaryDescription = readString(invitationData?.description) || readString(details?.message);
  const shouldRenderSecondaryDescription =
    shouldShowLiveCardDescriptionSection(readString(details?.message)) &&
    !!secondaryDescription &&
    normalizeComparableText(secondaryDescription) !== normalizeComparableText(detailsDescription);
  const rsvpContact = readString(details?.rsvpContact);
  const rsvpParsed = parseLiveCardRsvpContact(rsvpContact);
  const registryHref = normalizeLiveCardExternalHref(details?.registryLink);
  const registryActionLabel = getRegistryActionLabel(details);
  const registryPanelTitle = getRegistryPanelTitle(details);
  const locationActions = useMemo(() => buildLiveCardLocationActions(details), [details]);
  const primaryLocationAction = locationActions[0] || null;
  const effectiveShareUrl =
    readString(props.shareUrl) ||
    (props.fallbackShareUrlToWindowLocation && typeof window !== "undefined"
      ? window.location.href
      : "");
  const shareState = props.shareState || "idle";
  const detailsWelcome = useMemo(
    () => buildLiveCardDetailsWelcomeMessage(details ?? undefined, props.title),
    [details, props.title],
  );

  useEffect(() => {
    if (props.activeTab === "none" || props.activeTab === "share") return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (
        target.closest("[data-live-card-panel]") ||
        target.closest("[data-live-card-trigger]")
      ) {
        return;
      }
      props.onActiveTabChange("none");
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [props.activeTab, props.onActiveTabChange]);

  useEffect(() => {
    if (!categorySupportsRsvp && props.activeTab === "rsvp") {
      props.onActiveTabChange("none");
    }
  }, [categorySupportsRsvp, props.activeTab, props.onActiveTabChange]);

  const rsvpOutboundHint =
    rsvpParsed.kind === "email"
      ? "Tap a response to open your email with a draft message."
      : rsvpParsed.kind === "sms"
        ? "Tap a response to open your messages app with a draft text."
        : "Add a phone number or email as the RSVP contact to send a reply from here.";

  const buttonConfigs = useMemo(
    () =>
      [
        {
          key: "rsvp" as const,
          label: "RSVP",
          icon: MessageSquare,
          visible:
            categorySupportsRsvp &&
            Boolean(readString(details?.rsvpName) || readString(details?.rsvpContact)),
          onClick: () =>
            props.onActiveTabChange(props.activeTab === "rsvp" ? "none" : "rsvp"),
        },
        {
          key: "details" as const,
          label: "Overview",
          icon: ClipboardList,
          visible: Boolean(invitationData),
          onClick: () =>
            props.onActiveTabChange(props.activeTab === "details" ? "none" : "details"),
        },
        {
          key: "location" as const,
          label: "Location",
          icon: MapPin,
          visible: locationActions.length > 0,
          onClick: () =>
            props.onActiveTabChange(props.activeTab === "location" ? "none" : "location"),
        },
        {
          key: "calendar" as const,
          label: "Calendar",
          icon: CalendarDays,
          visible: Boolean(readString(details?.eventDate)),
          onClick: () =>
            props.onActiveTabChange(props.activeTab === "calendar" ? "none" : "calendar"),
        },
        {
          key: "registry" as const,
          label: registryActionLabel,
          icon: Gift,
          visible: Boolean(registryHref),
          onClick: () =>
            props.onActiveTabChange(props.activeTab === "registry" ? "none" : "registry"),
        },
      ].filter((button) => button.visible),
    [
      props.activeTab,
      props.onActiveTabChange,
      categorySupportsRsvp,
      details,
      invitationData,
      locationActions.length,
      registryActionLabel,
      registryHref,
    ],
  );

  const isActionRailClosed = props.activeTab === "none";
  const shouldHideClosedRailLabels = props.showcaseMode;
  const useExpandedActionButtons = !props.showcaseMode;
  const useCompactActionButtons = props.buttonChromeSize === "compact";
  const showcaseRailLayout = getLiveCardRailLayout({
    showcaseMode: props.showcaseMode,
    isClosed: isActionRailClosed,
    buttonCount: buttonConfigs.length,
  });
  const actionRailWrapperClassName =
    showcaseRailLayout === "cluster" ? "flex w-full justify-center px-2" : "w-full";
  const actionRailClassName =
    showcaseRailLayout === "cluster"
      ? "grid w-fit max-w-full grid-flow-col auto-cols-max items-stretch justify-center gap-1.5 sm:gap-2"
      : showcaseRailLayout === "spread"
        ? "grid w-full min-w-0 grid-flow-col auto-cols-fr items-stretch justify-items-center gap-0 px-1.5"
        : isActionRailClosed
          ? `grid w-full min-w-0 grid-flow-col auto-cols-fr items-stretch ${
              props.showcaseMode
                ? "gap-2 px-2"
                : useCompactActionButtons
                  ? "gap-1.5 px-2.5"
                  : "gap-3 px-1"
            }`
          : "grid w-full min-w-0 grid-flow-col auto-cols-fr items-stretch gap-1 md:gap-3";
  const ShareActionIcon =
    shareState === "pending" ? Loader2 : shareState === "success" ? CheckCircle2 : Share2;
  const shareActionLabel =
    shareState === "pending" ? "Sharing..." : shareState === "success" ? "Copied!" : "Share";
  const shareActionPressed = shareState === "success";
  const shareActionChromeSizeClassName = useCompactActionButtons
    ? "p-2 md:p-2.5"
    : useExpandedActionButtons
      ? "p-3 md:p-4"
      : props.showcaseMode
        ? "p-2 md:p-2.5"
        : "p-2.5 md:p-3";
  const shareActionChromeClassName = posterFirstHeroCard
    ? shareActionPressed
      ? "translate-y-0.5 border-white/85 bg-white/92 shadow-[0_16px_34px_rgba(0,0,0,0.42),0_0_22px_rgba(255,255,255,0.24),inset_0_1px_0_rgba(255,255,255,0.82)]"
      : "border-white/28 bg-white/18 shadow-[0_12px_28px_rgba(0,0,0,0.34),0_0_16px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.16)] hover:-translate-y-0.5 hover:border-white/42 hover:bg-white/24"
    : shareActionPressed
      ? "translate-y-0.5 border-white/85 bg-white shadow-[0_14px_28px_rgba(0,0,0,0.42),0_0_18px_rgba(255,255,255,0.24),inset_0_1px_0_rgba(255,255,255,0.78),inset_0_-4px_10px_rgba(15,23,42,0.12)]"
      : "border-white/30 bg-black/30 shadow-[0_10px_24px_rgba(0,0,0,0.34),0_0_12px_rgba(255,255,255,0.12),inset_0_1px_0_rgba(255,255,255,0.14)] hover:-translate-y-0.5 hover:border-white/45 hover:bg-white/22";
  const shareActionIconClassName = `${
    useCompactActionButtons
      ? "h-4 w-4 md:h-5 md:w-5"
      : useExpandedActionButtons
        ? "h-6 w-6 md:h-7 md:w-7"
        : props.showcaseMode
          ? "h-4 w-4 md:h-5 md:w-5"
          : "h-5 w-5 md:h-6 md:w-6"
  } ${
    shareState === "pending"
      ? "animate-spin text-white"
      : shareState === "success"
        ? "text-emerald-600"
        : shareActionPressed
          ? "text-neutral-950"
          : "text-white"
  }`;

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col px-0 pb-1 pt-6 sm:px-4 sm:pt-7 md:p-8 md:pb-2">
      {props.onShare ? (
        <button
          type="button"
          onClick={() => {
            if (props.isDesignMode) return;
            props.onActiveTabChange("none");
            props.onShare?.();
          }}
          disabled={shareState === "pending" || props.isDesignMode}
          aria-label={shareActionLabel === "Share" ? "Share live card" : shareActionLabel}
          title={shareActionLabel === "Share" ? "Share" : shareActionLabel}
          className={`pointer-events-auto absolute right-3 top-5 z-30 inline-flex items-center justify-center rounded-full border backdrop-blur-md transition-all duration-200 active:scale-[0.97] disabled:cursor-wait disabled:opacity-75 sm:right-5 sm:top-6 md:right-8 md:top-8 ${shareActionChromeSizeClassName} ${shareActionChromeClassName}`}
        >
          <ShareActionIcon className={shareActionIconClassName} />
        </button>
      ) : null}
      <div className="flex h-full min-h-0 flex-col justify-end">
        <AnimatePresence initial={false}>
          {props.activeTab !== "none" && props.activeTab !== "share" ? (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              data-live-card-panel
              className="pointer-events-auto absolute bottom-32 left-1/2 z-50 w-[calc(100%-1rem)] max-w-[22rem] -translate-x-1/2 rounded-3xl border border-neutral-200 bg-white/90 p-6 shadow-2xl backdrop-blur-2xl sm:w-[calc(100%-2rem)]"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-neutral-100 p-2 text-neutral-900">
                    {props.activeTab === "location" ? <MapPin className="h-5 w-5" /> : null}
                    {props.activeTab === "calendar" ? <CalendarDays className="h-5 w-5" /> : null}
                    {props.activeTab === "registry" ? <Gift className="h-5 w-5" /> : null}
                    {props.activeTab === "rsvp" ? <MessageSquare className="h-5 w-5" /> : null}
                    {props.activeTab === "details" ? <ClipboardList className="h-5 w-5" /> : null}
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-900">
                    {props.activeTab === "location" ? "Event Location" : null}
                    {props.activeTab === "calendar" ? "Add to Calendar" : null}
                    {props.activeTab === "registry" ? "Gift Registry" : null}
                    {props.activeTab === "rsvp" ? "RSVP" : null}
                    {props.activeTab === "details" ? "Overview" : null}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => props.onActiveTabChange("none")}
                  className="rounded-full p-1 text-neutral-500 hover:bg-neutral-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                {props.activeTab === "rsvp" ? (
                  <div className="flex flex-col space-y-4">
                    <div className="space-y-3 rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
                      <p className="text-sm font-medium text-neutral-900">
                        {readString(details?.rsvpName) || "Host"}
                      </p>
                      {readString(details?.rsvpContact) ? (
                        <div>
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                            RSVP contact
                          </p>
                          <p className="inline-flex items-center gap-2 text-sm text-neutral-800">
                            {rsvpParsed.kind === "email" ? (
                              <Mail className="h-4 w-4 shrink-0 text-neutral-500" />
                            ) : rsvpParsed.kind === "sms" ? (
                              <Phone className="h-4 w-4 shrink-0 text-neutral-500" />
                            ) : null}
                            {readString(details?.rsvpContact)}
                          </p>
                        </div>
                      ) : null}
                      {readString(details?.rsvpDeadline) ? (
                        <div>
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                            RSVP deadline
                          </p>
                          <p className="text-sm text-red-600">
                            {formatDate(readString(details?.rsvpDeadline))}
                          </p>
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-auto grid grid-cols-3 gap-2 border-t border-neutral-100 pt-4">
                      {LIVE_CARD_RSVP_CHOICES.map((choice) => {
                        const href = buildLiveCardRsvpOutboundHref({
                          rsvpContact,
                          eventTitle: props.title,
                          responseLabel: choice.label,
                          responseKey: choice.key,
                          shareUrl: effectiveShareUrl,
                          category: readString(details?.category),
                          hostName: readString(details?.rsvpName),
                        });
                        const accent = accentClassForRsvpChoice(choice.key);
                        if (!href) {
                          return (
                            <button
                              key={choice.key}
                              type="button"
                              disabled
                              aria-disabled="true"
                              title={rsvpOutboundHint}
                              className={`flex cursor-not-allowed items-center justify-center rounded-xl border px-3 py-3 text-xs font-bold uppercase tracking-[0.18em] opacity-45 ${accent}`}
                            >
                              {choice.label}
                            </button>
                          );
                        }
                        if (isRsvpMailtoHref(href)) {
                          return (
                            <button
                              key={choice.key}
                              type="button"
                              onClick={() => openRsvpMailtoHref(href)}
                              className={`flex items-center justify-center rounded-xl border px-3 py-3 text-xs font-bold uppercase tracking-[0.18em] transition hover:-translate-y-0.5 ${accent}`}
                            >
                              {choice.label}
                            </button>
                          );
                        }
                        return (
                          <a
                            key={choice.key}
                            href={href}
                            className={`flex items-center justify-center rounded-xl border px-3 py-3 text-xs font-bold uppercase tracking-[0.18em] transition hover:-translate-y-0.5 ${accent}`}
                          >
                            {choice.label}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {props.activeTab === "details" ? (
                  <div className="max-h-[300px] space-y-4 overflow-y-auto pr-2">
                    {detailsWelcome ? (
                      <div className="rounded-2xl border border-purple-200/80 bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#8C7B65]">
                          Welcome
                        </p>
                        <p className="mt-2 text-sm font-medium leading-relaxed text-neutral-900">
                          {detailsWelcome}
                        </p>
                      </div>
                    ) : null}
                    {detailsDescription ? (
                      <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                          {props.showExtendedDetails ? "Description" : "Event details"}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-900">
                          {detailsDescription}
                        </p>
                      </div>
                    ) : null}
                    {shouldRenderSecondaryDescription ? (
                      <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                          Description
                        </p>
                        <p className="mt-1 text-sm text-neutral-900">{secondaryDescription}</p>
                      </div>
                    ) : null}
                    {props.showExtendedDetails ? renderExtraDetailFields(details) : null}
                  </div>
                ) : null}

                {props.activeTab === "location" ? (
                  locationActions.length > 1 ? (
                    <div className="space-y-3">
                      {locationActions.map((locationAction) => (
                        <div
                          key={locationAction.id}
                          className="rounded-xl border border-neutral-200 bg-white/85 p-3 text-left shadow-sm"
                        >
                          <p className="text-sm font-semibold text-neutral-900">
                            {locationAction.label}
                          </p>
                          <div className="mt-3 flex justify-start">
                            <button
                              type="button"
                              onClick={() =>
                                window.open(
                                  buildLiveCardDirectionsHref(locationAction.mapQuery),
                                  "_blank",
                                  "noopener,noreferrer",
                                )
                              }
                              className="inline-flex w-auto items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white"
                              aria-label={`Get directions to ${locationAction.label}`}
                            >
                              <ExternalLink className="h-3 w-3" />
                              Get Directions
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : primaryLocationAction ? (
                    <>
                      <p className="text-sm font-medium text-neutral-900">
                        {primaryLocationAction.label}
                      </p>
                      <div className="mt-4 flex justify-center">
                        <button
                          type="button"
                          onClick={() =>
                            window.open(
                              buildLiveCardDirectionsHref(primaryLocationAction.mapQuery),
                              "_blank",
                              "noopener,noreferrer",
                            )
                          }
                          className="inline-flex w-auto items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Get Directions
                        </button>
                      </div>
                    </>
                  ) : null
                ) : null}

                {props.activeTab === "calendar" ? (
                  <>
                    <p className="text-sm font-medium text-neutral-900">Save the Date</p>
                    <p className="text-xs text-neutral-500">
                      {readString(details?.eventDate)
                        ? formatCalendarSummary(
                            readString(details?.eventDate),
                            readString(details?.startTime),
                          )
                        : "Date TBD"}
                    </p>
                    {calendarLinks ? (
                      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => openDefaultCalendarApp(calendarLinks.appleInline)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-sm transition hover:border-neutral-400 hover:bg-neutral-50"
                          aria-label="Open in Apple Calendar"
                          title="Apple Calendar"
                        >
                          <CalendarIconApple className="h-4 w-4" />
                        </button>
                        <a
                          href={calendarLinks.google}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-sm transition hover:border-neutral-400 hover:bg-neutral-50"
                          aria-label="Open in Google Calendar"
                          title="Google Calendar"
                        >
                          <CalendarIconGoogle className="h-4 w-4" />
                        </a>
                        <a
                          href={calendarLinks.outlook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-sm transition hover:border-neutral-400 hover:bg-neutral-50"
                          aria-label="Open in Outlook Calendar"
                          title="Outlook Calendar"
                        >
                          <CalendarIconOutlook className="h-4 w-4" />
                        </a>
                      </div>
                    ) : null}
                  </>
                ) : null}

                {props.activeTab === "registry" ? (
                  <>
                    <p className="text-sm font-medium text-neutral-900">{registryPanelTitle}</p>
                    <p className="text-xs text-neutral-500">{getRegistryText(details)}</p>
                    {readString(props.registryHelperText) ? (
                      <p className="text-xs text-neutral-500">{readString(props.registryHelperText)}</p>
                    ) : null}
                    {registryHref ? (
                      <button
                        type="button"
                        onClick={() => window.open(registryHref, "_blank", "noopener,noreferrer")}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-pink-600 py-2 text-xs font-bold text-white"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Visit {registryActionLabel}
                      </button>
                    ) : null}
                  </>
                ) : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div
          className={`pointer-events-none shrink-0 ${
            posterFirstHeroCard
              ? "max-md:min-h-[min(14svh,4rem)] min-h-[min(8svh,2.4rem)] md:min-h-[min(6svh,2rem)]"
              : "max-md:min-h-[min(18svh,5.5rem)] min-h-[min(10svh,3rem)] md:min-h-[min(8svh,2.5rem)]"
          }`}
          aria-hidden
        />

        <div
          className={`pointer-events-none z-20 w-full min-w-0 ${
            posterFirstHeroCard
              ? "pb-[max(0.45rem,calc(env(safe-area-inset-bottom)+0.2rem))] max-md:pb-[max(0.3rem,calc(env(safe-area-inset-bottom)+0.12rem))]"
              : "pb-[max(0.35rem,calc(env(safe-area-inset-bottom)+0.15rem))]"
          }`}
        >
          <div
            className={actionRailWrapperClassName}
            data-live-card-rail-layout={showcaseRailLayout}
          >
            <div className={actionRailClassName}>
              {buttonConfigs.map((button) => {
                const Icon = button.icon;
                const position = props.positions?.[button.key] || EMPTY_POSITIONS[button.key];
                const isPressed =
                  button.key === "share"
                    ? shareState === "success"
                    : props.activeTab === button.key;
                const isPending = button.key === "share" && shareState === "pending";
                return (
                  <motion.div
                    key={button.key}
                    drag={Boolean(props.onDragEnd) && props.isDesignMode}
                    dragMomentum={false}
                    onDragEnd={(_, info: PanInfo) =>
                      props.onDragEnd?.(button.key, {
                        x: position.x + info.offset.x,
                        y: position.y + info.offset.y,
                      })
                    }
                    style={{ x: position.x, y: position.y }}
                    className={`pointer-events-auto min-w-0 ${isActionRailClosed ? "shrink-0" : "w-full"}`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (!props.isDesignMode) button.onClick();
                      }}
                      disabled={isPending}
                      aria-pressed={button.key === "share" ? undefined : isPressed}
                      data-live-card-trigger
                      className={`group flex min-w-0 flex-col items-center justify-start ${
                        useCompactActionButtons ? "gap-0.5 py-0 md:gap-0.5" : "gap-1 py-1 md:gap-2"
                      } transition-transform duration-150 active:scale-[0.97] ${
                        isActionRailClosed ? "w-auto px-0" : "h-full w-full px-0.5"
                      } ${props.isDesignMode ? "cursor-move" : ""}`}
                    >
                      <div
                        className={`rounded-full border backdrop-blur-md transition-all duration-200 ${
                          useCompactActionButtons
                            ? "p-2 md:p-2.5"
                            : useExpandedActionButtons
                            ? "p-3 md:p-4"
                            : props.showcaseMode
                              ? "p-2 md:p-2.5"
                              : "p-2.5 md:p-3"
                        } ${
                          posterFirstHeroCard
                            ? isPressed
                              ? "translate-y-0.5 border-white/85 bg-white/92 shadow-[0_16px_34px_rgba(0,0,0,0.42),0_0_22px_rgba(255,255,255,0.24),inset_0_1px_0_rgba(255,255,255,0.82)]"
                              : "border-white/28 bg-white/18 shadow-[0_12px_28px_rgba(0,0,0,0.34),0_0_16px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.16)] group-hover:-translate-y-0.5 group-hover:border-white/42 group-hover:bg-white/24"
                            : isPressed
                              ? "translate-y-0.5 border-white/85 bg-white shadow-[0_14px_28px_rgba(0,0,0,0.42),0_0_18px_rgba(255,255,255,0.24),inset_0_1px_0_rgba(255,255,255,0.78),inset_0_-4px_10px_rgba(15,23,42,0.12)]"
                              : "border-white/30 bg-black/30 shadow-[0_10px_24px_rgba(0,0,0,0.34),0_0_12px_rgba(255,255,255,0.12),inset_0_1px_0_rgba(255,255,255,0.14)] group-hover:-translate-y-0.5 group-hover:border-white/45 group-hover:bg-white/22"
                        } ${props.isDesignMode ? "ring-2 ring-[#c9b49a]" : ""}`}
                      >
                        <Icon
                          className={`${
                            useCompactActionButtons
                              ? "h-4 w-4 md:h-5 md:w-5"
                              : useExpandedActionButtons
                              ? "h-6 w-6 md:h-7 md:w-7"
                              : props.showcaseMode
                                ? "h-4 w-4 md:h-5 md:w-5"
                                : "h-5 w-5 md:h-6 md:w-6"
                          } ${
                            isPending
                              ? "animate-spin text-white"
                              : button.key === "share" && shareState === "success"
                                ? "text-emerald-600"
                                : isPressed
                                  ? "text-neutral-950"
                                  : "text-white"
                          }`}
                        />
                      </div>
                      <span
                        className={`max-w-full truncate text-center font-bold uppercase leading-tight tracking-[0.14em] text-white drop-shadow-md ${
                          useCompactActionButtons
                            ? "text-[6px] sm:text-[7px] md:text-[8px]"
                            : "text-[8px] sm:text-[9px] md:text-[10px]"
                        } ${
                          shouldHideClosedRailLabels
                            ? "hidden"
                            : isActionRailClosed
                              ? "inline"
                              : "max-[360px]:hidden"
                        }`}
                      >
                        {button.label}
                      </span>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
