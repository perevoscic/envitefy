"use client";
import {
  createImportedEventTheme,
  readImportedEventTheme,
  redesignImportedEventTheme,
  type ImportedEventTheme,
} from "@/lib/imported-event-theme";
import "./imported-event-theme.css";
import ImportedThemeArtwork from "./ImportedThemeArtwork";

export default function ImportedThemeControls({
  value,
  onChange,
  context,
  eventId,
}: {
  value: unknown;
  onChange: (theme: ImportedEventTheme) => void;
  context?: { title: string; sport: string; city?: string; seed: string };
  eventId?: string | null;
}) {
  const theme = readImportedEventTheme(value);
  if (!theme)
    return context ? (
      <section className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900">
        <h3 className="text-sm font-semibold">Your event theme</h3>
        <button
          type="button"
          className="mt-3 min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-semibold hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
          onClick={() => onChange(createImportedEventTheme(context))}
        >
          Create event theme
        </button>
      </section>
    ) : null;
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
        <div className="flex gap-1" role="img" aria-label="Theme colors">
          {[theme.colors.accent, theme.colors.secondary, theme.colors.page].map((color, index) => (
            <span
              key={index}
              title={color}
              className="h-6 w-6 rounded-full border border-black/15"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-semibold hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
          onClick={() => onChange(redesignImportedEventTheme(theme))}
        >
          Redesign
        </button>
        <button
          type="button"
          className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
          onClick={() => onChange({ ...theme, enabled: !theme.enabled })}
        >
          {theme.enabled ? "Use template style" : "Use event theme"}
        </button>
      </div>
      <ImportedThemeArtwork eventId={eventId} value={theme} onChange={onChange} />
    </section>
  );
}
