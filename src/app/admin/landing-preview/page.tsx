import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Bell,
  CalendarCheck2,
  CheckCircle2,
  ChevronRight,
  Compass,
  FileText,
  Gift,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import EnvitefyWordmark from "@/components/branding/EnvitefyWordmark";
import LandingLiveCardShowcase from "@/components/landing/LandingLiveCardShowcase";
import { AdminRouteError, requireAdminSession } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Landing Preview | Envitefy Admin",
  description: "Admin-only mockup for the next Envitefy luxury landing page.",
  robots: { index: false, follow: false },
};

const navLinks = [
  { label: "The Hub", href: "#hub" },
  { label: "Snap & Convert", href: "#snap" },
  { label: "Showcases", href: "#showcase" },
  { label: "Bespoke Guides", href: "#guides" },
  { label: "Process", href: "#process" },
  { label: "FAQ", href: "#faq" },
  { label: "Inquiries", href: "#inquiries" },
] as const;

const mobileQuickLinks = [
  { label: "Home", href: "#hub" },
  { label: "Snap AI", href: "#snap" },
  { label: "Examples", href: "#showcase" },
  { label: "Guides", href: "#guides" },
  { label: "Process", href: "#process" },
  { label: "FAQ", href: "#faq" },
] as const;

const sampleBlueprints = [
  {
    label: "Baby shower",
    prompt:
      "Host a baby shower for Clara on Saturday Dec 12th at The Ivy Gardens with high tea, cupcakes, Babylist registry, sage green styling, and RSVP by Dec 1st.",
  },
  {
    label: "Class reunion",
    prompt:
      "Class of 2016 reunion, Friday Nov 20, 2026 at Cedar Creek Golf Club House, ticketed entry, semi-casual dress code, and map details for every guest.",
  },
  {
    label: "Birthday party",
    prompt:
      "Sophie is turning five with a magical party at Kid's Play and Jump Palace, RSVP details, socks reminder, directions, and gift notes in one guest portal.",
  },
] as const;

const extractionLog = [
  "Read the invite, flyer, PDF, schedule, or rough idea and identify the event promise.",
  "Extract dates, venue, RSVP deadline, registry notes, guest rules, and host tone.",
  "Draft a mobile guest page with RSVP, map, calendar, gift, update, and contact actions.",
  "Apply polished spacing, visual hierarchy, and share-ready invitation styling.",
] as const;

const buildStages = [
  "Event details parsed",
  "RSVP rules drafted",
  "Map and calendar actions wired",
  "Registry and update notes styled",
] as const;

const outputTiles = [
  {
    title: "Track RSVPs",
    description:
      "Keep guest counts, attendance notes, and host visibility attached to the invitation.",
    icon: CheckCircle2,
  },
  {
    title: "Open maps fast",
    description: "Make venue, parking, calendar, and timing details usable in one tap.",
    icon: Compass,
  },
  {
    title: "Share gift links",
    description: "Present registries, contribution notes, and gift guidance with intention.",
    icon: Gift,
  },
  {
    title: "Update once",
    description:
      "Revise time, address, attire, weather, and reminders behind the same shared link.",
    icon: Bell,
  },
] as const;

const hostLedgerRows = [
  { name: "Aunt Sarah", detail: "Attending, 2 guests", status: "Synced" },
  { name: "Cousin Leo", detail: "Attending, 1 guest", status: "Synced" },
  { name: "Dr. Dave", detail: "Declined with note", status: "Logged" },
] as const;

const hostControls = [
  "Guest counts and notes stay visible to the host.",
  "Shared links stay stable when details change.",
  "Private event details are not dependent on group chats.",
] as const;

const conversionPaths = [
  {
    title: "Create from what you have",
    badge: "Host path",
    image: "/images/marketing/use-case-school.webp",
    description:
      "Turn a flyer, schedule, PDF, packet, screenshot, or unfinished idea into a polished event page.",
  },
  {
    title: "Save an invite you received",
    badge: "Guest path",
    image: "/studio/custom-invite.webp",
    description:
      "Snap a birthday, wedding, shower, gender reveal, or party invite and keep the useful details organized.",
  },
] as const;

const startingPoints = [
  "Hosting? Upload a flyer, schedule, packet, PDF, or idea.",
  "Invited? Save birthday, wedding, shower, or party details.",
] as const;

const showcaseExamples = [
  {
    title: "Birthday celebrations",
    image: "/images/marketing/use-case-birthday.webp",
    note: "Cake timing, gift notes, RSVP counts, directions, and parent-friendly updates.",
  },
  {
    title: "Wedding weekends",
    image: "/images/marketing/use-case-wedding.webp",
    note: "Ceremony schedule, registry links, hotel guidance, guest RSVP, and attire notes.",
  },
  {
    title: "Baby showers",
    image: "/images/marketing/use-case-baby.webp",
    note: "Registry, brunch details, games, family notes, and polished guest sharing.",
  },
  {
    title: "School and team events",
    image: "/images/marketing/use-case-gymnastics.webp",
    note: "Schedules, volunteer slots, parent logistics, venues, and live reminders.",
  },
] as const;

const guides = [
  {
    title: "Turn a PDF into a guest page",
    description:
      "Replace static attachments with a mobile page where dates, maps, RSVPs, and schedules are ready to use.",
    icon: FileText,
  },
  {
    title: "Make a flyer feel clickable",
    description:
      "Keep the invitation beautiful while making every important guest action easy to complete.",
    icon: UploadCloud,
  },
  {
    title: "Design RSVPs guests finish",
    description:
      "Use short forms, clear deadlines, guest counts, notes, and updates to reduce follow-up.",
    icon: MessageCircle,
  },
] as const;

const workflow = [
  {
    title: "Add your details",
    description:
      "Paste the plan, upload a PDF, snap a flyer, or describe the event idea in natural language.",
  },
  {
    title: "Review the draft",
    description:
      "Confirm the title, date, venue, colors, schedule, registry, RSVP rules, and guest-facing copy.",
  },
  {
    title: "Share one live link",
    description:
      "Send one elegant page with RSVP, maps, calendar saves, registry links, updates, and host details.",
  },
] as const;

const faqItems = [
  {
    q: "Do guests need an Envitefy account?",
    a: "No. The luxury is in the absence of friction: guests tap the shared link, read the invitation, RSVP, open directions, save the date, and view registries from their browser.",
  },
  {
    q: "What can Concierge start from?",
    a: "Concierge can start from raw text, a half-written idea, a flyer, invite card, screenshot, PDF packet, schedule, or design direction.",
  },
  {
    q: "Can hosts update details after sharing?",
    a: "Yes. The shared link stays stable while hosts revise timing, venue notes, registry links, weather guidance, sign-up slots, and RSVP copy.",
  },
  {
    q: "Are shared event pages private?",
    a: "Envitefy can publish unindexed share links so only people with the link can open the guest page. RSVP names, notes, and attendance details stay in the host experience.",
  },
] as const;

const footerGroups = [
  {
    title: "Conversion paths",
    links: [
      { label: "Start Planning with AI", href: "/concierge-v2" },
      { label: "Create from an Upload", href: "/?action=upload" },
      { label: "Live Examples", href: "#showcase" },
    ],
  },
  {
    title: "Host playbooks",
    links: [
      { label: "PDF to Event Page", href: "/guides/pdf-to-event-page" },
      { label: "Flyer to Live Card", href: "/guides/flyer-to-event-page" },
      { label: "RSVP Best Practices", href: "/guides/rsvp-event-page" },
      { label: "No-App Guest Sharing", href: "/guides/share-event-page-without-app" },
    ],
  },
  {
    title: "Trust",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Contact", href: "/contact" },
    ],
  },
] as const;

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function SectionHeader({
  eyebrow,
  title,
  description,
  center = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  center?: boolean;
}) {
  return (
    <div className={cx("max-w-3xl", center && "mx-auto text-center")}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a88b58]">
        {eyebrow}
      </p>
      <h2
        className="mt-3 text-3xl font-light leading-tight text-slate-950 sm:text-4xl"
        style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
      >
        {title}
      </h2>
      <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">{description}</p>
    </div>
  );
}

function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-[#c5a880]/30 bg-slate-950 px-6 text-xs font-semibold uppercase tracking-[0.16em] text-[#dfc39a] shadow-[0_18px_45px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-900 sm:w-auto"
    >
      {children}
    </Link>
  );
}

function SecondaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-[#c5a880]/25 bg-white/90 px-6 text-xs font-semibold uppercase tracking-[0.16em] text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-[#a88b58]/50 hover:bg-white sm:w-auto"
    >
      {children}
    </Link>
  );
}

function LuxuryNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#c5a880]/15 bg-white/90 backdrop-blur-xl">
      <nav className="mx-auto flex h-[76px] max-w-7xl items-center gap-2 px-4 sm:gap-5 sm:px-6 lg:px-8">
        <Link href="/admin/landing-preview" className="flex shrink-0 items-center overflow-visible">
          <EnvitefyWordmark className="text-[1.55rem] sm:text-[1.9rem]" scaled={false} />
        </Link>

        <div className="hidden h-9 w-px bg-[#c5a880]/15 lg:block" />

        <div className="no-scrollbar hidden flex-1 items-center gap-1 overflow-x-auto rounded-lg border border-[#c5a880]/10 bg-white/80 p-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 shadow-[0_10px_32px_rgba(15,23,42,0.04)] md:flex">
          {navLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="shrink-0 rounded-lg px-4 py-3 transition hover:bg-[#fcfbf7] hover:text-slate-950"
            >
              {item.label}
            </a>
          ))}
        </div>

        <Link
          href="/concierge-v2"
          aria-label="Start planning with Envitefy AI"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#c5a880]/35 bg-slate-950 text-[#dfc39a] shadow-[0_15px_35px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 hover:bg-slate-900"
        >
          <Sparkles className="h-5 w-5" />
        </Link>
      </nav>
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto border-t border-[#c5a880]/12 bg-[#fcfbf7]/95 px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500 shadow-sm md:hidden">
        {mobileQuickLinks.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="shrink-0 rounded-full border border-[#c5a880]/16 bg-white px-3.5 py-2 text-slate-600 transition hover:border-[#c5a880]/40 hover:text-slate-950"
          >
            {item.label}
          </a>
        ))}
      </div>
    </header>
  );
}

function PhoneGuestPreview() {
  return (
    <div className="mx-auto w-full max-w-[300px]">
      <div className="relative aspect-[9/19.5] overflow-hidden rounded-[2.25rem] border-[7px] border-slate-900 bg-slate-900 shadow-[0_32px_80px_rgba(15,23,42,0.22)]">
        <div className="absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-b-lg bg-slate-900" />
        <div className="flex h-full flex-col overflow-hidden rounded-[1.8rem] bg-white pt-5">
          <div className="absolute right-4 top-8 z-30 rounded-full border border-slate-700/70 bg-slate-950/92 px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.14em] text-[#dfc39a] shadow-lg">
            Live preview
          </div>
          <div className="relative flex h-32 flex-col justify-end overflow-hidden bg-slate-950 p-4 text-white">
            <img
              src="/images/marketing/landing-hero-live-card.webp"
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-slate-950/45" />
            <div className="relative">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#dfc39a]">
                Invitation card
              </p>
              <h3
                className="mt-1 truncate text-lg font-medium"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                Garden Brunch
              </h3>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-hidden p-4 text-[11px] text-slate-600">
            <p className="italic leading-5 text-slate-500">
              A luminous afternoon of tea, flowers, gifts, and conversation.
            </p>

            <div className="space-y-2 rounded-lg border border-[#c5a880]/18 bg-[#fcfbf7] p-3">
              <div className="flex items-center gap-2">
                <CalendarCheck2 className="h-3.5 w-3.5 text-[#a88b58]" />
                <span>Saturday, June 13 at 2:00 PM</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#a88b58]" />
                <span>The Ivy Gardens, 740 Oak Ridge Road</span>
              </div>
            </div>

            <div>
              <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Guest itinerary
              </p>
              <div className="space-y-1.5 rounded-lg bg-slate-50 p-3">
                {["High tea reception", "Registry table", "Champagne toast"].map((item, index) => (
                  <div key={item} className="flex gap-2">
                    <span className="font-mono text-[10px] text-[#a88b58]">{index + 2}:00</span>
                    <span className="truncate">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto space-y-2 border-t border-slate-100 pt-3">
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-center text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                RSVP recorded
              </div>
              <button className="w-full rounded-lg border border-[#c5a880]/30 bg-slate-950 px-3 py-2.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#dfc39a]">
                <span className="block">RSVP attending</span>
                <span className="mt-1 block text-[8px] font-medium normal-case tracking-normal text-slate-300">
                  No account required
                </span>
              </button>
              <div className="grid grid-cols-2 gap-2 text-[9px] font-semibold uppercase tracking-[0.12em]">
                <button className="rounded-lg border border-[#c5a880]/16 bg-[#fcfbf7] py-2 text-slate-600">
                  Calendar saved
                </button>
                <button className="rounded-lg border border-[#c5a880]/16 bg-[#fcfbf7] py-2 text-slate-600">
                  Directions ready
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConciergeWorkspace() {
  return (
    <section id="snap" className="scroll-mt-24 border-y border-[#c5a880]/15 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="overflow-hidden rounded-lg border border-[#c5a880]/20 bg-white shadow-[0_30px_90px_rgba(26,20,10,0.08)]">
          <div className="flex flex-col gap-4 border-b border-[#c5a880]/18 bg-slate-950 px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#c5a880]/35 bg-[#c5a880] text-sm font-bold text-slate-950">
                AI
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#dfc39a]">
                  Envitefy premium concierge
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Turn messy source material into one polished guest page
                </p>
              </div>
            </div>
            <span className="w-fit rounded-lg border border-[#c5a880]/25 bg-white/5 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
              Share-ready draft in progress
            </span>
          </div>

          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            <div className="border-b border-[#c5a880]/15 p-5 lg:border-b-0 lg:border-r lg:p-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a88b58]">
                Concierge blueprints
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {sampleBlueprints.map((sample) => (
                  <span
                    key={sample.label}
                    className="rounded-lg border border-[#c5a880]/18 bg-[#fcfbf7] px-3 py-2 text-xs font-semibold text-slate-700"
                  >
                    {sample.label}
                  </span>
                ))}
              </div>

              <div className="mt-5 rounded-lg border border-[#c5a880]/18 bg-[#fcfbf7] p-4">
                <p className="text-sm leading-7 text-slate-700">{sampleBlueprints[0].prompt}</p>
              </div>

              <div className="mt-6 space-y-3">
                {extractionLog.map((item, index) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-[10px] font-semibold text-[#dfc39a]">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-6 text-slate-600">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-lg border border-[#c5a880]/18 bg-slate-950 p-4 text-white shadow-inner">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    AI build status
                  </span>
                  <span className="rounded-full border border-[#c5a880]/25 bg-[#c5a880]/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#dfc39a]">
                    Stage 4 / 4
                  </span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {buildStages.map((stage) => (
                    <div key={stage} className="flex items-center gap-2 text-[11px] text-slate-300">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#dfc39a]" />
                      <span>{stage}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2 text-[11px] text-[#dfc39a]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#dfc39a]" />
                  Share-ready guest page preview generated
                </div>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <PrimaryLink href="/concierge-v2">
                  Start Planning with AI
                  <Sparkles className="h-4 w-4" />
                </PrimaryLink>
                <SecondaryLink href="/?action=upload">
                  Create from an Upload
                  <UploadCloud className="h-4 w-4" />
                </SecondaryLink>
              </div>
            </div>

            <div className="flex items-center justify-center bg-[#fcfbf7] p-5 lg:p-8">
              <PhoneGuestPreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HostLedgerPreview() {
  return (
    <section className="border-b border-[#c5a880]/15 bg-[#fcfbf7]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8 lg:py-20">
        <SectionHeader
          eyebrow="Host control"
          title="Guests get an elegant page. Hosts get a clean response ledger."
          description="RSVPs, guest counts, notes, and update confidence stay organized after the invitation is shared."
        />
        <div className="grid gap-4 lg:grid-cols-[1fr_0.86fr]">
          <article className="rounded-lg border border-[#c5a880]/18 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a88b58]">
                  Recent RSVP ledger
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">Garden Brunch</h3>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Live
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {hostLedgerRows.map((row) => (
                <div
                  key={row.name}
                  className="grid grid-cols-[1fr_auto] gap-3 rounded-lg border border-slate-100 bg-[#fcfbf7] p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{row.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{row.detail}</p>
                  </div>
                  <span className="self-center rounded-full border border-[#c5a880]/20 bg-white px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#a88b58]">
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
          </article>
          <article className="rounded-lg border border-[#c5a880]/18 bg-slate-950 p-5 text-white shadow-[0_22px_60px_rgba(15,23,42,0.16)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#dfc39a]">
              Host assurance
            </p>
            <h3 className="mt-3 text-xl font-semibold">Private, editable, and calm.</h3>
            <div className="mt-5 space-y-3">
              {hostControls.map((item) => (
                <div key={item} className="flex gap-3 text-sm leading-6 text-slate-300">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#dfc39a]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function UploadDropzonePreview() {
  return (
    <div className="rounded-lg border border-[#c5a880]/18 bg-white p-5 shadow-sm">
      <div className="rounded-lg border-2 border-dashed border-[#c5a880]/24 bg-[#fcfbf7] p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#c5a880]/25 bg-white text-[#a88b58] shadow-sm">
          <UploadCloud className="h-6 w-6" />
        </div>
        <h3 className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-slate-950">
          Drop in a flyer, PDF, screenshot, or paper invite photo
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
          Envitefy extracts the date, venue, RSVP deadline, registry, schedule, and map details,
          then turns them into a polished guest page.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          {["HEIC", "JPEG", "PNG", "PDF", "Text"].map((type) => (
            <span key={type} className="rounded-full border border-[#c5a880]/20 bg-white px-3 py-1">
              {type}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function MarketingFooter() {
  return (
    <footer className="border-t border-[#c5a880]/20 bg-slate-950 text-slate-400">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.1fr_0.9fr_0.9fr_0.8fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#c5a880]/30 bg-white/5 text-[#dfc39a]">
              <Sparkles className="h-4 w-4" />
            </span>
            <EnvitefyWordmark className="text-[1.55rem] text-white" scaled={false} />
          </div>
          <p className="mt-4 max-w-sm text-sm leading-7 text-slate-400">
            Digital invitations with mobile guest pages, RSVP ledgers, live updates, and no app
            friction.
          </p>
        </div>
        {footerGroups.map((group) => (
          <div key={group.title}>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
              {group.title}
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              {group.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="transition hover:text-[#dfc39a]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/8 px-4 py-5 text-center text-[11px] text-slate-500">
        2026 Envitefy. Premium event pages, practical guest operations.
      </div>
    </footer>
  );
}

function PreviewDenied({ status }: { status: number }) {
  const isUnauthorized = status === 401;
  return (
    <main className="grid min-h-screen place-items-center bg-[#fcfbf7] px-6 text-slate-950">
      <section className="max-w-md rounded-lg border border-[#c5a880]/20 bg-white p-8 text-center shadow-sm">
        <ShieldCheck className="mx-auto h-10 w-10 text-[#a88b58]" />
        <h1 className="mt-5 text-2xl font-semibold">
          {isUnauthorized ? "Sign in required" : "Admins only"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {isUnauthorized
            ? "This landing mock is an internal preview route."
            : "This preview is limited to Envitefy admin accounts."}
        </p>
        <Link
          href={isUnauthorized ? "/api/auth/signin?callbackUrl=/admin/landing-preview" : "/"}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-[#dfc39a] transition hover:bg-slate-900"
        >
          {isUnauthorized ? "Sign in" : "Go home"}
        </Link>
      </section>
    </main>
  );
}

async function ensureAdminAccess() {
  try {
    return await requireAdminSession();
  } catch (error) {
    if (error instanceof AdminRouteError && error.status === 401) {
      redirect("/api/auth/signin?callbackUrl=/admin/landing-preview");
    }
    if (error instanceof AdminRouteError) {
      return { deniedStatus: error.status };
    }
    throw error;
  }
}

export default async function AdminLandingPreviewPage() {
  const admin = await ensureAdminAccess();
  if ("deniedStatus" in admin) {
    return <PreviewDenied status={admin.deniedStatus} />;
  }

  return (
    <main id="hub" className="min-h-screen bg-[#fcfbf7] text-slate-950">
      <div className="border-b border-[#c5a880]/15 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 text-[11px] sm:px-6 lg:px-8">
          <Link href="/admin" className="font-semibold uppercase tracking-[0.18em] text-[#dfc39a]">
            Admin preview
          </Link>
          <span className="text-slate-300">Noindex route. Production /landing is unchanged.</span>
        </div>
      </div>

      <div className="border-b border-[#c5a880]/15 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 text-center text-[11px] sm:flex-row sm:items-center sm:justify-center sm:px-6 lg:px-8">
          <span className="mx-auto w-fit rounded-full border border-[#c5a880]/30 bg-[#c5a880]/12 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#dfc39a] sm:mx-0">
            Hosting upgrade
          </span>
          <span className="font-light tracking-wide text-slate-100">
            Stop sharing fuzzy screenshots and scattered bullet lists. Turn every event into a
            polished RSVP portal.
          </span>
        </div>
      </div>

      <LuxuryNav />

      <section className="relative overflow-hidden border-b border-[#c5a880]/15 bg-[#f8f4ed]">
        <img
          src="/images/marketing/landing-hero-live-card.webp"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-[0.13]"
        />
        <div className="absolute inset-0 bg-[#fcfbf7]/82" />
        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-14 sm:px-6 lg:px-8 lg:pb-16 lg:pt-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#c5a880]/25 bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a88b58] shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              AI event concierge for beautiful gatherings
            </div>
            <h1
              className="mt-8 text-5xl font-light leading-[1.05] text-slate-950 sm:text-6xl lg:text-7xl"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              Turn any invite, flyer, PDF, or idea
              <span className="mt-2 block italic text-[#a88b58]">into a live event page.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
              Envitefy creates stunning invitations, RSVP flows, maps, calendar saves, registries,
              and guest updates from the materials busy hosts already have.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <PrimaryLink href="/concierge-v2">
                Start Planning with AI
                <ArrowRight className="h-4 w-4" />
              </PrimaryLink>
              <SecondaryLink href="#showcase">
                View Live Examples
                <ChevronRight className="h-4 w-4" />
              </SecondaryLink>
            </div>

            <div className="mx-auto mt-10 grid max-w-3xl gap-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:grid-cols-3">
              {["RSVPs in one place", "Maps, calendar, gifts", "Guests need no app"].map((item) => (
                <div key={item} className="border-t border-[#c5a880]/25 pt-3">
                  {item}
                </div>
              ))}
            </div>

            <div className="mx-auto mt-8 grid max-w-3xl gap-3 text-left sm:grid-cols-2">
              {startingPoints.map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-[#c5a880]/18 bg-white/82 px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ConciergeWorkspace />

      <section className="border-b border-[#c5a880]/15 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeader
            eyebrow="Guest actions"
            title="One elegant link that answers the questions guests actually ask."
            description="RSVP, directions, calendar saves, registries, and host updates live together under one polished URL."
            center
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {outputTiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <article
                  key={tile.title}
                  className="group rounded-lg border border-[#c5a880]/16 bg-[#fcfbf7] p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#c5a880]/45 hover:bg-white"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#c5a880]/20 bg-white text-[#a88b58] transition group-hover:bg-slate-950 group-hover:text-[#dfc39a]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-sm font-semibold uppercase tracking-[0.15em] text-slate-950">
                    {tile.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{tile.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <HostLedgerPreview />

      <section className="border-b border-[#c5a880]/15 bg-[#f8f4ed]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8 lg:py-20">
          <SectionHeader
            eyebrow="Before and after"
            title="From group-chat chaos to one guest-ready event page."
            description="Envitefy upgrades screenshots, bullet lists, and file attachments into digital hospitality guests can use."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-lg border border-rose-200 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-500">
                Before Envitefy
              </p>
              <h3 className="mt-3 text-xl font-semibold text-slate-950">Scattered invite chaos</h3>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
                {[
                  "Fuzzy screenshots with non-clickable addresses",
                  "RSVPs buried in group chats and text replies",
                  "Registry, parking, attire, and schedule sent separately",
                  "Guests asking the host the same questions repeatedly",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
            <article className="rounded-lg border border-[#c5a880]/30 bg-slate-950 p-5 text-white shadow-[0_22px_60px_rgba(15,23,42,0.16)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#dfc39a]">
                After Envitefy
              </p>
              <h3 className="mt-3 text-xl font-semibold">A polished guest hub</h3>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
                {[
                  "One shareable event link with live details",
                  "RSVP ledger, guest count, and host notes in sync",
                  "Maps, calendar, registry, and updates under one roof",
                  "A luxury mobile experience with no app install",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#dfc39a]" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="border-b border-[#c5a880]/15 bg-white">
        <LandingLiveCardShowcase
          tone="luxury"
          eyebrow="Live examples"
          title="Live cards guests want to open."
          description="Phone-first invitations, real event details, and clear guest actions make Envitefy feel premium before anyone signs in."
        />
      </section>

      <section id="guides" className="scroll-mt-24 border-b border-[#c5a880]/15 bg-[#fcfbf7]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeader
            eyebrow="Bespoke guides"
            title="Helpful playbooks for hosts who want every detail handled."
            description="Short guides build trust by showing how Envitefy turns PDFs, flyers, RSVPs, and guest questions into polished event pages."
            center
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {guides.map((guide) => {
              const Icon = guide.icon;
              return (
                <article
                  key={guide.title}
                  className="rounded-lg border border-[#c5a880]/16 bg-white p-5"
                >
                  <Icon className="h-6 w-6 text-[#a88b58]" />
                  <h3 className="mt-5 text-lg font-semibold text-slate-950">{guide.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{guide.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-[#c5a880]/15 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeader
            eyebrow="Use cases"
            title="Premium enough for weddings. Practical enough for schools, teams, and family life."
            description="Birthdays, showers, wedding weekends, team events, and school logistics all become organized guest experiences."
            center
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {showcaseExamples.map((example) => (
              <article
                key={example.title}
                className="overflow-hidden rounded-lg border border-[#c5a880]/16 bg-[#fcfbf7] shadow-sm"
              >
                <img
                  src={example.image}
                  alt={`${example.title} example`}
                  className="h-48 w-full object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-slate-950">{example.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{example.note}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#c5a880]/15 bg-[#f8f4ed]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8 lg:py-20">
          <SectionHeader
            eyebrow="Upload paths"
            title="Start from the material in front of you."
            description="Create a hosted event page from your own files, or save a received invite card as a clean personal reference."
          />
          <div className="space-y-4">
            <UploadDropzonePreview />
            <div className="grid gap-4 md:grid-cols-2">
              {conversionPaths.map((path) => (
                <article
                  key={path.title}
                  className="overflow-hidden rounded-lg border border-[#c5a880]/18 bg-white shadow-sm"
                >
                  <img src={path.image} alt="" className="h-44 w-full object-cover" />
                  <div className="p-5">
                    <span className="rounded-full border border-[#c5a880]/25 bg-[#fcfbf7] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a88b58]">
                      {path.badge}
                    </span>
                    <h3 className="mt-4 text-xl font-semibold text-slate-950">{path.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{path.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="process" className="scroll-mt-24 border-b border-[#c5a880]/15 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeader
            eyebrow="Process"
            title="Add details, review the draft, share one beautiful link."
            description="The path stays simple while Envitefy handles the RSVP flow, guest actions, and polished presentation."
            center
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {workflow.map((step, index) => (
              <article
                key={step.title}
                className="rounded-lg border border-[#c5a880]/16 bg-[#fcfbf7] p-5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-sm font-semibold text-[#dfc39a]">
                  {index + 1}
                </span>
                <h3 className="mt-5 text-xl font-semibold text-slate-950">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-24 border-b border-[#c5a880]/15 bg-[#fcfbf7]">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeader
            eyebrow="FAQ"
            title="Event pages should answer questions before guests ask them."
            description="Clear answers for no-account guest access, live updates, AI planning, and host control."
            center
          />
          <div className="mt-10 space-y-3">
            {faqItems.map((item) => (
              <article key={item.q} className="rounded-lg border border-[#c5a880]/16 bg-white p-5">
                <h3 className="text-base font-semibold text-slate-950">{item.q}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="inquiries" className="scroll-mt-24 bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#dfc39a]">
              Create your event
            </p>
            <h2
              className="mt-3 max-w-3xl text-3xl font-light leading-tight sm:text-4xl"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              Build the invitation, RSVP flow, and guest page from one beautiful starting point.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              Give every gathering a polished front door with AI planning, no-app guest access, and
              details hosts can update anytime.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <PrimaryLink href="/concierge-v2">
              Create Your Event
              <ArrowRight className="h-4 w-4" />
            </PrimaryLink>
            <SecondaryLink href="/?action=upload">Create an Invitation</SecondaryLink>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
