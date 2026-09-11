const activePreviews = new WeakMap<Element, { count: number; previous: string | null }>();

/** Keep navigation hidden until the last preview in this document closes. */
export function suppressEventPreviewChrome(root: Element): () => void {
  let state = activePreviews.get(root);
  if (!state) {
    state = { count: 0, previous: root.getAttribute("data-owner-preview-open") };
    activePreviews.set(root, state);
  }
  state.count += 1;
  root.setAttribute("data-owner-preview-open", "true");
  let released = false;
  return () => {
    if (released) return;
    released = true;
    state.count -= 1;
    if (state.count > 0) return;
    if (state.previous === null) root.removeAttribute("data-owner-preview-open");
    else root.setAttribute("data-owner-preview-open", state.previous);
    activePreviews.delete(root);
  };
}
