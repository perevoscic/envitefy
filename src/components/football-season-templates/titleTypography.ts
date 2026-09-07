import type { CSSProperties } from "react";

import { getGymMeetTemplateMeta } from "./registry";
import {
  GymMeetTemplateId,
  GymMeetTitleTypographyId,
} from "./types";

export type GymMeetTitleTypographySpec = {
  id: GymMeetTitleTypographyId;
  fontFamilyName: string;
  googleFontSource: string;
  cardClassName: string;
  heroClassName: string;
  fontStyle: CSSProperties;
};

const TYPOGRAPHY_FONT_MAP: Record<
  GymMeetTitleTypographyId,
  { family: string; fallback: string }
> = {
  anton: { family: "Anton", fallback: "Impact, 'Arial Black', sans-serif" },
  audiowide: { family: "Audiowide", fallback: "'Trebuchet MS', sans-serif" },
  "barlow-condensed": {
    family: "Barlow Condensed",
    fallback: "'Roboto Condensed', 'Arial Narrow', sans-serif",
  },
  bungee: { family: "Bungee", fallback: "Impact, 'Arial Black', sans-serif" },
  cormorant: {
    family: "Cormorant Garamond",
    fallback: "Garamond, 'Times New Roman', serif",
  },
  exo2: { family: "Exo 2", fallback: "Inter, Helvetica, sans-serif" },
  "ibm-plex-mono": {
    family: "IBM Plex Mono",
    fallback: "'SFMono-Regular', 'Courier New', monospace",
  },
  kanit: { family: "Kanit", fallback: "Inter, Helvetica, sans-serif" },
  "league-spartan": {
    family: "League Spartan",
    fallback: "Montserrat, 'Arial Black', sans-serif",
  },
  manrope: { family: "Manrope", fallback: "Inter, Helvetica, sans-serif" },
  montserrat: { family: "Montserrat", fallback: "Inter, Helvetica, sans-serif" },
  orbitron: { family: "Orbitron", fallback: "Audiowide, 'Trebuchet MS', sans-serif" },
  oswald: { family: "Oswald", fallback: "'Roboto Condensed', 'Arial Narrow', sans-serif" },
  playfair: {
    family: "Playfair Display",
    fallback: "Georgia, 'Times New Roman', serif",
  },
  poppins: { family: "Poppins", fallback: "Inter, Helvetica, sans-serif" },
  "press-start-2p": {
    family: "Press Start 2P",
    fallback: "'Courier New', monospace",
  },
  sora: { family: "Sora", fallback: "Inter, Helvetica, sans-serif" },
  "space-mono": {
    family: "Space Mono",
    fallback: "'SFMono-Regular', 'Courier New', monospace",
  },
};

export const GYM_MEET_TITLE_TYPOGRAPHY: Record<
  GymMeetTitleTypographyId,
  GymMeetTitleTypographySpec
> = Object.fromEntries(
  Object.entries(TYPOGRAPHY_FONT_MAP).map(([id, font]) => [
    id,
    {
      id: id as GymMeetTitleTypographyId,
      fontFamilyName: font.family,
      googleFontSource: "css font stack",
      cardClassName: "",
      heroClassName: "",
      fontStyle: { fontFamily: `"${font.family}", ${font.fallback}` },
    },
  ])
) as Record<GymMeetTitleTypographyId, GymMeetTitleTypographySpec>;

export const getGymMeetTitleTypography = (
  templateId: GymMeetTemplateId
): GymMeetTitleTypographySpec => {
  const template = getGymMeetTemplateMeta(templateId);
  const typographyId = template.titleTypographyId || "montserrat";
  return GYM_MEET_TITLE_TYPOGRAPHY[typographyId];
};
