import type { Metadata, Viewport } from "next";
import GymnasticsLanding from "@/components/gymnastics-landing/GymnasticsLanding";
import { themeColorPalette } from "@/lib/theme-color";

export const metadata: Metadata = {
  title: "Envitefy Gymnastics | Premium meet pages for families and coaches",
  description:
    "Publish elegant gymnastics meet pages with schedules, venue info, hotel blocks, maps, and live updates. Built for families, coaches, athletes, and spectators.",
  openGraph: {
    title: "Envitefy Gymnastics",
    description:
      "Premium gymnastics meet pages with editorial layouts, live updates, hotel details, and mobile-first presentation.",
    url: "https://envitefy.com/gymnastics",
    siteName: "Envitefy",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Envitefy Gymnastics",
    description:
      "Premium gymnastics meet pages with editorial layouts, live updates, hotel details, and mobile-first presentation.",
  },
};

export const viewport: Viewport = {
  themeColor: themeColorPalette.gymnastics,
};

export default function GymnasticsPage() {
  return <GymnasticsLanding />;
}
