"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import { FontPairingSelect } from "@/components/design-panel/FontPairingSelect";
import { HolidayBackgroundPicker } from "@/components/events/HolidayPageBackground";
import { getHolidayBackground, getHolidayBackgroundChoice } from "@/lib/holiday-backgrounds";
import { restoreSignupTheme } from "@/lib/signup-custom-theme";
import { getSignupDesign, SIGNUP_DESIGN_PALETTES } from "@/lib/signup-designs";
import {
  createSignupAppearance,
  getSignupTheme,
  resolveSignupHolidayBackground,
  SIGNUP_FONT_PAIRS,
  SIGNUP_HEADER_LAYOUTS,
  signupContrast,
} from "@/lib/signup-themes";
import type { SignupAppearance, SignupForm } from "@/types/signup";
import SignupCustomThemeDialog from "./SignupCustomThemeDialog";
import custom from "./signup-custom-theme.module.css";
import styles from "./signup-editor.module.css";
import layoutStyles from "./signup-native-workspace.module.css";

export default function SignupDesignPanel({
  form,
  onChange,
  onUseTheme,
  eventId,
  mode = "all",
}: {
  form: SignupForm;
  onChange: (form: SignupForm) => void;
  onUseTheme: () => void;
  eventId?: string | null;
  mode?: "all" | "design" | "background" | "layout";
}) {
  const [error, setError] = useState("");
  const [redesignOpen, setRedesignOpen] = useState(false);
  const current = getSignupTheme(form.appearance?.themeId);
  const currentDesign = getSignupDesign(form.appearance?.designId);
  const holidayBackground = getHolidayBackground(currentDesign?.id);
  const selectedBackground = resolveSignupHolidayBackground(form.appearance);
  const currentColors =
    form.appearance?.customTheme?.colors ||
    (selectedBackground
      ? { ...selectedBackground, soft: selectedBackground.surface }
      : undefined) ||
    (currentDesign ? SIGNUP_DESIGN_PALETTES[currentDesign.palette] : current);
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
    <div>
      {redesignOpen && (
        <SignupCustomThemeDialog
          form={form}
          eventId={eventId}
          onClose={() => setRedesignOpen(false)}
          onUseTheme={(theme) => {
            onChange(restoreSignupTheme(form, theme));
            setRedesignOpen(false);
            onUseTheme();
          }}
        />
      )}
      <div className={styles.panel}>
        {(mode === "all" || mode === "design") && (
          <button type="button" className={custom.redesign} onClick={() => setRedesignOpen(true)}>
            <Sparkles size={18} aria-hidden /> Redesign with Envitefy
          </button>
        )}
        {(mode === "all" || mode === "background") &&
          (holidayBackground && currentDesign ? (
            <fieldset className={styles.field}>
              <legend>Background</legend>
              <HolidayBackgroundPicker
                designId={currentDesign.id}
                value={appearance.pageBackground}
                onChange={(pageBackground) =>
                  change({
                    pageBackground:
                      pageBackground ||
                      getHolidayBackgroundChoice(holidayBackground.id, "template"),
                    palette: "original",
                    accent: undefined,
                  })
                }
              />
            </fieldset>
          ) : (
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
          ))}
        {(mode === "all" || mode === "design") && (
          <fieldset className={styles.field}>
            <legend>Typography</legend>
            <FontPairingSelect
              options={SIGNUP_FONT_PAIRS}
              value={appearance.fontPair}
              onChange={(fontPair) => change({ fontPair })}
            />
          </fieldset>
        )}
        {mode === "all" && (
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
        )}
        {mode === "layout" && (
          <div className={styles.field}>
            <p>Arrange your hero image and title.</p>
            <div className={layoutStyles.layoutGrid}>
              {SIGNUP_HEADER_LAYOUTS.map((layout) => (
                <button
                  key={layout.id}
                  type="button"
                  aria-pressed={appearance.headerLayout === layout.id}
                  className={layoutStyles.layoutOption}
                  onClick={() => change({ headerLayout: layout.id })}
                >
                  <span
                    aria-hidden="true"
                    className={layoutStyles.layoutPreview}
                    data-layout={layout.id}
                  >
                    {layout.id !== "none" && <i />}
                    <span>Event title</span>
                    {["header-4", "header-5", "header-6"].includes(layout.id) && <i />}
                    {layout.id === "header-6" && <i />}
                  </span>
                  <span>{layout.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {(mode === "all" || mode === "design") && (
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
        )}
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
