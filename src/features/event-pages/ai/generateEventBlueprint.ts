import type { EventPageBlueprint } from "../schemas/eventBlueprint.schema";
import { buildFallbackEventPageBlueprint } from "./normalizeEventIntent";

export const EVENT_PAGE_BLUEPRINT_SYSTEM_PROMPT = `
You create Envitefy Event Page Blueprint JSON only.
Return strict JSON matching schemaVersion "event_page_blueprint_v1".
Do not return React, HTML, raw CSS, scripts, markdown, or unsupported section types.
Use sections from: hero, quick_details, schedule_timeline, location, rsvp, registry, travel, people, checklist, faq, announcement, forms, gallery, links, team_notes.
Use actions from: save_to_calendar, get_directions, rsvp, share_page, open_registry, view_schedule, contact_host, open_form.
Theme output is intent and safe token values only: mood, formality, visualDensity, palette, typography, heroStyle, sectionRhythm, backgroundTreatment, and hex colors.
Prioritize visitor next actions and mobile scanning.
`.trim();

export function generateDeterministicEventBlueprint(params: {
  eventId: string;
  title: string;
  data: Record<string, unknown>;
  shareUrl?: string | null;
}): EventPageBlueprint {
  return buildFallbackEventPageBlueprint(params);
}
