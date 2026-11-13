"use client";

import type { UIEventHandler } from "react";

/** Only the horizontal rail scrolls; focusing an editor must not shift tabs vertically. */
export function useEventNavigationScroll() {
  const onScroll: UIEventHandler<HTMLElement> = (event) => {
    if (event.currentTarget.scrollTop) event.currentTarget.scrollTop = 0;
  };
  return { onScroll, "data-event-navigation-rail": true };
}
