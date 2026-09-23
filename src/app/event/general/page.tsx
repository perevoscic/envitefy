"use client";

import { CalendarDays } from "lucide-react";
import { useSearchParams } from "next/navigation";
import EventCreateWysiwyg from "@/components/EventCreateWysiwyg";
import CategoryGalleryBackdrop from "@/components/events/CategoryGalleryBackdrop";
import EventDesignGallery from "@/components/events/EventDesignGallery";
import TemplateArtworkThumbnail from "@/components/events/TemplateArtworkThumbnail";
import { GENERAL_EVENT_DESIGNS } from "@/lib/general-event-designs";

export default function NewGeneralEventPage() {
  const search = useSearchParams();
  const date = search?.get("d");

  // Saved manual drafts keep their original editor and snapshot shape.
  if (search?.get("edit")) {
    const parsedDate = date ? new Date(date) : null;
    return <EventCreateWysiwyg defaultDate={parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : undefined} initialCategoryKey="general" />;
  }

  return (
    <EventDesignGallery
      title="General Event"
      category="general"
      designs={GENERAL_EVENT_DESIGNS}
      getHref={(design) => {
        const params = new URLSearchParams({ templateId: design.id });
        if (date) params.set("d", date);
        return `/event/general/customize?${params.toString()}`;
      }}
      renderPreview={(design) => <TemplateArtworkThumbnail design={design} />}
      header={(
        <section className="relative isolate overflow-hidden border-b border-[#e2d9ed] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
          <CategoryGalleryBackdrop category="general" />
          <div className="relative z-10 mx-auto max-w-[1500px]">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#d9cce9] bg-white/80 px-4 py-2.5 text-xs font-semibold text-[#756095]">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              {GENERAL_EVENT_DESIGNS.length} event page designs
            </p>
            <h1 className="mt-7 max-w-3xl text-5xl font-normal leading-tight tracking-tight text-[#352b42] [font-family:var(--font-playfair),Georgia,serif] sm:text-6xl">
              General Events
              <span className="mt-3 block text-3xl italic text-[#756095] sm:text-4xl">
                Make room for good company.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[#6f6080]">
              From casual meetups to dinners, workshops, and community gatherings,
              find a design for your occasion. Add your details and invite everyone
              to come together.
            </p>
          </div>
        </section>
      )}
    />
  );
}
