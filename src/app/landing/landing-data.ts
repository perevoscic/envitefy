import type { TestimonialItem } from "@/components/ui/design-testimonial";
import type { FeatureCarouselItem } from "@/components/ui/feature-carousel";
import { publicUseCasePrimaryNavLinks } from "@/config/navigation";

export type LandingIconId =
  | "clipboardList"
  | "gift"
  | "messageCircle"
  | "sparkles"
  | "ticketCheck"
  | "upload"
  | "users";

export const landingHeroNavLinks = [...publicUseCasePrimaryNavLinks];

const gardenBrunchLiveCardImage = "/images/landing/live-cards/madeline-s-garden-brunch.webp";

export type ProofTile = {
  title: string;
  eyebrow: string;
  image: string;
  note: string;
  href?: string;
};

export type HeroProductSlide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  desktopImage: string;
  imageAlt: string;
  imagePosition?: string;
  href?: string;
  secondaryCtaLabel?: string;
  mobilePrimaryCtaLabel?: string;
};

export const templateProofTiles: ProofTile[] = [
  {
    eyebrow: "Wedding",
    title: "Willow Garden Wedding",
    image: "/images/landing/template-proof/generated/wedding.webp",
    note: "A polished wedding page keeps RSVP, registry, schedule, and venue notes together.",
    href: "/weddings",
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
    href: "/gender-reveal",
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
    href: "/birthdays",
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

export const templateCarouselFeatures: FeatureCarouselItem[] = templateProofTiles.map((tile) => ({
  id: `${tile.eyebrow}-${tile.title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, ""),
  label: tile.eyebrow,
  image: tile.image,
  imageAlt: `${tile.title} example`,
  badge: tile.title,
  description: tile.note,
  href: tile.href,
}));

export const heroProductSlides: HeroProductSlide[] = [
  {
    id: "garden-brunch",
    eyebrow: "Live invitation",
    title: "Beautiful hosted events, from invite to RSVP.",
    description: "One elegant link for the invitation, RSVP, registry, map, and updates.",
    image: "/images/landing/hero/garden-brunch-mobile.webp",
    desktopImage: "/images/landing/hero/garden-brunch-desktop.webp",
    imageAlt: "Garden brunch live invitation card",
    href: "/weddings",
    secondaryCtaLabel: "View wedding pages",
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
    href: "/weddings",
    secondaryCtaLabel: "View wedding pages",
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
    href: "/birthdays",
    secondaryCtaLabel: "View birthday pages",
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
    href: "/baby-showers",
    secondaryCtaLabel: "View baby shower pages",
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

export const guestActionSlides = [
  {
    id: "invite",
    label: "Invite",
    icon: "sparkles",
    title: "A full invite view first, not a generic action grid.",
    description: "Open with a polished event page guests can read, save, and come back to.",
  },
  {
    id: "rsvp",
    label: "RSVP",
    icon: "ticketCheck",
    title: "Then the carousel moves guests into the RSVP moment.",
    description: "The reply flow gets its own copy, state, colors, and host-side ledger.",
  },
  {
    id: "registry",
    label: "Registry",
    icon: "gift",
    title: "A baby shower registry gets a softer, gift-focused scenario.",
    description: "Gift links, diaper fund, and host notes stay beside the shower details.",
  },
  {
    id: "signup",
    label: "Sign-up",
    icon: "clipboardList",
    title: "Finally, sign-up turns open needs into claimed slots.",
    description: "Supply lists, helpers, and capacity state live in the same event flow.",
  },
] as const;

export type GuestActionId = (typeof guestActionSlides)[number]["id"];

export type GuestActionTone = "attention" | "live" | "ready";

export type GuestActionPreviewConfig = {
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

export const guestActionProofStats = [
  { value: "1 link", label: "Invitation, details, and response actions stay together." },
  { value: "0 installs", label: "Guests act from the browser on mobile or desktop." },
  { value: "Live state", label: "Hosts see replies, claims, links, and updates in one place." },
] as const;

export const guestActionPreviewConfigs: Record<GuestActionId, GuestActionPreviewConfig> = {
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

export const landingTestimonials: TestimonialItem[] = interleaveTestimonials(
  guestTestimonials,
  hostTestimonials,
);

export const creationPaths = [
  {
    title: "Concierge",
    badge: "Fastest start",
    description:
      "Describe the gathering and let Envitefy draft the invitation, page, RSVP flow, registry notes, and sign-up needs.",
    points: ["Best when the plan is still loose", "Good for hosts who want a polished first draft"],
    icon: "messageCircle",
  },
  {
    title: "Bring what you have",
    badge: "My events",
    description:
      "Upload an invite, flyer, schedule, PDF, screenshot, or design direction when you are creating an event you host.",
    points: ["Best for authored event pages", "Creates an event you can edit, share, and track"],
    icon: "upload",
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
    icon: "users",
  },
] as const;
