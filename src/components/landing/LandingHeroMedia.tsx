"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  LANDING_HERO_ROTATE_MS,
  type LandingHeroFrame,
} from "@/lib/landing-hero-galleries";
import HeroImageScrim from "./HeroImageScrim";

export default function LandingHeroMedia({ images }: { images: readonly LandingHeroFrame[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0];

  useEffect(() => {
    setActiveIndex(0);
  }, [images]);

  useEffect(() => {
    if (images.length < 2 || typeof window === "undefined") return;

    const preloadRemaining = () => {
      for (const frame of images.slice(1)) {
        const preloadedImage = new window.Image();
        preloadedImage.decoding = "async";
        preloadedImage.src = frame.src;
      }
    };

    const w = window as typeof window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    if (typeof w.requestIdleCallback === "function") {
      const idleHandle = w.requestIdleCallback(preloadRemaining, { timeout: 2500 });
      return () => w.cancelIdleCallback?.(idleHandle);
    }

    const timeout = window.setTimeout(preloadRemaining, 1200);
    return () => window.clearTimeout(timeout);
  }, [images]);

  useEffect(() => {
    if (images.length < 2 || typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const interval = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % images.length);
    }, LANDING_HERO_ROTATE_MS);

    return () => window.clearInterval(interval);
  }, [images]);

  if (!activeImage) return <HeroImageScrim />;

  return (
    <>
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={activeImage.src}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.005 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="pointer-events-none absolute inset-0 z-0"
        >
          <Image
            src={activeImage.src}
            alt={activeImage.alt}
            fill
            priority={activeIndex === 0}
            sizes="100vw"
            className="object-cover object-center"
            style={{ objectPosition: activeImage.objectPosition ?? "center" }}
          />
        </motion.div>
      </AnimatePresence>
      <HeroImageScrim />
    </>
  );
}
