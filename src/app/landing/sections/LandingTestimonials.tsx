"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  type CSSProperties,
  Fragment,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { landingCategoryCards, landingTestimonials } from "../landing-data";
import styles from "./LandingTestimonials.module.css";

const ROTATION_DELAY = 6000;
const occasionRibbon = `${landingCategoryCards.map(({ label }) => label).join(" · ")} ·`;

export default function LandingTestimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const compositionRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardOffsetsRef = useRef<number[]>([]);
  const activeIndexRef = useRef(0);
  const requestedIndexRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [requestedIndex, setRequestedIndex] = useState<number | null>(null);
  const [motionReady, setMotionReady] = useState(false);
  const [focused, setFocused] = useState(false);
  const autoplayRunning = motionReady && !focused;
  const navigationIndex = requestedIndex ?? activeIndex;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = !("IntersectionObserver" in window);
    const update = () => {
      setMotionReady(visible && !reducedMotion.matches && document.visibilityState === "visible");
    };
    const observer =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            ([entry]) => {
              visible = Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.2);
              update();
            },
            { threshold: 0.2 },
          )
        : null;
    observer?.observe(trackRef.current ?? section);
    reducedMotion.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      observer?.disconnect();
      reducedMotion.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  useEffect(() => {
    const composition = compositionRef.current;
    const number = numberRef.current;
    if (!motionReady || !composition || !number) return;
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    function reset() {
      cancelAnimationFrame(frame);
      frame = 0;
      number?.style.removeProperty("--feedback-number-x");
      number?.style.removeProperty("--feedback-number-y");
    }
    function move(event: PointerEvent) {
      if (
        event.pointerType !== "mouse" ||
        !window.matchMedia("(hover: hover) and (pointer: fine)").matches
      )
        return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!composition || !number) return;
        const rect = composition.getBoundingClientRect();
        const x = Math.max(-20, Math.min(20, (pointerX - rect.left - rect.width / 2) / 10));
        const y = Math.max(-10, Math.min(10, (pointerY - rect.top - rect.height / 2) / 20));
        number.style.setProperty("--feedback-number-x", `${x}px`);
        number.style.setProperty("--feedback-number-y", `${y}px`);
      });
    }
    composition.addEventListener("pointermove", move, { passive: true });
    composition.addEventListener("pointerleave", reset);
    composition.addEventListener("pointercancel", reset);
    window.addEventListener("blur", reset);
    return () => {
      reset();
      composition.removeEventListener("pointermove", move);
      composition.removeEventListener("pointerleave", reset);
      composition.removeEventListener("pointercancel", reset);
      window.removeEventListener("blur", reset);
    };
  }, [motionReady]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    let previousWidth = track.clientWidth;
    let disposed = false;
    const cards = [...track.querySelectorAll<HTMLElement>("[data-feedback-card]")];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    function measureCards() {
      if (!track || disposed) return;
      const origin = track.getBoundingClientRect().left;
      const scroll = track.scrollLeft;
      // Card positions stay fixed within this native scroller. Refresh on layout
      // changes, rather than reading all 24 rectangles during every scroll frame.
      cardOffsetsRef.current = cards.map((card) => scroll + card.getBoundingClientRect().left - origin);
    }
    function clearRequest() {
      requestedIndexRef.current = null;
      setRequestedIndex(null);
    }
    function update() {
      frame = 0;
      if (!track) return;
      const offsets = cardOffsetsRef.current;
      if (!offsets.length) return;
      const scroll = track.scrollLeft;
      const index = offsets.reduce(
        (closest, offset, index) =>
          Math.abs(offset - scroll) < Math.abs(offsets[closest] - scroll)
            ? index
            : closest,
        0,
      );
      activeIndexRef.current = index;
      setActiveIndex(index);
      const requested = requestedIndexRef.current;
      if (
        requested !== null &&
        Math.abs(offsets[requested] - scroll) < 1.5
      ) {
        clearRequest();
      }
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    function alignCurrent() {
      if (!track) return;
      const index = requestedIndexRef.current ?? activeIndexRef.current;
      const left = cardOffsetsRef.current[index];
      if (left === undefined) return;
      track.scrollTo({
        left,
        behavior: "instant",
      });
      clearRequest();
      schedule();
    }
    function resize() {
      measureCards();
      if (track && Math.abs(track.clientWidth - previousWidth) > 1) {
        previousWidth = track.clientWidth;
        alignCurrent();
      } else {
        schedule();
      }
    }
    function motionChanged() {
      if (reducedMotion.matches) alignCurrent();
    }
    function settled() {
      // A finishing native wheel snap can supersede a newer smooth button move.
      // Honor that latest destination unless a new gesture has taken over.
      if (requestedIndexRef.current !== null) alignCurrent();
      else schedule();
    }
    // A native swipe/wheel takes over from a pending button destination.
    track.addEventListener("pointerdown", clearRequest, { passive: true });
    track.addEventListener("wheel", clearRequest, { passive: true });
    track.addEventListener("scroll", schedule, { passive: true });
    track.addEventListener("scrollend", settled);
    window.addEventListener("resize", resize, { passive: true });
    reducedMotion.addEventListener("change", motionChanged);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    observer?.observe(track);
    measureCards();
    update();
    void document.fonts?.ready.then(() => {
      if (!disposed) resize();
    });
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      track.removeEventListener("pointerdown", clearRequest);
      track.removeEventListener("wheel", clearRequest);
      track.removeEventListener("scroll", schedule);
      track.removeEventListener("scrollend", settled);
      window.removeEventListener("resize", resize);
      reducedMotion.removeEventListener("change", motionChanged);
    };
  }, []);

  const goTo = useCallback((index: number, instant = false) => {
    const track = trackRef.current;
    const target = Math.max(0, Math.min(index, landingTestimonials.length - 1));
    const card = track?.querySelectorAll<HTMLElement>("[data-feedback-card]")[target];
    if (!track || !card) return;
    requestedIndexRef.current = target;
    setRequestedIndex(target);
    track.scrollTo({
      left:
        cardOffsetsRef.current[target] ??
        track.scrollLeft + card.getBoundingClientRect().left - track.getBoundingClientRect().left,
      behavior:
        instant || window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
    });
  }, []);

  useEffect(() => {
    if (!autoplayRunning || requestedIndex !== null) return;
    const timer = window.setTimeout(() => {
      // Check preferences at delivery too, including a tab hidden just before this tick.
      if (
        document.visibilityState !== "visible" ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        return;
      const next = (activeIndexRef.current + 1) % landingTestimonials.length;
      // Restart at the first quote without sweeping back through the entire collection.
      goTo(next, next === 0);
    }, ROTATION_DELAY);
    return () => window.clearTimeout(timer);
  }, [autoplayRunning, activeIndex, requestedIndex, goTo]);

  const move = (direction: number) =>
    goTo((requestedIndexRef.current ?? activeIndexRef.current) + direction);
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    const next =
      event.key === "ArrowRight"
        ? (requestedIndexRef.current ?? activeIndexRef.current) + 1
        : event.key === "ArrowLeft"
          ? (requestedIndexRef.current ?? activeIndexRef.current) - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? landingTestimonials.length - 1
              : null;
    if (next === null) return;
    event.preventDefault();
    goTo(next);
  };

  return (
    <section
      id="testimonials"
      ref={sectionRef}
      className={styles.section}
      data-landing-testimonials
      data-feedback-motion={motionReady ? "true" : "false"}
      data-feedback-autoplay={autoplayRunning ? "true" : "false"}
      aria-labelledby="testimonials-heading"
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <h2 id="testimonials-heading" className={styles.accessibleHeading}>
        Guest and host feedback
      </h2>
      <div ref={compositionRef} className={styles.composition}>
        <span className={styles.number} data-feedback-number aria-hidden="true">
          <span ref={numberRef} className={styles.numberDrift} data-feedback-parallax>
            <span key={activeIndex} className={styles.numberInk}>
              {String(activeIndex + 1).padStart(2, "0")}
            </span>
          </span>
        </span>
        <div className={styles.rail} aria-hidden="true">
          <span className={styles.label}>Guest &amp; host feedback</span>
          <span className={styles.progress}>
            <span
              style={{ transform: `scaleY(${(activeIndex + 1) / landingTestimonials.length})` }}
            />
          </span>
        </div>
        <div className={styles.body}>
          <div
            ref={trackRef}
            className={styles.track}
            data-feedback-track
            role="region"
            aria-label="Guest and host feedback"
            // biome-ignore lint/a11y/noNoninteractiveTabindex: This scroll region needs focus for keyboard scrolling.
            tabIndex={0}
            onKeyDown={handleKeyDown}
          >
            {landingTestimonials.map(({ quote, author, role, company }, cardIndex) => (
              <figure
                key={`${author}-${role}`}
                className={styles.quote}
                data-feedback-card
                data-feedback-active={activeIndex === cardIndex ? "true" : "false"}
              >
                <p className={styles.occasion}>
                  <span aria-hidden="true" />
                  {company}
                </p>
                <blockquote>
                  <p>
                    <span className={styles.accessibleQuote}>{quote}</span>
                    <span aria-hidden="true">
                      {activeIndex === cardIndex ? quote.split(" ").map((word, index, words) => (
                        <Fragment key={`${word}-${index}`}>
                          <span
                            className={styles.word}
                            style={{ "--word-index": Math.min(index, 18) } as CSSProperties}
                          >
                            {word}
                          </span>
                          {index < words.length - 1 ? " " : null}
                        </Fragment>
                      )) : quote}
                    </span>
                  </p>
                </blockquote>
                <figcaption>
                  <span className={styles.authorLine} aria-hidden="true" />
                  <div>
                    <p className={styles.author}>{author}</p>
                    <p className={styles.role}>{role}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className={styles.controls}>
            <p
              className={styles.position}
              data-feedback-position
              aria-live={autoplayRunning ? "off" : "polite"}
              aria-atomic="true"
            >
              {String(activeIndex + 1).padStart(2, "0")} <span>/ {landingTestimonials.length}</span>
            </p>
            <button
              type="button"
              aria-label="Previous feedback"
              disabled={navigationIndex === 0}
              onClick={() => move(-1)}
            >
              <ArrowLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Next feedback"
              disabled={navigationIndex === landingTestimonials.length - 1}
              onClick={() => move(1)}
            >
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
      <div className={styles.ribbon} data-feedback-ribbon aria-hidden="true">
        <div className={styles.ribbonTrack} data-feedback-ribbon-track>
          <span className={styles.ribbonGroup}>{occasionRibbon}</span>
          <span className={styles.ribbonGroup}>{occasionRibbon}</span>
        </div>
      </div>
    </section>
  );
}
