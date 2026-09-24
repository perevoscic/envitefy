export const EVENT_GUEST_ACTIONS = [
  { id: "calendar", label: "Add to calendar", restoreLabel: "Calendar" },
  { id: "directions", label: "Get directions", restoreLabel: "Directions" },
  { id: "share", label: "Share event", restoreLabel: "Share" },
] as const;

export type EventGuestActionId = (typeof EVENT_GUEST_ACTIONS)[number]["id"];
export type EventGuestActionVisibility = Partial<Record<EventGuestActionId, boolean>>;

/** Missing settings retain the template's original actions. */
export function normalizeEventGuestActions(value: unknown): EventGuestActionVisibility {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  const result: EventGuestActionVisibility = {};
  for (const { id } of EVENT_GUEST_ACTIONS) {
    if (typeof record[id] === "boolean") result[id] = record[id];
  }
  return result;
}
