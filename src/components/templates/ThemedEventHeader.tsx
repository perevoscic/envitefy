"use client";

import { Children, type CSSProperties, type ReactNode } from "react";
import type { TemplateArtwork } from "@/components/events/TemplateArtworkThumbnail";
import EventPageHero from "@/components/events/EventPageHero";
import styles from "./themed-event-header.module.css";
import "@/components/birthdays/redesign/birthday-fonts.css";

export type ThemedEventHeaderDesign = Pick<
  TemplateArtwork,
  "id" | "composition" | "background" | "ink" | "accent" | "font"
> & {
  editorLayout?: "split" | "banner" | "poster" | "editorial" | "spotlight" | "minimal" | "cards";
  bodyPresentation?: {
    alignment?: "left" | "center";
    spacing?: "airy" | "compact" | "balanced";
    borderRadius?: string;
  };
};

const compositionLayouts: Record<
  TemplateArtwork["composition"],
  NonNullable<ThemedEventHeaderDesign["editorLayout"]>
> = {
  editorial: "split",
  arch: "spotlight",
  oval: "minimal",
  postcard: "cards",
  poster: "poster",
  framed: "editorial",
  organic: "split",
  panorama: "banner",
  journal: "editorial",
};

/** Keep the original mounted artwork and editable copy inside authored, responsive slots. */
export default function ThemedEventHeader({
  design,
  children,
  fontFamily,
}: {
  design?: ThemedEventHeaderDesign;
  children: ReactNode;
  fontFamily?: string;
}) {
  const [artwork, ...copy] = Children.toArray(children);
  if (!design) return <EventPageHero artwork={artwork} copy={copy}>{children}</EventPageHero>;
  const layout = design.editorLayout || compositionLayouts[design.composition];
  return (
    <EventPageHero artwork={artwork} copy={copy}>
    <div className={styles.shell}>
      <div
        className={styles.header}
        data-themed-event-header={design.id}
        data-composition={design.composition}
        data-page-layout={layout}
        data-header-alignment={
          design.bodyPresentation?.alignment ||
          (layout === "poster" || layout === "spotlight" ? "center" : "left")
        }
        data-header-spacing={design.bodyPresentation?.spacing || "balanced"}
        style={
          {
            "--themed-page": design.background,
            "--themed-ink": design.ink,
            "--themed-accent": design.accent,
            "--themed-radius": design.bodyPresentation?.borderRadius || "1rem",
            fontFamily: fontFamily || design.font,
          } as CSSProperties
        }
      >
        <div className={styles.artwork} data-themed-header-artwork="">
          {artwork}
        </div>
        <div className={styles.copy} data-themed-header-copy="">
          {copy}
        </div>
      </div>
    </div>
    </EventPageHero>
  );
}
