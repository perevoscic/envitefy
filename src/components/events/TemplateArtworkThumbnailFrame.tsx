import type { CSSProperties, ReactNode } from "react";
import type { TemplateArtwork } from "./template-artwork";
import { TemplateThumbnailPreview } from "./TemplateThumbnail";
import styles from "./template-artwork-thumbnail.module.css";

/** A design cover, composed at its displayed size without mounting an event page. */
export default function TemplateArtworkThumbnailFrame({
  design,
  className = "",
  background,
  decoration,
}: {
  design: TemplateArtwork;
  className?: string;
  background?: { page: string; ink: string; accent: string; style: CSSProperties };
  decoration?: ReactNode;
}) {
  const style = {
    ...background?.style,
    "--art-page": background?.page || design.background,
    "--art-ink": background?.ink || design.ink,
    "--art-accent": background?.accent || design.accent,
    "--art-font": design.font,
  } as CSSProperties;
  return (
    <TemplateThumbnailPreview scaled={false} className={`${styles.frame} ${className}`}>
      <div
        className={`${styles.cover} ${design.surfaceClassName || ""}`}
        style={style}
        data-template-artwork={design.id}
        data-composition={design.composition}
      >
        {decoration}
        <div className={styles.artwork}>
          <img src={design.artwork} alt="" loading="lazy" decoding="async" />
        </div>
        <div className={styles.caption}>
          <p className={styles.eyebrow}>{design.label}</p>
          <p className={styles.title}>{design.coverTitle || design.name}</p>
        </div>
      </div>
    </TemplateThumbnailPreview>
  );
}

