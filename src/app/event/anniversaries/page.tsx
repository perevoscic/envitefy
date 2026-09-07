"use client";

import { ArrowRight, HeartHandshake } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import BirthdayDesignPreview from "@/components/birthdays/BirthdayDesignPreview";
import { ANNIVERSARY_DESIGN_CATALOG } from "@/data/birthday-design-catalog";
import AnniversaryCustomizePage from "./customize/page";

export default function AnniversariesPage() {
  const search = useSearchParams();

  if (search?.get("edit")) return <AnniversaryCustomizePage />;

  const customizeHref = (templateId: string) => {
    const params = new URLSearchParams({ templateId });
    const date = search?.get("d");
    if (date) params.set("d", date);
    return `/event/anniversaries/customize?${params.toString()}`;
  };

  return (
    <main className="min-h-screen bg-[#fff9f1] text-[#35251d]">
      <section className="border-b border-[#eadbd9] bg-[#fff8f5] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <div className="mx-auto max-w-[1500px]">
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
        <div className="grid grid-cols-1 gap-x-7 gap-y-11 md:grid-cols-2 xl:grid-cols-3">
          {ANNIVERSARY_DESIGN_CATALOG.map((design) => (
            <article key={design.id} className="group relative rounded-3xl">
              <Link
                href={customizeHref(design.id)}
                aria-label={`Customize ${design.name}`}
                className="absolute inset-0 z-20 rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-[#9b5268] focus-visible:ring-offset-4 focus-visible:ring-offset-[#fff9f1]"
              >
                <span className="sr-only">Customize {design.name}</span>
              </Link>
              <div className="overflow-hidden rounded-3xl border border-[#ead5c2] bg-white p-2 shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
                <BirthdayDesignPreview design={design} className="rounded-2xl" />
              </div>
              <div className="px-2 pt-5">
                <div className="flex items-start justify-between gap-4">
                  <h2 className='text-2xl font-normal tracking-tight [font-family:var(--font-playfair),_"Times_New_Roman",_serif]'>
                    {design.name}
                  </h2>
                  <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-[#9b5268]" aria-hidden="true" />
                </div>
                <p className="mt-2 text-sm leading-6 text-[#725b4e]">{design.description}</p>
                <p className="mt-4 text-xs font-semibold text-[#9b5268]">
                  {design.milestone ? `${design.milestone} ${design.milestone === 1 ? "year" : "years"} together` : design.id === "garden-vow-renewal-anniversary" ? "Vow renewal" : "Every anniversary"}
                  {" · "}{design.style}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
