import { CATEGORY_GALLERY_THEMES } from "./category-gallery-themes";
import type { CustomEventCategory } from "./event-custom-design";

export type CustomDesignCategory = CustomEventCategory | "signup-forms";
export type CustomDesignIcon =
  | "cake"
  | "heart"
  | "ribbon"
  | "baby"
  | "flower"
  | "gift"
  | "medal"
  | "flag"
  | "trophy"
  | "goal"
  | "megaphone"
  | "music"
  | "calendar"
  | "paintbrush"
  | "sparkles"
  | "party"
  | "clipboard";

type ProfileContent = {
  headline: string;
  description: string;
  placeholder: string;
  icon: CustomDesignIcon;
  accent: string;
  guidance: string;
};

const CONTENT = {
  birthdays: {
    headline: "Make their birthday unmistakably theirs.",
    description:
      "Share their favorite things, party plans and colors. Preview a birthday page full of personality.",
    placeholder:
      "A space-loving birthday with planets, playful lettering and midnight blue. Add any party details you already know…",
    icon: "cake",
    accent: "#885322",
    guidance:
      "Reflect the honoree's supplied interests and the party's personality. For an open brief, use warm celebratory color and playful display typography; adapt the energy to the stated audience. Do not assume an age, name, gender or children's party.",
  },
  weddings: {
    headline: "Bring your love story to life.",
    description:
      "Tell us about your setting, wedding style and personal touches. Preview a page that feels like the two of you.",
    placeholder:
      "An intimate garden wedding with olive greenery, ivory paper and elegant serif lettering. Include any celebration details you have…",
    icon: "heart",
    accent: "#465f40",
    guidance:
      "Follow the couple's stated style and wedding setting. For an open brief, use botanical details, warm ivory, sage and elegant serif typography. Accommodate modern, cultural, colorful or unconventional wedding styles without assuming traditions, roles or ceremony details.",
  },
  anniversaries: {
    headline: "Celebrate every chapter together.",
    description:
      "Share the milestone, meaningful memories and celebration style. Create an anniversary page with a personal touch.",
    placeholder:
      "An anniversary dinner with champagne tones, flowing ribbons and timeless lettering. Share the milestone only if you want it included…",
    icon: "ribbon",
    accent: "#8a4958",
    guidance:
      "Celebrate shared memories and an explicitly supplied anniversary milestone. For an open brief, use champagne, rose, ribbon details and timeless serif typography. An anniversary number is years together, never a birthday age; do not invent a milestone or personal history.",
  },
  "baby-showers": {
    headline: "A sweet welcome for your little one.",
    description:
      "Describe your shower theme, favorite colors and welcoming details. Preview a page made for this happy beginning.",
    placeholder:
      "A woodland baby shower with gentle animal illustrations, sage green and warm cream. Add any shower details you know…",
    icon: "baby",
    accent: "#536a3d",
    guidance:
      "Create a warm, playful welcome using the host's shower theme. For an open brief, use sage, soft gold, gentle nursery imagery and friendly rounded typography. Do not assume the baby's gender, name or due date.",
  },
  "bridal-showers": {
    headline: "A shower as special as the bride.",
    description:
      "Bring her favorite flowers, colors and little luxuries into a custom bridal-shower page you can preview first.",
    placeholder:
      "A bridal shower inspired by a flower-filled afternoon tea, with blush accents and delicate lettering. Add the details you have…",
    icon: "flower",
    accent: "#8a4864",
    guidance:
      "Reflect the bride's supplied tastes and the shower's gathering style. For an open brief, use blush, warm cream, florals and expressive but readable typography. Keep the occasion a bridal shower; do not turn it into a wedding ceremony or invent traditions.",
  },
  "gender-reveal": {
    headline: "Build the excitement. Keep the surprise.",
    description:
      "Share your reveal idea, colors and party mood. Preview a playful page that keeps everyone guessing.",
    placeholder:
      "A cloud-and-confetti reveal party with balanced blue and pink touches and playful lettering. Keep the result a surprise…",
    icon: "gift",
    accent: "#5f588e",
    guidance:
      "Build anticipation with balanced reveal imagery and playful typography. For an open brief, coordinate sky blue and blush without privileging either. Never imply, print or visually announce the reveal outcome, or invent the baby's name.",
  },
  gymnastics: {
    headline: "Give your meet a standout look.",
    description:
      "Share your meet's atmosphere, team colors and gymnastics inspiration. Preview a page with energy and precision.",
    placeholder:
      "A gymnastics meet with dynamic apparatus imagery, lavender and silver, and crisp athletic lettering. Include supplied meet details…",
    icon: "medal",
    accent: "#69508d",
    guidance:
      "Use the supplied gymnastics discipline, apparatus and team identity. For an open brief, suggest controlled movement, lavender and silver with crisp athletic typography. Preserve whether this is a meet, clinic or practice; do not invent divisions, sessions, scores or athletes.",
  },
  football: {
    headline: "Bring your game-day vision to life.",
    description:
      "Tell us about your team, colors and game-day atmosphere. Preview a football page ready to rally your crowd.",
    placeholder:
      "Friday-night football under stadium lights, with forest green, warm gold and bold condensed lettering. Add your team and event details…",
    icon: "flag",
    accent: "#3d6245",
    guidance:
      "Build around American football field imagery, stadium atmosphere and supplied team colors. For an open brief, use field green, warm gold and bold condensed typography. Preserve the actual event purpose, including a watch party or practice; never invent teams, matchups, logos, kickoff times or scores.",
  },
  "sport-events": {
    headline: "Set the stage for your next sporting event.",
    description:
      "Share the sport, event plans and atmosphere you want. Preview a design that puts your activity at the center.",
    placeholder:
      "A community sporting event with energetic blue tones and bold, readable lettering. Tell us the sport and the details you want included…",
    icon: "trophy",
    accent: "#355d85",
    guidance:
      "Center the actual sport and purpose supplied by the host. For an open brief, use versatile athletic geometry, blue accents and strong readable sans typography. When the sport is unspecified, keep imagery sport-neutral; never silently assume football or invent competition details.",
  },
  soccer: {
    headline: "Create something your club can rally around.",
    description:
      "Bring your club colors, soccer plans and pitch-side energy into a custom page for your community.",
    placeholder:
      "A soccer club gathering with pitch-green accents, flowing movement and clean athletic lettering. Include your club colors and event details…",
    icon: "goal",
    accent: "#306858",
    guidance:
      "Use soccer pitch imagery, flowing movement and the supplied club identity. For an open brief, use pitch green and clean athletic sans typography. Preserve the host's purpose, whether match, training or gathering; do not substitute American football or invent fixtures, players or results.",
  },
  cheerleading: {
    headline: "Let your squad’s spirit shine.",
    description:
      "Share your squad colors, performance plans and favorite details. Preview a cheer page with its own spark.",
    placeholder:
      "A cheer showcase with coral and violet, spirited pom-pom details and bold display lettering. Add the squad and performance details you have…",
    icon: "megaphone",
    accent: "#8b426a",
    guidance:
      "Express squad spirit through rhythmic composition, performance energy and supplied squad colors. For an open brief, use coral and violet with bold display typography. Avoid assumed genders, ages, competitive results or invented routines.",
  },
  "dance-ballet": {
    headline: "Set the scene for a memorable performance.",
    description:
      "Tell us about the dance style, stage mood and performance. Preview a page that moves with your vision.",
    placeholder:
      "A dance recital with flowing shapes, rose and mauve, and graceful title lettering. Tell us the dance style and performance details…",
    icon: "music",
    accent: "#805269",
    guidance:
      "Match the host's actual dance style and stage atmosphere. For an open brief, use flowing composition, rose and mauve with graceful expressive typography. Do not impose ballet imagery on hip-hop, contemporary or another specified style, or invent performers and programs.",
  },
  appointments: {
    headline: "Make the next visit feel simple.",
    description:
      "Share the appointment type, useful details and preferred style. Preview a calm, welcoming page for the visit.",
    placeholder:
      "A welcoming appointment page with soft teal, airy spacing and clear sans-serif lettering. Add only the visit details you want guests to see…",
    icon: "calendar",
    accent: "#28676a",
    guidance:
      "Prioritize calm, clear, welcoming presentation for the supplied appointment type. For an open brief, use soft teal and uncluttered sans typography. Do not assume a medical appointment, add medical advice or imply a booking system, availability or confirmed appointment facts.",
  },
  workshops: {
    headline: "Bring people together to learn and create.",
    description:
      "Describe what you'll teach, the materials and the mood. Preview a workshop page that sparks curiosity.",
    placeholder:
      "A hands-on pottery workshop with clay tones, olive accents and warm editorial lettering. Include the workshop details and materials you provide…",
    icon: "paintbrush",
    accent: "#80582e",
    guidance:
      "Use imagery relevant to the actual craft, subject or learning activity. For an open brief, use warm material textures, clay and olive accents with approachable editorial typography. Do not force an arts-and-crafts theme onto a technical workshop or invent materials, requirements or curriculum.",
  },
  "special-events": {
    headline: "Give your big occasion its own signature.",
    description:
      "Share the occasion, atmosphere and details that make it special. Preview a custom page with a sense of arrival.",
    placeholder:
      "A special evening celebration with atmospheric lighting, violet and blue accents, and statement lettering. Tell us the actual occasion…",
    icon: "sparkles",
    accent: "#695083",
    guidance:
      "Find a distinctive atmosphere and visual signature for the supplied occasion. For an open brief, use violet and blue accents, intentional lighting and statement typography. Do not assume a gala, fundraiser, formal dress code or any event facts.",
  },
  general: {
    headline: "Bring your gathering to life.",
    description:
      "Tell us who you're bringing together and the feeling you want. Preview a page shaped around your own idea.",
    placeholder:
      "A relaxed neighborhood gathering with lilac and sky-blue accents and welcoming lettering. Share the occasion and any details you already know…",
    icon: "party",
    accent: "#60539a",
    guidance:
      "Let the host's actual gathering and idea define the visual direction. For an open brief, use welcoming contemporary typography and lilac or sky-blue accents. Keep the result flexible; do not assume a birthday, wedding or other specific occasion.",
  },
  "signup-forms": {
    headline: "Make joining in feel effortless.",
    description:
      "Share what you're organizing, the roles or items you need, and your style. Preview a signup that welcomes everyone in.",
    placeholder:
      "A community volunteer signup with lavender and sage, welcoming artwork and clear labels. Include only the roles, items or times you actually need…",
    icon: "clipboard",
    accent: "#5d5589",
    guidance:
      "Make participation clear with relevant event imagery, readable form labels and a welcoming hierarchy. For an open brief, use lavender and sage with friendly, readable typography. Support the actual supplied registration, roles, items or times without inventing slots, capacities, availability, bookings or participants. Do not default every signup to volunteering.",
  },
} satisfies Record<CustomDesignCategory, ProfileContent>;

function mixColor(base: string, other: string, amount: number): string {
  return `#${[1, 3, 5]
    .map((offset) =>
      Math.round(
        parseInt(base.slice(offset, offset + 2), 16) * (1 - amount) +
          parseInt(other.slice(offset, offset + 2), 16) * amount,
      )
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

export function getCategoryCustomDesignProfile(category: CustomDesignCategory) {
  const content = CONTENT[category];
  const palette = CATEGORY_GALLERY_THEMES[category];
  return {
    ...content,
    tokens: {
      background: mixColor(palette.wash, "#ffffff", 0.65),
      border: mixColor(palette.wash, content.accent, 0.2),
      soft: palette.wash,
      accent: content.accent,
      hover: mixColor(content.accent, "#000000", 0.18),
      ink: "#342d38",
      muted: "#615563",
    },
  };
}

/** Server-selected defaults only. UI examples and marketing copy never enter extraction. */
export function categoryCustomDesignGuidance(category: CustomDesignCategory): string {
  const profile = CONTENT[category];
  return `CATEGORY DESIGN DEFAULTS (${category}): ${profile.guidance}
These are visual starting points, never event facts or mandatory colors. The host's explicit description and reference image take priority over category defaults. On refinements, preserve the current design's subjects, palette and typography unless the host requests a change; do not reset it to these defaults. Honor the selected reference-image mode. Do not add facts, wording, roles or quantities from category examples.`;
}
