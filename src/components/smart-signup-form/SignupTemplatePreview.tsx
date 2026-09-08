"use client";

import type { CSSProperties } from "react";
import { TemplateThumbnailPreview } from "@/components/events/TemplateThumbnail";
import type { PublicTemplate } from "@/lib/public-template-catalog";
import { getSignupDesign, SIGNUP_DESIGN_PALETTES } from "@/lib/signup-designs";
import { SIGNUP_FONT_PAIRS } from "@/lib/signup-themes";
import SignupDesignOrnament from "./SignupDesignOrnament";
import styles from "./signup-thumbnail.module.css";

/** Artwork and design cues composed for a square, at the thumbnail's actual size. */
export default function SignupTemplatePreview({
  template,
}: {
  template: Pick<PublicTemplate, "id" | "name" | "heroImage">;
}) {
  const design = getSignupDesign(template.id);
  const colors = SIGNUP_DESIGN_PALETTES[design?.palette || "slate"];
  const font = SIGNUP_FONT_PAIRS.find((pair) => pair.id === (design?.fontPair || "modern"));
  const style = {
    "--thumb-page": colors.page,
    "--thumb-surface": colors.surface,
    "--thumb-ink": colors.ink,
    "--thumb-accent": colors.accent,
    "--thumb-secondary": colors.secondary,
    "--thumb-font": font?.heading,
  } as CSSProperties;
  return (
    <TemplateThumbnailPreview scaled={false} className={styles.frame}>
      <div
        className={styles.thumbnail}
        style={style}
        data-composition={design?.composition || "studio"}
        data-reverse={design?.reverse || undefined}
        data-font={design?.fontPair || "modern"}
      >
        <div className={styles.artwork}>
          <img src={template.heroImage} alt="" loading="lazy" decoding="async" />
        </div>
        <div className={styles.caption}>
          <div className={styles.copy}>
            <p className={styles.eyebrow}>Signup form</p>
            <p className={styles.title}>{template.name}</p>
          </div>
          <div className={styles.ornament}>
            <SignupDesignOrnament motif={design?.motif || "orbit"} />
          </div>
        </div>
      </div>
    </TemplateThumbnailPreview>
  );
}
