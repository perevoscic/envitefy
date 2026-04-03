"use client";

import {
  Baby,
  Cake,
  CalendarCheck,
  CalendarPlus,
  Camera,
  CheckCircle2,
  Clock,
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
import Link from "next/link";
import { type ReactNode, useEffect, useRef, useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import HeroTopNav from "@/components/navigation/HeroTopNav";
import AnimatedButtonLabel from "@/components/ui/AnimatedButtonLabel";
import styles from "./LandingExperience.module.css";

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

const useCases = [
  {
    icon: Baby,
    title: "Baby Showers",
    desc: "Organize dates, addresses, and details from social media flyers instantly.",
  },
  {
    icon: Trophy,
    title: "Sports Schedules",
    desc: "Upload whole team calendars; our AI extracts every match into individual events.",
  },
  {
    icon: Users,
    title: "Community Events",
    desc: "Markets, town halls, or block parties-make them interactive and shareable.",
  },
] as const;

const benefits = [
  {
    icon: Zap,
    title: "Skip Manual Setup",
    desc: "No more typing in addresses or copy-pasting event descriptions. Our AI handles the data entry.",
  },
  {
    icon: TowerControl,
    title: "Printed to Digital",
    desc: "Modernize those physical flyers pinned on the breakroom or community board.",
  },
  {
    icon: Share2,
    title: "Easy Sharing",
    desc: "One clean link for all details. No more blurry photos of flyers sent in group chats.",
  },
  {
    icon: CalendarCheck,
    title: "Collect RSVPs",
    desc: "See exactly who is coming with a built-in guest list and instant notifications.",
  },
  {
    icon: CalendarPlus,
    title: "Instant Save-the-Date",
    desc: "Help your guests never forget an event by letting them add it to their calendar in one tap.",
  },
  {
    icon: FileEdit,
    title: "Live Updates",
    desc: "Change of venue? Tweak the digital page and everyone sees the update instantly.",
  },
] as const;

const rsvpHighlights = [
  "One-tap RSVP from mobile",
  "Auto-fill calendar invites",
  "Smart maps & directions integration",
] as const;

const gymnasticsHighlights = [
  {
    icon: CalendarCheck,
    title: "Meet Details",
    desc: "Bring competition notes, lineup info, and event-day updates into one live page.",
  },
  {
    icon: Trophy,
    title: "Hotels",
    desc: "Keep hotel blocks, booking details, and stay info attached to the meet instead of buried in texts.",
  },
  {
    icon: MapPin,
    title: "Venue & Parking Info",
    desc: "Share venue maps, entrances, hotels, and parking notes where every family can find them.",
  },
  {
    icon: Users,
    title: "Team Registration & RSVP Tracking",
    desc: "Track coaches, volunteers, and family attendance without manual follow-up.",
  },
] as const;

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
      className={`${styles.btnRolling} cta-shell h-[3.75rem] rounded-full bg-[#7C3AED] px-10 font-bold text-lg text-white shadow-xl shadow-[#7C3AED]/20 hover:bg-[#630ed4] ${className}`}
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
    <div className="space-y-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-[#7C3AED]">
        <Icon size={28} />
      </div>
      <h3
        className={`${styles.headline} text-2xl font-bold tracking-tight`}
        style={{
          color: "#f7f3ff",
          textShadow: "0 0 22px rgba(156, 120, 255, 0.18)",
        }}
      >
        {title}
      </h3>
      <p className="text-lg leading-relaxed text-white/60">{desc}</p>
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
        threshold: 0.28,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return { ref, visible };
}

export default function LandingExperience() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
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
        className={`${styles.root} min-h-screen overflow-x-hidden bg-white text-[#1f1635] selection:bg-[#7C3AED]/20 selection:text-[#7C3AED]`}
      >
        <HeroTopNav
          navLinks={[
            { label: "Gymnastics", href: "#gymnastics" },
            { label: "Snap", href: "/snap" },
            { label: "Features", href: "#what-you-can-snap" },
            { label: "FAQ", href: "/faq" },
          ]}
          authenticatedPrimaryHref="/event"
          onGuestLoginAction={() => openAuth("login")}
          onGuestPrimaryAction={() => openAuth("signup")}
        />

        <section id="snap">
          <header
            id="landing-hero"
            className="relative overflow-hidden px-6 pb-24 pt-32 lg:pt-48"
          >
            <div
              className={`${styles.bloomEffect} pointer-events-none absolute left-1/2 top-0 h-full w-full -translate-x-1/2`}
            />
            <div className="mx-auto flex max-w-7xl flex-col items-center gap-16 lg:flex-row lg:gap-24">
              <div className="z-10 flex-1 text-center lg:text-left">
                <h1
                  className={`${styles.headline} mb-8 text-5xl font-extrabold leading-[1.05] tracking-tight text-[#1f1635] lg:text-7xl`}
                >
                  Snap Any Invite Into an{" "}
                  <span className="italic text-[#7C3AED]">Event Page</span>
                </h1>
                <p className="mb-12 max-w-2xl text-xl font-medium leading-relaxed text-[#53496b]">
                  Upload birthdays, wedding invites, or baby shower flyers.
                  Envitefy uses AI to turn static images into polished digital
                  event pages with RSVPs built in.
                </p>
                <div className="flex flex-col justify-center gap-5 sm:flex-row lg:justify-start">
                  <PrimaryCta href="/snap">Try Snap Upload</PrimaryCta>
                  <a
                    href="#how-it-works"
                    className={`${styles.btnRolling} cta-shell h-[3.75rem] rounded-full border border-[#1f1635]/10 bg-white px-10 font-bold text-lg text-[#1f1635] hover:bg-[#f9f9f9]`}
                  >
                    <AnimatedButtonLabel label="See How It Works" />
                  </a>
                </div>
              </div>

              <div className="relative flex-1">
                <div className="relative z-10 flex flex-row flex-nowrap items-start justify-center gap-3 sm:flex-row sm:items-center sm:gap-6 lg:gap-10">
                  <div
                    className={`${styles.cardGroup} ${styles.heroRevealPrimary} group relative`}
                  >
                    <div className="absolute -top-6 left-1/2 z-20 inline-flex min-w-max -translate-x-1/2 items-center justify-center whitespace-nowrap rounded-full border border-[#7C3AED]/10 bg-white px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-[#7C3AED] shadow-sm">
                      1. Snap
                    </div>
                    <div
                      className={`${styles.heroSnapCard} w-[8.5rem] overflow-hidden rounded-[1.5rem] shadow-2xl sm:w-62`}
                    >
                      <img
                        referrerPolicy="no-referrer"
                        alt="Original flyer"
                        className="aspect-[3/4] h-full w-full rounded-[1.5rem] object-cover grayscale-[0.2]"
                        src={IMAGES.heroFlyer}
                      />
                    </div>
                  </div>

                  <div
                    className={`${styles.heroRevealCenter} hidden flex-col items-center gap-2 sm:flex`}
                  >
                    <div
                      className={`${styles.processingPulse} flex h-12 w-12 items-center justify-center rounded-full bg-[#7C3AED]/10 text-[#7C3AED] shadow-inner`}
                    >
                      <Sparkles size={20} />
                    </div>
                    <div className="h-16 w-px bg-gradient-to-b from-[#7C3AED]/30 to-transparent" />
                    <span className="text-[10px] font-bold uppercase tracking-tight align-middle text-[#7C3AED]/60">
                      Envitefy Processing
                    </span>
                  </div>

                  <div
                    className={`${styles.cardGroup} ${styles.heroRevealSecondary} group relative mt-5 sm:mt-0`}
                  >
                    <div className="absolute -top-6 left-1/2 z-20 inline-flex min-w-max -translate-x-1/2 items-center justify-center whitespace-nowrap rounded-full bg-[#7C3AED] px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">
                      2. Live Event
                    </div>
                    <div
                      className={`${styles.heroLiveCard} w-[9.5rem] overflow-hidden rounded-[2rem] shadow-[0px_48px_80px_rgba(31,22,53,0.15)] sm:w-64 sm:rounded-[3rem]`}
                    >
                      <img
                        referrerPolicy="no-referrer"
                        alt="Live event preview"
                        className="h-full w-full rounded-[2rem] object-cover sm:rounded-[3rem]"
                        src={IMAGES.heroEvent}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>
        </section>

        <section
          id="gymnastics"
          className="relative overflow-hidden px-6 pb-24 pt-4 lg:pb-28 lg:pt-8"
        >
          <div
            className={`${styles.bloomEffect} pointer-events-none absolute left-1/2 top-0 h-full w-full -translate-x-1/2`}
          />
          <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-16 lg:flex-row lg:gap-24">
            <div className="order-2 relative w-full flex-1 lg:order-1">
              <div
                ref={gymnasticsHighlightRef}
                className="relative z-10 flex flex-row flex-nowrap items-start justify-center gap-3 sm:flex-row sm:items-center sm:gap-6 lg:gap-10"
              >
                <div
                  className={`${styles.cardGroup} ${styles.heroRevealReady} ${
                    gymnasticsHighlightVisible ? styles.heroRevealPrimary : ""
                  } group relative`}
                >
                  <div className="absolute -top-6 left-1/2 z-20 inline-flex min-w-max -translate-x-1/2 items-center justify-center whitespace-nowrap rounded-full border border-[#7C3AED]/10 bg-white px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-[#7C3AED] shadow-sm">
                    Meet PDF
                  </div>
                  <div
                    className={`${styles.heroSnapCard} w-[7.5rem] overflow-hidden rounded-[1.35rem] shadow-[0_28px_60px_rgba(31,22,53,0.14)] sm:w-48 lg:w-52`}
                  >
                    <img
                      alt="Gymnastics meet flyer preview"
                      className="block aspect-[3/4] h-full w-full scale-[1.08] rounded-[1.35rem] object-cover object-center"
                      src={IMAGES.gymnasticsFlyer}
                    />
                  </div>
                </div>

                <div
                  className={`${styles.heroRevealReady} ${
                    gymnasticsHighlightVisible ? styles.heroRevealCenter : ""
                  } hidden flex-col items-center gap-2 sm:flex`}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#7C3AED]/10 text-[#7C3AED] shadow-inner">
                    <Sparkles size={18} />
                  </div>
                  <div className="h-14 w-px bg-gradient-to-b from-[#7C3AED]/30 to-transparent" />
                  <span className="text-[9px] font-bold uppercase tracking-tight text-[#7C3AED]/60">
                    Processing
                  </span>
                </div>

                <div
                  className={`${styles.cardGroup} ${styles.heroRevealReady} ${
                    gymnasticsHighlightVisible ? styles.heroRevealSecondary : ""
                  } group relative mt-5 sm:mt-0`}
                >
                  <div className="absolute -top-6 left-1/2 z-20 inline-flex min-w-max -translate-x-1/2 items-center justify-center whitespace-nowrap rounded-full bg-[#7C3AED] px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">
                    Live Meet Page
                  </div>
                  <div
                    className={`${styles.heroLiveCard} w-[8.75rem] overflow-hidden rounded-[1.75rem] shadow-[0_32px_72px_rgba(31,22,53,0.15)] sm:w-56 sm:rounded-[2.4rem] lg:w-60`}
                  >
                    <img
                      alt="Gymnastics event page preview"
                      className="h-full w-full rounded-[1.75rem] object-cover sm:rounded-[2.4rem]"
                      src={IMAGES.gymnasticsEvent}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`${styles.gymnasticsCopy} order-1 z-10 flex-1 text-center lg:order-2 lg:text-left`}
            >
              <span className={styles.gymnasticsEyebrow}>Sports Edition</span>
              <h2
                className={`${styles.headline} text-4xl font-extrabold tracking-tight text-[#1f1635] lg:text-5xl`}
              >
                Perfect for Gymnastics Meets &amp; Competitions
              </h2>
              <p className="max-w-2xl text-lg font-medium leading-relaxed text-[#53496b] lg:text-xl">
                Upload competition flyers and Envitefy can pull venue maps,
                scoring links, and meet-day details into one polished live page
                that is easier for families, coaches, and teams to follow.
              </p>

              <div className={styles.gymnasticsBulletGrid}>
                {gymnasticsHighlights.map((item) => (
                  <div key={item.title} className={styles.gymnasticsBulletCard}>
                    <div className={styles.gymnasticsBulletIcon}>
                      <item.icon size={20} />
                    </div>
                    <div className="space-y-2">
                      <h3
                        className={`${styles.headline} text-xl font-bold text-[#1f1635]`}
                      >
                        {item.title}
                      </h3>
                      <p className="text-sm font-medium leading-6 text-[#5d5475]">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <PrimaryCta href="/gymnastics" className="w-full sm:w-auto">
                Explore Gymnastics
              </PrimaryCta>
            </div>
          </div>
        </section>

        <section id="what-you-can-snap" className="bg-[#f9f9f9]/50 px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-20 text-center">
              <h2
                className={`${styles.headline} mb-6 text-4xl font-bold tracking-tight text-[#1f1635] lg:text-5xl`}
              >
                Anything you snap, we transform.
              </h2>
              <p className="mx-auto max-w-2xl text-lg font-medium text-[#53496b]">
                Designed for every occasion, from personal parties to
                professional schedules.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="group relative overflow-hidden rounded-[2rem] border border-[#1f1635]/5 bg-white p-10 transition-all hover:-translate-y-1 hover:shadow-xl md:col-span-2">
                <div>
                  <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7C3AED]/5 text-[#7C3AED]">
                    <Cake size={32} />
                  </div>
                  <h3 className={`${styles.headline} mb-4 text-3xl font-bold`}>
                    Birthday Invitations
                  </h3>
                  <p className="max-w-md text-lg leading-relaxed text-[#53496b]">
                    Turn that text message flyer into a beautiful page where
                    guests can RSVP and see the gift registry.
                  </p>
                </div>
                <div className="mt-12 flex items-center justify-center">
                  <div
                    ref={birthdayHeroRef}
                    className="relative flex w-full max-w-[44rem] flex-row flex-nowrap items-start justify-center gap-3 sm:flex-row sm:items-center sm:gap-8"
                  >
                    <div
                      className={`${styles.cardGroup} ${
                        styles.heroRevealReady
                      } ${
                        birthdayHeroVisible ? styles.heroRevealPrimary : ""
                      } group relative`}
                    >
                      <div className="absolute -top-5 left-1/2 z-20 inline-flex min-w-max -translate-x-1/2 items-center justify-center whitespace-nowrap rounded-full border border-[#7C3AED]/10 bg-white px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-[#7C3AED] shadow-sm">
                        Upload
                      </div>
                      <div
                        className={`${styles.heroSnapCard} w-[7.5rem] overflow-hidden rounded-[1.35rem] shadow-[0_28px_60px_rgba(31,22,53,0.14)] sm:w-48`}
                      >
                        <img
                          alt="Birthday invitation flyer"
                          className="block aspect-[3/4] h-full w-full scale-[1.08] rounded-[1.35rem] object-cover object-center"
                          src={IMAGES.birthdayFlyer}
                        />
                      </div>
                    </div>

                    <div
                      className={`${styles.heroRevealReady} ${
                        birthdayHeroVisible ? styles.heroRevealCenter : ""
                      } hidden flex-col items-center gap-2 sm:flex`}
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#7C3AED]/10 text-[#7C3AED] shadow-inner">
                        <Sparkles size={18} />
                      </div>
                      <div className="h-14 w-px bg-gradient-to-b from-[#7C3AED]/30 to-transparent" />
                      <span className="text-[9px] font-bold uppercase tracking-tight text-[#7C3AED]/60">
                        Processing
                      </span>
                    </div>

                    <div
                      className={`${styles.cardGroup} ${
                        styles.heroRevealReady
                      } ${
                        birthdayHeroVisible ? styles.heroRevealSecondary : ""
                      } group relative mt-5 sm:mt-0`}
                    >
                      <div className="absolute -top-5 left-1/2 z-20 inline-flex min-w-max -translate-x-1/2 items-center justify-center whitespace-nowrap rounded-full bg-[#7C3AED] px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">
                        Event Page
                      </div>
                      <div
                        className={`${styles.heroLiveCard} w-[8.75rem] overflow-hidden rounded-[1.75rem] shadow-[0_32px_72px_rgba(31,22,53,0.15)] sm:w-56 sm:rounded-[2.4rem]`}
                      >
                        <img
                          alt="Birthday event page preview"
                          className="h-full w-full rounded-[1.75rem] object-cover sm:rounded-[2.4rem]"
                          src={IMAGES.birthdayEvent}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex h-full flex-col rounded-[2rem] border border-[#7C3AED]/10 bg-[#7C3AED]/5 p-10 transition-all hover:-translate-y-1 hover:shadow-xl">
                <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#7C3AED] shadow-sm">
                  <Heart size={32} />
                </div>
                <h3 className={`${styles.headline} mb-4 text-3xl font-bold`}>
                  Wedding Invites
                </h3>
                <p className="mb-10 text-lg leading-relaxed text-[#53496b]">
                  Convert elegant paper invitations into mobile-first digital
                  homes for your big day.
                </p>
                <div className="mt-6 flex min-h-[18rem] items-center justify-center px-1 pb-1 pt-2 sm:min-h-[20rem] sm:px-2">
                  <div ref={weddingHeroRef} className={styles.weddingStack}>
                    <div
                      className={`${styles.heroRevealReady} ${
                        styles.weddingRevealPrimary
                      } ${weddingHeroVisible ? styles.heroRevealPrimary : ""} ${
                        styles.weddingInviteLayer
                      }`}
                    >
                      <div className={styles.weddingInviteCard}>
                        <img
                          alt="Wedding invitation design"
                          className={styles.weddingInviteImage}
                          src={IMAGES.weddingFlyer}
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
                      } ${
                        weddingHeroVisible ? styles.heroRevealSecondary : ""
                      } ${styles.weddingPhoneLayer}`}
                    >
                      <div className={styles.weddingPhoneShell}>
                        <div className={styles.weddingPhoneFrame}>
                          <img
                            alt="Wedding event page preview"
                            className={styles.weddingPhoneImage}
                            src={IMAGES.weddingEvent}
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
                  className="rounded-[2rem] border border-[#1f1635]/5 bg-white p-8 transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  <item.icon className="mb-6 text-[#7C3AED]" size={32} />
                  <h4 className={`${styles.headline} mb-3 text-xl font-bold`}>
                    {item.title}
                  </h4>
                  <p className="text-base leading-relaxed text-[#53496b]">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <h2
              className={`${styles.headline} mb-28 text-center text-4xl font-bold tracking-tight text-[#1f1635]`}
            >
              The Magic Behind the Snap
            </h2>
            <div className="space-y-40">
              <div className="flex flex-col items-center gap-20 lg:flex-row">
                <div className="order-2 flex-1 lg:order-1">
                  <div className="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7C3AED] text-xl font-bold text-white shadow-lg shadow-[#7C3AED]/20">
                    1
                  </div>
                  <h3
                    className={`${styles.headline} mb-6 text-4xl font-bold tracking-tight`}
                  >
                    Snap or Upload
                  </h3>
                  <p className="text-xl font-medium leading-relaxed text-[#53496b]">
                    Simply take a photo of a printed flyer or upload a digital
                    invitation from your camera roll. Our AI analyzes the visual
                    elements instantly.
                  </p>
                </div>
                <div className="order-1 w-full flex-1 lg:order-2">
                  <div className="rotate-2 rounded-[2rem] border border-[#1f1635]/5 bg-[#f9f9f9] p-10 shadow-sm">
                    <div className="rounded-[2rem] bg-white p-6 shadow-2xl">
                      <div className="mb-6 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-widest text-[#7C3AED]">
                          Camera Mode
                        </span>
                        <Camera className="text-[#7C3AED]" size={20} />
                      </div>
                      <div className="flex h-72 w-full flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-[#7C3AED]/20 bg-[#7C3AED]/5">
                        <Camera className="text-[#7C3AED]/40" size={48} />
                        <span className="text-sm font-semibold text-[#7C3AED]/60">
                          Drop your invite here
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-20 lg:flex-row">
                <div className="w-full flex-1">
                  <div className="-rotate-2 rounded-[2rem] border border-[#7C3AED]/10 bg-[#7C3AED]/5 p-10 shadow-sm">
                    <div className="space-y-6 rounded-[2rem] bg-white p-8 shadow-2xl">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-12 rounded-full bg-[#7C3AED]/20" />
                        <div className="h-3 w-24 rounded-full bg-[#7C3AED]/10" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex h-14 flex-col justify-center rounded-xl border border-[#1f1635]/10 px-4">
                          <span className="text-[10px] font-bold uppercase text-[#7C3AED]/60">
                            Date
                          </span>
                          <span className="text-sm font-bold">Sat, Oct 12</span>
                        </div>
                        <div className="flex h-14 flex-col justify-center rounded-xl border border-[#1f1635]/10 px-4">
                          <span className="text-[10px] font-bold uppercase text-[#7C3AED]/60">
                            Time
                          </span>
                          <span className="text-sm font-bold">7:00 PM</span>
                        </div>
                      </div>
                      <div className="flex h-24 w-full flex-col rounded-xl border border-[#1f1635]/10 p-4">
                        <span className="mb-1 text-[10px] font-bold uppercase text-[#7C3AED]/60">
                          Location
                        </span>
                        <span className="text-sm font-bold">
                          Sunset Garden, 123 Maple St.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7C3AED] text-xl font-bold text-white shadow-lg shadow-[#7C3AED]/20">
                    2
                  </div>
                  <h3
                    className={`${styles.headline} mb-6 text-4xl font-bold tracking-tight`}
                  >
                    Review and Edit
                  </h3>
                  <p className="text-xl font-medium leading-relaxed text-[#53496b]">
                    Envitefy automatically pulls dates, times, and location
                    data. You can tweak any details or add a custom registry
                    link in seconds.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-20 lg:flex-row">
                <div className="order-2 flex-1 lg:order-1">
                  <div className="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7C3AED] text-xl font-bold text-white shadow-lg shadow-[#7C3AED]/20">
                    3
                  </div>
                  <h3
                    className={`${styles.headline} mb-6 text-4xl font-bold tracking-tight`}
                  >
                    Save and Share
                  </h3>
                  <p className="text-xl font-medium leading-relaxed text-[#53496b]">
                    Publish your shareable event page. Guests can RSVP with one
                    tap, and the event syncs directly to their Apple or Google
                    Calendar.
                  </p>
                </div>
                <div className="order-1 w-full flex-1 lg:order-2">
                  <div className="rotate-1 rounded-[2rem] border border-[#7C3AED]/10 bg-[#7C3AED]/5 p-10 shadow-sm">
                    <div className="rounded-[2rem] bg-white p-10 text-center shadow-2xl">
                      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
                        <CheckCircle2 className="text-green-500" size={40} />
                      </div>
                      <h4
                        className={`${styles.headline} mb-8 text-2xl font-bold`}
                      >
                        Event is Live!
                      </h4>
                      <div className="flex flex-col gap-3">
                        <button
                          type="button"
                          className="w-full rounded-xl bg-[#1f1635] py-4 text-sm font-bold tracking-wide text-white transition-colors hover:bg-[#1f1635]/90"
                        >
                          COPY LINK
                        </button>
                        <button
                          type="button"
                          className="w-full rounded-xl bg-[#7C3AED] py-4 text-sm font-bold tracking-wide text-white shadow-lg shadow-[#7C3AED]/20 transition-colors hover:bg-[#630ed4]"
                        >
                          SHARE VIA WHATSAPP
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="use-cases"
          className="mx-4 my-12 rounded-[3rem] bg-[#1f1635] px-6 py-32 text-white"
        >
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 gap-16 md:grid-cols-2 lg:grid-cols-3">
              {benefits.map((benefit) => (
                <BenefitCard key={benefit.title} {...benefit} />
              ))}
            </div>
          </div>
        </section>

        <section
          id="rsvp-calendar"
          className="overflow-hidden px-6 pt-20 pb-12"
        >
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-24 lg:flex-row">
            <div className="relative h-[500px] w-full flex-1">
              <div
                className={`${styles.floatUp} absolute left-2 top-8 flex max-w-[calc(100%-4rem)] items-center gap-2 rounded-full border border-[#1f1635]/5 bg-white px-4 py-3 shadow-2xl sm:left-0 sm:top-10 sm:max-w-none sm:gap-4 sm:px-8 sm:py-5`}
              >
                <CalendarCheck className="h-5 w-5 text-[#7C3AED] sm:h-6 sm:w-6" />
                <span className="text-sm font-bold sm:text-lg">
                  Oct 24, 2024
                </span>
              </div>

              <div
                className={`${styles.floatDown} absolute right-2 top-[43%] flex max-w-[calc(100%-1rem)] items-center gap-2 rounded-full border border-[#1f1635]/5 bg-white px-4 py-3 shadow-2xl sm:right-0 sm:top-[46%] sm:max-w-none sm:gap-4 sm:px-8 sm:py-5`}
              >
                <Clock className="h-5 w-5 text-[#7C3AED] sm:h-6 sm:w-6" />
                <span className="text-sm font-bold sm:text-lg">
                  6:30 PM - 10:00 PM
                </span>
              </div>

              <div
                className={`${styles.floatLift} absolute bottom-8 left-4 flex max-w-[calc(100%-5rem)] items-center gap-2 rounded-full border border-[#1f1635]/5 bg-white px-4 py-3 shadow-2xl sm:bottom-10 sm:left-12 sm:max-w-none sm:gap-4 sm:px-8 sm:py-5`}
              >
                <MapPin className="h-5 w-5 text-[#7C3AED] sm:h-6 sm:w-6" />
                <span className="text-sm font-bold sm:text-lg">
                  The Glass House Venue
                </span>
              </div>

              <div className="absolute left-1/2 -top-8 z-10 w-max max-w-[calc(100%-2rem)] -translate-x-1/2 cursor-pointer rounded-full bg-[#7C3AED] px-5 py-3 text-white shadow-2xl shadow-[#7C3AED]/30 transition-transform hover:scale-105 sm:top-auto sm:bottom-24 sm:left-auto sm:right-12 sm:max-w-none sm:translate-x-0 sm:px-10 sm:py-6">
                <div className="flex items-center gap-2 sm:gap-4">
                  <CheckCircle2 className="h-5 w-5 sm:h-8 sm:w-8" />
                  <span className="text-sm font-extrabold sm:text-xl">
                    I&apos;m Attending!
                  </span>
                </div>
              </div>

              <div
                className={`${styles.halo} absolute inset-0 -z-10 scale-125 rounded-full`}
              />
            </div>

            <div className="flex-1">
              <h2
                className={`${styles.headline} mb-8 text-4xl font-bold tracking-tight lg:text-5xl`}
              >
                Designed to Get a &apos;Yes&apos;.
              </h2>
              <p className="mb-12 text-xl font-medium leading-relaxed text-[#53496b]">
                We&apos;ve optimized the RSVP experience to be frictionless. No
                accounts required for guests-just simple, beautiful interactions
                that make people excited to attend.
              </p>
              <ul className="space-y-8">
                {rsvpHighlights.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-5 text-lg font-bold text-[#1f1635]"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7C3AED]/10 text-[#7C3AED]">
                      <CheckCircle2 size={18} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[3rem] bg-[#7C3AED]/5 p-8 text-center sm:p-16 lg:p-24">
            <div className="absolute -right-10 -top-10 p-12 text-[#7C3AED] opacity-5">
              <Sparkles size={240} />
            </div>
            <h2
              className={`${styles.headline} relative z-10 mx-auto mb-8 text-[2rem] font-extrabold leading-[1.08] tracking-tight text-[#1f1635] sm:text-4xl lg:text-6xl`}
            >
              Turn Your Next Invite Into a
              <br className="sm:hidden" />{" "}
              <span className="italic text-[#7C3AED]">Shareable Event</span>.
            </h2>
            <p className="relative z-10 mx-auto mb-14 max-w-2xl text-xl font-medium text-[#53496b]">
              Snap it. Edit it. Share it. Your digital curator is ready to
              transform your celebrations.
            </p>
            <PrimaryCta
              href="/snap"
              className="relative z-10 h-[5.5rem] px-14 text-2xl"
            >
              Try Snap Upload
            </PrimaryCta>
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
