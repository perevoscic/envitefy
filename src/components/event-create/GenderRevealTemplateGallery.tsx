"use client";

import TemplateGallery, {
  type ResolvedTemplateVariation,
  type TemplateGalleryTemplate,
} from "./TemplateGallery";
import { genderRevealDesigns, getGenderRevealDesign } from "@/lib/gender-reveal-designs";

const genderRevealMenu = ["Home", "Details", "Team Pink/Blue", "RSVP"];

export type GenderRevealTemplateDefinition = TemplateGalleryTemplate & {
  preview?: {
    coupleName: string;
    dateLabel: string;
    location: string;
    timeLabel?: string;
  };
  backgroundPrompt?: string;
};
export type TemplateVariation = ResolvedTemplateVariation;

/** Every entry is a separate composition with its own original artwork. */
export function getGenderRevealBackgroundPrompt(templateId: string): string {
  return getGenderRevealDesign(templateId).imagePrompt;
}

const baseGenderRevealTemplateCatalog: GenderRevealTemplateDefinition[] =
  genderRevealDesigns.map((design) => ({
    id: design.id,
    name: design.name,
    description: design.description,
    heroImageName: design.heroImage,
    heroMood: design.style,
    menu: [...genderRevealMenu],
    variations: [{
      id: `${design.id}-original`,
      fontId: "serif-regal-center",
      paletteId: "blush-champagne",
      label: design.name,
      tagline: design.style,
      titleColorOverride: design.ink,
    }],
    preview: { coupleName: "Sarah & Michael", dateLabel: "September 21, 2028", location: "The Garden House", timeLabel: "2:00 PM" },
    backgroundPrompt: design.imagePrompt,
  }));

export const genderRevealTemplateCatalog: GenderRevealTemplateDefinition[] =
  baseGenderRevealTemplateCatalog;

type Props = {
  appliedTemplateId: string | null;
  appliedVariationId: string | null;
  onApplyTemplate: (
    template: GenderRevealTemplateDefinition,
    variation: TemplateVariation
  ) => void;
};

export default function GenderRevealTemplateGallery({
  appliedTemplateId,
  appliedVariationId,
  onApplyTemplate,
}: Props) {
  return (
    <div className="w-full max-w-7xl">
      <TemplateGallery
        templates={genderRevealTemplateCatalog as any}
        appliedTemplateId={appliedTemplateId}
        appliedVariationId={appliedVariationId}
        onApplyTemplate={(template, variation) =>
          onApplyTemplate(template as GenderRevealTemplateDefinition, variation)
        }
      />
    </div>
  );
}
