"use client";
import { formatCalendarDateTimeInTimeZone } from "@/lib/calendar-date-time";
import type { SignupForm, SignupFormSettings } from "@/types/signup";
import styles from "./signup-composer.module.css";

export default function SignupSettingsEditor({
  form,
  onChange,
}: {
  form: SignupForm;
  onChange: (form: SignupForm) => void;
}) {
  const set = (patch: Partial<SignupFormSettings>) =>
    onChange({ ...form, settings: { ...form.settings, ...patch } });
  const toggle = (
    key:
      | "collectEmail"
      | "collectPhone"
      | "waitlistEnabled"
      | "showRemainingSpots"
      | "hideParticipantNames"
      | "lockWhenFull",

    label: string,
  ) => (
    <label className={styles.check}>
      <input
        type="checkbox"
        checked={!!form.settings[key]}
        onChange={(e) => set({ [key]: e.target.checked })}
      />
      {label}
    </label>
  );
  return (
    <div className={styles.library} id="signup-rules" tabIndex={-1}>
      <h3>Contact details</h3>
      <p>Name is always collected after guests choose a slot.</p>
      {toggle("collectEmail", "Require email")}
      {toggle("collectPhone", "Require phone number")}
      <p>
        When an email is collected, guests receive a confirmation with their choices and a private
        link to update or cancel. Automatic reminders are not currently sent. Use the Host dashboard
        to export responses and follow up through your usual email or group channel.
      </p>
      <h3>Overall form limits</h3>
      <p>
        Set section-specific limits beside each section. These limits apply across the whole form.
      </p>
      <label className={styles.field}>
        Each person can choose
        <select
          value={form.settings.allowMultipleSlotsPerPerson ? "multiple" : "one"}
          onChange={(e) => set({ allowMultipleSlotsPerPerson: e.target.value === "multiple" })}
        >
          <option value="one">One slot</option>
          <option value="multiple">Multiple slots</option>
        </select>
      </label>
      {form.settings.allowMultipleSlotsPerPerson && (
        <label className={styles.field}>
          Maximum choices across the whole form
          <input
            type="number"
            min={1}
            max={50}
            value={form.settings.maxSlotsPerPerson ?? ""}
            placeholder="No limit"
            onChange={(e) =>
              set({ maxSlotsPerPerson: e.target.value ? Number(e.target.value) : null })
            }
          />
        </label>
      )}
      <label className={styles.field}>
        Default maximum quantity per choice
        <input
          type="number"
          min={1}
          max={50}
          value={form.settings.maxQuantityPerSlot ?? form.settings.maxGuestsPerSignup}
          onChange={(e) =>
            set({ maxQuantityPerSlot: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })
          }
        />
      </label>
      <label className={styles.check}>
        <input
          type="checkbox"
          checked={!!form.settings.collectGuestCount}
          onChange={(e) => set({ collectGuestCount: e.target.checked })}
        />
        Ask how many extra guests are attending
      </label>
      {form.settings.collectGuestCount && (
        <label className={styles.field}>
          Maximum extra guests
          <input
            type="number"
            min={1}
            max={20}
            value={form.settings.maxGuestsPerSignup}
            onChange={(e) =>
              set({ maxGuestsPerSignup: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })
            }
          />
        </label>
      )}
      {toggle("waitlistEnabled", "Offer a waitlist when full")}
      {toggle("lockWhenFull", "Prevent bookings beyond capacity")}
      {toggle("showRemainingSpots", "Show remaining places")}
      {toggle("hideParticipantNames", "Hide participant names")}
      <details>
        <summary>Signup window</summary>
        <p>Leave blank to accept signups as soon as the form is published.</p>
        <label className={styles.field}>
          Opens
          <input
            type="datetime-local"
            value={
              formatCalendarDateTimeInTimeZone(form.settings.signupOpensAt, form.timezone)?.slice(
                0,
                16,
              ) || ""
            }
            onChange={(e) => set({ signupOpensAt: e.target.value || null })}
          />
        </label>
        <label className={styles.field}>
          Closes
          <input
            type="datetime-local"
            value={
              formatCalendarDateTimeInTimeZone(form.settings.signupClosesAt, form.timezone)?.slice(
                0,
                16,
              ) || ""
            }
            onChange={(e) => set({ signupClosesAt: e.target.value || null })}
          />
        </label>
        <p>Times use the event timezone: {form.timezone || "your local timezone"}.</p>
      </details>
    </div>
  );
}
