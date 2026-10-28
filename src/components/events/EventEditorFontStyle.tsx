"use client";

import { EVENT_TITLE_FONTS } from "@/lib/event-title-font";
import { useEventPageComposition } from "./EventPageCompositionContext";
import styles from "./event-editor.module.css";

/** Typography belongs inside Design; the existing editor navigation stays intact. */
export default function EventEditorFontStyle() {
  const composition = useEventPageComposition();
  if (!composition?.onChange) return null;
  return (
    <fieldset className={styles.field}>
      <legend>Font style</legend>
      <label>
        Title font
        <select value={composition.value?.titleFont || ""} onChange={(event) => {
          const titleFont = EVENT_TITLE_FONTS.find(font => font.id === event.target.value)?.id;
          composition.onChange?.({ version: 1, sections: [], ...composition.value, titleFont });
        }}>
          <option value="">Design default</option>
          {EVENT_TITLE_FONTS.map(font => <option key={font.id} value={font.id} style={{ fontFamily: font.family }}>{font.label}</option>)}
        </select>
      </label>
    </fieldset>
  );
}
