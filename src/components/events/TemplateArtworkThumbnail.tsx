import type { CSSProperties } from "react";
import { TemplateThumbnailPreview } from "./TemplateThumbnail";
import styles from "./template-artwork-thumbnail.module.css";
import "@/components/birthdays/redesign/birthday-fonts.css";

export type TemplateArtwork = {
  id: string;
  name: string;
  artwork: string;
  label: string;
  background: string;
  ink: string;
  accent: string;
  font: string;
  composition:
    | "editorial"
    | "arch"
    | "oval"
    | "postcard"
    | "poster"
    | "framed"
    | "organic"
    | "panorama"
    | "journal";
  surfaceClassName?: string;
};

/** A design cover, composed at its displayed size without mounting an event page. */
export default function TemplateArtworkThumbnail({
  design,
  className = "",
}: {
  design: TemplateArtwork;
  className?: string;
}) {
  const style = {
    "--art-page": design.background,
    "--art-ink": design.ink,
    "--art-accent": design.accent,
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
        <div className={styles.artwork}>
          <img src={design.artwork} alt="" loading="lazy" decoding="async" />
        </div>
        <div className={styles.caption}>
          <p className={styles.eyebrow}>{design.label}</p>
          <p className={styles.title}>{design.name}</p>
        </div>
      </div>
    </TemplateThumbnailPreview>
  );
}

/** Match the design's visual language, rather than varying covers arbitrarily. */
export function artworkComposition(direction: string): TemplateArtwork["composition"] {
  const words = direction.toLowerCase();
  if (/oval|circle|medallion|disco|moon|portal|menu/.test(words)) return "oval";
  if (/postcard|scrapbook|collage|polaroid/.test(words)) return "postcard";
  if (/arch|botanical|floral|blossom|storybook|window|garden/.test(words)) return "arch";
  if (/coastal|wave|organic|keyhole/.test(words)) return "organic";
  if (/poster|neon|electric|comic|scoreboard|arena|stage|sport/.test(words)) return "poster";
  if (/panorama|landscape|cinematic/.test(words)) return "panorama";
  if (/journal|letter|ledger|newspaper/.test(words)) return "journal";
  if (/classic|luxury|formal|frame|collegiate|toile|gilded/.test(words)) return "framed";
  return "editorial";
}

/** Preserve the accent hue while keeping lettering legible on its page color. */
export function artworkInk(background: string, accent: string): string {
  const hex = background.replace("#", "");
  const lightness = [0, 2, 4].reduce(
    (sum, start, index) =>
      sum + Number.parseInt(hex.slice(start, start + 2), 16) * [0.299, 0.587, 0.114][index],
    0,
  );
  return lightness < 140 ? "#fffaf3" : `color-mix(in srgb, ${accent} 45%, #231e29)`;
}
