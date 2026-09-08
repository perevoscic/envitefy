"use client";
import BridalShowerPreview from "@/components/templates/BridalShowerPreview";

import EventGuestPlanningNotes from "@/components/event-templates/EventGuestPlanningNotes";
import { parseEventGuestDate, normalizeEventGuestPlanning } from "@/lib/event-guest-planning";
import EnvitefyEventBranding from "@/components/branding/EnvitefyEventBranding";

import BabyShowerDesignHero, { babyShowerDesignStyle } from "@/components/baby-showers/BabyShowerDesignHero";
import { getBabyShowerDesign, getBabyShowerTheme, isBabyShowerDesignDark, resolveBabyShowerHero } from "@/lib/baby-shower-designs";
import babyStyles from "@/components/baby-showers/baby-shower-designs.module.css";
import Link from "next/link";
import { useState } from "react";
import type { CSSProperties } from "react";
import { Check, X as XIcon } from "lucide-react";
import EventActions from "@/components/EventActions";
import EventDeleteModal from "@/components/EventDeleteModal";
import { attachAmazonAffiliateTag } from "@/lib/affiliate/amazon";

const DEFAULT_HERO_IMAGE = "/templates/hero-images/baby-shower-hero.jpeg";

// Theme catalog - must match the one in customize page
const DESIGN_THEMES = [
  {
    id: "soft_neutrals",
    name: "Soft Neutrals",
    category: "Classic",
    bg: "bg-[#fdfbf7]",
    text: "text-slate-900",
    accent: "text-slate-600",
    previewColor: "bg-[#fdfbf7]",
  },
  {
    id: "blush_pink",
    name: "Blush Pink",
    category: "Sweet",
    bg: "bg-[#fff1f2]",
    text: "text-[#881337]",
    accent: "text-[#e11d48]",
    previewColor: "bg-[#ffe4e6]",
  },
  {
    id: "sage_green",
    name: "Sage Green",
    category: "Botanical",
    bg: "bg-[#f0fdf4]",
    text: "text-[#1e293b]",
    accent: "text-[#3f6212]",
    previewColor: "bg-[#dcfce7]",
  },
  {
    id: "lavender",
    name: "Lavender",
    category: "Botanical",
    bg: "bg-[#fdf4ff]",
    text: "text-[#581c87]",
    accent: "text-[#a855f7]",
    previewColor: "bg-[#f3e8ff]",
  },
  {
    id: "baby_blue",
    name: "Baby Blue",
    category: "Classic",
    bg: "bg-[#eff6ff]",
    text: "text-[#1e3a8a]",
    accent: "text-[#3b82f6]",
    previewColor: "bg-[#dbeafe]",
  },
  {
    id: "sunrise_sorbet",
    name: "Sunrise Sorbet",
    category: "Gradient",
    bg: "",
    bgStyle: {
      backgroundImage: "linear-gradient(135deg, #ffe0c8 0%, #ffb3c0 40%, #ff9fe1 80%)",
    },
    text: "text-slate-900",
    accent: "text-[#d14b8f]",
    previewColor: "",
    previewStyle: {
      backgroundImage: "linear-gradient(135deg, #ffe8d8, #ffc7d9, #ffb5ef)",
    },
  },
  {
    id: "minty_aurora",
    name: "Minty Aurora",
    category: "Gradient",
    bg: "",
    bgStyle: {
      backgroundImage: "linear-gradient(145deg, #b7f8d0 0%, #9fe9ff 50%, #d4c6ff 100%)",
    },
    text: "text-slate-900",
    accent: "text-[#0f766e]",
    previewColor: "",
    previewStyle: {
      backgroundImage: "linear-gradient(145deg, #c7fce0, #b7f0ff, #e5dbff)",
    },
  },
  {
    id: "golden_hour",
    name: "Golden Hour",
    category: "Warm Glow",
    bg: "",
    bgStyle: {
      backgroundImage: "linear-gradient(135deg, #fff3d6 0%, #ffd59f 55%, #f7b267 100%)",
    },
    text: "text-[#5c2c00]",
    accent: "text-[#d97706]",
    previewColor: "",
    previewStyle: {
      backgroundImage: "linear-gradient(135deg, #fff7e5, #ffe1b8, #f8c089)",
    },
  },
] as const;

type Props = {
  eventId: string;
  eventTitle: string;
  eventData: any;
  shareUrl: string;
  isOwner: boolean;
  canEdit?: boolean;
  isReadOnly: boolean;
  editHref: string;
  preview?: boolean;
  thumbnail?: boolean;
};

const detailSections = [
  { id: "details", label: "Details" },
  { id: "gallery", label: "Gallery" },
  { id: "registry", label: "Registry" },
  { id: "rsvp", label: "RSVP" },
];

function formatDate(value?: string | null): string | null {
  if (!value) return null;
  try {
    const parsed = parseEventGuestDate(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

function isDarkBackground(bg?: string): boolean {
  if (!bg) return false;
  const lower = bg.toLowerCase();
  const darkTokens = ["black", "navy", "midnight"];
  if (darkTokens.some((token) => lower.includes(token))) return true;
  if (/bg-(?:slate|stone|neutral|gray|indigo|purple)-(?:[789]00|950)\b/.test(lower)) return true;
  const hex = lower.match(/#([0-9a-f]{6})\b/)?.[1];
  if (hex) {
    const red = Number.parseInt(hex.slice(0, 2), 16);
    const green = Number.parseInt(hex.slice(2, 4), 16);
    const blue = Number.parseInt(hex.slice(4, 6), 16);
    return 0.299 * red + 0.587 * green + 0.114 * blue < 128;
  }
  return false;
}

export default function BabyShowerTemplateView({
  eventId,
  eventTitle,
  eventData,
  shareUrl,
  isOwner,
  canEdit: canEditProp,
  isReadOnly,
  editHref,
  preview = false,
  thumbnail = false,
}: Props) {
  const isBridal = eventData?.occasion === "bridal-shower";
  const canEdit = canEditProp ?? isOwner;
  const design = isBridal ? undefined : getBabyShowerDesign(eventData?.templateId);
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [rsvpAttending, setRsvpAttending] = useState<boolean | null>(null);
  const [rsvpName, setRsvpName] = useState("");

  const heroImage = isBridal ? eventData?.heroImage || DEFAULT_HERO_IMAGE : resolveBabyShowerHero(eventData?.heroImage, design);
  // Get theme from saved data - saved theme should have all properties (bg, text, accent, bgStyle, name, etc.)
  const savedTheme = { ...(design ? getBabyShowerTheme(design) : {}), ...eventData?.theme };
  const themeId = eventData?.themeId || savedTheme?.themeId || savedTheme?.id;

  // If saved theme is missing critical properties, look it up from DESIGN_THEMES as fallback
  const themeFromCatalog = themeId ? DESIGN_THEMES.find((t) => t.id === themeId) : null;

  // Use saved theme if it has the essential properties, otherwise merge with catalog
  const hasSavedBg = savedTheme.bg || savedTheme.bgStyle;
  const theme =
    hasSavedBg && savedTheme.text && savedTheme.accent
      ? {
          // Use saved theme directly - it has all the properties we need
          ...savedTheme,
          id: themeId || savedTheme.id,
          themeId: themeId || savedTheme.themeId || savedTheme.id,
        }
      : themeFromCatalog
        ? {
            // Fallback: merge catalog with saved (saved takes precedence)
            ...themeFromCatalog,
            ...savedTheme,
            id: themeId,
            themeId: themeId,
            name: savedTheme.name || themeFromCatalog.name,
          }
        : savedTheme;

  const textClass = typeof theme?.text === "string" ? theme.text : "text-slate-900";
  const accentClass = typeof theme?.accent === "string" ? theme.accent : "text-slate-500";

  // For gradient themes, bg might be empty and bgStyle contains the gradient
  // For solid color themes, bg contains the Tailwind class
  const hasBgStyle = theme?.bgStyle && typeof theme.bgStyle === "object";
  const backgroundClass = hasBgStyle
    ? "" // Don't apply bg class when using bgStyle
    : typeof theme?.bg === "string" && theme.bg
      ? theme.bg
      : "bg-white";
  const backgroundStyle = hasBgStyle ? (theme.bgStyle as CSSProperties) : undefined;
  const headingFont = eventData?.fontFamily || (theme as any)?.fontFamily || "var(--font-playfair)";
  const heroTitleClass =
    eventData?.fontSizeClass ||
    (theme as any)?.fontSizeClass ||
    (theme as any)?.fontSizeH1 ||
    "text-3xl md:text-5xl leading-tight";
  const titleStyle: CSSProperties = { fontFamily: headingFont };
  if (isDarkBackground(theme?.bg) && !titleStyle.color) {
    titleStyle.color = "#fef3c7";
  }

  const hosts = Array.isArray(eventData?.hosts) ? eventData.hosts : [];
  const gallery = Array.isArray(eventData?.gallery) ? eventData.gallery : [];
  const registries = Array.isArray(eventData?.registries) ? eventData.registries : [];
  const rsvp = eventData?.rsvp || {};
  const customFields = eventData?.customFields || {};
  const locationLabel =
    customFields.location ||
    [eventData?.address, eventData?.city, eventData?.state].filter(Boolean).join(", ");
  const expectingDate = isBridal ? null : customFields.expectingDate || eventData?.babyDetails?.expectingDate;
  const gender = isBridal ? null : customFields.gender || eventData?.babyDetails?.gender;
  const babyNote = customFields.aboutBaby || eventData?.babyDetails?.notes || "";
  const momNote = customFields.aboutMom || eventData?.momDetails?.notes || "";
  const rsvpDeadline = customFields.rsvpDeadline || (rsvp?.deadline && String(rsvp.deadline));

  const startIso =
    eventData?.startISO || eventData?.start || eventData?.date
      ? eventData.startISO || eventData.start
      : null;
  const startDate =
    typeof startIso === "string" && startIso
      ? parseEventGuestDate(startIso)
      : eventData?.date
        ? new Date(`${eventData.date}T${eventData?.time || "14:00"}:00`)
        : null;
  const dateLabel = startDate
    ? startDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;
  const timeLabel = startDate
    ? startDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;
  const endDate = eventData.endISO || eventData.end || eventData.endAt;
  const parsedEnd = typeof endDate === "string" ? new Date(endDate) : null;
  const endLabel = parsedEnd && !Number.isNaN(parsedEnd.getTime())
    ? parsedEnd.toLocaleString("en-US", { ...(startDate && parsedEnd.toDateString() !== startDate.toDateString() ? { month: "short", day: "numeric" } : {}), hour: "numeric", minute: "2-digit" })
    : null;

  const navItems = detailSections
    .map((item) => {
      if (item.id === "gallery" && gallery.length === 0) return null;
      if (item.id === "registry" && registries.length === 0) return null;
      if (item.id === "rsvp" && !rsvp?.isEnabled && !rsvpDeadline) return null;
      return item;
    })
    .filter(Boolean) as typeof detailSections;
  const hasRsvpSection = Boolean(rsvp?.isEnabled || rsvpDeadline);

  const inverse = design ? isBabyShowerDesignDark(design) : isDarkBackground(theme?.bg);
  return (
    <main className={design ? babyStyles.page : "event-modern-page font-sans text-slate-900"} style={design ? babyShowerDesignStyle(design) : undefined}>
      <div className={design ? "w-full" : "event-modern-container"}>
        <div className={design ? "w-full" : "mx-auto flex w-full max-w-5xl flex-col py-6 md:py-10"}>
          <div
            className={design ? babyStyles.shell : `relative overflow-hidden rounded-[32px] shadow-[0_35px_120px_rgba(15,23,42,0.25)] ${backgroundClass}`}
            style={backgroundStyle}
          >
            {isBridal ? <BridalShowerPreview headerOnly templateId={eventData.templateId} data={{ ...eventData, theme, images: { hero: heroImage } }} /> : design ? (
              <BabyShowerDesignHero
                design={design}
                babyName={eventData?.babyName}
                momName={eventData?.momName}
                eventTitle={eventTitle}
                heroImage={heroImage}
                dateLabel={dateLabel}
                timeLabel={timeLabel ? `${timeLabel}${endLabel ? ` – ${endLabel}` : ""}` : null}
                location={locationLabel}
                fontFamily={eventData?.fontFamily || theme?.fontFamily}
                eventId={eventId}
                shareUrl={shareUrl}
                start={startDate && !Number.isNaN(startDate.getTime()) ? startDate.toISOString() : undefined}
                end={eventData.endISO || eventData.end || eventData.endAt}
                preview={preview}
                thumbnail={thumbnail}
                fontSize={eventData.fontSize || eventData.theme?.fontSize}
                ownerActions={!isReadOnly && (canEdit || isOwner) ? <>
                  {canEdit && <Link href={editHref} className="rounded-full border border-current px-4 py-2 text-xs">Edit</Link>}
                  {isOwner && <EventDeleteModal eventId={eventId} eventTitle={eventTitle} />}
                </> : undefined}
              />
            ) : (<>
            {/* Header */}
            <div className={`px-6 md:px-10 pt-8 pb-4 border-b border-white/10 ${textClass}`}>
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h1 className={`font-semibold ${heroTitleClass}`} style={titleStyle}>
                    {isBridal ? eventTitle : eventData?.babyName ? `${eventData.babyName}'s Baby Shower` : eventTitle}
                  </h1>
                  <div className="flex flex-wrap gap-3 text-sm font-semibold uppercase tracking-[0.4em] opacity-80">
                    {dateLabel && <span>{dateLabel}</span>}
                    {timeLabel && <span>{timeLabel}{endLabel ? ` – ${endLabel}` : ""}</span>}
                    {locationLabel && <span>{locationLabel}</span>}
                  </div>
                </div>
                {!isReadOnly && (canEdit || isOwner) && (
                  <div className="flex items-center gap-2">
                    {canEdit && (
                      <Link
                        href={editHref}
                        className="rounded-full border border-white/60 bg-white/80 px-4 py-1.5 text-sm font-semibold text-slate-800 transition hover:border-slate-300"
                      >
                        Edit
                      </Link>
                    )}
                    {isOwner && <EventDeleteModal eventId={eventId} eventTitle={eventTitle} />}
                  </div>
                )}
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative h-[420px] w-full">
              <img src={heroImage} alt="Hero" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/30"></div>
            </div>

            </>)}
            <div className={design ? babyStyles.body : undefined} data-style={design?.style}>
            {/* Navigation */}
            {!thumbnail && navItems.length > 0 && (
              <nav className={design ? undefined : "border-t border-white/10 bg-white/80 px-4 py-3 backdrop-blur-lg"}>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {navItems.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={design ? "underline underline-offset-4" : "rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-slate-600 transition hover:border-slate-400 hover:text-slate-900"}
                      style={{ fontFamily: headingFont }}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </nav>
            )}

            <EventGuestPlanningNotes value={normalizeEventGuestPlanning(eventData.guestPlanning)} inverse={inverse} />

            <span id="details" />
            {/* Hosted By Section */}
            {hosts.length > 0 && (
              <section className={`text-center py-12 border-t border-white/10 ${textClass}`}>
                <h2 className={`text-2xl mb-6 ${accentClass}`} style={{ fontFamily: headingFont }}>
                  Hosted By
                </h2>
                <div className="flex flex-wrap justify-center gap-6">
                  {hosts.map((host: any) => (
                    <div key={host.id || host.name} className="text-center">
                      <div className="font-semibold text-lg mb-1 opacity-90">{host.name}</div>
                      {host.role && <div className="text-sm opacity-70">{host.role}</div>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Location Section */}
            {locationLabel && (
              <section className={`text-center py-12 border-t border-white/10 ${textClass}`}>
                <h2 className={`text-2xl mb-4 ${accentClass}`} style={{ fontFamily: headingFont }}>
                  Location
                </h2>
                <div className="opacity-80">{locationLabel}</div>
              </section>
            )}

            {/* Info Fields Section - Expected Arrival, Baby's Gender, RSVP By */}
            {(expectingDate || gender || rsvpDeadline) && (
              <div
                className={`px-6 md:px-10 py-6 md:py-8 border-t border-white/10 space-y-6 text-center ${textClass}`}
              >
                {expectingDate && (
                  <div className="flex flex-col gap-1 items-center">
                    <span className="text-xs uppercase tracking-[0.4em] opacity-70">
                      Expected Arrival
                    </span>
                    <p className="text-lg font-semibold opacity-90">{formatDate(expectingDate)}</p>
                  </div>
                )}

                {gender && (
                  <div className="flex flex-col gap-1 items-center">
                    <span className="text-xs uppercase tracking-[0.4em] opacity-70">
                      Baby's Gender
                    </span>
                    <p className="text-lg font-semibold opacity-90">{gender}</p>
                  </div>
                )}

                {rsvpDeadline && (
                  <div className="flex flex-col gap-1 items-center">
                    <span className="text-xs uppercase tracking-[0.4em] opacity-70">RSVP By</span>
                    <p className="text-lg font-semibold opacity-90">{formatDate(rsvpDeadline)}</p>
                  </div>
                )}
              </div>
            )}

            {/* {isBridal ? "Celebration details" : "About Baby"} Section */}
            {babyNote && (
              <section
                className={`max-w-2xl mx-auto text-center p-6 md:p-8 border-t border-white/10 ${textClass}`}
              >
                <h2
                  className={`${heroTitleClass.replace(
                    "text-3xl md:text-5xl",
                    "text-2xl md:text-3xl",
                  )} mb-4 ${accentClass}`}
                  style={{ fontFamily: headingFont }}
                >
                  {isBridal ? "Celebration details" : "About Baby"}
                </h2>
                <p
                  className={`text-sm md:text-base leading-relaxed opacity-90 whitespace-pre-wrap`}
                >
                  {babyNote}
                </p>
              </section>
            )}

            {/* About Mom Section */}
            {momNote && (
              <section
                className={`max-w-2xl mx-auto text-center p-6 md:p-8 border-t border-white/10 ${textClass}`}
              >
                <h2
                  className={`${heroTitleClass.replace(
                    "text-3xl md:text-5xl",
                    "text-2xl md:text-3xl",
                  )} mb-4 ${accentClass}`}
                  style={{ fontFamily: headingFont }}
                >
                  About {eventData?.momName || "Mom"}
                </h2>
                <p
                  className={`text-sm md:text-base leading-relaxed opacity-90 whitespace-pre-wrap`}
                >
                  {momNote}
                </p>
              </section>
            )}

            <span id="gallery" />
            {/* Gallery Section */}
            {gallery.length > 0 && (
              <section className={`py-12 border-t border-white/10 ${textClass}`}>
                <h2
                  className={`text-2xl mb-6 text-center ${accentClass}`}
                  style={{ fontFamily: headingFont }}
                >
                  Photo Gallery
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto px-4">
                  {gallery.map((img: any) => (
                    <div key={img.id || img.url} className="relative aspect-square">
                      <img
                        src={img.url}
                        alt={img.caption || "Gallery"}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      {img.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 rounded-b-lg">
                          {img.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <span id="registry" />
            {/* Registry Section */}
            {registries.length > 0 && (
              <section className={`text-center py-12 border-t border-white/10 ${textClass}`}>
                <h2 className={`text-2xl mb-6 ${accentClass}`} style={{ fontFamily: headingFont }}>
                  Registry
                </h2>
                <div className="flex flex-wrap justify-center gap-4">
                  {registries.map((registry: any) => (
                    <a
                      key={registry.id || registry.url}
                      href={attachAmazonAffiliateTag(registry.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block px-6 py-3 bg-white/10 border border-white/20 rounded-full hover:bg-white/20 transition-colors"
                    >
                      <span className="uppercase tracking-widest text-sm font-semibold">
                        {registry.label || "Registry"}
                      </span>
                    </a>
                  ))}
                </div>
              </section>
            )}

            <span id="rsvp" />
            {/* RSVP Section */}
            {hasRsvpSection && (
              <section
                className={`max-w-3xl mx-auto text-center px-4 md:px-0 py-12 border-t border-white/10 ${textClass}`}
              >
                <h2
                  className={`${heroTitleClass.replace(
                    "text-3xl md:text-5xl",
                    "text-2xl md:text-3xl",
                  )} mb-6 ${accentClass}`}
                  style={{ fontFamily: headingFont }}
                >
                  RSVP
                </h2>
                <div className="bg-white/5 border border-white/10 p-8 md:p-10 rounded-xl text-left">
                  {!rsvpSubmitted ? (
                    <>
                      <div className="text-center mb-4">
                        <p className="opacity-80">
                          {rsvpDeadline
                            ? `Kindly respond by ${formatDate(rsvpDeadline)}`
                            : "Please RSVP"}
                        </p>
                      </div>
                      <div className="space-y-6">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider opacity-70 mb-2">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={rsvpName}
                            onChange={(e) => setRsvpName(e.target.value)}
                            className="w-full p-4 rounded-lg bg-white/10 border border-white/20 focus:border-white/50 outline-none transition-colors text-inherit placeholder:text-inherit/30"
                            placeholder="Guest Name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider opacity-70 mb-3">
                            Will you be attending?
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <label className="group relative cursor-pointer">
                              <input
                                type="radio"
                                name="baby-rsvp"
                                className="peer sr-only"
                                checked={rsvpAttending === true}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setRsvpAttending(true);
                                }}
                              />
                              <div className="p-5 rounded-xl border-2 border-white/20 bg-white/10 hover:bg-white/20 transition-all flex items-start gap-3 peer-checked:border-current peer-checked:bg-white/25">
                                <div className="mt-0.5">
                                  <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center">
                                    <div className="w-3 h-3 rounded-full bg-current opacity-0 peer-checked:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                                <div className="text-left">
                                  <div className="flex items-center gap-2 font-semibold text-base">
                                    <Check size={18} className="text-current" />
                                    Yes, I'll be there!
                                  </div>
                                  <p className="text-sm opacity-70">We'll celebrate with you.</p>
                                </div>
                              </div>
                            </label>
                            <label className="group relative cursor-pointer">
                              <input
                                type="radio"
                                name="baby-rsvp"
                                className="peer sr-only"
                                checked={rsvpAttending === false}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setRsvpAttending(false);
                                }}
                              />
                              <div className="p-5 rounded-xl border-2 border-white/20 bg-white/10 hover:bg-white/20 transition-all flex items-start gap-3 peer-checked:border-current peer-checked:bg-white/25">
                                <div className="mt-0.5">
                                  <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center">
                                    <div className="w-3 h-3 rounded-full bg-current opacity-0 peer-checked:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                                <div className="text-left">
                                  <div className="flex items-center gap-2 font-semibold text-base">
                                    <XIcon size={18} className="text-current" />
                                    Sorry, can't make it
                                  </div>
                                  <p className="text-sm opacity-70">Sending love from afar.</p>
                                </div>
                              </div>
                            </label>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (rsvpAttending !== null) {
                              setRsvpSubmitted(true);
                            }
                          }}
                          disabled={rsvpAttending === null}
                          className={`w-full py-4 mt-2 font-bold uppercase tracking-widest text-sm rounded-lg transition-colors shadow-lg ${
                            rsvpAttending !== null
                              ? "bg-white text-slate-900 hover:bg-slate-200"
                              : "bg-white/20 text-white/50 cursor-not-allowed"
                          }`}
                        >
                          Send RSVP
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-4">🎉</div>
                      <h3 className="text-2xl font-serif mb-2 opacity-90">Thank you!</h3>
                      <p className="opacity-70">{preview ? "Preview response recorded. Publish your invitation to receive guest RSVPs." : "Your RSVP has been sent."}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRsvpSubmitted(false);
                          setRsvpAttending(null);
                          setRsvpName("");
                        }}
                        className="text-sm underline mt-6 opacity-50 hover:opacity-100"
                      >
                        Send another response
                      </button>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Footer */}
            <footer
              className={`text-center text-xs uppercase tracking-[0.4em] px-6 md:px-10 py-8 border-t border-white/10  ${textClass}`}
            >
              <EnvitefyEventBranding category={isBridal ? "Bridal Showers" : "Baby Showers"} inverse={inverse} />
            </footer>
            </div>
          </div>
        </div>
      </div>
      {!isReadOnly && (
        <div className="event-modern-mobile-bar md:hidden">
          <div className="mx-auto flex max-w-3xl items-center gap-2">
            {hasRsvpSection && (
              <a
                href="#rsvp"
                className="inline-flex shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                RSVP
              </a>
            )}
            {canEdit && (
              <Link
                href={editHref}
                className="inline-flex shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Edit
              </Link>
            )}
            {isOwner && <EventDeleteModal eventId={eventId} eventTitle={eventTitle} />}
            <div className="min-w-0 flex-1">
              <EventActions
                shareUrl={shareUrl}
                event={eventData}
                calendarTitle={eventTitle}
                historyId={eventId}
                className="w-full justify-center"
                variant="compact"
                tone={"default" as any}
                showCalendar={false}
                showEmail={false}
              />
            </div>
          </div>
        </div>
      )}
      {!isReadOnly && <div className="event-modern-mobile-spacer md:hidden" />}
    </main>
  );
}
