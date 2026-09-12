"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Gem, Sparkles } from "lucide-react";
import WeddingDesignPreview from "@/components/weddings/WeddingDesignPreview";
import TemplateAutoLoader from "@/components/events/TemplateAutoLoader";
import { categoryGalleryPageClassName } from "@/components/events/category-gallery-page";
import CategoryGalleryBackdrop from "@/components/events/CategoryGalleryBackdrop";
import { TemplateMasonryCard, TemplateMasonryGrid } from "@/components/events/TemplateMasonryGallery";
import WeddingTemplateRunway from "@/components/weddings/WeddingTemplateRunway";
import {
  type WeddingDesign,
  weddingDesignCatalog,
  weddingDesignColors,
  weddingDesignSeasons,
  weddingDesignStyles,
} from "@/lib/wedding-designs";

const WEDDING_RUNWAY_IDS = [
  "tuscan-lemon-grove",
  "disco-afterglow",
  "delft-blue-estate",
  "japanese-ink",
] as const;

const weddingRunwayDesigns = WEDDING_RUNWAY_IDS.map((templateId) =>
  weddingDesignCatalog.find((design) => design.id === templateId),
).filter((design): design is WeddingDesign => Boolean(design));

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex min-w-[170px] flex-1 flex-col gap-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#756657]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-full border border-[#d9d0c6] bg-white px-4 text-sm font-semibold text-[#332c27] outline-none transition focus:border-[#9d7d54] focus:ring-2 focus:ring-[#9d7d54]/15"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

export default function WeddingDesignGallery() {
  const searchParams = useSearchParams();
  const [style, setStyle] = useState("All styles");
  const [color, setColor] = useState("All colors");
  const [season, setSeason] = useState("All seasons");
  const [collection, setCollection] = useState("All designs");
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    setVisibleCount(12);
  }, [collection, color, season, style]);

  const visibleDesigns = useMemo(
    () =>
      weddingDesignCatalog
        .filter(
          (design) =>
            (collection === "All designs" || design.family === "atelier") &&
            (style === "All styles" || design.style === style) &&
            (color === "All colors" || design.color === color) &&
            (season === "All seasons" || design.season === season),
        )
        .sort((a, b) => Number(b.family === "atelier") - Number(a.family === "atelier")),
    [collection, color, season, style],
  );

  const buildCustomizeHref = (templateId: string) => {
    const params = new URLSearchParams();
    params.set("templateId", templateId);
    const date = searchParams?.get("d");
    if (date) params.set("d", date);
    return `/event/weddings/customize?${params.toString()}`;
  };

  return (
    <main className={`${categoryGalleryPageClassName("weddings")} min-h-screen text-[#2d2723]`}>
      <section className="relative overflow-hidden border-b border-[#ded5ca] bg-[#fffcf7] px-5 py-12 text-[#2d2723] sm:px-8 lg:px-12 lg:py-16">
        <CategoryGalleryBackdrop category="weddings" />
        <div className="relative mx-auto max-w-[1500px]">
          <Link
            href="/weddings"
            className="mb-10 inline-flex items-center gap-2 rounded-sm text-xs font-bold uppercase tracking-[0.2em] text-[#756657] transition hover:text-[#2d2723] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#84653e]"
          >
            <ArrowLeft className="h-4 w-4" />
            Wedding inspiration
          </Link>
          <div className="grid items-center gap-10 xl:grid-cols-[minmax(0,0.82fr)_minmax(620px,1.18fr)] xl:gap-14">
            <div className="max-w-4xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#dfcfb5] bg-[#f5eddf] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.28em] text-[#80613b]">
                <Gem className="h-3.5 w-3.5" aria-hidden="true" />
                {weddingDesignCatalog.length} wedding website designs
              </div>
              <h1
                className='max-w-3xl [font-family:var(--font-playfair),_"Times_New_Roman",_serif] text-5xl font-normal leading-[0.95] tracking-[-0.045em] sm:text-6xl lg:text-7xl'
                style={{ color: "#2d2723" }}
              >
                Find your wedding website design
              </h1>
              <p className="mt-6 max-w-2xl text-base font-light leading-relaxed text-[#706358] sm:text-lg">
                A beautiful beginning for your celebration. Explore 20 new designs with original
                artwork, thoughtful details, and a style all your own. Bring your story, schedule,
                and guest details together in one wedding website.
              </p>
            </div>
            <WeddingTemplateRunway designs={weddingRunwayDesigns} getHref={buildCustomizeHref} />
          </div>
        </div>
      </section>

      <section className="z-20 border-b border-[#ded5ca] bg-[var(--category-gallery-background)] px-5 py-5 backdrop-blur-xl sm:px-8 lg:px-12 xl:sticky xl:top-0">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#332c27]">
              <Sparkles className="h-4 w-4 text-[#9d7d54]" />
              {visibleDesigns.length} curated designs
            </div>
            <p className="mt-1 text-xs text-[#706358]">
              Select a design to customize your wedding invitation.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <FilterSelect
              label="Collection"
              value={collection}
              options={["All designs", "New collection"]}
              onChange={setCollection}
            />
            <FilterSelect
              label="Style"
              value={style}
              options={weddingDesignStyles}
              onChange={setStyle}
            />
            <FilterSelect
              label="Color"
              value={color}
              options={weddingDesignColors}
              onChange={setColor}
            />
            <FilterSelect
              label="Season"
              value={season}
              options={weddingDesignSeasons}
              onChange={setSeason}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
        {visibleDesigns.length > 0 ? (
          <TemplateMasonryGrid>
            {visibleDesigns.slice(0, visibleCount).map((design) => (
              <TemplateMasonryCard key={design.id} designId={design.id} name={design.name} href={buildCustomizeHref(design.id)}>
                <WeddingDesignPreview design={design} />
              </TemplateMasonryCard>
            ))}
          </TemplateMasonryGrid>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-[#cfc3b6] bg-white/55 px-6 py-16 text-center">
            <h2 className='[font-family:var(--font-playfair),_"Times_New_Roman",_serif] text-3xl'>
              No designs match
            </h2>
            <p className="mt-2 text-sm text-[#756a61]">Try a different style, color, or season.</p>
            <button
              type="button"
              onClick={() => {
                setStyle("All styles");
                setColor("All colors");
                setSeason("All seasons");
                setCollection("All designs");
              }}
              className="mt-6 rounded-full bg-[#332c27] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white"
            >
              Clear filters
            </button>
          </div>
        )}
        <TemplateAutoLoader visibleCount={visibleCount} totalCount={visibleDesigns.length} setVisibleCount={setVisibleCount} />
      </section>
    </main>
  );
}
