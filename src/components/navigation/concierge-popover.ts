"use client";

import type { MotionProps } from "framer-motion";
import { type RefObject, useLayoutEffect, useSyncExternalStore } from "react";

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const GAP = 12;
const GUTTER = 16;
const MAX_WIDTH = 384;
const MAX_HEIGHT = 544;
const rest = { opacity: 1, scale: 1, x: 0, y: 0 };
const transition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
  mass: 0.75,
  opacity: { duration: 0.14 },
};

function subscribeToMotion(onChange: () => void) {
  const query = window.matchMedia(MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/** A compact popover that keeps its pointer aligned with the actual chat button. */
export function useConciergePopover({
  open,
  panelRef,
  launcherRef,
}: {
  open: boolean;
  panelRef: RefObject<HTMLElement | null>;
  launcherRef?: RefObject<HTMLElement | null>;
}): { panelMotion: MotionProps; motionEnabled: boolean } {
  const reducedMotion = useSyncExternalStore(
    subscribeToMotion,
    () => window.matchMedia(MOTION_QUERY).matches,
    () => true,
  );

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) return;
    const launcher = launcherRef?.current ||
      document.querySelector<HTMLElement>("[data-concierge-launcher] button");
    if (!launcher) return;

    const position = () => {
      const anchor = launcher.getBoundingClientRect();
      const viewport = window.visualViewport;
      const leftEdge = (viewport?.offsetLeft || 0) + GUTTER;
      const topEdge = (viewport?.offsetTop || 0) + GUTTER;
      const rightEdge = leftEdge + (viewport?.width || document.documentElement.clientWidth) - GUTTER * 2;
      const bottomEdge = topEdge + (viewport?.height || document.documentElement.clientHeight) - GUTTER * 2;
      const width = Math.max(0, Math.min(MAX_WIDTH, rightEdge - leftEdge));
      const above = anchor.top - GAP - topEdge;
      const below = bottomEdge - anchor.bottom - GAP;
      const side = above < 320 && below > above ? "bottom" : "top";
      const available = side === "top" ? above : below;
      const height = Math.max(0, Math.min(MAX_HEIGHT, available, bottomEdge - topEdge));
      const left = clamp(anchor.right - width, leftEdge, rightEdge - width);
      const top = clamp(side === "top" ? anchor.top - GAP - height : anchor.bottom + GAP,
        topEdge, bottomEdge - height);
      const arrowX = clamp(anchor.left + anchor.width / 2 - left, 24, width - 24);

      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
      panel.style.width = `${width}px`;
      panel.style.height = `${height}px`;
      panel.style.maxHeight = `${height}px`;
      panel.style.setProperty("--concierge-arrow-x", `${arrowX}px`);
      panel.style.setProperty("--concierge-origin-y", side === "top" ? "100%" : "0%");
      panel.style.setProperty("--concierge-enter-y", side === "top" ? "6px" : "-6px");
      panel.style.setProperty("--concierge-exit-y", side === "top" ? "3px" : "-3px");
      panel.dataset.conciergeSide = side;
    };

    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        position();
      });
    };
    position();
    const observer = new ResizeObserver(schedule);
    observer.observe(launcher);
    observer.observe(panel);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    window.visualViewport?.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("scroll", schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
      window.visualViewport?.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("scroll", schedule);
    };
  }, [open, panelRef, launcherRef]);

  return {
    motionEnabled: !reducedMotion,
    panelMotion: {
      initial: reducedMotion ? false : {
        opacity: 0, scale: 0.95, y: "var(--concierge-enter-y, 6px)",
      },
      animate: rest,
      exit: reducedMotion ? { opacity: 0, transition: { duration: 0 } } : {
        opacity: 0, scale: 0.97, y: "var(--concierge-exit-y, 3px)", transition: { duration: 0.13 },
      },
      transition: reducedMotion ? { duration: 0 } : transition,
      style: {
        position: "fixed",
        transformOrigin: "var(--concierge-arrow-x, calc(100% - 28px)) var(--concierge-origin-y, 100%)",
      },
    },
  };
}
