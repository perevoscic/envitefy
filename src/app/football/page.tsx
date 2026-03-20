import type { Metadata } from "next";
import FootballLanding from "@/components/football-landing/FootballLanding";

export const metadata: Metadata = {
  title: "Envitefy Football | Premium season pages for teams and families",
  description:
    "Publish elegant football season pages with schedules, travel notes, roster info, maps, and live updates. Built for coaches, players, parents, and fans.",
  openGraph: {
    title: "Envitefy Football",
    description:
      "Premium football season pages with editorial layouts, live updates, travel details, and mobile-first presentation.",
    url: "https://envitefy.com/football",
    siteName: "Envitefy",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Envitefy Football",
    description:
      "Premium football season pages with editorial layouts, live updates, travel details, and mobile-first presentation.",
  },
};

export default function FootballPage() {
  return <FootballLanding />;
}
