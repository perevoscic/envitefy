import { BIRTHDAY_SAMPLES, birthdaySampleHeadline } from "@/data/birthday-samples";
import BirthdayExperienceBody from "@/components/birthdays/BirthdayExperienceBody";
import BirthdayExperienceHero from "@/components/birthdays/BirthdayExperienceHero";
import type { BirthdayCatalogDesign } from "@/data/birthday-design-catalog";
import { TemplateThumbnailPreview } from "@/components/events/TemplateThumbnail";

type BirthdayDesignPreviewProps = {
  design: BirthdayCatalogDesign;
  className?: string;
};

export default function BirthdayDesignPreview({
  design,
  className = "",
}: BirthdayDesignPreviewProps) {
  const sample = BIRTHDAY_SAMPLES[design.id];
  const previewName = sample?.name || (design.occasion === "Anniversary" ? "Alex & Jordan" : "Jordan");
  const headline = birthdaySampleHeadline(design.id) || design.defaultHeadline || design.name;
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
    age: sample?.age || design.milestone || (design.audience === "Adults" ? 40 : 8),
    date: "2028-09-21T18:00:00",
    location: sample?.venue || "The Celebration House",
    story: sample?.notes || design.heroMood,
    thingsToDo: sample?.activities || design.description,
    party: { theme: design.name },
    gallery: [design.heroImage],
    hosts: [{ name: "Family & friends" }],
    rsvpEnabled: false,
  };

  return (
    <TemplateThumbnailPreview className={className}>
      <BirthdayExperienceHero preview theme={previewTheme} event={previewEvent} />
      <BirthdayExperienceBody theme={previewTheme} event={previewEvent} />
    </TemplateThumbnailPreview>
  );
}
