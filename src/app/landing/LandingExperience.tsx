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
import GuestChatWidget from "@/components/guest-chat/GuestChatWidget";
import LandingLiveCardShowcase from "@/components/landing/LandingLiveCardShowcase";
import HeroTopNav from "@/components/navigation/HeroTopNav";
import {
  Testimonial as DesignTestimonial,
  type TestimonialItem,
} from "@/components/ui/design-testimonial";
import FeatureCarousel, { type FeatureCarouselItem } from "@/components/ui/feature-carousel";
import AIConciergeSection from "./sections/AIConciergeSection";

const landingFlowSectionClass = "";
const landingFlowInnerClass = "";
const landingViewportSectionClass = "flex min-h-[100svh] flex-col justify-center";

const landingHeroNavLinks = [
  { label: "Concierge", href: "#concierge" },
  { label: "Examples", href: "#showcase" },
  { label: "Guest Flow", href: "#guest-flow" },
  { label: "Templates", href: "#examples" },
  { label: "Start", href: "#creation-paths" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "About us", href: "/about" },
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
  mobilePrimaryCtaLabel?: string;
};

const templateProofTiles: ProofTile[] = [
  {
    eyebrow: "Wedding",
    title: "Willow Garden Wedding",
    image: "/images/landing/template-proof/generated/wedding.webp",
    note: "A polished wedding page keeps RSVP, registry, schedule, and venue notes together.",
  },
  {
    eyebrow: "Football Night",
    title: "Friday Night Lights",
    image: "/images/landing/template-proof/generated/football-night.webp",
    note: "Families get kickoff time, venue, team updates, and map details from one live link.",
  },
  {
    eyebrow: "Field Trip",
    title: "Lincoln Discovery Day",
    image: "/images/landing/template-proof/generated/field-trip.webp",
    note: "Parents can reopen the itinerary, arrival notes, reminders, and chaperone details.",
  },
  {
    eyebrow: "Graduation Party",
    title: "Caps Off Celebration",
    image: "/images/landing/template-proof/generated/graduation-party.webp",
    note: "Share ceremony timing, party address, RSVP, gift notes, and photo details in one place.",
  },
  {
    eyebrow: "Engagement Party",
    title: "Rooftop Engagement Toast",
    image: "/images/landing/template-proof/generated/engagement-party.webp",
    note: "Guests see the celebration details, dress note, RSVP, and registry guidance together.",
  },
  {
    eyebrow: "Gender Reveal",
    title: "Little Spark Reveal",
    image: "/images/landing/template-proof/generated/gender-reveal.webp",
    note: "Keep reveal timing, host notes, gift guidance, and attendance replies easy to find.",
  },
  {
    eyebrow: "Housewarming",
    title: "Maple Loft Housewarming",
    image: "/images/landing/template-proof/generated/housewarming.webp",
    note: "Address, parking, arrival window, RSVP, and host updates stay ready for every guest.",
  },
  {
    eyebrow: "Retirement Party",
    title: "Golden Hour Sendoff",
    image: "/images/landing/template-proof/generated/retirement-party.webp",
    note: "Coordinate tributes, dinner timing, guest replies, and memory-sharing details.",
  },
  {
    eyebrow: "Anniversary Party",
    title: "Silver Garden Anniversary",
    image: "/images/landing/template-proof/generated/anniversary-party.webp",
    note: "A single invitation page carries RSVP, dinner notes, timeline, and celebration details.",
  },
  {
    eyebrow: "Pool Party",
    title: "Blue Splash Pool Party",
    image: "/images/landing/template-proof/generated/pool-party.webp",
    note: "Share swim timing, what to bring, supervision notes, snacks, and RSVP from one link.",
  },
  {
    eyebrow: "Movie Night",
    title: "Backyard Movie Night",
    image: "/images/landing/template-proof/generated/movie-night.webp",
    note: "Guests get start time, movie vote, seating notes, snack sign-ups, and directions.",
  },
  {
    eyebrow: "Playdate",
    title: "Sunny Park Playdate",
    image: "/images/landing/template-proof/generated/playdate.webp",
    note: "Parents can check location, age notes, snack needs, weather updates, and RSVP.",
  },
  {
    eyebrow: "Kids Sleepover",
    title: "Starlight Kids Sleepover",
    image: "/images/landing/template-proof/generated/kids-sleepover.webp",
    note: "Pack lists, pickup time, allergy notes, parent contacts, and replies stay organized.",
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
    mobilePrimaryCtaLabel: "Create invite",
  },
  {
    id: "garden-vows",
    eyebrow: "Wedding weekend",
    title: "Wedding details, beautifully shared.",
    description: "Schedule, registry, RSVP, and travel notes in one polished page.",
    image: "/images/landing/hero/garden-vows-mobile.webp",
    desktopImage: "/images/landing/hero/garden-vows-desktop.webp",
    imageAlt: "Wedding weekend event page preview",
    mobilePrimaryCtaLabel: "Create wedding",
  },
  {
    id: "school-trip",
    eyebrow: "School event",
    title: "Plans families can open again.",
    description: "Itinerary, map, reminders, and parent updates without the thread hunt.",
    image: "/images/landing/hero/lincoln-discovery-mobile.webp",
    desktopImage: "/images/landing/hero/lincoln-discovery-desktop.webp",
    imageAlt: "School field trip event page preview",
    mobilePrimaryCtaLabel: "Create trip",
  },
  {
    id: "team-weekend",
    eyebrow: "Team schedule",
    title: "Every game-day detail, current.",
    description: "Schedules, venues, reminders, and helper needs travel together.",
    image: "/images/landing/hero/friday-night-lights-mobile.webp",
    desktopImage: "/images/landing/hero/friday-night-lights-desktop.webp",
    imageAlt: "Team schedule event page preview",
    mobilePrimaryCtaLabel: "Create schedule",
  },
  {
    id: "birthday-party",
    eyebrow: "Birthday",
    title: "A party link guests can use.",
    description: "RSVPs, gift notes, timing, and directions stay ready for every parent.",
    image: "/images/landing/hero/birthday-dino-mobile.webp",
    desktopImage: "/images/landing/hero/birthday-dino-desktop.webp",
    imageAlt: "Birthday party event page preview",
    mobilePrimaryCtaLabel: "Create party",
  },
  {
    id: "baby-shower",
    eyebrow: "Baby shower",
    title: "Sweet details, beautifully organized.",
    description: "Registry links, RSVP, schedule, and host notes live beside the invitation.",
    image: "/images/landing/hero/baby-shower-mobile.webp",
    desktopImage: "/images/landing/hero/baby-shower-desktop.webp",
    imageAlt: "Baby shower event page preview",
    mobilePrimaryCtaLabel: "Create shower",
  },
  {
    id: "open-house",
    eyebrow: "Open house",
    title: "A warm welcome in one link.",
    description: "Share time, address, updates, and RSVP without another message chain.",
    image: "/images/landing/hero/open-house-mobile.webp",
    desktopImage: "/images/landing/hero/open-house-desktop.webp",
    imageAlt: "Open house event page preview",
    mobilePrimaryCtaLabel: "Let's create",
  },
] as const;

const guestActionSlides = [
  {
    id: "invite",
    label: "Invite",
    icon: Sparkles,
    title: "A full invite view first, not a generic action grid.",
    description: "Open with a polished event page guests can read, save, and come back to.",
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
      {
        title: "Guest sees shower details",
        detail: "The registry appears in the baby shower context.",
      },
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

const guestTestimonials: TestimonialItem[] = [
  {
    quote:
      "I opened the link from my phone and had the RSVP, map, and gift note in one place. I did not have to dig through old texts before leaving.",
    company: "Wedding page",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&h=200&fit=crop&crop=faces",
    author: "Mia Thompson",
    role: "Wedding guest",
  },
  {
    quote:
      "The reminder had the arrival time and parking note right there. It felt like the host had already answered the question I was about to send.",
    company: "Team reminders",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&h=200&fit=crop&crop=faces",
    author: "Daniel Brooks",
    role: "Team parent",
  },
  {
    quote:
      "For the baby shower, the registry, food note, and RSVP were easy to reopen. I sent the same link to my sister and she was set too.",
    company: "Baby shower",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&h=200&fit=crop&crop=faces",
    author: "Leila Carter",
    role: "Shower guest",
  },
  {
    quote:
      "The potluck sign-up showed what was already covered, so I could claim dessert without another group chat. The page stayed current all week.",
    company: "Sign-up claims",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&h=200&fit=crop&crop=faces",
    author: "Marcus Reed",
    role: "Birthday guest",
  },
  {
    quote:
      "I scanned the school invite once and Envitefy kept the date, address, and pickup details handy until the field trip morning.",
    company: "School invite",
    image:
      "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?q=80&w=200&h=200&fit=crop&crop=faces",
    author: "Sophie Nguyen",
    role: "School parent",
  },
  {
    quote:
      "The housewarming page had the address, gate code, and what to bring. I could check it from the car without searching my inbox.",
    company: "Housewarming",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&h=200&fit=crop&crop=faces",
    author: "Elena Ruiz",
    role: "Housewarming guest",
  },
  {
    quote:
      "The rehearsal dinner link had the timing, menu note, and rideshare address ready. I sent it to my partner instead of forwarding three separate texts.",
    company: "Rehearsal dinner",
    image:
      "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?q=80&w=200&h=200&fit=crop&crop=faces",
    author: "Harper Wells",
    role: "Wedding weekend guest",
  },
  {
    quote:
      "Our tournament invite kept the field number, snack rotation, and weather update in one place. I checked it twice from the parking lot.",
    company: "Tournament day",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&h=200&fit=crop&crop=faces",
    author: "Owen Mitchell",
    role: "Sports parent",
  },
  {
    quote:
      "The graduation party page made the ceremony time, dinner address, and photo note easy to find. Nobody had to resend the details.",
    company: "Graduation party",
    image:
      "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=200&h=200&fit=crop&crop=faces",
    author: "Avery Collins",
    role: "Family guest",
  },
  {
    quote:
      "For the neighborhood movie night, I could see the start time, blanket note, and snack sign-up without opening a spreadsheet.",
    company: "Movie night",
    image:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=200&h=200&fit=crop&crop=faces",
    author: "Nina Brooks",
    role: "Community guest",
  },
  {
    quote:
      "The pool party invite answered the swimsuit, towel, and pickup questions before I asked. It was simple enough to reopen at the door.",
    company: "Pool party",
    image:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=200&h=200&fit=crop&crop=faces",
    author: "Caleb Stone",
    role: "Parent guest",
  },
  {
    quote:
      "The open house page had the address, tour window, and contact button together. I did not have to hunt through the listing email.",
    company: "Open house",
    image:
      "https://images.unsplash.com/photo-1546961329-78bef0414d7c?q=80&w=200&h=200&fit=crop&crop=faces",
    author: "Riley Quinn",
    role: "Open house guest",
  },
];

const hostTestimonials: TestimonialItem[] = [
  {
    quote:
      "Concierge gave me a polished first draft from a messy note. I changed the time, added gift links, and shared the page the same night.",
    company: "Concierge draft",
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=200&h=200&fit=crop&crop=faces",
    author: "Aisha Martin",
    role: "Birthday host",
  },
  {
    quote:
      "I could see replies and open sign-up spots without maintaining a spreadsheet. When plans changed, one update fixed the link for everyone.",
    company: "Team planning",
    image:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&h=200&fit=crop&crop=faces",
    author: "Ben Holloway",
    role: "Team organizer",
  },
  {
    quote:
      "The wedding page kept RSVP, hotel notes, registry, and weekend schedule together. Fewer repeat questions came back to us.",
    company: "Wedding hub",
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&h=200&fit=crop&crop=faces",
    author: "Priya Shah",
    role: "Wedding planner",
  },
  {
    quote:
      "Uploading the flyer saved the basic event details, then I turned it into a page parents could use on their phones.",
    company: "Flyer upload",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&h=200&fit=crop&crop=faces",
    author: "Jordan Lee",
    role: "School coordinator",
  },
  {
    quote:
      "For our shower, Envitefy kept the guest list, gift notes, and helper tasks together. I stopped sending separate follow-up messages.",
    company: "Shower planning",
    image:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=200&h=200&fit=crop&crop=faces",
    author: "Camille Torres",
    role: "Baby shower host",
  },
  {
    quote:
      "Our community dinner changed rooms twice, but the same invite page stayed accurate. People checked the link instead of texting me.",
    company: "Community dinner",
    image:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=200&h=200&fit=crop&crop=faces",
    author: "Nora Patel",
    role: "Community host",
  },
  {
    quote:
      "I used the same page for the rehearsal dinner and welcome drinks. Updating the schedule once kept both families aligned.",
    company: "Wedding weekend",
    image:
      "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=200&h=200&fit=crop&crop=faces",
    author: "Theo Bennett",
    role: "Wedding host",
  },
  {
    quote:
      "For soccer playoffs, the invite became our hub for kickoff changes, snack duty, and directions. Parents stopped asking for the latest version.",
    company: "Soccer playoffs",
    image:
      "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=200&h=200&fit=crop&crop=faces",
    author: "Maya Johnson",
    role: "Team manager",
  },
  {
    quote:
      "The graduation event was easy to publish and easier to revise. I added parking notes after sharing and everyone still had the right link.",
    company: "Graduation host",
    image:
      "https://images.unsplash.com/photo-1530268729831-4b0b9e170218?q=80&w=200&h=200&fit=crop&crop=faces",
    author: "Elliot Park",
    role: "Graduation host",
  },
  {
    quote:
      "Our movie night needed RSVPs, snack claims, and a rain plan. Envitefy kept the page polished without making it feel like work.",
    company: "Movie night",
    image:
      "https://images.unsplash.com/photo-1521119989659-a83eee488004?q=80&w=200&h=200&fit=crop&crop=faces",
    author: "Sienna Moore",
    role: "Neighborhood host",
  },
  {
    quote:
      "I added swim notes, allergy reminders, and pickup timing in one pass. The pool party link became the only message I needed to send.",
    company: "Pool party",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&h=200&fit=crop&crop=faces",
    author: "Liam Carter",
    role: "Birthday host",
  },
  {
    quote:
      "For the open house, I could share a clean page with tour windows, map details, and follow-up links. It felt much more complete than a flyer.",
    company: "Open house",
    image:
      "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?q=80&w=200&h=200&fit=crop&crop=faces",
    author: "Isla Morgan",
    role: "Open house host",
  },
];

function interleaveTestimonials(first: TestimonialItem[], second: TestimonialItem[]) {
  const merged: TestimonialItem[] = [];
  const maxLength = Math.max(first.length, second.length);

  for (let index = 0; index < maxLength; index += 1) {
    const firstItem = first[index];
    const secondItem = second[index];

    if (firstItem) merged.push(firstItem);
    if (secondItem) merged.push(secondItem);
  }

  return merged;
}

const landingTestimonials: TestimonialItem[] = interleaveTestimonials(
  guestTestimonials,
  hostTestimonials,
);

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

function HeroProductCarousel({ onPrimaryAction }: { onPrimaryAction: () => void }) {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const activeSlide = heroProductSlides[activeSlideIndex] ?? heroProductSlides[0];

  useEffect(() => {
    if (typeof window === "undefined") return;

    const imageSources = new Set<string>();
    for (const slide of heroProductSlides) {
      imageSources.add(slide.desktopImage);
      imageSources.add(slide.image);
    }

    for (const src of imageSources) {
      const preloadedImage = new window.Image();
      preloadedImage.decoding = "async";
      preloadedImage.src = src;
    }
  }, []);

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
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={activeSlide.id}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.005 }}
          transition={{ duration: 0.32, ease: "easeOut" }}
          className="pointer-events-none absolute inset-0 z-0"
        >
          <Image
            src={activeSlide.desktopImage}
            alt={activeSlide.imageAlt}
            fill
            priority={activeSlideIndex === 0}
            unoptimized
            sizes="100vw"
            className="hidden object-cover object-center md:block"
          />
          <Image
            src={activeSlide.image}
            alt={activeSlide.imageAlt}
            fill
            priority={activeSlideIndex === 0}
            unoptimized
            sizes="100vw"
            className="object-cover md:hidden"
            style={{ objectPosition: activeSlide.imagePosition ?? "center" }}
          />
        </motion.div>
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(18,15,20,0.66)_0%,rgba(18,15,20,0.42)_40%,rgba(18,15,20,0.18)_100%)]" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(0deg,rgba(18,15,20,0.46)_0%,rgba(18,15,20,0.04)_44%,rgba(18,15,20,0.22)_100%)]" />

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
            <div className="mt-9 flex flex-row gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onPrimaryAction}
                className="inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md border border-white/18 bg-white/14 px-3 text-[13px] font-semibold text-white shadow-[0_18px_44px_rgba(0,0,0,0.24)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/22 sm:flex-none sm:gap-2 sm:px-6 sm:text-sm"
              >
                <span className="truncate sm:hidden">
                  {activeSlide.mobilePrimaryCtaLabel ?? "Let's create"}
                </span>
                <span className="hidden sm:inline">Let's create</span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </button>
              <Link
                href="#showcase"
                className="inline-flex h-12 min-w-0 flex-1 items-center justify-center rounded-md border border-white/18 bg-black/18 px-3 text-[13px] font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/14 sm:flex-none sm:px-6 sm:text-sm"
              >
                <span className="truncate sm:hidden">View examples</span>
                <span className="hidden sm:inline">View live examples</span>
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
            <ul
              className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:max-w-xl sm:justify-end"
              aria-label={`${currentAction.label} flow signals`}
            >
              {config.proofPills.map((item, index) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-xs font-semibold text-white/76"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/16 bg-white/[0.06] text-[9px] font-bold tracking-[0.12em] text-white shadow-[0_0_24px_rgba(255,255,255,0.08)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="whitespace-nowrap">{item}</span>
                  {index < config.proofPills.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="hidden h-px w-7 bg-[linear-gradient(90deg,rgba(255,255,255,0.34),transparent)] sm:block"
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 grid flex-1 items-stretch gap-5 xl:grid-cols-[minmax(22rem,0.86fr)_minmax(31rem,1.14fr)]">
            <div
              data-guest-flow-panel="guest"
              className={cx(
                "flex h-full min-h-0 flex-col rounded-lg border p-4 shadow-[0_24px_70px_rgba(0,0,0,0.22)] backdrop-blur xl:self-stretch",
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

              <div className="relative mx-auto flex aspect-[9/19.5] max-h-full w-full max-w-[21.5rem] flex-none flex-col rounded-[2.15rem] border border-white/14 bg-[#07070a] p-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_26px_70px_rgba(0,0,0,0.38)]">
                <span
                  aria-hidden="true"
                  className="absolute -left-1 top-[18%] h-12 w-1 rounded-l-full bg-[#15151a]"
                />
                <span
                  aria-hidden="true"
                  className="absolute -right-1 top-[26%] h-16 w-1 rounded-r-full bg-[#15151a]"
                />
                <div
                  aria-hidden="true"
                  className="absolute left-1/2 top-3.5 z-20 h-6 w-20 -translate-x-1/2 rounded-full bg-black shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]"
                />

                <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.65rem] bg-[#fcfbf7] text-[#201a23] shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
                  <img
                    src={config.image}
                    alt={config.imageAlt}
                    className="aspect-[16/10] w-full flex-none object-cover object-top"
                  />
                  <div className="flex flex-1 flex-col p-4">
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
            </div>

            <div
              data-guest-flow-panel="host"
              className={cx(
                "flex h-full min-h-0 flex-col overflow-hidden rounded-lg border p-5 text-[#201a23] shadow-[0_24px_70px_rgba(0,0,0,0.2)] sm:p-6 xl:p-7",
                config.theme.hostFrameClass,
              )}
            >
              <div className="grid gap-5 lg:grid-cols-[1fr_11rem] lg:items-start">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9d7a3e]">
                    Host control
                  </p>
                  <h3 className="mt-2 max-w-2xl text-3xl font-semibold leading-tight text-[#201a23] xl:text-[2.15rem]">
                    {config.title}
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#665d68]">
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

              <div className="mt-5 grid min-h-0 flex-1 gap-4 lg:grid-cols-[0.72fr_1.28fr]">
                <div className="grid content-start gap-3">
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

                <div className="min-h-0 overflow-hidden rounded-lg border border-[#e1d6c2] bg-white">
                  <p className="px-4 pt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#9d7a3e]">
                    Response timeline
                  </p>
                  <div className="mt-3 divide-y divide-[#f0e8d9]">
                    {config.timeline.map((item) => (
                      <div
                        key={item.label}
                        className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center"
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

              <div className="mt-4 grid gap-3 border-t border-[#eadfce] pt-4 md:grid-cols-3">
                {config.flowSteps.map((step) => (
                  <div
                    key={step.title}
                    className="rounded-md border border-[#e8dcc8] bg-[#fcfbf7] px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-[#201a23]">{step.title}</p>
                    <p className="mt-1 text-xs leading-5 text-[#665d68]">{step.detail}</p>
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

function GuestActionSuite({ onPrimaryAction }: { onPrimaryAction: () => void }) {
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
        <div className="flex flex-col justify-start px-4 pb-16 pt-[calc(6rem+env(safe-area-inset-top))] sm:px-8 sm:pt-[calc(6.5rem+env(safe-area-inset-top))] lg:px-10 lg:pb-20 lg:pt-[calc(7rem+env(safe-area-inset-top))] xl:px-14">
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

          <button
            type="button"
            onClick={onPrimaryAction}
            className="mt-6 inline-flex h-12 w-fit self-end items-center justify-center gap-2 rounded-md border border-[#f0d58f]/44 bg-[#f0d58f] px-6 text-sm font-semibold text-[#201a23] shadow-[0_18px_44px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f0d58f]"
          >
            Let's Envitefy
            <ArrowRight className="h-4 w-4" />
          </button>
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
      className={cx(
        landingFlowSectionClass,
        "flex min-h-[100svh] scroll-mt-0 flex-col border-b border-[#ded2bd] bg-[#fbf8f1] lg:h-[100svh] lg:overflow-hidden",
      )}
    >
      <div className="mx-auto flex min-h-[100svh] w-full max-w-none flex-1 flex-col justify-center px-4 pb-8 pt-[calc(7rem+env(safe-area-inset-top))] sm:px-6 sm:pb-10 sm:pt-[calc(7.5rem+env(safe-area-inset-top))] lg:h-full lg:min-h-0 lg:px-8 lg:pb-12 lg:pt-[calc(8rem+env(safe-area-inset-top))]">
        <div className="w-full">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9d7a3e]">
              Templates and proof
            </p>
          </div>

          <FeatureCarousel
            features={templateCarouselFeatures}
            className="mt-10 max-w-none"
            style={{ width: "min(100%, 112rem)" }}
            accentColor="#6f8f7b"
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
      className={cx(
        landingFlowSectionClass,
        "relative isolate min-h-[100svh] scroll-mt-0 overflow-hidden border-y border-[#2e2432] bg-[#201a23] text-white",
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-28"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(240,213,143,0.72),transparent)]"
      />

      <div className="relative flex min-h-[100svh] w-full flex-col justify-center px-4 pb-10 pt-[calc(9.25rem+env(safe-area-inset-top))] sm:px-8 sm:pb-12 sm:pt-[calc(7.75rem+env(safe-area-inset-top))] lg:px-10 lg:pb-14 lg:pt-[calc(8.25rem+env(safe-area-inset-top))]">
        <div className={landingFlowInnerClass}>
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#f0d58f]">
              Creation paths
            </p>
            <h2
              className="mt-4 text-4xl font-light leading-tight text-white sm:text-5xl"
              style={{ color: "#fff", fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              Start from Concierge or the file you already have.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/72">
              Hosting creates My events. Received birthday, wedding, gender reveal, and similar
              invite-card scans become Invited events.
            </p>
            <button
              id="upload"
              type="button"
              onClick={onPrimaryAction}
              className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-[#201a23] shadow-[0_18px_44px_rgba(0,0,0,0.2)] transition hover:-translate-y-0.5 hover:bg-[#43273f] hover:text-white"
            >
              Start your event
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {creationPaths.map((path, index) => {
              const Icon = path.icon;
              return (
                <article
                  key={path.title}
                  className="group relative overflow-hidden rounded-lg border border-white/14 bg-[#2d2732]/96 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)] backdrop-blur transition hover:-translate-y-0.5 hover:border-[#f0d58f]/48 hover:bg-[#332c38]/96 lg:p-4"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(240,213,143,0.72),transparent)] opacity-70" />
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-md border border-[#f0d58f]/28 bg-[#f0d58f]/10 text-[#f0d58f] shadow-[0_0_34px_rgba(240,213,143,0.12)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="rounded-md border border-white/14 bg-white/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/64">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f0d58f] lg:mt-4">
                    {path.badge}
                  </p>
                  <h3
                    className="mt-2 text-2xl font-semibold leading-tight text-white"
                    style={{ color: "#fff" }}
                  >
                    {path.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-white/68 lg:leading-6">
                    {path.description}
                  </p>
                  <ul className="mt-5 space-y-2 border-t border-white/10 pt-5 lg:mt-4 lg:pt-4">
                    {path.points.map((point) => (
                      <li key={point} className="flex gap-2 text-sm leading-6 text-white/78">
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#9bb792]" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsProof() {
  return (
    <section
      id="testimonials"
      className={cx(
        landingFlowSectionClass,
        "min-h-[100svh] scroll-mt-0 overflow-hidden border-b border-[#ded2bd] bg-[#fcfbf7]",
      )}
    >
      <div className="flex min-h-[100svh] w-full flex-col justify-center pb-12 pt-[calc(8.5rem+env(safe-area-inset-top))] sm:pb-16 sm:pt-[calc(7.5rem+env(safe-area-inset-top))] lg:pb-20 lg:pt-[calc(8rem+env(safe-area-inset-top))]">
        <div>
          <div className="mx-auto max-w-none px-4 text-center sm:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9d7a3e]">
              Guest and host feedback
            </p>
            <h2
              className="mt-3 whitespace-nowrap text-xl font-light leading-tight text-[#201a23] sm:text-4xl lg:text-5xl"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              What Guests and Hosts Are Saying
            </h2>
          </div>
          <DesignTestimonial
            testimonials={landingTestimonials}
            label="Testimonials"
            className="mt-8 bg-transparent"
          />
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
          primaryCtaLabel="Let's create"
          authenticatedPrimaryHref="/chat"
          variant="transparent-dark"
          loginSuccessRedirectUrl="/"
          onGuestLoginAction={() => openAuth("login")}
          onGuestPrimaryAction={() => openAuth("signup")}
        />

        <PremiumLandingHero onPrimaryAction={() => openAuth("signup")} />

        <AIConciergeSection onPrimaryAction={() => openAuth("signup")} />

        <section className="border-b border-[#ded2bd] bg-[#f8f3ea]">
          <LandingLiveCardShowcase
            eyebrow="Interactive proof"
            title="Live cards connected to real event details."
            description="Swipe through product-backed live cards for weddings, birthdays, showers, school events, team weekends, and hosted gatherings."
            tone="luxury"
          />
        </section>

        <GuestActionSuite onPrimaryAction={() => openAuth("signup")} />
        <TemplateGallery />
        <CreationPaths onPrimaryAction={() => openAuth("signup")} />
        <TestimonialsProof />
      </main>
      <GuestChatWidget />

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
