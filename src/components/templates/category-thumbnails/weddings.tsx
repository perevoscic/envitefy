import TemplateArtworkThumbnail, { artworkComposition, artworkInk } from "@/components/events/TemplateArtworkThumbnail";
import { weddingDesignCatalog } from "@/lib/wedding-designs";
import type { CategoryThumbnailProps } from "./types";
export default function WeddingThumbnail({ template }: CategoryThumbnailProps) {
  const design = weddingDesignCatalog.find((item) => item.id === template.id);
  if (!design) return null;
  return <TemplateArtworkThumbnail design={{
    id: design.id,
    name: design.name,
    artwork: design.heroImage,
    label: "Wedding",
    background: design.primaryColor,
    ink: artworkInk(design.primaryColor, design.secondaryColor),
    accent: design.secondaryColor,
    font: `"${design.headlineFont}", Georgia, serif`,
    composition: artworkComposition(`${design.signature} ${design.style}`),
  }} />;
}
