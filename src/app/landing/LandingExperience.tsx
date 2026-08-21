"use client";

import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Gift,
  MessageCircle,
  Sparkles,
  TicketCheck,
  Upload,
  Users,
} from "lucide-react";
import dynamic from "next/dynamic";
import { getImageProps } from "next/image";
import Link from "next/link";
import { type ReactNode, useEffect, useRef, useState } from "react";
import HeroImageScrim from "@/components/landing/HeroImageScrim";
import HeroTopNav from "@/components/navigation/HeroTopNav";
import MobileBrandHeader from "@/components/navigation/MobileBrandHeader";
import ScrollAwareBottomNav from "@/components/navigation/ScrollAwareBottomNav";
import { signedOutMobileMenuLinks } from "@/config/navigation";
import {
  creationPaths,
  type GuestActionId,
  type GuestActionTone,
  guestActionPreviewConfigs,
  guestActionProofStats,
  guestActionSlides,
  heroProductSlides,
  landingHeroNavLinks,
  landingTestimonials,
  templateCarouselFeatures,
} from "./landing-data";
import CategoryDirectory, { HeroCategoryStrip } from "./sections/CategoryDirectory";

const AuthModal = dynamic(() => import("@/components/auth/AuthModal"), {
  loading: () => null,
  ssr: false,
});
const ConciergeSheet = dynamic(() => import("@/components/navigation/ConciergeSheet"), {
  loading: () => null,
  ssr: false,
});
const MenuBottomSheet = dynamic(() => import("@/components/navigation/MenuBottomSheet"), {
  loading: () => null,
  ssr: false,
});
const LandingLiveCardShowcase = dynamic(
  () => import("@/components/landing/LandingLiveCardShowcase"),
  {
    loading: () => null,
    ssr: false,
  },
);
const FeatureCarousel = dynamic(() => import("@/components/ui/feature-carousel"), {
  loading: () => null,
  ssr: false,
});
const DesignTestimonial = dynamic(
  () => import("@/components/ui/design-testimonial").then((module) => module.Testimonial),
  {
    loading: () => null,
    ssr: false,
  },
);
const AIConciergeSection = dynamic(() => import("./sections/AIConciergeSection"), {
  loading: () => null,
  ssr: false,
});

const landingFlowSectionClass = "";
const landingFlowInnerClass = "";
const landingViewportSectionClass = "flex min-h-[100svh] flex-col justify-center";

const landingIconComponents = {
  clipboardList: ClipboardList,
  gift: Gift,
  messageCircle: MessageCircle,
  sparkles: Sparkles,
  ticketCheck: TicketCheck,
  upload: Upload,
  users: Users,
} as const;

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function DeferredLandingContent({
  children,
  className = "min-h-[100svh]",
}: {
  children: ReactNode;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) {
      setIsReady(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setIsReady(true);
        observer.disconnect();
      },
      { rootMargin: "320px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={className} aria-busy={!isReady}>
      {isReady ? children : <div className="h-full min-h-[inherit]" aria-hidden="true" />}
    </div>
  );
}

function HeroProductCarousel({ onPrimaryAction }: { onPrimaryAction: () => void }) {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const activeSlide = heroProductSlides[activeSlideIndex] ?? heroProductSlides[0];
  const { props: mobileHeroImageProps } = getImageProps({
    src: activeSlide.image,
    alt: activeSlide.imageAlt,
    fill: true,
    sizes: "100vw",
  });
  const { props: desktopHeroImageProps } = getImageProps({
    src: activeSlide.desktopImage,
    alt: activeSlide.imageAlt,
    fill: true,
    sizes: "100vw",
  });

  const showPreviousSlide = () => {
    setActiveSlideIndex(
      (currentIndex) => (currentIndex - 1 + heroProductSlides.length) % heroProductSlides.length,
    );
  };

  const showNextSlide = () => {
    setActiveSlideIndex((currentIndex) => (currentIndex + 1) % heroProductSlides.length);
  };

  return (
    <section
      id="landing-hero"
      className="relative isolate min-h-[100svh] overflow-hidden bg-[#120f14] text-white"
    >
      <div key={activeSlide.id} className="pointer-events-none absolute inset-0 z-0">
          <picture>
            <source
              media="(min-width: 768px)"
              srcSet={desktopHeroImageProps.srcSet}
              sizes={desktopHeroImageProps.sizes}
            />
            <img
              {...mobileHeroImageProps}
              alt={activeSlide.imageAlt}
              fetchPriority="high"
              className="object-cover"
              style={{
                ...mobileHeroImageProps.style,
                objectPosition: activeSlide.imagePosition ?? "center",
              }}
            />
          </picture>
      </div>
      <HeroImageScrim />

      <button
        type="button"
        onClick={showPreviousSlide}
        aria-label="Show previous hero slide"
        className="absolute left-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md border border-white/18 bg-black/34 text-white shadow-[0_18px_40px_rgba(0,0,0,0.24)] backdrop-blur transition hover:bg-white/16 md:flex"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={showNextSlide}
        aria-label="Show next hero slide"
        className="absolute right-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md border border-white/18 bg-black/34 text-white shadow-[0_18px_40px_rgba(0,0,0,0.24)] backdrop-blur transition hover:bg-white/16 md:flex"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-none flex-col justify-end px-5 pb-20 pt-32 sm:px-8 lg:px-16 lg:pb-24">
        <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#fff1c8] drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] sm:text-xs">
              {activeSlide.eyebrow}
            </p>
            <h1
              className="mt-5 max-w-5xl text-5xl font-light leading-[0.98] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.82)] sm:text-7xl lg:text-[5.8rem]"
              style={{ color: "#fff", fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Create beautiful online invitations, from invite to RSVP.
            </h1>
            <p className="mt-4 text-lg font-semibold text-[#fff1c8] sm:text-xl">
              {activeSlide.title}
            </p>
            <p
              className="mt-6 max-w-2xl text-base leading-8 text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] sm:text-lg"
              style={{ color: "#fff" }}
            >
              {activeSlide.description}
            </p>
            <div className="mt-9 grid grid-cols-2 gap-3 sm:flex sm:flex-row">
              <button
                type="button"
                onClick={onPrimaryAction}
                className="inline-flex h-12 w-full min-w-0 items-center justify-center gap-1.5 rounded-md border border-white/18 bg-white/14 px-3 text-[12px] font-semibold text-white shadow-[0_18px_44px_rgba(0,0,0,0.24)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/22 sm:w-auto sm:gap-2 sm:px-6 sm:text-sm"
              >
                <span className="whitespace-nowrap">Try the AI Concierge</span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </button>
              <Link
                href={activeSlide.href ?? "#showcase"}
                className="inline-flex h-12 w-full min-w-0 items-center justify-center rounded-md border border-white/18 bg-black/18 px-3 text-[12px] font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/14 sm:w-auto sm:px-6 sm:text-sm"
              >
                <span className="truncate sm:hidden">
                  {activeSlide.secondaryCtaLabel ?? "View examples"}
                </span>
                <span className="hidden sm:inline">
                  {activeSlide.secondaryCtaLabel ?? "View live examples"}
                </span>
              </Link>
            </div>
            <HeroCategoryStrip />
        </div>
      </div>

      <div
        className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2"
        aria-label="Hero product slides"
        role="group"
      >
        {heroProductSlides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setActiveSlideIndex(index)}
            aria-label={`Show ${slide.title}`}
            aria-pressed={activeSlideIndex === index}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span
              className={cx(
                "h-2.5 rounded-full transition-all",
                activeSlideIndex === index ? "w-9 bg-white" : "w-2.5 bg-white/55",
              )}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
    </section>
  );
}

function PremiumLandingHero({ onPrimaryAction }: { onPrimaryAction: () => void }) {
  return <HeroProductCarousel onPrimaryAction={onPrimaryAction} />;
}

function getGuestActionToneClass(tone: GuestActionTone) {
  if (tone === "attention") return "bg-[#fff2d8] text-[#8b5c1f] ring-[#f2d59a]";
  if (tone === "live") return "bg-[#eaf4ee] text-[#315f52] ring-[#b8d2bf]";
  return "bg-[#eef1e9] text-[#4d5d43] ring-[#cdd8c6]";
}

function GuestActionPreview({ activeAction }: { activeAction: GuestActionId }) {
  const config = guestActionPreviewConfigs[activeAction];
  const currentAction =
    guestActionSlides.find((action) => action.id === activeAction) || guestActionSlides[0];
  const Icon = landingIconComponents[currentAction.icon];

  return (
    <div
      className={cx(
        "relative flex min-h-[44rem] flex-1 flex-col overflow-hidden px-4 pb-5 pt-[calc(6rem+env(safe-area-inset-top))] text-white sm:px-6 sm:pt-[calc(6.5rem+env(safe-area-inset-top))] lg:min-h-[100svh] lg:px-8 lg:pt-[calc(7rem+env(safe-area-inset-top))] xl:px-10",
        config.theme.canvasClass,
      )}
    >
      <div className={cx("absolute inset-0", config.theme.glowClass)} />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40" />
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(240,213,143,0.72),transparent)]" />

      <div key={activeAction} className="relative flex flex-1 flex-col">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p
                className={cx(
                  "text-[10px] font-bold uppercase tracking-[0.2em]",
                  config.theme.accentTextClass,
                )}
              >
                Live guest flow
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-white" style={{ color: "#fff" }}>
                {config.eyebrow}
              </h3>
            </div>
            <ul
              className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:max-w-xl sm:justify-end"
              aria-label={`${currentAction.label} flow signals`}
            >
              {config.proofPills.map((item, index) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-xs font-semibold text-white/76"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/16 bg-white/[0.06] text-[9px] font-bold tracking-[0.12em] text-white shadow-[0_0_24px_rgba(255,255,255,0.08)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="whitespace-nowrap">{item}</span>
                  {index < config.proofPills.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="hidden h-px w-7 bg-[linear-gradient(90deg,rgba(255,255,255,0.34),transparent)] sm:block"
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 grid flex-1 items-stretch gap-5 xl:grid-cols-[minmax(22rem,0.86fr)_minmax(31rem,1.14fr)]">
            <div
              data-guest-flow-panel="guest"
              className={cx(
                "flex h-full min-h-0 flex-col rounded-lg border p-4 shadow-[0_24px_70px_rgba(0,0,0,0.22)] backdrop-blur xl:self-stretch",
                config.theme.guestFrameClass,
              )}
            >
              <div className="flex items-center justify-between gap-3 pb-4">
                <div>
                  <p
                    className={cx(
                      "text-[10px] font-bold uppercase tracking-[0.2em]",
                      config.theme.accentTextClass,
                    )}
                  >
                    Guest page
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white" style={{ color: "#fff" }}>
                    {currentAction.label}
                  </h3>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-[#201a23]">
                  <Icon className="h-5 w-5" />
                </span>
              </div>

              <div className="relative mx-auto flex aspect-[9/19.5] max-h-full w-full max-w-[21.5rem] flex-none flex-col rounded-[2.15rem] border border-white/14 bg-[#07070a] p-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_26px_70px_rgba(0,0,0,0.38)]">
                <span
                  aria-hidden="true"
                  className="absolute -left-1 top-[18%] h-12 w-1 rounded-l-full bg-[#15151a]"
                />
                <span
                  aria-hidden="true"
                  className="absolute -right-1 top-[26%] h-16 w-1 rounded-r-full bg-[#15151a]"
                />
                <div
                  aria-hidden="true"
                  className="absolute left-1/2 top-3.5 z-20 h-6 w-20 -translate-x-1/2 rounded-full bg-black shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]"
                />

                <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.65rem] bg-[#fcfbf7] text-[#201a23] shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
                  <img
                    src={config.image}
                    alt={config.imageAlt}
                    className="aspect-[16/10] w-full flex-none object-cover object-top"
                  />
                  <div className="flex flex-1 flex-col p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#765524]">
                      {config.eventEyebrow}
                    </p>
                    <h4
                      className="mt-2 text-2xl font-light leading-tight"
                      style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                    >
                      {config.eventTitle}
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-[#665d68]">
                      {config.eventDescription}
                    </p>
                    <div className="mt-4 grid gap-2">
                      {config.guestLines.map((line) => (
                        <div
                          key={line}
                          className="flex items-center justify-between gap-3 rounded-md border border-[#e8dcc8] bg-white px-3 py-2"
                        >
                          <span className="text-xs font-semibold text-[#403744]">{line}</span>
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#7a8f76]" />
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        className={cx(
                          "inline-flex h-10 items-center justify-center rounded-md px-3 text-xs font-bold uppercase tracking-[0.12em]",
                          config.theme.primaryButtonClass,
                        )}
                      >
                        {config.primaryCta}
                      </button>
                      <button
                        type="button"
                        className={cx(
                          "inline-flex h-10 items-center justify-center rounded-md border px-3 text-xs font-bold uppercase tracking-[0.12em]",
                          config.theme.secondaryButtonClass,
                        )}
                      >
                        {config.secondaryCta}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              data-guest-flow-panel="host"
              className={cx(
                "flex h-full min-h-0 flex-col overflow-hidden rounded-lg border p-5 text-[#201a23] shadow-[0_24px_70px_rgba(0,0,0,0.2)] sm:p-6 xl:p-7",
                config.theme.hostFrameClass,
              )}
            >
              <div className="grid gap-5 lg:grid-cols-[1fr_11rem] lg:items-start">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#765524]">
                    Host control
                  </p>
                  <h3 className="mt-2 max-w-2xl text-3xl font-semibold leading-tight text-[#201a23] xl:text-[2.15rem]">
                    {config.title}
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#665d68]">
                    {config.description}
                  </p>
                </div>
                <div className="rounded-lg border border-[#e1d6c2] bg-white p-4">
                  <p className="text-4xl font-light text-[#201a23]">{config.metricValue}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7b6f52]">
                    {config.metricLabel}
                  </p>
                  <p className="mt-3 text-xs leading-5 text-[#665d68]">{config.metricNote}</p>
                </div>
              </div>

              <div className="mt-5 grid min-h-0 flex-1 gap-4 lg:grid-cols-[0.72fr_1.28fr]">
                <div className="grid content-start gap-3">
                  {config.hostRows.map((row) => (
                    <div
                      key={row.label}
                      className="rounded-lg border border-[#e8dcc8] bg-white p-4"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7b6f52]">
                        {row.label}
                      </p>
                      <div className="mt-2 flex items-end justify-between gap-3">
                        <p className="text-2xl font-semibold text-[#201a23]">{row.value}</p>
                        <p className="text-xs leading-5 text-[#665d68]">{row.note}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="min-h-0 overflow-hidden rounded-lg border border-[#e1d6c2] bg-white">
                  <p className="px-4 pt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#765524]">
                    Response timeline
                  </p>
                  <div className="mt-3 divide-y divide-[#f0e8d9]">
                    {config.timeline.map((item) => (
                      <div
                        key={item.label}
                        className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[#201a23]">{item.label}</p>
                          <p className="mt-1 text-xs leading-5 text-[#665d68]">{item.detail}</p>
                        </div>
                        <span
                          className={cx(
                            "inline-flex w-fit items-center rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ring-1",
                            getGuestActionToneClass(item.tone),
                          )}
                        >
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 border-t border-[#eadfce] pt-4 md:grid-cols-3">
                {config.flowSteps.map((step) => (
                  <div
                    key={step.title}
                    className="rounded-md border border-[#e8dcc8] bg-[#fcfbf7] px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-[#201a23]">{step.title}</p>
                    <p className="mt-1 text-xs leading-5 text-[#665d68]">{step.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}

function GuestActionSuite({ onPrimaryAction }: { onPrimaryAction: () => void }) {
  const [activeActionIndex, setActiveActionIndex] = useState(0);
  const activeAction = (guestActionSlides[activeActionIndex] || guestActionSlides[0]).id;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const interval = window.setInterval(() => {
      setActiveActionIndex((index) => (index + 1) % guestActionSlides.length);
    }, 7200);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section
      id="guest-flow"
      className={cx(
        landingViewportSectionClass,
        "scroll-mt-0 overflow-hidden border-y border-[#2e2432] bg-[#201a23] text-white",
      )}
    >
      <div className="grid min-h-[100svh] w-full lg:grid-cols-[minmax(22rem,34vw)_minmax(0,1fr)]">
        <div className="flex flex-col justify-start px-4 pb-16 pt-[calc(6rem+env(safe-area-inset-top))] sm:px-8 sm:pt-[calc(6.5rem+env(safe-area-inset-top))] lg:px-10 lg:pb-20 lg:pt-[calc(7rem+env(safe-area-inset-top))] xl:px-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#f0d58f]">
            Guest actions
          </p>
          <h2
            className="mt-4 max-w-2xl text-4xl font-light leading-tight text-white sm:text-5xl xl:text-6xl"
            style={{ color: "#fff", fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Turn every event page into the place guests actually act.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-8 text-white/74">
            RSVP, registry, map, calendar, and sign-up moments feel like one premium guest journey,
            while hosts keep a clean command center behind the scenes.
          </p>

          <div
            className="mt-6 flex items-center gap-2"
            role="group"
            aria-label="Guest action carousel"
          >
            {guestActionSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveActionIndex(index)}
                aria-label={`Show ${slide.label}`}
                aria-pressed={index === activeActionIndex}
                className={cx(
                  "h-2.5 rounded-full transition-all",
                  index === activeActionIndex
                    ? "w-10 bg-[#f0d58f]"
                    : "w-2.5 bg-white/22 hover:bg-white/48",
                )}
              />
            ))}
          </div>

          <div className="mt-8 border-y border-white/14 py-5">
            <dl className="grid gap-5">
              {guestActionProofStats.map((stat, index) => (
                <div key={stat.value} className="grid grid-cols-[3.5rem_1fr] gap-4">
                  <dt className="relative flex h-12 w-12 items-center justify-center">
                    <span className="absolute inset-0 rounded-full border border-[#f0d58f]/36 bg-[#f0d58f]/10 shadow-[0_0_30px_rgba(240,213,143,0.14)]" />
                    <span className="relative text-[10px] font-bold uppercase tracking-[0.18em] text-[#f0d58f]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </dt>
                  <dd className="min-w-0 border-b border-white/10 pb-5 last:border-b-0 last:pb-0">
                    <p className="text-2xl font-semibold leading-none text-white">{stat.value}</p>
                    <p className="mt-2 text-sm leading-6 text-white/64">{stat.label}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <button
            type="button"
            onClick={onPrimaryAction}
            className="mt-6 inline-flex h-12 w-fit self-end items-center justify-center gap-2 rounded-md border border-[#f0d58f]/44 bg-[#f0d58f] px-6 text-sm font-semibold text-[#201a23] shadow-[0_18px_44px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f0d58f]"
          >
            Let's Envitefy
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex min-w-0 border-t border-white/10 lg:border-l lg:border-t-0">
          <GuestActionPreview activeAction={activeAction} />
        </div>
      </div>
    </section>
  );
}

function TemplateGallery() {
  return (
    <section
      id="examples"
      className={cx(
        landingFlowSectionClass,
        "flex min-h-[100svh] scroll-mt-0 flex-col border-b border-[#ded2bd] bg-[#fbf8f1] lg:h-[100svh] lg:overflow-hidden",
      )}
    >
      <div className="mx-auto flex min-h-[100svh] w-full max-w-none flex-1 flex-col justify-start px-4 pb-8 pt-[calc(2.25rem+env(safe-area-inset-top))] sm:px-6 sm:pb-10 sm:pt-[calc(3rem+env(safe-area-inset-top))] lg:h-full lg:min-h-0 lg:justify-center lg:px-8 lg:pb-12 lg:pt-[calc(8rem+env(safe-area-inset-top))]">
        <div className="w-full">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#765524]">
              Templates and proof
            </p>
          </div>

          <DeferredLandingContent className="mt-10 min-h-[600px]">
            <FeatureCarousel
              features={templateCarouselFeatures}
              className="max-w-none"
              style={{ width: "min(100%, 112rem)" }}
              accentColor="#6f8f7b"
            />
          </DeferredLandingContent>
        </div>
      </div>
    </section>
  );
}

function CreationPaths({ onPrimaryAction }: { onPrimaryAction: () => void }) {
  return (
    <section
      id="creation-paths"
      className={cx(
        landingFlowSectionClass,
        "relative isolate min-h-[100svh] scroll-mt-0 overflow-hidden border-y border-[#2e2432] bg-[#201a23] text-white",
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-28"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(240,213,143,0.72),transparent)]"
      />

      <div className="relative flex min-h-[100svh] w-full flex-col justify-center px-4 pb-10 pt-[calc(9.25rem+env(safe-area-inset-top))] sm:px-8 sm:pb-12 sm:pt-[calc(7.75rem+env(safe-area-inset-top))] lg:px-10 lg:pb-14 lg:pt-[calc(8.25rem+env(safe-area-inset-top))]">
        <div className={landingFlowInnerClass}>
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#f0d58f]">
              Creation paths
            </p>
            <h2
              className="mt-4 text-4xl font-light leading-tight text-white sm:text-5xl"
              style={{ color: "#fff", fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              Start from Concierge or the file you already have.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/72">
              Hosting creates My events. Received birthday, wedding, gender reveal, and similar
              invite-card scans become Invited events.
            </p>
            <button
              id="upload"
              type="button"
              onClick={onPrimaryAction}
              className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-[#201a23] shadow-[0_18px_44px_rgba(0,0,0,0.2)] transition hover:-translate-y-0.5 hover:bg-[#43273f] hover:text-white"
            >
              Start your event
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {creationPaths.map((path, index) => {
              const Icon = landingIconComponents[path.icon];
              return (
                <article
                  key={path.title}
                  className="group relative overflow-hidden rounded-lg border border-white/14 bg-[#2d2732]/96 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)] backdrop-blur transition hover:-translate-y-0.5 hover:border-[#f0d58f]/48 hover:bg-[#332c38]/96 lg:p-4"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(240,213,143,0.72),transparent)] opacity-70" />
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-md border border-[#f0d58f]/28 bg-[#f0d58f]/10 text-[#f0d58f] shadow-[0_0_34px_rgba(240,213,143,0.12)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="rounded-md border border-white/14 bg-white/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/64">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f0d58f] lg:mt-4">
                    {path.badge}
                  </p>
                  <h3
                    className="mt-2 text-2xl font-semibold leading-tight text-white"
                    style={{ color: "#fff" }}
                  >
                    {path.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-white/68 lg:leading-6">
                    {path.description}
                  </p>
                  <ul className="mt-5 space-y-2 border-t border-white/10 pt-5 lg:mt-4 lg:pt-4">
                    {path.points.map((point) => (
                      <li key={point} className="flex gap-2 text-sm leading-6 text-white/78">
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#9bb792]" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsProof() {
  return (
    <section
      id="testimonials"
      className={cx(
        landingFlowSectionClass,
        "min-h-[100svh] scroll-mt-0 overflow-hidden border-b border-[#ded2bd] bg-[#fcfbf7]",
      )}
    >
      <div className="flex min-h-[100svh] w-full flex-col justify-center pb-12 pt-[calc(8.5rem+env(safe-area-inset-top))] sm:pb-16 sm:pt-[calc(7.5rem+env(safe-area-inset-top))] lg:pb-20 lg:pt-[calc(8rem+env(safe-area-inset-top))]">
        <div>
          <div className="mx-auto max-w-none px-4 text-center sm:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#765524]">
              Guest and host feedback
            </p>
            <h2
              className="mt-3 whitespace-nowrap text-xl font-light leading-tight text-[#201a23] sm:text-4xl lg:text-5xl"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              What Guests and Hosts Are Saying
            </h2>
          </div>
          <DesignTestimonial
            testimonials={landingTestimonials}
            label="Testimonials"
            className="mt-8 bg-transparent"
          />
        </div>
      </div>
    </section>
  );
}

export default function LandingExperience() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [bottomNavVisible, setBottomNavVisible] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };
  const openConciergeDemo = () => setAssistantOpen(true);
  return (
    <>
      <main
        className={cx(
          "min-h-screen bg-[#fcfbf7] text-[#201a23] selection:bg-[#e2c891]/45 selection:text-[#201a23]",
          bottomNavVisible && "pb-[calc(96px+env(safe-area-inset-bottom))] md:pb-0",
        )}
      >
        <div className="hidden md:block">
          <HeroTopNav
            navLinks={[...landingHeroNavLinks]}
            mobileNavLinks={[...signedOutMobileMenuLinks]}
            primaryCtaLabel="Let's create"
            authenticatedPrimaryHref="/chat"
            brandHref="/"
            variant="transparent-dark"
            loginSuccessRedirectUrl="/"
            showMobileMenuAuthActions={false}
            onGuestLoginAction={() => openAuth("login")}
            onGuestPrimaryAction={() => openAuth("signup")}
          />
        </div>
        <MobileBrandHeader onMenuClick={() => setMobileMenuOpen(true)} />

        <PremiumLandingHero onPrimaryAction={openConciergeDemo} />
        <CategoryDirectory />

        <DeferredLandingContent>
          <AIConciergeSection />
        </DeferredLandingContent>

        <DeferredLandingContent>
          <section className="border-b border-[#ded2bd] bg-[#f8f3ea]">
            <LandingLiveCardShowcase
              eyebrow="Interactive proof"
              title="Live cards connected to real event details."
              description="Swipe through product-backed live cards for weddings, birthdays, showers, school events, team weekends, and hosted gatherings."
              tone="luxury"
            />
          </section>
        </DeferredLandingContent>

        <GuestActionSuite onPrimaryAction={() => openAuth("signup")} />
        <TemplateGallery />
        <CreationPaths onPrimaryAction={() => openAuth("signup")} />
        <DeferredLandingContent>
          <TestimonialsProof />
        </DeferredLandingContent>
      </main>
      <ScrollAwareBottomNav
        onConciergeSelect={openConciergeDemo}
        onMenuSelect={() => setMobileMenuOpen(true)}
        onVisibilityChange={setBottomNavVisible}
      />
      <MenuBottomSheet
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        successRedirectUrl="/"
        signupSuccessRedirectUrl="/chat"
      />
      <ConciergeSheet
        open={assistantOpen}
        onOpenChange={setAssistantOpen}
        onSignupSelect={() => openAuth("signup")}
      />

      <AuthModal
        open={authModalOpen}
        mode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onModeChange={setAuthMode}
        successRedirectUrl={authMode === "signup" ? "/chat" : "/"}
      />
    </>
  );
}
