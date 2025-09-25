import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Pacifico, Montserrat } from "next/font/google";
import Script from "next/script";
import Link from "next/link";
import Providers from "./providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LeftSidebar from "./left-sidebar";
import "./globals.css";

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
  title: "Snap My Date",
  description:
    "Snap My Date is an innovative event management tool to scan birthday invites, flyers, wedding invitations, appointment cards instantly adding events to your preferred calendar. Simplify your scheduling with our powerful calendar integration and keep your family events organized.",
  manifest: "/manifest.webmanifest",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0f" },
  ],
  icons: {
    icon: [
      { url: "/invite.png", sizes: "192x192", type: "image/png" },
      { url: "/invite.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/invite.png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Snap My Date",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pacifico.variable} ${montserrat.variable} antialiased`}
      >
        <Script id="theme-init" strategy="beforeInteractive">{`
          (function(){
            try {
              var stored = localStorage.getItem('theme');
              var theme = (stored === 'light' || stored === 'dark')
                ? stored
                : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
              document.documentElement.setAttribute('data-theme', theme);
            } catch (e) {
              // noop
            }
          })();
        `}</Script>
        <Providers session={session}>
          <LeftSidebar />
          <div className="min-h-[100dvh] landing-dark-gradient bg-background text-foreground flex flex-col">
            <div className="flex-1 min-w-0">{children}</div>
            <footer>
              <div className="max-w-7xl mx-auto px-3 py-6 text-[10px] sm:text-xs md:text-sm text-foreground/80">
                <div className="w-full overflow-x-auto">
                  <p className="text-center whitespace-nowrap">
                    <Link
                      href="https://www.snapmydate.com/terms"
                      className="hover:text-foreground"
                    >
                      Terms of Use
                    </Link>
                    <span className="opacity-40 mx-2">•</span>
                    <Link
                      href="https://www.snapmydate.com/privacy"
                      className="hover:text-foreground"
                    >
                      Privacy Policy
                    </Link>
                    <span className="opacity-40 mx-2">•</span>
                    <span>© {new Date().getFullYear()} Snap My Date</span>
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
