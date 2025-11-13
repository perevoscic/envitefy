"use client";

import React, { useEffect, useState } from "react";
import styles from "./TemplateGallery.module.css";
import {
  getFontToken,
  getPaletteToken,
  type TemplateFontTokenId,
  type TemplatePaletteTokenId,
  type TemplateTitleFont,
  type TitleAlign,
  type TitleWeight,
} from "./templateDesignTokens";

export type TemplateGalleryVariation = {
  id: string;
  paletteId: TemplatePaletteTokenId;
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
  coupleName: string;
  dateLabel: string;
  location: string;
};

const DEFAULT_PREVIEW: TemplatePreviewData = {
  coupleName: "Ava & Mason",
  dateLabel: "September 23, 2028",
  location: "New York, NY",
};

export type ResolvedTemplateVariation = TemplateGalleryVariation & {
  label: string;
  tagline: string;
  background: string;
  swatches: string[];
  titleColor: string;
  titleFont: TemplateTitleFont;
  titleWeight: TitleWeight;
  titleAlign: TitleAlign;
};

export type TemplateGalleryProps = {
  templates: TemplateGalleryTemplate[];
  appliedTemplateId: string | null;
  appliedVariationId: string | null;
  onApplyTemplate: (
    template: TemplateGalleryTemplate,
    variation: ResolvedTemplateVariation
  ) => void;
};

function getPreviewFontFamily(font: TemplateTitleFont) {
  switch (font) {
    case "pacifico":
      return "var(--font-pacifico)";
    case "montserrat":
      return "var(--font-montserrat)";
    case "geist":
      return "var(--font-geist-sans)";
    case "mono":
      return "var(--font-geist-mono)";
    case "serif":
      return 'Georgia, Cambria, "Times New Roman", Times, serif';
    case "system":
      return 'system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, Cantarell, "Helvetica Neue", sans-serif';
    case "poppins":
      return "var(--font-poppins)";
    case "raleway":
      return "var(--font-raleway)";
    case "playfair":
      return "var(--font-playfair)";
    case "dancing":
      return "var(--font-dancing)";
    default:
      return undefined;
  }
}

export function resolveTemplateVariation(
  variation: TemplateGalleryVariation
): ResolvedTemplateVariation {
  const palette = getPaletteToken(variation.paletteId);
  const fontToken = getFontToken(variation.fontId ?? palette.defaultFontId);
  return {
    ...variation,
    label: variation.label ?? palette.label,
    tagline: variation.tagline ?? palette.tagline,
    background: palette.background,
    swatches: palette.swatches,
    titleColor: variation.titleColorOverride ?? palette.titleColor,
    titleFont: fontToken.font,
    titleWeight: fontToken.weight,
    titleAlign: fontToken.align,
  };
}

export default function TemplateGallery({
  templates,
  appliedTemplateId,
  appliedVariationId,
  onApplyTemplate,
}: TemplateGalleryProps) {
  const [previewMap, setPreviewMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (appliedTemplateId && appliedVariationId) {
      setPreviewMap((prev) => {
        if (prev[appliedTemplateId] === appliedVariationId) return prev;
        return { ...prev, [appliedTemplateId]: appliedVariationId };
      });
    }
  }, [appliedTemplateId, appliedVariationId]);

  return (
    <div className={styles.gallery}>
      {templates.map((template) => {
        const resolvedVariations = template.variations.map((v) =>
          resolveTemplateVariation(v)
        );
        const isSelected = template.id === appliedTemplateId;
        const previewId =
          previewMap[template.id] ??
          (template.id === appliedTemplateId ? appliedVariationId ?? undefined : undefined);
        const activeVariation =
          resolvedVariations.find((v) => v.id === previewId) ??
          resolvedVariations[0];
        const previewFontFamily = getPreviewFontFamily(
          activeVariation.titleFont
        );
        const previewInfo = template.preview ?? DEFAULT_PREVIEW;
        const previewTextColor = activeVariation.titleColor;

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
                  style={{ background: activeVariation.background }}
                >
                  <span className={styles.previewHeroTag}>
                    {`${template.heroMood} — ${template.name}`}
                  </span>
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
                    {previewInfo.coupleName}
                  </p>
                  <p
                    className={styles.previewMeta}
                    style={{ color: previewTextColor }}
                  >
                    {previewInfo.dateLabel} • {previewInfo.location}
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
                  <span>
                    Placeholder: {template.heroImageName.replace(".jpg", "")}
                  </span>
                </div>
              </div>
              <div className={styles.cardHeader}>
                <div>
                  <p className={styles.cardTitle}>{template.name}</p>
                  <p className={styles.cardDescription}>{template.description}</p>
                </div>
              </div>
              <div className={styles.variationSection}>
                <span className={styles.variationKicker}>Color stories</span>
                <div className={styles.variationRow}>
                  {resolvedVariations.map((variation) => {
                    const isActiveVariation =
                      variation.id === activeVariation.id;
                    return (
                      <button
                        key={variation.id}
                        type="button"
                        aria-pressed={isActiveVariation}
                        className={`${styles.variationButton} ${
                          isActiveVariation ? styles.variationActive : ""
                        }`}
                        onClick={() =>
                          setPreviewMap((prev) => ({
                            ...prev,
                            [template.id]: variation.id,
                          }))
                        }
                      >
                        <div className={styles.variationSwatches}>
                          {variation.swatches.map((color) => (
                            <span
                              key={color}
                              className={styles.paletteDot}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <div className={styles.variationLabel}>
                          <span>{variation.label}</span>
                          <small>{variation.tagline}</small>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className={styles.cardFooter}>
                <button
                  type="button"
                  className={`${styles.selectButton} ${
                    isSelected ? styles.selectButtonSelected : ""
                  }`}
                  onClick={() =>
                    onApplyTemplate(template, activeVariation)
                  }
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
