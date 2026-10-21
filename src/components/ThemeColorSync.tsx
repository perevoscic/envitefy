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
      setColorSchemeMeta(variant);
      const eventColor = normalizeEventPageColor(document.documentElement.getAttribute(EVENT_PAGE_COLOR_ATTRIBUTE));
      if (eventColor) {
        const eventTone = document.documentElement.getAttribute(EVENT_PAGE_TONE_ATTRIBUTE);
        if (eventTone === "light" || eventTone === "dark") setColorSchemeMeta(eventTone);
        clearIosBrowserChromeColors();
        setThemeColor(eventColor);
        return;
      }
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
    scheduleSyncChromeHints();
    const observer = new MutationObserver(scheduleSyncChromeHints);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [HERO_THEME_COLOR_ATTRIBUTE, EVENT_PAGE_COLOR_ATTRIBUTE, EVENT_PAGE_TONE_ATTRIBUTE, "data-theme"],
      childList: true,
      subtree: true,
    });

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      observer.disconnect();
      window.removeEventListener(APPEARANCE_CHANGE_EVENT, scheduleSyncChromeHints);
    };
  }, [pathname]);

  return null;
}
