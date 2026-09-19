export type LiveCardOverlayActionKey =
  | "rsvp"
  | "details"
  | "location"
  | "calendar"
  | "registry"
  | "logo";

export type LiveCardOverlayActionInput = {
  category?: string | null;
  openHouse?: boolean;
  hasLocation?: boolean;
  hasRegistry?: boolean;
  hasOpenHouseAgent?: boolean;
  hasOpenHouseLogo?: boolean;
};

function categorySupportsLiveCardRsvp(category?: string | null): boolean {
  return (category || "").trim() !== "Game Day";
}

/**
 * Usual Live Card chrome overlaid on the artwork.
 * RSVP and Calendar stay on the card even when chat said "no rsvp" or calendar links are still forming.
 * Registry appears only when a gift/registry link exists.
 */
export function resolveLiveCardOverlayActions(
  input: LiveCardOverlayActionInput,
): LiveCardOverlayActionKey[] {
  const keys: LiveCardOverlayActionKey[] = [];
  if (input.openHouse) {
    keys.push("details");
    if (input.hasOpenHouseAgent) keys.push("rsvp");
    if (input.hasOpenHouseLogo) keys.push("logo");
  } else if (categorySupportsLiveCardRsvp(input.category)) {
    keys.push("rsvp", "details");
  } else {
    keys.push("details");
  }
  if (input.hasLocation) keys.push("location");
  keys.push("calendar");
  if (input.hasRegistry) keys.push("registry");
  return keys;
}
