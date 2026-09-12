import { DEFAULT_NEW_GYM_MEET_TEMPLATE_ID, isGymMeetTemplateId } from "@/components/gym-meet-templates/registry";
import { DEFAULT_GYM_MEET_TEMPLATE_ID as DEFAULT_FOOTBALL_TEMPLATE_ID, isGymMeetTemplateId as isFootballTemplateId } from "@/components/football-season-templates/registry";

export function resolveFootballDiscoveryTemplateSelection(saved?: string | null, suggested?: string | null) {
  if (isFootballTemplateId(saved)) return saved;
  if (isFootballTemplateId(suggested)) return suggested;
  return DEFAULT_FOOTBALL_TEMPLATE_ID;
}

/** A host's saved design wins over layouts suggested by parsing or enrichment. */
export function resolveGymDiscoveryTemplateSelection(saved: string | null | undefined, suggested?: string | null) {
  if (isGymMeetTemplateId(saved)) return saved;
  if (isGymMeetTemplateId(suggested)) return suggested;
  return DEFAULT_NEW_GYM_MEET_TEMPLATE_ID;
}
