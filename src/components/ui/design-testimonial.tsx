"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type TestimonialItem = {
  quote: string;
  author: string;
  role: string;
  company: string;
  image?: string;
};

type TestimonialProps = {
  testimonials?: TestimonialItem[];
  label?: string;
  autoPlayIntervalMs?: number;
  className?: string;
};

const defaultTestimonials: TestimonialItem[] = [
  {
    quote: "Transformed our entire creative process overnight.",
    author: "Sarah Chen",
    role: "Design Director",
    company: "Linear",
  },
  {
    quote: "The most elegant solution we've ever implemented.",
    author: "Marcus Webb",
    role: "Creative Lead",
    company: "Vercel",
  },
  {
    quote: "Pure craftsmanship in every single detail.",
    author: "Elena Frost",
    role: "Head of Product",
    company: "Stripe",
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function Testimonial({
  testimonials = defaultTestimonials,
  label = "Testimonials",
  autoPlayIntervalMs = 6000,
  className,
}: TestimonialProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 200 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  const numberX = useTransform(x, [-200, 200], [-20, 20]);
  const numberY = useTransform(y, [-200, 200], [-10, 10]);

  const safeTestimonials = testimonials.length > 0 ? testimonials : defaultTestimonials;
  const current = safeTestimonials[activeIndex] ?? safeTestimonials[0];
  const quoteWords = current.quote.split(" ");
  const tickerText = useMemo(
    () => safeTestimonials.map((testimonial) => testimonial.company).join(" / "),
    [safeTestimonials],
  );

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(event.clientX - centerX);
    mouseY.set(event.clientY - centerY);
  };

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % safeTestimonials.length);
  }, [safeTestimonials.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + safeTestimonials.length) % safeTestimonials.length);
  }, [safeTestimonials.length]);

  useEffect(() => {
    if (prefersReducedMotion || safeTestimonials.length < 2) return undefined;

    const timer = window.setInterval(goNext, autoPlayIntervalMs);
    return () => window.clearInterval(timer);
  }, [autoPlayIntervalMs, goNext, prefersReducedMotion, safeTestimonials.length]);

  useEffect(() => {
    if (activeIndex < safeTestimonials.length) return;
    setActiveIndex(0);
  }, [activeIndex, safeTestimonials.length]);

  return (
    <div className={cn("relative w-full overflow-hidden bg-transparent text-foreground", className)}>
      <div
        ref={containerRef}
        className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-8 sm:pb-20 lg:px-10 lg:pb-20 lg:pt-8"
        onMouseMove={handleMouseMove}
      >
        <motion.div
          aria-hidden="true"
          className="absolute -left-8 top-[48%] z-0 hidden -translate-y-1/2 select-none text-[22rem] font-bold leading-none text-foreground/[0.055] tracking-normal sm:block lg:-left-14 lg:text-[29rem]"
          style={{ x: numberX, y: numberY }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={activeIndex}
              initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.6, ease: EASE }}
              className="block"
            >
              {String(activeIndex + 1).padStart(2, "0")}
            </motion.span>
          </AnimatePresence>
        </motion.div>

        <div className="relative z-10 flex min-h-[25rem] sm:min-h-[24rem]">
          <div className="flex w-16 shrink-0 flex-col items-center justify-center border-r border-border/80 px-3 sm:w-20 sm:px-5 lg:w-24">
            <motion.span
              className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground sm:text-xs"
              style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.3 }}
            >
              {label}
            </motion.span>

            <div className="relative mt-8 h-28 w-px bg-border/80 sm:h-32">
              <motion.div
                className="absolute left-0 top-0 w-full origin-top bg-foreground"
                animate={{
                  height: `${((activeIndex + 1) / safeTestimonials.length) * 100}%`,
                }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.5, ease: EASE }}
              />
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-center py-8 pl-6 pr-1 sm:pl-14 sm:pr-4 lg:py-10 lg:pl-16 lg:pr-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeIndex}-company`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
                className="mb-7"
              >
                <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-mono text-muted-foreground">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span className="truncate">{current.company}</span>
                </span>
              </motion.div>
            </AnimatePresence>

            <div className="relative mb-8 min-h-[13rem] sm:min-h-[10.5rem] lg:mb-10 lg:min-h-[9rem]">
              <AnimatePresence mode="wait">
                <motion.blockquote
                  key={`${activeIndex}-quote`}
                  className="text-3xl font-light leading-[1.15] text-foreground sm:text-4xl lg:text-5xl"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  aria-live="polite"
                >
                  {quoteWords.map((word, index) => (
                    <motion.span
                      key={`${word}-${index}`}
                      className="mr-[0.3em] inline-block"
                      variants={{
                        hidden: { opacity: 0, y: 20, rotateX: 90 },
                        visible: {
                          opacity: 1,
                          y: 0,
                          rotateX: 0,
                          transition: {
                            duration: prefersReducedMotion ? 0 : 0.5,
                            delay: prefersReducedMotion ? 0 : index * 0.035,
                            ease: EASE,
                          },
                        },
                        exit: {
                          opacity: 0,
                          y: -10,
                          transition: {
                            duration: prefersReducedMotion ? 0 : 0.2,
                            delay: prefersReducedMotion ? 0 : index * 0.015,
                          },
                        },
                      }}
                    >
                      {word}
                      {index < quoteWords.length - 1 ? " " : null}
                    </motion.span>
                  ))}
                </motion.blockquote>
              </AnimatePresence>
            </div>

            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeIndex}-author`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.4, delay: 0.1 }}
                  className="flex min-w-0 items-center gap-4"
                >
                  <motion.div
                    className="hidden h-px w-8 shrink-0 bg-foreground sm:block"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.6, delay: 0.2 }}
                    style={{ originX: 0 }}
                  />
                  {current.image ? (
                    <img
                      src={current.image}
                      alt={current.author}
                      width={48}
                      height={48}
                      className="h-12 w-12 shrink-0 rounded-full border border-border object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-sm font-semibold text-foreground">
                      {getInitials(current.author)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-base font-medium text-foreground">
                      {current.author}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">{current.role}</p>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex shrink-0 items-center gap-3">
                <motion.button
                  type="button"
                  onClick={goPrev}
                  className="group relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-border bg-background"
                  whileTap={{ scale: 0.95 }}
                  aria-label="Show previous testimonial"
                >
                  <span className="absolute inset-0 -translate-x-full bg-foreground transition-transform duration-300 group-hover:translate-x-0" />
                  <ChevronLeft className="relative z-10 h-4 w-4 text-foreground transition-colors group-hover:text-background" />
                </motion.button>

                <motion.button
                  type="button"
                  onClick={goNext}
                  className="group relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-border bg-background"
                  whileTap={{ scale: 0.95 }}
                  aria-label="Show next testimonial"
                >
                  <span className="absolute inset-0 translate-x-full bg-foreground transition-transform duration-300 group-hover:translate-x-0" />
                  <ChevronRight className="relative z-10 h-4 w-4 text-foreground transition-colors group-hover:text-background" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-1 left-1/2 z-0 w-screen -translate-x-1/2 overflow-hidden py-3 opacity-[0.12] [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
          <motion.div
            className="flex whitespace-nowrap text-5xl font-bold leading-[1.16] tracking-normal text-foreground sm:text-6xl"
            animate={prefersReducedMotion ? undefined : { x: [0, -1400] }}
            transition={{ duration: 28, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            {Array.from({ length: 10 }).map((_, index) => (
              <span key={index} className="mx-8">
                {tickerText} /
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
