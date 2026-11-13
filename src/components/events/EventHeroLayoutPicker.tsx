"use client";

import { Check } from "lucide-react";
import { EVENT_HERO_LAYOUT_PRESETS, type EventHeroLayout } from "@/lib/event-hero-layout";
import styles from "./event-hero-layout-picker.module.css";
import treatments from "./event-hero-treatments.module.css";

export default function EventHeroLayoutPicker({ value, onChange, artwork, title }: {
  value?: EventHeroLayout;
  onChange: (value: EventHeroLayout | undefined) => void;
  artwork?: string;
  title?: string;
}) {
  return (
    <div className={styles.picker}>
      <h3 className={styles.groupTitle}>Image designs</h3>
      <div className={styles.choices} role="group" aria-label="Event image designs">
        {EVENT_HERO_LAYOUT_PRESETS.filter(({ layout }) => layout.imageStyle).map(({ id, label, layout }) => {
          const selected = value && value.imageStyle === layout.imageStyle && (Object.keys(layout) as Array<keyof EventHeroLayout>)
            .every((key) => value[key] === layout[key]);
          return (
            <button
              type="button"
              key={id}
              className={styles.choice}
              aria-label={`Choose ${label} hero layout`}
              aria-pressed={Boolean(selected)}
              onClick={() => onChange(selected ? undefined : { ...layout })}
            >
              <span
                className={styles.thumbnail}
                data-appearance-scope="authored"
                data-position={layout.imagePosition}
                data-shape={layout.imageShape}
                data-title-position={layout.titlePosition}
                aria-hidden="true"
              >
                <span className={`${styles.picture} ${treatments.shadow}`}>
                <span className={`${styles.pictureSurface} ${treatments.treatment}`} data-image-style={layout.imageStyle}>
                  {artwork && <img src={artwork} alt="" loading="lazy" />}
                </span>
                </span>
                <span className={styles.heading}>{title || "Event title"}</span>
              </span>
              <span className={styles.label}>{label}{selected && <Check size={15} aria-hidden="true" />}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
