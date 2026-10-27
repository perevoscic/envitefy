"use client";

import { useEffect, useRef, useState } from "react";

type HeroMotion = "idle" | "entering" | "complete";

/** A finite portrait-led entrance; the unenhanced hero stays fully visible. */
export default function useGymnasticsHeroEntrance() {
  const heroRef = useRef<HTMLElement>(null);
  const navigationRef = useRef<HTMLDivElement>(null);
  const completed = useRef(false);
  const [motion, setMotion] = useState<HeroMotion>("idle");

  useEffect(() => {
    if (completed.current) {
      setMotion("complete");
      return;
    }

    const hero = heroRef.current;
    const navigation = navigationRef.current;
    const portrait = hero?.querySelector<HTMLImageElement>("img");
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const roots = [hero, navigation].filter((root): root is HTMLElement => root !== null);
    let disposed = false;
    let loading = false;
    let started = false;
    let frame = 0;
    let loadingTimer = 0;
    let entranceTimer = 0;

    function clearPending() {
      if (frame) window.cancelAnimationFrame(frame);
      if (loadingTimer) window.clearTimeout(loadingTimer);
      if (entranceTimer) window.clearTimeout(entranceTimer);
      frame = loadingTimer = entranceTimer = 0;
      portrait?.removeEventListener("load", onLoad);
      portrait?.removeEventListener("error", complete);
    }

    function removeListeners() {
      preference.removeEventListener("change", onPreference);
      for (const root of roots) {
        root.removeEventListener("focusin", complete, true);
        root.removeEventListener("pointerdown", complete, true);
      }
    }

    function complete() {
      if (disposed || completed.current) return;
      completed.current = true;
      clearPending();
      removeListeners();
      setMotion("complete");
    }

    function onPreference() {
      if (preference.matches) complete();
    }

    function begin() {
      if (disposed || completed.current || started) return;
      if (preference.matches) {
        complete();
        return;
      }
      started = true;
      window.clearTimeout(loadingTimer);
      loadingTimer = 0;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        if (disposed || completed.current) return;
        setMotion("entering");
        entranceTimer = window.setTimeout(complete, 1900);
      });
    }

    function onLoad() {
      if (disposed || completed.current || loading || !portrait) return;
      loading = true;
      portrait.removeEventListener("load", onLoad);
      if (!portrait.naturalWidth) {
        complete();
        return;
      }
      if (typeof portrait.decode !== "function") {
        begin();
        return;
      }
      try {
        void portrait.decode().then(begin, complete);
      } catch {
        complete();
      }
    }

    if (!hero || !portrait || preference.matches) {
      complete();
    } else {
      preference.addEventListener("change", onPreference);
      for (const root of roots) {
        root.addEventListener("focusin", complete, true);
        root.addEventListener("pointerdown", complete, { capture: true, passive: true });
      }
      // A slow download or decode must never hold back the heading or its actions.
      loadingTimer = window.setTimeout(complete, 2500);
      portrait.addEventListener("load", onLoad);
      portrait.addEventListener("error", complete);
      if (roots.some((root) => root.contains(document.activeElement))) complete();
      else if (portrait.complete) onLoad();
    }

    return () => {
      disposed = true;
      clearPending();
      removeListeners();
    };
  }, []);

  return { heroRef, navigationRef, motion };
}
