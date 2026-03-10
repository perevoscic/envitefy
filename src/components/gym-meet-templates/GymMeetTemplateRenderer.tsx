/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
"use client";

import React from "react";
import {
  DEFAULT_GYM_MEET_TEMPLATE_ID,
  resolveGymMeetTemplateId,
} from "./registry";
import BentoBoxTemplate from "./renderers/BentoBoxTemplate";
import BlueprintTechTemplate from "./renderers/BlueprintTechTemplate";
import ChalkStrikeTemplate from "./renderers/ChalkStrikeTemplate";
import ClubClassicTemplate from "./renderers/ClubClassicTemplate";
import ConcreteGymTemplate from "./renderers/ConcreteGymTemplate";
import AuroraLiftTemplate from "./renderers/AuroraLiftTemplate";
import ArtDecoTemplate from "./renderers/ArtDecoTemplate";
import CyberAthleteTemplate from "./renderers/CyberAthleteTemplate";
import EcoMotionTemplate from "./renderers/EcoMotionTemplate";
import EliteAthleteTemplate from "./renderers/EliteAthleteTemplate";
import HeavyImpactTemplate from "./renderers/HeavyImpactTemplate";
import HoloEliteTemplate from "./renderers/HoloEliteTemplate";
import JudgesSheetTemplate from "./renderers/JudgesSheetTemplate";
import LuxeMagazineTemplate from "./renderers/LuxeMagazineTemplate";
import MedalPosterTemplate from "./renderers/MedalPosterTemplate";
import MidnightFrostTemplate from "./renderers/MidnightFrostTemplate";
import ParentCommandTemplate from "./renderers/ParentCommandTemplate";
import PaperProtoTemplate from "./renderers/PaperProtoTemplate";
import PodiumLightsTemplate from "./renderers/PodiumLightsTemplate";
import PopArtTemplate from "./renderers/PopArtTemplate";
import RibbonEditorialTemplate from "./renderers/RibbonEditorialTemplate";
import ScoutingReportTemplate from "./renderers/ScoutingReportTemplate";
import SpringEnergyTemplate from "./renderers/SpringEnergyTemplate";
import SunsetArenaTemplate from "./renderers/SunsetArenaTemplate";
import ToxicKineticTemplate from "./renderers/ToxicKineticTemplate";
import TravelBriefingTemplate from "./renderers/TravelBriefingTemplate";
import VaporwaveGridTemplate from "./renderers/VaporwaveGridTemplate";
import VaultGridTemplate from "./renderers/VaultGridTemplate";
import VarsityClassicTemplate from "./renderers/VarsityClassicTemplate";
import WeekendJourneyTemplate from "./renderers/WeekendJourneyTemplate";
import SwissGridTemplate from "./renderers/SwissGridTemplate";

export default function GymMeetTemplateRenderer(props: any) {
  const pageTemplateId =
    props?.model?.pageTemplateId ||
    resolveGymMeetTemplateId(props?.model || props?.eventData) ||
    DEFAULT_GYM_MEET_TEMPLATE_ID;

  switch (pageTemplateId) {
    case "bento-box":
      return <BentoBoxTemplate {...props} />;
    case "cyber-athlete":
      return <CyberAthleteTemplate {...props} />;
    case "paper-proto":
      return <PaperProtoTemplate {...props} />;
    case "sunset-arena":
      return <SunsetArenaTemplate {...props} />;
    case "pop-art":
      return <PopArtTemplate {...props} />;
    case "swiss-grid":
      return <SwissGridTemplate {...props} />;
    case "art-deco":
      return <ArtDecoTemplate {...props} />;
    case "concrete-gym":
      return <ConcreteGymTemplate {...props} />;
    case "midnight-frost":
      return <MidnightFrostTemplate {...props} />;
    case "eco-motion":
      return <EcoMotionTemplate {...props} />;
    case "holo-elite":
      return <HoloEliteTemplate {...props} />;
    case "vaporwave-grid":
      return <VaporwaveGridTemplate {...props} />;
    case "heavy-impact":
      return <HeavyImpactTemplate {...props} />;
    case "blueprint-tech":
      return <BlueprintTechTemplate {...props} />;
    case "toxic-kinetic":
      return <ToxicKineticTemplate {...props} />;
    case "luxe-magazine":
      return <LuxeMagazineTemplate {...props} />;
    case "chalk-strike":
      return <ChalkStrikeTemplate {...props} />;
    case "podium-lights":
      return <PodiumLightsTemplate {...props} />;
    case "judges-sheet":
      return <JudgesSheetTemplate {...props} />;
    case "spring-energy":
      return <SpringEnergyTemplate {...props} />;
    case "club-classic":
      return <ClubClassicTemplate {...props} />;
    case "aurora-lift":
      return <AuroraLiftTemplate {...props} />;
    case "ribbon-editorial":
      return <RibbonEditorialTemplate {...props} />;
    case "medal-poster":
      return <MedalPosterTemplate {...props} />;
    case "vault-grid":
      return <VaultGridTemplate {...props} />;
    case "travel-briefing":
      return <TravelBriefingTemplate {...props} />;
    case "parent-command":
      return <ParentCommandTemplate {...props} />;
    case "varsity-classic":
      return <VarsityClassicTemplate {...props} />;
    case "weekend-journey":
      return <WeekendJourneyTemplate {...props} />;
    case "scouting-report":
      return <ScoutingReportTemplate {...props} />;
    case "elite-athlete":
    default:
      return <EliteAthleteTemplate {...props} />;
  }
}
