"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  CalendarPlus2,
  Camera,
  ChevronDown,
  Heart,
  ImageUp,
  MapPin,
  PartyPopper,
  PencilLine,
  Share2,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import LandingNav from "@/app/landing/components/LandingNav";
import AuthModal from "@/components/auth/AuthModal";

const useCaseCards = [
  {
    title: "Birthday Invitations",
    body: "Turn that text-message flyer or photo invite into a beautiful page where guests can RSVP and get the details fast.",
    image: "/templates/birthdays/birthday-bash.webp",
    icon: PartyPopper,
    large: true,
    tone: "white",
  },
  {
    title: "Wedding Invites",
    body: "Convert elegant paper invitations into a mobile-first digital home your guests can actually use.",
    image: "/phone-placeholders/wedding-couple.jpeg",
    icon: Heart,
    large: false,
    tone: "tint",
  },
  {
    title: "Baby Showers",
    body: "Organize dates, addresses, and details from social posts and flyer screenshots instantly.",
    icon: Users,
  },
  {
    title: "Sports Schedules",
    body: "Upload team or league schedules and give families a cleaner event page to reference and share.",
    icon: CalendarPlus2,
  },
  {
    title: "Community Events",
    body: "Markets, school nights, and local gatherings become easier to spread with one polished event page.",
    icon: Share2,
  },
] as const;

const benefitCards = [
  {
    title: "Skip Manual Setup",
    body: "No more typing addresses or copying event descriptions. Snap handles the heavy lifting first.",
    icon: PencilLine,
  },
  {
    title: "Printed to Digital",
    body: "Modernize physical flyers, handouts, posters, and invites into something easier to read and share.",
    icon: Camera,
  },
  {
    title: "Easy Sharing",
    body: "One clean link for all the details instead of blurry screenshots and scattered group-chat messages.",
    icon: Share2,
  },
  {
    title: "Collect RSVPs",
    body: "Give guests a real event page with responses, schedules, links, and details in one place.",
    icon: Users,
  },
  {
    title: "Instant Save-the-Date",
    body: "Make the event easier to remember with structured details guests can save and come back to.",
    icon: CalendarPlus2,
  },
  {
    title: "Live Updates",
    body: "If details change, update the page once instead of resending new screenshots to everyone.",
    icon: Sparkles,
  },
] as const;

const faqs = [
  {
    question: "What can I upload?",
    answer:
      "Snap works with invites, flyers, screenshots, schedules, posters, event graphics, and similar event images people already use to share plans.",
  },
  {
    question: "Does Snap work with PDFs?",
    answer:
      "Yes. PDFs are a core part of the workflow alongside camera photos and uploaded images.",
  },
  {
    question: "Can I edit the details after upload?",
    answer:
      "Yes. Snap speeds up setup, then lets you review and refine details before the page goes live.",
  },
  {
    question: "How fast is it?",
    answer:
      "The workflow is designed to go from upload to organized event draft in seconds, then to a polished page after a quick review.",
  },
  {
    question: "Is the final page mobile-friendly?",
    answer:
      "Yes. The final event page is designed to be easier to scan and use on phones than a PDF or screenshot.",
  },
  {
    question: "Can I share the event with others?",
    answer:
      "Yes. The goal is one clean shareable page instead of forwarding multiple files, screenshots, and follow-up messages.",
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
      {body ? (
        <p className="mt-5 text-lg leading-8 text-[#58536e]">{body}</p>
      ) : null}
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
    ? "inline-flex items-center justify-center rounded-full bg-white px-7 py-4 text-base font-semibold text-[#5a33d6] shadow-[0_18px_42px_rgba(31,22,53,0.16)] transition-all hover:-translate-y-0.5"
    : "inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#7c3aed_0%,#944cff_100%)] px-7 py-4 text-base font-semibold text-white shadow-[0_18px_42px_rgba(124,58,237,0.24)] transition-all hover:-translate-y-0.5";

  if (href) {
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

function SecondaryButton({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) {
  return (
    <a
      href={href}
      className="inline-flex items-center justify-center rounded-full border border-[#e7ddff] bg-white px-7 py-4 text-base font-semibold text-[#2f2550] shadow-[0_12px_30px_rgba(93,67,171,0.08)] transition-all hover:-translate-y-0.5 hover:bg-[#faf7ff]"
    >
      {children}
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
      <p className="text-sm leading-7 text-white/64">{body}</p>
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
              Camera Mode
            </span>
            <Camera className="h-4 w-4 text-[#8d74e8]" />
          </div>
          <div className="flex h-60 items-center justify-center rounded-[1.6rem] border-2 border-dashed border-[#d9c9ff] bg-[#faf7ff]">
            <div className="text-center">
              <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-white text-[#a072ff] shadow-sm">
                <ImageUp className="h-7 w-7" />
              </div>
              <p className="mt-4 text-sm font-semibold text-[#9b85d6]">
                Drop your invite here
              </p>
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
                <div className="mt-1 text-sm font-semibold text-[#1f1635]">
                  Sat, Oct 12
                </div>
              </div>
              <div className="flex-1 rounded-2xl border border-[#eee5ff] px-4 py-3">
                <div className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[#9c86d6]">
                  Time
                </div>
                <div className="mt-1 text-sm font-semibold text-[#1f1635]">
                  7:00 PM
                </div>
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
                Extras
              </div>
              <div className="mt-1 text-sm font-semibold text-[#1f1635]">
                RSVP, registry link, and guest notes
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
          <Sparkles className="h-7 w-7" />
        </div>
        <h3 className="mt-5 text-2xl font-semibold text-[#1f1635]">
          Event is Live!
        </h3>
        <div className="mt-8 space-y-3">
          <div className="rounded-full bg-[#1f1635] px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white">
            Copy Link
          </div>
          <div className="rounded-full bg-[linear-gradient(135deg,#7c3aed_0%,#944cff_100%)] px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white">
            Share via WhatsApp
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
      <LandingNav gymnasticsHref="/gymnastics" />

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
              <Sparkles className="h-4 w-4" />
              Snap Upload
            </p>

            <h1 className="mt-7 text-[clamp(3.2rem,7vw,5.7rem)] font-semibold leading-[0.94] tracking-[-0.06em] text-[#1c1435]">
              Snap Any Invite
              <br />
              Into an{" "}
              <span className="bg-[linear-gradient(135deg,#6d39ff_0%,#9f5bff_100%)] bg-clip-text italic text-transparent">
                Event Page
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-[#5b5570] sm:text-xl">
              Upload invites, flyers, schedules, event images, or PDFs. Envitefy
              uses AI to turn static files into polished digital event pages
              with RSVPs, links, and clean mobile sharing built in.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              {renderPrimaryCta("Try Snap Upload")}
              <SecondaryButton href="#how-it-works">
                See How It Works
              </SecondaryButton>
            </div>

            <div className="mt-8 text-sm font-medium text-[#6b6482]">
              Works with birthday invites, wedding invites, school flyers,
              schedules, and PDFs.
            </div>
          </div>

          <div className="relative mx-auto flex w-full max-w-[42rem] items-center justify-center gap-4 sm:gap-8">
            <div className="relative shrink-0">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-[0.58rem] font-bold uppercase tracking-[0.24em] text-[#8f74eb] shadow-sm">
                1. Snap
              </div>
              <div className="w-[10.5rem] rotate-[-7deg] rounded-[2rem] border border-white bg-white p-3 shadow-[0_28px_80px_rgba(66,42,140,0.14)] sm:w-[13rem]">
                <div className="overflow-hidden rounded-[1.5rem]">
                  <Image
                    src="/phone-placeholders/birthday-maya.jpeg"
                    alt="Uploaded invite"
                    width={520}
                    height={700}
                    className="h-auto w-full object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="hidden flex-col items-center sm:flex">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#f0e7ff] text-[#8b5cf6] shadow-[0_16px_32px_rgba(139,92,246,0.18)]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="mt-3 h-24 w-px bg-gradient-to-b from-[#b690ff] to-transparent" />
              <p className="mt-3 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[#9b89d6]">
                AI Processing
              </p>
            </div>

            <div className="relative shrink-0">
              <div className="absolute -top-5 right-6 rounded-full bg-[linear-gradient(135deg,#7c3aed_0%,#944cff_100%)] px-3 py-1 text-[0.58rem] font-bold uppercase tracking-[0.24em] text-white shadow-[0_12px_26px_rgba(124,58,237,0.24)]">
                2. Live Event
              </div>
              <div className="w-[13.5rem] rotate-[4deg] rounded-[2.8rem] border border-white bg-white p-3 shadow-[0_36px_90px_rgba(66,42,140,0.15)] sm:w-[17rem]">
                <div className="mb-4 mt-1 h-1.5 w-14 rounded-full bg-[#e8e0fb] mx-auto" />
                <div className="overflow-hidden rounded-[1.7rem] bg-[#faf8ff] p-4">
                  <div className="overflow-hidden rounded-[1.25rem]">
                    <Image
                      src="/templates/hero-images/general-events-hero.jpeg"
                      alt="Live event page preview"
                      width={640}
                      height={360}
                      className="h-28 w-full object-cover sm:h-36"
                    />
                  </div>
                  <div className="mt-4 h-4 w-3/4 rounded-full bg-[#efe8ff]" />
                  <div className="mt-2 h-3 w-1/2 rounded-full bg-[#f5f0ff]" />
                  <div className="mt-6 rounded-full bg-[linear-gradient(135deg,#7c3aed_0%,#944cff_100%)] px-5 py-3 text-center text-xs font-bold uppercase tracking-[0.18em] text-white">
                    RSVP Now
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
            title="Anything you snap, we transform."
            body="Designed for every occasion, from personal parties to professional schedules."
          />

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            <article className="group md:col-span-2 rounded-[2.5rem] border border-[#ece4ff] bg-white p-8 shadow-[0_24px_60px_rgba(102,76,189,0.08)] transition-all hover:-translate-y-1">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f6efff] text-[#7c3aed]">
                <PartyPopper className="h-5 w-5" />
              </div>
              <h3 className="mt-6 text-3xl font-semibold text-[#1f1635]">
                Birthday Invitations
              </h3>
              <p className="mt-4 max-w-xl text-lg leading-8 text-[#5f5875]">
                Turn that text-message flyer or photo invite into a beautiful
                page where guests can RSVP and get the details fast.
              </p>
              <div className="mt-10 overflow-hidden rounded-[2rem] shadow-[0_20px_48px_rgba(31,22,53,0.12)]">
                <Image
                  src="/templates/birthdays/birthday-bash.webp"
                  alt="Birthday invitation use case"
                  width={1400}
                  height={760}
                  className="h-[18rem] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>
            </article>

            <article className="rounded-[2.5rem] border border-[#eadfff] bg-[#f7f2ff] p-8 shadow-[0_24px_60px_rgba(102,76,189,0.08)]">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#7c3aed] shadow-sm">
                <Heart className="h-5 w-5" />
              </div>
              <h3 className="mt-6 text-3xl font-semibold text-[#1f1635]">
                Wedding Invites
              </h3>
              <p className="mt-4 text-lg leading-8 text-[#5f5875]">
                Convert elegant paper invitations into a mobile-first digital
                home your guests can actually use.
              </p>
              <div className="mt-10 overflow-hidden rounded-[2rem] shadow-[0_20px_48px_rgba(31,22,53,0.12)]">
                <Image
                  src="/phone-placeholders/wedding-couple.jpeg"
                  alt="Wedding invitation use case"
                  width={700}
                  height={920}
                  className="h-[18rem] w-full object-cover"
                />
              </div>
            </article>

            {useCaseCards.slice(2).map(({ title, body, icon: Icon }) => (
              <article
                key={title}
                className="rounded-[2rem] border border-[#ece4ff] bg-white p-7 shadow-[0_20px_48px_rgba(102,76,189,0.06)]"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f6efff] text-[#7c3aed]">
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="mt-5 text-2xl font-semibold text-[#1f1635]">
                  {title}
                </h4>
                <p className="mt-3 text-base leading-7 text-[#5f5875]">
                  {body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading center title="The Magic Behind the Snap" />

          <div className="mt-20 space-y-24">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
              <div>
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#7c3aed_0%,#944cff_100%)] text-sm font-bold text-white shadow-[0_16px_30px_rgba(124,58,237,0.24)]">
                  1
                </div>
                <h3 className="mt-6 text-4xl font-semibold text-[#1f1635]">
                  Snap or Upload
                </h3>
                <p className="mt-5 text-lg leading-8 text-[#5f5875]">
                  Simply take a photo of a printed flyer or upload a digital
                  invitation from your camera roll. Our AI analyzes the visual
                  elements instantly.
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
                <h3 className="mt-6 text-4xl font-semibold text-[#1f1635]">
                  Review and Edit
                </h3>
                <p className="mt-5 text-lg leading-8 text-[#5f5875]">
                  Envitefy automatically pulls dates, times, and location data.
                  You can tweak any details, add extra links, and clean
                  everything up in seconds.
                </p>
              </div>
            </div>

            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
              <div>
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#7c3aed_0%,#944cff_100%)] text-sm font-bold text-white shadow-[0_16px_30px_rgba(124,58,237,0.24)]">
                  3
                </div>
                <h3 className="mt-6 text-4xl font-semibold text-[#1f1635]">
                  Save and Share the Page
                </h3>
                <p className="mt-5 text-lg leading-8 text-[#5f5875]">
                  Publish your shareable event page. Guests can RSVP with one
                  tap, and the event is easier to save, revisit, and share.
                </p>
              </div>
              <ProcessVisual step={3} />
            </div>
          </div>
        </div>
      </section>

      <section id="benefits" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[3rem] bg-[#24163f] p-8 text-white shadow-[0_32px_90px_rgba(31,22,53,0.18)] sm:p-12 lg:p-16">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {benefitCards.map((card) => (
              <BenefitTile
                key={card.title}
                icon={card.icon}
                title={card.title}
                body={card.body}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            center
            eyebrow="Product proof"
            title="What the finished page gives people"
            body="Use the uploaded image as the starting point, then publish a page that is easier to read, easier to share, and easier to update."
          />

          <div className="mt-16 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <article className="rounded-[2.4rem] border border-[#ece4ff] bg-white p-8 shadow-[0_24px_60px_rgba(102,76,189,0.08)]">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.8rem] border border-[#ece4ff] bg-[#faf7ff] p-6">
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#8b74de]">
                    Before
                  </p>
                  <div className="mt-5 space-y-3">
                    {[
                      "A screenshot in a group chat",
                      "A flyer guests have to zoom into",
                      "Repeated questions about time and location",
                    ].map((item) => (
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
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#bca8ff]">
                    After
                  </p>
                  <div className="mt-5 space-y-3">
                    {[
                      "One clean mobile-friendly event page",
                      "Structured details guests can actually scan",
                      "A link you can update instead of resend",
                    ].map((item) => (
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
              <h3 className="text-3xl font-semibold text-[#1f1635]">
                Included on the page
              </h3>
              <div className="mt-8 space-y-3">
                {[
                  "Event title, date, time, and location",
                  "Clean mobile-ready layout",
                  "RSVP or sign-up flow",
                  "Links, maps, schedules, and extra notes",
                  "One shareable destination for the event",
                ].map((item) => (
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

      <section
        id="faq"
        className="bg-[linear-gradient(180deg,#faf7ff_0%,#ffffff_100%)] px-4 py-24 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            center
            eyebrow="FAQ"
            title="Questions people ask before they click"
            body="The answers should stay specific, useful, and grounded in what Snap actually does."
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
            Snap it. Upload it. Turn it into an event page.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/84">
            Start with the invite or file you already have. Let Envitefy
            organize the details and make the event easier to share.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            {renderPrimaryCta("Try Snap Upload", true)}
            <SecondaryButton href="#how-it-works">
              See the workflow
            </SecondaryButton>
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
