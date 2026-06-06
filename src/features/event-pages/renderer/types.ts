import type { EventAction } from "../schemas/eventBlueprint.schema";

export type EventPageRendererContext = {
  eventId: string;
  title: string;
  shareUrl?: string | null;
  actions: EventAction[];
};
