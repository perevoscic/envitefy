"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface Testimonial {
  text: string;
  highlight?: string;
  image: string;
  name: string;
  role: string;
}

interface TestimonialsCarouselProps {
  testimonials: Testimonial[];
  speed?: number;
  direction?: "left" | "right";
  cardHeight?: number;
  className?: string;
}

export const TestimonialsCarousel: React.FC<TestimonialsCarouselProps> = ({
  testimonials,
  speed = 20,
  direction = "left",
  cardHeight = 200,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const [loopWidth, setLoopWidth] = useState(0);

  useEffect(() => {
    const syncLoopWidth = () => {
      setLoopWidth(setRef.current?.offsetWidth ?? 0);
    };

    syncLoopWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", syncLoopWidth);
      return () => window.removeEventListener("resize", syncLoopWidth);
    }

    const observer = new ResizeObserver(syncLoopWidth);
    if (setRef.current) {
      observer.observe(setRef.current);
    }

    return () => observer.disconnect();
  }, [testimonials]);

  const testimonialSets = [0, 1, 2, 3] as const;

  return (
    <div className={cn("w-full overflow-hidden", className)} ref={containerRef}>
      <motion.div
        animate={{
          x: direction === "left" ? [0, -loopWidth] : [-loopWidth, 0],
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "linear",
        }}
        className="flex w-max"
      >
        {testimonialSets.map((setIndex) => (
          <div
            key={setIndex}
            ref={setIndex === 0 ? setRef : undefined}
            className="flex shrink-0 gap-6 pr-6"
            aria-hidden={setIndex > 0}
          >
            {testimonials.map(({ text, highlight, image, name, role }) => (
              <motion.div
                key={`${setIndex}-${name}-${role}`}
                whileHover={{ scale: 1.05, rotate: 1 }}
                className="my-3 w-[320px] flex-shrink-0 rounded-3xl border-2 border-[#d7c5a5] bg-white p-4 text-[#201a23] shadow-lg"
                style={{ height: cardHeight }}
              >
                <p className="overflow-hidden whitespace-normal break-words text-justify text-sm leading-relaxed text-[#403744]">
                  {highlight
                    ? text.split(highlight).map((part, idx, arr) => (
                        <React.Fragment key={`${name}-${idx}`}>
                          {part}
                          {idx !== arr.length - 1 && (
                            <span className="font-semibold text-blue-600">{highlight}</span>
                          )}
                        </React.Fragment>
                      ))
                    : text}
                </p>

                <div className="mt-4 flex items-center gap-3">
                  <img
                    src={image}
                    alt={name}
                    width={50}
                    height={50}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div className="flex flex-col">
                    <div className="font-medium leading-tight text-[#201a23]">{name}</div>
                    <div className="text-sm text-[#7a7079]">{role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
};
