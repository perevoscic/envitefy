"use client";

import { useEffect, useRef, useState } from "react";
import type { SignupForm } from "@/types/signup";
import SignupDetailsEditor, { type SignupDetailsSection } from "./SignupDetailsEditor";
import styles from "./signup-composer.module.css";

export type SignupHeaderEditing = {
  onChange: (form: SignupForm) => void;
  details: SignupDetailsSection | null;
  onDetails: (section: SignupDetailsSection | null) => void;
};

export default function SignupHeaderDetailsEditor({
  form,
  section,
  onChange,
  onClose,
}: {
  form: SignupForm;
  section: SignupDetailsSection;
  onChange: (form: SignupForm) => void;
  onClose: () => void;
}) {
  const [original] = useState(form);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    panel.current
      ?.querySelector<HTMLInputElement>("input, textarea, button")
      ?.focus({ preventScroll: true });
  }, []);
  const cancel = () => {
    const draft = original;
    const fields =
      section === "schedule"
        ? { start: draft.start, end: draft.end, allDay: draft.allDay, timezone: draft.timezone }
        : section === "location"
          ? { locationMode: draft.locationMode, location: draft.location, venue: draft.venue }
          : {
              guestPlanning: draft.guestPlanning,
              parkingInfo: draft.parkingInfo,
              arrivalInstructions: draft.arrivalInstructions,
              requirements: draft.requirements,
              safetyNotes: draft.safetyNotes,
            };
    onChange({ ...form, ...fields });
    onClose();
  };
  return (
    <div
      ref={panel}
      className={styles.inlineDetails}
      role="group"
      aria-label={`Edit ${section}`}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          cancel();
        }
      }}
    >
      <SignupDetailsEditor form={form} onChange={onChange} section={section} />
      <div className={styles.inlineActions}>
        <button type="button" onClick={onClose}>
          Done
        </button>
        <button type="button" onClick={cancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
