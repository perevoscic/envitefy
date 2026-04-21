import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getServerSession } from "next-auth";
import Providers from "./providers";
import AppShell from "./AppShell";
import "./globals.css";
import { authOptions } from "@/lib/auth";
import { GOOGLE_ANALYTICS_MEASUREMENT_ID } from "@/lib/google-analytics";
import { resolveThemeCssVariables, ThemeKey, ThemeVariant } from "@/themes";
import { themeColorPalette } from "@/lib/theme-color";
import { Suspense } from "react";
import type { CSSProperties } from "react";

// Minimal font footprint: rely on system stacks set in globals.css (.font-vars).
const fontVarsClass = "font-vars";
const siteUrl = (
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXTAUTH_URL ||
  process.env.PUBLIC_BASE_URL ||
  "https://envitefy.com"
).replace(/\/+$/, "");

export const metadata: Metadata = {
  // Title must match Google OAuth consent screen app name exactly: "Envitefy"
  metadataBase: new URL(siteUrl),
  title: "Envitefy | Event Pages, Invitations & RSVPs",
  description:
    "Create invitation designs, live cards, hosted event pages, RSVPs, registry links, schedules, and gymnastics meet pages from uploads or from scratch.",
  keywords: [
    "event page builder",
    "event invitation maker",
    "live card invitations",
    "hosted event page",
    "RSVP event page",
    "registry links for invitations",
    "event page with maps and calendar",
    "wedding weekend website",
    "birthday invitation with RSVP",
    "school event page",
    "community event page",
    "gymnastics meet page",
    "gymnastics meet planning",
    "flyer to event page",
    "invite to event page",
    "pdf to event page",
    "OCR event capture",
    "Envitefy",
  ],
  manifest: "/manifest.webmanifest?v=v8",
  other: {
    "google-adsense-account": "ca-pub-8853590530457369",
    "impact-site-verification": "4423e484-94c7-440d-9dba-4fd92408244a",
  },
  icons: {
    icon: [
      { url: "/favicon.png?v=v8", sizes: "any", type: "image/png" },
      { url: "/icons/icon-192.png?v=v8", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png?v=v8", sizes: "512x512", type: "image/png" },
      {
        url: "/icons/maskable-icon-192.png?v=v8",
        sizes: "192x192",
        type: "image/png",
        rel: "mask-icon" as any,
      },
      {
        url: "/icons/maskable-icon-512.png?v=v8",
        sizes: "512x512",
        type: "image/png",
        rel: "mask-icon" as any,
      },
    ],
    apple: [
      { url: "/icons/apple-touch-icon-120.png?v=v8", sizes: "120x120" },
      { url: "/icons/apple-touch-icon-152.png?v=v8", sizes: "152x152" },
      { url: "/icons/apple-touch-icon-167.png?v=v8", sizes: "167x167" },
      { url: "/icons/apple-touch-icon-180.png?v=v8", sizes: "180x180" },
    ],
    shortcut: [{ url: "/favicon.png?v=v8" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Envitefy",
  },
  openGraph: {
    title: "Envitefy | Event Pages, Invitations & RSVPs",
    description:
      "Create invitation designs, live cards, hosted event pages, RSVPs, registry links, schedules, and gymnastics meet pages from uploads or from scratch.",
    url: siteUrl,
    siteName: "Envitefy",
    images: [
      {
        url: `${siteUrl}/og-default.jpg`,
        width: 1200,
        height: 630,
        alt: "Envitefy thumbnail",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Envitefy | Event Pages, Invitations & RSVPs",
    description:
      "Create invitation designs, live cards, hosted event pages, RSVPs, registry links, schedules, and gymnastics meet pages from uploads or from scratch.",
    images: [`${siteUrl}/og-default.jpg`],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: themeColorPalette.brand,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const serverSession = await getServerSession(authOptions as any);
  const themeKey: ThemeKey = "general";
  const htmlVariant: ThemeVariant = "light";
  const cssVariables = resolveThemeCssVariables(themeKey, htmlVariant);
  const htmlStyle = Object.fromEntries(
    Object.entries(cssVariables).map(([key, value]) => [key, value]),
  ) as CSSProperties;

  return (
    <html
      lang="en"
      data-theme={`${themeKey}-${htmlVariant}`}
      data-theme-key={themeKey}
      style={{ ...htmlStyle, backgroundColor: themeColorPalette.background }}
      suppressHydrationWarning
    >
      <head>
        <title>Envitefy | Event Pages, Invitations & RSVPs</title>
        <Script
          id="ld-website"
          type="application/ld+json"
          strategy="beforeInteractive"
        >
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Envitefy",
            url: siteUrl,
            potentialAction: {
              "@type": "SearchAction",
              target: `https://www.google.com/search?q=site%3A${new URL(siteUrl).hostname}+{search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          })}
        </Script>
        <Script
          id="ld-organization"
          type="application/ld+json"
          strategy="beforeInteractive"
        >
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Envitefy",
            url: siteUrl,
            logo: `${siteUrl}/Logo_stacked.png`,
          })}
        </Script>
      </head>
      <body className={`${fontVarsClass} antialiased`}>
        <Script id="pwa-bridge" strategy="beforeInteractive">{`
          (function(){
            try {
              var w = window;
              if (!w.__snapInstallBridgeReady) {
                w.__snapInstallBridgeReady = true;
                window.addEventListener('beforeinstallprompt', function(event){
                  // Prevent default to show custom toast instead of browser's native prompt
                  try { if (event && event.preventDefault) event.preventDefault(); } catch (e) {}
                  try { w.__snapInstallDeferredPrompt = event; } catch (e) {}
                  try {
                    var ev = new CustomEvent('envitefy:beforeinstallprompt', { detail: event });
                    window.dispatchEvent(ev);
                  } catch (e) {}
                });
              }
            } catch (e) {}
          })();
        `}</Script>
        {/* Google tag (gtag.js) */}
        <Script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GOOGLE_ANALYTICS_MEASUREMENT_ID)}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GOOGLE_ANALYTICS_MEASUREMENT_ID}', { send_page_view: false });
        `}</Script>
        <Providers session={serverSession}>
          <Suspense fallback={null}>
            <AppShell serverSession={serverSession}>{children}</AppShell>
          </Suspense>
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
