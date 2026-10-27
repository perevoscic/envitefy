import type { Metadata, Viewport } from "next";
import Script from "next/script";
import GymnasticsLanding from "@/components/gymnastics-landing/GymnasticsLanding";
import { buildSiteOgImage, getRandomSiteOgImageUrl } from "@/lib/site-og-images";
import { themeColorPalette } from "@/lib/theme-color";

const siteOgImageUrl = getRandomSiteOgImageUrl();

export const metadata: Metadata = {
  title: "Envitefy Gymnastics | One meet page for your whole team",
  description:
    "Bring schedules, venue directions, hotel links and meet notes together in one shareable gymnastics page. Start with a packet or a design, review, then publish.",
  openGraph: {
    title: "Envitefy Gymnastics",
    description:
      "One gymnastics meet page for schedules, arrival details, hotel links and the whole weekend. Easy for families to open, easy for you to keep current.",
    url: "https://envitefy.com/gymnastics",
    siteName: "Envitefy",
    images: [buildSiteOgImage(siteOgImageUrl, "Envitefy Gymnastics preview")],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Envitefy Gymnastics",
    description:
      "One gymnastics meet page for schedules, arrival details, hotel links and the whole weekend. Easy for families to open, easy for you to keep current.",
    images: [siteOgImageUrl],
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
      "Create shareable gymnastics meet pages with schedules, venue details, hotel links and meet notes. Save changes to keep the same published page current.",
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
