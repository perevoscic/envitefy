"use client";

import TemplateArtworkThumbnail from "@/components/events/TemplateArtworkThumbnail";
import { config as sportsConfig } from "@/components/event-templates/SportEventsTemplate";
import { getThemedEventDesign } from "@/lib/event-page-themed-designs";
import { BRIDAL_PRESETS, type PublicTemplate } from "@/lib/public-template-shared";
import { getSportEventPreset, getSportStyleThemeIds } from "@/lib/sport-event-presets";
import type { TemplateCategory } from "@/lib/template-categories";
export default function CategoryTemplateThumbnail({
  category,
  template,
}: {
  category: TemplateCategory;
  template: Pick<PublicTemplate, "id" | "name" | "heroImage">;
}) {
  const themed = getThemedEventDesign(template.id);
  if (themed) return <TemplateArtworkThumbnail design={themed} />;
  const base = { id: template.id, name: template.name, artwork: template.heroImage };
  if (category === "bridal-showers") {
    const design = BRIDAL_PRESETS.find((item) => item.id === template.id) ?? BRIDAL_PRESETS[0];
    return (
      <TemplateArtworkThumbnail
        design={{
          ...base,
          label: "Bridal shower",
          background: design.background,
          ink: design.accent,
          accent: design.accent,
          font: '"Playfair Display", Georgia, serif',
          composition: "arch",
        }}
      />
    );
  }
  const [sportId, style] = template.id.split("--");
  const sport = getSportEventPreset(sportId);
  const themeId = getSportStyleThemeIds(sport, style)[0];
  const theme = sportsConfig.themes.find((item) => item.id === themeId);
  return (
    <TemplateArtworkThumbnail
      design={{
        ...base,
        label: "Sports",
        background: "#172033",
        ink: "#ffffff",
        accent: "#ffffff",
        font: '"Anton", sans-serif',
        composition: style === "club" ? "framed" : style === "tournament" ? "journal" : "poster",
        surfaceClassName: theme?.bg,
      }}
    />
  );
}
