"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Calendar, CalendarPlus, Clock, MapPin, MessageSquare, Sparkles } from "lucide-react";
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
import ScannedSkinBackground from "@/components/ScannedSkinBackground";
import { buildLiveCardRsvpOutboundHref } from "@/lib/live-card-rsvp";
import {
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
  title: string;
  categoryLabel?: string | null;
  backgroundCategory?: string | null;
  dateLabel?: string | null;
  timeLabel?: string | null;
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
  detailCopy?: string | null;
  activities?: string[] | null;
  attire?: string | null;
  registryUrl?: string | null;
  ocrFacts?: OcrFact[] | null;
  detailLayout?: "default" | "wideDetails";
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
  if (!value || value === "Location TBD") return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`;
}

function buildRsvpHref({
  rsvpUrl,
  rsvpPhone,
  rsvpEmail,
  title,
  shareUrl,
  categoryLabel,
  backgroundCategory,
}: Pick<
  Props,
  | "rsvpUrl"
  | "rsvpPhone"
  | "rsvpEmail"
  | "title"
  | "shareUrl"
  | "categoryLabel"
  | "backgroundCategory"
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
      const key = part.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  return sentences.length ? sentences.join(" ") : withSentenceSpaces.trim();
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

function isEntryFeeFact(label: string, value: string): boolean {
  return /\b(?:entry|registration|admission)\s*(?:fee|cost)?\b|\bfee\b|\$\s*\d+/i.test(
    `${label} ${value}`,
  );
}

export default function ScannedInviteSkin({
  title,
  categoryLabel,
  backgroundCategory,
  dateLabel,
  timeLabel,
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
  detailCopy,
  activities,
  attire,
  registryUrl,
  ocrFacts,
  detailLayout = "default",
  previewMode = false,
  actions,
}: Props) {
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);
  const [showImageLightbox, setShowImageLightbox] = useState(false);

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
  const directionsButtonBackground = colors.primary;
  const directionsButtonTextColor = ensureReadableTextColor(directionsButtonBackground, "#ffffff", {
    minContrast: 4.5,
  });
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
    { minContrast: 4.5 },
  );
  const detailIconSwatchColor = "var(--theme-primary)";
  const displayTitle = String(title || "").trim() || "Celebration";
  const displayCategoryLabel = formatCategoryLabel(categoryLabel);
  const displayDate = String(dateLabel || "").trim() || "Date TBD";
  const displayTime = String(timeLabel || "").trim();
  const displayLocation = String(location || "").trim() || "Location TBD";
  const rawDetailCopy = String(detailCopy || "").trim();
  const isPickleballSkin = String(sportKind || "").toLowerCase() === "pickleball";
  const normalizedOcrFacts = normalizeOcrFacts(ocrFacts);
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
  const displayRsvpTitle = displayRsvpName
    ? /^hosted\s+by\b/i.test(displayRsvpName)
      ? displayRsvpName
      : `Hosted by ${displayRsvpName}`
    : String(rsvpEmail || "Host");
  const directionsHref = buildMapsHref(location);
  const directRsvpHref = buildRsvpHref({
    rsvpUrl,
    rsvpPhone,
    rsvpEmail,
    title,
    shareUrl,
    categoryLabel,
    backgroundCategory,
  });
  const hasRsvpAction = Boolean(directRsvpHref);
  const normalizedDetailCopy = normalizeInlineSentences(rawDetailCopy);
  const baseDetailCopy =
    isPickleballSkin && isRedundantPickleballSummary(normalizedDetailCopy)
      ? ""
      : normalizedDetailCopy;
  const displayEntryFee = isPickleballSkin ? String(entryFeeFact?.value || "").trim() : "";
  const displayDetailCopy = baseDetailCopy;
  const displayAttire = String(attire || "").trim();
  const displayRegistryUrl = String(registryUrl || "").trim();
  const registryLabel = usesGiftListCopy(categoryLabel) ? "Gift List" : "Registry";
  const registryActionLabel = registryLabel === "Gift List" ? "Open Gift List" : "Open Registry";
  const displayActivities = Array.isArray(activities)
      ? filterRenderedTextValues(
          activities.map((item) => String(item || "").trim()).filter(Boolean),
        [displayDetailCopy, displayAttire, displayEntryFee],
        ).slice(0, 4)
    : [];
  const factsForCards = normalizedOcrFacts.filter(
    (fact) =>
      !(
        isPickleballSkin &&
        (/\b(?:check[-\s]?in|games?\s+start(?:ing)?)\b/i.test(`${fact.label} ${fact.value}`) ||
          isEntryFeeFact(fact.label, fact.value))
      ),
  );
  const displayOcrFacts = filterRenderedOcrFacts(factsForCards, [
    displayTitle,
    displayDate,
    displayTime,
    displayLocation,
    displayDetailCopy,
    displayEntryFee,
    displayAttire,
    displayActivities,
    displayRegistryUrl,
    displayRsvpName,
    rsvpPhone,
    rsvpEmail,
  ]);
  const leftColumnOcrFacts = displayOcrFacts.slice(0, 2);
  const rightColumnOcrFacts = displayOcrFacts.slice(2);
  const detailsGridClassName =
    detailLayout === "wideDetails"
      ? "grid max-w-6xl grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(390px,1.12fr)_minmax(0,1fr)] xl:grid-cols-[minmax(440px,1.15fr)_minmax(0,0.95fr)]"
      : "grid max-w-6xl grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.45fr)]";

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
      className="relative min-h-screen overflow-hidden pb-10 font-sans"
      style={{
        ...themeStyle,
        backgroundColor: "var(--theme-background)",
        color: "var(--theme-text)",
      }}
    >
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

        <div className="mb-12 flex max-w-6xl flex-col items-center justify-between gap-8 pt-4 text-center md:flex-row md:items-center md:pt-12 md:text-left">
          <div className="flex-1 space-y-4 text-center md:text-left">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: -5 }}
              className="inline-block rounded-full px-6 py-2 text-[10px] font-black uppercase tracking-[0.3em] shadow-lg"
              style={{
                backgroundColor: "var(--theme-accent)",
                boxShadow: `0 10px 20px -5px ${colors.accent}`,
                color: chipTextColor,
              }}
            >
              {displayCategoryLabel}
            </motion.div>
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="serif text-5xl leading-[0.95] tracking-tight md:text-7xl"
              style={{ color: "var(--theme-text)" }}
            >
              {displayTitle}
            </motion.h1>
          </div>

          <motion.button
            type="button"
            whileHover={{ rotate: 5, scale: 1.05 }}
            onClick={() => {
              if (!imageUrl) return;
              setShowImageLightbox(true);
            }}
            className="group relative block w-full max-w-[300px] rounded-[2.5rem] border-8 border-white bg-white p-3 text-left shadow-2xl transition-all duration-500 disabled:cursor-default"
            disabled={!imageUrl}
          >
            <div
              className="absolute -right-4 -top-4 z-10 flex h-16 w-16 items-center justify-center rounded-full shadow-xl"
              style={{
                backgroundColor: "var(--theme-primary)",
                color: primaryTileTextColor,
              }}
            >
              <Sparkles className="h-8 w-8" />
            </div>
            <div className="overflow-hidden rounded-[1.8rem] bg-white">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={`${title} invitation`}
                  className="aspect-[3/4] h-full w-full object-cover transition-all duration-700"
                />
              ) : (
                <div
                  className="aspect-[3/4] w-full"
                  style={{
                    background:
                      "linear-gradient(180deg, var(--theme-primary) 0%, var(--theme-accent) 100%)",
                  }}
                />
              )}
            </div>
          </motion.button>
        </div>

        <div className={detailsGridClassName}>
          <div className="grid gap-6">
            <motion.section
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="self-start rounded-[2.6rem] border border-black/5 bg-white p-6 shadow-xl transition-shadow hover:shadow-2xl md:p-8"
            >
              <div className="space-y-6">
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

                <InfoBlock
                  icon={<MapPin className="h-7 w-7" />}
                  swatchColor={detailIconSwatchColor}
                  label="Where"
                  title="Event Location"
                  subtitle={displayLocation}
                />

                {rsvpName || rsvpPhone || rsvpEmail ? (
                  <InfoBlock
                    icon={<MessageSquare className="h-7 w-7" />}
                    swatchColor={detailIconSwatchColor}
                    label="RSVP"
                    title={displayRsvpTitle}
                    subtitle={
                      String(rsvpEmail || rsvpPhone || "").trim() ||
                      "Contact details available on request"
                    }
                    divider
                  />
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!directionsHref || previewMode) return;
                  window.open(directionsHref, "_blank", "noopener,noreferrer");
                }}
                disabled={!directionsHref || previewMode}
                className="mt-8 w-full rounded-[1.6rem] py-5 text-xs font-bold uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  backgroundColor: directionsButtonBackground,
                  color: directionsButtonTextColor,
                }}
              >
                Get Directions
              </button>
            </motion.section>

            <OcrFactCards
              facts={leftColumnOcrFacts}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-1"
              cardClassName="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <ActionTile
              icon={<CalendarPlus className="h-10 w-10" />}
              label="Save to Calendar"
              backgroundColor="var(--theme-primary)"
              textColor={primaryTileTextColor}
              onClick={() => setShowCalendarMenu(true)}
              disabled={!calendarLinks || previewMode}
              wide={!hasRsvpAction}
            />

            {hasRsvpAction ? (
              <ActionTile
                icon={<MessageSquare className="h-10 w-10" />}
                label="RSVP Now"
                backgroundColor="var(--theme-secondary)"
                textColor={secondaryTileTextColor}
                href={directRsvpHref}
                disabled={previewMode}
              />
            ) : null}

            {displayDetailCopy ? (
              <motion.section
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="col-span-2 flex items-center justify-between gap-6 rounded-[3rem] border border-black/5 p-7 shadow-sm backdrop-blur-sm md:p-10"
                style={{
                  backgroundColor: detailCardBackground,
                  color: detailCardTextColor,
                }}
              >
                <div className="space-y-1">
                  <div
                    className="text-[10px] font-black uppercase tracking-widest"
                    style={{ color: detailCardMutedTextColor }}
                  >
                    Good to Know
                  </div>
                  <div className="text-2xl font-bold">{displayDetailCopy}</div>
                </div>
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg"
                  style={{ color: "var(--theme-secondary)" }}
                >
                  <Sparkles className="h-6 w-6" />
                </div>
              </motion.section>
            ) : null}
            {displayEntryFee ? (
              <motion.section
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.43 }}
                className="col-span-2 flex flex-col justify-center rounded-[2.2rem] border border-black/5 bg-white p-6 shadow-sm md:p-7"
              >
                <div className="text-[10px] font-black uppercase tracking-widest text-black/35">
                  Entry Fee
                </div>
                <div className="mt-2 text-xl font-bold text-black/90">{displayEntryFee}</div>
              </motion.section>
            ) : null}
            {displayAttire ? (
              <motion.section
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="col-span-1 flex flex-col justify-center rounded-[2.2rem] border border-black/5 bg-white p-6 shadow-sm md:col-span-1"
              >
                <div className="text-[10px] font-black uppercase tracking-widest text-black/35">
                  Dress Code
                </div>
                <div className="mt-2 text-xl font-bold text-black/90">{displayAttire}</div>
              </motion.section>
            ) : null}
            {displayRegistryUrl ? (
              <motion.a
                href={displayRegistryUrl}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.48 }}
                className="col-span-1 flex items-center justify-center rounded-[2.2rem] border border-black/5 bg-white p-6 text-center shadow-sm transition hover:scale-[1.01] md:col-span-1"
              >
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-black/35">
                    {registryLabel}
                  </div>
                  <div className="mt-2 text-lg font-bold text-black/90">{registryActionLabel}</div>
                </div>
              </motion.a>
            ) : null}
            {displayActivities.length ? (
              <motion.section
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="col-span-2 rounded-[2.2rem] border border-black/5 bg-white p-6 shadow-sm"
              >
                <div className="text-[10px] font-black uppercase tracking-widest text-black/35">
                  Event Flow
                </div>
                <ul className="mt-3 space-y-1 text-sm font-medium text-black/80">
                  {displayActivities.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </motion.section>
            ) : null}
            <OcrFactCards
              facts={rightColumnOcrFacts}
              cardClassName="col-span-1 rounded-[2.2rem] border border-black/5 bg-white p-6 shadow-sm md:col-span-1"
            />
          </div>
        </div>

        <div className={EVENT_SKIN_FOOTER_CLASS}>
          <div
            className={EVENT_SKIN_FOOTER_DIVIDER_CLASS}
            style={{ backgroundColor: "rgba(0,0,0,0.1)" }}
          />
          <div className={EVENT_SKIN_FOOTER_TEXT_CLASS} style={{ color: "rgba(0,0,0,0.3)" }}>
            Snapped by <span style={{ color: "rgba(0,0,0,0.4)" }}>Envitefy</span>
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
      <span className="text-center text-sm font-bold uppercase tracking-tight">{label}</span>
    </>
  );

  const className = wide
    ? "col-span-2 flex min-h-[6.75rem] w-full items-center justify-center rounded-[2.5rem] px-6 py-5 shadow-[0_22px_54px_rgba(59,74,84,0.12)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-65 sm:min-h-[7.5rem] sm:px-7 sm:py-6 md:min-h-[8rem] md:rounded-[3rem] md:px-10 md:py-7"
    : "flex min-h-[10.5rem] w-full items-center justify-center rounded-[3rem] px-4 py-6 shadow-[0_22px_54px_rgba(59,74,84,0.12)] transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-65 sm:min-h-[12rem] sm:px-5 sm:py-7 md:aspect-square md:min-h-0 md:p-8";
  const contentClassName = wide
    ? "flex flex-row items-center justify-center gap-4"
    : "flex flex-col items-center gap-4";

  if (href && !disabled) {
    if (isRsvpMailtoHref(href)) {
      return (
        <button
          type="button"
          onClick={() => openRsvpMailtoHref(href)}
          className={className}
          style={{ backgroundColor, color: textColor }}
        >
          <div className={contentClassName}>{content}</div>
        </button>
      );
    }

    return (
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
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
