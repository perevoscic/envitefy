"use client";
import Link from "next/link";
import { type CSSProperties, type ReactNode, useState } from "react";
import EnvitefyEventBranding from "@/components/branding/EnvitefyEventBranding";
import EventGuestActions from "@/components/event-templates/EventGuestActions";
import type { EventGuestActionVisibility } from "@/lib/event-guest-actions";
import GuestRsvpModal from "@/components/GuestRsvpModal";
import {
  CUSTOM_EVENT_CATEGORIES,
  type CustomEventPage,
  customEventPageData,
  customEventSectionOrder,
  EVENT_DESIGN_FONTS,
  EVENT_DESIGN_FONT_PAIRS,
  safeEventLink,
} from "@/lib/event-custom-design";
import "@/components/birthdays/redesign/birthday-fonts.css";
import styles from "./custom-event.module.css";
import EventWeatherSection from "./EventWeatherSection";
import EventArrivalMap from "./EventArrivalMap";
import { EventSectionCanvas } from "@/components/events/EventSectionBuilder";

export default function CustomEventPageContent({
  page,
  eventId,
  shareUrl,
  isOwner = false,
  showGuestActions = Boolean(eventId),
  onGuestActionsChange,
}: {
  page: CustomEventPage;
  eventId?: string;
  shareUrl?: string;
  isOwner?: boolean;
  showGuestActions?: boolean;
  onGuestActionsChange?: (value: EventGuestActionVisibility) => void;
}) {
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const { design, details: d } = page;
  const titleAboveDetails = ["split", "editorial", "minimal", "cards"].includes(design.layout);
  const title = <h1 className={styles.heroTitle}>{d.title || "Your event title"}</h1>;
  const registryLinks = d.registryLinks.filter((link) => safeEventLink(link.url));
  const data = customEventPageData(page);
  const date = d.date
    ? new Date(`${d.date}T12:00:00Z`).toLocaleDateString("en-US", {
        timeZone: "UTC",
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";
  const time = d.time
    ? new Date(`2000-01-01T${d.time}:00Z`).toLocaleTimeString("en-US", {
        timeZone: "UTC",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";
  const vars = {
    "--event-page": design.colors.page,
    "--event-surface": design.colors.surface,
    "--event-ink": design.colors.ink,
    "--event-accent": design.colors.accent,
    "--event-font": EVENT_DESIGN_FONTS[design.font],
    "--event-body-font": EVENT_DESIGN_FONT_PAIRS.find((pair) => pair.id === design.font)?.body,
  } as CSSProperties;
  return (
    <article
      className={styles.page}
      style={vars}
      data-layout={design.layout}
      aria-label={eventId ? "Event page" : "Event page preview"}
    >
      {isOwner && eventId && (
        <nav className={styles.ownerActions} aria-label="Host tools">
          <Link href={`/event/design/customize?edit=${encodeURIComponent(eventId)}`}>
            Edit event page
          </Link>
          <Link href={`/events/${encodeURIComponent(eventId)}/manage`}>Host dashboard</Link>
        </nav>
      )}
      <header className={`${styles.hero} ${titleAboveDetails ? styles.heroWithTitle : ""}`}>
        {titleAboveDetails && title}
        <div className={styles.artwork}>
          <img src={page.artwork} alt={design.description} />
        </div>
        <div className={styles.intro}>
          {!titleAboveDetails && title}
          {d.host && <p className={styles.host}>Hosted by {d.host}</p>}
          {(date || time) && (
            <p className={styles.when}>{[date, time && d.endTime ? `${time} – ${new Date(`2000-01-01T${d.endTime}:00Z`).toLocaleTimeString("en-US", { timeZone: "UTC", hour: "numeric", minute: "2-digit" })}${d.endDate && d.endDate !== d.date ? ` (${d.endDate})` : ""}` : time].filter(Boolean).join(" · ")}</p>
          )}
          {(d.venue || d.location) && (
            <p>{[d.venue, d.location !== d.venue ? d.location : ""].filter(Boolean).join(" · ")}</p>
          )}
          {d.rsvpEnabled && (
            <button
              type="button"
              className={styles.primary}
              disabled={!eventId}
              onClick={() => setRsvpOpen(true)}
            >
              RSVP
            </button>
          )}
          {d.weather?.enabled && (
            <EventWeatherSection eventId={eventId} date={d.date} time={d.time}
              location={d.location || d.venue} units={d.weather.units} />
          )}
        </div>
      </header>
      <EventSectionCanvas className={styles.content} layout={d.sectionLayout} sections={customEventSectionOrder(d).map((key) => {
          let content: ReactNode;
          if (key === "overview") content = d.description ? (
          <section key={key} className={styles.section} data-event-section={key}>
            <h2>You're invited</h2>
            <p>{d.description}</p>
          </section>
          ) : null;
          else if (key === "registry") content = registryLinks.length > 0 ? (
          <section key={key} className={styles.section} data-event-section={key}>
            <h2>Registry</h2>
            <div className={styles.links}>
              {registryLinks.map((link, index) => (
                <a
                  key={index}
                  href={safeEventLink(link.url) || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.label || "View registry"} ↗
                </a>
              ))}
            </div>
          </section>
          ) : null;
          else { const section = d.sections[Number(key.slice(8))];
          content = section ? (
            <section key={key} className={styles.section} data-event-section={key} data-has-map={Boolean(section.map)}>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
              {section.map && d.arrivalMapEnabled !== false && <EventArrivalMap map={section.map} />}
            </section>
          ) : null; }
          return { id: key, label: key === "overview" ? "Welcome & overview" : key === "registry" ? "Registry" : d.sections[Number(key.slice(8))]?.title || "Information", content };
        }).filter((section) => section.content !== null)} />
      <div className={styles.content}>
        {showGuestActions && (
          <EventGuestActions
            visibility={d.guestActions}
            onVisibilityChange={onGuestActionsChange}
            preview={!eventId}
            eventId={eventId}
            title={d.title}
            description={d.description}
            start={data.start}
            end={data.end}
            timezone={data.timezone}
            allDay={data.allDay}
            location={data.location}
            shareUrl={shareUrl}
          />
        )}
      </div>
      <footer className={styles.branding}>
        <EnvitefyEventBranding category={page.category} inheritColor />
      </footer>
      {eventId && rsvpOpen && (
        <GuestRsvpModal
          isOpen
          onClose={() => setRsvpOpen(false)}
          eventId={eventId}
          eventTitle={d.title}
          eventCategory={CUSTOM_EVENT_CATEGORIES[page.category]}
          rsvpEmail={d.rsvpEmail}
          rsvpPhone={d.rsvpPhone}
          shareUrl={shareUrl}
          themeColors={{ primary: design.colors.accent, secondary: design.colors.surface }}
        />
      )}
    </article>
  );
}
