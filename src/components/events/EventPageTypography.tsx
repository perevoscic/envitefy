"use client";

import type { CSSProperties, ReactNode } from "react";
import { eventTitleFontFamily } from "@/lib/event-title-font";
import { useEventPageComposition } from "./EventPageCompositionContext";
import "@/components/birthdays/redesign/birthday-fonts.css";
import styles from "./event-page-typography.module.css";

/** An absent override preserves every design's existing typography. */
export default function EventPageTypography({ children }: { children: ReactNode }) {
  const composition = useEventPageComposition();
  const family = eventTitleFontFamily(composition?.value?.titleFont);
  return <div className={styles.boundary} data-event-title-font={composition?.value?.titleFont}
    style={{ "--event-title-font": family } as CSSProperties}>{children}</div>;
}
