import type { CSSProperties, ReactNode } from "react";
import type { BabyShowerDesign } from "@/lib/baby-shower-designs";
import "@/components/birthdays/redesign/birthday-fonts.css";
import styles from "./baby-shower-designs.module.css";

export function babyShowerDesignStyle(design: BabyShowerDesign): CSSProperties {
  return {
    "--baby-paper": design.colors.background,
    "--baby-ink": design.colors.text,
    "--baby-accent": design.colors.accent,
    "--baby-font": `"${design.displayFont}", Georgia, serif`,
  } as CSSProperties;
}

export default function BabyShowerDesignHero({
  design,
  babyName,
  momName,
  eventTitle,
  heroImage,
  dateLabel,
  timeLabel,
  location,
  fontFamily,
  actions,
  ownerActions,
}: {
  design: BabyShowerDesign;
  babyName?: string;
  momName?: string;
  eventTitle: string;
  heroImage: string;
  dateLabel: string | null;
  timeLabel: string | null;
  location?: string;
  fontFamily?: string;
  actions?: ReactNode;
  ownerActions?: ReactNode;
}) {
  return (
    <header className={styles.hero} data-baby-scene={design.id}>
      <div className={styles.art}>
        <img src={heroImage} alt={design.subject} className={styles.image} />
      </div>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>You’re invited · Baby shower</p>
        <p className={styles.headline}>{design.sample.headline}</p>
        <h1 className={styles.title} style={fontFamily ? { fontFamily } : undefined}>
          {babyName ? <>Celebrating<br /><span>{babyName}</span></> : eventTitle}
        </h1>
        {momName && <p className={styles.dedication}>With love for {momName} and the little one</p>}
        {ownerActions && <div className={styles.ownerActions}>{ownerActions}</div>}
      </div>
      <div className={styles.facts}>
        <div className={styles.when}>
          {dateLabel && <p>{dateLabel}</p>}
          {timeLabel && <p>{timeLabel}</p>}
        </div>
        {location && <p className={styles.where}>{location}</p>}
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </header>
  );
}
