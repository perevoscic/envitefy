import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { buildSiteOgImage, getRandomSiteOgImageUrl } from "@/lib/site-og-images";
import { landingFaqItems } from "./faq-data";
import LandingExperience from "./LandingExperience";

const siteOgImageUrl = getRandomSiteOgImageUrl();

export const metadata: Metadata = {
  title: "Envitefy | AI Concierge for Invites, RSVP & Event Pages",
  description:
    "Create a shareable event hub with live cards, RSVP tracking, calendar, maps, registry links, updates, and smart sign-ups from a message, upload, snap, flyer, invite, PDF, schedule, or design idea.",
  keywords: [
    "AI event concierge",
    "live card invitations",
    "event page builder",
    "event RSVP page",
    "hosted event hub",
    "registry links on invitation",
    "smart sign-up forms",
    "wedding weekend page",
    "birthday RSVP invitation",
    "pdf to event page",
    "flyer to event page",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Envitefy | AI Concierge for Invites, RSVP & Event Pages",
    description:
      "Create a shareable event hub with live cards, RSVP tracking, calendar, maps, registry links, updates, and smart sign-ups from a message, upload, snap, flyer, invite, PDF, schedule, or design idea.",
    url: "https://envitefy.com/",
    siteName: "Envitefy",
    images: [buildSiteOgImage(siteOgImageUrl, "Envitefy event pages and invitations preview")],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Envitefy | AI Concierge for Invites, RSVP & Event Pages",
    description:
      "Create a shareable event hub with live cards, RSVP tracking, calendar, maps, registry links, updates, and smart sign-ups from a message, upload, snap, flyer, invite, PDF, schedule, or design idea.",
    images: [siteOgImageUrl],
  },
};

export const viewport: Viewport = {
  themeColor: "#fbf6ff",
};

export default async function LandingPage() {
  const webpageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Envitefy",
    url: "https://envitefy.com/",
    description:
      "Create a shareable event hub with live cards, RSVP tracking, calendar, maps, registry links, updates, and smart sign-ups from a message, upload, snap, flyer, invite, PDF, schedule, or design idea.",
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
