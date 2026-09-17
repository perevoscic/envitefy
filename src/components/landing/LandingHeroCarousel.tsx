"use client";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import Image from "next/image";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { LANDING_HERO_ROTATE_MS, type LandingHeroFrame } from "@/lib/landing-hero-galleries";
import HeroImageScrim from "./HeroImageScrim";

export default function LandingHeroCarousel({
  images,
  children,
}: {
  images: readonly LandingHeroFrame[];
  children?: (activeIndex: number) => ReactNode;
}) {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState<Set<number>>(() => new Set());
  const [visible, setVisible] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);
  const next = (active + 1) % images.length;
  const previous = (active + images.length - 1) % images.length;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPlaying(!media.matches);
    const motionChanged = () => {
      if (media.matches) setPlaying(false);
    };
    const visibilityChanged = () => setPageVisible(!document.hidden);
    const opened = () => setAuthOpen(true);
    const closed = () => setAuthOpen(false);
    visibilityChanged();
    media.addEventListener("change", motionChanged);
    document.addEventListener("visibilitychange", visibilityChanged);
    window.addEventListener("smd-auth-modal-open", opened);
    window.addEventListener("smd-auth-modal-close", closed);
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
            threshold: 0.1,
          });
    if (sceneRef.current) observer?.observe(sceneRef.current);
    return () => {
      media.removeEventListener("change", motionChanged);
      document.removeEventListener("visibilitychange", visibilityChanged);
      window.removeEventListener("smd-auth-modal-open", opened);
      window.removeEventListener("smd-auth-modal-close", closed);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!playing || !visible || !pageVisible || authOpen || hovered || focused || !ready.has(next))
      return;
    const timer = window.setTimeout(() => setActive(next), LANDING_HERO_ROTATE_MS);
    return () => window.clearTimeout(timer);
  }, [playing, visible, pageVisible, authOpen, hovered, focused, next, ready]);

  const select = (index: number) => {
    setPlaying(false);
    setActive(index);
  };
  const controlClass =
    "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-40";

  return (
    <>
      <div
        ref={sceneRef}
        className="pointer-events-none absolute inset-0 z-0"
        role="region"
        aria-roledescription="carousel"
        aria-label="Football hero photos"
      >
        {images.map((frame, index) => (
          <div
            key={frame.src}
            data-hero-slide={index + 1}
            data-active={index === active}
            aria-hidden={index !== active}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${images.length}`}
            className={`absolute inset-0 transition-opacity duration-1000 motion-reduce:transition-none ${index === active ? "opacity-100" : "opacity-0"}`}
          >
            <Image
              src={frame.src}
              alt={frame.alt}
              fill
              priority={index === 0}
              loading={index === 0 ? undefined : "lazy"}
              sizes="100vw"
              className="object-cover"
              style={{ objectPosition: frame.objectPosition ?? "center" }}
              onLoad={() => setReady((current) => new Set(current).add(index))}
            />
          </div>
        ))}
      </div>
      <HeroImageScrim />
      <div
        className="absolute right-5 top-24 z-20 flex items-center gap-1 rounded-full border border-white/25 bg-black/40 p-1 text-white shadow-lg backdrop-blur-md sm:right-8 lg:right-10"
        role="group"
        aria-label="Hero slideshow controls"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
        }}
      >
        <button
          type="button"
          aria-label="Previous hero photo"
          className={controlClass}
          disabled={!ready.has(previous)}
          onClick={() => select(previous)}
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <span
          className="min-w-10 text-center text-xs font-semibold tabular-nums"
          aria-live={playing ? "off" : "polite"}
        >
          {active + 1} / {images.length}
        </span>
        <button
          type="button"
          aria-label="Next hero photo"
          className={controlClass}
          disabled={!ready.has(next)}
          onClick={() => select(next)}
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={playing ? "Pause hero slideshow" : "Play hero slideshow"}
          className={controlClass}
          onClick={() => setPlaying((current) => !current)}
        >
          {playing ? (
            <Pause className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Play className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {children?.(active)}
    </>
  );
}
