import type { Metadata } from "next";
import FootballDesignGallery from "@/components/football-season-templates/FootballDesignGallery";
import { buildCategoryShareMetadata } from "@/lib/category-share-metadata";

export const metadata: Metadata = {
  title: "Football page templates | Envitefy",
  description:
    "Choose a football design for your game day or season. Add team schedules, roster details, travel plans, and attendance.",
  alternates: { canonical: "/football/templates" },
  ...buildCategoryShareMetadata("football", {
    title: "Football page templates | Envitefy",
    description:
      "Choose a football design for your game day or season. Add team schedules, roster details, travel plans, and attendance.",
    url: "/football/templates",
  }),
};

export default function FootballTemplatesPage() {
  return <FootballDesignGallery publicView />;
}
