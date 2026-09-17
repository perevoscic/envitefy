import type { Metadata } from "next";
import FootballLanding from "@/components/football-landing/FootballLanding";

export const metadata: Metadata = {
  title: "Envitefy Football | Game day and season pages",
  description:
    "Create a football page for your team with game schedules, roster details, travel plans, and attendance in one shareable place.",
  alternates: { canonical: "/football" },
  openGraph: {
    title: "Envitefy Football",
    description:
      "Football pages for coaches, players, and families. Choose a design and bring your team details together.",
    url: "https://envitefy.com/football",
    images: ["/images/landing/football/friday-night-team.webp"],
  },
};

export default function FootballPage() {
  return <FootballLanding />;
}
