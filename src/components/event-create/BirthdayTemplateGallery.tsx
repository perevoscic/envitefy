"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import TemplateGallery, {
  type TemplateGalleryTemplate,
  type TemplateGalleryVariation,
  type ResolvedTemplateVariation,
} from "./TemplateGallery";
import {
  type TemplateFontTokenId,
  type TemplatePaletteTokenId,
} from "./templateDesignTokens";

const birthdayMenu = ["Home", "Party Details", "Photos", "Wishlist", "RSVP"];

export type BirthdayTemplateDefinition = TemplateGalleryTemplate & {
  preview?: {
    birthdayName: string;
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

// Kid-friendly fonts for birthdays - bigger, bolder, more playful
const BIRTHDAY_FONT_ASSIGNMENTS: Record<string, TemplateFontTokenId> = {
  "party-pop": "font-pacifico", // Bold brush script
  "candy-dreams": "font-cookie", // Soft friendly script
  "rainbow-bash": "font-yellowtail", // Retro brush script
  "playful-pals": "font-shadows-into-light", // Handwritten style
  "birthday-burst": "font-indie-flower", // Casual handwritten
  "sweet-celebration": "font-kalam", // Flowing handwriting
  "super-star": "font-great-vibes", // Beautifully flowing script
  "happy-dance": "font-dancing-script", // Lively bouncing script
  "magic-sparkle": "font-satisfy", // Charming handwriting
  "celebration-time": "font-niconne", // Playful yet elegant
  "fun-fiesta": "font-kaushan-script", // Assertive yet elegant
  "joyful-jamboree": "font-allura", // Clean and legible script
  "whimsical-wonder": "font-arizonia", // Flowing sign-painter style
  "cheerful-chaos": "font-rouge-script", // Loose, stylish handwritten
  "party-parade": "font-alex-brush", // Flowing brush script
  "birthday-bliss": "font-parisienne", // Casual connecting script
  "sparkle-splash": "font-tangerine", // Elegant calligraphic style
  "celebration-craze": "font-mr-de-haviland", // Classic cursive with flourish
  "happy-hooray": "font-sacramento", // Refined thin cursive
  "party-palooza": "font-yesteryear", // Vintage flat nib script
  "birthday-bonanza": "font-bilbo-swash-caps", // Decorative with bold swashes
  "sweet-surprise": "font-la-belle-aurore", // Delicate cursive
  "party-perfect": "font-beth-ellen", // Relaxed handwritten style
  "birthday-bash": "font-mrs-saint-delafield", // Ornate formal script
};

// Bright, playful color palettes for birthdays
const BIRTHDAY_COLOR_STORIES: StoryConfig[] = [
  {
    key: "birthday-bright",
    paletteId: "birthday-bright",
    label: "Birthday Bright",
    tagline: "Vibrant party colors",
  },
  {
    key: "rainbow-fun",
    paletteId: "rainbow-fun",
    label: "Rainbow Fun",
    tagline: "Colorful celebration",
  },
  {
    key: "ocean-splash",
    paletteId: "ocean-splash",
    label: "Ocean Splash",
    tagline: "Cool & refreshing",
  },
  {
    key: "sunshine-yellow",
    paletteId: "sunshine-yellow",
    label: "Sunshine Yellow",
    tagline: "Cheerful & bright",
  },
  {
    key: "purple-magic",
    paletteId: "purple-magic",
    label: "Purple Magic",
    tagline: "Magical & fun",
  },
  {
    key: "green-garden-party",
    paletteId: "green-garden-party",
    label: "Green Garden Party",
    tagline: "Fresh & lively",
  },
  {
    key: "candy-pink",
    paletteId: "blush-champagne",
    label: "Candy Pink",
    tagline: "Sweet & playful",
  },
  {
    key: "coral-party",
    paletteId: "sunset-coral",
    label: "Coral Party",
    tagline: "Vibrant celebration",
  },
];

// Helper to rotate color stories so each template shows a different default color
const getColorStoriesForTemplate = (index: number): StoryConfig[] => {
  const rotated = [...BIRTHDAY_COLOR_STORIES];
  // Rotate the array so each template starts with a different color
  const startIndex = index % rotated.length;
  return [...rotated.slice(startIndex), ...rotated.slice(0, startIndex)];
};

const baseBirthdayTemplateCatalog: BirthdayTemplateDefinition[] = [
  {
    id: "party-pop",
    name: "Party Pop",
    description:
      "Bold, playful design with bright colors perfect for kids' birthday celebrations.",
    heroImageName: "midnight-bloom-hero.jpeg", // Will need birthday-specific images later
    heroMood: "Fun & Festive",
    menu: [...birthdayMenu],
    variations: buildStories(
      "party-pop",
      BIRTHDAY_FONT_ASSIGNMENTS["party-pop"],
      getColorStoriesForTemplate(0) // Starts with Birthday Bright (pink)
    ),
    preview: {
      birthdayName: "Emma",
      dateLabel: "June 15, 2025",
      location: "Chicago, IL",
    },
  },
  {
    id: "candy-dreams",
    name: "Candy Dreams",
    description:
      "Sweet and whimsical with soft, friendly fonts that kids will love.",
    heroImageName: "midnight-bloom-hero.jpeg",
    heroMood: "Sweet & Whimsical",
    menu: [...birthdayMenu],
    variations: buildStories(
      "candy-dreams",
      BIRTHDAY_FONT_ASSIGNMENTS["candy-dreams"],
      getColorStoriesForTemplate(1) // Starts with Rainbow Fun (multi-color)
    ),
    preview: {
      birthdayName: "Lucas",
      dateLabel: "July 22, 2025",
      location: "Los Angeles, CA",
    },
  },
  {
    id: "rainbow-bash",
    name: "Rainbow Bash",
    description:
      "Vibrant and energetic with retro brush script for maximum fun.",
    heroImageName: "midnight-bloom-hero.jpeg",
    heroMood: "Vibrant & Energetic",
    menu: [...birthdayMenu],
    variations: buildStories(
      "rainbow-bash",
      BIRTHDAY_FONT_ASSIGNMENTS["rainbow-bash"],
      getColorStoriesForTemplate(2) // Starts with Ocean Splash (blue)
    ),
    preview: {
      birthdayName: "Sophia",
      dateLabel: "August 10, 2025",
      location: "New York, NY",
    },
  },
  {
    id: "playful-pals",
    name: "Playful Pals",
    description:
      "Casual and friendly handwritten style that feels approachable and fun.",
    heroImageName: "midnight-bloom-hero.jpeg",
    heroMood: "Casual & Friendly",
    menu: [...birthdayMenu],
    variations: buildStories(
      "playful-pals",
      BIRTHDAY_FONT_ASSIGNMENTS["playful-pals"],
      getColorStoriesForTemplate(3) // Starts with Sunshine Yellow
    ),
    preview: {
      birthdayName: "Mason",
      dateLabel: "September 5, 2025",
      location: "Austin, TX",
    },
  },
  {
    id: "birthday-burst",
    name: "Birthday Burst",
    description:
      "Relaxed and cheerful with a handwritten feel perfect for any age.",
    heroImageName: "midnight-bloom-hero.jpeg",
    heroMood: "Relaxed & Cheerful",
    menu: [...birthdayMenu],
    variations: buildStories(
      "birthday-burst",
      BIRTHDAY_FONT_ASSIGNMENTS["birthday-burst"],
      getColorStoriesForTemplate(4) // Starts with Purple Magic
    ),
    preview: {
      birthdayName: "Olivia",
      dateLabel: "October 12, 2025",
      location: "Seattle, WA",
    },
  },
  {
    id: "sweet-celebration",
    name: "Sweet Celebration",
    description:
      "Flowing handwriting style that's readable and fun for all ages.",
    heroImageName: "midnight-bloom-hero.jpeg",
    heroMood: "Flowing & Fun",
    menu: [...birthdayMenu],
    variations: buildStories(
      "sweet-celebration",
      BIRTHDAY_FONT_ASSIGNMENTS["sweet-celebration"],
      getColorStoriesForTemplate(5) // Starts with Green Garden Party
    ),
    preview: {
      birthdayName: "Noah",
      dateLabel: "November 8, 2025",
      location: "Miami, FL",
    },
  },
  {
    id: "super-star",
    name: "Super Star",
    description:
      "Elegant flowing script that makes every birthday feel like a star-studded celebration.",
    heroImageName: "midnight-bloom-hero.jpeg",
    heroMood: "Elegant & Celebratory",
    menu: [...birthdayMenu],
    variations: buildStories(
      "super-star",
      BIRTHDAY_FONT_ASSIGNMENTS["super-star"],
      getColorStoriesForTemplate(6) // Starts with Candy Pink
    ),
    preview: {
      birthdayName: "Ava",
      dateLabel: "December 3, 2025",
      location: "Denver, CO",
    },
  },
  {
    id: "happy-dance",
    name: "Happy Dance",
    description:
      "Lively bouncing script that brings energy and joy to any birthday party.",
    heroImageName: "midnight-bloom-hero.jpeg",
    heroMood: "Energetic & Joyful",
    menu: [...birthdayMenu],
    variations: buildStories(
      "happy-dance",
      BIRTHDAY_FONT_ASSIGNMENTS["happy-dance"],
      getColorStoriesForTemplate(7) // Starts with Coral Party
    ),
    preview: {
      birthdayName: "Ethan",
      dateLabel: "January 18, 2026",
      location: "Portland, OR",
    },
  },
  {
    id: "magic-sparkle",
    name: "Magic Sparkle",
    description:
      "Charming handwriting style that adds a touch of magic to your celebration.",
    heroImageName: "midnight-bloom-hero.jpeg",
    heroMood: "Charming & Magical",
    menu: [...birthdayMenu],
    variations: buildStories(
      "magic-sparkle",
      BIRTHDAY_FONT_ASSIGNMENTS["magic-sparkle"],
      getColorStoriesForTemplate(0) // Starts with Birthday Bright
    ),
    preview: {
      birthdayName: "Isabella",
      dateLabel: "February 14, 2026",
      location: "Nashville, TN",
    },
  },
  {
    id: "celebration-time",
    name: "Celebration Time",
    description:
      "Playful yet elegant script perfect for making every moment feel special.",
    heroImageName: "midnight-bloom-hero.jpeg",
    heroMood: "Playful & Special",
    menu: [...birthdayMenu],
    variations: buildStories(
      "celebration-time",
      BIRTHDAY_FONT_ASSIGNMENTS["celebration-time"],
      getColorStoriesForTemplate(1) // Starts with Rainbow Fun
    ),
    preview: {
      birthdayName: "Jackson",
      dateLabel: "March 22, 2026",
      location: "Phoenix, AZ",
    },
  },
  {
    id: "fun-fiesta",
    name: "Fun Fiesta",
    description:
      "Bold and dynamic script that brings the party energy from the first glance.",
    heroImageName: "midnight-bloom-hero.jpeg",
    heroMood: "Bold & Dynamic",
    menu: [...birthdayMenu],
    variations: buildStories(
      "fun-fiesta",
      BIRTHDAY_FONT_ASSIGNMENTS["fun-fiesta"],
      getColorStoriesForTemplate(2) // Starts with Ocean Splash
    ),
    preview: {
      birthdayName: "Lily",
      dateLabel: "April 9, 2026",
      location: "San Diego, CA",
    },
  },
  {
    id: "joyful-jamboree",
    name: "Joyful Jamboree",
    description:
      "Clean and legible script with elegant flourishes for a polished party look.",
    heroImageName: "midnight-bloom-hero.jpeg",
    heroMood: "Clean & Polished",
    menu: [...birthdayMenu],
    variations: buildStories(
      "joyful-jamboree",
      BIRTHDAY_FONT_ASSIGNMENTS["joyful-jamboree"],
      getColorStoriesForTemplate(3) // Starts with Sunshine Yellow
    ),
    preview: {
      birthdayName: "Carter",
      dateLabel: "May 25, 2026",
      location: "Boston, MA",
    },
  },
  {
    id: "whimsical-wonder",
    name: "Whimsical Wonder",
    description:
      "Flowing decorative style that captures the wonder and excitement of birthdays.",
    heroImageName: "midnight-bloom-hero.jpeg",
    heroMood: "Whimsical & Exciting",
    menu: [...birthdayMenu],
    variations: buildStories(
      "whimsical-wonder",
      BIRTHDAY_FONT_ASSIGNMENTS["whimsical-wonder"],
      getColorStoriesForTemplate(4) // Starts with Purple Magic
    ),
    preview: {
      birthdayName: "Zoe",
      dateLabel: "June 30, 2026",
      location: "Atlanta, GA",
    },
  },
  {
    id: "cheerful-chaos",
    name: "Cheerful Chaos",
    description:
      "Loose and stylish handwritten style that's fun, relaxed, and full of personality.",
    heroImageName: "midnight-bloom-hero.jpeg",
    heroMood: "Relaxed & Personality",
    menu: [...birthdayMenu],
    variations: buildStories(
      "cheerful-chaos",
      BIRTHDAY_FONT_ASSIGNMENTS["cheerful-chaos"],
      getColorStoriesForTemplate(5) // Starts with Green Garden Party
    ),
    preview: {
      birthdayName: "Maya",
      dateLabel: "July 15, 2026",
      location: "Dallas, TX",
    },
  },
  {
    id: "party-parade",
    name: "Party Parade",
    description:
      "Flowing brush script that's perfect for names and makes every invitation feel special.",
    heroImageName: "midnight-bloom-hero.jpeg",
    heroMood: "Flowing & Special",
    menu: [...birthdayMenu],
    variations: buildStories(
      "party-parade",
      BIRTHDAY_FONT_ASSIGNMENTS["party-parade"],
      getColorStoriesForTemplate(6) // Starts with Candy Pink
    ),
    preview: {
      birthdayName: "Harper",
      dateLabel: "August 20, 2026",
      location: "Las Vegas, NV",
    },
  },
  {
    id: "birthday-bliss",
    name: "Birthday Bliss",
    description:
      "Casual connecting script with a vintage feel that brings warmth to any celebration.",
    heroImageName: "midnight-bloom-hero.jpeg",
    heroMood: "Casual & Warm",
    menu: [...birthdayMenu],
    variations: buildStories(
      "birthday-bliss",
      BIRTHDAY_FONT_ASSIGNMENTS["birthday-bliss"],
      getColorStoriesForTemplate(7) // Starts with Coral Party
    ),
    preview: {
      birthdayName: "Logan",
      dateLabel: "September 5, 2026",
      location: "Minneapolis, MN",
    },
  },
  {
    id: "sparkle-splash",
    name: "Sparkle Splash",
    description:
      "Elegant calligraphic style with tall ascenders that adds sophistication to the fun.",
    heroImageName: "midnight-bloom-hero.jpeg",
    heroMood: "Elegant & Sophisticated",
    menu: [...birthdayMenu],
    variations: buildStories(
      "sparkle-splash",
      BIRTHDAY_FONT_ASSIGNMENTS["sparkle-splash"],
      getColorStoriesForTemplate(0) // Starts with Birthday Bright
    ),
    preview: {
      birthdayName: "Chloe",
      dateLabel: "October 1, 2026",
      location: "Charlotte, NC",
    },
  },
  {
    id: "celebration-craze",
    name: "Celebration Craze",
    description:
      "Classic cursive with beautiful flourishes that's perfect for making names stand out.",
    heroImageName: "midnight-bloom-hero.jpeg",
    heroMood: "Classic & Flourished",
    menu: [...birthdayMenu],
    variations: buildStories(
      "celebration-craze",
      BIRTHDAY_FONT_ASSIGNMENTS["celebration-craze"],
      getColorStoriesForTemplate(1) // Starts with Rainbow Fun
    ),
    preview: {
      birthdayName: "Aiden",
      dateLabel: "November 12, 2026",
      location: "Detroit, MI",
    },
  },
  {
    id: "happy-hooray",
    name: "Happy Hooray",
    description:
      "Refined thin cursive that's formal yet readable, perfect for elegant celebrations.",
    heroImageName: "midnight-bloom-hero.jpeg",
    heroMood: "Refined & Elegant",
    menu: [...birthdayMenu],
    variations: buildStories(
      "happy-hooray",
      BIRTHDAY_FONT_ASSIGNMENTS["happy-hooray"],
      getColorStoriesForTemplate(2) // Starts with Ocean Splash
    ),
    preview: {
      birthdayName: "Grace",
      dateLabel: "December 25, 2026",
      location: "Orlando, FL",
    },
  },
  {
    id: "party-palooza",
    name: "Party Palooza",
    description:
      "Vintage flat nib connecting script that brings retro charm to modern celebrations.",
    heroImageName: "midnight-bloom-hero.jpeg",
    heroMood: "Vintage & Charming",
    menu: [...birthdayMenu],
    variations: buildStories(
      "party-palooza",
      BIRTHDAY_FONT_ASSIGNMENTS["party-palooza"],
      getColorStoriesForTemplate(3) // Starts with Sunshine Yellow
    ),
    preview: {
      birthdayName: "Lucas",
      dateLabel: "January 7, 2027",
      location: "San Francisco, CA",
    },
  },
  {
    id: "birthday-bonanza",
    name: "Birthday Bonanza",
    description:
      "Decorative script with bold swashes that makes a dramatic statement.",
    heroImageName: "midnight-bloom-hero.jpeg",
    heroMood: "Decorative & Dramatic",
    menu: [...birthdayMenu],
    variations: buildStories(
      "birthday-bonanza",
      BIRTHDAY_FONT_ASSIGNMENTS["birthday-bonanza"],
      getColorStoriesForTemplate(4) // Starts with Purple Magic
    ),
    preview: {
      birthdayName: "Riley",
      dateLabel: "February 18, 2027",
      location: "Philadelphia, PA",
    },
  },
  {
    id: "sweet-surprise",
    name: "Sweet Surprise",
    description:
      "Delicate cursive that's soft and elegant, perfect for intimate celebrations.",
    heroImageName: "midnight-bloom-hero.jpeg",
    heroMood: "Delicate & Intimate",
    menu: [...birthdayMenu],
    variations: buildStories(
      "sweet-surprise",
      BIRTHDAY_FONT_ASSIGNMENTS["sweet-surprise"],
      getColorStoriesForTemplate(5) // Starts with Green Garden Party
    ),
    preview: {
      birthdayName: "Madison",
      dateLabel: "March 3, 2027",
      location: "Houston, TX",
    },
  },
  {
    id: "party-perfect",
    name: "Party Perfect",
    description:
      "Relaxed handwritten style that's less formal but full of charm and personality.",
    heroImageName: "midnight-bloom-hero.jpeg",
    heroMood: "Relaxed & Charming",
    menu: [...birthdayMenu],
    variations: buildStories(
      "party-perfect",
      BIRTHDAY_FONT_ASSIGNMENTS["party-perfect"],
      getColorStoriesForTemplate(0) // Starts with Birthday Bright
    ),
    preview: {
      birthdayName: "Hunter",
      dateLabel: "June 10, 2027",
      location: "Milwaukee, WI",
    },
  },
  {
    id: "birthday-bash",
    name: "Birthday Bash",
    description:
      "Ornate script with formal flourishes that makes every celebration feel grand.",
    heroImageName: "midnight-bloom-hero.jpeg",
    heroMood: "Ornate & Grand",
    menu: [...birthdayMenu],
    variations: buildStories(
      "birthday-bash",
      BIRTHDAY_FONT_ASSIGNMENTS["birthday-bash"],
      getColorStoriesForTemplate(1) // Starts with Rainbow Fun
    ),
    preview: {
      birthdayName: "Victoria",
      dateLabel: "July 22, 2027",
      location: "Baltimore, MD",
    },
  },
];

export const birthdayTemplateCatalog: BirthdayTemplateDefinition[] =
  baseBirthdayTemplateCatalog;

type Props = {
  appliedTemplateId: string | null;
  appliedVariationId: string | null;
  showColorStories?: boolean;
  onApplyTemplate: (
    template: BirthdayTemplateDefinition,
    variation: TemplateVariation
  ) => void;
};

export default function BirthdayTemplateGallery({
  appliedTemplateId,
  appliedVariationId,
  showColorStories = true,
  onApplyTemplate,
}: Props) {
  const [customHeroImage, setCustomHeroImage] = useState<string | null>(null);

  return (
    <div className="w-full max-w-7xl">
      <TemplateGallery
        templates={birthdayTemplateCatalog as any}
        appliedTemplateId={appliedTemplateId}
        appliedVariationId={appliedVariationId}
        onApplyTemplate={(template, variation) =>
          onApplyTemplate(template as BirthdayTemplateDefinition, variation)
        }
        previewHeroImageUrl={customHeroImage}
      />
    </div>
  );
}
