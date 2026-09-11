import type { GymMeetDiscoverySection, GymMeetTemplateId } from "./types";

export type GymnasticsPresentation = {
  layout:
    | "atlas"
    | "scoreboard"
    | "garden"
    | "workshop"
    | "tide"
    | "campus"
    | "orbit"
    | "festival"
    | "folio"
    | "trail"
    | "exhibition"
    | "ledger";
  surface:
    | "contour"
    | "cut"
    | "arch"
    | "bracket"
    | "wave"
    | "pennant"
    | "capsule"
    | "offset"
    | "ruled"
    | "stone"
    | "facet"
    | "bound"
    | "double"
    | "petal"
    | "ticket"
    | "oval"
    | "notch"
    | "terrace"
    | "scallop"
    | "frame";
  heading: "index" | "display" | "center" | "label" | "ribbon" | "seal" | "underline" | "side";
  cards: "split" | "lanes" | "petals" | "ledger" | "steps" | "podium" | "mosaic" | "tickets";
  navigation: "index" | "segments" | "ribbon" | "directory";
  attendance: "closing" | "opening" | "sidebar" | "invitation";
  flow: "program" | "visitor" | "competition" | "travel" | "team";
};

function presentation(
  layout: GymnasticsPresentation["layout"],
  surface: GymnasticsPresentation["surface"],
  heading: GymnasticsPresentation["heading"],
  cards: GymnasticsPresentation["cards"],
  navigation: GymnasticsPresentation["navigation"],
  attendance: GymnasticsPresentation["attendance"],
  flow: GymnasticsPresentation["flow"] = "program",
): GymnasticsPresentation {
  return { layout, surface, heading, cards, navigation, attendance, flow };
}

/** Explicit art direction, never an index/modulo or color-derived template assignment.
 * Each design has a different structural layout + panel silhouette pairing.
 * These choices also apply when a meet has only one information section.
 */
export const GYMNASTICS_PRESENTATIONS = {
  "airborne-atlas": presentation("atlas", "contour", "index", "split", "index", "closing"),
  "neon-runway": presentation(
    "scoreboard",
    "cut",
    "display",
    "lanes",
    "segments",
    "sidebar",
    "competition",
  ),
  "petal-poise": presentation(
    "garden",
    "arch",
    "center",
    "petals",
    "ribbon",
    "invitation",
    "visitor",
  ),
  "copper-grip": presentation(
    "workshop",
    "bracket",
    "label",
    "ledger",
    "directory",
    "sidebar",
    "team",
  ),
  "tidal-tumble": presentation("tide", "wave", "underline", "steps", "ribbon", "closing", "travel"),
  "crimson-collegiate": presentation(
    "campus",
    "pennant",
    "ribbon",
    "podium",
    "segments",
    "opening",
    "competition",
  ),
  "moonbeam-balance": presentation("orbit", "capsule", "seal", "split", "directory", "invitation"),
  "citrus-springboard": presentation(
    "festival",
    "offset",
    "display",
    "mosaic",
    "segments",
    "opening",
    "visitor",
  ),
  "monochrome-flight": presentation("folio", "ruled", "side", "ledger", "index", "closing"),
  "desert-dismount": presentation(
    "trail",
    "stone",
    "index",
    "steps",
    "directory",
    "sidebar",
    "travel",
  ),
  "prism-routine": presentation("exhibition", "facet", "display", "mosaic", "ribbon", "opening"),
  "maple-medal": presentation("ledger", "bound", "label", "tickets", "index", "closing", "team"),
  "electric-orchid": presentation(
    "scoreboard",
    "frame",
    "side",
    "mosaic",
    "directory",
    "opening",
    "competition",
  ),
  "porcelain-podium": presentation(
    "exhibition",
    "double",
    "center",
    "podium",
    "index",
    "invitation",
    "visitor",
  ),
  "rally-pennants": presentation(
    "campus",
    "ticket",
    "label",
    "tickets",
    "directory",
    "sidebar",
    "team",
  ),
  "rose-quartz-rise": presentation(
    "garden",
    "facet",
    "seal",
    "split",
    "directory",
    "closing",
    "visitor",
  ),
  "velocity-blueprint": presentation(
    "workshop",
    "frame",
    "index",
    "lanes",
    "index",
    "closing",
    "competition",
  ),
  "jungle-cartwheel": presentation(
    "trail",
    "petal",
    "ribbon",
    "petals",
    "segments",
    "opening",
    "travel",
  ),
  "saffron-salute": presentation(
    "folio",
    "arch",
    "center",
    "steps",
    "ribbon",
    "invitation",
    "visitor",
  ),
  "silver-apparatus": presentation(
    "ledger",
    "bracket",
    "side",
    "lanes",
    "segments",
    "sidebar",
    "competition",
  ),
  "aurora-chalk": presentation(
    "orbit",
    "wave",
    "underline",
    "steps",
    "ribbon",
    "closing",
    "travel",
  ),
  "peach-practice": presentation(
    "festival",
    "scallop",
    "center",
    "petals",
    "directory",
    "invitation",
    "team",
  ),
  "grandstand-gold": presentation(
    "campus",
    "double",
    "display",
    "split",
    "index",
    "invitation",
    "competition",
  ),
  "indigo-ink": presentation("folio", "bound", "index", "tickets", "directory", "sidebar"),
  "coral-clubhouse": presentation(
    "tide",
    "terrace",
    "ribbon",
    "mosaic",
    "segments",
    "opening",
    "visitor",
  ),
  "alpine-ascent": presentation("trail", "cut", "display", "lanes", "index", "closing", "travel"),
  "confetti-kip": presentation(
    "festival",
    "notch",
    "seal",
    "tickets",
    "ribbon",
    "closing",
    "visitor",
  ),
  "midnight-marquee": presentation(
    "scoreboard",
    "ticket",
    "ribbon",
    "podium",
    "ribbon",
    "invitation",
    "competition",
  ),
  "willow-warmup": presentation("garden", "petal", "side", "steps", "index", "sidebar", "team"),
  "studio-arc": presentation("exhibition", "arch", "side", "ledger", "directory", "closing"),
  "cherry-blossom-vault": presentation(
    "garden",
    "scallop",
    "ribbon",
    "mosaic",
    "segments",
    "opening",
    "visitor",
  ),
  "oceanic-rings": presentation("orbit", "oval", "center", "petals", "index", "sidebar", "travel"),
  "flame-focus": presentation(
    "scoreboard",
    "pennant",
    "index",
    "steps",
    "index",
    "closing",
    "competition",
  ),
  "lilac-leap": presentation(
    "exhibition",
    "capsule",
    "seal",
    "tickets",
    "segments",
    "sidebar",
    "visitor",
  ),
  "court-of-champions": presentation(
    "campus",
    "frame",
    "seal",
    "ledger",
    "ribbon",
    "closing",
    "competition",
  ),
  "papaya-pop": presentation(
    "festival",
    "petal",
    "ribbon",
    "podium",
    "index",
    "sidebar",
    "visitor",
  ),
  "obsidian-precision": presentation(
    "folio",
    "bracket",
    "display",
    "split",
    "segments",
    "opening",
    "competition",
  ),
  "bluebird-morning": presentation(
    "tide",
    "arch",
    "center",
    "tickets",
    "index",
    "invitation",
    "visitor",
  ),
  "terrazzo-team": presentation(
    "workshop",
    "offset",
    "seal",
    "mosaic",
    "ribbon",
    "opening",
    "team",
  ),
  "amethyst-arena": presentation(
    "orbit",
    "facet",
    "display",
    "podium",
    "segments",
    "opening",
    "competition",
  ),
  "golden-hour-gym": presentation("atlas", "arch", "side", "steps", "ribbon", "invitation"),
  "aqua-acrobat": presentation(
    "tide",
    "notch",
    "label",
    "lanes",
    "directory",
    "sidebar",
    "competition",
  ),
  "red-clay-rotation": presentation(
    "workshop",
    "stone",
    "center",
    "petals",
    "segments",
    "invitation",
    "team",
  ),
  "starfall-session": presentation(
    "orbit",
    "notch",
    "index",
    "tickets",
    "directory",
    "closing",
    "competition",
  ),
  "daisy-daybreak": presentation(
    "garden",
    "oval",
    "label",
    "podium",
    "ribbon",
    "invitation",
    "visitor",
  ),
  "metro-motion": presentation("atlas", "cut", "ribbon", "lanes", "segments", "sidebar", "travel"),
  "velvet-victory": presentation(
    "exhibition",
    "scallop",
    "ribbon",
    "petals",
    "ribbon",
    "invitation",
    "visitor",
  ),
  "mint-condition": presentation("ledger", "ruled", "underline", "split", "ribbon", "closing"),
  "sunflower-salute": presentation(
    "campus",
    "arch",
    "center",
    "steps",
    "directory",
    "opening",
    "visitor",
  ),
  "polar-parallel": presentation(
    "atlas",
    "terrace",
    "label",
    "podium",
    "directory",
    "opening",
    "travel",
  ),
  "sienna-scorebook": presentation(
    "ledger",
    "ticket",
    "index",
    "ledger",
    "directory",
    "opening",
    "team",
  ),
  "bubblegum-bounce": presentation(
    "festival",
    "capsule",
    "underline",
    "steps",
    "segments",
    "invitation",
    "visitor",
  ),
  "evergreen-elevation": presentation(
    "trail",
    "arch",
    "seal",
    "podium",
    "ribbon",
    "invitation",
    "travel",
  ),
  "cobalt-circuit": presentation(
    "workshop",
    "notch",
    "ribbon",
    "tickets",
    "index",
    "sidebar",
    "competition",
  ),
  "ruby-ribbonline": presentation(
    "folio",
    "pennant",
    "ribbon",
    "podium",
    "ribbon",
    "invitation",
    "visitor",
  ),
  "sandstone-spring": presentation(
    "trail",
    "terrace",
    "side",
    "split",
    "directory",
    "closing",
    "travel",
  ),
  "lavender-locker": presentation(
    "ledger",
    "offset",
    "seal",
    "lanes",
    "segments",
    "invitation",
    "team",
  ),
  "solar-somersault": presentation("tide", "oval", "display", "podium", "ribbon", "opening"),
  "blackberry-beam": presentation(
    "atlas",
    "bound",
    "center",
    "tickets",
    "index",
    "invitation",
    "team",
  ),
  "skyline-sendoff": presentation(
    "scoreboard",
    "terrace",
    "underline",
    "split",
    "segments",
    "closing",
    "travel",
  ),
} satisfies Record<GymMeetTemplateId, GymnasticsPresentation>;

const SECTION_FLOWS: Record<GymnasticsPresentation["flow"], string[]> = {
  program: [
    "meet_overview",
    "announcements",
    "schedule",
    "session_assignments",
    "admission",
    "registration",
  ],
  visitor: ["meet_overview", "admission", "venue", "traffic_parking", "schedule", "registration"],
  competition: [
    "meet_overview",
    "schedule",
    "session_assignments",
    "results",
    "registration",
    "coaches",
  ],
  travel: ["meet_overview", "venue", "traffic_parking", "hotels", "schedule", "admission"],
  team: [
    "meet_overview",
    "coaches",
    "registration",
    "schedule",
    "session_assignments",
    "documents",
  ],
};

export function orderGymnasticsSections(
  sections: GymMeetDiscoverySection[],
  flow: GymnasticsPresentation["flow"],
): GymMeetDiscoverySection[] {
  const priority = SECTION_FLOWS[flow];
  const rank = (kind: string) => {
    const index = priority.indexOf(kind);
    return index < 0 ? priority.length : index;
  };
  return [...sections].sort((a, b) => rank(a.kind) - rank(b.kind));
}
