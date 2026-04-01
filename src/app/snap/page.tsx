import type { Metadata, Viewport } from "next";
import SnapSignupLanding from "@/components/snap-landing/SnapSignupLanding";
import { themeColorPalette } from "@/lib/theme-color";

export const metadata: Metadata = {
  title: "Envitefy Snap | Turn event photos into shareable event pages",
  description:
    "Snap a photo or upload an invite, flyer, or schedule and turn it into a polished event page with RSVPs, sign-ups, and more.",
  openGraph: {
    title: "Envitefy Snap",
    description:
      "Snap a photo or upload an invite, flyer, or schedule and turn it into a polished event page with RSVPs, sign-ups, and more.",
    url: "https://envitefy.com/snap",
    siteName: "Envitefy",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Envitefy Snap",
    description:
      "Snap a photo or upload an invite, flyer, or schedule and turn it into a polished event page with RSVPs, sign-ups, and more.",
  },
};

export const viewport: Viewport = {
  themeColor: themeColorPalette.eventFallback,
};

export default function SnapPage() {
  return <SnapSignupLanding />;
}
