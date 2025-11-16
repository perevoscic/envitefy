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
  Parisienne,
  Alex_Brush,
  Allura,
  Amita,
  Arizonia,
  Beth_Ellen,
  Bilbo_Swash_Caps,
  Cookie,
  Courgette,
  Euphoria_Script,
  Great_Vibes,
  Herr_Von_Muellerhoff,
  Indie_Flower,
  Italianno,
  Kaushan_Script,
  Kalam,
  La_Belle_Aurore,
  Marck_Script,
  Meie_Script,
  Meddon,
  Monsieur_La_Doulaise,
  Mr_De_Haviland,
  Mrs_Saint_Delafield,
  My_Soul,
  Niconne,
  Pinyon_Script,
  Petit_Formal_Script,
  Redressed,
  Rouge_Script,
  Satisfy,
  Sacramento,
  Shadows_Into_Light,
  Shippori_Mincho,
  Sofia,
  Sonsie_One,
  Style_Script,
  Tangerine,
  Yesteryear,
  Yellowtail,
  Zhi_Mang_Xing,
  Miss_Fajardose,
  Stalemate,
  Dr_Sugiyama,
  Caramel,
  Kolker_Brush,
  Love_Light,
  Luxurious_Script,
  MonteCarlo,
} from "next/font/google";
import Script from "next/script";
import Link from "next/link";
import Providers from "./providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LeftSidebar from "./left-sidebar";
import "./globals.css";
import { resolveThemeCssVariables, ThemeKey, ThemeVariant } from "@/themes";
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

const parisienne = Parisienne({
  variable: "--font-parisienne",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const alexBrush = Alex_Brush({
  variable: "--font-alex-brush",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const allura = Allura({
  variable: "--font-allura",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const amita = Amita({
  variable: "--font-amita",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

const arizonia = Arizonia({
  variable: "--font-arizonia",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const bethEllen = Beth_Ellen({
  variable: "--font-beth-ellen",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const bilboSwashCaps = Bilbo_Swash_Caps({
  variable: "--font-bilbo-swash-caps",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const cookie = Cookie({
  variable: "--font-cookie",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const courgette = Courgette({
  variable: "--font-courgette",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const euphoriaScript = Euphoria_Script({
  variable: "--font-euphoria-script",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const herrVonMuellerhoff = Herr_Von_Muellerhoff({
  variable: "--font-herr-von-muellerhoff",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const indieFlower = Indie_Flower({
  variable: "--font-indie-flower",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const italianno = Italianno({
  variable: "--font-italianno",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const kaushanScript = Kaushan_Script({
  variable: "--font-kaushan-script",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const kalam = Kalam({
  variable: "--font-kalam",
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  display: "swap",
});

const laBelleAurore = La_Belle_Aurore({
  variable: "--font-la-belle-aurore",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const marckScript = Marck_Script({
  variable: "--font-marck-script",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const meieScript = Meie_Script({
  variable: "--font-meie-script",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const meddon = Meddon({
  variable: "--font-meddon",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const monsieurLaDoulaise = Monsieur_La_Doulaise({
  variable: "--font-monsieur-la-doulaise",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const mrDeHaviland = Mr_De_Haviland({
  variable: "--font-mr-de-haviland",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const mrsSaintDelafield = Mrs_Saint_Delafield({
  variable: "--font-mrs-saint-delafield",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const mySoul = My_Soul({
  variable: "--font-my-soul",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const niconne = Niconne({
  variable: "--font-niconne",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const pinyonScript = Pinyon_Script({
  variable: "--font-pinyon-script",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const petitFormalScript = Petit_Formal_Script({
  variable: "--font-petit-formal-script",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const redressed = Redressed({
  variable: "--font-redressed",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const rougeScript = Rouge_Script({
  variable: "--font-rouge-script",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const satisfy = Satisfy({
  variable: "--font-satisfy",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const sacramento = Sacramento({
  variable: "--font-sacramento",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const shadowsIntoLight = Shadows_Into_Light({
  variable: "--font-shadows-into-light",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const shipporiMincho = Shippori_Mincho({
  variable: "--font-shippori-mincho",
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
});

const sofia = Sofia({
  variable: "--font-sofia",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const sonsieOne = Sonsie_One({
  variable: "--font-sonsie-one",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const styleScript = Style_Script({
  variable: "--font-style-script",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const tangerine = Tangerine({
  variable: "--font-tangerine",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

const yesteryear = Yesteryear({
  variable: "--font-yesteryear",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const yellowtail = Yellowtail({
  variable: "--font-yellowtail",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const zhiMangXing = Zhi_Mang_Xing({
  variable: "--font-zhi-mang-xing",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const missFajardose = Miss_Fajardose({
  variable: "--font-miss-fajardose",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const stalemate = Stalemate({
  variable: "--font-stalemate",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const drSugiyama = Dr_Sugiyama({
  variable: "--font-dr-sugiyama",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const caramel = Caramel({
  variable: "--font-caramel",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const kolkerBrush = Kolker_Brush({
  variable: "--font-kolker-brush",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const loveLight = Love_Light({
  variable: "--font-love-light",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const luxuriousScript = Luxurious_Script({
  variable: "--font-luxurious-script",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const monteCarlo = MonteCarlo({
  variable: "--font-monte-carlo",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const decorativeFonts = [
  parisienne,
  alexBrush,
  allura,
  amita,
  arizonia,
  bethEllen,
  bilboSwashCaps,
  cookie,
  courgette,
  euphoriaScript,
  greatVibes,
  herrVonMuellerhoff,
  indieFlower,
  italianno,
  kaushanScript,
  kalam,
  laBelleAurore,
  marckScript,
  meieScript,
  meddon,
  monsieurLaDoulaise,
  mrDeHaviland,
  mrsSaintDelafield,
  mySoul,
  niconne,
  pinyonScript,
  petitFormalScript,
  redressed,
  rougeScript,
  satisfy,
  sacramento,
  shadowsIntoLight,
  shipporiMincho,
  sofia,
  sonsieOne,
  styleScript,
  tangerine,
  yesteryear,
  yellowtail,
  zhiMangXing,
  missFajardose,
  stalemate,
  drSugiyama,
  caramel,
  kolkerBrush,
  loveLight,
  luxuriousScript,
  monteCarlo,
] as const;

const decorativeFontVariables = decorativeFonts
  .map((font) => font.variable)
  .join(" ");

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
    { media: "(prefers-color-scheme: light)", color: "#F6ECE1" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0f" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  const themeKey: ThemeKey = "general";
  const htmlVariant: ThemeVariant = "light";
  const cssVariables = resolveThemeCssVariables(themeKey, htmlVariant);
  const htmlStyle = Object.fromEntries(
    Object.entries(cssVariables).map(([key, value]) => [key, value])
  ) as CSSProperties;

  return (
    <html
      lang="en"
      data-theme={`${themeKey}-${htmlVariant}`}
      data-theme-key={themeKey}
      style={htmlStyle}
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pacifico.variable} ${montserrat.variable} ${poppins.variable} ${raleway.variable} ${playfair.variable} ${dancing.variable} ${decorativeFontVariables} antialiased`}
      >
        <Script id="pwa-bridge" strategy="beforeInteractive">{`
          (function(){
            try {
              var w = window;
              if (!w.__snapInstallBridgeReady) {
                w.__snapInstallBridgeReady = true;
                window.addEventListener('beforeinstallprompt', function(event){
                  // Don't preventDefault - let the native prompt show automatically
                  // try { if (event && event.preventDefault) event.preventDefault(); } catch (e) {}
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
        <Providers session={session}>
          <LeftSidebar />
          <div
            className="min-h-[100dvh] bg-background text-foreground flex flex-col landing-dark-gradient"
            style={{
              minHeight: "100dvh",
              paddingTop: "max(0px, env(safe-area-inset-top))",
              paddingBottom: "max(0px, env(safe-area-inset-bottom))",
            }}
            data-static-illustration="true"
          >
            <div className="flex-1 min-w-0">{children}</div>
            <footer>
              <div className="max-w-7xl mx-auto px-3 py-6 text-[10px] sm:text-xs md:text-sm text-foreground/80">
                <div className="w-full">
                  <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-1 sm:whitespace-nowrap">
                    <Link
                      href="/how-it-works"
                      className="hover:text-foreground"
                    >
                      How it works
                    </Link>
                    <span className="opacity-40 hidden sm:inline">•</span>
                    <Link href="/who-its-for" className="hover:text-foreground">
                      Who it's for
                    </Link>
                    <span className="opacity-40 hidden sm:inline">•</span>
                    <Link href="/faq" className="hover:text-foreground">
                      FAQ
                    </Link>
                    <span className="opacity-40 hidden sm:inline">•</span>
                    <Link
                      href="https://envitefy.com/terms"
                      className="hover:text-foreground"
                    >
                      Terms of Use
                    </Link>
                    <span className="opacity-40 hidden sm:inline">•</span>
                    <Link
                      href="https://envitefy.com/privacy"
                      className="hover:text-foreground"
                    >
                      Privacy Policy
                    </Link>
                    <span className="opacity-40 hidden sm:inline">•</span>
                    <span>© {new Date().getFullYear()} Envitefy</span>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
