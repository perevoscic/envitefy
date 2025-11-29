"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import EventActions from "@/components/EventActions";
import EventDeleteModal from "@/components/EventDeleteModal";

const DEFAULT_HERO_IMAGE = "/templates/hero-images/baby-shower-hero.jpeg";

type Props = {
  eventId: string;
  eventTitle: string;
  eventData: any;
  shareUrl: string;
  isOwner: boolean;
  isReadOnly: boolean;
  editHref: string;
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
    const parsed = new Date(value);
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
  const darkTokens = [
    "black",
    "navy",
    "midnight",
    "slate",
    "stone",
    "neutral",
    "gray",
    "indigo",
    "purple",
  ];
  if (darkTokens.some((token) => lower.includes(token))) return true;
  if (/#0[0-9a-f]{5,}/i.test(bg)) return true;
  if (/[0-9a-f]{6}/i.test(bg) && parseInt(bg.replace("#", "").slice(0, 2), 16) < 50)
    return true;
  return false;
}

export default function BabyShowerTemplateView({
  eventId,
  eventTitle,
  eventData,
  shareUrl,
  isOwner,
  isReadOnly,
  editHref,
}: Props) {
  const heroImage =
    typeof eventData?.heroImage === "string" && eventData.heroImage
      ? eventData.heroImage
      : DEFAULT_HERO_IMAGE;
  const theme = eventData?.theme || {};
  const textClass = typeof theme?.text === "string" ? theme.text : "text-slate-900";
  const accentClass = typeof theme?.accent === "string" ? theme.accent : "text-slate-500";
  const backgroundClass =
    typeof theme?.bg === "string" && theme.bg ? theme.bg : "bg-white";
  const backgroundStyle = (theme as any)?.bgStyle || undefined;
  const headingFont = eventData?.fontFamily || "var(--font-playfair)";
  const heroTitleClass =
    eventData?.fontSizeClass || "text-3xl md:text-5xl leading-tight";
  const titleStyle: CSSProperties = { fontFamily: headingFont };
  if (isDarkBackground(theme?.bg) && !titleStyle.color) {
    titleStyle.color = "#fef3c7";
  }

  const hosts = Array.isArray(eventData?.hosts) ? eventData.hosts : [];
  const gallery = Array.isArray(eventData?.gallery) ? eventData.gallery : [];
  const registries = Array.isArray(eventData?.registries)
    ? eventData.registries
    : [];
  const rsvp = eventData?.rsvp || {};
  const customFields = eventData?.customFields || {};
  const locationLabel =
    customFields.location ||
    [eventData?.address, eventData?.city, eventData?.state]
      .filter(Boolean)
      .join(", ");
  const expectingDate =
    customFields.expectingDate || eventData?.babyDetails?.expectingDate;
  const gender = customFields.gender || eventData?.babyDetails?.gender;
  const babyNote =
    customFields.aboutBaby || eventData?.babyDetails?.notes || "";
  const momNote =
    customFields.aboutMom || eventData?.momDetails?.notes || "";
  const rsvpDeadline =
    customFields.rsvpDeadline || (rsvp?.deadline && String(rsvp.deadline));

  const startIso =
    eventData?.startISO || eventData?.start || eventData?.date
      ? eventData.startISO || eventData.start
      : null;
  const startDate =
    typeof startIso === "string" && startIso
      ? new Date(startIso)
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

  const navItems = detailSections
    .map((item) => {
      if (item.id === "gallery" && gallery.length === 0) return null;
      if (item.id === "registry" && registries.length === 0) return null;
      if (item.id === "rsvp" && !rsvp?.isEnabled && !rsvpDeadline)
        return null;
      return item;
    })
    .filter(Boolean) as typeof detailSections;

  return (
    <main className="min-h-screen bg-[#f5f6fb] px-4 py-10 font-sans text-slate-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div
          className={`relative overflow-hidden rounded-[32px] shadow-[0_35px_120px_rgba(15,23,42,0.25)] ${backgroundClass}`}
          style={backgroundStyle}
        >
          <div
            className={`px-6 md:px-10 pt-8 pb-4 border-b border-white/40 ${textClass}`}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className={`font-semibold ${heroTitleClass}`} style={titleStyle}>
                  {eventData?.babyName
                    ? `${eventData.babyName}'s Baby Shower`
                    : eventTitle}
                </h1>
                <div className="flex flex-wrap gap-3 text-sm font-semibold uppercase tracking-[0.4em] opacity-80">
                  {dateLabel && <span>{dateLabel}</span>}
                  {timeLabel && <span>{timeLabel}</span>}
                  {locationLabel && <span>{locationLabel}</span>}
                </div>
              </div>
              {!isReadOnly && isOwner && (
                <div className="flex items-center gap-2">
                  <Link
                    href={editHref}
                    className="rounded-full border border-white/60 bg-white/80 px-4 py-1.5 text-sm font-semibold text-slate-800 transition hover:border-slate-300"
                  >
                    Edit
                  </Link>
                  <EventDeleteModal
                    eventId={eventId}
                    eventTitle={eventTitle}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="relative h-[420px] w-full">
            <img
              src={heroImage}
              alt="Hero"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/30"></div>
          </div>
          {navItems.length > 0 && (
            <nav className="border-t border-white/40 bg-white/80 px-4 py-3 backdrop-blur-lg">
              <div className="flex flex-wrap items-center justify-center gap-3">
                {navItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                    style={{ fontFamily: headingFont }}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </nav>
          )}
          <div className="absolute bottom-4 right-4">
            <div className="flex items-center gap-2 rounded-full bg-white/80 px-2 py-1 shadow-xl">
              <EventActions
                shareUrl={shareUrl}
                event={eventData}
                historyId={!isReadOnly ? eventId : undefined}
                className=""
                variant="compact"
                tone={"default" as any}
              />
            </div>
          </div>
        </div>

        <section
          id="details"
          className="space-y-6 rounded-[28px] border border-slate-100 bg-white/90 px-6 py-8 shadow-lg"
        >
          {hosts.length > 0 && (
            <div className="text-center space-y-3">
              <h2
                className={`text-3xl font-semibold ${accentClass}`}
                style={{ fontFamily: headingFont }}
              >
                Hosted By
              </h2>
              <div className="flex flex-wrap justify-center gap-6 text-base font-semibold text-slate-900">
                {hosts.map((host: any) => (
                  <div key={host.id || host.name} className="text-center">
                    <div>{host.name}</div>
                    {host.role && (
                      <div className="text-xs uppercase tracking-[0.4em] text-slate-500">
                        {host.role}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {locationLabel && (
            <div className="text-center space-y-2">
              <h2
                className={`text-3xl font-semibold ${accentClass}`}
                style={{ fontFamily: headingFont }}
              >
                Location
              </h2>
              <p className="text-base text-slate-700">{locationLabel}</p>
            </div>
          )}

          {expectingDate && (
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.4em] text-slate-500">
                Expected Arrival
              </span>
              <p className="text-lg font-semibold text-slate-900">
                {formatDate(expectingDate)}
              </p>
            </div>
          )}

          {gender && (
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.4em] text-slate-500">
                Baby's Gender
              </span>
              <p className="text-lg font-semibold text-slate-900">{gender}</p>
            </div>
          )}

          {babyNote && (
            <div className="space-y-2">
              <h2
                className={`text-3xl font-semibold ${accentClass}`}
                style={{ fontFamily: headingFont }}
              >
                About Baby
              </h2>
              <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                {babyNote}
              </p>
            </div>
          )}

          {momNote && (
            <div className="space-y-2">
              <h2
                className={`text-3xl font-semibold ${accentClass}`}
                style={{ fontFamily: headingFont }}
              >
                About {eventData?.momName || "Mom"}
              </h2>
              <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                {momNote}
              </p>
            </div>
          )}

          {rsvpDeadline && (
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.4em] text-slate-500">
                RSVP By
              </span>
              <p className="text-lg font-semibold text-slate-900">
                {formatDate(rsvpDeadline)}
              </p>
            </div>
          )}
        </section>

        {gallery.length > 0 && (
          <section id="gallery" className="space-y-4">
            <h3
              className={`text-3xl font-semibold text-center ${accentClass}`}
              style={{ fontFamily: headingFont }}
            >
              Photo Gallery
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              {gallery.map((img: any) => (
                <div
                  key={img.id || img.url}
                  className="relative aspect-square overflow-hidden rounded-3xl bg-slate-100 shadow-lg"
                >
                  <img
                    src={img.url}
                    alt={img.caption || "Gallery"}
                    className="h-full w-full object-cover"
                  />
                  {img.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-xs text-white">
                      {img.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {registries.length > 0 && (
          <section
            id="registry"
            className="space-y-4 rounded-[28px] border border-slate-100 bg-white/90 p-6 shadow-lg"
          >
            <h3
              className={`text-3xl font-semibold text-center ${accentClass}`}
              style={{ fontFamily: headingFont }}
            >
              Registry
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {registries.map((registry: any) => (
                <a
                  key={registry.id || registry.url}
                  href={registry.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-slate-200 px-5 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-slate-800 transition hover:border-slate-400"
                  style={{ fontFamily: headingFont }}
                >
                  {registry.label || "Registry"}
                </a>
              ))}
            </div>
          </section>
        )}

        {(rsvp?.isEnabled || rsvpDeadline) && (
          <section
            id="rsvp"
            className="space-y-4 rounded-[28px] border border-slate-100 bg-white/90 p-6 shadow-lg"
          >
            <h3
              className={`text-3xl font-semibold text-center ${accentClass}`}
              style={{ fontFamily: headingFont }}
            >
              RSVP
            </h3>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center space-y-3">
              <p className="text-sm text-slate-700">
                {rsvpDeadline
                  ? `Please respond by ${formatDate(rsvpDeadline)}.`
                  : "Kindly RSVP to let us know if you can attend."}
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <button className="rounded-2xl border border-slate-300 bg-white/80 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-900">
                  Yes, I'll be there
                </button>
                <button className="rounded-2xl border border-slate-300 bg-white/80 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-900">
                  Sorry, can't make it
                </button>
              </div>
            </div>
          </section>
        )}

        <footer className="text-center text-xs uppercase tracking-[0.4em] text-slate-500">
          <p>Powered by Envitefy</p>
          <p>Create. Share. Enjoy.</p>
        </footer>
      </div>
    </main>
  );
}
