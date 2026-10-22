"use client";

import { CalendarDays } from "lucide-react";
import { useSearchParams } from "next/navigation";
import EventCreateWysiwyg from "@/components/EventCreateWysiwyg";
import CategoryGalleryBackdrop from "@/components/events/CategoryGalleryBackdrop";
import EventDesignGallery from "@/components/events/EventDesignGallery";
import TemplateArtworkThumbnail from "@/components/events/TemplateArtworkThumbnail";
import { getGeneralCreationDesigns, generalCreationCollectionLabel } from "@/lib/create/event-page-collections";

export default function NewGeneralEventPage() {
  const search = useSearchParams();
  const date = search?.get("d");
  const collection = search?.get("collection");
  const occasion = search?.get("occasion");
  const collectionLabel = generalCreationCollectionLabel(collection);
  const designs = getGeneralCreationDesigns(collection, occasion);

  // Saved manual drafts keep their original editor and snapshot shape.
  if (search?.get("edit")) {
    const parsedDate = date ? new Date(date) : null;
    return <EventCreateWysiwyg defaultDate={parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : undefined} initialCategoryKey="general" />;
  }

  return (
    <EventDesignGallery
      title={collectionLabel || "General Event"}
      category="general"
      designs={designs}
      getHref={(design) => {
        const params = new URLSearchParams({ templateId: design.id });
        if (collectionLabel && collection) params.set("collection", collection);
        if (collection === "holidays-seasonal" && occasion) params.set("occasion", occasion);
        if (date) params.set("d", date);
        return `/event/general/customize?${params.toString()}`;
      }}
      renderPreview={(design) => <TemplateArtworkThumbnail design={design} />}
      header={(
        <section className="relative isolate overflow-hidden border-b border-[#e2d9ed] px-5 py-6 sm:px-8 sm:py-10 lg:px-12 lg:py-16">
          {!collectionLabel ? <CategoryGalleryBackdrop category="general" /> : null}
          <div className="relative z-10 mx-auto max-w-[1500px]">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#d9cce9] bg-white/80 px-4 py-2.5 text-xs font-semibold text-[#756095]">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              {designs.length} event page designs
            </p>
            <h1 className="mt-4 max-w-3xl text-5xl font-normal leading-tight tracking-tight text-[#352b42] [font-family:var(--font-playfair),Georgia,serif] sm:mt-7 sm:text-6xl">
              {collectionLabel || "General Events"}
              <span className="mt-1 block text-3xl italic text-[#756095] sm:mt-3 sm:text-4xl">
                {collectionLabel ? "Choose a design and make it yours." : "Make room for good company."}
              </span>
            </h1>
          </div>
        </section>
      )}
    />
  );
}
