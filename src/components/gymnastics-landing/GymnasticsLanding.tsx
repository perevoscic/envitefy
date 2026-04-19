"use client";

import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Hotel,
  type LucideIcon,
  MapPinned,
  MessageSquare,
  Share2,
  Shield,
  Smartphone,
  Trophy,
  WandSparkles,
  Upload,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import ScenicBackground, {
  type ScenicScene,
  useActiveScene,
} from "@/components/marketing/ScenicBackground";
import HeroTopNav from "@/components/navigation/HeroTopNav";
import { buildMarketingHeroNav } from "@/components/navigation/marketing-hero-nav";
import AnimatedButtonLabel from "@/components/ui/AnimatedButtonLabel";
import styles from "./GymnasticsLanding.module.css";
import GymnasticsLandingFaq from "./GymnasticsLandingFaq";

const IMAGES = {
  flyer: "/images/gymanstic-1-landing.png",
  event: "/images/gymanstic-2-landing.png",
};

const gymnasticsSectionSpacingClass = "hash-anchor-below-fixed-nav px-4 py-6 sm:px-6 lg:px-8";

const GYMNASTICS_SCENE_ORDER = [
  "hero",
  "features",
  "how-it-works",
  "preview",
  "use-cases",
  "why-envitefy",
  "faq",
] as const;

const GYMNASTICS_SCENES: Record<string, ScenicScene> = {
  hero: {
    veilClassName:
      "bg-[radial-gradient(circle_at_20%_18%,rgba(45,212,191,0.16),transparent_28%),linear-gradient(180deg,rgba(56,189,248,0.08),transparent_72%)]",
    shapes: [
      {
        className:
          "absolute left-[-10rem] top-[-6rem] h-[30rem] w-[30rem] rounded-full bg-[#14B8A6]/14 blur-[150px]",
      },
      {
        className:
          "absolute right-[-6rem] top-[8%] h-[28rem] w-[28rem] rounded-[42%_58%_55%_45%/40%_42%_58%_60%] bg-[#0EA5E9]/18 blur-[150px]",
      },
      {
        className:
          "theme-glass-ornament absolute right-[18%] top-[32%] h-[12rem] w-[12rem] rounded-[2.5rem] border border-white/10 rotate-12",
      },
    ],
  },
  features: {
    veilClassName:
      "bg-[radial-gradient(circle_at_80%_18%,rgba(14,165,233,0.14),transparent_24%),linear-gradient(180deg,rgba(124,58,237,0.08),transparent_74%)]",
    shapes: [
      {
        className:
          "absolute left-[6%] top-[18%] h-[24rem] w-[24rem] rounded-full bg-[#38BDF8]/12 blur-[150px]",
      },
      {
        className:
          "absolute right-[4%] top-[14%] h-[24rem] w-[24rem] rounded-[56%_44%_44%_56%/46%_54%_46%_54%] bg-[#A855F7]/12 blur-[145px]",
      },
    ],
  },
  "how-it-works": {
    veilClassName:
      "bg-[radial-gradient(circle_at_24%_18%,rgba(129,140,248,0.16),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_68%)]",
    shapes: [
      {
        className:
          "absolute left-[10%] top-[20%] h-[22rem] w-[22rem] rounded-full bg-[#818CF8]/14 blur-[145px]",
      },
      {
        className:
          "theme-glass-ornament absolute right-[18%] bottom-[12%] h-[10rem] w-[22rem] rounded-full border border-white/10",
      },
    ],
  },
  preview: {
    veilClassName:
      "bg-[radial-gradient(circle_at_70%_18%,rgba(244,114,182,0.12),transparent_22%),linear-gradient(180deg,rgba(124,58,237,0.08),transparent_72%)]",
    shapes: [
      {
        className:
          "absolute right-[-6rem] top-[18%] h-[26rem] w-[26rem] rounded-full bg-[#EC4899]/10 blur-[155px]",
      },
      {
        className:
          "absolute left-[12%] bottom-[-8rem] h-[22rem] w-[22rem] rounded-[45%_55%_63%_37%/49%_37%_63%_51%] bg-[#14B8A6]/12 blur-[145px]",
      },
    ],
  },
  "use-cases": {
    veilClassName:
      "bg-[radial-gradient(circle_at_50%_0%,rgba(167,139,250,0.14),transparent_26%),linear-gradient(180deg,rgba(45,212,191,0.06),transparent_70%)]",
    shapes: [
      {
        className:
          "absolute left-[14%] top-[14%] h-[24rem] w-[24rem] rounded-full bg-[#8B5CF6]/12 blur-[150px]",
      },
      {
        className:
          "absolute right-[6%] top-[18%] h-[20rem] w-[20rem] rounded-[61%_39%_43%_57%/42%_58%_42%_58%] bg-[#2DD4BF]/10 blur-[145px]",
      },
    ],
  },
  "why-envitefy": {
    veilClassName:
      "bg-[radial-gradient(circle_at_28%_16%,rgba(56,189,248,0.16),transparent_26%),linear-gradient(180deg,rgba(124,58,237,0.1),transparent_70%)]",
    shapes: [
      {
        className:
          "absolute left-[-4rem] top-[12%] h-[22rem] w-[22rem] rounded-full bg-[#38BDF8]/14 blur-[145px]",
      },
      {
        className:
          "absolute right-[8%] top-[12%] h-[28rem] w-[28rem] rounded-[42%_58%_56%_44%/56%_42%_58%_44%] bg-[#7C3AED]/14 blur-[155px]",
      },
    ],
  },
  faq: {
    veilClassName:
      "bg-[radial-gradient(circle_at_68%_20%,rgba(165,180,252,0.16),transparent_26%),linear-gradient(180deg,rgba(124,58,237,0.08),transparent_72%)]",
    shapes: [
      {
        className:
          "absolute left-[8%] top-[18%] h-[20rem] w-[20rem] rounded-full bg-[#A5B4FC]/14 blur-[145px]",
      },
      {
        className:
          "theme-glass-ornament absolute right-[18%] bottom-[12%] h-[11rem] w-[11rem] rounded-2xl border border-white/10",
      },
    ],
  },
};

const glassSectionClass =
  "theme-glass-surface relative isolate overflow-hidden rounded-[2rem] border border-white/14 shadow-[0_32px_90px_rgba(4,1,14,0.42)]";
const sectionBubbleClass =
  "mb-5 inline-flex rounded-full border border-white/28 bg-[rgba(32,18,58,0.62)] px-4 py-2 text-[0.68rem] font-bold uppercase tracking-[0.28em] text-white shadow-[0_12px_28px_rgba(6,2,16,0.22)]";
const cardBubbleClass =
  "absolute left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/30 bg-white px-4 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[#140a27] shadow-[0_14px_34px_rgba(5,1,16,0.28)]";

const features = [
  {
    icon: CalendarDays,
    title: "Meet Details",
    desc: "Start times, warm-ups, rotations, and awards timing in a layout parents can scan in seconds.",
  },
  {
    icon: Hotel,
    title: "Travel and Hotels",
    desc: "Keep booking links, block deadlines, parking, and shuttle notes with the meet details.",
  },
  {
    icon: Users,
    title: "Team Coordination",
    desc: "Give coaches, athletes, and families one authoritative page instead of scattered messages.",
  },
  {
    icon: MessageSquare,
    title: "Live Updates",
    desc: "Schedule shifts and announcements are posted once and visible everywhere the link is shared.",
  },
] as const;

const steps = [
  {
    step: "01",
    icon: Upload,
    title: "Upload the meet information",
    copy: "Bring in the meet packet, event rundown, venue notes, hotel sheet, and supporting documents.",
  },
  {
    step: "02",
    icon: WandSparkles,
    title: "Envitefy structures the weekend",
    copy: "We turn the packet into sections families actually use: sessions, venue, travel, documents, and updates.",
  },
  {
    step: "03",
    icon: Share2,
    title: "Share one polished page",
    copy: "Parents, coaches, athletes, and spectators all open the same mobile-ready page in the browser.",
  },
] as const;

const useCases = [
  {
    eyebrow: "For parents",
    icon: Smartphone,
    title: "Know exactly what to expect",
    copy: "One link with start times, venue directions, parking, and spectator info instead of digging through emails and PDFs.",
  },
  {
    eyebrow: "For coaches",
    icon: Share2,
    title: "Share the latest plan once",
    copy: "Stop resending updated packets. Publish once and every family gets the same current information.",
  },
  {
    eyebrow: "For meet directors",
    icon: Trophy,
    title: "Present a more polished event",
    copy: "Give your meet a public page with schedules, venue maps, hotel blocks, and spectator guidance in one place.",
  },
] as const;

const whyStats = [
  { value: "1", label: "page for every meet" },
  { value: "5x", label: "faster than PDF packet hunting" },
  { value: "100%", label: "browser-based access" },
  { value: "0", label: "app installs required" },
] as const;

const gymnasticsHeroNavLinks = buildMarketingHeroNav("gymnastics", [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Preview", href: "#preview" },
  { label: "Use cases", href: "#use-cases" },
  { label: "Why Envitefy", href: "#why-envitefy" },
  { label: "FAQ", href: "#faq" },
]);

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function useRevealOnce() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || visible || typeof window === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { threshold: 0.18, rootMargin: "0px 0px 18% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);
  return { ref, visible };
}

function CtaButton({
  label,
  href,
  onClick,
  light = false,
}: {
  label: string;
  href?: string;
  onClick?: () => void;
  light?: boolean;
}) {
  const className = light
    ? "cta-shell flex h-14 w-full items-center justify-center rounded-full border border-white/16 bg-white/[0.08] px-8 text-lg font-bold text-white transition-all hover:bg-white/[0.12] sm:w-auto"
    : `${styles.btnRolling} cta-shell flex h-14 w-full items-center justify-center rounded-full bg-white px-8 text-lg font-bold text-[#140a27] shadow-[0_18px_40px_rgba(255,255,255,0.16)] transition-all hover:bg-[#f4ecff] sm:w-auto`;
  const content = <AnimatedButtonLabel label={label} icon={ArrowRight} className="gap-2" />;
  if (href?.startsWith("#"))
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  if (href)
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

function Card({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <article className="rounded-[1.7rem] border border-white/12 bg-white/[0.06] p-7">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className={`${styles.headline} mt-6 text-2xl font-bold tracking-tight text-white`}>
        {title}
      </h3>
      <p className="mt-3 text-base leading-relaxed text-white/80">{body}</p>
    </article>
  );
}

export default function GymnasticsLanding() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const activeScene = useActiveScene(GYMNASTICS_SCENE_ORDER, "hero");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const { ref: heroVisualRef, visible: heroVisualVisible } = useRevealOnce();
  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div
      className={`${styles.root} relative z-[1] isolate min-h-screen overflow-x-clip bg-transparent text-white selection:bg-white/20 selection:text-white`}
    >
      <ScenicBackground scene={activeScene} scenes={GYMNASTICS_SCENES} />
      <HeroTopNav
        navLinks={gymnasticsHeroNavLinks}
        variant="glass-dark"
        primaryCtaLabel="Start Your Meet Page"
        authenticatedPrimaryHref="/"
        loginSuccessRedirectUrl="/"
        onGuestLoginAction={() => openAuth("login")}
        onGuestPrimaryAction={() => openAuth("signup")}
      />

      <section
        id="hero"
        className="hash-anchor-below-fixed-nav px-4 pb-6 pt-32 sm:px-6 lg:px-8 lg:pt-40"
      >
        <div className="mx-auto max-w-7xl">
          <div
            className={`${glassSectionClass} ${styles.sectionShell} px-7 py-8 md:px-10 md:py-12 lg:px-14 lg:py-16`}
          >
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03)_40%,rgba(45,212,191,0.06)_100%)]" />
            <div className="absolute -left-24 bottom-[-5rem] h-72 w-72 rounded-full bg-[#22D3EE]/16 blur-[140px]" />
            <div className="absolute right-[-6rem] top-[-3rem] h-72 w-72 rounded-full bg-[#8B5CF6]/18 blur-[150px]" />
            <div className="relative grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-center">
              <div className="max-w-3xl">
                <span className={sectionBubbleClass}>Gymnastics Meet Pages</span>
                <h1
                  className={`${styles.headline} mb-8 text-5xl font-light leading-[0.94] tracking-tight text-white sm:text-6xl lg:text-[6rem]`}
                >
                  Turn a meet packet into a
                  <span className="mt-4 block font-serif text-4xl italic leading-tight text-white/92 sm:text-5xl lg:text-[4.15rem]">
                    {" "}
                    polished page families can actually use
                  </span>
                </h1>
                <p className="max-w-2xl text-lg leading-relaxed text-white/82 md:text-[1.28rem] md:leading-[1.55]">
                  Envitefy takes the schedules, venue notes, hotel blocks, parking guidance,
                  documents, and updates that usually live in separate files and turns them into one
                  mobile-ready meet hub.
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-start">
                  <CtaButton
                    label="Start Your Meet Page"
                    href={isAuthenticated ? "/" : undefined}
                    onClick={isAuthenticated ? undefined : () => openAuth("signup")}
                  />
                  <CtaButton label="See How It Works" href="#how-it-works" light />
                </div>
                <div className="mt-8 grid gap-3 text-sm font-medium text-white/76 sm:grid-cols-3">
                  {[
                    "Sessions, rotations, venue, hotels, and updates in one place",
                    "A polished mobile page instead of a stack of PDFs",
                    "One link for families, coaches, athletes, and spectators",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div
                ref={heroVisualRef}
                className="relative flex items-start justify-center gap-4 sm:gap-6 lg:justify-end"
              >
                <div
                  className={cx(
                    styles.cardGroup,
                    styles.heroRevealReady,
                    heroVisualVisible && styles.heroRevealPrimary,
                  )}
                >
                  <div className={`${cardBubbleClass} -top-5 text-[#0EA5E9]`}>Meet Packet</div>
                  <div
                    className={`${styles.heroSnapCard} w-[7.8rem] overflow-hidden rounded-[1.35rem] shadow-[0_26px_58px_rgba(3,0,12,0.3)] sm:w-52`}
                  >
                    <img
                      src={IMAGES.flyer}
                      alt="Gymnastics meet packet preview"
                      className="block h-auto w-full scale-[1.08] rounded-[1.35rem]"
                    />
                  </div>
                </div>
                <div
                  className={cx(
                    "hidden flex-col items-center gap-2 sm:flex",
                    styles.heroRevealReady,
                    heroVisualVisible && styles.heroRevealCenter,
                  )}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-white shadow-inner">
                    <WandSparkles className="h-4 w-4" />
                  </div>
                  <div className="h-14 w-px bg-gradient-to-b from-white/40 to-transparent" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-white">
                    Organized by Envitefy
                  </span>
                </div>
                <div
                  className={cx(
                    styles.cardGroup,
                    styles.heroRevealReady,
                    heroVisualVisible && styles.heroRevealSecondary,
                  )}
                >
                  <div className={`${cardBubbleClass} -top-5 border-white/24 text-[#140a27]`}>
                    Live Meet Page
                  </div>
                  <div
                    className={`${styles.heroLiveCard} w-[8.8rem] overflow-hidden rounded-[1.75rem] shadow-[0_30px_64px_rgba(3,0,12,0.34)] sm:w-56 sm:rounded-[2.4rem]`}
                  >
                    <img
                      src={IMAGES.event}
                      alt="Gymnastics meet page preview"
                      className="h-auto w-full rounded-[1.75rem] sm:rounded-[2.4rem]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className={gymnasticsSectionSpacingClass}>
        <div
          className={`mx-auto max-w-7xl ${glassSectionClass} ${styles.sectionShell} px-7 py-8 md:px-10 md:py-10`}
        >
          <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(14,165,233,0.06),rgba(124,58,237,0.03)_45%,transparent)]" />
          <div className="relative">
            <div className="mx-auto max-w-3xl text-center">
              <span className={sectionBubbleClass}>Core Features</span>
              <h2
                className={`${styles.headline} text-4xl font-bold tracking-tight text-white lg:text-5xl`}
              >
                Everything gymnastics families actually need, in one page
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/82">
                No more packet table spelunking, blurry screenshots, or repeated questions in the
                group chat.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {features.map((item) => (
                <Card key={item.title} icon={item.icon} title={item.title} body={item.desc} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className={gymnasticsSectionSpacingClass}>
        <div
          className={`mx-auto max-w-7xl ${glassSectionClass} ${styles.sectionShell} px-7 py-8 md:px-10 md:py-10`}
        >
          <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(99,102,241,0.08),transparent_40%,rgba(45,212,191,0.05))]" />
          <div className="relative">
            <div className="mx-auto max-w-3xl text-center">
              <span className={sectionBubbleClass}>How It Works</span>
              <h2
                className={`${styles.headline} text-4xl font-bold tracking-tight text-white lg:text-5xl`}
              >
                Three steps to a polished meet page
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/82">
                Upload once, review the structure, and share one clean link with every family.
              </p>
            </div>
            <div className="relative mt-12 grid gap-6 lg:grid-cols-3">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-0 right-0 top-[3.6rem] hidden h-px bg-gradient-to-r from-transparent via-white/30 to-transparent lg:block"
              />
              {steps.map((item) => (
                <article
                  key={item.step}
                  className="relative rounded-[1.8rem] border border-white/12 bg-white/[0.06] p-7"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <span className="text-3xl font-bold text-white/14">{item.step}</span>
                  </div>
                  <h3
                    className={`${styles.headline} mt-6 text-2xl font-bold tracking-tight text-white`}
                  >
                    {item.title}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-white/78">{item.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="preview" className={gymnasticsSectionSpacingClass}>
        <div
          className={`mx-auto max-w-7xl ${glassSectionClass} ${styles.sectionShell} px-7 py-8 md:px-10 md:py-10`}
        >
          <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(251,113,133,0.06),transparent_36%,rgba(124,58,237,0.08))]" />
          <div className="relative grid items-center gap-12 lg:grid-cols-[1fr_minmax(18rem,22rem)]">
            <div className="max-w-3xl">
              <span className={sectionBubbleClass}>Preview</span>
              <h2
                className={`${styles.headline} text-4xl font-bold tracking-tight text-white lg:text-5xl`}
              >
                A meet page that feels like a real product, not a PDF packet
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/82">
                Families get the weekend in a format they can actually scan on mobile: timeline,
                venue details, hotel info, links, and updates.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <Card
                  icon={Shield}
                  title="Always accessible"
                  body="No app required. Open it from text, email, or team channels."
                />
                <Card
                  icon={Smartphone}
                  title="Mobile-first"
                  body="Built for parents checking times while walking into the venue."
                />
                <Card
                  icon={MapPinned}
                  title="Venue-ready"
                  body="Parking, entrances, and maps sit next to the competition timeline."
                />
                <Card
                  icon={CheckCircle2}
                  title="Updatable"
                  body="Post changes once and keep the same link in circulation."
                />
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-[22rem]">
              <div className="absolute -inset-6 rounded-[2.4rem] bg-[radial-gradient(circle,rgba(255,255,255,0.14),transparent_68%)] blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-[#120d22]/82 p-4 shadow-[0_30px_70px_rgba(3,0,12,0.34)]">
                <div className="rounded-[1.5rem] border border-white/10 bg-white p-4 text-[#17132b]">
                  <p className="text-[0.62rem] font-bold uppercase tracking-[0.24em] text-[#8f74eb]">
                    Live meet page
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold">Summit Invitational</h3>
                  <p className="mt-1 text-sm text-[#5f5875]">
                    April 18-20 · Aurora Convention Hall
                  </p>
                  <div className="mt-4 flex gap-2 overflow-x-auto">
                    {["Sessions", "Venue", "Hotels", "Info"].map((tab, index) => (
                      <span
                        key={tab}
                        className={cx(
                          "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold",
                          index === 0 ? "bg-[#7c3aed] text-white" : "bg-[#f4f0ff] text-[#5c4b91]",
                        )}
                      >
                        {tab}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 rounded-[1.3rem] bg-[#faf7ff] p-4">
                    <p className="text-xs font-semibold text-[#5b4b85]">
                      Session 3 · Level 7 and Xcel Platinum
                    </p>
                    <div className="mt-3 space-y-2">
                      {[
                        ["Coach check-in", "7:20 AM"],
                        ["Warm-up", "7:45 AM"],
                        ["Awards", "11:40 AM"],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="flex items-center justify-between rounded-2xl border border-[#ede4ff] bg-white px-3 py-2 text-xs"
                        >
                          <span className="text-[#685d82]">{label}</span>
                          <span className="font-semibold text-[#241c44]">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="use-cases" className={gymnasticsSectionSpacingClass}>
        <div
          className={`mx-auto max-w-7xl ${glassSectionClass} ${styles.sectionShell} px-7 py-8 md:px-10 md:py-10`}
        >
          <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(45,212,191,0.06),transparent_36%,rgba(124,58,237,0.08))]" />
          <div className="relative">
            <div className="mx-auto max-w-3xl text-center">
              <span className={sectionBubbleClass}>Use Cases</span>
              <h2
                className={`${styles.headline} text-4xl font-bold tracking-tight text-white lg:text-5xl`}
              >
                Built for the people actually running the weekend
              </h2>
            </div>
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {useCases.map((item) => (
                <article
                  key={item.title}
                  className="rounded-[1.8rem] border border-white/12 bg-white/[0.06] p-7"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <p className="mt-6 text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-white/58">
                    {item.eyebrow}
                  </p>
                  <h3
                    className={`${styles.headline} mt-3 text-2xl font-bold tracking-tight text-white`}
                  >
                    {item.title}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-white/80">{item.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="why-envitefy" className={gymnasticsSectionSpacingClass}>
        <div
          className={`mx-auto max-w-7xl ${glassSectionClass} ${styles.sectionShell} px-7 py-10 text-center md:px-12 md:py-14`}
        >
          <div className="absolute -right-10 -top-10 p-12 text-white opacity-[0.05]">
            <WandSparkles size={240} />
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02)_45%,rgba(124,58,237,0.1))]" />
          <div className="relative z-10">
            <span className={sectionBubbleClass}>Why Envitefy</span>
            <h2
              className={`${styles.headline} mx-auto max-w-4xl text-[2rem] font-extrabold leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-6xl`}
            >
              The meet page gymnastics deserves
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/82 md:text-xl">
              Keep the full weekend organized in one polished destination instead of asking families
              to decode the packet on their own.
            </p>
            <div className="mt-10 grid gap-4 md:grid-cols-4">
              {whyStats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.7rem] border border-white/12 bg-white/[0.06] px-6 py-7"
                >
                  <div
                    className={`${styles.headline} text-4xl font-bold tracking-tight text-white`}
                  >
                    {item.value}
                  </div>
                  <p className="mt-2 text-sm font-medium leading-6 text-white/74">{item.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <CtaButton
                label="Start Your Meet Page"
                href={isAuthenticated ? "/" : undefined}
                onClick={isAuthenticated ? undefined : () => openAuth("signup")}
              />
              <CtaButton label="See Snap" href="/snap" light />
            </div>
          </div>
        </div>
      </section>

      <GymnasticsLandingFaq />

      <AuthModal
        open={authModalOpen}
        mode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onModeChange={setAuthMode}
        signupSource="gymnastics"
        allowSignupSwitch={false}
        successRedirectUrl="/"
      />
    </div>
  );
}
