"use client";
import TemplateImageTone from "@/components/events/TemplateImageTone";
import { useRef, type CSSProperties, type ReactNode } from "react";
import HeroImageDragOverlay from "@/components/events/HeroImageDragOverlay";
import InlineEditableText from "@/components/events/InlineEditableText";
import type { GymnasticsPageTextChange } from "@/lib/gymnastics-page-text";
import { useGymnasticsPageText } from "./useGymnasticsPageText";
import { normalizeHeroImageSettings } from "@/lib/hero-image-settings";
import type { GymMeetPageTemplateMeta, GymMeetRenderModel } from "./types";
import { getGymMeetTitleTypography } from "./titleTypography";
import styles from "./gymnastics-collection.module.css";
import "./collection-fonts.css";

export function gymnasticsDesignStyle(design: GymMeetPageTemplateMeta): CSSProperties {
  return {
    "--gym-paper": design.background,
    "--gym-ink": design.foreground,
    "--gym-accent": design.accent,
    "--gym-font":
      design.displayFont === "ui-monospace"
        ? "ui-monospace, SFMono-Regular, Menlo, monospace"
        : `"${design.displayFont}", Georgia, serif`,
  } as CSSProperties;
}

/** The same art-directed composition is used in the gallery, editor, and guest page. */
export default function GymnasticsScene({
  model,
  design,
  heroImageAction,
  onHeroImagePositionChange,
  onPageTextChange,
}: {
  model: GymMeetRenderModel;
  design: GymMeetPageTemplateMeta;
  heroImageAction?: ReactNode;
  onHeroImagePositionChange?: (positionY: number) => void;
  onPageTextChange?: GymnasticsPageTextChange;
}) {
  const address = model.address || model.mapAddress || model.headerLocation;
  const host = model.hostGym || model.team;
  const typography = getGymMeetTitleTypography(design.id);
  const imageSettings = normalizeHeroImageSettings(model.heroImageSettings);
  const imageRef = useRef<HTMLImageElement>(null);
  const pageText = useGymnasticsPageText(model.gymnasticsPageText, onPageTextChange);
  return (
    <TemplateImageTone color={design.accent} enabled={model.heroImageFilterEnabled !== false}>
      <header
        className={styles.scene}
        data-design={design.id}
        data-body={design.bodyStyle}
        data-title-size={model.titleSize}
      >
        <div className={styles.masthead}>
          <span>{pageText("mastheadLeft", "Gymnastics meet")}</span>
          <span>{pageText("mastheadRight", model.season || "A day to remember")}</span>
        </div>
        <figure
          className={styles.artwork}
          style={{
            isolation: "isolate",
            clipPath: imageSettings.fit === "contain" ? "none" : undefined,
            borderRadius: imageSettings.fit === "contain" ? "1rem" : undefined,
          }}
        >
          {/* The original artwork keeps its intrinsic ratio; the frame supplies the composition. */}
          <img
            className="template-hero-image"
            ref={imageRef}
            draggable={onHeroImagePositionChange ? false : undefined}
            src={model.heroImage || design.artwork}
            alt={model.heroImage ? "Meet artwork" : design.artworkAlt}
            width={1536}
            height={1024}
            loading="lazy"
            decoding="async"
            style={{
              objectFit: imageSettings.fit,
              height: imageSettings.fit === "contain" ? "auto" : undefined,
              objectPosition:
                imageSettings.fit === "contain"
                  ? "50% 50%"
                  : model.heroImage || imageSettings.positionY !== 50
                    ? `50% ${imageSettings.positionY}%`
                    : undefined,
            }}
          />
          {onHeroImagePositionChange && imageSettings.fit === "cover" ? (
            <HeroImageDragOverlay
              imageRef={imageRef}
              imageSrc={model.heroImage || design.artwork}
              positionY={imageSettings.positionY}
              onChange={onHeroImagePositionChange}
            />
          ) : null}
          {heroImageAction ? (
            <div
              className={
                imageSettings.fit === "contain"
                  ? "relative z-10 flex justify-center p-4"
                  : "absolute inset-x-4 bottom-6 z-10 flex justify-center"
              }
            >
              {heroImageAction}
            </div>
          ) : null}
        </figure>

        <div className={styles.headline}>
          {host ? (
            <p className={styles.eyebrow}>{pageText("hostByline", `${host} presents`)}</p>
          ) : null}
          <h1 className={typography.heroClassName}>
            <InlineEditableText
              label="Event title"
              value={model.authoredTitle || undefined}
              fallback={model.title}
              maxLength={240}
              onChange={
                onPageTextChange ? (value) => onPageTextChange("eventTitle", value) : undefined
              }
            />
          </h1>
          {model.heroBadges.length ? (
            <div className={styles.badges}>
              {model.heroBadges.map((badge) => (
                <span key={badge}>{badge}</span>
              ))}
            </div>
          ) : null}
        </div>

        <dl className={styles.facts}>
          {model.dateLabel ? (
            <div>
              <dt>{pageText("meetDay", "Meet day")}</dt>
              <dd>{model.dateLabel}</dd>
            </div>
          ) : null}
          {model.timeLabel ? (
            <div>
              <dt>{pageText("startingAt", "Starting at")}</dt>
              <dd>{model.timeLabel}</dd>
            </div>
          ) : null}
          {model.venue || address ? (
            <div>
              <dt>{pageText("venueLabel", "The venue")}</dt>
              <dd>{model.venue || address}</dd>
              {model.venue && address && model.venue !== address ? (
                <dd className={styles.address}>{address}</dd>
              ) : null}
            </div>
          ) : null}
        </dl>
        <div className={styles.invitation}>
          <span className={styles.rule} aria-hidden="true" />
          <p>{pageText("invitation", model.heroSummary || design.previewKicker)}</p>
          <span className={styles.smallLabel}>{pageText("tagline", "Together, we rise.")}</span>
        </div>
        <div className={styles.signoff}>
          <span>{pageText("signoffLeft", host || "Gymnastics")}</span>
          <span>{pageText("signoffRight", model.headerLocation || "See you at the meet")}</span>
        </div>
      </header>
    </TemplateImageTone>
  );
}
