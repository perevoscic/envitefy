"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  MessageSquare,
  Smartphone,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import AuthModal from "@/components/auth/AuthModal";
import ScenicBackground, {
  type ScenicScene,
  useActiveScene,
} from "@/components/marketing/ScenicBackground";
import HeroTopNav from "@/components/navigation/HeroTopNav";
import AnimatedButtonLabel from "@/components/ui/AnimatedButtonLabel";

const SNAP_SCENE_ORDER = [
  "snap",
  "problem-section",
  "how-it-works",
  "use-cases",
  "faq",
] as const;

const SNAP_SCENES: Record<string, ScenicScene> = {
  snap: {
    veilClassName:
      "bg-[radial-gradient(circle_at_top,rgba(129,140,248,0.2),transparent_32%),linear-gradient(180deg,rgba(59,130,246,0.1),transparent_74%)]",
    shapes: [
      {
        className:
          "absolute left-[-8rem] top-[-8rem] h-[28rem] w-[28rem] rounded-full bg-[#7C3AED]/24 blur-[150px]",
      },
      {
        className:
          "absolute right-[-5rem] top-[10%] h-[28rem] w-[28rem] rounded-[43%_57%_38%_62%/48%_43%_57%_52%] bg-[#4F46E5]/24 blur-[150px]",
      },
      {
        className:
          "absolute bottom-[-10rem] left-[22%] h-[24rem] w-[24rem] rounded-[58%_42%_62%_38%/39%_53%_47%_61%] bg-[#0EA5E9]/16 blur-[145px]",
      },
      {
        className:
          "theme-glass-ornament absolute right-[16%] top-[28%] h-[13rem] w-[13rem] rounded-[2.5rem] border border-white/10 rotate-12",
      },
    ],
  },
  "problem-section": {
    veilClassName:
      "bg-[radial-gradient(circle_at_15%_22%,rgba(251,113,133,0.14),transparent_22%),linear-gradient(180deg,rgba(124,58,237,0.08),transparent_72%)]",
    shapes: [
      {
        className:
          "absolute left-[4%] top-[18%] h-[24rem] w-[24rem] rounded-full bg-[#FB7185]/16 blur-[145px]",
      },
      {
        className:
          "absolute right-[8%] top-[14%] h-[22rem] w-[22rem] rounded-[44%_56%_58%_42%/48%_36%_64%_52%] bg-[#7C3AED]/18 blur-[145px]",
      },
      {
        className:
          "absolute bottom-[-7rem] left-[36%] h-[22rem] w-[22rem] rounded-[65%_35%_46%_54%/42%_62%_38%_58%] bg-[#F59E0B]/12 blur-[140px]",
      },
    ],
  },
  "how-it-works": {
    veilClassName:
      "bg-[radial-gradient(circle_at_80%_18%,rgba(59,130,246,0.18),transparent_24%),linear-gradient(180deg,rgba(79,70,229,0.08),transparent_72%)]",
    shapes: [
      {
        className:
          "absolute left-[10%] top-[14%] h-[22rem] w-[22rem] rounded-[55%_45%_45%_55%/43%_53%_47%_57%] bg-[#6366F1]/18 blur-[145px]",
      },
      {
        className:
          "absolute right-[2%] top-[26%] h-[24rem] w-[24rem] rounded-full bg-[#0EA5E9]/16 blur-[145px]",
      },
      {
        className:
          "theme-glass-ornament absolute bottom-[-8rem] left-[28%] h-[20rem] w-[20rem] rounded-[2.6rem] border border-white/10 -rotate-6",
      },
    ],
  },
  "use-cases": {
    veilClassName:
      "bg-[radial-gradient(circle_at_65%_16%,rgba(167,139,250,0.18),transparent_24%),linear-gradient(180deg,rgba(236,72,153,0.06),transparent_72%)]",
    shapes: [
      {
        className:
          "absolute left-[6%] top-[18%] h-[24rem] w-[24rem] rounded-[45%_55%_63%_37%/49%_37%_63%_51%] bg-[#A855F7]/16 blur-[150px]",
      },
      {
        className:
          "absolute right-[6%] top-[12%] h-[26rem] w-[26rem] rounded-full bg-[#7C3AED]/20 blur-[155px]",
      },
      {
        className:
          "absolute bottom-[-8rem] right-[24%] h-[20rem] w-[20rem] rounded-[59%_41%_38%_62%/49%_56%_44%_51%] bg-[#22C55E]/10 blur-[140px]",
      },
    ],
  },
  faq: {
    veilClassName:
      "bg-[radial-gradient(circle_at_25%_12%,rgba(14,165,233,0.12),transparent_24%),linear-gradient(180deg,rgba(124,58,237,0.1),transparent_74%)]",
    shapes: [
      {
        className:
          "absolute left-[-4rem] top-[14%] h-[22rem] w-[22rem] rounded-full bg-[#38BDF8]/12 blur-[145px]",
      },
      {
        className:
          "absolute right-[4%] top-[18%] h-[24rem] w-[24rem] rounded-[40%_60%_54%_46%/46%_39%_61%_54%] bg-[#7C3AED]/18 blur-[150px]",
      },
      {
        className:
          "absolute bottom-[-8rem] left-[30%] h-[22rem] w-[22rem] rounded-[62%_38%_57%_43%/43%_60%_40%_57%] bg-[#EC4899]/10 blur-[140px]",
      },
    ],
  },
};

const problemItems = [
  {
    title: "Blurry Screenshots",
    desc: "Flyers are hard to read on mobile and impossible to search.",
    icon: <Smartphone className="h-6 w-6 text-white" />,
  },
  {
    title: "Scattered Details",
    desc: "The date is in the flyer, but the RSVP link is buried in a chat.",
    icon: <MessageSquare className="h-6 w-6 text-white" />,
  },
  {
    title: "Constant Questions",
    desc: '"What time is it again?" "Where do I park?" "What\'s the gift policy?"',
    icon: <Users className="h-6 w-6 text-white" />,
  },
] as const;

const steps = [
  {
    step: "01",
    title: "Snap or Upload",
    desc: "Take a photo of a flyer, upload a screenshot, or drop in a PDF schedule.",
  },
  {
    step: "02",
    title: "AI Extracts Everything",
    desc: "Our AI instantly pulls dates, times, locations, and links into a structured format.",
  },
  {
    step: "03",
    title: "Share the Magic",
    desc: "Get a beautiful mobile-friendly link with maps, calendar adds, and RSVP flow.",
  },
] as const;

const useCases = [
  {
    title: "Birthday Invites",
    color: "bg-amber-400/18",
    icon: <Zap className="h-5 w-5" />,
  },
  {
    title: "Sports Schedules",
    color: "bg-sky-400/18",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "School Flyers",
    color: "bg-emerald-400/18",
    icon: <Smartphone className="h-5 w-5" />,
  },
  {
    title: "Wedding Details",
    color: "bg-rose-400/18",
    icon: <Calendar className="h-5 w-5" />,
  },
] as const;

const faqs = [
  {
    q: "How accurate is the AI extraction?",
    a: "We use vision models to extract text quickly, then give you a review step so you can confirm the details before sharing.",
  },
  {
    q: "Does it work with handwritten invites?",
    a: "Yes. As long as the handwriting is readable, Snap can usually pull the core details like date, time, and location.",
  },
  {
    q: "Can I add my own RSVP form?",
    a: "Every Snap page includes a built-in RSVP flow, and you can also attach custom links for registries, sign-up sheets, or payment apps.",
  },
  {
    q: "Is it free to use?",
    a: "You can snap your first few invites for free, with paid plans available for heavier use and more advanced workflows.",
  },
] as const;

const glassPanelClass =
  "theme-glass-surface relative isolate overflow-hidden rounded-[2rem] border border-white/12 shadow-[0_32px_90px_rgba(4,1,14,0.42)]";

const snapSectionSpacingClass = "px-4 py-6 sm:px-6 lg:px-8";
const snapHashAnchorClass = "hash-anchor-below-fixed-nav";

function CtaButton({
  label,
  href,
  onClick,
  light = false,
  icon,
}: {
  label: string;
  href?: string;
  onClick?: () => void;
  light?: boolean;
  icon?: typeof ArrowRight;
}) {
  const className = light
    ? "cta-shell flex h-14 w-full items-center justify-center rounded-full border border-white/14 bg-white/[0.1] px-8 text-lg font-bold text-white transition-all hover:bg-white/[0.14] sm:w-auto"
    : "cta-shell flex h-14 w-full items-center justify-center rounded-full bg-white px-8 text-lg font-bold text-[#140a27] shadow-[0_18px_40px_rgba(255,255,255,0.14)] transition-all hover:bg-[#f3edff] sm:w-auto";

  const content = (
    <AnimatedButtonLabel
      label={label}
      icon={icon}
      iconClassName="h-5 w-5"
      className="gap-2"
    />
  );

  if (href) {
    if (href.startsWith("#")) {
      return (
        <a href={href} className={className}>
          {content}
        </a>
      );
    }

    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

function SnapProcessMedia() {
  return (
    <div className="group relative aspect-[1.02/1] overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.08] shadow-[0_26px_60px_rgba(3,0,12,0.3)] backdrop-blur-2xl">
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-label="Envitefy Snap upload-to-event demo"
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src="/videos/sanp.webm" type="video/webm" />
        <source src="/videos/sanp.optimized.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,10,38,0.05),rgba(18,10,38,0.7))]" />
      <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/16 bg-black/20 px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.24em] text-white/75 backdrop-blur-xl">
        <Sparkles className="h-3.5 w-3.5" /> Snap Demo
      </div>
    </div>
  );
}

function Hero({
  onPrimaryAction,
  primaryHref,
}: {
  onPrimaryAction: () => void;
  primaryHref?: string;
}) {
  return (
    <section
      id="snap"
      className={`${snapHashAnchorClass} px-4 pb-6 pt-[calc(max(6.5rem,calc(env(safe-area-inset-top)+5.5rem))+1.5rem)] sm:px-6 lg:px-8`}
    >
      <div className="mx-auto min-w-0 w-full max-w-[min(90vw,100%)] pb-2">
        <div
          className={`${glassPanelClass} px-7 py-8 md:px-10 md:py-10 lg:px-14 lg:py-10`}
        >
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03)_40%,rgba(255,255,255,0.02))]" />
          <div className="absolute -left-16 top-0 h-56 w-56 rounded-full bg-white/8 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#7C3AED]/18 blur-[130px]" />

          <div className="relative grid items-start gap-8 xl:grid-cols-[minmax(0,0.84fr)_minmax(0,1.16fr)] xl:gap-8">
            <div className="min-w-0 xl:max-w-2xl">
              <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/[0.08] px-4 py-2 text-[0.68rem] font-bold tracking-[0.28em] text-white uppercase backdrop-blur-xl">
                <Zap className="h-3.5 w-3.5" /> From Upload to Event
              </span>

              <h1 className="mb-6 text-5xl font-extrabold leading-[1.02] tracking-tight text-white md:text-7xl">
                Stop sharing screenshots.
                <br />
                <span className="bg-[linear-gradient(135deg,#ffffff_0%,#d8cbff_45%,#a5b4fc_100%)] bg-clip-text text-transparent">
                  Start sharing events.
                </span>
              </h1>

              <p className="max-w-xl text-lg leading-relaxed text-white/72 md:text-xl">
                Turn messy flyers, screenshots, and PDFs into beautiful,
                shareable event pages in seconds. One link for RSVPs, maps, and
                details, no more group chat chaos.
              </p>

              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:items-start xl:items-start">
                <CtaButton
                  label="Snap Your First Invite"
                  href={primaryHref}
                  onClick={primaryHref ? undefined : onPrimaryAction}
                  icon={ArrowRight}
                />
                <CtaButton label="See Example" href="#use-cases" light />
              </div>
            </div>

            <div className="min-w-0 xl:-ml-20 2xl:-ml-28">
              <div className="relative mt-2 h-[60vh] min-h-[22rem] w-full overflow-hidden rounded-[1.8rem] border border-white/14 bg-[#090d18]/88 shadow-[0_32px_90px_rgba(4,1,14,0.42)] sm:h-[62vh] xl:mt-0 xl:h-[58vh] 2xl:h-[56vh] md:rounded-[2rem]">
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(8,12,24,0.28)_18%,rgba(8,12,24,0.08)_72%,rgba(8,12,24,0.34))]" />
                <img
                  src="/images/snap-hero-after.webp"
                  alt="Envitefy Snap interface after upload conversion"
                  className="absolute inset-0 h-full w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,20,0.1),rgba(7,10,20,0.34))]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  return (
    <section className="px-4 pb-6 pt-2 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.06] px-6 py-8 text-center backdrop-blur-2xl">
          <p className="mb-6 text-sm font-semibold tracking-[0.28em] text-white/52 uppercase">
            Trusted by 10,000+ busy parents & organizers
          </p>
          <div className="flex flex-wrap items-center justify-center gap-5 text-white md:gap-10">
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold">
              ParentCircle
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold">
              EventPro
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold">
              CommunityHub
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold">
              TeamSnap
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section
      id="problem-section"
      className={`${snapHashAnchorClass} ${snapSectionSpacingClass}`}
    >
      <div
        className={`mx-auto max-w-7xl ${glassPanelClass} px-7 py-8 md:px-10 md:py-10`}
      >
        <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(251,113,133,0.06),transparent_36%,rgba(124,58,237,0.06))]" />
        <div className="relative">
          <div className="mb-12 max-w-3xl">
            <span className="mb-5 inline-flex rounded-full border border-white/14 bg-white/[0.08] px-4 py-2 text-[0.68rem] font-bold tracking-[0.28em] text-white/68 uppercase backdrop-blur-xl">
              The Problem
            </span>
            <h2 className="mb-4 text-3xl font-bold text-white md:text-5xl">
              The &quot;Group Chat Nightmare&quot; ends here.
            </h2>
            <p className="max-w-2xl text-lg text-white/68">
              We&apos;ve all been there, squinting at a blurry screenshot or
              scrolling back 100 messages to find the address.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {problemItems.map((item) => (
              <div
                key={item.title}
                className="rounded-[1.7rem] border border-white/10 bg-black/12 p-6 backdrop-blur-xl"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  {item.icon}
                </div>
                <h3 className="mb-3 text-xl font-bold text-white">
                  {item.title}
                </h3>
                <p className="leading-relaxed text-white/65">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className={`${snapHashAnchorClass} ${snapSectionSpacingClass}`}
    >
      <div
        className={`mx-auto max-w-7xl ${glassPanelClass} px-7 py-8 md:px-10 md:py-10`}
      >
        <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(59,130,246,0.06),transparent_36%,rgba(124,58,237,0.08))]" />
        <div className="relative grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="mb-5 inline-flex rounded-full border border-white/14 bg-white/[0.08] px-4 py-2 text-[0.68rem] font-bold tracking-[0.28em] text-white/68 uppercase backdrop-blur-xl">
              Workflow
            </span>
            <h2 className="mb-8 text-4xl font-bold leading-tight text-white">
              From messy photo to
              <br />
              <span className="text-white/82">polished event page</span> in
              seconds.
            </h2>
            <div className="space-y-8">
              {steps.map((item) => (
                <div
                  key={item.step}
                  className="flex gap-5 rounded-[1.5rem] border border-white/10 bg-black/12 p-5 backdrop-blur-xl"
                >
                  <span className="text-3xl font-black text-white/18 tabular-nums">
                    {item.step}
                  </span>
                  <div>
                    <h3 className="mb-2 text-xl font-bold text-white">
                      {item.title}
                    </h3>
                    <p className="text-white/65">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <SnapProcessMedia />
          </div>
        </div>
      </div>
    </section>
  );
}

function UseCases() {
  return (
    <section
      id="use-cases"
      className={`${snapHashAnchorClass} ${snapSectionSpacingClass}`}
    >
      <div
        className={`mx-auto max-w-7xl ${glassPanelClass} px-7 py-8 md:px-10 md:py-10`}
      >
        <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(168,85,247,0.08),transparent_35%,rgba(14,165,233,0.05))]" />
        <div className="relative">
          <div className="mb-12 max-w-3xl">
            <span className="mb-5 inline-flex rounded-full border border-white/14 bg-white/[0.08] px-4 py-2 text-[0.68rem] font-bold tracking-[0.28em] text-white/68 uppercase backdrop-blur-xl">
              Use Cases
            </span>
            <h2 className="mb-4 text-3xl font-bold italic text-white md:text-5xl">
              One tool. Infinite events.
            </h2>
            <p className="max-w-2xl text-white/65">
              Whether it&apos;s a paper flyer or a digital PDF, Envitefy Snap
              handles it all.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {useCases.map((item) => (
              <div
                key={item.title}
                className="group relative rounded-[1.7rem] border border-white/10 bg-black/12 p-6 backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-white/18"
              >
                <div
                  className={`mb-5 flex h-11 w-11 items-center justify-center rounded-2xl ${item.color} text-white shadow-lg`}
                >
                  {item.icon}
                </div>
                <h3 className="mb-2 text-xl font-bold text-white">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-white/65">
                  Turn any {item.title.toLowerCase()} into a functional event
                  page in seconds.
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CallToAction({
  isAuthenticated,
  onOpenSignup,
}: {
  isAuthenticated: boolean;
  onOpenSignup: () => void;
}) {
  return (
    <section className={snapSectionSpacingClass}>
      <div className="relative mx-auto max-w-5xl">
        <div
          className={`${glassPanelClass} px-7 py-10 text-center md:px-12 md:py-14`}
        >
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_45%,rgba(124,58,237,0.1))]" />
          <div className="absolute top-0 right-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/2 translate-y-1/2 rounded-full bg-[#7C3AED]/18 blur-3xl" />

          <div className="relative z-10">
            <h2 className="mb-6 text-4xl font-extrabold leading-tight text-white md:text-5xl">
              Ready to clear the
              <br />
              group chat chaos?
            </h2>
            <p className="mx-auto mb-10 max-w-xl text-lg text-white/68">
              Join thousands of organizers who use Envitefy Snap to turn messy
              invites into magical event pages.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <CtaButton
                label="Get Started Free"
                href={isAuthenticated ? "/event" : undefined}
                onClick={isAuthenticated ? undefined : onOpenSignup}
                light
              />
              <p className="text-sm font-medium text-white/60">
                No credit card required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  return (
    <section
      id="faq"
      className={`${snapHashAnchorClass} ${snapSectionSpacingClass}`}
    >
      <div
        className={`mx-auto max-w-3xl ${glassPanelClass} px-7 py-8 md:px-10 md:py-10`}
      >
        <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(14,165,233,0.04),transparent_40%,rgba(124,58,237,0.08))]" />
        <div className="relative">
          <h2 className="mb-10 text-center text-3xl font-bold text-white italic">
            Common Questions
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;

              return (
                <div
                  key={faq.q}
                  className="overflow-hidden rounded-[1.4rem] border border-white/10 bg-black/12 backdrop-blur-xl"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-white/[0.04]"
                  >
                    <span className="font-bold text-white">{faq.q}</span>
                    <ChevronDown
                      className={`h-5 w-5 text-white/45 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen ? (
                    <div className="border-t border-white/8 px-5 pb-5 pt-0 leading-relaxed text-white/68">
                      {faq.a}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function SnapLanding() {
  const searchParams = useSearchParams();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const activeScene = useActiveScene(SNAP_SCENE_ORDER, "snap");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");

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

  return (
    <div className="relative z-[1] isolate min-h-screen overflow-x-hidden bg-transparent font-sans text-white selection:bg-white/20 selection:text-white">
      <ScenicBackground scene={activeScene} scenes={SNAP_SCENES} />

      <HeroTopNav
        navLinks={[
          { label: "Gymnastics", href: "/gymnastics" },
          { label: "How It Works", href: "#how-it-works" },
          { label: "Use Cases", href: "#use-cases" },
          { label: "FAQ", href: "#faq" },
        ]}
        variant="glass-dark"
        primaryCtaLabel="Snap Your First Invite"
        authenticatedPrimaryHref="/event"
        onGuestLoginAction={() => openAuth("login")}
        onGuestPrimaryAction={() => openAuth("signup")}
      />

      <Hero
        primaryHref={isAuthenticated ? "/event" : undefined}
        onPrimaryAction={() => openAuth("signup")}
      />
      <TrustBar />
      <ProblemSection />
      <HowItWorks />
      <UseCases />
      <CallToAction
        isAuthenticated={isAuthenticated}
        onOpenSignup={() => openAuth("signup")}
      />
      <FAQ />

      <AuthModal
        open={authModalOpen}
        mode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onModeChange={setAuthMode}
        signupSource="snap"
        allowSignupSwitch={false}
        successRedirectUrl="/event"
      />
    </div>
  );
}
