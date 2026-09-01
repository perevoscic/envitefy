import { birthdayTemplateCatalog } from "@/components/event-create/BirthdayTemplateGallery";
import { type BirthdayDesignTemplate, NEW_BIRTHDAY_DESIGNS } from "@/data/birthday-template-data";

type LegacyDesignDetail = {
  style: string;
  layout: string;
  primaryColor: string;
  secondaryColor: string;
  headlineFont: string;
  graphicType: string;
};

const LEGACY_DESIGN_DETAILS: Record<string, LegacyDesignDetail> = {
  "party-pop": {
    style: "Fantasy",
    layout: "luxury-royal",
    primaryColor: "#E7EEF5",
    secondaryColor: "#7052A6",
    headlineFont: "Playfair Display",
    graphicType: "castle",
  },
  "candy-dreams": {
    style: "Sweet",
    layout: "magical-sparkle",
    primaryColor: "#F7E8F2",
    secondaryColor: "#68A6B8",
    headlineFont: "Satisfy",
    graphicType: "candy",
  },
  "rainbow-bash": {
    style: "Adventure",
    layout: "island-paradise",
    primaryColor: "#E6D3A7",
    secondaryColor: "#795B39",
    headlineFont: "Libre Baskerville",
    graphicType: "treasure-map",
  },
  "playful-pals": {
    style: "Classic",
    layout: "balloon-arch",
    primaryColor: "#EFE2C8",
    secondaryColor: "#B07C3E",
    headlineFont: "Satisfy",
    graphicType: "balloons",
  },
  "birthday-burst": {
    style: "Adventure",
    layout: "dino-adventure",
    primaryColor: "#F0E4C8",
    secondaryColor: "#6C7B42",
    headlineFont: "Libre Baskerville",
    graphicType: "dinosaurs",
  },
  "sweet-celebration": {
    style: "Sweet",
    layout: "balloon-arch",
    primaryColor: "#F5E9E4",
    secondaryColor: "#D9869E",
    headlineFont: "Satisfy",
    graphicType: "sweets",
  },
  "super-star": {
    style: "STEM",
    layout: "cosmic-glow",
    primaryColor: "#FFF4D9",
    secondaryColor: "#D2A129",
    headlineFont: "Montserrat",
    graphicType: "science",
  },
  "happy-dance": {
    style: "Adventure",
    layout: "pattern-play",
    primaryColor: "#FFF2D0",
    secondaryColor: "#E0A021",
    headlineFont: "Montserrat",
    graphicType: "construction",
  },
  "magic-sparkle": {
    style: "Rustic",
    layout: "luxury-royal",
    primaryColor: "#E8E1D2",
    secondaryColor: "#7B6847",
    headlineFont: "Playfair Display",
    graphicType: "castle",
  },
  "celebration-time": {
    style: "Fantasy",
    layout: "underwater-obsidian",
    primaryColor: "#DFF3F1",
    secondaryColor: "#54A9A6",
    headlineFont: "Amita",
    graphicType: "undersea",
  },
  "fun-fiesta": {
    style: "Comic",
    layout: "confetti-splash",
    primaryColor: "#FFF1DC",
    secondaryColor: "#DB493A",
    headlineFont: "Montserrat",
    graphicType: "comic",
  },
  "joyful-jamboree": {
    style: "Sweet",
    layout: "pattern-play",
    primaryColor: "#F4ECE7",
    secondaryColor: "#B48E83",
    headlineFont: "Satisfy",
    graphicType: "baking",
  },
  "whimsical-wonder": {
    style: "Classic",
    layout: "confetti-splash",
    primaryColor: "#F3E4CB",
    secondaryColor: "#C45A3E",
    headlineFont: "Libre Baskerville",
    graphicType: "party-hall",
  },
  "cheerful-chaos": {
    style: "Fantasy",
    layout: "underwater-obsidian",
    primaryColor: "#D9F2EE",
    secondaryColor: "#4CA6A3",
    headlineFont: "Amita",
    graphicType: "mermaid",
  },
  "party-parade": {
    style: "Rustic",
    layout: "safari-adventure",
    primaryColor: "#E8DDCA",
    secondaryColor: "#8C6A43",
    headlineFont: "Kaushan Script",
    graphicType: "woodland",
  },
  "birthday-bliss": {
    style: "Glam",
    layout: "glamor-sparkle",
    primaryColor: "#17151B",
    secondaryColor: "#D4A545",
    headlineFont: "Playfair Display",
    graphicType: "red-carpet",
  },
  "sparkle-splash": {
    style: "Seasonal",
    layout: "magical-sparkle",
    primaryColor: "#E7F5FA",
    secondaryColor: "#74A5BE",
    headlineFont: "Cormorant",
    graphicType: "snow",
  },
  "celebration-craze": {
    style: "Nightlife",
    layout: "neon-night",
    primaryColor: "#102C37",
    secondaryColor: "#42D6E7",
    headlineFont: "Montserrat",
    graphicType: "dance",
  },
  "happy-hooray": {
    style: "Rustic",
    layout: "animal-party",
    primaryColor: "#F0E4CC",
    secondaryColor: "#A85A3C",
    headlineFont: "Libre Baskerville",
    graphicType: "farm",
  },
  "party-palooza": {
    style: "Rainbow",
    layout: "balloon-arch",
    primaryColor: "#FFF0E3",
    secondaryColor: "#E58B52",
    headlineFont: "Satisfy",
    graphicType: "rainbow",
  },
  "birthday-bonanza": {
    style: "Creative",
    layout: "pattern-play",
    primaryColor: "#FFF2EA",
    secondaryColor: "#E46B55",
    headlineFont: "Montserrat",
    graphicType: "art",
  },
  "sweet-surprise": {
    style: "Space",
    layout: "cosmic-glow",
    primaryColor: "#101626",
    secondaryColor: "#6C8CE5",
    headlineFont: "Montserrat",
    graphicType: "space",
  },
  "party-perfect": {
    style: "Elegant",
    layout: "elegant-serif",
    primaryColor: "#F5EDEE",
    secondaryColor: "#B87887",
    headlineFont: "Cormorant",
    graphicType: "floral",
  },
  "birthday-bash": {
    style: "Whimsical",
    layout: "whimsical-magic",
    primaryColor: "#E9F0DD",
    secondaryColor: "#68865A",
    headlineFont: "Arizonia",
    graphicType: "enchanted-forest",
  },
};

const newDesignIds = new Set(NEW_BIRTHDAY_DESIGNS.map((design) => design.id));

export const ORIGINAL_BIRTHDAY_DESIGNS: BirthdayDesignTemplate[] = birthdayTemplateCatalog
  .filter((template) => !newDesignIds.has(template.id))
  .map((template, index) => {
    const detail = LEGACY_DESIGN_DETAILS[template.id];
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      source: "Original",
      audience: "Kids",
      occasion: "Birthday",
      recipient: "Kids",
      collection: "Kids",
      milestone: null,
      style: detail?.style || "Classic",
      featured: index < 6,
      heroImage: `/templates/birthdays/${template.heroImageName}`,
      heroMood: template.heroMood,
      defaultHeadline: template.name,
      category: detail?.style || "Classic",
      family: (detail?.style || "classic").toLowerCase().replaceAll(" ", "-"),
      layout: detail?.layout || "confetti-splash",
      primaryColor: detail?.primaryColor || "#FFF5EA",
      secondaryColor: detail?.secondaryColor || "#D87338",
      headlineFont: detail?.headlineFont || "Playfair Display",
      decorations: { graphicType: detail?.graphicType || "confetti" },
    };
  });

export const BIRTHDAY_DESIGN_CATALOG: BirthdayDesignTemplate[] = [
  ...ORIGINAL_BIRTHDAY_DESIGNS,
  ...NEW_BIRTHDAY_DESIGNS,
];

export const BIRTHDAY_DESIGN_BY_ID = new Map(
  BIRTHDAY_DESIGN_CATALOG.map((design) => [design.id, design] as const),
);
