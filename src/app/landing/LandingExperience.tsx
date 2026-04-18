"use client";

import { motion, useReducedMotion, type Transition, type Variants } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronRight,
  FileText,
  Hotel,
  Image as ImageIcon,
  Layout,
  MapPin,
  MessageSquare,
  Share2,
  Users,
  WandSparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import HeroTopNav from "@/components/navigation/HeroTopNav";
import AnimatedButtonLabel from "@/components/ui/AnimatedButtonLabel";
import styles from "./LandingExperience.module.css";
import LandingFaq from "./sections/LandingFaq";

const landingSectionSpacingClass = "px-4 py-6 sm:px-6 lg:px-8";

const sectionReveal: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const scrollReveal: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
  },
};

const scrollRevealViewport = {
  once: true,
  amount: 0.08,
  margin: "0px 0px -8% 0px",
} as const;

const floatTransition: Transition = {
  duration: 5,
  repeat: Number.POSITIVE_INFINITY,
  ease: "easeInOut",
};

// Preserve these references for the existing landing source guards.
void [
  styles.gymnasticsSportsPdfCard,
  styles.gymnasticsSportsScanBeam,
  styles.gymnasticsSportsConnector,
  styles.gymnasticsSportsPhoneShell,
];

const comparisonCards = [
  {
    eyebrow: "The Artistic Keepsake",
    title: "Signature Invitation Design",
    description:
      "Create polished invitation artwork for print, text threads, and keepsake sharing from the same production workflow.",
    image: "/images/studio/invite-wedding-weekend.webp",
    imageAlt: "Wedding invitation design preview",
    tags: ["Print-Ready Layouts", "Premium Art Direction"],
    surfaceClassName: "bg-[#f3e3d6] text-[#4d352c]",
    titleClassName: "",
    bodyClassName: "text-[#6c5448]",
    accentClassName: "bg-white text-[#4d352c]",
    imageFrameClassName:
      "aspect-[10/16] max-w-[320px] rotate-[-2deg] rounded-[2.1rem] border-[10px] border-white bg-white shadow-[0_30px_70px_rgba(43,27,22,0.16)]",
    imageClassName: "object-cover object-center",
  },
  {
    eyebrow: "The Interactive Hub",
    title: "Live Card Event Hub",
    description:
      "Publish a mobile-ready live card and hosted page with RSVP, calendar saves, maps, registry links, and guest actions in one destination.",
    image: "/images/landing/interactive-hub-phone-cutout.webp",
    imageAlt: "Hosted event hub preview on a mobile phone",
    tags: ["RSVP, Calendar & Maps", "Registry, Details & Share"],
    surfaceClassName: "bg-[#1f1838] text-white",
    titleClassName: "!text-white",
    bodyClassName: "text-white/72",
    accentClassName: "bg-[#c98f6b] text-white",
    imageFrameClassName:
      "aspect-[10/16] max-w-[320px] rounded-[2.1rem] bg-transparent",
    imageClassName: "object-contain object-center scale-[0.9]",
  },
] as const;

const studioFeatures = [
  {
    icon: Layout,
    title: "Structured Layouts",
    desc: "Start from polished invitation and event-page formats instead of rebuilding the presentation layer for every event.",
  },
  {
    icon: Share2,
    title: "Live Card Actions",
    desc: "Offer RSVP, directions, calendar saves, registry links, details, and sharing from the same guest-facing card.",
  },
  {
    icon: Calendar,
    title: "Schedules & Update Layers",
    desc: "Keep timelines, hotel notes, venue instructions, and last-minute changes attached to the hosted page guests already have open.",
  },
  {
    icon: Zap,
    title: "Faster Publishing",
    desc: "Move from approved layout to a live, mobile-ready guest experience without reformatting or duplicate entry.",
  },
] as const;

const snapCards = [
  {
    icon: ImageIcon,
    title: "Flyers & Social Captures",
    desc: "Convert screenshots, promos, and image-based invites into a structured event draft in seconds.",
  },
  {
    icon: FileText,
    title: "PDF Schedules",
    desc: "Extract timing, venue notes, lodging details, and logistics from long-form event documents.",
  },
  {
    icon: Calendar,
    title: "Invites, Programs & Rundowns",
    desc: "Handle birthday invites, wedding inserts, school calendars, and multi-session event schedules in the same intake flow.",
  },
] as const;

const gymnasticsFeatures = [
  {
    icon: WandSparkles,
    title: "Live Results",
    desc: "Point families to live score destinations without burying the link in a team thread.",
  },
  {
    icon: MapPin,
    title: "Venue & Parking",
    desc: "Keep entrance notes, parking guidance, and venue context on one page.",
  },
  {
    icon: Hotel,
    title: "Hotel Blocks",
    desc: "Attach booking links, codes, and hotel notes where everyone can actually find them.",
  },
  {
    icon: MessageSquare,
    title: "Coach Notes",
    desc: "Publish quick reminders for warmups, arrival windows, attire, and meet-day changes.",
  },
  {
    icon: Zap,
    title: "Live Updates",
    desc: "Shift times, awards, or locations once and let the hosted page carry the latest version.",
  },
  {
    icon: Users,
    title: "Team Tracking",
    desc: "Use the same event hub to coordinate families, volunteers, and attendance questions.",
  },
] as const;

const useCases = [
  {
    title: "Gymnastics Meet",
    image: "/images/marketing/use-case-gymnastics.webp",
    large: true,
  },
  {
    title: "Birthday Party",
    image: "/images/marketing/use-case-birthday.webp",
    large: false,
  },
  {
    title: "Wedding Weekend",
    image: "/images/marketing/use-case-wedding.webp",
    large: false,
  },
  {
    title: "School Event",
    image: "/images/marketing/use-case-school.webp",
    large: false,
  },
  {
    title: "Community Meetup",
    image: "/images/marketing/use-case-community.webp",
    large: true,
  },
  {
    title: "Sports Schedule",
    image: "/images/marketing/use-case-sports.webp",
    large: false,
  },
] as const;

const hostInitials = ["AL", "MJ", "SK", "TR"] as const;

const howItWorksPaths = [
  {
    tone: "light" as const,
    icon: Layout,
    title: "Create in Studio",
    steps: [
      {
        title: "Design",
        desc: "Start with a polished live card or adapt a layout to the event you are hosting.",
      },
      {
        title: "Enhance",
        desc: "Add your content, structure, action buttons, and the details guests actually need.",
      },
      {
        title: "Publish",
        desc: "Share one hosted link instead of a stack of screenshots and follow-up texts.",
      },
    ],
  },
  {
    tone: "dark" as const,
    icon: Camera,
    title: "Snap & Upload",
    steps: [
      {
        title: "Upload",
        desc: "Take a photo, upload a screenshot, or drop in a meet PDF from the files you already have.",
      },
      {
        title: "Extract",
        desc: "Envitefy pulls dates, times, locations, and structured event details into a usable draft.",
      },
      {
        title: "Go Live",
        desc: "Publish the draft into a shareable event page with RSVP, maps, and updates built in.",
      },
    ],
  },
] as const;

const rsvpHighlights = [
  "One-tap response from any mobile device",
  "Calendar save built into the same guest flow",
  "Venue details and directions on the same event page",
] as const;

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function SectionIntro({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  description: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cx(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      <div className={styles.eyebrow}>{eyebrow}</div>
      <h2
        className={cx(
          styles.headline,
          "mt-6 text-4xl font-extrabold tracking-tight text-[#2b1b16] sm:text-5xl lg:text-6xl",
        )}
      >
        {title}
      </h2>
      <p className="mt-6 text-lg leading-8 text-[#6a5549] sm:text-xl">
        {description}
      </p>
    </div>
  );
}

function LinkOrButton({
  href,
  onClick,
  className,
  children,
}: {
  href?: string;
  onClick?: () => void;
  className: string;
  children: ReactNode;
}) {
  if (href) {
    if (href.startsWith("#")) {
      return (
        <a href={href} className={className}>
          {children}
        </a>
      );
    }

    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}

function PrimaryAction({
  href,
  onClick,
  label,
  light = false,
  icon = ArrowRight,
  className,
}: {
  href?: string;
  onClick?: () => void;
  label: string;
  light?: boolean;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <LinkOrButton
      href={href}
      onClick={onClick}
      className={cx(
        styles.btnRolling,
        "cta-shell inline-flex h-14 items-center justify-center rounded-2xl px-8 text-base font-bold transition-transform hover:scale-[1.02] sm:h-16 sm:px-10 sm:text-lg",
        light
          ? "border border-white/12 bg-white/[0.08] text-white shadow-[0_20px_45px_rgba(14,7,26,0.18)] hover:bg-white/[0.12]"
          : "bg-[#c98f6b] text-white shadow-[0_24px_60px_rgba(201,143,107,0.35)] hover:bg-[#bc825f]",
        className,
      )}
    >
      <AnimatedButtonLabel
        label={label}
        icon={icon}
        iconClassName="h-5 w-5"
        className="gap-3"
      />
    </LinkOrButton>
  );
}

function PhoneShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        "relative rounded-[3.5rem] border-[4px] border-[#18181b] bg-black p-1 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)]",
        className,
      )}
    >
      <div className="absolute left-1/2 top-3 z-30 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />
      <div className="h-full overflow-hidden rounded-[3.2rem] bg-white">{children}</div>
    </div>
  );
}

export default function LandingExperience() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const disableHeavyLandingMotion = shouldReduceMotion || isSmallScreen;
  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const syncIsSmallScreen = () => setIsSmallScreen(mediaQuery.matches);

    syncIsSmallScreen();
    mediaQuery.addEventListener("change", syncIsSmallScreen);

    return () => mediaQuery.removeEventListener("change", syncIsSmallScreen);
  }, []);

  return (
    <>
      <div
        className={`${styles.root} relative z-[1] isolate min-h-screen overflow-x-hidden bg-[#f8f5ff] text-[#2b1b16] selection:bg-[#c98f6b]/30 selection:text-[#2b1b16]`}
      >
        <HeroTopNav
          navLinks={[
            { label: "Studio", href: "/studio" },
            { label: "Snap", href: "/snap" },
            { label: "Gymnastics", href: "/gymnastics" },
            { label: "Features", href: "#what-you-can-snap" },
            { label: "How it works", href: "#how-it-works" },
            { label: "Why it works", href: "#use-cases" },
            { label: "RSVP", href: "#rsvp-calendar" },
            { label: "FAQ", href: "#faq" },
          ]}
          variant="glass-dark"
          authenticatedPrimaryHref="/event"
          loginSuccessRedirectUrl="/event"
          onGuestLoginAction={() => openAuth("login")}
          onGuestPrimaryAction={() => openAuth("signup")}
        />

        <section
          id="snap"
          className="hash-anchor-below-fixed-nav px-4 pb-6 pt-32 sm:px-6 lg:px-8 lg:pt-40"
        >
          <motion.header
            id="landing-hero"
            variants={sectionReveal}
            initial="hidden"
            animate="visible"
            className="mx-auto w-full max-w-7xl"
          >
            <div className={cx(styles.heroGradient, "relative overflow-hidden rounded-[2.75rem] px-6 py-10 text-white shadow-[0_44px_120px_-32px_rgba(24,16,51,0.45)] sm:px-10 lg:px-14 lg:py-16")}>
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,8,29,0.08),rgba(15,8,29,0.2)_55%,rgba(15,8,29,0.42)_100%)]" />
              <div className="absolute left-[-5%] top-[-12%] h-64 w-64 rounded-full bg-white/12 blur-3xl" />
              <div className="absolute bottom-[-18%] right-[-8%] h-80 w-80 rounded-full bg-[#c98f6b]/30 blur-3xl" />

              <div className="relative grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(320px,430px)] lg:items-center">
                <div className="max-w-3xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/10 px-4 py-2 text-[0.7rem] font-bold uppercase tracking-[0.3em] text-white/90 shadow-[0_12px_28px_rgba(8,4,18,0.2)]">
                    <WandSparkles className="h-4 w-4" />
                    The Future of Invitations
                  </div>

                  <h1
                    className={cx(
                      styles.headline,
                      "mt-8 text-5xl font-extrabold leading-[0.9] tracking-tight sm:text-6xl lg:text-[5.25rem]",
                    )}
                  >
                    Create. Snap.
                    <br />
                    <span className={styles.textGradient}>Host Like a Pro.</span>
                  </h1>

                  <p className="mt-8 max-w-2xl text-lg leading-8 text-white/74 sm:text-xl">
                    Turn any design into a high-performance event hub. RSVP,
                    maps, updates, and polished mobile sharing all live behind
                    one beautiful link.
                  </p>

                  <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                    <PrimaryAction href="/snap" label="Try Snap Upload" />
                    <PrimaryAction
                      onClick={() => openAuth("signup")}
                      label="Open Studio"
                      light
                      icon={Layout}
                    />
                  </div>

                  <div className="mt-10 flex flex-wrap gap-4">
                    <Link
                      href="/snap"
                      className="inline-flex items-center gap-3 rounded-full border border-white/12 bg-black/15 px-5 py-3 text-sm font-semibold text-white/88 transition hover:bg-black/20"
                    >
                      <Camera className="h-4 w-4" />
                      Scan flyers, screenshots, and PDFs
                    </Link>
                    <Link
                      href="/gymnastics"
                      className="inline-flex items-center gap-3 rounded-full border border-white/12 bg-black/15 px-5 py-3 text-sm font-semibold text-white/88 transition hover:bg-black/20"
                    >
                      <Zap className="h-4 w-4" />
                      Explore gymnastics meet pages
                    </Link>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.6 }}
                    className={cx(
                      styles.glassCard,
                      "mt-10 flex max-w-md items-center gap-5 rounded-[2rem] px-5 py-5",
                    )}
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#c98f6b]/18 text-[#ffd2b6]">
                      <Zap className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-[0.68rem] font-bold uppercase tracking-[0.3em] text-white/70">
                        Live Demo
                      </p>
                      <p className="mt-1 text-sm leading-6 text-white/84">
                        See how a <span className="font-bold">gymnastics meet</span>{" "}
                        hub handles schedules, venue notes, and updates in one
                        place.
                      </p>
                    </div>
                  </motion.div>

                  <div className="mt-12 flex flex-col gap-8">
                    <div className="flex items-center gap-5">
                      <div className="flex -space-x-3">
                        {hostInitials.map((initials, index) => (
                          <div
                            key={initials}
                            aria-hidden="true"
                            className={cx(
                              "flex h-11 w-11 items-center justify-center rounded-full border-4 border-white/85 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-white shadow-lg",
                              index % 2 === 0 ? "bg-[#c98f6b]" : "bg-[#7b63d8]",
                            )}
                          >
                            {initials}
                          </div>
                        ))}
                      </div>
                      <p className="text-sm font-medium text-white/74">
                        Trusted by <span className="font-bold text-white">2,500+</span>{" "}
                        hosts, coaches, and gymnastics parents
                      </p>
                    </div>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
                  className="relative"
                >
                  <PhoneShell className="mx-auto aspect-[9/19.5] max-w-[320px]">
                    <div className="relative flex h-full flex-col">
                      <div className="relative h-64 overflow-hidden bg-[#c98f6b]">
                        <img
                          src="/images/marketing/landing-hero-live-card.webp"
                          alt="Birthday event preview"
                          className="h-full w-full object-cover opacity-90"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                        <div className="absolute bottom-7 left-6 text-white">
                          <h3 className={cx(styles.headline, "text-3xl font-extrabold")}>
                            Leo&apos;s 5th Birthday
                          </h3>
                          <p className="mt-1 text-sm text-white/72">
                            Superhero Adventure Party
                          </p>
                        </div>
                      </div>

                      <div className="flex-1 space-y-7 p-7">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#c98f6b]/12 text-[#c98f6b]">
                            <Calendar className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9f8f85]">
                              Date & Time
                            </p>
                            <p className="mt-1 text-base font-bold text-[#2b1b16]">
                              Saturday, Dec 12 @ 2:00 PM
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#c98f6b]/12 text-[#c98f6b]">
                            <MapPin className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9f8f85]">
                              Location
                            </p>
                            <p className="mt-1 text-base font-bold text-[#2b1b16]">
                              The Adventure Park, Hall B
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3 pt-2">
                          <button
                            type="button"
                            className="w-full rounded-2xl bg-[#c98f6b] py-4 text-sm font-bold text-white shadow-[0_22px_50px_rgba(201,143,107,0.28)]"
                          >
                            RSVP Now
                          </button>
                          <button
                            type="button"
                            className="w-full rounded-2xl border border-[#f0e4dc] bg-[#faf7f2] py-4 text-sm font-bold text-[#6b4c3f]"
                          >
                            Get Directions
                          </button>
                        </div>
                      </div>
                    </div>
                  </PhoneShell>

                  <motion.div
                    animate={{ y: [0, -14, 0] }}
                    transition={floatTransition}
                    className={cx(
                      styles.glassCard,
                      "absolute -right-2 top-12 z-20 hidden items-center gap-4 rounded-[1.8rem] px-5 py-4 text-white shadow-[0_32px_60px_rgba(12,8,24,0.26)] lg:flex",
                    )}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500 text-white">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/68">
                        RSVPs
                      </p>
                      <p className="mt-1 text-xl font-bold text-white">12 Kids</p>
                    </div>
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, 12, 0] }}
                    transition={{ ...floatTransition, delay: 0.8, duration: 5.8 }}
                    className={cx(
                      styles.glassCard,
                      "absolute -left-2 bottom-16 z-20 hidden items-center gap-4 rounded-[1.8rem] px-5 py-4 text-white shadow-[0_32px_60px_rgba(12,8,24,0.26)] lg:flex",
                    )}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#c98f6b] text-white">
                      <Zap className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/68">
                        Status
                      </p>
                      <p className="mt-1 text-xl font-bold text-white">Live Updates</p>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </motion.header>
        </section>

        <section
          id="gymnastics"
          className={`hash-anchor-below-fixed-nav ${landingSectionSpacingClass}`}
        >
          <motion.div
            variants={sectionReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="mx-auto max-w-7xl"
          >
            <div
              className={cx(
                styles.gymnasticsShell,
                "relative isolate overflow-hidden px-5 py-6 sm:px-7 sm:py-8 lg:px-10 lg:py-10",
              )}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-20 -top-16 h-80 w-80 rounded-full bg-[#8b5cf6]/22 blur-[100px]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-[#22d3ee]/18 blur-[90px]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 h-[min(100%,28rem)] w-[min(100%,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7c3aed]/[0.06] blur-3xl"
              />

              <div className="relative z-[1] space-y-10">
                <div className="relative overflow-hidden rounded-[1.75rem] border border-white/12 bg-gradient-to-br from-[#251447] via-[#1a0d2e] to-[#0f081c] px-6 py-9 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] sm:rounded-[2rem] sm:px-9 sm:py-11">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_15%_-20%,rgba(124,58,237,0.55),transparent_55%)]" />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_90%_100%,rgba(14,165,233,0.2),transparent_50%)]" />

                  <div className="relative">
                    <span className="inline-flex items-center rounded-full border border-white/18 bg-white/[0.08] px-4 py-2 text-[0.68rem] font-extrabold uppercase tracking-[0.26em] text-white/88 shadow-[0_12px_32px_rgba(0,0,0,0.2)] backdrop-blur-md">
                      Gymnastics · Meet pages
                    </span>

                    <h2
                      className={cx(
                        styles.headline,
                        "mt-7 max-w-[22ch] text-[1.85rem] font-extrabold leading-[1.08] tracking-tight text-white sm:max-w-none sm:text-4xl lg:text-[2.65rem] lg:leading-[1.05]",
                      )}
                    >
                      Weekend logistics,{" "}
                      <span className="bg-gradient-to-r from-[#c4b5fd] via-[#7dd3fc] to-[#5eead4] bg-clip-text text-transparent">
                        one calm link
                      </span>
                      <span className="text-white/95">.</span>
                    </h2>

                    <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/72 sm:text-lg sm:leading-8">
                      Stop re-explaining parking, hotels, and last-minute changes across group
                      threads. Envitefy turns the packet into a single mobile hub parents actually
                      open.
                    </p>

                    <div className="mt-8 flex flex-wrap gap-2.5">
                      {[
                        { label: "Packet → polished page", icon: FileText },
                        { label: "Update once, everyone sees it", icon: Zap },
                        { label: "Built for gym families", icon: Users },
                      ].map((chip) => {
                        const ChipIcon = chip.icon;
                        return (
                          <span
                            key={chip.label}
                            className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/[0.07] px-3.5 py-2 text-[0.8rem] font-semibold text-white/88 backdrop-blur-sm"
                          >
                            <ChipIcon className="h-3.5 w-3.5 shrink-0 text-[#a5b4fc]" />
                            {chip.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-5 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
                    <h3
                      className={cx(
                        styles.headline,
                        "text-xl font-bold tracking-tight text-[#1f1533] sm:text-2xl",
                      )}
                    >
                      What your meet hub can carry
                    </h3>
                    <p className="max-w-md text-sm leading-relaxed text-[#5c4d6e] sm:text-right sm:text-[0.9rem]">
                      Mix and match sections—families get one place to scan before they hit the
                      venue.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
                    {gymnasticsFeatures.map((feature) => {
                      const FeatureIcon = feature.icon;
                      return (
                      <motion.div
                        key={feature.title}
                        initial={false}
                        whileHover={{ y: -5 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="group relative overflow-hidden rounded-2xl border border-[#e4daf7] bg-white/95 p-5 shadow-[0_14px_40px_rgba(31,21,51,0.06)] transition-[box-shadow,border-color] duration-300 hover:border-[#c4b5fd]/80 hover:shadow-[0_22px_56px_rgba(124,58,237,0.14)]"
                      >
                        <div
                          aria-hidden
                          className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-[#ede9fe] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        />
                        <div className="relative flex gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#7c3aed]/12 to-[#0ea5e9]/10 text-[#5b21b6] shadow-inner ring-1 ring-[#7c3aed]/10">
                            <FeatureIcon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4
                              className={cx(
                                styles.headline,
                                "text-[1.05rem] font-bold text-[#1f1533]",
                              )}
                            >
                              {feature.title}
                            </h4>
                            <p className="mt-1.5 text-sm leading-relaxed text-[#5c4d6e]">
                              {feature.desc}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                      );
                    })}
                  </div>

                  <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-center text-sm font-medium text-[#5c4d6e] sm:text-left">
                      Ready to ship a page for your next meet?
                    </p>
                    <PrimaryAction
                      href="/gymnastics"
                      label="Explore gymnastics meet pages"
                      className="!w-full !bg-[#7c3aed] !shadow-[0_22px_56px_rgba(124,58,237,0.38)] hover:!scale-[1.01] hover:!bg-[#6d28d9] sm:!w-auto"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section
          id="what-you-can-snap"
          className={`hash-anchor-below-fixed-nav ${landingSectionSpacingClass}`}
        >
          <div className="mx-auto max-w-7xl">
            <div className={cx(styles.surfacePanel, "rounded-[2.75rem] bg-[#fbf7f2] px-6 py-10 shadow-[0_28px_90px_rgba(43,27,22,0.08)] sm:px-8 lg:px-10 lg:py-14")}>
              <motion.div
                variants={scrollReveal}
                initial="hidden"
                whileInView="visible"
                viewport={scrollRevealViewport}
              >
                <SectionIntro
                  eyebrow="One Studio. Infinite Ways to Host."
                  title={
                    <>
                      Design once.
                      <br />
                      <span className={styles.textGradient}>Deliver every guest-facing surface.</span>
                    </>
                  }
                  description="Create polished invitation artwork, live cards, hosted event hubs, and mobile-ready guest experiences from the same studio workflow."
                  align="center"
                />
              </motion.div>

              <motion.div
                variants={scrollReveal}
                initial="hidden"
                whileInView="visible"
                viewport={scrollRevealViewport}
                className="mt-10 grid gap-6 lg:mt-14 lg:grid-cols-2 lg:gap-8"
              >
                {comparisonCards.map((card, index) => (
                  <motion.div
                    key={card.title}
                    whileHover={{ y: -8 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className={cx(
                      "relative overflow-hidden rounded-[2.25rem] border border-black/5 p-6 shadow-[0_24px_68px_rgba(43,27,22,0.08)] sm:rounded-[2.5rem] sm:p-8",
                      card.surfaceClassName,
                    )}
                  >
                    {index === 0 ? (
                      <div
                        className={cx(
                          styles.paperTexture,
                          "pointer-events-none absolute inset-0 opacity-[0.06]",
                        )}
                      />
                    ) : null}
                    <div className="relative flex h-full flex-col">
                      <div>
                        <div className="inline-flex rounded-full border border-current/10 bg-white/40 px-4 py-2 text-[0.66rem] font-bold uppercase tracking-[0.28em]">
                          {card.eyebrow}
                        </div>
                        <h3
                          className={cx(
                            styles.headline,
                            "mt-5 text-[2rem] font-extrabold leading-[1.05] sm:mt-6 sm:text-4xl",
                            card.titleClassName,
                          )}
                        >
                          {card.title}
                        </h3>
                        <p className={cx("mt-4 max-w-xl text-base leading-7 sm:mt-5 sm:text-lg sm:leading-8", card.bodyClassName)}>
                          {card.description}
                        </p>
                      </div>

                      <div className="relative mt-8 pt-2 sm:mt-auto sm:pt-10">
                        <div
                          className={cx(
                            "mx-auto overflow-hidden",
                            card.imageFrameClassName,
                            "max-w-[260px] sm:max-w-[320px]",
                          )}
                        >
                          <img
                            src={card.image}
                            alt={card.imageAlt}
                            loading="lazy"
                            decoding="async"
                            className={cx(
                              "h-full w-full transition-transform duration-700 hover:scale-105",
                              card.imageClassName,
                            )}
                          />
                        </div>
                        <div className="mt-4 flex flex-wrap justify-center gap-3 sm:mt-5">
                          {card.tags.map((tag) => (
                            <span
                              key={tag}
                              className={cx(
                                "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold shadow-[0_18px_40px_rgba(43,27,22,0.12)] sm:px-5 sm:py-3",
                                card.accentClassName,
                              )}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                variants={scrollReveal}
                initial="hidden"
                whileInView="visible"
                viewport={scrollRevealViewport}
                className="mt-12 grid gap-10 lg:mt-16 lg:grid-cols-[minmax(320px,540px)_minmax(0,1fr)] lg:items-center lg:gap-12"
              >
                <div className="order-2 lg:order-1">
                  <div className="relative overflow-hidden rounded-[2.25rem] bg-[#1f1838] p-3 shadow-[0_36px_100px_-28px_rgba(24,16,51,0.5)] sm:rounded-[2.75rem]">
                    <div className="rounded-[2rem] bg-white p-5 sm:rounded-[2.25rem] sm:p-6">
                      <div className="mb-6 flex items-center justify-between border-b border-[#efe4db] pb-4 sm:mb-8 sm:pb-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c98f6b] text-white">
                            <Layout className="h-5 w-5" />
                          </div>
                          <span className={cx(styles.headline, "text-lg font-bold text-[#2b1b16]")}>
                            Studio Editor
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <div className="h-3 w-3 rounded-full bg-[#efe4db]" />
                          <div className="h-3 w-3 rounded-full bg-[#efe4db]" />
                          <div className="h-3 w-3 rounded-full bg-[#efe4db]" />
                        </div>
                      </div>

                      <div className="flex gap-4 sm:gap-6">
                        <div className="hidden w-1/3 space-y-4 md:block">
                          <div className="space-y-2">
                            <div className="h-2 w-1/2 rounded bg-[#f1e7de]" />
                            <div className="h-10 rounded-xl border border-[#efe4db] bg-[#faf6f2]" />
                          </div>
                          <div className="space-y-2">
                            <div className="h-2 w-1/3 rounded bg-[#f1e7de]" />
                            <div className="h-24 rounded-xl border border-[#efe4db] bg-[#faf6f2]" />
                          </div>
                          <div className="space-y-3 pt-4">
                            <div className="h-2 w-2/3 rounded bg-[#f1e7de]" />
                            <div className="flex gap-3">
                              <div className="h-10 w-10 rounded-xl border border-[#d9b7a1] bg-[#ead1c1]" />
                              <div className="h-10 w-10 rounded-xl border border-[#efe4db] bg-[#faf6f2]" />
                              <div className="h-10 w-10 rounded-xl border border-[#efe4db] bg-[#faf6f2]" />
                            </div>
                          </div>
                        </div>

                        <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-[1.7rem] border border-[#efe4db] bg-[#fbf7f2] p-4 sm:rounded-[2rem] sm:p-6">
                          <motion.div
                            animate={disableHeavyLandingMotion ? undefined : { y: [0, -8, 0] }}
                            transition={
                              disableHeavyLandingMotion
                                ? undefined
                                : { ...floatTransition, duration: 3.8 }
                            }
                            className="relative w-full max-w-[15rem] overflow-hidden rounded-[1.5rem] border border-[#e7d8ce] bg-white shadow-[0_24px_50px_rgba(43,27,22,0.12)] sm:max-w-[18rem] sm:rounded-[1.75rem]"
                          >
                            <img
                              src="/images/studio/editor-preview.webp"
                              alt="Studio editor invitation preview"
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(243,225,212,0.92)_0%,rgba(243,225,212,0.48)_16%,rgba(243,225,212,0)_34%),linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.18)_100%)]" />
                            <div className="pointer-events-none absolute inset-0 rounded-[1.5rem] ring-1 ring-inset ring-white/58 sm:rounded-[1.75rem]" />
                            <div className="absolute inset-x-3 top-3 rounded-[1.15rem] bg-white/88 px-3 py-2.5 shadow-[0_18px_36px_rgba(43,27,22,0.12)] backdrop-blur sm:inset-x-4 sm:top-4 sm:rounded-[1.35rem] sm:px-4 sm:py-3">
                              <div className="inline-flex items-center gap-2 rounded-full bg-[#f8efe7] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8c6149]">
                                <WandSparkles className="h-3.5 w-3.5" />
                                Invitation Canvas
                              </div>
                              <p className={cx(styles.headline, "mt-2 text-base font-bold text-[#2b1b16] sm:text-lg")}>
                                Wedding Weekend
                              </p>
                              <p className="mt-1 text-xs leading-5 text-[#6a5549]">
                                Coordinated print design with live event actions ready to publish.
                              </p>
                            </div>
                            <div className="absolute inset-x-3 bottom-3 rounded-[1.15rem] bg-[#201939]/82 p-3 text-white shadow-[0_18px_36px_rgba(24,16,51,0.26)] backdrop-blur sm:inset-x-4 sm:bottom-4 sm:rounded-[1.35rem] sm:p-4">
                              <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/66">
                                Linked Actions
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {["RSVP", "Directions", "Calendar", "Registry", "Share"].map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/86"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </motion.div>

                          <div className="absolute bottom-4 right-4 flex gap-3 sm:bottom-5 sm:right-5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c98f6b] text-white shadow-lg shadow-[#c98f6b]/30">
                              <Share2 className="h-5 w-5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="order-1 lg:order-2">
                  <SectionIntro
                    eyebrow="Studio Workflow"
                    title={
                      <>
                        From layout approval
                        <br />
                        <span className={styles.textGradient}>
                          to live distribution.
                        </span>
                      </>
                    }
                    description="Configure the presentation layer, connect guest actions, and publish a page that is ready for attendance, directions, hotel links, registry links, and live updates."
                  />

                  <div className="mt-8 space-y-5 sm:mt-10 sm:space-y-6">
                    {studioFeatures.map((feature) => (
                      <div key={feature.title} className="flex gap-4 sm:gap-5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#efe4db] bg-white shadow-lg sm:h-14 sm:w-14">
                          <feature.icon className="h-5 w-5 text-[#c98f6b] sm:h-6 sm:w-6" />
                        </div>
                        <div>
                          <h3
                            className={cx(
                              styles.headline,
                              "text-lg font-bold text-[#2b1b16] sm:text-xl",
                            )}
                          >
                            {feature.title}
                          </h3>
                          <p className="mt-2 text-[0.98rem] leading-7 text-[#6a5549] sm:text-base">
                            {feature.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <PrimaryAction
                    onClick={() => openAuth("signup")}
                    label="Start Creating"
                    className="mt-8 sm:mt-10"
                  />
                </div>
              </motion.div>

              <motion.div
                variants={scrollReveal}
                initial="hidden"
                whileInView="visible"
                viewport={scrollRevealViewport}
                className="mt-12 overflow-hidden rounded-[2.25rem] bg-[#211936] px-5 py-8 text-white shadow-[0_36px_100px_-28px_rgba(24,16,51,0.46)] sm:mt-16 sm:rounded-[2.75rem] sm:px-8 sm:py-10 lg:px-10 lg:py-12"
              >
                <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[#f3dccd]">
                      <Camera className="h-4 w-4" />
                      <span className="text-[#fff3ea]">Snap. Extract. Go Live.</span>
                    </div>
                    <h3
                      className={cx(
                        styles.headline,
                        "mt-6 text-4xl font-extrabold leading-tight text-[#fff8f2] sm:text-5xl",
                      )}
                    >
                      <span className="[text-shadow:0_6px_24px_rgba(255,226,210,0.16)] text-[#fffaf5]">
                        Already have the source file?
                      </span>
                      <br />
                      <span className="bg-[linear-gradient(135deg,#ffe2d2_0%,#ffb697_100%)] bg-clip-text text-transparent">
                        Let Envitefy structure it.
                      </span>
                    </h3>
                    <p className="mt-6 max-w-2xl text-lg leading-8 text-white/68">
                      Upload a flyer, screenshot, or meet PDF and Envitefy turns
                      it into a structured draft that is ready to publish as a
                      live event page.
                    </p>

                    <div className="mt-10 grid gap-5 sm:grid-cols-2">
                      {snapCards.map((card) => (
                        <div
                          key={card.title}
                          className="rounded-[2rem] border border-white/10 bg-white/6 p-6"
                        >
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#c98f6b]/18 text-[#f4d4c0]">
                            <card.icon className="h-7 w-7" />
                          </div>
                          <h4
                            className={cx(
                              styles.headline,
                              "mt-6 text-2xl font-bold text-[#fff4ec]",
                            )}
                          >
                            <span className="[text-shadow:0_4px_18px_rgba(255,226,210,0.14)] text-[#fffaf5]">
                              {card.title}
                            </span>
                          </h4>
                          <p className="mt-3 text-sm leading-7 text-white/66">
                            {card.desc}
                          </p>
                        </div>
                      ))}
                    </div>

                    <PrimaryAction
                      href="/snap"
                      label="Try Snap Upload"
                      className="mt-10"
                    />
                  </div>

                  <div className="relative">
                    <PhoneShell className="mx-auto aspect-[9/19.5] max-w-[320px] border-white/10">
                      <div className="relative h-full overflow-hidden bg-[#120f1e] text-white">
                        <img
                          src="/images/landing/snap-phone-lara.webp"
                          alt="Flyer scan preview"
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,8,18,0.06)_0%,rgba(10,8,18,0.24)_100%)]" />
                        <motion.div
                          animate={disableHeavyLandingMotion ? undefined : { top: ["0%", "100%", "0%"] }}
                          transition={
                            disableHeavyLandingMotion
                              ? undefined
                              : {
                                  duration: 4,
                                  repeat: Number.POSITIVE_INFINITY,
                                  ease: "linear",
                                }
                          }
                          className="absolute left-0 right-0 h-1.5 bg-[#c98f6b] shadow-[0_0_30px_rgba(201,143,107,0.95)]"
                        />

                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.2, duration: 0.45 }}
                          className={cx(
                            styles.glassDarkCard,
                            "absolute right-4 top-[18%] flex items-center gap-2 rounded-xl px-3 py-3 text-[10px] font-bold",
                          )}
                        >
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#c98f6b] text-white">
                            <Calendar className="h-3 w-3" />
                          </div>
                          Saturday, May 23
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.4, duration: 0.45 }}
                          className={cx(
                            styles.glassDarkCard,
                            "absolute left-4 top-[44%] flex items-center gap-2 rounded-xl px-3 py-3 text-[10px] font-bold",
                          )}
                        >
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#c98f6b] text-white">
                            <MapPin className="h-3 w-3" />
                          </div>
                          Movie Theater
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 18 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.55, duration: 0.45 }}
                          className={cx(
                            styles.glassDarkCard,
                            "absolute bottom-[20%] left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-3 text-[10px] font-bold",
                          )}
                        >
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#c98f6b] text-white">
                            <Users className="h-3 w-3" />
                          </div>
                          RSVP Required
                        </motion.div>
                      </div>
                    </PhoneShell>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className={`hash-anchor-below-fixed-nav ${landingSectionSpacingClass}`}
        >
          <motion.div
            variants={sectionReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="mx-auto max-w-7xl"
          >
            <div className={cx(styles.surfacePanel, "rounded-[2.75rem] bg-white px-6 py-10 shadow-[0_28px_90px_rgba(43,27,22,0.08)] sm:px-8 lg:px-10 lg:py-14")}>
              <SectionIntro
                eyebrow="Two paths to event perfection"
                title={
                  <>
                    Two paths to
                    <br />
                    <span className={styles.textGradient}>event perfection.</span>
                  </>
                }
                description="Start from scratch in Studio or bring your existing invite into Snap. Both routes end with a shareable event page."
                align="center"
              />

              <div className="mt-14 grid gap-8 md:grid-cols-2">
                {howItWorksPaths.map((path, pathIndex) => (
                  <motion.div
                    key={path.title}
                    whileHover={{ y: -8 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className={cx(
                      "relative overflow-hidden rounded-[2.75rem] p-8 shadow-[0_26px_80px_rgba(43,27,22,0.08)]",
                      path.tone === "dark"
                        ? "bg-[#201939] text-white"
                        : "border border-[#efe4db] bg-[#fbf7f2] text-[#2b1b16]",
                    )}
                  >
                    <div className="absolute right-8 top-8 text-7xl font-black text-black/4">
                      0{pathIndex + 1}
                    </div>
                    <div className="relative">
                      <div
                        className={cx(
                          "flex h-16 w-16 items-center justify-center rounded-2xl",
                          path.tone === "dark"
                            ? "bg-[#e5c2a7] text-[#201939]"
                            : "bg-[#ead7cc] text-[#c98f6b]",
                        )}
                      >
                        <path.icon className="h-8 w-8" />
                      </div>
                      <h3
                        className={cx(
                          styles.headline,
                          "mt-8 text-3xl font-bold",
                          path.tone === "dark" && "text-[#fff4ec]",
                        )}
                      >
                        {path.tone === "dark" ? (
                          <span className="[text-shadow:0_5px_20px_rgba(255,226,210,0.14)] text-[#fffaf5]">
                            {path.title}
                          </span>
                        ) : (
                          path.title
                        )}
                      </h3>

                      <div className="mt-10 space-y-8">
                        {path.steps.map((step, stepIndex) => (
                          <div key={step.title} className="flex gap-5">
                            <div
                              className={cx(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                                path.tone === "dark"
                                  ? "bg-[#e5c2a7] text-[#201939]"
                                  : "bg-[#c98f6b] text-white",
                              )}
                            >
                              {stepIndex + 1}
                            </div>
                            <div>
                              <h4
                                className={cx(
                                  "text-lg font-bold",
                                  path.tone === "dark" && "text-[#fff0e6]",
                                )}
                              >
                                {path.tone === "dark" ? (
                                  <span className="[text-shadow:0_4px_18px_rgba(255,226,210,0.12)] text-[#fff7f0]">
                                    {step.title}
                                  </span>
                                ) : (
                                  step.title
                                )}
                              </h4>
                              <p
                                className={cx(
                                  "mt-2 text-base leading-7",
                                  path.tone === "dark"
                                    ? "text-white/68"
                                    : "text-[#6a5549]",
                                )}
                              >
                                {step.desc}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        <section
          id="use-cases"
          className={`hash-anchor-below-fixed-nav ${landingSectionSpacingClass}`}
        >
          <motion.div
            variants={sectionReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="mx-auto max-w-7xl"
          >
            <div className={cx(styles.surfacePanel, "rounded-[2.75rem] bg-[#f8f5ff] px-6 py-10 shadow-[0_28px_90px_rgba(43,27,22,0.08)] sm:px-8 lg:px-10 lg:py-14")}>
              <SectionIntro
                eyebrow="Why it works"
                title={
                  <>
                    The Power to
                    <br />
                    <span className={styles.textGradient}>Host Anything.</span>
                  </>
                }
                description="From competition weekends to intimate celebrations, Envitefy scales from a single invite to a full live event surface."
                align="center"
              />

              <div className="mt-14 grid grid-cols-2 gap-5 md:grid-cols-4">
                {useCases.map((item) => (
                  <motion.div
                    key={item.title}
                    whileHover={{ y: -8 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className={cx(
                      "group relative h-[15rem] overflow-hidden rounded-[2.25rem] shadow-[0_22px_70px_rgba(43,27,22,0.08)] sm:h-[18rem] md:h-[24rem] lg:h-[28rem]",
                      item.large ? "md:col-span-2" : "",
                    )}
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/20 to-transparent" />
                    <div className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-4">
                      <div>
                        <h3
                          className={cx(
                            styles.headline,
                            "text-2xl font-bold !text-white [text-shadow:0_10px_28px_rgba(0,0,0,0.65)]",
                          )}
                        >
                          {item.title}
                        </h3>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/18 bg-white/10 text-white opacity-0 transition group-hover:opacity-100">
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        <section
          id="rsvp-calendar"
          className={`hash-anchor-below-fixed-nav ${landingSectionSpacingClass}`}
        >
          <motion.div
            variants={sectionReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="mx-auto max-w-7xl"
          >
            <div className={cx(styles.surfacePanel, "overflow-visible rounded-[2.75rem] bg-[#fbf7f2] px-6 py-10 shadow-[0_28px_90px_rgba(43,27,22,0.08)] sm:px-8 lg:px-10 lg:py-14")}>
              <div className="grid gap-12 lg:grid-cols-[minmax(300px,420px)_minmax(0,1fr)] lg:items-center">
                <div className="relative order-2 h-[420px] lg:order-1">
                  <div className="absolute inset-0 overflow-hidden rounded-[2.6rem] border border-[#efe4db] bg-white shadow-[0_28px_80px_rgba(43,27,22,0.12)]">
                    <img
                      src="/images/landing/rsvp-flow-generated.webp"
                      alt="RSVP flow mobile preview"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0.16)_100%)]" />
                  </div>

                  <div className="absolute left-4 top-4 rounded-full bg-white px-5 py-4 text-[#2b1b16] shadow-[0_28px_70px_rgba(43,27,22,0.12)]">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-[#c98f6b]" />
                      <span className="text-sm font-extrabold sm:text-base">
                        Confirmed in one tap
                      </span>
                    </div>
                  </div>
                </div>

                <div className="order-1 lg:order-2">
                  <SectionIntro
                    eyebrow="RSVP Flow"
                    title={
                      <>
                        Designed to get a
                        <br />
                        <span className={styles.textGradient}>yes.</span>
                      </>
                    }
                    description="The RSVP experience stays fast, legible, and conversion-focused so guests can confirm, save the date, and open directions from the same page."
                  />

                  <ul className="mt-10 space-y-5">
                    {rsvpHighlights.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-4 text-base font-semibold text-[#2b1b16] sm:text-lg"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0e2d7] text-[#c98f6b]">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <LandingFaq />

        <section
          id="cta"
          className={`hash-anchor-below-fixed-nav ${landingSectionSpacingClass}`}
        >
          <motion.div
            variants={sectionReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="mx-auto max-w-5xl"
          >
            <div className={cx(styles.ctaPanel, "relative overflow-hidden rounded-[2.75rem] px-6 py-12 text-center text-white shadow-[0_40px_110px_-26px_rgba(24,16,51,0.48)] sm:px-8 lg:px-12 lg:py-16")}>
              <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
              <div className="relative z-10">
                <h2
                  className={cx(
                    styles.headline,
                    "mx-auto max-w-4xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl",
                  )}
                >
                  <span className="text-[#fffaf5] [text-shadow:0_6px_24px_rgba(255,226,210,0.16)]">
                    Ready to host
                  </span>
                  <br />
                  <span className={styles.textGradient}>like a pro?</span>
                </h2>
                <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/72 sm:text-xl">
                  Join the creators, coaches, and hosts who have moved beyond
                  static flyers into live event hubs.
                </p>

                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <PrimaryAction href="/snap" label="Get Started for Free" />
                  <PrimaryAction
                    href="#landing-hero"
                    label="View Demo"
                    light
                    icon={ChevronRight}
                  />
                </div>

                <div className="mt-14 flex flex-wrap items-center justify-center gap-8 text-xl font-black tracking-tight text-white/34">
                  <span>ENVITEFY</span>
                  <span>STUDIO</span>
                  <span>SNAP</span>
                  <span>MEET</span>
                </div>
              </div>
            </div>
          </motion.div>
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
