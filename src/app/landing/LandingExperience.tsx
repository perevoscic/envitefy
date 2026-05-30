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
import FeatureCarousel, { type FeatureCarouselItem } from "@/components/ui/feature-carousel";
import LandingFaq from "./sections/LandingFaq";

const landingFlowSectionClass = "";
const landingFlowContentClass = "mx-auto w-full max-w-7xl px-4 py-16 sm:px-8 lg:px-10 lg:py-20";
const landingFlowInnerClass = "";
const landingViewportSectionClass = "flex min-h-[100svh] flex-col justify-center";

const landingHeroNavLinks = [
  { label: "Examples", href: "#showcase" },
  { label: "Guest Flow", href: "#guest-flow" },
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

const templateCarouselFeatures: FeatureCarouselItem[] = templateProofTiles.map((tile) => ({
  id: `${tile.eyebrow}-${tile.title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, ""),
  label: tile.eyebrow,
  image: tile.image,
  imageAlt: `${tile.title} example`,
  badge: tile.title,
  description: tile.note,
}));

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

const guestActionSlides = [
  {
    id: "invite",
    label: "Invite",
    icon: Sparkles,
    title: "A full invite view first, not a generic action grid.",
    description:
      "Open with a polished event page guests can read, save, and come back to.",
  },
  {
    id: "rsvp",
    label: "RSVP",
    icon: TicketCheck,
    title: "Then the carousel moves guests into the RSVP moment.",
    description: "The reply flow gets its own copy, state, colors, and host-side ledger.",
  },
  {
    id: "registry",
    label: "Registry",
    icon: Gift,
    title: "A baby shower registry gets a softer, gift-focused scenario.",
    description: "Gift links, diaper fund, and host notes stay beside the shower details.",
  },
  {
    id: "signup",
    label: "Sign-up",
    icon: ClipboardList,
    title: "Finally, sign-up turns open needs into claimed slots.",
    description: "Supply lists, helpers, and capacity state live in the same event flow.",
  },
] as const;

type GuestActionId = (typeof guestActionSlides)[number]["id"];

type GuestActionTone = "attention" | "live" | "ready";

type GuestActionPreviewConfig = {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  eventEyebrow: string;
  eventTitle: string;
  eventDescription: string;
  metricValue: string;
  metricLabel: string;
  metricNote: string;
  primaryCta: string;
  secondaryCta: string;
  proofPills: string[];
  guestLines: string[];
  hostRows: Array<{
    label: string;
    value: string;
    note: string;
  }>;
  timeline: Array<{
    label: string;
    detail: string;
    status: string;
    tone: GuestActionTone;
  }>;
  flowSteps: Array<{
    title: string;
    detail: string;
  }>;
  theme: {
    canvasClass: string;
    glowClass: string;
    accentTextClass: string;
    guestFrameClass: string;
    hostFrameClass: string;
    primaryButtonClass: string;
    secondaryButtonClass: string;
    stepCardClass: string;
  };
};

const guestActionProofStats = [
  { value: "1 link", label: "Invitation, details, and response actions stay together." },
  { value: "0 installs", label: "Guests act from the browser on mobile or desktop." },
  { value: "Live state", label: "Hosts see replies, claims, links, and updates in one place." },
] as const;

const guestActionPreviewConfigs: Record<GuestActionId, GuestActionPreviewConfig> = {
  invite: {
    eyebrow: "Live invitation",
    title: "Open with a beautiful invite view that stays useful after the first tap.",
    description:
      "The first carousel scene is the guest-facing invitation: artwork, time, location, calendar, and directions in one polished view.",
    image: gardenBrunchLiveCardImage,
    imageAlt: "Garden brunch live invitation card",
    eventEyebrow: "Garden brunch",
    eventTitle: "Madeline's Garden Brunch",
    eventDescription: "A Sunday table, garden blooms, and one link for every arrival detail.",
    metricValue: "1 link",
    metricLabel: "sent once",
    metricNote: "Guests can reopen the same page when the plan changes.",
    primaryCta: "Open invite",
    secondaryCta: "Save date",
    proofPills: ["Invitation view", "Calendar ready", "Map included"],
    guestLines: ["Invitation artwork", "Time and location", "Calendar and map"],
    hostRows: [
      { label: "Page status", value: "Live", note: "Ready to share" },
      { label: "Guest link", value: "Copy", note: "Mobile optimized" },
      { label: "Latest edit", value: "Saved", note: "Parking note added" },
    ],
    timeline: [
      {
        label: "Ava opened the invitation",
        detail: "Viewed artwork, time, and the garden address",
        status: "Live",
        tone: "live",
      },
      {
        label: "Calendar save is available",
        detail: "Guests can keep the plan without another message",
        status: "Ready",
        tone: "ready",
      },
      {
        label: "Directions stay attached",
        detail: "Map action sits with the invitation, not in a separate thread",
        status: "Pinned",
        tone: "ready",
      },
    ],
    flowSteps: [
      { title: "Guest sees the invite", detail: "The event opens as a polished page." },
      { title: "Guest saves the plan", detail: "Calendar and map actions are already there." },
      { title: "Host edits once", detail: "The shared link stays current." },
    ],
    theme: {
      canvasClass: "bg-[#181913]",
      glowClass:
        "bg-[radial-gradient(circle_at_22%_24%,rgba(215,197,165,0.2),transparent_34%),radial-gradient(circle_at_86%_68%,rgba(122,143,118,0.22),transparent_38%)]",
      accentTextClass: "text-[#e2c891]",
      guestFrameClass: "border-[#5a4c36]/70 bg-[#2b2a20]/86",
      hostFrameClass: "border-[#e5d7bd] bg-[#fffdf7]",
      primaryButtonClass: "bg-[#5a6f4c] text-white",
      secondaryButtonClass: "border-[#d7c5a5] text-[#4d563b]",
      stepCardClass: "border-[#5a4c36]/60 bg-[#26251d]/82",
    },
  },
  rsvp: {
    eyebrow: "RSVP flow",
    title: "The next scene scrolls into RSVP, with reply state built into the page.",
    description:
      "Guests move from the invite into yes, no, maybe, headcount, and notes. The host view updates as replies come in.",
    image: "/images/landing/guest-flow/rsvp-table-placeholder.webp",
    imageAlt: "Generated RSVP response table placeholder",
    eventEyebrow: "RSVP table",
    eventTitle: "Replies in one live table",
    eventDescription: "Yes, no, maybe, meal notes, and pending guests update as guests reply.",
    metricValue: "42",
    metricLabel: "attending",
    metricNote: "19 pending guests are ready for follow-up.",
    primaryCta: "RSVP now",
    secondaryCta: "Add note",
    proofPills: ["Yes, no, maybe", "Guest count", "Host ledger"],
    guestLines: ["Yes, no, maybe", "Guest count", "Dietary notes"],
    hostRows: [
      { label: "Invited", value: "64", note: "Guest list" },
      { label: "Attending", value: "42", note: "Confirmed replies" },
      { label: "Pending", value: "19", note: "Needs follow-up" },
    ],
    timeline: [
      {
        label: "Maya Patel replied yes",
        detail: "2 guests plus a vegetarian meal note",
        status: "New",
        tone: "live",
      },
      {
        label: "Jordan Lee is pending",
        detail: "Follow-up can be handled from the host view",
        status: "Pending",
        tone: "attention",
      },
      {
        label: "Nora Chen replied no",
        detail: "Response retained with the hosted event",
        status: "Filed",
        tone: "ready",
      },
    ],
    flowSteps: [
      { title: "Guest taps RSVP", detail: "Reply options sit directly under event context." },
      { title: "Notes stay attached", detail: "Meal notes and guest count travel with the reply." },
      { title: "Host sees status", detail: "Pending guests are visible without a spreadsheet." },
    ],
    theme: {
      canvasClass: "bg-[#111820]",
      glowClass:
        "bg-[radial-gradient(circle_at_20%_30%,rgba(91,141,149,0.24),transparent_36%),radial-gradient(circle_at_82%_64%,rgba(67,39,63,0.28),transparent_42%)]",
      accentTextClass: "text-[#aad0ce]",
      guestFrameClass: "border-[#4d6f75]/70 bg-[#1d2a31]/88",
      hostFrameClass: "border-[#c8dbda] bg-[#fbffff]",
      primaryButtonClass: "bg-[#315f68] text-white",
      secondaryButtonClass: "border-[#b8d2d0] text-[#284c54]",
      stepCardClass: "border-[#3c5e65]/70 bg-[#1a252c]/84",
    },
  },
  registry: {
    eyebrow: "Baby shower registry",
    title: "A baby shower gets its own registry scene, with softer copy and gift context.",
    description:
      "Registry, diaper fund, and book notes feel native to the shower page instead of pasted on as plain links.",
    image: "/images/landing/template-proof/sunny-sprout-baby-shower.webp",
    imageAlt: "Sunny Sprout Baby Shower event page preview",
    eventEyebrow: "Baby shower",
    eventTitle: "Sunny Sprout Baby Shower",
    eventDescription: "Sweet shower details, registry links, and notes for welcoming baby.",
    metricValue: "3",
    metricLabel: "gift options",
    metricNote: "Babylist, diaper fund, and book note stay in the same guest flow.",
    primaryCta: "View registry",
    secondaryCta: "Send gift",
    proofPills: ["Babylist", "Diaper fund", "Book note"],
    guestLines: ["Babylist registry", "Diaper fund", "Bring a book note"],
    hostRows: [
      { label: "Babylist", value: "Open", note: "Primary registry" },
      { label: "Diaper fund", value: "Active", note: "Optional contribution" },
      { label: "Book note", value: "Pinned", note: "Bring a favorite story" },
    ],
    timeline: [
      {
        label: "Babylist opened",
        detail: "Gift link launched from the shower page",
        status: "Live",
        tone: "live",
      },
      {
        label: "Diaper fund is active",
        detail: "Optional contribution sits beside the registry",
        status: "Ready",
        tone: "ready",
      },
      {
        label: "Book note pinned",
        detail: "Guests see the host's gift guidance before checkout",
        status: "Pinned",
        tone: "ready",
      },
    ],
    flowSteps: [
      { title: "Guest sees shower details", detail: "The registry appears in the baby shower context." },
      { title: "Guest chooses gift path", detail: "Gift list, fund, and notes are all visible." },
      { title: "Host keeps guidance current", detail: "The page can be updated after sharing." },
    ],
    theme: {
      canvasClass: "bg-[#201822]",
      glowClass:
        "bg-[radial-gradient(circle_at_20%_28%,rgba(244,190,164,0.26),transparent_36%),radial-gradient(circle_at_82%_62%,rgba(177,205,193,0.26),transparent_42%)]",
      accentTextClass: "text-[#f2c4aa]",
      guestFrameClass: "border-[#6d4e62]/70 bg-[#302333]/88",
      hostFrameClass: "border-[#f0d6c8] bg-[#fffaf7]",
      primaryButtonClass: "bg-[#9d6b75] text-white",
      secondaryButtonClass: "border-[#edc9b8] text-[#7a4d58]",
      stepCardClass: "border-[#6d4e62]/70 bg-[#2b202e]/84",
    },
  },
  signup: {
    eyebrow: "Smart sign-up",
    title: "The final scene turns open needs into clear claimed slots.",
    description:
      "For school days, teams, and community plans, guests can claim supplies or shifts from the same event page.",
    image: "/images/landing/template-proof/brightworks-museum-day.webp",
    imageAlt: "BrightWorks Museum Day event page preview",
    eventEyebrow: "School event",
    eventTitle: "BrightWorks Museum Day",
    eventDescription: "Parent helpers, supply needs, and arrival notes in one school event page.",
    metricValue: "7/10",
    metricLabel: "slots claimed",
    metricNote: "Open needs stay visible until the host has coverage.",
    primaryCta: "Claim slot",
    secondaryCta: "See needs",
    proofPills: ["Supply list", "Volunteer shifts", "Capacity state"],
    guestLines: ["Snack packs", "Bus check-in", "Museum guides"],
    hostRows: [
      { label: "Snack packs", value: "Full", note: "4 of 4 claimed" },
      { label: "Bus check-in", value: "Open", note: "2 of 3 claimed" },
      { label: "Museum guides", value: "Open", note: "1 of 3 claimed" },
    ],
    timeline: [
      {
        label: "Priya claimed snack packs",
        detail: "Capacity updated automatically",
        status: "New",
        tone: "live",
      },
      {
        label: "Bus check-in still needs one",
        detail: "Open slots stay visible from the shared link",
        status: "Open",
        tone: "attention",
      },
      {
        label: "Snack packs are full",
        detail: "Guests see the closed state before claiming",
        status: "Full",
        tone: "ready",
      },
    ],
    flowSteps: [
      { title: "Guest opens needs", detail: "Slots appear inside the event page." },
      { title: "Guest claims one", detail: "Capacity updates without a separate form." },
      { title: "Host sees coverage", detail: "Open needs can be reshared quickly." },
    ],
    theme: {
      canvasClass: "bg-[#11191d]",
      glowClass:
        "bg-[radial-gradient(circle_at_20%_30%,rgba(63,126,141,0.25),transparent_36%),radial-gradient(circle_at_82%_66%,rgba(215,197,165,0.2),transparent_42%)]",
      accentTextClass: "text-[#a9d8dc]",
      guestFrameClass: "border-[#3f6f78]/70 bg-[#1b2a2f]/88",
      hostFrameClass: "border-[#bdd7dc] bg-[#f8feff]",
      primaryButtonClass: "bg-[#2f6570] text-white",
      secondaryButtonClass: "border-[#b5d3d8] text-[#285a63]",
      stepCardClass: "border-[#3f6f78]/70 bg-[#18262b]/84",
    },
  },
};

const trustProofItems = [
  "Guests can use shared event pages in the browser, with no app install required.",
  "Hosts can keep the shared link current after the first send.",
  "RSVP replies, pending guests, and sign-up claims stay visible in the host experience.",
  "The template proof carousel uses unique event concepts and artwork instead of recycled examples.",
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

function getGuestActionToneClass(tone: GuestActionTone) {
  if (tone === "attention") return "bg-[#fff2d8] text-[#8b5c1f] ring-[#f2d59a]";
  if (tone === "live") return "bg-[#eaf4ee] text-[#315f52] ring-[#b8d2bf]";
  return "bg-[#eef1e9] text-[#4d5d43] ring-[#cdd8c6]";
}

function GuestActionPreview({ activeAction }: { activeAction: GuestActionId }) {
  const config = guestActionPreviewConfigs[activeAction];
  const currentAction =
    guestActionSlides.find((action) => action.id === activeAction) || guestActionSlides[0];
  const Icon = currentAction.icon;

  return (
    <div
      className={cx(
        "relative flex min-h-[44rem] flex-1 flex-col overflow-hidden px-4 pb-5 pt-[calc(6rem+env(safe-area-inset-top))] text-white sm:px-6 sm:pt-[calc(6.5rem+env(safe-area-inset-top))] lg:min-h-[100svh] lg:px-8 lg:pt-[calc(7rem+env(safe-area-inset-top))] xl:px-10",
        config.theme.canvasClass,
      )}
    >
      <div className={cx("absolute inset-0", config.theme.glowClass)} />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40" />
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(240,213,143,0.72),transparent)]" />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeAction}
          initial={{ opacity: 0, x: 34 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -34 }}
          transition={{ duration: 0.42, ease: "easeOut" }}
          className="relative flex flex-1 flex-col"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p
                className={cx(
                  "text-[10px] font-bold uppercase tracking-[0.2em]",
                  config.theme.accentTextClass,
                )}
              >
                Live guest flow
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-white" style={{ color: "#fff" }}>
                {config.eyebrow}
              </h3>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {config.proofPills.map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-white/12 bg-white/[0.07] px-4 py-3"
                >
                  <p className="text-xs font-semibold text-white">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 grid flex-1 gap-5 xl:grid-cols-[minmax(18rem,0.72fr)_minmax(34rem,1.38fr)] xl:items-center">
            <div
              className={cx(
                "rounded-lg border p-4 shadow-[0_24px_70px_rgba(0,0,0,0.22)] backdrop-blur xl:max-w-md",
                config.theme.guestFrameClass,
              )}
            >
              <div className="flex items-center justify-between gap-3 pb-4">
                <div>
                  <p
                    className={cx(
                      "text-[10px] font-bold uppercase tracking-[0.2em]",
                      config.theme.accentTextClass,
                    )}
                  >
                    Guest page
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white" style={{ color: "#fff" }}>
                    {currentAction.label}
                  </h3>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-[#201a23]">
                  <Icon className="h-5 w-5" />
                </span>
              </div>

              <div className="overflow-hidden rounded-lg bg-[#fcfbf7] text-[#201a23] shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
                <img
                  src={config.image}
                  alt={config.imageAlt}
                  className="aspect-[16/10] w-full object-cover object-top"
                />
                <div className="p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9d7a3e]">
                    {config.eventEyebrow}
                  </p>
                  <h4
                    className="mt-2 text-2xl font-light leading-tight"
                    style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                  >
                    {config.eventTitle}
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-[#665d68]">
                    {config.eventDescription}
                  </p>
                  <div className="mt-4 grid gap-2">
                    {config.guestLines.map((line) => (
                      <div
                        key={line}
                        className="flex items-center justify-between gap-3 rounded-md border border-[#e8dcc8] bg-white px-3 py-2"
                      >
                        <span className="text-xs font-semibold text-[#403744]">{line}</span>
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-[#7a8f76]" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className={cx(
                        "inline-flex h-10 items-center justify-center rounded-md px-3 text-xs font-bold uppercase tracking-[0.12em]",
                        config.theme.primaryButtonClass,
                      )}
                    >
                      {config.primaryCta}
                    </button>
                    <button
                      type="button"
                      className={cx(
                        "inline-flex h-10 items-center justify-center rounded-md border px-3 text-xs font-bold uppercase tracking-[0.12em]",
                        config.theme.secondaryButtonClass,
                      )}
                    >
                      {config.secondaryCta}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-5">
              <div
                className={cx(
                  "rounded-lg border p-5 text-[#201a23] shadow-[0_24px_70px_rgba(0,0,0,0.2)] sm:p-6 xl:p-7",
                  config.theme.hostFrameClass,
                )}
              >
                <div className="grid gap-5 lg:grid-cols-[1fr_12rem] lg:items-start">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9d7a3e]">
                      Host control
                    </p>
                    <h3 className="mt-2 max-w-2xl text-3xl font-semibold leading-tight text-[#201a23] xl:text-4xl">
                      {config.title}
                    </h3>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-[#665d68] sm:text-base">
                      {config.description}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#e1d6c2] bg-white p-4">
                    <p className="text-4xl font-light text-[#201a23]">{config.metricValue}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7b6f52]">
                      {config.metricLabel}
                    </p>
                    <p className="mt-3 text-xs leading-5 text-[#665d68]">{config.metricNote}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
                <div className="grid gap-3">
                  {config.hostRows.map((row) => (
                    <div
                      key={row.label}
                      className="rounded-lg border border-[#e8dcc8] bg-white p-4"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7b6f52]">
                        {row.label}
                      </p>
                      <div className="mt-2 flex items-end justify-between gap-3">
                        <p className="text-2xl font-semibold text-[#201a23]">{row.value}</p>
                        <p className="text-xs leading-5 text-[#665d68]">{row.note}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="overflow-hidden rounded-lg border border-[#e1d6c2] bg-white">
                  <p className="px-4 pt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#9d7a3e]">
                    Response timeline
                  </p>
                  <div className="mt-3">
                    {config.timeline.map((item) => (
                      <div
                        key={item.label}
                        className="grid gap-3 border-t border-[#f0e8d9] p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[#201a23]">{item.label}</p>
                          <p className="mt-1 text-xs leading-5 text-[#665d68]">{item.detail}</p>
                        </div>
                        <span
                          className={cx(
                            "inline-flex w-fit items-center rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ring-1",
                            getGuestActionToneClass(item.tone),
                          )}
                        >
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 rounded-lg border border-white/12 bg-white/[0.07] p-3 backdrop-blur md:grid-cols-3">
                {config.flowSteps.map((step) => (
                  <div
                    key={step.title}
                    className={cx("rounded-md border px-4 py-3", config.theme.stepCardClass)}
                  >
                    <p className="text-sm font-semibold text-white">{step.title}</p>
                    <p className="mt-1 text-xs leading-5 text-white/62">{step.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function GuestActionSuite() {
  const [activeActionIndex, setActiveActionIndex] = useState(0);
  const activeAction = (guestActionSlides[activeActionIndex] || guestActionSlides[0]).id;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const interval = window.setInterval(() => {
      setActiveActionIndex((index) => (index + 1) % guestActionSlides.length);
    }, 7200);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section
      id="guest-flow"
      className={cx(
        landingViewportSectionClass,
        "scroll-mt-0 overflow-hidden border-y border-[#2e2432] bg-[#201a23] text-white",
      )}
    >
      <div className="grid min-h-[100svh] w-full lg:grid-cols-[minmax(22rem,34vw)_minmax(0,1fr)]">
        <div className="flex flex-col justify-center px-4 pb-16 pt-[calc(6rem+env(safe-area-inset-top))] sm:px-8 sm:pt-[calc(6.5rem+env(safe-area-inset-top))] lg:px-10 lg:pb-20 lg:pt-[calc(7rem+env(safe-area-inset-top))] xl:px-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#f0d58f]">
            Guest actions
          </p>
          <h2
            className="mt-4 max-w-2xl text-4xl font-light leading-tight text-white sm:text-5xl xl:text-6xl"
            style={{ color: "#fff", fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Turn every event page into the place guests actually act.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-8 text-white/74">
            RSVP, registry, map, calendar, and sign-up moments feel like one premium guest journey,
            while hosts keep a clean command center behind the scenes.
          </p>

          <div
            className="mt-6 flex items-center gap-2"
            role="group"
            aria-label="Guest action carousel"
          >
            {guestActionSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveActionIndex(index)}
                aria-label={`Show ${slide.label}`}
                aria-pressed={index === activeActionIndex}
                className={cx(
                  "h-2.5 rounded-full transition-all",
                  index === activeActionIndex
                    ? "w-10 bg-[#f0d58f]"
                    : "w-2.5 bg-white/22 hover:bg-white/48",
                )}
              />
            ))}
          </div>

          <div className="mt-8 border-y border-white/14 py-5">
            <dl className="grid gap-5">
              {guestActionProofStats.map((stat, index) => (
                <div key={stat.value} className="grid grid-cols-[3.5rem_1fr] gap-4">
                  <dt className="relative flex h-12 w-12 items-center justify-center">
                    <span className="absolute inset-0 rounded-full border border-[#f0d58f]/36 bg-[#f0d58f]/10 shadow-[0_0_30px_rgba(240,213,143,0.14)]" />
                    <span className="relative text-[10px] font-bold uppercase tracking-[0.18em] text-[#f0d58f]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </dt>
                  <dd className="min-w-0 border-b border-white/10 pb-5 last:border-b-0 last:pb-0">
                    <p className="text-2xl font-semibold leading-none text-white">{stat.value}</p>
                    <p className="mt-2 text-sm leading-6 text-white/64">{stat.label}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="flex min-w-0 border-t border-white/10 lg:border-l lg:border-t-0">
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

          <FeatureCarousel
            features={templateCarouselFeatures}
            className="mt-10"
            accentColor="#6f8f7b"
            statusLabel="Template proof"
          />
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
