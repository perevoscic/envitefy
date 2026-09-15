import { GYM_MEET_TEMPLATE_LIBRARY } from "./registry";
import type { GymMeetTemplateId } from "./types";

// Lead with recognizable team, heritage and stadium scenes, then the full collection.
// The opening rows mix photographic and illustrated art in stable masonry columns.
const openingDesigns: GymMeetTemplateId[] = [
  "parent-command",
  "homecoming",
  "sunday-ink",
  "launchpad-editorial",
  "coastal-kickoff",
  "saturday-morning",
  "friday-night",
  "chrome-league",
  "pep-rally",
  "womens-gridiron",
  "leather-linen",
  "pennant-club",
];

const openingRanks = new Map(openingDesigns.map((id, index) => [id, index]));

export const FOOTBALL_GALLERY_DESIGNS = [...GYM_MEET_TEMPLATE_LIBRARY].sort(
  (left, right) =>
    (openingRanks.get(left.id) ?? openingDesigns.length) -
    (openingRanks.get(right.id) ?? openingDesigns.length),
);
