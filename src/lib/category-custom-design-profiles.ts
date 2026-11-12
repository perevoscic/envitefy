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
    headline: "All the party plans, one birthday page.",
    description:
      "Turn your party plans into a page guests can use for the time, place and celebration details. Review it before sharing.",
    placeholder:
      "Who are you celebrating? Add the date, place, party plans and anything guests should know. Include a favorite theme or colors if you have them…",
    icon: "cake",
    accent: "#885322",
    guidance:
      "Reflect the honoree's supplied interests and the party's personality. For an open brief, use warm celebratory color and playful display typography; adapt the energy to the stated audience. Do not assume an age, name, gender or children's party.",
  },
  weddings: {
    headline: "Your wedding plans, together in one place.",
    description:
      "Bring the celebration schedule, venue and guest information into one wedding page. Make it yours, then share it with your guests.",
    placeholder:
      "Add your names, celebration dates, venues, schedule and guest notes. Include your wedding style or colors if you have them…",
    icon: "heart",
    accent: "#465f40",
    guidance:
      "Follow the couple's stated style and wedding setting. For an open brief, use botanical details, warm ivory, sage and elegant serif typography. Accommodate modern, cultural, colorful or unconventional wedding styles without assuming traditions, roles or ceremony details.",
  },
  anniversaries: {
    headline: "Bring everyone together for your anniversary.",
    description:
      "Turn your celebration plans and shared memories into a page with the details your guests need. Review and edit before sharing.",
    placeholder:
      "Who are you celebrating? Add the date, place, celebration plans and any memories or milestone you want to share. Include a style if you have one…",
    icon: "ribbon",
    accent: "#8a4958",
    guidance:
      "Celebrate shared memories and an explicitly supplied anniversary milestone. For an open brief, use champagne, rose, ribbon details and timeless serif typography. An anniversary number is years together, never a birthday age; do not invent a milestone or personal history.",
  },
  "baby-showers": {
    headline: "Your shower plans, ready to share.",
    description:
      "Bring the shower details, registry links and guest notes into one welcoming page. Review everything before sending it to family and friends.",
    placeholder:
      "Add who the shower is for, the date, place, registry links and anything guests should know. Include a shower theme or colors if you like…",
    icon: "baby",
    accent: "#536a3d",
    guidance:
      "Create a warm, playful welcome using the host's shower theme. For an open brief, use sage, soft gold, gentle nursery imagery and friendly rounded typography. Do not assume the baby's gender, name or due date.",
  },
  "bridal-showers": {
    headline: "Bring the bridal shower details together.",
    description:
      "Create one page for the shower plans, registry and personal touches, so guests can find what they need before the celebration.",
    placeholder:
      "Add the bride’s name, shower date, venue, registry links and guest notes. Include her favorite style or flowers if you want…",
    icon: "flower",
    accent: "#8a4864",
    guidance:
      "Reflect the bride's supplied tastes and the shower's gathering style. For an open brief, use blush, warm cream, florals and expressive but readable typography. Keep the occasion a bridal shower; do not turn it into a wedding ceremony or invent traditions.",
  },
  "gender-reveal": {
    headline: "Share the party plans. Keep the surprise.",
    description:
      "Put the reveal party’s time, place and guest details on one page while keeping the outcome a surprise. Preview before sharing.",
    placeholder:
      "Add the reveal party date, location, plans and anything guests should bring. Describe a theme if you have one, without revealing the surprise…",
    icon: "gift",
    accent: "#5f588e",
    guidance:
      "Build anticipation with balanced reveal imagery and playful typography. For an open brief, coordinate sky blue and blush without privileging either. Never imply, print or visually announce the reveal outcome, or invent the baby's name.",
  },
  gymnastics: {
    headline: "Your meet details, in one place.",
    description:
      "Turn meet information into a page for coaches and families, with session times, venue and travel notes together. Review the details, then share one link.",
    placeholder:
      "Paste your meet details: event name, dates, venue, session times and any arrival or travel notes for families. Add team colors or a preferred look if you have them…",
    icon: "medal",
    accent: "#69508d",
    guidance:
      "Use the supplied gymnastics discipline, apparatus and team identity. For an open brief, suggest controlled movement, lavender and silver with crisp athletic typography. Preserve whether this is a meet, clinic or practice; do not invent divisions, sessions, scores or athletes.",
  },
  football: {
    headline: "Keep your team’s game-day details together.",
    description:
      "Turn your football plans into a page with times, locations and team notes, so coaches, parents and fans can use the same link.",
    placeholder:
      "Add the team, event or season, dates, locations and arrival notes. Paste any schedule you want included, and team colors if you have them…",
    icon: "flag",
    accent: "#3d6245",
    guidance:
      "Build around American football field imagery, stadium atmosphere and supplied team colors. For an open brief, use field green, warm gold and bold condensed typography. Preserve the actual event purpose, including a watch party or practice; never invent teams, matchups, logos, kickoff times or scores.",
  },
  "sport-events": {
    headline: "One page for your sporting event plans.",
    description:
      "Bring your schedule, location and participant notes together so teams and families can find the event details in one place.",
    placeholder:
      "What sport and event are you organizing? Add dates, locations, schedule and participant notes. Include team colors or a style if you like…",
    icon: "trophy",
    accent: "#355d85",
    guidance:
      "Center the actual sport and purpose supplied by the host. For an open brief, use versatile athletic geometry, blue accents and strong readable sans typography. When the sport is unspecified, keep imagery sport-neutral; never silently assume football or invent competition details.",
  },
  soccer: {
    headline: "Your soccer plans, ready for the whole club.",
    description:
      "Put fixtures, pitch locations and team instructions on a page coaches and families can share. Review the supplied details before publishing.",
    placeholder:
      "Add your club, event dates, pitch locations, fixtures or training times, and notes for families. Include club colors if you have them…",
    icon: "goal",
    accent: "#306858",
    guidance:
      "Use soccer pitch imagery, flowing movement and the supplied club identity. For an open brief, use pitch green and clean athletic sans typography. Preserve the host's purpose, whether match, training or gathering; do not substitute American football or invent fixtures, players or results.",
  },
  cheerleading: {
    headline: "Keep your squad and families on the same page.",
    description:
      "Bring performance times, venue and squad instructions into one cheer page for coaches and families. Check the details before sharing.",
    placeholder:
      "Add the squad, event name, dates, venue, performance times and arrival instructions. Include squad colors or a preferred style if you want…",
    icon: "megaphone",
    accent: "#8b426a",
    guidance:
      "Express squad spirit through rhythmic composition, performance energy and supplied squad colors. For an open brief, use coral and violet with bold display typography. Avoid assumed genders, ages, competitive results or invented routines.",
  },
  "dance-ballet": {
    headline: "All the performance details, one shared page.",
    description:
      "Turn recital or dance plans into a page with performance times, venue and audience notes, ready for dancers and families to use.",
    placeholder:
      "Add the dance style, performance name, dates, venue, schedule and notes for dancers or guests. Include a stage mood or colors if you like…",
    icon: "music",
    accent: "#805269",
    guidance:
      "Match the host's actual dance style and stage atmosphere. For an open brief, use flowing composition, rose and mauve with graceful expressive typography. Do not impose ballet imagery on hip-hop, contemporary or another specified style, or invent performers and programs.",
  },
  appointments: {
    headline: "Keep the visit details within reach.",
    description:
      "Organize the time, place and preparation notes on a clear appointment page. Choose which details to include before sharing.",
    placeholder:
      "Add the appointment type, date, time, location and preparation notes you want to share. Include only information intended for this page’s readers…",
    icon: "calendar",
    accent: "#28676a",
    guidance:
      "Prioritize calm, clear, welcoming presentation for the supplied appointment type. For an open brief, use soft teal and uncluttered sans typography. Do not assume a medical appointment, add medical advice or imply a booking system, availability or confirmed appointment facts.",
  },
  workshops: {
    headline: "Help participants arrive ready to learn.",
    description:
      "Bring your workshop schedule, location and materials list into one page, so participants can find the plan and what to bring.",
    placeholder:
      "What is the workshop about? Add the date, location, schedule, requirements and materials participants should bring. Include a style if you have one…",
    icon: "paintbrush",
    accent: "#80582e",
    guidance:
      "Use imagery relevant to the actual craft, subject or learning activity. For an open brief, use warm material textures, clay and olive accents with approachable editorial typography. Do not force an arts-and-crafts theme onto a technical workshop or invent materials, requirements or curriculum.",
  },
  "special-events": {
    headline: "Make your occasion easier to plan around.",
    description:
      "Turn the occasion’s schedule, location and guest notes into one personal event page. Review the page before sharing your link.",
    placeholder:
      "What is the occasion? Add dates, venue, schedule and anything your guests should know. Include a mood or design direction if you want…",
    icon: "sparkles",
    accent: "#695083",
    guidance:
      "Find a distinctive atmosphere and visual signature for the supplied occasion. For an open brief, use violet and blue accents, intentional lighting and statement typography. Do not assume a gala, fundraiser, formal dress code or any event facts.",
  },
  general: {
    headline: "Turn your event plans into one useful page.",
    description:
      "Bring the time, place and guest information together in an editable event page. Make it yours, then share one link with everyone.",
    placeholder:
      "What are you organizing? Add the event name, date, place, plans and guest notes. Include colors or a preferred look if you have one…",
    icon: "party",
    accent: "#60539a",
    guidance:
      "Let the host's actual gathering and idea define the visual direction. For an open brief, use welcoming contemporary typography and lilac or sky-blue accents. Keep the result flexible; do not assume a birthday, wedding or other specific occasion.",
  },
  "signup-forms": {
    headline: "Turn what you need into a clear signup.",
    description:
      "Describe the roles, items or times you need. Review an editable signup form, then share one place for people to join in.",
    placeholder:
      "What are you organizing, and what can people sign up for? Add actual roles, items, times and capacities, plus the event details. Include a style if you like…",
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
