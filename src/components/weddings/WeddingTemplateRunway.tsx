import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import WeddingDesignPreview from "@/components/weddings/WeddingDesignPreview";
import type { WeddingDesign } from "@/lib/wedding-designs";

const RUNWAY_POSITIONS = [
  "xl:left-0 xl:top-14 xl:z-[1] xl:-rotate-[5deg]",
  "xl:left-[19%] xl:top-0 xl:z-[2] xl:-rotate-[2deg]",
  "xl:right-[19%] xl:top-1 xl:z-[3] xl:rotate-[2deg]",
  "xl:right-0 xl:top-14 xl:z-[4] xl:rotate-[5deg]",
] as const;

export default function WeddingTemplateRunway({
  designs,
  getHref,
}: {
  designs: readonly WeddingDesign[];
  getHref: (templateId: string) => string;
}) {
  return (
    <div
      role="group"
      aria-label="Four real Envitefy wedding event-page designs"
      className="relative isolate grid grid-cols-2 gap-3 sm:gap-4 xl:block xl:h-[320px]"
    >
      {designs.map((design, index) => (
        <article
          key={design.id}
          className={`group relative min-w-0 rounded-[1rem] border border-[#d3b47b]/28 bg-[#f8f3e9] p-1.5 text-[#2b241f] shadow-[0_24px_70px_rgba(0,0,0,0.38)] transition duration-300 ease-out hover:z-20 focus-within:z-20 xl:absolute xl:w-[43%] xl:hover:-translate-y-2 xl:hover:scale-[1.025] xl:focus-within:-translate-y-2 xl:focus-within:scale-[1.025] motion-reduce:transition-none ${RUNWAY_POSITIONS[index] || ""}`}
        >
          <Link
            href={getHref(design.id)}
            aria-label={`View the ${design.name} complete event-page design`}
            className="absolute inset-0 z-20 rounded-[1rem] outline-none focus-visible:ring-2 focus-visible:ring-[#ead3a7] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1f1b18]"
          >
            <span className="sr-only">View {design.name}</span>
          </Link>
          <WeddingDesignPreview design={design} className="rounded-[0.7rem]" />
          <div className="flex min-h-12 items-center justify-between gap-2 px-2 pb-1 pt-2 sm:min-h-14 sm:px-2.5">
            <div className="min-w-0">
              <p className="truncate text-[8px] font-black uppercase tracking-[0.14em] text-[#9b7344] sm:text-[9px]">
                {design.style}
              </p>
              <p className='truncate [font-family:var(--font-playfair),_"Times_New_Roman",_serif] text-sm leading-tight sm:text-base'>
                {design.name}
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-1 text-[8px] font-bold uppercase tracking-[0.1em] text-[#5b493a] transition group-hover:text-[#1f1b18] sm:text-[9px]">
              <span className="hidden sm:inline">View style</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
