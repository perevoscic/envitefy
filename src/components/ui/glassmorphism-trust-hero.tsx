"use client";

import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Crown,
  Gift,
  MapPinned,
  Play,
  ScanText,
  Sparkles,
  Star,
  Target,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import AnimatedButtonLabel from "@/components/ui/AnimatedButtonLabel";

const TOTAL_BUILDERS = 19_423;
const PARENT_BUILDERS = 12_160;
const TEACHER_BUILDERS = 3_410;
const HOST_BUILDERS = 3_853;
const LIVE_CARDS = 8_008;
const FLYERS = 4_886;
const LIVE_CARD_AND_FLYER_TOTAL = LIVE_CARDS + FLYERS;
const EVENT_PAGES = 3_754;
const GUEST_OPENS = 30_602;
const REGISTRY_LINKS = 2_104;

const SURFACES = [
  { value: TOTAL_BUILDERS, label: "events", icon: CalendarDays },
  { value: LIVE_CARDS, label: "live cards", icon: Sparkles },
  { value: FLYERS, label: "flyers", icon: ScanText },
  { value: GUEST_OPENS, label: "guest opens", icon: UsersRound },
  { value: EVENT_PAGES, label: "event pages", icon: MapPinned },
  { value: REGISTRY_LINKS, label: "registries", icon: Gift },
];

const HERO_STATS = [
  { value: TOTAL_BUILDERS, label: "Parents, teachers & hosts" },
  { value: LIVE_CARD_AND_FLYER_TOTAL, label: "Live cards + flyers" },
  { value: EVENT_PAGES, label: "Event pages launched" },
];

const animationStyle = `
  @keyframes envitefy-hero-fade-slide {
    from { opacity: 0; transform: translateY(18px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes envitefy-hero-marquee {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }

  .envitefy-hero-fade {
    animation: envitefy-hero-fade-slide 0.8s ease-out forwards;
    opacity: 0;
  }

  .envitefy-hero-delay-100 { animation-delay: 0.10s; }
  .envitefy-hero-delay-200 { animation-delay: 0.20s; }
  .envitefy-hero-delay-300 { animation-delay: 0.30s; }
  .envitefy-hero-delay-400 { animation-delay: 0.40s; }
  .envitefy-hero-delay-500 { animation-delay: 0.50s; }

  .envitefy-hero-marquee {
    animation: envitefy-hero-marquee 34s linear infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .envitefy-hero-fade,
    .envitefy-hero-marquee {
      animation: none;
      opacity: 1;
      transform: none;
    }
  }
`;

const formatNumber = (value: number) => Math.round(value).toLocaleString("en-US");

const AnimatedNumber = ({
  className,
  duration = 1200,
  suffix = "+",
  value,
}: {
  className?: string;
  duration?: number;
  suffix?: string;
  value: number;
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    let frameId = 0;
    const start = performance.now();

    const rollNumber = (time: number) => {
      const progress = Math.min((time - start) / duration, 1);
      const easedProgress = 1 - (1 - progress) ** 3;

      setDisplayValue(Math.round(value * easedProgress));

      if (progress < 1) {
        frameId = requestAnimationFrame(rollNumber);
      }
    };

    frameId = requestAnimationFrame(rollNumber);

    return () => cancelAnimationFrame(frameId);
  }, [duration, value]);

  return (
    <span className={className} suppressHydrationWarning>
      {formatNumber(displayValue)}
      {suffix}
    </span>
  );
};

const SurfaceScroller = () => (
  <div
    className="relative flex overflow-hidden"
    style={{
      maskImage: "linear-gradient(to right, transparent, black 18%, black 82%, transparent)",
      WebkitMaskImage: "linear-gradient(to right, transparent, black 18%, black 82%, transparent)",
    }}
  >
    <div className="envitefy-hero-marquee flex min-w-max gap-10 whitespace-nowrap px-5">
      {[...SURFACES, ...SURFACES, ...SURFACES].map((surface, index) => (
        <div
          className="flex items-center gap-2 text-[#52605c]/68 transition-colors hover:text-[#203137]"
          key={`${surface.label}-${index}`}
        >
          <surface.icon className="h-5 w-5" />
          <span className="text-base font-semibold tracking-normal">
            <AnimatedNumber suffix="" value={surface.value} /> {surface.label}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const StatItem = ({ value, label }: { value: number; label: string }) => (
  <div className="flex min-h-14 flex-col items-center justify-center text-center">
    <AnimatedNumber
      className="text-2xl font-bold leading-none text-[#203137] sm:text-3xl"
      suffix=""
      value={value}
    />
    <span className="mt-2 text-[10px] font-semibold uppercase text-[#6f7b75] sm:text-xs">
      {label}
    </span>
  </div>
);

const heroFont = "var(--font-montserrat), var(--font-sans), system-ui, sans-serif";

export default function HeroSection() {
  return (
    <section
      className="relative min-h-[100svh] overflow-hidden bg-[#f7f8f3] text-[#202124]"
      style={{ fontFamily: heroFont }}
    >
      <style>{animationStyle}</style>

      <img
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-[0.48] lg:opacity-[0.66]"
        src="/images/about/hero/envitefy-about-hero-poster.webp"
        style={{ objectPosition: "62% 58%" }}
      />

      <div
        className="absolute inset-x-0 top-0 h-52 bg-gradient-to-b from-[#f7f8f3] via-[#f7f8f3]/92 to-transparent sm:h-60 lg:h-64"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(247,248,243,0.96)_0%,rgba(247,248,243,0.78)_45%,rgba(247,248,243,0.44)_70%,rgba(247,248,243,0.2)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(247,248,243,0.08),rgba(247,248,243,0.86))]" />
      <div
        className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#f7f8f3] to-transparent"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto grid min-h-[100svh] max-w-7xl grid-cols-1 items-center gap-10 px-4 pb-10 pt-20 sm:px-6 sm:pb-14 sm:pt-24 lg:grid-cols-12 lg:gap-8 lg:px-8 lg:pb-16 lg:pt-28">
        <div className="lg:col-span-7">
          <div className="envitefy-hero-fade envitefy-hero-delay-100 mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/54 px-3.5 py-2 shadow-[0_10px_30px_rgba(88,69,92,0.08)] backdrop-blur-xl">
              <span className="text-[11px] font-bold uppercase text-[#2f6f64] sm:text-xs">
                Live event systems
              </span>
              <Star className="h-3.5 w-3.5 fill-[#f3ad3d] text-[#f3ad3d]" />
            </div>
          </div>

          <h1
            className="envitefy-hero-fade envitefy-hero-delay-200 max-w-4xl text-5xl font-semibold leading-[0.96] text-[#202124] sm:text-6xl lg:text-7xl xl:text-8xl"
            style={{
              fontFamily: heroFont,
            }}
          >
            Crafting live
            <br />
            event pages
            <br />
            <span className="bg-gradient-to-br from-[#203137] via-[#2f6f64] to-[#b8742b] bg-clip-text text-transparent">
              that matter
            </span>
          </h1>

          <p className="envitefy-hero-fade envitefy-hero-delay-300 mt-8 max-w-2xl text-base leading-8 text-[#52605c] sm:text-lg">
            Envitefy turns live cards, flyers, screenshots, schedules, and new ideas into hosted
            event pages with RSVP, maps, registry links, calendar saves, and guest-ready updates.
          </p>

          <div className="envitefy-hero-fade envitefy-hero-delay-400 mt-9 flex flex-col gap-4 sm:flex-row">
            <Link
              className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#203137] px-8 py-4 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(32,49,55,0.18)] transition hover:bg-[#2b4148] active:scale-[0.98]"
              href="/"
            >
              <AnimatedButtonLabel label="Start creating" />
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-full border border-white/80 bg-white/48 px-8 py-4 text-sm font-semibold text-[#202124] shadow-[0_14px_40px_rgba(32,49,55,0.08)] backdrop-blur-xl transition hover:bg-white/72 active:scale-[0.98]"
              href="/landing"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Watch flow</span>
            </Link>
          </div>

          <div className="envitefy-hero-fade envitefy-hero-delay-500 mt-9 hidden max-w-3xl grid-cols-3 gap-8 sm:grid">
            {HERO_STATS.map((stat) => (
              <div key={stat.label}>
                <AnimatedNumber
                  className="block text-3xl font-bold leading-none text-[#2f6f64]"
                  value={stat.value}
                />
                <div className="mt-2 text-xs font-semibold text-[#5d6863]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6 lg:col-span-5">
          <div className="envitefy-hero-fade envitefy-hero-delay-500 relative hidden overflow-hidden rounded-lg border border-white/68 bg-white/42 p-6 shadow-[0_28px_80px_rgba(32,49,55,0.13)] backdrop-blur-md sm:block sm:p-8">
            <div className="relative z-10">
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-white/62 ring-1 ring-[#50605e]/16">
                  <Target className="h-6 w-6 text-[#2f6f64]" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#203137] sm:text-4xl">
                    <AnimatedNumber value={TOTAL_BUILDERS} />
                  </div>
                  <div className="text-sm font-medium text-[#5d6863]">
                    Parents, teachers & hosts
                  </div>
                </div>
              </div>

              <div className="mb-8 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-[#52605c]">Guest-ready launches</span>
                  <AnimatedNumber className="font-bold text-[#203137]" suffix="%" value={96} />
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#50605e]/12">
                  <div className="h-full w-[96%] rounded-full bg-gradient-to-r from-[#203137] via-[#2f6f64] to-[#d99132]" />
                </div>
              </div>

              <div className="mb-6 h-px w-full bg-[#50605e]/12" />

              <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch gap-3">
                <StatItem label="Parents" value={PARENT_BUILDERS} />
                <div className="mx-auto h-full w-px bg-[#50605e]/12" />
                <StatItem label="Teachers" value={TEACHER_BUILDERS} />
                <div className="mx-auto h-full w-px bg-[#50605e]/12" />
                <StatItem label="Hosts" value={HOST_BUILDERS} />
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#50605e]/12 bg-white/52 px-3 py-1.5 text-[10px] font-bold uppercase text-[#52605c]">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#39b87f] opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#32a56e]" />
                  </span>
                  Live cards
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#50605e]/12 bg-white/52 px-3 py-1.5 text-[10px] font-bold uppercase text-[#52605c]">
                  <Crown className="h-3 w-3 text-[#d99132]" />
                  Flyers
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#50605e]/12 bg-white/52 px-3 py-1.5 text-[10px] font-bold uppercase text-[#52605c]">
                  <CheckCircle2 className="h-3 w-3 text-[#2f6f64]" />
                  Event pages
                </div>
              </div>
            </div>
          </div>

          <div className="envitefy-hero-fade envitefy-hero-delay-500 hidden overflow-hidden rounded-lg border border-white/68 bg-white/38 py-8 shadow-[0_22px_70px_rgba(32,49,55,0.12)] backdrop-blur-md sm:block">
            <h2
              className="mb-6 px-8 text-sm font-semibold text-[#52605c]"
              style={{ fontFamily: heroFont }}
            >
              Generated with Envitefy
            </h2>
            <SurfaceScroller />
          </div>

          <div className="envitefy-hero-fade envitefy-hero-delay-500 rounded-lg border border-white/70 bg-white/46 p-4 shadow-[0_18px_55px_rgba(32,49,55,0.1)] backdrop-blur-2xl sm:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/58 ring-1 ring-[#50605e]/16">
                <Target className="h-5 w-5 text-[#2f6f64]" />
              </div>
              <div>
                <AnimatedNumber
                  className="block text-2xl font-bold leading-none text-[#203137]"
                  value={TOTAL_BUILDERS}
                />
                <div className="mt-1 text-xs font-semibold text-[#5d6863]">
                  Parents, teachers & hosts
                </div>
              </div>
            </div>
            <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-[#50605e]/12">
              <div className="h-full w-[96%] rounded-full bg-gradient-to-r from-[#203137] via-[#2f6f64] to-[#d99132]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
