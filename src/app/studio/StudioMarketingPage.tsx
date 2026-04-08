"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Baby,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Gift,
  Hotel,
  Image as ImageIcon,
  Layout,
  type LucideIcon,
  MapPin,
  MessageCircle,
  MousePointer2,
  Share2,
  Smartphone,
  Ticket,
  WandSparkles,
  Upload,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import HeroTopNav from "@/components/navigation/HeroTopNav";

type FeatureItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

type ActionItem = {
  icon: LucideIcon;
  label: string;
  colorClassName: string;
};

type UseCaseItem = {
  title: string;
  image: string;
  description: string;
};

const revealIn = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
};

const studioFeatures: FeatureItem[] = [
  {
    icon: Layout,
    title: "Premium Templates",
    description: "Dozens of curated layouts for every event type.",
  },
  {
    icon: ImageIcon,
    title: "Media Rich",
    description: "Upload photos, videos, and custom graphics easily.",
  },
  {
    icon: Smartphone,
    title: "Mobile Optimized",
    description: "Every invite looks polished on any device automatically.",
  },
];

const activeButtons: ActionItem[] = [
  {
    icon: CheckCircle2,
    label: "RSVP",
    colorClassName: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: MapPin,
    label: "Directions",
    colorClassName: "bg-blue-50 text-blue-600",
  },
  {
    icon: Calendar,
    label: "Add to Calendar",
    colorClassName: "bg-amber-50 text-amber-600",
  },
  {
    icon: Clock,
    label: "View Schedule",
    colorClassName: "bg-violet-50 text-violet-600",
  },
  {
    icon: Hotel,
    label: "Book Hotel",
    colorClassName: "bg-indigo-50 text-indigo-600",
  },
  {
    icon: Ticket,
    label: "Buy Tickets",
    colorClassName: "bg-rose-50 text-rose-600",
  },
  {
    icon: MessageCircle,
    label: "Contact Host",
    colorClassName: "bg-cyan-50 text-cyan-600",
  },
  {
    icon: Share2,
    label: "Share Event",
    colorClassName: "bg-slate-100 text-slate-600",
  },
];

const useCases: UseCaseItem[] = [
  {
    title: "Birthdays",
    image: "https://picsum.photos/seed/studio-birthday/600/400",
    description: "Fun, vibrant invites with RSVP and gift registry links.",
  },
  {
    title: "Weddings",
    image: "https://picsum.photos/seed/studio-wedding/600/400",
    description: "Elegant, sophisticated cards for your special day.",
  },
  {
    title: "Baby Showers",
    image: "https://picsum.photos/seed/studio-baby/600/400",
    description: "Soft designs with registry, venue, and calendar actions.",
  },
  {
    title: "School Events",
    image: "https://picsum.photos/seed/studio-school/600/400",
    description: "Clear, informative flyers for parents and students.",
  },
  {
    title: "Community Events",
    image: "https://picsum.photos/seed/studio-community/600/400",
    description: "Engaging cards for festivals, markets, and meetups.",
  },
  {
    title: "Team Events",
    image: "https://picsum.photos/seed/studio-team/600/400",
    description: "Professional invites for retreats and internal events.",
  },
];

const babyShowerHighlights: FeatureItem[] = [
  {
    icon: Gift,
    title: "Baby Registry",
    description: "Direct links to your curated gift lists.",
  },
  {
    icon: MapPin,
    title: "Venue & Parking",
    description: "Easy navigation for every guest.",
  },
  {
    icon: Calendar,
    title: "Add to Calendar",
    description: "Instant reminders so nobody misses it.",
  },
  {
    icon: MessageCircle,
    title: "Host Contact",
    description: "Quick access for questions or RSVP follow-up.",
  },
];

const weddingHighlights: FeatureItem[] = [
  {
    icon: Ticket,
    title: "Gift Registry",
    description: "Direct links to your wedding registries.",
  },
  {
    icon: MapPin,
    title: "Venue",
    description: "Maps and parking for the ceremony and reception.",
  },
  {
    icon: Hotel,
    title: "Hotel Blocks",
    description: "Booking links and lodging notes in one place.",
  },
  {
    icon: Calendar,
    title: "Add to Calendar",
    description: "Make the date impossible to lose.",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Design",
    description: "Choose a template or start from scratch in Studio.",
  },
  {
    step: "02",
    title: "Add Utility",
    description: "Drop in RSVP, maps, and other active buttons.",
  },
  {
    step: "03",
    title: "Publish",
    description: "Create your live event card in one step.",
  },
  {
    step: "04",
    title: "Share",
    description: "Send the polished link by text, email, or social.",
  },
] as const;

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function SectionHeading({
  title,
  description,
  center = false,
}: {
  title: string;
  description: string;
  center?: boolean;
}) {
  return (
    <div className={cx(center && "mx-auto max-w-2xl text-center")}>
      <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">{description}</p>
    </div>
  );
}

function PrimaryButton({
  onClick,
  label,
  className,
}: {
  onClick: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full bg-[#7c3aed] px-8 py-4 text-base font-semibold text-white shadow-[0_20px_50px_rgba(124,58,237,0.22)] transition hover:bg-[#6d28d9]",
        className,
      )}
    >
      <span>{label}</span>
      <ArrowRight className="h-5 w-5" />
    </button>
  );
}

function SecondaryLink({ href, label }: { href: string; label: string }) {
  if (href.startsWith("#")) {
    return (
      <a
        href={href}
        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-900 transition hover:bg-slate-50"
      >
        {label}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-900 transition hover:bg-slate-50"
    >
      {label}
    </Link>
  );
}

function MockPhoneFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "relative mx-auto w-full max-w-[320px] rounded-[2.5rem] border border-slate-100 bg-white p-4 shadow-[0_30px_90px_rgba(15,23,42,0.12)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export default function StudioMarketingPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <>
      <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,#f6f0ff_0%,#ffffff_45%,#f7f3ff_100%)] text-slate-900 selection:bg-[#ddd6fe] selection:text-[#4c1d95]">
        <HeroTopNav
          navLinks={[
            { label: "Create in Studio", href: "#features" },
            { label: "Built to be Clicked", href: "#actions" },
            { label: "Made for Real Events", href: "#use-cases" },
            { label: "How It Works", href: "#how-it-works" },
            { label: "Live Card Showcase", href: "#showcase" },
          ]}
          primaryCtaLabel="Start in Studio"
          authenticatedPrimaryHref="/"
          brandHref="/"
          onGuestLoginAction={() => openAuth("login")}
          onGuestPrimaryAction={() => openAuth("signup")}
        />

        <main>
          <section className="hash-anchor-below-fixed-nav relative overflow-hidden px-4 pb-20 pt-32 sm:px-6 lg:px-8 lg:pb-28 lg:pt-44">
            <div className="absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute left-[-10%] top-[-5%] h-[28rem] w-[28rem] rounded-full bg-[#ede9fe] blur-[120px]" />
              <div className="absolute bottom-[-10%] right-[-10%] h-[26rem] w-[26rem] rounded-full bg-[#f5f3ff] blur-[120px]" />
            </div>

            <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-[#ddd6fe] bg-[#f5f3ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#6d28d9]">
                  <Zap className="h-3 w-3" />
                  Digital Flyers • Live Cards
                </div>
                <h1 className="mt-6 max-w-3xl text-5xl font-black tracking-tight text-slate-900 sm:text-6xl lg:text-7xl lg:leading-[1.05]">
                  Create a live digital invite that{" "}
                  <span className="text-[#7c3aed]">actually does something.</span>
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                  Envitefy Studio helps you design polished digital flyers and live invites with
                  clickable actions, RSVP, location links, and real event utility.
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <PrimaryButton onClick={() => openAuth("signup")} label="Start in Studio" />
                  <SecondaryLink href="#showcase" label="See Live Card Demo" />
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 shadow-sm">
                    <Upload className="h-4 w-4 text-[#7c3aed]" />
                    Upload or start from scratch
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 shadow-sm">
                    <WandSparkles className="h-4 w-4 text-[#7c3aed]" />
                    Publish a share-ready live card
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                <MockPhoneFrame className="lg:mr-0">
                  <div className="relative aspect-[9/19.5] overflow-hidden rounded-[2rem] bg-slate-50">
                    <img
                      src="https://picsum.photos/seed/studio-hero-live-card/600/1200"
                      alt="Live card preview"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                    <div className="absolute bottom-6 left-4 right-4 space-y-3">
                      <div className="rounded-xl bg-white/90 p-3 shadow-lg backdrop-blur-sm">
                        <h3 className="text-sm font-bold text-slate-900">Summer Gala 2026</h3>
                        <p className="text-[10px] text-slate-500">Grand Ballroom • 7:00 PM</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          className="flex items-center justify-center gap-1 rounded-lg bg-[#7c3aed] py-2 text-[10px] font-bold text-white"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          RSVP
                        </button>
                        <button
                          type="button"
                          className="flex items-center justify-center gap-1 rounded-lg bg-white py-2 text-[10px] font-bold text-slate-900"
                        >
                          <MapPin className="h-3 w-3" />
                          Directions
                        </button>
                      </div>
                    </div>
                  </div>
                </MockPhoneFrame>

                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                  className="absolute left-0 top-[14%] z-20 hidden -translate-x-8 items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl lg:flex"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                    <Calendar className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      Action
                    </p>
                    <p className="text-sm font-bold text-slate-900">Add to Calendar</p>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{
                    duration: 5,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                  className="absolute right-0 top-1/2 z-20 hidden translate-x-10 items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl lg:flex"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      Status
                    </p>
                    <p className="text-sm font-bold text-slate-900">42 Guests RSVP&apos;d</p>
                  </div>
                </motion.div>

                <div className="absolute -bottom-12 -left-12 -z-10 h-64 w-64 rounded-full bg-[#ddd6fe]/40 blur-3xl" />
              </motion.div>
            </div>
          </section>

          <motion.section
            id="features"
            className="hash-anchor-below-fixed-nav overflow-hidden px-4 py-24 sm:px-6 lg:px-8"
            {...revealIn}
          >
            <div className="mx-auto grid w-full max-w-7xl gap-16 lg:grid-cols-2 lg:items-center">
              <div>
                <SectionHeading
                  title="Create in Studio. Publish to the world."
                  description="Our editor gives you professional design tools without the usual complexity. Start from a premium template or build your vision from scratch."
                />
                <div className="mt-8 space-y-6">
                  {studioFeatures.map((feature) => (
                    <div key={feature.title} className="flex gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#f5f3ff]">
                        <feature.icon className="h-6 w-6 text-[#7c3aed]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{feature.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="overflow-hidden rounded-[2rem] bg-slate-900 p-4 shadow-[0_30px_80px_rgba(15,23,42,0.2)]">
                  <div className="overflow-hidden rounded-[1.5rem] border border-slate-700 bg-slate-800">
                    <div className="flex h-10 items-center gap-2 border-b border-slate-700 bg-slate-900 px-4">
                      <div className="flex gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      </div>
                      <div className="mx-auto text-[10px] font-mono uppercase tracking-[0.28em] text-slate-500">
                        envitefy-studio
                      </div>
                    </div>
                    <div className="flex h-[400px]">
                      <div className="flex w-16 flex-col items-center gap-4 border-r border-slate-700 bg-slate-900 py-4">
                        {[Layout, ImageIcon, MousePointer2, Zap].map((Icon, index) => (
                          <div
                            key={Icon.displayName ?? `studio-tool-${index + 1}`}
                            className={cx(
                              "rounded-lg p-2",
                              index === 0 ? "bg-[#7c3aed] text-white" : "text-slate-500",
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-1 items-center justify-center bg-slate-800 p-6">
                        <div className="relative aspect-[9/16] w-48 overflow-hidden rounded-xl bg-white shadow-2xl">
                          <img
                            src="https://picsum.photos/seed/studio-editor-preview/300/500"
                            alt="Studio editor preview"
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="pointer-events-none absolute inset-0 border-2 border-[#8b5cf6]/60" />
                          <div className="absolute right-2 top-2 flex gap-1">
                            <div className="flex h-4 w-4 items-center justify-center rounded bg-white shadow-sm">
                              <div className="h-2 w-2 rounded-full bg-[#8b5cf6]" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="w-48 space-y-4 border-l border-slate-700 bg-slate-900 p-4">
                        <div className="space-y-2">
                          <div className="h-2 w-12 rounded bg-slate-700" />
                          <div className="h-8 w-full rounded border border-slate-700 bg-slate-800" />
                        </div>
                        <div className="space-y-2">
                          <div className="h-2 w-16 rounded bg-slate-700" />
                          <div className="grid grid-cols-2 gap-2">
                            <div className="h-8 rounded bg-[#7c3aed]" />
                            <div className="h-8 rounded border border-slate-700 bg-slate-800" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute left-1/2 top-1/2 -z-10 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ddd6fe]/35 blur-[100px]" />
              </div>
            </div>
          </motion.section>

          <motion.section
            id="actions"
            className="hash-anchor-below-fixed-nav px-4 py-24 sm:px-6 lg:px-8"
            {...revealIn}
          >
            <div className="mx-auto w-full max-w-7xl">
              <SectionHeading
                title="Built to be clicked."
                description="Add real utility to your invites with one-tap actions guests will actually use."
                center
              />
              <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-8">
                {activeButtons.map((action) => (
                  <motion.div
                    key={action.label}
                    whileHover={{ y: -5 }}
                    className="group rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm transition-all hover:shadow-xl hover:shadow-slate-100"
                  >
                    <div
                      className={cx(
                        "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110",
                        action.colorClassName,
                      )}
                    >
                      <action.icon className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-bold text-slate-900">{action.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          <motion.section
            id="use-cases"
            className="hash-anchor-below-fixed-nav px-4 py-24 sm:px-6 lg:px-8"
            {...revealIn}
          >
            <div className="mx-auto w-full max-w-7xl">
              <SectionHeading
                title="Made for real events."
                description="From intimate gatherings to large community moments, Envitefy Studio scales with the event."
                center
              />

              <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {useCases.map((useCase) => (
                  <div key={useCase.title} className="group cursor-pointer">
                    <div className="relative mb-4 aspect-[3/2] overflow-hidden rounded-2xl shadow-lg shadow-slate-100">
                      <img
                        src={useCase.image}
                        alt={useCase.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      <div className="absolute bottom-4 left-4 opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-white">
                          Explore Templates
                        </span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{useCase.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{useCase.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          <motion.section
            className="overflow-hidden bg-[#f5f3ff] px-4 py-24 sm:px-6 lg:px-8"
            {...revealIn}
          >
            <div className="mx-auto w-full max-w-7xl rounded-[3rem] border border-[#ddd6fe] bg-white p-8 shadow-[0_30px_80px_rgba(124,58,237,0.08)] sm:p-10 lg:p-16">
              <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#ede9fe] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#6d28d9]">
                    <Baby className="h-3 w-3" />
                    Industry Spotlight
                  </div>
                  <h2 className="mt-6 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                    The perfect start for <span className="text-[#7c3aed]">baby showers.</span>
                  </h2>
                  <p className="mt-6 text-lg leading-8 text-slate-600">
                    Keep every shower detail, from registry to venue, right in your guests&apos;
                    hands.
                  </p>

                  <div className="mt-8 grid gap-6 sm:grid-cols-2">
                    {babyShowerHighlights.map((item) => (
                      <div key={item.title} className="flex gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#f5f3ff]">
                          <item.icon className="h-5 w-5 text-[#7c3aed]" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                          <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8">
                    <PrimaryButton
                      onClick={() => openAuth("signup")}
                      label="Create Your Baby Shower Card"
                    />
                  </div>
                </div>

                <div className="relative">
                  <div className="rotate-2 rounded-[2.5rem] border border-slate-200 bg-slate-50 p-4 shadow-xl">
                    <div className="relative aspect-[9/16] overflow-hidden rounded-[2rem] bg-white shadow-inner">
                      <img
                        src="https://picsum.photos/seed/studio-baby-card/600/1000"
                        alt="Baby shower live card"
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-6 left-4 right-4 space-y-4">
                        <div className="space-y-1 text-center">
                          <h3 className="text-xl font-bold text-white">
                            A Little One Is on the Way!
                          </h3>
                          <p className="text-xs text-[#ddd6fe]">Honoring Sarah Miller • June 12</p>
                        </div>
                        <div className="grid gap-2">
                          <div className="flex items-center justify-between rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur">
                            <span className="text-xs font-medium text-white">
                              View Baby Registry
                            </span>
                            <ChevronRight className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex items-center justify-center gap-2 rounded-xl bg-[#7c3aed] p-3 shadow-lg">
                            <Calendar className="h-4 w-4 text-white" />
                            <span className="text-xs font-bold text-white">Add to Calendar</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -right-12 -top-12 -z-10 h-32 w-32 rounded-full bg-[#c4b5fd] blur-3xl opacity-50" />
                  <div className="absolute -bottom-12 -left-12 -z-10 h-48 w-48 rounded-full bg-[#ddd6fe] blur-3xl opacity-50" />
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section className="overflow-hidden px-4 py-24 sm:px-6 lg:px-8" {...revealIn}>
            <div className="mx-auto w-full max-w-7xl overflow-hidden rounded-[3rem] bg-[#4c1d95] p-8 text-white shadow-[0_30px_90px_rgba(76,29,149,0.22)] sm:p-10 lg:p-16">
              <div className="pointer-events-none absolute" />
              <div className="relative grid gap-12 lg:grid-cols-2 lg:items-center">
                <div className="order-2 lg:order-1">
                  <div className="relative">
                    <div className="mx-auto max-w-[320px] rounded-[2.5rem] border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-md lg:mx-0">
                      <div className="relative aspect-[9/16] overflow-hidden rounded-[2rem] bg-white">
                        <img
                          src="https://picsum.photos/seed/studio-wedding-card/600/1000"
                          alt="Wedding live card"
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        <div className="absolute bottom-6 left-4 right-4 space-y-4">
                          <div className="text-center">
                            <h3 className="font-[var(--font-playfair)] text-2xl text-white">
                              Sarah &amp; James
                            </h3>
                            <p className="text-xs uppercase tracking-[0.24em] text-[#ddd6fe]">
                              September 24, 2026
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-lg bg-white p-2 text-center text-[10px] font-bold text-[#4c1d95]">
                              RSVP
                            </div>
                            <div className="rounded-lg bg-white/20 p-2 text-center text-[10px] font-bold text-white backdrop-blur">
                              Registry
                            </div>
                          </div>
                          <div className="flex items-center justify-center gap-2 rounded-xl bg-[#7c3aed] p-3">
                            <Calendar className="h-4 w-4 text-white" />
                            <span className="text-xs font-bold text-white">Add to Calendar</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <motion.div
                      animate={{ y: [0, 10, 0] }}
                      transition={{
                        duration: 5,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                      className="absolute -right-2 -top-8 hidden items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-slate-900 shadow-xl md:flex"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50">
                        <Ticket className="h-5 w-5 text-rose-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                          Registry
                        </p>
                        <p className="text-sm font-bold">View Gift List</p>
                      </div>
                    </motion.div>
                  </div>
                </div>

                <div className="order-1 lg:order-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#e9d5ff]">
                    <WandSparkles className="h-3 w-3" />
                    Wedding Experience
                  </div>
                  <h2 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                    The most elegant way to{" "}
                    <span className="text-[#c4b5fd]">share your big day.</span>
                  </h2>
                  <p className="mt-6 text-lg leading-8 text-[#ede9fe]">
                    Envitefy Studio creates a live wedding experience that guides guests from the
                    first yes to the final dance.
                  </p>

                  <div className="mt-8 grid gap-6 sm:grid-cols-2">
                    {weddingHighlights.map((item) => (
                      <div key={item.title} className="flex gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
                          <item.icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">{item.title}</h4>
                          <p className="mt-1 text-xs text-[#ddd6fe]">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8">
                    <button
                      type="button"
                      onClick={() => openAuth("signup")}
                      className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-bold text-[#4c1d95] transition hover:bg-[#f5f3ff]"
                    >
                      <span>Design Your Wedding Card</span>
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            id="how-it-works"
            className="hash-anchor-below-fixed-nav px-4 py-24 sm:px-6 lg:px-8"
            {...revealIn}
          >
            <div className="mx-auto w-full max-w-7xl">
              <SectionHeading
                title="How it works."
                description="From blank canvas to live event in minutes."
                center
              />
              <div className="relative mt-20 grid gap-12 md:grid-cols-4">
                <div className="absolute left-0 top-12 hidden h-0.5 w-full bg-slate-100 md:block" />
                {howItWorks.map((item) => (
                  <div key={item.step} className="text-center">
                    <div className="relative z-10 mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border-4 border-slate-50 bg-white shadow-xl shadow-slate-100">
                      <span className="text-2xl font-black text-[#7c3aed]">{item.step}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-500">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          <motion.section
            id="showcase"
            className="hash-anchor-below-fixed-nav overflow-hidden bg-slate-50 px-4 py-24 sm:px-6 lg:px-8"
            {...revealIn}
          >
            <div className="mx-auto w-full max-w-7xl">
              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                    Live Card Showcase
                  </h2>
                  <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                    See how hosts use Envitefy Studio to create memorable event experiences.
                  </p>
                </div>
                <a
                  href="#cta"
                  className="inline-flex items-center gap-2 text-base font-bold text-[#7c3aed] transition hover:gap-3"
                >
                  <span>View Full Gallery</span>
                  <ArrowRight className="h-5 w-5" />
                </a>
              </div>

              <div className="no-scrollbar mt-16 flex gap-6 overflow-x-auto pb-12">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={`showcase-${item}`} className="w-72 flex-shrink-0">
                    <div className="rounded-3xl border border-slate-100 bg-white p-3 shadow-lg">
                      <div className="mb-4 aspect-[9/16] overflow-hidden rounded-2xl">
                        <img
                          src={`https://picsum.photos/seed/studio-showcase-${item}/400/700`}
                          alt={`Showcase example ${item}`}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="px-2 pb-2">
                        <h4 className="text-sm font-bold text-slate-900">Event Title {item}</h4>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                          Live Card • Published
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          <motion.section
            id="cta"
            className="hash-anchor-below-fixed-nav px-4 py-24 sm:px-6 lg:px-8"
            {...revealIn}
          >
            <div className="mx-auto w-full max-w-7xl">
              <div className="relative overflow-hidden rounded-[3rem] bg-[#7c3aed] p-12 text-center text-white shadow-[0_30px_90px_rgba(124,58,237,0.24)] lg:p-24">
                <div className="absolute left-0 top-0 h-full w-full opacity-20">
                  <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white blur-[100px]" />
                  <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#c4b5fd] blur-[100px]" />
                </div>

                <div className="relative z-10 mx-auto max-w-3xl">
                  <h2 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                    Ready to make your event live?
                  </h2>
                  <p className="mt-8 text-xl leading-8 text-[#ede9fe]">
                    Join hosts creating premium digital invites and live event cards with Envitefy
                    Studio.
                  </p>
                  <div className="mt-12 flex justify-center">
                    <button
                      type="button"
                      onClick={() => openAuth("signup")}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-10 py-5 text-xl font-bold text-[#7c3aed] shadow-xl transition hover:bg-[#f5f3ff]"
                    >
                      <span>Start in Studio</span>
                      <ArrowRight className="h-6 w-6" />
                    </button>
                  </div>
                  <p className="mt-8 text-sm font-medium text-[#ddd6fe]">
                    Free to start • No credit card required
                  </p>
                </div>
              </div>
            </div>
          </motion.section>
        </main>
      </div>

      <AuthModal
        open={authModalOpen}
        mode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onModeChange={setAuthMode}
        successRedirectUrl="/studio"
      />
    </>
  );
}
