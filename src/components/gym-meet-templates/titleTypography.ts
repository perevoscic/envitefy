import {
  Anton,
  Audiowide,
  Barlow_Condensed,
  Bungee,
  Cormorant_Garamond,
  Exo_2,
  IBM_Plex_Mono,
  Kanit,
  League_Spartan,
  Manrope,
  Montserrat,
  Orbitron,
  Oswald,
  Playfair_Display,
  Poppins,
  Press_Start_2P,
  Sora,
  Space_Mono,
} from "next/font/google";
import type { CSSProperties } from "react";

import { getGymMeetTemplateMeta } from "./registry";
import {
  GymMeetTemplateId,
  GymMeetTitleTypographyId,
} from "./types";

const anton = Anton({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const audiowide = Audiowide({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  display: "swap",
});

const bungee = Bungee({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const exo2 = Exo_2({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const kanit = Kanit({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const leagueSpartan = League_Spartan({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "700", "800"],
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const pressStart2p = Press_Start_2P({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "700", "800"],
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

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
  { className: string; style: { fontFamily: string }; family: string }
> = {
  anton: { className: anton.className, style: anton.style, family: "Anton" },
  audiowide: {
    className: audiowide.className,
    style: audiowide.style,
    family: "Audiowide",
  },
  "barlow-condensed": {
    className: barlowCondensed.className,
    style: barlowCondensed.style,
    family: "Barlow Condensed",
  },
  bungee: { className: bungee.className, style: bungee.style, family: "Bungee" },
  cormorant: {
    className: cormorant.className,
    style: cormorant.style,
    family: "Cormorant Garamond",
  },
  exo2: { className: exo2.className, style: exo2.style, family: "Exo 2" },
  "ibm-plex-mono": {
    className: ibmPlexMono.className,
    style: ibmPlexMono.style,
    family: "IBM Plex Mono",
  },
  kanit: { className: kanit.className, style: kanit.style, family: "Kanit" },
  "league-spartan": {
    className: leagueSpartan.className,
    style: leagueSpartan.style,
    family: "League Spartan",
  },
  manrope: {
    className: manrope.className,
    style: manrope.style,
    family: "Manrope",
  },
  montserrat: {
    className: montserrat.className,
    style: montserrat.style,
    family: "Montserrat",
  },
  orbitron: {
    className: orbitron.className,
    style: orbitron.style,
    family: "Orbitron",
  },
  oswald: { className: oswald.className, style: oswald.style, family: "Oswald" },
  playfair: {
    className: playfair.className,
    style: playfair.style,
    family: "Playfair Display",
  },
  poppins: {
    className: poppins.className,
    style: poppins.style,
    family: "Poppins",
  },
  "press-start-2p": {
    className: pressStart2p.className,
    style: pressStart2p.style,
    family: "Press Start 2P",
  },
  sora: { className: sora.className, style: sora.style, family: "Sora" },
  "space-mono": {
    className: spaceMono.className,
    style: spaceMono.style,
    family: "Space Mono",
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
      googleFontSource: "next/font/google",
      cardClassName: font.className,
      heroClassName: font.className,
      fontStyle: { fontFamily: font.style.fontFamily },
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
