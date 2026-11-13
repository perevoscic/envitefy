"use client";
import {
  createImportedEventTheme,
  readImportedEventTheme,
  templateAccentColorCombinations,
  importedEventAccentPalette,
  type TemplateAccentPalette,
  type ImportedEventTheme,
} from "@/lib/imported-event-theme";
import "./imported-event-theme.css";
import ImportedThemeArtwork from "./ImportedThemeArtwork";
import EventAccentColorPicker from "@/components/events/EventAccentColorPicker";

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
  const savedTheme = readImportedEventTheme(value);
  // A generated fallback must not replace catalog surfaces when an accent is chosen.
  if (!templatePalette && (!savedTheme?.enabled || savedTheme.preserveTemplateStyle)) return null;
  const theme = savedTheme || (context ? {
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
      ) : <TemplateColorCombinations theme={theme} palette={{ id: theme.id, name: theme.name,
        background: theme.colors.page, foreground: theme.colors.ink, accent: theme.colors.accent }} onChange={onChange} />}
      <ImportedThemeArtwork syncOnly eventId={eventId} value={theme} onChange={onChange} />
    </section>
  );
}

function TemplateColorCombinations({ theme, palette, onChange }: {
  theme: ImportedEventTheme;
  palette: TemplateAccentPalette;
  onChange: (theme: ImportedEventTheme) => void;
}) {
  const selected = theme.templateColorCombination?.templateId === palette.id ? theme.templateColorCombination.index : 0;
  return <>
    <p className="mt-3 text-xs text-slate-600">{palette.name} · Title, buttons, links and section titles</p>
    <EventAccentColorPicker palette={palette} value={selected}
      onChange={(index) => onChange({ ...theme, templateColorCombination: { templateId: palette.id, index } })} />
  </>;
}
