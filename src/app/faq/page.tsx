import type { Metadata } from "next";
import Script from "next/script";
import FAQs, { type FAQItem } from "@/components/ui/faqs-component";
import { buildSiteOgImage, getRandomSiteOgImageUrl } from "@/lib/site-og-images";

const siteOgImageUrl = getRandomSiteOgImageUrl();
type FaqPageItem = Omit<FAQItem, "answer"> & { answer: string };

export const metadata: Metadata = {
  title: "Envitefy FAQ",
  description: "Answers about Snap accounts, Gymnastics accounts, event sharing, and calendars.",
  openGraph: {
    title: "Envitefy FAQ",
    description: "Find answers about Snap, Gymnastics, calendars, and existing accounts.",
    url: "https://envitefy.com/faq",
    siteName: "Envitefy",
    images: [buildSiteOgImage(siteOgImageUrl)],
    type: "website",
  },
  alternates: { canonical: "/faq" },
};

const faqItems: FaqPageItem[] = [
  {
    id: "share-without-app",
    question: "Can I share my event without guests downloading an app?",
    answer:
      "Yes. Guests can open and RSVP through a shared email or text link, so no app download is required.",
  },
  {
    id: "pdf-to-event-page",
    question: "Can Envitefy turn a PDF into an event page?",
    answer:
      "Yes. Snap can process PDFs with event details and help create a hosted event page with RSVP, links, maps, and calendar actions.",
  },
  {
    id: "flyer-invite-screenshot",
    question: "Can I upload a flyer or invite screenshot?",
    answer:
      "Yes. Envitefy Snap accepts flyers, invite screenshots, images, and schedules, then lets you review the extracted event details before saving or sharing.",
  },
  {
    id: "live-card-invitation",
    question: "What is a live card invitation?",
    answer:
      "A live card is a shareable invitation connected to a hosted event page, so the design, details, RSVP actions, and updates live together.",
  },
  {
    id: "event-page-rsvp",
    question: "Can Envitefy event pages include RSVP links?",
    answer:
      "Yes. Event pages can include RSVP-oriented guest actions alongside event details, maps, links, and calendar saves.",
  },
  {
    id: "calendar-saves",
    question: "Can guests save events to a calendar?",
    answer:
      "Yes. Envitefy keeps dates, times, and locations structured so calendar save actions can be available from the shared page.",
  },
  {
    id: "registry-links",
    question: "Can I include registry links or outside resources?",
    answer:
      "Yes. Hosts can include helpful links such as registries, signups, tickets, meet resources, or other event pages.",
  },
  {
    id: "gymnastics-meet-pages",
    question: "Does Envitefy support gymnastics meet pages?",
    answer:
      "Yes. Envitefy Gymnastics supports meet pages with schedules, venue details, hotel information, maps, and parent-friendly sharing.",
  },
  {
    id: "co-manage-events",
    question: "Can I co-manage events with other Envitefy users?",
    answer:
      "Yes. Invite another Envitefy user from the share menu and they will accept from their email to stay synced on every change.",
  },
  {
    id: "guest-updates",
    question: "If I change event details, do guests see the update?",
    answer:
      "Yes. The shared link reflects the latest info, so guests can return to the same page for current details.",
  },
  {
    id: "snap-gymnastics-access",
    question: "How do Snap and Gymnastics access work?",
    answer:
      "Snap is available to every account. Gymnastics accounts include both gymnastics and snap access.",
  },
];

const faqPairs = faqItems.map((item) => [item.question, item.answer] as const);

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
    <main className="min-h-screen w-full bg-[linear-gradient(180deg,#fffaf7_0%,#f7f4ff_100%)] text-foreground">
      <FAQs
        items={faqItems}
        title="Frequently asked questions"
        description="Answers about Snap, Gymnastics, calendars, hosted event pages, RSVP, registry links, and existing accounts."
        headingLevel="h1"
        className="pt-12 md:pt-16"
      />
      <Script id="ld-breadcrumb-faq" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(breadcrumbLd)}
      </Script>
      <Script id="ld-faq" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(faqLd)}
      </Script>
    </main>
  );
}
