import BirthdayExperienceBody from "@/components/birthdays/BirthdayExperienceBody";
import BirthdayExperienceHero from "@/components/birthdays/BirthdayExperienceHero";
import type { BirthdayCatalogDesign } from "@/data/birthday-design-catalog";

type BirthdayDesignPreviewProps = {
  design: BirthdayCatalogDesign;
  className?: string;
};

export default function BirthdayDesignPreview({
  design,
  className = "",
}: BirthdayDesignPreviewProps) {
  const previewName = design.occasion === "Anniversary" ? "Alex & Jordan" : "Jordan";
  const headline = design.defaultHeadline || design.name;
  const previewTheme = {
    id: design.id,
    name: design.name,
    defaultHeadline: headline,
    colors: {
      primary: design.primaryColor,
      secondary: design.secondaryColor,
    },
    fonts: {
      headline: design.headlineFont,
      body: "Inter, sans-serif",
    },
    heroImage: design.heroImage,
    decorations: {
      heroImage: design.heroImage,
      graphicType: design.decorations.graphicType,
    },
    experience: design.experience,
  };
  const previewEvent = {
    headlineTitle: headline,
    birthdayName: previewName,
    age: design.milestone || (design.audience === "Adults" ? 40 : 8),
    date: "2028-09-21T18:00:00",
    location: "The Celebration House",
    story: design.heroMood,
    thingsToDo: design.description,
    party: { theme: design.name },
    gallery: [design.heroImage],
    hosts: [{ name: "Family & friends" }],
    rsvpEnabled: false,
  };

  return (
    <div
      aria-hidden="true"
      inert
      className={`relative isolate aspect-[7/4] w-full overflow-hidden bg-white ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[61%] overflow-hidden select-none">
        <div className="absolute left-0 top-0 h-[400%] w-[400%] origin-top-left scale-25">
        <BirthdayExperienceHero
          preview
          theme={previewTheme}
          event={previewEvent}
        />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[39%] overflow-hidden border-t border-black/10 select-none">
        <div className="absolute left-0 top-0 h-[400%] w-[400%] origin-top-left scale-25">
          <BirthdayExperienceBody theme={previewTheme} event={previewEvent} />
        </div>
      </div>
    </div>
  );
}
