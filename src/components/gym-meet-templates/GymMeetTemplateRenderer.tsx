/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
"use client";

import React from "react";
import {
  DEFAULT_GYM_MEET_TEMPLATE_ID,
  resolveGymMeetTemplateId,
} from "./registry";
import BentoBoxTemplate from "./renderers/BentoBoxTemplate";
import EliteAthleteTemplate from "./renderers/EliteAthleteTemplate";
import ParentCommandTemplate from "./renderers/ParentCommandTemplate";
import ScoutingReportTemplate from "./renderers/ScoutingReportTemplate";
import VarsityClassicTemplate from "./renderers/VarsityClassicTemplate";
import WeekendJourneyTemplate from "./renderers/WeekendJourneyTemplate";

export default function GymMeetTemplateRenderer(props: any) {
  const pageTemplateId =
    props?.model?.pageTemplateId ||
    resolveGymMeetTemplateId(props?.model || props?.eventData) ||
    DEFAULT_GYM_MEET_TEMPLATE_ID;

  switch (pageTemplateId) {
    case "bento-box":
      return <BentoBoxTemplate {...props} />;
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
