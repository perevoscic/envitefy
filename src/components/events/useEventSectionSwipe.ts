"use client";

import { useRef, type TouchEventHandler } from "react";

/** Horizontal gestures select sections; fields and horizontal scrollers keep their own gestures. */
export function useEventSectionSwipe(
  ids: string[],
  activeId: string | undefined,
  select: (id: string) => void,
) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart: TouchEventHandler<HTMLElement> = (event) => {
    start.current = null;
    if (
      event.touches.length !== 1 ||
      (event.target as Element).closest(
        "button, a, input, textarea, select, [contenteditable=true]",
      )
    )
      return;
    let target = event.target as HTMLElement | null;
    while (target && target !== event.currentTarget) {
      if (
        ["auto", "scroll"].includes(getComputedStyle(target).overflowX) &&
        target.scrollWidth > target.clientWidth
      )
        return;
      target = target.parentElement;
    }
    start.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  };
  const onTouchEnd: TouchEventHandler<HTMLElement> = (event) => {
    const initial = start.current;
    start.current = null;
    if (!initial || event.touches.length || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - initial.x;
    const dy = event.changedTouches[0].clientY - initial.y;
    if (Math.abs(dx) < 60 || Math.abs(dy) > 40 || Math.abs(dx) < Math.abs(dy) * 2) return;
    const next = ids[ids.indexOf(activeId || "") + (dx < 0 ? 1 : -1)];
    if (next) {
      event.stopPropagation();
      select(next);
    }
  };
  return {
    onTouchStart,
    onTouchEnd,
    onTouchCancel: () => {
      start.current = null;
    },
  };
}
