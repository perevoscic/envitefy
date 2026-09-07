import { DEFAULT_NEW_GYM_MEET_TEMPLATE_ID, isGymMeetTemplateId } from "@/components/gym-meet-templates/registry";

/** A host's saved design wins over layouts suggested by parsing or enrichment. */
export function resolveGymDiscoveryTemplateSelection(saved: string | null | undefined, suggested?: string | null) {
  if (isGymMeetTemplateId(saved)) return saved;
  if (isGymMeetTemplateId(suggested)) return suggested;
  return DEFAULT_NEW_GYM_MEET_TEMPLATE_ID;
}
