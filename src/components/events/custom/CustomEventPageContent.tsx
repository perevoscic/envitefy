"use client";
import Link from "next/link";
import { type CSSProperties, useState } from "react";
import EnvitefyEventBranding from "@/components/branding/EnvitefyEventBranding";
import EventGuestActions from "@/components/event-templates/EventGuestActions";
import type { EventGuestActionVisibility } from "@/lib/event-guest-actions";
import GuestRsvpModal from "@/components/GuestRsvpModal";
import {
  CUSTOM_EVENT_CATEGORIES,
  type CustomEventPage,
  customEventPageData,
  EVENT_DESIGN_FONTS,
  EVENT_DESIGN_FONT_PAIRS,
  safeEventLink,
} from "@/lib/event-custom-design";
import "@/components/birthdays/redesign/birthday-fonts.css";
import styles from "./custom-event.module.css";

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
      <header className={styles.hero}>
        <div className={styles.artwork}>
          <img src={page.artwork} alt={design.description} />
        </div>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>{CUSTOM_EVENT_CATEGORIES[page.category]}</p>
          <h1>{d.title || "Your event title"}</h1>
          {d.host && <p className={styles.host}>Hosted by {d.host}</p>}
          {(date || time) && (
            <p className={styles.when}>{[date, time].filter(Boolean).join(" · ")}</p>
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
        </div>
      </header>
      <div className={styles.content}>
        {d.description && (
          <section className={styles.section}>
            <h2>You're invited</h2>
            <p>{d.description}</p>
          </section>
        )}
        {d.sections.map((section, index) => (
          <section key={index} className={styles.section}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </section>
        ))}
        {registryLinks.length > 0 && (
          <section className={styles.section}>
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
        )}
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
