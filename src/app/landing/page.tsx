import type { Metadata } from "next";
import Script from "next/script";
import { landingFaqItems } from "./faq-data";
import LandingExperience from "./LandingExperience";

export const metadata: Metadata = {
  title: "Envitefy | Live Cards, Event Pages, Invitations & RSVP Links",
  description:
    "Create live cards, invitation designs, hosted event pages, RSVP links, registry links, schedules, and gymnastics meet pages from a photo, PDF, flyer, or studio workflow.",
  keywords: [
    "live card invitations",
    "event page builder",
    "event RSVP page",
    "invitation design tool",
    "hosted event hub",
    "registry links on invitation",
    "wedding weekend page",
    "birthday RSVP invitation",
    "gymnastics meet page",
    "pdf to event page",
    "flyer to event page",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Envitefy | Live Cards, Event Pages, Invitations & RSVP Links",
    description:
      "Create live cards, invitation designs, hosted event pages, RSVP links, registry links, schedules, and gymnastics meet pages from a photo, PDF, flyer, or studio workflow.",
    url: "https://envitefy.com/",
    siteName: "Envitefy",
    images: [
      {
        url: "https://envitefy.com/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Envitefy event pages and invitations preview",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Envitefy | Live Cards, Event Pages, Invitations & RSVP Links",
    description:
      "Create live cards, invitation designs, hosted event pages, RSVP links, registry links, schedules, and gymnastics meet pages from a photo, PDF, flyer, or studio workflow.",
    images: ["https://envitefy.com/og-default.jpg"],
  },
};

export default async function LandingPage() {
  const webpageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Envitefy",
    url: "https://envitefy.com/",
    description:
      "Create live cards, invitation designs, hosted event pages, RSVP links, registry links, schedules, and gymnastics meet pages from a photo, PDF, flyer, or studio workflow.",
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: landingFaqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <>
      <LandingExperience />
      <Script id="ld-landing-webpage" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(webpageLd)}
      </Script>
      <Script id="ld-landing-faq" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(faqLd)}
      </Script>
    </>
  );
}
