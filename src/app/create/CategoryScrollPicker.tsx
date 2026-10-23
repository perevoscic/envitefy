"use client";

import { ArrowDown, ArrowUpRight } from "lucide-react";
import { type CSSProperties, type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CreateGuess } from "@/lib/create/create-intent";
import { eventTypeChoiceKey, eventTypeChoiceLabel } from "@/lib/create/event-type-groups";
import { categoryTitlePalette } from "./category-title-palettes";
import { useCategoryScrollHandoff } from "./useCategoryScrollHandoff";
import styles from "./category-scroll-picker.module.css";

export default function CategoryScrollPicker({ choices, onSelect, query, introPlayed }: {
  choices: CreateGuess[];
  onSelect: (choice: CreateGuess) => void;
  query: string;
  introPlayed: RefObject<boolean>;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const choiceKeys = choices.map(eventTypeChoiceKey).join(",");
  useCategoryScrollHandoff(scroller, choiceKeys);

  const trackSelection = useCallback(() => {
    const viewport = scroller.current;
    if (!viewport || !list.current) return;
    // Follow the first full row on mobile and the centered row on desktop.
    const anchor = viewport.scrollTop + parseFloat(getComputedStyle(viewport).scrollPaddingTop);
    let closest = 0;
    let distance = Number.POSITIVE_INFINITY;
    Array.from(list.current.children).forEach((row, index) => {
      const item = row as HTMLElement;
      const delta = Math.abs(item.offsetTop - anchor);
      if (delta < distance) {
        closest = index;
        distance = delta;
      }
    });
    setActive(closest);
  }, []);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = 0;
    setActive(0);
  }, [choiceKeys, query]);

  useLayoutEffect(() => {
    const viewport = scroller.current;
    const items = list.current;
    if (!viewport || !items) return;
    let disposed = false;
    let frame = 0;
    const fitLabels = () => {
      const buttons = Array.from(items.querySelectorAll<HTMLButtonElement>("[data-creation-event-type]"));
      // Always measure from the authored size so widening can restore it.
      for (const button of buttons) button.style.removeProperty("--category-fit-size");
      const fits = buttons.map(button => {
        const label = button.firstElementChild as HTMLElement;
        if (getComputedStyle(label).whiteSpace !== "nowrap") return null;
        const available = label.getBoundingClientRect().width;
        const range = document.createRange();
        range.selectNodeContents(label);
        const natural = range.getBoundingClientRect().width;
        if (available <= 0 || natural <= available) return null;
        return { button, size: parseFloat(getComputedStyle(button).fontSize) * (available - 1) / natural };
      });
      for (const fit of fits) {
        if (fit) fit.button.style.setProperty("--category-fit-size", `${fit.size}px`);
      }
    };
    const scheduleFit = () => {
      if (disposed) return;
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(fitLabels);
    };
    fitLabels();
    const observer = new ResizeObserver(scheduleFit);
    observer.observe(viewport);
    void document.fonts.ready.then(scheduleFit);
    document.fonts.addEventListener("loadingdone", scheduleFit);
    return () => {
      disposed = true;
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      document.fonts.removeEventListener("loadingdone", scheduleFit);
    };
  }, [choiceKeys]);

  useEffect(() => {
    const viewport = scroller.current;
    if (!viewport) return;
    const observer = new ResizeObserver(trackSelection);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [trackSelection]);

  useEffect(() => {
    const viewport = scroller.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!viewport || !list.current || choices.length < 2 || query.trim() || introPlayed.current || motion.matches) return;

    let cancelled = false;
    let timer = 0;
    let frame = 0;
    let sizeObserver: ResizeObserver | undefined;
    const listeners = new AbortController();
    const stop = () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
      viewport.removeAttribute("data-intro-scroll");
      sizeObserver?.disconnect();
      listeners.abort();
    };
    const interrupt = () => {
      introPlayed.current = true;
      stop();
    };
    const initialWidth = viewport.clientWidth, initialHeight = viewport.clientHeight;
    sizeObserver = new ResizeObserver(() => {
      if (viewport.clientWidth !== initialWidth || viewport.clientHeight !== initialHeight) interrupt();
    });
    sizeObserver.observe(viewport);
    const options = { capture: true, passive: true, signal: listeners.signal };
    for (const event of ["pointerdown", "touchstart", "wheel", "keydown", "focusin"]) {
      document.addEventListener(event, interrupt, options);
    }
    window.addEventListener("resize", interrupt, { signal: listeners.signal });
    motion.addEventListener("change", interrupt, { signal: listeners.signal });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) interrupt();
    }, { signal: listeners.signal });

    void document.fonts.ready.then(() => {
      if (cancelled) return;
      timer = window.setTimeout(() => {
        if (cancelled) return;
        if (document.hidden || viewport.contains(document.activeElement)) {
          interrupt();
          return;
        }
        const end = viewport.scrollHeight - viewport.clientHeight;
        if (end <= 1) return;
        // Consume only when motion begins so StrictMode can safely retry setup.
        introPlayed.current = true;
        viewport.setAttribute("data-intro-scroll", "true");
        const outward = 800, hold = 180, returning = 650;
        const ease = (progress: number) => progress * progress * (3 - 2 * progress);
        let started: number | undefined;
        const animate = (now: number) => {
          if (cancelled) return;
          started ??= now;
          const elapsed = now - started;
          if (elapsed < outward) {
            viewport.scrollTop = end * ease(elapsed / outward);
          } else if (elapsed < outward + hold) {
            viewport.scrollTop = end;
          } else if (elapsed < outward + hold + returning) {
            viewport.scrollTop = end * (1 - ease((elapsed - outward - hold) / returning));
          } else {
            viewport.scrollTop = 0;
            trackSelection();
            stop();
            return;
          }
          frame = window.requestAnimationFrame(animate);
        };
        frame = window.requestAnimationFrame(animate);
      }, 200);
    });
    return stop;
  }, [choiceKeys, choices.length, introPlayed, query, trackSelection]);

  return (
    <div className={styles.picker} data-category-scroll-picker>
      <h2 className={styles.lead}>A page for</h2>
      <div
        ref={scroller}
        role="region"
        aria-label="Event categories"
        aria-describedby="category-scroll-hint"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: The scroll region needs focus for keyboard scrolling.
        tabIndex={0}
        className={styles.scroller}
        data-category-scroller
        onScroll={trackSelection}
      >
        <ul ref={list} className={styles.list} data-category-list>
          {choices.map((choice, index) => {
            const palette = categoryTitlePalette(choice);
            return (
              <li key={eventTypeChoiceKey(choice)} className={styles.row}>
                <button
                  type="button"
                  className={styles.category}
                  style={{
                    "--category-color-light": palette.light[0],
                    "--category-color-end-light": palette.light[1],
                    "--category-color-dark": palette.dark[0],
                    "--category-color-end-dark": palette.dark[1],
                  } as CSSProperties}
                  data-category-palette={palette.name}
                  data-active={index === active}
                  data-creation-event-type
                  data-long-label={eventTypeChoiceLabel(choice).length >= 23}
                  data-holiday-occasion={choice.category === "holidays-seasonal" ? choice.occasion : undefined}
                  aria-label={eventTypeChoiceLabel(choice)}
                  onClick={() => onSelect(choice)}
                  onFocus={(event) => {
                    // Keyboard users see the whole focused category, including
                    // when tabbing to a row outside the scroll viewport.
                    if (event.target.matches(":focus-visible")) {
                      event.target.scrollIntoView({ block: "start", inline: "nearest" });
                    }
                  }}
                >
                  <span>{eventTypeChoiceLabel(choice)}<span aria-hidden="true">.</span></span>
                  <ArrowUpRight className={styles.arrow} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <p id="category-scroll-hint" className={styles.hint}>
        <ArrowDown size={14} aria-hidden="true" />
        Scroll to explore. Choose one to begin.
      </p>
    </div>
  );
}
