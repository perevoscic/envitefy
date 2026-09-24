/** Shared, self-hosted typefaces. Registration lives in globals.css and gallery-fonts.css. */
import { FONT_LIBRARY_ADDITIONS } from "./font-library-additions";

export type FontCategory = "Serif" | "Sans serif" | "Script" | "Display";
export type GalleryFont = {
  id: string;
  label: string;
  stack: string;
  category: FontCategory;
  bodySuitable: boolean;
};

const legacyFonts: GalleryFont[] = [
  {
    category: "Serif",
    bodySuitable: false,
    id: "playfair",
    label: "Playfair Display",
    stack: "'Playfair Display', 'Times New Roman', Georgia, serif",
  },
  {
    category: "Serif",
    bodySuitable: false,
    id: "cormorant",
    label: "Cormorant Garamond",
    stack: "'Cormorant Garamond', Garamond, serif",
  },
  {
    category: "Sans serif",
    bodySuitable: true,
    id: "montserrat",
    label: "Montserrat",
    stack: "'Montserrat', 'Helvetica Neue', Arial, sans-serif",
  },
  {
    category: "Sans serif",
    bodySuitable: true,
    id: "poppins",
    label: "Poppins",
    stack: "'Poppins', 'Helvetica Neue', Arial, sans-serif",
  },
  {
    category: "Sans serif",
    bodySuitable: true,
    id: "inter",
    label: "Inter",
    stack: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  },
  {
    category: "Display",
    bodySuitable: false,
    id: "anton",
    label: "Anton",
    stack: "'Anton', Impact, 'Arial Black', sans-serif",
  },
  {
    category: "Display",
    bodySuitable: false,
    id: "bebas",
    label: "Bebas Neue",
    stack: "'Bebas Neue', 'Oswald', 'Arial Narrow', sans-serif",
  },
  {
    category: "Display",
    bodySuitable: false,
    id: "oswald",
    label: "Oswald",
    stack: "'Oswald', 'Arial Narrow', Arial, sans-serif",
  },
  {
    category: "Display",
    bodySuitable: false,
    id: "teko",
    label: "Teko",
    stack: "'Teko', 'Bebas Neue', 'Arial Narrow', sans-serif",
  },
  {
    category: "Sans serif",
    bodySuitable: true,
    id: "rajdhani",
    label: "Rajdhani",
    stack: "'Rajdhani', 'Roboto Condensed', sans-serif",
  },
  {
    category: "Display",
    bodySuitable: false,
    id: "orbitron",
    label: "Orbitron",
    stack: "'Orbitron', 'Audiowide', sans-serif",
  },
  {
    category: "Display",
    bodySuitable: false,
    id: "righteous",
    label: "Righteous",
    stack: "'Righteous', 'Baloo', cursive",
  },
  {
    category: "Script",
    bodySuitable: false,
    id: "dancing",
    label: "Dancing Script",
    stack: "'Dancing Script', 'Brush Script MT', cursive",
  },
  {
    category: "Script",
    bodySuitable: false,
    id: "kaushan",
    label: "Kaushan Script",
    stack: "'Kaushan Script', 'Brush Script MT', cursive",
  },
  {
    category: "Script",
    bodySuitable: false,
    id: "great-vibes",
    label: "Great Vibes",
    stack: "'Great Vibes', 'Times New Roman', serif",
  },
  {
    category: "Script",
    bodySuitable: false,
    id: "allura",
    label: "Allura",
    stack: "'Allura', 'Brush Script MT', cursive",
  },
  {
    category: "Script",
    bodySuitable: false,
    id: "parisienne",
    label: "Parisienne",
    stack: "'Parisienne', 'Brush Script MT', cursive",
  },
  {
    category: "Script",
    bodySuitable: false,
    id: "pacifico",
    label: "Pacifico",
    stack: "'Pacifico', 'Brush Script MT', cursive",
  },
  {
    category: "Script",
    bodySuitable: false,
    id: "courgette",
    label: "Courgette",
    stack: "'Courgette', 'Brush Script MT', cursive",
  },
  {
    category: "Script",
    bodySuitable: false,
    id: "satisfy",
    label: "Satisfy",
    stack: "'Satisfy', 'Brush Script MT', cursive",
  },
  {
    category: "Script",
    bodySuitable: false,
    id: "sacramento",
    label: "Sacramento",
    stack: "'Sacramento', 'Brush Script MT', cursive",
  },
  {
    category: "Script",
    bodySuitable: false,
    id: "yellowtail",
    label: "Yellowtail",
    stack: "'Yellowtail', 'Brush Script MT', cursive",
  },
];

function font(
  id: string,
  label: string,
  category: FontCategory,
  bodySuitable = false,
): GalleryFont {
  const fallback =
    category === "Serif"
      ? "Georgia, serif"
      : category === "Script"
        ? "cursive"
        : "Arial, sans-serif";
  return { id, label, category, bodySuitable, stack: `"${label}", ${fallback}` };
}

export const FONT_LIBRARY: GalleryFont[] = [
  ...legacyFonts,
  font("dm-serif", "DM Serif Display", "Serif", false),
  font("libre-baskerville", "Libre Baskerville", "Serif", true),
  font("cormorant-display", "Cormorant", "Serif", false),
  font("bree", "Bree Serif", "Serif", true),
  font("fraunces", "Fraunces", "Serif", true),
  font("bodoni", "Bodoni Moda", "Serif", false),
  font("cinzel", "Cinzel", "Serif", false),
  font("abril", "Abril Fatface", "Serif", false),
  font("lora", "Lora", "Serif", true),
  font("josefin-slab", "Josefin Slab", "Serif", true),
  font("dm-sans", "DM Sans", "Sans serif", true),
  font("manrope", "Manrope", "Sans serif", true),
  font("nunito", "Nunito", "Sans serif", true),
  font("raleway", "Raleway", "Sans serif", true),
  font("work-sans", "Work Sans", "Sans serif", true),
  font("source-sans", "Source Sans 3", "Sans serif", true),
  font("space-grotesk", "Space Grotesk", "Sans serif", true),
  font("quicksand", "Quicksand", "Sans serif", true),
  font("josefin-sans", "Josefin Sans", "Sans serif", true),
  font("caveat", "Caveat", "Script", false),
  font("amita", "Amita", "Script", false),
  font("arizonia", "Arizonia", "Script", false),
  font("fredoka", "Fredoka", "Display", false),
  font("baloo", "Baloo 2", "Display", false),
  font("bangers", "Bangers", "Display", false),
  font("lobster", "Lobster", "Display", false),
  font("monoton", "Monoton", "Display", false),
  font("pirata", "Pirata One", "Display", false),
  ...FONT_LIBRARY_ADDITIONS.map((entry) =>
    font(entry.id, entry.family, entry.category, entry.bodySuitable),
  ),
];
export const BODY_FONT_OPTIONS = FONT_LIBRARY.filter((font) => font.bodySuitable);

const stack = (id: string) => {
  const entry = FONT_LIBRARY.find((font) => font.id === id);
  if (!entry) throw new Error(`Unknown gallery font: ${id}`);
  return entry.stack;
};
function pair<const Id extends string>(id: Id, name: string, title: string, body: string) {
  return { id, name, heading: stack(title), body: stack(body) };
}

/** Additive pairings: existing saved theme IDs keep their original definitions. */
export const GALLERY_FONT_PAIRS = [
  pair("romantic", "Romantic", "great-vibes", "dm-sans"),
  pair("botanical", "Botanical", "fraunces", "lora"),
  pair("celebration", "Celebration", "dancing", "manrope"),
  pair("storybook", "Storybook", "fredoka", "nunito"),
  pair("playful", "Playful", "baloo", "quicksand"),
  pair("minimal", "Minimal", "manrope", "dm-sans"),
  pair("luxury", "Luxury", "bodoni", "raleway"),
  pair("vintage", "Vintage", "abril", "work-sans"),
  pair("handwritten", "Handwritten", "caveat", "source-sans"),
  pair("cinematic", "Cinematic", "bebas", "source-sans"),
  pair("heritage", "Heritage", "cinzel", "lora"),
  pair("contemporary", "Contemporary", "space-grotesk", "inter"),
] as const;

/** Every family is selectable with a readable companion; scripts stay in the title. */
export const LIBRARY_FONT_PAIRS = FONT_LIBRARY.map((entry) => ({
  id: `font-${entry.id}` as const,
  name: entry.label,
  kind: "font" as const,
  category: entry.category,
  heading: entry.stack,
  body: stack(
    entry.category === "Sans serif"
      ? "lora"
      : entry.category === "Serif"
        ? "source-sans"
        : entry.category === "Script"
          ? "dm-sans"
          : "work-sans",
  ),
}));
export type GalleryFontPairId =
  | (typeof GALLERY_FONT_PAIRS)[number]["id"]
  | (typeof LIBRARY_FONT_PAIRS)[number]["id"];
