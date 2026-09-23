import type { LiveCardForm } from "./livecard-builder";

export const LIVE_CARD_WORDING_FIELDS = [
  "title",
  "headlineIntro",
  "overview",
  "instructions",
  "giftNote",
  "hostName",
] as const;
export const LIVE_CARD_LOCATION_WORDING_FIELDS = ["venue", "city", "label", "note"] as const;

/** Enforce known spellings even if the model misses them; never rewrite a contact or URL. */
export function normalizeInvitationCapitalization(text: string): string {
  const names: Record<string, string> = {
    amc: "AMC",
    imax: "IMAX",
    rsvp: "RSVP",
    envitefy: "Envitefy",
  };
  return text.replace(
    /https?:\/\/[^\s<>]+|[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b(?:[a-z\d-]+\.)+[a-z]{2,}(?:\/[^\s<>]*)?|\b(?:amc|imax|rsvp|envitefy)\b/gi,
    (match) => names[match.toLowerCase()] || match,
  );
}

/** Only guest-facing wording participates; design and operational facts stay untouched. */
export function liveCardWording(form: LiveCardForm) {
  return {
    ...Object.fromEntries(LIVE_CARD_WORDING_FIELDS.map((field) => [field, form[field]])),
    locations: form.locations.map((location) => ({
      id: location.id,
      ...Object.fromEntries(
        LIVE_CARD_LOCATION_WORDING_FIELDS.map((field) => [field, location[field] || ""]),
      ),
    })),
  };
}

export function liveCardWordingKey(form: LiveCardForm): string {
  return JSON.stringify(liveCardWording(form));
}

export function validateProofreadText(original: string, value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length > 12000 ||
    Boolean(value.trim()) !== Boolean(original.trim())
  )
    throw new Error("The wording could not be prepared.");
  const protectedValues = (text: string) =>
    (text.match(/https?:\/\/[^\s<>]+|[\w.+-]+@[\w.-]+\.[a-z]{2,}|\d+(?:[./:-]\d+)*/gi) || [])
      .map((item) => item.replace(/[.,;!?]+$/, ""))
      .sort();
  const protectedTimes = (text: string) =>
    (text.match(/\b\d{1,2}(?::\d{2})?\s*[ap]\.?m\.?\b/gi) || [])
      .map((time) => time.toLowerCase().replace(/[.\s]/g, ""))
      .sort();
  if (
    JSON.stringify(protectedValues(value)) !== JSON.stringify(protectedValues(original)) ||
    JSON.stringify(protectedTimes(value)) !== JSON.stringify(protectedTimes(original))
  )
    throw new Error("The wording changed an event detail.");
  return normalizeInvitationCapitalization(value.trim());
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("The wording could not be read.");
  return value as Record<string, unknown>;
}

/** Names can change case (amc → AMC), but proofreading cannot select a different person or venue. */
function proofreadName(original: string, value: unknown): string {
  const result = validateProofreadText(original, value);
  if (result.toLowerCase() !== original.trim().toLowerCase())
    throw new Error("The wording changed an event name.");
  return result;
}

export function applyLiveCardProofread(before: LiveCardForm, raw: unknown): LiveCardForm {
  const data = record(raw);
  const next = { ...before };
  for (const field of LIVE_CARD_WORDING_FIELDS)
    next[field] =
      field === "hostName"
        ? proofreadName(before[field], data[field])
        : validateProofreadText(before[field], data[field]);
  if (!Array.isArray(data.locations) || data.locations.length !== before.locations.length)
    throw new Error("The wording changed the event locations.");
  const locations = data.locations.map(record);
  next.locations = before.locations.map((location, index) => {
    const proposed = locations[index];
    if (proposed.id !== location.id) throw new Error("The wording changed the event locations.");
    const updated = { ...location };
    for (const field of LIVE_CARD_LOCATION_WORDING_FIELDS) {
      const original = location[field] || "";
      const value =
        field === "venue" || field === "city"
          ? proofreadName(original, proposed[field])
          : validateProofreadText(original, proposed[field]);
      if (value !== original) updated[field] = value;
    }
    return updated;
  });
  return next;
}

/** Apply corrections only to wording that has not changed while the request was running. */
export function mergeLiveCardProofread(
  current: LiveCardForm,
  before: LiveCardForm,
  proposed: LiveCardForm,
): LiveCardForm {
  const next = { ...current };
  for (const field of LIVE_CARD_WORDING_FIELDS)
    if (current[field] === before[field]) next[field] = proposed[field];
  next.locations = current.locations.map((location) => {
    const original = before.locations.find((item) => item.id === location.id);
    const corrected = proposed.locations.find((item) => item.id === location.id);
    if (!original || !corrected || JSON.stringify(location) !== JSON.stringify(original))
      return location;
    const updated = { ...location };
    for (const field of LIVE_CARD_LOCATION_WORDING_FIELDS)
      if (corrected[field] !== location[field]) updated[field] = corrected[field] || "";
    return updated;
  });
  return next;
}
