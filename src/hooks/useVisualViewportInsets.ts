"use client";

import { useEffect } from "react";

type VisualViewportInsetsOptions = {
  keyboardInsetVariable?: `--${string}`;
  layoutHeightVariable?: `--${string}`;
  layoutTopVariable?: `--${string}`;
  fitVisualViewport?: boolean;
  lockPageScroll?: boolean;
};

export function useVisualViewportInsets({
  keyboardInsetVariable = "--envitefy-keyboard-inset",
  layoutHeightVariable = "--envitefy-layout-height",
  layoutTopVariable = "--envitefy-layout-top",
  fitVisualViewport = false,
  lockPageScroll = false,
}: VisualViewportInsetsOptions = {}) {
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = body.style.overflow;

    const update = () => {
      const visualViewport = window.visualViewport;
      const layoutHeight = window.innerHeight;
      const visualHeight = visualViewport?.height ?? layoutHeight;
      const visualTop = visualViewport?.offsetTop ?? 0;
      const keyboardInset = Math.max(0, layoutHeight - visualHeight - visualTop);
      // Fit the keyboard/browser chrome, but let pinch zoom magnify the page
      // without reflowing the whole chat into the zoomed viewport.
      const fitVisibleArea = fitVisualViewport && (visualViewport?.scale ?? 1) === 1;
      const height = fitVisibleArea ? Math.min(layoutHeight, visualHeight) : layoutHeight;

      if (height > 0) {
        root.style.setProperty(layoutHeightVariable, `${Math.round(height)}px`);
      }
      root.style.setProperty(layoutTopVariable, `${fitVisibleArea ? Math.max(0, Math.round(visualTop)) : 0}px`);
      root.style.setProperty(keyboardInsetVariable, `${Math.round(keyboardInset)}px`);
    };

    if (lockPageScroll) {
      root.style.overflow = "hidden";
      body.style.overflow = "hidden";
    }
    update();
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      if (lockPageScroll) {
        root.style.overflow = previousRootOverflow;
        body.style.overflow = previousBodyOverflow;
      }
      root.style.removeProperty(layoutHeightVariable);
      root.style.removeProperty(layoutTopVariable);
      root.style.removeProperty(keyboardInsetVariable);
    };
  }, [keyboardInsetVariable, layoutHeightVariable, layoutTopVariable, fitVisualViewport, lockPageScroll]);
}
