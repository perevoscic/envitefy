import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  ImageIcon,
  Link2,
  ListChecks,
  Sparkles,
  Trophy,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { buildSiteOgImage, getRandomSiteOgImageUrl } from "@/lib/site-og-images";
import GuidesTopNav from "./GuidesTopNav";

const SITE_URL = "https://envitefy.com";
const DEFAULT_IMAGE = getRandomSiteOgImageUrl(SITE_URL);
const pageFont = "var(--font-montserrat), var(--font-sans), system-ui, sans-serif";

export type GuideSlug =
  | "pdf-to-event-page"
  | "flyer-to-event-page"
  | "live-card-invitations"
  | "rsvp-event-page"
  | "gymnastics-meet-page"
  | "share-event-page-without-app";

type FaqPair = {
  question: string;
  answer: string;
};

type GuideStat = {
  value: string;
  label: string;
};

type GuideSection = {
  heading: string;
  body: string;
};

type GuideStep = {
  label: string;
  title: string;
  body: string;
};

type GuideChecklistItem = {
  title: string;
  body: string;
};

type GuidePage = {
  slug: GuideSlug;
  title: string;
  description: string;
  h1: string;
  eyebrow: string;
  routeLabel: string;
  productSurface: string;
  heroImage: string;
  heroImageAlt: string;
  heroImagePosition?: string;
  intro: string;
  directAnswer: string;
  stats: GuideStat[];
  sections: GuideSection[];
  steps: GuideStep[];
  checklist: GuideChecklistItem[];
  useCases: string[];
  guestValue: string[];
  cta: {
    label: string;
    href: string;
  };
  secondaryCta: {
    label: string;
    href: string;
  };
  relatedLinks: Array<{
    label: string;
    href: string;
  }>;
  faq: FaqPair[];
};

const guideVisuals: Record<
  GuideSlug,
  {
    icon: LucideIcon;
    accent: string;
    badge: string;
    iconWrap: string;
    button: string;
  }
> = {
  "pdf-to-event-page": {
    icon: FileText,
    accent: "text-[#9a4f10]",
    badge: "border-[#f4cf8d] bg-[#fff7e8] text-[#8a450c]",
    iconWrap: "bg-[#fff0cf] text-[#9a4f10]",
    button: "bg-[#8a450c] text-white hover:bg-[#6f3708]",
  },
  "flyer-to-event-page": {
    icon: ImageIcon,
    accent: "text-[#b94763]",
    badge: "border-[#f4b7c4] bg-[#fff2f5] text-[#9f3952]",
    iconWrap: "bg-[#ffe0e7] text-[#b94763]",
    button: "bg-[#9f3952] text-white hover:bg-[#842c42]",
  },
  "live-card-invitations": {
    icon: Sparkles,
    accent: "text-[#5f4cc4]",
    badge: "border-[#c7bdff] bg-[#f3f0ff] text-[#5441b1]",
    iconWrap: "bg-[#e4dfff] text-[#5f4cc4]",
    button: "bg-[#5441b1] text-white hover:bg-[#443493]",
  },
  "rsvp-event-page": {
    icon: UsersRound,
    accent: "text-[#16705d]",
    badge: "border-[#a4dece] bg-[#edf9f5] text-[#126250]",
    iconWrap: "bg-[#d5f2e9] text-[#16705d]",
    button: "bg-[#126250] text-white hover:bg-[#0d5041]",
  },
  "gymnastics-meet-page": {
    icon: Trophy,
    accent: "text-[#2f60b8]",
    badge: "border-[#b7caf4] bg-[#f0f5ff] text-[#2854a3]",
    iconWrap: "bg-[#dce8ff] text-[#2f60b8]",
    button: "bg-[#2854a3] text-white hover:bg-[#1f4383]",
  },
  "share-event-page-without-app": {
    icon: Link2,
    accent: "text-[#5b6d27]",
    badge: "border-[#d6df9d] bg-[#fbfee8] text-[#53621f]",
    iconWrap: "bg-[#f0f6c7] text-[#5b6d27]",
    button: "bg-[#53621f] text-white hover:bg-[#414d18]",
  },
};

export const guidePages: GuidePage[] = [
  {
    slug: "pdf-to-event-page",
    title: "How to turn a PDF into an event page | Envitefy Guides",
    description:
      "Turn a PDF invite, schedule, or event packet into a hosted Envitefy event page with RSVP links, calendar saves, maps, and shareable details.",
    h1: "How do I turn a PDF into an event page?",
    eyebrow: "PDF upload guide",
    routeLabel: "Snap upload",
    productSurface: "Envitefy Snap",
    heroImage: "/images/snap-hero-before.webp",
    heroImageAlt: "A PDF-style event source ready to become a hosted Envitefy page",
    heroImagePosition: "center",
    intro:
      "Upload the PDF to Envitefy Snap, review the extracted date, time, place, and notes, then publish a hosted event page guests can open from one link.",
    directAnswer:
      "Envitefy is built for PDFs that contain event details, including invitations, school flyers, sports schedules, and meet packets. Snap reads the file, organizes the details, and gives the host a cleaner live page to share.",
    stats: [
      { value: "PDF", label: "Starting point" },
      { value: "Live link", label: "Guest output" },
      { value: "Editable", label: "Before sharing" },
    ],
    sections: [
      {
        heading: "What Envitefy extracts from a PDF",
        body: "Envitefy looks for title, date, start time, end time, venue, address, host notes, registration links, registry links, and schedule details. Hosts can edit the result before sharing.",
      },
      {
        heading: "Why use a live page instead of sending the PDF",
        body: "A hosted page is easier to open on a phone, easier to update, and easier for guests to save to a calendar. Guests do not need to keep hunting through a download or text thread.",
      },
      {
        heading: "Best PDF use cases",
        body: "Common fits include birthday invitations, school events, community flyers, gymnastics meet schedules, recital packets, clinic schedules, and team event handouts.",
      },
    ],
    steps: [
      {
        label: "Upload",
        title: "Add the PDF in Snap",
        body: "Use the PDF as the source file, even when it is a packet, flyer, schedule, or invite.",
      },
      {
        label: "Review",
        title: "Confirm the details",
        body: "Check date, start time, end time, venue, address, links, and any notes guests need.",
      },
      {
        label: "Publish",
        title: "Create the hosted page",
        body: "Turn the reviewed details into a mobile-friendly page with guest actions.",
      },
      {
        label: "Share",
        title: "Send one clean link",
        body: "Text or email the live link and keep the source PDF as reference only when needed.",
      },
    ],
    checklist: [
      {
        title: "Dates and time zones",
        body: "PDFs often include multiple dates. Confirm the event start, end, and timezone before sharing.",
      },
      {
        title: "Venue and map",
        body: "Make sure the address is specific enough for map links and arrival instructions.",
      },
      {
        title: "Resource links",
        body: "Move registration, registry, hotel, or schedule links into visible page actions.",
      },
      {
        title: "Host ownership",
        body: "If you are creating your own event from a PDF, treat it as a hosted event page, not only an invite you received.",
      },
    ],
    useCases: [
      "School flyers and club packets",
      "Sports schedules and meet information",
      "Birthday, shower, and wedding invite PDFs",
      "Community events with registration links",
    ],
    guestValue: [
      "Open event details without downloading the original PDF",
      "Save the event to a calendar when calendar actions are available",
      "Use map, RSVP, registry, and outside resource links from one page",
      "Return to the same link when the host updates details",
    ],
    cta: { label: "Upload with Snap", href: "/snap" },
    secondaryCta: { label: "See flyer guide", href: "/guides/flyer-to-event-page" },
    relatedLinks: [
      { label: "Flyer to event page", href: "/guides/flyer-to-event-page" },
      { label: "RSVP event pages", href: "/guides/rsvp-event-page" },
      { label: "Gymnastics meet pages", href: "/gymnastics" },
    ],
    faq: [
      {
        question: "Can Envitefy turn a PDF into a shareable event page?",
        answer:
          "Yes. Envitefy Snap can process PDFs with event details and help create a hosted event page with RSVP, links, maps, and calendar actions.",
      },
      {
        question: "Do guests need the original PDF?",
        answer:
          "No. Once the event page is published, guests can use the live link instead of downloading or forwarding the original PDF.",
      },
    ],
  },
  {
    slug: "flyer-to-event-page",
    title: "How to turn a flyer into an event page | Envitefy Guides",
    description:
      "Use Envitefy Snap to turn a flyer, screenshot, or image invitation into a mobile-friendly hosted event page.",
    h1: "How do I turn a flyer into an event page?",
    eyebrow: "Flyer upload guide",
    routeLabel: "Snap upload",
    productSurface: "Envitefy Snap",
    heroImage: "/images/about/hero/flyer-placeholder.webp",
    heroImageAlt: "A colorful event flyer being used as the starting point for an Envitefy page",
    heroImagePosition: "center",
    intro:
      "Snap or upload the flyer, confirm the details Envitefy finds, and share a live event page instead of another screenshot.",
    directAnswer:
      "Envitefy helps hosts and parents convert flyer-style event information into structured pages with RSVP, calendar, map, and sharing actions.",
    stats: [
      { value: "Image", label: "Starting point" },
      { value: "Review", label: "Host step" },
      { value: "Share", label: "Final action" },
    ],
    sections: [
      {
        heading: "From image to structured details",
        body: "Envitefy reads flyer text and turns it into editable event fields such as title, time, venue, address, notes, links, and category.",
      },
      {
        heading: "Useful for busy family logistics",
        body: "Flyers often arrive through texts, school apps, emails, and screenshots. Envitefy gives families a stable page to revisit and share.",
      },
      {
        heading: "What to check before sharing",
        body: "Hosts should review dates, times, addresses, and links before publishing. Envitefy keeps the result editable so corrected details can replace the original flyer confusion.",
      },
    ],
    steps: [
      {
        label: "Capture",
        title: "Upload or snap the flyer",
        body: "Start from a poster, screenshot, image invitation, or school flyer without retyping it all.",
      },
      {
        label: "Clean up",
        title: "Verify every field",
        body: "Correct misspellings, add missing links, and remove decorative copy that guests do not need.",
      },
      {
        label: "Choose",
        title: "Enable the right actions",
        body: "Add RSVP, calendar, map, registry, signup, or registration links depending on the event.",
      },
      {
        label: "Send",
        title: "Replace the screenshot",
        body: "Share the hosted event page so guests have one place to return for updates.",
      },
    ],
    checklist: [
      {
        title: "Readable source",
        body: "Use the clearest image available so small venue, date, and link text is easier to confirm.",
      },
      {
        title: "Link destinations",
        body: "If the flyer mentions a QR code, registration page, or signup, add the actual URL to the page.",
      },
      {
        title: "Audience fit",
        body: "School and team flyers often need notes for parents, parking, arrival windows, or supplies.",
      },
      {
        title: "Update path",
        body: "Use the live page when details change instead of sending a new screenshot to every thread.",
      },
    ],
    useCases: [
      "School events and classroom activities",
      "Team parties, clinics, and practices",
      "Community posters and local events",
      "Screenshot invitations from a group chat",
    ],
    guestValue: [
      "No need to zoom into a blurry screenshot",
      "Calendar, map, RSVP, and link actions can sit next to the details",
      "Parents can forward a clean page instead of image attachments",
      "The same link can reflect corrected event information",
    ],
    cta: { label: "Try Snap", href: "/snap" },
    secondaryCta: { label: "Compare PDF uploads", href: "/guides/pdf-to-event-page" },
    relatedLinks: [
      { label: "PDF to event page", href: "/guides/pdf-to-event-page" },
      { label: "Share without an app", href: "/guides/share-event-page-without-app" },
      { label: "See live card examples", href: "/showcase" },
    ],
    faq: [
      {
        question: "Can Envitefy create an event page from a flyer image?",
        answer:
          "Yes. Envitefy Snap can use a flyer image or screenshot as the starting point for a hosted event page.",
      },
      {
        question: "Can I edit the event details after upload?",
        answer:
          "Yes. Hosts can review and adjust the extracted information before sharing the page.",
      },
    ],
  },
  {
    slug: "live-card-invitations",
    title: "What are live card invitations? | Envitefy Guides",
    description:
      "Learn how Envitefy live card invitations combine designed cards, hosted pages, RSVP actions, registry links, maps, and calendar saves.",
    h1: "What are live card invitations?",
    eyebrow: "Live card guide",
    routeLabel: "Studio",
    productSurface: "Envitefy Studio",
    heroImage: "/images/studio/editor-preview.webp",
    heroImageAlt: "Envitefy Studio showing a designed live card invitation preview",
    heroImagePosition: "center",
    intro:
      "Live card invitations are shareable event cards connected to a hosted page, so the design, details, RSVP, links, and updates live together.",
    directAnswer:
      "Envitefy live cards are not just static invitation images. They are mobile-friendly event pages with card design, guest actions, and details that can stay current after sharing.",
    stats: [
      { value: "Card", label: "Visual layer" },
      { value: "Page", label: "Details layer" },
      { value: "Actions", label: "Guest layer" },
    ],
    sections: [
      {
        heading: "What a live card can include",
        body: "A live card can include event art, title, schedule, venue, RSVP action, registry link, calendar save, map link, and notes for guests.",
      },
      {
        heading: "Created from Studio or uploads",
        body: "Hosts can design from scratch in Studio or start from an existing invite, flyer, screenshot, or PDF through Snap.",
      },
      {
        heading: "Why it helps guests",
        body: "Guests get one page they can open from a text or email. If the host updates details, the shared page reflects the latest information.",
      },
    ],
    steps: [
      {
        label: "Design",
        title: "Pick a visual direction",
        body: "Use Studio when the invitation should feel polished, personal, and ready to share.",
      },
      {
        label: "Connect",
        title: "Attach real event details",
        body: "Add the date, time, place, RSVP, calendar, registry, map, and notes behind the card.",
      },
      {
        label: "Preview",
        title: "Check mobile and desktop",
        body: "Make sure the card reads clearly and the event actions are easy to find.",
      },
      {
        label: "Update",
        title: "Keep the link current",
        body: "After sharing, update details on the live page instead of sending corrected images.",
      },
    ],
    checklist: [
      {
        title: "Readable invitation copy",
        body: "Keep the card title, date, and location legible on mobile screens.",
      },
      {
        title: "Guest action priority",
        body: "Put RSVP, calendar, map, and registry actions where guests naturally look first.",
      },
      {
        title: "Useful event notes",
        body: "Add arrival, parking, dress code, gift, food, or schedule notes to the hosted details.",
      },
      {
        title: "Share channel",
        body: "Use the same live link in text messages, email, social posts, or group chats.",
      },
    ],
    useCases: [
      "Birthday parties and showers",
      "Weddings and weekend events",
      "Team dinners and community gatherings",
      "Hosts who want design plus practical guest actions",
    ],
    guestValue: [
      "Open a designed invitation and the practical event details together",
      "Respond, save, map, or follow registry links without searching a message thread",
      "Use the same link after the host updates event information",
      "Share the invite without losing the source of truth",
    ],
    cta: { label: "Open Studio", href: "/studio" },
    secondaryCta: { label: "View showcase", href: "/showcase" },
    relatedLinks: [
      { label: "Live card showcase", href: "/showcase" },
      { label: "RSVP event pages", href: "/guides/rsvp-event-page" },
      { label: "Snap uploads", href: "/snap" },
    ],
    faq: [
      {
        question: "Is a live card the same as a static invitation image?",
        answer:
          "No. A live card can include an invitation design, but it also supports hosted event details and guest actions.",
      },
      {
        question: "Can live cards include registry links?",
        answer:
          "Yes. Hosts can include helpful links such as registries, signups, ticket pages, or outside event resources.",
      },
    ],
  },
  {
    slug: "rsvp-event-page",
    title: "How to make an RSVP event page | Envitefy Guides",
    description:
      "Create a hosted event page with RSVP actions, calendar saves, map links, registry links, and guest-friendly sharing.",
    h1: "How do I make an RSVP event page?",
    eyebrow: "RSVP event page guide",
    routeLabel: "Event page",
    productSurface: "Hosted event pages",
    heroImage: "/images/landing/guest-flow/rsvp-table-placeholder.webp",
    heroImageAlt: "An RSVP guest list surface connected to a hosted Envitefy event page",
    heroImagePosition: "center",
    intro:
      "Create or upload an event in Envitefy, add the RSVP and guest details, then share the live page link by text or email.",
    directAnswer:
      "Envitefy RSVP event pages give hosts a mobile-friendly place for event details and guest actions, including RSVP links, calendar saves, map links, and related resources.",
    stats: [
      { value: "Yes/No", label: "Guest response" },
      { value: "Maps", label: "Arrival help" },
      { value: "Calendar", label: "Reminder path" },
    ],
    sections: [
      {
        heading: "What guests can do",
        body: "Guests can open the page, review event details, respond through RSVP options when enabled, save the event to a calendar, and use links for maps, registries, or other resources.",
      },
      {
        heading: "How hosts create one",
        body: "Hosts can start with Studio, Snap/upload, or a structured event flow, then publish a hosted page once the details are ready.",
      },
      {
        heading: "Where it fits",
        body: "RSVP pages work well for birthday parties, showers, school events, community events, team gatherings, and any event where guests need one reliable source of truth.",
      },
    ],
    steps: [
      {
        label: "Create",
        title: "Start the event",
        body: "Use Studio, Snap, or an event flow depending on whether you are designing, uploading, or building from scratch.",
      },
      {
        label: "Enable",
        title: "Add RSVP behavior",
        body: "Decide what guest response you need and make the RSVP action visible on the page.",
      },
      {
        label: "Support",
        title: "Add practical links",
        body: "Include map, calendar, registry, signup, ticket, or outside links that reduce follow-up questions.",
      },
      {
        label: "Track",
        title: "Share and monitor",
        body: "Send the live link and use the page as the current source for guest decisions.",
      },
    ],
    checklist: [
      {
        title: "Response deadline",
        body: "Tell guests when to respond, especially when headcount, food, seating, or supplies matter.",
      },
      {
        title: "Plus-ones and family groups",
        body: "Clarify whether guests can bring others and what information the host needs.",
      },
      {
        title: "Arrival context",
        body: "Add parking, entrance, room, field, or building notes next to the map action.",
      },
      {
        title: "Follow-up links",
        body: "Place registries, signups, tickets, or forms in the page instead of scattered messages.",
      },
    ],
    useCases: [
      "Parties where hosts need a headcount",
      "Showers, weddings, and family events",
      "School and team gatherings",
      "Events with maps, calendars, registries, or extra forms",
    ],
    guestValue: [
      "Answer from the same page that holds the details",
      "Save the event and get directions without asking the host",
      "Find registries, signups, ticket pages, or forms from one place",
      "Return to a live page instead of a stale invitation image",
    ],
    cta: { label: "Start with Studio", href: "/studio" },
    secondaryCta: { label: "Browse examples", href: "/showcase" },
    relatedLinks: [
      { label: "Live card invitations", href: "/guides/live-card-invitations" },
      { label: "Share without an app", href: "/guides/share-event-page-without-app" },
      { label: "Browse examples", href: "/showcase" },
    ],
    faq: [
      {
        question: "Can Envitefy event pages include RSVP links?",
        answer:
          "Yes. Envitefy event pages can support RSVP-oriented sharing and guest actions alongside the event details.",
      },
      {
        question: "Can guests save the event to a calendar?",
        answer:
          "Yes. Envitefy is designed around structured event details so guests can save events to calendars when calendar actions are available.",
      },
    ],
  },
  {
    slug: "gymnastics-meet-page",
    title: "How to create a gymnastics meet page | Envitefy Guides",
    description:
      "Create mobile-friendly gymnastics meet pages with schedules, venue details, hotel blocks, maps, session notes, and live sharing.",
    h1: "How do I create a gymnastics meet page?",
    eyebrow: "Gymnastics meet guide",
    routeLabel: "Gymnastics",
    productSurface: "Envitefy Gymnastics",
    heroImage: "/images/marketing/use-case-gymnastics.webp",
    heroImageAlt: "A gymnastics meet page preview for families and spectators",
    heroImagePosition: "center",
    intro:
      "Use Envitefy Gymnastics to publish a meet page with schedule details, venue information, hotel blocks, maps, and parent-friendly sharing.",
    directAnswer:
      "Envitefy Gymnastics is built for meet organizers, coaches, parents, athletes, and spectators who need a clean live page instead of scattered PDFs and text updates.",
    stats: [
      { value: "Sessions", label: "Schedule focus" },
      { value: "Venue", label: "Arrival focus" },
      { value: "Hotels", label: "Travel focus" },
    ],
    sections: [
      {
        heading: "What a meet page can hold",
        body: "Meet pages can include session schedules, venue details, hotel information, travel notes, map links, scores or resource links, and updates for families.",
      },
      {
        heading: "Why gymnastics gets a dedicated surface",
        body: "Meet logistics are more complex than a basic party invite. Families need session timing, location context, hotel details, and updates in one mobile-friendly place.",
      },
      {
        heading: "Who uses it",
        body: "Gymnastics families, coaches, meet directors, clubs, and spectators can use Envitefy pages to reduce repeat questions and keep details easy to find.",
      },
    ],
    steps: [
      {
        label: "Source",
        title: "Start from meet materials",
        body: "Use a packet, schedule, flyer, or known meet details as the source of truth.",
      },
      {
        label: "Structure",
        title: "Organize sessions and venue info",
        body: "Separate schedule details, address, arrival notes, hotels, and helpful resource links.",
      },
      {
        label: "Publish",
        title: "Create the meet page",
        body: "Give families a mobile page they can open before travel, at the venue, and during updates.",
      },
      {
        label: "Maintain",
        title: "Keep updates visible",
        body: "Use the live page when session timing, parking, hotel, or resource links change.",
      },
    ],
    checklist: [
      {
        title: "Session clarity",
        body: "Call out session timing, doors, warmups, awards, and level or squad context when available.",
      },
      {
        title: "Venue arrival",
        body: "Include the address, map action, parking notes, entrance details, and spectator instructions.",
      },
      {
        title: "Travel resources",
        body: "Add hotel blocks, deadlines, booking links, and nearby notes when families are traveling.",
      },
      {
        title: "Official references",
        body: "Keep meet packets, score links, or sanction resources available without making families dig.",
      },
    ],
    useCases: [
      "Meet directors publishing family information",
      "Coaches sharing schedules and updates",
      "Parents tracking session timing and travel details",
      "Spectators looking for venue and resource links",
    ],
    guestValue: [
      "Find session, venue, hotel, and map details without opening a large packet",
      "Share one page with grandparents, athletes, parents, and spectators",
      "Return to a live source when meet logistics change",
      "Keep official resources and practical notes in the same place",
    ],
    cta: { label: "Explore Gymnastics", href: "/gymnastics" },
    secondaryCta: { label: "Turn a PDF into a page", href: "/guides/pdf-to-event-page" },
    relatedLinks: [
      { label: "PDF to event page", href: "/guides/pdf-to-event-page" },
      { label: "Flyer to event page", href: "/guides/flyer-to-event-page" },
      { label: "How Envitefy works", href: "/how-it-works" },
    ],
    faq: [
      {
        question: "Can Envitefy make gymnastics meet pages?",
        answer:
          "Yes. Envitefy Gymnastics is designed for meet pages with schedules, venue details, hotels, maps, and updates.",
      },
      {
        question: "Can a gymnastics meet page start from a PDF or schedule?",
        answer:
          "Yes. Snap/upload workflows can help turn meet PDFs and schedules into structured event information for a page.",
      },
    ],
  },
  {
    slug: "share-event-page-without-app",
    title: "Share an event page without an app | Envitefy Guides",
    description:
      "Envitefy lets hosts share event pages guests can open from a browser link without installing an app.",
    h1: "Can I share an event page without guests installing an app?",
    eyebrow: "Guest access guide",
    routeLabel: "Browser link",
    productSurface: "Hosted event pages",
    heroImage: "/images/about/hero/event-page-placeholder.webp",
    heroImageAlt: "A hosted event page guests can open from a browser link",
    heroImagePosition: "center",
    intro:
      "Yes. Envitefy event pages are hosted on the web, so guests can open the shared link from text, email, or a browser without installing an app.",
    directAnswer:
      "Envitefy is designed for low-friction guest access. Hosts can share one live link, and guests can view details, use links, RSVP options, maps, and calendar actions from the web.",
    stats: [
      { value: "No app", label: "Guest setup" },
      { value: "One link", label: "Share method" },
      { value: "Live", label: "Update model" },
    ],
    sections: [
      {
        heading: "How guests access the page",
        body: "Guests open the event link in their mobile or desktop browser. The page can be shared through text, email, group chats, or other messaging tools.",
      },
      {
        heading: "What guests can do from the link",
        body: "Depending on the event setup, guests can read details, RSVP, save to calendar, open maps, follow registry links, and return later for updates.",
      },
      {
        heading: "Why hosts use a live link",
        body: "A live page avoids asking every guest to install software and keeps updates in one place after the invitation has already been sent.",
      },
    ],
    steps: [
      {
        label: "Create",
        title: "Publish the hosted event page",
        body: "Build the page from Studio, Snap, or a structured event flow.",
      },
      {
        label: "Copy",
        title: "Use the live URL",
        body: "Share the page link anywhere guests already communicate.",
      },
      {
        label: "Guide",
        title: "Keep actions obvious",
        body: "Make RSVP, map, calendar, registry, and signup links visible to guests.",
      },
      {
        label: "Update",
        title: "Change the page, not the thread",
        body: "When details change, update the hosted page so every old share still points to the current information.",
      },
    ],
    checklist: [
      {
        title: "Mobile readability",
        body: "Most guests will open the page from a phone, so titles, dates, and action buttons need to scan quickly.",
      },
      {
        title: "Clear sharing copy",
        body: "Send one short message with the link and the action you need guests to take.",
      },
      {
        title: "Current details",
        body: "Use the page for corrections instead of expecting guests to remember a newer text update.",
      },
      {
        title: "Action coverage",
        body: "Add the links guests otherwise ask for: RSVP, calendar, map, registry, signup, ticket, or form.",
      },
    ],
    useCases: [
      "Guests who will not install another app",
      "Family group texts and school parent threads",
      "Hosts who need one current source of truth",
      "Events where links and updates matter after sharing",
    ],
    guestValue: [
      "Open the event from any browser",
      "Use the same link from text, email, or a group chat",
      "Find event actions without creating an account",
      "Return to current details after host updates",
    ],
    cta: { label: "See examples", href: "/showcase" },
    secondaryCta: { label: "Make an RSVP page", href: "/guides/rsvp-event-page" },
    relatedLinks: [
      { label: "RSVP event pages", href: "/guides/rsvp-event-page" },
      { label: "Live card invitations", href: "/guides/live-card-invitations" },
      { label: "Start with Snap", href: "/snap" },
    ],
    faq: [
      {
        question: "Do guests need an app to view an Envitefy event page?",
        answer:
          "No. Guests can open shared Envitefy event pages in a browser from a text, email, or copied link.",
      },
      {
        question: "Can guests use RSVP and calendar links from the browser?",
        answer:
          "Yes. Guest actions are designed to work from the hosted event page when those options are available for the event.",
      },
    ],
  },
];

export const guideBySlug = Object.fromEntries(
  guidePages.map((guide) => [guide.slug, guide]),
) as Record<GuideSlug, GuidePage>;

export function buildGuideMetadata(slug: GuideSlug): Metadata {
  const guide = guideBySlug[slug];
  const path = `/guides/${guide.slug}`;

  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: path },
    openGraph: {
      title: guide.title,
      description: guide.description,
      url: `${SITE_URL}${path}`,
      siteName: "Envitefy",
      images: [buildSiteOgImage(DEFAULT_IMAGE)],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description: guide.description,
      images: [DEFAULT_IMAGE],
    },
  };
}

export function GuidePageView({ slug }: { slug: GuideSlug }) {
  const guide = guideBySlug[slug];
  const visual = guideVisuals[guide.slug];
  const GuideIcon = visual.icon;
  const url = `${SITE_URL}/guides/${guide.slug}`;
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${SITE_URL}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Guides",
        item: `${SITE_URL}/guides`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: guide.h1,
        item: url,
      },
    ],
  };
  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: guide.h1,
    url,
    description: guide.description,
    isPartOf: {
      "@type": "WebSite",
      name: "Envitefy",
      url: SITE_URL,
    },
    about: ["event pages", "live cards", "RSVPs", "calendar saves", "Envitefy", ...guide.useCases],
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <main
      className="min-h-screen overflow-hidden bg-[#f7f8f3] text-[#202124]"
      style={{ fontFamily: pageFont }}
    >
      <GuidesTopNav />
      <article>
        <section className="relative border-b border-[#d9ded3]">
          <img
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-[0.18]"
            src={guide.heroImage}
            style={{ objectPosition: guide.heroImagePosition ?? "center" }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(247,248,243,0.99)_0%,rgba(247,248,243,0.92)_58%,rgba(247,248,243,0.72)_100%)]" />

          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-12 pt-32 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.78fr)] lg:px-8 lg:pb-16 lg:pt-36">
            <div>
              <nav className="mb-8 text-sm font-semibold text-[#50605e]" aria-label="Breadcrumb">
                <Link href="/guides" className="hover:text-[#202124]">
                  Guides
                </Link>
                <span className="mx-2 text-[#8a938c]">/</span>
                <span>{guide.routeLabel}</span>
              </nav>

              <p
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${visual.badge}`}
              >
                <GuideIcon className="h-4 w-4" />
                {guide.eyebrow}
              </p>
              <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-[1.04] text-[#202124] sm:text-5xl lg:text-6xl">
                {guide.h1}
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-[#4f5c5a] sm:text-xl">
                {guide.intro}
              </p>
              <div className="mt-6 max-w-3xl rounded-lg border border-white/72 bg-white/58 p-5 shadow-[0_16px_44px_rgba(32,49,55,0.08)] backdrop-blur-md">
                <p className="text-xs font-bold uppercase text-[#6f7b75]">Short answer</p>
                <p className="mt-3 text-base leading-7 text-[#303735]">{guide.directAnswer}</p>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={guide.cta.href}
                  className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold shadow-[0_16px_36px_rgba(32,33,36,0.14)] transition ${visual.button}`}
                >
                  {guide.cta.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={guide.secondaryCta.href}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#bfc9bd] bg-white/74 px-6 py-3 text-sm font-semibold text-[#202124] transition hover:bg-white"
                >
                  {guide.secondaryCta.label}
                </Link>
              </div>
            </div>

            <aside className="rounded-lg border border-[#d9ded3] bg-white/78 p-4 shadow-[0_20px_60px_rgba(32,33,36,0.10)] backdrop-blur-md">
              <div className="aspect-[4/3] overflow-hidden rounded-lg bg-[#e8ece3]">
                <img
                  alt={guide.heroImageAlt}
                  className="h-full w-full object-cover"
                  src={guide.heroImage}
                  style={{ objectPosition: guide.heroImagePosition ?? "center" }}
                />
              </div>
              <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-[#d9ded3] pt-5">
                {guide.stats.map((stat) => (
                  <div key={`${guide.slug}-${stat.label}`} className="min-w-0">
                    <dt className="text-xs font-semibold text-[#6b746d]">{stat.label}</dt>
                    <dd className={`mt-2 text-lg font-bold ${visual.accent}`}>{stat.value}</dd>
                  </div>
                ))}
              </dl>
            </aside>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-sm font-bold text-[#68736d]">Guide fit</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#202124]">
              Use this path when these details matter.
            </h2>
            <p className="mt-4 leading-7 text-[#52605c]">
              The strongest event pages are not generic. They match the source, the host workflow,
              and the guest questions that show up after the invite is sent.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {guide.useCases.map((item) => (
              <div
                key={item}
                className="rounded-lg border border-[#d9ded3] bg-white p-5 shadow-[0_12px_34px_rgba(32,49,55,0.06)]"
              >
                <CheckCircle2 className={`h-5 w-5 ${visual.accent}`} />
                <p className="mt-3 text-sm font-semibold leading-6 text-[#303735]">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {guide.sections.map((section) => (
              <section
                key={section.heading}
                className="rounded-lg border border-[#d9ded3] bg-white p-6 shadow-[0_14px_40px_rgba(32,49,55,0.06)]"
              >
                <h2 className="text-xl font-bold leading-7 text-[#202124]">{section.heading}</h2>
                <p className="mt-4 leading-7 text-[#52605c]">{section.body}</p>
              </section>
            ))}
          </div>
        </section>

        <section className="border-y border-[#d9ded3] bg-white/72 px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-bold text-[#68736d]">Workflow</p>
                <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#202124]">
                  Build it in {guide.productSurface}.
                </h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-[#52605c]">
                Treat the source as a starting point, then publish a live page guests can use from
                any browser.
              </p>
            </div>

            <ol className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {guide.steps.map((step, index) => (
                <li
                  key={step.title}
                  className="rounded-lg border border-[#d9ded3] bg-[#f7f8f3] p-5 shadow-[0_12px_30px_rgba(32,49,55,0.05)]"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${visual.iconWrap}`}
                    >
                      {index + 1}
                    </span>
                    <span className="text-sm font-bold text-[#6b746d]">{step.label}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold leading-7 text-[#202124]">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#52605c]">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="rounded-lg bg-[#203137] p-6 text-white sm:p-8">
            <div className="flex items-center gap-3">
              <ListChecks className="h-6 w-6 text-[#b8e0d4]" />
              <h2 className="text-2xl font-semibold text-white" style={{ color: "#ffffff" }}>
                Before you publish
              </h2>
            </div>
            <div className="mt-6 space-y-5">
              {guide.checklist.map((item) => (
                <div
                  key={item.title}
                  className="border-t border-white/14 pt-5 first:border-t-0 first:pt-0"
                >
                  <h3 className="font-bold text-white" style={{ color: "#ffffff" }}>
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/76">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#d9ded3] bg-white p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <CalendarCheck className={`h-6 w-6 ${visual.accent}`} />
              <h2 className="text-2xl font-semibold text-[#202124]">What guests get</h2>
            </div>
            <ul className="mt-6 space-y-4">
              {guide.guestValue.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-[#52605c]">
                  <CheckCircle2 className={`mt-0.5 h-5 w-5 shrink-0 ${visual.accent}`} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="grid gap-6 rounded-lg border border-[#d9ded3] bg-[#fefcf7] p-6 sm:p-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
            <div>
              <p className="text-sm font-bold text-[#68736d]">Related Envitefy resources</p>
              <h2 className="mt-3 text-2xl font-semibold leading-tight text-[#202124]">
                Continue with the next best page.
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {guide.relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex min-h-16 items-center justify-between gap-3 rounded-lg border border-[#d9ded3] bg-white px-4 py-3 text-sm font-semibold text-[#303735] transition hover:border-[#aebbac] hover:bg-[#f7f8f3]"
                >
                  {link.label}
                  <ExternalLink className="h-4 w-4 shrink-0 text-[#7b847d]" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <ClipboardCheck className={`h-6 w-6 ${visual.accent}`} />
            <h2 className="text-2xl font-semibold text-[#202124]">FAQ</h2>
          </div>
          <div className="mt-5 space-y-3">
            {guide.faq.map((item) => (
              <details
                key={item.question}
                className="rounded-lg border border-[#d9ded3] bg-white p-5"
              >
                <summary className="cursor-pointer text-base font-semibold text-[#202124]">
                  {item.question}
                </summary>
                <p className="mt-3 leading-7 text-[#52605c]">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </article>

      <Script id={`ld-guide-webpage-${guide.slug}`} type="application/ld+json">
        {JSON.stringify(webPageLd)}
      </Script>
      <Script id={`ld-guide-breadcrumb-${guide.slug}`} type="application/ld+json">
        {JSON.stringify(breadcrumbLd)}
      </Script>
      <Script id={`ld-guide-faq-${guide.slug}`} type="application/ld+json">
        {JSON.stringify(faqLd)}
      </Script>
    </main>
  );
}
