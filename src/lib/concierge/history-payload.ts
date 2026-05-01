import type { ConciergeEventDraft } from "./types.ts";
import { canPersistCreationDraft } from "./creation-intent.ts";

const CATEGORY_LABELS: Record<ConciergeEventDraft["eventType"], string> = {
  unknown: "General Event",
  birthday: "Birthday",
  wedding: "Wedding",
  baby_shower: "Baby Shower",
  graduation: "Graduation",
  general: "General Event",
};

export function canPersistConciergeHistoryDraft(draft: ConciergeEventDraft): boolean {
  return canPersistCreationDraft(draft);
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
      headlineTitle: title,
      description: draft.previewCopy.body,
      dateText: draft.dateText,
      timeText: draft.timeText,
      startAt: draft.startISO,
      startISO: draft.startISO,
      start: draft.startISO,
      endAt: draft.endISO,
      endISO: draft.endISO,
      end: draft.endISO,
      timezone: draft.timezone,
      location: draft.location,
      venue: draft.venue,
      theme: draft.theme,
      age: draft.ageOrMilestone,
      honoreeName: draft.honoreeName,
      outputs: draft.outputs,
      previewCopy: draft.previewCopy,
      rsvpEnabled,
      rsvp: {
        isEnabled: rsvpEnabled,
        mode: "envitefy",
        cta: draft.previewCopy.cta || "RSVP",
      },
      conciergeDraft: draft,
      liveCard: {
        headline: draft.previewCopy.headline || title,
        subheadline: draft.previewCopy.subheadline,
        body: draft.previewCopy.body,
        scheduleLine: draft.previewCopy.scheduleLine,
        locationLine: draft.previewCopy.locationLine,
        cta: draft.previewCopy.cta,
      },
    },
  };
}
