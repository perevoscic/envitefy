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
function resolveEventPreviewBackground(doc: Document): {
  background: EventPreviewBackground;
  surface?: Element;
  artwork?: Element | null;
} {
  const view = doc.defaultView;
  if (!view) return { background: DEFAULT_PREVIEW_BACKGROUND };
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
  return { background, surface: surface || content, artwork };
}

export function readEventPreviewBackground(doc: Document): EventPreviewBackground {
  return resolveEventPreviewBackground(doc).background;
}

const surfaceAttribute = "data-event-preview-background-surface";
const artworkAttribute = "data-event-preview-background-artwork";

/** Paint artwork once on the outer canvas, with transparent page surfaces in this iframe only. */
export function createEventPreviewBackgroundController(doc: Document) {
  const style = doc.createElement("style");
  style.textContent = `
    [${surfaceAttribute}] {
      background-color: transparent !important;
      background-image: none !important;
    }
    [${artworkAttribute}] { visibility: hidden !important; }
  `;
  const marked = new Map<Element, { attribute: string; previous: string | null }>();

  const restore = () => {
    for (const [element, { attribute, previous }] of marked) {
      if (previous === null) element.removeAttribute(attribute);
      else element.setAttribute(attribute, previous);
    }
    marked.clear();
  };
  const mark = (element: Element, attribute: string) => {
    marked.set(element, { attribute, previous: element.getAttribute(attribute) });
    element.setAttribute(attribute, "");
  };

  return {
    read(): EventPreviewBackground {
      // Read the original styles on every update, including device changes and newly loaded art.
      // Disabling the stylesheet does not mutate class/style attributes or retrigger the observer.
      style.disabled = true;
      try {
        const { background, surface, artwork } = resolveEventPreviewBackground(doc);
        restore();
        if (background.backgroundImage && background.backgroundImage !== "none") {
          for (let element = surface; element; element = element.parentElement || undefined) {
            mark(element, surfaceAttribute);
          }
          if (artwork) mark(artwork, artworkAttribute);
        }
        if (!style.isConnected) doc.head.append(style);
        return background;
      } finally {
        style.disabled = false;
      }
    },
    dispose() {
      restore();
      style.remove();
    },
  };
}
