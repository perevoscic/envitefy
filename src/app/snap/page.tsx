import type { Metadata, Viewport } from "next";
import { getServerSession, type Session } from "next-auth";
import Script from "next/script";
import Dashboard from "@/components/Dashboard";
import SnapUploadStart from "@/components/snap/SnapUploadStart";
import SnapLanding from "@/components/snap-landing/SnapLanding";
import { authOptions } from "@/lib/auth";
import { buildSiteOgImage, getRandomSiteOgImageUrl } from "@/lib/site-og-images";
import { themeColorPalette } from "@/lib/theme-color";
import styles from "./page.module.css";

const siteOgImageUrl = getRandomSiteOgImageUrl();

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
    images: [buildSiteOgImage(siteOgImageUrl, "Envitefy Snap preview")],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Envitefy Snap",
    description:
      "Upload an invite, flyer, screenshot, schedule, or PDF and turn it into a polished event page with RSVPs, links, and mobile-friendly sharing.",
    images: [siteOgImageUrl],
  },
  alternates: { canonical: "/snap" },
};

export const viewport: Viewport = {
  themeColor: themeColorPalette.eventFallback,
};

export default async function SnapPage() {
  const session = (await getServerSession(authOptions as any)) as Session | null;
  const isAuthenticated = Boolean(session?.user);

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
    <div
      className={`${styles.snapPage} ${isAuthenticated ? "min-h-[100dvh] bg-transparent" : ""}`}
    >
      {isAuthenticated ? (
        <>
          <SnapUploadStart />
          <Dashboard snapProcessingMode />
        </>
      ) : (
        <>
          <SnapLanding />
          <Script id="ld-snap-service" type="application/ld+json">
            {JSON.stringify(snapServiceLd)}
          </Script>
        </>
      )}
    </div>
  );
}
