
import TemplateImageTone from "@/components/events/TemplateImageTone";
import type { CSSProperties, ReactNode } from "react";
import { genderRevealFont, type GenderRevealDesign } from "@/lib/gender-reveal-designs";
import styles from "./gender-reveal-scenes.module.css";

export function genderRevealPageStyle(design: GenderRevealDesign): CSSProperties {
  return {
    "--reveal-paper": design.paper,
    "--reveal-ink": design.ink,
    "--reveal-accent": design.accent,
    "--reveal-font": genderRevealFont(design),
  } as CSSProperties;
}

export { styles as genderRevealStyles };

export default function GenderRevealScene({
  design, title, parents, image, fontFamily, fontSize, date, time, location, announcement,
  actions, controls, status, filterEnabled = true,
}: {
  design: GenderRevealDesign;
  title: string;
  parents?: string;
  image: string;
  filterEnabled?: boolean;
  fontFamily?: string;
  fontSize?: string;
  date?: string | null;
  time?: string | null;
  location?: string;
  announcement?: string;
  actions?: ReactNode;
  controls?: ReactNode;
  status?: ReactNode;
}) {
  return (
    <TemplateImageTone color={design.accent} enabled={filterEnabled}>
<section className={`${styles.scene} ${styles[design.composition]}`} data-reveal-scene={design.id}>
      {controls ? <div className={styles.controls}>{controls}</div> : null}
      <div className={styles.art}>
        <img className="template-hero-image" src={image} alt="" loading="eager" decoding="async" width={1536} height={1024} />
      </div>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>{announcement || "A little surprise is on the way"}</p>
        <h1 style={{ fontFamily: fontFamily || genderRevealFont(design), ...(fontSize === "small" ? { fontSize: "clamp(2rem, 4.5cqw, 3.75rem)" } : fontSize === "large" ? { fontSize: "clamp(3rem, 7cqw, 6rem)" } : {}) }}>{title}</h1>
        {parents ? <p className={styles.parents}>{parents}</p> : null}
        <span className={styles.flourish} aria-hidden="true" />
      </div>
      <div className={styles.facts}>
        <p className={styles.invitation}>Join us for the reveal</p>
        {date ? <p>{date}</p> : null}
        {time ? <p>{time}</p> : null}
        {location ? <p>{location}</p> : null}
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
      {status ? <div className={styles.status}>{status}</div> : null}
    </section>
</TemplateImageTone>
  );
}
