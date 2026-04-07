"use client";

import {
  CalendarPlus2,
  Camera,
  ChevronDown,
  Heart,
  ImageUp,
  type LucideIcon,
  MapPin,
  PartyPopper,
  PencilLine,
  Share2,
  Users,
  WandSparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import HeroTopNav from "@/components/navigation/HeroTopNav";
import AnimatedButtonLabel from "@/components/ui/AnimatedButtonLabel";

const heroHighlights = [
  "Invites, flyers, screenshots, schedules, and PDFs",
  "Review the extracted details before you publish",
  "One clean mobile-ready link with RSVPs, links, and updates",
] as const;

const featuredUseCases = [
  {
    title: "Birthday parties",
    body: "Turn the invite already living in a group chat into a page guests can actually use.",
    image: "/templates/birthdays/birthday-bash.webp",
    icon: PartyPopper,
  },
  {
    title: "Wedding invites",
    body: "Start from the beautiful invitation, then give guests a simpler digital home for the details.",
    image: "/phone-placeholders/wedding-couple.jpeg",
    icon: Heart,
  },
] as const;

const useCaseCards = [
  {
    title: "Baby showers",
    body: "Make it easy to see the date, address, registry, and RSVP without sending five follow-up messages.",
    icon: Users,
  },
  {
    title: "Sports schedules",
    body: "Upload a schedule or flyer and turn it into something families can reference and share on mobile.",
    icon: CalendarPlus2,
  },
  {
    title: "School and community events",
    body: "Take a poster, handout, or announcement and give people one link with the details in one place.",
    icon: Share2,
  },
] as const;

const benefitCards = [
  {
    title: "Start with what you already have",
    body: "No redesign required. Use the invite, flyer, schedule, or PDF people are already sending around.",
    icon: Camera,
  },
  {
    title: "Turn messy details into structure",
    body: "Date, time, location, and extras become easier to scan than a screenshot or a zoomed-in PDF.",
    icon: PencilLine,
  },
  {
    title: "Share one link, not five files",
    body: "Send guests to a single event page instead of resending the invite, address, and reminders separately.",
    icon: Share2,
  },
  {
    title: "Collect RSVPs or sign-ups",
    body: "Give people a clear place to respond instead of asking them to text back or reply in a crowded chat.",
    icon: Users,
  },
  {
    title: "Stay useful after the first share",
    body: "If the details change, update the page once instead of sending another screenshot and hoping everyone sees it.",
    icon: WandSparkles,
  },
  {
    title: "Built for the phone in your hand",
    body: "The finished page is designed for quick reading, tapping, saving, and sharing on mobile.",
    icon: MapPin,
  },
] as const;

const beforeItems = [
  "A flyer or invite buried in a group chat",
  "Guests zooming in to read time and address",
  "Repeated questions about where, when, and what to bring",
] as const;

const afterItems = [
  "One polished event page built from the original file",
  "Structured details people can scan in seconds",
  "A link you can update instead of resending everything",
] as const;

const pageIncludes = [
  "Event title, date, time, and location",
  "RSVP or sign-up flow",
  "Links, maps, schedules, and extra notes",
  "A cleaner mobile experience than a PDF or screenshot",
  "One shareable destination for the event",
] as const;

const faqs = [
  {
    question: "What can I upload?",
    answer:
      "Snap is built for invites, flyers, screenshots, schedules, posters, and PDFs people already use to share event details.",
  },
  {
    question: "Does Snap work with PDFs too?",
    answer:
      "Yes. PDFs are part of the core workflow alongside camera photos and uploaded images.",
  },
  {
    question: "Can I fix the details before the page goes live?",
    answer:
      "Yes. Snap helps organize the first draft fast, then you can review, edit, and refine the details before sharing.",
  },
  {
    question: "What if the AI misses something?",
    answer:
      "The page is still editable. Snap is meant to save setup time, not lock you into the first draft.",
  },
  {
    question: "What does the finished page actually give me?",
    answer:
      "A cleaner mobile-friendly event page with structured details, sharing, and RSVP or sign-up flow in one place.",
  },
  {
    question: "Why use this instead of sending the image?",
    answer:
      "Because an event page is easier to read, easier to revisit, easier to update, and easier for guests to act on than a screenshot or PDF.",
  },
] as const;

function SectionHeading({
  eyebrow,
  title,
  body,
  center = false,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {eyebrow ? (
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[#856ed1]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#17132b] sm:text-5xl">
        {title}
      </h2>
      {body ? <p className="mt-5 text-lg leading-8 text-[#58536e]">{body}</p> : null}
    </div>
  );
}

function PrimaryButton({
  children,
  href,
  onClick,
  light = false,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  light?: boolean;
}) {
  const className = light
    ? "cta-shell h-14 rounded-full bg-white px-7 text-base font-semibold text-[#5a33d6] shadow-[0_18px_42px_rgba(31,22,53,0.16)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5"
    : "cta-shell h-14 rounded-full bg-[linear-gradient(135deg,#7c3aed_0%,#944cff_100%)] px-7 text-base font-semibold text-white shadow-[0_18px_42px_rgba(124,58,237,0.24)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5";

  if (href) {
    return (
      <Link href={href} className={className}>
        {typeof children === "string" ? <AnimatedButtonLabel label={children} /> : children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {typeof children === "string" ? <AnimatedButtonLabel label={children} /> : children}
    </button>
  );
}

function SecondaryButton({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <a
      href={href}
      className="cta-shell h-14 rounded-full border border-[#e7ddff] bg-white px-7 text-base font-semibold text-[#2f2550] shadow-[0_12px_30px_rgba(93,67,171,0.08)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-[#faf7ff]"
    >
      {typeof children === "string" ? <AnimatedButtonLabel label={children} /> : children}
    </a>
  );
}

function BenefitTile({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <article className="space-y-4 rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-6">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 text-[#bca8ff]">
        <Icon className="h-5 w-5" />
      </div>
      <h3
        className="text-xl font-semibold"
        style={{
          color: "#f8f4ff",
          textShadow: "0 0 24px rgba(188,168,255,0.22)",
        }}
      >
        {title}
      </h3>
      <p className="text-sm leading-7 text-white/68">{body}</p>
    </article>
  );
}

function ProcessVisual({ step }: { step: 1 | 2 | 3 }) {
  if (step === 1) {
    return (
      <div className="rounded-[2.4rem] bg-[#f3efff] p-6 shadow-[0_28px_80px_rgba(104,78,191,0.1)]">
        <div className="rounded-[1.9rem] border border-white bg-white p-5 shadow-[0_18px_42px_rgba(61,37,133,0.08)]">
          <div className="mb-6 flex items-center justify-between">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#8d74e8]">
              Upload source
            </span>
            <Camera className="h-4 w-4 text-[#8d74e8]" />
          </div>
          <div className="flex h-60 items-center justify-center rounded-[1.6rem] border-2 border-dashed border-[#d9c9ff] bg-[#faf7ff]">
            <div className="text-center">
              <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-white text-[#a072ff] shadow-sm">
                <ImageUp className="h-7 w-7" />
              </div>
              <p className="mt-4 text-sm font-semibold text-[#9b85d6]">Drop your invite, flyer, or PDF</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="rounded-[2.4rem] bg-[#f4f0ff] p-6 shadow-[0_28px_80px_rgba(104,78,191,0.1)]">
        <div className="rounded-[1.9rem] border border-white bg-white p-6 shadow-[0_18px_42px_rgba(61,37,133,0.08)]">
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 rounded-2xl border border-[#eee5ff] px-4 py-3">
                <div className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[#9c86d6]">
                  Date
                </div>
                <div className="mt-1 text-sm font-semibold text-[#1f1635]">Sat, Oct 12</div>
              </div>
              <div className="flex-1 rounded-2xl border border-[#eee5ff] px-4 py-3">
                <div className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[#9c86d6]">
                  Time
                </div>
                <div className="mt-1 text-sm font-semibold text-[#1f1635]">7:00 PM</div>
              </div>
            </div>
            <div className="rounded-2xl border border-[#eee5ff] px-4 py-4">
              <div className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[#9c86d6]">
                Location
              </div>
              <div className="mt-1 text-sm font-semibold text-[#1f1635]">
                Sunset Garden, 123 Maple St.
              </div>
            </div>
            <div className="rounded-2xl border border-[#eee5ff] px-4 py-4">
              <div className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[#9c86d6]">
                Included
              </div>
              <div className="mt-1 text-sm font-semibold text-[#1f1635]">
                RSVP, links, notes, and event extras
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[2.4rem] bg-[#f4f0ff] p-6 shadow-[0_28px_80px_rgba(104,78,191,0.1)]">
      <div className="rounded-[1.9rem] border border-white bg-white p-8 text-center shadow-[0_18px_42px_rgba(61,37,133,0.08)]">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#ebfff1] text-[#2bbf6a]">
          <WandSparkles className="h-7 w-7" />
        </div>
        <h3 className="mt-5 text-2xl font-semibold text-[#1f1635]">Ready to share</h3>
        <div className="mt-8 space-y-3">
          <div className="rounded-full bg-[#1f1635] px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white">
            Copy Event Link
          </div>
          <div className="rounded-full bg-[linear-gradient(135deg,#7c3aed_0%,#944cff_100%)] px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white">
            Send RSVP Page
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SnapSignupLanding() {
  const searchParams = useSearchParams();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const auth = searchParams?.get("auth");
    if (auth === "signup" || auth === "login") {
      setAuthMode(auth);
      setAuthModalOpen(true);
    }
  }, [searchParams]);

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const renderPrimaryCta = (label: string, light = false) =>
    isAuthenticated ? (
      <PrimaryButton href="/event" light={light}>
        {label}
      </PrimaryButton>
    ) : (
      <PrimaryButton onClick={() => openAuth("signup")} light={light}>
        {label}
      </PrimaryButton>
    );

  return (
    <main className="min-h-screen w-full overflow-x-clip bg-[#fcfbff] text-[#17132b] selection:bg-[#ddd1ff] selection:text-[#241a52]">
      <HeroTopNav
        navLinks={[
          { label: "Studio", href: "/studio" },
          { label: "Gymnastics", href: "/gymnastics" },
          { label: "Features", href: "#features" },
          { label: "FAQ", href: "#faq" },
        ]}
        authenticatedPrimaryHref="/event"
        onGuestLoginAction={() => openAuth("login")}
        onGuestPrimaryAction={() => openAuth("signup")}
      />

      <section
        id="snap"
        className="relative overflow-hidden px-4 pb-24 pt-28 sm:px-6 sm:pt-32 lg:px-8 lg:pb-32 lg:pt-40"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-8%] top-0 h-[28rem] w-[28rem] rounded-full bg-[#ece2ff] blur-3xl" />
          <div className="absolute right-[-10%] top-[8%] h-[34rem] w-[34rem] rounded-full bg-[#f3ecff] blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#f7f3ff_0%,#fcfbff_45%,#fcfbff_100%)]" />
        </div>

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1fr_1.02fr] lg:gap-20">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#e9defe] bg-white/90 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-[#7b5de4] shadow-[0_10px_24px_rgba(124,58,237,0.08)]">
              <WandSparkles className="h-4 w-4" />
              AI Snap Upload
            </p>

            <h1 className="mt-7 text-[clamp(3.1rem,7vw,5.7rem)] font-semibold leading-[0.94] tracking-[-0.06em] text-[#1c1435]">
              From invite
              <br />
              to{" "}
              <span className="bg-[linear-gradient(135deg,#6d39ff_0%,#9f5bff_100%)] bg-clip-text italic text-transparent">
                event page
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#5b5570] sm:text-xl">
              Upload the flyer, screenshot, schedule, or PDF you already have. Envitefy Snap turns
              it into a polished event page that is easier to read, easier to share, and easier for
              guests to respond to.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              {renderPrimaryCta("Create with Snap")}
              <SecondaryButton href="#how-it-works">See how it works</SecondaryButton>
            </div>

            <div className="mt-8 grid gap-3 text-sm font-medium text-[#5f5974] sm:grid-cols-3">
              {heroHighlights.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-[#ebe2ff] bg-white/90 px-4 py-4 shadow-[0_10px_28px_rgba(124,58,237,0.06)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[44rem]">
            <div className="absolute -right-3 top-10 hidden rounded-full bg-white px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[0.24em] text-[#8f74eb] shadow-[0_12px_32px_rgba(66,42,140,0.12)] sm:block">
              Better than sharing a screenshot
            </div>

            <div className="grid gap-5 rounded-[2.4rem] border border-white/70 bg-white/80 p-5 shadow-[0_32px_90px_rgba(66,42,140,0.12)] backdrop-blur-xl sm:p-6">
              <div className="grid items-center gap-4 sm:grid-cols-[0.76fr_1fr]">
                <div className="rounded-[2rem] border border-[#efe7ff] bg-[#faf7ff] p-4">
                  <p className="text-[0.62rem] font-bold uppercase tracking-[0.24em] text-[#8f74eb]">
                    Original file
                  </p>
                  <div className="mt-4 overflow-hidden rounded-[1.4rem]">
                    <Image
                      src="/phone-placeholders/birthday-maya.jpeg"
                      alt="Uploaded invite preview"
                      width={520}
                      height={700}
                      className="h-[15rem] w-full object-cover"
                    />
                  </div>
                </div>

                <div className="rounded-[2rem] border border-[#efe7ff] bg-white p-5 shadow-[0_18px_42px_rgba(61,37,133,0.06)]">
                  <div className="flex items-center justify-between">
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.24em] text-[#8f74eb]">
                      Structured details
                    </p>
                    <WandSparkles className="h-4 w-4 text-[#8f74eb]" />
                  </div>

                  <div className="mt-5 grid gap-3 text-sm font-semibold text-[#22183f]">
                    <div className="rounded-2xl border border-[#eee5ff] px-4 py-3">
                      Title: Maya's Birthday Bash
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-[#eee5ff] px-4 py-3">
                        Date: Sat, Oct 12
                      </div>
                      <div className="rounded-2xl border border-[#eee5ff] px-4 py-3">
                        Time: 7:00 PM
                      </div>
                    </div>
                    <div className="rounded-2xl border border-[#eee5ff] px-4 py-3">
                      Address: 123 Maple St.
                    </div>
                    <div className="rounded-2xl border border-[#eee5ff] px-4 py-3">
                      Extras: RSVP, links, notes
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-[#ece4ff] bg-[#24163f] p-5 text-white shadow-[0_22px_52px_rgba(31,22,53,0.18)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.24em] text-[#bca8ff]">
                      Live event page
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold">One clean link for guests</h3>
                  </div>
                  <div className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/86">
                    Mobile ready
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.88fr]">
                  <div className="overflow-hidden rounded-[1.5rem]">
                    <Image
                      src="/templates/hero-images/general-events-hero.jpeg"
                      alt="Live event page preview"
                      width={900}
                      height={520}
                      className="h-[14rem] w-full object-cover"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-medium text-white/86">
                      RSVP or sign-up built in
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-medium text-white/86">
                      Easier to read than a screenshot
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-medium text-white/86">
                      Update once, then reshare the same link
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            center
            eyebrow="Built for real event files"
            title="Made for the things people already send"
            body="Snap is not limited to one kind of event. It works across invites, flyers, schedules, and PDFs that already exist."
          />

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {featuredUseCases.map(({ title, body, image, icon: Icon }, index) => (
              <article
                key={title}
                className={`group rounded-[2.5rem] border p-8 shadow-[0_24px_60px_rgba(102,76,189,0.08)] transition-all hover:-translate-y-1 ${
                  index === 0 ? "md:col-span-2 border-[#ece4ff] bg-white" : "border-[#eadfff] bg-[#f7f2ff]"
                }`}
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f6efff] text-[#7c3aed]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-6 text-3xl font-semibold text-[#1f1635]">{title}</h3>
                <p className="mt-4 max-w-xl text-lg leading-8 text-[#5f5875]">{body}</p>
                <div className="mt-10 overflow-hidden rounded-[2rem] shadow-[0_20px_48px_rgba(31,22,53,0.12)]">
                  <Image
                    src={image}
                    alt={`${title} use case`}
                    width={1400}
                    height={760}
                    className="h-[18rem] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>
              </article>
            ))}

            {useCaseCards.map(({ title, body, icon: Icon }) => (
              <article
                key={title}
                className="rounded-[2rem] border border-[#ece4ff] bg-white p-7 shadow-[0_20px_48px_rgba(102,76,189,0.06)]"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f6efff] text-[#7c3aed]">
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="mt-5 text-2xl font-semibold text-[#1f1635]">{title}</h4>
                <p className="mt-3 text-base leading-7 text-[#5f5875]">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            center
            eyebrow="How it works"
            title="From file to finished page in three steps"
            body="The goal is simple: start with the image or PDF you already have, then turn it into something people can actually use."
          />

          <div className="mt-20 space-y-24">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
              <div>
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#7c3aed_0%,#944cff_100%)] text-sm font-bold text-white shadow-[0_16px_30px_rgba(124,58,237,0.24)]">
                  1
                </div>
                <h3 className="mt-6 text-4xl font-semibold text-[#1f1635]">Snap or upload</h3>
                <p className="mt-5 text-lg leading-8 text-[#5f5875]">
                  Start with the invite, flyer, screenshot, schedule, or PDF you already have. No
                  manual setup first, no rebuilding the event from scratch.
                </p>
              </div>
              <ProcessVisual step={1} />
            </div>

            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
              <div className="order-2 lg:order-1">
                <ProcessVisual step={2} />
              </div>
              <div className="order-1 lg:order-2">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#7c3aed_0%,#944cff_100%)] text-sm font-bold text-white shadow-[0_16px_30px_rgba(124,58,237,0.24)]">
                  2
                </div>
                <h3 className="mt-6 text-4xl font-semibold text-[#1f1635]">Review what matters</h3>
                <p className="mt-5 text-lg leading-8 text-[#5f5875]">
                  Snap organizes the important details into a draft you can check, edit, and clean
                  up before the page is shared.
                </p>
              </div>
            </div>

            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
              <div>
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#7c3aed_0%,#944cff_100%)] text-sm font-bold text-white shadow-[0_16px_30px_rgba(124,58,237,0.24)]">
                  3
                </div>
                <h3 className="mt-6 text-4xl font-semibold text-[#1f1635]">
                  Publish one link everyone can use
                </h3>
                <p className="mt-5 text-lg leading-8 text-[#5f5875]">
                  Share a polished event page instead of forwarding files around. Guests can read,
                  respond, and come back to the details without digging through messages.
                </p>
              </div>
              <ProcessVisual step={3} />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            center
            eyebrow="Why it converts better"
            title="A better outcome than sending the file alone"
            body="The original invite still matters. Snap just turns it into something more useful after the first share."
          />

          <div className="mt-16 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <article className="rounded-[2.4rem] border border-[#ece4ff] bg-white p-8 shadow-[0_24px_60px_rgba(102,76,189,0.08)]">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.8rem] border border-[#ece4ff] bg-[#faf7ff] p-6">
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#8b74de]">Before</p>
                  <div className="mt-5 space-y-3">
                    {beforeItems.map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-[#e9defe] bg-white px-4 py-3 text-sm font-medium text-[#524a6d]"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.8rem] border border-[#24163f] bg-[#24163f] p-6 text-white">
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#bca8ff]">After</p>
                  <div className="mt-5 space-y-3">
                    {afterItems.map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/90"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-[2.4rem] border border-[#ece4ff] bg-[#faf7ff] p-8 shadow-[0_24px_60px_rgba(102,76,189,0.08)]">
              <h3 className="text-3xl font-semibold text-[#1f1635]">What the page gives guests</h3>
              <div className="mt-8 space-y-3">
                {pageIncludes.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-[#ece4ff] bg-white px-4 py-3 text-sm font-semibold text-[#2a2148] shadow-sm"
                  >
                    <MapPin className="h-4 w-4 text-[#7c3aed]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="benefits" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[3rem] bg-[#24163f] p-8 text-white shadow-[0_32px_90px_rgba(31,22,53,0.18)] sm:p-12 lg:p-16">
          <div className="max-w-3xl">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[#bca8ff]">
              What Snap improves
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
              More useful than a screenshot. Less work than rebuilding the event.
            </h2>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {benefitCards.map((card) => (
              <BenefitTile key={card.title} icon={card.icon} title={card.title} body={card.body} />
            ))}
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="bg-[linear-gradient(180deg,#faf7ff_0%,#ffffff_100%)] px-4 py-24 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            center
            eyebrow="FAQ"
            title="Questions people ask before they try Snap"
            body="Short answers, grounded in what the product actually does."
          />

          <div className="mt-14 space-y-4">
            {faqs.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={item.question}
                  className="overflow-hidden rounded-[1.75rem] border border-[#e8ddff] bg-white shadow-[0_18px_46px_rgba(101,76,188,0.06)]"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left sm:px-7"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                  >
                    <span className="text-lg font-semibold leading-7 text-[#241c44]">
                      {item.question}
                    </span>
                    <span className="flex-shrink-0 rounded-full border border-[#ece4ff] bg-[#faf7ff] p-2 text-[#7b65c8]">
                      <ChevronDown
                        size={18}
                        className={`transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </span>
                  </button>
                  <div
                    className={`overflow-hidden px-6 transition-all duration-300 ease-in-out sm:px-7 ${
                      isOpen ? "max-h-56 pb-6 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <p className="leading-7 text-[#59546e]">{item.answer}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 pt-8 sm:px-6 sm:pb-24 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[3rem] bg-[linear-gradient(135deg,#7c3aed_0%,#944cff_52%,#b684ff_100%)] p-10 text-center text-white shadow-[0_32px_90px_rgba(124,58,237,0.24)] sm:p-14">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-white/74">
            Final CTA
          </p>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
            Start with the file. End with a page people will actually use.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/84">
            Upload the invite, flyer, screenshot, schedule, or PDF you already have and turn it
            into one clean destination for the event.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            {renderPrimaryCta("Try Snap now", true)}
            <SecondaryButton href="#how-it-works">See the workflow</SecondaryButton>
          </div>
        </div>
      </section>

      <AuthModal
        open={authModalOpen}
        mode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onModeChange={setAuthMode}
        signupSource="snap"
        allowSignupSwitch={false}
        successRedirectUrl="/event"
      />
    </main>
  );
}
