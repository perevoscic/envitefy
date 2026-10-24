import TemplateArtworkThumbnail, { artworkComposition } from "@/components/events/TemplateArtworkThumbnail";
import { getGenderRevealDesign } from "@/lib/gender-reveal-designs";
import type { CategoryThumbnailProps } from "./types";
export default function CategoryThumbnail({ template }: CategoryThumbnailProps) {
  const base = { id: template.id, name: template.name, artwork: template.heroImage };
    const design = getGenderRevealDesign(template.id);
    const fontNames: Record<string, string> = {
      cormorantgaramond: "Cormorant Garamond",
      breeserif: "Bree Serif",
      dmserifdisplay: "DM Serif Display",
      librebaskerville: "Libre Baskerville",
      greatvibes: "Great Vibes",
      kaushanscript: "Kaushan Script",
      pirataone: "Pirata One",
      playfairdisplay: "Playfair Display",
      spacegrotesk: "Space Grotesk",
      bebasneue: "Bebas Neue",
    };
    return (
      <TemplateArtworkThumbnail
        design={{
          ...base,
          label: "Gender reveal",
          background: design.paper,
          ink: design.ink,
          accent: design.accent,
          font: `"${fontNames[design.font] || design.font}", Georgia, serif`,
          composition: artworkComposition(`${design.composition} ${design.style}`),
        }}
      />
    );
  }
