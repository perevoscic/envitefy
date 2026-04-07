import {
  Cake,
  CalendarDays,
  Gift,
  Heart,
  Home,
  MapPin,
  PartyPopper,
  WandSparkles,
} from "lucide-react";

import { svgThumbnail } from "./studio-birthday-preset-data";
import type { InviteCategory, Preset } from "./studio-workspace-types";

function preset(
  id: string,
  category: InviteCategory,
  name: string,
  description: string,
  icon: Preset["icon"],
  from: string,
  to: string,
): Preset {
  return {
    id,
    category,
    name,
    description,
    icon,
    thumbnail: svgThumbnail(name, from, to),
  };
}

export const STUDIO_WORKSPACE_PRESETS: Preset[] = [
  ...[
    preset("wedding-classic-romance", "Wedding", "Classic Romance", "Ivory, gold, and soft rose editorial.", Heart, "#fdf2f8", "#f59e0b"),
    preset("wedding-modern-minimal", "Wedding", "Modern Minimal", "Clean monochrome with a single accent.", WandSparkles, "#f8fafc", "#111827"),
    preset("wedding-garden-airy", "Wedding", "Garden Airy", "Greenery, linen, and daylight elegance.", Gift, "#dcfce7", "#f9a8d4"),
    preset("wedding-coastal-blue", "Wedding", "Coastal Blue", "Ocean blues with breezy resort polish.", PartyPopper, "#38bdf8", "#f8fafc"),
    preset("wedding-art-deco", "Wedding", "Art Deco Night", "Black, gold, and geometric glamour.", WandSparkles, "#111827", "#ca8a04"),
    preset("wedding-rustic-barn", "Wedding", "Rustic Barn", "Warm wood tones and wildflower charm.", Cake, "#92400e", "#fde68a"),
  ],
  ...[
    preset("baby-soft-cloud", "Baby Shower", "Soft Cloud", "Powder blue, cream, and gentle balloons.", WandSparkles, "#e0f2fe", "#fce7f3"),
    preset("baby-botanical", "Baby Shower", "Botanical Neutral", "Sage greens with modern nursery calm.", Gift, "#bbf7d0", "#fef3c7"),
    preset("baby-storybook", "Baby Shower", "Storybook Pastel", "Watercolor storybook softness.", Heart, "#ddd6fe", "#fbcfe8"),
    preset("baby-teddy-classic", "Baby Shower", "Teddy Classic", "Warm browns with cozy plush cues.", PartyPopper, "#78350f", "#fde68a"),
    preset("baby-moon-stars", "Baby Shower", "Moon & Stars", "Navy sky with dreamy starlight.", WandSparkles, "#0f172a", "#c4b5fd"),
    preset("baby-citrus-pop", "Baby Shower", "Citrus Pop", "Bright citrus with playful energy.", Cake, "#facc15", "#fb923c"),
  ],
  ...[
    preset("bridal-tea-rose", "Bridal Shower", "Tea Rose", "Blush florals and porcelain tea service.", Heart, "#fce7f3", "#fda4af"),
    preset("bridal-champagne-brunch", "Bridal Shower", "Champagne Brunch", "Bubbly golds and brunch daylight.", WandSparkles, "#fef9c3", "#f5d0fe"),
    preset("bridal-garden-party", "Bridal Shower", "Garden Party", "Florals, trellis, and spring air.", Gift, "#86efac", "#f9a8d4"),
    preset("bridal-modern-muse", "Bridal Shower", "Modern Muse", "Sleek neutrals with a fashion edge.", PartyPopper, "#f4f4f5", "#a855f7"),
    preset("bridal-coastal-shower", "Bridal Shower", "Coastal Shower", "Sea glass tones with relaxed polish.", WandSparkles, "#99f6e4", "#e0e7ff"),
    preset("bridal-parisian", "Bridal Shower", "Parisian Chic", "Cream, black, and effortless couture.", Cake, "#fafaf9", "#111827"),
  ],
  ...[
    preset("house-open-door", "Housewarming", "Open Door", "Warm neutrals with welcoming light.", Home, "#fef3c7", "#fb923c"),
    preset("house-urban-loft", "Housewarming", "Urban Loft", "Concrete-soft tones with modern plants.", WandSparkles, "#e5e7eb", "#22c55e"),
    preset("house-backyard-bbq", "Housewarming", "Backyard BBQ", "Casual cookout reds and sunny yellows.", PartyPopper, "#dc2626", "#facc15"),
    preset("house-midnight-martini", "Housewarming", "Midnight Martini", "Deep blues with cocktail-lounge mood.", WandSparkles, "#1e3a8a", "#c4b5fd"),
    preset("house-scandi-calm", "Housewarming", "Scandi Calm", "Pale woods, soft gray, and hygge.", Gift, "#f5f5f4", "#d6d3d1"),
    preset("house-tropical-welcome", "Housewarming", "Tropical Welcome", "Palm greens with sunset warmth.", Heart, "#0f766e", "#fb923c"),
  ],
  ...[
    preset("anni-silver-gala", "Anniversary", "Silver Gala", "Cool metallics with timeless polish.", WandSparkles, "#e2e8f0", "#94a3b8"),
    preset("anni-golden-hour", "Anniversary", "Golden Hour", "Warm sunset golds for milestone nights.", Heart, "#fbbf24", "#fb7185"),
    preset("anni-vineyard-dinner", "Anniversary", "Vineyard Dinner", "Burgundy, cream, and candlelit tables.", Gift, "#7f1d1d", "#fef3c7"),
    preset("anni-jazz-night", "Anniversary", "Jazz Night", "Moody blues with brass highlights.", PartyPopper, "#1e3a8a", "#f59e0b"),
    preset("anni-paris-bistro", "Anniversary", "Paris Bistro", "Classic bistro reds and chalkboard black.", Cake, "#991b1b", "#111827"),
    preset("anni-starry-rooftop", "Anniversary", "Starry Rooftop", "Indigo sky with city sparkle.", WandSparkles, "#312e81", "#c4b5fd"),
  ],
  ...[
    preset("field-museum-day", "Field Trip/Day", "Museum Day", "Curious blues with exhibit energy.", MapPin, "#2563eb", "#fde047"),
    preset("field-nature-trail", "Field Trip/Day", "Nature Trail", "Forest greens with trail-day fun.", WandSparkles, "#166534", "#84cc16"),
    preset("field-aquarium-glow", "Field Trip/Day", "Aquarium Glow", "Teal depths with playful bubbles.", PartyPopper, "#0e7490", "#67e8f9"),
    preset("field-science-lab", "Field Trip/Day", "Science Lab", "Bright primaries with STEM spark.", Gift, "#7c3aed", "#22c55e"),
    preset("field-zoo-adventure", "Field Trip/Day", "Zoo Adventure", "Safari tones with friendly energy.", Heart, "#ca8a04", "#16a34a"),
    preset("field-history-walk", "Field Trip/Day", "History Walk", "Parchment and ink with heritage cues.", CalendarDays, "#fef3c7", "#78350f"),
  ],
  ...[
    preset("custom-editorial-mono", "Custom Invite", "Editorial Mono", "High-contrast monochrome editorial.", WandSparkles, "#fafafa", "#171717"),
    preset("custom-neon-night", "Custom Invite", "Neon Night", "Electric gradients for after-dark events.", WandSparkles, "#4c1d95", "#ec4899"),
    preset("custom-paper-craft", "Custom Invite", "Paper Craft", "Craft textures with friendly color.", Gift, "#fef9c3", "#fb923c"),
    preset("custom-watercolor-wash", "Custom Invite", "Watercolor Wash", "Soft washes with hand-painted feel.", Heart, "#e0f2fe", "#fce7f3"),
    preset("custom-bold-poster", "Custom Invite", "Bold Poster", "Poster typography with punchy blocks.", PartyPopper, "#ef4444", "#111827"),
    preset("custom-luxe-foil", "Custom Invite", "Luxe Foil", "Deep base with foil-like highlights.", Cake, "#0f172a", "#eab308"),
  ],
];
