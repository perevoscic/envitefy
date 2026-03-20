"use client";

import { useState } from "react";
import GymnasticsHeroBackground from "./GymnasticsHeroBackground";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Globe,
  Hotel,
  MapPinned,
  MessageSquare,
  Sparkles,
  Trophy,
  Upload,
  Users,
  ClipboardList,
  Share2,
  Shield,
  Smartphone,
} from "lucide-react";

/* ─── trust strip logos (text-based, no images needed) ─── */
const trustItems = [
  "Gymnastics parents",
  "Meet directors",
  "Coaches & teams",
  "Club gyms",
  "USAG events",
];

/* ─── feature pillars ─── */
const features = [
  {
    icon: CalendarDays,
    title: "Meet Schedules",
    copy: "Sessions, warm-ups, rotations, and awards timing in a clean layout that parents can scan in seconds.",
    backCopy:
      "Every session is broken down with check-in times, warm-up windows, rotation orders, and awards timing. Parents see exactly when their athlete competes — no more decoding spreadsheets or PDF tables on a tiny phone screen.",
    accent: "from-indigo-500/10 to-violet-500/10",
    iconColor: "text-indigo-600",
  },
  {
    icon: Hotel,
    title: "Travel & Hotels",
    copy: "Block booking links, parking notes, shuttle info, and venue directions — all in one place.",
    backCopy:
      "Attach hotel block links with deadlines, embed venue maps with parking notes, and include shuttle schedules. Families stop hunting through separate docs — everything travel-related lives right on the meet page.",
    accent: "from-violet-500/10 to-fuchsia-500/10",
    iconColor: "text-violet-600",
  },
  {
    icon: Users,
    title: "Team Coordination",
    copy: "Keep athletes, parents, and coaching staff aligned with a single shared meet hub.",
    backCopy:
      "One link keeps the entire team in sync. Coaches post warm-up assignments, parents confirm attendance, and athletes see their rotation details — all from the same page instead of scattered group chats.",
    accent: "from-fuchsia-500/10 to-pink-500/10",
    iconColor: "text-fuchsia-600",
  },
  {
    icon: MessageSquare,
    title: "Updates & Announcements",
    copy: "Last-minute changes reach everyone instantly instead of getting buried in group chats.",
    backCopy:
      "Schedule changes, venue updates, and weather delays are posted once and visible to every family immediately. No more re-sending PDFs or hoping a text chain reaches everyone in time.",
    accent: "from-pink-500/10 to-rose-500/10",
    iconColor: "text-pink-600",
  },
];

/* ─── use cases ─── */
const useCases = [
  {
    eyebrow: "For parents",
    title: "Know exactly what to expect",
    copy: "One link with session times, venue directions, parking, and spectator info — no more hunting through PDFs and email threads.",
    icon: Smartphone,
  },
  {
    eyebrow: "For coaches",
    title: "Share everything in one place",
    copy: "Stop resending updated packets. Upload once, publish once, and every family gets the same up-to-date information.",
    icon: Share2,
  },
  {
    eyebrow: "For meet directors",
    title: "Present a polished event",
    copy: "Give your meet a professional public page with schedules, venue maps, hotel blocks, and spectator guidance.",
    icon: Trophy,
  },
];

/* ─── why envitefy stats ─── */
const whyStats = [
  { value: "1", label: "page for every meet" },
  { value: "5x", label: "faster than PDF packets" },
  { value: "100%", label: "mobile-ready" },
  { value: "0", label: "app downloads required" },
];

/* ─── flip card component ─── */
function FeatureFlipCard({
  f,
}: {
  f: (typeof features)[number];
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <article
      className="group cursor-pointer"
      style={{ perspective: "1000px" }}
      onClick={() => setFlipped((prev) => !prev)}
    >
      <div
        className="relative transition-transform duration-600"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          willChange: "transform",
          transitionTimingFunction: "cubic-bezier(0.4, 0.2, 0.2, 1)",
          minHeight: "260px",
        }}
      >
        {/* ─── FRONT ─── */}
        <div
          className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow duration-300 ease-out hover:shadow-lg hover:shadow-indigo-500/5"
          style={{ backfaceVisibility: "hidden", minHeight: "260px" }}
        >
          {/* accent gradient bg */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${f.accent} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
          />
          <div className="relative">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.accent} ${f.iconColor}`}
            >
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-slate-900" style={{ fontFamily: "inherit" }}>
              {f.title}
            </h3>
            <p className="mt-2.5 text-sm leading-6 text-slate-500">
              {f.copy}
            </p>
            <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-indigo-600 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100">
              Tap to learn more
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* ─── BACK ─── */}
        <div
          className={`absolute inset-0 overflow-hidden rounded-2xl border border-indigo-400/30 bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 p-6 text-white shadow-lg`}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            minHeight: "260px",
          }}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white`}
              >
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white" style={{ color: "#fff", fontFamily: "inherit" }}>
                {f.title}
              </h3>
            </div>
            <p className="mt-4 flex-1 text-sm leading-6 text-white/85">
              {f.backCopy}
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-white/70">
              Tap to flip back
              <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function GymnasticsLanding() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fafbfe] text-[#0f172a] selection:bg-indigo-200 selection:text-indigo-900">
      {/* page background sits behind the sticky nav and hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[72rem] lg:h-[78rem]"
      >
        <GymnasticsHeroBackground />
      </div>

      {/* ═══ NAV ═══ */}
      <header className="sticky top-0 z-50">
        <div className="mx-auto max-w-[1400px] px-4 pt-3 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/70 px-5 py-3 shadow-[0_8px_32px_rgba(99,102,241,0.06)] backdrop-blur-xl">
            {/* brand */}
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/favicon.png"
                alt="Envitefy"
                width={44}
                height={44}
                priority
                unoptimized
                className="h-11 w-11 rounded-xl shadow-lg shadow-indigo-500/20"
              />
              <div className="hidden sm:block">
                <Image
                  src="/logo.png"
                  alt="Envitefy"
                  width={136}
                  height={41}
                  priority
                  className="h-8 w-auto -ml-1"
                />
                <p className="text-sm font-semibold text-slate-900">
                  Gymnastics
                </p>
              </div>
            </Link>

            {/* center links */}
            <div className="hidden items-center gap-1 lg:flex">
              {[
                { label: "Features", href: "#features" },
                { label: "How It Works", href: "#how-it-works" },
                { label: "Use Cases", href: "#use-cases" },
                { label: "Why Envitefy", href: "#why-envitefy" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* right CTA */}
            <div className="flex items-center gap-2.5">
              <Link
                href="/event/gymnastics"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:-translate-y-px hover:shadow-xl hover:shadow-indigo-500/30"
              >
                Start a Meet
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* ═══ HERO ═══ */}
      <section id="hero" className="relative z-10 scroll-mt-20 overflow-hidden">
        <div className="relative z-10 mx-auto max-w-[1400px] px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-24">
          {/* centered hero content */}
          <div className="mx-auto max-w-4xl text-center">
            {/* social proof chip */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-indigo-100 bg-white px-4 py-2 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500">
                <span className="inline-flex h-2 w-2 animate-ping rounded-full bg-emerald-400 opacity-75" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Trusted by gymnastics families nationwide
              </span>
            </div>

            {/* headline */}
            <h1 className="mx-auto mt-8 max-w-[18ch] text-[clamp(2.8rem,6.5vw,5.5rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-slate-900" style={{ fontFamily: "inherit" }}>
              Organize every{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
                gymnastics meet
              </span>{" "}
              in one place
            </h1>

            {/* subheadline */}
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-slate-500 sm:text-xl sm:leading-9">
              Envitefy turns meet schedules, venue details, hotel blocks, and
              team updates into one polished page that parents, coaches, and
              athletes can actually rely on.
            </p>

            {/* CTA row */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/event/gymnastics"
                className="group inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-4.5 text-base font-semibold text-white shadow-xl shadow-indigo-500/25 transition hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-indigo-500/30"
              >
                Start Your Meet Page
                <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-8 py-4.5 text-base font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                See How It Works
              </a>
            </div>

            {/* feature chips */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
              {["Schedules", "Venue Maps", "Hotel Blocks", "Team Updates", "Spectator Info"].map(
                (chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-slate-100 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-500 shadow-sm"
                  >
                    {chip}
                  </span>
                )
              )}
            </div>
          </div>

          {/* ─── product preview mockup ─── */}
          <div className="relative mx-auto mt-16 max-w-[1200px] lg:mt-20">
            {/* subtle glow behind mockup */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 -top-8 h-[120%] rounded-[3rem] bg-gradient-to-b from-indigo-50/80 via-white/40 to-transparent"
            />

            <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white p-1.5 shadow-2xl shadow-slate-900/8 sm:rounded-[2.5rem] sm:p-2">
              {/* browser chrome bar */}
              <div className="flex items-center gap-2 rounded-t-[1.75rem] bg-slate-50 px-4 py-3 sm:rounded-t-[2rem] sm:px-6">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-slate-200" />
                  <div className="h-3 w-3 rounded-full bg-slate-200" />
                  <div className="h-3 w-3 rounded-full bg-slate-200" />
                </div>
                <div className="mx-auto flex max-w-md flex-1 items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs text-slate-400 shadow-sm">
                  <Globe className="h-3 w-3" />
                  envitefy.com/meet/summit-invitational
                </div>
              </div>

              {/* dashboard content */}
              <div className="rounded-b-[1.75rem] bg-gradient-to-b from-slate-50 to-white p-4 sm:rounded-b-[2rem] sm:p-6 lg:p-8">
                <div className="grid gap-5 lg:grid-cols-[1fr_0.42fr]">
                  {/* main panel */}
                  <div className="space-y-5">
                    {/* event header */}
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                          Public Meet Page
                        </p>
                        <h3 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl" style={{ fontFamily: "inherit" }}>
                          Summit Invitational
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Aurora Convention Hall · April 18–20, 2026
                        </p>
                      </div>
                    </div>

                    {/* session schedule card */}
                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <CalendarDays className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                              Session 2
                            </p>
                            <p className="text-base font-semibold text-slate-900">
                              Level 7 & Xcel Gold
                            </p>
                          </div>
                        </div>
                        <Clock3 className="hidden h-5 w-5 text-slate-300 sm:block" />
                      </div>

                      <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                        {[
                          ["Check-in", "7:10 AM"],
                          ["Warm-up", "7:35 AM"],
                          ["Awards", "11:40 AM"],
                        ].map(([label, time]) => (
                          <div
                            key={label}
                            className="rounded-xl bg-slate-50 px-3.5 py-3"
                          >
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                              {label}
                            </p>
                            <p className="mt-1.5 text-sm font-semibold text-slate-800">
                              {time}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* venue + travel row */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                            <MapPinned className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                              Venue
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                              Aurora Convention Hall
                            </p>
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-500">
                          West lobby entry · Upper balcony seating
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-50 text-fuchsia-600">
                            <Hotel className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                              Travel
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                              Block closes March 26
                            </p>
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-500">
                          Booking link · Shuttle schedule
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* side panel */}
                  <div className="hidden space-y-4 lg:block">
                    {/* spectator guide card */}
                    <div className="rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-slate-50 p-5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
                          <ClipboardList className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-semibold text-slate-900">
                          Spectator Guide
                        </p>
                      </div>
                      <div className="mt-4 space-y-2.5">
                        {[
                          "West lobby entry",
                          "Upper balcony seating",
                          "Concessions level 2",
                        ].map((note) => (
                          <div
                            key={note}
                            className="rounded-xl bg-white px-3 py-2.5 text-sm text-slate-500 shadow-sm"
                          >
                            {note}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* quick info */}
                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Quick share
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                          One link for all families
                        </p>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                          <Share2 className="h-4 w-4" />
                        </div>
                      </div>
                    </div>

                    {/* tag chips */}
                    <div className="flex flex-wrap gap-2">
                      {["Schedule", "Venue", "Hotels", "Maps"].map((tag) => (
                        <span
                          key={tag}
                          className="rounded-lg border border-slate-100 bg-white px-2.5 py-1 text-xs font-medium text-slate-500 shadow-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* bottom bar */}
                <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Globe className="h-4 w-4 text-indigo-500" />
                    Shareable public meet page
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-2 text-xs font-semibold text-white">
                    View Meet
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TRUST STRIP ═══ */}
      <section className="border-y border-slate-100 bg-white/60 py-6 backdrop-blur-sm">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Built for
            </p>
            {trustItems.map((item) => (
              <span
                key={item}
                className="text-sm font-semibold text-slate-400 transition hover:text-slate-600"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="scroll-mt-20 py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          {/* section header */}
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">
              Core Features
            </p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3.2rem)] font-bold leading-[1.1] tracking-tight text-slate-900" style={{ fontFamily: "inherit" }}>
              Everything gymnastics families actually need, in one page
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-500 sm:text-lg">
              No more hunting through PDF packets, email threads, and group
              chats. Envitefy surfaces the right details for every audience.
            </p>
          </div>

          {/* feature grid (flip cards) */}
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <FeatureFlipCard key={f.title} f={f} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section
        id="how-it-works"
        className="scroll-mt-20 bg-gradient-to-b from-slate-50 to-white py-20 lg:py-28"
      >
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">
              How It Works
            </p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3.2rem)] font-bold leading-[1.1] tracking-tight text-slate-900" style={{ fontFamily: "inherit" }}>
              Three steps to a polished meet page
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-500">
              Upload once. Organize automatically. Share one link with every
              family, coach, and spectator.
            </p>
          </div>

          <div className="relative mt-14 grid gap-6 lg:grid-cols-3">
            {/* connector line */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-0 right-0 top-[3.5rem] hidden h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent lg:block"
            />

            {[
              {
                step: "01",
                icon: Upload,
                title: "Upload Meet Info",
                copy: "Bring in your meet packet, session schedule, venue details, hotel sheet, and documents.",
              },
              {
                step: "02",
                icon: Sparkles,
                title: "Envitefy Organizes It",
                copy: "We structure everything into the sections gymnasts families need: sessions, venue, travel, and updates.",
              },
              {
                step: "03",
                icon: Share2,
                title: "Share One Link",
                copy: "Parents, coaches, athletes, and spectators all use the same polished page — no app download needed.",
              },
            ].map((item) => (
              <article
                key={item.step}
                className="relative rounded-2xl border border-slate-100 bg-white p-7 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-600">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <span className="text-3xl font-bold text-slate-100">
                    {item.step}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-slate-900" style={{ fontFamily: "inherit" }}>
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  {item.copy}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRODUCT SHOWCASE ═══ */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            {/* left: text */}
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">
                Platform Preview
              </p>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3.2rem)] font-bold leading-[1.1] tracking-tight text-slate-900" style={{ fontFamily: "inherit" }}>
                A meet page that feels like a real product, not a PDF
              </h2>
              <p className="mt-5 text-base leading-7 text-slate-500 sm:text-lg">
                Every detail is structured, searchable, and mobile-first.
                Families get the information they need without zooming into
                packets or scrolling through documents.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  {
                    icon: Shield,
                    title: "Always accessible",
                    desc: "No app required. Works on any phone, tablet, or computer.",
                  },
                  {
                    icon: Smartphone,
                    title: "Mobile-first design",
                    desc: "Built for parents checking times while walking into the venue.",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* right: mockup */}
            <div className="relative">
              {/* glow */}
              <div
                aria-hidden="true"
                className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-indigo-100/50 via-violet-50/40 to-fuchsia-100/30 blur-2xl"
              />

              <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white p-5 shadow-xl sm:p-6">
                {/* mobile frame */}
                <div className="mx-auto max-w-[340px] overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-lg">
                  {/* status bar */}
                  <div className="flex items-center justify-center bg-slate-900 px-4 py-2">
                    <span className="text-[11px] font-medium text-white/70">
                      envitefy.com
                    </span>
                  </div>

                  {/* mobile content */}
                  <div className="space-y-3 p-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Gymnastics Meet
                      </p>
                      <p className="mt-1 text-lg font-bold text-slate-900">
                        Summit Invitational
                      </p>
                      <p className="text-xs text-slate-500">
                        April 18–20 · Aurora Convention Hall
                      </p>
                    </div>

                    {/* tabs */}
                    <div className="flex gap-1.5 overflow-x-auto">
                      {["Sessions", "Venue", "Hotels", "Info"].map(
                        (tab, i) => (
                          <span
                            key={tab}
                            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold ${i === 0 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}
                          >
                            {tab}
                          </span>
                        )
                      )}
                    </div>

                    {/* session card */}
                    <div className="rounded-xl bg-slate-50 p-3.5">
                      <p className="text-xs font-semibold text-slate-600">
                        Session 2 · Level 7 & Xcel Gold
                      </p>
                      <div className="mt-2 space-y-1.5">
                        {[
                          ["Check-in", "7:10 AM"],
                          ["Warm-up", "7:35 AM"],
                          ["Awards", "11:40 AM"],
                        ].map(([lbl, val]) => (
                          <div
                            key={lbl}
                            className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs"
                          >
                            <span className="text-slate-400">{lbl}</span>
                            <span className="font-semibold text-slate-700">
                              {val}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* venue snippet */}
                    <div className="rounded-xl bg-violet-50 p-3.5">
                      <div className="flex items-center gap-2">
                        <MapPinned className="h-4 w-4 text-violet-500" />
                        <p className="text-xs font-semibold text-slate-700">
                          Aurora Convention Hall
                        </p>
                      </div>
                      <p className="mt-1.5 text-[11px] text-slate-500">
                        West lobby · Upper balcony seating
                      </p>
                    </div>

                    {/* hotel snippet */}
                    <div className="rounded-xl bg-fuchsia-50 p-3.5">
                      <div className="flex items-center gap-2">
                        <Hotel className="h-4 w-4 text-fuchsia-500" />
                        <p className="text-xs font-semibold text-slate-700">
                          Hotel block closes March 26
                        </p>
                      </div>
                      <p className="mt-1.5 text-[11px] text-slate-500">
                        Booking link · Shuttle schedule
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ USE CASES ═══ */}
      <section
        id="use-cases"
        className="scroll-mt-20 bg-gradient-to-b from-white to-slate-50 py-20 lg:py-28"
      >
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">
              Use Cases
            </p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3.2rem)] font-bold leading-[1.1] tracking-tight text-slate-900" style={{ fontFamily: "inherit" }}>
              Built for everyone at the meet
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-500">
              Parents, coaches, and meet directors all need different details.
              Envitefy keeps one source of truth while presenting the right
              information for each audience.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {useCases.map((uc) => (
              <article
                key={uc.title}
                className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-600 transition-colors group-hover:from-indigo-100 group-hover:to-violet-100">
                  <uc.icon className="h-5 w-5" />
                </div>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                  {uc.eyebrow}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900" style={{ fontFamily: "inherit" }}>
                  {uc.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  {uc.copy}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHY ENVITEFY ═══ */}
      <section id="why-envitefy" className="scroll-mt-20 py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/60 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-2xl sm:p-12 lg:p-16">
            {/* subtle radial highlights */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute right-0 top-0 h-[450px] w-[450px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.15),transparent_70%)]" />
              <div className="absolute bottom-0 left-0 h-[350px] w-[350px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.1),transparent_70%)]" />
            </div>

            <div className="relative">
              <div className="mx-auto max-w-2xl text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-400">
                  Why Envitefy
                </p>
                <h2 className="mt-4 text-[clamp(2rem,4vw,3.2rem)] font-bold leading-[1.1] tracking-tight text-white" style={{ color: "#fff", fontFamily: "inherit" }}>
                  The meet page gymnastics deserves
                </h2>
                <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-400">
                  Gymnastics meet information is too important to live in messy
                  files. Envitefy gives it a home that families, coaches, and
                  organizers can trust.
                </p>
              </div>

              {/* stats grid */}
              <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {whyStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/8 bg-white/5 p-6 text-center backdrop-blur-sm"
                  >
                    <p className="text-4xl font-extrabold text-white">
                      {stat.value}
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-400">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* checklist */}
              <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-2">
                {[
                  "Replace PDF packets with a clean meeting page",
                  "Works on every phone — no app download",
                  "Schedule changes reach everyone instantly",
                  "Venue maps and hotel info in one view",
                  "Share one link across all team channels",
                  "Professional presentation for your organization",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
                      <Check className="h-3 w-3" />
                    </span>
                    <p className="text-sm leading-6 text-slate-300">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="pb-20 pt-4 lg:pb-28">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 p-8 text-center text-white shadow-2xl shadow-indigo-500/20 sm:p-12 lg:p-16">
            {/* refracted glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.1),transparent_35%)]"
            />

            <div className="relative mx-auto max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
                Ready to get started?
              </p>
              <h2 className="mt-4 text-[clamp(2rem,4.5vw,3.5rem)] font-bold leading-[1.1] tracking-tight text-white" style={{ color: "#fff", fontFamily: "inherit" }}>
                Make the next gymnastics meet feel polished from the first tap
              </h2>
              <p className="mt-5 text-base leading-7 text-white/80 sm:text-lg">
                Build one premium page for schedules, hotels, maps, and updates
                so every parent, athlete, and coach lands in the same place.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/event/gymnastics"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4.5 text-base font-semibold text-indigo-700 shadow-xl shadow-black/10 transition hover:-translate-y-0.5 hover:shadow-2xl"
                >
                  Start Your Meet Page
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#hero"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-8 py-4.5 text-base font-semibold text-white backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/15"
                >
                  Back to Top
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-slate-100 py-10">
        <div className="mx-auto max-w-[1400px] px-4 text-center sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2.5">
            <Image
              src="/favicon.png"
              alt="Envitefy"
              width={28}
              height={28}
              unoptimized
              className="h-7 w-7 rounded-lg"
            />
            <span className="text-sm font-semibold text-slate-400">
              Envitefy Gymnastics
            </span>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            © {new Date().getFullYear()} Envitefy. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
