"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  HERO_THEME_COLOR_ATTRIBUTE,
  clearIosBrowserChromeColors,
  getPreferredThemeColor,
  isIosBrowserChrome,
  setIosBrowserChromeColors,
  setLightColorSchemeMeta,
  setThemeColor,
} from "@/lib/theme-color";

export default function ThemeColorSync() {
  const pathname = usePathname();

  useEffect(() => {
    let frameId = 0;
    const syncChromeHints = () => {
      frameId = 0;
      setLightColorSchemeMeta();
      if (isIosBrowserChrome()) {
        setIosBrowserChromeColors();
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
    scheduleSyncChromeHints();
    const observer = new MutationObserver(scheduleSyncChromeHints);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [HERO_THEME_COLOR_ATTRIBUTE],
      childList: true,
      subtree: true,
    });

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
