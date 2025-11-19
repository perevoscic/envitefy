"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Baloo_2, Poppins } from "next/font/google";
import {
  birthdayTemplateCatalog,
  type BirthdayTemplateDefinition,
} from "@/components/event-create/BirthdayTemplateGallery";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Filter,
  Palette,
  Sparkles,
  Wand2,
} from "lucide-react";

type Props = { defaultDate?: Date };

type TemplateFormat = "card" | "page";
type InviteTone = "Playful" | "Elegant" | "Simple" | "Bold";

type InviteTemplate = {
  id: string;
  templateId: string;
  name: string;
  icon: string;
  tagline: string;
  ageLabel: string;
  styles: string[];
  themes: string[];
  tone: InviteTone;
  format: TemplateFormat;
  description: string;
  styleDescription: string;
  imagePrompt: string;
  background: string;
  highlight: string[];
};

type FilterState = {
  age: string;
  style: string;
  theme: string;
  tone: InviteTone | "all";
  format: TemplateFormat | "all";
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

const AGE_FILTERS = [
  { value: "all", label: "All ages" },
  { value: "1-3", label: "1–3" },
  { value: "4-6", label: "4–6" },
  { value: "7-9", label: "7–9" },
  { value: "10-13", label: "10–13" },
  { value: "teen", label: "Teen" },
];

const STYLE_FILTERS = [
  { value: "all", label: "All styles" },
  { value: "Cute", label: "Cute" },
  { value: "Minimal", label: "Minimal" },
  { value: "Photo", label: "Photo-based" },
  { value: "Illustrated", label: "Illustrated" },
  { value: "Bold", label: "Bold colors" },
];

const THEME_FILTERS = [
  { value: "all", label: "All themes" },
  { value: "Animals", label: "Animals" },
  { value: "Space", label: "Space" },
  { value: "Princess", label: "Princess" },
  { value: "Sports", label: "Sports" },
  { value: "Rainbow", label: "Rainbow" },
  { value: "Neutral", label: "Neutral" },
  { value: "Seasonal", label: "Seasonal" },
];

const TONE_FILTERS: Array<{ value: InviteTone | "all"; label: string }> = [
  { value: "all", label: "All tones" },
  { value: "Playful", label: "Playful" },
  { value: "Elegant", label: "Elegant" },
  { value: "Simple", label: "Simple" },
  { value: "Bold", label: "Bold" },
];

const FORMAT_FILTERS: Array<{ value: TemplateFormat | "all"; label: string }> =
  [
    { value: "all", label: "All formats" },
    { value: "card", label: "Card-style invite" },
    { value: "page", label: "Full event page" },
  ];

const INVITE_TEMPLATES: InviteTemplate[] = [
  {
    id: "candy-dreams",
    templateId: "candy-dreams",
    name: "Candy Dreams Invite",
    icon: "🍬",
    tagline: "Soft pastel candy layout",
    ageLabel: "Best for ages 3–8",
    styles: ["Cute", "Illustrated"],
    themes: ["Candy", "Rainbow"],
    tone: "Playful",
    format: "page",
    description:
      "Rounded corners, sprinkles, and a bubbly frame keep this invite sweet while leaving a bright center panel for details.",
    styleDescription:
      "Soft pastel candy colors with a wide, clean center panel for the details. Rounded shapes, sprinkles along the edges, and a friendly, bubbly frame around the main text area.",
    imagePrompt:
      "Pastel candy-land background with soft pink, mint, and lavender tones, scattered lollipops and candy shapes around the borders, large light area in the center for text, minimal details in the middle, flat illustration, no text.",
    background: "linear-gradient(135deg, #FFE0F0, #FDF5FF)",
    highlight: [
      "Sprinkle border that never crowds text",
      "Rounded card panel perfect for long names",
      "Great match for candy or dessert parties",
    ],
  },
  {
    id: "rainbow-bash",
    templateId: "rainbow-bash",
    name: "Rainbow Bash Invite",
    icon: "🌈",
    tagline: "Bold rainbow arc with clean center",
    ageLabel: "Best for ages 4–9",
    styles: ["Bold", "Illustrated"],
    themes: ["Rainbow", "Neutral"],
    tone: "Playful",
    format: "page",
    description:
      "A bright rainbow hugs the top and sides while the middle stays bright for easy-to-read names and dates.",
    styleDescription:
      "Bold, colorful arc of a rainbow framing the top or sides, with the middle kept mostly white/off-white so the child’s name and party info stand out.",
    imagePrompt:
      "Bright rainbow arch and confetti along the top and corners, clean off-white center for text, playful but minimal style, vector illustration, no text in the center.",
    background: "linear-gradient(135deg, #FFE072, #FF7AE0)",
    highlight: [
      "Rainbow framing showcases hero text",
      "Neutral center works with any font combo",
      "Perfect for colorful park or play gym invites",
    ],
  },
  {
    id: "underwater-sparkle",
    templateId: "magic-sparkle",
    name: "Underwater Sparkle Invite",
    icon: "🧜‍♀️",
    tagline: "Shimmering ocean gradient",
    ageLabel: "Best for ages 4–7",
    styles: ["Cute", "Illustrated"],
    themes: ["Underwater", "Princess"],
    tone: "Elegant",
    format: "page",
    description:
      "Teal and blue gradients fade into a glowing middle so mermaid names and RSVP info stay readable.",
    styleDescription:
      "Soft underwater gradient (teal to blue) with subtle bubbles and sparkles. Decorative shells and seaweed around the edges; center area lightly faded for easy reading.",
    imagePrompt:
      "Underwater ocean scene with teal and blue gradient, soft bubbles and small sparkles, seashells and seaweed near the borders, large gently glowing blank area in the center for text, dreamy illustration, no text.",
    background: "linear-gradient(135deg, #64D8F0, #8AA8FF)",
    highlight: [
      "Glowing center ideal for script fonts",
      "Shell corners create natural photo spots",
      "Matches pool, beach, or mermaid themes",
    ],
  },
  {
    id: "space-explorer",
    templateId: "super-star",
    name: "Space Explorer Invite",
    icon: "🚀",
    tagline: "Nebula glow with planet corners",
    ageLabel: "Best for ages 6–11",
    styles: ["Bold", "Minimal"],
    themes: ["Space"],
    tone: "Playful",
    format: "page",
    description:
      "Dark navy sky, rocket corners, and a lighter nebula core mimic a real mission briefing.",
    styleDescription:
      "Dark navy starry sky with planets and rockets clustered in corners, leaving a large, lighter nebula-style area in the middle for the event details.",
    imagePrompt:
      "Outer space background with navy sky, stars, planets, and a small rocket near the corners, soft glowing nebula providing a lighter area in the center for text, clean and simple, no text.",
    background: "linear-gradient(135deg, #0F172A, #3C82F6)",
    highlight: [
      "Nebula center keeps info legible",
      "Corner rockets add subtle motion cues",
      "Great for planetarium or science-center parties",
    ],
  },
  {
    id: "jungle-safari",
    templateId: "fun-fiesta",
    name: "Jungle Safari Invite",
    icon: "🦁",
    tagline: "Leafy border with peekaboo animals",
    ageLabel: "Best for ages 3–8",
    styles: ["Illustrated", "Cute"],
    themes: ["Animals"],
    tone: "Playful",
    format: "page",
    description:
      "Layered leaves frame the invite so animal silhouettes can peek out without covering the text.",
    styleDescription:
      "Leafy green border that feels like peeking into a jungle. The center stays light and uncluttered, with only a few animal silhouettes near the edges.",
    imagePrompt:
      "Jungle leaves and tropical greenery forming a border, subtle animal silhouettes (giraffe, monkey, lion) in the corners, pale warm center area left mostly empty for text, soft illustration, no text.",
    background: "linear-gradient(135deg, #6FCF97, #BFF5C8)",
    highlight: [
      "Leaf border frames tall names perfectly",
      "Silhouettes can swap per favorite animal",
      "Ideal for safari, zoo, or wild-one themes",
    ],
  },
  {
    id: "dino-adventure",
    templateId: "birthday-burst",
    name: "Dino Adventure Invite",
    icon: "🦕",
    tagline: "Footprints with sky-and-ground fade",
    ageLabel: "Best for ages 4–8",
    styles: ["Illustrated", "Bold"],
    themes: ["Dinosaurs"],
    tone: "Playful",
    format: "page",
    description:
      "Footprints along the bottom and sides with a parchment-style center ready for excavation details.",
    styleDescription:
      "Fun dinosaur silhouettes and footprints along the bottom and sides, with a simple sky/ground gradient or parchment texture in the middle for the text block.",
    imagePrompt:
      "Cute dinosaur silhouettes and dino footprints along the bottom and side edges, soft sky and ground gradient, clean light space in the center for text, playful but minimal, no text.",
    background: "linear-gradient(135deg, #FAD0C4, #FFE9A7)",
    highlight: [
      "Footprint trail subtly points to CTA",
      "Gradient center holds long schedules",
      "Pairs perfectly with fossil hunt parties",
    ],
  },
  {
    id: "princess-garden",
    templateId: "sweet-celebration",
    name: "Princess Garden Invite",
    icon: "👑",
    tagline: "Pastel floral frame with sparkles",
    ageLabel: "Best for ages 3–8",
    styles: ["Elegant", "Illustrated"],
    themes: ["Princess", "Garden"],
    tone: "Elegant",
    format: "card",
    description:
      "Pastel florals and delicate sparkles create a framed card perfect for names and RSVP details.",
    styleDescription:
      "Pastel floral border with tiny crowns and sparkles worked into the design. The central panel looks like a soft, framed card where the name and details will sit.",
    imagePrompt:
      "Pastel flower border with small crown icons and gentle sparkles, pale pink and cream tones, central blank panel with soft edges for text, elegant storybook style, no text.",
    background: "linear-gradient(135deg, #FFD7EF, #FFF5E9)",
    highlight: [
      "Framed panel feels like luxe stationery",
      "Sparkle accents stay outside text block",
      "Beautiful for tea parties or garden picnics",
    ],
  },
  {
    id: "superhero-squad",
    templateId: "happy-dance",
    name: "Superhero Squad Invite",
    icon: "🦸",
    tagline: "Comic bursts with clean white panel",
    ageLabel: "Best for ages 4–9",
    styles: ["Bold", "Illustrated"],
    themes: ["Superhero"],
    tone: "Bold",
    format: "page",
    description:
      "Starbursts, halftones, and comic shapes energize the border while the center stays bright.",
    styleDescription:
      "Comic-book style with bold color blocks and starbursts around the edges, but a large white or pale panel in the middle to keep the text readable.",
    imagePrompt:
      "Comic-book superhero background with bright red, blue, and yellow shapes and starburst effects near the edges, large white or very light center panel for text, playful and dynamic, no text.",
    background: "linear-gradient(135deg, #FF5F6D, #FFC371)",
    highlight: [
      "Center panel mimics a comic speech bubble",
      "Edge bursts perfect for sound-effect text",
      "Great for hero, ninja, or action themes",
    ],
  },
  {
    id: "construction-zone",
    templateId: "celebration-time",
    name: "Construction Zone Invite",
    icon: "🚧",
    tagline: "Hazard stripes with signboard center",
    ageLabel: "Best for ages 3–7",
    styles: ["Bold", "Minimal"],
    themes: ["Vehicles"],
    tone: "Simple",
    format: "page",
    description:
      "Yellow-and-black stripes and small trucks create the border; a light signboard holds the text.",
    styleDescription:
      "Yellow-and-black stripes at the top/bottom and small construction icons in the corners. The center is a clean light gray/white “sign” area for the event info.",
    imagePrompt:
      "Construction-themed background with yellow and black hazard stripes at top and bottom, small cartoon trucks and cones near corners, large light gray center panel for text, simple illustration, no text.",
    background: "linear-gradient(135deg, #FEE440, #F2921D)",
    highlight: [
      "Signboard center perfect for RSVP phone",
      "Hazard stripes act like callouts",
      "Great for digger or truck-obsessed kids",
    ],
  },
  {
    id: "fairy-forest",
    templateId: "whimsical-wonder",
    name: "Fairy Forest Invite",
    icon: "🧚",
    tagline: "Glowing forest vignette",
    ageLabel: "Best for ages 3–8",
    styles: ["Elegant", "Illustrated"],
    themes: ["Forest"],
    tone: "Elegant",
    format: "page",
    description:
      "Firefly lights and greenery fade toward a bright, magical center for the invite details.",
    styleDescription:
      "Soft forest greens with glowing fireflies or fairy lights around the border. A gentle vignette leads the eye to a bright open center for all the details.",
    imagePrompt:
      "Enchanted forest background with soft greenery, twinkling fairy lights and fireflies near edges, subtle vignette, bright glowing center space for text, dreamy watercolor style, no text.",
    background: "linear-gradient(135deg, #88C399, #E6F7CE)",
    highlight: [
      "Vignette naturally spotlights the event name",
      "Firefly sparks mimic animated effects",
      "Lovely for twilight backyard parties",
    ],
  },
  {
    id: "glow-party",
    templateId: "party-pop",
    name: "Glow Party Invite",
    icon: "💡",
    tagline: "Neon shapes on a dark canvas",
    ageLabel: "Best for ages 8–13",
    styles: ["Bold", "Minimal"],
    themes: ["Glow"],
    tone: "Bold",
    format: "page",
    description:
      "Blacklight splashes and streaks energize the edges while a subtle glow keeps the center readable.",
    styleDescription:
      "Dark backdrop with neon shapes and splashes around the edges—think glow sticks and paint—but a slightly faded, lighter rectangle in the middle for text.",
    imagePrompt:
      "Blacklight-style background with neon shapes and paint splashes in pink, green, blue, and yellow around the border, slightly glowing lighter area in the center for text, modern and energetic, no text.",
    background: "linear-gradient(135deg, #141E30, #FF00C3)",
    highlight: [
      "Neon border behaves like LED tubing",
      "Center rectangle mimics glowing paper",
      "Perfect for skating rinks or dance nights",
    ],
  },
  {
    id: "art-studio",
    templateId: "sparkle-splash",
    name: "Art Studio Splash Invite",
    icon: "🎨",
    tagline: "Paint splashes with canvas center",
    ageLabel: "Best for ages 5–11",
    styles: ["Illustrated", "Creative"],
    themes: ["Art"],
    tone: "Playful",
    format: "page",
    description:
      "Colorful paint strokes frame a crisp white “canvas” for the event details.",
    styleDescription:
      "Color splashes and paint strokes on the outer edges, with a white “canvas” in the center that looks like a blank art board for the content.",
    imagePrompt:
      "Art studio theme with colorful paint splashes and brush strokes around the borders, white rectangle in the center like a blank canvas for text, bright and creative, no text.",
    background: "linear-gradient(135deg, #FFECC7, #FF8B94)",
    highlight: [
      "Canvas block resembles a real art board",
      "Edge splashes can swap palette colors",
      "Great for craft or painting parties",
    ],
  },
  {
    id: "unicorn-dreams",
    templateId: "birthday-bliss",
    name: "Unicorn Dreams Invite",
    icon: "🦄",
    tagline: "Pastel clouds with glowing center",
    ageLabel: "Best for ages 3–8",
    styles: ["Cute", "Photo"],
    themes: ["Unicorn"],
    tone: "Elegant",
    format: "page",
    description:
      "Soft pastel clouds and a gentle glow keep this invite magical without clutter.",
    styleDescription:
      "Soft clouds and pastel gradient sky with a subtle unicorn silhouette near an edge, leaving the center mostly plain and glowing for text.",
    imagePrompt:
      "Pastel sky with clouds in pink, purple, and blue, small unicorn silhouette near one corner, gentle glow in the center with plenty of empty space for text, dreamy and minimal, no text.",
    background: "linear-gradient(135deg, #D0C1FF, #FFE1F5)",
    highlight: [
      "Glow center makes script fonts shine",
      "Silhouette can swap to any mythical creature",
      "Perfect for cloud, rainbow, or unicorn parties",
    ],
  },
  {
    id: "mini-olympics",
    templateId: "joyful-jamboree",
    name: "Mini Olympics Invite",
    icon: "🏅",
    tagline: "Lane stripes with medal icons",
    ageLabel: "Best for ages 6–10",
    styles: ["Minimal", "Bold"],
    themes: ["Sports"],
    tone: "Playful",
    format: "page",
    description:
      "Colorful ribbons and track lines run along the edges while the center acts like a scoreboard.",
    styleDescription:
      "Clean layout with colorful lane stripes or ribbons along the sides, medal icons near the top, and a clear central box for details.",
    imagePrompt:
      "Sports and Olympics-inspired background with colorful track lanes or ribbons along the sides, simple medal icons near the top border, large white or light center panel for text, crisp and energetic, no text.",
    background: "linear-gradient(135deg, #C6FFDD, #FBD786)",
    highlight: [
      "Ribbons double as progress indicators",
      "Medal row is perfect for achievements",
      "Great for trampoline, gym, or field parties",
    ],
  },
  {
    id: "pirate-island",
    templateId: "birthday-bonanza",
    name: "Pirate Island Invite",
    icon: "🏴‍☠️",
    tagline: "Treasure map parchment layout",
    ageLabel: "Best for ages 4–9",
    styles: ["Illustrated", "Simple"],
    themes: ["Pirate"],
    tone: "Playful",
    format: "page",
    description:
      "Aged parchment texture with compass, ship, and dotted paths leaves the center clear for directions.",
    styleDescription:
      "Treasure map vibe with aged parchment texture, a few drawings of an island, ship, and compass around the edges, but the central area left less detailed for writing.",
    imagePrompt:
      "Pirate treasure map style parchment, simple island, dotted path, and compass near edges, warm aged paper texture, central area light and less detailed for text, vintage illustration, no text.",
    background: "linear-gradient(135deg, #F4E2D8, #C5C6C7)",
    highlight: [
      "Map border feels like a keepsake",
      "Compass corner aligns with RSVP button",
      "Ideal for beach, pool, or ship adventures",
    ],
  },
  {
    id: "winter-wonderland",
    templateId: "party-perfect",
    name: "Winter Wonderland Invite",
    icon: "❄️",
    tagline: "Frosty border with icy glow",
    ageLabel: "Best for ages 4–10",
    styles: ["Minimal", "Photo"],
    themes: ["Seasonal", "Winter"],
    tone: "Elegant",
    format: "page",
    description:
      "Snowflake edges and icy blues fade into a white glow for crisp, classy invitations.",
    styleDescription:
      "Frosty border with snowflakes and soft icy blues. The middle is an almost-white icy glow for easy-to-read text.",
    imagePrompt:
      "Winter wonderland background with snowflakes and frosty patterns along the edges, icy blue and white tones, softly glowing blank center for text, calm and magical, no text.",
    background: "linear-gradient(135deg, #D6F0FF, #F9FCFF)",
    highlight: [
      "Glowing center pairs with serif fonts",
      "Snowflake corners support subtle animations",
      "Great for winter or skating parties",
    ],
  },
  {
    id: "farm-friends",
    templateId: "playful-pals",
    name: "Farm Friends Invite",
    icon: "🐮",
    tagline: "Barn and pasture with open sky",
    ageLabel: "Best for ages 2–6",
    styles: ["Cute", "Illustrated"],
    themes: ["Farm"],
    tone: "Simple",
    format: "page",
    description:
      "Barn, fence, and rolling hills line the bottom so the top sky can showcase all the details.",
    styleDescription:
      "Simple barn and fence outline along the bottom, blue sky and gentle hills in the distance, with a wide open sky area reserved for text.",
    imagePrompt:
      "Cute farm scene with red barn and fence along the bottom edge, green hills and blue sky, small animal silhouettes near corners, large open sky area in the center/top for text, clean and friendly, no text.",
    background: "linear-gradient(135deg, #B7F0A4, #F5FFD0)",
    highlight: [
      "Sky block ideal for multi-line names",
      "Bottom scene leaves space for RSVPs",
      "Perfect for barnyard or petting-zoo events",
    ],
  },
  {
    id: "royal-knights",
    templateId: "cheerful-chaos",
    name: "Royal Knights Invite",
    icon: "🛡️",
    tagline: "Castle shields with scroll center",
    ageLabel: "Best for ages 4–8",
    styles: ["Bold", "Illustrated"],
    themes: ["Knights"],
    tone: "Elegant",
    format: "page",
    description:
      "Shield icons and castle towers guard the corners while the details sit on a parchment scroll.",
    styleDescription:
      "Castle towers or shield shapes in the corners, banners draped along the top, and a central scroll-like panel for all event info.",
    imagePrompt:
      "Medieval knights theme with castle towers and shield icons near corners, banner along the top, parchment-like scroll area in the center for text, bold but not crowded, no text.",
    background: "linear-gradient(135deg, #4C5372, #E2D4F3)",
    highlight: [
      "Scroll panel echoes storybook invites",
      "Banner row is perfect for RSVP notes",
      "Great for castle or quest parties",
    ],
  },
  {
    id: "science-lab",
    templateId: "celebration-craze",
    name: "Science Lab Party Invite",
    icon: "🧪",
    tagline: "Clean lab note with flasks",
    ageLabel: "Best for ages 6–11",
    styles: ["Minimal", "Illustrated"],
    themes: ["Science"],
    tone: "Simple",
    format: "page",
    description:
      "White background with bubbling beakers hugging the edges so the info feels like a lab sheet.",
    styleDescription:
      "Clean white background with flasks, bubbles, and atom icons hugging the edges. The main text block feels like a simple lab note area.",
    imagePrompt:
      "Science lab theme with colorful beakers, flasks, and atom icons near borders, small bubbles rising around edges, white center space left mostly empty for text, modern and minimal, no text.",
    background: "linear-gradient(135deg, #E0F7FA, #C5CAE9)",
    highlight: [
      "Edge icons support animated bubbles",
      "Central note area fits detailed agendas",
      "Ideal for STEM fairs or slime labs",
    ],
  },
  {
    id: "garden-tea",
    templateId: "sweet-surprise",
    name: "Garden Tea Party Invite",
    icon: "🍰",
    tagline: "Delicate florals with teacup",
    ageLabel: "Best for ages 4–10",
    styles: ["Elegant", "Illustrated"],
    themes: ["Garden", "Tea Party"],
    tone: "Elegant",
    format: "card",
    description:
      "Vintage florals and a small teacup illustration border a soft cream panel for details.",
    styleDescription:
      "Delicate florals along the border, maybe a teacup illustration near a corner, and a soft cream or blush center with lots of breathing room.",
    imagePrompt:
      "Garden tea party background with delicate flowers around the border and a small teacup illustration near one corner, soft cream or blush center area with plenty of blank space for text, elegant and light, no text.",
    background: "linear-gradient(135deg, #FFE9E3, #F5FCE3)",
    highlight: [
      "Cream center resembles fine stationery",
      "Teacup corner anchors RSVP info",
      "Lovely for brunches or mommy-and-me teas",
    ],
  },
  {
    id: "movie-star",
    templateId: "party-parade",
    name: "Movie Star Premiere Invite",
    icon: "🎬",
    tagline: "Red carpet with spotlight glow",
    ageLabel: "Best for ages 7–12",
    styles: ["Bold", "Minimal"],
    themes: ["Hollywood"],
    tone: "Bold",
    format: "page",
    description:
      "Spotlights, marquee glow, and a blank “poster” panel turn birthdays into opening night.",
    styleDescription:
      "Red carpet along the bottom, soft spotlight or marquee glow at the top, and a central “poster” space for the birthday details.",
    imagePrompt:
      "Movie premiere background with red carpet at the bottom, subtle spotlights shining down from top corners, faint stars near edges, central blank poster-style panel for text, glam but minimal, no text.",
    background: "linear-gradient(135deg, #1E1E2F, #F6D365)",
    highlight: [
      "Poster panel fits tall typography",
      "Spotlights naturally draw the eye to the title",
      "Great for sleepovers or screening parties",
    ],
  },
  {
    id: "little-chef",
    templateId: "happy-hooray",
    name: "Little Chef Party Invite",
    icon: "👩‍🍳",
    tagline: "Recipe card layout with utensils",
    ageLabel: "Best for ages 4–9",
    styles: ["Cute", "Minimal"],
    themes: ["Cooking"],
    tone: "Simple",
    format: "page",
    description:
      "Utensils, hats, and ingredients line the border while the center mimics a recipe card.",
    styleDescription:
      "Light kitchen background with tiny utensils, hats, and ingredients lining the border, and a recipe-card-style white panel in the center.",
    imagePrompt:
      "Cooking and baking theme with small icons of chef hats, utensils, and ingredients along the borders, soft pastel kitchen tones, central white rectangle resembling a recipe card left blank for text, clean and cute, no text.",
    background: "linear-gradient(135deg, #FFE7C4, #FFF4E6)",
    highlight: [
      "Recipe card format fits timeline + menu",
      "Border icons match cooking-class vibes",
      "Great for cupcake, pizza, or baking parties",
    ],
  },
  {
    id: "outer-castle",
    templateId: "birthday-bash",
    name: "Outer Castle Princess Invite",
    icon: "🏰",
    tagline: "Castle silhouette with open sky",
    ageLabel: "Best for ages 4–9",
    styles: ["Elegant", "Illustrated"],
    themes: ["Princess"],
    tone: "Elegant",
    format: "page",
    description:
      "A tall castle along the bottom with sparkly sky above leaves plenty of room for names.",
    styleDescription:
      "Large castle silhouette along the bottom with sky above it, and lots of open sky area where text will sit, plus subtle sparkles or stars.",
    imagePrompt:
      "Princess castle scene with a tall castle silhouette along the bottom edge, pastel sky above it with faint sparkles or stars, wide open sky area in the center/top for text, magical yet simple, no text.",
    background: "linear-gradient(135deg, #E0C3FC, #8EC5FC)",
    highlight: [
      "Sky section ideal for multi-line names",
      "Sparkles stay outside the text block",
      "Great for royal balls or slumber parties",
    ],
  },
  {
    id: "adventure-camp",
    templateId: "party-palooza",
    name: "Adventure Camp Invite",
    icon: "🏕️",
    tagline: "Tent, trees, and kraft-paper feel",
    ageLabel: "Best for ages 6–11",
    styles: ["Illustrated", "Simple"],
    themes: ["Outdoors"],
    tone: "Simple",
    format: "page",
    description:
      "Tents, pines, and campfire sketches frame a light kraft center for all the adventure info.",
    styleDescription:
      "Tent, trees, and a faux campfire around the edges, with a light “trail map” or kraft-paper-style background and a clear central area for details.",
    imagePrompt:
      "Adventure camp background with simple tent, pine trees, and faux campfire icons around borders, warm kraft-paper-style or light tan background, large clear center area for text, outdoorsy and minimal, no text.",
    background: "linear-gradient(135deg, #C2E59C, #64B3F4)",
    highlight: [
      "Kraft texture feels like a real map",
      "Border icons keep text block tidy",
      "Perfect for campouts or hiking parties",
    ],
  },
];

const HOW_IT_WORKS = [
  {
    title: "Choose a birthday template",
    copy: "Pick an invite that matches your child’s age, personality, and theme.",
  },
  {
    title: "Fill in the details",
    copy: "Add name, age, time, location, and optional photos. Envitefy formats everything for you.",
  },
  {
    title: "Share one smart link",
    copy: "Send by text, WhatsApp, or email. Guests see all info and save to their calendars instantly.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I made my son’s invite in five minutes and just texted the link to everyone.",
    author: "Parent of a 6-year-old",
  },
  {
    quote:
      "No more group chat chaos. One link with RSVP and calendar buttons. Perfect.",
    author: "Parent of an 8-year-old",
  },
  {
    quote:
      "We updated the location the morning of the party and all guests saw it instantly.",
    author: "Parent of a 5-year-old",
  },
];

const LOVE_REASONS = [
  "No design skills required",
  "No apps to download",
  "Works with Google, Apple, and Outlook calendars",
  "Mobile-friendly invite pages",
  "Easy to update if plans change",
];

export default function BirthdaysCreateTemplate({ defaultDate }: Props) {
  const router = useRouter();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );
  const [filters, setFilters] = useState<FilterState>({
    age: "all",
    style: "all",
    theme: "all",
    tone: "all",
    format: "all",
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
    birthdayTemplateCatalog.forEach((template: BirthdayTemplateDefinition) => {
      const variation = template.variations?.[0];
      if (variation) map.set(template.id, variation.id);
    });
    return map;
  }, []);

  const filteredTemplates = useMemo(() => {
    return INVITE_TEMPLATES.filter((template) => {
      if (filters.age !== "all" && !template.ageLabel.includes(filters.age)) {
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
        filters.theme !== "all" &&
        !template.themes.some(
          (theme) => theme.toLowerCase() === filters.theme.toLowerCase()
        )
      ) {
        return false;
      }
      if (filters.tone !== "all" && template.tone !== filters.tone) {
        return false;
      }
      if (filters.format !== "all" && template.format !== filters.format) {
        return false;
      }
      return true;
    });
  }, [filters]);

  const handleFilterChange = (
    key: keyof FilterState,
    value: string | TemplateFormat | InviteTone | "all"
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleUseTemplate = (template: InviteTemplate) => {
    const params = new URLSearchParams();
    params.set("templateId", template.templateId);
    const variationId = templateVariationMap.get(template.templateId);
    if (variationId) params.set("variationId", variationId);
    if (defaultDateIso) params.set("d", defaultDateIso);
    router.push(`/event/birthdays/customize?${params.toString()}`);
  };

  const selectedTemplate = selectedTemplateId
    ? INVITE_TEMPLATES.find((template) => template.id === selectedTemplateId) ??
      null
    : null;

  return (
    <main className={`${poppins.className} ${baloo.variable} bg-[#FAFAFA]`}>
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-10 sm:px-6 lg:px-10">
        <HeroSection
          onBrowse={() =>
            document
              .getElementById("birthday-templates")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        />

        <TrustBar />

        <FilterBar filters={filters} onChange={handleFilterChange} />

        <section id="birthday-templates" className="space-y-6">
          <div className="flex flex-col gap-2 text-[#2F2F2F]">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#FF6FB1]">
              Choose a birthday invite template
            </p>
            <h2
              style={{ fontFamily: "var(--font-baloo)" }}
              className="text-3xl text-[#2F2F2F]"
            >
              Pick a design, add your details, share one smart link
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
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FFB4F3]">
                Envitefy
              </p>
              <p className="mt-3 text-sm text-white/70">
                Shareable birthday invites with one smart link and
                add-to-calendar buttons your guests will actually use.
              </p>
            </div>
            <FooterList
              title="Product"
              items={["How It Works", "Birthday Templates", "Help Center"]}
            />
            <FooterList
              title="Company"
              items={["About", "Blog", "Privacy & Security"]}
            />
            <FooterList
              title="Follow"
              items={["Instagram", "Facebook", "YouTube"]}
            />
          </div>
        </footer>
      </div>

      {selectedTemplate && (
        <TemplatePreviewModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplateId(null)}
          onUse={() => {
            handleUseTemplate(selectedTemplate);
            setSelectedTemplateId(null);
          }}
        />
      )}
    </main>
  );
}

function HeroSection({ onBrowse }: { onBrowse: () => void }) {
  return (
    <section className="rounded-[40px] bg-gradient-to-br from-[#FFE0F0] via-[#D3F9F5] to-[#C7A7F8] p-8 shadow-2xl">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6 text-[#2F2F2F]">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#FF6FB1]">
            Birthday invites
          </p>
          <h1
            style={{ fontFamily: "var(--font-baloo)" }}
            className="text-4xl leading-tight sm:text-5xl"
          >
            Create a Beautiful Birthday Invite in Minutes.
          </h1>
          <p className="text-lg text-[#4A403C]">
            Pick a kid-friendly template, add your details, and share one smart
            link with every guest.
          </p>
          <p className="text-sm font-semibold text-[#4A403C]">
            No apps to install. Works with Google, Apple, and Outlook calendars.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={onBrowse}
              className="inline-flex items-center gap-2 rounded-full bg-[#FF6FB1] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#FF6FB1]/40 transition hover:scale-[1.01]"
            >
              Browse Birthday Templates <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href="#how-envitefy-works"
              className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-6 py-3 text-sm font-semibold text-[#2F2F2F]"
            >
              How Envitefy Works
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
        <div className="rounded-2xl bg-[#FFEEF7] p-4 text-sm text-[#AF4C7E]">
          Candy Dreams Birthday Invite
        </div>
        <div className="rounded-3xl border border-[#F6D8ED] bg-white/95 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[#B075D1]">
                Emma’s turning 6
              </p>
              <h3 className="text-2xl font-semibold text-[#2F2F2F]">
                Candy Dreams Party
              </h3>
            </div>
            <div className="rounded-full bg-[#FFE5F4] px-4 py-2 text-xs font-semibold text-[#AF4C7E]">
              Save to Calendar
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm text-[#4A403C]">
            <p>
              Saturday · 2:00 PM
              <br />
              123 Rainbow Lane, Chicago
            </p>
            <div className="rounded-2xl border border-[#F0D8FF] bg-[#FBF6FF] px-4 py-3 text-xs text-[#643C8F]">
              “Bring your sweetest outfit and get ready for candy crafts!”
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-[#FBE4FF] bg-white/95 p-4 text-sm text-[#4A403C]">
          <p className="font-semibold">Invite link ready</p>
          <p>envitefy.com/emma-6th</p>
        </div>
      </div>
      <div className="pointer-events-none absolute -top-6 right-6 h-20 w-20 rounded-full bg-[#FF6FB1]/40 blur-3xl" />
    </div>
  );
}

function TrustBar() {
  const trustItems = [
    { icon: "📅", label: "1-click Add to Calendar" },
    { icon: "📱", label: "Works on every phone" },
    { icon: "🔒", label: "Private share links" },
    { icon: "🧁", label: "Kid-focused templates" },
    { icon: "⏱️", label: "Built in under 2 minutes" },
  ];
  return (
    <section className="rounded-[32px] border border-[#F4E7FF] bg-white/90 p-4 shadow-sm">
      <div className="grid gap-3 text-sm font-semibold text-[#2F2F2F] sm:grid-cols-3 lg:grid-cols-5">
        {trustItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 rounded-full bg-[#FAF5FF] px-4 py-2"
          >
            <span aria-hidden>{item.icon}</span>
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
    <section className="sticky top-4 z-20 rounded-[32px] border border-[#F1E5FF] bg-white/95 p-4 shadow-md">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#7A6C68]">
        <Filter className="h-4 w-4 text-[#FF6FB1]" /> Filter templates
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <FilterSelect
          label="Age"
          value={filters.age}
          options={AGE_FILTERS}
          onChange={(value) => onChange("age", value)}
        />
        <FilterSelect
          label="Style"
          value={filters.style}
          options={STYLE_FILTERS}
          onChange={(value) => onChange("style", value)}
        />
        <FilterSelect
          label="Theme"
          value={filters.theme}
          options={THEME_FILTERS}
          onChange={(value) => onChange("theme", value)}
        />
        <FilterSelect
          label="Tone"
          value={filters.tone}
          options={TONE_FILTERS}
          onChange={(value) => onChange("tone", value)}
        />
        <FilterSelect
          label="Format"
          value={filters.format}
          options={FORMAT_FILTERS}
          onChange={(value) => onChange("format", value)}
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
        <Palette className="h-4 w-4 text-[#B075D1]" />
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
  template: InviteTemplate;
  onPreview: () => void;
  onUse: () => void;
}) {
  const heroImageSrc = `/templates/birthdays/${
    template.templateId || template.id
  }.webp`;
  return (
    <div className="flex flex-col rounded-[32px] border border-[#F5EAF9] bg-white shadow-sm">
      <div
        className="relative h-48 rounded-t-[32px] overflow-hidden"
        style={{
          backgroundImage: `url(${heroImageSrc})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="relative flex h-full flex-col justify-between gap-2 bg-black/20 p-4 text-white">
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5 text-[#2F2F2F]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#FF6FB1]">
            {template.icon} Invite
          </p>
          <h3 className="text-lg font-semibold">{template.name}</h3>
          <p className="text-sm text-[#6F6460]">{template.tagline}</p>
        </div>
        <div className="rounded-2xl border border-[#F2E6FF] bg-white/90 px-4 py-3 text-sm text-[#4A403C]">
          <p>{template.ageLabel}</p>
          <p>
            Style: {template.styles.join(" · ")} · Format:
            {template.format === "card"
              ? " Card-style invite"
              : " Event page layout"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-[#7B6D68]">
          {template.highlight.slice(0, 2).map((text) => (
            <span
              key={text}
              className="rounded-full bg-[#FFF2FB] px-3 py-1 text-[#B075D1]"
            >
              {text}
            </span>
          ))}
        </div>
        <div className="mt-auto flex gap-3 pt-2">
          <button
            type="button"
            onClick={onUse}
            className="flex-1 rounded-full bg-[#FF6FB1] px-4 py-2 text-sm font-semibold text-white"
          >
            Use This Template
          </button>
          <button
            type="button"
            onClick={onPreview}
            className="flex-1 rounded-full border border-[#E0D4FF] px-4 py-2 text-sm font-semibold text-[#6C5E5A]"
          >
            Preview
          </button>
        </div>
      </div>
    </div>
  );
}

function TemplatePreviewModal({
  template,
  onClose,
  onUse,
}: {
  template: InviteTemplate;
  onClose: () => void;
  onUse: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-[40px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#F2E6FF] px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#FF6FB1]">
              Template preview
            </p>
            <p className="text-2xl font-semibold text-[#2F2F2F]">
              {template.icon} {template.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-[#7B6C68]"
          >
            Close
          </button>
        </div>
        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div
            className="rounded-[32px] border border-[#F2E6FF] bg-white/60 p-4"
            style={{ background: template.background }}
          >
            <div className="rounded-2xl bg-white/85 p-4 text-sm text-[#4A403C] shadow-inner">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#B075D1]">
                Invite layout
              </p>
              <p className="mt-2 text-base font-medium text-[#2F2F2F]">
                {template.styleDescription}
              </p>
            </div>
          </div>
          <div className="space-y-5 text-[#2F2F2F]">
            <div>
              <p className="text-sm font-semibold text-[#B075D1]">
                Description
              </p>
              <p className="text-base text-[#4A403C]">{template.description}</p>
            </div>
            <div className="rounded-2xl border border-[#F7E5FF] bg-[#FFFAFE] px-4 py-3 text-sm text-[#4A403C]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#FF6FB1]">
                Image prompt
              </p>
              <p className="mt-2 text-sm">{template.imagePrompt}</p>
            </div>
            <div className="space-y-2 text-sm text-[#4A403C]">
              <p className="font-semibold">Fields guests see</p>
              <ul className="space-y-1">
                <li>
                  <Check className="mr-2 inline h-4 w-4 text-[#7ED9B0]" />
                  Child’s name & age
                </li>
                <li>
                  <Check className="mr-2 inline h-4 w-4 text-[#7ED9B0]" />
                  Date & time with timezone
                </li>
                <li>
                  <Check className="mr-2 inline h-4 w-4 text-[#7ED9B0]" />
                  Location with optional map link
                </li>
                <li>
                  <Check className="mr-2 inline h-4 w-4 text-[#7ED9B0]" />
                  RSVP email, phone, or link
                </li>
              </ul>
            </div>
            <div className="flex flex-wrap gap-2">
              {template.highlight.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-[#FFF4F9] px-3 py-1 text-xs font-semibold text-[#B075D1]"
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onUse}
                className="flex-1 rounded-full bg-[#FF6FB1] px-4 py-2 text-sm font-semibold text-white"
              >
                Start with This Template
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border border-[#E0D4FF] px-4 py-2 text-sm font-semibold text-[#6C5E5A]"
              >
                Keep browsing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function HowItWorks() {
  return (
    <section id="how-envitefy-works" className="space-y-6">
      <div className="text-[#2F2F2F]">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#FF6FB1]">
          How Envitefy works
        </p>
        <h2
          style={{ fontFamily: "var(--font-baloo)" }}
          className="text-3xl text-[#2F2F2F]"
        >
          Digital invites made for busy parents
        </h2>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {HOW_IT_WORKS.map((step, index) => (
          <div
            key={step.title}
            className="rounded-[28px] border border-[#F2E6FF] bg-white/95 p-6 shadow-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFEEF7] text-lg font-semibold text-[#FF6FB1]">
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
        We handle the invite chaos: Envitefy turns your birthday info into a
        clean, shareable invite and event page with built-in Add to Calendar
        buttons.
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="space-y-4">
      <div className="text-[#2F2F2F]">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#FF6FB1]">
          Parent testimonials
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
            <p className="text-base font-medium">“{testimonial.quote}”</p>
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
        <Wand2 className="h-4 w-4 text-[#B075D1]" /> Why parents love Envitefy
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
