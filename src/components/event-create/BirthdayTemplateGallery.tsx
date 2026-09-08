"use client";
import { useState } from "react";
import TemplateGallery from "./TemplateGallery";
import { birthdayTemplateCatalog, type BirthdayTemplateDefinition, type TemplateVariation } from "@/data/birthday-template-catalog";
export { birthdayTemplateCatalog, type BirthdayTemplateDefinition, type TemplateVariation, type TemplateLayoutConfig } from "@/data/birthday-template-catalog";

type Props = {
  appliedTemplateId: string | null;
  appliedVariationId: string | null;
  showColorStories?: boolean;
  onApplyTemplate: (
    template: BirthdayTemplateDefinition,
    variation: TemplateVariation
  ) => void;
};

export default function BirthdayTemplateGallery({
  appliedTemplateId,
  appliedVariationId,
  showColorStories = true,
  onApplyTemplate,
}: Props) {
  const [customHeroImage, _setCustomHeroImage] = useState<string | null>(null);

  return (
    <div className="w-full max-w-7xl">
      <TemplateGallery
        templates={birthdayTemplateCatalog as any}
        appliedTemplateId={appliedTemplateId}
        appliedVariationId={appliedVariationId}
        forceBirthdayHero
        onApplyTemplate={(template, variation) =>
          onApplyTemplate(template as BirthdayTemplateDefinition, variation)
        }
        previewHeroImageUrl={customHeroImage}
      />
    </div>
  );
}
