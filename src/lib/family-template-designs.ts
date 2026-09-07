export type FamilyTemplateCategory = "baby-showers" | "gender-reveal";

type FamilyTemplateDesign = {
  heroImage: string;
  themeId: string;
  font: string;
};

const babyThemes: Record<string, string> = {
  "soft-neutrals-shower": "soft_neutrals",
  "little-star-is-coming": "lavender",
  "oh-baby-script": "blush_pink",
  "sage-linen": "sage_green",
  "rainbow-baby-glow": "sunrise_sorbet",
  "wildflower-sprinkle": "lavender",
  "tiny-teddy": "soft_neutrals",
  "boho-arch-baby": "golden_hour",
  "minimal-line-art-bump": "soft_neutrals",
  "little-clouds": "baby_blue",
  "shes-on-her-way": "blush_pink",
  "hes-almost-here": "baby_blue",
  "gender-neutral-greenery": "sage_green",
  "sip-see-soiree": "blush_pink",
  "virtual-baby-shower": "minty_aurora",
  "twins-on-the-way": "soft_neutrals",
  "books-for-baby": "soft_neutrals",
  "baby-q-backyard": "sage_green",
  "moon-back": "lavender",
  "little-wild-one": "sage_green",
  "terracotta-bloom": "golden_hour",
  "scandinavian-baby": "soft_neutrals",
  "classic-baby-blue-blush-frame": "baby_blue",
  "botanical-bump-celebration": "sage_green",
};

const revealDesigns: Record<string, [string, string, string]> = {
  "pink-or-blue-classic": ["celebration", "pink_blue", "playfair"],
  "what-will-it-be-clouds": ["anticipation", "lavender_dream", "parisienne"],
  "neutral-mystery": ["details", "neutral_gold", "allura"],
  "boots-or-bows": ["gather", "mint_peach", "playfair"],
  "touchdowns-or-tutus": ["moment", "pink_blue", "montserrat"],
  "bee-theme-reveal": ["table", "neutral_gold", "poppins"],
  "staches-or-lashes": ["plan", "mint_peach", "montserrat"],
  "prince-or-princess": ["arrival", "lavender_dream", "allura"],
};

/** The same starting artwork and styling are used by the gallery and editor. */
export function getFamilyTemplateDesign(
  category: FamilyTemplateCategory,
  templateId: string | null | undefined,
): FamilyTemplateDesign {
  if (category === "gender-reveal") {
    const [image, themeId, font] = revealDesigns[templateId || ""] || revealDesigns["pink-or-blue-classic"];
    return {
      heroImage: `/images/landing/gender-reveal/gender-reveal-editorial-${image}.webp`,
      themeId,
      font,
    };
  }
  const id = templateId && babyThemes[templateId] ? templateId : "soft-neutrals-shower";
  // These two original entries share the existing neutral and botanical artwork.
  const imageId = id === "soft-neutrals-shower" ? "scandinavian-baby" : id === "sage-linen" ? "gender-neutral-greenery" : id;
  return {
    heroImage: `/templates/baby-showers/${imageId}.webp`,
    themeId: babyThemes[id],
    font: id === "oh-baby-script" ? "allura" : id === "scandinavian-baby" ? "montserrat" : "playfair",
  };
}

export function familyTemplateDate(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString().slice(0, 10);
}
