import type { ConciergeEventDraft } from "./types.ts";
import { getRequirementPlan, requirementFieldSatisfied } from "./requirements.ts";

export type CreationReadiness = {
  canPreview: boolean;
  canSaveDraft: boolean;
  canPublish: boolean;
  publishBlockers: string[];
};

export function validCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T|$)/.exec(value);
  if (!match) return false;
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export function getCreationReadiness(draft: ConciergeEventDraft | null): CreationReadiness {
  if (!draft)
    return {
      canPreview: false,
      canSaveDraft: false,
      canPublish: false,
      publishBlockers: ["eventPurpose"],
    };
  const contextBlocked = Boolean(
    (draft.sourceContext.boundary && draft.sourceContext.boundary !== "envitefy_question") || draft.sourceContext.ambiguity === "multiple",
  );
  const canSaveDraft = Boolean(draft.canPersist && !contextBlocked);
  const canPreview =
    canSaveDraft && draft.requestedOutputs.length > 0 && Boolean(draft.title || draft.eventPurpose);
  const plan = getRequirementPlan(draft);
  const publishBlockers: string[] = plan.requiredFields.filter(
    (field) => !requirementFieldSatisfied(field, draft),
  );
  if (!canPreview) publishBlockers.push("eventPurpose");
  if (draft.currentQuestion === "date_confirmation") publishBlockers.push("date_confirmation");
  for (const [field, value] of [
    ["startISO", draft.startISO],
    ["endISO", draft.endISO],
  ] as const) {
    if (value && (!validCalendarDate(value) || !Number.isFinite(Date.parse(value))))
      publishBlockers.push(field);
  }
  if (draft.startISO && draft.endISO && Date.parse(draft.endISO) <= Date.parse(draft.startISO))
    publishBlockers.push("endISO");
  try {
    new Intl.DateTimeFormat("en", { timeZone: draft.timezone });
  } catch {
    publishBlockers.push("timezone");
  }
  const evidence = draft.sourceMaterial?.sourceEvidence;
  for (const [field, fact] of Object.entries(evidence?.fields || {})) {
    if (fact.status === "conflicting" && !draft.sourceResolutions?.[field])
      publishBlockers.push(`conflicting_${field}`);
  }
  return {
    canPreview,
    canSaveDraft,
    canPublish: publishBlockers.length === 0,
    publishBlockers: [...new Set(publishBlockers)],
  };
}

export function attachCreationReadiness(
  draft: ConciergeEventDraft,
  previous?: ConciergeEventDraft | null,
  message = "",
): ConciergeEventDraft {
  const sourceResolutions = { ...previous?.sourceResolutions, ...draft.sourceResolutions };
  const fields: Partial<Record<keyof ConciergeEventDraft, string>> = {
    title: "title",
    dateText: "start",
    timeText: "start",
    endISO: "end",
    location: "address",
    venue: "venueName",
    honoreeName: "birthdayName",
    ageOrMilestone: "birthdayAge",
    rsvpContact: "rsvp",
    registryLink: "registryUrl",
  };
  if (previous && message.trim() && !draft.sourceContext.boundary) {
    for (const [key, sourceField] of Object.entries(fields)) {
      if (draft[key as keyof ConciergeEventDraft] !== previous[key as keyof ConciergeEventDraft])
        sourceResolutions[sourceField] = message;
    }
  }
  const next = { ...draft, sourceResolutions };
  return { ...next, readiness: getCreationReadiness(next) };
}
