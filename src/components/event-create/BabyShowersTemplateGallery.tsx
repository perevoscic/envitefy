"use client";

import TemplateGallery, {
  type ResolvedTemplateVariation,
  type TemplateGalleryTemplate,
  type TemplateGalleryVariation,
} from "./TemplateGallery";
import {
  type TemplateFontTokenId,
  type TemplatePaletteTokenId,
} from "./templateDesignTokens";

const babyShowerMenu = ["Home", "Details", "Registry", "Wishlist", "RSVP"];

export type BabyShowerTemplateDefinition = TemplateGalleryTemplate & {
  preview?: {
    coupleName: string;
    dateLabel: string;
    location: string;
    timeLabel?: string;
  };
  backgroundPrompt?: string;
};
export type TemplateVariation = ResolvedTemplateVariation;

type StoryConfig = {
  key: string;
  paletteId: TemplatePaletteTokenId;
  label: string;
  tagline: string;
  titleColorOverride?: string;
};

const buildStories = (
  templateId: string,
  fontId: TemplateFontTokenId,
  configs: StoryConfig[]
): TemplateGalleryVariation[] =>
  configs.map(({ key, ...rest }) => ({
    id: `${templateId}-${key}`,
    fontId,
    ...rest,
  }));

const BABY_COLOR_STORIES: StoryConfig[] = [
  {
    key: "blush-petals",
    paletteId: "blush-champagne",
    label: "Blush Petals",
    tagline: "Peony neutrals & cream",
  },
  {
    key: "lavender-hush",
    paletteId: "moonlit-lavender",
    label: "Lavender Hush",
    tagline: "Twilight lavender haze",
  },
  {
    key: "sage-meadow",
    paletteId: "green-garden-party",
    label: "Sage Meadow",
    tagline: "Fresh garden greens",
  },
  {
    key: "sky-breeze",
    paletteId: "ocean-splash",
    label: "Sky Breeze",
    tagline: "Soft airy blues",
  },
  {
    key: "sunlit-citrus",
    paletteId: "sunshine-yellow",
    label: "Sunlit Citrus",
    tagline: "Warm amber glow",
  },
  {
    key: "coral-peach",
    paletteId: "sunset-coral",
    label: "Coral Peach",
    tagline: "Peach sorbet sunset",
  },
  {
    key: "seaside-foam",
    paletteId: "sea-glass",
    label: "Seaside Foam",
    tagline: "Coastal mint calm",
  },
  {
    key: "opal-linen",
    paletteId: "opal-sand",
    label: "Opal Linen",
    tagline: "Ivory & linen wash",
  },
];

const getColorStoriesForTemplate = (
  index: number,
  count = 3
): StoryConfig[] => {
  if (!BABY_COLOR_STORIES.length) return [];
  const rotated = [...BABY_COLOR_STORIES];
  const startIndex = index % rotated.length;
  const ordered = [
    ...rotated.slice(startIndex),
    ...rotated.slice(0, startIndex),
  ];
  return ordered.slice(0, count);
};

// Background prompts for baby shower templates
const BABY_SHOWER_BACKGROUND_PROMPTS: Record<string, string> = {
  "soft-neutrals-shower":
    "Minimal baby shower background in warm beige and cream tones, soft rounded shapes around the borders, subtle speckles, large empty light center area for text, modern neutral aesthetic, no text.",
  "little-star-is-coming":
    "Soft navy to midnight-blue gradient sky with tiny golden or pale yellow stars near the edges and a small crescent moon in one corner, central area slightly lighter and mostly empty for text, dreamy and delicate, no text.",
  "oh-baby-script":
    "Soft blush and nude gradient background with very subtle watercolor texture, gentle light vignette directing focus to the center, airy and elegant baby shower feel, no icons, no text.",
  "sage-linen":
    "Neutral linen-style textured background with soft sage green abstract shapes and leaves touching the borders, large light center area left plain for text, minimal modern style, no text.",
  "rainbow-baby-glow":
    "Soft pastel rainbow arcs (peach, lavender, mint, pale yellow) along the top and bottom edges, white or very pale center with a faint glowing effect, minimal details, baby theme, no text.",
  "wildflower-sprinkle":
    "Light cream background with delicate thin wildflower illustrations (soft pink, yellow, lavender) forming a loose border, center area left mostly blank for text, airy and gentle, no text.",
  "tiny-teddy":
    "Soft pastel background in beige and light brown tones, a small cute teddy bear illustration near one bottom corner, subtle rounded shapes near edges, large clear center area for text, cozy and simple, no text.",
  "boho-arch-baby":
    "Boho baby shower background with overlapping arches in terracotta, blush, and cream near the sides, subtle textured look, big blank light center space for text, stylish and modern, no text.",
  "minimal-line-art-bump":
    "Clean white or very pale blush background with a single simple line-art drawing of a pregnant silhouette near the left edge, very minimal accents, large empty space for text, elegant and quiet, no text.",
  "little-clouds":
    "Baby shower sky background with soft fluffy clouds on a pale blue or light beige sky, clouds concentrated near upper edges, central area mostly empty for text, gentle and light, no text.",
  "shes-on-her-way":
    "Soft blush and cream blended background with tiny gold or warm metallic speckles scattered mainly at edges, faint central rectangle in a lighter tone for text, chic and feminine, no text.",
  "hes-almost-here":
    "Baby shower design with pale blue and light gray abstract rounded shapes along the top and bottom edges, white or very light center area left blank for text, modern and simple, no text.",
  "gender-neutral-greenery":
    "White background with simple eucalyptus leaves and green branches decorating the top and top corners, subtle greenery near sides, central area clean and empty for text, serene and gender-neutral, no text.",
  "sip-see-soiree":
    "Elegant baby-themed background with soft champagne and blush gradient, subtle confetti dots near top border, faint light in center for text, modern and refined, no text.",
  "virtual-baby-shower":
    "Subtle abstract background with soft rounded rectangles suggesting screens or windows, in pastel blues and greens, white center space kept blank for text, gentle tech feel, no logos, no text.",
  "twins-on-the-way":
    "Baby shower background featuring pairs of matching icons like two stars, two hearts, two clouds spaced near borders, soft pastel palette, large clear center area for text, playful but tidy, no text.",
  "books-for-baby":
    "Warm baby shower background in soft beige and muted colors with a small stack of cute illustrated books near one lower corner, light textured look, center and upper area mostly empty for text, cozy and inviting, no text.",
  "baby-q-backyard":
    "Subtle outdoor backyard theme with light gingham or check pattern in very soft muted tones around edges, faint wooden or kraft-paper texture behind, central lighter panel for text, casual and friendly, no text.",
  "moon-back":
    "Baby shower night sky with large soft crescent moon near top corner, tiny scattered stars, deep but softened blue and purple gradient, glowing lighter circle in the center for text, dreamy and emotional, no text.",
  "little-wild-one":
    "Baby safari background with small pastel animal illustrations (baby lion, elephant, giraffe) near lower corners, soft beige and light green hues, upper and middle center area blank and bright for text, sweet and simple, no text.",
  "terracotta-bloom":
    "Earthy baby shower background with terracotta and blush abstract shapes and minimal floral line-art near corners, textured off-white base, central area clean for text, stylish and contemporary, no text.",
  "scandinavian-baby":
    "Scandinavian-inspired baby design with simple geometric shapes (circles, triangles, arches) in muted mustard, dusty blue, and soft gray near borders, white central area for text, ultra-minimal, no text.",
  "classic-baby-blue-blush-frame":
    "Classic baby invite with a thin soft pastel border (blue or blush) around a clean white center, tiny baby-themed icons like a rattle or star in one corner, very simple and traditional, center empty for text, no text.",
  "botanical-bump-celebration":
    "Botanical baby shower background with delicate leafy line-art around edges in sage and dark green, soft off-white oval in the center for text, calm and nature-inspired, no text.",
};

/**
 * Get the background prompt for a baby shower template
 */
export function getBabyShowerBackgroundPrompt(
  templateId: string
): string {
  return BABY_SHOWER_BACKGROUND_PROMPTS[templateId] || 
    "Soft pastel baby shower background with gentle gradients, minimal decorative elements near edges, large empty center area for text, no text.";
}

const baseBabyShowerTemplateCatalog: BabyShowerTemplateDefinition[] = [
  {
    id: "soft-neutrals-shower",
    name: "Soft Neutrals Shower",
    description:
      "A warm, minimal design using beige, cream, and soft taupe. Simple shapes, generous white space, and a centered text area perfect for any baby shower.",
    heroImageName: "garden-atelier-hero.jpeg",
    heroMood: "Minimal & Warm",
    menu: [...babyShowerMenu],
    variations: buildStories(
      "soft-neutrals-shower",
      "sans-classic-center",
      getColorStoriesForTemplate(0)
    ),
    preview: {
      coupleName: "Baby Shower",
      dateLabel: "April 12, 2025",
      location: "Nashville, TN",
      timeLabel: "11:00 AM",
    },
    backgroundPrompt: getBabyShowerBackgroundPrompt("soft-neutrals-shower"),
  },
  {
    id: "little-star-is-coming",
    name: "Little Star Is Coming",
    description:
      "Gentle night sky with tiny stars and a moon, designed so the middle feels calm and open for baby shower details.",
    heroImageName: "moonlit-terrace-hero.jpeg",
    heroMood: "Dreamy & Celestial",
    menu: [...babyShowerMenu],
    variations: buildStories(
      "little-star-is-coming",
      "font-parisienne",
      getColorStoriesForTemplate(1)
    ),
    preview: {
      coupleName: "Baby Liam",
      dateLabel: "May 4, 2025",
      location: "Seattle, WA",
      timeLabel: "2:30 PM",
    },
    backgroundPrompt: getBabyShowerBackgroundPrompt("little-star-is-coming"),
  },
  {
    id: "oh-baby-script",
    name: "Oh Baby Script",
    description:
      "Elegant script feel with a clean, airy layout. Background uses soft blush or nude tones with a light gradient.",
    heroImageName: "garden-atelier-hero.jpeg",
    heroMood: "Elegant & Airy",
    menu: [...babyShowerMenu],
    variations: buildStories(
      "oh-baby-script",
      "font-allura",
      getColorStoriesForTemplate(0)
    ),
    preview: {
      coupleName: "Baby Avery",
      dateLabel: "April 12, 2025",
      location: "Nashville, TN",
      timeLabel: "11:00 AM",
    },
    backgroundPrompt: getBabyShowerBackgroundPrompt("oh-baby-script"),
  },
  {
    id: "sage-linen",
    name: "Sage & Linen",
    description:
      "Sage green accents with a linen-style texture, ideal for a gender-neutral modern shower.",
    heroImageName: "evergreen-ballroom-hero.jpeg",
    heroMood: "Fresh & Botanical",
    menu: [...babyShowerMenu],
    variations: buildStories(
      "sage-linen",
      "sans-classic-center",
      getColorStoriesForTemplate(2)
    ),
    preview: {
      coupleName: "Baby Harper",
      dateLabel: "June 1, 2025",
      location: "Portland, OR",
      timeLabel: "10:00 AM",
    },
    backgroundPrompt: getBabyShowerBackgroundPrompt("sage-linen"),
  },
  {
    id: "rainbow-baby-glow",
    name: "Rainbow Baby Glow",
    description:
      "Pastel rainbow arcs gently framing the invite, with a central glowing area where the event info will sit.",
    heroImageName: "champagne-skyline-hero.jpeg",
    heroMood: "Playful & Colorful",
    menu: [...babyShowerMenu],
    variations: buildStories(
      "rainbow-baby-glow",
      "font-pacifico",
      getColorStoriesForTemplate(3)
    ),
    preview: {
      coupleName: "Baby Maya",
      dateLabel: "July 20, 2025",
      location: "Austin, TX",
      timeLabel: "4:00 PM",
    },
    backgroundPrompt: getBabyShowerBackgroundPrompt("rainbow-baby-glow"),
  },
  {
    id: "wildflower-sprinkle",
    name: "Wildflower Sprinkle",
    description:
      "Delicate wildflowers around the border with a calm off-white interior for text—perfect for sprinkles and brunch-style showers.",
    heroImageName: "garden-atelier-hero.jpeg",
    heroMood: "Soft & Floral",
    menu: [...babyShowerMenu],
    variations: buildStories(
      "wildflower-sprinkle",
      "font-allura",
      getColorStoriesForTemplate(0)
    ),
    preview: {
      coupleName: "Baby Shower",
      dateLabel: "April 12, 2025",
      location: "Nashville, TN",
      timeLabel: "11:00 AM",
    },
    backgroundPrompt: getBabyShowerBackgroundPrompt("wildflower-sprinkle"),
  },
  {
    id: "tiny-teddy",
    name: "Tiny Teddy",
    description:
      "Cute teddy bear illustration tucked into a corner with soft rounded shapes; the layout stays mostly minimal.",
    heroImageName: "garden-atelier-hero.jpeg",
    heroMood: "Cute & Cozy",
    menu: [...babyShowerMenu],
    variations: buildStories(
      "tiny-teddy",
      "font-pacifico",
      getColorStoriesForTemplate(0)
    ),
    preview: {
      coupleName: "Baby Shower",
      dateLabel: "April 12, 2025",
      location: "Nashville, TN",
      timeLabel: "11:00 AM",
    },
    backgroundPrompt: getBabyShowerBackgroundPrompt("tiny-teddy"),
  },
  {
    id: "boho-arch-baby",
    name: "Boho Arch Baby",
    description:
      "Boho-style arches and terracotta tones with clean type space, trendy and Instagram-ish.",
    heroImageName: "champagne-skyline-hero.jpeg",
    heroMood: "Boho & Modern",
    menu: [...babyShowerMenu],
    variations: buildStories(
      "boho-arch-baby",
      "sans-classic-center",
      getColorStoriesForTemplate(1)
    ),
    preview: {
      coupleName: "Baby Shower",
      dateLabel: "April 12, 2025",
      location: "Nashville, TN",
      timeLabel: "11:00 AM",
    },
    backgroundPrompt: getBabyShowerBackgroundPrompt("boho-arch-baby"),
  },
  {
    id: "minimal-line-art-bump",
    name: "Minimal Line Art Bump",
    description:
      "Ultra-minimal with a single line-art illustration of a pregnant silhouette near the edge and lots of whitespace.",
    heroImageName: "garden-atelier-hero.jpeg",
    heroMood: "Minimal & Elegant",
    menu: [...babyShowerMenu],
    variations: buildStories(
      "minimal-line-art-bump",
      "sans-classic-center",
      getColorStoriesForTemplate(0)
    ),
    preview: {
      coupleName: "Baby Shower",
      dateLabel: "April 12, 2025",
      location: "Nashville, TN",
      timeLabel: "11:00 AM",
    },
    backgroundPrompt: getBabyShowerBackgroundPrompt("minimal-line-art-bump"),
  },
  {
    id: "little-clouds",
    name: "Little Clouds",
    description:
      "Fluffy clouds and soft blue or neutral sky, very calming, with a central clear area.",
    heroImageName: "moonlit-terrace-hero.jpeg",
    heroMood: "Calm & Gentle",
    menu: [...babyShowerMenu],
    variations: buildStories(
      "little-clouds",
      "font-parisienne",
      getColorStoriesForTemplate(1)
    ),
    preview: {
      coupleName: "Baby Shower",
      dateLabel: "April 12, 2025",
      location: "Nashville, TN",
      timeLabel: "11:00 AM",
    },
    backgroundPrompt: getBabyShowerBackgroundPrompt("little-clouds"),
  },
  {
    id: "shes-on-her-way",
    name: "She's On Her Way",
    description:
      "Feminine-leaning but not overly pink—soft blush and gold speckles with a smooth central text panel.",
    heroImageName: "garden-atelier-hero.jpeg",
    heroMood: "Chic & Feminine",
    menu: [...babyShowerMenu],
    variations: buildStories(
      "shes-on-her-way",
      "font-allura",
      getColorStoriesForTemplate(0)
    ),
    preview: {
      coupleName: "Baby Shower",
      dateLabel: "April 12, 2025",
      location: "Nashville, TN",
      timeLabel: "11:00 AM",
    },
    backgroundPrompt: getBabyShowerBackgroundPrompt("shes-on-her-way"),
  },
  {
    id: "hes-almost-here",
    name: "He's Almost Here",
    description:
      "Soft blue-gray palette with simple abstract shapes framing the top and bottom.",
    heroImageName: "moonlit-terrace-hero.jpeg",
    heroMood: "Modern & Clean",
    menu: [...babyShowerMenu],
    variations: buildStories(
      "hes-almost-here",
      "sans-classic-center",
      getColorStoriesForTemplate(1)
    ),
    preview: {
      coupleName: "Baby Shower",
      dateLabel: "April 12, 2025",
      location: "Nashville, TN",
      timeLabel: "11:00 AM",
    },
    backgroundPrompt: getBabyShowerBackgroundPrompt("hes-almost-here"),
  },
  {
    id: "gender-neutral-greenery",
    name: "Gender Neutral Greenery",
    description:
      "Eucalyptus leaves and soft greens, perfect for any baby, with a lightly framed center.",
    heroImageName: "evergreen-ballroom-hero.jpeg",
    heroMood: "Serene & Natural",
    menu: [...babyShowerMenu],
    variations: buildStories(
      "gender-neutral-greenery",
      "sans-classic-center",
      getColorStoriesForTemplate(2)
    ),
    preview: {
      coupleName: "Baby Shower",
      dateLabel: "April 12, 2025",
      location: "Nashville, TN",
      timeLabel: "11:00 AM",
    },
    backgroundPrompt: getBabyShowerBackgroundPrompt("gender-neutral-greenery"),
  },
  {
    id: "sip-see-soiree",
    name: "Sip & See Soirée",
    description:
      "Chic, slightly more grown-up design with soft champagne and blush tones, ideal for post-birth meet-the-baby events.",
    heroImageName: "champagne-skyline-hero.jpeg",
    heroMood: "Elegant & Refined",
    menu: [...babyShowerMenu],
    variations: buildStories(
      "sip-see-soiree",
      "font-allura",
      getColorStoriesForTemplate(0)
    ),
    preview: {
      coupleName: "Baby Shower",
      dateLabel: "April 12, 2025",
      location: "Nashville, TN",
      timeLabel: "11:00 AM",
    },
    backgroundPrompt: getBabyShowerBackgroundPrompt("sip-see-soiree"),
  },
  {
    id: "virtual-baby-shower",
    name: "Virtual Baby Shower",
    description:
      "Screen-friendly layout with soft shapes hinting at video chat windows, but still simple and warm.",
    heroImageName: "moonlit-terrace-hero.jpeg",
    heroMood: "Modern & Tech-Friendly",
    menu: [...babyShowerMenu],
    variations: buildStories(
      "virtual-baby-shower",
      "sans-classic-center",
      getColorStoriesForTemplate(1)
    ),
    preview: {
      coupleName: "Baby Shower",
      dateLabel: "April 12, 2025",
      location: "Nashville, TN",
      timeLabel: "11:00 AM",
    },
    backgroundPrompt: getBabyShowerBackgroundPrompt("virtual-baby-shower"),
  },
  {
    id: "twins-on-the-way",
    name: "Twins On The Way",
    description:
      "Symmetrical design with pairs of small icons—two stars, two clouds, two hearts—around a shared text block.",
    heroImageName: "champagne-skyline-hero.jpeg",
    heroMood: "Playful & Symmetrical",
    menu: [...babyShowerMenu],
    variations: buildStories(
      "twins-on-the-way",
      "font-pacifico",
      getColorStoriesForTemplate(3)
    ),
    preview: {
      coupleName: "Baby Shower",
      dateLabel: "April 12, 2025",
      location: "Nashville, TN",
      timeLabel: "11:00 AM",
    },
    backgroundPrompt: getBabyShowerBackgroundPrompt("twins-on-the-way"),
  },
  {
    id: "books-for-baby",
    name: "Books For Baby",
    description:
      "Reading-themed invite with stack-of-books illustration and warm cozy tones, ideal for bring a book instead of a card.",
    heroImageName: "garden-atelier-hero.jpeg",
    heroMood: "Cozy & Inviting",
    menu: [...babyShowerMenu],
    variations: buildStories(
      "books-for-baby",
      "sans-classic-center",
      getColorStoriesForTemplate(0)
    ),
    preview: {
      coupleName: "Baby Shower",
      dateLabel: "April 12, 2025",
      location: "Nashville, TN",
      timeLabel: "11:00 AM",
    },
    backgroundPrompt: getBabyShowerBackgroundPrompt("books-for-baby"),
  },
  {
    id: "baby-q-backyard",
    name: "Baby-Q Backyard",
    description:
      "Casual, slightly rustic style that hints at a backyard BBQ vibe while still soft enough for baby.",
    heroImageName: "champagne-skyline-hero.jpeg",
    heroMood: "Casual & Friendly",
    menu: [...babyShowerMenu],
    variations: buildStories(
      "baby-q-backyard",
      "font-pacifico",
      getColorStoriesForTemplate(1)
    ),
    preview: {
      coupleName: "Baby Shower",
      dateLabel: "April 12, 2025",
      location: "Nashville, TN",
      timeLabel: "11:00 AM",
    },
    backgroundPrompt: getBabyShowerBackgroundPrompt("baby-q-backyard"),
  },
  {
    id: "moon-back",
    name: "Moon & Back",
    description:
      "Soft moon and stars with gentle gradient, to the moon and back energy without actual wording.",
    heroImageName: "moonlit-terrace-hero.jpeg",
    heroMood: "Dreamy & Emotional",
    menu: [...babyShowerMenu],
    variations: buildStories(
      "moon-back",
      "font-parisienne",
      getColorStoriesForTemplate(1)
    ),
    preview: {
      coupleName: "Baby Shower",
      dateLabel: "April 12, 2025",
      location: "Nashville, TN",
      timeLabel: "11:00 AM",
    },
    backgroundPrompt: getBabyShowerBackgroundPrompt("moon-back"),
  },
  {
    id: "little-wild-one",
    name: "Little Wild One",
    description:
      "Gentle safari baby animals with pastel tones, but plenty of central space left clean.",
    heroImageName: "evergreen-ballroom-hero.jpeg",
    heroMood: "Sweet & Adventurous",
    menu: [...babyShowerMenu],
    variations: buildStories(
      "little-wild-one",
      "font-pacifico",
      getColorStoriesForTemplate(2)
    ),
    preview: {
      coupleName: "Baby Shower",
      dateLabel: "April 12, 2025",
      location: "Nashville, TN",
      timeLabel: "11:00 AM",
    },
    backgroundPrompt: getBabyShowerBackgroundPrompt("little-wild-one"),
  },
  {
    id: "terracotta-bloom",
    name: "Terracotta Bloom",
    description:
      "Earthy terracotta and blush florals with a modern, editorial layout.",
    heroImageName: "garden-atelier-hero.jpeg",
    heroMood: "Stylish & Contemporary",
    menu: [...babyShowerMenu],
    variations: buildStories(
      "terracotta-bloom",
      "sans-classic-center",
      getColorStoriesForTemplate(1)
    ),
    preview: {
      coupleName: "Baby Shower",
      dateLabel: "April 12, 2025",
      location: "Nashville, TN",
      timeLabel: "11:00 AM",
    },
    backgroundPrompt: getBabyShowerBackgroundPrompt("terracotta-bloom"),
  },
  {
    id: "scandinavian-baby",
    name: "Scandinavian Baby",
    description:
      "Scandi-inspired minimal geometric shapes, soft muted colors, very clean lines.",
    heroImageName: "garden-atelier-hero.jpeg",
    heroMood: "Ultra-Minimal",
    menu: [...babyShowerMenu],
    variations: buildStories(
      "scandinavian-baby",
      "sans-classic-center",
      getColorStoriesForTemplate(0)
    ),
    preview: {
      coupleName: "Baby Shower",
      dateLabel: "April 12, 2025",
      location: "Nashville, TN",
      timeLabel: "11:00 AM",
    },
    backgroundPrompt: getBabyShowerBackgroundPrompt("scandinavian-baby"),
  },
  {
    id: "classic-baby-blue-blush-frame",
    name: "Classic Baby Blue or Blush Frame",
    description:
      "Timeless card with a thin colored border (blue or blush) around a crisp white interior.",
    heroImageName: "garden-atelier-hero.jpeg",
    heroMood: "Classic & Timeless",
    menu: [...babyShowerMenu],
    variations: buildStories(
      "classic-baby-blue-blush-frame",
      "font-allura",
      getColorStoriesForTemplate(0)
    ),
    preview: {
      coupleName: "Baby Shower",
      dateLabel: "April 12, 2025",
      location: "Nashville, TN",
      timeLabel: "11:00 AM",
    },
    backgroundPrompt: getBabyShowerBackgroundPrompt("classic-baby-blue-blush-frame"),
  },
  {
    id: "botanical-bump-celebration",
    name: "Botanical Bump Celebration",
    description:
      "Botanical illustrations and a soft oval area in the middle, perfect for showers focused on mom and self-care.",
    heroImageName: "evergreen-ballroom-hero.jpeg",
    heroMood: "Calm & Nature-Inspired",
    menu: [...babyShowerMenu],
    variations: buildStories(
      "botanical-bump-celebration",
      "sans-classic-center",
      getColorStoriesForTemplate(2)
    ),
    preview: {
      coupleName: "Baby Shower",
      dateLabel: "April 12, 2025",
      location: "Nashville, TN",
      timeLabel: "11:00 AM",
    },
    backgroundPrompt: getBabyShowerBackgroundPrompt("botanical-bump-celebration"),
  },
];

export const babyShowerTemplateCatalog: BabyShowerTemplateDefinition[] =
  baseBabyShowerTemplateCatalog;

type Props = {
  appliedTemplateId: string | null;
  appliedVariationId: string | null;
  onApplyTemplate: (
    template: BabyShowerTemplateDefinition,
    variation: TemplateVariation
  ) => void;
};

export default function BabyShowersTemplateGallery({
  appliedTemplateId,
  appliedVariationId,
  onApplyTemplate,
}: Props) {
  return (
    <div className="w-full max-w-7xl">
      <TemplateGallery
        templates={babyShowerTemplateCatalog as any}
        appliedTemplateId={appliedTemplateId}
        appliedVariationId={appliedVariationId}
        onApplyTemplate={(template, variation) =>
          onApplyTemplate(template as BabyShowerTemplateDefinition, variation)
        }
      />
    </div>
  );
}
