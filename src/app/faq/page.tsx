import type { Metadata } from "next";
import Script from "next/script";
import FAQ from "../landing/sections/FAQ";

export const metadata: Metadata = {
  title: "Envitefy FAQ",
  description:
    "Answers about Snap accounts, Gymnastics accounts, event sharing, and calendars.",
  openGraph: {
    title: "Envitefy FAQ",
    description:
      "Find answers about Snap, Gymnastics, calendars, and existing accounts.",
    url: "https://envitefy.com/faq",
    siteName: "Envitefy",
    images: [
      {
        url: "https://envitefy.com/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Envitefy preview",
      },
    ],
    type: "website",
  },
  alternates: { canonical: "/faq" },
};

// Keep a minimal list here to feed JSON‑LD (matches UI questions)
const faqPairs = [
  [
    "Can I share my event without guests downloading an app?",
    "Yes! Guests can open and RSVP via an email or text link — no downloads needed.",
  ],
  [
    "Can Envitefy turn a PDF into an event page?",
    "Yes. Snap can process PDFs with event details and help create a hosted event page with RSVP, links, maps, and calendar actions.",
  ],
  [
    "Can I upload a flyer or invite screenshot?",
    "Yes. Envitefy Snap accepts flyers, invite screenshots, images, and schedules, then lets you review the extracted event details before saving or sharing.",
  ],
  [
    "What is a live card invitation?",
    "A live card is a shareable invitation connected to a hosted event page, so the design, details, RSVP actions, and updates live together.",
  ],
  [
    "Can Envitefy event pages include RSVP links?",
    "Yes. Event pages can include RSVP-oriented guest actions alongside event details, maps, links, and calendar saves.",
  ],
  [
    "Can guests save events to a calendar?",
    "Yes. Envitefy keeps dates, times, and locations structured so calendar save actions can be available from the shared page.",
  ],
  [
    "Can I include registry links or outside resources?",
    "Yes. Hosts can include helpful links such as registries, signups, tickets, meet resources, or other event pages.",
  ],
  [
    "Does Envitefy support gymnastics meet pages?",
    "Yes. Envitefy Gymnastics supports meet pages with schedules, venue details, hotel information, maps, and parent-friendly sharing.",
  ],
  [
    "Can I co-manage events with other Envitefy users?",
    "Yes. Invite another Envitefy user from the share menu and they'll accept from their email to stay synced on every change.",
  ],
  [
    "If I change event details, do guests see the update?",
    "Absolutely. The shared link always reflects the latest info, so everyone stays on the same page.",
  ],
  [
    "How do Snap and Gymnastics access work?",
    "Snap is available to every account. Gymnastics accounts include both gymnastics and snap access.",
  ],
];

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
    <main className="min-h-screen w-full bg-gradient-to-b from-[#f6f2ff] via-white to-[#f7f3ff] text-foreground">
      <section className="max-w-5xl mx-auto px-6 pt-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-center text-[#2f2850]">
          Frequently asked questions
        </h1>
      </section>
      <FAQ showHeader={false} />
      <Script
        id="ld-breadcrumb-faq"
        type="application/ld+json"
        strategy="afterInteractive"
      >
        {JSON.stringify(breadcrumbLd)}
      </Script>
      <Script
        id="ld-faq"
        type="application/ld+json"
        strategy="afterInteractive"
      >
        {JSON.stringify(faqLd)}
      </Script>
    </main>
  );
}
