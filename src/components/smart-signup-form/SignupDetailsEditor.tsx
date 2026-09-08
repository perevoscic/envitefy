"use client";

import EventGuestPlanningEditor from "@/components/event-templates/EventGuestPlanningEditor";
import {
  formatCalendarDateInTimeZone,
  formatCalendarDateTimeInTimeZone,
  normalizeCalendarTimeZone,
} from "@/lib/calendar-date-time";
import type { SignupForm } from "@/types/signup";
import styles from "./signup-editor.module.css";

export default function SignupDetailsEditor({
  form,
  onChange,
}: {
  form: SignupForm;
  onChange: (form: SignupForm) => void;
}) {
  const field = (
    key: "title" | "description" | "venue" | "location" | "start" | "end" | "timezone",
    value: string,
  ) => onChange({ ...form, [key]: value || null });
  const allDay = Boolean(form.allDay || (form.start && /^\d{4}-\d{2}-\d{2}$/.test(form.start)));
  const dateValue = (value?: string | null) =>
    allDay
      ? formatCalendarDateInTimeZone(value, form.timezone) || ""
      : formatCalendarDateTimeInTimeZone(value, form.timezone)?.slice(0, 16) || "";
  return (
    <div className={styles.panel}>
      <div className={styles.field}>
        <label htmlFor="signup-title">What are you getting together for?</label>
        <input
          id="signup-title"
          value={form.title}
          onChange={(event) => onChange({ ...form, title: event.target.value })}
          placeholder="Our neighborhood potluck"
          maxLength={180}
        />
      </div>
      <div className={styles.twoColumns}>
        <div className={styles.field}>
          <label htmlFor="signup-group">Group or organization</label>
          <input
            id="signup-group"
            value={form.header?.groupName || ""}
            onChange={(event) =>
              onChange({ ...form, header: { ...form.header, groupName: event.target.value } })
            }
            placeholder="Optional"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="signup-host">Organizer name</label>
          <input
            id="signup-host"
            value={form.header?.creatorName || ""}
            onChange={(event) =>
              onChange({ ...form, header: { ...form.header, creatorName: event.target.value } })
            }
            placeholder="Who should guests look for?"
          />
        </div>
      </div>
      <div className={styles.field}>
        <label htmlFor="signup-description">A short welcome</label>
        <textarea
          id="signup-description"
          value={form.description || ""}
          onChange={(event) => field("description", event.target.value)}
          rows={3}
          placeholder="Tell guests what to expect and how they can help."
        />
      </div>
      <label className={styles.help}>
        <input
          type="checkbox"
          checked={allDay}
          onChange={(event) =>
            onChange({
              ...form,
              allDay: event.target.checked,
              start: form.start
                ? event.target.checked
                  ? dateValue(form.start).slice(0, 10)
                  : `${dateValue(form.start).slice(0, 10)}T09:00`
                : null,
              end: form.end
                ? event.target.checked
                  ? dateValue(form.end).slice(0, 10)
                  : `${dateValue(form.end).slice(0, 10)}T17:00`
                : null,
            })
          }
        />{" "}
        All-day event
      </label>
      <div className={styles.twoColumns}>
        <div className={styles.field}>
          <label htmlFor="signup-start">Starts</label>
          <input
            id="signup-start"
            type={allDay ? "date" : "datetime-local"}
            value={dateValue(form.start)}
            onChange={(event) => field("start", event.target.value)}
          />
          <span className={styles.help}>Leave blank if the date is still being planned.</span>
        </div>
        <div className={styles.field}>
          <label htmlFor="signup-end">
            Ends <span>(optional)</span>
          </label>
          <input
            id="signup-end"
            type={allDay ? "date" : "datetime-local"}
            value={dateValue(form.end)}
            onChange={(event) => field("end", event.target.value)}
          />
        </div>
      </div>
      <div className={styles.field}>
        <label htmlFor="signup-timezone">Timezone</label>
        <input
          id="signup-timezone"
          value={form.timezone || ""}
          placeholder={Intl.DateTimeFormat().resolvedOptions().timeZone}
          onChange={(event) => field("timezone", event.target.value)}
          onBlur={() =>
            onChange({
              ...form,
              timezone: normalizeCalendarTimeZone(
                form.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
              ),
            })
          }
          list="signup-timezones"
        />
        <datalist id="signup-timezones">
          {[
            "America/New_York",
            "America/Chicago",
            "America/Denver",
            "America/Los_Angeles",
            "Europe/London",
            "UTC",
          ].map((zone) => (
            <option key={zone} value={zone} />
          ))}
        </datalist>
      </div>
      <fieldset className={styles.field}>
        <legend>Where is it happening?</legend>
        <div className={styles.segmented}>
          {(["in-person", "online", "tba"] as const).map((mode) => (
            <button
              type="button"
              key={mode}
              aria-pressed={(form.locationMode || "in-person") === mode}
              onClick={() => onChange({ ...form, locationMode: mode })}
            >
              {mode === "in-person"
                ? "In person"
                : mode === "online"
                  ? "Online"
                  : "To be announced"}
            </button>
          ))}
        </div>
      </fieldset>
      {form.locationMode !== "tba" && (
        <div className={styles.twoColumns}>
          {form.locationMode !== "online" && (
            <div className={styles.field}>
              <label htmlFor="signup-venue">Venue</label>
              <input
                id="signup-venue"
                value={form.venue || ""}
                onChange={(event) => field("venue", event.target.value)}
                placeholder="Community center"
              />
            </div>
          )}
          <div className={styles.field}>
            <label htmlFor="signup-location">
              {form.locationMode === "online" ? "Meeting link" : "Address"}
            </label>
            <input
              id="signup-location"
              type={form.locationMode === "online" ? "url" : "text"}
              value={form.location || ""}
              onChange={(event) => field("location", event.target.value)}
              placeholder={form.locationMode === "online" ? "https://…" : "Street, city, state"}
            />
          </div>
        </div>
      )}
      <details className={styles.details}>
        <summary>Arrival, accessibility & other details</summary>
        <EventGuestPlanningEditor
          value={form.guestPlanning}
          onChange={(guestPlanning) => onChange({ ...form, guestPlanning })}
        />
        {(
          [
            ["parkingInfo", "Parking"],
            ["arrivalInstructions", "Arrival instructions"],
            ["requirements", "What to bring"],
            ["safetyNotes", "Safety & dietary notes"],
          ] as const
        ).map(([key, name]) => (
          <div className={styles.field} key={key}>
            <label htmlFor={`signup-${key}`}>{name}</label>
            <textarea
              id={`signup-${key}`}
              rows={2}
              value={form[key] || ""}
              onChange={(event) => onChange({ ...form, [key]: event.target.value })}
            />
          </div>
        ))}
      </details>
    </div>
  );
}
