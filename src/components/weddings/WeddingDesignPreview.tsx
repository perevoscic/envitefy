import WeddingRenderer from "@/components/weddings/WeddingRenderer";
import type { WeddingDesign } from "@/lib/wedding-designs";

type WeddingDesignPreviewProps = {
  design: WeddingDesign;
  className?: string;
  names?: string;
};

export default function WeddingDesignPreview({
  design,
  className = "",
  names,
}: WeddingDesignPreviewProps) {
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
    <div
      aria-hidden="true"
      inert
      data-wedding-design={design.id}
      data-wedding-layout={design.layout}
      className={`relative isolate aspect-[16/10] w-full overflow-hidden bg-white ${className}`}
      style={{ backgroundColor: design.primaryColor }}
    >
      <div className="pointer-events-none absolute left-0 top-0 h-[400%] w-[400%] origin-top-left scale-[0.25] select-none">
        <WeddingRenderer template={template} event={previewEvent} />
      </div>
    </div>
  );
}
