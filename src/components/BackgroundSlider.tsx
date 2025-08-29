"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type Slide = {
  type: "image" | "video";
  src: string;
  alt?: string;
  title?: string;
  subtitle?: string;
};

export type BackgroundSliderProps = {
  slides: Slide[];
  intervalMs?: number;
  orientation?: "horizontal" | "vertical"; // desktop: horizontal, mobile: vertical
  className?: string;
  overlay?: boolean; // add subtle dark overlay for readability
  paused?: boolean; // pause auto-advance
  // On-mount nudge/peek to hint there is more content
  peekOnMount?: boolean;
  peekOffsetPct?: number; // how far to nudge (percent of width/height)
  peekDelayMs?: number; // delay before the first nudge
  peekDurationMs?: number; // duration of the nudge animation
  peekRepeatCount?: number; // how many times to perform the nudge on mount
  peekDelayBetweenMs?: number; // delay between repeated nudges
  onPeekChange?: (isPeeking: boolean, iteration: number, total: number) => void;
  cancelPeek?: boolean; // if true, cancel any scheduled peeks
  bottomCenterSlot?: ReactNode; // content to reveal under the track at the bottom
  slotBottomClass?: string; // tailwind bottom-* class for bottomCenterSlot positioning
};

/**
 * Full-viewport background slider that supports horizontal (desktop) and
 * vertical (mobile/portrait) sliding. Content can be layered above by
 * wrapping this component in a relatively positioned container.
 */
export default function BackgroundSlider({
  slides,
  intervalMs = 5000,
  orientation = "horizontal",
  className = "",
  overlay = true,
  paused = false,
  peekOnMount = true,
  peekOffsetPct = 5,
  peekDelayMs = 600,
  peekDurationMs = 350,
  peekRepeatCount = 2,
  peekDelayBetweenMs = 250,
  onPeekChange,
  cancelPeek = false,
  bottomCenterSlot,
  slotBottomClass = "bottom-2",
}: BackgroundSliderProps) {
  // Slides are now provided by the caller. No built-in defaults to avoid stale content.

  const [index, setIndex] = useState(0); // can temporarily equal slides.length when showing the cloned first slide
  const [instant, setInstant] = useState(false); // disable transition when snapping back to 0
  const timerRef = useRef<number | undefined>(undefined);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const mountPeekTimeoutsRef = useRef<number[]>([]);
  const [peekPct, setPeekPct] = useState(0);
  const [isPeeking, setIsPeeking] = useState(false);

  // Render slides with the first slide cloned at the end for seamless looping
  const renderSlides = useMemo(() => {
    return slides.length > 0 ? [...slides, slides[0]] : slides;
  }, [slides]);

  useEffect(() => {
    if (paused) {
      if (timerRef.current !== undefined)
        window.clearInterval(timerRef.current);
      timerRef.current = undefined;
      return;
    }
    timerRef.current = window.setInterval(() => {
      setIndex((i) => i + 1);
    }, intervalMs);
    return () => {
      if (timerRef.current !== undefined)
        window.clearInterval(timerRef.current);
    };
  }, [slides.length, intervalMs, paused]);

  // When slides change, reset to start
  useEffect(() => {
    setIndex(0);
  }, [slides.length]);

  // Handle end-of-loop snap without reverse animation
  useEffect(() => {
    if (index === slides.length && trackRef.current) {
      const id = window.setTimeout(() => {
        setInstant(true);
        setIndex(0);
        // allow the DOM to apply transform without transition, then re-enable
        requestAnimationFrame(() => {
          setInstant(false);
        });
      }, 10);
      return () => window.clearTimeout(id);
    }
  }, [index, slides.length]);

  // Cancel any scheduled peeks on demand
  useEffect(() => {
    if (!cancelPeek) return;
    mountPeekTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    mountPeekTimeoutsRef.current = [];
    if (isPeeking) setIsPeeking(false);
    if (peekPct !== 0) setPeekPct(0);
    onPeekChange?.(false, peekRepeatCount - 1, peekRepeatCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cancelPeek]);

  // Mount-time "peek" nudge to hint scrollability / more content (repeats)
  useEffect(() => {
    if (
      !peekOnMount ||
      slides.length <= 1 ||
      peekRepeatCount <= 0 ||
      cancelPeek
    )
      return;
    setIsPeeking(false);
    setPeekPct(0);

    const timeouts: number[] = [];

    const runPeek = (iteration: number) => {
      setIsPeeking(true);
      onPeekChange?.(true, iteration, peekRepeatCount);
      // Nudge upward (towards top) then come back
      setPeekPct(-Math.abs(peekOffsetPct));
      const tBack = window.setTimeout(() => {
        setPeekPct(0);
        const tEnd = window.setTimeout(() => {
          setIsPeeking(false);
          onPeekChange?.(false, iteration, peekRepeatCount);
          if (iteration + 1 < peekRepeatCount && !cancelPeek) {
            const tNext = window.setTimeout(
              () => runPeek(iteration + 1),
              peekDelayBetweenMs
            );
            timeouts.push(tNext);
          }
        }, Math.max(50, Math.min(200, Math.floor(peekDurationMs / 6))));
        timeouts.push(tEnd);
      }, peekDurationMs);
      timeouts.push(tBack);
    };

    const tStart = window.setTimeout(() => runPeek(0), peekDelayMs);
    timeouts.push(tStart);

    mountPeekTimeoutsRef.current = timeouts;
    return () => {
      mountPeekTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
      mountPeekTimeoutsRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      {/* Track (above slot, below overlay) */}
      <div
        className={
          (orientation === "vertical"
            ? "h-full w-full flex flex-col"
            : "h-full w-full flex") + " relative z-[2]"
        }
        style={{
          transform:
            orientation === "vertical"
              ? `translateY(calc(-${index} * 100% + ${peekPct}%))`
              : `translateX(calc(-${index} * 100%)) translateY(${peekPct}%)`,
          transition: instant
            ? "none"
            : isPeeking
            ? `transform ${peekDurationMs}ms cubic-bezier(.25,.8,.25,1)`
            : "transform 700ms cubic-bezier(.25,.8,.25,1)",
        }}
        ref={trackRef}
      >
        {renderSlides.map((s, i) => (
          <div
            key={i}
            className="relative shrink-0 grow-0 basis-full h-full w-full"
          >
            {s.type === "video" ? (
              <video
                className="absolute inset-0 h-full w-full object-cover"
                src={s.src}
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="absolute inset-0 h-full w-full object-cover"
                src={s.src}
                alt={s.alt || "Slide"}
              />
            )}
          </div>
        ))}
      </div>
      {/* Bottom center slot (behind track, under overlay) */}
      {bottomCenterSlot && (
        <div
          className={`absolute inset-x-0 ${slotBottomClass} flex items-center justify-center z-[1] pointer-events-auto`}
        >
          {bottomCenterSlot}
        </div>
      )}
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/25 to-black/35 z-[3] pointer-events-none" />
      )}
      {/* Active slide title/subtitle (top-left) */}
      {((slides[index] && slides[index].title) ||
        (slides[index] && slides[index].subtitle)) && (
        <div className="absolute top-6 left-6 sm:top-10 sm:left-10 z-[4] pointer-events-none max-w-[78vw] sm:max-w-[46rem]">
          {slides[index].title && (
            <div className="text-white font-semibold tracking-tight text-2xl sm:text-4xl leading-tight text-shadow-soft">
              {slides[index].title}
            </div>
          )}
          {slides[index].subtitle && (
            <div className="mt-1 text-white/90 text-sm sm:text-lg leading-snug text-shadow-subtle">
              {slides[index].subtitle}
            </div>
          )}
        </div>
      )}
      {/* Dots */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-6 flex items-center gap-2 z-[4]">
        {slides.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full transition-all ${
              i === index % slides.length ? "bg-white w-6" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
