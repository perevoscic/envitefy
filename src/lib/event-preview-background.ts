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

function previewElementSelector(element: Element, root: Element): string | null {
  const segments: string[] = [];
  let current = element;
  while (current !== root) {
    const parent = current.parentElement;
    if (!parent) return null;
    const index = Array.from(parent.children).indexOf(current);
    if (index < 0) return null;
    segments.unshift(`:nth-child(${index + 1})`);
    current = parent;
  }
  return [":root", ...segments].join(" > ");
}

/** Style only this iframe without changing React's server-rendered event attributes. */
export function createEventPreviewBackgroundController(doc: Document, continuousSurface = false) {
  const style = doc.createElement("style");

  return {
    read(): EventPreviewBackground {
      // Read the original styles on every update, including device changes and newly loaded art.
      // Disabling the stylesheet does not mutate class/style attributes or retrigger the observer.
      style.disabled = true;
      try {
        const { background, surface, artwork } = resolveEventPreviewBackground(doc);
        const selectors: string[] = [];
        let artworkSelector: string | null = null;
        if (continuousSurface || (background.backgroundImage && background.backgroundImage !== "none")) {
          for (let element = surface; element; element = element.parentElement || undefined) {
            const selector = previewElementSelector(element, doc.documentElement);
            if (selector) selectors.push(selector);
          }
          if (artwork) artworkSelector = previewElementSelector(artwork, doc.documentElement);
        }
        // Nested Suspense content can still be hydrating after navigation mounts.
        // Structural selectors keep those nodes untouched; rebuild after DOM changes.
        const css = [
          selectors.length ? `${selectors.join(",\n")} { background-color: transparent !important; background-image: none !important; }` : "",
          artworkSelector ? `${artworkSelector} { visibility: hidden !important; }` : "",
        ].join("\n");
        if (style.textContent !== css) style.textContent = css;
        if (!style.isConnected) doc.head.append(style);
        return background;
      } finally {
        style.disabled = false;
      }
    },
    dispose() {
      style.remove();
    },
  };
}
