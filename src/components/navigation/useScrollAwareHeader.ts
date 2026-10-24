"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** Keep public navigation within reach without covering content while reading. */
export default function useScrollAwareHeader(keepVisible = false, visibilitySelector?: string) {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const [hidden, setHidden] = useState(false);
  const [targetVisible, setTargetVisible] = useState(Boolean(visibilitySelector));

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const visibilityTarget = visibilitySelector
      ? document.querySelector<HTMLElement>(visibilitySelector)
      : null;

    const scrollPosition = () =>
      Math.max(
        0,
        Math.min(window.scrollY, document.documentElement.scrollHeight - window.innerHeight),
      );
    let previousY = scrollPosition();
    let directionStartY = previousY;
    let direction = 0;
    let hideAfter = Math.max(80, header.offsetHeight);
    let ready = false;
    let frame: number | null = null;

    const reveal = () => {
      previousY = scrollPosition();
      directionStartY = previousY;
      direction = 0;
      setHidden(false);
    };

    const syncTargetVisibility = () => {
      const rect = visibilityTarget?.getBoundingClientRect();
      setTargetVisible(
        Boolean(
          rect &&
            rect.bottom > 0 &&
            rect.top < window.innerHeight &&
            rect.right > 0 &&
            rect.left < window.innerWidth,
        ),
      );
    };

    const update = () => {
      frame = null;
      syncTargetVisibility();
      const focused = document.activeElement;
      const headerFocused = Boolean(
        focused && header.contains(focused) && focused.matches(":focus-visible"),
      );
      // Dialogs fix the body and restore its scroll position when closing.
      // Ignore those jumps and establish a fresh baseline after the lock ends.
      const scrollLocked =
        document.body.style.position === "fixed" ||
        document.documentElement.style.overflow === "hidden";
      if (!ready || keepVisible || scrollLocked) {
        reveal();
        ready = !scrollLocked;
        return;
      }

      const currentY = scrollPosition();
      if (currentY <= hideAfter || headerFocused) {
        reveal();
        return;
      }

      const delta = currentY - previousY;
      const nextDirection = Math.sign(delta);
      if (nextDirection !== 0 && nextDirection !== direction) {
        directionStartY = previousY;
        direction = nextDirection;
      }
      // Accumulate small steps, but ignore tiny reversals from touch/trackpad jitter.
      if (Math.abs(currentY - directionStartY) >= 8) {
        setHidden(direction > 0);
      }
      previousY = currentY;
    };

    const schedule = () => {
      if (frame === null) frame = window.requestAnimationFrame(update);
    };
    const reset = () => {
      hideAfter = Math.max(80, header.offsetHeight);
      ready = false;
      syncTargetVisibility();
      reveal();
      schedule();
    };

    const observer =
      visibilityTarget && typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(schedule, { threshold: 0 })
        : null;
    reset();
    if (visibilityTarget) observer?.observe(visibilityTarget);
    header.addEventListener("focusin", reveal);
    header.addEventListener("focusout", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", reset);
    window.addEventListener("pageshow", reset);
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      observer?.disconnect();
      header.removeEventListener("focusin", reveal);
      header.removeEventListener("focusout", schedule);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", reset);
      window.removeEventListener("pageshow", reset);
    };
  }, [visibilitySelector, keepVisible, pathname]);

  return { headerRef, hidden: hidden && !keepVisible, targetVisible };
}
