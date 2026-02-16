import type { Metadata } from "next";
import Script from "next/script";
import FAQ from "../landing/sections/FAQ";

export const metadata: Metadata = {
  title: "Envitefy FAQ",
  description:
    "Answers about scanning invites, creating events, RSVPs, and smart sign‑up forms.",
  openGraph: {
    title: "Envitefy FAQ",
    description:
      "Find answers about Envitefy features, calendars, RSVPs, and free accounts.",
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
    "Can I co-manage events with other Envitefy users?",
    "Yes. Invite another Envitefy user from the share menu and they'll accept from their email to stay synced on every change.",
  ],
  [
    "If I change event details, do guests see the update?",
    "Absolutely. The shared link always reflects the latest info, so everyone stays on the same page.",
  ],
  [
    "What are smart sign-up forms?",
    "Smart sign-up forms let families claim snack duty or volunteer slots with capacity limits and waitlists.",
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
