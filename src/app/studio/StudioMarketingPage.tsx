"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Baby,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Gift,
  Hotel,
  Image as ImageIcon,
  Layout,
  type LucideIcon,
  MapPin,
  MessageCircle,
  MousePointer2,
  Share2,
  Smartphone,
  Ticket,
  Upload,
  Users,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import HeroTopNav from "@/components/navigation/HeroTopNav";
import { buildMarketingHeroNav } from "@/components/navigation/marketing-hero-nav";
import LiveCardHeroTextOverlay from "@/components/studio/LiveCardHeroTextOverlay";
import StudioLiveCardActionSurface, {
  type LiveCardActiveTab,
  type LiveCardInvitationData,
} from "@/components/studio/StudioLiveCardActionSurface";
import { resolveNativeShareData } from "@/utils/native-share";

type FeatureItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

type ActionItem = {
  icon: LucideIcon;
  label: string;
  colorClassName: string;
};

type UseCaseItem = {
  title: string;
  description: string;
  preview: StudioMarketingCardConfig;
};

type ShowcaseCardItem = {
  title: string;
  preview: StudioMarketingCardConfig;
};

type StudioMarketingCardConfig = {
  title: string;
  imageUrl: string;
  wideImageUrl?: string;
  invitationData: LiveCardInvitationData;
  initialActiveTab?: LiveCardActiveTab;
};

const revealIn = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
};

const studioFeatures: FeatureItem[] = [
  {
    icon: Layout,
    title: "Premium Templates",
    description: "Dozens of curated layouts for every event type.",
  },
  {
    icon: ImageIcon,
    title: "Media Rich",
    description: "Upload photos, videos, and custom graphics easily.",
  },
  {
    icon: Smartphone,
    title: "Mobile Optimized",
    description: "Every invite looks polished on any device automatically.",
  },
];

const activeButtons: ActionItem[] = [
  {
    icon: CheckCircle2,
    label: "RSVP",
    colorClassName: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: MapPin,
    label: "Directions",
    colorClassName: "bg-blue-50 text-blue-600",
  },
  {
    icon: Calendar,
    label: "Add to Calendar",
    colorClassName: "bg-amber-50 text-amber-600",
  },
  {
    icon: Clock,
    label: "View Schedule",
    colorClassName: "bg-violet-50 text-violet-600",
  },
  {
    icon: Hotel,
    label: "Book Hotel",
    colorClassName: "bg-indigo-50 text-indigo-600",
  },
  {
    icon: Ticket,
    label: "Buy Tickets",
    colorClassName: "bg-rose-50 text-rose-600",
  },
  {
    icon: MessageCircle,
    label: "Contact Host",
    colorClassName: "bg-cyan-50 text-cyan-600",
  },
  {
    icon: Share2,
    label: "Share Event",
    colorClassName: "bg-slate-100 text-slate-600",
  },
];

const studioMarketingHeroNavLinks = buildMarketingHeroNav("studio", [
  { label: "Create in Studio", href: "#features" },
  { label: "Built to be Clicked", href: "#actions" },
  { label: "Made for Real Events", href: "#use-cases" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Live Card Showcase", href: "#showcase" },
]);

function createMarketingInvitationData({
  title,
  subtitle,
  description,
  scheduleLine,
  locationLine,
  category,
  occasion,
  eventDate,
  startTime,
  endTime,
  venueName,
  location,
  rsvpName,
  rsvpContact,
  registryLink,
  heroTextMode = "overlay",
}: {
  title: string;
  subtitle: string;
  description: string;
  scheduleLine: string;
  locationLine: string;
  category: string;
  occasion: string;
  eventDate: string;
  startTime: string;
  endTime?: string;
  venueName: string;
  location: string;
  rsvpName?: string;
  rsvpContact?: string;
  registryLink?: string;
  heroTextMode?: "image" | "overlay";
}): LiveCardInvitationData {
  return {
    title,
    subtitle,
    description,
    scheduleLine,
    locationLine,
    heroTextMode,
    theme: {
      themeStyle: "studio-marketing",
    },
    interactiveMetadata: {
      rsvpMessage: `Reply to ${rsvpName || "the host"} to let them know you're in.`,
      ctaLabel: "RSVP",
      shareNote: description,
    },
    eventDetails: {
      category,
      occasion,
      eventDate,
      startTime,
      endTime,
      venueName,
      location,
      rsvpName,
      rsvpContact,
      registryLink,
      detailsDescription: description,
      message: subtitle,
    },
  };
}

const heroPreview: StudioMarketingCardConfig = {
  title: "Summer Gala 2026",
  imageUrl: "/images/studio/invite-hero-gala.webp",
  invitationData: createMarketingInvitationData({
    title: "Summer Gala 2026",
    subtitle: "Cocktails, live music, and a black-tie night under the lights.",
    description:
      "A polished evening invite with RSVP, location, and calendar actions built directly into the live card.",
    scheduleLine: "Thu, Jun 18, 2026 • 7:00 PM",
    locationLine: "Grand Ballroom • River House",
    category: "Custom Invite",
    occasion: "Black Tie Gala",
    eventDate: "2026-06-18",
    startTime: "19:00",
    endTime: "23:00",
    venueName: "Grand Ballroom",
    location: "River House, 14 Wabash Landing, Chicago, IL",
    rsvpName: "Event Concierge",
    rsvpContact: "rsvp@summergala.example.com",
    heroTextMode: "image",
  }),
};

const birthdayPreview: StudioMarketingCardConfig = {
  title: "Mila Turns 8",
  imageUrl: "/images/studio/invite-birthday-bash.webp",
  wideImageUrl: "/images/marketing/use-case-birthday.webp",
  invitationData: createMarketingInvitationData({
    title: "Mila Turns 8",
    subtitle: "Cupcakes, confetti, and a full afternoon of birthday fun.",
    description: "Guests can RSVP, get directions, and save the date from one live card.",
    scheduleLine: "Sat, May 16, 2026 • 2:00 PM",
    locationLine: "Sunnybrook Social Club",
    category: "Birthday",
    occasion: "Birthday Party",
    eventDate: "2026-05-16",
    startTime: "14:00",
    endTime: "17:00",
    venueName: "Sunnybrook Social Club",
    location: "118 Garden Lane, Austin, TX",
    rsvpName: "Rachel",
    rsvpContact: "512-555-0108",
    heroTextMode: "image",
  }),
};

const weddingPreview: StudioMarketingCardConfig = {
  title: "Elena & Marcus",
  imageUrl: "/images/studio/invite-wedding-weekend.webp",
  wideImageUrl: "/images/marketing/use-case-wedding.webp",
  invitationData: createMarketingInvitationData({
    title: "Elena & Marcus",
    subtitle: "A full wedding weekend with RSVP, registry, hotel, and timeline details.",
    description: "Give guests one elegant page for every part of the celebration.",
    scheduleLine: "Sun, Sep 27, 2026 • 4:30 PM",
    locationLine: "Villa Terrace Gardens",
    category: "Wedding",
    occasion: "Wedding Weekend",
    eventDate: "2026-09-27",
    startTime: "16:30",
    endTime: "23:00",
    venueName: "Villa Terrace Gardens",
    location: "1900 Lakefront Drive, Milwaukee, WI",
    rsvpName: "Wedding Planner",
    rsvpContact: "planner@elenamarcus.example.com",
    registryLink: "https://registry.example.com/elena-marcus",
    heroTextMode: "image",
  }),
  initialActiveTab: "registry",
};

const babyPreview: StudioMarketingCardConfig = {
  title: "Baby Bloom Shower",
  imageUrl: "/images/studio/invite-baby-shower.webp",
  wideImageUrl: "/images/marketing/use-case-baby.webp",
  invitationData: createMarketingInvitationData({
    title: "Baby Bloom Shower",
    subtitle: "Registry, venue notes, and host contact wrapped into one guest-ready card.",
    description: "Perfect for baby showers where guests need directions and gift details fast.",
    scheduleLine: "Sat, Jun 12, 2026 • 11:00 AM",
    locationLine: "The Garden Room",
    category: "Baby Shower",
    occasion: "Baby Shower",
    eventDate: "2026-06-12",
    startTime: "11:00",
    endTime: "14:00",
    venueName: "The Garden Room",
    location: "44 Juniper Street, Nashville, TN",
    rsvpName: "Sarah",
    rsvpContact: "512-555-0108",
    registryLink: "https://registry.example.com/baby-bloom",
    heroTextMode: "image",
  }),
  initialActiveTab: "rsvp",
};

const schoolPreview: StudioMarketingCardConfig = {
  title: "Spring Field Day",
  imageUrl: "/images/studio/invite-school-event.webp",
  wideImageUrl: "/images/marketing/use-case-school.webp",
  invitationData: createMarketingInvitationData({
    title: "Spring Field Day",
    subtitle: "Parents get timing, campus location, and reminders without a PDF hunt.",
    description: "A clear live card for school events, family nights, and campus programs.",
    scheduleLine: "Fri, Apr 24, 2026 • 9:30 AM",
    locationLine: "Northview Academy Quad",
    category: "Field Trip/Day",
    occasion: "School Event",
    eventDate: "2026-04-24",
    startTime: "09:30",
    endTime: "13:00",
    venueName: "Northview Academy Quad",
    location: "88 Crescent Drive, Denver, CO",
    rsvpName: "Ms. Lopez",
    rsvpContact: "fieldday@northview.example.com",
    heroTextMode: "image",
  }),
};

const communityPreview: StudioMarketingCardConfig = {
  title: "Neighborhood Night Market",
  imageUrl: "/images/marketing/use-case-community.webp",
  wideImageUrl: "/images/marketing/use-case-community.webp",
  invitationData: createMarketingInvitationData({
    title: "Neighborhood Night Market",
    subtitle: "A shareable card for maps, vendor details, and evening updates.",
    description: "Ideal for festivals, meetups, and recurring community events.",
    scheduleLine: "Thu, Aug 20, 2026 • 6:00 PM",
    locationLine: "Maple Street Commons",
    category: "Custom Invite",
    occasion: "Community Event",
    eventDate: "2026-08-20",
    startTime: "18:00",
    endTime: "21:00",
    venueName: "Maple Street Commons",
    location: "201 Maple Street, Portland, OR",
    rsvpName: "Community Team",
    rsvpContact: "hello@maplecommons.example.com",
  }),
};

const teamPreview: StudioMarketingCardConfig = {
  title: "Studio Team Offsite",
  imageUrl: "/images/studio/invite-team-offsite.webp",
  wideImageUrl: "/images/marketing/use-case-team.webp",
  invitationData: createMarketingInvitationData({
    title: "Studio Team Offsite",
    subtitle: "A clean live card for agendas, location, and internal team logistics.",
    description: "Professional enough for work, simple enough to open on mobile.",
    scheduleLine: "Wed, Oct 14, 2026 • 1:00 PM",
    locationLine: "Harbor House Rooftop",
    category: "Custom Invite",
    occasion: "Team Event",
    eventDate: "2026-10-14",
    startTime: "13:00",
    endTime: "18:00",
    venueName: "Harbor House Rooftop",
    location: "900 Bay Street, Seattle, WA",
    rsvpName: "People Ops",
    rsvpContact: "people@harborhouse.example.com",
    heroTextMode: "image",
  }),
};

const showcaseBirthdayPreview: StudioMarketingCardConfig = {
  title: "Lara's Dino-Adventure",
  imageUrl: "/api/blob/event-media/upload-9f766086-693e-45aa-9813-bfe97f095651/header/display.webp",
  invitationData: createMarketingInvitationData({
    title: "Lara's Dino-Adventure",
    subtitle: "A Prehistoric Celebration 🦖",
    description:
      "A prehistoric 7th birthday celebration for Lara Bennett featuring a dinosaur adventure theme at the park with roaring fun and explorer vibes.",
    scheduleLine: "Saturday May 23rd at 12:00 PM",
    locationLine: "AMC Boulevard 10, Franklin, TN",
    category: "Birthday",
    occasion: "Birthday Party",
    eventDate: "2026-05-23",
    startTime: "12:00",
    venueName: "AMC Boulevard 10",
    location: "AMC Boulevard 10, Franklin, TN",
    rsvpContact: "512-555-0108",
    heroTextMode: "image",
  }),
};

const showcaseGameDayPreview: StudioMarketingCardConfig = {
  title: "Panther Game Night",
  imageUrl: "/api/blob/event-media/upload-8cc5fc5f-deb5-4083-a3a2-daeb53602a51/header/display.webp",
  invitationData: createMarketingInvitationData({
    title: "Panther Game Night",
    subtitle: "PANTHERS VS TIGERS",
    description:
      "A bold football invitation featuring the Varsity Panthers under the Friday night lights with blue and gold energy.",
    scheduleLine: "Friday, September 18th at 7:00 PM",
    locationLine: "Panther Stadium • Austin, TX",
    category: "Game Day",
    occasion: "Football Game",
    eventDate: "2026-09-18",
    startTime: "19:00",
    venueName: "Panther Stadium",
    location: "Panther Stadium, 800 Victory Lane, Austin, TX",
    heroTextMode: "image",
  }),
};

const showcaseBridalPreview: StudioMarketingCardConfig = {
  title: "Madeline's Garden Brunch",
  imageUrl: "/api/blob/event-media/upload-c23c3d9e-45b5-4822-a8c8-b8892289de3e/header/display.webp",
  invitationData: createMarketingInvitationData({
    title: "Madeline's Garden Brunch",
    subtitle: "Bridal Shower Brunch",
    description:
      "An elegant garden-side bridal shower for Madeline Rivers, featuring blush florals, artisanal pastries, and champagne toasts at the historic Willow House.",
    scheduleLine: "Saturday, August 8th at 11:00 AM",
    locationLine: "Willow House, Savannah",
    category: "Bridal Shower",
    occasion: "Bridal Shower",
    eventDate: "2026-08-08",
    startTime: "11:00",
    venueName: "Willow House",
    location: "Willow House, 44 Magnolia Street, Savannah, GA",
    rsvpContact: "sofia@willowhouse.example.com",
    heroTextMode: "image",
  }),
};

const showcaseBabyPreview: StudioMarketingCardConfig = {
  title: "Elena's Blue Bear Shower",
  imageUrl: "/api/blob/event-media/upload-66ac676d-ad60-4391-b974-ec67199cbe77/header/display.webp",
  invitationData: createMarketingInvitationData({
    title: "Elena's Blue Bear Shower",
    subtitle: "A Celebration for a Little One 🧸",
    description:
      "A serene and elevated baby shower for Elena Martinez, featuring soft blue balloon clouds, heritage teddy bear motifs, and warm floral accents in the sunlit Olive Room.",
    scheduleLine: "Sunday, July 19th at 1:00 PM",
    locationLine: "Olive Room, 212 Harbor Avenue, Tampa",
    category: "Baby Shower",
    occasion: "Baby Shower",
    eventDate: "2026-07-19",
    startTime: "13:00",
    venueName: "Olive Room",
    location: "Olive Room, 212 Harbor Avenue, Tampa, FL",
    rsvpContact: "elena.shower@olive-room.example.com",
    heroTextMode: "image",
  }),
};

const showcaseAnniversaryPreview: StudioMarketingCardConfig = {
  title: "Silver Anniversary Soirée",
  imageUrl: "/api/blob/event-media/upload-767b4cbd-a67b-43b4-8339-1b2afe60016b/header/display.webp",
  invitationData: createMarketingInvitationData({
    title: "Silver Anniversary Soirée",
    subtitle: "Our 25th Anniversary Dinner",
    description:
      "An elegant 25th-anniversary dinner for Naomi & Daniel Brooks featuring candlelit tables, deep red roses, and live jazz at The Marlowe Room.",
    scheduleLine: "Sunday June 14th at 6:30 PM",
    locationLine: "The Marlowe Room, Chicago",
    category: "Anniversary",
    occasion: "Anniversary Dinner",
    eventDate: "2026-06-14",
    startTime: "18:30",
    venueName: "The Marlowe Room",
    location: "The Marlowe Room, 17 Crescent Avenue, Chicago, IL",
    rsvpContact: "anniversary@brooks.example.com",
    heroTextMode: "image",
  }),
};

const showcaseMuseumPreview: StudioMarketingCardConfig = {
  title: "Museum Discovery Day",
  imageUrl: "/api/blob/event-media/upload-b9b6e1f6-f6bc-47a2-b036-2088b8366e47/header/display.webp",
  invitationData: createMarketingInvitationData({
    title: "Museum Discovery Day",
    subtitle: "A Science Museum Field Trip 🚀",
    description:
      "An elevated and organized school field trip invitation for a day of scientific exploration and hands-on learning at the City Science Museum.",
    scheduleLine: "Thursday, April 30th at 8:15 AM",
    locationLine: "City Science Museum, Dallas",
    category: "Field Trip/Day",
    occasion: "Field Trip",
    eventDate: "2026-04-30",
    startTime: "08:15",
    venueName: "City Science Museum",
    location: "City Science Museum, 100 Discovery Plaza, Dallas, TX",
    rsvpContact: "mrs.harper@cityscience.example.com",
    heroTextMode: "image",
  }),
};

const useCases: UseCaseItem[] = [
  {
    title: "Birthdays",
    description: "Fun, vibrant invites with RSVP and gift registry links.",
    preview: birthdayPreview,
  },
  {
    title: "Weddings",
    description: "Elegant, sophisticated cards for your special day.",
    preview: weddingPreview,
  },
  {
    title: "Baby Showers",
    description: "Soft designs with registry, venue, and calendar actions.",
    preview: babyPreview,
  },
  {
    title: "School Events",
    description: "Clear, informative flyers for parents and students.",
    preview: schoolPreview,
  },
  {
    title: "Community Events",
    description: "Engaging cards for festivals, markets, and meetups.",
    preview: communityPreview,
  },
  {
    title: "Team Events",
    description: "Professional invites for retreats and internal events.",
    preview: teamPreview,
  },
];

const showcaseCards: ShowcaseCardItem[] = [
  {
    title: "Birthday Bash",
    preview: birthdayPreview,
  },
  {
    title: "Lara's Dino-Adventure",
    preview: showcaseBirthdayPreview,
  },
  {
    title: "Wedding Weekend",
    preview: weddingPreview,
  },
  {
    title: "Panther Game Night",
    preview: showcaseGameDayPreview,
  },
  {
    title: "Baby Shower",
    preview: babyPreview,
  },
  {
    title: "Madeline's Garden Brunch",
    preview: showcaseBridalPreview,
  },
  {
    title: "School Fundraiser",
    preview: schoolPreview,
  },
  {
    title: "Elena's Blue Bear Shower",
    preview: showcaseBabyPreview,
  },
  {
    title: "Team Offsite",
    preview: teamPreview,
  },
  {
    title: "Silver Anniversary Soirée",
    preview: showcaseAnniversaryPreview,
  },
  {
    title: "Museum Discovery Day",
    preview: showcaseMuseumPreview,
  },
];

const babyShowerHighlights: FeatureItem[] = [
  {
    icon: Gift,
    title: "Baby Registry",
    description: "Direct links to your curated gift lists.",
  },
  {
    icon: MapPin,
    title: "Venue & Parking",
    description: "Easy navigation for every guest.",
  },
  {
    icon: Calendar,
    title: "Add to Calendar",
    description: "Instant reminders so nobody misses it.",
  },
  {
    icon: MessageCircle,
    title: "Host Contact",
    description: "Quick access for questions or RSVP follow-up.",
  },
];

const weddingHighlights: FeatureItem[] = [
  {
    icon: Ticket,
    title: "Gift Registry",
    description: "Direct links to your wedding registries.",
  },
  {
    icon: MapPin,
    title: "Venue",
    description: "Maps and parking for the ceremony and reception.",
  },
  {
    icon: Hotel,
    title: "Hotel Blocks",
    description: "Booking links and lodging notes in one place.",
  },
  {
    icon: Calendar,
    title: "Add to Calendar",
    description: "Make the date impossible to lose.",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Design",
    description: "Choose a template or start from scratch in Studio.",
  },
  {
    step: "02",
    title: "Add Utility",
    description: "Drop in RSVP, maps, and other active buttons.",
  },
  {
    step: "03",
    title: "Publish",
    description: "Create your live event card in one step.",
  },
  {
    step: "04",
    title: "Share",
    description: "Send the polished link by text, email, or social.",
  },
] as const;

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function SectionHeading({
  title,
  description,
  center = false,
  titleClassName,
}: {
  title: string;
  description: string;
  center?: boolean;
  titleClassName?: string;
}) {
  return (
    <div className={cx(center && "mx-auto max-w-2xl text-center")}>
      <h2
        className={cx(
          "text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl",
          titleClassName,
        )}
      >
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">{description}</p>
    </div>
  );
}

function PrimaryButton({
  onClick,
  label,
  className,
}: {
  onClick: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full bg-[#7c3aed] px-8 py-4 text-base font-semibold text-white shadow-[0_20px_50px_rgba(124,58,237,0.22)] transition hover:bg-[#6d28d9]",
        className,
      )}
    >
      <span>{label}</span>
      <ArrowRight className="h-5 w-5" />
    </button>
  );
}

function SecondaryLink({ href, label }: { href: string; label: string }) {
  if (href.startsWith("#")) {
    return (
      <a
        href={href}
        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-900 transition hover:bg-slate-50"
      >
        {label}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-900 transition hover:bg-slate-50"
    >
      {label}
    </Link>
  );
}

function MockPhoneFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "relative mx-auto w-full max-w-[320px] rounded-[2.5rem] border border-slate-100 bg-white p-4 shadow-[0_30px_90px_rgba(15,23,42,0.12)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function StudioMarketingLiveCard({
  preview,
  className,
  compactChrome = false,
  showcaseMode = false,
  interactive = true,
  imageLoading = "lazy",
  imageFetchPriority = "auto",
  activeTab,
  onActiveTabChange,
  showcaseOverlay,
}: {
  preview: StudioMarketingCardConfig;
  className?: string;
  compactChrome?: boolean;
  showcaseMode?: boolean;
  interactive?: boolean;
  imageLoading?: "eager" | "lazy";
  imageFetchPriority?: "high" | "low" | "auto";
  activeTab?: LiveCardActiveTab;
  onActiveTabChange?: (tab: LiveCardActiveTab) => void;
  showcaseOverlay?: React.ReactNode;
}) {
  const [internalActiveTab, setInternalActiveTab] = useState<LiveCardActiveTab>(
    preview.initialActiveTab || "none",
  );
  const [shareState, setShareState] = useState<"idle" | "pending" | "success">("idle");
  const shareResetTimeoutRef = useRef<number | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const resolvedActiveTab = activeTab ?? internalActiveTab;
  const handleActiveTabChange = onActiveTabChange ?? setInternalActiveTab;

  useEffect(() => {
    setShareUrl(`${window.location.origin}/studio?showcase=${encodeURIComponent(preview.title)}`);

    return () => {
      if (shareResetTimeoutRef.current) {
        window.clearTimeout(shareResetTimeoutRef.current);
      }
    };
  }, [preview.title]);

  const handleShare = async () => {
    const resolvedShareUrl =
      shareUrl || `${window.location.origin}/studio?showcase=${encodeURIComponent(preview.title)}`;
    if (!resolvedShareUrl) return;

    if (shareResetTimeoutRef.current) {
      window.clearTimeout(shareResetTimeoutRef.current);
      shareResetTimeoutRef.current = null;
    }

    setShareState("pending");

    const sharePayload = {
      title: preview.title,
      text:
        preview.invitationData.description || preview.invitationData.subtitle || `${preview.title} on Envitefy Studio`,
      url: resolvedShareUrl,
    };

    try {
      const nativeShareData = resolveNativeShareData(sharePayload);
      if (nativeShareData) {
        await navigator.share(nativeShareData);
      } else if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(resolvedShareUrl);
      } else {
        window.prompt("Copy this link", resolvedShareUrl);
      }

      setShareState("success");
      shareResetTimeoutRef.current = window.setTimeout(() => {
        setShareState("idle");
        shareResetTimeoutRef.current = null;
      }, 1800);
    } catch (error) {
      if (
        error instanceof DOMException &&
        (error.name === "AbortError" || error.name === "NotAllowedError")
      ) {
        setShareState("idle");
        return;
      }

      try {
        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(resolvedShareUrl);
          setShareState("success");
          shareResetTimeoutRef.current = window.setTimeout(() => {
            setShareState("idle");
            shareResetTimeoutRef.current = null;
          }, 1800);
          return;
        }
      } catch {}

      setShareState("idle");
    }
  };

  return (
    <div
      className={cx(
        "relative aspect-[9/16] overflow-hidden rounded-[2.2rem] border border-white/10 bg-neutral-950 shadow-[0_28px_80px_rgba(15,23,42,0.32)]",
        showcaseMode && "border-slate-300/70 bg-transparent shadow-none",
        className,
      )}
    >
      <img
        src={preview.imageUrl}
        alt={preview.title}
        loading={imageLoading}
        fetchPriority={imageFetchPriority}
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.06)_26%,rgba(0,0,0,0.28)_100%)]" />
      <LiveCardHeroTextOverlay invitationData={preview.invitationData} />
      <div
        className={cx(
          "absolute inset-0",
          compactChrome && "origin-bottom scale-[0.88]",
          interactive ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <StudioLiveCardActionSurface
          title={preview.title}
          invitationData={preview.invitationData}
          activeTab={resolvedActiveTab}
          onActiveTabChange={handleActiveTabChange}
          onShare={handleShare}
          shareUrl={shareUrl}
          fallbackShareUrlToWindowLocation={false}
          shareState={shareState}
        />
      </div>
      {showcaseOverlay}
    </div>
  );
}

function StudioMarketingUseCasePreview({
  preview,
  imageLoading = "lazy",
}: {
  preview: StudioMarketingCardConfig;
  imageLoading?: "eager" | "lazy";
}) {
  const details = preview.invitationData.eventDetails;
  const eyebrow = readString(details?.occasion) || readString(details?.category) || "Event";
  const actionChips = [
    readString(details?.rsvpContact) ? "RSVP" : null,
    readString(details?.location) || readString(details?.venueName) ? "Location" : null,
    readString(details?.eventDate) ? "Calendar" : null,
    readString(details?.registryLink) ? "Registry" : null,
  ].filter((item): item is string => Boolean(item));

  return (
    <div className="relative mb-4 aspect-[16/10] overflow-hidden rounded-[1.7rem] bg-[#ede9fe] shadow-lg shadow-slate-100">
      <img
        src={preview.wideImageUrl || preview.imageUrl}
        alt={preview.title}
        loading={imageLoading}
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,16,32,0.08),rgba(13,16,32,0.2)_38%,rgba(13,16,32,0.78)_100%)]" />
      <div className="absolute inset-x-5 top-5">
        <span className="inline-flex rounded-full border border-white/18 bg-black/20 px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-white/90 backdrop-blur-md">
          {eyebrow}
        </span>
      </div>
      <div className="absolute inset-x-5 bottom-5">
        {actionChips.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {actionChips.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center rounded-full border border-white/16 bg-white/10 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/92 backdrop-blur-md"
              >
                {chip}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-[1.7rem] ring-1 ring-inset ring-white/10" />
    </div>
  );
}

export default function StudioMarketingPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [activeIndex, setActiveIndex] = useState(0);
  const [showcaseOverlayIndex, setShowcaseOverlayIndex] = useState<number | null>(null);
  const [fullscreenShowcaseIndex, setFullscreenShowcaseIndex] = useState<number | null>(null);
  const [fullscreenActiveTab, setFullscreenActiveTab] = useState<LiveCardActiveTab>("none");
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(showcaseCards.length > 1);
  const showcaseScrollRef = useRef<HTMLDivElement | null>(null);
  const showcaseCardsRef = useRef<HTMLElement[]>([]);
  const showcaseCardCentersRef = useRef<number[]>([]);
  const showcaseSwipeStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    index: number;
    didSwipe: boolean;
  } | null>(null);
  const suppressShowcaseClickRef = useRef(false);
  const suppressShowcaseClickTimeoutRef = useRef<number | null>(null);

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  useEffect(() => {
    return () => {
      if (suppressShowcaseClickTimeoutRef.current) {
        window.clearTimeout(suppressShowcaseClickTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const node = showcaseScrollRef.current;
    if (!node) return;

    let activeIndexValue = 0;
    let canScrollLeftValue = false;
    let canScrollRightValue = showcaseCards.length > 1;

    const syncShowcaseMeasurements = () => {
      const cards = Array.from(node.querySelectorAll<HTMLElement>("[data-showcase-card]"));
      showcaseCardsRef.current = cards;
      showcaseCardCentersRef.current = cards.map((card) => card.offsetLeft + card.offsetWidth / 2);
    };

    const syncShowcaseState = () => {
      const cards = showcaseCardsRef.current;
      if (cards.length === 0) {
        if (activeIndexValue !== 0) {
          activeIndexValue = 0;
          setActiveIndex(0);
        }
        if (canScrollLeftValue) {
          canScrollLeftValue = false;
          setCanScrollLeft(false);
        }
        if (canScrollRightValue) {
          canScrollRightValue = false;
          setCanScrollRight(false);
        }
        return;
      }

      const maxScrollLeft = Math.max(node.scrollWidth - node.clientWidth, 0);
      const nextCanScrollLeft = node.scrollLeft > 10;
      const nextCanScrollRight = node.scrollLeft < maxScrollLeft - 10;

      if (canScrollLeftValue !== nextCanScrollLeft) {
        canScrollLeftValue = nextCanScrollLeft;
        setCanScrollLeft(nextCanScrollLeft);
      }
      if (canScrollRightValue !== nextCanScrollRight) {
        canScrollRightValue = nextCanScrollRight;
        setCanScrollRight(nextCanScrollRight);
      }

      const containerCenter = node.scrollLeft + node.clientWidth / 2;
      let nextActiveIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      for (const [index, cardCenter] of showcaseCardCentersRef.current.entries()) {
        const distance = Math.abs(cardCenter - containerCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          nextActiveIndex = index;
        }
      }

      if (activeIndexValue !== nextActiveIndex) {
        activeIndexValue = nextActiveIndex;
        setActiveIndex(nextActiveIndex);
      }
    };

    let frameId = 0;
    const handleScroll = () => {
      cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(syncShowcaseState);
    };
    const handleResize = () => {
      cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        syncShowcaseMeasurements();
        syncShowcaseState();
      });
    };

    syncShowcaseMeasurements();
    syncShowcaseState();
    node.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      node.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    setShowcaseOverlayIndex(null);
  }, [activeIndex]);

  useEffect(() => {
    if (showcaseOverlayIndex === null) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest(`[data-showcase-card-index="${showcaseOverlayIndex}"]`)) {
        return;
      }
      setShowcaseOverlayIndex(null);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [showcaseOverlayIndex]);

  useEffect(() => {
    if (fullscreenShowcaseIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFullscreenShowcaseIndex(null);
        setFullscreenActiveTab("none");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [fullscreenShowcaseIndex]);

  const scrollToShowcaseIndex = (index: number) => {
    const node = showcaseScrollRef.current;
    if (!node) return;
    const cards = showcaseCardsRef.current;
    if (cards.length === 0) return;

    const nextIndex = Math.max(0, Math.min(index, cards.length - 1));
    const card = cards[nextIndex];
    const targetLeft = card.offsetLeft - (node.clientWidth - card.offsetWidth) / 2;
    const maxScrollLeft = Math.max(node.scrollWidth - node.clientWidth, 0);

    setShowcaseOverlayIndex(null);
    setActiveIndex(nextIndex);
    node.scrollTo({
      left: Math.min(Math.max(targetLeft, 0), maxScrollLeft),
      behavior: "smooth",
    });
  };

  const closeShowcaseFullscreen = () => {
    setFullscreenShowcaseIndex(null);
    setFullscreenActiveTab("none");
  };

  const openShowcaseFullscreen = (index: number) => {
    setShowcaseOverlayIndex(null);
    setFullscreenActiveTab("none");
    setFullscreenShowcaseIndex(index);
  };

  const handleShowcaseCardClick = (index: number, event?: React.MouseEvent<HTMLDivElement>) => {
    if (suppressShowcaseClickRef.current) {
      event?.preventDefault();
      event?.stopPropagation();
      suppressShowcaseClickRef.current = false;
      return;
    }

    if (index !== activeIndex) {
      event?.preventDefault();
      event?.stopPropagation();
      scrollToShowcaseIndex(index);
      return;
    }

    const target = event?.target;
    if (
      target instanceof HTMLElement &&
      target.closest("[data-live-card-trigger], [data-live-card-panel], button, a")
    ) {
      return;
    }

    setShowcaseOverlayIndex((current) => (current === index ? null : index));
  };

  const suppressShowcaseClick = () => {
    suppressShowcaseClickRef.current = true;
    if (suppressShowcaseClickTimeoutRef.current) {
      window.clearTimeout(suppressShowcaseClickTimeoutRef.current);
    }
    suppressShowcaseClickTimeoutRef.current = window.setTimeout(() => {
      suppressShowcaseClickRef.current = false;
      suppressShowcaseClickTimeoutRef.current = null;
    }, 280);
  };

  const handleShowcasePointerDown = (
    index: number,
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!event.isPrimary || event.pointerType === "mouse" || event.pointerType === "touch") return;
    showcaseSwipeStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      index,
      didSwipe: false,
    };
  };

  const handleShowcasePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") {
      return;
    }
    const swipeState = showcaseSwipeStateRef.current;
    if (!swipeState || swipeState.pointerId !== event.pointerId || swipeState.didSwipe) {
      return;
    }

    const deltaX = event.clientX - swipeState.startX;
    const deltaY = event.clientY - swipeState.startY;
    if (Math.abs(deltaX) < 42 || Math.abs(deltaX) <= Math.abs(deltaY)) {
      return;
    }

    swipeState.didSwipe = true;
    suppressShowcaseClick();
    scrollToShowcaseIndex(swipeState.index + (deltaX < 0 ? 1 : -1));
  };

  const clearShowcaseSwipeState = (event?: React.PointerEvent<HTMLDivElement>) => {
    const swipeState = showcaseSwipeStateRef.current;
    if (!swipeState) return;
    if (event && swipeState.pointerId !== event.pointerId) return;
    showcaseSwipeStateRef.current = null;
  };

  const handleShowcaseClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!suppressShowcaseClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressShowcaseClickRef.current = false;
  };

  const scrollShowcase = (direction: "left" | "right") => {
    scrollToShowcaseIndex(activeIndex + (direction === "left" ? -1 : 1));
  };

  return (
    <>
      <div className="min-h-screen overflow-x-clip bg-white text-slate-900 selection:bg-[#ddd6fe] selection:text-[#4c1d95]">
        <HeroTopNav
          navLinks={studioMarketingHeroNavLinks}
          primaryCtaLabel="Start in Studio"
          authenticatedPrimaryHref="/"
          brandHref="/"
          loginSuccessRedirectUrl="/studio"
          onGuestLoginAction={() => openAuth("login")}
          onGuestPrimaryAction={() => openAuth("signup")}
        />

        <main>
          <section className="hash-anchor-below-fixed-nav relative overflow-hidden px-4 pb-20 pt-32 sm:px-6 lg:px-8 lg:pb-28 lg:pt-44">
            <div className="absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute left-[-10%] top-[-5%] h-[28rem] w-[28rem] rounded-full bg-[#ede9fe] blur-[120px]" />
              <div className="absolute bottom-[-10%] right-[-10%] h-[26rem] w-[26rem] rounded-full bg-[#f5f3ff] blur-[120px]" />
            </div>

            <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-[#ddd6fe] bg-[#f5f3ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#6d28d9]">
                  <Zap className="h-3 w-3" />
                  Digital Flyers • Live Cards
                </div>
                <h1 className="mt-6 max-w-3xl text-5xl font-black tracking-tight text-slate-900 sm:text-6xl lg:text-7xl lg:leading-[1.05]">
                  Create a live digital invite that{" "}
                  <span className="text-[#7c3aed]">actually does something.</span>
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                  Envitefy Studio helps you design polished digital flyers and live invites with
                  clickable actions, RSVP, location links, and real event utility.
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <PrimaryButton onClick={() => openAuth("signup")} label="Start in Studio" />
                  <SecondaryLink href="#showcase" label="See Live Card Demo" />
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 shadow-sm">
                    <Upload className="h-4 w-4 text-[#7c3aed]" />
                    Upload or start from scratch
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 shadow-sm">
                    <WandSparkles className="h-4 w-4 text-[#7c3aed]" />
                    Publish a share-ready live card
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                <MockPhoneFrame className="lg:mr-0">
                  <StudioMarketingLiveCard
                    preview={heroPreview}
                    className="rounded-[2rem]"
                    imageLoading="eager"
                    imageFetchPriority="high"
                  />
                </MockPhoneFrame>

                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                  className="absolute left-0 top-[14%] z-20 hidden -translate-x-8 items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl lg:flex"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                    <Calendar className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      Action
                    </p>
                    <p className="text-sm font-bold text-slate-900">Add to Calendar</p>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{
                    duration: 5,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                  className="absolute right-0 top-1/2 z-20 hidden translate-x-10 items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl lg:flex"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      Status
                    </p>
                    <p className="text-sm font-bold text-slate-900">42 Guests RSVP&apos;d</p>
                  </div>
                </motion.div>

                <div className="absolute -bottom-12 -left-12 -z-10 h-64 w-64 rounded-full bg-[#ddd6fe]/40 blur-3xl" />
              </motion.div>
            </div>
          </section>

          <motion.section
            id="features"
            className="hash-anchor-below-fixed-nav overflow-hidden px-4 py-24 sm:px-6 lg:px-8"
            {...revealIn}
          >
            <div className="mx-auto grid w-full max-w-7xl gap-16 lg:grid-cols-2 lg:items-center">
              <div>
                <SectionHeading
                  title="Create in Studio. Publish to the world."
                  description="Our editor gives you professional design tools without the usual complexity. Start from a premium template or build your vision from scratch."
                />
                <div className="mt-8 space-y-6">
                  {studioFeatures.map((feature) => (
                    <div key={feature.title} className="flex gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#f5f3ff]">
                        <feature.icon className="h-6 w-6 text-[#7c3aed]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{feature.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="overflow-hidden rounded-[2rem] bg-slate-900 p-4 shadow-[0_30px_80px_rgba(15,23,42,0.2)]">
                  <div className="overflow-hidden rounded-[1.5rem] border border-slate-700 bg-slate-800">
                    <div className="flex h-10 items-center gap-2 border-b border-slate-700 bg-slate-900 px-4">
                      <div className="flex gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      </div>
                      <div className="mx-auto text-[10px] font-mono uppercase tracking-[0.28em] text-slate-500">
                        envitefy-studio
                      </div>
                    </div>
                    <div className="flex h-[400px]">
                      <div className="flex w-16 flex-col items-center gap-4 border-r border-slate-700 bg-slate-900 py-4">
                        {[Layout, ImageIcon, MousePointer2, Zap].map((Icon, index) => (
                          <div
                            key={Icon.displayName ?? `studio-tool-${index + 1}`}
                            className={cx(
                              "rounded-lg p-2",
                              index === 0 ? "bg-[#7c3aed] text-white" : "text-slate-500",
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-1 items-center justify-center bg-slate-800 p-6">
                        <div className="relative aspect-[9/16] w-48 overflow-hidden rounded-xl bg-white shadow-2xl">
                          <img
                            src="/images/studio/editor-preview.webp"
                            alt="Studio editor preview"
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                          />
                          <div className="pointer-events-none absolute inset-0 border-2 border-[#8b5cf6]/60" />
                          <div className="absolute right-2 top-2 flex gap-1">
                            <div className="flex h-4 w-4 items-center justify-center rounded bg-white shadow-sm">
                              <div className="h-2 w-2 rounded-full bg-[#8b5cf6]" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="w-48 space-y-4 border-l border-slate-700 bg-slate-900 p-4">
                        <div className="space-y-2">
                          <div className="h-2 w-12 rounded bg-slate-700" />
                          <div className="h-8 w-full rounded border border-slate-700 bg-slate-800" />
                        </div>
                        <div className="space-y-2">
                          <div className="h-2 w-16 rounded bg-slate-700" />
                          <div className="grid grid-cols-2 gap-2">
                            <div className="h-8 rounded bg-[#7c3aed]" />
                            <div className="h-8 rounded border border-slate-700 bg-slate-800" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute left-1/2 top-1/2 -z-10 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ddd6fe]/35 blur-[100px]" />
              </div>
            </div>
          </motion.section>

          <motion.section
            id="actions"
            className="hash-anchor-below-fixed-nav px-4 py-24 sm:px-6 lg:px-8"
            {...revealIn}
          >
            <div className="mx-auto w-full max-w-7xl">
              <SectionHeading
                title="Built to be clicked."
                description="Add real utility to your invites with one-tap actions guests will actually use."
                center
              />
              <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-8">
                {activeButtons.map((action) => (
                  <motion.div
                    key={action.label}
                    whileHover={{ y: -5 }}
                    className="group rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm transition-all hover:shadow-xl hover:shadow-slate-100"
                  >
                    <div
                      className={cx(
                        "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110",
                        action.colorClassName,
                      )}
                    >
                      <action.icon className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-bold text-slate-900">{action.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          <motion.section
            id="use-cases"
            className="hash-anchor-below-fixed-nav px-4 py-24 sm:px-6 lg:px-8"
            {...revealIn}
          >
            <div className="mx-auto w-full max-w-7xl">
              <SectionHeading
                title="Made for real events."
                description="From intimate gatherings to large community moments, Envitefy Studio scales with the event."
                center
                titleClassName="text-white"
              />

              <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {useCases.map((useCase) => (
                  <div key={useCase.title} className="group cursor-pointer">
                    <StudioMarketingUseCasePreview preview={useCase.preview} imageLoading="lazy" />
                    <h3 className="text-xl font-bold text-slate-900">{useCase.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{useCase.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          <motion.section
            className="overflow-hidden bg-[#f5f3ff] px-4 py-24 sm:px-6 lg:px-8"
            {...revealIn}
          >
            <div className="mx-auto w-full max-w-7xl rounded-[3rem] border border-[#ddd6fe] bg-white p-8 shadow-[0_30px_80px_rgba(124,58,237,0.08)] sm:p-10 lg:p-16">
              <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#ede9fe] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#6d28d9]">
                    <Baby className="h-3 w-3" />
                    Industry Spotlight
                  </div>
                  <h2 className="mt-6 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                    The perfect start for <span className="text-[#7c3aed]">baby showers.</span>
                  </h2>
                  <p className="mt-6 text-lg leading-8 text-slate-600">
                    Keep every shower detail, from registry to venue, right in your guests&apos;
                    hands.
                  </p>

                  <div className="mt-8 grid gap-6 sm:grid-cols-2">
                    {babyShowerHighlights.map((item) => (
                      <div key={item.title} className="flex gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#f5f3ff]">
                          <item.icon className="h-5 w-5 text-[#7c3aed]" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                          <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8">
                    <PrimaryButton
                      onClick={() => openAuth("signup")}
                      label="Create Your Baby Shower Card"
                    />
                  </div>
                </div>

                <div className="relative">
                  <div className="rotate-2 rounded-[2.5rem] border border-slate-200 bg-slate-50 p-4 shadow-xl">
                    <StudioMarketingLiveCard
                      preview={babyPreview}
                      className="rounded-[2rem] shadow-inner"
                      imageLoading="lazy"
                    />
                  </div>
                  <div className="absolute -right-12 -top-12 -z-10 h-32 w-32 rounded-full bg-[#c4b5fd] blur-3xl opacity-50" />
                  <div className="absolute -bottom-12 -left-12 -z-10 h-48 w-48 rounded-full bg-[#ddd6fe] blur-3xl opacity-50" />
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section className="overflow-hidden px-4 py-24 sm:px-6 lg:px-8" {...revealIn}>
            <div className="mx-auto w-full max-w-7xl overflow-hidden rounded-[3rem] bg-[#4c1d95] p-8 text-white shadow-[0_30px_90px_rgba(76,29,149,0.22)] sm:p-10 lg:p-16">
              <div className="pointer-events-none absolute" />
              <div className="relative grid gap-12 lg:grid-cols-2 lg:items-center">
                <div className="order-2 lg:order-1">
                  <div className="relative">
                    <div className="mx-auto max-w-[320px] rounded-[2.5rem] border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-md lg:mx-0">
                      <StudioMarketingLiveCard
                        preview={weddingPreview}
                        className="rounded-[2rem]"
                        imageLoading="lazy"
                      />
                    </div>
                    <motion.div
                      animate={{ y: [0, 10, 0] }}
                      transition={{
                        duration: 5,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                      className="absolute -right-2 -top-8 hidden items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-slate-900 shadow-xl md:flex"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50">
                        <Ticket className="h-5 w-5 text-rose-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                          Registry
                        </p>
                        <p className="text-sm font-bold">View Gift List</p>
                      </div>
                    </motion.div>
                  </div>
                </div>

                <div className="order-1 lg:order-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#e9d5ff]">
                    <WandSparkles className="h-3 w-3" />
                    Wedding Experience
                  </div>
                  <h2 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                    The most elegant way to{" "}
                    <span className="text-[#c4b5fd]">share your big day.</span>
                  </h2>
                  <p className="mt-6 text-lg leading-8 text-[#ede9fe]">
                    Envitefy Studio creates a live wedding experience that guides guests from the
                    first yes to the final dance.
                  </p>

                  <div className="mt-8 grid gap-6 sm:grid-cols-2">
                    {weddingHighlights.map((item) => (
                      <div key={item.title} className="flex gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
                          <item.icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">{item.title}</h4>
                          <p className="mt-1 text-xs text-[#ddd6fe]">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8">
                    <button
                      type="button"
                      onClick={() => openAuth("signup")}
                      className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-bold text-[#4c1d95] transition hover:bg-[#f5f3ff]"
                    >
                      <span>Design Your Wedding Card</span>
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            id="how-it-works"
            className="hash-anchor-below-fixed-nav px-4 py-24 sm:px-6 lg:px-8"
            {...revealIn}
          >
            <div className="mx-auto w-full max-w-7xl">
              <SectionHeading
                title="How it works."
                description="From blank canvas to live event in minutes."
                center
              />
              <div className="relative mt-20 grid gap-12 md:grid-cols-4">
                <div className="absolute left-0 top-12 hidden h-0.5 w-full bg-slate-100 md:block" />
                {howItWorks.map((item) => (
                  <div key={item.step} className="text-center">
                    <div className="relative z-10 mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border-4 border-slate-50 bg-white shadow-xl shadow-slate-100">
                      <span className="text-2xl font-black text-[#7c3aed]">{item.step}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-500">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          <motion.section
            id="showcase"
            className="hash-anchor-below-fixed-nav overflow-hidden py-24"
            {...revealIn}
          >
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-6">
                <div>
                  <h2
                    className="text-5xl font-extrabold leading-[0.9] tracking-tight text-slate-900 sm:text-6xl lg:text-[5.25rem]"
                    style={{ fontFamily: '"Outfit", "Inter", ui-sans-serif, system-ui, sans-serif' }}
                  >
                    Live Card Showcase
                  </h2>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base lg:text-lg">
                    See how hosts use Envitefy Studio to create memorable event experiences.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative left-1/2 mt-12 w-screen -translate-x-1/2 px-4 py-4 sm:px-6 lg:px-8">
              <div className="relative group/carousel">
                <button
                  type="button"
                  aria-label="Scroll showcase left"
                  onClick={() => scrollShowcase("left")}
                  disabled={!canScrollLeft}
                  className={cx(
                    "absolute left-4 top-1/2 z-20 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/90 bg-white/92 text-slate-700 shadow-[0_16px_36px_rgba(15,23,42,0.14)] backdrop-blur-sm transition-all duration-500 hover:border-slate-300 hover:bg-white active:scale-95 md:inline-flex lg:left-8",
                    canScrollLeft
                      ? "opacity-0 group-hover/carousel:opacity-100"
                      : "pointer-events-none -translate-x-8 opacity-0",
                  )}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Scroll showcase right"
                  onClick={() => scrollShowcase("right")}
                  disabled={!canScrollRight}
                  className={cx(
                    "absolute right-4 top-1/2 z-20 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/90 bg-white/92 text-slate-700 shadow-[0_16px_36px_rgba(15,23,42,0.14)] backdrop-blur-sm transition-all duration-500 hover:border-slate-300 hover:bg-white active:scale-95 md:inline-flex lg:right-8",
                    canScrollRight
                      ? "opacity-0 group-hover/carousel:opacity-100"
                      : "pointer-events-none translate-x-8 opacity-0",
                  )}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                <div
                  ref={showcaseScrollRef}
                  className="no-scrollbar flex touch-auto items-start gap-6 overflow-x-auto overscroll-x-contain scroll-smooth px-[max(2rem,calc(50vw-150px))] py-8 snap-x snap-mandatory"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
              {showcaseCards.map((item, index) => (
                <div
                  key={item.title}
                  onClickCapture={handleShowcaseClickCapture}
                  onClick={(event) => handleShowcaseCardClick(index, event)}
                  onPointerDownCapture={(event) => handleShowcasePointerDown(index, event)}
                  onPointerMoveCapture={handleShowcasePointerMove}
                  onPointerUpCapture={clearShowcaseSwipeState}
                  onPointerCancelCapture={clearShowcaseSwipeState}
                  data-showcase-card
                  data-showcase-card-index={index}
                  className="w-[min(300px,calc(100vw-4rem))] shrink-0 snap-center cursor-pointer"
                >
                      <div
                        className={cx(
                          "rounded-[2.2rem] shadow-[0_28px_60px_rgba(15,23,42,0.12),0_12px_28px_rgba(15,23,42,0.08),0_1px_0_rgba(255,255,255,0.7)_inset] transition-all duration-700 ease-out",
                          activeIndex === index
                            ? "scale-100 opacity-100 blur-0"
                            : "scale-[0.85] opacity-40 blur-[2px]",
                        )}
                      >
                        <StudioMarketingLiveCard
                          preview={item.preview}
                          compactChrome
                          showcaseMode
                          interactive={activeIndex === index}
                          imageLoading="lazy"
                          showcaseOverlay={
                            showcaseOverlayIndex === index && activeIndex === index ? (
                              <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/45 backdrop-blur-md">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openShowcaseFullscreen(index);
                                  }}
                                  className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/92 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-slate-900 shadow-[0_18px_45px_rgba(15,23,42,0.24)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                  Open live card
                                </button>
                              </div>
                            ) : null
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-center gap-3">
                  {showcaseCards.map((item, index) => (
                    <button
                      key={item.title}
                      type="button"
                      aria-label={`Show showcase card ${index + 1}`}
                      aria-current={activeIndex === index}
                      onClick={() => scrollToShowcaseIndex(index)}
                      className={cx(
                        "rounded-full transition-all duration-500",
                        activeIndex === index
                          ? "h-1.5 w-8 bg-[#7c3aed]"
                          : "h-1.5 w-1.5 bg-black/10",
                      )}
                    />
                  ))}
                </div>

                <div className="mt-6 text-center font-sans text-[10px] uppercase tracking-[0.2em] text-slate-500/70 md:hidden">
                  Swipe to explore
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            id="cta"
            className="hash-anchor-below-fixed-nav px-4 pt-14 pb-24 sm:px-6 sm:pt-16 lg:px-8"
            {...revealIn}
          >
            <div className="mx-auto w-full max-w-7xl">
              <div className="relative overflow-hidden rounded-[3rem] bg-[#7c3aed] px-12 pb-12 pt-8 text-center text-white shadow-[0_30px_90px_rgba(124,58,237,0.24)] lg:px-24 lg:pb-24 lg:pt-12">
                <div className="absolute left-0 top-0 h-full w-full opacity-20">
                  <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white blur-[100px]" />
                  <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#c4b5fd] blur-[100px]" />
                </div>

                <div className="relative z-10 mx-auto max-w-3xl">
                  <h2 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                    Ready to make your event live?
                  </h2>
                  <p className="mt-8 text-xl leading-8 text-[#ede9fe]">
                    Join hosts creating premium digital invites and live event cards with Envitefy
                    Studio.
                  </p>
                  <div className="mt-12 flex justify-center">
                    <button
                      type="button"
                      onClick={() => openAuth("signup")}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-10 py-5 text-xl font-bold text-[#7c3aed] shadow-xl transition hover:bg-[#f5f3ff]"
                    >
                      <span>Start in Studio</span>
                      <ArrowRight className="h-6 w-6" />
                    </button>
                  </div>
                  <p className="mt-8 text-sm font-medium text-[#ddd6fe]">
                    Free to start • No credit card required
                  </p>
                </div>
              </div>
            </div>
          </motion.section>
        </main>
      </div>

      <AnimatePresence>
        {fullscreenShowcaseIndex !== null ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[7000] flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl md:p-12"
            onClick={() => closeShowcaseFullscreen()}
          >
            <button
              type="button"
              aria-label="Close live card"
              onClick={() => closeShowcaseFullscreen()}
              className="absolute right-4 top-4 z-[7010] rounded-full border border-white/20 bg-white/15 p-3 text-white transition-colors hover:bg-white/25 md:right-8 md:top-8"
            >
              <X className="h-6 w-6" />
            </button>

            <motion.div
              initial={{ scale: 0.94, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 24 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-md"
              onClick={(event) => event.stopPropagation()}
            >
              <StudioMarketingLiveCard
                preview={showcaseCards[fullscreenShowcaseIndex].preview}
                activeTab={fullscreenActiveTab}
                onActiveTabChange={setFullscreenActiveTab}
                className="rounded-[3rem] shadow-2xl shadow-black/40"
                imageLoading="eager"
              />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AuthModal
        open={authModalOpen}
        mode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onModeChange={setAuthMode}
        successRedirectUrl="/studio"
      />
    </>
  );
}
