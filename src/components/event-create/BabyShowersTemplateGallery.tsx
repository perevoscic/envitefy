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
  };
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

const baseBabyShowerTemplateCatalog: BabyShowerTemplateDefinition[] = [
  {
    id: "blush-bouquet",
    name: "Blush Bouquet",
    description:
      "Romantic watercolor washes and delicate script set a gentle welcome for baby's big day.",
    heroImageName: "garden-atelier-hero.jpeg",
    heroMood: "Soft & Floral",
    menu: [...babyShowerMenu],
    variations: buildStories(
      "blush-bouquet",
      "font-allura",
      getColorStoriesForTemplate(0)
    ),
    preview: {
      coupleName: "Baby Avery",
      dateLabel: "April 12, 2025",
      location: "Nashville, TN",
    },
  },
  {
    id: "twinkle-sky",
    name: "Twinkle Sky",
    description:
      "Dreamy twilight gradients with starlight typography for sprinkles under the stars.",
    heroImageName: "moonlit-terrace-hero.jpeg",
    heroMood: "Dreamy & Celestial",
    menu: [...babyShowerMenu],
    variations: buildStories(
      "twinkle-sky",
      "font-parisienne",
      getColorStoriesForTemplate(1)
    ),
    preview: {
      coupleName: "Baby Liam",
      dateLabel: "May 4, 2025",
      location: "Seattle, WA",
    },
  },
  {
    id: "sage-celebration",
    name: "Sage Celebration",
    description:
      "Modern serif typography with botanical palettes for a gender-neutral gathering.",
    heroImageName: "evergreen-ballroom-hero.jpeg",
    heroMood: "Fresh & Botanical",
    menu: [...babyShowerMenu],
    variations: buildStories(
      "sage-celebration",
      "sans-classic-center",
      getColorStoriesForTemplate(2)
    ),
    preview: {
      coupleName: "Baby Harper",
      dateLabel: "June 1, 2025",
      location: "Portland, OR",
    },
  },
  {
    id: "citrus-splash",
    name: "Citrus Splash",
    description:
      "Bright, sunlit gradients inspired by backyard brunches and playful sprinkles.",
    heroImageName: "champagne-skyline-hero.jpeg",
    heroMood: "Warm & Playful",
    menu: [...babyShowerMenu],
    variations: buildStories(
      "citrus-splash",
      "font-pacifico",
      getColorStoriesForTemplate(3)
    ),
    preview: {
      coupleName: "Baby Maya",
      dateLabel: "July 20, 2025",
      location: "Austin, TX",
    },
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
