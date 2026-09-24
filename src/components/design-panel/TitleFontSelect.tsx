"use client";

import { useId, useState } from "react";
import type { TitleFontOption } from "./types";

type TitleFontSelectProps = {
  options: TitleFontOption[];
  value: string;
  onChange: (fontStack: string) => void;
};

export function TitleFontSelect({ options, value, onChange }: TitleFontSelectProps) {
  const searchId = useId();
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(18);
  const filtered = options.filter((option) =>
    `${option.label} ${option.category || ""}`.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const selectedOption =
    options.find((option) => option.stack === value) || null;

  return (
    <div className="space-y-2">
      <label htmlFor={searchId} className="block text-xs font-semibold text-slate-600">Search fonts or styles</label>
      <input
        id={searchId}
        type="search"
        value={search}
        onChange={(event) => { setSearch(event.target.value); setVisibleCount(18); }}
        placeholder="Try script, serif or a font name"
        className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-indigo-500"
      />
      {selectedOption ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Selected</p>
          <p className="truncate text-base text-slate-900" style={{ fontFamily: selectedOption.stack }}>
            {selectedOption.label}
          </p>
        </div>
      ) : null}

      <div
        role="group"
        aria-label="Title font options"
        className="grid max-h-60 grid-cols-2 gap-2 overflow-auto pr-1"
      >
        {filtered.slice(0, visibleCount).map((option) => {
          const active = option.stack === value;
          return (
            <button
              type="button"
              key={option.id}
              aria-pressed={active}
              onClick={() => onChange(option.stack)}
              className={`min-h-11 w-full rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-indigo-500 ${
                active
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{option.category || "Preview"}</p>
              <p className="break-words text-lg leading-relaxed text-slate-900" style={{ fontFamily: option.stack }}>
                {option.label}
              </p>
            </button>
          );
        })}
      </div>
      {filtered.length > visibleCount && (
        <button type="button" className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm text-slate-700 focus-visible:outline-2 focus-visible:outline-indigo-500" onClick={() => setVisibleCount((count) => count + 18)}>
          Show more fonts ({visibleCount} of {filtered.length})
        </button>
      )}
      {!filtered.length && <p role="status" className="text-sm text-slate-600">No matching fonts.</p>}
    </div>
  );
}
