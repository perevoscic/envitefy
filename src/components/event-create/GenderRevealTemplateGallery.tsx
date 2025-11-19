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

const genderRevealMenu = ["Home", "Details", "Team Pink/Blue", "RSVP"];

export type GenderRevealTemplateDefinition = TemplateGalleryTemplate & {
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

const GENDER_REVEAL_COLOR_STORIES: StoryConfig[] = [
  {
    key: "pink-blue-classic",
    paletteId: "blush-champagne", // Using blush as base, but we might want a custom split palette if supported
    label: "Pink & Blue",
    tagline: "Classic reveal colors",
  },
  {
    key: "neutral-gold",
    paletteId: "sunshine-yellow",
    label: "Neutral Gold",
    tagline: "Elegant & mysterious",
  },
  {
    key: "mint-peach",
    paletteId: "sea-glass",
    label: "Mint & Peach",
    tagline: "Soft pastel surprise",
  },
  {
    key: "lavender-haze",
    paletteId: "moonlit-lavender",
    label: "Lavender Haze",
    tagline: "Dreamy purple tones",
  },
];

const getColorStoriesForTemplate = (
  index: number,
  count = 3
): StoryConfig[] => {
  if (!GENDER_REVEAL_COLOR_STORIES.length) return [];
  const rotated = [...GENDER_REVEAL_COLOR_STORIES];
  const startIndex = index % rotated.length;
  const ordered = [
    ...rotated.slice(startIndex),
    ...rotated.slice(0, startIndex),
  ];
  return ordered.slice(0, count);
};

// Background prompts for gender reveal templates
const GENDER_REVEAL_BACKGROUND_PROMPTS: Record<string, string> = {
  "pink-or-blue-classic":
    "A festive gender reveal table setup with a split color theme, half pastel pink and half baby blue, featuring cupcakes with pink and blue frosting, a 'He or She?' sign, and matching balloons, photographed from above with a clean central area for text, no other visible words.",
  "what-will-it-be-clouds":
    "A dreamy sky background with fluffy white clouds, some tinted soft pink and others soft blue, with a golden question mark balloon floating in the corner, shot to leave a large open sky area in the center for text, no text on the balloons.",
  "neutral-mystery":
    "An elegant gender reveal setup in white and gold, with a large white balloon box, gold confetti, and a '?' topper on a cake, photographed against a clean white wall that serves as a perfect text area, minimal and chic, no text on the box.",
  "boots-or-bows":
    "A rustic wooden table displaying a pair of tiny cowboy boots and a delicate pink bow, with some hay and wildflowers, shot from above with a clear wooden surface area in the middle for text overlay, country style, no labels.",
  "touchdowns-or-tutus":
    "A fun flat-lay with a small football and a tiny pink tutu arranged on a neutral background, with some confetti scattered around, leaving a wide open space in the center for event details, no text on the items.",
  "bee-theme-reveal":
    "A bright and cheerful table setting with yellow and black decor, honeycomb patterns, and cute bee illustrations, with a pot of honey and sunflowers, photographed to leave a clean yellow or white space for text, no words on the decor.",
  "staches-or-lashes":
    "A playful party background with props of black mustaches and pink eyelashes on sticks, arranged as a border around a clean white center space for text, fun and modern, no written words.",
  "prince-or-princess":
    "A royal-themed setup with a small gold crown and a sparkly tiara on a velvet cushion, with royal blue and pink accents, shot with a soft focus background that provides a large empty space for text, elegant and regal, no text.",
};

/**
 * Get the background prompt for a gender reveal template
 */
export function getGenderRevealBackgroundPrompt(templateId: string): string {
  return (
    GENDER_REVEAL_BACKGROUND_PROMPTS[templateId] ||
    "Soft pastel gender reveal background with pink and blue accents, minimal decorative elements near edges, large empty center area for text, no text."
  );
}

const baseGenderRevealTemplateCatalog: GenderRevealTemplateDefinition[] = [
  {
    id: "pink-or-blue-classic",
    name: "Pink or Blue Classic",
    description: "Split color design, fun and traditional.",
    heroImageName: "garden-atelier-hero.jpeg", // Placeholder
    heroMood: "Fun & Traditional",
    menu: [...genderRevealMenu],
    variations: buildStories(
      "pink-or-blue-classic",
      "sans-classic-center",
      getColorStoriesForTemplate(0)
    ),
    preview: {
      coupleName: "Baby Reveal",
      dateLabel: "May 15, 2025",
      location: "Chicago, IL",
      timeLabel: "2:00 PM",
    },
    backgroundPrompt: getGenderRevealBackgroundPrompt("pink-or-blue-classic"),
  },
  {
    id: "what-will-it-be-clouds",
    name: "What Will It Be",
    description: "Dreamy clouds in soft pinks and blues.",
    heroImageName: "moonlit-terrace-hero.jpeg", // Placeholder
    heroMood: "Dreamy & Soft",
    menu: [...genderRevealMenu],
    variations: buildStories(
      "what-will-it-be-clouds",
      "font-parisienne",
      getColorStoriesForTemplate(1)
    ),
    preview: {
      coupleName: "Baby Reveal",
      dateLabel: "May 15, 2025",
      location: "Chicago, IL",
      timeLabel: "2:00 PM",
    },
    backgroundPrompt: getGenderRevealBackgroundPrompt("what-will-it-be-clouds"),
  },
  {
    id: "neutral-mystery",
    name: "Neutral Mystery",
    description: "Elegant gold and white, keeping the secret.",
    heroImageName: "champagne-skyline-hero.jpeg", // Placeholder
    heroMood: "Elegant & Chic",
    menu: [...genderRevealMenu],
    variations: buildStories(
      "neutral-mystery",
      "font-allura",
      getColorStoriesForTemplate(2)
    ),
    preview: {
      coupleName: "Baby Reveal",
      dateLabel: "May 15, 2025",
      location: "Chicago, IL",
      timeLabel: "2:00 PM",
    },
    backgroundPrompt: getGenderRevealBackgroundPrompt("neutral-mystery"),
  },
  {
    id: "boots-or-bows",
    name: "Boots or Bows",
    description: "Rustic theme with cute props.",
    heroImageName: "garden-atelier-hero.jpeg", // Placeholder
    heroMood: "Rustic & Cute",
    menu: [...genderRevealMenu],
    variations: buildStories(
      "boots-or-bows",
      "font-pacifico",
      getColorStoriesForTemplate(3)
    ),
    preview: {
      coupleName: "Baby Reveal",
      dateLabel: "May 15, 2025",
      location: "Chicago, IL",
      timeLabel: "2:00 PM",
    },
    backgroundPrompt: getGenderRevealBackgroundPrompt("boots-or-bows"),
  },
  {
    id: "touchdowns-or-tutus",
    name: "Touchdowns or Tutus",
    description: "Playful sports and ballet theme.",
    heroImageName: "champagne-skyline-hero.jpeg", // Placeholder
    heroMood: "Playful & Fun",
    menu: [...genderRevealMenu],
    variations: buildStories(
      "touchdowns-or-tutus",
      "sans-classic-center",
      getColorStoriesForTemplate(0)
    ),
    preview: {
      coupleName: "Baby Reveal",
      dateLabel: "May 15, 2025",
      location: "Chicago, IL",
      timeLabel: "2:00 PM",
    },
    backgroundPrompt: getGenderRevealBackgroundPrompt("touchdowns-or-tutus"),
  },
  {
    id: "bee-theme-reveal",
    name: "What Will It Bee",
    description: "Cute bumblebee theme with yellow and black.",
    heroImageName: "evergreen-ballroom-hero.jpeg", // Placeholder
    heroMood: "Bright & Cheerful",
    menu: [...genderRevealMenu],
    variations: buildStories(
      "bee-theme-reveal",
      "font-pacifico",
      getColorStoriesForTemplate(1)
    ),
    preview: {
      coupleName: "Baby Reveal",
      dateLabel: "May 15, 2025",
      location: "Chicago, IL",
      timeLabel: "2:00 PM",
    },
    backgroundPrompt: getGenderRevealBackgroundPrompt("bee-theme-reveal"),
  },
  {
    id: "staches-or-lashes",
    name: "Staches or Lashes",
    description: "Fun mustache and eyelash motifs.",
    heroImageName: "champagne-skyline-hero.jpeg", // Placeholder
    heroMood: "Modern & Playful",
    menu: [...genderRevealMenu],
    variations: buildStories(
      "staches-or-lashes",
      "sans-classic-center",
      getColorStoriesForTemplate(2)
    ),
    preview: {
      coupleName: "Baby Reveal",
      dateLabel: "May 15, 2025",
      location: "Chicago, IL",
      timeLabel: "2:00 PM",
    },
    backgroundPrompt: getGenderRevealBackgroundPrompt("staches-or-lashes"),
  },
  {
    id: "prince-or-princess",
    name: "Prince or Princess",
    description: "Royal theme with crowns and tiaras.",
    heroImageName: "moonlit-terrace-hero.jpeg", // Placeholder
    heroMood: "Regal & Elegant",
    menu: [...genderRevealMenu],
    variations: buildStories(
      "prince-or-princess",
      "font-allura",
      getColorStoriesForTemplate(3)
    ),
    preview: {
      coupleName: "Baby Reveal",
      dateLabel: "May 15, 2025",
      location: "Chicago, IL",
      timeLabel: "2:00 PM",
    },
    backgroundPrompt: getGenderRevealBackgroundPrompt("prince-or-princess"),
  },
];

export const genderRevealTemplateCatalog: GenderRevealTemplateDefinition[] =
  baseGenderRevealTemplateCatalog;

type Props = {
  appliedTemplateId: string | null;
  appliedVariationId: string | null;
  onApplyTemplate: (
    template: GenderRevealTemplateDefinition,
    variation: TemplateVariation
  ) => void;
};

export default function GenderRevealTemplateGallery({
  appliedTemplateId,
  appliedVariationId,
  onApplyTemplate,
}: Props) {
  return (
    <div className="w-full max-w-7xl">
      <TemplateGallery
        templates={genderRevealTemplateCatalog as any}
        appliedTemplateId={appliedTemplateId}
        appliedVariationId={appliedVariationId}
        onApplyTemplate={(template, variation) =>
          onApplyTemplate(template as GenderRevealTemplateDefinition, variation)
        }
      />
    </div>
  );
}
