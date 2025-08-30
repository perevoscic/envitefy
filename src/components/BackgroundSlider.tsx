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
  // Use a repeated track so we never visibly jump; keep index in the center set
  const REPEAT_SETS = 3; // must be odd
  const middleStart = slides.length; // start index of the middle set
  const middleEndExclusive = slides.length * 2; // end (exclusive) of the middle set

  const [index, setIndex] = useState(() => middleStart);
  const [instant, setInstant] = useState(false); // disable transition when snapping
  const timerRef = useRef<number | undefined>(undefined);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const mountPeekTimeoutsRef = useRef<number[]>([]);
  const [peekPct, setPeekPct] = useState(0);
  const [isPeeking, setIsPeeking] = useState(false);
  const wrapLockRef = useRef(false); // prevent advancing while wrapping
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());

  // ---- NEW: live refs to avoid stale closures in transitionend handler
  const indexRef = useRef(index);
  const instantRef = useRef(instant);
  const peekingRef = useRef(isPeeking);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    instantRef.current = instant;
  }, [instant]);

  useEffect(() => {
    peekingRef.current = isPeeking;
  }, [isPeeking]);
  // --------------------------------------------------------------------

  // Render a repeated track to allow continuous scrolling without a visible reset
  const renderSlides = useMemo(() => {
    if (slides.length === 0) return slides;
    const repeated: Slide[] = [];
    for (let r = 0; r < REPEAT_SETS; r++) {
      repeated.push(...slides);
    }
    return repeated;
  }, [slides]);

  // Auto-advance
  useEffect(() => {
    if (paused || slides.length <= 1) {
      if (timerRef.current !== undefined)
        window.clearInterval(timerRef.current);
      timerRef.current = undefined;
      return;
    }
    timerRef.current = window.setInterval(() => {
      if (wrapLockRef.current) return;
      setIndex((i) => {
        const next = i + 1;
        if (next >= middleEndExclusive) {
          // Lock until the transition finishes; snap will happen in transitionend
          wrapLockRef.current = true;
        }
        return next;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current !== undefined)
        window.clearInterval(timerRef.current);
    };
  }, [slides.length, intervalMs, paused, middleEndExclusive]);

  // When slides change, re-center to the middle set
  useEffect(() => {
    setIndex(middleStart);
  }, [slides.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep index inside the middle set (snap instantly between identical slides)
  useEffect(() => {
    if (!trackRef.current || slides.length <= 1) return;
    const trackEl = trackRef.current;

    const onEnd = (e: TransitionEvent) => {
      // Only react to transform transitions on the track itself
      if (e.propertyName !== "transform" || e.target !== trackEl) return;

      // Ignore programmatic jumps or peek nudges
      if (instantRef.current || peekingRef.current) return;

      const i = indexRef.current;

      if (i >= middleEndExclusive) {
        // Sync video time between source (i) and target (i - slides.length)
        const sourceVid = videoRefs.current.get(i);
        const targetIdx = i - slides.length;
        const targetVid = videoRefs.current.get(targetIdx);
        if (sourceVid && targetVid) {
          const applyTime = () => {
            try {
              targetVid.currentTime = sourceVid.currentTime;
            } catch {}
            if (!sourceVid.paused) targetVid.play().catch(() => {});
          };
          if (targetVid.readyState < 1) {
            const onMeta = () => {
              targetVid.removeEventListener("loadedmetadata", onMeta);
              applyTime();
            };
            targetVid.addEventListener("loadedmetadata", onMeta);
          } else {
            applyTime();
          }
        }
        setInstant(true);
        setIndex(i - slides.length);
        // ensure the snap happens with no transition, then re-enable
        requestAnimationFrame(() => {
          setInstant(false);
          wrapLockRef.current = false;
        });
      } else if (i < middleStart) {
        // Sync video time between source (i) and target (i + slides.length)
        const sourceVid = videoRefs.current.get(i);
        const targetIdx = i + slides.length;
        const targetVid = videoRefs.current.get(targetIdx);
        if (sourceVid && targetVid) {
          const applyTime = () => {
            try {
              targetVid.currentTime = sourceVid.currentTime;
            } catch {}
            if (!sourceVid.paused) targetVid.play().catch(() => {});
          };
          if (targetVid.readyState < 1) {
            const onMeta = () => {
              targetVid.removeEventListener("loadedmetadata", onMeta);
              applyTime();
            };
            targetVid.addEventListener("loadedmetadata", onMeta);
          } else {
            applyTime();
          }
        }
        setInstant(true);
        setIndex(i + slides.length);
        requestAnimationFrame(() => {
          setInstant(false);
          wrapLockRef.current = false;
        });
      }
    };

    trackEl.addEventListener("transitionend", onEnd);
    return () => {
      trackEl.removeEventListener("transitionend", onEnd);
    };
  }, [slides.length, middleEndExclusive, middleStart]);

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
      // Nudge toward start then come back
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
              ? `translate3d(0, calc(-${index} * 100% + ${peekPct}%), 0)`
              : `translate3d(calc(-${index} * 100%), ${peekPct}%, 0)`,
          transition: instant
            ? "none"
            : isPeeking
            ? `transform ${peekDurationMs}ms cubic-bezier(.25,.8,.25,1)`
            : "transform 700ms cubic-bezier(.25,.8,.25,1)",
          willChange: "transform",
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
                preload="auto"
                ref={(el) => {
                  if (el) videoRefs.current.set(i, el);
                  else videoRefs.current.delete(i);
                }}
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
      {(() => {
        const visible = slides.length
          ? slides[((index % slides.length) + slides.length) % slides.length]
          : undefined;
        return visible && (visible.title || visible.subtitle);
      })() && (
        <div className="absolute top-6 left-6 sm:top-10 sm:left-10 z-[4] pointer-events-none max-w-[78vw] sm:max-w-[46rem]">
          {slides[((index % slides.length) + slides.length) % slides.length]
            .title && (
            <div className="text-white font-semibold tracking-tight text-3xl sm:text-5xl leading-tight text-shadow-soft">
              {
                slides[
                  ((index % slides.length) + slides.length) % slides.length
                ].title
              }
            </div>
          )}
          {slides[((index % slides.length) + slides.length) % slides.length]
            .subtitle && (
            <div className="mt-2 text-white/90 text-base sm:text-xl leading-snug text-shadow-subtle">
              {
                slides[
                  ((index % slides.length) + slides.length) % slides.length
                ].subtitle
              }
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
              i === ((index % slides.length) + slides.length) % slides.length
                ? "bg-white w-6"
                : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
