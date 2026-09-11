const activeColors = new WeakMap<HTMLElement, {
  entries: Map<symbol, string | null>;
  previous: string | null;
  value: string;
}>();

export const EVENT_PAGE_COLOR_ATTRIBUTE = "data-event-page-color";
export const EVENT_PAGE_COLOR_PROPERTY = "--event-page-chrome-color";

export function normalizeEventPageColor(color?: string | null): string | null {
  const value = color?.trim();
  return value && /^(?:#[\da-f]{3}(?:[\da-f]{3})?|rgba?\([\d\s.,%/]+\)|hsla?\([\d\s.,%/]+\))$/i.test(value)
    ? value : null;
}

/** Each mounted view owns a registration; an old view cannot clear a newer view's color. */
export function registerEventPageColor(root: HTMLElement, color?: string | null) {
  const state = activeColors.get(root) || { entries: new Map<symbol, string | null>(), previous: root.getAttribute(EVENT_PAGE_COLOR_ATTRIBUTE), value: root.style.getPropertyValue(EVENT_PAGE_COLOR_PROPERTY) };
  activeColors.set(root, state);
  const token = Symbol("event-page-color");
  let released = false;
  state.entries.set(token, normalizeEventPageColor(color));
  const sync = () => {
    const current = [...state.entries.values()].filter(Boolean).at(-1);
    if (current) {
      if (root.style.getPropertyValue(EVENT_PAGE_COLOR_PROPERTY) !== current) root.style.setProperty(EVENT_PAGE_COLOR_PROPERTY, current);
      if (root.getAttribute(EVENT_PAGE_COLOR_ATTRIBUTE) !== current) root.setAttribute(EVENT_PAGE_COLOR_ATTRIBUTE, current);
    } else {
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
