"use client";

import { ArrowRight, Check, Search, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import BirthdayGalleryHero from "@/components/birthdays/BirthdayGalleryHero";
import BirthdayDesignPreview from "@/components/birthdays/BirthdayDesignPreview";
import { BIRTHDAY_DESIGN_CATALOG, ORIGINAL_BIRTHDAY_DESIGNS } from "@/data/birthday-design-catalog";
import type { BirthdayDesignTemplate } from "@/data/birthday-template-data";

type GalleryView = "Featured" | "All designs";
type CollectionFilter =
  | "All collections"
  | "Original 24"
  | "New kids"
  | "Adult birthdays"
  | "Anniversaries";

const FEATURED_COUNT = 15;
const FEATURED_ORIGINAL_KIDS_COUNT = 3;
const FEATURED_NEW_KIDS_COUNT = 3;
const originalDesignIds = new Set(ORIGINAL_BIRTHDAY_DESIGNS.map((design) => design.id));

const createSeededRandom = (seed: number) => {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
};

const pickFromPool = (
  pool: BirthdayDesignTemplate[],
  count: number,
  random: () => number,
  selectedIds: Set<string>,
) => {
  const available = pool.filter((design) => !selectedIds.has(design.id));
  for (let index = available.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [available[index], available[swapIndex]] = [available[swapIndex], available[index]];
  }
  return available.slice(0, count);
};

const selectFeaturedIds = (seed: number) => {
  const random = createSeededRandom(seed);
  const selectedIds = new Set<string>();
  const selected: BirthdayDesignTemplate[] = [];
  const add = (pool: BirthdayDesignTemplate[], count: number) => {
    for (const design of pickFromPool(pool, count, random, selectedIds)) {
      selectedIds.add(design.id);
      selected.push(design);
    }
  };

  add(
    BIRTHDAY_DESIGN_CATALOG.filter(
      (design) => originalDesignIds.has(design.id) && design.audience === "Kids",
    ),
    FEATURED_ORIGINAL_KIDS_COUNT,
  );
  add(
    BIRTHDAY_DESIGN_CATALOG.filter(
      (design) => design.source === "New" && design.audience === "Kids",
    ),
    FEATURED_NEW_KIDS_COUNT,
  );
  add(
    BIRTHDAY_DESIGN_CATALOG.filter((design) => design.recipient === "Women"),
    3,
  );
  add(
    BIRTHDAY_DESIGN_CATALOG.filter((design) => design.recipient === "Men"),
    2,
  );
  add(
    BIRTHDAY_DESIGN_CATALOG.filter((design) => design.recipient === "Anyone"),
    2,
  );
  add(
    BIRTHDAY_DESIGN_CATALOG.filter((design) => design.occasion === "Anniversary"),
    2,
  );
  add(BIRTHDAY_DESIGN_CATALOG, FEATURED_COUNT - selected.length);

  return selected.map((design) => design.id);
};

const defaultFeaturedIds = selectFeaturedIds(20260831);

const formatMilestone = (design: BirthdayDesignTemplate) => {
  if (!design.milestone) return null;
  const value = design.milestone;
  const suffix =
    value % 10 === 1 && value % 100 !== 11
      ? "st"
      : value % 10 === 2 && value % 100 !== 12
        ? "nd"
        : value % 10 === 3 && value % 100 !== 13
          ? "rd"
          : "th";
  return `${value}${suffix}`;
};

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
  const [view, setView] = useState<GalleryView>("Featured");
  const [featuredIds, setFeaturedIds] = useState(defaultFeaturedIds);
  const [collection, setCollection] = useState<CollectionFilter>("All collections");
  const [recipient, setRecipient] = useState("Everyone");
  const [milestone, setMilestone] = useState("Any milestone");
  const [style, setStyle] = useState("All styles");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const storageKey = "envitefy:birthday-featured-seed";
    let seed = Date.now();
    try {
      const storedSeed = window.sessionStorage.getItem(storageKey);
      if (storedSeed) {
        seed = Number.parseInt(storedSeed, 10) || seed;
      } else {
        window.sessionStorage.setItem(storageKey, String(seed));
      }
    } catch {}
    setFeaturedIds(selectFeaturedIds(seed));
  }, []);

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
  const featuredIdSet = useMemo(() => new Set(featuredIds), [featuredIds]);

  const visibleDesigns = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return BIRTHDAY_DESIGN_CATALOG.filter((design) => {
      if (view === "Featured" && !featuredIdSet.has(design.id)) return false;
      if (collection === "Original 24" && design.source !== "Original") return false;
      if (collection === "New kids" && !(design.source === "New" && design.collection === "Kids")) {
        return false;
      }
      if (collection === "Adult birthdays" && design.collection !== "Adult birthdays") {
        return false;
      }
      if (collection === "Anniversaries" && design.collection !== "Anniversaries") return false;
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
  }, [collection, featuredIdSet, milestone, query, recipient, style, view]);

  const activeFilterCount = [
    collection !== "All collections",
    recipient !== "Everyone",
    milestone !== "Any milestone",
    style !== "All styles",
    Boolean(query.trim()),
  ].filter(Boolean).length;

  const showAllForFilter = () => setView("All designs");
  const resetFilters = () => {
    setCollection("All collections");
    setRecipient("Everyone");
    setMilestone("Any milestone");
    setStyle("All styles");
    setQuery("");
  };

  const buildCustomizeHref = (templateId: string) => {
    const params = new URLSearchParams();
    params.set("templateId", templateId);
    const date = searchParams?.get("d");
    if (date) params.set("d", date);
    return `/event/birthdays/customize?${params.toString()}`;
  };

  return (
    <main className="min-h-screen bg-[#fff9f1] text-[#35251d]">
      <BirthdayGalleryHero buildCustomizeHref={buildCustomizeHref} />

      <section className="z-20 border-b border-[#efd8c2] bg-[#fff9f1]/95 px-5 py-5 backdrop-blur-xl sm:px-8 lg:px-12 xl:sticky xl:top-0">
        <div className="mx-auto max-w-[1500px] space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="inline-flex w-fit rounded-full border border-[#e4cdb6] bg-white p-1 shadow-sm">
              {(["Featured", "All designs"] as GalleryView[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setView(option)}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                    view === option
                      ? "bg-[#482f23] text-white shadow-sm"
                      : "text-[#725b4e] hover:text-[#482f23]"
                  }`}
                >
                  {option === "Featured" ? "Featured mix" : "All 104 designs"}
                </button>
              ))}
            </div>
            <div
              className="flex items-center gap-2 text-sm font-semibold text-[#482f23]"
              aria-live="polite"
            >
              <Sparkles className="h-4 w-4 text-[#d87338]" aria-hidden="true" />
              {visibleDesigns.length} {visibleDesigns.length === 1 ? "design" : "designs"}
            </div>
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
                  showAllForFilter();
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
                "Anniversaries",
              ]}
              onChange={(value) => {
                setCollection(value as CollectionFilter);
                showAllForFilter();
              }}
            />
            <FilterSelect
              label="For"
              value={recipient}
              options={["Everyone", "Kids", "Women", "Men", "Anyone", "Couples"]}
              onChange={(value) => {
                setRecipient(value);
                showAllForFilter();
              }}
            />
            <FilterSelect
              label="Milestone"
              value={milestone}
              options={milestoneOptions}
              onChange={(value) => {
                setMilestone(value);
                showAllForFilter();
              }}
            />
            <FilterSelect
              label="Style"
              value={style}
              options={styleOptions}
              onChange={(value) => {
                setStyle(value);
                showAllForFilter();
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
          <div className="grid grid-cols-1 gap-x-7 gap-y-11 md:grid-cols-2 xl:grid-cols-3">
            {visibleDesigns.map((design) => {
              const milestoneLabel = formatMilestone(design);
              return (
                <article key={design.id} className="group relative rounded-[1.4rem]">
                  <Link
                    href={buildCustomizeHref(design.id)}
                    className="absolute inset-0 z-20 rounded-[1.4rem] outline-none focus-visible:ring-2 focus-visible:ring-[#d87338] focus-visible:ring-offset-4 focus-visible:ring-offset-[#fff9f1]"
                    aria-label={`Customize ${design.name}`}
                  >
                    <span className="sr-only">Customize {design.name}</span>
                  </Link>
                  <div className="relative overflow-hidden rounded-[1.35rem] border border-[#ead5c2] bg-white p-2 shadow-[0_18px_50px_rgba(87,48,29,0.08)] transition duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_28px_70px_rgba(87,48,29,0.16)]">
                    <div className="overflow-hidden rounded-[1rem]">
                      <BirthdayDesignPreview design={design} />
                    </div>
                  </div>
                  <div className="px-2 pt-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className='[font-family:var(--font-playfair),_"Times_New_Roman",_serif] text-2xl font-normal tracking-[-0.025em] text-[#3b281f]'>
                          {design.name}
                        </h2>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-[#725b4e]">
                          {design.description}
                        </p>
                      </div>
                      <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e5cdb8] bg-white text-[#4a3023] transition group-hover:border-[#4a3023] group-hover:bg-[#4a3023] group-hover:text-white">
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {[
                        design.recipient,
                        milestoneLabel,
                        design.style,
                        design.experience.compositionLabel,
                      ]
                        .filter((label): label is string => Boolean(label))
                        .map((label) => (
                          <span
                            key={label}
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#ead7c6] bg-white/70 px-3 py-1.5 text-[10px] font-semibold text-[#725b4e]"
                          >
                            <Check className="h-3 w-3 text-[#d87338]" aria-hidden="true" />
                            {label}
                          </span>
                        ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-[#dfc3aa] bg-white/60 px-6 py-16 text-center">
            <h2 className='[font-family:var(--font-playfair),_"Times_New_Roman",_serif] text-3xl'>
              No designs match
            </h2>
            <p className="mt-2 text-sm text-[#80695c]">
              Try another milestone or clear the filters.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-6 rounded-full bg-[#482f23] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
