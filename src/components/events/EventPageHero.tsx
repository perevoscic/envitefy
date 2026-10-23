"use client";

import type { CSSProperties, ReactNode } from "react";
import { normalizeEventHeroLayout, type EventHeroLayout } from "@/lib/event-hero-layout";
import { useEventPageComposition } from "./EventPageCompositionContext";
import styles from "./event-page-hero.module.css";

/** Explicit artwork/copy slots keep layout changes confined to the event header. */
export default function EventPageHero({
  artwork, copy, value, children, className, style,
}: {
  artwork: ReactNode;
  copy: ReactNode;
  value?: EventHeroLayout;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const composition = useEventPageComposition();
  const hero = normalizeEventHeroLayout(value ?? composition?.value?.hero);
  if (!hero) return <>{children}</>;
  return (
    <div className={styles.container}>
    <header
      className={`${styles.hero} ${className || ""}`}
      data-event-hero=""
      data-image-position={hero.imagePosition}
      data-image-shape={hero.imageShape}
      data-title-position={hero.titlePosition}
      data-title-align={hero.titleAlign}
      style={{ ...style, "--hero-image-fit": hero.imageFit, "--hero-image-y": `${hero.imagePositionY}%` } as CSSProperties}
    >
      <div className={styles.artwork} data-event-hero-artwork="">{artwork}</div>
      <div className={styles.copy} data-event-hero-copy="">{copy}</div>
    </header>
    </div>
  );
}
