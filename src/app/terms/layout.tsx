import type { Metadata } from "next";
import { buildSiteOgImage, getRandomSiteOgImageUrl } from "@/lib/site-og-images";

const siteOgImageUrl = getRandomSiteOgImageUrl();

export const metadata: Metadata = {
  title: "Terms of Use | Envitefy",
  description:
    "Envitefy terms for using Snap uploads, event pages, live cards, calendar features, and account services.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of Use — Envitefy",
    description:
      "Envitefy terms covering event creation, public pages, RSVP and sign-up workflows, and platform use.",
    url: "https://envitefy.com/terms",
    siteName: "Envitefy",
    images: [buildSiteOgImage(siteOgImageUrl)],
    type: "website",
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
