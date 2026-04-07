"use client";

import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Globe,
  Hotel,
  MapPinned,
  Route,
  Share2,
  Users,
  WandSparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import AnimatedButtonLabel from "@/components/ui/AnimatedButtonLabel";

const navLinks = [
  { label: "Preview", href: "#hero" },
  { label: "Features", href: "#features" },
  { label: "Showcase", href: "#showcase" },
  { label: "Benefits", href: "#benefits" },
];

const featureCards = [
  {
    icon: CalendarDays,
    title: "Game schedule",
    copy: "Publish home and away games, kickoff times, and dates in a format parents can scan in seconds.",
  },
  {
    icon: Hotel,
    title: "Travel and hotels",
    copy: "Keep hotel blocks, call times, parking notes, and road-trip details in the same season page.",
  },
  {
    icon: ClipboardList,
    title: "Roster and practice",
    copy: "Surface practice windows, roster notes, and equipment reminders without burying them in a packet.",
  },
];

const showcasePanels = [
  {
    id: "season-hub",
    title: "Season hub",
    eyebrow: "For coaches and parents",
    copy: "A polished public home for the season with dates, field info, travel notes, and the right links up front.",
    accent: "from-[#fff1e8] via-white to-[#fff8f2]",
    badge: "Season-ready",
    visual: [
      { label: "Team", value: "Varsity Panthers" },
      { label: "Open", value: "Friday 7:00 PM" },
      { label: "Road trip", value: "Hotel block live" },
    ],
  },
  {
    id: "sideline-dashboard",
    title: "Sideline dashboard",
    eyebrow: "For staff and players",
    copy: "A focused view for game-day call times, roster context, equipment, and the documents you actually need.",
    accent: "from-[#e7f0ff] via-white to-[#f5f9ff]",
    badge: "Team view",
    visual: [
      { label: "Opponent", value: "Central Wildcats" },
      { label: "Session", value: "Practice + film" },
      { label: "Docs", value: "Packet, roster, map" },
    ],
  },
  {
    id: "fan-guide",
    title: "Fan guide",
    eyebrow: "For families and guests",
    copy: "A mobile-first guide with entrance details, parking, concessions, and the latest season updates.",
    accent: "from-[#fff5f0] via-white to-[#fffaf8]",
    badge: "Guest friendly",
    visual: [
      { label: "Entry", value: "East gate" },
      { label: "Parking", value: "North lot" },
      { label: "Updates", value: "Live announcements" },
    ],
  },
];

const benefits = [
  {
    icon: Users,
    title: "Built for the whole sideline",
    copy: "Players, coaches, and families all need different details. Envitefy keeps one source of truth while presenting the right information to each audience.",
  },
  {
    icon: MapPinned,
    title: "Field and venue details that stay usable on mobile",
    copy: "Directions, parking guidance, and venue context are surfaced in a clean card stack instead of disappearing in a PDF.",
  },
  {
    icon: Route,
    title: "Season schedules with visual hierarchy",
    copy: "Games, practices, and travel notes are grouped so the next important moment is obvious at a glance.",
  },
  {
    icon: Share2,
    title: "One shareable football link",
    copy: "Send one polished page instead of juggling screenshots, texts, and attachments across team chats.",
  },
];

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/70 bg-white shadow-[0_10px_30px_rgba(141,151,179,0.18)]">
        <span className="absolute inset-2 rounded-xl bg-[linear-gradient(135deg,#efe1ca,#f8efe2_55%,#dfe9ff)]" />
        <span className="relative text-lg leading-none">🏈</span>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7d869d]">Envitefy</p>
        <p className="text-sm font-medium text-[#1f2438]">Football</p>
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#7b84a0]">{eyebrow}</p>
      <h2
        className="mt-4 text-[clamp(2.1rem,5vw,4.5rem)] leading-[0.96] tracking-[-0.05em] text-[#1f2438]"
        style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
      >
        {title}
      </h2>
      <p className="mt-5 max-w-2xl text-base leading-8 text-[#61708a] sm:text-lg">{copy}</p>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  copy,
}: {
  icon: typeof CalendarDays;
  title: string;
  copy: string;
}) {
  return (
    <article className="rounded-[1.8rem] border border-white/80 bg-white/82 p-6 shadow-[0_22px_50px_rgba(118,130,162,0.1)]">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(229,150,60,0.16),rgba(68,105,255,0.12))] text-[#7b470f]">
        <Icon className="h-5 w-5" />
      </div>
      <h3
        className="mt-5 text-xl text-[#1f2438]"
        style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
      >
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-[#63718b]">{copy}</p>
    </article>
  );
}

function EditorialPanel({
  panel,
}: {
  panel: {
    id: string;
    title: string;
    eyebrow: string;
    copy: string;
    accent: string;
    badge: string;
    visual: Array<{ label: string; value: string }>;
  };
}) {
  return (
    <article
      id={panel.id}
      className={`rounded-[2rem] border border-white/80 bg-gradient-to-b ${panel.accent} p-5 shadow-[0_18px_50px_rgba(118,130,162,0.11)]`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8b93ad]">
            {panel.eyebrow}
          </p>
          <h3
            className="mt-2 text-2xl leading-[0.95] tracking-[-0.04em] text-[#1f2438]"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            {panel.title}
          </h3>
        </div>
        <div className="rounded-full bg-[linear-gradient(135deg,#f3d9c4,#f0f5ff)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#6d4d2e]">
          {panel.badge}
        </div>
      </div>
      <p className="mt-4 text-sm leading-7 text-[#65728b]">{panel.copy}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {panel.visual.map((item) => (
          <div
            key={item.label}
            className="rounded-[1.2rem] bg-white/85 px-3 py-3 shadow-[0_10px_25px_rgba(112,124,160,0.06)]"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8b93ad]">
              {item.label}
            </p>
            <p className="mt-2 text-sm font-medium text-[#1f2438]">{item.value}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function HeroPreview() {
  return (
    <div className="relative">
      <div className="absolute -left-4 top-10 h-20 w-20 rounded-full bg-[radial-gradient(circle_at_center,rgba(229,150,60,0.22),transparent_70%)] blur-2xl" />
      <div className="absolute -right-2 bottom-8 h-28 w-28 rounded-full bg-[radial-gradient(circle_at_center,rgba(68,105,255,0.2),transparent_70%)] blur-2xl" />

      <div className="relative overflow-hidden rounded-[2.8rem] border border-white/80 bg-[linear-gradient(160deg,#fff 0%,#f9fafc 55%,#eef5ff 100%)] p-5 shadow-[0_34px_90px_rgba(118,130,162,0.18)] sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.5),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,236,220,0.34),transparent_28%)]" />
        <div className="relative z-10 flex min-h-[620px] flex-col gap-5 rounded-[2.2rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(250,251,255,0.92))] p-5 shadow-[0_20px_60px_rgba(112,124,160,0.1)] sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_1.05fr]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#8b93ad]">
                Event preview
              </p>
              <h2
                className="mt-2 max-w-[12ch] text-3xl leading-[0.95] tracking-[-0.05em] text-[#1f2438] sm:text-[2.5rem]"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                Panthers Football 2025
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#61708a]">
                One public page for games, practices, field locations, travel notes, and the season
                details parents ask for most.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Games", "Travel", "Roster", "Practice"].map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-white/80 bg-white/75 px-3 py-1.5 text-xs font-medium text-[#66738f] shadow-[0_12px_25px_rgba(113,126,161,0.08)]"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.8rem] border border-white/80 bg-white shadow-[0_18px_40px_rgba(112,124,160,0.08)]">
              <div className="relative h-[280px]">
                <Image
                  src="/templates/hero-images/football-hero.jpeg"
                  alt="Football season hero"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,19,39,0.06),rgba(11,19,39,0.36))]" />
                <div className="absolute inset-x-4 bottom-4 rounded-[1.4rem] border border-white/25 bg-white/18 p-4 text-white backdrop-blur-md">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white">
                        Next game
                      </p>
                      <p className="mt-1 text-lg font-semibold">Friday vs Central Wildcats</p>
                    </div>
                    <div className="rounded-full bg-white/18 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em]">
                      7:00 PM
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-white/88 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white/12 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-white/65">Field</p>
                      <p className="mt-1">Panthers Stadium</p>
                    </div>
                    <div className="rounded-2xl bg-white/12 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-white/65">
                        Parking
                      </p>
                      <p className="mt-1">North lot</p>
                    </div>
                    <div className="rounded-2xl bg-white/12 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-white/65">
                        Travel
                      </p>
                      <p className="mt-1">Bus leaves 4:30</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.6rem] border border-white/80 bg-[linear-gradient(180deg,#fff7ef,#fff)] p-4 shadow-[0_16px_34px_rgba(112,124,160,0.08)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(229,150,60,0.16),rgba(255,255,255,0.08))] text-[#b05f1a]">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8b93ad]">
                    Season schedule
                  </p>
                  <p className="mt-1 text-base text-[#1f2438]">12 games, 1 bye week</p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-white/80 bg-[linear-gradient(180deg,#eef4ff,#fff)] p-4 shadow-[0_16px_34px_rgba(112,124,160,0.08)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(68,105,255,0.16),rgba(255,255,255,0.08))] text-[#3958c9]">
                  <Hotel className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8b93ad]">
                    Travel
                  </p>
                  <p className="mt-1 text-base text-[#1f2438]">Hotel block closes Thursday</p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-white/80 bg-[linear-gradient(180deg,#fff5f2,#fff)] p-4 shadow-[0_16px_34px_rgba(112,124,160,0.08)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(229,150,60,0.14),rgba(68,105,255,0.14))] text-[#5d68d0]">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8b93ad]">
                    Fan guide
                  </p>
                  <p className="mt-1 text-base text-[#1f2438]">Entry, concessions, and field map</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-2">
            <div className="flex items-center justify-between rounded-full border border-[#e6eaf5] bg-white/85 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-[#627089]">
                <Globe className="h-4 w-4 text-[#6670c9]" />
                Shareable public football page
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#7b4b16,#d36a22)] px-4 py-2 text-sm font-semibold text-white">
                View details
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FootballLanding() {
  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f4f7fb_0%,#eef3f9_42%,#f8fafc_100%)] text-[#1f2438] selection:bg-[#ffe4d0] selection:text-[#13213f]">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-4 sm:px-6 lg:px-8 lg:pb-28 lg:pt-6">
        <header className="sticky top-3 z-50">
          <nav className="flex items-center justify-between rounded-full border border-white/70 bg-white/72 px-4 py-3 shadow-[0_16px_50px_rgba(113,126,161,0.09)] backdrop-blur-xl sm:px-5">
            <BrandMark />

            <div className="hidden items-center gap-2 lg:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-4 py-2 text-sm font-medium text-[#627089] transition hover:bg-white/80 hover:text-[#1f2438]"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/event/football"
                className="cta-shell hidden h-10 rounded-full border border-[#dbe1f0] bg-white px-4 text-sm font-medium text-[#1f2438] transition hover:-translate-y-0.5 hover:shadow-md sm:inline-flex"
              >
                <AnimatedButtonLabel label="View builder" />
              </Link>
              <Link
                href="/event/football"
                className="cta-shell h-10 rounded-full bg-[linear-gradient(135deg,#c05d1f,#edb64a_56%,#4c6ddf)] px-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(103,117,222,0.22)] transition hover:-translate-y-0.5"
              >
                <AnimatedButtonLabel label="Start a season" icon={ArrowRight} />
              </Link>
            </div>
          </nav>
        </header>

        <section id="hero" className="scroll-mt-28 pb-16 pt-10 sm:pb-20 lg:pb-24 lg:pt-14">
          <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#73809e] shadow-[0_14px_30px_rgba(113,126,161,0.08)]">
                <WandSparkles className="h-3.5 w-3.5 text-[#c76b1e]" />
                Premium football season pages for teams and families
              </div>

              <h1
                className="mt-7 max-w-[11ch] text-[clamp(3.4rem,8vw,6.8rem)] leading-[0.9] tracking-[-0.06em] text-[#1f2438]"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                Elegant football pages, built for mobile.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-[#61708a] sm:text-xl">
                Envitefy turns game schedules, travel details, roster notes, equipment reminders,
                and fan guidance into one polished public experience for the whole sideline.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/event/football"
                  className="cta-shell h-14 rounded-full bg-[linear-gradient(135deg,#c05d1f,#edb64a)] px-6 text-sm font-semibold text-white shadow-[0_20px_50px_rgba(197,107,30,0.24)] transition hover:-translate-y-0.5"
                >
                  <AnimatedButtonLabel label="Start your football page" icon={ArrowRight} />
                </Link>
                <a
                  href="#showcase"
                  className="cta-shell h-14 rounded-full border border-[#dbe1f0] bg-white/80 px-6 text-sm font-semibold text-[#1f2438] shadow-[0_14px_30px_rgba(113,126,161,0.08)] transition hover:-translate-y-0.5"
                >
                  <AnimatedButtonLabel label="See the layouts" />
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {["Schedules", "Field maps", "Hotel blocks", "Practice notes"].map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-white/80 bg-white/75 px-3 py-1.5 text-xs font-medium text-[#66738f] shadow-[0_12px_25px_rgba(113,126,161,0.08)]"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            <HeroPreview />
          </div>
        </section>

        <section id="features" className="scroll-mt-28 pb-16 sm:pb-20 lg:pb-24">
          <SectionHeading
            eyebrow="Three essentials"
            title="The fastest way to publish the football details families actually need."
            copy="Every card is intentionally compact, clear, and touch-friendly so the page feels premium on phones first, then expansive on larger screens."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {featureCards.map((card) => (
              <FeatureCard key={card.title} {...card} />
            ))}
          </div>
        </section>

        <section id="showcase" className="scroll-mt-28 pb-16 sm:pb-20 lg:pb-24">
          <SectionHeading
            eyebrow="Editorial panels"
            title="Tall, gallery-like panels that make the page feel premium instead of generic."
            copy="Each panel behaves like a magazine spread for a specific audience, with the right football details pushed to the foreground."
          />

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {showcasePanels.map((panel) => (
              <EditorialPanel key={panel.id} panel={panel} />
            ))}
          </div>
        </section>

        <section id="benefits" className="scroll-mt-28 pb-16 sm:pb-20 lg:pb-24">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <SectionHeading
              eyebrow="Why Envitefy"
              title="Designed for the realities of football season."
              copy="From early call times to last-minute field updates, the page gives coaches a polished presentation layer and gives families a reliable place to look."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {benefits.map((item) => (
                <article
                  key={item.title}
                  className="rounded-[1.8rem] border border-white/80 bg-white/82 p-6 shadow-[0_22px_50px_rgba(118,130,162,0.1)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(229,150,60,0.14),rgba(68,105,255,0.14))] text-[#7d3f12]">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3
                    className="mt-5 text-xl text-[#1f2438]"
                    style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                  >
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#63718b]">{item.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="cta" className="scroll-mt-28 pb-8 sm:pb-0">
          <div className="relative overflow-hidden rounded-[2.8rem] border border-white/80 bg-[linear-gradient(135deg,#c05d1f_0%,#edb64a_55%,#4c6ddf_100%)] p-8 text-white shadow-[0_30px_90px_rgba(197,107,30,0.26)] sm:p-10 lg:p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.16),transparent_28%)]" />
            <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/80">
                  Final CTA
                </p>
                <h2
                  className="mt-4 text-[clamp(2.2rem,5vw,4.4rem)] leading-[0.95] tracking-[-0.05em]"
                  style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                >
                  Make the next football season feel polished from the first tap.
                </h2>
                <p className="mt-5 max-w-xl text-base leading-8 text-white/88 sm:text-lg">
                  Build one premium page for schedules, hotels, maps, and live updates so every
                  parent, player, and coach lands in the same place.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link
                  href="/event/football"
                  className="cta-shell h-14 rounded-full bg-white px-6 text-sm font-semibold text-[#3e4fd0] shadow-[0_18px_40px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5"
                >
                  <AnimatedButtonLabel label="Start your football page" icon={ArrowRight} />
                </Link>
                <a
                  href="#hero"
                  className="cta-shell h-14 rounded-full border border-white/28 bg-white/12 px-6 text-sm font-semibold text-white backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/18"
                >
                  <AnimatedButtonLabel label="Back to top" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
