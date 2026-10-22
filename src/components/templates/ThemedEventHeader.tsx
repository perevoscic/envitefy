import type { CSSProperties, ReactNode } from "react";
import type { ThemedEventDesign } from "@/lib/event-page-themed-designs";
import styles from "./themed-event-header.module.css";
import "@/components/birthdays/redesign/birthday-fonts.css";

/** The same authored artwork/title composition is used by editors and published pages. */
export default function ThemedEventHeader({ design, children, fontFamily }: {
  design?: ThemedEventDesign;
  children: ReactNode;
  fontFamily?: string;
}) {
  if (!design) return <>{children}</>;
  return <div className={styles.shell}><div className={styles.header} data-themed-event-header={design.id}
    data-composition={design.composition} data-page-layout={design.editorLayout}
    style={{ "--themed-page": design.background, "--themed-ink": design.ink,
      "--themed-accent": design.accent, fontFamily: fontFamily || design.font } as CSSProperties}>
    {children}
  </div></div>;
}
