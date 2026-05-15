import type { Metadata } from "next";
import { buildSiteOgImage, getRandomSiteOgImageUrl } from "@/lib/site-og-images";

const siteOgImageUrl = getRandomSiteOgImageUrl();

export const metadata: Metadata = {
  title: "Contact Envitefy",
  description: "Contact Envitefy with questions, feedback, or partnership ideas.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact — Envitefy",
    description: "Questions, feedback, or partnership ideas? Send us a note.",
    url: "https://envitefy.com/contact",
    siteName: "Envitefy",
    images: [buildSiteOgImage(siteOgImageUrl)],
    type: "website",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
