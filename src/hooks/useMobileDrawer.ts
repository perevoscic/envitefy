import { useCallback, useEffect, useRef, useState } from "react";
import type { TouchEvent } from "react";

type TouchPoint = { x: number; y: number } | null;

const EDGE_THRESHOLD = 60;
const MIN_SWIPE_DISTANCE = 45;
const MAX_VERTICAL_DRIFT = 40;

const isMobileViewport = () =>
  typeof window !== "undefined" && window.innerWidth < 768;

export function useMobileDrawer() {
  const [open, setOpen] = useState(false);
  const previewTouchStart = useRef<TouchPoint>(null);
  const drawerTouchStart = useRef<TouchPoint>(null);

  const handlePreviewTouchStart = useCallback(
    (event: TouchEvent<HTMLElement>) => {
      if (!isMobileViewport() || open) return;
      const touch = event.touches[0];
      previewTouchStart.current = { x: touch.clientX, y: touch.clientY };
    },
    [open]
  );

  const handlePreviewTouchEnd = useCallback(
    (event: TouchEvent<HTMLElement>) => {
      if (!isMobileViewport() || open) {
        previewTouchStart.current = null;
        return;
      }
      const start = previewTouchStart.current;
      previewTouchStart.current = null;
      if (!start || typeof window === "undefined") return;

      const touch = event.changedTouches[0];
      const deltaX = start.x - touch.clientX;
      const deltaY = Math.abs(start.y - touch.clientY);

      if (
        start.x > window.innerWidth - EDGE_THRESHOLD &&
        deltaX > MIN_SWIPE_DISTANCE &&
        deltaY < MAX_VERTICAL_DRIFT
      ) {
        setOpen(true);
      }
    },
    [open]
  );

  const handleDrawerTouchStart = useCallback(
    (event: TouchEvent<HTMLElement>) => {
      if (!isMobileViewport()) return;
      const touch = event.touches[0];
      drawerTouchStart.current = { x: touch.clientX, y: touch.clientY };
    },
    []
  );

  const handleDrawerTouchEnd = useCallback(
    (event: TouchEvent<HTMLElement>) => {
      if (!isMobileViewport()) {
        drawerTouchStart.current = null;
        return;
      }
      const start = drawerTouchStart.current;
      drawerTouchStart.current = null;
      if (!start) return;

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - start.x;
      const deltaY = Math.abs(touch.clientY - start.y);

      if (deltaX > MIN_SWIPE_DISTANCE && deltaY < MAX_VERTICAL_DRIFT) {
        setOpen(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return {
    mobileMenuOpen: open,
    openMobileMenu: () => setOpen(true),
    closeMobileMenu: () => setOpen(false),
    previewTouchHandlers: {
      onTouchStart: handlePreviewTouchStart,
      onTouchEnd: handlePreviewTouchEnd,
    },
    drawerTouchHandlers: {
      onTouchStart: handleDrawerTouchStart,
      onTouchEnd: handleDrawerTouchEnd,
    },
  };
}
