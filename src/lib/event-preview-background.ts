import type { CSSProperties } from "react";

export type EventPreviewBackground = Pick<
  CSSProperties,
  | "backgroundColor"
  | "backgroundImage"
  | "backgroundSize"
  | "backgroundPosition"
  | "backgroundRepeat"
  | "color"
>;

export const DEFAULT_PREVIEW_BACKGROUND: EventPreviewBackground = {
  backgroundColor: "#f8f8f7",
  color: "#242424",
};

function hasColor(color: string) {
  return Boolean(color && color !== "transparent" && color !== "rgba(0, 0, 0, 0)");
}

/** Read the page surface, never a hero or a detail card, from the actual device rendering. */
export function readEventPreviewBackground(doc: Document): EventPreviewBackground {
  const view = doc.defaultView;
  if (!view) return DEFAULT_PREVIEW_BACKGROUND;
  const content = doc.querySelector("#event-preview-content, [data-app-main-content]") || doc.body;
  const width = doc.documentElement.clientWidth;
  const height = Math.min(doc.documentElement.scrollHeight, view.innerHeight);
  const candidates = Array.from(content.children);
  let surface: Element | undefined;

  // Search outside-in, stopping at the first painted page-sized container.
  // The app shell itself is excluded because it may still have the workspace color.
  for (let index = 0; index < candidates.length; index++) {
    const element = candidates[index];
    if (!element.matches("div, main, section, article")) continue;
    const bounds = element.getBoundingClientRect();
    if (bounds.width < width * 0.9 || bounds.height < height * 0.7) continue;
    const style = view.getComputedStyle(element);
    if (style.visibility === "hidden" || style.position === "fixed") continue;
    if (hasColor(style.backgroundColor) || style.backgroundImage !== "none") {
      surface = element;
      break;
    }
    candidates.push(...element.children);
  }

  const style = view.getComputedStyle(surface || content);
  const background: EventPreviewBackground = {
    backgroundColor: hasColor(style.backgroundColor)
      ? style.backgroundColor
      : DEFAULT_PREVIEW_BACKGROUND.backgroundColor,
    backgroundImage: style.backgroundImage,
    backgroundSize: style.backgroundSize,
    backgroundPosition: style.backgroundPosition,
    backgroundRepeat: style.backgroundRepeat,
    color: style.color,
  };

  // Scanned events keep their generated background in a separate fixed layer.
  const artwork = surface?.querySelector('[data-scan-artwork="ready"]');
  if (artwork) {
    const artworkStyle = view.getComputedStyle(artwork);
    const overlay = artwork.querySelector("div");
    const tint = overlay ? view.getComputedStyle(overlay).backgroundColor : "transparent";
    background.backgroundImage = hasColor(tint)
      ? `linear-gradient(${tint}, ${tint}), ${artworkStyle.backgroundImage}`
      : artworkStyle.backgroundImage;
    background.backgroundSize = artworkStyle.backgroundSize;
    background.backgroundPosition = artworkStyle.backgroundPosition;
    background.backgroundRepeat = artworkStyle.backgroundRepeat;
  }
  return background;
}
