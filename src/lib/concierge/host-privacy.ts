import type { ConciergeAdditionalLocation, ConciergeEventDraft } from "./types.ts";

function normalized(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function safePrivatePlaceholder(value: string | null | undefined): string | null {
  const text = value?.trim();
  if (!text || text.length > 180 || /\d|\b(?:street|avenue|road|drive|lane|boulevard|apartment|suite|unit|apt|st\.|ave\.)\b/i.test(text)) return null;
  return /\b(?:address\s+(?:(?:will be\s+)?(?:shared|provided|sent|released)\s+)?(?:privately|in private)|(?:address|location)\s+(?:is\s+)?private|direcci[oó]n\s+(?:exacta\s+)?(?:compartida\s+)?en privado)\b/i.test(text) ? text : null;
}

function defaultPrivatePlaceholder(draft: ConciergeEventDraft): string {
  const languages = draft.hostBrief?.languages?.values || [];
  if (languages.length === 1 && languages[0] === "Spanish") return "Dirección exacta compartida en privado";
  return languages.includes("Spanish") ? "Exact address shared privately / Dirección exacta compartida en privado" : "Exact address shared privately";
}

function locationValues(draft: ConciergeEventDraft | null | undefined): string[] {
  if (!draft) return [];
  return [
    draft.location, draft.venue, draft.previewCopy.locationLine,
    ...draft.additionalLocations.flatMap((stop) => [stop.location, stop.venue, stop.address, stop.mapQuery]),
  ].filter((value): value is string => Boolean(value?.trim()));
}

/** Apply confirmed host privacy to the same canonical fields used by generation and persistence. */
export function applyHostPrivacy(draft: ConciergeEventDraft, previous?: ConciergeEventDraft | null): ConciergeEventDraft {
  const preferences = draft.hostBrief?.privacyPreferences ?? previous?.hostBrief?.privacyPreferences ?? [];
  const privateAddress = preferences.some((note) => note.kind === "address_private");
  const privateContact = preferences.some((note) => note.kind === "contact_private");
  if (!privateAddress && !privateContact) return draft;

  const placeholder = [draft.location, draft.venue, draft.previewCopy.locationLine]
    .map(safePrivatePlaceholder).find((value) => value !== null) || defaultPrivatePlaceholder(draft);
  const privateLocations = privateAddress ? locationValues(draft).concat(locationValues(previous))
    .filter((value) => !safePrivatePlaceholder(value) && !/^(?:location )?(?:tbd|tbc|unknown|not chosen)$/i.test(value.trim())) : [];
  const privateText = [...new Set([
    ...privateLocations,
    ...privateLocations.flatMap((value) => value.split(/[,;\n]/).filter((part) => /\d/.test(part))),
    ...(privateContact ? [draft.rsvpContact, previous?.rsvpContact].filter((value): value is string => Boolean(value)) : []),
  ].map(normalized).filter((value) => value.length >= 4 && !normalized(placeholder).includes(value)))];
  const phoneDigits = privateContact ? [draft.rsvpContact, previous?.rsvpContact]
    .map((value) => (value || "").replace(/\D/g, ""))
    .filter((value) => value.length >= 7) : [];
  const containsPrivateFact = (value: string) => {
    const text = normalized(value);
    if (privateText.some((fact) => text.includes(fact))) return true;
    if (!privateContact) return false;
    if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(value)) return true;
    if (/(?:\+?\d{1,3}[- .]?)?(?:\(\d{3}\)|\d{3})[- .]\d{3}[- .]\d{4}\b/.test(value)) return true;
    const digits = value.replace(/\D/g, "");
    return phoneDigits.some((phone) => digits.includes(phone));
  };
  const removePrivateParagraphs = (value: string | null | undefined): string | null => {
    if (!value) return value || null;
    if (!containsPrivateFact(value)) return value;
    return value.split(/\r?\n+/).filter((paragraph) => !containsPrivateFact(paragraph)).join("\n\n").trim() || null;
  };
  const safeTitle = removePrivateParagraphs(draft.title) || "Event invitation";
  const previewCopy = {
    ...draft.previewCopy,
    headline: removePrivateParagraphs(draft.previewCopy.headline) || safeTitle,
    subheadline: removePrivateParagraphs(draft.previewCopy.subheadline) || "",
    body: removePrivateParagraphs(draft.previewCopy.body) || "",
    scheduleLine: removePrivateParagraphs(draft.previewCopy.scheduleLine) || "TBC",
    locationLine: privateAddress ? placeholder : removePrivateParagraphs(draft.previewCopy.locationLine) || "TBC",
    cta: removePrivateParagraphs(draft.previewCopy.cta) || "View details",
  };
  const additionalLocations: ConciergeAdditionalLocation[] = draft.additionalLocations.map((stop) => ({
    ...stop,
    label: removePrivateParagraphs(stop.label),
    description: removePrivateParagraphs(stop.description),
    ...(privateAddress ? {
      location: safePrivatePlaceholder(stop.location) || defaultPrivatePlaceholder(draft),
      venue: null,
      address: null,
      mapQuery: null,
    } : {}),
  }));
  const proseChanged = previewCopy.body !== draft.previewCopy.body || previewCopy.headline !== draft.previewCopy.headline || previewCopy.subheadline !== draft.previewCopy.subheadline;
  return {
    ...draft,
    title: draft.title ? safeTitle : draft.title,
    eventPurpose: removePrivateParagraphs(draft.eventPurpose),
    giftPreferenceNote: removePrivateParagraphs(draft.giftPreferenceNote),
    giftNote: removePrivateParagraphs(draft.giftNote),
    location: privateAddress ? placeholder : draft.location,
    venue: privateAddress ? placeholder : draft.venue,
    rsvpContact: privateContact ? null : draft.rsvpContact,
    additionalLocations,
    previewCopy,
    copyStatus: proseChanged ? "needs_update" : draft.copyStatus,
  };
}
