export type BirthdayExperienceComposition =
  | "editorial-split"
  | "poster-stage"
  | "arch-invitation"
  | "scrapbook-collage"
  | "ticket-marquee"
  | "storybook-window"
  | "scoreboard-rush"
  | "gallery-minimal"
  | "postcard-panorama"
  | "bento-party"
  | "portal-glow"
  | "menu-board"
  | "keepsake-letter"
  | "magazine-cover";

export type BirthdayBodyComposition =
  | "celebration-bento"
  | "editorial-ledger"
  | "party-timeline"
  | "storybook-chapters"
  | "scrapbook-wall"
  | "ticket-program"
  | "scoreboard-grid"
  | "gallery-exhibition"
  | "postcard-route"
  | "magazine-columns"
  | "menu-table"
  | "constellation-map"
  | "minimal-rail"
  | "arched-suite"
  | "ribbon-run"
  | "festival-lineup"
  | "passport-stamps"
  | "newspaper-front"
  | "neon-club"
  | "garden-path"
  | "memory-book"
  | "comic-panels"
  | "polaroid-desk"
  | "stage-program"
  | "cake-layers"
  | "orbit-dashboard";

export type BirthdayExperienceProfile = {
  composition: BirthdayExperienceComposition;
  compositionLabel: string;
  mediaFrame: string;
  titleTreatment: string;
  detailPattern: string;
  bodyComposition: BirthdayBodyComposition;
  bodyCompositionLabel: string;
  factTreatment: string;
  galleryTreatment: string;
  sectionOrder: string;
  hostTreatment: string;
  scheduleTreatment: string;
  surface: string;
  ctaTreatment: string;
  motion: string;
  imagePosition: string;
  ornament: string;
  tone: "dark" | "light";
  accentMix: number;
  eyebrow: string;
  signature: string;
  bodySignature: string;
};

export type BirthdayExperienceSource = {
  id: string;
  name: string;
  style: string;
  category: string;
  family: string;
  heroMood: string;
  occasion: string;
  audience: string;
  primaryColor: string;
  decorations?: { graphicType?: string };
};

export const BIRTHDAY_EXPERIENCE_COMPOSITIONS: readonly BirthdayExperienceComposition[];
export const BIRTHDAY_EXPERIENCE_MEDIA_FRAMES: readonly string[];
export const BIRTHDAY_EXPERIENCE_TITLE_TREATMENTS: readonly string[];
export const BIRTHDAY_BODY_COMPOSITIONS: readonly BirthdayBodyComposition[];
export const BIRTHDAY_BODY_FACT_TREATMENTS: readonly string[];
export const BIRTHDAY_BODY_GALLERY_TREATMENTS: readonly string[];

export function buildBirthdayExperienceProfiles<T extends BirthdayExperienceSource>(
  designs: readonly T[],
): Array<T & { experience: BirthdayExperienceProfile }>;
