"use client";

import { HeartHandshake } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import BirthdayDesignPreview from "@/components/birthdays/BirthdayDesignPreview";
import TemplateAutoLoader from "@/components/events/TemplateAutoLoader";
import CategoryGalleryBackdrop from "@/components/events/CategoryGalleryBackdrop";
import { categoryGalleryPageClassName } from "@/components/events/category-gallery-page";
import { TemplateMasonryCard, TemplateMasonryGrid } from "@/components/events/TemplateMasonryGallery";
import { ANNIVERSARY_DESIGN_CATALOG } from "@/data/birthday-design-catalog";
import AnniversaryCustomizePage from "./customize/page";

export default function AnniversariesPage() {
  const search = useSearchParams();
  const [visibleCount, setVisibleCount] = useState(12);

  if (search?.get("edit")) return <AnniversaryCustomizePage />;

  const customizeHref = (templateId: string) => {
    const params = new URLSearchParams({ templateId });
    const date = search?.get("d");
    if (date) params.set("d", date);
    return `/event/anniversaries/customize?${params.toString()}`;
  };

  return (
    <main className={`${categoryGalleryPageClassName("anniversaries")} min-h-screen text-[#35251d]`}>
      <section className="relative isolate overflow-hidden border-b border-[#eadbd9] bg-[#fff8f5] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <CategoryGalleryBackdrop category="anniversaries" />
        <div className="relative z-10 mx-auto max-w-[1500px]">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e4c8b7] bg-white/80 px-4 py-2.5 text-xs font-semibold text-[#87562d]">
            <HeartHandshake className="h-4 w-4" aria-hidden="true" />
            {ANNIVERSARY_DESIGN_CATALOG.length} anniversary designs
          </div>
          <h1 className='mt-7 max-w-3xl text-5xl font-normal leading-tight tracking-tight [font-family:var(--font-playfair),_"Times_New_Roman",_serif] sm:text-6xl'>
            Anniversaries
            <span className="mt-3 block text-3xl italic text-[#9b5268] sm:text-4xl">
              Celebrate your years together.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[#695660]">
            From your first year to a diamond anniversary or a renewal of your vows,
            find a design for your story. Add your names, milestone, photos, and
            celebration details, then invite the people who have shared the journey.
          </p>
        </div>
      </section>

      <section aria-label="Anniversary designs" className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
        <TemplateMasonryGrid>
          {ANNIVERSARY_DESIGN_CATALOG.slice(0, visibleCount).map((design) => (
            <TemplateMasonryCard key={design.id} designId={design.id} name={design.name} href={customizeHref(design.id)}>
              <BirthdayDesignPreview design={design} />
            </TemplateMasonryCard>
          ))}
        </TemplateMasonryGrid>
        <TemplateAutoLoader visibleCount={visibleCount} totalCount={ANNIVERSARY_DESIGN_CATALOG.length} setVisibleCount={setVisibleCount} />
      </section>
    </main>
  );
}
