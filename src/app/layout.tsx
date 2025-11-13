import type { Metadata, Viewport } from "next";
import {
  Geist,
  Geist_Mono,
  Pacifico,
  Montserrat,
  Poppins,
  Raleway,
  Playfair_Display,
  Dancing_Script,
} from "next/font/google";
import Script from "next/script";
import Link from "next/link";
import Providers from "./providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LeftSidebar from "./left-sidebar";
import "./globals.css";
import { cookies } from "next/headers";
import {
  resolveThemeForDate,
  resolveThemeCssVariables,
  isValidThemeKey,
  isValidVariant,
  ThemeKey,
  ThemeVariant,
  ThemeOverride,
} from "@/themes";
import { getThemeOverrideByEmail } from "@/lib/db";
import type { CSSProperties } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pacifico = Pacifico({
  variable: "--font-pacifico",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const raleway = Raleway({
  variable: "--font-raleway",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const dancing = Dancing_Script({
  variable: "--font-dancing",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

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
      { url: "/favicon.ico?v=v5", sizes: "any" },
      { url: "/icons/icon-192.png?v=v5", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png?v=v5", sizes: "512x512", type: "image/png" },
      {
        url: "/icons/maskable-icon-192.png?v=v5",
        sizes: "192x192",
        type: "image/png",
        rel: "mask-icon" as any,
      },
      {
        url: "/icons/maskable-icon-512.png?v=v5",
        sizes: "512x512",
        type: "image/png",
        rel: "mask-icon" as any,
      },
    ],
    apple: [
      { url: "/icons/apple-touch-icon-120.png?v=v5", sizes: "120x120" },
      { url: "/icons/apple-touch-icon-152.png?v=v5", sizes: "152x152" },
      { url: "/icons/apple-touch-icon-167.png?v=v5", sizes: "167x167" },
      { url: "/icons/apple-touch-icon-180.png?v=v5", sizes: "180x180" },
    ],
    shortcut: [{ url: "/favicon.ico?v=v5" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Envitefy",
  },
  openGraph: {
    title: "Envitefy | Create. Share. Enjoy.",
    description:
      "Turn flyers, invites, schedules into shareable plans in seconds. Create birthday, wedding events and sign-up forms of any kind, then share with friends and colleagues.",
    url: "https://envitefy.com",
    siteName: "Envitefy",
    images: [
      {
        url: "https://envitefy.com/og-default-v2.jpg",
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
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0f" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("theme")?.value;
  const cookieVariant: ThemeVariant | undefined =
    themeCookie === "light" || themeCookie === "dark"
      ? (themeCookie as ThemeVariant)
      : undefined;

  const now = new Date();
  const scheduledThemeKey = resolveThemeForDate(now);
  const isAdmin = Boolean((session?.user as any)?.isAdmin);

  let initialOverride: ThemeOverride | null = null;
  if (isAdmin && session?.user?.email) {
    const row = await getThemeOverrideByEmail(session.user.email);
    if (row && isValidThemeKey(row.theme_key) && isValidVariant(row.variant)) {
      initialOverride = {
        themeKey: row.theme_key as ThemeKey,
        variant: row.variant as ThemeVariant,
        expiresAt: row.expires_at ?? null,
      };
    }
  }

  const initialThemeKey: ThemeKey =
    initialOverride?.themeKey ?? scheduledThemeKey;
  const overrideVariant = initialOverride?.variant;
  const initialThemeVariant: ThemeVariant | undefined =
    overrideVariant ?? cookieVariant;
  const htmlVariant: ThemeVariant = overrideVariant ?? cookieVariant ?? "light";
  const cssVariables = resolveThemeCssVariables(initialThemeKey, htmlVariant);
  const cssVariablesLight = resolveThemeCssVariables(initialThemeKey, "light");
  const cssVariablesDark = resolveThemeCssVariables(initialThemeKey, "dark");
  const htmlStyle = Object.fromEntries(
    Object.entries(cssVariables).map(([key, value]) => [key, value])
  ) as CSSProperties;

  return (
    <html
      lang="en"
      data-theme={`${initialThemeKey}-${htmlVariant}`}
      data-theme-key={initialThemeKey}
      data-override-variant={overrideVariant ?? undefined}
      data-vars-light={JSON.stringify(cssVariablesLight)}
      data-vars-dark={JSON.stringify(cssVariablesDark)}
      className={htmlVariant === "dark" ? "dark" : undefined}
      style={htmlStyle}
      suppressHydrationWarning
    >
      <head>
        <title>Envitefy | Create. Share. Enjoy.</title>
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pacifico.variable} ${montserrat.variable} ${poppins.variable} ${raleway.variable} ${playfair.variable} ${dancing.variable} antialiased`}
      >
        <Script id="theme-init" strategy="beforeInteractive">{`
          (function(){
            try {
              var root = document.documentElement;
              var key = root.getAttribute('data-theme-key') || 'general';
              var override = root.getAttribute('data-override-variant');
              var stored = localStorage.getItem('theme');
              var resolved = (override === 'light' || override === 'dark')
                ? override
                : ((stored === 'light' || stored === 'dark')
                    ? stored
                    : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
              // Apply CSS variables immediately to avoid flash
              var varsAttr = resolved === 'dark' ? 'data-vars-dark' : 'data-vars-light';
              var raw = root.getAttribute(varsAttr) || '{}';
              try {
                var tokens = JSON.parse(raw);
                for (var k in tokens) { if (Object.prototype.hasOwnProperty.call(tokens, k)) { root.style.setProperty(k, tokens[k]); } }
              } catch {}
              root.setAttribute('data-theme', key + '-' + resolved);
              root.classList.toggle('dark', resolved === 'dark');
              root.style.colorScheme = resolved;
            } catch (e) {
              // noop
            }
          })();
        `}</Script>
        <Script id="pwa-bridge" strategy="beforeInteractive">{`
          (function(){
            try {
              var w = window;
              if (!w.__snapInstallBridgeReady) {
                w.__snapInstallBridgeReady = true;
                window.addEventListener('beforeinstallprompt', function(event){
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
        <Providers
          session={session}
          initialTheme={initialThemeVariant}
          initialThemeKey={initialThemeKey}
          scheduledThemeKey={scheduledThemeKey}
          initialOverride={initialOverride}
        >
          <LeftSidebar />
          <div
            className="min-h-[100dvh] bg-background text-foreground flex flex-col landing-dark-gradient"
            data-static-illustration="true"
          >
            <div className="flex-1 min-w-0">{children}</div>
            <footer>
              <div className="max-w-7xl mx-auto px-3 py-6 text-[10px] sm:text-xs md:text-sm text-foreground/80">
                <div className="w-full overflow-x-auto">
                  <p className="text-center whitespace-nowrap">
                    <Link
                      href="/how-it-works"
                      className="hover:text-foreground"
                    >
                      How it works
                    </Link>
                    <span className="opacity-40 mx-2">•</span>
                    <Link href="/who-its-for" className="hover:text-foreground">
                      Who it’s for
                    </Link>
                    <span className="opacity-40 mx-2">•</span>
                    <Link href="/faq" className="hover:text-foreground">
                      FAQ
                    </Link>
                    <span className="opacity-40 mx-2">•</span>
                    <Link
                      href="https://envitefy.com/terms"
                      className="hover:text-foreground"
                    >
                      Terms of Use
                    </Link>
                    <span className="opacity-40 mx-2">•</span>
                    <Link
                      href="https://envitefy.com/privacy"
                      className="hover:text-foreground"
                    >
                      Privacy Policy
                    </Link>
                    <span className="opacity-40 mx-2">•</span>
                    <span>© {new Date().getFullYear()} Envitefy</span>
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
