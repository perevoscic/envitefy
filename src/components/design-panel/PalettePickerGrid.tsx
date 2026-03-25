"use client";

import { PaletteDefinition } from "./types";

type PalettePickerGridProps = {
  palettes: PaletteDefinition[];
  selectedPaletteId: string;
  onSelect: (paletteId: string) => void;
};

export function PalettePickerGrid({
  palettes,
  selectedPaletteId,
  onSelect,
}: PalettePickerGridProps) {
  return (
    <div className="grid grid-cols-1 gap-2 max-h-64 overflow-auto pr-1">
      {palettes.map((palette) => {
        const active = palette.id === selectedPaletteId;
        return (
          <button
            type="button"
            key={palette.id}
            onClick={() => onSelect(palette.id)}
            className={`rounded-xl border p-2 text-left transition-colors ${
              active
                ? "border-indigo-500 bg-indigo-50"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">{palette.name}</span>
              {palette.recommended ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                  Recommended
                </span>
              ) : null}
            </div>
            <div className="mt-2 flex h-7 overflow-hidden rounded-md border border-slate-200">
              <span className="flex-1" style={{ background: palette.background }} />
              <span className="flex-1" style={{ background: palette.primary }} />
              <span className="flex-1" style={{ background: palette.accent }} />
              <span className="flex-1" style={{ background: palette.button || palette.primary }} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
