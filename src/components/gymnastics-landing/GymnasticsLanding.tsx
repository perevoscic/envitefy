"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import GymnasticsHeroBackground from "./GymnasticsHeroBackground";
import Link from "next/link";
import AuthModal from "@/components/auth/AuthModal";
import HeroTopNav from "@/components/navigation/HeroTopNav";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Hotel,
  MapPinned,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Trophy,
  Upload,
  Users,
  Share2,
  Shield,
  Smartphone,
} from "lucide-react";

const heroImages = {
  gymnastAction: "/images/gymnastic-hero.png",
  attendeeAvatars: [
    "https://i.pravatar.cc/100?img=11",
    "https://i.pravatar.cc/100?img=12",
    "https://i.pravatar.cc/100?img=13",
  ],
};

type HeroStat = {
  value: number;
  suffix: string;
  label: string;
};

const heroStats: HeroStat[] = [
  { value: 500, suffix: "+", label: "Meets hosted" },
  { value: 50, suffix: "k+", label: "Families reached" },
  { value: 99, suffix: "%", label: "Mobile-ready experience" },
];

const heroAnimations = `
@keyframes gymnasticsHeroFloatUp {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-12px); }
}

@keyframes gymnasticsHeroFloatDown {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(12px); }
}
`;

function useInViewOnce<T extends HTMLElement>(threshold = 0.35) {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [isVisible, threshold]);

  return { ref, isVisible };
}

function HeroStatValue({
  value,
  suffix,
  duration = 1400,
  delay = 0,
}: {
  value: number;
  suffix: string;
  duration?: number;
  delay?: number;
}) {
  const { ref, isVisible } = useInViewOnce<HTMLSpanElement>(0.4);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    let frameId = 0;
    let timeoutId: number | null = null;

    const startAnimation = () => {
      const startTime = performance.now();

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - (1 - progress) ** 3;

        setCount(Math.round(value * eased));

        if (progress < 1) {
          frameId = window.requestAnimationFrame(tick);
        }
      };

      frameId = window.requestAnimationFrame(tick);
    };

    timeoutId = window.setTimeout(startAnimation, delay);

    return () => {
      window.cancelAnimationFrame(frameId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [delay, duration, isVisible, value]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

/* ─── trust strip logos (text-based, no images needed) ─── */
const trustItems = [
  "Gymnastics parents",
  "Meet directors",
  "Coaches & teams",
  "Club gyms",
  "USAG events",
];

/* ─── feature pillars ─── */
const features = [
  {
    icon: CalendarDays,
    title: "Meet Details",
    copy: "Start times, warm-ups, rotations, and awards timing in a clean layout that parents can scan in seconds.",
    backCopy:
      "Every competition block is broken down with check-in times, warm-up windows, rotation orders, and awards timing. Parents see exactly when their athlete competes — no more decoding spreadsheets or PDF tables on a tiny phone screen.",
    accent: "from-indigo-500/10 to-violet-500/10",
    iconColor: "text-indigo-600",
  },
  {
    icon: Hotel,
    title: "Travel & Hotels",
    copy: "Block booking links, parking notes, shuttle info, and venue directions — all in one place.",
    backCopy:
      "Attach hotel block links with deadlines, embed venue maps with parking notes, and include shuttle timing details. Families stop hunting through separate docs — everything travel-related lives right on the meet page.",
    accent: "from-violet-500/10 to-fuchsia-500/10",
    iconColor: "text-violet-600",
  },
  {
    icon: Users,
    title: "Team Coordination",
    copy: "Keep athletes, parents, and coaching staff aligned with a single shared meet hub.",
    backCopy:
      "One link keeps the entire team in sync. Coaches post warm-up assignments, parents confirm attendance, and athletes see their rotation details — all from the same page instead of scattered group chats.",
    accent: "from-fuchsia-500/10 to-pink-500/10",
    iconColor: "text-fuchsia-600",
  },
  {
    icon: MessageSquare,
    title: "Updates & Announcements",
    copy: "Last-minute changes reach everyone instantly instead of getting buried in group chats.",
    backCopy:
      "Timeline changes, venue updates, and weather delays are posted once and visible to every family immediately. No more re-sending PDFs or hoping a text chain reaches everyone in time.",
    accent: "from-pink-500/10 to-rose-500/10",
    iconColor: "text-pink-600",
  },
];

/* ─── use cases ─── */
const useCases = [
  {
    eyebrow: "For parents",
    title: "Know exactly what to expect",
    copy: "One link with start times, venue directions, parking, and spectator info — no more hunting through PDFs and email threads.",
    icon: Smartphone,
  },
  {
    eyebrow: "For coaches",
    title: "Share everything in one place",
    copy: "Stop resending updated packets. Upload once, publish once, and every family gets the same up-to-date information.",
    icon: Share2,
  },
  {
    eyebrow: "For meet directors",
    title: "Present a polished event",
    copy: "Give your meet a professional public page with start times, venue maps, hotel blocks, and spectator guidance.",
    icon: Trophy,
  },
];

/* ─── why envitefy stats ─── */
const whyStats = [
  { value: "1", label: "page for every meet" },
  { value: "5x", label: "faster than PDF packets" },
  { value: "100%", label: "mobile-ready" },
  { value: "0", label: "app downloads required" },
];

/* ─── flip card component ─── */
function FeatureFlipCard({ f }: { f: (typeof features)[number] }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <article
      className="group relative cursor-pointer transition-transform duration-300 hover:-translate-y-1"
      style={{ perspective: "1000px" }}
      onClick={() => setFlipped((prev) => !prev)}
    >
      <div
        className="relative transition-transform duration-600"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          willChange: "transform",
          transitionTimingFunction: "cubic-bezier(0.4, 0.2, 0.2, 1)",
          minHeight: "260px",
        }}
      >
        {/* ─── FRONT ─── */}
        <div
          className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 ease-out group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
          style={{ backfaceVisibility: "hidden", minHeight: "260px" }}
        >
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-violet-500/0 transition duration-300 group-hover:bg-violet-500/5" />
          {/* accent gradient bg */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${f.accent} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
          />
          <div
            aria-hidden="true"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-400 opacity-40 shadow-sm transition-all duration-300 group-hover:-translate-y-0.5 group-hover:opacity-70"
          >
            <RefreshCw className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" />
          </div>
          <div className="relative flex h-full flex-col lg:-mt-20">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.accent} ${f.iconColor}`}
            >
              <f.icon className="h-5 w-5" />
            </div>
            <h3
              className="mt-5 text-lg font-semibold text-slate-900"
              style={{ fontFamily: "inherit" }}
            >
              {f.title}
            </h3>
            <p className="mt-2.5 text-sm leading-6 text-slate-500">{f.copy}</p>
          </div>
        </div>

        {/* ─── BACK ─── */}
        <div
          className={`absolute inset-0 overflow-hidden rounded-2xl border border-indigo-400/30 bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 p-6 text-white shadow-lg`}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            minHeight: "260px",
          }}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white`}
              >
                <f.icon className="h-5 w-5" />
              </div>
              <h3
                className="text-base font-semibold text-white"
                style={{ color: "#fff", fontFamily: "inherit" }}
              >
                {f.title}
              </h3>
            </div>
            <p className="mt-4 flex-1 text-sm leading-6 text-white/85">
              {f.backCopy}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function GymnasticsLanding() {
  const { status } = useSession();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const isAuthenticated = status === "authenticated";

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fafbfe] text-[#0f172a] selection:bg-indigo-200 selection:text-indigo-900">
      <style>{heroAnimations}</style>

      {/* page background sits behind the sticky nav and hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[72rem] lg:h-[78rem]"
      >
        <GymnasticsHeroBackground />
      </div>

      <HeroTopNav
        navLinks={[
          { label: "Snap", href: "/snap" },
          { label: "Features", href: "#features" },
          { label: "FAQ", href: "/faq" },
        ]}
        authenticatedPrimaryHref="/event/gymnastics"
        onGuestLoginAction={() => openAuth("login")}
        onGuestPrimaryAction={() => openAuth("signup")}
      />

      {/* ═══ HERO ═══ */}
      <section id="hero" className="relative z-10 scroll-mt-20 overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-full">
          <div className="absolute left-[-8%] top-[8%] h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.16),transparent_68%)] blur-3xl" />
          <div className="absolute bottom-[8%] right-[-10%] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.12),transparent_70%)] blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto grid max-w-[1400px] items-center gap-16 px-4 pb-20 pt-20 sm:px-6 md:pt-28 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-20 lg:px-8 lg:pb-28 lg:pt-32">
          <div className="max-w-2xl">
            <h1
              className="max-w-[11ch] text-[clamp(3.15rem,7vw,6.3rem)] font-extrabold leading-[0.96] tracking-[-0.05em] text-slate-900"
              style={{ fontFamily: "inherit" }}
            >
              <span className="inline-block whitespace-nowrap text-[0.94em]">
                Elevate Your
              </span>{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 bg-clip-text italic text-transparent">
                Gymnastics Meet
              </span>{" "}
              Experience.
            </h1>

            <p className="mt-8 max-w-xl text-lg font-medium leading-8 text-slate-500 sm:text-xl sm:leading-9">
              From local qualifiers to national championships, Envitefy turns
              competition details into interactive, mobile-first meet pages with
              venue details, team communication, and shareable updates.
            </p>

            <div className="mt-11 flex flex-col gap-4 sm:flex-row">
              {isAuthenticated ? (
                <Link
                  href="/event/gymnastics"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#7c3aed_0%,#8b5cf6_55%,#9f67ff_100%)] px-8 py-4 text-base font-semibold text-white shadow-[0_24px_50px_rgba(124,58,237,0.34)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_56px_rgba(124,58,237,0.4)]"
                >
                  Create Your Meet
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuth("signup")}
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#7c3aed_0%,#8b5cf6_55%,#9f67ff_100%)] px-8 py-4 text-base font-semibold text-white shadow-[0_24px_50px_rgba(124,58,237,0.34)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_56px_rgba(124,58,237,0.4)]"
                >
                  Create Your Meet
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              )}

              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/90 px-8 py-4 text-base font-semibold text-slate-700 shadow-sm backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md"
              >
                See How It Works
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[3rem] bg-[radial-gradient(circle,rgba(124,58,237,0.18),transparent_68%)] blur-3xl" />

            <div className="relative mx-auto aspect-[4/5] w-full max-w-md">
              <div className="absolute left-8 top-0 z-20 inline-flex -translate-y-1/2 items-center gap-2 rounded-full border border-white/70 bg-white/92 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-indigo-700 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl">
                <Trophy className="h-4 w-4" />
                Elite Sports Management
              </div>

              <div className="group relative h-full overflow-hidden rounded-[2.75rem] border border-white/70 bg-white/90 p-4 shadow-[0_40px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/72 via-slate-900/10 to-transparent opacity-90" />

                <img
                  src={heroImages.gymnastAction}
                  alt="Gymnast in action"
                  referrerPolicy="no-referrer"
                  className="h-full w-full rounded-[2.1rem] object-cover transition-transform duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-x-8 bottom-8 z-10 space-y-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-md">
                      Live Event
                    </span>
                    <div className="flex -space-x-2">
                      {heroImages.attendeeAvatars.map((avatar, index) => (
                        <div
                          key={avatar}
                          className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white/80 shadow-sm"
                        >
                          <img
                            src={avatar}
                            alt={`Attendee ${index + 1}`}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-violet-600 text-[10px] font-bold text-white shadow-sm">
                        +12
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2
                      className="max-w-[12ch] text-3xl font-bold leading-tight tracking-[-0.03em] text-white sm:text-[2rem]"
                      style={{ color: "#fff", fontFamily: "inherit" }}
                    >
                      2026 Regional Gymnastics Invitational
                    </h2>
                  </div>

                  <div className="grid gap-3 text-sm font-medium text-white/90 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-violet-300" />
                      <span>Apr 18-20, 2027</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPinned className="h-4 w-4 text-violet-300" />
                      <span>Aurora Convention Hall</span>
                    </div>
                  </div>

                  {isAuthenticated ? (
                    <Link
                      href="/event/gymnastics"
                      className="inline-flex w-full items-center justify-center rounded-[1.2rem] bg-white px-6 py-4 text-base font-semibold text-slate-900 shadow-lg transition hover:bg-violet-600 hover:text-white"
                    >
                      Digitize Your Meet
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openAuth("signup")}
                      className="inline-flex w-full items-center justify-center rounded-[1.2rem] bg-white px-6 py-4 text-base font-semibold text-slate-900 shadow-lg transition hover:bg-violet-600 hover:text-white"
                    >
                      Digitize Your Meet
                    </button>
                  )}
                </div>
              </div>

              <div
                className="absolute -right-3 top-8 hidden rounded-[1.75rem] border border-white/70 bg-white/88 p-4 shadow-[0_20px_44px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:block lg:-right-10"
                style={{
                  animation: "gymnasticsHeroFloatUp 4.2s ease-in-out infinite",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                    <Check className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                      Status
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      Updates Ready
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="absolute -left-3 bottom-20 hidden rounded-[1.75rem] border border-white/70 bg-white/88 p-4 shadow-[0_20px_44px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:block lg:-left-14"
                style={{
                  animation: "gymnasticsHeroFloatDown 5s ease-in-out infinite",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                      Attendees
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      1,240 Registered
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-[1400px] px-4 pb-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-2xl flex-wrap items-start justify-center gap-x-14 gap-y-6 border-t border-slate-200/70 pt-8 text-center">
            {heroStats.map((stat, index) => (
              <div key={stat.label} className="min-w-[120px]">
                <p className="text-3xl font-extrabold tracking-[-0.04em] text-slate-900">
                  <HeroStatValue
                    value={stat.value}
                    suffix={stat.suffix}
                    duration={1400}
                    delay={index * 120}
                  />
                </p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TRUST STRIP ═══ */}
      <section className="border-y border-slate-100 bg-white/60 py-6 backdrop-blur-sm">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Built for
            </p>
            {trustItems.map((item) => (
              <span
                key={item}
                className="text-sm font-semibold text-slate-400 transition hover:text-slate-600"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section
        id="features"
        className="relative isolate scroll-mt-20 bg-[#fafbfe] py-20 lg:py-28"
      >
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          {/* section header */}
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">
              Core Features
            </p>
            <h2
              className="mt-4 text-[clamp(2rem,4vw,3.2rem)] font-bold leading-[1.1] tracking-tight text-slate-900"
              style={{ fontFamily: "inherit" }}
            >
              Everything gymnastics families actually need, in one page
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-500 sm:text-lg">
              No more hunting through PDF packets, email threads, and group
              chats. Envitefy surfaces the right details for every audience.
            </p>
          </div>

          {/* feature grid (flip cards) */}
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <FeatureFlipCard key={f.title} f={f} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section
        id="how-it-works"
        className="scroll-mt-20 bg-gradient-to-b from-slate-50 to-white py-20 lg:py-28"
      >
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">
              How It Works
            </p>
            <h2
              className="mt-4 text-[clamp(2rem,4vw,3.2rem)] font-bold leading-[1.1] tracking-tight text-slate-900"
              style={{ fontFamily: "inherit" }}
            >
              Three steps to a polished meet page
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-500">
              Upload once. Organize automatically. Share one link with every
              family, coach, and spectator.
            </p>
          </div>

          <div className="relative mt-14 grid gap-6 lg:grid-cols-3">
            {/* connector line */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-0 right-0 top-[3.5rem] hidden h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent lg:block"
            />

            {[
              {
                step: "01",
                icon: Upload,
                title: "Upload Meet Info",
                copy: "Bring in your meet packet, event rundown, venue details, hotel sheet, and documents.",
              },
              {
                step: "02",
                icon: Sparkles,
                title: "Envitefy Organizes It",
                copy: "We structure everything into the sections gymnastics families need: start times, venue, travel, and updates.",
              },
              {
                step: "03",
                icon: Share2,
                title: "Share One Link",
                copy: "Parents, coaches, athletes, and spectators all use the same polished page — no app download needed.",
              },
            ].map((item) => (
              <article
                key={item.step}
                className="relative rounded-2xl border border-slate-100 bg-white p-7 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-600">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <span className="text-3xl font-bold text-slate-100">
                    {item.step}
                  </span>
                </div>
                <h3
                  className="mt-6 text-xl font-semibold text-slate-900"
                  style={{ fontFamily: "inherit" }}
                >
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  {item.copy}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRODUCT SHOWCASE ═══ */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            {/* left: text */}
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">
                Platform Preview
              </p>
              <h2
                className="mt-4 text-[clamp(2rem,4vw,3.2rem)] font-bold leading-[1.1] tracking-tight text-slate-900"
                style={{ fontFamily: "inherit" }}
              >
                A meet page that feels like a real product, not a PDF
              </h2>
              <p className="mt-5 text-base leading-7 text-slate-500 sm:text-lg">
                Every detail is structured, searchable, and mobile-first.
                Families get the information they need without zooming into
                packets or scrolling through documents.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  {
                    icon: Shield,
                    title: "Always accessible",
                    desc: "No app required. Works on any phone, tablet, or computer.",
                  },
                  {
                    icon: Smartphone,
                    title: "Mobile-first design",
                    desc: "Built for parents checking times while walking into the venue.",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* right: mockup */}
            <div className="relative">
              {/* glow */}
              <div
                aria-hidden="true"
                className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-indigo-100/50 via-violet-50/40 to-fuchsia-100/30 blur-2xl"
              />

              {/* mobile frame */}
              <div className="relative mx-auto max-w-[340px] overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-lg">
                {/* status bar */}
                <div className="flex items-center justify-center bg-slate-900 px-4 py-2">
                  <span className="text-[11px] font-medium text-white/70">
                    envitefy.com
                  </span>
                </div>

                {/* mobile content */}
                <div className="space-y-3 p-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Gymnastics Meet
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      Summit Invitational
                    </p>
                    <p className="text-xs text-slate-500">
                      April 18–20 · Aurora Convention Hall
                    </p>
                  </div>

                  {/* tabs */}
                  <div className="flex gap-1.5 overflow-x-auto">
                    {["Lineup", "Venue", "Hotels", "Info"].map((tab, i) => (
                      <span
                        key={tab}
                        className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold ${
                          i === 0
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {tab}
                      </span>
                    ))}
                  </div>

                  {/* competition card */}
                  <div className="rounded-xl bg-slate-50 p-3.5">
                    <p className="text-xs font-semibold text-slate-600">
                      Competition Block 2 · Level 7 & Xcel Gold
                    </p>
                    <div className="mt-2 space-y-1.5">
                      {[
                        ["Check-in", "7:10 AM"],
                        ["Warm-up", "7:35 AM"],
                        ["Awards", "11:40 AM"],
                      ].map(([lbl, val]) => (
                        <div
                          key={lbl}
                          className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs"
                        >
                          <span className="text-slate-400">{lbl}</span>
                          <span className="font-semibold text-slate-700">
                            {val}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* venue snippet */}
                  <div className="rounded-xl bg-violet-50 p-3.5">
                    <div className="flex items-center gap-2">
                      <MapPinned className="h-4 w-4 text-violet-500" />
                      <p className="text-xs font-semibold text-slate-700">
                        Aurora Convention Hall
                      </p>
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-500">
                      West lobby · Upper balcony seating
                    </p>
                  </div>

                  {/* hotel snippet */}
                  <div className="rounded-xl bg-fuchsia-50 p-3.5">
                    <div className="flex items-center gap-2">
                      <Hotel className="h-4 w-4 text-fuchsia-500" />
                      <p className="text-xs font-semibold text-slate-700">
                        Hotel block closes March 26
                      </p>
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-500">
                      Booking link · Shuttle details
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ USE CASES ═══ */}
      <section
        id="use-cases"
        className="scroll-mt-20 bg-gradient-to-b from-white to-slate-50 py-20 lg:py-28"
      >
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">
              Use Cases
            </p>
            <h2
              className="mt-4 text-[clamp(2rem,4vw,3.2rem)] font-bold leading-[1.1] tracking-tight text-slate-900"
              style={{ fontFamily: "inherit" }}
            >
              Built for everyone at the meet
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-500">
              Parents, coaches, and meet directors all need different details.
              Envitefy keeps one source of truth while presenting the right
              information for each audience.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {useCases.map((uc) => (
              <article
                key={uc.title}
                className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-600 transition-colors group-hover:from-indigo-100 group-hover:to-violet-100">
                  <uc.icon className="h-5 w-5" />
                </div>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                  {uc.eyebrow}
                </p>
                <h3
                  className="mt-2 text-xl font-semibold text-slate-900"
                  style={{ fontFamily: "inherit" }}
                >
                  {uc.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  {uc.copy}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHY ENVITEFY ═══ */}
      <section id="why-envitefy" className="scroll-mt-20 py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/60 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-2xl sm:p-12 lg:p-16">
            {/* subtle radial highlights */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute right-0 top-0 h-[450px] w-[450px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.15),transparent_70%)]" />
              <div className="absolute bottom-0 left-0 h-[350px] w-[350px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.1),transparent_70%)]" />
            </div>

            <div className="relative">
              <div className="mx-auto max-w-2xl text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-400">
                  Why Envitefy
                </p>
                <h2
                  className="mt-4 text-[clamp(2rem,4vw,3.2rem)] font-bold leading-[1.1] tracking-tight text-white"
                  style={{ color: "#fff", fontFamily: "inherit" }}
                >
                  The meet page gymnastics deserves
                </h2>
                <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-400">
                  Gymnastics meet information is too important to live in messy
                  files. Envitefy gives it a home that families, coaches, and
                  organizers can trust.
                </p>
              </div>

              {/* stats grid */}
              <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {whyStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/8 bg-white/5 p-6 text-center backdrop-blur-sm"
                  >
                    <p className="text-4xl font-extrabold text-white">
                      {stat.value}
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-400">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* checklist */}
              <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-2">
                {[
                  "Replace PDF packets with a clean meeting page",
                  "Works on every phone — no app download",
                  "Timeline changes reach everyone instantly",
                  "Venue maps and hotel info in one view",
                  "Share one link across all team channels",
                  "Professional presentation for your organization",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
                      <Check className="h-3 w-3" />
                    </span>
                    <p className="text-sm leading-6 text-slate-300">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="pb-20 pt-4 lg:pb-28">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 p-8 text-center text-white shadow-2xl shadow-indigo-500/20 sm:p-12 lg:p-16">
            {/* refracted glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.1),transparent_35%)]"
            />

            <div className="relative mx-auto max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
                Ready to get started?
              </p>
              <h2
                className="mt-4 text-[clamp(2rem,4.5vw,3.5rem)] font-bold leading-[1.1] tracking-tight text-white"
                style={{ color: "#fff", fontFamily: "inherit" }}
              >
                Make the next gymnastics meet feel polished from the first tap
              </h2>
              <p className="mt-5 text-base leading-7 text-white/80 sm:text-lg">
                Build one premium page for meet details, hotels, maps, and updates
                so every parent, athlete, and coach lands in the same place.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                {isAuthenticated ? (
                  <Link
                    href="/event/gymnastics"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4.5 text-base font-semibold text-indigo-700 shadow-xl shadow-black/10 transition hover:-translate-y-0.5 hover:shadow-2xl"
                  >
                    Start Your Meet Page
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => openAuth("signup")}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4.5 text-base font-semibold text-indigo-700 shadow-xl shadow-black/10 transition hover:-translate-y-0.5 hover:shadow-2xl"
                  >
                    Start Your Meet Page
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
                <a
                  href="#hero"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-8 py-4.5 text-base font-semibold text-white backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/15"
                >
                  Back to Top
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AuthModal
        open={authModalOpen}
        mode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onModeChange={setAuthMode}
        signupSource="gymnastics"
        successRedirectUrl="/event/gymnastics"
      />
    </main>
  );
}
