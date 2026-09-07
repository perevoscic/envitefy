"use client";

import type { CSSProperties } from "react";
import type { GymMeetPageTemplateMeta, GymMeetRenderModel } from "./types";
import { getGymMeetTitleTypography } from "./titleTypography";
import styles from "./gymnastics-collection.module.css";
import "./collection-fonts.css";

export function gymnasticsDesignStyle(design: GymMeetPageTemplateMeta): CSSProperties {
  return {
    "--gym-paper": design.background,
    "--gym-ink": design.foreground,
    "--gym-accent": design.accent,
    "--gym-font": `"${design.displayFont}", Georgia, serif`,
  } as CSSProperties;
}

/** The same art-directed composition is used in the gallery, editor, and guest page. */
export default function GymnasticsScene({ model, design }: { model: GymMeetRenderModel; design: GymMeetPageTemplateMeta }) {
  const address = model.address || model.mapAddress || model.headerLocation;
  const host = model.hostGym || model.team;
  const typography = getGymMeetTitleTypography(design.id);
  return (
    <header className={styles.scene} data-design={design.id} data-title-size={model.titleSize}>
      <div className={styles.masthead}>
        <span>Gymnastics meet</span><span>{model.season || "A day to remember"}</span>
      </div>
      <div className={styles.headline}>
        {host ? <p className={styles.eyebrow}>{host} presents</p> : null}
        <h1 className={typography.heroClassName}>{model.title}</h1>
        {model.heroBadges.length ? <div className={styles.badges}>{model.heroBadges.map((badge) => <span key={badge}>{badge}</span>)}</div> : null}
      </div>
      <figure className={styles.artwork}>
        {/* The original artwork keeps its intrinsic ratio; the frame supplies the composition. */}
        {/* biome-ignore lint/performance/noImgElement: local WebP is shared by full pages and passive previews */}
        <img src={model.heroImage || design.artwork} alt={model.heroImage ? "Meet artwork" : design.artworkAlt} width={1536} height={1024} loading="lazy" decoding="async" />
      </figure>
      <dl className={styles.facts}>
        {model.dateLabel ? <div><dt>Meet day</dt><dd>{model.dateLabel}</dd></div> : null}
        {model.timeLabel ? <div><dt>Starting at</dt><dd>{model.timeLabel}</dd></div> : null}
        {model.venue || address ? <div><dt>The venue</dt><dd>{model.venue || address}</dd>{model.venue && address && model.venue !== address ? <dd className={styles.address}>{address}</dd> : null}</div> : null}
      </dl>
      <div className={styles.invitation}>
        <span className={styles.rule} aria-hidden="true" />
        <p>{model.heroSummary || design.previewKicker}</p>
        <span className={styles.smallLabel}>Together, we rise.</span>
      </div>
      <div className={styles.signoff}><span>{host || "Gymnastics"}</span><span>{model.headerLocation || "See you at the meet"}</span></div>
    </header>
  );
}
