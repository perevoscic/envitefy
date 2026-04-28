"use client";

import { Calendar, Clock, Download, MapPin, Share2 } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import EventRsvpPrompt from "@/components/EventRsvpPrompt";
import {
  EVENT_SKIN_ACTIONS_CLASS,
  EVENT_SKIN_FOOTER_CLASS,
  EVENT_SKIN_FOOTER_DIVIDER_CLASS,
  EVENT_SKIN_FOOTER_TEXT_CLASS,
  EVENT_SKIN_HERO_TOP_PADDING_CLASS,
} from "@/components/event-skin-layout";
import OcrFactCards from "@/components/OcrFactCards";
import ScannedSkinBackground from "@/components/ScannedSkinBackground";
import { filterRenderedOcrFacts, normalizeOcrFacts, type OcrFact } from "@/lib/ocr/facts";
import type { OcrSkinBackground } from "@/lib/ocr/skin-background";
import {
  DEFAULT_WEDDING_SCAN_FLYER_COLORS,
  normalizeWeddingFlyerColors,
  parseWeddingCoupleNames,
} from "@/lib/wedding-scan";

type CalendarLinks = {
  google: string;
  outlook: string;
  appleInline: string;
};

type FlyerColors = {
  background?: string;
  primary?: string;
  secondary?: string;
  accent?: string;
  text?: string;
  dominant?: string;
  themeColor?: string;
} | null;

export type ScannedWeddingRegistryCard = {
  label: string;
  url: string;
  host: string;
  badgeText: string;
  accentColor: string;
  textColor: string;
  brandLabel?: string | null;
};

type ScheduleRowItem = {
  time: string;
  title: string;
};

type WeddingScanSkinId =
  | "scanned-wedding-editorial-paper"
  | "scanned-wedding-gilded-romance"
  | "scanned-wedding-noir-modern";

type Props = {
  eventId?: string | null;
  title: string;
  venueName?: string | null;
  location: string | null;
  dateLabel: string | null;
  timeLabel: string | null;
  imageUrl: string | null;
  shareUrl: string;
  calendarLinks: CalendarLinks | null;
  skinId?: string | null;
  flyerColors?: FlyerColors;
  background?: OcrSkinBackground | null;
  rsvpName?: string | null;
  rsvpPhone?: string | null;
  rsvpEmail?: string | null;
  rsvpUrl?: string | null;
  rsvpDeadline?: string | null;
  registryCards?: ScannedWeddingRegistryCard[];
  scheduleRows?: ScheduleRowItem[];
  ocrFacts?: OcrFact[] | null;
  previewMode?: boolean;
  showRsvpPreview?: boolean;
  rsvpPreviewText?: string | null;
  showPublicShareAction?: boolean;
  actions?: ReactNode;
};

export default function ScannedWeddingInviteView({
  eventId,
  title,
  venueName,
  location,
  dateLabel,
  timeLabel,
  imageUrl,
  shareUrl,
  calendarLinks,
  skinId,
  flyerColors,
  background,
  rsvpName,
  rsvpPhone,
  rsvpEmail,
  rsvpUrl,
  rsvpDeadline,
  registryCards = [],
  scheduleRows = [],
  ocrFacts,
  previewMode = false,
  showRsvpPreview = false,
  rsvpPreviewText,
  showPublicShareAction = false,
  actions,
}: Props) {
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  const [shareMessage, setShareMessage] = useState<"idle" | "copied" | "shared">("idle");
  const colors = useMemo(
    () => normalizeWeddingFlyerColors(flyerColors || DEFAULT_WEDDING_SCAN_FLYER_COLORS),
    [flyerColors],
  );
  const resolvedSkinId: WeddingScanSkinId =
    skinId === "scanned-wedding-gilded-romance" || skinId === "scanned-wedding-noir-modern"
      ? skinId
      : "scanned-wedding-editorial-paper";
  const isNoirModern = resolvedSkinId === "scanned-wedding-noir-modern";
  const isGildedRomance = resolvedSkinId === "scanned-wedding-gilded-romance";
  const couple = useMemo(() => parseWeddingCoupleNames(title), [title]);
  const displayVenueName = venueName?.trim() || "";
  const displayLocation = location?.trim() || "Location TBD";
  const directionsLocation = [displayVenueName, displayLocation].filter(Boolean).join(", ");
  const displayDate = dateLabel?.trim() || "Date TBD";
  const displayTime = timeLabel?.trim() || "";
  const hasRsvp = Boolean(rsvpName || rsvpUrl);
  const showRsvpSection = hasRsvp || (previewMode && showRsvpPreview);
  const hasRegistries = registryCards.length > 0;
  const timelineRows = scheduleRows.length > 0 ? scheduleRows : [];
  const mutedTextColor = isNoirModern ? "rgba(255,255,255,0.72)" : "rgba(0,0,0,0.45)";
  const subtleTextColor = isNoirModern ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)";
  const thinBorderColor = isNoirModern ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.05)";
  const sectionBackground = isNoirModern ? "rgba(9, 12, 20, 0.82)" : "rgba(255,255,255,0.9)";
  const actionBackground = isNoirModern ? "rgba(10,14,24,0.9)" : "#ffffff";
  const asideBackground = isNoirModern ? "rgba(9, 12, 20, 0.94)" : "#ffffff";
  const displayOcrFacts = filterRenderedOcrFacts(normalizeOcrFacts(ocrFacts), [
    scheduleRows.map((row) => row.title),
    scheduleRows.map((row) => row.time),
    registryCards.map((card) => card.url),
    registryCards.map((card) => card.host),
    rsvpName,
    rsvpPhone,
    rsvpEmail,
    rsvpUrl,
    rsvpDeadline,
  ]);
  const headlineFontFamily = isNoirModern
    ? 'var(--font-geist-sans), "Helvetica Neue", Arial, sans-serif'
    : 'var(--font-playfair), "Times New Roman", serif';
  const heroOverlay = isNoirModern
    ? `linear-gradient(180deg, rgba(7,9,14,0.68) 0%, ${colors.background} 78%)`
    : `linear-gradient(180deg, rgba(255,255,255,0.42) 0%, ${colors.background} 78%)`;
  const rootBackgroundImage = isNoirModern
    ? `radial-gradient(circle at top, ${colors.secondary} 0%, rgba(0,0,0,0) 48%), linear-gradient(180deg, #06080d 0%, ${colors.background} 38%, #090d14 100%)`
    : isGildedRomance
      ? `radial-gradient(circle at top, ${colors.primary} 0%, rgba(255,255,255,0) 56%), linear-gradient(180deg, ${colors.background} 0%, ${colors.secondary} 100%)`
      : `radial-gradient(circle at top, ${colors.secondary} 0%, rgba(255,255,255,0) 52%), linear-gradient(180deg, ${colors.background} 0%, ${colors.secondary} 100%)`;

  useEffect(() => {
    if (previewMode) return;
    window.scrollTo(0, 0);
  }, [previewMode]);

  useEffect(() => {
    if (shareMessage === "idle") return;
    const timer = window.setTimeout(() => setShareMessage("idle"), 1800);
    return () => window.clearTimeout(timer);
  }, [shareMessage]);

  const handleShare = async () => {
    if (previewMode) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: title,
          url: shareUrl,
        });
        setShareMessage("shared");
        return;
      }
    } catch {
      // fall through to clipboard copy
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareMessage("copied");
    } catch {
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleDownload = () => {
    if (previewMode || !imageUrl) return;
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "wedding-invitation";
    link.click();
  };

  const handleConcierge = () => {
    if (previewMode) return;
    if (!directionsLocation || directionsLocation === "Location TBD") return;
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(directionsLocation)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleOpenLightbox = () => {
    if (!imageUrl) return;
    setShowImageLightbox(true);
  };

  const headline =
    couple.partner1 && couple.partner2 ? (
      <>
        <span className="block">{couple.partner1}</span>
        <span className="block">
          <span className="opacity-30">&amp;&nbsp;</span>
          {couple.partner2}
        </span>
      </>
    ) : (
      couple.displayTitle
    );

  return (
    <div
      data-skin-id={resolvedSkinId}
      className="relative min-h-screen overflow-hidden pb-10"
      style={{
        backgroundColor: colors.background,
        color: colors.text,
        backgroundImage: rootBackgroundImage,
      }}
    >
      <ScannedSkinBackground
        category="wedding"
        title={title}
        skinId={resolvedSkinId}
        palette={colors}
        background={background}
        darkMode={isNoirModern}
      />
      <div
        className={`relative z-10 min-h-[42vh] overflow-hidden px-5 pb-14 md:min-h-[58vh] md:px-8 md:pb-20 ${EVENT_SKIN_HERO_TOP_PADDING_CLASS}`}
      >
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center blur-[2px]"
          style={{
            backgroundImage: imageUrl ? `url(${imageUrl})` : "none",
            opacity: imageUrl ? 0.11 : 0,
            filter: imageUrl ? "grayscale(0.2) blur(2px)" : undefined,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: heroOverlay,
          }}
        />

        {actions && !previewMode ? (
          <div className={`mx-auto max-w-7xl ${EVENT_SKIN_ACTIONS_CLASS}`}>{actions}</div>
        ) : null}

        <div className="relative z-10 mx-auto mt-8 max-w-5xl text-center md:mt-10">
          <div
            className="mx-auto mb-8 h-[5px] w-36 rounded-full opacity-60"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${colors.accent} 24%, ${colors.primary} 76%, transparent 100%)`,
            }}
          />
          <h1
            className="mx-auto max-w-4xl text-[3.2rem] leading-[0.88] tracking-[-0.05em] sm:text-[4.3rem] md:text-[5.7rem] lg:text-[6.8rem]"
            style={{
              fontFamily: headlineFontFamily,
              fontStyle: isNoirModern ? "normal" : "italic",
              color: isNoirModern ? colors.secondary : colors.text,
              textTransform: isNoirModern ? "uppercase" : "none",
              letterSpacing: isNoirModern ? "0.04em" : "-0.05em",
            }}
          >
            {headline}
          </h1>
          <div
            className="mx-auto mt-5 h-[4px] w-44 rounded-full opacity-50"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${colors.primary} 18%, ${colors.accent} 50%, ${colors.primary} 82%, transparent 100%)`,
            }}
          />
        </div>
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 pt-8 md:pt-10 lg:grid-cols-12 lg:items-start lg:gap-10 lg:px-8">
        <div className="space-y-8 lg:col-span-8">
          <section
            className="overflow-hidden rounded-[2.2rem] p-6 shadow-[0_24px_80px_rgba(37,26,10,0.08)] backdrop-blur md:p-10"
            style={{
              backgroundColor: sectionBackground,
              border: `1px solid ${thinBorderColor}`,
              boxShadow: isNoirModern
                ? `0 28px 90px color-mix(in oklab, ${colors.secondary} 16%, rgba(0,0,0,0.38))`
                : `0 28px 90px color-mix(in oklab, ${colors.primary} 28%, rgba(37,26,10,0.08))`,
            }}
          >
            <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-12">
              <div className="space-y-10">
                <DetailItem
                  icon={<Calendar className="h-5 w-5" />}
                  label="When"
                  title={displayDate}
                  colors={colors}
                  darkMode={isNoirModern}
                />
                {displayTime ? (
                  <DetailItem
                    icon={<Clock className="h-5 w-5" />}
                    label="At"
                    title={displayTime}
                    colors={colors}
                    darkMode={isNoirModern}
                  />
                ) : null}
              </div>
              <DetailItem
                icon={<MapPin className="h-5 w-5" />}
                label="Where"
                title={displayVenueName || "The Venue"}
                subtitle={displayVenueName ? undefined : displayLocation}
                colors={colors}
                darkMode={isNoirModern}
              />
            </div>

            {timelineRows.length > 0 ? (
              <div className="mt-10 pt-10" style={{ borderTop: `1px solid ${thinBorderColor}` }}>
                <div
                  className="mb-8 text-[11px] font-semibold uppercase tracking-[0.34em]"
                  style={{ color: colors.accent }}
                >
                  Event Schedule
                </div>
                <div className="space-y-5">
                  {timelineRows.map((row) => (
                    <ScheduleRow
                      key={`${row.time}-${row.title}`}
                      time={row.time}
                      title={row.title}
                      colors={colors}
                      darkMode={isNoirModern}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          {showRsvpSection ? (
            <section
              className="overflow-hidden rounded-[2.2rem] p-6 shadow-[0_24px_80px_rgba(37,26,10,0.08)] backdrop-blur md:p-10"
              style={{
                backgroundColor: sectionBackground,
                border: `1px solid ${thinBorderColor}`,
                boxShadow: isNoirModern
                  ? `0 24px 78px color-mix(in oklab, ${colors.secondary} 14%, rgba(0,0,0,0.36))`
                  : `0 24px 78px color-mix(in oklab, ${colors.primary} 22%, rgba(37,26,10,0.08))`,
              }}
            >
              <div
                className="mb-6 text-[11px] font-semibold uppercase tracking-[0.34em]"
                style={{ color: colors.accent }}
              >
                RSVP
              </div>
              <div className="grid gap-5 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-start">
                <div className="space-y-3">
                  <div
                    className="text-[2rem] leading-[1.05] md:text-[2.4rem]"
                    style={{ fontFamily: headlineFontFamily }}
                  >
                    Let The Couple Know
                  </div>
                  <div
                    className="max-w-md text-[0.98rem] font-light leading-relaxed"
                    style={{ color: mutedTextColor }}
                  >
                    Reply directly from the event page.
                  </div>
                  {rsvpDeadline?.trim() ? (
                    <div
                      className="text-sm font-medium tracking-[0.08em] uppercase"
                      style={{
                        color: isNoirModern ? "rgba(255,255,255,0.76)" : "rgba(0,0,0,0.55)",
                      }}
                    >
                      RSVP by {rsvpDeadline.trim()}
                    </div>
                  ) : null}
                </div>
                <div
                  className="rounded-[1.8rem] p-4 md:p-5"
                  style={{
                    border: `1px solid ${thinBorderColor}`,
                    background: isNoirModern
                      ? `linear-gradient(180deg, rgba(20,26,40,0.96) 0%, ${colors.primary} 180%)`
                      : `linear-gradient(180deg, white 0%, ${colors.secondary} 140%)`,
                  }}
                >
                  {hasRsvp ? (
                    <EventRsvpPrompt
                      eventId={eventId}
                      rsvpName={rsvpName}
                      rsvpPhone={null}
                      rsvpEmail={null}
                      rsvpUrl={rsvpUrl}
                      eventTitle={title}
                      eventCategory="Wedding"
                      shareUrl={previewMode ? null : shareUrl}
                      variant="wedding-scan"
                    />
                  ) : (
                    <RsvpPreviewCard
                      colors={colors}
                      text={rsvpPreviewText}
                      darkMode={isNoirModern}
                    />
                  )}
                </div>
              </div>
            </section>
          ) : null}

          <div
            className={`grid grid-cols-1 gap-5 ${showPublicShareAction && !previewMode ? "md:grid-cols-4" : "md:grid-cols-3"}`}
          >
            <ActionCard
              title="Save Event"
              subtitle="Sync to calendar"
              icon={<Calendar className="h-6 w-6" />}
              colors={colors}
              darkMode={isNoirModern}
              disabled={!calendarLinks || previewMode}
              onClick={() => setShowCalendarMenu(true)}
            />
            <ActionCard
              title="Concierge"
              subtitle="Map and access"
              icon={<MapPin className="h-6 w-6" />}
              colors={colors}
              darkMode={isNoirModern}
              disabled={!location || previewMode}
              onClick={handleConcierge}
            />
            <ActionCard
              title="The Keepsake"
              subtitle="Download card"
              icon={<Download className="h-6 w-6" />}
              colors={colors}
              darkMode={isNoirModern}
              disabled={!imageUrl || previewMode}
              onClick={handleDownload}
            />
            {showPublicShareAction && !previewMode ? (
              <ActionCard
                title="Public Share"
                subtitle="Anyone can open link"
                icon={<Share2 className="h-6 w-6" />}
                colors={colors}
                darkMode={isNoirModern}
                disabled={false}
                onClick={handleShare}
              />
            ) : null}
          </div>

          {hasRegistries ? (
            <section
              className="overflow-hidden rounded-[2.2rem] p-6 shadow-[0_24px_80px_rgba(37,26,10,0.08)] backdrop-blur md:p-10"
              style={{
                backgroundColor: sectionBackground,
                border: `1px solid ${thinBorderColor}`,
                boxShadow: isNoirModern
                  ? `0 24px 78px color-mix(in oklab, ${colors.secondary} 12%, rgba(0,0,0,0.36))`
                  : `0 24px 78px color-mix(in oklab, ${colors.primary} 18%, rgba(37,26,10,0.08))`,
              }}
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <div
                    className="text-[11px] font-semibold uppercase tracking-[0.34em]"
                    style={{ color: colors.accent }}
                  >
                    Registry
                  </div>
                  <div
                    className="mt-3 text-[2rem] leading-[1.05] md:text-[2.4rem]"
                    style={{ fontFamily: headlineFontFamily }}
                  >
                    Wedding Gifts
                  </div>
                </div>
                <div
                  className="max-w-sm text-[0.95rem] font-light leading-relaxed"
                  style={{ color: mutedTextColor }}
                >
                  Registry links appear only when the invitation details include them.
                </div>
              </div>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {registryCards.map((link) => (
                  <a
                    key={link.url}
                    href={previewMode ? undefined : link.url}
                    target={previewMode ? undefined : "_blank"}
                    rel={previewMode ? undefined : "noopener noreferrer"}
                    onClick={(event) => {
                      if (previewMode) event.preventDefault();
                    }}
                    className="group flex items-start gap-4 rounded-[1.7rem] border border-black/5 bg-white px-4 py-4 shadow-[0_14px_40px_rgba(37,26,10,0.06)] transition hover:-translate-y-0.5"
                    style={{
                      borderColor: thinBorderColor,
                      backgroundColor: actionBackground,
                    }}
                  >
                    <span
                      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                      style={{
                        backgroundColor: link.accentColor,
                        color: link.textColor,
                      }}
                      aria-hidden="true"
                    >
                      {link.badgeText}
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block text-[13px] font-semibold uppercase tracking-[0.18em]"
                        style={{
                          color: isNoirModern ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.85)",
                        }}
                      >
                        {link.label}
                      </span>
                      <span
                        className="mt-2 block truncate text-sm"
                        style={{ color: mutedTextColor }}
                      >
                        {link.brandLabel || link.host}
                      </span>
                    </span>
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          <OcrFactCards
            facts={displayOcrFacts}
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
            cardClassName="rounded-[2rem] p-6 shadow-[0_18px_58px_rgba(37,26,10,0.08)] backdrop-blur"
            labelColor={colors.accent}
            valueColor={isNoirModern ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.82)"}
            backgroundColor={sectionBackground}
            borderColor={thinBorderColor}
          />
        </div>

        <aside className="lg:col-span-4 lg:sticky lg:top-10">
          <section
            className="overflow-hidden rounded-[2.4rem] p-5 shadow-[0_24px_80px_rgba(37,26,10,0.12)]"
            style={{
              backgroundColor: asideBackground,
              border: `1px solid ${thinBorderColor}`,
              boxShadow: isNoirModern
                ? `0 28px 88px color-mix(in oklab, ${colors.secondary} 14%, rgba(0,0,0,0.45))`
                : `0 28px 88px color-mix(in oklab, ${colors.primary} 30%, rgba(37,26,10,0.12))`,
            }}
          >
            <button
              type="button"
              onClick={handleOpenLightbox}
              className="block w-full rounded-[1.8rem] border-0 p-3 text-left transition hover:scale-[1.01]"
              aria-label="Open invitation preview"
              style={{ backgroundColor: colors.primary }}
            >
              <div className="overflow-hidden rounded-[1.45rem] border border-black/5 bg-white">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={`${title} invitation`}
                    className="h-auto w-full object-cover"
                  />
                ) : (
                  <div
                    className="aspect-[4/5] w-full"
                    style={{
                      background: `linear-gradient(180deg, ${colors.secondary} 0%, ${colors.primary} 100%)`,
                    }}
                  />
                )}
              </div>
            </button>
            <div className="mt-6 flex items-center justify-between px-1">
              <div
                className="text-[10px] uppercase tracking-[0.42em]"
                style={{ color: subtleTextColor }}
              >
                Digital Keepsake
              </div>
              <button
                type="button"
                onClick={handleShare}
                aria-label="Share event"
                className="flex h-11 w-11 items-center justify-center rounded-full transition hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-80"
                style={{
                  border: `1px solid ${thinBorderColor}`,
                  backgroundColor: isNoirModern ? "rgba(255,255,255,0.04)" : "#ffffff",
                  color: isNoirModern ? "rgba(255,255,255,0.86)" : "rgba(0,0,0,0.82)",
                  boxShadow: "0 10px 24px rgba(37,26,10,0.08)",
                }}
                disabled={previewMode}
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
            <div
              className="min-h-5 pt-2 text-right text-[10px] uppercase tracking-[0.24em]"
              style={{ color: subtleTextColor }}
            >
              {shareMessage === "copied"
                ? "Link copied"
                : shareMessage === "shared"
                  ? "Shared"
                  : ""}
            </div>
          </section>
        </aside>
      </div>

      <div className={`relative z-10 ${EVENT_SKIN_FOOTER_CLASS}`}>
        <div
          className={EVENT_SKIN_FOOTER_DIVIDER_CLASS}
          style={{ backgroundColor: isNoirModern ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)" }}
        />
        <div className={EVENT_SKIN_FOOTER_TEXT_CLASS} style={{ color: subtleTextColor }}>
          Snapped by{" "}
          <span style={{ color: isNoirModern ? "rgba(255,255,255,0.52)" : "rgba(0,0,0,0.4)" }}>
            Envitefy
          </span>
        </div>
      </div>

      {showCalendarMenu && calendarLinks ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-5 py-8">
          <button
            type="button"
            aria-label="Dismiss calendar menu"
            onClick={() => setShowCalendarMenu(false)}
            className="absolute inset-0 bg-[rgba(28,23,18,0.42)] backdrop-blur-sm"
          />
          <div
            className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] border border-black/5 bg-white p-7 shadow-[0_28px_90px_rgba(37,26,10,0.24)]"
            style={{
              backgroundImage: `linear-gradient(135deg, ${colors.secondary} 0%, white 82%)`,
            }}
          >
            <div
              className="absolute right-0 top-0 h-24 w-24 rounded-bl-[2rem] opacity-50"
              style={{ backgroundColor: colors.primary }}
            />
            <div
              className="relative mb-6 text-[11px] font-semibold uppercase tracking-[0.34em]"
              style={{ color: colors.accent }}
            >
              Select Calendar
            </div>
            <div className="relative space-y-3">
              <CalendarLinkRow
                href={calendarLinks.google}
                label="Google Calendar"
                tone="#2563eb"
                onChoose={() => setShowCalendarMenu(false)}
              />
              <CalendarLinkRow
                href={calendarLinks.outlook}
                label="Outlook Web"
                tone="#0891b2"
                onChoose={() => setShowCalendarMenu(false)}
              />
              <CalendarLinkRow
                href={calendarLinks.appleInline}
                label="Apple"
                tone="#111827"
                onChoose={() => setShowCalendarMenu(false)}
              />
            </div>
            <button
              type="button"
              onClick={() => setShowCalendarMenu(false)}
              className="relative mt-8 w-full py-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-black/35 transition hover:text-black/60"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      {showImageLightbox && imageUrl ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-6">
          <button
            type="button"
            aria-label="Close invitation preview"
            onClick={() => setShowImageLightbox(false)}
            className="absolute inset-0 bg-[rgba(18,15,12,0.78)] backdrop-blur-md"
          />
          <div className="relative max-h-full w-full max-w-5xl">
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
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RsvpPreviewCard({
  colors,
  text,
  darkMode = false,
}: {
  colors: ReturnType<typeof normalizeWeddingFlyerColors>;
  text?: string | null;
  darkMode?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div
        className="text-sm leading-relaxed"
        style={{ color: darkMode ? "rgba(255,255,255,0.72)" : "rgba(0,0,0,0.45)" }}
      >
        {text?.trim() || "RSVP responses will appear here in the live wedding invite experience."}
      </div>
      <div className="flex flex-wrap gap-3">
        {["Yes", "No", "Maybe"].map((label) => (
          <button
            key={label}
            type="button"
            disabled
            className="rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em]"
            style={{
              border: `1px solid ${darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.05)"}`,
              backgroundColor: darkMode ? "rgba(255,255,255,0.04)" : "#ffffff",
              color: darkMode ? "rgba(255,255,255,0.78)" : "rgba(0,0,0,0.65)",
              boxShadow: `0 10px 22px color-mix(in oklab, ${colors.primary} 28%, rgba(37,26,10,0.05))`,
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function DetailItem({
  icon,
  label,
  title,
  subtitle,
  colors,
  darkMode = false,
}: {
  icon: ReactNode;
  label: string;
  title: string;
  subtitle?: string;
  colors: ReturnType<typeof normalizeWeddingFlyerColors>;
  darkMode?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div
        className="flex items-center gap-3"
        style={{ color: darkMode ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.3)" }}
      >
        <div style={{ color: colors.accent }}>{icon}</div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.28em]">{label}</span>
      </div>
      <div
        className="text-[2.3rem] leading-[1.05] md:text-[2.8rem]"
        style={{
          fontFamily: darkMode
            ? 'var(--font-geist-sans), "Helvetica Neue", Arial, sans-serif'
            : 'var(--font-playfair), "Times New Roman", serif',
          color: darkMode ? "rgba(255,255,255,0.95)" : undefined,
          textTransform: darkMode ? "uppercase" : "none",
          letterSpacing: darkMode ? "0.04em" : undefined,
        }}
      >
        {title}
      </div>
      {subtitle ? (
        <div
          className="max-w-md text-[1rem] font-light leading-relaxed"
          style={{ color: darkMode ? "rgba(255,255,255,0.72)" : "rgba(0,0,0,0.45)" }}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}

function ScheduleRow({
  time,
  title,
  colors,
  darkMode = false,
}: {
  time: string;
  title: string;
  colors: ReturnType<typeof normalizeWeddingFlyerColors>;
  darkMode?: boolean;
}) {
  return (
    <div className="flex items-center gap-6">
      <div
        className="w-24 text-[11px] font-semibold uppercase tracking-[0.36em]"
        style={{ color: darkMode ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.18)" }}
      >
        {time}
      </div>
      <div className="flex-1 border-l pl-6 py-2" style={{ borderColor: colors.primary }}>
        <div
          className="text-[1.9rem] leading-none md:text-[2.1rem]"
          style={{
            fontFamily: darkMode
              ? 'var(--font-geist-sans), "Helvetica Neue", Arial, sans-serif'
              : 'var(--font-playfair), "Times New Roman", serif',
            color: darkMode ? "rgba(255,255,255,0.94)" : undefined,
            textTransform: darkMode ? "uppercase" : "none",
            letterSpacing: darkMode ? "0.02em" : undefined,
          }}
        >
          {title}
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  title,
  subtitle,
  icon,
  onClick,
  colors,
  darkMode = false,
  disabled = false,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  onClick: () => void;
  colors: ReturnType<typeof normalizeWeddingFlyerColors>;
  darkMode?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-[2rem] p-7 text-left shadow-[0_16px_46px_rgba(37,26,10,0.08)] transition hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        border: `1px solid ${darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.05)"}`,
        backgroundColor: darkMode ? "rgba(10,14,24,0.9)" : "#ffffff",
      }}
    >
      <div
        className="mb-6 flex h-14 w-14 items-center justify-center rounded-[1.25rem]"
        style={{ backgroundColor: colors.primary, color: colors.accent }}
      >
        {icon}
      </div>
      <div
        className="text-[13px] font-semibold uppercase tracking-[0.22em]"
        style={{ color: darkMode ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.9)" }}
      >
        {title}
      </div>
      <div
        className="mt-1 text-[10px] uppercase tracking-[0.24em]"
        style={{ color: darkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)" }}
      >
        {subtitle}
      </div>
    </button>
  );
}

function CalendarLinkRow({
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
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onChoose}
      className="flex items-center gap-4 rounded-[1.35rem] px-3 py-4 transition hover:bg-black/[0.03]"
    >
      <div
        className="flex h-11 w-11 items-center justify-center rounded-[1rem]"
        style={{ backgroundColor: `${tone}12`, color: tone }}
      >
        {label === "Apple Calendar" ? (
          <Download className="h-5 w-5" />
        ) : (
          <Calendar className="h-5 w-5" />
        )}
      </div>
      <span className="text-[13px] font-semibold uppercase tracking-[0.2em] text-black/90">
        {label}
      </span>
    </a>
  );
}
