"use client";

import { Heart, Search, Sparkles, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import BirthdayGalleryHero from "@/components/birthdays/BirthdayGalleryHero";
import BirthdayDesignPreview from "@/components/birthdays/BirthdayDesignPreview";
import TemplateAutoLoader from "@/components/events/TemplateAutoLoader";
import { categoryGalleryPageClassName } from "@/components/events/category-gallery-page";
import { TemplateMasonryCard, TemplateMasonryGrid } from "@/components/events/TemplateMasonryGallery";
import { BIRTHDAY_DESIGN_CATALOG } from "@/data/birthday-design-catalog";
import { BIRTHDAY_GALLERY_BATCH_SIZE, BIRTHDAY_FAVORITES_KEY, parseBirthdayFavorites, toggleBirthdayFavorite } from "@/lib/birthday-gallery-preferences";

type CollectionFilter =
  | "All collections"
  | "Original 24"
  | "New kids"
  | "Adult birthdays";

const validDesignIds = new Set(BIRTHDAY_DESIGN_CATALOG.map((design) => design.id));

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
    <label className="flex min-w-0 flex-col gap-2">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#86674f]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-[#e4cdb6] bg-white px-3 text-sm font-semibold text-[#3e2b20] outline-none transition focus:border-[#d87338] focus:ring-2 focus:ring-[#d87338]/20"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

export default function BirthdayDesignGallery() {
  const searchParams = useSearchParams();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favoritesReady, setFavoritesReady] = useState(false);
  const [favoriteMessage, setFavoriteMessage] = useState("");
  const [visibleCount, setVisibleCount] = useState(BIRTHDAY_GALLERY_BATCH_SIZE);
  const storageAvailable = useRef(true);
  const [collection, setCollection] = useState<CollectionFilter>("All collections");
  const [recipient, setRecipient] = useState("Everyone");
  const [milestone, setMilestone] = useState("Any milestone");
  const [style, setStyle] = useState("All styles");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const readSaved = () => {
      try { setFavorites(parseBirthdayFavorites(window.localStorage.getItem(BIRTHDAY_FAVORITES_KEY), validDesignIds)); } catch { /* Hearts still work for this visit. */ }
    };
    readSaved();
    setFavoritesReady(true);
    const sync = (event: StorageEvent) => { if (event.key === BIRTHDAY_FAVORITES_KEY || event.key === null) readSaved(); };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const saveFavorite = (id: string, name: string) => {
    let current = favorites;
    let canPersist = storageAvailable.current;
    try { if (canPersist) current = parseBirthdayFavorites(window.localStorage.getItem(BIRTHDAY_FAVORITES_KEY), validDesignIds); } catch { canPersist = false; }
    const next = toggleBirthdayFavorite(current, id);
    setFavorites(next);
    try { if (canPersist) window.localStorage.setItem(BIRTHDAY_FAVORITES_KEY, JSON.stringify(next)); } catch { canPersist = false; }
    storageAvailable.current = canPersist;
    setFavoriteMessage(`${name} ${next.includes(id) ? "saved to" : "removed from"} favorites.${canPersist ? "" : " Changes are available for this visit only."}`);
  };

  const styleOptions = useMemo(
    () => [
      "All styles",
      ...Array.from(new Set(BIRTHDAY_DESIGN_CATALOG.map((design) => design.style))).sort(),
    ],
    [],
  );
  const milestoneOptions = useMemo(
    () => [
      "Any milestone",
      ...Array.from(
        new Set(
          BIRTHDAY_DESIGN_CATALOG.map((design) => design.milestone).filter(
            (value): value is number => value !== null,
          ),
        ),
      )
        .sort((first, second) => first - second)
        .map((value) => String(value)),
    ],
    [],
  );
  const favoriteIds = useMemo(() => new Set(favorites), [favorites]);

  const visibleDesigns = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return BIRTHDAY_DESIGN_CATALOG.filter((design) => {
      if (favoritesOnly && !favoriteIds.has(design.id)) return false;
      if (collection === "Original 24" && design.source !== "Original") return false;
      if (collection === "New kids" && !(design.source === "New" && design.collection === "Kids")) {
        return false;
      }
      if (collection === "Adult birthdays" && design.collection !== "Adult birthdays") {
        return false;
      }
      if (recipient !== "Everyone" && design.recipient !== recipient) return false;
      if (milestone !== "Any milestone" && design.milestone !== Number(milestone)) return false;
      if (style !== "All styles" && design.style !== style) return false;
      if (
        normalizedQuery &&
        !`${design.name} ${design.description} ${design.style} ${design.category}`
          .toLowerCase()
          .includes(normalizedQuery)
      ) {
        return false;
      }
      return true;
    });
  }, [collection, favoriteIds, favoritesOnly, milestone, query, recipient, style]);

  const activeFilterCount = [
    collection !== "All collections",
    recipient !== "Everyone",
    milestone !== "Any milestone",
    style !== "All styles",
    Boolean(query.trim()),
    favoritesOnly,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setCollection("All collections");
    setRecipient("Everyone");
    setMilestone("Any milestone");
    setStyle("All styles");
    setQuery("");
    setFavoritesOnly(false);
  };

  useEffect(() => {
    setVisibleCount(BIRTHDAY_GALLERY_BATCH_SIZE);
  }, [collection, recipient, milestone, style, query, favoritesOnly]);

  const buildCustomizeHref = (templateId: string) => {
    const params = new URLSearchParams();
    params.set("templateId", templateId);
    const date = searchParams?.get("d");
    if (date) params.set("d", date);
    return `/event/birthdays/customize?${params.toString()}`;
  };

  return (
    <main className={`${categoryGalleryPageClassName("birthdays")} min-h-screen text-[#35251d]`}>
      <BirthdayGalleryHero />

      <section className="z-20 border-b border-[#efd8c2] bg-[var(--category-gallery-background)] px-5 py-5 backdrop-blur-xl sm:px-8 lg:px-12 xl:sticky xl:top-0">
        <div className="mx-auto max-w-[1500px] space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-[#482f23]">
                <Sparkles className="h-4 w-4 text-[#d87338]" aria-hidden="true" />
                Explore all {BIRTHDAY_DESIGN_CATALOG.length} birthday designs
              </p>
              <p className="mt-1 text-xs text-[#80695c]">Save your favorites with a heart. Saved on this browser.</p>
            </div>
            <button type="button" disabled={!favoritesReady} aria-pressed={favoritesOnly} onClick={() => setFavoritesOnly((value) => !value)} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 disabled:opacity-50 ${favoritesOnly ? "border-[#482f23] bg-[#482f23] text-white" : "border-[#e4cdb6] bg-white text-[#482f23] hover:border-[#d87338]"}`}>
              <Heart className="h-4 w-4" aria-hidden="true" fill={favoritesOnly ? "currentColor" : "none"} /> Favorites ({favorites.length})
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <label className="relative flex min-w-0 flex-col gap-2 lg:col-span-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#86674f]">
                Search
              </span>
              <Search
                className="absolute bottom-3 left-3 h-4 w-4 text-[#a2836d]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                }}
                placeholder="Try rooftop, soccer, 50th…"
                className="h-11 w-full rounded-xl border border-[#e4cdb6] bg-white pl-10 pr-3 text-sm font-semibold text-[#3e2b20] outline-none transition placeholder:font-normal placeholder:text-[#a58d7e] focus:border-[#d87338] focus:ring-2 focus:ring-[#d87338]/20"
              />
            </label>
            <FilterSelect
              label="Collection"
              value={collection}
              options={[
                "All collections",
                "Original 24",
                "New kids",
                "Adult birthdays",
              ]}
              onChange={(value) => {
                setCollection(value as CollectionFilter);
              }}
            />
            <FilterSelect
              label="For"
              value={recipient}
              options={["Everyone", "Kids", "Women", "Men", "Anyone"]}
              onChange={(value) => {
                setRecipient(value);
              }}
            />
            <FilterSelect
              label="Milestone"
              value={milestone}
              options={milestoneOptions}
              onChange={(value) => {
                setMilestone(value);
              }}
            />
            <FilterSelect
              label="Style"
              value={style}
              options={styleOptions}
              onChange={(value) => {
                setStyle(value);
              }}
            />
          </div>

          {activeFilterCount > 0 ? (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-2 text-xs font-bold text-[#9B4F2B] transition hover:text-[#6F351D]"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Clear {activeFilterCount} {activeFilterCount === 1 ? "filter" : "filters"}
            </button>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
        {visibleDesigns.length > 0 ? (
          <TemplateMasonryGrid>
            {visibleDesigns.slice(0, visibleCount).map((design) => (
              <TemplateMasonryCard
                key={design.id}
                designId={design.id}
                name={design.name}
                href={buildCustomizeHref(design.id)}
                controls={
                  <button type="button" disabled={!favoritesReady} aria-pressed={favoriteIds.has(design.id)} aria-label={`${favoriteIds.has(design.id) ? "Remove" : "Save"} ${design.name} ${favoriteIds.has(design.id) ? "from" : "to"} favorites`} onClick={() => saveFavorite(design.id, design.name)} className={`flex h-11 w-11 items-center justify-center rounded-full border bg-white/95 shadow-sm transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 ${favoriteIds.has(design.id) ? "border-rose-300 text-rose-600" : "border-[#e4cdb6] text-[#725b4e] hover:text-rose-600"}`}>
                    <Heart className="h-5 w-5" fill={favoriteIds.has(design.id) ? "currentColor" : "none"} aria-hidden="true" />
                  </button>
                }
              >
                <BirthdayDesignPreview design={design} />
              </TemplateMasonryCard>
            ))}
          </TemplateMasonryGrid>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-[#dfc3aa] bg-white/60 px-6 py-16 text-center">
            <h2 className='[font-family:var(--font-playfair),_"Times_New_Roman",_serif] text-3xl'>
              {favoritesOnly && favorites.length === 0 ? "Save a few favorites" : "No designs match"}
            </h2>
            <p className="mt-2 text-sm text-[#80695c]">
              {favoritesOnly && favorites.length === 0 ? "Tap the heart on any birthday design to keep it here." : "Try another milestone or clear the filters."}
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-6 rounded-full bg-[#482f23] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white"
            >
              {favoritesOnly && favorites.length === 0 ? "Browse all designs" : "Clear filters"}
            </button>
          </div>
        )}
        <TemplateAutoLoader visibleCount={visibleCount} totalCount={visibleDesigns.length} setVisibleCount={setVisibleCount} batchSize={BIRTHDAY_GALLERY_BATCH_SIZE} />
        <p role="status" className="sr-only">{favoriteMessage}</p>
      </section>
    </main>
  );
}
