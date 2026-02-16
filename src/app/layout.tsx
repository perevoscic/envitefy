import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Providers from "./providers";
import type { Session } from "next-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LeftSidebar from "./left-sidebar";
import { MenuProvider } from "@/contexts/MenuContext";
import ConditionalFooter from "@/components/ConditionalFooter";
import { MainContentWrapper } from "@/components/MainContentWrapper";
import "./globals.css";
import { resolveThemeCssVariables, ThemeKey, ThemeVariant } from "@/themes";
import { Suspense, type CSSProperties } from "react";

// Minimal font footprint: rely on system stacks set in globals.css (.font-vars).
const fontVarsClass = "font-vars";

// Root layout uses getServerSession (headers) — opt out of static generation.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  // Title must match Google OAuth consent screen app name exactly: "Envitefy"
  title: "Envitefy | Create. Share. Enjoy.",
  description:
    "Turn flyers, invites, schedules into shareable plans in seconds. Create birthday, wedding events and sign-up forms of any kind, then share with friends and colleagues.",
  keywords: [
    "event invitation tool",
    "online event invite maker",
    "invite and RSVP platform",
    "smart event sign-up form",
    "flyer to event conversion",
    "calendar sync event tool",
    "shareable event page",
    "quick event scheduling tool",
    "SMS RSVP event link",
    "Email RSVP event link",
    "event planning for families & teams",
    // Secondary / Long-tail
    "upload flyer and convert to calendar event",
    "share event link no account needed",
    "event page with RSVP by text",
    "volunteer sign-up form for school events",
    "school flyer to calendar sync tool",
    "sports team schedule import tool",
    "wedding invitation link with registry and RSVP",
    "baby shower invite builder online",
    "birthday party invite share link",
    "team carpool schedule sign-up tool",
    // Audience / Use-case
    "event tool for parents",
    "event tool for coaches",
    "teacher event scheduling app",
    "family calendar event maker",
    "sports practice calendar sync",
    "volunteer sign-up sheet tool",
    "baby registry linked event invite",
    "wedding invite + registry integration",
    "birthday party planning invite tool",
    "school event management tool",
    // Branding + Competitive
    "Envitefy event tool",
    "Envitefy invite maker",
    "Envitefy vs [competitor name]",
    "best online event invite service",
    "event invitation software review",
    "DIY event invites online tool",
    // Top 50 ideas (unique/additional)
    "flyer to event conversion tool",
    "shareable event page link",
    "upload flyer event invite",
    "event invite builder online",
    "online flyer invite creator",
    "no-account event invite link",
    "volunteer sign-up form online",
    "school event sign-up tool",
    "sports team event scheduling tool",
    "birthday party online invite link",
    "family event planning invitation tool",
    "digital invitation maker for events",
    "email & SMS event invitation tool",
    "create event page with RSVP",
    "team carpool sign-up tool",
    "event calendar integration invite",
    "invite link instead of paper flyer",
    "event invite templates online",
    "DIY event invite maker SaaS",
    "custom event invitation link service",
    "event sign-up sheet online",
    "event planning tool for parents",
    "teacher event sign-up online",
    "coach event scheduling & invites",
    "baby shower online invitation tool",
    "wedding invite link + registry",
    "family vacation event invite tool",
    "corporate event invitation management tool",
    "event invite software small business",
    "event invite maker cheap/free",
    "event invitation website builder",
    "invite guests with text link",
    "event invite mobile friendly tool",
    "event sign-up & RSVP platform",
    "event invite link analytics tool",
    "event invite sharing via social media",
    "event reminder & invite service",
    "flyer conversion to RSVP page",
    "online event promotion invite maker",
    "event registration form online tool",
    "event invite link for iOS/Android",
    "event invite maker without app download",
    "branded event invitation link service",
  ],
  manifest: "/manifest.webmanifest",
  other: {
    "google-adsense-account": "ca-pub-8853590530457369",
    "impact-site-verification": "4423e484-94c7-440d-9dba-4fd92408244a",
  },
  icons: {
    icon: [
      { url: "/favicon.ico?v=v6", sizes: "any" },
      { url: "/icons/icon-192.png?v=v6", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png?v=v6", sizes: "512x512", type: "image/png" },
      {
        url: "/icons/maskable-icon-192.png?v=v6",
        sizes: "192x192",
        type: "image/png",
        rel: "mask-icon" as any,
      },
      {
        url: "/icons/maskable-icon-512.png?v=v6",
        sizes: "512x512",
        type: "image/png",
        rel: "mask-icon" as any,
      },
    ],
    apple: [
      { url: "/icons/apple-touch-icon-120.png?v=v6", sizes: "120x120" },
      { url: "/icons/apple-touch-icon-152.png?v=v6", sizes: "152x152" },
      { url: "/icons/apple-touch-icon-167.png?v=v6", sizes: "167x167" },
      { url: "/icons/apple-touch-icon-180.png?v=v6", sizes: "180x180" },
    ],
    shortcut: [{ url: "/favicon.ico?v=v6" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Envitefy",
  },
  openGraph: {
    title: "Envitefy - Create. Share. Enjoy.",
    description:
      "Turn flyers, invites, schedules into shareable plans in seconds. Create birthday, wedding, baby shower events and sign-up forms of any kind, then share with friends and colleagues. RSVPs, sign-ups, and more.",
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F5FF" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0f" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let session: Session | null = null;
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    console.error("[layout] getServerSession failed", error);
  }
  const isAuthenticated = Boolean(session);
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
      style={{ ...htmlStyle, backgroundColor: "#F8F5FF" }}
      suppressHydrationWarning
    >
      <head>
        <title>Envitefy | Create. Share. Enjoy.</title>
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
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
        <Suspense fallback={null}>
          <Providers session={session}>
            <MenuProvider>
              {isAuthenticated ? <LeftSidebar /> : null}
            </MenuProvider>
            <MainContentWrapper isAuthenticated={isAuthenticated}>
              <div className="flex-1 min-w-0">{children}</div>
              <ConditionalFooter serverSession={session} />
            </MainContentWrapper>
          </Providers>
        </Suspense>
        <SpeedInsights />
      </body>
    </html>
  );
}
