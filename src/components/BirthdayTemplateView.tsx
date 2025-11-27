"use client";

import React, { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import styles from "@/components/event-create/TemplateGallery.module.css";
import {
  resolveTemplateVariation,
  type ResolvedTemplateVariation,
} from "@/components/event-create/TemplateGallery";
import {
  type BirthdayTemplateDefinition,
  birthdayTemplateCatalog,
  type TemplateLayoutConfig,
} from "@/components/event-create/BirthdayTemplateGallery";
import EventActions from "@/components/EventActions";
import EventDeleteModal from "@/components/EventDeleteModal";
import LocationLink from "@/components/LocationLink";
import EventMap from "@/components/EventMap";
import EventRsvpDashboard from "@/components/EventRsvpDashboard";
import EventRsvpPrompt from "@/components/EventRsvpPrompt";
import {
  CalendarIconApple,
  CalendarIconGoogle,
  CalendarIconOutlook,
} from "@/components/CalendarIcons";
import { combineVenueAndLocation } from "@/lib/mappers";
import { buildCalendarLinks, ensureEndIso } from "@/utils/calendar-links";
import { findFirstEmail } from "@/utils/contact";
import { extractFirstPhoneNumber } from "@/utils/phone";
import { cleanRsvpContactLabel } from "@/utils/rsvp";
import Link from "next/link";
import { resolveEditHref } from "@/utils/event-edit-route";
// Format event range display - simplified version
function formatEventRangeDisplay(
  startInput: string | null | undefined,
  endInput: string | null | undefined,
  options?: { timeZone?: string | null; allDay?: boolean }
): string | null {
  if (!startInput) return null;
  try {
    const start = new Date(startInput);
    if (Number.isNaN(start.getTime())) return null;
    const end = endInput ? new Date(endInput) : null;
    const allDay = options?.allDay ?? false;
    const tz = options?.timeZone || undefined;

    if (allDay) {
      const dateFmt = new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: tz,
      });
      const sameDay =
        !!end &&
        start.getFullYear() === end.getFullYear() &&
        start.getMonth() === end.getMonth() &&
        start.getDate() === end.getDate();
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

    if (end && !Number.isNaN(new Date(end).getTime())) {
      const endDate = new Date(end);
      const sameDay =
        start.getFullYear() === endDate.getFullYear() &&
        start.getMonth() === endDate.getMonth() &&
        start.getDate() === endDate.getDate();
      if (sameDay) {
        return `${dateFmt.format(start)}, ${timeFmt.format(
          start
        )} – ${timeFmt.format(endDate)}`;
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
      return `${dateTimeFmt.format(start)} – ${dateTimeFmt.format(endDate)}`;
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
    return null;
  }
}

function getTemplateById(id: string): BirthdayTemplateDefinition {
  return (
    birthdayTemplateCatalog.find((template) => template.id === id) ??
    birthdayTemplateCatalog[0]
  );
}

function formatDateLabel(value?: string) {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(parsed);
  } catch {
    return parsed.toDateString();
  }
}

function formatTimeLabel(
  value?: string | null,
  options?: { timeZone?: string | null; allDay?: boolean }
) {
  if (!value || options?.allDay) return undefined;
  try {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return undefined;
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: options?.timeZone || undefined,
    }).format(parsed);
  } catch {
    return undefined;
  }
}

function parseCoordinateValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

type Props = {
  eventId: string;
  eventData: any;
  eventTitle: string;
  templateId: string;
  variationId: string;
  isOwner: boolean;
  isReadOnly: boolean;
  viewerKind: "owner" | "guest" | "readonly";
  shareUrl: string;
  sessionEmail: string | null;
};

// Basic luminance helpers to tune palette contrast (mirrors birthday customize page)
const parseHexColor = (hex: string) => {
  const clean = hex.replace("#", "");
  if (clean.length === 3) {
    const [r, g, b] = clean.split("").map((c) => parseInt(c + c, 16));
    return { r, g, b };
  }
  const m = clean.match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
};

const getLuminance = (hex: string): number => {
  const rgb = parseHexColor(hex);
  if (!rgb) return 1;
  const { r, g, b } = rgb;
  const [rLinear, gLinear, bLinear] = [r, g, b].map((val) => {
    const v = val / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
};

const isPaletteDark = (palette: string[]): boolean => {
  const colors = (palette || []).filter(Boolean).slice(0, 3);
  if (!colors.length) return false;
  const avg =
    colors.reduce((acc, c) => acc + getLuminance(c), 0) / colors.length;
  return avg < 0.5;
};

const getPreviewStyle = (palette: string[]) => {
  const colors = (palette || []).filter(Boolean);
  if (colors.length >= 3) {
    return {
      backgroundImage: `linear-gradient(to bottom right, ${colors[0]}, ${colors[1]}, ${colors[2]})`,
    };
  }
  if (colors.length === 2) {
    return {
      backgroundImage: `linear-gradient(to bottom right, ${colors[0]}, ${colors[1]})`,
    };
  }
  if (colors.length === 1) {
    return { backgroundColor: colors[0] };
  }
  return {};
};

export default function BirthdayTemplateView({
  eventId,
  eventData,
  eventTitle,
  templateId,
  variationId,
  isOwner,
  isReadOnly,
  viewerKind,
  shareUrl,
  sessionEmail,
}: Props) {
  const template = useMemo(() => getTemplateById(templateId), [templateId]);
  const variation = useMemo(() => {
    const v =
      template.variations.find((v) => v.id === variationId) ??
      template.variations[0];
    return resolveTemplateVariation(v);
  }, [template, variationId]);
  const templateLayout: TemplateLayoutConfig | undefined =
    template.templateConfig;

  const birthdayName =
    (eventData?.birthdayName as string) ||
    template.preview?.birthdayName ||
    "Birthday Person";

  const startISO = eventData?.startISO || eventData?.start || null;
  const endISO = eventData?.endISO || eventData?.end || null;
  const whenLabel = formatEventRangeDisplay(startISO, endISO, {
    timeZone: eventData?.timezone || undefined,
    allDay: Boolean(eventData?.allDay),
  });

  const previewDateLabel = formatDateLabel(startISO) || "Date TBD";
  const previewTime = formatTimeLabel(startISO, {
    timeZone: eventData?.timezone || undefined,
    allDay: Boolean(eventData?.allDay),
  });

  const heroImageBasePath = "/templates/birthdays/";
  const heroImageSrc =
    (eventData?.customHeroImage as string) ||
    (eventData?.heroImage as string) ||
    (Array.isArray(eventData?.gallery) && eventData.gallery[0]?.url) ||
    `${heroImageBasePath}${template.heroImageName || `${template.id}.webp`}`;
  const headerBackgroundStyle = {
    ...paletteStyle,
  };

  const venue = eventData?.venue || "";
  const location = eventData?.location || "";
  const address = eventData?.address || "";
  const city = eventData?.city || "";
  const state = eventData?.state || "";
  const description = eventData?.description || "";
  const rsvp = eventData?.rsvp || "";
  const numberOfGuests = eventData?.numberOfGuests || 0;

  const registryLinks = Array.isArray(eventData?.registries)
    ? eventData.registries
    : [];

  const rsvpField = typeof eventData?.rsvp === "string" ? eventData.rsvp : "";
  const aggregateContactText = `${rsvpField} ${description} ${location}`.trim();
  const rsvpPhone = extractFirstPhoneNumber(aggregateContactText);
  const rsvpEmail =
    findFirstEmail(rsvpField) ??
    findFirstEmail(aggregateContactText) ??
    findFirstEmail(eventData);
  const rsvpContactSource = rsvpField || rsvpEmail || "";
  const rsvpNameRaw = rsvpContactSource
    ? rsvpContactSource
        .replace(/^RSVP:?\s*/i, "")
        .replace(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g, "")
        .replace(/\(\d{3}\)\s*\d{3}[-.\s]?\d{4}/g, "")
        .trim()
    : "";
  const rsvpName = rsvpNameRaw ? cleanRsvpContactLabel(rsvpNameRaw) : "";
  const hasRsvpContact = Boolean(rsvpPhone || rsvpEmail);

  const calendarStartIso =
    typeof startISO === "string" && startISO ? startISO : null;
  const calendarEndIso = calendarStartIso
    ? ensureEndIso(
        calendarStartIso,
        typeof endISO === "string" && endISO ? endISO : null,
        Boolean(eventData?.allDay)
      )
    : null;
  const reminders = Array.isArray(eventData?.reminders)
    ? (eventData.reminders as { minutes?: number }[])
        .map((entry) =>
          typeof entry?.minutes === "number" ? entry.minutes : null
        )
        .filter(
          (value): value is number => typeof value === "number" && value > 0
        )
    : null;
  const recurrence =
    typeof eventData?.recurrence === "string" ? eventData.recurrence : null;
  const calendarLinks =
    calendarStartIso && calendarEndIso
      ? buildCalendarLinks({
          title: eventTitle || `${birthdayName}'s Birthday`,
          description,
          location,
          startIso: calendarStartIso,
          endIso: calendarEndIso,
          timezone:
            (typeof eventData?.timezone === "string" && eventData.timezone) ||
            "",
          allDay: Boolean(eventData?.allDay),
          reminders,
          recurrence,
        })
      : null;

  const locationQuery = combineVenueAndLocation(
    venue || null,
    [address, city, state].filter(Boolean).join(", ") || location || null
  );
  const latValue = parseCoordinateValue(eventData?.lat);
  const lngValue = parseCoordinateValue(eventData?.lng);
  const mapCoordinates =
    latValue !== null && lngValue !== null
      ? { latitude: latValue, longitude: lngValue }
      : undefined;
  const zoomValue = parseCoordinateValue(eventData?.zoom);

  const hosts = Array.isArray(eventData?.hosts) ? eventData.hosts : [];
  const partyDetails = eventData?.partyDetails || {};
  const activities =
    typeof partyDetails?.activities === "string"
      ? partyDetails.activities
      : "";
  const partyTheme =
    partyDetails?.theme || eventData?.theme?.themeLabel || null;

  const hasHosts = hosts.length > 0;
  const hasDirectionSection = Boolean(location || venue || address || city);
  const hasDescriptionSection = Boolean(
    description || partyDetails?.notes || activities
  );
  const hasWishlistSection = registryLinks.length > 0;
  const hasGallerySection =
    Array.isArray(eventData?.gallery) && eventData.gallery.length > 0;
  const hasRsvpSection = Boolean(eventData?.rsvpEnabled || hasRsvpContact);

  const navItems = useMemo(
    () =>
      [
        { id: "details", label: "Details", enabled: true },
        { id: "hosts", label: "Hosts", enabled: hasHosts },
        { id: "location", label: "Location", enabled: hasDirectionSection },
        { id: "party", label: "Party Details", enabled: hasDescriptionSection },
        { id: "gallery", label: "Gallery", enabled: hasGallerySection },
        { id: "registry", label: "Registry", enabled: hasWishlistSection },
        { id: "rsvp", label: "RSVP", enabled: hasRsvpSection },
      ].filter((item) => item.enabled),
    [
      hasDescriptionSection,
      hasDirectionSection,
      hasGallerySection,
      hasHosts,
      hasRsvpSection,
      hasWishlistSection,
    ]
  );

  // Navigation active state tracking
  const [activeSection, setActiveSection] = useState<string>("details");

  // Keep active section valid when nav items change
  useEffect(() => {
    if (!navItems.some((item) => item.id === activeSection)) {
      setActiveSection(navItems[0]?.id || "home");
    }
  }, [activeSection, navItems]);

  // Update active section based on hash and scroll position
  useEffect(() => {
    const updateActiveSection = () => {
      const hash = window.location.hash.slice(1);
      if (hash && navItems.some((item) => item.id === hash)) {
        setActiveSection(hash);
      } else {
        setActiveSection(navItems[0]?.id || "home");
      }
    };

    updateActiveSection();

    // Update on hash change
    window.addEventListener("hashchange", updateActiveSection);

    // Update on scroll using IntersectionObserver (wait for DOM)
    const setupObserver = () => {
      const sections = navItems
        .map((item) => ({
          id: item.id,
          element: document.getElementById(item.id),
        }))
        .filter((entry) => entry.element);

      const observerOptions = {
        root: null,
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0,
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            if (id) {
              setActiveSection(id);
              // Update URL hash without scrolling
              if (window.location.hash !== `#${id}`) {
                window.history.replaceState(null, "", `#${id}`);
              }
            }
          }
        });
      }, observerOptions);

      sections.forEach(({ element }) => {
        if (element) {
          observer.observe(element);
        }
      });

      return observer;
    };

    // Wait for next tick to ensure DOM is ready
    let observer: IntersectionObserver | null = null;
    const timeoutId = setTimeout(() => {
      observer = setupObserver();
    }, 0);

    return () => {
      window.removeEventListener("hashchange", updateActiveSection);
      clearTimeout(timeoutId);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [navItems, templateId]);

  const themePalette = Array.isArray(eventData?.themePalette)
    ? (eventData.themePalette as string[])
    : [];
  const paletteStyle = getPreviewStyle(themePalette);
  const isDarkPalette = isPaletteDark(themePalette);
  const headingColor = isDarkPalette ? "#ffffff" : "#0f172a";
  const accentColor = isDarkPalette ? "#e2e8f0" : "#475569";
  const textShadowStyle = isDarkPalette
    ? { textShadow: "0 1px 3px rgba(0,0,0,0.5)" }
    : undefined;
  const headingFontFamily =
    (eventData?.theme?.fontFamily as string) ||
    variation.titleFontFamily ||
    "var(--font-playfair)";
  const bodyFontFamily =
    (eventData?.theme?.bodyFontFamily as string) ||
    "var(--font-montserrat)";

  const viewContent = (
    <section className="mx-auto w-full max-w-7xl">
      <article
        className={styles.templateCard}
        style={paletteStyle}
        data-birthday-modern="true"
      >
        <div className={styles.cardBody}>
          {/* Home section - the header */}
          <div id="home" className="scroll-mt-20">
            <div className={styles.previewFrame}>
              <div
                className={styles.previewHeader}
                style={headerBackgroundStyle}
                data-birthday="true"
              >
                <p
                  className={styles.previewNames}
                  style={{
                    color: headingColor,
                    fontFamily: headingFontFamily,
                    fontWeight:
                      variation.titleWeight === "bold"
                        ? 700
                        : variation.titleWeight === "semibold"
                        ? 600
                        : 400,
                    ...(textShadowStyle || {}),
                  }}
                >
                  {birthdayName}'s Birthday
                </p>
                <p
                  className={styles.previewMeta}
                  style={{ color: headingColor }}
                >
                  {previewDateLabel}
                  {previewTime ? ` • ${previewTime}` : ""}
                </p>
                {(city || state || venue || location) && (
                  <p
                    className={styles.previewMeta}
                    style={{ color: headingColor }}
                  >
                    {[city, state].filter(Boolean).join(", ") ||
                      venue ||
                      location}
                    {address ? (
                      <>
                        <br />
                        <span className="opacity-80">{address}</span>
                      </>
                    ) : null}
                  </p>
                )}
                <div
                  className={styles.previewNav}
                  style={{ color: variation.titleColor }}
                >
                  {navItems.map((item) => {
                    const hashId = item.id;
                    const isActive = activeSection === hashId;
                    return (
                      <a
                        key={hashId}
                        href={`#${hashId}`}
                        className={`${styles.previewNavItem} ${
                          isActive ? styles.previewNavItemActive : ""
                        }`}
                        style={{
                          fontWeight: isActive ? 600 : 400,
                          opacity: isActive ? 1 : 0.8,
                          color: accentColor,
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          const element = document.getElementById(hashId);
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth" });
                            window.history.pushState(null, "", `#${hashId}`);
                            setActiveSection(hashId);
                          }
                        }}
                      >
                        {item.label}
                      </a>
                    );
                  })}
                </div>
                {/* Actions pinned to top-right of header */}
                {!isReadOnly && (
                  <div className="absolute top-3 right-3 z-40">
                    <div className="flex items-center gap-2 text-sm font-medium bg-white/90 backdrop-blur rounded-md px-2 py-1.5 shadow">
                      {isOwner && (
                        <>
                          <Link
                            href={resolveEditHref(
                              eventId,
                              eventData,
                              eventTitle
                            )}
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
                          <EventDeleteModal
                            eventId={eventId}
                            eventTitle={eventTitle}
                          />
                        </>
                      )}
                      <EventActions
                        shareUrl={shareUrl}
                        event={eventData}
                        historyId={eventId}
                        className=""
                        variant="compact"
                        tone="default"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className={styles.previewPhoto}>
                {heroImageSrc.startsWith("data:") ? (
                  <img
                    src={heroImageSrc}
                    alt={`${template.name} preview`}
                    className={styles.previewPhotoImage}
                  />
                ) : (
                  <Image
                    src={heroImageSrc}
                    alt={`${template.name} preview`}
                    width={1280}
                    height={720}
                    className={styles.previewPhotoImage}
                    priority={false}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Details section */}
          <div id="details-content" className="scroll-mt-20">
            <div
              className="mt-6 rounded-2xl border border-black/5 bg-white/90 p-6 shadow-sm"
              style={{ fontFamily: bodyFontFamily }}
            >
              <h2
                className="text-xl font-semibold mb-4"
                style={{ color: headingColor, fontFamily: headingFontFamily }}
              >
                Details
              </h2>
              <div className="md:grid md:grid-cols-2 md:gap-6">
                <div className="space-y-3">
                  {whenLabel && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1">
                        When
                      </p>
                      <p className="text-base font-semibold text-stone-900">
                        {whenLabel}
                      </p>
                    </div>
                  )}
                  {(venue || location || address || city) && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1">
                        Location
                      </p>
                      <div className="space-y-1 text-stone-800">
                        {venue && (
                          <p className="text-base font-semibold">{venue}</p>
                        )}
                        {(address || city || state || location) && (
                          <p className="text-sm text-stone-600">
                            {[address, city, state]
                              .filter(Boolean)
                              .join(", ") || location}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {numberOfGuests > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1">
                        Guests Expected
                      </p>
                      <p className="text-base font-semibold text-stone-900">
                        {numberOfGuests}
                      </p>
                    </div>
                  )}
                  {(partyDetails?.notes || description) && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1">
                        About
                      </p>
                      <p className="text-sm leading-relaxed text-stone-700 whitespace-pre-wrap">
                        {partyDetails?.notes || description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Hosts */}
          {hasHosts && (
            <div id="hosts" className="scroll-mt-20">
              <div
                className="mt-6 rounded-2xl border border-black/5 bg-white/90 p-6 shadow-sm"
                style={{ fontFamily: bodyFontFamily }}
              >
                <h2
                  className="text-xl font-semibold mb-4"
                  style={{ color: headingColor, fontFamily: headingFontFamily }}
                >
                  Hosts
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {hosts.map((host, idx) => (
                    <div
                      key={host.id || idx}
                      className="rounded-lg border border-stone-200 bg-white px-3 py-3"
                    >
                      <p className="font-semibold text-stone-900">
                        {host.name || "Host"}
                      </p>
                      {host.role && (
                        <p className="text-sm text-stone-600">{host.role}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Location map */}
          {hasDirectionSection && (
            <div id="location" className="scroll-mt-20">
              <div
                className="mt-6 rounded-2xl border border-black/5 bg-white/90 p-6 shadow-sm"
                style={{ fontFamily: bodyFontFamily }}
              >
                <h2
                  className="text-xl font-semibold mb-4"
                  style={{ color: headingColor, fontFamily: headingFontFamily }}
                >
                  Location
                </h2>
                <div className="space-y-3">
                  {locationQuery && (
                    <div className="space-y-2">
                      <LocationLink location={locationQuery} />
                      {mapCoordinates && (
                        <div className="h-60 overflow-hidden rounded-lg border border-stone-200">
                          <EventMap
                            latitude={mapCoordinates.latitude}
                            longitude={mapCoordinates.longitude}
                            zoom={zoomValue ?? undefined}
                            label={venue || locationQuery}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Party Details */}
          {hasDescriptionSection && (
            <div id="party" className="scroll-mt-20">
              <div
                className="mt-6 rounded-2xl border border-black/5 bg-white/90 p-6 shadow-sm"
                style={{ fontFamily: bodyFontFamily }}
              >
                <h2
                  className="text-xl font-semibold mb-3"
                  style={{ color: headingColor, fontFamily: headingFontFamily }}
                >
                  Party Details
                </h2>
                {partyTheme && (
                  <p className="text-sm font-semibold text-stone-700 mb-2">
                    Theme: {partyTheme}
                  </p>
                )}
                {activities && (
                  <p className="text-sm text-stone-700 mb-2">
                    Activities: {activities}
                  </p>
                )}
                {(partyDetails?.notes || description) && (
                  <p className="text-base leading-relaxed text-stone-800 whitespace-pre-wrap">
                    {partyDetails?.notes || description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Gallery */}
          {hasGallerySection && (
            <div id="gallery" className="scroll-mt-20">
              <div
                className="mt-6 rounded-2xl border border-black/5 bg-white/90 p-6 shadow-sm"
                style={{ fontFamily: bodyFontFamily }}
              >
                <h2
                  className="text-xl font-semibold mb-4"
                  style={{ color: headingColor, fontFamily: headingFontFamily }}
                >
                  Gallery
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {(eventData.gallery || []).map((img: any, idx: number) => (
                    <div
                      key={img.id || idx}
                      className="relative w-full pb-[62%] rounded-lg overflow-hidden border border-stone-200 bg-stone-100"
                    >
                      <Image
                        src={img.url}
                        alt={img.caption || "Gallery image"}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Registry */}
          {hasWishlistSection && (
            <div id="registry" className="scroll-mt-20">
              <div
                className="mt-6 rounded-2xl border border-black/5 bg-white/90 p-6 shadow-sm"
                style={{ fontFamily: bodyFontFamily }}
              >
                <h2
                  className="text-xl font-semibold mb-4"
                  style={{ color: headingColor, fontFamily: headingFontFamily }}
                >
                  Registry
                </h2>
                <div className="space-y-2">
                  {registryLinks.map((reg, idx) => (
                    <div key={`${reg.url}-${idx}`}>
                      <a
                        href={reg.url}
                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {reg.label || "Registry link"}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* RSVP */}
          {hasRsvpSection && (
            <div id="rsvp" className="scroll-mt-20">
              <div
                className="mt-6 rounded-2xl border border-black/5 bg-white/90 p-6 shadow-sm"
                style={{ fontFamily: bodyFontFamily }}
              >
                <h2
                  className="text-xl font-semibold mb-3"
                  style={{ color: headingColor, fontFamily: headingFontFamily }}
                >
                  RSVP
                </h2>
                {eventData?.rsvpDeadline && (
                  <p className="text-sm text-stone-700 mb-2">
                    Please RSVP by {eventData.rsvpDeadline}
                  </p>
                )}
                {hasRsvpContact ? (
                  <p className="text-sm text-stone-700">
                    Contact: {rsvpContactLabel}
                  </p>
                ) : (
                  <p className="text-sm text-stone-700">
                    RSVP details will be shared by the host.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Calendar buttons */}
          {calendarLinks && (
            <section
              className="scroll-mt-20 rounded-2xl border border-black/5 bg-white/90 p-6 shadow-sm"
              id="add-to-calendar"
            >
              <h2
                className="text-xl font-semibold mb-4"
                style={{ color: headingColor, fontFamily: headingFontFamily }}
              >
                Add to Calendar
              </h2>
              <div className="flex flex-wrap gap-3">
                {calendarLinks.google && (
                  <a
                    href={calendarLinks.google}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm transition hover:border-stone-300"
                  >
                    <CalendarIconGoogle className="h-5 w-5" />
                    Google
                  </a>
                )}
                {calendarLinks.outlook && (
                  <a
                    href={calendarLinks.outlook}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm transition hover:border-stone-300"
                  >
                    <CalendarIconOutlook className="h-5 w-5" />
                    Outlook
                  </a>
                )}
                {calendarLinks.appleInline && (
                  <a
                    href={calendarLinks.appleInline}
                    className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm transition hover:border-stone-300"
                    download
                  >
                    <CalendarIconApple className="h-5 w-5" />
                    Apple
                  </a>
                )}
              </div>
            </section>
          )}
        </div>
      </article>
    </section>
  );

  if (templateLayout?.id === "candy-dreams" && templateLayout.palette) {
    return (
      <CandyDreamsLayout palette={templateLayout.palette}>
        {viewContent}
      </CandyDreamsLayout>
    );
  }

  return <main className="px-5 py-10">{viewContent}</main>;
}
