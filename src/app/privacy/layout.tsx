import type { Metadata } from "next";
import { buildSiteOgImage, getRandomSiteOgImageUrl } from "@/lib/site-og-images";

const siteOgImageUrl = getRandomSiteOgImageUrl();

export const metadata: Metadata = {
  title: "Privacy Policy | Envitefy",
  description:
    "Envitefy privacy policy covering Google user data, connected calendars, uploaded content, accounts, cookies, and data choices.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy — Envitefy",
    description:
      "How Envitefy accesses, uses, stores, shares, and protects Google user data and other service information.",
    url: "https://envitefy.com/privacy",
    siteName: "Envitefy",
    images: [buildSiteOgImage(siteOgImageUrl)],
    type: "website",
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
