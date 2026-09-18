"use client";
import { useState } from "react";
import type { SignupFormSection } from "@/types/signup";
import { generateSignupShifts } from "@/lib/signup-composer";
import styles from "./signup-composer.module.css";

export default function SignupSectionRules({
  section,
  onChange,
}: {
  section: SignupFormSection;
  onChange: (section: SignupFormSection) => void;
}) {
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("12:00");
  const [minutes, setMinutes] = useState(30);
  const [capacity, setCapacity] = useState(2);
  const [message, setMessage] = useState("");
  return (
    <details className={styles.headingOptions}>
      <summary>Section rules &amp; shift times</summary>
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
            <option value="times">Volunteer shifts / time slots</option>
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
          <h4>Generate shifts</h4>
          <p>
            Shifts use the event day and timezone. New shifts are added; existing slots and signups
            are kept.
          </p>
          <div className={styles.slotRow}>
            <label className={styles.field}>
              First shift starts
              <input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            </label>
            <label className={styles.field}>
              Last shift ends
              <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </label>
            <label className={styles.field}>
              Minutes per shift
              <input
                type="number"
                min={5}
                max={720}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
            </label>
            <label className={styles.field}>
              People per shift
              <input
                type="number"
                min={1}
                max={999}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => {
              try {
                const slots = generateSignupShifts(start, end, minutes, capacity);
                onChange({ ...section, slots: [...section.slots, ...slots] });
                setMessage(`${slots.length} shifts added. Save or publish when ready.`);
              } catch (error) {
                setMessage(error instanceof Error ? error.message : "Check the shift times.");
              }
            }}
          >
            Add generated shifts
          </button>
          <p role="status">{message}</p>
        </div>
      )}
    </details>
  );
}
