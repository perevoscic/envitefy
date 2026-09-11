"use client";

import { useSearchParams } from "next/navigation";
import CategoryTemplateThumbnail from "@/components/templates/CategoryTemplateThumbnail";
import { babyShowerTemplateCatalog } from "@/components/event-create/BabyShowersTemplateGallery";
import { genderRevealTemplateCatalog } from "@/components/event-create/GenderRevealTemplateGallery";
import { type FamilyTemplateCategory, getFamilyTemplateDesign } from "@/lib/family-template-designs";
import EventDesignGallery from "./EventDesignGallery";

export default function FamilyDesignGallery({ category }: { category: FamilyTemplateCategory }) {
  const search = useSearchParams();
  const isBaby = category === "baby-showers";
  const catalog = isBaby ? babyShowerTemplateCatalog : genderRevealTemplateCatalog;
  const designs = catalog.map((template) => ({ ...template, style: template.heroMood || "Classic" }));

  return (
    <EventDesignGallery
      title={isBaby ? "Baby showers" : "Gender reveals"}
      description={isBaby ? "A little one, a lot of love. Find your baby shower design, then add your celebration details, registry, and RSVP." : "Make the moment yours. Choose a reveal design, add your party details, and invite everyone to share the surprise."}
      designs={designs}
      getHref={(design) => {
        const params = new URLSearchParams({ templateId: design.id });
        const date = search?.get("d");
        if (date) params.set("d", date);
        return `/event/${category}/customize?${params.toString()}`;
      }}
      renderPreview={(design) => <CategoryTemplateThumbnail category={category} template={{ id: design.id, name: design.name, heroImage: getFamilyTemplateDesign(category, design.id).heroImage }} />}
    />
  );
}
