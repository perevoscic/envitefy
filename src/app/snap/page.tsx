import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import SnapLanding from "@/components/snap-landing/SnapLanding";
import { themeColorPalette } from "@/lib/theme-color";
import styles from "./page.module.css";

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
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Envitefy Snap",
    description:
      "Upload an invite, flyer, screenshot, schedule, or PDF and turn it into a polished event page with RSVPs, links, and mobile-friendly sharing.",
  },
};

export const viewport: Viewport = {
  themeColor: themeColorPalette.eventFallback,
};

export default function SnapPage() {
  return (
    <div className={`${outfit.variable} ${inter.variable} ${styles.snapPage}`}>
      <SnapLanding />
    </div>
  );
}
