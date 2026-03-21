"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  getPreferredThemeColor,
  getThemeColorForPath,
  HERO_THEME_COLOR_ATTRIBUTE,
  setThemeColor,
} from "@/lib/theme-color";

export default function ThemeColorSync() {
  const pathname = usePathname();

  useEffect(() => {
    setThemeColor(getThemeColorForPath(pathname));
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let frame = 0;
    let lastApplied = "";

    const applyPreferredColor = () => {
      frame = 0;
      const next = getPreferredThemeColor(pathname);
      if (next && next !== lastApplied) {
        setThemeColor(next);
        lastApplied = next;
      }
    };

    const scheduleApply = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(applyPreferredColor);
    };

    scheduleApply();

    const observer = new MutationObserver(() => {
      scheduleApply();
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [HERO_THEME_COLOR_ATTRIBUTE],
    });

    window.addEventListener("scroll", scheduleApply, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", scheduleApply);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [pathname]);

  return null;
}
