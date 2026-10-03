"use client";

import { Check } from "lucide-react";
import type { CSSProperties } from "react";
import { type CustomEventPage, EVENT_DESIGN_LAYOUT_OPTIONS } from "@/lib/event-custom-design";
import styles from "./custom-event-layout-picker.module.css";

export default function CustomEventLayoutPicker({
  page,
  onChange,
  mode,
}: {
  page: CustomEventPage;
  onChange: (layout: CustomEventPage["design"]["layout"]) => void;
  mode?: "sections";
}) {
  const colors = page.design.colors;
  const palette = {
    "--thumbnail-page": colors.page,
    "--thumbnail-surface": colors.surface,
    "--thumbnail-ink": colors.ink,
    "--thumbnail-accent": colors.accent,
  } as CSSProperties;
  return (
    <fieldset className={styles.picker}>
      <legend>{mode === "sections" ? "Section layout" : "Layout"}</legend>
      <div className={styles.choices}>
        {EVENT_DESIGN_LAYOUT_OPTIONS.map(({ id, label, description }) => {
          const titleAbove = ["split", "editorial", "minimal", "cards"].includes(id);
          const heading = (
            <span className={styles.heading}>{page.details.title || "Your event"}</span>
          );
          return (
            <button
              type="button"
              key={id}
              className={styles.choice}
              aria-label={`Choose ${label} layout`}
              aria-pressed={page.design.layout === id}
              onClick={() => onChange(id)}
            >
              <span
                className={styles.thumbnail}
                data-layout={id}
                data-mode={mode}
                style={palette}
                aria-hidden="true"
              >
                {mode === "sections" ? (
                  <>
                    {heading}
                    <span className={styles.picture}>
                      {page.artwork && <img src={page.artwork} alt="" loading="lazy" />}
                    </span>
                    <span className={styles.sections}>
                      <span />
                      <span />
                      <span />
                    </span>
                  </>
                ) : (
                  <>
                    {titleAbove && heading}
                    <span className={styles.picture}>
                      {page.artwork && <img src={page.artwork} alt="" loading="lazy" />}
                    </span>
                    <span className={styles.details}>
                      {!titleAbove && heading}
                      <span />
                      <span />
                      <i />
                    </span>
                    <span className={styles.sections}>
                      <span />
                      <span />
                    </span>
                  </>
                )}
              </span>
              <span className={styles.label}>
                {label}
                {page.design.layout === id && <Check size={16} aria-hidden="true" />}
              </span>
              <span className={styles.description}>
                {mode === "sections"
                  ? {
                      split: "Sections in two columns.",
                      banner: "Full-width sections with extra space.",
                      poster: "Centered sections in a framed page.",
                      editorial: "A staggered reading layout.",
                      spotlight: "Highlight the first section.",
                      minimal: "A narrow, simple reading layout.",
                      cards: "Information cards in two columns.",
                    }[id]
                  : description}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
