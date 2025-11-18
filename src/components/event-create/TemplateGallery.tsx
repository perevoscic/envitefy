"use client";

import Image from "next/image";
import styles from "./TemplateGallery.module.css";
import {
  getFontToken,
  getPaletteToken,
  type TemplateFontTokenId,
  type TemplatePaletteTokenId,
  type TemplatePaletteToken,
  type TitleAlign,
  type TitleWeight,
} from "./templateDesignTokens";

export type TemplateGalleryVariation = {
  id: string;
  paletteId?: TemplatePaletteTokenId;
  palette?: TemplatePaletteToken;
  fontId?: TemplateFontTokenId;
  label?: string;
  tagline?: string;
  titleColorOverride?: string;
};

export type TemplateGalleryTemplate = {
  id: string;
  name: string;
  description: string;
  heroImageName: string;
  heroMood: string;
  menu: string[];
  preview?: TemplatePreviewData;
  variations: TemplateGalleryVariation[];
};

export type TemplatePreviewData = {
  coupleName?: string;
  birthdayName?: string;
  dateLabel: string;
  location?: string;
  timeLabel?: string;
};

export const DEFAULT_PREVIEW: TemplatePreviewData = {
  coupleName: "Ava & Mason",
  dateLabel: "September 23, 2028",
  timeLabel: "4:00 PM",
  location: "New York, NY",
};

function hashSeed(seed: string) {
  return seed
    .split("")
    .reduce((acc, char, idx) => acc + char.charCodeAt(0) * (idx + 1), 0);
}

function tweakChannel(value: number, delta: number) {
  const next = value + delta;
  if (next < 0) return 0;
  if (next > 255) return 255;
  return next;
}

function adjustHex(hex: string, delta: number): string {
  if (!/^#?[0-9a-fA-F]{6}$/.test(hex)) return hex;
  const normalized = hex.startsWith("#") ? hex.slice(1) : hex;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  const nextR = tweakChannel(r, delta);
  const nextG = tweakChannel(g, Math.round(delta / 2));
  const nextB = tweakChannel(b, -Math.round(delta / 3));
  return `#${((nextR << 16) | (nextG << 8) | nextB)
    .toString(16)
    .padStart(6, "0")}`;
}

function adjustGradientStops(gradient: string, delta: number) {
  return gradient.replace(/#([0-9a-fA-F]{6})/g, (match) =>
    adjustHex(match, delta)
  );
}

function rotateArray<T>(values: T[], shift: number): T[] {
  if (!values.length) return values;
  const normalized = ((shift % values.length) + values.length) % values.length;
  if (normalized === 0) return [...values];
  return [...values.slice(normalized), ...values.slice(0, normalized)];
}

function applyUniquePalette(
  base: TemplatePaletteToken,
  seed: string
): TemplatePaletteToken {
  const hash = hashSeed(seed);
  const primaryDelta = (hash % 90) - 45; // strong lighten/darken swing
  const accentDelta = ((hash >> 5) % 70) - 35; // secondary variation
  const waveFrequency = ((hash >> 9) % 4) + 2; // 2..5 for sine modulation
  const rotateBy = base.swatches.length
    ? (hash >> 2) % base.swatches.length
    : 0;

  const swatches = base.swatches.map((color, idx) => {
    const waveShift = Math.sin((idx + 1) * waveFrequency) * accentDelta;
    const idxBias = (idx - Math.floor(base.swatches.length / 2)) * 4;
    const delta = Math.round(primaryDelta + waveShift + idxBias);
    return adjustHex(color, delta);
  });

  const rotatedSwatches = rotateArray(swatches, rotateBy);
  const backgroundDelta = Math.round((primaryDelta + accentDelta) / 3);
  const titleDelta = Math.round(-(primaryDelta / 2));
  const background = adjustGradientStops(base.background, backgroundDelta);
  const titleColor = adjustHex(base.titleColor, titleDelta);

  return { ...base, swatches: rotatedSwatches, background, titleColor };
}

export type ResolvedTemplateVariation = TemplateGalleryVariation & {
  label: string;
  tagline: string;
  background: string;
  swatches: string[];
  titleColor: string;
  titleFontFamily: string | undefined;
  titleWeight: TitleWeight;
  titleAlign: TitleAlign;
};

export type TemplateGalleryProps = {
  templates: TemplateGalleryTemplate[];
  appliedTemplateId: string | null;
  appliedVariationId: string | null;
  previewHeroImageUrl?: string | null;
  onApplyTemplate: (
    template: TemplateGalleryTemplate,
    variation: ResolvedTemplateVariation
  ) => void;
};

export function resolveTemplateVariation(
  variation: TemplateGalleryVariation
): ResolvedTemplateVariation {
  const basePalette =
    variation.palette ??
    (variation.paletteId
      ? getPaletteToken(variation.paletteId)
      : getPaletteToken(undefined));
  const palette = applyUniquePalette(basePalette, variation.id);
  const fontToken = getFontToken(variation.fontId ?? palette.defaultFontId);
  return {
    ...variation,
    label: variation.label ?? palette.label,
    tagline: variation.tagline ?? palette.tagline,
    background: palette.background,
    swatches: palette.swatches,
    titleColor: variation.titleColorOverride ?? palette.titleColor,
    titleFontFamily: fontToken.fontVar,
    titleWeight: fontToken.weight,
    titleAlign: fontToken.align,
  };
}

export default function TemplateGallery({
  templates,
  appliedTemplateId,
  appliedVariationId,
  previewHeroImageUrl,
  onApplyTemplate,
}: TemplateGalleryProps) {
  return (
    <div className={styles.gallery}>
      {templates.map((template) => {
        const resolvedVariations = template.variations.map((v) =>
          resolveTemplateVariation(v)
        );
        const isSelected = template.id === appliedTemplateId;
        const activeVariation =
          resolvedVariations.find((v) => v.id === appliedVariationId) ??
          resolvedVariations[0];
        const previewFontFamily = activeVariation.titleFontFamily;
        const previewInfo = { ...DEFAULT_PREVIEW, ...(template.preview ?? {}) };
        const previewTextColor = activeVariation.titleColor;
        const isBirthdayTemplate = !!(template.preview as any)?.birthdayName;
        const heroImageBasePath = isBirthdayTemplate
          ? "/templates/birthdays/"
          : "/templates/wedding-placeholders/";
        const heroImageFile = template.heroImageName || `${template.id}.webp`;
        const heroImageSrc =
          previewHeroImageUrl ?? `${heroImageBasePath}${heroImageFile}`;
        const headerBackgroundStyle = {
          background: activeVariation.background,
        };

        return (
          <article
            key={template.id}
            className={styles.templateCard}
            data-selected={isSelected ? "true" : undefined}
          >
            <div className={styles.cardBody}>
              <div className={styles.previewFrame}>
                <div
                  className={styles.previewHeader}
                  style={headerBackgroundStyle}
                  data-birthday={isBirthdayTemplate ? "true" : undefined}
                >
                  <p
                    className={styles.previewNames}
                    style={{
                      color: previewTextColor,
                      fontFamily: previewFontFamily,
                      fontWeight:
                        activeVariation.titleWeight === "bold"
                          ? 700
                          : activeVariation.titleWeight === "semibold"
                          ? 600
                          : 400,
                    }}
                  >
                    {(previewInfo as any).birthdayName
                      ? `${(previewInfo as any).birthdayName}'s Birthday`
                      : previewInfo.coupleName || "Event"}
                  </p>
                  <p
                    className={styles.previewMeta}
                    style={{ color: previewTextColor }}
                  >
                    {previewInfo.dateLabel}
                    {previewInfo.timeLabel ? ` • ${previewInfo.timeLabel}` : ""}
                  </p>
                  <div
                    className={styles.previewNav}
                    style={{ color: previewTextColor }}
                  >
                    {template.menu.slice(0, 7).map((item) => (
                      <span
                        key={item}
                        className={styles.previewNavItem}
                        style={{ color: previewTextColor }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div className={styles.previewPhoto}>
                  <Image
                    src={heroImageSrc}
                    alt={
                      previewHeroImageUrl
                        ? `Uploaded preview for ${template.name}`
                        : `${template.name} placeholder`
                    }
                    width={640}
                    height={360}
                    className={styles.previewPhotoImage}
                    priority={false}
                    unoptimized={Boolean(previewHeroImageUrl)}
                  />
                </div>
              </div>
              <div className={styles.cardHeader}>
                <div>
                  <p className={styles.cardTitle}>{template.name}</p>
                </div>
              </div>
              <div className={styles.cardFooter}>
                <button
                  type="button"
                  className={`${styles.selectButton} ${
                    isSelected ? styles.selectButtonSelected : ""
                  }`}
                  onClick={() => onApplyTemplate(template, activeVariation)}
                >
                  {isSelected ? "Selected" : "Use template"}
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
