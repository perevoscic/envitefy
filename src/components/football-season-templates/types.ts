/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck

export type GymMeetTemplateId =
  | "launchpad-editorial"
  | "elite-athlete"
  | "bento-box"
  | "parent-command"
  | "varsity-classic"
  | "weekend-journey"
  | "scouting-report"
  | "cyber-athlete"
  | "paper-proto"
  | "sunset-arena"
  | "pop-art"
  | "swiss-grid"
  | "art-deco"
  | "concrete-gym"
  | "midnight-frost"
  | "eco-motion"
  | "holo-elite"
  | "glitch-sport"
  | "organic-flow"
  | "pixel-arena"
  | "architect-clean"
  | "noir-silhouette"
  | "vaporwave-grid"
  | "heavy-impact"
  | "blueprint-tech"
  | "toxic-kinetic"
  | "luxe-magazine"
  | "chalk-strike"
  | "podium-lights"
  | "judges-sheet"
  | "spring-energy"
  | "club-classic"
  | "aurora-lift"
  | "ribbon-editorial"
  | "medal-poster"
  | "vault-grid"
  | "travel-briefing";

export type GymMeetTemplateGroup =
  | "current"
  | "showcase"
  | "bold"
  | "classic"
  | "editorial"
  | "dashboard";

export type GymMeetTemplateLayoutFamily = "standard" | "editorial" | "dashboard" | "app-shell";

export type GymMeetTitleTypographyId =
  | "anton"
  | "audiowide"
  | "barlow-condensed"
  | "bungee"
  | "cormorant"
  | "exo2"
  | "ibm-plex-mono"
  | "kanit"
  | "league-spartan"
  | "manrope"
  | "montserrat"
  | "orbitron"
  | "oswald"
  | "playfair"
  | "poppins"
  | "press-start-2p"
  | "sora"
  | "space-mono";

export type GymMeetPageTemplateMeta = {
  id: GymMeetTemplateId;
  name: string;
  style: string;
  description: string;
  group: GymMeetTemplateGroup;
  layoutFamily: GymMeetTemplateLayoutFamily;
  thumbnailMode: "rendered-card";
  previewTitle: string;
  previewKicker: string;
  previewClassName: string;
  previewAccentClassName: string;
  titleTypographyId?: GymMeetTitleTypographyId;
  previewTitleClassName?: string;
};

