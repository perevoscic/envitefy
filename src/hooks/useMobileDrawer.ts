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
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const openDrawer = useCallback(() => {
    previousActiveElement.current =
      typeof document !== "undefined" && document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setOpen(true);
  }, []);

  const closeDrawer = useCallback(() => setOpen(false), []);

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
        openDrawer();
      }
    },
    [open, openDrawer]
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
        closeDrawer();
      }
    },
    [closeDrawer]
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
    if (typeof window === "undefined" || typeof document === "undefined" || !open) return;
    const drawer = [...document.querySelectorAll<HTMLElement>(".nav-chrome-mobile-drawer")].find(
      (element) => getComputedStyle(element).display !== "none",
    );
    if (!drawer) return;

    const previousRole = drawer.getAttribute("role");
    const previousModal = drawer.getAttribute("aria-modal");
    const previousTabIndex = drawer.getAttribute("tabindex");
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-modal", "true");
    drawer.setAttribute("tabindex", "-1");

    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const getFocusable = () =>
      [...drawer.querySelectorAll<HTMLElement>(focusableSelector)].filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden";
      });
    const focusFrame = window.requestAnimationFrame(() => {
      (getFocusable()[0] || drawer).focus({ preventScroll: true });
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDrawer();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (!focusable.length) {
        event.preventDefault();
        drawer.focus({ preventScroll: true });
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKeyDown);
      if (previousRole === null) drawer.removeAttribute("role");
      else drawer.setAttribute("role", previousRole);
      if (previousModal === null) drawer.removeAttribute("aria-modal");
      else drawer.setAttribute("aria-modal", previousModal);
      if (previousTabIndex === null) drawer.removeAttribute("tabindex");
      else drawer.setAttribute("tabindex", previousTabIndex);
      previousActiveElement.current?.focus({ preventScroll: true });
    };
  }, [closeDrawer, open]);

  return {
    mobileMenuOpen: open,
    openMobileMenu: openDrawer,
    closeMobileMenu: closeDrawer,
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
