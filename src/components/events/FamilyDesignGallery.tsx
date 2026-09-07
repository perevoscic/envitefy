"use client";

import { useSearchParams } from "next/navigation";
import BabyShowerTemplateView from "@/components/BabyShowerTemplateView";
import GenderRevealTemplateView from "@/components/GenderRevealTemplateView";
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
      renderPreview={(design) => {
        const defaults = getFamilyTemplateDesign(category, design.id);
        const eventData = {
          babyName: "Emma",
          momName: "Sarah",
          parentsName: "Sarah & Michael",
          eventTitle: "Our little surprise",
          date: "2028-09-21",
          time: "14:00",
          city: "Chicago",
          state: "IL",
          location: "The Garden House",
          heroImage: defaults.heroImage,
          themeId: defaults.themeId,
          theme: { themeId: defaults.themeId, fontFamily: `var(--font-${defaults.font})` },
          rsvpEnabled: false,
          hosts: [{ name: "Family & friends", role: "Your hosts" }],
          babyDetails: { notes: "Join us for an afternoon of little wishes, sweet treats, and so much love." },
        };
        const props = { eventId: "", eventTitle: design.name, eventData, shareUrl: "", isOwner: false, isReadOnly: true, editHref: "" };
        return isBaby ? <BabyShowerTemplateView {...props} /> : <GenderRevealTemplateView {...props} preview />;
      }}
    />
  );
}
