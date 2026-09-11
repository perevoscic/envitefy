"use client";

import BirthdayDesignPreview from "@/components/birthdays/BirthdayDesignPreview";
import TemplateArtworkThumbnail, {
  artworkComposition,
} from "@/components/events/TemplateArtworkThumbnail";
import { config as sportsConfig } from "@/components/event-templates/SportEventsTemplate";
import GymnasticsThumbnail from "@/components/gym-meet-templates/GymnasticsThumbnail";
import { GYM_MEET_TEMPLATE_LIBRARY } from "@/components/gym-meet-templates/registry";
import SignupTemplatePreview from "@/components/smart-signup-form/SignupTemplatePreview";
import WeddingDesignPreview from "@/components/weddings/WeddingDesignPreview";
import { BIRTHDAY_DESIGN_BY_ID } from "@/data/birthday-design-catalog";
import { BABY_SHOWER_DESIGNS, getBabyShowerDesign } from "@/lib/baby-shower-designs";
import { getGenderRevealDesign } from "@/lib/gender-reveal-designs";
import { BRIDAL_PRESETS, type PublicTemplate } from "@/lib/public-template-catalog";
import { getSportEventPreset, getSportStyleThemeIds } from "@/lib/sport-event-presets";
import type { TemplateCategory } from "@/lib/template-categories";
import { weddingDesignCatalog } from "@/lib/wedding-designs";

export default function CategoryTemplateThumbnail({
  category,
  template,
}: {
  category: TemplateCategory;
  template: Pick<PublicTemplate, "id" | "name" | "heroImage">;
}) {
  if (category === "signup-forms") return <SignupTemplatePreview template={template} />;
  if (category === "weddings") {
    const design = weddingDesignCatalog.find((item) => item.id === template.id);
    if (design) return <WeddingDesignPreview design={design} />;
  }
  if (category === "birthdays" || category === "anniversaries") {
    const design = BIRTHDAY_DESIGN_BY_ID.get(template.id);
    if (design) return <BirthdayDesignPreview design={design} />;
  }
  if (category === "gymnastics") {
    const design = GYM_MEET_TEMPLATE_LIBRARY.find((item) => item.id === template.id);
    if (design) return <GymnasticsThumbnail design={design} />;
  }
  const base = { id: template.id, name: template.name, artwork: template.heroImage };
  if (category === "baby-showers") {
    const design = getBabyShowerDesign(template.id) ?? BABY_SHOWER_DESIGNS[0];
    return (
      <TemplateArtworkThumbnail
        design={{
          ...base,
          label: "Baby shower",
          background: design.colors.background,
          ink: design.colors.text,
          accent: design.colors.accent,
          font: `"${design.displayFont}", Georgia, serif`,
          composition: artworkComposition(`${design.composition} ${design.style}`),
        }}
      />
    );
  }
  if (category === "gender-reveal") {
    const design = getGenderRevealDesign(template.id);
    const fontNames: Record<string, string> = {
      cormorantgaramond: "Cormorant Garamond",
      breeserif: "Bree Serif",
      dmserifdisplay: "DM Serif Display",
      librebaskerville: "Libre Baskerville",
      greatvibes: "Great Vibes",
      kaushanscript: "Kaushan Script",
      pirataone: "Pirata One",
      playfairdisplay: "Playfair Display",
      spacegrotesk: "Space Grotesk",
      bebasneue: "Bebas Neue",
    };
    return (
      <TemplateArtworkThumbnail
        design={{
          ...base,
          label: "Gender reveal",
          background: design.paper,
          ink: design.ink,
          accent: design.accent,
          font: `"${fontNames[design.font] || design.font}", Georgia, serif`,
          composition: artworkComposition(`${design.composition} ${design.style}`),
        }}
      />
    );
  }
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
