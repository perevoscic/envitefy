"use client";
import type { EventPageComposition } from "@/lib/event-page-composition";
import type { CustomEventPage } from "@/lib/event-custom-design";
import CustomEventLayoutPicker from "./custom/CustomEventLayoutPicker";
import styles from "./event-editor.module.css";

export default function EventPageLayoutPicker({
  value,
  onChange,
  artwork,
  title,
}: {
  value?: EventPageComposition;
  onChange: (value: EventPageComposition | undefined) => void;
  artwork?: string;
  title?: string;
}) {
  const page = {
    artwork: artwork || "",
    details: { title: title || "Your event" },
    design: {
      layout: value?.layout,
      colors: { page: "#f1edf5", surface: "#ffffff", ink: "#493d5c", accent: "#7052a1" },
    },
  } as CustomEventPage;
  return (
    <div className={styles.sectionNavigation}>
      <button
        type="button"
        className={styles.menuCard}
        aria-pressed={!value?.layout}
        onClick={() => onChange(value ? { ...value, layout: undefined } : undefined)}
      >
        <strong>Template layout</strong>
        <span>Keep this design’s original section arrangement.</span>
      </button>
      <CustomEventLayoutPicker
        page={page}
        mode="sections"
        onChange={(layout) => onChange({ version: 1, sections: [], ...value, layout })}
      />
    </div>
  );
}
