import type { Metadata } from "next";
import { buildSiteOgImage, getRandomSiteOgImageUrl } from "@/lib/site-og-images";

const siteOgImageUrl = getRandomSiteOgImageUrl();

export const metadata: Metadata = {
  title: "Privacy Policy | Envitefy",
  description:
    "Envitefy privacy policy covering uploaded content, event details, accounts, cookies, and data choices.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy — Envitefy",
    description:
      "This policy summarizes how Envitefy handles account, event, RSVP, and sign-up information.",
    url: "https://envitefy.com/privacy",
    siteName: "Envitefy",
    images: [buildSiteOgImage(siteOgImageUrl)],
    type: "website",
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
