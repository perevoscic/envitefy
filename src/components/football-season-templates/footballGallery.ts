import { GYM_MEET_TEMPLATE_LIBRARY } from "./registry";
import type { GymMeetTemplateId } from "./types";

// Lead with recognizable team, heritage and stadium scenes, then the full collection.
// The opening rows mix photographic and illustrated art in stable masonry columns.
const openingDesigns: GymMeetTemplateId[] = [
  "parent-command",
  "stadium-mosaic",
  "stitched-season",
  "launchpad-editorial",
  "coastal-kickoff",
  "paper-stadium",
  "friday-night",
  "stained-glass-sunday",
  "clay-play",
  "womens-gridiron",
  "risograph-rush",
  "copper-kickoff",
];

const openingRanks = new Map(openingDesigns.map((id, index) => [id, index]));

export const FOOTBALL_GALLERY_DESIGNS = [...GYM_MEET_TEMPLATE_LIBRARY].sort(
  (left, right) =>
    (openingRanks.get(left.id) ?? openingDesigns.length) -
    (openingRanks.get(right.id) ?? openingDesigns.length),
);
