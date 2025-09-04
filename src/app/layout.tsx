import type { Metadata } from "next";
import { Geist, Geist_Mono, Pacifico, Montserrat } from "next/font/google";
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
    "Snap My Date is a tool that allows you to add events to your calendar by taking a photo of a flyer.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pacifico.variable} ${montserrat.variable} antialiased`}
      >
        <Providers session={session}>
          <LeftSidebar />
          <div className="min-h-[100dvh] landing-dark-gradient bg-background text-foreground flex flex-col">
            <div className="flex-1 min-w-0">{children}</div>
            <footer>
              <div className="max-w-7xl mx-auto px-4 py-6 text-sm text-foreground/80">
                <div className="flex flex-wrap items-center justify-center gap-4 text-center">
                  <Link href="/terms" className="hover:text-foreground">
                    Terms of Use
                  </Link>
                  <span className="opacity-40">•</span>
                  <Link href="/privacy" className="hover:text-foreground">
                    Privacy Policy
                  </Link>
                  <span className="opacity-40">•</span>
                  <span>© {new Date().getFullYear()} Snap My Date</span>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
