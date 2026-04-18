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
  ],
  "Game Day": [
    { label: "Stadium Lights", description: "dramatic, high-energy sports look" },
    { label: "Team Spirit", description: "bold colors, crowd excitement" },
    { label: "Action Freeze", description: "sharp motion, intense highlights" },
    { label: "Victory Night", description: "cinematic, competitive atmosphere" },
    { label: "Electric Arena", description: "vibrant, modern sports poster feel" },
  ],
  Wedding: [
    { label: "Timeless Romance", description: "soft, elegant, classic wedding look" },
    { label: "Editorial Luxe", description: "polished, fashion-inspired finish" },
    { label: "Golden Hour", description: "warm sunlight, dreamy and intimate" },
    { label: "Moody Vows", description: "dark, rich, cinematic romance" },
    { label: "Soft Ivory", description: "airy, refined, minimal luxury" },
  ],
  "Bridal Shower": [
    { label: "Garden Brunch", description: "floral, light, feminine" },
    { label: "Champagne Blush", description: "soft pinks, upscale gathering" },
    { label: "Parisian Tea", description: "chic, delicate, elegant" },
    { label: "Modern Bloom", description: "fresh florals with clean styling" },
    { label: "Sweet Pastel", description: "charming, bright, celebratory" },
  ],
  "Baby Shower": [
    { label: "Cloud Soft", description: "gentle, airy, dreamy" },
    { label: "Tiny Bloom", description: "soft florals and delicate tones" },
    { label: "Storybook Baby", description: "whimsical, warm, classic" },
    { label: "Modern Pastel", description: "clean, trendy, soft color palette" },
    { label: "Bundle of Joy", description: "bright, happy, welcoming" },
  ],
  "Field Trip/Day": [
    { label: "Sunny Learning", description: "cheerful, bright, educational" },
    { label: "Adventure Scrapbook", description: "playful, memory-book feel" },
    { label: "Classroom Pop", description: "colorful, youthful, energetic" },
    { label: "Nature Explorer", description: "outdoorsy, fresh, discovery tone" },
    { label: "Clean Academic", description: "simple, organized, school-friendly" },
  ],
  Anniversary: [
    { label: "Romantic Velvet", description: "rich, deep, intimate" },
    { label: "Soft Candlelight", description: "warm glow, elegant romance" },
    { label: "Classic Gold", description: "timeless and celebratory" },
    { label: "Blush & Pearl", description: "soft, refined, delicate" },
    { label: "Evening Elegance", description: "moody, elevated, luxurious" },
  ],
  Housewarming: [
    { label: "Cozy Modern", description: "warm, inviting, clean" },
    { label: "Natural Light Home", description: "bright, airy, lifestyle look" },
    { label: "Warm Minimalist", description: "neutral, polished, modern" },
    { label: "Rustic Welcome", description: "earthy, charming, homey" },
    { label: "Urban Nest", description: "stylish, contemporary, upbeat" },
  ],
  "Custom Invite": [
    { label: "Modern Minimal", description: "clean, versatile, premium" },
    { label: "Bold Statement", description: "strong contrast, attention-grabbing" },
    { label: "Soft Editorial", description: "elegant and flexible" },
    { label: "Cinematic Mood", description: "rich tones, dramatic finish" },
    { label: "Vibrant Celebration", description: "colorful, lively, adaptable" },
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
