import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import Script from "next/script";
import SnapLanding from "@/components/snap-landing/SnapLanding";
import { themeColorPalette } from "@/lib/theme-color";
import styles from "./page.module.css";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-snap-display",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-snap-sans",
});

export const metadata: Metadata = {
  title: "Envitefy Snap | Turn invites, flyers, and PDFs into event pages",
  description:
    "Upload an invite, flyer, screenshot, schedule, or PDF and turn it into a polished event page with RSVPs, links, and mobile-friendly sharing.",
  openGraph: {
    title: "Envitefy Snap",
    description:
      "Upload an invite, flyer, screenshot, schedule, or PDF and turn it into a polished event page with RSVPs, links, and mobile-friendly sharing.",
    url: "https://envitefy.com/snap",
    siteName: "Envitefy",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Envitefy Snap",
    description:
      "Upload an invite, flyer, screenshot, schedule, or PDF and turn it into a polished event page with RSVPs, links, and mobile-friendly sharing.",
  },
  alternates: { canonical: "/snap" },
};

export const viewport: Viewport = {
  themeColor: themeColorPalette.eventFallback,
};

export default function SnapPage() {
  const snapServiceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Envitefy Snap",
    url: "https://envitefy.com/snap",
    provider: {
      "@type": "Organization",
      name: "Envitefy",
      url: "https://envitefy.com",
    },
    serviceType: "Upload-to-event-page conversion",
    description:
      "Turn invites, flyers, screenshots, schedules, and PDFs into hosted live event pages with RSVP, links, and calendar actions.",
    areaServed: "US",
  };

  return (
    <div className={`${outfit.variable} ${inter.variable} ${styles.snapPage}`}>
      <SnapLanding />
      <Script id="ld-snap-service" type="application/ld+json">
        {JSON.stringify(snapServiceLd)}
      </Script>
    </div>
  );
}
