import type { Metadata, Viewport } from "next";
import { getServerSession, type Session } from "next-auth";
import { Inter, Outfit } from "next/font/google";
import Script from "next/script";
import SnapLaunchCards from "@/app/event/SnapLaunchCards";
import Dashboard from "@/components/Dashboard";
import SnapLanding from "@/components/snap-landing/SnapLanding";
import { authOptions } from "@/lib/auth";
import { buildSiteOgImage, getRandomSiteOgImageUrl } from "@/lib/site-og-images";
import { themeColorPalette } from "@/lib/theme-color";
import styles from "./page.module.css";

const siteOgImageUrl = getRandomSiteOgImageUrl();

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

function AuthenticatedSnapUploadStart() {
  return (
    <main
      className="min-h-[100dvh] bg-[#eff1f8] px-4 py-10 sm:px-6 lg:px-10"
      data-theme-color={themeColorPalette.eventFallback}
    >
      <div className="mx-auto w-full max-w-5xl">
        <section className="mx-auto max-w-4xl text-center">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.26em] text-[#6b5ee8]">
            Snap / Upload
          </p>
          <h1 className="pb-[0.08em] text-[clamp(1.65rem,8.8vw,2.85rem)] font-semibold leading-[1] tracking-[-0.06em] text-[#151229] [font-family:var(--font-playfair),Georgia,serif] sm:text-[clamp(3.2rem,8vw,5.5rem)]">
            <span className="inline-block max-w-full whitespace-nowrap">Snap or upload your</span>
            <br />
            <span className="mt-3 inline-block bg-[linear-gradient(135deg,#5c43ff_0%,#8f42ff_55%,#b24cff_100%)] bg-clip-text pb-[0.1em] pr-[0.08em] italic text-transparent">
              flyer or invite
            </span>
          </h1>
        </section>
        <SnapLaunchCards processInPage />
        <p className="mx-auto mt-6 max-w-3xl pb-10 text-center text-lg leading-8 text-[#767287] sm:mt-8 sm:text-[1.35rem]">
          Envitefy reads the details, detects invitation types, and routes them into polished,
          interactive event pages automatically.
        </p>
      </div>
    </main>
  );
}

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
      className={`${outfit.variable} ${inter.variable} ${styles.snapPage} ${
        isAuthenticated ? "min-h-[100dvh] bg-[#eff1f8]" : ""
      }`}
    >
      {isAuthenticated ? (
        <>
          <AuthenticatedSnapUploadStart />
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
