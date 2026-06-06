"use client";

import {
  AiCloudIcon,
  CheckmarkCircle01Icon,
  CommandFreeIcons,
  DashboardSquare01Icon,
  GlobalSearchIcon,
  MagicWandIcon,
  Pizza04Icon,
  SmartPhone01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { type CSSProperties, useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type FeatureCarouselItem = {
  id: string;
  label: string;
  image: string;
  description: string;
  icon?: IconSvgElement;
  imageAlt?: string;
  badge?: string;
  href?: string;
};

type FeatureCarouselProps = {
  features?: FeatureCarouselItem[];
  className?: string;
  style?: CSSProperties;
  accentColor?: string;
  autoPlayIntervalMs?: number;
};

type FeatureCarouselStyle = CSSProperties & {
  "--feature-carousel-accent": string;
};

const FEATURES: FeatureCarouselItem[] = [
  {
    id: "sustainable",
    label: "Sustainable Sourcing",
    icon: Pizza04Icon,
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1200",
    description: "Ethically sourced ingredients from local farmers.",
  },
  {
    id: "community",
    label: "Community Focused",
    icon: CommandFreeIcons,
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1200",
    description: "Building stronger bonds through shared experiences.",
  },
  {
    id: "global",
    label: "Global Reach",
    icon: GlobalSearchIcon,
    image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=1200",
    description: "Connecting visionaries across all continents.",
  },
  {
    id: "award",
    label: "Award Winning",
    icon: CheckmarkCircle01Icon,
    image: "https://images.unsplash.com/photo-1578574577315-3fbeb0cecdc2?q=80&w=1200",
    description: "Recognized excellence in design and innovation.",
  },
  {
    id: "cloud",
    label: "Cloud Ready",
    icon: AiCloudIcon,
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200",
    description: "Scale your infrastructure with seamless ease.",
  },
  {
    id: "mobile",
    label: "Mobile First",
    icon: SmartPhone01Icon,
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=1200",
    description: "A world-class experience on every single device.",
  },
  {
    id: "analytics",
    label: "Real-time Analytics",
    icon: DashboardSquare01Icon,
    image: "https://images.unsplash.com/photo-1551288049-bbda38a10ad5?q=80&w=1200",
    description: "Insights at your fingertips, updated in real-time.",
  },
  {
    id: "security",
    label: "Enterprise Security",
    icon: CheckmarkCircle01Icon,
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200",
    description: "Bank-grade security protocols for your data.",
  },
  {
    id: "magic",
    label: "Magic Automations",
    icon: MagicWandIcon,
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1200",
    description: "Let AI handle the repetitive tasks for you.",
  },
  {
    id: "local",
    label: "Locally Owned",
    icon: CheckmarkCircle01Icon,
    image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=1200",
    description: "Supporting local businesses and creators.",
  },
];

const AUTO_PLAY_INTERVAL = 3000;
const ITEM_HEIGHT = 65;

const wrap = (min: number, max: number, v: number) => {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

export function FeatureCarousel({
  features = FEATURES,
  className,
  style,
  accentColor = "#62B2FE",
  autoPlayIntervalMs = AUTO_PLAY_INTERVAL,
}: FeatureCarouselProps) {
  const [step, setStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const featureCount = features.length;
  const currentIndex = featureCount > 0 ? ((step % featureCount) + featureCount) % featureCount : 0;

  const nextStep = useCallback(() => {
    setStep((prev) => prev + 1);
  }, []);

  const handleChipClick = (index: number) => {
    if (featureCount === 0) return;
    const forwardDiff = (index - currentIndex + featureCount) % featureCount;
    const backwardDiff = forwardDiff - featureCount;
    const diff = Math.abs(forwardDiff) <= Math.abs(backwardDiff) ? forwardDiff : backwardDiff;
    if (diff !== 0) setStep((s) => s + diff);
  };

  useEffect(() => {
    if (isPaused || autoPlayIntervalMs <= 0 || featureCount === 0) return;
    const interval = setInterval(nextStep, autoPlayIntervalMs);
    return () => clearInterval(interval);
  }, [nextStep, isPaused, autoPlayIntervalMs, featureCount]);

  const getCardStatus = (index: number) => {
    if (featureCount === 0) return "hidden";
    const diff = index - currentIndex;
    const len = featureCount;

    let normalizedDiff = diff;
    if (diff > len / 2) normalizedDiff -= len;
    if (diff < -len / 2) normalizedDiff += len;

    if (normalizedDiff === 0) return "active";
    if (normalizedDiff === -1) return "prev";
    if (normalizedDiff === 1) return "next";
    return "hidden";
  };

  if (featureCount === 0) return null;

  return (
    <div
      className={cn("mx-auto w-full max-w-[112rem] md:p-6", className)}
      data-feature-carousel="true"
      style={{ ...style, "--feature-carousel-accent": accentColor } as FeatureCarouselStyle}
    >
      <div className="relative flex min-h-[600px] flex-col overflow-hidden rounded-[2rem] border border-border/40 lg:aspect-[2.24/1] lg:min-h-0 lg:flex-row lg:rounded-[3rem] xl:aspect-[2.4/1]">
        <div className="relative z-30 flex min-h-[270px] w-full flex-col items-center justify-center overflow-hidden bg-[var(--feature-carousel-accent)] px-6 sm:min-h-[330px] md:min-h-[450px] md:px-12 lg:h-full lg:w-[32%] lg:px-10">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 z-40 h-12 md:h-20 lg:h-16"
            style={{
              background:
                "linear-gradient(to bottom, var(--feature-carousel-accent), color-mix(in oklab, var(--feature-carousel-accent) 80%, transparent), transparent)",
            }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 z-40 h-12 md:h-20 lg:h-16"
            style={{
              background:
                "linear-gradient(to top, var(--feature-carousel-accent), color-mix(in oklab, var(--feature-carousel-accent) 80%, transparent), transparent)",
            }}
          />
          <div className="relative z-20 flex h-full w-full items-center justify-center">
            {features.map((feature, index) => {
              const isActive = index === currentIndex;
              const distance = index - currentIndex;
              const wrappedDistance = wrap(-(features.length / 2), features.length / 2, distance);

              return (
                <motion.div
                  key={feature.id}
                  style={{
                    height: ITEM_HEIGHT,
                    width: "fit-content",
                  }}
                  animate={{
                    y: wrappedDistance * ITEM_HEIGHT,
                    opacity: Math.max(0, 1 - Math.abs(wrappedDistance) * 0.25),
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 90,
                    damping: 22,
                    mass: 1,
                  }}
                  className="absolute flex items-center justify-start"
                >
                  <button
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => handleChipClick(index)}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                    className={cn(
                      "group relative flex max-w-[min(15rem,calc(100vw-5rem))] items-center gap-2 rounded-full border px-4 py-2.5 text-left transition-all duration-700 md:max-w-none md:gap-4 md:px-10 md:py-5 lg:px-8 lg:py-4",
                      isActive
                        ? "z-10 border-white bg-white"
                        : "border-white/20 bg-transparent text-white/60 hover:border-white/40 hover:text-white",
                    )}
                    style={isActive ? { color: accentColor } : undefined}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center transition-colors duration-500",
                        isActive ? "" : "text-white/40",
                      )}
                      style={isActive ? { color: accentColor } : undefined}
                    >
                      <HugeiconsIcon
                        icon={feature.icon ?? CheckmarkCircle01Icon}
                        size={18}
                        strokeWidth={2}
                      />
                    </div>

                    <span className="whitespace-nowrap text-[11px] font-normal uppercase tracking-normal md:text-[15px]">
                      {feature.label}
                    </span>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="relative flex min-h-[520px] flex-1 items-center justify-center overflow-hidden border-t border-border/20 bg-secondary/30 px-4 py-8 md:min-h-[600px] md:px-12 md:py-24 lg:h-full lg:border-l lg:border-t-0 lg:px-14 lg:py-14">
          <div className="relative flex aspect-[4/5] w-full max-w-[23rem] items-center justify-center md:aspect-[5/4] md:max-w-[680px]">
            {features.map((feature, index) => {
              const status = getCardStatus(index);
              const isActive = status === "active";
              const isPrev = status === "prev";
              const isNext = status === "next";

              return (
                <motion.div
                  key={feature.id}
                  initial={false}
                  animate={{
                    x: isActive ? 0 : isPrev ? -100 : isNext ? 100 : 0,
                    scale: isActive ? 1 : isPrev || isNext ? 0.85 : 0.7,
                    opacity: isActive ? 1 : isPrev || isNext ? 0.4 : 0,
                    rotate: isPrev ? -3 : isNext ? 3 : 0,
                    zIndex: isActive ? 20 : isPrev || isNext ? 10 : 0,
                    pointerEvents: isActive ? "auto" : "none",
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 25,
                    mass: 0.8,
                  }}
                  className="absolute inset-0 origin-center overflow-hidden rounded-[1.75rem] border-4 border-background bg-background md:rounded-[2.4rem] md:border-8"
                >
                  <img
                    src={feature.image}
                    alt={feature.imageAlt ?? feature.label}
                    className={cn(
                      "h-full w-full object-cover transition-all duration-700",
                      isActive ? "grayscale-0 blur-0" : "grayscale blur-[2px] brightness-75",
                    )}
                  />

                  {feature.href ? (
                    <Link
                      href={feature.href}
                      aria-label={`Open ${feature.label}`}
                      className="absolute inset-0 z-30"
                    >
                      <span className="sr-only">Open {feature.label}</span>
                    </Link>
                  ) : null}

                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5 pt-24 sm:p-10 sm:pt-32"
                      >
                        <div className="mb-2 w-fit rounded-full border border-border/50 bg-background px-3 py-1 text-[9px] font-normal uppercase tracking-[0.16em] text-foreground shadow-lg sm:mb-3 sm:px-4 sm:py-1.5 sm:text-[11px] sm:tracking-[0.2em]">
                          {index + 1} - {feature.badge ?? feature.label}
                        </div>
                        <p className="text-base font-normal leading-snug tracking-normal text-white drop-shadow-md sm:text-xl md:text-2xl">
                          {feature.description}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeatureCarousel;
