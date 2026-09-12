"use client";

import { useState } from "react";
import { getSignupDesign, SIGNUP_DESIGN_PALETTES } from "@/lib/signup-designs";
import {
  createSignupAppearance,
  getSignupTheme,
  SIGNUP_FONT_PAIRS,
  SIGNUP_HEADER_LAYOUTS,
  signupContrast,
} from "@/lib/signup-themes";
import type { SignupAppearance, SignupForm } from "@/types/signup";
import styles from "./signup-editor.module.css";

export default function SignupDesignPanel({
  form,
  onChange,
}: {
  form: SignupForm;
  onChange: (form: SignupForm) => void;
}) {
  const [error, setError] = useState("");
  const current = getSignupTheme(form.appearance?.themeId);
  const currentDesign = getSignupDesign(form.appearance?.designId);
  const currentColors = currentDesign ? SIGNUP_DESIGN_PALETTES[currentDesign.palette] : current;
  const appearance = form.appearance || {
    ...createSignupAppearance("clean-clear"),
    headerLayout: ["header-1", "header-2", "header-3", "header-4", "header-5", "header-6"].includes(
      form.header?.templateId || "",
    )
      ? (form.header?.templateId as SignupAppearance["headerLayout"])
      : ("header-1" as const),
  };
  const change = (patch: Partial<SignupAppearance>) =>
    onChange({ ...form, appearance: { ...appearance, ...patch } });
  return (
    <div className={styles.panel}>
      <fieldset className={styles.field}>
        <legend>Color palette</legend>
        <div className={styles.swatches}>
          {(["original", "soft", "ink"] as const).map((palette) => (
            <button
              key={palette}
              type="button"
              aria-pressed={appearance.palette === palette}
              onClick={() => change({ palette, accent: undefined })}
            >
              <span
                className={styles.swatch}
                style={{
                  background:
                    palette === "ink"
                      ? currentColors?.ink || "#222D40"
                      : palette === "soft"
                        ? currentColors?.soft || "#E8ECF2"
                        : currentColors?.accent || "#354B72",
                }}
              />
              {palette === "original" ? "Original" : palette === "soft" ? "Soft" : "Ink"}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className={styles.field}>
        <legend>Typography</legend>
        <div className={styles.segmented}>
          {SIGNUP_FONT_PAIRS.map((pair) => (
            <button
              type="button"
              key={pair.id}
              aria-pressed={appearance.fontPair === pair.id}
              onClick={() => change({ fontPair: pair.id })}
              style={{ fontFamily: pair.heading }}
            >
              {pair.name}
            </button>
          ))}
        </div>
      </fieldset>
      <div className={styles.field}>
        <label htmlFor="signup-header-layout">Header layout</label>
        <select
          id="signup-header-layout"
          value={appearance.headerLayout}
          onChange={(event) =>
            change({ headerLayout: event.target.value as SignupAppearance["headerLayout"] })
          }
        >
          {SIGNUP_HEADER_LAYOUTS.map((layout) => (
            <option key={layout.id} value={layout.id}>
              {layout.name}
            </option>
          ))}
        </select>
      </div>
      <details className={styles.details}>
        <summary>Fine-tune the design</summary>
        <div className={styles.field}>
          <label htmlFor="signup-density">Spacing</label>
          <select
            id="signup-density"
            value={appearance.density}
            onChange={(event) =>
              change({ density: event.target.value as SignupAppearance["density"] })
            }
          >
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="signup-slot-layout">Slot style</label>
          <select
            id="signup-slot-layout"
            value={appearance.slotLayout}
            onChange={(event) =>
              change({ slotLayout: event.target.value as SignupAppearance["slotLayout"] })
            }
          >
            <option value="cards">Cards</option>
            <option value="rows">Rows</option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="signup-accent">Custom accent</label>
          <input
            id="signup-accent"
            type="color"
            value={
              appearance.accent ||
              (appearance.palette === "ink" ? currentColors?.ink : currentColors?.accent) ||
              "#354B72"
            }
            onChange={(event) => {
              const accent = event.target.value;
              if (signupContrast(accent, "#FFFFFF") < 4.5) {
                setError("Choose a darker accent so button text stays easy to read.");
                return;
              }
              setError("");
              change({ accent });
            }}
          />
          <span className={styles.help}>
            We check the contrast of your accent with white button text.
          </span>
        </div>
      </details>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
