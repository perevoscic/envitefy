import type { Metadata, Viewport } from "next";
import Script from "next/script";
import GymnasticsLanding from "@/components/gymnastics-landing/GymnasticsLanding";
import { themeColorPalette } from "@/lib/theme-color";

export const metadata: Metadata = {
  title: "Envitefy Gymnastics | Premium meet pages for families and coaches",
  description:
    "Publish elegant gymnastics meet pages with schedules, venue info, hotel blocks, maps, and live updates. Built for families, coaches, athletes, and spectators.",
  openGraph: {
    title: "Envitefy Gymnastics",
    description:
      "Premium gymnastics meet pages with editorial layouts, live updates, hotel details, and mobile-first presentation.",
    url: "https://envitefy.com/gymnastics",
    siteName: "Envitefy",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Envitefy Gymnastics",
    description:
      "Premium gymnastics meet pages with editorial layouts, live updates, hotel details, and mobile-first presentation.",
  },
  alternates: { canonical: "/gymnastics" },
};

export const viewport: Viewport = {
  themeColor: themeColorPalette.gymnastics,
};

export default function GymnasticsPage() {
  const gymnasticsServiceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Envitefy Gymnastics",
    url: "https://envitefy.com/gymnastics",
    provider: {
      "@type": "Organization",
      name: "Envitefy",
      url: "https://envitefy.com",
    },
    serviceType: "Gymnastics meet page publishing",
    description:
      "Create mobile-friendly gymnastics meet pages with schedules, venue details, hotel blocks, maps, and live updates.",
    audience: [
      { "@type": "Audience", audienceType: "Gymnastics families" },
      { "@type": "Audience", audienceType: "Coaches" },
      { "@type": "Audience", audienceType: "Meet organizers" },
    ],
  };

  return (
    <>
      <GymnasticsLanding />
      <Script id="ld-gymnastics-service" type="application/ld+json">
        {JSON.stringify(gymnasticsServiceLd)}
      </Script>
    </>
  );
}
