"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  CalendarPlus,
  Clock,
  Globe2,
  Mail,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  EVENT_SKIN_ACTIONS_CLASS,
  EVENT_SKIN_CONTENT_TOP_PADDING_CLASS,
  EVENT_SKIN_FOOTER_CLASS,
  EVENT_SKIN_FOOTER_DIVIDER_CLASS,
  EVENT_SKIN_FOOTER_TEXT_CLASS,
} from "@/components/event-skin-layout";
import OcrFactCards from "@/components/OcrFactCards";
import RsvpIdentityModal from "@/components/RsvpIdentityModal";
import ScannedSkinBackground from "@/components/ScannedSkinBackground";
import { buildPreferredDirectionsHref } from "@/lib/directions";
import { buildLiveCardRsvpOutboundHref } from "@/lib/live-card-rsvp";
import {
  filterRegistryOcrFacts,
  filterRenderedOcrFacts,
  filterRenderedTextValues,
  normalizeOcrFacts,
  type OcrFact,
} from "@/lib/ocr/facts";
import type { OcrSkinBackground } from "@/lib/ocr/skin-background";
import {
  ensureReadableTextColor,
  getLuminance,
  mixHexColors,
  normalizeScannedInvitePalette,
} from "@/lib/scanned-invite-palette";
import { isRsvpMailtoHref, openRsvpMailtoHref } from "@/utils/rsvp-mailto";
import { trackEventInteraction } from "@/utils/event-tracking-client";

type CalendarLinks = {
  google: string;
  outlook: string;
  appleInline: string;
};

type Palette = {
  background?: string;
  primary?: string;
  secondary?: string;
  accent?: string;
  text?: string;
  dominant?: string;
  themeColor?: string;
} | null;

type Props = {
  eventId?: string | null;
  title: string;
  categoryLabel?: string | null;
  backgroundCategory?: string | null;
  dateLabel?: string | null;
  timeLabel?: string | null;
  venueName?: string | null;
  location?: string | null;
  imageUrl?: string | null;
  shareUrl?: string | null;
  calendarLinks?: CalendarLinks | null;
  skinId?: string | null;
  sportKind?: string | null;
  palette?: Palette;
  background?: OcrSkinBackground | null;
  rsvpName?: string | null;
  rsvpPhone?: string | null;
  rsvpEmail?: string | null;
  rsvpUrl?: string | null;
  rsvpSenderName?: string | null;
  rsvpSenderEmail?: string | null;
  detailCopy?: string | null;
  activities?: string[] | null;
  attire?: string | null;
  registryActionLabel?: string | null;
  registryHelperText?: string | null;
  registryName?: string | null;
  registryUrl?: string | null;
  ocrFacts?: OcrFact[] | null;
  detailLayout?: "default" | "wideDetails";
  footerPrefix?: string | null;
  previewMode?: boolean;
  actions?: ReactNode;
};

const DEFAULT_PALETTE = {
  background: "#eaf2ff",
  primary: "#ef476f",
  secondary: "#118ab2",
  accent: "#ff9f1c",
  text: "#101010",
  dominant: "#ef476f",
  themeColor: "#ef476f",
};

function buildMapsHref(location: string | null | undefined): string | null {
  const value = String(location || "").trim();
  if (!value || /^location\s+tbd$/i.test(value)) return null;
  return buildPreferredDirectionsHref(
    value,
    typeof navigator !== "undefined" ? navigator.userAgent : undefined,
  );
}

function buildRsvpHref({
  rsvpUrl,
  rsvpPhone,
  rsvpEmail,
  title,
  shareUrl,
  categoryLabel,
  backgroundCategory,
  dateLabel,
  rsvpName,
  rsvpSenderName,
  rsvpSenderEmail,
}: Pick<
  Props,
  | "rsvpUrl"
  | "rsvpPhone"
  | "rsvpEmail"
  | "title"
  | "shareUrl"
  | "categoryLabel"
  | "backgroundCategory"
  | "dateLabel"
  | "rsvpName"
  | "rsvpSenderName"
  | "rsvpSenderEmail"
>): string | null {
  const url = String(rsvpUrl || "").trim();
  if (url) return url;
  const contact = `${String(rsvpEmail || "").trim()} ${String(rsvpPhone || "").trim()}`.trim();
  const href = buildLiveCardRsvpOutboundHref({
    rsvpContact: contact,
    eventTitle: title,
    responseLabel: "RSVP",
    shareUrl: shareUrl || "",
    category: categoryLabel || backgroundCategory || null,
    hostName: rsvpName,
    senderName: rsvpSenderName,
    senderEmail: rsvpSenderEmail,
    eventDateLabel: dateLabel,
  });
  return href || null;
}

function formatCategoryLabel(value: string | null | undefined) {
  const trimmed = String(value || "").trim();
  return trimmed ? trimmed.replace(/\s+/g, " ") : "Celebration";
}

function usesGiftListCopy(value: string | null | undefined) {
  const normalized = String(value || "").toLowerCase();
  return /\bhouse\s*warming\b|\bhousewarming\b|\bbirthday\b/.test(normalized);
}

function normalizeInlineSentences(value: string): string {
  const withSentenceSpaces = value.replace(/([.!?])(?=[A-Z])/g, "$1 ");
  const seen = new Set<string>();
  const sentences = withSentenceSpaces
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => {
      const key = part
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  return sentences.length ? sentences.join(" ") : withSentenceSpaces.trim();
}

function groupRepeatedOcrFacts(facts: OcrFact[]): OcrFact[] {
  const groups: OcrFact[] = [];
  for (const fact of facts) {
    const label = String(fact.label || "").trim();
    const value = String(fact.value || "").trim();
    if (!label || !value) continue;

    const existing = groups.find((group) => group.label.toLowerCase() === label.toLowerCase());
    if (!existing) {
      groups.push({ label, value });
      continue;
    }

    const values = new Set(
      existing.value
        .split(/\s*(?:;|\n)\s*/)
        .map((item) => item.trim())
        .filter(Boolean),
    );
    for (const item of value.split(/\s*(?:;|\n)\s*/)) {
      const trimmed = item.trim();
      if (trimmed) values.add(trimmed);
    }
    existing.value = Array.from(values).join("; ");
  }
  return groups;
}

function isRedundantPickleballSummary(value: string): boolean {
  const normalized = value.toLowerCase();
  return (
    /\bpickleball\b/.test(normalized) &&
    /\bcheck[-\s]?in\b/.test(normalized) &&
    /\bgames?\s+start(?:ing)?\b/.test(normalized) &&
    /\b(?:saturday|sunday|monday|tuesday|wednesday|thursday|friday)\b/.test(normalized) &&
    /\b(?: at | in )\b/.test(normalized)
  );
}

function extractTimeFromFact(value: string | null | undefined): string {
  const cleaned = String(value || "").trim();
  const match = cleaned.match(/\b\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?|am|pm)\b/i);
  return (match?.[0] || cleaned)
    .replace(/\./g, "")
    .replace(/\b(am|pm)\b/gi, (period) => period.toUpperCase())
    .trim();
}

function splitDisplayTimeRange(value: string): [string, string] | null {
  const match = value.match(/^\s*(.+?)\s*(?:-|–|—|to)\s*(.+?)\s*$/i);
  if (!match?.[1] || !match?.[2]) return null;
  return [extractTimeFromFact(match[1]), extractTimeFromFact(match[2])];
}

function normalizedTextKey(value: string | null | undefined): string {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isRedundantEventSummary(
  value: string,
  context: {
    title: string;
    date: string;
    time: string;
    venue: string;
    location: string;
  },
): boolean {
  const text = normalizedTextKey(value);
  if (!text) return true;
  const venue = normalizedTextKey(context.venue);
  const location = normalizedTextKey(context.location);
  const title = normalizedTextKey(context.title);
  const date = normalizedTextKey(context.date);
  const time = normalizedTextKey(context.time);
  const hasPlace = Boolean(
    (venue && text.includes(venue)) || (location && text.includes(location)),
  );
  const hasSchedule = Boolean(
    (date && text.includes(date)) ||
      (time && text.includes(time)) ||
      /\b(?:from|at|on)\s+\d{1,2}\b/.test(text) ||
      /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/.test(text),
  );
  const hasVisitVerb =
    /\b(?:scheduled|visits?|visiting|will be|coming|come|serving|stops? by)\b/.test(text);
  if (hasPlace && hasSchedule && hasVisitVerb) return true;
  return Boolean(title && text.includes(title) && hasSchedule);
}

function isEntryFeeFact(label: string, value: string): boolean {
  return /\b(?:entry|registration|admission)\s*(?:fee|cost)?\b|\bfee\b|\$\s*\d+/i.test(
    `${label} ${value}`,
  );
}

export default function ScannedInviteSkin({
  eventId,
  title,
  categoryLabel,
  backgroundCategory,
  dateLabel,
  timeLabel,
  venueName,
  location,
  imageUrl,
  shareUrl,
  calendarLinks,
  skinId,
  sportKind,
  palette,
  background,
  rsvpName,
  rsvpPhone,
  rsvpEmail,
  rsvpUrl,
  rsvpSenderName,
  rsvpSenderEmail,
  detailCopy,
  activities,
  attire,
  registryActionLabel,
  registryHelperText,
  registryName,
  registryUrl,
  ocrFacts,
  detailLayout = "default",
  footerPrefix = "Snapped by",
  previewMode = false,
  actions,
}: Props) {
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  const [showRsvpIdentityModal, setShowRsvpIdentityModal] = useState(false);

  const colors = useMemo(
    () => normalizeScannedInvitePalette(palette as any, DEFAULT_PALETTE as any),
    [palette],
  );

  const chipTextColor = ensureReadableTextColor(colors.accent, "#ffffff", { minContrast: 3 });
  const primaryTileTextColor = ensureReadableTextColor(colors.primary, "#ffffff", {
    minContrast: 3,
  });
  const secondaryTileTextColor = ensureReadableTextColor(colors.secondary, "#ffffff", {
    minContrast: 3,
  });
  const pageIsDark = getLuminance(colors.background) < 0.36;
  const neutralSurface = "#ffffff";
  const neutralSurfaceTextColor = ensureReadableTextColor(neutralSurface, colors.text, {
    minContrast: 4.5,
  });
  const neutralSurfaceMutedTextColor =
    mixHexColors(neutralSurfaceTextColor, neutralSurface, 0.38) || neutralSurfaceTextColor;
  const heroTitleColor = ensureReadableTextColor(colors.background, colors.text, {
    minContrast: 4.5,
    darkCandidate: "#2f1f45",
    lightCandidate: "#f8fafc",
  });
  const heroTitleIsLight = getLuminance(heroTitleColor) > 0.72;
  const heroTitleTextShadow = heroTitleIsLight
    ? "0 2px 18px rgba(0,0,0,0.45)"
    : "0 2px 16px rgba(255,255,255,0.72), 0 1px 3px rgba(47,31,69,0.1)";
  const directionsButtonBackground = colors.primary;
  const directionsButtonTextColor = ensureReadableTextColor(directionsButtonBackground, "#ffffff", {
    minContrast: 3,
  });
  const pageShellBackground =
    mixHexColors(colors.background, "#f0f4f8", pageIsDark ? 0.18 : 0.58) || colors.background;
  const sidebarCardBackground =
    mixHexColors(colors.background, "#ffffff", pageIsDark ? 0.08 : 0.72) || "#ffffff";
  const detailCardBackground =
    mixHexColors(colors.background, "#ffffff", pageIsDark ? 0.14 : 0.12) || colors.background;
  const detailCardTextColor = ensureReadableTextColor(detailCardBackground, colors.text, {
    minContrast: 4.5,
  });
  const detailCardMutedTextColor =
    mixHexColors(detailCardTextColor, detailCardBackground, 0.42) || detailCardTextColor;
  const calendarModalButtonBackground = colors.primary;
  const calendarModalButtonTextColor = ensureReadableTextColor(
    calendarModalButtonBackground,
    "#ffffff",
    { minContrast: 3 },
  );
  const detailIconSwatchColor = "var(--theme-primary)";
  const displayTitle = String(title || "").trim() || "Celebration";
  const displayCategoryLabel = formatCategoryLabel(categoryLabel);
  const displayDate = String(dateLabel || "").trim() || "Date TBD";
  const displayTime = String(timeLabel || "").trim();
  const displayVenueName = String(venueName || "").trim();
  const displayLocation = String(location || "").trim();
  const hasDisplayLocation = Boolean(
    displayLocation &&
      !/^location\s+tbd$/i.test(displayLocation) &&
      (!displayVenueName || displayLocation.toLowerCase() !== displayVenueName.toLowerCase()),
  );
  const rawDetailCopy = String(detailCopy || "").trim();
  const isPickleballSkin = String(sportKind || "").toLowerCase() === "pickleball";
  const normalizedOcrFacts = normalizeOcrFacts(ocrFacts);
  const vendorFact = normalizedOcrFacts.find((fact) => /^vendor$/i.test(fact.label));
  const displayVendorName = String(vendorFact?.value || "").trim();
  const checkInFact = normalizedOcrFacts.find((fact) => /\bcheck[-\s]?in\b/i.test(fact.label));
  const gamesStartFact = normalizedOcrFacts.find((fact) =>
    /\bgames?\s+start(?:ing)?\b/i.test(fact.label),
  );
  const entryFeeFact = isPickleballSkin
    ? normalizedOcrFacts.find((fact) => isEntryFeeFact(fact.label, fact.value))
    : undefined;
  const splitTimeRange = splitDisplayTimeRange(displayTime);
  const hasPickleballTimingLanguage =
    isPickleballSkin &&
    (Boolean(checkInFact || gamesStartFact) ||
      (/\bcheck[-\s]?in\b/i.test(rawDetailCopy) &&
        /\bgames?\s+start(?:ing)?\b/i.test(rawDetailCopy)));
  const checkInTime =
    isPickleballSkin && checkInFact
      ? extractTimeFromFact(checkInFact.value)
      : hasPickleballTimingLanguage && splitTimeRange
        ? splitTimeRange[0]
        : "";
  const gamesStartTime =
    isPickleballSkin && gamesStartFact
      ? extractTimeFromFact(gamesStartFact.value)
      : hasPickleballTimingLanguage && splitTimeRange
        ? splitTimeRange[1]
        : "";
  const displayRsvpName = String(rsvpName || "").trim();
  const displayRsvpTitle = displayRsvpName.replace(/^hosted\s+by\s+/i, "").trim() || "Host";
  const contactFactText = normalizedOcrFacts
    .filter((fact) => /\b(?:phone|email|website|site|contact)\b/i.test(fact.label))
    .map((fact) => fact.value)
    .join(" ");
  const contactPhone =
    String(rsvpPhone || "").trim() ||
    contactFactText.match(
      /\b(?:\+?1[-.\s]?)?(?:\(\s*\d{3}\s*\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}\b/,
    )?.[0] ||
    "";
  const contactEmail =
    String(rsvpEmail || "").trim() ||
    contactFactText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ||
    "";
  const contactWebsite =
    String(rsvpUrl || "").trim() ||
    contactFactText.match(/\b(?:https?:\/\/|www\.)[^\s,;]+/i)?.[0] ||
    "";
  const normalizedContactWebsite =
    contactWebsite && !/^https?:\/\//i.test(contactWebsite)
      ? `https://${contactWebsite}`
      : contactWebsite;
  const directionsLocation = [displayVenueName, hasDisplayLocation ? displayLocation : ""]
    .filter(Boolean)
    .join(", ");
  const directionsHref = buildMapsHref(directionsLocation || displayVenueName || location);
  const directRsvpHref = buildRsvpHref({
    rsvpUrl,
    rsvpPhone,
    rsvpEmail,
    title,
    shareUrl,
    categoryLabel,
    backgroundCategory,
    dateLabel,
    rsvpName,
    rsvpSenderName,
    rsvpSenderEmail,
  });
  const hasRsvpAction = Boolean(directRsvpHref);
  const hasRsvpDisplayContact = Boolean(
    String(rsvpPhone || "").trim() ||
      String(rsvpEmail || "").trim() ||
      String(rsvpUrl || "").trim(),
  );
  const isGeneratedOutboundRsvpHref = Boolean(
    directRsvpHref && !String(rsvpUrl || "").trim() && /^(?:sms:|mailto:)/i.test(directRsvpHref),
  );
  const hasKnownRsvpIdentity = Boolean(
    String(rsvpSenderName || "").trim() && String(rsvpSenderEmail || "").trim(),
  );
  const shouldPromptForRsvpIdentity = isGeneratedOutboundRsvpHref && !hasKnownRsvpIdentity;
  const normalizedDetailCopy = normalizeInlineSentences(rawDetailCopy);
  const baseDetailCopy =
    (isPickleballSkin && isRedundantPickleballSummary(normalizedDetailCopy)) ||
    isRedundantEventSummary(normalizedDetailCopy, {
      title: displayTitle,
      date: displayDate,
      time: displayTime,
      venue: displayVenueName,
      location: hasDisplayLocation ? displayLocation : "",
    })
      ? ""
      : normalizedDetailCopy;
  const displayEntryFee = isPickleballSkin ? String(entryFeeFact?.value || "").trim() : "";
  const displayDetailCopy = baseDetailCopy;
  const displayAttire = String(attire || "").trim();
  const displayRegistryUrl = String(registryUrl || "").trim();
  const displayRegistryName = String(registryName || "").trim();
  const displayRegistryHelperText = String(registryHelperText || "").trim();
  const registryLabel = usesGiftListCopy(categoryLabel) ? "Gift List" : "Registry";
  const resolvedRegistryActionLabel =
    String(registryActionLabel || "").trim() ||
    (registryLabel === "Gift List" ? "Open Gift List" : "Open Registry");
  const displayActivities = Array.isArray(activities)
    ? filterRenderedTextValues(
        activities.map((item) => String(item || "").trim()).filter(Boolean),
        [displayDetailCopy, displayAttire, displayEntryFee],
      ).slice(0, 4)
    : [];
  const factsForCards = filterRegistryOcrFacts(
    normalizedOcrFacts.filter(
      (fact) =>
        !/\b(?:phone|email|website|site|contact)\b/i.test(fact.label) &&
        !/^vendor$/i.test(fact.label) &&
        !(
          isPickleballSkin &&
          (/\b(?:check[-\s]?in|games?\s+start(?:ing)?)\b/i.test(`${fact.label} ${fact.value}`) ||
            isEntryFeeFact(fact.label, fact.value))
        ),
    ),
    Boolean(displayRegistryUrl),
  );
  const displayOcrFacts = filterRenderedOcrFacts(factsForCards, [
    displayTitle,
    displayDate,
    displayTime,
    displayVenueName,
    hasDisplayLocation ? displayLocation : "",
    displayDetailCopy,
    displayEntryFee,
    displayAttire,
    displayActivities,
    displayRegistryUrl,
    displayRsvpName,
    rsvpPhone,
    rsvpEmail,
    contactPhone,
    contactEmail,
    contactWebsite,
  ]);
  const groupedDisplayOcrFacts = groupRepeatedOcrFacts(displayOcrFacts);
  const leftColumnOcrFacts =
    detailLayout === "wideDetails" ? groupedDisplayOcrFacts.slice(0, 2) : [];
  const rightColumnOcrFacts =
    detailLayout === "wideDetails" ? groupedDisplayOcrFacts.slice(2) : groupedDisplayOcrFacts;

  useEffect(() => {
    if (previewMode) return;
    window.scrollTo(0, 0);
  }, [previewMode]);

  useEffect(() => {
    if (!showImageLightbox) return;

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowImageLightbox(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showImageLightbox]);

  const openRsvpHref = (href: string) => {
    if (isRsvpMailtoHref(href)) {
      openRsvpMailtoHref(href);
      return;
    }
    window.location.href = href;
  };

  const handleRsvpTileClick = () => {
    if (!directRsvpHref || previewMode) return;
    if (shouldPromptForRsvpIdentity) {
      setShowRsvpIdentityModal(true);
      return;
    }
    openRsvpHref(directRsvpHref);
  };

  const handleRsvpIdentitySubmit = (identity: { name: string; email: string }) => {
    const href = buildRsvpHref({
      rsvpUrl,
      rsvpPhone,
      rsvpEmail,
      title,
      shareUrl,
      categoryLabel,
      backgroundCategory,
      dateLabel,
      rsvpName,
      rsvpSenderName: identity.name,
      rsvpSenderEmail: identity.email,
    });
    setShowRsvpIdentityModal(false);
    if (href) openRsvpHref(href);
  };

  const renderContactCard = () => {
    if (!contactPhone && !contactEmail && !normalizedContactWebsite) return null;

    return (
      <ContactTile
        phone={contactPhone}
        email={contactEmail}
        website={normalizedContactWebsite}
        contactName={displayVendorName || displayRsvpTitle}
        backgroundColor={sidebarCardBackground}
      />
    );
  };

  const renderHubSidebar = (mobile: boolean) => {
    const content = (
      <>
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={imageUrl ? { rotate: -1, y: -2 } : undefined}
          onClick={() => {
            if (!imageUrl) return;
            setShowImageLightbox(true);
          }}
          disabled={!imageUrl}
          className="group relative block w-full rounded-[2rem] bg-white p-4 text-left shadow-xl transition-transform disabled:cursor-default"
        >
          <div className="relative aspect-[3/4] overflow-hidden rounded-[1.5rem]">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={`${title} invitation`}
                className="h-full w-full object-cover transition-all duration-700 group-hover:scale-[1.02]"
              />
            ) : (
              <div
                className="flex h-full w-full flex-col items-center justify-center p-8 text-center text-white"
                style={{
                  background:
                    "linear-gradient(180deg, var(--theme-primary) 0%, var(--theme-accent) 100%)",
                }}
              >
                <Sparkles className="mb-4 h-16 w-16 drop-shadow-lg" />
                <div className="serif text-3xl leading-tight">{displayTitle}</div>
              </div>
            )}
            <div
              className="absolute -right-12 -top-12 h-48 w-48 rounded-full blur-3xl"
              style={{ backgroundColor: `${colors.accent}33` }}
            />
          </div>
          <div className="absolute right-4 top-4 p-4">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform group-hover:scale-110"
              style={{
                backgroundColor: "var(--theme-primary)",
                color: primaryTileTextColor,
              }}
            >
              <Sparkles className="h-6 w-6" />
            </span>
          </div>
        </motion.button>

        <div className="space-y-4">
          <AnimatePresence>
            {hasRsvpAction ? (
              <ActionTile
                key="rsvp-btn"
                icon={<MessageSquare className="h-5 w-5" />}
                label="RSVP Now"
                backgroundColor="var(--theme-secondary)"
                textColor={secondaryTileTextColor}
                href={shouldPromptForRsvpIdentity ? null : directRsvpHref}
                onClick={handleRsvpTileClick}
                disabled={previewMode}
              />
            ) : null}
          </AnimatePresence>

          <ActionTile
            icon={<CalendarPlus className="h-5 w-5" />}
            label="Save to Calendar"
            backgroundColor="var(--theme-primary)"
            textColor={primaryTileTextColor}
            onClick={() => setShowCalendarMenu(true)}
            disabled={!calendarLinks || previewMode}
          />

          {mobile ? null : renderContactCard()}
        </div>
      </>
    );

    if (!mobile) return content;

    return <div className="mx-auto w-full max-w-sm space-y-5">{content}</div>;
  };

  const themeStyle = {
    ["--theme-primary" as string]: colors.primary,
    ["--theme-secondary" as string]: colors.secondary,
    ["--theme-accent" as string]: colors.accent,
    ["--theme-background" as string]: colors.background,
    ["--theme-text" as string]: colors.text,
  };

  return (
    <motion.div
      data-skin-id="scanned-invite-skin"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative min-h-screen overflow-hidden pb-10 font-sans lg:overflow-visible"
      style={{
        ...themeStyle,
        backgroundColor: pageShellBackground,
        color: "var(--theme-text)",
      }}
    >
      <style>{`
        body {
          overflow-x: clip !important;
          overflow-y: visible !important;
        }
      `}</style>
      <ScannedSkinBackground
        category={backgroundCategory || categoryLabel || "general"}
        title={title}
        skinId={skinId}
        sportKind={sportKind}
        palette={colors}
        background={background}
      />
      <div
        className={`relative z-10 mx-auto max-w-6xl px-4 md:px-8 ${EVENT_SKIN_CONTENT_TOP_PADDING_CLASS}`}
      >
        {actions ? <div className={EVENT_SKIN_ACTIONS_CLASS}>{actions}</div> : null}

        <div className="grid grid-cols-1 items-start gap-8 pt-4 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-10 lg:col-span-8">
            <header className="space-y-4 pt-2 md:pt-8">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: -5 }}
                className="inline-flex items-center gap-2 rounded-full px-6 py-2 text-[10px] font-black uppercase tracking-[0.3em] shadow-lg"
                style={{
                  backgroundColor: "var(--theme-accent)",
                  boxShadow: `0 10px 20px -5px ${colors.accent}`,
                  color: chipTextColor,
                }}
              >
                {displayCategoryLabel}
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="serif max-w-4xl text-5xl leading-[1.02] md:text-7xl"
                style={{
                  color: heroTitleColor,
                  textShadow: heroTitleTextShadow,
                }}
              >
                {displayTitle}
              </motion.h1>
              <div className="pt-2 lg:hidden">{renderHubSidebar(true)}</div>
            </header>

            <motion.section
              layout
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-white p-6 shadow-sm md:p-10"
            >
              <div className="space-y-8">
                <InfoBlock
                  icon={<Calendar className="h-7 w-7" />}
                  swatchColor={detailIconSwatchColor}
                  label="When"
                  title={displayDate}
                />

                {checkInTime ? (
                  <InfoBlock
                    icon={<Clock className="h-7 w-7" />}
                    swatchColor={detailIconSwatchColor}
                    label="Check-in"
                    title={checkInTime}
                  />
                ) : displayTime ? (
                  <InfoBlock
                    icon={<Clock className="h-7 w-7" />}
                    swatchColor={detailIconSwatchColor}
                    label="At"
                    title={displayTime}
                  />
                ) : null}

                {gamesStartTime ? (
                  <InfoBlock
                    icon={<Clock className="h-7 w-7" />}
                    swatchColor={detailIconSwatchColor}
                    label="Games starting"
                    title={gamesStartTime}
                  />
                ) : null}

                {displayVenueName ? (
                  <InfoBlock
                    icon={<MapPin className="h-7 w-7" />}
                    swatchColor={detailIconSwatchColor}
                    label="Venue"
                    title={displayVenueName}
                  />
                ) : null}

                {hasDisplayLocation ? (
                  <InfoBlock
                    icon={<MapPin className="h-7 w-7" />}
                    swatchColor={detailIconSwatchColor}
                    label="Where"
                    title={displayLocation}
                  />
                ) : null}

                <AnimatePresence mode="wait">
                  {displayVendorName ? (
                    <motion.div
                      key="vendor"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                    >
                      <InfoBlock
                        icon={<Sparkles className="h-7 w-7" />}
                        swatchColor={detailIconSwatchColor}
                        label="Vendor"
                        title={displayVendorName}
                        divider
                      />
                    </motion.div>
                  ) : hasRsvpAction || hasRsvpDisplayContact ? (
                    <motion.div
                      key="rsvp"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                    >
                      <InfoBlock
                        icon={<MessageSquare className="h-7 w-7" />}
                        swatchColor={detailIconSwatchColor}
                        label="RSVP"
                        title={displayRsvpTitle}
                        divider
                      />
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                {directionsHref ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (previewMode) return;
                      window.open(directionsHref, "_blank", "noopener,noreferrer");
                    }}
                    disabled={previewMode}
                    className="mx-auto flex w-fit items-center justify-center gap-2 rounded-[1.25rem] px-7 py-5 text-xs font-bold uppercase tracking-[0.18em] shadow-lg transition-all hover:scale-[1.01] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      backgroundColor: directionsButtonBackground,
                      boxShadow: `0 18px 42px -26px ${directionsButtonBackground}`,
                      color: directionsButtonTextColor,
                    }}
                  >
                    <Navigation className="h-4 w-4" />
                    <span>Get Directions</span>
                  </button>
                ) : null}
              </div>
            </motion.section>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {displayDetailCopy ? (
                <HubDetailCard
                  label="Good to Know"
                  title={displayDetailCopy}
                  icon={<Sparkles className="h-5 w-5" />}
                  backgroundColor={detailCardBackground}
                  textColor={detailCardTextColor}
                  mutedColor={detailCardMutedTextColor}
                  accentColor="var(--theme-secondary)"
                />
              ) : null}

              {displayEntryFee ? (
                <HubDetailCard
                  label="Entry Fee"
                  title={displayEntryFee}
                  backgroundColor="#ffffff"
                  textColor="#111827"
                  mutedColor="rgba(0,0,0,0.35)"
                  accentColor="var(--theme-primary)"
                />
              ) : null}

              {displayAttire ? (
                <HubDetailCard
                  label="Dress Code"
                  title={displayAttire}
                  backgroundColor="#ffffff"
                  textColor="#111827"
                  mutedColor="rgba(0,0,0,0.35)"
                  accentColor="var(--theme-primary)"
                />
              ) : null}

              {displayRegistryUrl ? (
                <motion.a
                  href={displayRegistryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    if (!eventId) return;
                    trackEventInteraction({
                      eventId,
                      eventName: "registry_click",
                      targetUrl: displayRegistryUrl,
                      targetLabel: resolvedRegistryActionLabel,
                      sourceSurface: "scanned_invite_skin",
                    });
                  }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.48 }}
                  className="rounded-[2rem] border border-white/60 bg-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="text-[10px] font-bold uppercase tracking-widest text-black/35">
                    {registryLabel}
                  </div>
                  {displayRegistryName ? (
                    <div className="mt-3 text-base font-semibold text-black/70">
                      {displayRegistryName}
                    </div>
                  ) : null}
                  <div className="mt-2 text-xl font-bold text-black/90">
                    {resolvedRegistryActionLabel}
                  </div>
                  {displayRegistryHelperText ? (
                    <div className="mt-3 whitespace-pre-line text-sm font-medium leading-relaxed text-black/55">
                      {displayRegistryHelperText}
                    </div>
                  ) : null}
                </motion.a>
              ) : null}

              {displayActivities.length ? (
                <motion.section
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="rounded-[2rem] border border-white/60 bg-white p-7 shadow-sm"
                >
                  <div className="text-[10px] font-bold uppercase tracking-widest text-black/35">
                    Event Flow
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {displayActivities.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-slate-50 px-3 py-1 text-sm font-bold text-slate-800"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </motion.section>
              ) : null}

              <OcrFactCards
                facts={[...leftColumnOcrFacts, ...rightColumnOcrFacts]}
                cardClassName="rounded-[2rem] border border-white/60 bg-white p-7 shadow-sm"
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Flyer & Sticky Actions */}
          <div className="no-scrollbar hidden space-y-8 self-start lg:col-span-4 lg:sticky lg:top-12 lg:block lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto lg:pb-2 lg:pr-1">
            {renderHubSidebar(false)}
          </div>
        </div>

        <div className="mx-auto mt-8 w-full max-w-sm lg:hidden">{renderContactCard()}</div>

        <div className={EVENT_SKIN_FOOTER_CLASS}>
          <div
            className={EVENT_SKIN_FOOTER_DIVIDER_CLASS}
            style={{ backgroundColor: "rgba(0,0,0,0.1)" }}
          />
          <div className={EVENT_SKIN_FOOTER_TEXT_CLASS} style={{ color: "rgba(0,0,0,0.3)" }}>
            {footerPrefix || "Created by"}{" "}
            <span style={{ color: "rgba(0,0,0,0.4)" }}>Envitefy</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showCalendarMenu && calendarLinks ? (
          <div className="fixed inset-0 z-[7100] flex items-center justify-center p-6">
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCalendarMenu(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.5, y: 100, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.5, y: 100, opacity: 0 }}
              className="relative w-full max-w-sm rounded-[3.5rem] p-10 text-center shadow-2xl"
              style={{
                backgroundColor: neutralSurface,
                color: neutralSurfaceTextColor,
              }}
            >
              <div
                className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl"
                style={{
                  backgroundColor: mixHexColors(colors.primary, "#ffffff", 0.82) || "#ffffff",
                  color: colors.primary,
                }}
              >
                <Calendar className="h-10 w-10" />
              </div>
              <h3 className="serif mb-8 text-2xl font-bold">Add it to your calendar</h3>
              <div className="space-y-4">
                <CalendarModalLink
                  href={calendarLinks.google}
                  label="Google"
                  tone={colors.primary}
                  onChoose={() => setShowCalendarMenu(false)}
                />
                <CalendarModalLink
                  href={calendarLinks.outlook}
                  label="Outlook"
                  tone={colors.secondary}
                  onChoose={() => setShowCalendarMenu(false)}
                />
                <button
                  type="button"
                  onClick={() => {
                    const url = calendarLinks.appleInline;
                    setShowCalendarMenu(false);
                    if (previewMode || !url) return;
                    window.open(url, "_blank", "noopener,noreferrer");
                  }}
                  className="block w-full rounded-[1.8rem] py-5 text-xs font-bold uppercase tracking-widest transition-transform hover:scale-105"
                  style={{
                    backgroundColor: calendarModalButtonBackground,
                    color: calendarModalButtonTextColor,
                  }}
                >
                  Apple
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowCalendarMenu(false)}
                className="mt-8 text-[10px] font-bold uppercase tracking-widest transition-opacity"
                style={{ color: neutralSurfaceMutedTextColor }}
              >
                Maybe later
              </button>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showImageLightbox && imageUrl ? (
          <div className="fixed inset-0 z-[7000] flex items-center justify-center px-4 py-6">
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-label="Close invitation preview"
              onClick={() => setShowImageLightbox(false)}
              className="absolute inset-0 bg-[rgba(18,15,12,0.78)] backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="relative max-h-full w-full max-w-5xl"
            >
              <button
                type="button"
                onClick={() => setShowImageLightbox(false)}
                className="absolute right-3 top-3 z-10 rounded-full border border-white/20 bg-black/35 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-white"
              >
                Close
              </button>
              <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black/10 shadow-[0_32px_120px_rgba(0,0,0,0.45)]">
                <img
                  src={imageUrl}
                  alt={`${title} invitation full screen`}
                  className="max-h-[85vh] w-full object-contain"
                />
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      {showRsvpIdentityModal ? (
        <RsvpIdentityModal
          eventTitle={displayTitle}
          hostName={displayRsvpTitle}
          initialName={rsvpSenderName}
          initialEmail={rsvpSenderEmail}
          onClose={() => setShowRsvpIdentityModal(false)}
          onSubmit={handleRsvpIdentitySubmit}
        />
      ) : null}
    </motion.div>
  );
}

function InfoBlock({
  icon,
  swatchColor,
  label,
  title,
  subtitle,
  divider = false,
}: {
  icon: ReactNode;
  swatchColor: string;
  label: string;
  title: string;
  subtitle?: string;
  divider?: boolean;
}) {
  return (
    <div className={divider ? "border-t border-black/5 pt-6" : ""}>
      <div className="flex items-center gap-4 md:gap-6">
        <div
          className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[1.5rem] transition-transform"
          style={{
            backgroundColor: `color-mix(in srgb, ${swatchColor} 18%, white)`,
            color: swatchColor,
          }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-widest text-black/30">
            {label}
          </div>
          <div className="text-2xl font-bold text-black/90 md:text-3xl">{title}</div>
          {subtitle ? <div className="text-base text-black/50 md:text-lg">{subtitle}</div> : null}
        </div>
      </div>
    </div>
  );
}

function HubDetailCard({
  label,
  title,
  icon,
  backgroundColor,
  textColor,
  mutedColor,
  accentColor,
}: {
  label: string;
  title: string;
  icon?: ReactNode;
  backgroundColor: string;
  textColor: string;
  mutedColor: string;
  accentColor: string;
}) {
  return (
    <motion.section
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="flex min-h-[10rem] items-center justify-between gap-6 rounded-[2rem] border border-white/60 p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      style={{
        backgroundColor,
        color: textColor,
      }}
    >
      <div className="min-w-0 space-y-2">
        <div
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: mutedColor }}
        >
          {label}
        </div>
        <div className="break-words text-xl font-bold leading-tight md:text-2xl">{title}</div>
      </div>
      {icon ? (
        <div
          className="hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-lg sm:flex"
          style={{ color: accentColor }}
        >
          {icon}
        </div>
      ) : null}
    </motion.section>
  );
}

function ContactTile({
  phone,
  email,
  website,
  contactName,
  backgroundColor,
}: {
  phone: string;
  email: string;
  website: string;
  contactName: string;
  backgroundColor: string;
}) {
  return (
    <section
      className="flex w-full flex-col items-center justify-center gap-3 rounded-[1.25rem] border border-slate-200/60 px-5 py-5 text-black/75 shadow-sm"
      style={{ backgroundColor }}
    >
      <div className="flex w-full items-center justify-around gap-2">
        {phone ? (
          <a
            href={`tel:${phone.replace(/[^\d+]/g, "")}`}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-600 transition hover:bg-slate-100"
            aria-label="Call"
          >
            <Phone className="h-5 w-5" />
          </a>
        ) : null}
        {email ? (
          <a
            href={`mailto:${email}`}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-600 transition hover:bg-slate-100"
            aria-label="Email"
          >
            <Mail className="h-5 w-5" />
          </a>
        ) : null}
        {website ? (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-600 transition hover:bg-slate-100"
            aria-label="Website"
          >
            <Globe2 className="h-5 w-5" />
          </a>
        ) : null}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        Contact
      </span>
      {contactName ? (
        <p className="text-center text-sm font-bold text-slate-800">{contactName}</p>
      ) : null}
    </section>
  );
}

function ActionTile({
  icon,
  label,
  backgroundColor,
  textColor,
  onClick,
  href,
  disabled = false,
  wide = false,
}: {
  icon: ReactNode;
  label: string;
  backgroundColor: string;
  textColor: string;
  onClick?: () => void;
  href?: string | null;
  disabled?: boolean;
  wide?: boolean;
}) {
  const content = (
    <>
      <span>{icon}</span>
      <span className="text-center text-xs font-bold uppercase tracking-[0.18em]">{label}</span>
    </>
  );

  const className = wide
    ? "flex w-full items-center justify-center rounded-[1.25rem] px-6 py-5 shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-65"
    : "flex w-full items-center justify-center rounded-[1.25rem] px-6 py-5 shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-65";
  const contentClassName = wide
    ? "flex flex-row items-center justify-center gap-4"
    : "flex flex-row items-center justify-center gap-3";

  if (href && !disabled) {
    const linkHref = href;
    if (isRsvpMailtoHref(linkHref)) {
      return (
        <button
          type="button"
          onClick={() => openRsvpMailtoHref(linkHref)}
          className={className}
          style={{ backgroundColor, color: textColor }}
        >
          <div className={contentClassName}>{content}</div>
        </button>
      );
    }

    const isExternalHref = /^https?:\/\//i.test(linkHref);
    return (
      <a
        href={linkHref}
        target={isExternalHref ? "_blank" : undefined}
        rel={isExternalHref ? "noopener noreferrer" : undefined}
        className={className}
        style={{ backgroundColor, color: textColor }}
      >
        <div className={contentClassName}>{content}</div>
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{ backgroundColor, color: textColor }}
    >
      <div className={contentClassName}>{content}</div>
    </button>
  );
}

function CalendarModalLink({
  href,
  label,
  tone,
  onChoose,
}: {
  href: string;
  label: string;
  tone: string;
  onChoose: () => void;
}) {
  const textColor = ensureReadableTextColor(tone, "#ffffff", { minContrast: 3 });
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={onChoose}
      className="block w-full rounded-[1.8rem] py-5 text-center text-xs font-bold uppercase tracking-widest transition-transform hover:scale-105"
      style={{ backgroundColor: tone, color: textColor }}
    >
      {label}
    </a>
  );
}
