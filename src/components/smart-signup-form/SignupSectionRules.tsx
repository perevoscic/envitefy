"use client";
import { useState } from "react";
import {
  appendSignupTimeSlots,
  generateSignupShifts,
  replaceableSignupStarterIds,
} from "@/lib/signup-composer";
import type { SignupForm, SignupFormSection } from "@/types/signup";
import styles from "./signup-composer.module.css";

export default function SignupSectionRules({
  section,
  form,
  onChange,
}: {
  section: SignupFormSection;
  form: SignupForm;
  onChange: (section: SignupFormSection) => void;
}) {
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("12:00");
  const [minutes, setMinutes] = useState(30);
  const [capacity, setCapacity] = useState(section.purpose === "times" ? 1 : 2);
  const [replaceStarters, setReplaceStarters] = useState(false);
  const starterIds = replaceableSignupStarterIds(form, section);
  const [message, setMessage] = useState("");
  return (
    <details
      className={styles.headingOptions}
      open={section.purpose === "times" && section.slots.length === 0}
    >
      <summary>Section rules &amp; time slots</summary>
      <div className={styles.slotRow}>
        <label className={styles.field}>
          Section type
          <select
            value={section.purpose || "custom"}
            onChange={(e) => {
              const purpose = e.target.value as NonNullable<SignupFormSection["purpose"]>;
              onChange({
                ...section,
                purpose,
                unitLabel: purpose === "items" ? "items" : "people",
                maxSelectionsPerPerson: purpose === "times" || purpose === "volunteers" ? 1 : null,
                maxQuantityPerSlot: purpose === "items" ? 10 : 1,
              });
            }}
          >
            <option value="registration">Attendance / registration</option>
            <option value="volunteers">Volunteer roles</option>
            <option value="times">Appointments / time slots</option>
            <option value="items">Items to bring</option>
            <option value="custom">Custom signup</option>
          </select>
        </label>
        <label className={styles.field}>
          Count these as
          <input
            maxLength={40}
            value={section.unitLabel || ""}
            placeholder="people, packs, bags…"
            onChange={(e) => onChange({ ...section, unitLabel: e.target.value })}
          />
        </label>
      </div>
      <div className={styles.slotRow}>
        <label className={styles.field}>
          Maximum choices per person in this section
          <input
            type="number"
            min={1}
            max={50}
            placeholder="No limit"
            value={section.maxSelectionsPerPerson ?? ""}
            onChange={(e) =>
              onChange({
                ...section,
                maxSelectionsPerPerson: e.target.value ? Number(e.target.value) : null,
              })
            }
          />
        </label>
        <label className={styles.field}>
          Maximum quantity per choice
          <input
            type="number"
            min={1}
            max={50}
            placeholder="Use form default"
            value={section.maxQuantityPerSlot ?? ""}
            onChange={(e) =>
              onChange({
                ...section,
                maxQuantityPerSlot: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </label>
      </div>
      <p className={styles.hint}>
        For example: one volunteer shift, with several donation items in a separate section. Any
        overall form limit still applies.
      </p>
      {(section.purpose === "times" || section.purpose === "volunteers") && (
        <div className={styles.headingOptions}>
          <h4>{section.purpose === "times" ? "Generate appointments" : "Generate shifts"}</h4>
          <p>
            Time slots use the event day and timezone. Existing choices and signups are kept.
            Identical time ranges are skipped.
          </p>
          <div className={styles.slotRow}>
            <label className={styles.field}>
              First slot starts
              <input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            </label>
            <label className={styles.field}>
              Last slot ends
              <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </label>
            <label className={styles.field}>
              Minutes per slot
              <input
                type="number"
                min={5}
                max={720}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
            </label>
            <label className={styles.field}>
              People per slot
              <input
                type="number"
                min={1}
                max={999}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
              />
            </label>
          </div>
          {starterIds.length > 0 && (
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={replaceStarters}
                onChange={(event) => setReplaceStarters(event.target.checked)}
              />
              Replace {starterIds.length} untimed starter {starterIds.length === 1 ? "row" : "rows"}{" "}
              (First shift / Second shift). Edited rows and rows with signups are kept.
            </label>
          )}
          <button
            type="button"
            onClick={() => {
              try {
                const slots = generateSignupShifts(
                  start,
                  end,
                  minutes,
                  capacity,
                  section.purpose === "times" ? "Appointment" : "Volunteer shift",
                );
                const next = appendSignupTimeSlots(form, section, slots, replaceStarters);
                const added = next.slots.filter(
                  (slot) => !section.slots.some((current) => current.id === slot.id),
                ).length;
                onChange(next);
                setMessage(`${added} time slots added. Save or publish when ready.`);
              } catch (error) {
                setMessage(error instanceof Error ? error.message : "Check the time slots.");
              }
            }}
          >
            Add generated time slots
          </button>
          <p role="status">{message}</p>
        </div>
      )}
    </details>
  );
}
