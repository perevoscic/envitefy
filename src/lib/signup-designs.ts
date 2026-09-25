import { SIGNUP_TEMPLATES } from "@/assets/signup-templates";
import { HOLIDAY_COLLECTIONS } from "@/lib/holiday-collections";
import type { SignupFontPair } from "@/types/signup";

export const SIGNUP_COMPOSITIONS = {
  gazette: { name: "The community gazette", font: "literary", board: "ledger" },
  menu: { name: "The supper club", font: "classic", board: "menu" },
  botanical: { name: "In the garden", font: "editorial", board: "outline" },
  poster: { name: "The club poster", font: "display", board: "tiles" },
  ticket: { name: "The admission ticket", font: "modern", board: "tickets" },
  journal: { name: "The field journal", font: "friendly", board: "ledger" },
  invitation: { name: "A special invitation", font: "classic", board: "outline" },
  scrapbook: { name: "The maker's scrapbook", font: "friendly", board: "tiles" },
  studio: { name: "The open studio", font: "modern", board: "outline" },
  marquee: { name: "After hours", font: "display", board: "tickets" },
  panorama: { name: "The great outdoors", font: "editorial", board: "tiles" },
  ledger: { name: "The organized agenda", font: "modern", board: "ledger" },
} as const satisfies Record<string, { name: string; font: SignupFontPair; board: string }>;

export type SignupComposition = keyof typeof SIGNUP_COMPOSITIONS;
export type SignupMotif = "sprig" | "star" | "sun" | "diamond" | "stitch" | "orbit";

// Curated paper/ink combinations. Light foregrounds on dark covers use onAccent;
// the signup board always retains a light surface for forms and availability.
export const SIGNUP_DESIGN_PALETTES = {
  cider: {
    page: "#EFE0C9",
    surface: "#FFF9EF",
    soft: "#EAD1AF",
    ink: "#382918",
    accent: "#884426",
    secondary: "#C79545",
  },
  moss: {
    page: "#E4E8DC",
    surface: "#FAFBF3",
    soft: "#D4DCC7",
    ink: "#263B2B",
    accent: "#36593D",
    secondary: "#B6C08D",
  },
  terracotta: {
    page: "#EEDDD4",
    surface: "#FFF8F1",
    soft: "#E7C5B1",
    ink: "#432A22",
    accent: "#944730",
    secondary: "#D69369",
  },
  plum: {
    page: "#E9DDE6",
    surface: "#FFFAFC",
    soft: "#DEC6D8",
    ink: "#3D253C",
    accent: "#714163",
    secondary: "#C792AD",
  },
  marine: {
    page: "#DCE7EE",
    surface: "#F6FBFF",
    soft: "#C7DCE9",
    ink: "#16364B",
    accent: "#245A78",
    secondary: "#86B9C8",
  },
  olive: {
    page: "#E8E5D6",
    surface: "#FCFAEF",
    soft: "#DAD5B5",
    ink: "#383A24",
    accent: "#565B30",
    secondary: "#BCB472",
  },
  rose: {
    page: "#F1DFDE",
    surface: "#FFF9F5",
    soft: "#EAC5CA",
    ink: "#502D38",
    accent: "#884358",
    secondary: "#DCA4AA",
  },
  ink: {
    page: "#E3E2DE",
    surface: "#FBFAF6",
    soft: "#D8D7D1",
    ink: "#292A2A",
    accent: "#30383D",
    secondary: "#B7B7AA",
  },
  ochre: {
    page: "#EFE4C8",
    surface: "#FFFCF2",
    soft: "#EAD49A",
    ink: "#42331D",
    accent: "#7D591D",
    secondary: "#D9AE4B",
  },
  lavender: {
    page: "#E7E2F1",
    surface: "#FCFAFF",
    soft: "#D8CDEC",
    ink: "#372C50",
    accent: "#655187",
    secondary: "#B5A3D5",
  },
  evergreen: {
    page: "#DEE6E0",
    surface: "#F7FAF6",
    soft: "#C8D8CC",
    ink: "#193F32",
    accent: "#24553F",
    secondary: "#8BAA87",
  },
  cherry: {
    page: "#EEE0D6",
    surface: "#FFF9ED",
    soft: "#E5C3B9",
    ink: "#482725",
    accent: "#8B3435",
    secondary: "#CC7360",
  },
  cobalt: {
    page: "#DFE5F0",
    surface: "#FBFCFF",
    soft: "#CBD6EB",
    ink: "#223C69",
    accent: "#2D4F91",
    secondary: "#F0C364",
  },
  teal: {
    page: "#DCE9E5",
    surface: "#F8FDFA",
    soft: "#C3DDD5",
    ink: "#203E3B",
    accent: "#28615A",
    secondary: "#87B6A8",
  },
  cocoa: {
    page: "#E7DFD4",
    surface: "#FCF8F0",
    soft: "#D7C6B0",
    ink: "#3D3027",
    accent: "#6F4C36",
    secondary: "#B9976F",
  },
  apricot: {
    page: "#F2E1CF",
    surface: "#FFFAF0",
    soft: "#EFCFB0",
    ink: "#4B342D",
    accent: "#92543A",
    secondary: "#DBA572",
  },
  midnight: {
    page: "#DCDDE4",
    surface: "#FAFAFE",
    soft: "#CDCFDE",
    ink: "#28283E",
    accent: "#353554",
    secondary: "#B8A6D4",
  },
  sage: {
    page: "#E7EADF",
    surface: "#FBFCF5",
    soft: "#D4DDCA",
    ink: "#344635",
    accent: "#4E684D",
    secondary: "#B5C6A0",
  },
  aubergine: {
    page: "#E7DDE1",
    surface: "#FFF8F9",
    soft: "#D8C1CB",
    ink: "#402C38",
    accent: "#653950",
    secondary: "#C094A6",
  },
  slate: {
    page: "#DFE5E6",
    surface: "#F8FCFC",
    soft: "#CCD7DA",
    ink: "#2D424B",
    accent: "#3D5B69",
    secondary: "#9BB8BF",
  },
} as const;
type Palette = keyof typeof SIGNUP_DESIGN_PALETTES;
type Recipe = readonly [
  slug: string,
  composition: SignupComposition,
  palette: Palette,
  motif: SignupMotif,
  reverse?: boolean,
];

// Every entry is deliberately assigned a composition and palette. Stable names
// keep a saved design independent of catalog order, pagination, and search.
const RECIPES: Record<string, readonly Recipe[]> = {
  "winter-and-holidays": [
    ["classroom-christmas-party", "scrapbook", "evergreen", "star"],
    ["school-winter-celebration", "scrapbook", "marine", "star"],
    ["community-christmas-dinner", "menu", "evergreen", "diamond"],
    ["holiday-cookie-exchange", "menu", "rose", "diamond"],
    ["christmas-toy-drive", "scrapbook", "cherry", "star"],
    ["holiday-gift-wrapping", "studio", "plum", "star"],
    ["hanukkah-community-potluck", "invitation", "cobalt", "star"],
    ["school-valentine-party", "scrapbook", "rose", "star"],
  ],
  "school-and-education": [
    ["parent-teacher-conferences", "ledger", "cobalt", "star", true],
    ["classroom-reading-volunteers", "gazette", "ochre", "star", true],
    ["school-book-fair", "journal", "cocoa", "star"],
    ["school-field-day", "gazette", "teal", "star", true],
    ["teacher-appreciation-breakfast", "menu", "rose", "star"],
    ["classroom-supply-drive", "scrapbook", "cobalt", "sprig"],
    ["field-trip-chaperones", "journal", "marine", "star"],
    ["school-science-fair", "studio", "teal", "star"],
    ["school-art-show", "scrapbook", "lavender", "star"],
    ["school-carnival", "ticket", "cherry", "star", true],
    ["school-talent-show", "marquee", "midnight", "star", true],
    ["school-musical-backstage-crew", "studio", "aubergine", "star"],
    ["school-band-concert", "invitation", "midnight", "star"],
    ["school-robotics-tournament", "menu", "cobalt", "star"],
    ["school-stem-night", "scrapbook", "ochre", "sprig"],
    ["family-math-night", "poster", "marine", "star", true],
    ["school-multicultural-night", "menu", "terracotta", "star"],
    ["school-picture-day", "studio", "slate", "star", true],
    ["school-library-helpers", "gazette", "moss", "star"],
    ["school-garden-volunteers", "botanical", "evergreen", "star"],
    ["school-lunchroom-volunteers", "ledger", "apricot", "star"],
    ["school-pta-meeting", "menu", "evergreen", "sprig"],
    ["school-family-bingo-night", "gazette", "plum", "star", true],
    ["school-graduation-reception", "gazette", "midnight", "star", true],
    ["school-uniform-swap", "ledger", "sage", "star"],
  ],
  editorial: [
    ["clean-clear", "studio", "slate", "orbit"],
    ["harvest-table", "menu", "terracotta", "sprig"],
    ["school-days", "scrapbook", "cobalt", "star"],
    ["game-day", "poster", "evergreen", "star"],
    ["community-garden", "botanical", "sage", "sprig"],
    ["celebrate-together", "invitation", "rose", "diamond"],
  ],
  "fall-and-seasonal": [
    ["school-trunk-or-treat", "ticket", "terracotta", "star"],
    ["apple-picking", "journal", "cider", "sprig"],
    ["fall-scene", "panorama", "ochre", "sun"],
    ["fall-fun-2", "poster", "terracotta", "star"],
    ["harvest-table", "menu", "olive", "sprig"],
    ["pumpkin-patch", "ticket", "cider", "sun"],
    ["fall-forest", "botanical", "moss", "sprig"],
    ["fall-food-drive", "gazette", "cherry", "diamond"],
    ["fall-gathering", "scrapbook", "cocoa", "stitch"],
    ["corn-maze", "journal", "ochre", "diamond", true],
    ["autumn-blessings", "invitation", "olive", "sprig"],
    ["thanksgiving-feast", "menu", "cider", "diamond", true],
    ["friendsgiving", "gazette", "terracotta", "star"],
    ["fall-food", "studio", "cocoa", "sun"],
    ["fall-leaves", "botanical", "terracotta", "sprig", true],
    ["fall-y-all", "poster", "ochre", "sun", true],
    ["fall-festival", "marquee", "cherry", "star"],
    ["fall-pumpkins", "scrapbook", "apricot", "stitch", true],
  ],
  "church-and-community": [
    ["community-park-cleanup", "journal", "moss", "star"],
    ["community-garden-workday", "botanical", "terracotta", "star"],
    ["neighborhood-meal-train", "menu", "cider", "star"],
    ["winter-coat-drive", "gazette", "marine", "star"],
    ["community-blood-drive-helpers", "ledger", "cherry", "star"],
    ["animal-shelter-volunteers", "scrapbook", "ochre", "diamond"],
    ["library-summer-reading", "gazette", "apricot", "star"],
    ["community-repair-cafe", "gazette", "slate", "star", true],
    ["school-backpack-packing", "menu", "cobalt", "sprig"],
    ["community-senior-luncheon", "menu", "rose", "sprig"],
    ["community-egg-hunt", "botanical", "lavender", "star"],
    ["service-project", "journal", "evergreen", "diamond"],
    ["community-picnic", "menu", "sage", "sun"],
    ["bible-study", "gazette", "cocoa", "sprig"],
    ["mission-trip", "panorama", "marine", "orbit"],
    ["church-gathering", "invitation", "ochre", "diamond"],
    ["volunteer-sign-up", "poster", "teal", "star"],
    ["worship-team", "marquee", "midnight", "sun"],
    ["sunday-school", "scrapbook", "ochre", "star"],
    ["fundraiser", "ticket", "cherry", "diamond"],
    ["food-drive", "ledger", "olive", "sprig"],
  ],
  "sports-and-recreation": [
    ["swim-team", "panorama", "teal", "sun"],
    ["cheer-squad", "poster", "plum", "star"],
    ["track-meet", "ticket", "ochre", "orbit"],
    ["baseball-team", "gazette", "cobalt", "star"],
    ["sports-banquet", "marquee", "evergreen", "diamond"],
    ["gymnastics", "studio", "lavender", "orbit"],
    ["fitness-class", "poster", "cobalt", "sun"],
    ["soccer-game", "journal", "evergreen", "star"],
    ["basketball-practice", "poster", "terracotta", "orbit", true],
    ["golf-tournament", "botanical", "olive", "diamond"],
  ],
  "fundraising-and-food": [
    ["car-wash", "poster", "marine", "sun"],
    ["bake-sale", "scrapbook", "rose", "stitch"],
    ["charity-gala", "invitation", "midnight", "diamond"],
    ["restaurant-night", "menu", "cherry", "star"],
    ["food-pantry", "ledger", "cider", "sprig"],
    ["auction-event", "marquee", "aubergine", "diamond"],
    ["donation-drive", "gazette", "teal", "orbit"],
    ["vendor-fair", "journal", "apricot", "stitch"],
    ["raffle", "ticket", "cobalt", "star"],
    ["potluck-dinner", "menu", "cocoa", "sprig", true],
  ],
  "family-and-personal": [
    ["anniversary-celebration", "invitation", "plum", "diamond"],
    ["family-event", "scrapbook", "moss", "stitch"],
    ["housewarming", "studio", "terracotta", "sprig"],
    ["birthday-party", "poster", "rose", "sun"],
    ["block-party", "gazette", "ochre", "star"],
    ["wedding", "botanical", "sage", "diamond"],
    ["baby-shower", "invitation", "apricot", "star"],
    ["game-night", "ticket", "plum", "diamond"],
    ["bridal-shower", "botanical", "rose", "sprig"],
    ["family-holiday", "menu", "evergreen", "star"],
  ],
  "business-and-professional": [
    ["conference-schedule", "ledger", "cobalt", "orbit"],
    ["client-meeting", "studio", "ink", "diamond"],
    ["team-lunch", "menu", "teal", "sun"],
    ["corporate-event", "marquee", "slate", "orbit"],
    ["workshop", "journal", "cocoa", "stitch"],
    ["networking-night", "ticket", "midnight", "orbit"],
    ["professional-gathering", "gazette", "slate", "diamond"],
    ["office-meeting", "ledger", "sage", "diamond", true],
    ["training-session", "poster", "cobalt", "diamond", true],
  ],
  "other-special-interest": [
    ["tech-event", "poster", "midnight", "orbit"],
    ["political-campaign", "gazette", "cobalt", "diamond", true],
    ["gaming-tournament", "marquee", "plum", "star"],
    ["environment-and-cleanup", "journal", "sage", "sprig"],
    ["senior-services", "studio", "apricot", "sun"],
    ["travel-group", "panorama", "teal", "orbit", true],
    ["real-estate-open-house", "ledger", "cocoa", "diamond"],
    ["arts-and-culture", "studio", "aubergine", "star", true],
    ["pets-and-animals", "scrapbook", "ochre", "sun", true],
  ],
  general: [
    ["hoa-meeting", "gazette", "evergreen", "diamond"],
    ["ad-hoc-meeting", "studio", "marine", "orbit"],
    ["board-meeting", "ledger", "ink", "diamond"],
    ["team-planning-session", "journal", "cobalt", "orbit"],
    ["volunteer-orientation", "poster", "sage", "star"],
    ["town-hall-meeting", "gazette", "cherry", "star", true],
    ["community-discussion", "menu", "moss", "sprig"],
    ["staff-training", "ticket", "slate", "orbit"],
    ["committee-meeting", "ledger", "olive", "diamond", true],
    ["monthly-meetup", "scrapbook", "lavender", "sun"],
    ["project-kickoff", "poster", "teal", "orbit", true],
    ["workshop-registration", "studio", "ochre", "stitch"],
  ],
  "parties-and-events": [
    ["birthday-party", "ticket", "apricot", "star"],
    ["wedding", "invitation", "sage", "sprig"],
    ["baby-shower", "scrapbook", "lavender", "star", true],
    ["game-night", "poster", "aubergine", "diamond"],
    ["bridal-shower", "invitation", "lavender", "sprig"],
    ["family-holiday", "gazette", "plum", "star"],
    ["holiday-party", "marquee", "cherry", "diamond", true],
    ["graduation-party", "ticket", "midnight", "star", true],
    ["retirement-party", "menu", "marine", "diamond"],
    ["engagement-party", "botanical", "aubergine", "sprig", true],
  ],
  "health-and-fitness": [
    ["fitness-class", "poster", "lavender", "sun"],
    ["yoga-class", "botanical", "cocoa", "sun"],
    ["pilates-class", "studio", "sage", "orbit"],
    ["spin-class", "ticket", "cobalt", "orbit", true],
    ["zumba-class", "poster", "plum", "sun", true],
    ["bootcamp-class", "journal", "olive", "star"],
    ["dance-class", "invitation", "rose", "sun", true],
    ["morning-run", "panorama", "apricot", "sun"],
    ["cycling-club", "gazette", "evergreen", "orbit", true],
    ["crossfit-session", "marquee", "ink", "diamond"],
    ["martial-arts-class", "studio", "ink", "sun", true],
    ["boxing-class", "poster", "cherry", "star"],
    ["swimming-lessons", "ticket", "marine", "sun"],
    ["tennis-club", "ledger", "moss", "orbit"],
    ["basketball-league", "marquee", "terracotta", "star", true],
    ["volleyball-league", "panorama", "cider", "sun", true],
    ["wellness-workshop", "botanical", "teal", "sprig", true],
  ],
  "clubs-and-groups": [
    ["scout-campout-helpers", "journal", "olive", "sprig"],
    ["youth-sports-concessions", "menu", "cherry", "sprig"],
    ["youth-club-snack-rotation", "menu", "apricot", "star"],
    ["youth-service-day", "menu", "teal", "star"],
    ["booster-club-pancake-breakfast", "menu", "cider", "sprig"],
    ["book-club", "gazette", "cocoa", "diamond", true],
    ["running-club", "poster", "olive", "orbit"],
    ["bike-club", "ticket", "teal", "orbit"],
    ["hiking-club.png", "journal", "moss", "sprig", true],
    ["rock-climbing-club", "poster", "cocoa", "diamond"],
    ["swim-club", "studio", "marine", "sun", true],
    ["soccer-club", "ticket", "evergreen", "star"],
    ["baseball-club", "gazette", "midnight", "sun"],
    ["basketball-club", "poster", "ochre", "orbit"],
    ["football-club", "marquee", "cocoa", "star"],
    ["tennis-club", "ledger", "evergreen", "orbit", true],
    ["volleyball-club", "panorama", "marine", "star", true],
    ["golf-club", "invitation", "moss", "diamond"],
    ["cheerleading-club", "ticket", "plum", "star", true],
    ["dance-club", "studio", "rose", "sun"],
    ["drive-group", "gazette", "ink", "orbit"],
    ["fisherman-group", "journal", "marine", "sprig"],
    ["horseback-riding-group", "panorama", "cocoa", "diamond"],
    ["bird-watching-group.png", "botanical", "olive", "sprig", true],
    ["gardening-group", "journal", "terracotta", "sprig"],
    ["reading-group", "invitation", "cocoa", "sprig", true],
    ["writing-group", "gazette", "aubergine", "stitch"],
    ["cooking-group", "menu", "terracotta", "sun"],
    ["baking-group", "menu", "ochre", "stitch", true],
    ["painting-group", "scrapbook", "marine", "stitch"],
    ["pottery-group", "studio", "cider", "sun", true],
    ["knitting-group", "scrapbook", "sage", "stitch", true],
    ["crocheting-group", "botanical", "lavender", "stitch"],
    ["sewing-group", "ledger", "rose", "stitch"],
    ["quilting-group", "scrapbook", "aubergine", "stitch"],
  ],
};

export type SignupDesign = {
  id: string;
  composition: SignupComposition;
  palette: Palette;
  motif: SignupMotif;
  reverse: boolean;
  name: string;
  artwork: string;
  fontPair: SignupFontPair;
  board: (typeof SIGNUP_COMPOSITIONS)[SignupComposition]["board"];
};
const artworkById = new Map(
  Object.values(SIGNUP_TEMPLATES)
    .flat()
    .map((item) => [
      item.path
        .replace("/templates/signup/", "")
        .replace(/\.webp$/, "")
        .replaceAll("/", "--"),
      item,
    ]),
);
const holidayCompositions = ["panorama", "botanical", "gazette", "journal", "poster", "invitation", "scrapbook", "menu", "studio", "ticket"] as const satisfies readonly SignupComposition[];
export const HOLIDAY_SIGNUP_DESIGNS: readonly SignupDesign[] = HOLIDAY_COLLECTIONS.flatMap((collection) =>
  collection.designs.map((design, index) => {
    const composition = holidayCompositions[index];
    return {
      id: `holidays--${collection.id}--${design.slug}`,
      name: `${collection.name} · ${design.name}`,
      artwork: `/templates/signup/holidays/${collection.id}/${design.slug}.webp`,
      composition,
      palette: collection.palettes[index % collection.palettes.length],
      motif: (["sprig", "stitch", "diamond"] as const)[index % 3],
      reverse: index === 4 || index === 9,
      fontPair: SIGNUP_COMPOSITIONS[composition].font,
      board: SIGNUP_COMPOSITIONS[composition].board,
    };
  }),
);
export const SIGNUP_DESIGNS: readonly SignupDesign[] = [...Object.entries(RECIPES).flatMap(
  ([group, recipes]) =>
    recipes.map(([slug, composition, palette, motif, reverse = false]) => {
      const id = `${group}--${slug}`;
      const asset = artworkById.get(id);
      return {
        id,
        composition,
        palette,
        motif,
        reverse,
        name:
          asset?.name ||
          (id === "editorial--clean-clear" ? "Clean & Clear" : "") ||
          slug
            .split("-")
            .map((word) => word[0].toUpperCase() + word.slice(1))
            .join(" "),
        artwork: asset
          ? asset.artworkPath || asset.path
          : `/templates/signup/editorial/${slug}.webp`,
        fontPair: SIGNUP_COMPOSITIONS[composition].font,
        board: SIGNUP_COMPOSITIONS[composition].board,
      };
    }),
), ...HOLIDAY_SIGNUP_DESIGNS];
const designsById = new Map(SIGNUP_DESIGNS.map((design) => [design.id, design]));
export const getSignupDesign = (id?: string | null) => (id ? designsById.get(id) : undefined);
