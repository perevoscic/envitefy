import type { Metadata } from "next";
import FootballDesignGallery from "@/components/football-season-templates/FootballDesignGallery";

export const metadata: Metadata = {
  title: "Football page templates | Envitefy",
  description:
    "Choose a football design for your game day or season. Add team schedules, roster details, travel plans, and attendance.",
  alternates: { canonical: "/football/templates" },
};

export default function FootballTemplatesPage() {
  return <FootballDesignGallery />;
}
