import type { Metadata } from "next";
import Script from "next/script";
import CompanyPageShell from "@/components/company/CompanyPageShell";
import FAQs, { type FAQItem } from "@/components/ui/faqs-component";
import { buildSiteOgImage, getRandomSiteOgImageUrl } from "@/lib/site-og-images";

const siteOgImageUrl = getRandomSiteOgImageUrl();
type FaqPageItem = Omit<FAQItem, "answer"> & { answer: string };

export const metadata: Metadata = {
  title: "Envitefy FAQ",
  description:
    "Answers about creating events, Envitefy Snap, Envitefy Concierge, live pages, RSVP, smart sign-ups, calendars, privacy, and sharing.",
  openGraph: {
    title: "Envitefy FAQ",
    description:
      "Find answers about Envitefy creation tools, live event pages, guest actions, calendars, privacy, and sharing.",
    url: "https://envitefy.com/faq",
    siteName: "Envitefy",
    images: [buildSiteOgImage(siteOgImageUrl)],
    type: "website",
  },
  alternates: { canonical: "/faq" },
};

const faqItems: FaqPageItem[] = [
  {
    id: "ways-to-create",
    question: "How can I create an event in Envitefy?",
    answer:
      "Start with Envitefy Snap when you have a photo or file, describe the event to Envitefy Concierge, or use a template, manual creation, or Studio. Each path gives you event details and a guest experience to review before sharing.",
  },
  {
    id: "snap-uploads",
    question: "What can I upload with Envitefy Snap?",
    answer:
      "Snap accepts camera photos and uploads of invitations, flyers, screenshots, schedules, PDFs, and other event images. It extracts useful details for you to review, then creates a saved event and polished live page instead of stopping at a scan or text copy.",
  },
  {
    id: "envitefy-concierge",
    question: "What is Envitefy Concierge?",
    answer:
      "Envitefy Concierge turns a plain-language event idea or uploaded context into an editable invitation and guest-ready live page. It can ask for missing details and shape the RSVP, calendar, directions, registry, updates, reminders, or sign-up experience when the event needs them.",
  },
  {
    id: "my-events-invited-events",
    question: "What is the difference between My events and Invited events?",
    answer:
      "My events contains events you create and own, including a flyer, schedule, PDF, or other source material you upload for something you are hosting. Invited events contains classic invitation cards you received, such as a birthday, wedding, gender reveal, or similar social invitation.",
  },
  {
    id: "share-without-app",
    question: "Do guests need an app or Envitefy account?",
    answer:
      "No. Shared event pages and smart sign-up forms open in phone and desktop browsers. Guests can use the actions available on the page without installing an app or creating an account.",
  },
  {
    id: "live-card-invitation",
    question: "What is a live event page or live card?",
    answer:
      "It is a hosted, mobile-friendly event home where the invitation, latest details, and available guest actions stay together. Depending on the event, those actions can include RSVP, schedules, directions, calendars, registries, and sign-up slots.",
  },
  {
    id: "guest-updates",
    question: "If I change event details, do guests need a new link?",
    answer:
      "No. Update the event and the same shared link remains the current place for guests to check timing, locations, schedules, instructions, and other live details.",
  },
  {
    id: "event-access-codes",
    question: "Can an event page require an access code?",
    answer:
      "Yes, for supported event pages. A host can add a per-event access code so guests must unlock the page before continuing to its details and RSVP experience.",
  },
  {
    id: "event-page-rsvp",
    question: "Can guests RSVP directly from the event page?",
    answer:
      "Yes, when RSVP is enabled for that event. Supported pages can collect yes, maybe, and no responses without sending guests to a disconnected form or requiring an app.",
  },
  {
    id: "rsvp-details",
    question: "What information can an RSVP collect?",
    answer:
      "Supported flows can collect household or party size, adults, kids, siblings, plus-ones, guest messages, allergies, dietary needs, meal choices, and event-specific answers. The fields vary by event type and host settings.",
  },
  {
    id: "host-rsvp-tracking",
    question: "Can hosts track RSVP responses?",
    answer:
      "Yes, for events with RSVP enabled. Host views can organize response counts, yes, maybe, no, pending guests, recent replies, headcounts, and event-specific answers in one place.",
  },
  {
    id: "smart-signups",
    question: "What are smart sign-up forms?",
    answer:
      "Smart sign-ups coordinate volunteers, potluck food, supplies, shifts, classroom needs, fundraisers, team snacks, and custom slots. Organizers can set quantities, capacity, time windows, per-person limits, full-slot locking, and automatic waitlists, then share the live form by link or QR code.",
  },
  {
    id: "calendar-saves",
    question: "Which calendars does Envitefy support?",
    answer:
      "Live pages can offer Google Calendar, Apple Calendar through an ICS handoff, and Outlook calendar actions. Signed-in owners can connect Google Calendar or Outlook to automatically sync newly scanned events; Apple Calendar uses a one-event ICS save.",
  },
  {
    id: "maps-and-schedules",
    question: "Can an event page include directions and a detailed schedule?",
    answer:
      "Yes, when those details apply. Pages can combine maps and directions with venue, parking, arrival, drop-off, pickup, travel, single-event timing, multi-part itineraries, or multi-session schedules.",
  },
  {
    id: "registry-links",
    question: "Can I include registry, gift, or fund links?",
    answer:
      "Yes, on supported events. Hosts can keep major registry providers and custom registry, wishlist, gift, or fund links beside the invitation so guests do not have to search for them separately.",
  },
  {
    id: "specialized-event-types",
    question: "Which event types have specialized experiences?",
    answer:
      "Envitefy includes specialized paths for weddings and wedding weekends; birthdays, showers, gender reveals, anniversaries, and family celebrations; gymnastics and sports; school, volunteer, community, workplace, real-estate, appointment, workshop, and custom events.",
  },
  {
    id: "review-automated-results",
    question: "Should I review details created by Snap or Envitefy Concierge?",
    answer:
      "Yes. Automated extraction and generated content can be incomplete or wrong. Review names, dates, times, time zones, locations, links, permissions, guest information, and wording before publishing, sharing, traveling, or saving anything to a calendar.",
  },
  {
    id: "product-improvement-data",
    question: "Does Envitefy use service data to improve the product?",
    answer:
      "Except for Google user data, Envitefy may use service, usage, feedback, and submitted content to operate, secure, evaluate, and improve current and future Envitefy products as explained in the Privacy Policy. Information received from Google APIs is used only to provide or improve the Google-connected functionality you request and is not used for generalized product improvement, advertising, or AI training. Optional site analytics stays off unless you allow it.",
  },
];

const faqPairs = faqItems.map((item) => [item.question, item.answer] as const);

const faqHighlights = [
  { value: "Create", label: "Upload, describe, or design" },
  { value: "No app", label: "Guest-ready browser links" },
  { value: "Coordinate", label: "RSVP, sign-ups, calendar" },
] as const;

export default function FaqPage() {
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://envitefy.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "FAQ",
        item: "https://envitefy.com/faq",
      },
    ],
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqPairs.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <CompanyPageShell
      eyebrow="FAQ"
      title="Clear answers for hosts and guests."
      description="Find quick answers about creating events, live pages, RSVP, smart sign-ups, calendars, privacy, and what guests can do from one shared link."
      primaryLabel="Start creating"
      primaryHref="/"
      secondaryLabel="Contact us"
      secondaryHref="/contact"
      highlights={faqHighlights}
    >
      <FAQs
        items={faqItems}
        title="Frequently asked questions"
        description="Answers about Envitefy creation tools, hosted event pages, guest actions, calendars, privacy, and sharing."
        headingLevel="h2"
        showHeader={false}
        className="border-t border-[#d9ded3] bg-white/72 px-4 py-16 sm:px-6 lg:py-24"
        accordionClassName="rounded-lg border-[#d9ded3] bg-white px-4 py-2 shadow-[0_24px_64px_rgba(32,49,55,0.08)] sm:px-6"
      />
      <Script id="ld-breadcrumb-faq" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(breadcrumbLd)}
      </Script>
      <Script id="ld-faq" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(faqLd)}
      </Script>
    </CompanyPageShell>
  );
}
