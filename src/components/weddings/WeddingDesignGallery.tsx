"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Gem, Sparkles } from "lucide-react";
import WeddingDesignPreview from "@/components/weddings/WeddingDesignPreview";
import {
  weddingDesignCatalog,
  weddingDesignColors,
  weddingDesignSeasons,
  weddingDesignStyles,
} from "@/lib/wedding-designs";

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
      <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#86796d]">{label}</span>
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

  const visibleDesigns = useMemo(
    () =>
      weddingDesignCatalog.filter(
        (design) =>
          (style === "All styles" || design.style === style) &&
          (color === "All colors" || design.color === color) &&
          (season === "All seasons" || design.season === season),
      ),
    [color, season, style],
  );

  const buildCustomizeHref = (templateId: string) => {
    const params = new URLSearchParams();
    params.set("templateId", templateId);
    const date = searchParams?.get("d");
    if (date) params.set("d", date);
    return `/event/weddings/customize?${params.toString()}`;
  };

  return (
    <main className="min-h-screen bg-[#f7f4ef] text-[#2d2723]">
      <section className="relative overflow-hidden border-b border-[#ded5ca] bg-[#1f1b18] px-5 py-14 text-white sm:px-8 lg:px-12 lg:py-20">
        <div className="absolute -right-24 -top-40 h-[430px] w-[430px] rounded-full border border-[#d3b47b]/25" />
        <div className="absolute -right-5 -top-16 h-[290px] w-[290px] rounded-full border border-[#d3b47b]/15" />
        <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-[#d3b47b]/60 to-transparent" />
        <div className="relative mx-auto max-w-[1500px]">
          <Link
            href="/weddings"
            className="mb-10 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/60 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Wedding inspiration
          </Link>
          <div className="max-w-4xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d3b47b]/35 bg-[#d3b47b]/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.28em] text-[#ead3a7]">
              <Gem className="h-3.5 w-3.5" />
              Envitefy wedding atelier
            </div>
            <h1
              className='max-w-3xl [font-family:var(--font-playfair),_"Times_New_Roman",_serif] text-5xl font-normal leading-[0.95] tracking-[-0.045em] sm:text-6xl lg:text-7xl'
              style={{ color: "#fff" }}
            >
              Find your wedding design
            </h1>
            <p className="mt-6 max-w-2xl text-base font-light leading-relaxed text-white/67 sm:text-lg">
              Choose a complete visual world—not just a color palette. Every design has its own
              layout, typography, image treatment, section rhythm, and finishing details.
            </p>
          </div>
        </div>
      </section>

      <section className="z-20 border-b border-[#ded5ca] bg-[#f7f4ef]/94 px-5 py-5 backdrop-blur-xl sm:px-8 lg:px-12 xl:sticky xl:top-0">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#332c27]">
              <Sparkles className="h-4 w-4 text-[#9d7d54]" />
              {visibleDesigns.length} curated designs
            </div>
            <p className="mt-1 text-xs text-[#7a6f66]">Select a design to open it in the wedding studio.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <FilterSelect label="Style" value={style} options={weddingDesignStyles} onChange={setStyle} />
            <FilterSelect label="Color" value={color} options={weddingDesignColors} onChange={setColor} />
            <FilterSelect label="Season" value={season} options={weddingDesignSeasons} onChange={setSeason} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
        {visibleDesigns.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-7 gap-y-11 md:grid-cols-2 xl:grid-cols-3">
            {visibleDesigns.map((design, index) => (
              <article key={design.id} className="group relative rounded-[1.4rem]">
                <Link
                  href={buildCustomizeHref(design.id)}
                  className="absolute inset-0 z-20 rounded-[1.4rem] outline-none focus-visible:ring-2 focus-visible:ring-[#9d7d54] focus-visible:ring-offset-4 focus-visible:ring-offset-[#f7f4ef]"
                  aria-label={`Customize ${design.name}`}
                >
                  <span className="sr-only">Customize {design.name}</span>
                </Link>
                  <div className="relative overflow-hidden rounded-[1.35rem] border border-[#ddd4ca] bg-white p-2 shadow-[0_18px_50px_rgba(59,45,33,0.08)] transition duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_28px_70px_rgba(59,45,33,0.16)]">
                    <WeddingDesignPreview
                      design={design}
                      className="overflow-hidden rounded-[1rem]"
                    />
                    <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-[#3c332d] shadow-sm backdrop-blur">
                      <span className="text-[#a58456]">{String(index + 1).padStart(2, "0")}</span>
                      {design.style}
                    </div>
                  </div>
                  <div className="px-2 pt-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className='[font-family:var(--font-playfair),_"Times_New_Roman",_serif] text-2xl font-normal tracking-[-0.025em] text-[#2d2723]'>
                          {design.name}
                        </h2>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a07d51]">
                          {design.signature}
                        </p>
                      </div>
                      <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d8cec2] bg-white text-[#3c332d] transition group-hover:border-[#3c332d] group-hover:bg-[#3c332d] group-hover:text-white">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-[#756a61]">{design.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {[design.color, design.season].map((label) => (
                        <span
                          key={label}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#ded5ca] bg-white/65 px-3 py-1.5 text-[10px] font-semibold text-[#665c54]"
                        >
                          <Check className="h-3 w-3 text-[#9d7d54]" />
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-[#cfc3b6] bg-white/55 px-6 py-16 text-center">
            <h2 className='[font-family:var(--font-playfair),_"Times_New_Roman",_serif] text-3xl'>No designs match</h2>
            <p className="mt-2 text-sm text-[#756a61]">Try a different style, color, or season.</p>
            <button
              type="button"
              onClick={() => {
                setStyle("All styles");
                setColor("All colors");
                setSeason("All seasons");
              }}
              className="mt-6 rounded-full bg-[#332c27] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
