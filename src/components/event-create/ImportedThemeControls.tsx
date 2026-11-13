"use client";
import { useState } from "react";
import {
  createImportedEventTheme,
  readImportedEventTheme,
  importedEventThemeColorCombinations,
  templateAccentColorCombinations,
  importedEventAccentPalette,
  type TemplateAccentPalette,
  type ImportedEventTheme,
} from "@/lib/imported-event-theme";
import "./imported-event-theme.css";
import ImportedThemeArtwork from "./ImportedThemeArtwork";

export default function ImportedThemeControls({
  value,
  onChange,
  context,
  eventId,
  templatePalette,
}: {
  value: unknown;
  onChange: (theme: ImportedEventTheme) => void;
  context?: { title: string; sport: string; city?: string; seed: string };
  eventId?: string | null;
  templatePalette?: TemplateAccentPalette;
}) {
  const theme = readImportedEventTheme(value) || (context ? {
    ...createImportedEventTheme(context),
    ...(templatePalette ? { preserveTemplateStyle: true as const } : {}),
  } : null);
  if (!theme) return null;
  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm"
      aria-label="Event theme"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Your event theme</h3>
          <p className="mt-1 text-sm text-slate-600">{theme.name}</p>
        </div>
      </div>
      {templatePalette ? (
        <TemplateColorCombinations theme={theme} palette={importedEventAccentPalette(templatePalette, theme)} onChange={onChange} />
      ) : <ThemeColorCombinations key={theme.id} theme={theme} onChange={onChange} />}
      <ImportedThemeArtwork syncOnly eventId={eventId} value={theme} onChange={onChange} />
    </section>
  );
}

function ThemeColorCombinations({ theme, onChange }: {
  theme: ImportedEventTheme;
  onChange: (theme: ImportedEventTheme) => void;
}) {
  // Keep the opening palette available while trying the five alternatives.
  const [combinations] = useState(() => importedEventThemeColorCombinations(theme));
  return (
    <div className="mt-4 grid grid-cols-2 gap-2" role="group" aria-label="Theme color combinations">
      {combinations.map(({ name, colors }) => {
        const selected = theme.enabled && !theme.preserveTemplateStyle &&
          Object.entries(colors).every(([key, color]) => theme.colors[key as keyof typeof colors] === color);
        return (
          <button
            key={name}
            type="button"
            aria-label={name}
            aria-pressed={selected}
            onClick={() => onChange({ ...theme, enabled: true, preserveTemplateStyle: undefined, colors })}
            className={`flex min-h-16 min-w-0 flex-col items-start gap-2 rounded-xl border p-3 text-left text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 ${selected ? "border-violet-500 bg-violet-50 ring-1 ring-violet-500" : "border-slate-300 hover:bg-slate-50"}`}
          >
            <span className="flex gap-1.5" aria-hidden="true">
              {[colors.accent, colors.secondary, colors.page].map((color, index) => (
                <span key={index} className="h-5 w-5 rounded-full border border-black/15" style={{ backgroundColor: color }} />
              ))}
            </span>
            <span>{name}</span>
          </button>
        );
      })}
    </div>
  );
}

function TemplateColorCombinations({ theme, palette, onChange }: {
  theme: ImportedEventTheme;
  palette: TemplateAccentPalette;
  onChange: (theme: ImportedEventTheme) => void;
}) {
  const combinations = templateAccentColorCombinations(palette);
  const selected = theme.templateColorCombination?.templateId === palette.id ? theme.templateColorCombination.index : 0;
  return (
    <>
      <p className="mt-3 text-xs text-slate-600">{palette.name} · Title, buttons, links and section titles</p>
      <div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label="Theme color combinations">
        {combinations.map(({ name, index, button, heading, link }) => (
          <button
            key={index}
            type="button"
            aria-label={name}
            aria-pressed={selected === index}
            onClick={() => onChange({ ...theme, templateColorCombination: { templateId: palette.id, index } })}
            className={`flex min-h-16 min-w-0 flex-col items-start gap-2 rounded-xl border p-3 text-left text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 ${selected === index ? "border-violet-500 bg-violet-50 ring-1 ring-violet-500" : "border-slate-300 hover:bg-slate-50"}`}
          >
            <span className="flex gap-1.5" aria-hidden="true">
              {(index === 0 ? [palette.accent, palette.foreground, link] : [button, heading, link]).map((color, swatch) => (
                <span key={swatch} className="h-5 w-5 rounded-full border border-black/15" style={{ backgroundColor: color }} />
              ))}
            </span>
            <span>{name}</span>
          </button>
        ))}
      </div>
    </>
  );
}
