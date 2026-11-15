export const EVENT_NAVIGATION_SCROLL_EVENT = "envitefy:event-navigation-scroll";

/** Saved owner previews scroll in a same-origin document, independently of the app. */
export function connectEventNavigationScroll(view: Window, host: Window) {
  const position = () => Math.max(0, Math.min(view.scrollY,
    Math.max(0, view.document.documentElement.scrollHeight - view.innerHeight)));
  let previous = position();
  const onScroll = () => {
    const y = position();
    const delta = y - previous;
    previous = y;
    if (delta) host.dispatchEvent(new CustomEvent(EVENT_NAVIGATION_SCROLL_EVENT, { detail: { y, delta } }));
  };
  view.addEventListener("scroll", onScroll, { passive: true });
  host.dispatchEvent(new CustomEvent(EVENT_NAVIGATION_SCROLL_EVENT, { detail: { y: previous, delta: 0 } }));
  return () => view.removeEventListener("scroll", onScroll);
}
