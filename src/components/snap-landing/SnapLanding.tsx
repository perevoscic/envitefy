"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  MessageSquare,
  Smartphone,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import HeroTopNav from "@/components/navigation/HeroTopNav";
import AnimatedButtonLabel from "@/components/ui/AnimatedButtonLabel";

const problemItems = [
  {
    title: "Blurry Screenshots",
    desc: "Flyers are hard to read on mobile and impossible to search.",
    icon: <Smartphone className="h-6 w-6 text-rose-500" />,
  },
  {
    title: "Scattered Details",
    desc: "The date is in the flyer, but the RSVP link is buried in a chat.",
    icon: <MessageSquare className="h-6 w-6 text-rose-500" />,
  },
  {
    title: "Constant Questions",
    desc: '"What time is it again?" "Where do I park?" "What\'s the gift policy?"',
    icon: <Users className="h-6 w-6 text-rose-500" />,
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
    color: "bg-amber-500",
    icon: <Zap className="h-5 w-5" />,
  },
  {
    title: "Sports Schedules",
    color: "bg-blue-500",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "School Flyers",
    color: "bg-emerald-500",
    icon: <Smartphone className="h-5 w-5" />,
  },
  {
    title: "Wedding Details",
    color: "bg-rose-500",
    icon: <Calendar className="h-5 w-5" />,
  },
] as const;

const faqs = [
  {
    q: "How accurate is the AI extraction?",
    a: "Extremely. We use state-of-the-art vision models to extract text, but we always give you a quick review screen to double-check the details before you share.",
  },
  {
    q: "Does it work with handwritten invites?",
    a: "Yes! As long as the handwriting is legible, our AI can typically extract the core details like date, time, and location.",
  },
  {
    q: "Can I add my own RSVP form?",
    a: "Every Snap page comes with a built-in RSVP flow. You can also add custom links for registries, sign-up sheets, or payment apps.",
  },
  {
    q: "Is it free to use?",
    a: "You can snap your first few invites for free. We offer premium plans for power users and community organizers who need advanced features.",
  },
] as const;

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
    ? "cta-shell flex h-14 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-8 text-lg font-bold text-slate-900 transition-all hover:border-slate-300 sm:w-auto"
    : "cta-shell flex h-14 w-full items-center justify-center rounded-2xl bg-indigo-600 px-8 text-lg font-bold text-white shadow-xl shadow-indigo-200 transition-all hover:bg-indigo-700 sm:w-auto";

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
      className="overflow-hidden bg-gradient-to-b from-slate-50 to-white pb-20 pt-32"
    >
      <div className="mx-auto max-w-7xl px-4 text-center pb-8">
        <div className="animate-in fade-in zoom-in-95 duration-200">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold tracking-wider text-indigo-700 uppercase">
            <Zap className="h-3 w-3 fill-indigo-700" /> From Upload to Event
          </span>
          <h1 className="mb-6 text-5xl leading-[1.1] font-extrabold tracking-tight text-slate-900 md:text-7xl">
            Stop sharing screenshots.
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Start sharing events.
            </span>
          </h1>
        </div>
      </div>

      <div className="relative mt-8 w-full md:mt-10">
        <div className="relative z-10 w-full overflow-hidden">
          <img
            src="/images/snap-hero.png"
            alt="Envitefy Snap Interface"
            className="block h-auto w-full"
          />
        </div>
        <div className="absolute -top-10 left-0 -z-10 h-40 w-40 rounded-full bg-indigo-100 opacity-50 blur-3xl" />
        <div className="absolute right-0 -bottom-10 -z-10 h-60 w-60 rounded-full bg-violet-100 opacity-50 blur-3xl" />
      </div>

      <div className="mx-auto mt-10 max-w-2xl px-4 text-center">
        <p className="text-lg leading-relaxed text-slate-600 md:text-xl">
          Turn messy flyers, screenshots, and PDFs into beautiful, shareable
          event pages in seconds. One link for RSVPs, maps, and details, no more
          group chat chaos.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <CtaButton
            label="Snap Your First Invite"
            href={primaryHref}
            onClick={primaryHref ? undefined : onPrimaryAction}
            icon={ArrowRight}
          />
          <CtaButton label="See Example" href="#use-cases" light />
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  return (
    <div className="border-y border-slate-100 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 text-center">
        <p className="mb-8 text-sm font-semibold tracking-widest text-slate-400 uppercase">
          Trusted by 10,000+ busy parents & organizers
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 opacity-50 grayscale md:gap-16">
          <span className="text-xl font-bold text-slate-900">ParentCircle</span>
          <span className="text-xl font-bold text-slate-900">EventPro</span>
          <span className="text-xl font-bold text-slate-900">CommunityHub</span>
          <span className="text-xl font-bold text-slate-900">TeamSnap</span>
        </div>
      </div>
    </div>
  );
}

function ProblemSection() {
  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-slate-900 md:text-4xl">
            The "Group Chat Nightmare" ends here.
          </h2>
          <p className="mx-auto max-w-2xl text-slate-600">
            We've all been there. Squinting at a blurry screenshot or scrolling
            back 100 messages to find the address.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {problemItems.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50">
                {item.icon}
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900">
                {item.title}
              </h3>
              <p className="leading-relaxed text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-4 lg:grid-cols-2">
        <div>
          <h2 className="mb-8 text-4xl font-bold leading-tight text-slate-900">
            From messy photo to
            <br />
            <span className="text-indigo-600">polished event page</span> in
            seconds.
          </h2>
          <div className="space-y-10">
            {steps.map((item) => (
              <div key={item.step} className="flex gap-6">
                <span className="text-4xl font-black text-slate-100 tabular-nums">
                  {item.step}
                </span>
                <div>
                  <h3 className="mb-2 text-xl font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="text-slate-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="group relative aspect-square overflow-hidden rounded-3xl bg-indigo-600 shadow-2xl">
            <img
              src="https://picsum.photos/seed/snap-process/800/800"
              alt="AI Extraction Process"
              className="h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/60 to-transparent" />
            <div className="absolute right-8 bottom-8 left-8 rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
              <div className="mb-2 flex items-center gap-3">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                <span className="text-sm font-bold tracking-wider text-white uppercase">
                  AI Processing Complete
                </span>
              </div>
              <p className="text-sm text-white/90">
                Extracted: Birthday Party, Oct 12th, 2:00 PM
              </p>
            </div>
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
      className="overflow-hidden bg-slate-900 py-24 text-white"
    >
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold italic md:text-4xl">
            One tool. Infinite events.
          </h2>
          <p className="mx-auto max-w-2xl text-slate-400">
            Whether it's a paper flyer or a digital PDF, Envitefy Snap handles
            it all.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {useCases.map((item) => (
            <div
              key={item.title}
              className="group relative cursor-default rounded-3xl border border-slate-700 bg-slate-800 p-8 transition-all hover:border-indigo-500"
            >
              <div
                className={`mb-6 flex h-10 w-10 items-center justify-center rounded-xl ${item.color} shadow-lg`}
              >
                {item.icon}
              </div>
              <h3 className="mb-2 text-xl font-bold">{item.title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">
                Turn any {item.title.toLowerCase()} into a functional event page
                in seconds.
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  return (
    <section id="faq" className="bg-white py-24">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="mb-12 text-center text-3xl font-bold text-slate-900 italic">
          Common Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={faq.q}
                className="overflow-hidden rounded-2xl border border-slate-100"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-slate-50"
                >
                  <span className="font-bold text-slate-900">{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-slate-400 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen ? (
                  <div className="border-t border-slate-50 p-6 pt-0 leading-relaxed text-slate-600">
                    {faq.a}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function SnapLanding() {
  const searchParams = useSearchParams();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
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
    <div className="min-h-screen bg-white font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <HeroTopNav
        navLinks={[
          { label: "Gymnastics", href: "/gymnastics" },
          { label: "Snap", href: "#snap" },
          { label: "How It Works", href: "#how-it-works" },
          { label: "Use Cases", href: "#use-cases" },
          { label: "FAQ", href: "#faq" },
        ]}
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

      <section className="relative overflow-hidden bg-white py-24">
        <div className="relative z-10 mx-auto max-w-5xl px-4 text-center">
          <div className="relative overflow-hidden rounded-[3rem] bg-indigo-600 p-12 shadow-2xl shadow-indigo-200 md:p-20">
            <div className="absolute top-0 right-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/2 translate-y-1/2 rounded-full bg-indigo-400/20 blur-3xl" />

            <h2 className="mb-8 text-4xl font-extrabold leading-tight text-white md:text-5xl">
              Ready to clear the
              <br />
              group chat chaos?
            </h2>
            <p className="mx-auto mb-12 max-w-xl text-lg text-indigo-100">
              Join thousands of organizers who use Envitefy Snap to turn messy
              invites into magical event pages.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <CtaButton
                label="Get Started Free"
                href={isAuthenticated ? "/event" : undefined}
                onClick={isAuthenticated ? undefined : () => openAuth("signup")}
                light
              />
              <p className="text-sm font-medium text-indigo-200">
                No credit card required.
              </p>
            </div>
          </div>
        </div>
      </section>

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
