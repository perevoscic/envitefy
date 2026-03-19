import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  Globe,
  Hotel,
  MapPinned,
  Route,
  Sparkles,
  Trophy,
  Users,
  ClipboardList,
  Share2,
  Map,
} from "lucide-react";

const navLinks = [
  { label: "Preview", href: "#hero" },
  { label: "Features", href: "#features" },
  { label: "Showcase", href: "#showcase" },
  { label: "Benefits", href: "#benefits" },
];

const featureCards = [
  {
    icon: CalendarDays,
    title: "Meet Schedule",
    copy: "Sessions, warm-ups, awards, and rotation timing in a clean layout families can read quickly.",
  },
  {
    icon: Hotel,
    title: "Travel & Hotels",
    copy: "Keep block links, booking windows, parking notes, and venue maps together on one page.",
  },
  {
    icon: ClipboardList,
    title: "Spectator Guide",
    copy: "Surface seating notes, entrance details, and practical venue information in a clean mobile view.",
  },
];

const showcasePanels = [
  {
    id: "meet-info",
    title: "Meet Info",
    eyebrow: "For event hosts",
    copy:
      "A polished public home for the meet with dates, venue, entry details, and essential links.",
    accent: "from-[#efe4ff] via-white to-[#f8f5ff]",
    badge: "Host-ready",
    visual: [
      { label: "Venue", value: "Aurora Convention Hall" },
      { label: "Doors", value: "Open 7:15 AM" },
      { label: "Parking", value: "North lot + overflow" },
    ],
  },
  {
    id: "athlete-dashboard",
    title: "Athlete Dashboard",
    eyebrow: "For coaches and teams",
    copy:
      "A focused view for session assignments, roster context, and quick links to the right documents.",
    accent: "from-[#e4f3ff] via-white to-[#f3fbff]",
    badge: "Team view",
    visual: [
      { label: "Session", value: "Level 7 / Xcel Platinum" },
      { label: "Roster", value: "18 athletes traveling" },
      { label: "Docs", value: "Packet, roster, map" },
    ],
  },
  {
    id: "spectator-guide",
    title: "Spectator Guide",
    eyebrow: "For families and guests",
    copy:
      "A mobile-first guide with seating notes, concessions, venue directions, and the latest announcements.",
    accent: "from-[#ffe9f0] via-white to-[#fff7fb]",
    badge: "Guest friendly",
    visual: [
      { label: "Entry", value: "West lobby" },
      { label: "Seating", value: "Upper balcony" },
      { label: "Updates", value: "Refresh for alerts" },
    ],
  },
];

const benefits = [
  {
    icon: Users,
    title: "Built for whole meet weekends",
    copy:
      "Families, coaches, athletes, and spectators all need different details. Envitefy keeps one source of truth while presenting the right information for each audience.",
  },
  {
    icon: MapPinned,
    title: "Venue details that stay usable on mobile",
    copy:
      "Travel notes, parking guidance, and map context are surfaced in a clean card stack instead of disappearing in dense packet pages.",
  },
  {
    icon: Route,
    title: "Schedules with visual hierarchy",
    copy:
      "Warm-ups, events, and awards are grouped so the next important moment is obvious at a glance on small screens.",
  },
  {
    icon: Share2,
    title: "Easy sharing for coaches and parents",
    copy:
      "Send one polished link instead of juggling screenshots, texts, and PDF attachments across multiple team chats.",
  },
];

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/70 bg-white shadow-[0_10px_30px_rgba(141,151,179,0.18)]">
        <span className="absolute inset-2 rounded-xl bg-[linear-gradient(135deg,#dcd3ff,#f6d9ea_55%,#d9eefc)]" />
        <span className="relative h-4 w-4 rounded-full border border-white/90 bg-white/80" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7d869d]">
          Envitefy
        </p>
        <p className="text-sm font-medium text-[#1f2438]">Gymnastics</p>
      </div>
    </div>
  );
}

function GymnastLineArt() {
  return (
    <svg
      viewBox="0 0 320 420"
      className="h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c8cf7" />
          <stop offset="52%" stopColor="#c48df7" />
          <stop offset="100%" stopColor="#f5a7c8" />
        </linearGradient>
      </defs>
      <circle cx="186" cy="86" r="22" fill="rgba(255,255,255,0.72)" stroke="url(#lineGrad)" strokeWidth="3" />
      <path
        d="M186 110c-12 18-22 38-26 58-4 21 2 44 10 68"
        fill="none"
        stroke="url(#lineGrad)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M188 138c22 8 42 24 62 46"
        fill="none"
        stroke="url(#lineGrad)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M164 168c-28 16-48 36-60 60"
        fill="none"
        stroke="url(#lineGrad)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M154 228c20 18 44 28 73 31"
        fill="none"
        stroke="url(#lineGrad)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M198 220c17 26 36 55 59 83"
        fill="none"
        stroke="url(#lineGrad)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M132 258c-18 17-32 35-40 58"
        fill="none"
        stroke="url(#lineGrad)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M152 210c-22 38-47 68-76 91"
        fill="none"
        stroke="url(#lineGrad)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M219 264c32 4 60 17 84 41"
        fill="none"
        stroke="url(#lineGrad)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <ellipse cx="214" cy="329" rx="74" ry="20" fill="rgba(196,141,247,0.12)" />
      <path
        d="M76 355c42-18 90-21 144-11 42 8 71 7 103-4"
        fill="none"
        stroke="rgba(122,134,180,0.28)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RibbonOrbs() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute -left-10 top-4 h-44 w-44 rounded-full bg-[radial-gradient(circle_at_center,rgba(193,180,255,0.55),rgba(193,180,255,0))] blur-3xl" />
      <div className="absolute right-0 top-8 h-52 w-52 rounded-full bg-[radial-gradient(circle_at_center,rgba(247,188,216,0.45),rgba(247,188,216,0))] blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,rgba(150,213,255,0.35),rgba(150,213,255,0))] blur-3xl" />
      <div className="absolute inset-x-0 top-10 h-px bg-[linear-gradient(90deg,transparent,rgba(124,140,247,0.35),transparent)]" />
      <div className="absolute bottom-10 left-6 right-6 h-px bg-[linear-gradient(90deg,transparent,rgba(245,167,200,0.45),transparent)]" />
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
      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#7b84a0]">
        {eyebrow}
      </p>
      <h2
        className="mt-4 text-[clamp(2.1rem,5vw,4.5rem)] leading-[0.96] tracking-[-0.05em] text-[#1f2438]"
        style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
      >
        {title}
      </h2>
      <p className="mt-5 max-w-2xl text-base leading-8 text-[#61708a] sm:text-lg">
        {copy}
      </p>
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
    <article className="group rounded-[1.75rem] border border-white/70 bg-white/85 p-6 shadow-[0_24px_50px_rgba(120,130,160,0.09)] backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(124,140,247,0.16),rgba(245,167,200,0.16))] text-[#4f5bd8]">
          <Icon className="h-5 w-5" />
        </div>
        <ChevronRight className="h-5 w-5 text-[#b8bfd6] transition group-hover:translate-x-0.5 group-hover:text-[#6d75d6]" />
      </div>
      <h3
        className="mt-6 text-xl text-[#1f2438]"
        style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
      >
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-[#64738f]">{copy}</p>
    </article>
  );
}

function EditorialPanel({
  panel,
}: {
  panel: (typeof showcasePanels)[number];
}) {
  return (
    <article
      id={panel.id}
      className={`relative overflow-hidden rounded-[2.4rem] border border-white/80 bg-gradient-to-br ${panel.accent} p-6 shadow-[0_26px_70px_rgba(111,124,168,0.12)] sm:p-7`}
    >
      <RibbonOrbs />
      <div className="relative z-10 flex h-full min-h-[430px] flex-col">
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center rounded-full border border-white/80 bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-[#7880a0]">
            {panel.eyebrow}
          </span>
          <span className="rounded-full bg-white/75 px-3 py-1 text-xs font-medium text-[#66718c]">
            {panel.badge}
          </span>
        </div>

        <h3
          className="mt-8 max-w-[10ch] text-[2rem] leading-[0.96] tracking-[-0.05em] text-[#1f2438] sm:text-[2.35rem]"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          {panel.title}
        </h3>
        <p className="mt-4 max-w-md text-sm leading-7 text-[#627088]">
          {panel.copy}
        </p>

        <div className="mt-auto grid gap-3 pt-8">
          {panel.visual.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-[1.2rem] border border-white/70 bg-white/82 px-4 py-3 shadow-[0_14px_24px_rgba(119,132,169,0.08)]"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8b93ad]">
                {item.label}
              </span>
              <span className="text-sm font-medium text-[#1f2438]">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

function MockupShell() {
  const steps = [
    "Schedule loaded",
    "Venue details added",
    "Travel shared",
    "Spectator info ready",
  ];

  return (
    <div className="relative overflow-hidden rounded-[2.4rem] border border-white/70 bg-[linear-gradient(180deg,rgba(250,251,255,0.95),rgba(239,242,250,0.92))] p-4 shadow-[0_30px_90px_rgba(118,130,162,0.16)] sm:p-6">
      <RibbonOrbs />
      <div className="relative z-10 grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-[2rem] border border-white/80 bg-white/90 p-4 shadow-[0_18px_40px_rgba(120,130,160,0.12)] sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#8a91ab]">
                Preview screen
              </p>
              <h3
                className="mt-2 text-2xl tracking-[-0.04em] text-[#1f2438]"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                Winter Cup Invitational
              </h3>
            </div>
            <div className="rounded-full bg-[linear-gradient(135deg,#e7ebff,#fff0f5)] px-3 py-1 text-xs font-semibold text-[#59619e]">
              Updated 2m ago
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
            <div className="relative overflow-hidden rounded-[1.8rem] border border-[#e6eaf5] bg-[linear-gradient(180deg,#f8f6ff,#fff)] p-4">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(122,140,247,0.16),transparent_35%),radial-gradient(circle_at_70%_30%,rgba(245,167,200,0.18),transparent_40%)]" />
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#7880a0]">
                    Session A
                  </span>
                  <span className="text-sm font-semibold text-[#53607d]">
                    8:00 AM
                  </span>
                </div>
                <div className="mt-5 aspect-[0.72] rounded-[1.5rem] border border-white/70 bg-white/80 p-4 shadow-[0_18px_50px_rgba(110,123,159,0.1)]">
                  <div className="h-full rounded-[1.15rem] bg-[linear-gradient(160deg,rgba(201,220,255,0.65),rgba(255,255,255,0.92)_40%,rgba(248,221,236,0.78))] p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#7b84a0]">
                        Morning block
                      </span>
                      <Trophy className="h-4 w-4 text-[#c58aef]" />
                    </div>
                    <div className="mt-5 h-[70%] rounded-[1.2rem] border border-white/80 bg-white/76 p-3">
                      <div className="flex h-full flex-col justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[#1f2438]">
                            Level 6 - 10
                          </p>
                          <p className="mt-2 text-xs leading-6 text-[#66738f]">
                            Warm-up, competition order, awards window, and
                            reminder notes all sit together.
                          </p>
                        </div>
                        <div className="flex items-end justify-between">
                          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9aa2bb]">
                            Meet flow
                          </span>
                          <div className="h-12 w-12 rounded-full border border-[#dce2f2] bg-[linear-gradient(135deg,#ecefff,#fff)]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[1.6rem] border border-[#e6eaf5] bg-white/85 p-4 shadow-[0_16px_34px_rgba(112,124,160,0.09)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(124,140,247,0.14),rgba(245,167,200,0.14))] text-[#5963d6]">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8b93ad]">
                      Checklist
                    </p>
                    <p className="mt-1 text-lg text-[#1f2438]">What to pack</p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {steps.map((step) => (
                    <div
                      key={step}
                      className="flex items-center gap-3 rounded-[1rem] bg-[#f7f8fd] px-3 py-2 text-sm text-[#55627e]"
                    >
                      <span className="h-2.5 w-2.5 rounded-full bg-[linear-gradient(135deg,#7c8cf7,#f5a7c8)]" />
                      {step}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-[#e6eaf5] bg-[linear-gradient(180deg,#fff7fb,#fff)] p-4 shadow-[0_16px_34px_rgba(112,124,160,0.09)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(245,167,200,0.18),rgba(124,140,247,0.18))] text-[#b75fa3]">
                    <Map className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8b93ad]">
                      Venue
                    </p>
                    <p className="mt-1 text-lg text-[#1f2438]">Hall B + north lot</p>
                  </div>
                </div>

                <div className="mt-4 rounded-[1.2rem] border border-white/70 bg-white/80 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#66738f]">Parking map</span>
                    <span className="font-medium text-[#1f2438]">Open</span>
                  </div>
                  <div className="mt-3 h-24 rounded-[1rem] bg-[linear-gradient(135deg,#e7ecff,#fff0f6)] p-3">
                    <div className="grid h-full grid-cols-[1fr_1.2fr] gap-2">
                      <div className="rounded-[0.8rem] bg-white/75" />
                      <div className="rounded-[0.8rem] bg-white/55" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              "Schedule",
              "Venue",
              "Hotels",
              "Maps",
              "Spectator info",
            ].map((item) => (
              <span
                key={item}
                className="rounded-full border border-[#dfe4f2] bg-white/85 px-3 py-1 text-xs font-medium text-[#5b6784]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-[0_18px_40px_rgba(112,124,160,0.1)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#8a91ab]">
              Mobile poster
            </p>
            <div className="mt-4 rounded-[1.6rem] border border-[#edf0f8] bg-[linear-gradient(180deg,#ffffff,#f8f8ff)] p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#1f2438]">
                  Spectator guide
                </span>
                <span className="rounded-full bg-[linear-gradient(135deg,#e6f1ff,#ffe8f2)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6b74af]">
                  Static
                </span>
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-[1rem] bg-[#f4f6fc] px-3 py-2 text-sm text-[#55627e]">
                  West lobby entry for spectators and teams
                </div>
                <div className="rounded-[1rem] bg-[#f4f6fc] px-3 py-2 text-sm text-[#55627e]">
                  Upper balcony seating and concessions nearby
                </div>
                <div className="rounded-[1rem] bg-[#f4f6fc] px-3 py-2 text-sm text-[#55627e]">
                  Parking and floor-map details in one place
                </div>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-[linear-gradient(180deg,#fff,#f4f6ff)] p-5 shadow-[0_18px_40px_rgba(112,124,160,0.1)]">
            <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(124,140,247,0.18),transparent_65%)]" />
            <div className="relative z-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#8a91ab]">
                Editorial motion
              </p>
              <div className="mt-4 h-52 rounded-[1.6rem] border border-[#eef1fb] bg-[linear-gradient(135deg,#fbf7ff,#fff7fb)] p-4">
                <GymnastLineArt />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GymnasticsLanding() {
  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f3f5fb_0%,#edf1f8_42%,#f6f8fc_100%)] text-[#1f2438] selection:bg-[#d9e7ff] selection:text-[#13213f]">
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
                href="/event/gymnastics"
                className="hidden rounded-full border border-[#dbe1f0] bg-white px-4 py-2 text-sm font-medium text-[#1f2438] transition hover:-translate-y-0.5 hover:shadow-md sm:inline-flex"
              >
                View builder
              </Link>
              <Link
                href="/event/gymnastics"
                className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#6378f2,#c678f1_56%,#f39bbd)] px-4 py-2 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(103,117,222,0.22)] transition hover:-translate-y-0.5"
              >
                Start a meet
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </nav>
        </header>

        <section
          id="hero"
          className="scroll-mt-28 pb-16 pt-10 sm:pb-20 lg:pb-24 lg:pt-14"
        >
          <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#73809e] shadow-[0_14px_30px_rgba(113,126,161,0.08)]">
                <Sparkles className="h-3.5 w-3.5 text-[#7d87d7]" />
                Premium meet pages for gymnastics weekends
              </div>

              <h1
                className="mt-7 max-w-[10.5ch] text-[clamp(3.4rem,8vw,6.8rem)] leading-[0.9] tracking-[-0.06em] text-[#1f2438]"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                Elegant gymnastics meet pages, built for mobile.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-[#61708a] sm:text-xl">
                Envitefy turns meet schedules, venue details, hotel blocks, maps,
                and a polished spectator guide into one premium experience for families,
                coaches, athletes, and spectators.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/event/gymnastics"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#6378f2,#f19cc0)] px-6 py-4 text-sm font-semibold text-white shadow-[0_20px_50px_rgba(105,120,220,0.24)] transition hover:-translate-y-0.5"
                >
                  Start your meet page
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#showcase"
                  className="inline-flex items-center justify-center rounded-full border border-[#dbe1f0] bg-white/80 px-6 py-4 text-sm font-semibold text-[#1f2438] shadow-[0_14px_30px_rgba(113,126,161,0.08)] transition hover:-translate-y-0.5"
                >
                  See the layouts
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {["Schedules", "Venue maps", "Hotel blocks", "Spectator info"].map(
                  (chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-white/80 bg-white/75 px-3 py-1.5 text-xs font-medium text-[#66738f] shadow-[0_12px_25px_rgba(113,126,161,0.08)]"
                    >
                      {chip}
                    </span>
                  ),
                )}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-4 top-10 h-20 w-20 rounded-full bg-[radial-gradient(circle_at_center,rgba(124,140,247,0.25),transparent_70%)] blur-2xl" />
              <div className="absolute -right-2 bottom-8 h-28 w-28 rounded-full bg-[radial-gradient(circle_at_center,rgba(245,167,200,0.25),transparent_70%)] blur-2xl" />

              <div className="relative overflow-hidden rounded-[2.8rem] border border-white/80 bg-[linear-gradient(160deg,#fff 0%,#f8f7ff 55%,#eef6ff 100%)] p-5 shadow-[0_34px_90px_rgba(118,130,162,0.18)] sm:p-6">
                <RibbonOrbs />
                <div className="relative z-10 flex min-h-[620px] flex-col rounded-[2.2rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(249,250,255,0.9))] p-5 shadow-[0_20px_60px_rgba(112,124,160,0.1)] sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#8b93ad]">
                        Event preview
                      </p>
                      <h2
                        className="mt-2 max-w-[12ch] text-3xl leading-[0.95] tracking-[-0.05em] text-[#1f2438] sm:text-[2.5rem]"
                        style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                      >
                        Summit Invitational
                      </h2>
                    </div>
                    <div className="rounded-full bg-[linear-gradient(135deg,#eef1ff,#fff1f7)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#6670a8]">
                      April 18-20
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4">
                    <div className="rounded-[1.8rem] border border-white/80 bg-white/82 p-4 shadow-[0_18px_40px_rgba(112,124,160,0.08)]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(124,140,247,0.12),rgba(245,167,200,0.12))] text-[#6070d6]">
                            <CalendarDays className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8b93ad]">
                              Meet schedule
                            </p>
                            <p className="mt-1 text-lg text-[#1f2438]">
                              Session 2 - Level 8 and Xcel Gold
                            </p>
                          </div>
                        </div>
                        <Clock3 className="h-5 w-5 text-[#9da5bd]" />
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        {[
                          ["Check-in", "7:10 AM"],
                          ["Warm-up", "7:35 AM"],
                          ["Awards", "11:40 AM"],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="rounded-[1.2rem] bg-[#f7f8fc] px-3 py-3"
                          >
                            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8b93ad]">
                              {label}
                            </p>
                            <p className="mt-2 text-sm font-medium text-[#1f2438]">
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-[1.6rem] border border-white/80 bg-[linear-gradient(180deg,#fff7fb,#fff)] p-4 shadow-[0_16px_34px_rgba(112,124,160,0.08)]">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(245,167,200,0.16),rgba(124,140,247,0.16))] text-[#b05e98]">
                            <MapPinned className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8b93ad]">
                              Venue
                            </p>
                            <p className="mt-1 text-base text-[#1f2438]">
                              Aurora Convention Hall
                            </p>
                          </div>
                        </div>
                        <p className="mt-4 text-sm leading-7 text-[#65728b]">
                          Entrance map, spectator seating, and lot guidance in
                          one place.
                        </p>
                      </div>

                      <div className="rounded-[1.6rem] border border-white/80 bg-[linear-gradient(180deg,#eef7ff,#fff)] p-4 shadow-[0_16px_34px_rgba(112,124,160,0.08)]">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(104,157,255,0.16),rgba(124,140,247,0.16))] text-[#496ed8]">
                            <Hotel className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8b93ad]">
                              Travel
                            </p>
                            <p className="mt-1 text-base text-[#1f2438]">
                              Hotel block closes March 26
                            </p>
                          </div>
                        </div>
                        <p className="mt-4 text-sm leading-7 text-[#65728b]">
                          Share booking links, shuttles, and local tips without
                          burying them in the packet.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[1.6rem] border border-white/80 bg-[linear-gradient(135deg,#f7f7ff,#fff6fb)] p-4 shadow-[0_16px_34px_rgba(112,124,160,0.08)]">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(124,140,247,0.14),rgba(245,167,200,0.14))] text-[#5c68ce]">
                          <ClipboardList className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8b93ad]">
                            Spectator guide
                          </p>
                          <p className="mt-1 text-base text-[#1f2438]">
                            Seating, entrances, and what guests need to know
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-5">
                    <div className="flex items-center justify-between rounded-full border border-[#e6eaf5] bg-white/85 px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-[#627089]">
                        <Globe className="h-4 w-4 text-[#6670c9]" />
                        Shareable public meet page
                      </div>
                      <button className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#6378f2,#f19cc0)] px-4 py-2 text-sm font-semibold text-white">
                        View details
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-28 pb-16 sm:pb-20 lg:pb-24">
          <SectionHeading
            eyebrow="Three essentials"
            title="The fastest way to publish the details gymnastics families actually need."
            copy="Every card is intentionally small, clear, and touch-friendly so the page feels elegant on mobile first, then expansive on larger screens."
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
            title="Tall, gallery-like panels that make the page feel premium instead of corporate."
            copy="Each panel behaves like a magazine spread for a specific audience, with the right details pushed to the foreground."
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
              title="Designed for the realities of gymnastics weekends."
              copy="From early arrivals to last-minute schedule changes, the page gives meet hosts a polished presentation layer and gives families a reliable place to look."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {benefits.map((item) => (
                <article
                  key={item.title}
                  className="rounded-[1.8rem] border border-white/80 bg-white/82 p-6 shadow-[0_22px_50px_rgba(118,130,162,0.1)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(124,140,247,0.14),rgba(245,167,200,0.14))] text-[#5963d6]">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3
                    className="mt-5 text-xl text-[#1f2438]"
                    style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                  >
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#63718b]">
                    {item.copy}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="mockup" className="scroll-mt-28 pb-16 sm:pb-20 lg:pb-24">
          <SectionHeading
            eyebrow="Screenshot mockup"
            title="A mobile-poster aesthetic that still feels like a real product."
            copy="Layered panels, soft gradients, and airy spacing give the page a premium editorial finish while keeping the interface practical."
          />

          <div className="mt-10">
            <MockupShell />
          </div>
        </section>

        <section id="cta" className="scroll-mt-28 pb-8 sm:pb-0">
          <div className="relative overflow-hidden rounded-[2.8rem] border border-white/80 bg-[linear-gradient(135deg,#6378f2_0%,#c678f1_55%,#f39bbd_100%)] p-8 text-white shadow-[0_30px_90px_rgba(103,117,222,0.26)] sm:p-10 lg:p-12">
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
                  Make the next gymnastics meet feel polished from the first tap.
                </h2>
                <p className="mt-5 max-w-xl text-base leading-8 text-white/88 sm:text-lg">
                  Build one premium page for schedules, hotels, maps, and live
                  updates so every parent, athlete, and coach lands in the same
                  place.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link
                  href="/event/gymnastics"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-semibold text-[#3e4fd0] shadow-[0_18px_40px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5"
                >
                  Start your gymnastics page
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#hero"
                  className="inline-flex items-center justify-center rounded-full border border-white/28 bg-white/12 px-6 py-4 text-sm font-semibold text-white backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/18"
                >
                  Back to top
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
