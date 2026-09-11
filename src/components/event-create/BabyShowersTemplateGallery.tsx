"use client";

import CategoryTemplateThumbnail from "@/components/templates/CategoryTemplateThumbnail";
import { TemplateThumbnailFrame } from "@/components/events/TemplateThumbnail";
import { BABY_SHOWER_DESIGNS, getBabyShowerDesign } from "@/lib/baby-shower-designs";
import type { ResolvedTemplateVariation, TemplateGalleryTemplate } from "./TemplateGallery";

export type BabyShowerTemplateDefinition = TemplateGalleryTemplate & { backgroundPrompt?: string };
export type TemplateVariation = ResolvedTemplateVariation;

export const babyShowerTemplateCatalog: BabyShowerTemplateDefinition[] = BABY_SHOWER_DESIGNS.map((design) => ({
  id: design.id,
  name: design.name,
  description: design.description,
  heroImageName: design.heroImage,
  heroMood: design.style,
  menu: ["Home", "Details", "Registry", "RSVP"],
  backgroundPrompt: design.imagePrompt,
  preview: { coupleName: design.sample.babyName, dateLabel: design.sample.date, location: design.sample.venue, timeLabel: design.sample.time },
  variations: [{
    id: `${design.id}-original`, label: design.name, tagline: design.composition,
    fontId: "serif-regal-center", titleColorOverride: design.colors.text,
    palette: {
      id: design.id, label: design.name, tagline: design.palette,
      swatches: [design.colors.background, design.colors.text, design.colors.accent],
      background: design.colors.background, titleColor: design.colors.text,
      defaultFontId: "serif-regal-center",
    },
  }],
}));

export function getBabyShowerBackgroundPrompt(templateId: string): string {
  return (getBabyShowerDesign(templateId) ?? BABY_SHOWER_DESIGNS[0]).imagePrompt;
}

export default function BabyShowersTemplateGallery({ appliedTemplateId, onApplyTemplate }: {
  appliedTemplateId: string | null;
  appliedVariationId: string | null;
  onApplyTemplate: (template: BabyShowerTemplateDefinition, variation: TemplateVariation) => void;
}) {
  return (
    <div className="grid w-full grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
      {babyShowerTemplateCatalog.map((template) => {
        const design = getBabyShowerDesign(template.id);
        if (!design) return null;
        const variation: TemplateVariation = {
          ...template.variations[0], label: design.name, tagline: design.composition,
          background: design.colors.background, swatches: [design.colors.background, design.colors.text, design.colors.accent],
          titleColor: design.colors.text, titleFontFamily: `"${design.displayFont}", Georgia, serif`, titleWeight: "normal", titleAlign: "left",
        };
        return (
          <button key={template.id} type="button" className="group text-left" aria-label={`Select ${template.name}`} aria-pressed={appliedTemplateId === template.id} onClick={() => onApplyTemplate(template, variation)}>
            <TemplateThumbnailFrame><CategoryTemplateThumbnail category="baby-showers" template={design} /></TemplateThumbnailFrame>
            <span className="mt-4 block text-lg font-semibold">{template.name}</span>
            <span className="mt-1 block text-sm text-slate-600">{design.style}{appliedTemplateId === template.id ? " · Selected" : ""}</span>
          </button>
        );
      })}
    </div>
  );
}
