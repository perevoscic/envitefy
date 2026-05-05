import type { ConciergeEventDraft } from "./types.ts";
import { canPersistCreationDraft } from "./creation-intent.ts";

const CATEGORY_LABELS: Record<ConciergeEventDraft["eventType"], string> = {
  unknown: "General Event",
  birthday: "Birthday",
  wedding: "Wedding",
  baby_shower: "Baby Shower",
  graduation: "Graduation",
  gym_meet: "Gym Meet",
  general: "General Event",
};

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed || null;
}

function splitCombinedVenueLocation(value: string | null) {
  const cleaned = cleanString(value);
  if (!cleaned) return { venue: null as string | null, location: null as string | null };

  const parts = cleaned
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const addressLikeRest = parts.slice(1).join(", ");
  if (
    parts.length >= 2 &&
    !/^\d/.test(parts[0]) &&
    /\b(\d|st|street|ave|avenue|road|rd|drive|dr|lane|ln|blvd|boulevard|way|tx|ca|fl|ny)\b/i.test(
      addressLikeRest,
    )
  ) {
    return { venue: parts[0], location: addressLikeRest };
  }

  if (/^\d/.test(cleaned)) return { venue: null, location: cleaned };
  return { venue: cleaned, location: null };
}

function normalizeVenueLocation(venueValue: unknown, locationValue: unknown) {
  const venue = cleanString(venueValue);
  const location = cleanString(locationValue);
  if (venue && location && venue !== location) return { venue, location };

  const combined = venue || location;
  if (!combined) return { venue: null as string | null, location: null as string | null };

  return splitCombinedVenueLocation(combined);
}

export function canPersistConciergeHistoryDraft(draft: ConciergeEventDraft): boolean {
  return draft.canPersist !== false && canPersistCreationDraft(draft);
}

export function buildConciergeHistoryPayload(draft: ConciergeEventDraft) {
  if (!canPersistConciergeHistoryDraft(draft)) {
    throw new Error("Creation draft does not have enough source or event context to persist.");
  }
  const title = draft.title || draft.eventPurpose || "Event draft";
  const ownership = draft.ownership === "invited" ? "invited" : "owned";
  const invitedFromScan = draft.sourceContext.detectedSourceIntent === "received_invite";
  const category = CATEGORY_LABELS[draft.eventType] || "General Event";
  const rsvpEnabled =
    draft.requestedOutputs.includes("live_card") || draft.requestedOutputs.includes("rsvp_page");
  const eventPlace = normalizeVenueLocation(draft.venue, draft.location);
  const scheduleLine =
    cleanString(draft.previewCopy.scheduleLine) ||
    [cleanString(draft.dateText), cleanString(draft.timeText)].filter(Boolean).join(" at ") ||
    null;
  const locationLine =
    cleanString(draft.previewCopy.locationLine) ||
    [eventPlace.venue, eventPlace.location]
      .filter((value, index, values) => value && values.indexOf(value) === index)
      .join(", ") ||
    null;
  const description =
    cleanString(draft.previewCopy.body) ||
    (draft.eventType === "birthday" && draft.honoreeName
      ? `Join us to celebrate ${draft.honoreeName}.`
      : `Join us for ${title}.`);
  const liveCardHeadline = cleanString(draft.previewCopy.headline) || title;
  const liveCardSubheadline =
    cleanString(draft.previewCopy.subheadline) || cleanString(draft.theme) || category;
  const liveCardCta = cleanString(draft.previewCopy.cta) || "RSVP";

  return {
    title,
    data: {
      creationIntent: draft.intent,
      requestedOutputs: draft.requestedOutputs,
      sourceContext: draft.sourceContext,
      eventPurpose: draft.eventPurpose,
      draftStatus: draft.draftStatus,
      ownership,
      invitedFromScan,
      createdVia: "concierge",
      status: "draft",
      category,
      eventType: draft.eventType,
      title,
      headlineTitle: liveCardHeadline,
      description,
      dateText: draft.dateText,
      date: draft.dateText,
      timeText: draft.timeText,
      time: draft.timeText,
      whenLabel: scheduleLine,
      scheduleLine,
      startAt: draft.startISO,
      startISO: draft.startISO,
      start: draft.startISO,
      endAt: draft.endISO,
      endISO: draft.endISO,
      end: draft.endISO,
      timezone: draft.timezone,
      location: eventPlace.location,
      venue: eventPlace.venue,
      locationLabel: locationLine,
      placeName: eventPlace.venue || eventPlace.location,
      theme: draft.theme,
      age: draft.ageOrMilestone,
      honoreeName: draft.honoreeName,
      outputs: draft.outputs,
      previewCopy: draft.previewCopy,
      rsvpEnabled,
      rsvpMode: "envitefy",
      rsvp: {
        isEnabled: rsvpEnabled,
        enabled: rsvpEnabled,
        mode: "envitefy",
        direct: true,
        cta: liveCardCta,
      },
      conciergeDraft: draft,
      publicEvent: {
        renderer: "live_card",
        primaryOutput: draft.requestedOutputs.includes("live_card")
          ? "live_card"
          : draft.requestedOutputs[0] || "event_page",
        headline: liveCardHeadline,
        subheadline: liveCardSubheadline,
        body: description,
        scheduleLine,
        locationLine,
        rsvpEnabled,
      },
      liveCard: {
        headline: liveCardHeadline,
        subheadline: liveCardSubheadline,
        body: description,
        scheduleLine,
        locationLine,
        cta: liveCardCta,
      },
    },
  };
}
