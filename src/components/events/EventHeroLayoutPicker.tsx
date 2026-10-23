"use client";

import { Check } from "lucide-react";
import { EVENT_HERO_LAYOUT_PRESETS, type EventHeroLayout } from "@/lib/event-hero-layout";
import styles from "./event-hero-layout-picker.module.css";

export default function EventHeroLayoutPicker({ value, onChange, artwork, title }: {
  value?: EventHeroLayout;
  onChange: (value: EventHeroLayout | undefined) => void;
  artwork?: string;
  title?: string;
}) {
  return (
    <div className={styles.picker}>
      <div className={styles.choices} role="group" aria-label="Hero image and title layouts">
        {EVENT_HERO_LAYOUT_PRESETS.map(({ id, label, layout }) => {
          const selected = value && (Object.keys(layout) as Array<keyof EventHeroLayout>)
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
                <span className={styles.picture}>
                  {artwork && <img src={artwork} alt="" loading="lazy" />}
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
