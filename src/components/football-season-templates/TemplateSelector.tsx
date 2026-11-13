"use client";

import { Check, Search } from "lucide-react";
import { useRef, useState } from "react";
import TemplateAutoLoader from "@/components/events/TemplateAutoLoader";
import {
  TemplateMasonryCard,
  TemplateMasonryGrid,
} from "@/components/events/TemplateMasonryGallery";
import TemplateScrollToTop from "@/components/events/TemplateScrollToTop";
import FootballThumbnail from "./FootballThumbnail";
import TemplateArtworkThumbnail from "@/components/events/TemplateArtworkThumbnail";
import { IMPORTED_THEME_FONTS, importedArtworkDisplayUrl, readImportedEventTheme } from "@/lib/imported-event-theme";
import { FOOTBALL_GALLERY_DESIGNS } from "./footballGallery";
import { getGymMeetTemplateMeta } from "./registry";
import type { GymMeetTemplateId } from "./types";

export default function TemplateSelector({
  value,
  onChange,
  importedTheme,
  onSelectCustom,
}: {
  value: GymMeetTemplateId;
  onChange: (value: GymMeetTemplateId) => void;
  importedTheme?: unknown;
  onSelectCustom?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(12);
  const scrollRoot = useRef<HTMLDivElement>(null);
  const active = getGymMeetTemplateMeta(value);
  const custom = onSelectCustom ? readImportedEventTheme(importedTheme) : null;
  const customSelected = Boolean(custom?.enabled && !custom.preserveTemplateStyle);
  const showCustom = custom && `Custom generated ${custom.name}`.toLowerCase().includes(query.trim().toLowerCase());
  const customArtwork = importedArtworkDisplayUrl(custom?.artworkUrl);
  const matches = FOOTBALL_GALLERY_DESIGNS.filter((design) =>
    `${design.name} ${design.style} ${design.description}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  return (
    <div className="relative space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
          {FOOTBALL_GALLERY_DESIGNS.length} football designs
        </p>
        <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Check size={14} /> Selected: {customSelected ? "Custom" : active.name}
        </p>
      </div>
      <label className="relative block">
        <span className="sr-only">Search football designs</span>
        <Search size={16} className="absolute left-3 top-3.5 text-slate-500" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setVisibleCount(12);
          }}
          placeholder="Search football designs"
          className="h-11 w-full rounded-full border border-slate-300 pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-700"
        />
      </label>
      <p className="text-xs text-slate-500" aria-live="polite">
        {matches.length} designs{showCustom ? " + Custom" : ""}
      </p>
      <div
        ref={scrollRoot}
        className="max-h-[calc(100dvh-20rem)] overflow-y-auto px-1 pt-1 touch-pan-y"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <TemplateMasonryGrid compact>
          {showCustom && <TemplateMasonryCard designId="custom" name="Custom" selected={customSelected} onSelect={onSelectCustom!}>
            {customArtwork ? <TemplateArtworkThumbnail design={{
              id: "custom", name: "Custom", artwork: customArtwork, label: "Generated design",
              background: custom.colors.page, ink: custom.colors.ink, accent: custom.colors.accent,
              font: IMPORTED_THEME_FONTS[custom.font], composition: "editorial",
            }} /> : <div className="flex h-full flex-col justify-end gap-2 p-5" style={{ background: custom.colors.page, color: custom.colors.ink }}>
              <span className="text-xs uppercase tracking-widest">Generated design</span><span className="text-2xl">Custom</span>
            </div>}
          </TemplateMasonryCard>}
          {matches.slice(0, visibleCount).map((design) => (
            <TemplateMasonryCard
              key={design.id}
              designId={design.id}
              name={design.name}
              selected={!customSelected && design.id === value}
              onSelect={() => onChange(design.id)}
            >
              <FootballThumbnail design={design} compact />
            </TemplateMasonryCard>
          ))}
        </TemplateMasonryGrid>
        {!matches.length && !showCustom ? (
          <p className="p-5 text-center text-sm text-slate-500">No designs match your search.</p>
        ) : null}
        <TemplateAutoLoader
          visibleCount={visibleCount}
          totalCount={matches.length}
          setVisibleCount={setVisibleCount}
          scrollRoot={scrollRoot}
        />
      </div>
      <TemplateScrollToTop scrollRoot={scrollRoot} className="absolute bottom-3 right-3" />
    </div>
  );
}
