"use client";

import { templateAccentColorCombinations, type TemplateAccentPalette } from "@/lib/imported-event-theme";

/** Accent recipes leave the authored palette, artwork and typography untouched. */
export default function EventAccentColorPicker({ palette, value = 0, onChange }: {
  palette: TemplateAccentPalette;
  value?: number;
  onChange: (index: number) => void;
}) {
  return <div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label="Theme color combinations">
    {templateAccentColorCombinations(palette).map(({ name, index, button, heading, link }) => (
      <button key={index} type="button" aria-label={name} aria-pressed={value === index}
        onClick={() => onChange(index)}
        className={`flex min-h-16 min-w-0 flex-col items-start gap-2 rounded-xl border p-3 text-left text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 ${value === index ? "border-violet-500 bg-violet-50 ring-1 ring-violet-500" : "border-slate-300 hover:bg-slate-50"}`}>
        <span className="flex gap-1.5" aria-hidden="true">
          {(index === 0 ? [palette.accent, palette.foreground, link] : [button, heading, link]).map((color, swatch) => (
            <span key={swatch} className="h-5 w-5 rounded-full border border-black/15" style={{ backgroundColor: color }} />
          ))}
        </span>
        <span>{name}</span>
      </button>
    ))}
  </div>;
}
