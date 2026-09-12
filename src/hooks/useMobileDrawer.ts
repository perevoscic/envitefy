import { useRouter, useSearchParams } from "next/navigation";
import { ownerEventEditorReturnHref } from "@/lib/event-preview-viewport";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TouchEvent } from "react";
import { useEventPageColor, useEventTopbarEdit } from "@/hooks/useEventPageChrome";
import { normalizeEventPageColor } from "@/lib/event-page-chrome";

type TouchPoint = { x: number; y: number } | null;

const EDGE_THRESHOLD = 60;
const MIN_SWIPE_DISTANCE = 45;
const MAX_VERTICAL_DRIFT = 40;

const isMobileViewport = () =>
  typeof window !== "undefined" && window.innerWidth < 768;

export function useMobileDrawer(
  initialOpen?: boolean,
  editPlacement: "topbar" | "event-actions" = "topbar",
) {
  const search = useSearchParams();
  const router = useRouter();
  const returnHref = ownerEventEditorReturnHref(search);
  const [open, setOpen] = useState(initialOpen ?? (search?.get("editor") === "menu"));
  const [eventColor, setEventColor] = useState(() => normalizeEventPageColor(search?.get("eventColor")));
  useEventPageColor(eventColor);
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
  const editAction = useMemo(() => open ? null : { onClick: openDrawer }, [open, openDrawer]);
  useEventTopbarEdit(editPlacement === "topbar" ? editAction : null);

  useEffect(() => {
    const root = document.documentElement;
    const previous = root.getAttribute("data-event-editor-active");
    root.setAttribute("data-event-editor-active", "true");
    let frame = 0;
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Read the real design behind the menu, excluding design-picker thumbnails.
        const surface = document.querySelector("#guide-preview-root [data-gym-body]");
        if (!surface) return;
        const color = normalizeEventPageColor(getComputedStyle(surface).getPropertyValue("--gym-paper"));
        if (color) setEventColor(color);
      });
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["style"] });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      if (previous === null) root.removeAttribute("data-event-editor-active");
      else root.setAttribute("data-event-editor-active", previous);
    };
  }, []);

  const closeDrawer = useCallback(() => {
    // The app router is guarded by UnsavedProgressProvider. Keep the menu open
    // until navigation succeeds or the person resolves any unsaved edits.
    if (returnHref) router.push(returnHref);
    else setOpen(false);
  }, [returnHref, router]);

  // In-memory fullscreen previews stay in this editor even for saved events.
  const dismissDrawer = useCallback(() => setOpen(false), []);

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
    if (!open || typeof document === "undefined" || !isMobileViewport()) return;
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

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined" || !open || !isMobileViewport()) return;
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
    dismissMobileMenu: dismissDrawer,
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
