"use client";

import { type RefObject, useLayoutEffect } from "react";

/** Treat the mobile page and its category list as one continuous vertical path. */
export function useCategoryScrollHandoff(scroller: RefObject<HTMLDivElement | null>, choiceKeys: string) {
  useLayoutEffect(() => {
    const viewport = scroller.current;
    const panel = viewport?.closest<HTMLElement>("[data-category-panel]");
    if (!viewport || !panel) return;
    const mobile = window.matchMedia("(max-width: 1023px)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const currentNavbar = () => document.querySelector<HTMLElement>('[data-app-mobile-topbar="app"]');
    let navbar = currentNavbar();
    const enabled = () => mobile.matches && getComputedStyle(viewport).getPropertyValue("--category-page-handoff").trim() === "1";
    const dockTop = () => {
      const header = currentNavbar();
      return (header?.getClientRects().length ? Math.max(0, header.getBoundingClientRect().bottom) : 0) + 12;
    };
    let frame = 0;
    let finishTimer = 0;
    let suppressClickUntil = 0;
    let gesture: { id: number; x: number; y: number; lastY: number; time: number; velocity: number; vertical: boolean } | null = null;

    const finish = () => {
      cancelAnimationFrame(frame);
      clearTimeout(finishTimer);
      viewport.removeAttribute("data-gesture-scroll");
    };
    const begin = () => {
      finish();
      // Snap only after the continuous gesture, never between its page/list parts.
      viewport.setAttribute("data-gesture-scroll", "true");
    };
    const sizeViewport = () => {
      if (!enabled()) {
        viewport.style.removeProperty("--category-docked-space");
        viewport.removeAttribute("data-page-handoff");
        gesture = null;
        finish();
        return;
      }
      viewport.setAttribute("data-page-handoff", "true");
      // Fill the space below the docked controls. This also gives the document
      // enough height to bring the panel all the way up on short phones.
      const overhead = panel.getBoundingClientRect().height - viewport.getBoundingClientRect().height;
      const space = `${Math.ceil(dockTop() + overhead + 12)}px`;
      if (viewport.style.getPropertyValue("--category-docked-space") !== space) {
        viewport.style.setProperty("--category-docked-space", space);
      }
    };
    const move = (delta: number) => {
      let remaining = delta;
      if (remaining > 0) {
        const distance = Math.max(0, panel.getBoundingClientRect().top - dockTop());
        if (distance > 0) {
          const before = window.scrollY;
          window.scrollBy({ top: Math.min(remaining, distance), behavior: "instant" });
          remaining -= window.scrollY - before;
          if (panel.getBoundingClientRect().top > dockTop() + 1) return delta - remaining;
        }
      }
      const before = viewport.scrollTop;
      viewport.scrollTop = Math.max(0, Math.min(viewport.scrollHeight - viewport.clientHeight, before + remaining));
      remaining -= viewport.scrollTop - before;
      if (remaining < 0) {
        const pageBefore = window.scrollY;
        window.scrollBy({ top: remaining, behavior: "instant" });
        remaining -= window.scrollY - pageBefore;
      }
      return delta - remaining;
    };
    const wheel = (event: WheelEvent) => {
      if (!enabled() || event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.cancelable) return;
      event.preventDefault();
      begin();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientHeight : 1;
      move(event.deltaY * unit);
      finishTimer = window.setTimeout(finish, 160);
    };
    const start = (event: TouchEvent) => {
      finish();
      gesture = null;
      if (!enabled() || event.touches.length !== 1 || (event.target instanceof Element && event.target.closest("input, textarea, select, [contenteditable=true]"))) return;
      const touch = event.touches[0];
      suppressClickUntil = 0;
      gesture = { id: touch.identifier, x: touch.clientX, y: touch.clientY, lastY: touch.clientY, time: event.timeStamp, velocity: 0, vertical: false };
    };
    const drag = (event: TouchEvent) => {
      if (!gesture) return;
      if (event.touches.length !== 1 || !enabled()) {
        gesture = null;
        finish();
        return;
      }
      const touch = event.touches[0];
      if (touch.identifier !== gesture.id) return;
      if (!gesture.vertical) {
        const dy = Math.abs(touch.clientY - gesture.y), dx = Math.abs(touch.clientX - gesture.x);
        if (Math.max(dx, dy) < 6) return;
        if (dx >= dy) { gesture = null; return; }
        begin();
        gesture.vertical = true;
      }
      // Native listeners must be non-passive before the first move so Safari
      // doesn't latch this gesture to just one of the two scroll containers.
      if (!event.cancelable) { gesture = null; finish(); return; }
      event.preventDefault();
      const delta = gesture.lastY - touch.clientY;
      const elapsed = Math.max(1, event.timeStamp - gesture.time);
      const velocity = Math.max(-3, Math.min(3, delta / elapsed));
      gesture.velocity = elapsed > 80 ? velocity : gesture.velocity * 0.25 + velocity * 0.75;
      gesture.lastY = touch.clientY;
      gesture.time = event.timeStamp;
      suppressClickUntil = performance.now() + 400;
      move(delta);
    };
    const end = (event: TouchEvent) => {
      const completed = gesture;
      gesture = null;
      if (!completed?.vertical) return;
      suppressClickUntil = performance.now() + 400;
      if (event.type === "touchcancel" || event.touches.length || event.timeStamp - completed.time > 80 || motion.matches) { finish(); return; }
      let velocity = completed.velocity;
      let last = performance.now();
      const coast = (now: number) => {
        if (!enabled() || motion.matches) { finish(); return; }
        const elapsed = Math.min(32, now - last);
        last = now;
        const consumed = move(velocity * elapsed);
        velocity *= Math.exp(-0.006 * elapsed);
        if (Math.abs(velocity) < 0.025 || Math.abs(consumed) < 0.5) { finish(); return; }
        frame = requestAnimationFrame(coast);
      };
      frame = requestAnimationFrame(coast);
    };
    const click = (event: MouseEvent) => {
      if (event.detail && performance.now() < suppressClickUntil) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const interrupt = () => { gesture = null; finish(); };
    sizeViewport();
    const observer = new ResizeObserver(sizeViewport);
    observer.observe(panel);
    if (navbar) observer.observe(navbar);
    // The lazy navigation mounts after this page and replaces its header when
    // a drawer closes. Keep both the docking measurement and its observer live.
    const navbarObserver = new MutationObserver(() => {
      const replacement = currentNavbar();
      if (replacement === navbar) return;
      if (navbar) observer.unobserve(navbar);
      navbar = replacement;
      if (navbar) observer.observe(navbar);
      sizeViewport();
    });
    navbarObserver.observe(document.body, { childList: true, subtree: true });
    mobile.addEventListener("change", sizeViewport);
    window.addEventListener("resize", sizeViewport);
    document.addEventListener("pointerdown", interrupt, true);
    document.addEventListener("keydown", interrupt, true);
    document.addEventListener("visibilitychange", interrupt);
    panel.addEventListener("wheel", wheel, { passive: false });
    panel.addEventListener("touchstart", start, { passive: true });
    panel.addEventListener("touchmove", drag, { passive: false });
    panel.addEventListener("touchend", end);
    panel.addEventListener("touchcancel", end);
    panel.addEventListener("click", click, true);
    return () => {
      finish();
      observer.disconnect();
      navbarObserver.disconnect();
      viewport.style.removeProperty("--category-docked-space");
      viewport.removeAttribute("data-page-handoff");
      mobile.removeEventListener("change", sizeViewport);
      window.removeEventListener("resize", sizeViewport);
      document.removeEventListener("pointerdown", interrupt, true);
      document.removeEventListener("keydown", interrupt, true);
      document.removeEventListener("visibilitychange", interrupt);
      panel.removeEventListener("wheel", wheel);
      panel.removeEventListener("touchstart", start);
      panel.removeEventListener("touchmove", drag);
      panel.removeEventListener("touchend", end);
      panel.removeEventListener("touchcancel", end);
      panel.removeEventListener("click", click, true);
    };
  }, [scroller, choiceKeys]);
}
