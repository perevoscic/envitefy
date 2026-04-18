export type StudioImageFinishPresetCategory =
  | "Birthday"
  | "Field Trip/Day"
  | "Game Day"
  | "Bridal Shower"
  | "Wedding"
  | "Housewarming"
  | "Baby Shower"
  | "Anniversary"
  | "Custom Invite";

export type StudioImageFinishPreset = {
  label: string;
  description: string;
};

export const STUDIO_IMAGE_FINISH_PRESETS: Record<
  StudioImageFinishPresetCategory,
  StudioImageFinishPreset[]
> = {
  Birthday: [
    { label: "Playful Pastels", description: "soft, colorful, cheerful" },
    { label: "Candy Pop", description: "bright, punchy, fun party energy" },
    { label: "Golden Glow", description: "warm light, elegant celebration" },
    { label: "Confetti Dream", description: "whimsical, festive, airy" },
    { label: "Neon Party", description: "bold contrast, modern birthday vibe" },
    { label: "Space Quest", description: "cosmic galaxy mission with starfield, planets, and astronaut adventure energy" },
    { label: "Unicorn Dust", description: "iridescent pastels, holographic glitter, magical unicorn whimsy" },
    { label: "Superhero Comic", description: "halftone comic-book panels, action-packed superhero ink and pop colors" },
    { label: "Safari Explorer", description: "warm savanna sunset, adventure expedition props, friendly safari wildlife" },
    { label: "Dino Jungle", description: "lush prehistoric jungle, playful dinosaur party styling, leafy adventure energy" },
  ],
  "Game Day": [
    { label: "Stadium Lights", description: "dramatic, high-energy sports look" },
    { label: "Team Spirit", description: "bold colors, crowd excitement" },
    { label: "Action Freeze", description: "sharp motion, intense highlights" },
    { label: "Victory Night", description: "cinematic, competitive atmosphere" },
    { label: "Electric Arena", description: "vibrant, modern sports poster feel" },
    { label: "Tailgate Glow", description: "sunset parking-lot tailgate energy with warm grill light and pennant flags" },
    { label: "Halftime Hype", description: "marching band brass, drumline rhythm, mid-game pep-rally electricity" },
    { label: "Locker Room Grit", description: "moody locker-room contrast, raw athletic textures, pre-game focus" },
    { label: "Championship Gold", description: "trophy-glow gold accents, confetti rain, victory-lap celebration polish" },
  ],
  Wedding: [
    { label: "Timeless Romance", description: "soft, elegant, classic wedding look" },
    { label: "Editorial Luxe", description: "polished, fashion-inspired finish" },
    { label: "Golden Hour", description: "warm sunlight, dreamy and intimate" },
    { label: "Moody Vows", description: "dark, rich, cinematic romance" },
    { label: "Soft Ivory", description: "airy, refined, minimal luxury" },
    { label: "Coastal Elopement", description: "ocean-side breeze, salt-air linen, barefoot beach ceremony romance" },
    { label: "Garden Estate", description: "lush manicured gardens, climbing florals, statuesque estate elegance" },
    { label: "Vintage Veil", description: "heirloom lace, antique stationery, soft sepia heritage romance" },
    { label: "Modern Monochrome", description: "architectural lines, crisp black-tie minimalism, gallery-grade contrast" },
  ],
  "Bridal Shower": [
    { label: "Garden Brunch", description: "floral, light, feminine" },
    { label: "Champagne Blush", description: "soft pinks, upscale gathering" },
    { label: "Parisian Tea", description: "chic, delicate, elegant" },
    { label: "Modern Bloom", description: "fresh florals with clean styling" },
    { label: "Sweet Pastel", description: "charming, bright, celebratory" },
    { label: "Cottage Romance", description: "cozy cottage florals, hand-tied bouquets, hostess-pampered styling" },
    { label: "Tropical Bride", description: "lush palm fronds, hibiscus brights, beach-club bridal energy" },
    { label: "Boho Lace", description: "macramé textures, pampas grass, sun-washed boho bridal poetry" },
    { label: "City Soirée", description: "rooftop skyline glamour, neon-lit cocktails, modern downtown bridal night" },
  ],
  "Baby Shower": [
    { label: "Cloud Soft", description: "gentle, airy, dreamy" },
    { label: "Tiny Bloom", description: "soft florals and delicate tones" },
    { label: "Storybook Baby", description: "whimsical, warm, classic" },
    { label: "Modern Pastel", description: "clean, trendy, soft color palette" },
    { label: "Bundle of Joy", description: "bright, happy, welcoming" },
    { label: "Little Safari", description: "soft jungle pals, woven textures, playful safari nursery cues" },
    { label: "Twinkle Stars", description: "midnight blue, glowing constellations, bedtime nursery magic" },
    { label: "Woodland Hush", description: "muted forest greens, fox and bunny accents, storybook woodland calm" },
    { label: "Sweet Sherbet", description: "creamy peach, mint, and lavender sherbet hues with airy garlands" },
  ],
  "Field Trip/Day": [
    { label: "Sunny Learning", description: "cheerful, bright, educational" },
    { label: "Adventure Scrapbook", description: "playful, memory-book feel" },
    { label: "Classroom Pop", description: "colorful, youthful, energetic" },
    { label: "Nature Explorer", description: "outdoorsy, fresh, discovery tone" },
    { label: "Clean Academic", description: "simple, organized, school-friendly" },
    { label: "Museum Wonder", description: "polished gallery lighting, exhibit signage, curious museum-quest energy" },
    { label: "Trail Trek", description: "backpack-ready trail textures, leafy canopy, junior-ranger expedition mood" },
    { label: "Science Lab", description: "bright lab beakers, periodic-table accents, hands-on STEM discovery vibe" },
    { label: "City Discovery", description: "skyline backdrops, transit map textures, downtown field-trip pace" },
  ],
  Anniversary: [
    { label: "Romantic Velvet", description: "rich, deep, intimate" },
    { label: "Soft Candlelight", description: "warm glow, elegant romance" },
    { label: "Classic Gold", description: "timeless and celebratory" },
    { label: "Blush & Pearl", description: "soft, refined, delicate" },
    { label: "Evening Elegance", description: "moody, elevated, luxurious" },
    { label: "Silver Milestone", description: "polished silver shimmer, crystal toast, milestone-anniversary refinement" },
    { label: "Vintage Romance", description: "sepia photo edges, old-world script, decades-of-love nostalgia" },
    { label: "Garden Renewal", description: "rose garden lattice, vow-renewal blossoms, tender afternoon glow" },
    { label: "Ballroom Glow", description: "grand ballroom chandeliers, mirrored toasts, formal anniversary glamour" },
  ],
  Housewarming: [
    { label: "Cozy Modern", description: "warm, inviting, clean" },
    { label: "Natural Light Home", description: "bright, airy, lifestyle look" },
    { label: "Warm Minimalist", description: "neutral, polished, modern" },
    { label: "Rustic Welcome", description: "earthy, charming, homey" },
    { label: "Urban Nest", description: "stylish, contemporary, upbeat" },
    { label: "Garden Patio", description: "string-light patio, potted greenery, golden-hour backyard hosting" },
    { label: "Loft Industrial", description: "exposed brick, edison bulbs, modern-loft housewarming polish" },
    { label: "Mid-Century Bright", description: "walnut warmth, mustard accents, mid-century styled hosting" },
    { label: "Coastal Cottage", description: "breezy linens, weathered woods, calming coastal welcome" },
  ],
  "Custom Invite": [
    { label: "Modern Minimal", description: "clean, versatile, premium" },
    { label: "Bold Statement", description: "strong contrast, attention-grabbing" },
    { label: "Soft Editorial", description: "elegant and flexible" },
    { label: "Cinematic Mood", description: "rich tones, dramatic finish" },
    { label: "Vibrant Celebration", description: "colorful, lively, adaptable" },
    { label: "Retro Throwback", description: "vintage poster typography, halftone dots, nostalgic event flair" },
    { label: "Luxe Noir", description: "midnight black, gold foil accents, after-dark formal mystery" },
    { label: "Hand-Drawn Charm", description: "loose ink illustrations, watercolor washes, personal hand-crafted warmth" },
    { label: "Festival Pop", description: "high-energy festival posters, layered patterns, crowd-ready brights" },
  ],
};

function clean(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeValue(value: string | null | undefined): string {
  return clean(value).toLowerCase();
}

export function getStudioImageFinishPresets(
  category: string | null | undefined,
): StudioImageFinishPreset[] {
  const normalizedCategory = clean(category) as StudioImageFinishPresetCategory;
  return STUDIO_IMAGE_FINISH_PRESETS[normalizedCategory] ?? [];
}

export function resolveStudioImageFinishPreset(
  category: string | null | undefined,
  label: string | null | undefined,
): StudioImageFinishPreset | null {
  const normalizedLabel = normalizeValue(label);
  if (!normalizedLabel) return null;
  return (
    getStudioImageFinishPresets(category).find(
      (preset) => normalizeValue(preset.label) === normalizedLabel,
    ) ?? null
  );
}
