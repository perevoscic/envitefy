import {
  type EventPageBlueprint,
  validateEventPageBlueprint,
} from "../schemas/eventBlueprint.schema";
import { buildFallbackEventPageBlueprint } from "./normalizeEventIntent";

export function repairEventBlueprint(params: {
  candidate: unknown;
  eventId: string;
  title: string;
  data: Record<string, unknown>;
  shareUrl?: string | null;
}): { blueprint: EventPageBlueprint; repaired: boolean; warnings: string[] } {
  const result = validateEventPageBlueprint(params.candidate);
  if (result.ok) return { blueprint: result.blueprint, repaired: false, warnings: result.warnings };
  return {
    blueprint: buildFallbackEventPageBlueprint(params),
    repaired: true,
    warnings: result.errors,
  };
}
