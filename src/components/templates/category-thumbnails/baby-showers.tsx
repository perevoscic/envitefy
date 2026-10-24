import TemplateArtworkThumbnail, { artworkComposition } from "@/components/events/TemplateArtworkThumbnail";
import { BABY_SHOWER_DESIGNS, getBabyShowerDesign } from "@/lib/baby-shower-designs";
import type { CategoryThumbnailProps } from "./types";
export default function CategoryThumbnail({ template }: CategoryThumbnailProps) {
  const base = { id: template.id, name: template.name, artwork: template.heroImage };
    const design = getBabyShowerDesign(template.id) ?? BABY_SHOWER_DESIGNS[0];
    return (
      <TemplateArtworkThumbnail
        design={{
          ...base,
          label: "Baby shower",
          background: design.colors.background,
          ink: design.colors.text,
          accent: design.colors.accent,
          font: `"${design.displayFont}", Georgia, serif`,
          composition: artworkComposition(`${design.composition} ${design.style}`),
        }}
      />
    );
  }
