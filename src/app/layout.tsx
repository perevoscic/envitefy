import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getServerSession } from "next-auth";
import Providers from "./providers";
import AppShell from "./AppShell";
import "./globals.css";
import { authOptions } from "@/lib/auth";
import { resolveThemeCssVariables, ThemeKey, ThemeVariant } from "@/themes";
import { themeColorPalette } from "@/lib/theme-color";
import { Suspense } from "react";
import type { CSSProperties } from "react";

// Minimal font footprint: rely on system stacks set in globals.css (.font-vars).
const fontVarsClass = "font-vars";

export const metadata: Metadata = {
  // Title must match Google OAuth consent screen app name exactly: "Envitefy"
  title: "Envitefy | Snap + Gymnastics",
  description:
    "Envitefy focuses on Snap for flyer capture and Gymnastics for meet pages and logistics.",
  keywords: [
    "snap flyer to calendar",
    "gymnastics meet page",
    "gymnastics meet planning",
    "event capture app",
    "flyer to event app",
    "calendar event capture",
    "shareable meet page",
    "gymnastics schedule page",
    "event page for parents",
    "meet logistics page",
    "OCR event capture",
    "photo to calendar event",
    "gymnastics family scheduling",
    "Envitefy snap",
    "Envitefy gymnastics",
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
    title: "Envitefy - Snap + Gymnastics",
    description:
      "Snap flyers and invites into clean event details, or create polished gymnastics meet pages and logistics.",
    url: "https://envitefy.com",
    siteName: "Envitefy",
    images: [
      {
        url: "https://envitefy.com/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Envitefy thumbnail",
      },
    ],
    type: "website",
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
        <title>Envitefy | Snap + Gymnastics</title>
        <Script
          id="ld-website"
          type="application/ld+json"
          strategy="beforeInteractive"
        >
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Envitefy",
            url: "https://envitefy.com",
            potentialAction: {
              "@type": "SearchAction",
              target:
                "https://www.google.com/search?q=site%3Aenvitefy.com+{search_term_string}",
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
            url: "https://envitefy.com",
            logo: "https://envitefy.com/Logo_stacked.png",
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
          src="https://www.googletagmanager.com/gtag/js?id=G-3X25SZMRFY"
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-3X25SZMRFY');
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
