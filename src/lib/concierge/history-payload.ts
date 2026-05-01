import type { ConciergeEventDraft } from "./types.ts";
import { canPersistCreationDraft } from "./creation-intent.ts";

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
      category: draft.eventType,
      title,
      headlineTitle: title,
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
      conciergeDraft: draft,
      liveCard: {
        headline: draft.previewCopy.headline || title,
        subheadline: draft.previewCopy.subheadline,
        body: draft.previewCopy.body,
        cta: draft.previewCopy.cta,
      },
    },
  };
}
