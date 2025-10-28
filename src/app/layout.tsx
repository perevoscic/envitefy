import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Pacifico, Montserrat } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Envitefy",
  description:
    "Turn flyers, invites, and schedules into shareable plans in seconds.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        url: "/icons/maskable-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        rel: "mask-icon" as any,
      },
      {
        url: "/icons/maskable-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        rel: "mask-icon" as any,
      },
    ],
    apple: [
      { url: "/icons/apple-touch-icon-120.png", sizes: "120x120" },
      { url: "/icons/apple-touch-icon-152.png", sizes: "152x152" },
      { url: "/icons/apple-touch-icon-167.png", sizes: "167x167" },
      { url: "/icons/apple-touch-icon-180.png", sizes: "180x180" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Envitefy",
  },
  openGraph: {
    title: "Envitefy | Create. Share. Enjoy.",
    description:
      "Turn flyers, invites, and signup forms into shareable plans in seconds.",
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

  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pacifico.variable} ${montserrat.variable} antialiased`}
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
                    var ev = new CustomEvent('snapmydate:beforeinstallprompt', { detail: event });
                    window.dispatchEvent(ev);
                  } catch (e) {}
                });
              }
            } catch (e) {}
          })();
        `}</Script>
        {gaMeasurementId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaMeasurementId}');
            `}</Script>
          </>
        ) : null}
        <Providers
          session={session}
          initialTheme={initialThemeVariant}
          initialThemeKey={initialThemeKey}
          scheduledThemeKey={scheduledThemeKey}
          initialOverride={initialOverride}
        >
          <LeftSidebar />
          <div
            className="min-h-[100dvh] bg-background text-foreground flex flex-col"
            data-static-illustration="true"
          >
            <div className="flex-1 min-w-0">{children}</div>
            <footer>
              <div className="max-w-7xl mx-auto px-3 py-6 text-[10px] sm:text-xs md:text-sm text-foreground/80">
                <div className="w-full overflow-x-auto">
                  <p className="text-center whitespace-nowrap">
                    <Link
                      href="https://www.envitefy.com/terms"
                      className="hover:text-foreground"
                    >
                      Terms of Use
                    </Link>
                    <span className="opacity-40 mx-2">•</span>
                    <Link
                      href="https://www.envitefy.com/privacy"
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
