import type { Metadata } from "next";
import Script from "next/script";
import { buildSiteOgImage, getRandomSiteOgImageUrl } from "@/lib/site-og-images";
import LandingExperience from "./LandingExperience";

const siteOgImageUrl = getRandomSiteOgImageUrl();

export const metadata: Metadata = {
  title: "Online Invitation Maker with RSVP & Event Pages | Envitefy",
  description:
    "Create an online invitation and hosted event page with RSVP, maps, calendar saves, registry links, smart sign-ups, and updates in one shareable link.",
  keywords: [
    "hosted event page",
    "event invitation page",
    "live card invitations",
    "event RSVP page",
    "wedding event page",
    "registry links on invitation",
    "smart sign-up forms",
    "wedding weekend page",
    "birthday RSVP invitation",
    "pdf to event page",
    "flyer to event page",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Online Invitation Maker with RSVP & Event Pages | Envitefy",
    description:
      "Create an online invitation and hosted event page with RSVP, maps, calendar saves, registry links, smart sign-ups, and updates in one shareable link.",
    url: "https://envitefy.com/",
    siteName: "Envitefy",
    images: [buildSiteOgImage(siteOgImageUrl, "Envitefy event pages and invitations preview")],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Online Invitation Maker with RSVP & Event Pages | Envitefy",
    description:
      "Create an online invitation and hosted event page with RSVP, maps, calendar saves, registry links, smart sign-ups, and updates in one shareable link.",
    images: [siteOgImageUrl],
  },
};

export default async function LandingPage() {
  const webpageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Envitefy",
    url: "https://envitefy.com/",
    description:
      "Create an online invitation and hosted event page with RSVP, maps, calendar saves, registry links, smart sign-ups, and updates in one shareable link.",
  };

  return (
    <>
      <LandingExperience />
      <Script id="ld-landing-webpage" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(webpageLd)}
      </Script>
    </>
  );
}
