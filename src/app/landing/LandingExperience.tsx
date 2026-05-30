"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Gift,
  MessageCircle,
  Sparkles,
  TicketCheck,
  Upload,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import LandingLiveCardShowcase from "@/components/landing/LandingLiveCardShowcase";
import HeroTopNav from "@/components/navigation/HeroTopNav";
import LandingFaq from "./sections/LandingFaq";

const landingFlowSectionClass = "";
const landingFlowContentClass = "mx-auto w-full max-w-7xl px-4 py-16 sm:px-8 lg:px-10 lg:py-20";
const landingFlowInnerClass = "";

const landingHeroNavLinks = [
  { label: "Examples", href: "#showcase" },
  { label: "Guest Flow", href: "#event-pages" },
  { label: "Templates", href: "#examples" },
  { label: "Start", href: "#creation-paths" },
  { label: "FAQ", href: "#faq" },
];

const gardenBrunchLiveCardImage = "/images/landing/live-cards/madeline-s-garden-brunch.webp";

type ProofTile = {
  title: string;
  eyebrow: string;
  image: string;
  note: string;
};

type HeroProductSlide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  desktopImage: string;
  imageAlt: string;
  imagePosition?: string;
};

const templateProofTiles: ProofTile[] = [
  {
    eyebrow: "Birthday",
    title: "Nova's Space Safari",
    image: "/images/landing/template-proof/nova-space-safari.webp",
    note: "Parents get timing, gifts, directions, and RSVP from one bright party link.",
  },
  {
    eyebrow: "School",
    title: "BrightWorks Museum Day",
    image: "/images/landing/template-proof/brightworks-museum-day.webp",
    note: "Families can use the schedule, reminders, and logistics from any device.",
  },
  {
    eyebrow: "Open house",
    title: "Maple Loft Open House",
    image: "/images/landing/template-proof/maple-loft-open-house.webp",
    note: "Address, timing, RSVP, and host updates stay ready for every guest.",
  },
  {
    title: "Mentor Toast Night",
    eyebrow: "Appreciation",
    image: "/images/landing/template-proof/mentor-toast-night.webp",
    note: "Hosted gatherings can carry schedule, venue, and guest-list context.",
  },
  {
    title: "Rose Garden Bridal Brunch",
    eyebrow: "Bridal shower",
    image: "/images/landing/template-proof/rose-garden-bridal-brunch.webp",
    note: "Gift links, RSVP, menu notes, and host details stay in one guest flow.",
  },
  {
    title: "Sunny Sprout Baby Shower",
    eyebrow: "Baby shower",
    image: "/images/landing/template-proof/sunny-sprout-baby-shower.webp",
    note: "Registry links, RSVP, schedule, and helper tasks stay attached.",
  },
];

const heroProductSlides: HeroProductSlide[] = [
  {
    id: "garden-brunch",
    eyebrow: "Live invitation",
    title: "Beautiful hosted events, from invite to RSVP.",
    description: "One elegant link for the invitation, RSVP, registry, map, and updates.",
    image: "/images/landing/hero/garden-brunch-mobile.webp",
    desktopImage: "/images/landing/hero/garden-brunch-desktop.webp",
    imageAlt: "Garden brunch live invitation card",
  },
  {
    id: "garden-vows",
    eyebrow: "Wedding weekend",
    title: "Wedding details, beautifully shared.",
    description: "Schedule, registry, RSVP, and travel notes in one polished page.",
    image: "/images/landing/hero/garden-vows-mobile.webp",
    desktopImage: "/images/landing/hero/garden-vows-desktop.webp",
    imageAlt: "Wedding weekend event page preview",
  },
  {
    id: "school-trip",
    eyebrow: "School event",
    title: "Plans families can open again.",
    description: "Itinerary, map, reminders, and parent updates without the thread hunt.",
    image: "/images/landing/hero/lincoln-discovery-mobile.webp",
    desktopImage: "/images/landing/hero/lincoln-discovery-desktop.webp",
    imageAlt: "School field trip event page preview",
  },
  {
    id: "team-weekend",
    eyebrow: "Team schedule",
    title: "Every game-day detail, current.",
    description: "Schedules, venues, reminders, and helper needs travel together.",
    image: "/images/landing/hero/friday-night-lights-mobile.webp",
    desktopImage: "/images/landing/hero/friday-night-lights-desktop.webp",
    imageAlt: "Team schedule event page preview",
  },
  {
    id: "birthday-party",
    eyebrow: "Birthday",
    title: "A party link guests can use.",
    description: "RSVPs, gift notes, timing, and directions stay ready for every parent.",
    image: "/images/landing/hero/birthday-dino-mobile.webp",
    desktopImage: "/images/landing/hero/birthday-dino-desktop.webp",
    imageAlt: "Birthday party event page preview",
  },
  {
    id: "baby-shower",
    eyebrow: "Baby shower",
    title: "Sweet details, beautifully organized.",
    description: "Registry links, RSVP, schedule, and host notes live beside the invitation.",
    image: "/images/landing/hero/baby-shower-mobile.webp",
    desktopImage: "/images/landing/hero/baby-shower-desktop.webp",
    imageAlt: "Baby shower event page preview",
  },
  {
    id: "open-house",
    eyebrow: "Open house",
    title: "A warm welcome in one link.",
    description: "Share time, address, updates, and RSVP without another message chain.",
    image: "/images/landing/hero/open-house-mobile.webp",
    desktopImage: "/images/landing/hero/open-house-desktop.webp",
    imageAlt: "Open house event page preview",
  },
] as const;

const guestActionTabs = [
  {
    id: "invite",
    label: "Invite",
    icon: Sparkles,
    title: "A live invitation that stays useful after it is opened.",
    description:
      "Guests see the card, the event details, and the next action without digging through screenshots.",
  },
  {
    id: "rsvp",
    label: "RSVP",
    icon: TicketCheck,
    title: "Collect replies where guests already are.",
    description: "Yes, maybe, no, plus notes and guest details stay attached to the hosted event.",
  },
  {
    id: "registry",
    label: "Registry",
    icon: Gift,
    title: "Gift links live beside the event details.",
    description:
      "Registry cards and gift notes can sit with the invitation, schedule, and RSVP flow.",
  },
  {
    id: "signup",
    label: "Sign-up",
    icon: ClipboardList,
    title: "Claim slots without another spreadsheet.",
    description:
      "Volunteer shifts, supply lists, and capacity-aware claims can be part of the guest flow.",
  },
] as const;

type GuestActionId = (typeof guestActionTabs)[number]["id"];

const trustProofItems = [
  "Guests can use shared event pages in the browser, with no app install required.",
  "Hosts can keep the shared link current after the first send.",
  "RSVP replies, pending guests, and sign-up claims stay visible in the host experience.",
  "The template proof grid uses unique event concepts and artwork instead of recycled examples.",
] as const;

const creationPaths = [
  {
    title: "Concierge",
    badge: "Fastest start",
    description:
      "Describe the gathering and let Envitefy draft the invitation, page, RSVP flow, registry notes, and sign-up needs.",
    points: ["Best when the plan is still loose", "Good for hosts who want a polished first draft"],
    icon: MessageCircle,
  },
  {
    title: "Templates",
    badge: "Designed start",
    description:
      "Begin from wedding, party, school, sports, community, or sign-up templates and tune the details.",
    points: ["Best when the event type is clear", "Keeps the visual direction intentional"],
    icon: Sparkles,
  },
  {
    title: "Bring what you have",
    badge: "My events",
    description:
      "Upload an invite, flyer, schedule, PDF, screenshot, or design direction when you are creating an event you host.",
    points: ["Best for authored event pages", "Creates an event you can edit, share, and track"],
    icon: Upload,
  },
  {
    title: "Received invite cards",
    badge: "Invited events",
    description:
      "Save someone else's birthday, wedding, gender reveal, or similar invite-card details without turning yourself into the host.",
    points: [
      "Best for classic received invite cards",
      "Keeps invited events separate from hosted events",
    ],
    icon: Users,
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
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9d7a3e]">
        {eyebrow}
      </p>
      <h2
        className="mt-3 text-3xl font-light leading-tight text-[#201a23] sm:text-4xl lg:text-5xl"
        style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
      >
        {title}
      </h2>
      <p className="mt-4 text-sm leading-7 text-[#665d68] sm:text-base">{description}</p>
    </div>
  );
}

function HeroProductCarousel({ onPrimaryAction }: { onPrimaryAction: () => void }) {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const activeSlide = heroProductSlides[activeSlideIndex] ?? heroProductSlides[0];

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const interval = window.setInterval(() => {
      setActiveSlideIndex((currentIndex) => (currentIndex + 1) % heroProductSlides.length);
    }, 6600);

    return () => window.clearInterval(interval);
  }, []);

  const showPreviousSlide = () => {
    setActiveSlideIndex(
      (currentIndex) => (currentIndex - 1 + heroProductSlides.length) % heroProductSlides.length,
    );
  };

  const showNextSlide = () => {
    setActiveSlideIndex((currentIndex) => (currentIndex + 1) % heroProductSlides.length);
  };

  return (
    <section
      id="landing-hero"
      className="relative isolate min-h-[100svh] overflow-hidden bg-[#120f14] text-white"
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={activeSlide.id}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.01 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <Image
            src={activeSlide.desktopImage}
            alt={activeSlide.imageAlt}
            fill
            priority={activeSlideIndex === 0}
            sizes="100vw"
            className="hidden object-cover object-center md:block"
          />
          <Image
            src={activeSlide.image}
            alt={activeSlide.imageAlt}
            fill
            priority={activeSlideIndex === 0}
            sizes="100vw"
            className="object-cover md:hidden"
            style={{ objectPosition: activeSlide.imagePosition ?? "center" }}
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,15,20,0.82)_0%,rgba(18,15,20,0.58)_40%,rgba(18,15,20,0.28)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(18,15,20,0.64)_0%,rgba(18,15,20,0.08)_44%,rgba(18,15,20,0.35)_100%)]" />

      <button
        type="button"
        onClick={showPreviousSlide}
        aria-label="Show previous hero slide"
        className="absolute left-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md border border-white/18 bg-black/34 text-white shadow-[0_18px_40px_rgba(0,0,0,0.24)] backdrop-blur transition hover:bg-white/16 md:flex"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={showNextSlide}
        aria-label="Show next hero slide"
        className="absolute right-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md border border-white/18 bg-black/34 text-white shadow-[0_18px_40px_rgba(0,0,0,0.24)] backdrop-blur transition hover:bg-white/16 md:flex"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-none flex-col justify-end px-5 pb-20 pt-32 sm:px-8 lg:px-16 lg:pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeSlide.id}-content`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.48, ease: "easeOut" }}
            className="max-w-4xl"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#f0d58f] sm:text-xs">
              {activeSlide.eyebrow}
            </p>
            <h1
              className="mt-5 max-w-5xl text-5xl font-light leading-[0.98] text-white sm:text-7xl lg:text-[5.8rem]"
              style={{ color: "#fff", fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              {activeSlide.title}
            </h1>
            <p
              className="mt-6 max-w-2xl text-base leading-8 text-white/82 sm:text-lg"
              style={{ color: "rgba(255,255,255,0.86)" }}
            >
              {activeSlide.description}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onPrimaryAction}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/18 bg-white/14 px-6 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(0,0,0,0.24)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/22"
              >
                Create an event page
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                href="#showcase"
                className="inline-flex h-12 items-center justify-center rounded-md border border-white/18 bg-black/18 px-6 text-sm font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/14"
              >
                View live examples
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2"
        aria-label="Hero product slides"
        role="group"
      >
        {heroProductSlides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setActiveSlideIndex(index)}
            aria-label={`Show ${slide.title}`}
            aria-pressed={activeSlideIndex === index}
            className={cx(
              "h-2.5 rounded-full transition-all",
              activeSlideIndex === index ? "w-9 bg-white" : "w-2.5 bg-white/42 hover:bg-white/70",
            )}
          />
        ))}
      </div>
    </section>
  );
}

function PremiumLandingHero({ onPrimaryAction }: { onPrimaryAction: () => void }) {
  return <HeroProductCarousel onPrimaryAction={onPrimaryAction} />;
}

function GuestActionPreview({ activeAction }: { activeAction: GuestActionId }) {
  if (activeAction === "invite") {
    return (
      <div className="grid gap-5 md:grid-cols-[0.78fr_1fr] md:items-center">
        <img
          src={gardenBrunchLiveCardImage}
          alt="Live invitation card connected to event details"
          className="mx-auto aspect-[4/5] w-full max-w-xs rounded-lg object-cover object-top shadow-[0_24px_60px_rgba(33,26,35,0.14)]"
        />
        <div className="space-y-3">
          {["Mobile-first invitation", "Public event details", "Host updates"].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-lg border border-[#e1d6c2] bg-[#fbf8f1] p-4"
            >
              <Sparkles className="h-4 w-4 text-[#9d7a3e]" />
              <span className="text-sm font-semibold text-[#201a23]">{item}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeAction === "registry") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[
          ["Babylist", "Gift registry", "Open gift link"],
          ["Dinner fund", "Optional contribution", "View details"],
          ["Host note", "Bring a favorite recipe", "Read note"],
          ["Thank-you", "Updates stay here", "Send update"],
        ].map(([title, detail, action]) => (
          <div key={title} className="rounded-lg border border-[#e1d6c2] bg-white p-4">
            <Gift className="h-5 w-5 text-[#9d7a3e]" />
            <h3 className="mt-3 text-base font-semibold text-[#201a23]">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-[#665d68]">{detail}</p>
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-[#43273f]">
              {action}
            </p>
          </div>
        ))}
      </div>
    );
  }

  if (activeAction === "signup") {
    return (
      <div className="space-y-3">
        {[
          { role: "Welcome table", claimed: 2, capacity: 2 },
          { role: "Dessert setup", claimed: 3, capacity: 4 },
          { role: "Cleanup crew", claimed: 1, capacity: 3 },
          { role: "Flower pickup", claimed: 1, capacity: 1 },
        ].map((slot) => (
          <div key={slot.role} className="rounded-lg border border-[#e1d6c2] bg-white p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-[#201a23]">{slot.role}</h3>
                <p className="mt-1 text-xs text-[#665d68]">
                  {slot.claimed} of {slot.capacity} claimed
                </p>
              </div>
              <span
                className={cx(
                  "rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]",
                  slot.claimed === slot.capacity
                    ? "bg-[#f4e7df] text-[#8e4d4d]"
                    : "bg-[#edf4ef] text-[#315f52]",
                )}
              >
                {slot.claimed === slot.capacity ? "Full" : "Open"}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f4efe6]">
              <div
                className="h-full rounded-full bg-[#7a8f76]"
                style={{ width: `${Math.round((slot.claimed / slot.capacity) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#e1d6c2] bg-white">
      <div className="grid gap-3 p-4 sm:grid-cols-3">
        {[
          { label: "Invited", value: "64", sub: "Example list" },
          { label: "Attending", value: "42", sub: "Example replies" },
          { label: "Pending", value: "19", sub: "Needs follow-up" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-md bg-[#fbf8f1] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7b6f52]">
              {stat.label}
            </p>
            <p className="mt-2 text-3xl font-light text-[#201a23]">{stat.value}</p>
            <p className="mt-1 text-xs text-[#665d68]">{stat.sub}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-[#e1d6c2]">
        {[
          ["Maya Patel", "Yes", "2h ago"],
          ["Jordan Lee", "Pending", "Yesterday"],
          ["Nora Chen", "No", "May 9"],
        ].map(([name, response, updated]) => (
          <div
            key={name}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-[#f0e8d9] px-4 py-3 last:border-b-0"
          >
            <span className="text-sm font-semibold text-[#201a23]">{name}</span>
            <span className="rounded-md bg-[#edf4ef] px-2 py-1 text-xs font-semibold text-[#315f52]">
              {response}
            </span>
            <span className="text-xs text-[#665d68]">{updated}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GuestActionSuite() {
  const [activeAction, setActiveAction] = useState<GuestActionId>("rsvp");
  const currentAction =
    guestActionTabs.find((action) => action.id === activeAction) || guestActionTabs[0];

  return (
    <section
      id="event-pages"
      className={cx(landingFlowSectionClass, "border-y border-[#ded2bd] bg-white")}
    >
      <div className={landingFlowContentClass}>
        <div className={cx(landingFlowInnerClass, "grid gap-10 lg:grid-cols-[0.82fr_1.18fr]")}>
          <div>
            <SectionHeader
              eyebrow="Guest actions"
              title="RSVPs, registries, maps, and sign-ups in one guest flow."
              description="The hosted page is not a static announcement. It gives guests the next useful action and gives hosts one place to keep the response state current."
            />
            <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
              {guestActionTabs.map((action) => {
                const Icon = action.icon;
                const isActive = action.id === activeAction;
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => setActiveAction(action.id)}
                    aria-pressed={isActive}
                    className={cx(
                      "flex items-center justify-center gap-2 rounded-md border px-3 py-3 text-xs font-bold uppercase tracking-[0.12em] transition",
                      isActive
                        ? "border-[#43273f] bg-[#43273f] text-white"
                        : "border-[#e1d6c2] bg-[#fcfbf7] text-[#403744] hover:border-[#b5965e]",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {action.label}
                  </button>
                );
              })}
            </div>
            <div
              id="rsvp-tracking"
              className="mt-8 rounded-lg border border-[#d7c5a5] bg-[#fcfbf7] p-5"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9d7a3e]">
                {currentAction.label} state
              </p>
              <h3 className="mt-2 text-xl font-semibold text-[#201a23]">{currentAction.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#665d68]">{currentAction.description}</p>
            </div>
          </div>
          <GuestActionPreview activeAction={activeAction} />
        </div>
      </div>
    </section>
  );
}

function TemplateGallery() {
  return (
    <section
      id="examples"
      className={cx(landingFlowSectionClass, "border-b border-[#ded2bd] bg-[#fbf8f1]")}
    >
      <div className={landingFlowContentClass}>
        <div className={landingFlowInnerClass}>
          <SectionHeader
            eyebrow="Templates and proof"
            title="Premium enough for showers. Practical enough for schools, teams, and community plans."
            description="Use fresh live-card and smart sign-up concepts as starting points for the event page guests will actually use."
            center
          />

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templateProofTiles.map((tile) => (
              <article
                key={`${tile.eyebrow}-${tile.title}`}
                className="overflow-hidden rounded-lg border border-[#d7c5a5] bg-white shadow-sm"
              >
                <img
                  src={tile.image}
                  alt={`${tile.title} example`}
                  className="h-56 w-full object-cover object-top"
                />
                <div className="p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9d7a3e]">
                    {tile.eyebrow}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-[#201a23]">{tile.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#665d68]">{tile.note}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CreationPaths({ onPrimaryAction }: { onPrimaryAction: () => void }) {
  return (
    <section
      id="creation-paths"
      className={cx(landingFlowSectionClass, "border-b border-[#ded2bd] bg-white")}
    >
      <div className={landingFlowContentClass}>
        <div className={landingFlowInnerClass}>
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <SectionHeader
              eyebrow="Creation paths"
              title="Start from Concierge, a template, or the file you already have."
              description="Hosting creates My events. Received birthday, wedding, gender reveal, and similar invite-card scans become Invited events."
            />
            <div id="concierge" className="grid gap-4 md:grid-cols-2">
              {creationPaths.map((path) => {
                const Icon = path.icon;
                return (
                  <article
                    key={path.title}
                    className="rounded-lg border border-[#d7c5a5] bg-[#fcfbf7] p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-[#43273f] shadow-sm">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="rounded-md bg-[#edf4ef] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#315f52]">
                        {path.badge}
                      </span>
                    </div>
                    <h3 className="mt-5 text-xl font-semibold text-[#201a23]">{path.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#665d68]">{path.description}</p>
                    <div className="mt-4 space-y-2">
                      {path.points.map((point) => (
                        <div key={point} className="flex gap-2 text-sm leading-6 text-[#403744]">
                          <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#7a8f76]" />
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
          <div
            id="upload"
            className="mt-10 flex flex-col gap-3 rounded-lg border border-[#d7c5a5] bg-[#43273f] p-5 text-white sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="max-w-2xl text-sm leading-6 text-white/82">
              Bring what you already have as one creation path: an invite, flyer, PDF, screenshot,
              schedule, or rough idea can become a hosted event page.
            </p>
            <button
              type="button"
              onClick={onPrimaryAction}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-[#43273f] transition hover:-translate-y-0.5 hover:bg-[#fbf8f1]"
            >
              Start your event
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustProof() {
  return (
    <section className={cx(landingFlowSectionClass, "border-b border-[#ded2bd] bg-[#fcfbf7]")}>
      <div className={landingFlowContentClass}>
        <div className={landingFlowInnerClass}>
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
            <SectionHeader
              eyebrow="Trust"
              title="A polished link guests can act on."
              description="Keep the claims concrete: no fake customer metrics, no admin-tool promises, and no app-install burden for shared browser pages."
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {trustProofItems.map((item) => (
                <div key={item} className="rounded-lg border border-[#d7c5a5] bg-white p-4">
                  <CheckCircle2 className="h-5 w-5 text-[#7a8f76]" />
                  <p className="mt-3 text-sm leading-6 text-[#403744]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalPremiumCta({ onPrimaryAction }: { onPrimaryAction: () => void }) {
  return (
    <section id="cta" className={cx(landingFlowSectionClass, "bg-[#fcfbf7]")}>
      <div className={landingFlowContentClass}>
        <div className={landingFlowInnerClass}>
          <div className="grid w-full gap-8 rounded-lg border border-[#d7c5a5] bg-[#201a23] px-5 py-12 text-white shadow-[0_30px_80px_rgba(33,26,35,0.2)] sm:px-8 lg:grid-cols-[1fr_auto] lg:items-center lg:px-10">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#e2c891]">
                Create your hosted event page
              </p>
              <h2
                className="mt-3 max-w-3xl text-3xl font-light leading-tight sm:text-4xl"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                One elegant event page for every guest detail.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72 sm:text-base">
                Create from Concierge, choose a template, or start from the invite, flyer, schedule,
                or PDF you already have.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <button
                type="button"
                onClick={onPrimaryAction}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-[#201a23] transition hover:-translate-y-0.5 hover:bg-[#fbf8f1]"
              >
                Create an event page
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                href="/?action=upload"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/20 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Start from an invite, flyer, or PDF
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingExperience() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <>
      <main className="min-h-screen bg-[#fcfbf7] text-[#201a23] selection:bg-[#e2c891]/45 selection:text-[#201a23]">
        <HeroTopNav
          navLinks={[...landingHeroNavLinks]}
          primaryCtaLabel="Create an event page"
          authenticatedPrimaryHref="/chat"
          variant="transparent-dark"
          loginSuccessRedirectUrl="/"
          onGuestLoginAction={() => openAuth("login")}
          onGuestPrimaryAction={() => openAuth("signup")}
        />

        <PremiumLandingHero onPrimaryAction={() => openAuth("signup")} />

        <section className="border-b border-[#ded2bd] bg-[#f8f3ea]">
          <LandingLiveCardShowcase
            eyebrow="Interactive proof"
            title="Live cards connected to real event details."
            description="Swipe through product-backed live cards for weddings, birthdays, showers, school events, team weekends, and hosted gatherings."
            tone="luxury"
          />
        </section>

        <GuestActionSuite />
        <TemplateGallery />
        <CreationPaths onPrimaryAction={() => openAuth("signup")} />
        <TrustProof />
        <LandingFaq />
        <FinalPremiumCta onPrimaryAction={() => openAuth("signup")} />
      </main>

      <AuthModal
        open={authModalOpen}
        mode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onModeChange={setAuthMode}
        successRedirectUrl="/"
      />
    </>
  );
}
