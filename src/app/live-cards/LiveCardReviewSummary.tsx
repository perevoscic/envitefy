import type { ReactNode } from "react";
import {
  type LiveCardForm,
  liveCardRegistryUrl,
} from "@/lib/livecard-builder";
import styles from "./livecard-review-summary.module.css";

function calendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(`${value}T12:00:00Z`);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

function wallClock(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return value;
  return new Intl.DateTimeFormat("en-US", {
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2000, 0, 1, Number(match[1]), Number(match[2]))));
}

function Row({ label, value, children }: { label: string; value?: string; children?: ReactNode }) {
  if (!children && !value?.trim()) return null;
  return (
    <div className={styles.row}>
      <dt>{label}</dt>
      <dd>{children || value}</dd>
    </div>
  );
}

function Website({ value }: { value: string }) {
  const href = liveCardRegistryUrl(value);
  return href ? <a href={href} target="_blank" rel="noopener noreferrer">{value}</a> : value;
}

export default function LiveCardReviewSummary({
  form,
}: {
  form: LiveCardForm;
}) {
  const locations = form.locations.map((location, index) => ({ location, index })).filter(({ location }) =>
    [location.label, location.venue, location.address, location.query, location.time, location.note]
      .some((value) => value?.trim()),
  );
  const hasSchedule = Boolean(form.date || form.startTime || form.endDate || form.endTime);
  const hasRsvpDetails = Boolean(form.hostName || form.hostPhone || form.hostEmail || form.rsvpDeadline);
  const hasRegistryDetails = Boolean(form.registryUrl || form.giftNote);

  return (
    <section className={styles.summary} aria-label="Review details">
      <header className={styles.eventHeading}>
        {form.headlineIntro.trim() && <p className={styles.openingLine}>{form.headlineIntro}</p>}
        <h3 className={styles.title}>{form.title || "Your Live Card"}</h3>
      </header>

      <section className={styles.group} aria-label="When and where">
        <h4>When &amp; Where</h4>
        <dl>
          <Row label="Event date" value={form.date ? calendarDate(form.date) : undefined} />
          <Row label="Start time" value={form.startTime ? wallClock(form.startTime) : undefined} />
          <Row label="End date" value={form.endDate ? calendarDate(form.endDate) : undefined} />
          <Row label="End time" value={form.endTime ? wallClock(form.endTime) : undefined} />
          {hasSchedule && <Row label="Event time zone" value={form.timezone} />}
        </dl>
        {locations.length > 0 && <ol className={styles.locations} aria-label="Event locations">
          {locations.map(({ location, index }) => (
            <li key={location.id} className={styles.location}>
              <h5>{index === 0 ? "Main location" : `Location ${index + 1}`}</h5>
              <dl>
                <Row label="What happens here?" value={location.label} />
                <Row label="Venue" value={location.venue} />
                <Row label={location.resolution === "online" ? "Online event link" : "Address"} value={location.address}>
                  {location.resolution === "online" && location.address.trim() ? <Website value={location.address} /> : undefined}
                </Row>
                {!location.venue.trim() && !location.address.trim() && <Row label="Venue or address entered" value={location.query} />}
                <Row label="Local time" value={location.time ? wallClock(location.time) : undefined} />
                {location.time && location.timezone && location.timezone !== form.timezone && <Row label="Location time zone" value={location.timezone} />}
                <Row label="Extra directions" value={location.note} />
              </dl>
            </li>
          ))}
        </ol>}
      </section>

      {(form.overview.trim() || form.instructions.trim()) && <section className={styles.group} aria-label="Messages to guests">
        <h4>Message</h4>
        <dl>
          <Row label="Message to guests" value={form.overview} />
          <Row label="Anything else guests should know?" value={form.instructions} />
        </dl>
      </section>}

      <section className={styles.group} aria-label="RSVP details">
        <h4>RSVP <span className={styles.state}>{form.rsvpEnabled ? "On" : "Off"}</span></h4>
        {!form.rsvpEnabled && hasRsvpDetails && <p className={styles.inactiveNote}>Not shown to guests while RSVPs are off.</p>}
        <dl>
          <Row label="Host name" value={form.hostName} />
          <Row label="Host phone" value={form.hostPhone} />
          <Row label="Host email" value={form.hostEmail} />
          <Row label="Reply by" value={form.rsvpDeadline ? calendarDate(form.rsvpDeadline) : undefined} />
        </dl>
      </section>

      <section className={styles.group} aria-label="Registry details">
        <h4>Registry <span className={styles.state}>{form.registryEnabled ? "On" : "Off"}</span></h4>
        {!form.registryEnabled && hasRegistryDetails && <p className={styles.inactiveNote}>Not shown to guests while the registry is off.</p>}
        <dl>
          {form.registryUrl.trim() && <Row label="Registry or gift-list link"><Website value={form.registryUrl} /></Row>}
          <Row label="Gift message" value={form.giftNote} />
        </dl>
      </section>
    </section>
  );
}
