"use client";

import { type ReactNode, useEffect, useRef } from "react";
import styles from "./MarketingMotion.module.css";

type MarketingMotionProps = {
  /** Omit children to enhance the containing MarketingPage without adding a layout wrapper. */
  children?: ReactNode;
  className?: string;
};

type OriginalElementState = {
  progress: string;
  progressPriority: string;
  ready: string | null;
  visible: string | null;
  instant: string | null;
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));

/**
 * Native-scroll enhancement for original marketing compositions.
 *
 * [data-motion-scene] receives --scene-progress and data-motion-ready="true".
 * The default range runs from the scene entering the viewport to leaving it.
 * data-motion-range="contain" instead follows a tall sticky scene from top to bottom.
 * data-motion-range="exit" follows its bottom from the viewport bottom to 30% down.
 * Optional data-motion-target selects a descendant to measure for that exit range.
 * Optional data-motion-exit-start/end override its viewport fractions (defaults 1 and 0.3).
 * data-motion-range="read" runs from its top at 80% of the viewport to its bottom at 45%.
 * [data-motion-reveal] reveals once; optional --motion-index supplies a small stagger.
 * Reduced motion shows everything and uses the static final scene progress of 1.
 */
export default function MarketingMotion({ children, className }: MarketingMotionProps) {
  const anchor = useRef<HTMLDivElement>(null);
  const wrapsContent = children !== undefined && children !== null;

  useEffect(() => {
    const element = anchor.current;
    if (!element) return;
    const container = wrapsContent
      ? element
      : element.closest<HTMLElement>("[data-marketing-page]");
    if (!container) return;
    const root: HTMLElement = container;

    const originalEnhanced = root.getAttribute("data-motion-enhanced");
    const originalScope = root.getAttribute("data-marketing-motion-scope");
    const hadScopeClass = root.classList.contains(styles.scope);
    root.setAttribute("data-marketing-motion-scope", "");
    root.classList.add(styles.scope);

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const originals = new Map<HTMLElement, OriginalElementState>();
    const revealed = new Set<HTMLElement>();
    let scenes: HTMLElement[] = [];
    let reveals: HTMLElement[] = [];
    let observed = new Set<HTMLElement>();
    let disposed = false;
    let frame = 0;
    let needsDiscovery = true;
    let scrollListening = false;

    const remember = (target: HTMLElement) => {
      if (originals.has(target)) return;
      originals.set(target, {
        progress: target.style.getPropertyValue("--scene-progress"),
        progressPriority: target.style.getPropertyPriority("--scene-progress"),
        ready: target.getAttribute("data-motion-ready"),
        visible: target.getAttribute("data-motion-visible"),
        instant: target.getAttribute("data-motion-instant"),
      });
    };
    const belongsHere = (target: HTMLElement) =>
      target.closest("[data-marketing-motion-scope]") === root;

    function schedule() {
      if (disposed || frame || document.hidden) return;
      frame = window.requestAnimationFrame(update);
    }

    const sizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);

    function geometryTarget(target: HTMLElement) {
      if (target.dataset.motionRange !== "exit" || !target.dataset.motionTarget) return target;
      try {
        return target.querySelector<HTMLElement>(target.dataset.motionTarget) ?? target;
      } catch {
        return target;
      }
    }

    function discover() {
      needsDiscovery = false;
      scenes = [...root.querySelectorAll<HTMLElement>("[data-motion-scene]")].filter(belongsHere);
      reveals = [...root.querySelectorAll<HTMLElement>("[data-motion-reveal]")].filter(belongsHere);
      const nextObserved = new Set([root, ...scenes, ...scenes.map(geometryTarget), ...reveals]);
      for (const target of observed) {
        if (!nextObserved.has(target)) sizeObserver?.unobserve(target);
      }
      for (const target of nextObserved) {
        if (!observed.has(target)) sizeObserver?.observe(target);
      }
      observed = nextObserved;
      for (const target of [...scenes, ...reveals]) remember(target);
    }

    function update() {
      frame = 0;
      if (disposed) return;
      if (needsDiscovery) discover();
      const reduced = media.matches;
      const viewport = Math.max(1, window.innerHeight);
      const enhanced = reduced ? "false" : "true";
      if (root.getAttribute("data-motion-enhanced") !== enhanced) {
        root.setAttribute("data-motion-enhanced", enhanced);
      }
      // Enable layout-dependent scene CSS before measuring. This is needed only
      // at setup, preference changes, or discovery; scroll frames do no layout writes here.
      for (const target of scenes) {
        if (reduced) {
          if (target.hasAttribute("data-motion-ready")) target.removeAttribute("data-motion-ready");
        } else if (target.getAttribute("data-motion-ready") !== "true") {
          target.setAttribute("data-motion-ready", "true");
        }
      }
      // Read geometry together before writing progress or reveal styles.
      // A node may be both a scene and a reveal, or supply shared exit geometry.
      // Reuse its measurement within this update without retaining stale scroll bounds.
      const bounds = new Map<HTMLElement, DOMRect>();
      const readBounds = (target: HTMLElement) => {
        let rect = bounds.get(target);
        if (!rect) {
          rect = target.getBoundingClientRect();
          bounds.set(target, rect);
        }
        return rect;
      };
      const sceneUpdates = scenes.map((target) => {
        if (reduced) return { target, progress: 1 };
        const rect = readBounds(geometryTarget(target));
        if (target.dataset.motionRange === "exit") {
          const start = Number(target.dataset.motionExitStart ?? 1);
          const end = Number(target.dataset.motionExitEnd ?? 0.3);
          const validRange = Number.isFinite(start) && Number.isFinite(end) && start > end;
          const startEdge = viewport * (validRange ? start : 1);
          const distance = viewport * (validRange ? start - end : 0.7);
          return { target, progress: clamp((startEdge - rect.bottom) / distance) };
        }
        if (target.dataset.motionRange === "read") {
          return {
            target,
            progress: clamp((viewport * 0.8 - rect.top) / (rect.height + viewport * 0.35)),
          };
        }
        const contained = target.dataset.motionRange === "contain" && rect.height > viewport;
        const progress = contained
          ? -rect.top / (rect.height - viewport)
          : (viewport - rect.top) / (viewport + rect.height);
        return { target, progress: clamp(progress) };
      });
      const revealUpdates = reveals.filter((target) => {
        if (reduced || revealed.has(target)) return true;
        return readBounds(target).top <= viewport * 0.92;
      });
      for (const { target, progress } of sceneUpdates) {
        const value = progress.toFixed(4);
        if (target.style.getPropertyValue("--scene-progress") !== value) {
          target.style.setProperty("--scene-progress", value);
        }
      }
      for (const target of revealUpdates) revealed.add(target);
      for (const target of reveals) {
        const visible = revealed.has(target) ? "true" : "false";
        if (target.getAttribute("data-motion-visible") !== visible) {
          target.setAttribute("data-motion-visible", visible);
        }
      }
    }

    function syncPreference() {
      if (media.matches && scrollListening) {
        window.removeEventListener("scroll", schedule, true);
        scrollListening = false;
      } else if (!media.matches && !scrollListening) {
        window.addEventListener("scroll", schedule, { capture: true, passive: true });
        scrollListening = true;
      }
      schedule();
    }

    function onFocus(event: FocusEvent) {
      if (!(event.target instanceof Element)) return;
      for (const target of reveals) {
        if (!target.contains(event.target)) continue;
        revealed.add(target);
        target.setAttribute("data-motion-instant", "true");
        target.setAttribute("data-motion-visible", "true");
      }
    }

    function onVisibility() {
      if (!document.hidden) schedule();
      else if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
    }

    const mutationObserver = new MutationObserver(() => {
      needsDiscovery = true;
      schedule();
    });
    mutationObserver.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        "data-motion-range",
        "data-motion-target",
        "data-motion-exit-start",
        "data-motion-exit-end",
      ],
    });
    media.addEventListener("change", syncPreference);
    window.addEventListener("resize", schedule, { passive: true });
    window.visualViewport?.addEventListener("resize", schedule, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    root.addEventListener("focusin", onFocus);
    // Show the initial viewport immediately. Only later content receives the reveal transition.
    update();
    syncPreference();
    void document.fonts?.ready.then(() => schedule());

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      mutationObserver.disconnect();
      sizeObserver?.disconnect();
      media.removeEventListener("change", syncPreference);
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", onVisibility);
      root.removeEventListener("focusin", onFocus);
      const restore = (target: HTMLElement, name: string, value: string | null) => {
        if (value === null) target.removeAttribute(name);
        else target.setAttribute(name, value);
      };
      restore(root, "data-motion-enhanced", originalEnhanced);
      restore(root, "data-marketing-motion-scope", originalScope);
      if (!hadScopeClass) root.classList.remove(styles.scope);
      for (const [target, state] of originals) {
        if (state.progress) {
          target.style.setProperty("--scene-progress", state.progress, state.progressPriority);
        } else target.style.removeProperty("--scene-progress");
        restore(target, "data-motion-ready", state.ready);
        restore(target, "data-motion-visible", state.visible);
        restore(target, "data-motion-instant", state.instant);
      }
    };
  }, [wrapsContent]);

  return (
    <div
      ref={anchor}
      className={className}
      hidden={!wrapsContent}
      aria-hidden={!wrapsContent || undefined}
    >
      {children}
    </div>
  );
}
