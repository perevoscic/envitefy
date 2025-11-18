"use client";

import React, { useMemo } from "react";
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
import { combineVenueAndLocation } from "@/lib/mappers";
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

  return (
    <main className="px-5 py-10">
      <section className="mx-auto w-full max-w-7xl">
        <article className={styles.templateCard}>
          <div className={styles.cardBody}>
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
                  {template.menu.map((item) => (
                    <span key={item} className={styles.previewNavItem}>
                      {item}
                    </span>
                  ))}
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

            {/* Event Details Section */}
            <div className="mt-6 rounded-2xl border border-black/5 bg-white/90 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-stone-900 mb-4">
                Event Details
              </h2>
              <div className="space-y-4">
                {whenLabel && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1">
                      When
                    </p>
                    <p className="text-base text-stone-900">{whenLabel}</p>
                  </div>
                )}

                {(venue || location) && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1">
                      {venue ? "Venue" : "Location"}
                    </p>
                    <div className="space-y-1">
                      {venue && (
                        <p className="text-base font-semibold text-stone-900">
                          {venue}
                        </p>
                      )}
                      {location && (
                        <p className="text-base text-stone-900">
                          <LocationLink
                            location={location}
                            query={combineVenueAndLocation(
                              venue || null,
                              location || null
                            )}
                            className=""
                          />
                        </p>
                      )}
                    </div>
                    {location && (
                      <div className="mt-3">
                        <EventMap
                          location={combineVenueAndLocation(
                            venue || null,
                            location || null
                          )}
                        />
                      </div>
                    )}
                  </div>
                )}

                {numberOfGuests > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1">
                      Guests
                    </p>
                    <p className="text-base text-stone-900">{numberOfGuests}</p>
                  </div>
                )}

                {description && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1">
                      Description
                    </p>
                    <p className="text-base text-stone-900 whitespace-pre-wrap">
                      {description}
                    </p>
                  </div>
                )}

                {rsvp && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1">
                      RSVP
                    </p>
                    <p className="text-base text-stone-900">{rsvp}</p>
                  </div>
                )}

                {registryLinks.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">
                      Registry Links
                    </p>
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
                )}
              </div>
            </div>

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
