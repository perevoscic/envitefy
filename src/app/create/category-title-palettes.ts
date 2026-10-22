import type { CreateCategory, CreateGuess } from "@/lib/create/create-intent";
import type { HolidayCollectionId } from "@/lib/holiday-collections";

// Title colors belong to the occasion, never its position or the current season.
// Dark variants keep the same identity with lighter inks over the shared aurora.
const palettes = {
  halloween: { light: ["#ae4609", "#28232d"], dark: ["#ffad66", "#e5d9cd"] },
  christmas: { light: ["#17623e", "#ad2638"], dark: ["#86dca4", "#ff9caa"] },
  harvest: { light: ["#a34b16", "#884024"], dark: ["#f7bc72", "#f8a785"] },
  cornfield: { light: ["#536622", "#91601b"], dark: ["#c3d888", "#f0c67c"] },
  evergreen: { light: ["#22653e", "#4e681f"], dark: ["#8bdda9", "#c4dc87"] },
  rose: { light: ["#a42b62", "#ac293e"], dark: ["#f5a2ce", "#ff9dae"] },
  spring: { light: ["#7e40a0", "#a32c6c"], dark: ["#d5b0f4", "#f5abd6"] },
  floral: { light: ["#a23470", "#704b9c"], dark: ["#f3acd5", "#cdb4ed"] },
  ocean: { light: ["#285da0", "#176b76"], dark: ["#a3caff", "#85d8e1"] },
  patriotic: { light: ["#a52e3e", "#284d93"], dark: ["#ffa2ae", "#a9c8ff"] },
  redGold: { light: ["#ae2936", "#906017"], dark: ["#ffaaa9", "#f3d182"] },
  midnightGold: { light: ["#3c405d", "#89601d"], dark: ["#d3d0e9", "#f2d18c"] },
  blueSilver: { light: ["#2857a4", "#59657b"], dark: ["#a4c9ff", "#dde3ef"] },
  honey: { light: ["#8c601c", "#a33d33"], dark: ["#efd08b", "#f8b1a1"] },
  earth: { light: ["#8a4931", "#37683e"], dark: ["#e7b391", "#a8d4a1"] },
  marigold: { light: ["#a54a13", "#873985"], dark: ["#ffc181", "#e6a8e6"] },
  violetGold: { light: ["#713b99", "#896017"], dark: ["#d6aff2", "#eed486"] },
  jewel: { light: ["#186b52", "#8d2944"], dark: ["#8fd9b6", "#f7a2b8"] },
  tealGold: { light: ["#1b6861", "#90601c"], dark: ["#90dacf", "#f0cf8b"] },
  festival: { light: ["#a42d7b", "#28649a"], dark: ["#f7a4df", "#98d0f8"] },
  amberBlue: { light: ["#9d5117", "#345795"], dark: ["#ffc184", "#abc8ff"] },
  berry: { light: ["#a03577", "#6d429f"], dark: ["#f4acd8", "#d0b1f4"] },
  lavender: { light: ["#69459c", "#4a5c9c"], dark: ["#ceb5f0", "#b6c7f6"] },
  pinkBlue: { light: ["#a63477", "#2d649c"], dark: ["#f7acd9", "#a2ceff"] },
} satisfies Record<string, { light: [string, string]; dark: [string, string] }>;

type PaletteName = keyof typeof palettes;

const holidayPalettes: Record<HolidayCollectionId, PaletteName> = {
  "new-years-day": "midnightGold",
  "mlk-day": "midnightGold",
  "presidents-day": "patriotic",
  "memorial-day": "patriotic",
  juneteenth: "jewel",
  "july-fourth": "patriotic",
  "labor-day": "patriotic",
  "columbus-day": "ocean",
  "veterans-day": "patriotic",
  thanksgiving: "harvest",
  christmas: "christmas",
  "new-years-eve": "midnightGold",
  "valentines-day": "rose",
  "st-patricks-day": "evergreen",
  "mardi-gras": "violetGold",
  easter: "spring",
  "mothers-day": "floral",
  "fathers-day": "ocean",
  "earth-day": "evergreen",
  "cinco-de-mayo": "jewel",
  halloween: "halloween",
  "indigenous-peoples-day": "earth",
  "day-of-the-dead": "marigold",
  "lunar-new-year": "redGold",
  passover: "blueSilver",
  "rosh-hashanah": "honey",
  "yom-kippur": "blueSilver",
  sukkot: "cornfield",
  hanukkah: "blueSilver",
  kwanzaa: "jewel",
  ramadan: "tealGold",
  "eid-al-fitr": "tealGold",
  "eid-al-adha": "tealGold",
  diwali: "marigold",
  holi: "festival",
  nowruz: "evergreen",
  vaisakhi: "amberBlue",
  "corn-maze": "cornfield",
  "trunk-or-treat": "halloween",
  "fall-harvest": "harvest",
  friendsgiving: "harvest",
  "summer-camp": "evergreen",
  "back-to-school": "amberBlue",
  graduation: "midnightGold",
};

const categoryPalettes: Record<CreateCategory, PaletteName> = {
  birthdays: "berry",
  weddings: "midnightGold",
  anniversaries: "rose",
  "baby-showers": "spring",
  "bridal-showers": "floral",
  "gender-reveal": "pinkBlue",
  appointments: "ocean",
  "medical-appointments": "tealGold",
  graduations: "midnightGold",
  housewarming: "earth",
  "open-house": "tealGold",
  "religious-events": "violetGold",
  workshops: "amberBlue",
  "special-events": "festival",
  "signup-forms": "ocean",
  sports: "ocean",
  "holidays-seasonal": "harvest",
  general: "lavender",
};

const sportPalettes: Record<string, PaletteName> = {
  gymnastics: "lavender",
  football: "evergreen",
  basketball: "amberBlue",
  baseball: "patriotic",
  softball: "midnightGold",
  soccer: "evergreen",
  hockey: "blueSilver",
  swimming: "ocean",
  tennis: "cornfield",
};

export function categoryTitlePalette(choice: CreateGuess) {
  const name = choice.category === "holidays-seasonal" && choice.occasion
    ? holidayPalettes[choice.occasion]
    : choice.category === "sports" && choice.sport
      ? sportPalettes[choice.sport] || categoryPalettes.sports
      : categoryPalettes[choice.category];
  return { name, ...palettes[name] };
}
