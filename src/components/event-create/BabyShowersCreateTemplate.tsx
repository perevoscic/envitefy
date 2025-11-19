"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Baloo_2, Poppins } from "next/font/google";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Filter,
  Palette,
  Sparkles,
  Wand2,
  Baby,
  Gift,
  Share2,
  Lock,
  Users,
} from "lucide-react";
import {
  babyShowerTemplateCatalog,
  type BabyShowerTemplateDefinition,
} from "@/components/event-create/BabyShowersTemplateGallery";

type Props = { defaultDate?: Date };

type TemplateFormat = "card" | "page";
type InviteTone = "Sweet & Soft" | "Chic & Modern" | "Fun & Casual";

type BabyShowerInviteTemplate = {
  id: string;
  templateId: string;
  name: string;
  tagline: string;
  occasionTypes: string[];
  styles: string[];
  colorPalette: string[];
  tone: InviteTone;
  format: TemplateFormat;
  description: string;
  bestFor: string[];
  recommendedUse: string[];
  imagePrompt: string;
  previewImage: string;
};

type FilterState = {
  occasion: string;
  style: string;
  colorPalette: string;
  tone: InviteTone | "all";
  layout: string;
};

const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-baloo",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

const OCCASION_FILTERS = [
  { value: "all", label: "All occasions" },
  { value: "Baby Shower", label: "Baby Shower" },
  { value: "Baby Sprinkle", label: "Baby Sprinkle" },
  { value: "Gender Reveal", label: "Gender Reveal" },
  { value: "Sip & See", label: "Sip & See" },
  { value: "Co-ed Shower", label: "Co-ed Shower" },
  { value: "Virtual Shower", label: "Virtual Shower" },
];

const STYLE_FILTERS = [
  { value: "all", label: "All styles" },
  { value: "Minimal", label: "Minimal" },
  { value: "Elegant", label: "Elegant" },
  { value: "Cute & Playful", label: "Cute & Playful" },
  { value: "Boho", label: "Boho" },
  { value: "Modern", label: "Modern" },
  { value: "Photo-focused", label: "Photo-focused" },
  { value: "Illustrated", label: "Illustrated" },
];

const COLOR_PALETTE_FILTERS = [
  { value: "all", label: "All palettes" },
  { value: "Neutral", label: "Neutral" },
  { value: "Blush / Pink tones", label: "Blush / Pink" },
  { value: "Blue tones", label: "Blue tones" },
  { value: "Sage / Green", label: "Sage / Green" },
  { value: "Terracotta / Earthy", label: "Terracotta / Earthy" },
  { value: "Pastel Rainbow", label: "Pastel Rainbow" },
];

const TONE_FILTERS: Array<{ value: InviteTone | "all"; label: string }> = [
  { value: "all", label: "All tones" },
  { value: "Sweet & Soft", label: "Sweet & Soft" },
  { value: "Chic & Modern", label: "Chic & Modern" },
  { value: "Fun & Casual", label: "Fun & Casual" },
];

const LAYOUT_FILTERS = [
  { value: "all", label: "All layouts" },
  { value: "Centered card layout", label: "Centered card" },
  { value: "Full-width hero image", label: "Full-width hero" },
  { value: "Photo at top, text below", label: "Photo top" },
];

// 24 Baby Shower Templates with Image Prompts
const BABY_SHOWER_TEMPLATES: BabyShowerInviteTemplate[] = [
  {
    id: "soft-neutrals-shower",
    templateId: "soft-neutrals-shower",
    name: "Soft Neutrals Shower",
    tagline: "Gender-neutral, minimal design with warm beige tones.",
    occasionTypes: ["Baby Shower", "Baby Sprinkle", "Co-ed Shower"],
    styles: ["Minimal"],
    colorPalette: ["Neutral"],
    tone: "Sweet & Soft",
    format: "page",
    description:
      "A warm, minimal design using beige, cream, and soft taupe. Simple shapes, generous white space, and a centered text area perfect for any baby shower.",
    bestFor: ["Baby Shower", "Baby Sprinkle", "Co-ed Shower"],
    recommendedUse: [
      "Works great with a bump photo",
      "Designed for text-only invites",
    ],
    imagePrompt:
      "Minimal baby shower background in warm beige and cream tones, soft rounded shapes around the borders, subtle speckles, large empty light center area for text, modern neutral aesthetic, no text.",
    previewImage: "/templates/baby-showers/soft-neutrals-shower.webp",
  },
  {
    id: "little-star-is-coming",
    templateId: "little-star-is-coming",
    name: "Little Star Is Coming",
    tagline:
      "Gentle night sky with tiny stars and a moon, designed so the middle feels calm and open for baby shower details.",
    occasionTypes: ["Baby Shower", "Gender Reveal"],
    styles: ["Minimal", "Illustrated"],
    colorPalette: ["Blue tones"],
    tone: "Sweet & Soft",
    format: "page",
    description:
      "Gentle night sky with tiny stars and a moon, designed so the middle feels calm and open for baby shower details.",
    bestFor: ["Baby Shower", "Gender Reveal"],
    recommendedUse: [
      "Ideal for evening showers",
      "Perfect for star-themed celebrations",
    ],
    imagePrompt:
      "Soft navy to midnight-blue gradient sky with tiny golden or pale yellow stars near the edges and a small crescent moon in one corner, central area slightly lighter and mostly empty for text, dreamy and delicate, no text.",
    previewImage: "/templates/baby-showers/little-star-is-coming.webp",
  },
  {
    id: "oh-baby-script",
    templateId: "oh-baby-script",
    name: "Oh Baby Script",
    tagline:
      "Elegant script feel with a clean, airy layout. Background uses soft blush or nude tones with a light gradient.",
    occasionTypes: ["Baby Shower", "Sip & See"],
    styles: ["Elegant"],
    colorPalette: ["Blush / Pink tones"],
    tone: "Chic & Modern",
    format: "page",
    description:
      "Elegant script feel with a clean, airy layout. Background uses soft blush or nude tones with a light gradient.",
    bestFor: ["Baby Shower", "Sip & See"],
    recommendedUse: [
      "Works great with elegant photos",
      "Perfect for sophisticated celebrations",
    ],
    imagePrompt:
      "Soft blush and nude gradient background with very subtle watercolor texture, gentle light vignette directing focus to the center, airy and elegant baby shower feel, no icons, no text.",
    previewImage: "/templates/baby-showers/oh-baby-script.webp",
  },
  {
    id: "sage-linen",
    templateId: "sage-linen",
    name: "Sage & Linen",
    tagline:
      "Sage green accents with a linen-style texture, ideal for a gender-neutral modern shower.",
    occasionTypes: ["Baby Shower", "Co-ed Shower", "Baby Sprinkle"],
    styles: ["Minimal", "Modern"],
    colorPalette: ["Sage / Green"],
    tone: "Chic & Modern",
    format: "page",
    description:
      "Sage green accents with a linen-style texture, ideal for a gender-neutral modern shower.",
    bestFor: ["Baby Shower", "Co-ed Shower", "Baby Sprinkle"],
    recommendedUse: [
      "Ideal for gender-neutral celebrations",
      "Perfect for modern, minimal aesthetics",
    ],
    imagePrompt:
      "Neutral linen-style textured background with soft sage green abstract shapes and leaves touching the borders, large light center area left plain for text, minimal modern style, no text.",
    previewImage: "/templates/baby-showers/sage-linen.webp",
  },
  {
    id: "rainbow-baby-glow",
    templateId: "rainbow-baby-glow",
    name: "Rainbow Baby Glow",
    tagline:
      "Pastel rainbow arcs gently framing the invite, with a central glowing area where the event info will sit.",
    occasionTypes: ["Baby Shower", "Gender Reveal"],
    styles: ["Cute & Playful", "Illustrated"],
    colorPalette: ["Pastel Rainbow"],
    tone: "Fun & Casual",
    format: "page",
    description:
      "Pastel rainbow arcs gently framing the invite, with a central glowing area where the event info will sit.",
    bestFor: ["Baby Shower", "Gender Reveal"],
    recommendedUse: [
      "Perfect for colorful celebrations",
      "Great for gender reveal parties",
    ],
    imagePrompt:
      "Soft pastel rainbow arcs (peach, lavender, mint, pale yellow) along the top and bottom edges, white or very pale center with a faint glowing effect, minimal details, baby theme, no text.",
    previewImage: "/templates/baby-showers/rainbow-baby-glow.webp",
  },
  {
    id: "wildflower-sprinkle",
    templateId: "wildflower-sprinkle",
    name: "Wildflower Sprinkle",
    tagline:
      "Delicate wildflowers around the border with a calm off-white interior for text—perfect for sprinkles and brunch-style showers.",
    occasionTypes: ["Baby Sprinkle", "Baby Shower"],
    styles: ["Elegant", "Illustrated"],
    colorPalette: ["Blush / Pink tones", "Sage / Green"],
    tone: "Sweet & Soft",
    format: "page",
    description:
      "Delicate wildflowers around the border with a calm off-white interior for text—perfect for sprinkles and brunch-style showers.",
    bestFor: ["Baby Sprinkle", "Baby Shower"],
    recommendedUse: [
      "Perfect for brunch-style showers",
      "Ideal for garden-themed events",
    ],
    imagePrompt:
      "Light cream background with delicate thin wildflower illustrations (soft pink, yellow, lavender) forming a loose border, center area left mostly blank for text, airy and gentle, no text.",
    previewImage: "/templates/baby-showers/wildflower-sprinkle.webp",
  },
  {
    id: "tiny-teddy",
    templateId: "tiny-teddy",
    name: "Tiny Teddy",
    tagline:
      "Cute teddy bear illustration tucked into a corner with soft rounded shapes; the layout stays mostly minimal.",
    occasionTypes: ["Baby Shower"],
    styles: ["Cute & Playful", "Illustrated"],
    colorPalette: ["Neutral"],
    tone: "Sweet & Soft",
    format: "page",
    description:
      "Cute teddy bear illustration tucked into a corner with soft rounded shapes; the layout stays mostly minimal.",
    bestFor: ["Baby Shower"],
    recommendedUse: [
      "Perfect for playful celebrations",
      "Great for first-time parents",
    ],
    imagePrompt:
      "Soft pastel background in beige and light brown tones, a small cute teddy bear illustration near one bottom corner, subtle rounded shapes near edges, large clear center area for text, cozy and simple, no text.",
    previewImage: "/templates/baby-showers/tiny-teddy.webp",
  },
  {
    id: "boho-arch-baby",
    templateId: "boho-arch-baby",
    name: "Boho Arch Baby",
    tagline:
      "Boho-style arches and terracotta tones with clean type space, trendy and Instagram-ish.",
    occasionTypes: ["Baby Shower", "Co-ed Shower"],
    styles: ["Boho", "Modern"],
    colorPalette: ["Terracotta / Earthy"],
    tone: "Chic & Modern",
    format: "page",
    description:
      "Boho-style arches and terracotta tones with clean type space, trendy and Instagram-ish.",
    bestFor: ["Baby Shower", "Co-ed Shower"],
    recommendedUse: [
      "Perfect for Instagram-worthy invites",
      "Ideal for boho-themed celebrations",
    ],
    imagePrompt:
      "Boho baby shower background with overlapping arches in terracotta, blush, and cream near the sides, subtle textured look, big blank light center space for text, stylish and modern, no text.",
    previewImage: "/templates/baby-showers/boho-arch-baby.webp",
  },
  {
    id: "minimal-line-art-bump",
    templateId: "minimal-line-art-bump",
    name: "Minimal Line Art Bump",
    tagline:
      "Ultra-minimal with a single line-art illustration of a pregnant silhouette near the edge and lots of whitespace.",
    occasionTypes: ["Baby Shower", "Baby Sprinkle"],
    styles: ["Minimal", "Illustrated"],
    colorPalette: ["Neutral", "Blush / Pink tones"],
    tone: "Chic & Modern",
    format: "page",
    description:
      "Ultra-minimal with a single line-art illustration of a pregnant silhouette near the edge and lots of whitespace.",
    bestFor: ["Baby Shower", "Baby Sprinkle"],
    recommendedUse: [
      "Perfect for minimalist aesthetics",
      "Great for modern celebrations",
    ],
    imagePrompt:
      "Clean white or very pale blush background with a single simple line-art drawing of a pregnant silhouette near the left edge, very minimal accents, large empty space for text, elegant and quiet, no text.",
    previewImage: "/templates/baby-showers/minimal-line-art-bump.webp",
  },
  {
    id: "little-clouds",
    templateId: "little-clouds",
    name: "Little Clouds",
    tagline:
      "Fluffy clouds and soft blue or neutral sky, very calming, with a central clear area.",
    occasionTypes: ["Baby Shower", "Baby Sprinkle"],
    styles: ["Minimal", "Illustrated"],
    colorPalette: ["Blue tones", "Neutral"],
    tone: "Sweet & Soft",
    format: "page",
    description:
      "Fluffy clouds and soft blue or neutral sky, very calming, with a central clear area.",
    bestFor: ["Baby Shower", "Baby Sprinkle"],
    recommendedUse: [
      "Perfect for calming, peaceful vibes",
      "Ideal for morning showers",
    ],
    imagePrompt:
      "Baby shower sky background with soft fluffy clouds on a pale blue or light beige sky, clouds concentrated near upper edges, central area mostly empty for text, gentle and light, no text.",
    previewImage: "/templates/baby-showers/little-clouds.webp",
  },
  {
    id: "shes-on-her-way",
    templateId: "shes-on-her-way",
    name: "She's On Her Way",
    tagline:
      "Feminine-leaning but not overly pink—soft blush and gold speckles with a smooth central text panel.",
    occasionTypes: ["Baby Shower", "Gender Reveal"],
    styles: ["Elegant"],
    colorPalette: ["Blush / Pink tones"],
    tone: "Chic & Modern",
    format: "page",
    description:
      "Feminine-leaning but not overly pink—soft blush and gold speckles with a smooth central text panel.",
    bestFor: ["Baby Shower", "Gender Reveal"],
    recommendedUse: ["Perfect for girl showers", "Elegant and sophisticated"],
    imagePrompt:
      "Soft blush and cream blended background with tiny gold or warm metallic speckles scattered mainly at edges, faint central rectangle in a lighter tone for text, chic and feminine, no text.",
    previewImage: "/templates/baby-showers/shes-on-her-way.webp",
  },
  {
    id: "hes-almost-here",
    templateId: "hes-almost-here",
    name: "He's Almost Here",
    tagline:
      "Soft blue-gray palette with simple abstract shapes framing the top and bottom.",
    occasionTypes: ["Baby Shower", "Gender Reveal"],
    styles: ["Minimal", "Modern"],
    colorPalette: ["Blue tones"],
    tone: "Chic & Modern",
    format: "page",
    description:
      "Soft blue-gray palette with simple abstract shapes framing the top and bottom.",
    bestFor: ["Baby Shower", "Gender Reveal"],
    recommendedUse: ["Perfect for boy showers", "Modern and clean design"],
    imagePrompt:
      "Baby shower design with pale blue and light gray abstract rounded shapes along the top and bottom edges, white or very light center area left blank for text, modern and simple, no text.",
    previewImage: "/templates/baby-showers/hes-almost-here.webp",
  },
  {
    id: "gender-neutral-greenery",
    templateId: "gender-neutral-greenery",
    name: "Gender Neutral Greenery",
    tagline:
      "Eucalyptus leaves and soft greens, perfect for any baby, with a lightly framed center.",
    occasionTypes: ["Baby Shower", "Co-ed Shower", "Baby Sprinkle"],
    styles: ["Minimal", "Modern"],
    colorPalette: ["Sage / Green"],
    tone: "Chic & Modern",
    format: "page",
    description:
      "Eucalyptus leaves and soft greens, perfect for any baby, with a lightly framed center.",
    bestFor: ["Baby Shower", "Co-ed Shower", "Baby Sprinkle"],
    recommendedUse: [
      "Perfect for gender-neutral celebrations",
      "Ideal for nature-themed events",
    ],
    imagePrompt:
      "White background with simple eucalyptus leaves and green branches decorating the top and top corners, subtle greenery near sides, central area clean and empty for text, serene and gender-neutral, no text.",
    previewImage: "/templates/baby-showers/gender-neutral-greenery.webp",
  },
  {
    id: "sip-see-soiree",
    templateId: "sip-see-soiree",
    name: "Sip & See Soirée",
    tagline:
      "Chic, slightly more grown-up design with soft champagne and blush tones, ideal for post-birth meet-the-baby events.",
    occasionTypes: ["Sip & See"],
    styles: ["Elegant", "Modern"],
    colorPalette: ["Blush / Pink tones", "Neutral"],
    tone: "Chic & Modern",
    format: "page",
    description:
      "Chic, slightly more grown-up design with soft champagne and blush tones, ideal for post-birth meet-the-baby events.",
    bestFor: ["Sip & See"],
    recommendedUse: [
      "Perfect for post-birth celebrations",
      "Elegant and sophisticated",
    ],
    imagePrompt:
      "Elegant baby-themed background with soft champagne and blush gradient, subtle confetti dots near top border, faint light in center for text, modern and refined, no text.",
    previewImage: "/templates/baby-showers/sip-see-soiree.webp",
  },
  {
    id: "virtual-baby-shower",
    templateId: "virtual-baby-shower",
    name: "Virtual Baby Shower",
    tagline:
      "Screen-friendly layout with soft shapes hinting at video chat windows, but still simple and warm.",
    occasionTypes: ["Virtual Shower"],
    styles: ["Modern", "Minimal"],
    colorPalette: ["Blue tones", "Sage / Green"],
    tone: "Fun & Casual",
    format: "page",
    description:
      "Screen-friendly layout with soft shapes hinting at video chat windows, but still simple and warm.",
    bestFor: ["Virtual Shower"],
    recommendedUse: [
      "Perfect for online celebrations",
      "Great for remote guests",
    ],
    imagePrompt:
      "Subtle abstract background with soft rounded rectangles suggesting screens or windows, in pastel blues and greens, white center space kept blank for text, gentle tech feel, no logos, no text.",
    previewImage: "/templates/baby-showers/virtual-baby-shower.webp",
  },
  {
    id: "twins-on-the-way",
    templateId: "twins-on-the-way",
    name: "Twins On The Way",
    tagline:
      "Symmetrical design with pairs of small icons—two stars, two clouds, two hearts—around a shared text block.",
    occasionTypes: ["Baby Shower", "Baby Sprinkle"],
    styles: ["Cute & Playful", "Illustrated"],
    colorPalette: ["Pastel Rainbow"],
    tone: "Fun & Casual",
    format: "page",
    description:
      "Symmetrical design with pairs of small icons—two stars, two clouds, two hearts—around a shared text block.",
    bestFor: ["Baby Shower", "Baby Sprinkle"],
    recommendedUse: ["Perfect for twin celebrations", "Playful and fun design"],
    imagePrompt:
      "Baby shower background featuring pairs of matching icons like two stars, two hearts, two clouds spaced near borders, soft pastel palette, large clear center area for text, playful but tidy, no text.",
    previewImage: "/templates/baby-showers/twins-on-the-way.webp",
  },
  {
    id: "books-for-baby",
    templateId: "books-for-baby",
    name: "Books For Baby",
    tagline:
      "Reading-themed invite with stack-of-books illustration and warm cozy tones, ideal for bring a book instead of a card.",
    occasionTypes: ["Baby Shower", "Baby Sprinkle"],
    styles: ["Cute & Playful", "Illustrated"],
    colorPalette: ["Neutral", "Terracotta / Earthy"],
    tone: "Sweet & Soft",
    format: "page",
    description:
      "Reading-themed invite with stack-of-books illustration and warm cozy tones, ideal for bring a book instead of a card.",
    bestFor: ["Baby Shower", "Baby Sprinkle"],
    recommendedUse: [
      "Perfect for book-themed showers",
      "Ideal for registry-focused events",
    ],
    imagePrompt:
      "Warm baby shower background in soft beige and muted colors with a small stack of cute illustrated books near one lower corner, light textured look, center and upper area mostly empty for text, cozy and inviting, no text.",
    previewImage: "/templates/baby-showers/books-for-baby.webp",
  },
  {
    id: "baby-q-backyard",
    templateId: "baby-q-backyard",
    name: "Baby-Q Backyard",
    tagline:
      "Casual, slightly rustic style that hints at a backyard BBQ vibe while still soft enough for baby.",
    occasionTypes: ["Baby Shower", "Co-ed Shower"],
    styles: ["Fun & Casual"],
    colorPalette: ["Terracotta / Earthy", "Sage / Green"],
    tone: "Fun & Casual",
    format: "page",
    description:
      "Casual, slightly rustic style that hints at a backyard BBQ vibe while still soft enough for baby.",
    bestFor: ["Baby Shower", "Co-ed Shower"],
    recommendedUse: [
      "Perfect for outdoor celebrations",
      "Great for casual gatherings",
    ],
    imagePrompt:
      "Subtle outdoor backyard theme with light gingham or check pattern in very soft muted tones around edges, faint wooden or kraft-paper texture behind, central lighter panel for text, casual and friendly, no text.",
    previewImage: "/templates/baby-showers/baby-q-backyard.webp",
  },
  {
    id: "moon-back",
    templateId: "moon-back",
    name: "Moon & Back",
    tagline:
      "Soft moon and stars with gentle gradient, to the moon and back energy without actual wording.",
    occasionTypes: ["Baby Shower", "Gender Reveal"],
    styles: ["Elegant", "Illustrated"],
    colorPalette: ["Blue tones"],
    tone: "Sweet & Soft",
    format: "page",
    description:
      "Soft moon and stars with gentle gradient, to the moon and back energy without actual wording.",
    bestFor: ["Baby Shower", "Gender Reveal"],
    recommendedUse: [
      "Perfect for emotional celebrations",
      "Dreamy and romantic",
    ],
    imagePrompt:
      "Baby shower night sky with large soft crescent moon near top corner, tiny scattered stars, deep but softened blue and purple gradient, glowing lighter circle in the center for text, dreamy and emotional, no text.",
    previewImage: "/templates/baby-showers/moon-back.webp",
  },
  {
    id: "little-wild-one",
    templateId: "little-wild-one",
    name: "Little Wild One",
    tagline:
      "Gentle safari baby animals with pastel tones, but plenty of central space left clean.",
    occasionTypes: ["Baby Shower", "Co-ed Shower"],
    styles: ["Cute & Playful", "Illustrated"],
    colorPalette: ["Sage / Green", "Terracotta / Earthy"],
    tone: "Fun & Casual",
    format: "page",
    description:
      "Gentle safari baby animals with pastel tones, but plenty of central space left clean.",
    bestFor: ["Baby Shower", "Co-ed Shower"],
    recommendedUse: [
      "Perfect for safari-themed celebrations",
      "Great for adventurous parents",
    ],
    imagePrompt:
      "Baby safari background with small pastel animal illustrations (baby lion, elephant, giraffe) near lower corners, soft beige and light green hues, upper and middle center area blank and bright for text, sweet and simple, no text.",
    previewImage: "/templates/baby-showers/little-wild-one.webp",
  },
  {
    id: "terracotta-bloom",
    templateId: "terracotta-bloom",
    name: "Terracotta Bloom",
    tagline:
      "Earthy terracotta and blush florals with a modern, editorial layout.",
    occasionTypes: ["Baby Shower", "Baby Sprinkle"],
    styles: ["Boho", "Modern"],
    colorPalette: ["Terracotta / Earthy", "Blush / Pink tones"],
    tone: "Chic & Modern",
    format: "page",
    description:
      "Earthy terracotta and blush florals with a modern, editorial layout.",
    bestFor: ["Baby Shower", "Baby Sprinkle"],
    recommendedUse: [
      "Perfect for editorial-style invites",
      "Ideal for modern, stylish celebrations",
    ],
    imagePrompt:
      "Earthy baby shower background with terracotta and blush abstract shapes and minimal floral line-art near corners, textured off-white base, central area clean for text, stylish and contemporary, no text.",
    previewImage: "/templates/baby-showers/terracotta-bloom.webp",
  },
  {
    id: "scandinavian-baby",
    templateId: "scandinavian-baby",
    name: "Scandinavian Baby",
    tagline:
      "Scandi-inspired minimal geometric shapes, soft muted colors, very clean lines.",
    occasionTypes: ["Baby Shower", "Co-ed Shower"],
    styles: ["Minimal", "Modern"],
    colorPalette: ["Neutral"],
    tone: "Chic & Modern",
    format: "page",
    description:
      "Scandi-inspired minimal geometric shapes, soft muted colors, very clean lines.",
    bestFor: ["Baby Shower", "Co-ed Shower"],
    recommendedUse: [
      "Perfect for minimalist aesthetics",
      "Ideal for Scandinavian-inspired celebrations",
    ],
    imagePrompt:
      "Scandinavian-inspired baby design with simple geometric shapes (circles, triangles, arches) in muted mustard, dusty blue, and soft gray near borders, white central area for text, ultra-minimal, no text.",
    previewImage: "/templates/baby-showers/scandinavian-baby.webp",
  },
  {
    id: "classic-baby-blue-blush-frame",
    templateId: "classic-baby-blue-blush-frame",
    name: "Classic Baby Blue or Blush Frame",
    tagline:
      "Timeless card with a thin colored border (blue or blush) around a crisp white interior.",
    occasionTypes: ["Baby Shower", "Baby Sprinkle"],
    styles: ["Elegant", "Minimal"],
    colorPalette: ["Blue tones", "Blush / Pink tones"],
    tone: "Sweet & Soft",
    format: "card",
    description:
      "Timeless card with a thin colored border (blue or blush) around a crisp white interior.",
    bestFor: ["Baby Shower", "Baby Sprinkle"],
    recommendedUse: [
      "Perfect for classic, timeless invites",
      "Great for traditional celebrations",
    ],
    imagePrompt:
      "Classic baby invite with a thin soft pastel border (blue or blush) around a clean white center, tiny baby-themed icons like a rattle or star in one corner, very simple and traditional, center empty for text, no text.",
    previewImage: "/templates/baby-showers/classic-baby-blue-blush-frame.webp",
  },
  {
    id: "botanical-bump-celebration",
    templateId: "botanical-bump-celebration",
    name: "Botanical Bump Celebration",
    tagline:
      "Botanical illustrations and a soft oval area in the middle, perfect for showers focused on mom and self-care.",
    occasionTypes: ["Baby Shower", "Baby Sprinkle"],
    styles: ["Elegant", "Illustrated"],
    colorPalette: ["Sage / Green"],
    tone: "Chic & Modern",
    format: "page",
    description:
      "Botanical illustrations and a soft oval area in the middle, perfect for showers focused on mom and self-care.",
    bestFor: ["Baby Shower", "Baby Sprinkle"],
    recommendedUse: [
      "Perfect for mom-focused celebrations",
      "Ideal for self-care themed events",
    ],
    imagePrompt:
      "Botanical baby shower background with delicate leafy line-art around edges in sage and dark green, soft off-white oval in the center for text, calm and nature-inspired, no text.",
    previewImage: "/templates/baby-showers/botanical-bump-celebration.webp",
  },
];

const HOW_IT_WORKS = [
  {
    title: "Choose a baby shower template",
    copy: "Pick a style that matches your vibe—minimal, boho, playful, you choose.",
  },
  {
    title: "Add the details",
    copy: "Enter parents' names, date, time, location, registry links, and an optional note for guests.",
  },
  {
    title: "Share one smart invite link",
    copy: "Send via text, WhatsApp, email, or group chat. Guests see everything and can RSVP or add it to their calendar in one tap.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "We sent one baby shower link in our group chat and everyone had the date, address, and registry in one place.",
    author: "Emma & Alex",
  },
  {
    quote:
      "I loved not having to design anything. Envitefy made a simple, beautiful page I could keep updating.",
    author: "First-time mom",
  },
  {
    quote:
      "Updating the time was so easy—I just changed it once and all my guests saw it instantly.",
    author: "Sarah, expecting mom",
  },
];

const LOVE_REASONS = [
  "Keep all details in one link",
  "Registry, RSVP, and location together",
  "Easy for co-hosts to share",
  "Update time or address without re-sending an image",
  "Guests can't lose the invite in their camera roll",
];

export default function BabyShowersCreateTemplate({ defaultDate }: Props) {
  const router = useRouter();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );
  const [filters, setFilters] = useState<FilterState>({
    occasion: "all",
    style: "all",
    colorPalette: "all",
    tone: "all",
    layout: "all",
  });

  const defaultDateIso = useMemo(() => {
    if (!defaultDate) return undefined;
    try {
      return defaultDate.toISOString();
    } catch {
      return undefined;
    }
  }, [defaultDate]);

  const templateVariationMap = useMemo(() => {
    const map = new Map<string, string>();
    babyShowerTemplateCatalog.forEach(
      (template: BabyShowerTemplateDefinition) => {
        const variation = template.variations?.[0];
        if (variation) map.set(template.id, variation.id);
      }
    );
    return map;
  }, []);

  const filteredTemplates = useMemo(() => {
    return BABY_SHOWER_TEMPLATES.filter((template) => {
      if (
        filters.occasion !== "all" &&
        !template.occasionTypes.includes(filters.occasion)
      ) {
        return false;
      }
      if (
        filters.style !== "all" &&
        !template.styles.some(
          (style) => style.toLowerCase() === filters.style.toLowerCase()
        )
      ) {
        return false;
      }
      if (
        filters.colorPalette !== "all" &&
        !template.colorPalette.some(
          (palette) =>
            palette.toLowerCase() === filters.colorPalette.toLowerCase()
        )
      ) {
        return false;
      }
      if (filters.tone !== "all" && template.tone !== filters.tone) {
        return false;
      }
      if (
        filters.layout !== "all" &&
        !template.format.includes(filters.layout.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [filters]);

  const handleFilterChange = (
    key: keyof FilterState,
    value: string | InviteTone | "all"
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleUseTemplate = (template: BabyShowerInviteTemplate) => {
    const params = new URLSearchParams();
    params.set("templateId", template.templateId);
    const variationId = templateVariationMap.get(template.templateId);
    if (variationId) params.set("variationId", variationId);
    if (defaultDateIso) params.set("d", defaultDateIso);
    router.push(`/event/baby-showers/customize?${params.toString()}`);
  };

  const selectedTemplate = selectedTemplateId
    ? BABY_SHOWER_TEMPLATES.find(
        (template) => template.id === selectedTemplateId
      ) ?? null
    : null;

  return (
    <main className={`${poppins.className} ${baloo.variable} bg-[#FAFAFA]`}>
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-10 sm:px-6 lg:px-10">
        <HeroSection
          onBrowse={() =>
            document
              .getElementById("baby-shower-templates")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        />

        <TrustBar />

        <FilterBar filters={filters} onChange={handleFilterChange} />

        <section id="baby-shower-templates" className="space-y-6">
          <div className="flex flex-col gap-2 text-[#2F2F2F]">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#9B7ED9]">
              Choose a baby shower invite template
            </p>
            <h2
              style={{ fontFamily: "var(--font-baloo)" }}
              className="text-3xl text-[#2F2F2F]"
            >
              Browse Baby Shower Invite Templates
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onPreview={() => setSelectedTemplateId(template.id)}
                onUse={() => handleUseTemplate(template)}
              />
            ))}
          </div>
        </section>

        <HowItWorks />
        <Testimonials />
        <ParentsLove />

        <footer className="rounded-t-3xl bg-[#181625] p-8 text-white">
          <div className="grid gap-6 lg:grid-cols-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#9B7ED9]">
                Envitefy
              </p>
              <p className="mt-3 text-sm text-white/70">
                Shareable baby shower invites with one smart link and
                add-to-calendar buttons your guests will actually use.
              </p>
            </div>
            <FooterList
              title="Product"
              items={["How It Works", "Baby Shower Templates", "Help Center"]}
            />
            <FooterList
              title="Follow"
              items={["Instagram", "Facebook", "YouTube"]}
            />
          </div>
        </footer>
      </div>
    </main>
  );
}

function HeroSection({ onBrowse }: { onBrowse: () => void }) {
  return (
    <section className="rounded-[40px] bg-gradient-to-br from-[#F5E8FF] via-[#E8F5F0] to-[#FFE8F5] p-8 shadow-2xl">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6 text-[#2F2F2F]">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#9B7ED9]">
            Baby shower invites
          </p>
          <h1
            style={{ fontFamily: "var(--font-baloo)" }}
            className="text-4xl leading-tight sm:text-5xl"
          >
            Create a Beautiful Baby Shower Invite in Just a Few Clicks.
          </h1>
          <p className="text-lg text-[#4A403C]">
            Celebrate your little one on the way with a shareable event page,
            simple RSVPs, and one smart link for all your guests.
          </p>
          <p className="text-sm font-semibold text-[#4A403C]">
            No apps needed. Guests get one link with date, time, location,
            registry, and "Add to Calendar."
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={onBrowse}
              className="inline-flex items-center gap-2 rounded-full bg-[#9B7ED9] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#9B7ED9]/40 transition hover:scale-[1.01]"
            >
              Browse Baby Shower Templates <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href="#how-envitefy-works"
              className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-6 py-3 text-sm font-semibold text-[#2F2F2F]"
            >
              See How Envitefy Works
            </a>
          </div>
        </div>
        <HeroMockup />
      </div>
    </section>
  );
}

function HeroMockup() {
  return (
    <div className="relative rounded-[32px] bg-white/90 p-6 shadow-xl">
      <div className="space-y-4">
        <div className="rounded-2xl bg-[#F5E8FF] p-4 text-sm text-[#7B5FA3]">
          Baby Shower for [Name]
        </div>
        <div className="rounded-3xl border border-[#E8D5FF] bg-white/95 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[#9B7ED9]">
                Date · Time · Location
              </p>
              <h3 className="text-2xl font-semibold text-[#2F2F2F]">
                Baby Shower Celebration
              </h3>
            </div>
            <div className="rounded-full bg-[#F5E8FF] px-4 py-2 text-xs font-semibold text-[#7B5FA3]">
              Add to Calendar
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm text-[#4A403C]">
            <p>
              Saturday · 2:00 PM
              <br />
              123 Main Street, City
            </p>
            <div className="rounded-2xl border border-[#E8D5FF] bg-[#FBF6FF] px-4 py-3 text-xs text-[#643C8F]">
              View Registry
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="flex-1 rounded-full bg-[#9B7ED9] px-4 py-2 text-xs font-semibold text-white">
              RSVP
            </button>
            <button className="flex-1 rounded-full border border-[#E8D5FF] px-4 py-2 text-xs font-semibold text-[#7B5FA3]">
              Add to Calendar
            </button>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute -top-6 right-6 h-20 w-20 rounded-full bg-[#9B7ED9]/40 blur-3xl" />
    </div>
  );
}

function TrustBar() {
  const trustItems = [
    {
      icon: <Share2 className="h-5 w-5" />,
      label: "Easy to share by text, email, or chat",
    },
    {
      icon: <CalendarDays className="h-5 w-5" />,
      label: "1-click Add to Calendar",
    },
    {
      icon: <Lock className="h-5 w-5" />,
      label: "Private, unlisted event links",
    },
    {
      icon: <Gift className="h-5 w-5" />,
      label: "Registry links in one place",
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "Works for in-person and virtual showers",
    },
  ];
  return (
    <section className="rounded-[32px] border border-[#F4E7FF] bg-white/90 p-4 shadow-sm">
      <div className="grid gap-3 text-sm font-semibold text-[#2F2F2F] sm:grid-cols-3 lg:grid-cols-5">
        {trustItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 rounded-full bg-[#FAF5FF] px-4 py-2"
          >
            <span aria-hidden className="text-[#9B7ED9]">
              {item.icon}
            </span>
            {item.label}
          </div>
        ))}
      </div>
    </section>
  );
}

function FilterBar({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (key: keyof FilterState, value: any) => void;
}) {
  return (
    <section className="sticky top-4 z-20 rounded-[32px] border border-[#F1E5FF] bg-white/95 p-4 shadow-md backdrop-blur">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#7A6C68]">
        <Filter className="h-4 w-4 text-[#9B7ED9]" /> Filter templates
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <FilterSelect
          label="Occasion Type"
          value={filters.occasion}
          options={OCCASION_FILTERS}
          onChange={(value) => onChange("occasion", value)}
        />
        <FilterSelect
          label="Style"
          value={filters.style}
          options={STYLE_FILTERS}
          onChange={(value) => onChange("style", value)}
        />
        <FilterSelect
          label="Color Palette"
          value={filters.colorPalette}
          options={COLOR_PALETTE_FILTERS}
          onChange={(value) => onChange("colorPalette", value)}
        />
        <FilterSelect
          label="Tone"
          value={filters.tone}
          options={TONE_FILTERS}
          onChange={(value) => onChange("tone", value)}
        />
        <FilterSelect
          label="Layout"
          value={filters.layout}
          options={LAYOUT_FILTERS}
          onChange={(value) => onChange("layout", value)}
        />
      </div>
    </section>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-[#4A3E39]">
      <span className="font-semibold">{label}</span>
      <div className="flex items-center gap-2 rounded-2xl border border-[#F1E2FA] bg-white px-3 py-2">
        <Palette className="h-4 w-4 text-[#9B7ED9]" />
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent text-sm focus:outline-none"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

function TemplateCard({
  template,
  onPreview,
  onUse,
}: {
  template: BabyShowerInviteTemplate;
  onPreview: () => void;
  onUse: () => void;
}) {
  return (
    <div className="flex flex-col rounded-[32px] border border-[#F5EAF9] bg-white shadow-sm">
      <div className="relative h-48 rounded-t-[32px] overflow-hidden">
        <Image
          src={template.previewImage}
          alt={template.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5 text-[#2F2F2F]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9B7ED9]">
            Template
          </p>
          <h3 className="text-lg font-semibold">{template.name}</h3>
          <p className="text-sm text-[#6F6460]">{template.tagline}</p>
        </div>
        <div className="rounded-2xl border border-[#F2E6FF] bg-white/90 px-4 py-3 text-sm text-[#4A403C]">
          <p>Occasion: {template.occasionTypes.slice(0, 2).join(" / ")}</p>
          <p>Style: {template.styles.join(" · ")}</p>
          <p>Palette: {template.colorPalette.join(", ")}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-[#7B6D68]">
          {template.recommendedUse.slice(0, 2).map((text) => (
            <span
              key={text}
              className="rounded-full bg-[#FFF2FB] px-3 py-1 text-[#9B7ED9]"
            >
              {text}
            </span>
          ))}
        </div>
        <div className="mt-auto flex gap-3 pt-2">
          <button
            type="button"
            onClick={onUse}
            className="flex-1 rounded-full bg-[#9B7ED9] px-4 py-2 text-sm font-semibold text-white"
          >
            Use This Template
          </button>
        </div>
      </div>
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="how-envitefy-works" className="space-y-6">
      <div className="text-[#2F2F2F]">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#9B7ED9]">
          How Envitefy works
        </p>
        <h2
          style={{ fontFamily: "var(--font-baloo)" }}
          className="text-3xl text-[#2F2F2F]"
        >
          How Envitefy Works for Baby Showers
        </h2>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {HOW_IT_WORKS.map((step, index) => (
          <div
            key={step.title}
            className="rounded-[28px] border border-[#F2E6FF] bg-white/95 p-6 shadow-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5E8FF] text-lg font-semibold text-[#9B7ED9]">
              {index + 1}
            </div>
            <h3
              style={{ fontFamily: "var(--font-baloo)" }}
              className="mt-4 text-2xl text-[#2F2F2F]"
            >
              {step.title}
            </h3>
            <p className="text-sm text-[#6F6460]">{step.copy}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-[#E7F6FF] bg-[#F5FBFF] p-4 text-sm text-[#115575]">
        Works just as well for baby sprinkles, gender reveals, and sip & see
        events.
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="space-y-4">
      <div className="text-[#2F2F2F]">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#9B7ED9]">
          Parent-to-be testimonials
        </p>
        <h2
          style={{ fontFamily: "var(--font-baloo)" }}
          className="text-3xl text-[#2F2F2F]"
        >
          Real parents, zero invite stress
        </h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {TESTIMONIALS.map((testimonial) => (
          <div
            key={testimonial.quote}
            className="min-w-[260px] flex-1 rounded-[28px] border border-[#F7E5FF] bg-white p-6 text-[#4A403C]"
          >
            <p className="text-base font-medium">"{testimonial.quote}"</p>
            <p className="mt-2 text-sm text-[#85736D]">
              — {testimonial.author}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ParentsLove() {
  return (
    <section className="rounded-[36px] border border-[#F1E5FF] bg-white/95 p-6 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#7B6D68]">
        <Wand2 className="h-4 w-4 text-[#9B7ED9]" /> Why hosts love Envitefy for
        baby showers
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LOVE_REASONS.map((reason) => (
          <div
            key={reason}
            className="flex items-center gap-2 rounded-2xl border border-[#F7E5FF] bg-[#FFFAFE] px-4 py-3 text-sm text-[#4A403C]"
          >
            <Check className="h-4 w-4 text-[#7ED9B0]" />
            {reason}
          </div>
        ))}
      </div>
    </section>
  );
}

function FooterList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-sm font-semibold text-white">{title}</p>
      <ul className="mt-3 space-y-2 text-sm text-white/70">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
