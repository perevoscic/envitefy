"use client";

import {
  Baby,
  Cake,
  CalendarCheck,
  CalendarPlus,
  Camera,
  CheckCircle2,
  Clock,
  Copy,
  Edit3,
  FileEdit,
  Heart,
  type LucideIcon,
  MapPin,
  Share2,
  Sparkles,
  TowerControl,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useEffect, useRef, useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import ScenicBackground, {
  type ScenicScene,
  useActiveScene,
} from "@/components/marketing/ScenicBackground";
import HeroTopNav from "@/components/navigation/HeroTopNav";
import AnimatedButtonLabel from "@/components/ui/AnimatedButtonLabel";
import styles from "./LandingExperience.module.css";
import LandingFaq from "./sections/LandingFaq";

const IMAGES = {
  heroFlyer: "/images/hero-1-landing.png",
  heroEvent: "/images/hero-2-landing.png",
  birthdayFlyer: "/images/birthday-1-landing.png",
  birthdayEvent: "/images/birthday-2-landing.png",
  gymnasticsFlyer: "/images/gymanstic-1-landing.png",
  gymnasticsEvent: "/images/gymanstic-2-landing.png",
  weddingFlyer: "/images/wedding-1-landing.png",
  weddingEvent: "/images/wedding-2-landing.png",
};

const LANDING_SCENE_ORDER = [
  "snap",
  "gymnastics",
  "what-you-can-snap",
  "how-it-works",
  "use-cases",
  "rsvp-calendar",
  "faq",
] as const;

const LANDING_SCENES: Record<string, ScenicScene> = {
  snap: {
    veilClassName:
      "bg-[radial-gradient(circle_at_top,rgba(167,139,250,0.18),transparent_35%),linear-gradient(180deg,rgba(64,32,121,0.24),transparent_72%)]",
    shapes: [
      {
        className:
          "absolute left-[-10rem] top-[-8rem] h-[30rem] w-[30rem] rounded-full bg-[#7C3AED]/28 blur-[150px]",
      },
      {
        className:
          "absolute right-[-8rem] top-[12%] h-[28rem] w-[28rem] rounded-[40%_60%_59%_41%/49%_38%_62%_51%] bg-[#4F46E5]/24 blur-[150px]",
      },
      {
        className:
          "absolute bottom-[-10rem] left-[18%] h-[26rem] w-[26rem] rounded-[62%_38%_44%_56%/45%_58%_42%_55%] bg-[#EC4899]/14 blur-[140px]",
      },
      {
        className:
          "absolute right-[18%] top-[34%] h-[14rem] w-[14rem] rounded-[2.6rem] border border-white/10 bg-white/[0.05] rotate-12 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]",
      },
    ],
  },
  gymnastics: {
    veilClassName:
      "bg-[radial-gradient(circle_at_25%_28%,rgba(45,212,191,0.2),transparent_30%),linear-gradient(180deg,rgba(56,189,248,0.1),transparent_68%)]",
    shapes: [
      {
        className:
          "absolute left-[4%] top-[18%] h-[24rem] w-[24rem] rounded-[42%_58%_53%_47%/41%_41%_59%_59%] bg-[#0EA5E9]/20 blur-[145px]",
      },
      {
        className:
          "absolute right-[2%] top-[10%] h-[26rem] w-[26rem] rounded-full bg-[#14B8A6]/16 blur-[150px]",
      },
      {
        className:
          "absolute bottom-[-8rem] right-[18%] h-[24rem] w-[24rem] rounded-[56%_44%_66%_34%/44%_60%_40%_56%] bg-[#7C3AED]/18 blur-[140px]",
      },
      {
        className:
          "absolute left-[16%] bottom-[12%] h-[10rem] w-[22rem] rounded-full border border-white/8 bg-white/[0.04] blur-[1px]",
      },
    ],
  },
  "what-you-can-snap": {
    veilClassName:
      "bg-[radial-gradient(circle_at_70%_18%,rgba(251,191,36,0.12),transparent_24%),linear-gradient(180deg,rgba(124,58,237,0.08),transparent_70%)]",
    shapes: [
      {
        className:
          "absolute left-[-6rem] top-[22%] h-[22rem] w-[22rem] rounded-[44%_56%_61%_39%/42%_40%_60%_58%] bg-[#FB7185]/14 blur-[145px]",
      },
      {
        className:
          "absolute right-[-6rem] top-[20%] h-[24rem] w-[24rem] rounded-full bg-[#7C3AED]/18 blur-[150px]",
      },
      {
        className:
          "absolute bottom-[-10rem] left-[30%] h-[28rem] w-[28rem] rounded-[66%_34%_49%_51%/45%_55%_45%_55%] bg-[#8B5CF6]/18 blur-[150px]",
      },
      {
        className:
          "absolute right-[16%] bottom-[16%] h-[11rem] w-[11rem] rounded-full border border-white/10 bg-white/[0.05] backdrop-blur-3xl",
      },
    ],
  },
  "how-it-works": {
    veilClassName:
      "bg-[radial-gradient(circle_at_25%_18%,rgba(99,102,241,0.18),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_62%)]",
    shapes: [
      {
        className:
          "absolute left-[8%] top-[12%] h-[22rem] w-[22rem] rounded-full bg-[#6366F1]/22 blur-[145px]",
      },
      {
        className:
          "absolute right-[8%] top-[34%] h-[26rem] w-[26rem] rounded-[48%_52%_37%_63%/46%_46%_54%_54%] bg-[#7C3AED]/18 blur-[150px]",
      },
      {
        className:
          "absolute bottom-[-8rem] left-[30%] h-[20rem] w-[20rem] rounded-[2.8rem] border border-white/10 bg-white/[0.04] rotate-6 backdrop-blur-3xl",
      },
    ],
  },
  "use-cases": {
    veilClassName:
      "bg-[radial-gradient(circle_at_50%_0%,rgba(232,121,249,0.16),transparent_26%),linear-gradient(180deg,rgba(91,33,182,0.16),transparent_70%)]",
    shapes: [
      {
        className:
          "absolute left-[12%] top-[14%] h-[26rem] w-[26rem] rounded-full bg-[#A855F7]/18 blur-[155px]",
      },
      {
        className:
          "absolute right-[6%] top-[16%] h-[22rem] w-[22rem] rounded-[61%_39%_43%_57%/42%_58%_42%_58%] bg-[#EC4899]/14 blur-[145px]",
      },
      {
        className:
          "absolute bottom-[-6rem] right-[26%] h-[24rem] w-[24rem] rounded-[42%_58%_56%_44%/56%_42%_58%_44%] bg-[#7C3AED]/18 blur-[150px]",
      },
      {
        className:
          "absolute left-[18%] bottom-[12%] h-[12rem] w-[12rem] rounded-full border border-white/10 bg-white/[0.05] backdrop-blur-3xl",
      },
    ],
  },
  "rsvp-calendar": {
    veilClassName:
      "bg-[radial-gradient(circle_at_20%_12%,rgba(244,114,182,0.14),transparent_24%),linear-gradient(180deg,rgba(124,58,237,0.12),transparent_70%)]",
    shapes: [
      {
        className:
          "absolute left-[-5rem] top-[18%] h-[24rem] w-[24rem] rounded-full bg-[#F472B6]/14 blur-[150px]",
      },
      {
        className:
          "absolute right-[0%] top-[8%] h-[30rem] w-[30rem] rounded-[39%_61%_56%_44%/42%_47%_53%_58%] bg-[#7C3AED]/20 blur-[160px]",
      },
      {
        className:
          "absolute bottom-[-8rem] left-[26%] h-[22rem] w-[22rem] rounded-[60%_40%_40%_60%/40%_53%_47%_60%] bg-[#818CF8]/18 blur-[150px]",
      },
      {
        className:
          "absolute right-[18%] bottom-[12%] h-[10rem] w-[20rem] rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-3xl",
      },
    ],
  },
  faq: {
    veilClassName:
      "bg-[radial-gradient(circle_at_70%_20%,rgba(165,180,252,0.16),transparent_30%),linear-gradient(180deg,rgba(124,58,237,0.1),transparent_68%)]",
    shapes: [
      {
        className:
          "absolute left-[8%] top-[16%] h-[22rem] w-[22rem] rounded-full bg-[#818CF8]/18 blur-[150px]",
      },
      {
        className:
          "absolute right-[4%] top-[22%] h-[26rem] w-[26rem] rounded-[52%_48%_48%_52%/42%_58%_42%_58%] bg-[#7C3AED]/16 blur-[155px]",
      },
      {
        className:
          "absolute bottom-[-8rem] left-[28%] h-[24rem] w-[24rem] rounded-full bg-[#C4B5FD]/12 blur-[145px]",
      },
      {
        className:
          "absolute right-[20%] bottom-[14%] h-[11rem] w-[11rem] rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-3xl",
      },
    ],
  },
};

const useCases = [
  {
    icon: Baby,
    title: "Baby Showers",
    desc: "Organize dates, addresses, and details from social media flyers instantly.",
  },
  {
    icon: Trophy,
    title: "Sports Schedules",
    desc: "Upload whole team calendars and turn them into polished, mobile-friendly event pages.",
  },
  {
    icon: Users,
    title: "Community Events",
    desc: "Markets, town halls, or block parties get one clean link for updates, maps, and RSVPs.",
  },
] as const;

const benefits = [
  {
    icon: Zap,
    title: "Skip Manual Setup",
    desc: "Dates, addresses, and event details are pulled into a structure you can review instead of retyping from scratch.",
  },
  {
    icon: TowerControl,
    title: "Printed to Digital",
    desc: "Paper flyers, screenshots, and PDFs become a clear mobile-first destination instead of a blurry attachment.",
  },
  {
    icon: Share2,
    title: "Easy Sharing",
    desc: "One polished link replaces photo dumps, copy-pasted notes, and repeated questions in the group chat.",
  },
  {
    icon: CalendarCheck,
    title: "Collect RSVPs",
    desc: "Let guests respond instantly and keep the guest list in one place without another tool.",
  },
  {
    icon: CalendarPlus,
    title: "Instant Save-the-Date",
    desc: "Guests can add the event to their calendar in one tap from the live page.",
  },
  {
    icon: FileEdit,
    title: "Live Updates",
    desc: "If plans change, update the page once and the latest details stay in front of everyone.",
  },
] as const;

const rsvpHighlights = [
  "One-tap RSVP from mobile",
  "Auto-fill calendar invites",
  "Smart maps and directions",
] as const;

const gymnasticsHighlights = [
  {
    icon: CalendarCheck,
    title: "Meet Details",
    desc: "Keep schedules, notes, and meet-day updates on one page that families can actually follow.",
  },
  {
    icon: Trophy,
    title: "Hotels",
    desc: "Attach hotel blocks, booking links, and stay info right next to the event details.",
  },
  {
    icon: MapPin,
    title: "Venue and Parking Info",
    desc: "Share maps, entrances, and parking guidance without burying them in texts.",
  },
  {
    icon: Users,
    title: "Attendance Tracking",
    desc: "Track coaches, volunteers, and family attendance with the same polished page.",
  },
] as const;

/** Single backdrop-filter per glass section; inner panels use opaque tints only. */
const glassSectionClass =
  "relative isolate overflow-hidden rounded-[2rem] border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.2),rgba(255,255,255,0.1))] shadow-[0_32px_90px_rgba(4,1,14,0.42),inset_0_1px_0_rgba(255,255,255,0.28)] backdrop-blur-2xl [-webkit-backdrop-filter:blur(40px)]";

const sectionBubbleClass =
  "mb-5 inline-flex rounded-full border border-white/28 bg-[rgba(32,18,58,0.62)] px-4 py-2 text-[0.68rem] font-bold uppercase tracking-[0.28em] text-white shadow-[0_12px_28px_rgba(6,2,16,0.22)]";

const cardBubbleClass =
  "absolute left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/30 bg-white px-4 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[#140a27] shadow-[0_14px_34px_rgba(5,1,16,0.28)]";

const floatingBubbleClass =
  "flex items-center gap-2 rounded-full border border-white/22 bg-[rgba(19,11,38,0.85)] px-4 py-3 shadow-[0_24px_50px_rgba(3,0,12,0.28)] sm:gap-4 sm:px-8 sm:py-5";

interface Step {
  id: number;
  title: string;
  description: string;
  icon: ReactNode;
  visual: ReactNode;
}

const steps: Step[] = [
  {
    id: 1,
    title: "Snap or Upload",
    description:
      "Take a photo, drag in a PDF, or upload a flyer from your camera roll and let the first pass happen automatically.",
    icon: <Camera className="h-6 w-6" />,
    visual: (
      <div className="relative flex aspect-[4/3] w-full flex-col items-center justify-center overflow-hidden rounded-[1.75rem] border border-white/15 bg-white/[0.08] p-6 shadow-[0_20px_40px_rgba(5,1,16,0.28)]">
        <div className="absolute left-5 top-4 text-[10px] font-bold tracking-[0.28em] text-white uppercase">
          Camera Mode
        </div>
        <div className="absolute right-5 top-4">
          <Camera className="h-4 w-4 text-white" />
        </div>
        <div className="mt-4 flex h-full w-full flex-col items-center justify-center rounded-[1.4rem] border border-dashed border-white/20 bg-[#7C3AED]/15">
          <div className="mb-3 rounded-2xl bg-white/[0.14] p-4 shadow-sm">
            <Camera className="h-8 w-8 text-white" />
          </div>
          <p className="text-xs font-medium text-white">
            Drop your invite here
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    title: "Review and Edit",
    description:
      "Envitefy pulls dates, times, addresses, and links into a cleaner structure so you can make fast edits before sharing.",
    icon: <Edit3 className="h-6 w-6" />,
    visual: (
      <div className="relative flex aspect-[4/3] w-full flex-col gap-4 overflow-hidden rounded-[1.75rem] border border-white/15 bg-white/[0.08] p-6 shadow-[0_20px_40px_rgba(5,1,16,0.28)]">
        <div className="mb-2 flex gap-2">
          <div className="h-3 w-12 rounded-full bg-white/30" />
          <div className="h-3 w-20 rounded-full bg-white/15" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/12 bg-black/10 p-3">
            <div className="mb-1 text-[8px] font-bold text-white uppercase">
              Date
            </div>
            <div className="text-xs font-semibold text-white">Sat, Oct 12</div>
          </div>
          <div className="rounded-xl border border-white/12 bg-black/10 p-3">
            <div className="mb-1 text-[8px] font-bold text-white uppercase">
              Time
            </div>
            <div className="text-xs font-semibold text-white">7:00 PM</div>
          </div>
        </div>
        <div className="rounded-xl border border-white/12 bg-black/10 p-3">
          <div className="mb-1 text-[8px] font-bold text-white uppercase">
            Location
          </div>
          <div className="text-xs font-semibold text-white">
            Sunset Garden, 123 Maple St.
          </div>
        </div>
        <div className="mt-auto h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-2/3 bg-white/85" />
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: "Save and Share",
    description:
      "Publish the live page, collect RSVPs, and give guests one place for maps, timing, and calendar adds.",
    icon: <Share2 className="h-6 w-6" />,
    visual: (
      <div className="relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-6 overflow-hidden rounded-[1.75rem] border border-white/15 bg-white/[0.08] p-8 shadow-[0_20px_40px_rgba(5,1,16,0.28)]">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/15">
          <CheckCircle2 className="h-6 w-6 text-emerald-200" />
        </div>
        <h4 className={`${styles.headline} text-sm font-bold text-white`}>
          Event is Live
        </h4>
        <div className="w-full space-y-2">
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/12 bg-black/20 py-3 text-[10px] font-bold tracking-wider text-white uppercase transition-colors hover:bg-black/30"
          >
            <Copy className="h-3 w-3" /> Copy Link
          </button>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white py-3 text-[10px] font-bold tracking-wider text-[#140a27] uppercase transition-colors hover:bg-[#f2eaff]"
          >
            <Share2 className="h-3 w-3" /> Share
          </button>
        </div>
      </div>
    ),
  },
];

function PrimaryCta({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`${styles.btnRolling} cta-shell flex h-[3.85rem] items-center justify-center rounded-full bg-white px-10 text-lg font-bold text-[#140a27] shadow-[0_18px_40px_rgba(255,255,255,0.16)] hover:bg-[#f4ecff] ${className}`}
    >
      {typeof children === "string" ? (
        <AnimatedButtonLabel label={children} />
      ) : (
        children
      )}
    </Link>
  );
}

function BenefitCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
}) {
  return (
    <div className="space-y-6 rounded-[1.65rem] border border-white/12 bg-white/[0.06] p-7">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
        <Icon size={26} />
      </div>
      <h3
        className={`${styles.headline} text-2xl font-bold tracking-tight text-white`}
      >
        {title}
      </h3>
      <p className="text-base leading-relaxed text-white">{desc}</p>
    </div>
  );
}

function useRevealOnce() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || visible || typeof window === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      {
        threshold: 0.14,
        rootMargin: "0px 0px 18% 0px",
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return { ref, visible };
}

export default function LandingExperience() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const activeScene = useActiveScene(LANDING_SCENE_ORDER, "snap");
  const { ref: gymnasticsHighlightRef, visible: gymnasticsHighlightVisible } =
    useRevealOnce();
  const { ref: birthdayHeroRef, visible: birthdayHeroVisible } =
    useRevealOnce();
  const { ref: weddingHeroRef, visible: weddingHeroVisible } = useRevealOnce();

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <>
      <div
        className={`${styles.root} relative isolate min-h-screen overflow-x-hidden bg-transparent text-white selection:bg-white/20 selection:text-white`}
      >
        <ScenicBackground scene={activeScene} scenes={LANDING_SCENES} />

        <HeroTopNav
          navLinks={[
            { label: "Snap", href: "#snap" },
            { label: "Gymnastics", href: "#gymnastics" },
            { label: "Features", href: "#what-you-can-snap" },
            { label: "How it works", href: "#how-it-works" },
            { label: "Why it works", href: "#use-cases" },
            { label: "RSVP", href: "#rsvp-calendar" },
            { label: "Get started", href: "#cta" },
            { label: "FAQ", href: "#faq" },
          ]}
          variant="glass-dark"
          authenticatedPrimaryHref="/event"
          onGuestLoginAction={() => openAuth("login")}
          onGuestPrimaryAction={() => openAuth("signup")}
        />

        <section id="snap" className="px-4 pb-8 pt-32 sm:px-6 lg:px-8 lg:pt-40">
          <header id="landing-hero" className="mx-auto max-w-7xl">
            <div className="relative isolate overflow-hidden rounded-[2.4rem] border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.24),rgba(255,255,255,0.12))] px-7 py-8 shadow-[0_38px_90px_rgba(4,1,14,0.34),inset_0_1px_0_rgba(255,255,255,0.3)] backdrop-blur-2xl [-webkit-backdrop-filter:blur(40px)] md:px-10 md:py-12 lg:px-14 lg:py-16">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04)_38%,rgba(89,28,135,0.07)_100%)]" />
              <div className="absolute -left-24 bottom-[-5rem] h-72 w-72 rounded-full bg-[#22D3EE]/20 blur-[140px]" />
              <div className="absolute right-[-6rem] top-[-3rem] h-72 w-72 rounded-full bg-[#8B5CF6]/22 blur-[150px]" />

              <div className="relative grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-center">
                <div className="max-w-3xl">
                  <div
                    className={`${sectionBubbleClass} mb-8 items-center tracking-[0.3em]`}
                  >
                    Design Collective 2026
                  </div>

                  <h1
                    className={`${styles.headline} mb-8 text-6xl font-light leading-[0.92] tracking-tight text-white [text-shadow:0_0_28px_rgba(255,255,255,0.18)] sm:text-7xl lg:text-[6.75rem]`}
                  >
                    Snap Any
                    <br />
                    <span className="mt-4 block font-serif text-4xl font-light italic leading-tight text-white [text-shadow:0_0_30px_rgba(255,255,255,0.2)] sm:mt-5 sm:text-5xl lg:mt-6 lg:text-[4.65rem]">
                      Invite Into
                      <br /> <span className="block">an Event Page</span>
                    </span>
                  </h1>

                  <p className="mb-12 max-w-xl text-lg leading-relaxed text-white md:text-[1.65rem] md:leading-[1.45]">
                    Upload birthdays, wedding invites, or baby shower flyers.
                    Envitefy uses AI to turn static images into polished digital
                    event pages with RSVPs built in.{" "}
                  </p>

                  <div className="flex flex-wrap gap-4 max-sm:flex-nowrap max-sm:gap-2">
                    <PrimaryCta
                      href="/snap"
                      className="max-sm:h-auto max-sm:min-h-[3.35rem] max-sm:min-w-0 max-sm:basis-0 max-sm:grow max-sm:px-2.5 max-sm:text-center max-sm:text-xs max-sm:leading-snug"
                    >
                      Try Snap Upload
                    </PrimaryCta>
                    <a
                      href="#how-it-works"
                      className={`${styles.btnRolling} cta-shell flex h-[3.85rem] max-sm:h-auto max-sm:min-h-[3.35rem] max-sm:min-w-0 max-sm:basis-0 max-sm:grow max-sm:px-2.5 max-sm:text-center max-sm:text-xs max-sm:leading-snug items-center justify-center rounded-full border border-white/16 bg-white/[0.08] px-10 text-lg font-bold text-white transition-colors hover:bg-white/[0.12]`}
                    >
                      <AnimatedButtonLabel label="See How It Works" />
                    </a>
                  </div>
                </div>

                <div className="relative flex items-start justify-center gap-4 sm:gap-6 lg:justify-end">
                  <div
                    className={`${styles.cardGroup} ${styles.heroRevealPrimary} group relative`}
                  >
                    <div
                      className={`${cardBubbleClass} -top-4 px-3 text-[#7C3AED]`}
                    >
                      Snap
                    </div>
                    <div
                      className={`${styles.heroSnapCard} w-[8.2rem] overflow-hidden rounded-[1.45rem] shadow-[0_24px_52px_rgba(0,0,0,0.24)] sm:w-48 lg:w-52`}
                    >
                      <Image
                        alt="Original flyer"
                        className="h-auto w-full rounded-[1.45rem] grayscale-[0.1]"
                        height={1024}
                        priority
                        sizes="(min-width: 1024px) 13rem, (min-width: 640px) 12rem, 8.2rem"
                        src={IMAGES.heroFlyer}
                        width={768}
                      />
                    </div>
                  </div>

                  <div
                    className={`${styles.heroRevealCenter} hidden flex-col items-center gap-2 sm:flex`}
                  >
                    <div
                      className={`${styles.processingPulse} flex h-12 w-12 items-center justify-center rounded-full bg-white/12 text-white shadow-inner`}
                    >
                      <Sparkles size={20} />
                    </div>
                    <div className="h-16 w-px bg-gradient-to-b from-white/40 to-transparent" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-white">
                      Processing
                    </span>
                  </div>

                  <div
                    className={`${styles.cardGroup} ${styles.heroRevealSecondary} group relative mt-5 sm:mt-0`}
                  >
                    <div
                      className={`${cardBubbleClass} -top-4 border-white/24 px-3 text-[#140a27]`}
                    >
                      Live Page
                    </div>
                    <div
                      className={`${styles.heroLiveCard} w-[9rem] overflow-hidden rounded-[1.8rem] shadow-[0_28px_64px_rgba(0,0,0,0.28)] sm:w-56 sm:rounded-[2.4rem] lg:w-60`}
                    >
                      <Image
                        alt="Live event preview"
                        className="h-auto w-full rounded-[1.8rem] sm:rounded-[2.4rem]"
                        height={1600}
                        priority
                        sizes="(min-width: 1024px) 15rem, (min-width: 640px) 14rem, 9rem"
                        src={IMAGES.heroEvent}
                        width={900}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>
        </section>

        <section id="gymnastics" className="px-4 py-6 sm:px-6 lg:px-8">
          <div
            className={`mx-auto max-w-7xl ${glassSectionClass} px-7 py-8 md:px-10 md:py-10`}
          >
            <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(14,165,233,0.08),rgba(124,58,237,0.03)_45%,transparent)]" />
            <div className="relative grid gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
              <div
                ref={gymnasticsHighlightRef}
                className="relative order-2 flex flex-row flex-nowrap items-start justify-center gap-4 sm:items-center sm:gap-6 lg:order-1 lg:justify-start"
              >
                <div
                  className={`${styles.cardGroup} ${styles.heroRevealReady} ${
                    gymnasticsHighlightVisible ? styles.heroRevealPrimary : ""
                  } group relative`}
                >
                  <div className={`${cardBubbleClass} -top-5 text-[#0EA5E9]`}>
                    Meet PDF
                  </div>
                  <div
                    className={`${styles.heroSnapCard} w-[7.8rem] overflow-hidden rounded-[1.35rem] shadow-[0_26px_58px_rgba(3,0,12,0.3)] sm:w-52`}
                  >
                    <Image
                      alt="Gymnastics meet flyer preview"
                      className="block h-auto w-full scale-[1.08] rounded-[1.35rem]"
                      height={1024}
                      loading="eager"
                      sizes="(min-width: 640px) 13rem, 7.8rem"
                      src={IMAGES.gymnasticsFlyer}
                      width={768}
                    />
                  </div>
                </div>

                <div
                  className={`${styles.heroRevealReady} ${
                    gymnasticsHighlightVisible ? styles.heroRevealCenter : ""
                  } hidden flex-col items-center gap-2 sm:flex`}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-white shadow-inner">
                    <Sparkles size={18} />
                  </div>
                  <div className="h-14 w-px bg-gradient-to-b from-white/40 to-transparent" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-white">
                    Processing
                  </span>
                </div>

                <div
                  className={`${styles.cardGroup} ${styles.heroRevealReady} ${
                    gymnasticsHighlightVisible ? styles.heroRevealSecondary : ""
                  } group relative mt-5 sm:mt-0`}
                >
                  <div
                    className={`${cardBubbleClass} -top-5 border-white/24 text-[#140a27]`}
                  >
                    Live Meet
                  </div>
                  <div
                    className={`${styles.heroLiveCard} w-[8.8rem] overflow-hidden rounded-[1.75rem] shadow-[0_30px_64px_rgba(3,0,12,0.34)] sm:w-56 sm:rounded-[2.4rem]`}
                  >
                    <Image
                      alt="Gymnastics event page preview"
                      className="h-auto w-full rounded-[1.75rem] sm:rounded-[2.4rem]"
                      height={1600}
                      loading="eager"
                      sizes="(min-width: 640px) 14rem, 8.8rem"
                      src={IMAGES.gymnasticsEvent}
                      width={900}
                    />
                  </div>
                </div>
              </div>

              <div className="z-10 order-1 text-center lg:order-2 lg:text-left">
                <span className={sectionBubbleClass}>Sports Edition</span>
                <h2
                  className={`${styles.headline} text-4xl font-bold tracking-tight text-white lg:text-5xl`}
                >
                  Perfect for gymnastics meets and competition weekends
                </h2>
                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white lg:text-xl">
                  Upload a competition flyer and keep venue maps, scoring links,
                  hotel blocks, and meet-day updates on one polished page.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {gymnasticsHighlights.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-[1.5rem] border border-white/12 bg-white/[0.06] p-5"
                    >
                      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
                        <item.icon size={19} />
                      </div>
                      <h3
                        className={`${styles.headline} text-xl font-bold text-white`}
                      >
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-white">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>

                <PrimaryCta
                  href="/gymnastics"
                  className="mt-8 w-full sm:w-auto"
                >
                  Explore Gymnastics
                </PrimaryCta>
              </div>
            </div>
          </div>
        </section>

        <section id="what-you-can-snap" className="px-4 py-6 sm:px-6 lg:px-8">
          <div
            className={`mx-auto max-w-7xl ${glassSectionClass} px-7 py-8 md:px-10 md:py-10`}
          >
            <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(251,113,133,0.06),transparent_36%,rgba(124,58,237,0.08))]" />
            <div className="relative">
              <div className="mb-12 max-w-3xl">
                <span className={sectionBubbleClass}>What You Can Snap</span>
                <h2
                  className={`${styles.headline} text-4xl font-bold tracking-tight text-white lg:text-5xl`}
                >
                  Anything you upload becomes a cleaner digital surface
                </h2>
                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white">
                  Birthdays, wedding invites, school flyers, and community
                  events all benefit from the same live page, glass treatment,
                  and share-ready workflow.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="rounded-[1.9rem] border border-white/12 bg-white/[0.06] p-6 lg:col-span-2">
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                        <Cake size={28} />
                      </div>
                      <h3
                        className={`${styles.headline} text-3xl font-bold text-white`}
                      >
                        Birthday Invitations
                      </h3>
                      <p className="mt-3 max-w-md text-lg leading-relaxed text-white">
                        Turn a screenshot flyer into a beautiful page where
                        guests can RSVP, check the registry, and save the date.
                      </p>
                    </div>
                  </div>

                  <div
                    ref={birthdayHeroRef}
                    className="relative flex w-full max-w-[44rem] flex-row flex-nowrap items-start justify-center gap-3 sm:items-center sm:gap-8"
                  >
                    <div
                      className={`${styles.cardGroup} ${styles.heroRevealReady} ${
                        birthdayHeroVisible ? styles.heroRevealPrimary : ""
                      } group relative`}
                    >
                      <div
                        className={`${cardBubbleClass} -top-5 text-[#7C3AED]`}
                      >
                        Upload
                      </div>
                      <div
                        className={`${styles.heroSnapCard} w-[7.5rem] overflow-hidden rounded-[1.35rem] shadow-[0_24px_52px_rgba(3,0,12,0.28)] sm:w-48`}
                      >
                        <Image
                          alt="Birthday invitation flyer"
                          className="block h-auto w-full scale-[1.08] rounded-[1.35rem]"
                          height={1024}
                          loading="eager"
                          sizes="(min-width: 640px) 12rem, 7.5rem"
                          src={IMAGES.birthdayFlyer}
                          width={768}
                        />
                      </div>
                    </div>

                    <div
                      className={`${styles.heroRevealReady} ${
                        birthdayHeroVisible ? styles.heroRevealCenter : ""
                      } hidden flex-col items-center gap-2 sm:flex`}
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-white shadow-inner">
                        <Sparkles size={18} />
                      </div>
                      <div className="h-14 w-px bg-gradient-to-b from-white/40 to-transparent" />
                      <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-white">
                        Processing
                      </span>
                    </div>

                    <div
                      className={`${styles.cardGroup} ${styles.heroRevealReady} ${
                        birthdayHeroVisible ? styles.heroRevealSecondary : ""
                      } group relative mt-5 sm:mt-0`}
                    >
                      <div
                        className={`${cardBubbleClass} -top-5 border-white/24 text-[#140a27]`}
                      >
                        Event Page
                      </div>
                      <div
                        className={`${styles.heroLiveCard} w-[8.75rem] overflow-hidden rounded-[1.75rem] shadow-[0_30px_64px_rgba(3,0,12,0.34)] sm:w-56 sm:rounded-[2.4rem]`}
                      >
                        <Image
                          alt="Birthday event page preview"
                          className="h-auto w-full rounded-[1.75rem] sm:rounded-[2.4rem]"
                          height={1600}
                          loading="eager"
                          sizes="(min-width: 640px) 14rem, 8.75rem"
                          src={IMAGES.birthdayEvent}
                          width={900}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.9rem] border border-white/12 bg-white/[0.06] p-6">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                    <Heart size={28} />
                  </div>
                  <h3
                    className={`${styles.headline} text-3xl font-bold text-white`}
                  >
                    Wedding Invites
                  </h3>
                  <p className="mt-3 text-lg leading-relaxed text-white">
                    Convert an elegant paper invite into a mobile-first wedding
                    site with a refined presentation.
                  </p>
                  <div className="mt-8 flex min-h-[18rem] items-center justify-center px-1 pb-1 pt-2 sm:min-h-[20rem] sm:px-2">
                    <div ref={weddingHeroRef} className={styles.weddingStack}>
                      <div
                        className={`${styles.heroRevealReady} ${
                          styles.weddingRevealPrimary
                        } ${weddingHeroVisible ? styles.heroRevealPrimary : ""} ${
                          styles.weddingInviteLayer
                        }`}
                      >
                        <div className={styles.weddingInviteCard}>
                          <Image
                            alt="Wedding invitation design"
                            className={styles.weddingInviteImage}
                            height={1180}
                            loading="eager"
                            sizes="(min-width: 640px) 7.8rem, 42vw"
                            src={IMAGES.weddingFlyer}
                            width={860}
                          />
                        </div>
                      </div>

                      <div
                        aria-hidden="true"
                        className={`${styles.heroRevealReady} ${
                          styles.weddingRevealCenter
                        } ${weddingHeroVisible ? styles.heroRevealCenter : ""} ${
                          styles.weddingStackConnector
                        }`}
                      >
                        <span className={styles.weddingSparkle}>
                          <Sparkles size={16} />
                        </span>
                      </div>

                      <div
                        className={`${styles.heroRevealReady} ${
                          styles.weddingRevealSecondary
                        } ${weddingHeroVisible ? styles.heroRevealSecondary : ""} ${
                          styles.weddingPhoneLayer
                        }`}
                      >
                        <div className={styles.weddingPhoneShell}>
                          <div className={styles.weddingPhoneFrame}>
                            <Image
                              alt="Wedding event page preview"
                              className={styles.weddingPhoneImage}
                              height={1600}
                              loading="eager"
                              sizes="(min-width: 640px) 9rem, 48vw"
                              src={IMAGES.weddingEvent}
                              width={900}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {useCases.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[1.65rem] border border-white/12 bg-white/[0.06] p-6"
                  >
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
                      <item.icon size={22} />
                    </div>
                    <h4
                      className={`${styles.headline} text-2xl font-bold text-white`}
                    >
                      {item.title}
                    </h4>
                    <p className="mt-3 text-base leading-relaxed text-white">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="px-4 py-6 sm:px-6 lg:px-8">
          <div
            className={`mx-auto max-w-7xl ${glassSectionClass} px-7 py-8 md:px-10 md:py-10`}
          >
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_30%,rgba(124,58,237,0.06))]" />
            <div className="relative">
              <div className="mb-12 max-w-3xl">
                <span className={sectionBubbleClass}>How It Works</span>
                <h2
                  className={`${styles.headline} text-4xl font-bold tracking-tight text-white lg:text-5xl`}
                >
                  The magic behind the snap is still simple
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className="group flex flex-col rounded-[1.75rem] border border-white/12 bg-white/[0.06] p-6 shadow-[0_18px_42px_rgba(3,0,12,0.24)] transition-transform duration-300 hover:-translate-y-1"
                  >
                    <div className="mb-7">{step.visual}</div>
                    <div className="mt-auto space-y-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/12 font-bold text-white">
                        {step.id}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-white">{step.icon}</div>
                        <h3
                          className={`${styles.headline} text-xl font-bold text-white`}
                        >
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-sm leading-relaxed text-white">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="use-cases" className="px-4 py-6 sm:px-6 lg:px-8">
          <div
            className={`mx-auto max-w-7xl ${glassSectionClass} px-7 py-8 md:px-10 md:py-10`}
          >
            <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(236,72,153,0.06),transparent_36%,rgba(124,58,237,0.08))]" />
            <div className="relative">
              <div className="mb-12 max-w-3xl">
                <span className={sectionBubbleClass}>Why It Works</span>
                <h2
                  className={`${styles.headline} text-4xl font-bold tracking-tight text-white lg:text-5xl`}
                >
                  Built for modern invites, updates, and group coordination
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {benefits.map((benefit) => (
                  <BenefitCard key={benefit.title} {...benefit} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="rsvp-calendar" className="px-4 py-6 sm:px-6 lg:px-8">
          <div
            className={`mx-auto max-w-7xl ${glassSectionClass} overflow-visible px-7 py-8 md:px-10 md:py-10`}
          >
            <div className="absolute inset-0 bg-[linear-gradient(150deg,rgba(244,114,182,0.06),transparent_32%,rgba(129,140,248,0.08))]" />
            <div className="relative flex flex-col items-center gap-16 lg:flex-row">
              <div className="relative h-[420px] w-full flex-1">
                <div
                  className={`${styles.floatUp} ${floatingBubbleClass} absolute left-2 top-8 max-w-[calc(100%-4rem)] sm:left-0 sm:max-w-none`}
                >
                  <CalendarCheck className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                  <span className="text-sm font-bold text-white sm:text-lg">
                    Oct 24, 2026
                  </span>
                </div>

                <div
                  className={`${styles.floatDown} ${floatingBubbleClass} absolute right-2 top-[43%] max-w-[calc(100%-1rem)] sm:right-0 sm:top-[46%] sm:max-w-none`}
                >
                  <Clock className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                  <span className="text-sm font-bold text-white sm:text-lg">
                    6:30 PM - 10:00 PM
                  </span>
                </div>

                <div
                  className={`${styles.floatLift} ${floatingBubbleClass} absolute bottom-8 left-4 max-w-[calc(100%-5rem)] sm:bottom-10 sm:left-12 sm:max-w-none`}
                >
                  <MapPin className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                  <span className="text-sm font-bold text-white sm:text-lg">
                    The Glass House Venue
                  </span>
                </div>

                <div className="absolute left-1/2 -top-8 z-10 w-max max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-full bg-white px-5 py-3 text-[#140a27] shadow-[0_24px_60px_rgba(255,255,255,0.18)] transition-transform hover:scale-105 sm:top-auto sm:bottom-24 sm:left-auto sm:right-12 sm:max-w-none sm:translate-x-0 sm:px-10 sm:py-6">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <CheckCircle2 className="h-5 w-5 sm:h-8 sm:w-8" />
                    <span className="text-sm font-extrabold sm:text-xl">
                      I&apos;m Attending
                    </span>
                  </div>
                </div>

                <div
                  className={`${styles.halo} absolute inset-0 -z-10 scale-125 rounded-full`}
                />
              </div>

              <div className="flex-1">
                <span className={sectionBubbleClass}>RSVP Flow</span>
                <h2
                  className={`${styles.headline} mb-6 text-4xl font-bold tracking-tight text-white lg:text-5xl`}
                >
                  Designed to get a &apos;yes&apos;
                </h2>
                <p className="mb-10 text-lg leading-relaxed text-white md:text-xl">
                  The RSVP flow stays light, fast, and mobile-friendly, so your
                  guests can respond, save the date, and find the venue without
                  downloading anything new.
                </p>
                <ul className="space-y-5">
                  {rsvpHighlights.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-4 text-base font-semibold text-white sm:text-lg"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/12 text-white">
                        <CheckCircle2 size={18} />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <LandingFaq />

        <section
          id="cta"
          className="px-4 py-6 pb-10 sm:px-6 lg:px-8 lg:pb-14"
        >
          <div
            className={`mx-auto max-w-5xl ${glassSectionClass} px-7 py-10 text-center md:px-12 md:py-14`}
          >
            <div className="absolute -right-10 -top-10 p-12 text-white opacity-[0.05]">
              <Sparkles size={240} />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02)_45%,rgba(124,58,237,0.1))]" />
            <div className="relative z-10">
              <h2
                className={`${styles.headline} mx-auto mb-6 max-w-3xl text-[2rem] font-extrabold leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-6xl`}
              >
                Turn your next invite into a
                <span className="font-serif italic text-white">
                  {" "}
                  shareable event
                </span>
              </h2>
              <p className="mx-auto mb-10 max-w-2xl text-lg text-white md:text-xl">
                Snap it, edit it, and send out a live page that feels more
                considered than a screenshot ever could.
              </p>
              <PrimaryCta
                href="/snap"
                className="mx-auto h-[5.25rem] px-14 text-2xl"
              >
                Try Snap Upload
              </PrimaryCta>
            </div>
          </div>
        </section>
      </div>

      <AuthModal
        open={authModalOpen}
        mode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onModeChange={setAuthMode}
        signupSource="snap"
        successRedirectUrl="/event"
        allowSignupSwitch={false}
      />
    </>
  );
}
