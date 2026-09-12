const activeColors = new WeakMap<HTMLElement, {
  entries: Map<symbol, string | null>;
  previous: string | null;
  value: string;
  previousTone: string | null;
  currentColor: string | null;
}>();

export const EVENT_PAGE_COLOR_ATTRIBUTE = "data-event-page-color";
export const EVENT_PAGE_COLOR_PROPERTY = "--event-page-chrome-color";
export const EVENT_PAGE_TONE_ATTRIBUTE = "data-event-page-tone";

export function normalizeEventPageColor(color?: string | null): string | null {
  const value = color?.trim();
  return value && /^(?:#[\da-f]{3}(?:[\da-f]{3})?|rgba?\([\d\s.,%/]+\)|hsla?\([\d\s.,%/]+\))$/i.test(value)
    ? value : null;
}

/** Classify the registered solid color without DOM reads, image sampling or observers. */
export function isDarkEventPageColor(color: string): boolean {
  const value = normalizeEventPageColor(color);
  if (!value) return false;
  let channels: number[];
  let alpha = 1;
  const unit = (part: string, maximum: number) =>
    Math.max(0, Math.min(1, Number.parseFloat(part) / (part.endsWith("%") ? 100 : maximum)));
  if (value.startsWith("#")) {
    const hex = value.length === 4
      ? [...value.slice(1)].map((part) => part + part).join("")
      : value.slice(1);
    channels = [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);
  } else {
    const parts = value.slice(value.indexOf("(") + 1, -1).trim().split(/[\s,/]+/);
    if (parts.length < 3 || parts.length > 4) return false;
    if (parts[3]) alpha = unit(parts[3], 1);
    if (value.toLowerCase().startsWith("hsl")) {
      const hue = Number.parseFloat(parts[0]) / 30;
      const saturation = unit(parts[1], 100);
      const lightness = unit(parts[2], 100);
      const amplitude = saturation * Math.min(lightness, 1 - lightness);
      channels = [0, 8, 4].map((offset) => {
        const sector = (offset + hue) % 12;
        return lightness - amplitude * Math.max(-1, Math.min(sector - 3, 9 - sector, 1));
      });
    } else {
      channels = parts.slice(0, 3).map((part) => unit(part, 255));
    }
  }
  // Translucent colors are assessed over the app's light base, not as opaque black.
  const [red, green, blue] = channels.map((channel) => {
    const opaque = channel * alpha + 1 - alpha;
    return opaque <= 0.04045 ? opaque / 12.92 : ((opaque + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue < 0.18;
}

/** Each mounted view owns a registration; an old view cannot clear a newer view's color. */
export function registerEventPageColor(root: HTMLElement, color?: string | null) {
  const state = activeColors.get(root) || {
    entries: new Map<symbol, string | null>(),
    previous: root.getAttribute(EVENT_PAGE_COLOR_ATTRIBUTE),
    value: root.style.getPropertyValue(EVENT_PAGE_COLOR_PROPERTY),
    previousTone: root.getAttribute(EVENT_PAGE_TONE_ATTRIBUTE),
    currentColor: null,
  };
  activeColors.set(root, state);
  const token = Symbol("event-page-color");
  let released = false;
  state.entries.set(token, normalizeEventPageColor(color));
  const sync = () => {
    const current = [...state.entries.values()].filter(Boolean).at(-1);
    if (current) {
      if (root.style.getPropertyValue(EVENT_PAGE_COLOR_PROPERTY) !== current) root.style.setProperty(EVENT_PAGE_COLOR_PROPERTY, current);
      if (root.getAttribute(EVENT_PAGE_COLOR_ATTRIBUTE) !== current) root.setAttribute(EVENT_PAGE_COLOR_ATTRIBUTE, current);
      if (state.currentColor !== current) {
        const tone = isDarkEventPageColor(current) ? "dark" : "light";
        if (root.getAttribute(EVENT_PAGE_TONE_ATTRIBUTE) !== tone) root.setAttribute(EVENT_PAGE_TONE_ATTRIBUTE, tone);
        state.currentColor = current;
      }
    } else {
      state.currentColor = null;
      if (state.previousTone === null) root.removeAttribute(EVENT_PAGE_TONE_ATTRIBUTE);
      else root.setAttribute(EVENT_PAGE_TONE_ATTRIBUTE, state.previousTone);
      if (state.previous === null) root.removeAttribute(EVENT_PAGE_COLOR_ATTRIBUTE);
      else root.setAttribute(EVENT_PAGE_COLOR_ATTRIBUTE, state.previous);
      if (state.value) root.style.setProperty(EVENT_PAGE_COLOR_PROPERTY, state.value);
      else root.style.removeProperty(EVENT_PAGE_COLOR_PROPERTY);
    }
  };
  const update = (next?: string | null) => {
    if (released) return;
    const normalized = normalizeEventPageColor(next);
    if (normalized) state.entries.set(token, normalized);
    sync();
  };
  update(color);
  return {
    update,
    dispose() {
      if (released) return;
      released = true;
      state.entries.delete(token);
      sync();
      if (!state.entries.size) activeColors.delete(root);
    },
  };
}
