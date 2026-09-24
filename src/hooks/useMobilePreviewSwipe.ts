"use client";

import { useRef, type MouseEvent, type PointerEvent } from "react";

type SwipeStart = { id: number; x: number; y: number; time: number; target: Element };

/** Optional shortcut alongside the visible preview/close buttons. */
export function useMobilePreviewSwipe({
  enabled,
  direction,
  onSwipe,
}: {
  enabled: boolean;
  direction: "left" | "right";
  onSwipe: () => void;
}) {
  const start = useRef<SwipeStart | null>(null);
  const swipeClick = useRef<{ until: number; target: Element } | null>(null);

  return {
    onPointerDown(event: PointerEvent<HTMLElement>) {
      start.current = null;
      swipeClick.current = null;
      if (
        !enabled ||
        window.innerWidth >= 1024 ||
        !event.isPrimary ||
        (event.pointerType !== "touch" && event.pointerType !== "pen")
      )
        return;
      // Leave browser back/forward edge gestures and guest popups alone.
      if (
        event.clientX < 24 ||
        event.clientX > window.innerWidth - 24 ||
        event.currentTarget.querySelector("[data-live-card-panel]")
      )
        return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const dialog = target.closest('[role="dialog"]');
      if (dialog && dialog !== event.currentTarget) return;
      if (
        !target.closest("[data-owner-card-teaser]") &&
        target.closest(
          'a, button, input, textarea, select, label, form, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="slider"], [role="tablist"], [data-live-card-panel]',
        )
      )
        return;
      start.current = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        time: performance.now(),
        target,
      };
    },
    onPointerMove(event: PointerEvent<HTMLElement>) {
      const origin = start.current;
      if (!origin || origin.id !== event.pointerId) return;
      const dx = Math.abs(event.clientX - origin.x);
      const dy = Math.abs(event.clientY - origin.y);
      // Once a gesture becomes a vertical scroll, it cannot turn into navigation.
      if (dy > 12 && dy > dx) start.current = null;
    },
    onPointerUp(event: PointerEvent<HTMLElement>) {
      const origin = start.current;
      start.current = null;
      if (!enabled || window.innerWidth >= 1024 || !origin || origin.id !== event.pointerId) return;
      const dx = (event.clientX - origin.x) * (direction === "left" ? -1 : 1);
      const dy = Math.abs(event.clientY - origin.y);
      if (dx < 56 || dx < dy * 1.5 || performance.now() - origin.time > 1500) return;
      swipeClick.current = { until: performance.now() + 500, target: origin.target };
      onSwipe();
    },
    onPointerCancel() {
      start.current = null;
    },
    onClickCapture(event: MouseEvent<HTMLElement>) {
      // A swipe starting on the teaser must not also activate its synthesized tap.
      const click = swipeClick.current;
      if (
        click &&
        performance.now() < click.until &&
        event.target instanceof Node &&
        click.target.contains(event.target)
      ) {
        event.preventDefault();
        event.stopPropagation();
        swipeClick.current = null;
      }
    },
  };
}
