"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { EVENT_PAGE_COLOR_ATTRIBUTE, EVENT_PAGE_TONE_ATTRIBUTE, normalizeEventPageColor } from "@/lib/event-page-chrome";
import { APPEARANCE_CHANGE_EVENT } from "@/lib/appearance";
import {
  HERO_THEME_COLOR_ATTRIBUTE,
  clearIosBrowserChromeColors,
  getPreferredThemeColor,
  isIosBrowserChrome,
  setIosBrowserChromeColors,
  setColorSchemeMeta,
  setThemeColor,
} from "@/lib/theme-color";

export default function ThemeColorSync() {
  const pathname = usePathname();

  useEffect(() => {
    let frameId = 0;
    const syncChromeHints = () => {
      frameId = 0;
      const variant = document.documentElement.dataset.theme === "general-dark" ? "dark" : "light";
      const eventColor = normalizeEventPageColor(document.documentElement.getAttribute(EVENT_PAGE_COLOR_ATTRIBUTE));
      if (eventColor) {
        const eventTone = document.documentElement.getAttribute(EVENT_PAGE_TONE_ATTRIBUTE);
        setColorSchemeMeta(eventTone === "light" || eventTone === "dark" ? eventTone : variant);
        clearIosBrowserChromeColors();
        setThemeColor(eventColor);
        return;
      }
      setColorSchemeMeta(variant);
      if (isIosBrowserChrome()) {
        setIosBrowserChromeColors(variant);
        return;
      }
      clearIosBrowserChromeColors();
      setThemeColor(getPreferredThemeColor(pathname));
    };
    const scheduleSyncChromeHints = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(syncChromeHints);
    };

    syncChromeHints();
    window.addEventListener(APPEARANCE_CHANGE_EVENT, scheduleSyncChromeHints);
    window.addEventListener("pageshow", scheduleSyncChromeHints);
    scheduleSyncChromeHints();
    const observer = new MutationObserver(scheduleSyncChromeHints);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [HERO_THEME_COLOR_ATTRIBUTE, EVENT_PAGE_COLOR_ATTRIBUTE, EVENT_PAGE_TONE_ATTRIBUTE, "data-theme"],
      childList: true,
      subtree: true,
    });
    // Next can stream/replace route metadata after the route effect has run.
    // Watch head changes too; setters only write changed values to avoid loops.
    const headObserver = new MutationObserver(scheduleSyncChromeHints);
    headObserver.observe(document.head, {
      attributes: true,
      attributeFilter: ["content", "media", "name"],
      childList: true,
      subtree: true,
    });

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      observer.disconnect();
      headObserver.disconnect();
      window.removeEventListener(APPEARANCE_CHANGE_EVENT, scheduleSyncChromeHints);
      window.removeEventListener("pageshow", scheduleSyncChromeHints);
    };
  }, [pathname]);

  return null;
}
