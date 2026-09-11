import { normalizeEventPageColor } from "./event-page-chrome.ts";

/** Read the event's painted page, excluding chrome, overlays, artwork and cards. */
export function readEventCanvasColor(canvas: HTMLElement): string | null {
  const doc = canvas.ownerDocument;
  const view = doc.defaultView;
  if (!view) return null;
  const width = canvas.clientWidth;
  const candidates = Array.from(canvas.children);
  for (let index = 0; index < candidates.length; index++) {
    const element = candidates[index];
    if (!element.matches("div, main, section, article")) continue;
    if (element.matches('[inert], [aria-hidden="true"], [role="dialog"]')) continue;
    const bounds = element.getBoundingClientRect();
    const style = view.getComputedStyle(element);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.position === "fixed" ||
      style.position === "absolute"
    )
      continue;
    // A transparent wrapper can be display:contents or shorter while content loads.
    const color = style.backgroundColor;
    if (
      !element.classList.contains("event-modern-page") &&
      bounds.width >= Math.min(width * 0.5, 640) &&
      bounds.height >= 160 &&
      color !== "transparent" &&
      color !== "rgba(0, 0, 0, 0)"
    ) {
      const solid = normalizeEventPageColor(color);
      if (solid) return solid;
      // Tailwind can emit oklch; browser chrome uses its equivalent solid RGB color.
      const sample = doc.createElement("canvas");
      sample.width = sample.height = 1;
      const context = sample.getContext("2d", { willReadFrequently: true });
      if (context) {
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        const [r, g, b, alpha] = context.getImageData(0, 0, 1, 1).data;
        if (alpha) return `rgb(${r}, ${g}, ${b})`;
      }
    }
    candidates.push(...element.children);
  }
  return null;
}
