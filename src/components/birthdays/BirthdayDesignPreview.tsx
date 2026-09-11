import TemplateArtworkThumbnail, {
  artworkComposition,
  artworkInk,
} from "@/components/events/TemplateArtworkThumbnail";
import type { BirthdayCatalogDesign } from "@/data/birthday-design-catalog";

export default function BirthdayDesignPreview({
  design,
  className = "",
}: {
  design: BirthdayCatalogDesign;
  className?: string;
}) {
  return (
    <TemplateArtworkThumbnail
      className={className}
      design={{
        id: design.id,
        name: design.name,
        artwork: design.heroImage,
        label: design.occasion,
        background: design.primaryColor,
        ink: artworkInk(design.primaryColor, design.secondaryColor),
        accent: design.secondaryColor,
        font: `"${design.headlineFont}", Georgia, serif`,
        composition: artworkComposition(
          `${design.experience.composition} ${design.layout} ${design.style}`,
        ),
      }}
    />
  );
}
