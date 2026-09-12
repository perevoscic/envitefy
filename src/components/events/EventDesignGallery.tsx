"use client";

import { Search } from "lucide-react";
import { type MouseEvent, type ReactNode, useState } from "react";
import TemplateAutoLoader from "./TemplateAutoLoader";
import { categoryGalleryPageClassName } from "./category-gallery-page";
import { TemplateMasonryCard, TemplateMasonryGrid } from "./TemplateMasonryGallery";

export type EventGalleryDesign = {
  id: string;
  name: string;
  description: string;
  style: string;
};

export default function EventDesignGallery<Design extends EventGalleryDesign>({
  title,
  category,
  header,
  designs,
  getHref,
  renderPreview,
  onSelect,
}: {
  title: string;
  category: string;
  header: ReactNode;
  designs: Design[];
  getHref: (design: Design) => string;
  renderPreview: (design: Design) => ReactNode;
  onSelect?: (event: MouseEvent<HTMLAnchorElement>, design: Design) => void;
}) {
  const [query, setQuery] = useState("");
  const [style, setStyle] = useState("All styles");
  const [visibleCount, setVisibleCount] = useState(12);
  const styles = ["All styles", ...Array.from(new Set(designs.map((design) => design.style))).sort()];
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = designs.filter((design) =>
    (style === "All styles" || design.style === style) &&
    `${design.name} ${design.description} ${design.style}`.toLowerCase().includes(normalizedQuery),
  );

  return (
    <main className={`${categoryGalleryPageClassName(category)} min-h-screen text-[#342d38]`}>
      {header}
      <section aria-label="Filter designs" className="border-b border-[#e8dfe5] px-5 py-5 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p aria-live="polite" className="text-sm font-semibold">{filtered.length} {filtered.length === 1 ? "design" : "designs"}</p>
            <p className="mt-1 text-xs text-[#746775]">Choose a template, add your details, and make it yours.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative block">
              <span className="sr-only">Search designs</span>
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-[#8b748b]" aria-hidden="true" />
              <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(12); }} placeholder="Search designs" className="h-11 w-full rounded-full border border-[#dcd0dc] bg-white pl-10 pr-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#926e93] sm:w-64" />
            </label>
            <label>
              <span className="sr-only">Style</span>
              <select value={style} onChange={(event) => { setStyle(event.target.value); setVisibleCount(12); }} className="h-11 w-full rounded-full border border-[#dcd0dc] bg-white px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#926e93] sm:max-w-72">
                {styles.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
          </div>
        </div>
      </section>
      <section aria-label={`${title} templates`} className="mx-auto max-w-[1500px] px-5 py-9 sm:px-8 lg:px-12">
        {filtered.length ? (
          <TemplateMasonryGrid>
            {filtered.slice(0, visibleCount).map((design) => (
              <TemplateMasonryCard key={design.id} designId={design.id} name={design.name} href={getHref(design)} onClick={onSelect ? (event) => onSelect(event, design) : undefined}>
                {renderPreview(design)}
              </TemplateMasonryCard>
            ))}
          </TemplateMasonryGrid>
        ) : (
          <div className="rounded-3xl border border-dashed border-[#dcd0dc] bg-white p-12 text-center">
            <h2 className="text-xl font-semibold">No designs match</h2>
            <p className="mt-2 text-sm text-[#746775]">Try another style or search.</p>
            <button type="button" onClick={() => { setQuery(""); setStyle("All styles"); setVisibleCount(12); }} className="mt-5 rounded-full bg-[#59405c] px-5 py-3 text-sm font-semibold text-white">Clear filters</button>
          </div>
        )}
        <TemplateAutoLoader visibleCount={visibleCount} totalCount={filtered.length} setVisibleCount={setVisibleCount} />
      </section>
    </main>
  );
}
