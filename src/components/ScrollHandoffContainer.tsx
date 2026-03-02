"use client";

import React, {
  useCallback,
  useRef,
  type HTMLAttributes,
  type WheelEvent,
  type TouchEvent,
} from "react";

type ScrollHandoffContainerProps = HTMLAttributes<HTMLDivElement>;

const SCROLL_EPSILON = 1;
const TOUCH_TAP_SLOP_PX = 8;

/**
 * ScrollHandoffContainer
 *
 * A reusable nested scroll container that:
 * - Scrolls its own content independently from the page/preview
 * - Lets scroll "pass through" to parent only when the container
 *   reaches its top or bottom boundary
 * - Works for wheel, trackpad, and touch input
 * - Keeps momentum scrolling by not interfering when at boundaries
 *
 * Usage:
 *   <ScrollHandoffContainer className="flex-1 overflow-y-auto">
 *     {/* right-side customization panel content *\/}
 *   </ScrollHandoffContainer>
 */
export default function ScrollHandoffContainer({
  className,
  onWheel,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  children,
  ...rest
}: ScrollHandoffContainerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchTargetRef = useRef<EventTarget | null>(null);

  const isInteractiveTarget = useCallback((target: EventTarget | null): boolean => {
    if (!target || !(target instanceof HTMLElement)) return false;
    const el = target.closest?.("button, a, [role='button'], [data-no-scroll-capture]");
    return Boolean(el);
  }, []);

  const canScrollInDirection = useCallback((el: HTMLDivElement, deltaY: number) => {
    const { scrollTop, scrollHeight, clientHeight } = el;
    const maxScroll = scrollHeight - clientHeight;
    if (maxScroll <= 0) return false;

    const atTop = scrollTop <= SCROLL_EPSILON;
    const atBottom = scrollTop >= maxScroll - SCROLL_EPSILON;

    if (deltaY < 0) {
      // scrolling up
      return !atTop;
    }
    if (deltaY > 0) {
      // scrolling down
      return !atBottom;
    }
    return false;
  }, []);

  const handleWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      const el = event.currentTarget;
      const deltaY = event.deltaY;

      if (canScrollInDirection(el, deltaY)) {
        // Keep scroll inside panel and prevent the preview/page from moving.
        event.preventDefault();
        event.stopPropagation();
        el.scrollTop += deltaY;
      }

      if (onWheel) {
        onWheel(event);
      }
    },
    [canScrollInDirection, onWheel]
  );

  const handleTouchStart = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      const touch = event.touches[0];
      touchStartYRef.current = touch?.clientY ?? null;
      touchTargetRef.current = event.target;
      if (onTouchStart) {
        onTouchStart(event);
      }
    },
    [onTouchStart]
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      const el = event.currentTarget;
      const touch = event.touches[0];

      if (!touch || touchStartYRef.current == null) {
        if (onTouchMove) onTouchMove(event);
        return;
      }

      const currentY = touch.clientY;
      const deltaY = touchStartYRef.current - currentY;
      const absDeltaY = Math.abs(deltaY);

      // Keep tap behavior for buttons/links, but treat a real vertical swipe as scroll.
      if (
        isInteractiveTarget(touchTargetRef.current) &&
        absDeltaY < TOUCH_TAP_SLOP_PX
      ) {
        if (onTouchMove) onTouchMove(event);
        return;
      }

      if (canScrollInDirection(el, deltaY)) {
        // Consume the scroll inside the panel.
        event.preventDefault();
        event.stopPropagation();
        el.scrollTop += deltaY;
      } else {
        // At boundary → allow pass-through scroll.
        touchStartYRef.current = currentY;
      }

      if (onTouchMove) {
        onTouchMove(event);
      }
    },
    [canScrollInDirection, isInteractiveTarget, onTouchMove]
  );

  const handleTouchEnd = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      touchStartYRef.current = null;
      touchTargetRef.current = null;
      if (onTouchEnd) {
        onTouchEnd(event);
      }
    },
    [onTouchEnd]
  );

  const mergedClassName = [
    "overflow-y-auto",
    "overscroll-contain",
    "[-webkit-overflow-scrolling:touch]",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      {...rest}
      ref={containerRef}
      className={mergedClassName}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}
