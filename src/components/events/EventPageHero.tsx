"use client";

import type { CSSProperties, ReactNode } from "react";
import { normalizeEventHeroLayout, type EventHeroLayout } from "@/lib/event-hero-layout";
import { useEventPageComposition } from "./EventPageCompositionContext";
import styles from "./event-page-hero.module.css";
import treatments from "./event-hero-treatments.module.css";

/** Explicit artwork/copy slots keep layout changes confined to the event header. */
export default function EventPageHero({
  artwork, artworkActions, copy, value, children, className, style,
}: {
  artwork: ReactNode;
  artworkActions?: ReactNode;
  copy: ReactNode;
  value?: EventHeroLayout;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const composition = useEventPageComposition();
  const hero = normalizeEventHeroLayout(value ?? composition?.value?.hero);
  if (!hero) return <>{children}</>;
  const artworkFrame = <div className={`${styles.artwork} ${treatments.treatment}`} data-image-style={hero.imageStyle} data-event-hero-artwork="">{artwork}</div>;
  const image = hero.imageStyle ? <div className={`${styles.artworkShadow} ${treatments.shadow}`} data-image-edge-shadow="">{artworkFrame}</div> : artworkFrame;
  return (
    <div className={styles.container}>
    <header
      className={`${styles.hero} ${className || ""}`}
      data-event-hero=""
      data-image-position={hero.imagePosition}
      data-image-shape={hero.imageShape}
      data-title-position={hero.titlePosition}
      data-title-align={hero.titleAlign}
      data-image-style={hero.imageStyle}
      style={{ ...style, "--hero-image-fit": hero.imageFit, "--hero-image-y": `${hero.imagePositionY}%` } as CSSProperties}
    >
      {artworkActions ? <div className={styles.artworkGroup}>{image}{artworkActions}</div> : image}
      <div className={styles.copy} data-event-hero-copy="">{copy}</div>
    </header>
    </div>
  );
}
