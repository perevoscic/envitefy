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
} from "@/components/event-create/BirthdayTemplateGallery";
import EventActions from "@/components/EventActions";
import EventEditModal from "@/components/EventEditModal";
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

// Convert menu item to hash ID
function menuItemToHash(item: string): string {
  return item
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
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

  const heroImageSrc =
    (eventData?.customHeroImage as string) ||
    `/templates/wedding-placeholders/${template.heroImageName}`;
  const backgroundImageSrc = `/templates/birthdays/${template.id}.webp`;

  const venue = eventData?.venue || "";
  const location = eventData?.location || "";
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
    location || null
  );

  // Navigation active state tracking
  const [activeSection, setActiveSection] = useState<string>("home");

  // Update active section based on hash and scroll position
  useEffect(() => {
    const updateActiveSection = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        setActiveSection(hash);
      } else {
        setActiveSection("home");
      }
    };

    // Update on mount
    updateActiveSection();

    // Update on hash change
    window.addEventListener("hashchange", updateActiveSection);

    // Update on scroll using IntersectionObserver (wait for DOM)
    const setupObserver = () => {
      const sections = template.menu.map((item) => ({
        id: menuItemToHash(item),
        element: document.getElementById(menuItemToHash(item)),
      }));

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
  }, [templateId]);

  return (
    <main className="px-5 py-10">
      <section className="mx-auto w-full max-w-7xl">
        <article className={styles.templateCard}>
          <div className={styles.cardBody}>
            {/* Home section - the header */}
            <div id="home" className="scroll-mt-20">
              <div className={styles.previewFrame}>
                <div
                  className={styles.previewHeader}
                  style={{
                    backgroundImage: `url(${backgroundImageSrc})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                  data-birthday="true"
                >
                  <p
                    className={styles.previewNames}
                    style={{
                      color: variation.titleColor,
                      fontFamily: variation.titleFontFamily,
                      fontWeight:
                        variation.titleWeight === "bold"
                          ? 700
                          : variation.titleWeight === "semibold"
                          ? 600
                          : 400,
                    }}
                  >
                    {birthdayName}'s Birthday
                  </p>
                  <p
                    className={styles.previewMeta}
                    style={{ color: variation.titleColor }}
                  >
                    {previewDateLabel}
                    {previewTime ? ` • ${previewTime}` : ""}
                  </p>
                  <div
                    className={styles.previewNav}
                    style={{ color: variation.titleColor }}
                  >
                    {template.menu.map((item) => {
                      const hashId = menuItemToHash(item);
                      const isActive = activeSection === hashId;
                      return (
                        <a
                          key={item}
                          href={`#${hashId}`}
                          className={`${styles.previewNavItem} ${
                            isActive ? styles.previewNavItemActive : ""
                          }`}
                          style={{
                            fontWeight: isActive ? 600 : 400,
                            opacity: isActive ? 1 : 0.8,
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
                          {item}
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
                            <EventEditModal
                              eventId={eventId}
                              eventData={eventData}
                              eventTitle={eventTitle}
                            />
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
                      width={640}
                      height={360}
                      className={styles.previewPhotoImage}
                      priority={false}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Party Details section */}
            <div id="party-details" className="scroll-mt-20">
              <div className="mt-6 rounded-2xl border border-black/5 bg-white/90 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-stone-900 mb-4">
                  Event Details
                </h2>
                <div className="md:grid md:grid-cols-2 md:gap-6">
                  <div className="space-y-3">
                    {whenLabel && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1">
                          When
                        </p>
                        <div className="space-y-1">
                          {(() => {
                            const timeLabel = (() => {
                              if (Boolean(eventData?.allDay)) return null;
                              if (!startISO) return null;
                              try {
                                const start = new Date(startISO);
                                if (Number.isNaN(start.getTime())) return null;
                                const end = endISO ? new Date(endISO) : null;
                                const tz = eventData?.timezone || undefined;
                                const timeFmt = new Intl.DateTimeFormat(
                                  "en-US",
                                  {
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                    timeZone: tz,
                                  }
                                );
                                if (end && !Number.isNaN(end.getTime())) {
                                  const sameDay =
                                    start.getFullYear() === end.getFullYear() &&
                                    start.getMonth() === end.getMonth() &&
                                    start.getDate() === end.getDate();
                                  if (sameDay) {
                                    return `${timeFmt.format(
                                      start
                                    )} – ${timeFmt.format(end)}`;
                                  }
                                }
                                return timeFmt.format(start);
                              } catch {
                                return null;
                              }
                            })();
                            const dateLabel = formatDateLabel(startISO);
                            return (
                              <>
                                {timeLabel && (
                                  <p className="text-base text-stone-900 font-semibold">
                                    {timeLabel}
                                  </p>
                                )}
                                {dateLabel && (
                                  <p className="text-base text-stone-900">
                                    {dateLabel}
                                  </p>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {(venue || location) && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1">
                          {venue ? "Venue & location" : "Location"}
                        </p>
                        <div className="space-y-1 text-base text-stone-900">
                          {venue && (
                            <p className="font-semibold text-lg">{venue}</p>
                          )}
                          {location && (
                            <p>
                              <LocationLink
                                location={location}
                                query={locationQuery}
                                className="text-base text-stone-900"
                              />
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {numberOfGuests > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1">
                          Guests
                        </p>
                        <p className="text-base text-stone-900">
                          {numberOfGuests}
                        </p>
                      </div>
                    )}
                  </div>

                  {locationQuery && (
                    <div
                      id="direction"
                      className="hidden md:block scroll-mt-20 w-full"
                    >
                      <EventMap
                        venue={venue}
                        location={location}
                        mapHeight={300}
                        className="rounded-2xl border border-black/10 bg-white shadow-sm w-full"
                      />
                    </div>
                  )}
                </div>

                {locationQuery && (
                  <div className="md:hidden mt-4">
                    <EventMap
                      venue={venue}
                      location={location}
                      mapHeight={300}
                      className="rounded-2xl border border-black/10 bg-white shadow-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Description section */}
            {description && (
              <div id="description" className="scroll-mt-20">
                <div className="mt-6 rounded-2xl border border-black/5 bg-white/90 p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-stone-900 mb-4">
                    Description
                  </h2>
                  <p className="text-base text-stone-900 whitespace-pre-wrap">
                    {description}
                  </p>
                </div>
              </div>
            )}

            {/* Wishlist section */}
            {registryLinks.length > 0 && (
              <div id="wishlist" className="scroll-mt-20">
                <div className="mt-6 rounded-2xl border border-black/5 bg-white/90 p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-stone-900 mb-4">
                    Wishlist
                  </h2>
                  <div className="space-y-2">
                    {registryLinks.map((registry: any, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-sm text-stone-700">
                          {registry.label || "Registry"}
                        </span>
                        <a
                          href={registry.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {registry.url}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* RSVP section */}
            {(hasRsvpContact || rsvp || calendarLinks) && (
              <div id="rsvp" className="scroll-mt-20">
                <div className="mt-6 rounded-2xl border border-black/5 bg-white/90 p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-stone-900 mb-4">
                    RSVP
                  </h2>
                  {hasRsvpContact && (
                    <div className="mb-6">
                      <EventRsvpPrompt
                        eventId={eventId}
                        rsvpName={rsvpName}
                        rsvpPhone={rsvpPhone}
                        rsvpEmail={rsvpEmail}
                        eventTitle={eventTitle}
                        shareUrl={shareUrl}
                      />
                    </div>
                  )}
                  {rsvp && !hasRsvpContact && (
                    <p className="text-base text-stone-900 mb-6">{rsvp}</p>
                  )}
                  {calendarLinks && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">
                        Add to calendar
                      </p>
                      <div className="flex flex-wrap items-center gap-3">
                        <a
                          href={calendarLinks.appleInline}
                          className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-stone-900 transition hover:bg-stone-50"
                          aria-label="Add to Apple Calendar"
                          title="Apple Calendar"
                        >
                          <CalendarIconApple className="h-5 w-5" />
                        </a>
                        <a
                          href={calendarLinks.google}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-stone-900 transition hover:bg-stone-50"
                          aria-label="Add to Google Calendar"
                          title="Google Calendar"
                        >
                          <CalendarIconGoogle className="h-5 w-5" />
                        </a>
                        <a
                          href={calendarLinks.outlook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-stone-900 transition hover:bg-stone-50"
                          aria-label="Add to Outlook Calendar"
                          title="Outlook Calendar"
                        >
                          <CalendarIconOutlook className="h-5 w-5" />
                        </a>
                      </div>
                      <p className="mt-2 text-xs text-stone-500">
                        Guests can save the invite to Google, Outlook, or Apple
                        in one tap.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Host Dashboard */}
            {isOwner && numberOfGuests > 0 && (
              <div className="mt-6">
                <EventRsvpDashboard
                  eventId={eventId}
                  initialNumberOfGuests={numberOfGuests}
                />
              </div>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
