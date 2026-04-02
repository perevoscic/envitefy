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
  Globe,
  Heart,
  type LucideIcon,
  Mail,
  MapPin,
  Menu,
  Share2,
  Sparkles,
  TowerControl,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { type ReactNode, useEffect, useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import EnvitefyWordmark from "@/components/branding/EnvitefyWordmark";
import AnimatedButtonLabel from "@/components/ui/AnimatedButtonLabel";
import styles from "./LandingExperience.module.css";

const IMAGES = {
  heroFlyer: "/images/hero-1-landing.png",
  heroEvent: "/images/hero-2-landing.png",
  birthday:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuC2SdbjJ2Q2yAa7pkrD491ZXZFqo0mEaCDzTM49Z2j38h99LUPSwLTq-5lTP0LEx7POmydICQgGMueDi2983410a7qIWCf8aXnbiSWFadoT_HcTYTwu3qIs_gDx3pnUPy-ynTKeYyv8OuATjDAtcSL_BtLkYjnOc7iOpwTiN58O-nm16LVyOWFfkQzailswcnJ2S5sq_N3rhjBN1aMjFEx1rQBzXGnkru1ZnyWLCwGL_LJDWuX_xqkDzlmVCOTQ2TQ8gdR2Wr0A",
  wedding:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuA_XUFFsglzS0um7E2IBPdfNuWygz29hI5OVubcJYKm6q4R42DTMrX_VMKNgB4DvN5qE0rzkojSY77gs2f6ARHml2Gc7Igq1sb8jSkmWrHt44MCjjmefqRId-jejbKe6VKg9uf8KBhi3ttIbTJKFt741Y3VGmZ18D-2JzLBo756S2Crlo5Teg-jqcjTZxbO7DG8xW5FoCUpVwpfjvF6tI2kQHLEDgW_s8Pk_AvZ_UbYQvTWPsUYUCUHuAR06QF5fqRAFKVzR8FX",
};

const navLinks = [
  { label: "Gymnastics", href: "/gymnastics" },
  { label: "Snap", href: "/snap" },
  { label: "Features", href: "#what-you-can-snap" },
  { label: "FAQ", href: "/faq" },
] as const;

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
      className={`${styles.btnRolling} group inline-flex h-[3.75rem] items-center justify-center overflow-hidden rounded-full bg-[#7C3AED] px-10 font-bold text-lg text-white shadow-xl shadow-[#7C3AED]/20 hover:bg-[#630ed4] ${className}`}
    >
      {typeof children === "string" ? (
        <AnimatedButtonLabel label={children} fullHeight />
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

export default function LandingExperience() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { status } = useSession();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileMenuOpen]);

  return (
    <>
      <div
        className={`${styles.root} min-h-screen overflow-x-hidden bg-white text-[#1f1635] selection:bg-[#7C3AED]/20 selection:text-[#7C3AED]`}
      >
        <nav
          className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
            isScrolled ? `${styles.glassNav} py-4` : `${styles.glassNav} py-6`
          }`}
        >
          <div
            className={`${styles.glassPill} mx-auto flex max-w-[1120px] items-center justify-between rounded-full px-5 py-3 sm:px-7 md:px-8`}
          >
            <Link href="/landing" className="flex items-center" aria-label="Envitefy">
              <EnvitefyWordmark scaled={false} className="text-[3.35rem] leading-none" />
            </Link>

            <div className="hidden items-center space-x-10 text-sm font-semibold text-[#58506d] lg:flex">
              {navLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="transition-colors hover:text-[#1f1635]"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              {status === "authenticated" ? (
                <Link
                  href="/"
                  className="hidden px-3 text-sm font-semibold text-[#1f1635] transition-colors hover:text-[#7C3AED] sm:block"
                >
                  Dashboard
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="hidden px-3 text-sm font-semibold text-[#1f1635] transition-colors hover:text-[#7C3AED] sm:block"
                >
                  Login
                </button>
              )}
              <Link
                href="/snap"
                className="group inline-flex h-11 items-center justify-center overflow-hidden rounded-full bg-[#7C3AED] px-6 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(124,58,237,0.32)] transition-all hover:bg-[#630ed4] active:scale-95 sm:px-8"
              >
                <AnimatedButtonLabel label="Get Started" fullHeight />
              </Link>
              <button
                type="button"
                className="text-[#1f1635] lg:hidden"
                onClick={() => setMobileMenuOpen((value) => !value)}
                aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
                aria-expanded={mobileMenuOpen}
                aria-controls="landing-mobile-nav"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          <div
            id="landing-mobile-nav"
            className={`mx-auto mt-3 max-w-[1120px] overflow-hidden rounded-[2rem] border border-white/80 bg-white/95 px-2 shadow-[0_18px_60px_rgba(67,43,153,0.1)] backdrop-blur-2xl transition-[max-height,opacity] duration-300 lg:hidden ${
              mobileMenuOpen ? "max-h-[24rem] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4">
              {navLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-2xl px-4 py-3 text-sm font-semibold text-[#1f1635] transition hover:bg-[#f9f9f9]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {status === "authenticated" ? (
                <Link
                  href="/"
                  className="rounded-2xl px-4 py-3 text-sm font-semibold text-[#1f1635]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="rounded-2xl px-4 py-3 text-left text-sm font-semibold text-[#1f1635]"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </nav>

        <header id="landing-hero" className="relative overflow-hidden px-6 pb-24 pt-32 lg:pt-48">
          <div
            className={`${styles.bloomEffect} pointer-events-none absolute left-1/2 top-0 h-full w-full -translate-x-1/2`}
          />
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-16 lg:flex-row lg:gap-24">
            <div className="z-10 flex-1 text-center lg:text-left">
              <h1
                className={`${styles.headline} mb-8 text-5xl font-extrabold leading-[1.05] tracking-tight text-[#1f1635] lg:text-7xl`}
              >
                Snap Any Invite Into an <span className="italic text-[#7C3AED]">Event Page</span>
              </h1>
              <p className="mb-12 max-w-2xl text-xl font-medium leading-relaxed text-[#53496b]">
                Upload birthdays, wedding invites, or baby shower flyers. Envitefy uses AI to turn
                static images into polished digital event pages with RSVPs built in.
              </p>
              <div className="flex flex-col justify-center gap-5 sm:flex-row lg:justify-start">
                <PrimaryCta href="/snap">Try Snap Upload</PrimaryCta>
                <a
                  href="#how-it-works"
                  className={`${styles.btnRolling} group inline-flex h-[3.75rem] items-center justify-center overflow-hidden rounded-full border border-[#1f1635]/10 bg-white px-10 font-bold text-lg text-[#1f1635] hover:bg-[#f9f9f9]`}
                >
                  <AnimatedButtonLabel label="See How It Works" fullHeight />
                </a>
              </div>
            </div>

            <div className="relative flex-1">
              <div className="relative z-10 flex flex-col items-center justify-center gap-6 sm:flex-row lg:gap-10">
                <div className={`${styles.cardGroup} group relative`}>
                  <div className="absolute -top-6 left-1/2 z-20 -translate-x-1/2 rounded-full border border-[#7C3AED]/10 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#7C3AED] shadow-sm">
                    1. Snap
                  </div>
                  <div
                    className={`${styles.heroSnapCard} w-62 overflow-hidden rounded-[1.5rem] shadow-2xl`}
                  >
                    <img
                      referrerPolicy="no-referrer"
                      alt="Original flyer"
                      className="aspect-[3/4] h-full w-full rounded-[1.5rem] object-cover grayscale-[0.2]"
                      src={IMAGES.heroFlyer}
                    />
                  </div>
                </div>

                <div className="hidden flex-col items-center gap-2 sm:flex">
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

                <div className={`${styles.cardGroup} group relative`}>
                  <div className="absolute -top-6 left-1/2 z-20 -translate-x-1/2 rounded-full bg-[#7C3AED] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">
                    2. Live Event
                  </div>
                  <div
                    className={`${styles.heroLiveCard} w-64 overflow-hidden rounded-[3rem] shadow-[0px_48px_80px_rgba(31,22,53,0.15)]`}
                  >
                    <img
                      referrerPolicy="no-referrer"
                      alt="Live event preview"
                      className="h-full w-full rounded-[3rem] object-cover"
                      src={IMAGES.heroEvent}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section id="what-you-can-snap" className="bg-[#f9f9f9]/50 px-6 py-32">
          <div className="mx-auto max-w-7xl">
            <div className="mb-20 text-center">
              <h2
                className={`${styles.headline} mb-6 text-4xl font-bold tracking-tight text-[#1f1635] lg:text-5xl`}
              >
                Anything you snap, we transform.
              </h2>
              <p className="mx-auto max-w-2xl text-lg font-medium text-[#53496b]">
                Designed for every occasion, from personal parties to professional schedules.
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
                    Turn that text message flyer into a beautiful page where guests can RSVP and see
                    the gift registry.
                  </p>
                </div>
                <div className="mt-12 transition-transform duration-700 group-hover:scale-[1.02]">
                  <img
                    referrerPolicy="no-referrer"
                    alt="Birthday invitation example"
                    className="aspect-video rounded-2xl object-cover shadow-2xl"
                    src={IMAGES.birthday}
                  />
                </div>
              </div>

              <div className="flex h-full flex-col rounded-[2rem] border border-[#7C3AED]/10 bg-[#7C3AED]/5 p-10 transition-all hover:-translate-y-1 hover:shadow-xl">
                <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#7C3AED] shadow-sm">
                  <Heart size={32} />
                </div>
                <h3 className={`${styles.headline} mb-4 text-3xl font-bold`}>Wedding Invites</h3>
                <p className="mb-10 text-lg leading-relaxed text-[#53496b]">
                  Convert elegant paper invitations into mobile-first digital homes for your big
                  day.
                </p>
                <div className="mt-auto">
                  <img
                    referrerPolicy="no-referrer"
                    alt="Wedding invitation example"
                    className="h-64 w-full rounded-2xl object-cover shadow-lg"
                    src={IMAGES.wedding}
                  />
                </div>
              </div>

              {useCases.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[2rem] border border-[#1f1635]/5 bg-white p-8 transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  <item.icon className="mb-6 text-[#7C3AED]" size={32} />
                  <h4 className={`${styles.headline} mb-3 text-xl font-bold`}>{item.title}</h4>
                  <p className="text-base leading-relaxed text-[#53496b]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="px-6 py-32">
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
                  <h3 className={`${styles.headline} mb-6 text-4xl font-bold tracking-tight`}>
                    Snap or Upload
                  </h3>
                  <p className="text-xl font-medium leading-relaxed text-[#53496b]">
                    Simply take a photo of a printed flyer or upload a digital invitation from your
                    camera roll. Our AI analyzes the visual elements instantly.
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
                        <span className="text-sm font-bold">Sunset Garden, 123 Maple St.</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7C3AED] text-xl font-bold text-white shadow-lg shadow-[#7C3AED]/20">
                    2
                  </div>
                  <h3 className={`${styles.headline} mb-6 text-4xl font-bold tracking-tight`}>
                    Review and Edit
                  </h3>
                  <p className="text-xl font-medium leading-relaxed text-[#53496b]">
                    Envitefy automatically pulls dates, times, and location data. You can tweak any
                    details or add a custom registry link in seconds.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-20 lg:flex-row">
                <div className="order-2 flex-1 lg:order-1">
                  <div className="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7C3AED] text-xl font-bold text-white shadow-lg shadow-[#7C3AED]/20">
                    3
                  </div>
                  <h3 className={`${styles.headline} mb-6 text-4xl font-bold tracking-tight`}>
                    Save and Share
                  </h3>
                  <p className="text-xl font-medium leading-relaxed text-[#53496b]">
                    Publish your shareable event page. Guests can RSVP with one tap, and the event
                    syncs directly to their Apple or Google Calendar.
                  </p>
                </div>
                <div className="order-1 w-full flex-1 lg:order-2">
                  <div className="rotate-1 rounded-[2rem] border border-[#7C3AED]/10 bg-[#7C3AED]/5 p-10 shadow-sm">
                    <div className="rounded-[2rem] bg-white p-10 text-center shadow-2xl">
                      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
                        <CheckCircle2 className="text-green-500" size={40} />
                      </div>
                      <h4 className={`${styles.headline} mb-8 text-2xl font-bold`}>
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

        <section id="rsvp-calendar" className="overflow-hidden px-6 py-32">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-24 lg:flex-row">
            <div className="relative h-[500px] w-full flex-1">
              <div
                className={`${styles.floatUp} absolute left-0 top-10 flex items-center gap-4 rounded-full border border-[#1f1635]/5 bg-white px-8 py-5 shadow-2xl`}
              >
                <CalendarCheck className="text-[#7C3AED]" size={24} />
                <span className="text-lg font-bold">Oct 24, 2024</span>
              </div>

              <div
                className={`${styles.floatDown} absolute right-0 top-[46%] flex items-center gap-4 rounded-full border border-[#1f1635]/5 bg-white px-8 py-5 shadow-2xl`}
              >
                <Clock className="text-[#7C3AED]" size={24} />
                <span className="text-lg font-bold">6:30 PM - 10:00 PM</span>
              </div>

              <div
                className={`${styles.floatLift} absolute bottom-10 left-12 flex items-center gap-4 rounded-full border border-[#1f1635]/5 bg-white px-8 py-5 shadow-2xl`}
              >
                <MapPin className="text-[#7C3AED]" size={24} />
                <span className="text-lg font-bold">The Glass House Venue</span>
              </div>

              <div className="absolute bottom-24 right-12 z-10 cursor-pointer rounded-full bg-[#7C3AED] px-10 py-6 text-white shadow-2xl shadow-[#7C3AED]/30 transition-transform hover:scale-105">
                <div className="flex items-center gap-4">
                  <CheckCircle2 size={32} />
                  <span className="text-xl font-extrabold">I&apos;m Attending!</span>
                </div>
              </div>

              <div className={`${styles.halo} absolute inset-0 -z-10 scale-125 rounded-full`} />
            </div>

            <div className="flex-1">
              <h2
                className={`${styles.headline} mb-8 text-4xl font-bold tracking-tight lg:text-5xl`}
              >
                Designed to Get a &apos;Yes&apos;.
              </h2>
              <p className="mb-12 text-xl font-medium leading-relaxed text-[#53496b]">
                We&apos;ve optimized the RSVP experience to be frictionless. No accounts required
                for guests-just simple, beautiful interactions that make people excited to attend.
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

        <section className="px-6 py-32">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[3rem] bg-[#7C3AED]/5 p-16 text-center lg:p-24">
            <div className="absolute -right-10 -top-10 p-12 text-[#7C3AED] opacity-5">
              <Sparkles size={240} />
            </div>
            <h2
              className={`${styles.headline} relative z-10 mb-8 text-4xl font-extrabold leading-tight tracking-tight text-[#1f1635] lg:text-6xl`}
            >
              Turn Your Next Invite Into a{" "}
              <span className="italic text-[#7C3AED]">Shareable Event</span>.
            </h2>
            <p className="relative z-10 mx-auto mb-14 max-w-2xl text-xl font-medium text-[#53496b]">
              Snap it. Edit it. Share it. Your digital curator is ready to transform your
              celebrations.
            </p>
            <PrimaryCta href="/snap" className="relative z-10 px-14 py-6 text-2xl">
              Try Snap Upload
            </PrimaryCta>
          </div>
        </section>

        <footer className="w-full border-t border-[#1f1635]/5 bg-[#f9f9f9] py-24">
          <div className="mx-auto max-w-7xl px-6 md:px-12">
            <div className="mb-12 flex flex-col items-center justify-between gap-12 md:flex-row">
              <div className="text-center md:text-left">
                <div className={`${styles.headline} mb-3 text-2xl font-bold text-[#1f1635]`}>
                  Envitefy
                </div>
                <p className="text-sm text-[#53496b]">
                  © {new Date().getFullYear()} Envitefy. The Digital Curator.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-x-10 gap-y-4">
                <Link
                  href="/privacy"
                  className="text-sm font-medium text-[#53496b] transition-colors hover:text-[#7C3AED]"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms"
                  className="text-sm font-medium text-[#53496b] transition-colors hover:text-[#7C3AED]"
                >
                  Terms of Service
                </Link>
                <Link
                  href="/contact"
                  className="text-sm font-medium text-[#53496b] transition-colors hover:text-[#7C3AED]"
                >
                  Contact Support
                </Link>
                <Link
                  href="/about"
                  className="text-sm font-medium text-[#53496b] transition-colors hover:text-[#7C3AED]"
                >
                  Press Kit
                </Link>
              </div>

              <div className="flex items-center gap-6">
                <Link
                  href="/about"
                  className="text-[#53496b] transition-colors hover:text-[#7C3AED]"
                  aria-label="About Envitefy"
                >
                  <Globe size={20} />
                </Link>
                <Link
                  href="/contact"
                  className="text-[#53496b] transition-colors hover:text-[#7C3AED]"
                  aria-label="Contact Envitefy"
                >
                  <Mail size={20} />
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <AuthModal
        open={authModalOpen}
        mode="login"
        onClose={() => setAuthModalOpen(false)}
        allowSignupSwitch={false}
      />
    </>
  );
}
