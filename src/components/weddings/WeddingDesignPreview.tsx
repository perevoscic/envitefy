import TemplateArtworkThumbnail, { artworkComposition, artworkInk } from "@/components/events/TemplateArtworkThumbnail";
import WeddingRenderer from "@/components/weddings/WeddingRenderer";
import { TemplateThumbnailPreview } from "@/components/events/TemplateThumbnail";
import type { WeddingDesign } from "@/lib/wedding-designs";

type WeddingDesignPreviewProps = {
  design: WeddingDesign;
  className?: string;
  names?: string;
  compact?: boolean;
};

export default function WeddingDesignPreview({
  design,
  className = "",
  names,
  compact = false,
}: WeddingDesignPreviewProps) {
  if (!compact) {
    return <TemplateArtworkThumbnail className={className} design={{
      id: design.id, name: design.name, artwork: design.heroImage, label: "Wedding",
      background: design.primaryColor, ink: artworkInk(design.primaryColor, design.secondaryColor),
      accent: design.secondaryColor, font: `"${design.headlineFont}", Georgia, serif`,
      composition: artworkComposition(`${design.signature} ${design.style}`),
    }} />;
  }
  const resolvedNames = names || design.previewNames;
  const [partner1 = "Partner One", partner2 = "Partner Two"] = resolvedNames
    .split("&")
    .map((name) => name.trim());

  const template = {
    id: design.id,
    name: design.name,
    family: design.family,
    layout: design.layout,
    theme: {
      colors: {
        primary: design.primaryColor,
        secondary: design.secondaryColor,
        background: design.primaryColor,
      },
      fonts: {
        headline: design.headlineFont,
        body: design.bodyFont,
      },
      decorations: {
        heroImage: design.heroImage,
      },
    },
  };

  const previewEvent = {
    headlineTitle: resolvedNames,
    couple: {
      partner1,
      partner2,
    },
    date: "September 21, 2028",
    location: "New York, NY",
    tagline: "Together is a beautiful place to be.",
    story: `${partner1} and ${partner2} invite you to celebrate the beginning of their forever.`,
    schedule: [
      { title: "Ceremony", time: "4:30 PM", location: "The Garden" },
      { title: "Cocktails", time: "5:30 PM", location: "The Terrace" },
      { title: "Dinner & Dancing", time: "7:00 PM", location: "The Ballroom" },
    ],
    party: [
      { name: "Jordan", role: "Honor Attendant" },
      { name: "Cameron", role: "Best Person" },
    ],
    travel: "A room block and transportation are available for our guests.",
    thingsToDo: "Welcome drinks, a neighborhood walk, and Sunday brunch.",
    registry: [],
    rsvpEnabled: false,
  };

  return (
    <TemplateThumbnailPreview
      data-wedding-design={design.id}
      data-wedding-layout={design.layout}
      className={className}
      compact={compact}
      scaled
      style={{ backgroundColor: design.primaryColor }}
    >
      <WeddingRenderer template={template} event={previewEvent} hideGuestTools />
    </TemplateThumbnailPreview>
  );
}
