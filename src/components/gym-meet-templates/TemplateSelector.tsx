"use client";

import { Check, Search } from "lucide-react";
import { useRef, useState } from "react";
import TemplateAutoLoader from "@/components/events/TemplateAutoLoader";
import TemplateScrollToTop from "@/components/events/TemplateScrollToTop";
import { TemplateThumbnailFrame } from "@/components/events/TemplateThumbnail";
import GymnasticsThumbnail from "./GymnasticsThumbnail";
import { GYM_MEET_TEMPLATE_LIBRARY, getGymMeetTemplateMeta } from "./registry";
import type { GymMeetTemplateId } from "./types";

export default function TemplateSelector({ value, onChange }: {
  value: GymMeetTemplateId;
  onChange: (value: GymMeetTemplateId) => void;
}) {
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(12);
  const scrollRoot = useRef<HTMLDivElement>(null);
  const active = getGymMeetTemplateMeta(value);
  const matches = GYM_MEET_TEMPLATE_LIBRARY.filter((design) =>
    `${design.name} ${design.style} ${design.description}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <div className="relative space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">60 meet page designs</p>
        <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-800"><Check size={14} /> Selected: {active.name}</p>
      </div>
      <label className="relative block">
        <span className="sr-only">Search meet designs</span>
        <Search size={16} className="absolute left-3 top-3.5 text-slate-500" aria-hidden="true" />
        <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(12); }} placeholder="Search 60 designs" className="h-11 w-full rounded-full border border-slate-300 pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-700" />
      </label>
      <p className="text-xs text-slate-500" aria-live="polite">{matches.length} designs</p>
      <div ref={scrollRoot} className="max-h-[calc(100dvh-20rem)] space-y-5 overflow-y-auto overscroll-contain pr-1 touch-pan-y" style={{ WebkitOverflowScrolling: "touch" }}>
        {matches.slice(0, visibleCount).map((design) => (
          <div key={design.id} className="group relative">
            <button type="button" aria-label={`Select ${design.name}`} aria-pressed={design.id === value} onClick={() => onChange(design.id)} className="absolute inset-0 z-20 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-slate-800 focus-visible:ring-offset-2"><span className="sr-only">Select {design.name}</span></button>
            <TemplateThumbnailFrame>
              {design.id === value ? <span className="absolute right-3 top-3 z-10 rounded-full bg-slate-900 p-2 text-white"><Check size={16} aria-hidden="true" /></span> : null}
              <GymnasticsThumbnail design={design} />
            </TemplateThumbnailFrame>
            <div className="px-2 pt-3"><p className="text-sm font-semibold text-slate-900">{design.name}</p><p className="mt-1 text-xs text-slate-500">{design.style}</p></div>
          </div>
        ))}
        {!matches.length ? <p className="p-5 text-center text-sm text-slate-500">No designs match your search.</p> : null}
        <TemplateAutoLoader visibleCount={visibleCount} totalCount={matches.length} setVisibleCount={setVisibleCount} scrollRoot={scrollRoot} />
      </div>
      <TemplateScrollToTop scrollRoot={scrollRoot} className="absolute bottom-3 right-3" />
    </div>
  );
}
