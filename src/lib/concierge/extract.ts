import { CONCIERGE_EXTRACTION_SCHEMA, CONCIERGE_EXTRACTION_INSTRUCTION, parseConciergeEdits } from "./extraction-contract.ts";
import { attachCreationReadiness, validCalendarDate } from "./readiness.ts";
import { creationModelBudget, creationTimeoutMs, recordCreationModelRun } from "../creation/openai-workloads.ts";
import OpenAI from "openai";
import { hasRequiredCopyLanguages, provisionalInvitationCopy, requestsInvitationCopy } from "./copy-workflow.ts";
import { normalizeHostBrief } from "./host-brief.ts";
import { applyHostPrivacy } from "./host-privacy.ts";
import { extractExplicitEventLocation, extractExplicitEventTitle, extractExplicitRsvpEnabled, extractNamedAge, hasExplicitEventSchedule, hasStalePreviewFacts, pairedHonorees } from "./conversation-edits.ts";
import {
  createCreationSessionId,
  deriveCreationStatus,
  isGreetingMessage,
  isNonCreationRequest,
  normalizeCreationEventType,
  normalizeCreationIntent,
  rsvpTrackingEnabled,
  toLegacyOutputs,
} from "./creation-intent.ts";
import {
  buildAssistantMessage,
  buildSuggestedReplies,
  canSaveConciergeDraft,
  fallbackExtractConciergeDraft,
  parseChrono,
  rescueOcrDateRangeAndDoorsOpen,
} from "./fallback.ts";
import { updateConversationState } from "./conversation-state.ts";
import { shouldSkipOpenAiForCreationRequest } from "./fast-paths.ts";
import {
  resolveConciergeOpenAiExtractionModel,
  runWithConciergeOpenAiTimeout,
} from "./openai-config.ts";
import { sanitizeConciergePreviewCopy, sanitizeGuestCopy, sanitizeGuestTitle } from "./public-copy.ts";
import type {
  ConciergeAdditionalLocation,
  ConciergeEventDraft,
  ConciergeMessageRequest,
  ConciergeSource,
  CreationSourceContext,
} from "./types.ts";

type ExtractionResult = {
  draft: ConciergeEventDraft;
  assistantMessage: string;
  suggestedReplies: string[];
  canSave: boolean;
  usedAi: boolean;
};

type ExtractDeps = {
  openAiApiKey?: string | null;
  openAiModel?: string | null;
  createOpenAiClient?: (apiKey: string) => OpenAI;
};

const PREMIUM_EXTRACTION_HINT =
  /\b(upload|uploaded|scan|scanned|screenshot|flyer|pdf|packet|schedule|rundown|messy|unclear|complex|multi[-\s]?section|multi[-\s]?day|gymnastics|meet)\b/i;

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned || null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function nullableString(value: unknown): string | null {
  const cleaned = cleanString(value);
  if (!cleaned) return null;
  if (/^(?:tbd|to be determined|unknown|n\/a|none)$/i.test(cleaned)) return null;
  if (/^(?:date|time|location|venue)\s+tbd$/i.test(cleaned)) return null;
  return cleaned;
}

function firstDraftString(...values: unknown[]): string | null {
  for (const value of values) {
    const cleaned = nullableString(value);
    if (cleaned) return cleaned;
  }
  return null;
}

function messageCannotAnswerVisualDirection(message: string, fallback: ConciergeEventDraft) {
  const cleaned = cleanString(message.replace(/[.!?]+$/g, "")) || "";
  if (!cleaned) return false;
  if (fallback.currentQuestion === "tone" || fallback.missingFields.includes("tone")) return false;
  if (/^\d{1,4}$/.test(cleaned)) return true;
  if (
    /^(yes|yep|yeah|sure|no|nope|skip|skip it|not needed|no rsvp|no rsvps|collect rsvps?|track rsvps?)$/i.test(
      cleaned,
    )
  ) {
    return true;
  }
  if (fallback.currentQuestion === "numberOfGuests" || fallback.currentQuestion === "rsvpEnabled") {
    return true;
  }
  return false;
}

function normalizeAiVisualDirection(
  value: string | null,
  fallback: ConciergeEventDraft,
  message: string,
) {
  if (!value) return null;
  if (messageCannotAnswerVisualDirection(message, fallback)) return null;
  return value;
}

function mergeVisualDirection(
  value: string | null,
  fallbackValue: string | null | undefined,
  fallback: ConciergeEventDraft,
  message: string,
) {
  const normalized = normalizeAiVisualDirection(value, fallback, message);
  const fallbackDirection = cleanString(fallbackValue);
  if (!normalized) return fallbackDirection;
  if (!fallbackDirection) return normalized;

  const normalizedLower = normalized.toLowerCase();
  const fallbackLower = fallbackDirection.toLowerCase();
  if (normalizedLower.includes(fallbackLower)) return normalized;
  if (fallbackLower.includes(normalizedLower)) return fallbackDirection;
  return `${normalized}. ${fallbackDirection}`;
}

function normalizeSource(value: unknown, fallback: ConciergeSource): ConciergeSource {
  const normalized = cleanString(value)?.toLowerCase();
  if (normalized === "text" || normalized === "upload" || normalized === "mixed") {
    return normalized;
  }
  return fallback;
}

function normalizeLocationKey(value: string) {
  return value
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function locationDisplayLine(location: ConciergeAdditionalLocation) {
  return [location.venue, location.location || location.address]
    .filter((value, index, values) => value && values.indexOf(value) === index)
    .join(", ");
}

function normalizeAdditionalLocations(
  values: unknown[],
  primary: { venue: string | null; location: string | null },
): ConciergeAdditionalLocation[] {
  const primaryKeys = [primary.venue, primary.location, [primary.venue, primary.location].filter(Boolean).join(", ")]
    .map((value) => (value ? normalizeLocationKey(value) : ""))
    .filter(Boolean);
  const seen = new Set<string>();
  const locations: ConciergeAdditionalLocation[] = [];

  for (const value of values) {
    const items = Array.isArray(value) ? value : value ? [value] : [];
    for (const item of items) {
      const record = asRecord(item);
      const rawString = typeof item === "string" ? item : "";
      const label = firstDraftString(record.label, record.name, record.title) || null;
      const venue = firstDraftString(record.venue, record.venueName, record.placeName) || null;
      const location =
        firstDraftString(record.location, record.address, record.mapQuery, rawString) || null;
      const address = firstDraftString(record.address) || null;
      const normalized: ConciergeAdditionalLocation = {
        label,
        venue,
        location,
        address,
        timeText: firstDraftString(record.timeText, record.time) || null,
        description: firstDraftString(record.description, record.note) || null,
        mapQuery: firstDraftString(record.mapQuery, record.directionsQuery) || null,
      };
      const display = locationDisplayLine(normalized);
      const key = normalizeLocationKey(display || normalized.label || "");
      if (!key || primaryKeys.includes(key) || seen.has(key)) continue;
      seen.add(key);
      locations.push(normalized);
    }
  }

  return locations.slice(0, 8);
}

function validIsoOrNull(value: unknown): string | null {
  const raw = cleanString(value);
  if (!raw) return null;
  if (!validCalendarDate(raw)) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function positiveNumberOrNull(...values: unknown[]) {
  for (const value of values) {
    const numeric =
      typeof value === "number"
        ? value
        : typeof value === "string"
          ? Number.parseInt(value, 10)
          : Number.NaN;
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
  }
  return null;
}

function booleanOrNull(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "boolean") return value;
    if (typeof value !== "string") continue;
    const normalized = value.trim().toLowerCase();
    if (/^(true|yes|y|enabled?|on|1)$/.test(normalized)) return true;
    if (/^(false|no|n|disabled?|off|0)$/.test(normalized)) return false;
  }
  return null;
}

function normalizePreviewCopy(value: unknown, fallback: ConciergeEventDraft["previewCopy"]) {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    headline: cleanString(record.headline) || fallback.headline,
    subheadline: cleanString(record.subheadline) || fallback.subheadline,
    body: typeof record.body === "string" && record.body.trim() ? record.body.trim() : fallback.body,
    scheduleLine: cleanString(record.scheduleLine) || fallback.scheduleLine,
    locationLine: cleanString(record.locationLine) || fallback.locationLine,
    cta: cleanString(record.cta) || fallback.cta,
  };
}

function reconciledMissingFields(
  fields: string[],
  draft: Pick<
    ConciergeEventDraft,
    | "sourceContext"
    | "eventPurpose"
    | "title"
    | "honoreeName"
    | "ageOrMilestone"
    | "ageOrMilestoneSkipped"
    | "dateText"
    | "timeText"
    | "startISO"
    | "location"
    | "venue"
    | "rsvpEnabled"
    | "requestedOutputs"
    | "numberOfGuests"
    | "rsvpName"
    | "rsvpContact"
    | "theme"
    | "tone"
  >,
) {
  const missing = new Set(fields);
  if (draft.sourceContext.hasUsableContext || draft.eventPurpose || draft.title) {
    missing.delete("eventPurpose");
  }
  if (draft.sourceContext.hasUsableContext) missing.delete("sourceContext");
  if (draft.honoreeName) missing.delete("honoreeName");
  if (draft.ageOrMilestone || draft.ageOrMilestoneSkipped) missing.delete("ageOrMilestone");
  if (draft.dateText || draft.startISO) missing.delete("date");
  if (draft.timeText) missing.delete("time");
  if (draft.location || draft.venue) missing.delete("location");
  if (typeof draft.rsvpEnabled === "boolean") missing.delete("rsvpEnabled");
  if (!rsvpTrackingEnabled(draft)) missing.delete("numberOfGuests");
  if (draft.numberOfGuests) missing.delete("numberOfGuests");
  if (!rsvpTrackingEnabled(draft)) missing.delete("rsvpName");
  if (draft.rsvpName) missing.delete("rsvpName");
  if (!rsvpTrackingEnabled(draft)) missing.delete("rsvpContact");
  if (draft.rsvpContact) missing.delete("rsvpContact");
  if (draft.tone || draft.theme) missing.delete("tone");
  return Array.from(missing);
}

export function normalizeConciergeDraft(
  value: unknown,
  fallback: ConciergeEventDraft,
  options: { message?: string | null; previousDraft?: ConciergeEventDraft | null } = {},
): ConciergeEventDraft {
  const record = asRecord(value);
  const eventData = asRecord(record.eventData);
  // Output selection is resolved from the customer's request, never a model's
  // incidental mention of a format in generated copy.
  let requestedOutputs = [...fallback.requestedOutputs];
  if (fallback.rsvpEnabled === false && requestedOutputs.includes("rsvp_page")) {
    requestedOutputs = requestedOutputs.filter((output) => output !== "rsvp_page");
  }
  if (
    fallback.rsvpEnabled === true &&
    !fallback.requestedOutputs.includes("rsvp_page") &&
    requestedOutputs.includes("rsvp_page")
  ) {
    requestedOutputs = requestedOutputs.filter((output) => output !== "rsvp_page");
  }
  let eventType = normalizeCreationEventType(
    record.eventType ?? eventData.eventType ?? eventData.category,
    fallback.eventType,
  );
  const sourceRecord =
    record.sourceContext && typeof record.sourceContext === "object"
      ? (record.sourceContext as Record<string, unknown>)
      : {};
  const sourceContext: CreationSourceContext = {
    ...fallback.sourceContext,
    ...sourceRecord,
    type:
      typeof sourceRecord.type === "string"
        ? (sourceRecord.type as CreationSourceContext["type"])
        : fallback.sourceContext.type,
    ambiguity:
      sourceRecord.ambiguity === "multiple" || sourceRecord.ambiguity === "missing"
        ? sourceRecord.ambiguity
        : fallback.sourceContext.ambiguity,
    hasUsableContext:
      typeof sourceRecord.hasUsableContext === "boolean"
        ? sourceRecord.hasUsableContext
      : fallback.sourceContext.hasUsableContext,
  };
  const sourceMaterialRecord = asRecord(record.sourceMaterial);
  const sourceMaterial = sourceMaterialRecord
    ? {
        ocrText: cleanString(sourceMaterialRecord.ocrText) || null,
        fieldsGuess: asRecord(sourceMaterialRecord.fieldsGuess),
        category: cleanString(sourceMaterialRecord.category) || null,
      }
    : fallback.sourceMaterial || null;
  const sourceGroundedSchedule = rescueOcrDateRangeAndDoorsOpen(sourceMaterial?.ocrText);
  const eventPurpose =
    firstDraftString(record.eventPurpose, eventData.eventPurpose, eventData.purpose) ||
    fallback.eventPurpose;
  const explicitTitle = extractExplicitEventTitle(options.message || "");
  const statedNameAndAge = extractNamedAge(options.message || "", { allowBareAge: fallback.eventType === "birthday" });
  const recoveredNameAndAge = !options.previousDraft?.titleConfirmed && !options.previousDraft?.honoreeName && /\b\d{1,3}\s+years?\s+old\b/i.test(options.previousDraft?.title || "")
    ? extractNamedAge(options.previousDraft?.title || "") : null;
  const sourceNameAndAge = statedNameAndAge || recoveredNameAndAge;
  const preferUserSchedule = Boolean(statedNameAndAge || recoveredNameAndAge && hasExplicitEventSchedule(options.message || ""));
  const title = explicitTitle || (fallback.titleConfirmed || sourceNameAndAge || /\s(?:and|&)\s/.test(fallback.honoreeName || "") ? fallback.title : null)
    || sanitizeGuestTitle(firstDraftString(record.title, eventData.title, eventData.headlineTitle)) || sanitizeGuestTitle(fallback.title);
  if (
    eventType === "general" &&
    fallback.eventType === "unknown" &&
    !eventPurpose &&
    !title &&
    !sourceContext.hasUsableContext
  ) {
    eventType = "unknown";
  }
  const dateText = preferUserSchedule ? fallback.dateText :
    sourceGroundedSchedule?.dateText ||
    firstDraftString(record.dateText, eventData.dateText, eventData.date) ||
    fallback.dateText;
  const timeText = preferUserSchedule ? fallback.timeText :
    sourceGroundedSchedule?.timeText ||
    firstDraftString(record.timeText, eventData.timeText, eventData.time) ||
    fallback.timeText;
  const startISO = preferUserSchedule ? fallback.startISO :
    sourceGroundedSchedule?.startISO ||
    validIsoOrNull(record.startISO) ||
    validIsoOrNull(record.startAt) ||
    validIsoOrNull(record.start) ||
    validIsoOrNull(eventData.startISO) ||
    validIsoOrNull(eventData.startAt) ||
    validIsoOrNull(eventData.start) ||
    fallback.startISO;
  const endISO = preferUserSchedule ? fallback.endISO :
    sourceGroundedSchedule?.endISO ||
    validIsoOrNull(record.endISO) ||
    validIsoOrNull(record.endAt) ||
    validIsoOrNull(record.end) ||
    validIsoOrNull(eventData.endISO) ||
    validIsoOrNull(eventData.endAt) ||
    validIsoOrNull(eventData.end) ||
    fallback.endISO;
  const location = firstDraftString(record.location, eventData.location, eventData.address);
  const venue = firstDraftString(record.venue, eventData.venue, eventData.placeName);
  const explicitLocation = extractExplicitEventLocation(options.message || "");
  const resolvedLocation = explicitLocation || location || fallback.location || venue || fallback.venue;
  const resolvedVenue = explicitLocation || venue || fallback.venue || location || fallback.location;
  const additionalLocations = normalizeAdditionalLocations(
    [
      record.additionalLocations,
      record.locations,
      record.eventLocations,
      eventData.additionalLocations,
      eventData.locations,
      eventData.eventLocations,
      fallback.additionalLocations,
    ],
    { venue: resolvedVenue || null, location: resolvedLocation || null },
  );
  const honoreeName =
    pairedHonorees(explicitTitle || "") ||
    sourceNameAndAge?.name ||
    (fallback.honoreeName && /\s(?:and|&)\s/.test(fallback.honoreeName) ? fallback.honoreeName : null) ||
    firstDraftString(record.honoreeName, eventData.honoreeName, eventData.birthdayName) ||
    fallback.honoreeName;
  const ageOrMilestone =
    sourceNameAndAge?.age ||
    firstDraftString(record.ageOrMilestone, eventData.ageOrMilestone, eventData.age) ||
    fallback.ageOrMilestone;
  const ageOrMilestoneSkipped =
    typeof record.ageOrMilestoneSkipped === "boolean"
      ? record.ageOrMilestoneSkipped
      : typeof eventData.ageOrMilestoneSkipped === "boolean"
        ? eventData.ageOrMilestoneSkipped
        : fallback.ageOrMilestoneSkipped || null;
  const message = cleanString(options.message) || "";
  const theme = mergeVisualDirection(
    firstDraftString(record.theme, eventData.theme),
    fallback.theme,
    fallback,
    message,
  );
  const tone = mergeVisualDirection(
    firstDraftString(record.tone, eventData.tone),
    fallback.tone,
    fallback,
    message,
  );
  const rsvpRecord =
    record.rsvp && typeof record.rsvp === "object" && !Array.isArray(record.rsvp)
      ? (record.rsvp as Record<string, unknown>)
      : {};
  const eventRsvpRecord =
    eventData.rsvp && typeof eventData.rsvp === "object" && !Array.isArray(eventData.rsvp)
      ? (eventData.rsvp as Record<string, unknown>)
      : {};
  const rsvpEnabled = extractExplicitRsvpEnabled(message) ?? (
    fallback.rsvpEnabled === false
      ? false
      : (booleanOrNull(
          record.rsvpEnabled,
          record.isRsvpEnabled,
          rsvpRecord.enabled,
          rsvpRecord.isEnabled,
          eventData.rsvpEnabled,
          eventData.isRsvpEnabled,
          eventRsvpRecord.enabled,
          eventRsvpRecord.isEnabled,
        ) ?? fallback.rsvpEnabled));
  const numberOfGuests = rsvpEnabled === false ? fallback.numberOfGuests :
    positiveNumberOrNull(
          record.numberOfGuests,
          eventData.numberOfGuests,
          eventData.guestCount,
        ) || fallback.numberOfGuests;
  const rsvpDeadline =
    rsvpEnabled === false ? null : firstDraftString(
      record.rsvpDeadline,
      eventData.rsvpDeadline,
      rsvpRecord.deadline,
      eventRsvpRecord.deadline,
    ) ||
    fallback.rsvpDeadline ||
    null;
  const rsvpName =
    rsvpEnabled === false ? null : firstDraftString(record.rsvpName, eventData.rsvpName, rsvpRecord.name, eventRsvpRecord.name) ||
    fallback.rsvpName ||
    null;
  const rsvpContact =
    rsvpEnabled === false ? null : firstDraftString(
      record.rsvpContact,
      eventData.rsvpContact,
      rsvpRecord.contact,
      eventRsvpRecord.contact,
    ) ||
    fallback.rsvpContact ||
    null;
  const registryLink =
    firstDraftString(
      record.registryLink,
      record.giftRegistryLink,
      eventData.registryLink,
      eventData.registryUrl,
      eventData.giftRegistryLink,
    ) ||
    fallback.registryLink ||
    fallback.giftRegistryLink ||
    null;
  const giftNote =
    firstDraftString(record.giftNote, eventData.giftNote) || fallback.giftNote || null;
  const giftPreferenceNote =
    firstDraftString(
      record.giftPreferenceNote,
      eventData.giftPreferenceNote,
      eventData.registryNote,
      eventData.giftPreference,
    ) ||
    fallback.giftPreferenceNote ||
    null;
  const giftPromptDismissed =
    typeof record.giftPromptDismissed === "boolean"
      ? record.giftPromptDismissed
      : fallback.giftPromptDismissed || null;
  const visualDirection = tone || theme;
  const status = deriveCreationStatus({
    sourceContext,
    eventPurpose,
    title,
    eventType,
    requestedOutputs,
    dateText,
    timeText,
    startISO,
    location: resolvedLocation || resolvedVenue,
    honoreeName,
    ageOrMilestone,
    ageOrMilestoneSkipped,
    rsvpEnabled,
    numberOfGuests,
    rsvpName,
    rsvpContact,
    tone: visualDirection,
    draftStatus: record.draftStatus,
  });
  const draft: ConciergeEventDraft = {
    creationSessionId: cleanString(record.creationSessionId) || createCreationSessionId(fallback),
    intent: normalizeCreationIntent(record.intent ?? fallback.intent, "", requestedOutputs),
    requestedOutputs,
    sourceContext,
    sourceMaterial,
    eventPurpose,
    eventType,
    title,
    titleConfirmed: Boolean(explicitTitle || fallback.titleConfirmed),
    hostBrief: normalizeHostBrief(record.hostBrief, fallback.hostBrief, options.message || ""),
    copyStatus: fallback.copyStatus,
    pendingReply: fallback.pendingReply || null,
    ownership:
      record.ownership === "invited" || fallback.ownership === "invited"
        ? "invited"
        : record.ownership === "owned" || fallback.ownership === "owned"
          ? "owned"
          : sourceContext.detectedSourceIntent === "received_invite"
            ? "invited"
            : sourceContext.detectedSourceIntent === "authoring_source" ||
                sourceContext.detectedSourceIntent === "reference_material"
              ? "owned"
              : "unknown",
    draftStatus: status.draftStatus,
    currentQuestion: status.currentQuestion,
    canPersist: status.canPersist,
    honoreeName,
    relationship:
      firstDraftString(record.relationship, eventData.relationship) || fallback.relationship,
    ageOrMilestone,
    ageOrMilestoneSkipped,
    dateText,
    timeText,
    startISO,
    endISO,
    timezone:
      firstDraftString(record.timezone, eventData.timezone, eventData.tz) || fallback.timezone,
    location: resolvedLocation || null,
    venue: resolvedVenue || null,
    additionalLocations,
    rsvpEnabled,
    rsvpDeadline,
    rsvpName,
    rsvpContact,
    numberOfGuests,
    registryLink,
    giftNote,
    giftPreferenceNote,
    giftPromptDismissed,
    theme,
    tone,
    knowledgeAnswer: fallback.knowledgeAnswer || null,
    assistantGuidance: fallback.assistantGuidance || null,
    outputs: toLegacyOutputs(requestedOutputs),
    missingFields: Array.isArray(record.missingFields)
      ? record.missingFields.map(cleanString).filter((item): item is string => Boolean(item))
      : status.missingFields,
    previewCopy: sanitizeConciergePreviewCopy(
      normalizePreviewCopy(
        record.previewCopy ?? eventData.previewCopy ?? eventData.liveCard,
        fallback.previewCopy,
      ),
      {
        eventType,
        title,
        eventPurpose,
        honoreeName,
        ageOrMilestone,
      },
    ),
    source: normalizeSource(record.source, fallback.source),
  };

  if (draft.titleConfirmed && draft.title) draft.previewCopy.headline = draft.title;
  draft.previewCopy.scheduleLine = [draft.dateText, /\b(?:am|pm)\b/i.test(draft.dateText || "") ? null : draft.timeText].filter(Boolean).join(" · ") || "TBC / Por confirmar";
  draft.previewCopy.locationLine = draft.location || draft.venue || "TBC / Por confirmar";
  const modelCopy = asRecord(record.previewCopy ?? eventData.previewCopy ?? eventData.liveCard);
  const modelBody = sanitizeGuestCopy(modelCopy.body);
  if (fallback.copyStatus === "ready" && !requestsInvitationCopy(options.message || "")) {
    draft.previewCopy.body = fallback.previewCopy.body;
  } else if (modelBody && hasRequiredCopyLanguages(modelBody, draft)) draft.copyStatus = "ready";
  else if (requestsInvitationCopy(options.message || "") || fallback.copyStatus === "needs_update") {
    const provisional = provisionalInvitationCopy(draft);
    if (provisional) draft.previewCopy = provisional;
    draft.copyStatus = provisional ? "provisional" : "needs_update";
  }
  if (explicitLocation) draft.previewCopy.locationLine = explicitLocation;
  if (rsvpEnabled === false && /\brsvp\b/i.test(draft.previewCopy.cta)) draft.previewCopy.cta = "View details";
  if (options.previousDraft && hasStalePreviewFacts(draft.previewCopy.body, options.previousDraft, draft)) {
    draft.previewCopy.body = hasStalePreviewFacts(fallback.previewCopy.body, options.previousDraft, draft)
      ? sanitizeConciergePreviewCopy(null, draft).body
      : fallback.previewCopy.body;
    draft.copyStatus = "needs_update";
  }
  draft.missingFields = reconciledMissingFields(
    Array.from(new Set([...status.missingFields, ...draft.missingFields])),
    draft,
  );
  draft.currentQuestion = draft.missingFields.length
    ? status.currentQuestion === "which_source" ||
      status.currentQuestion === "invite_source" ||
      status.currentQuestion === "what_are_we_celebrating"
      ? status.currentQuestion
      : draft.missingFields[0]
    : null;
  draft.conversationState = updateConversationState({
    draft,
    previous: fallback,
    message: options.message || "",
  });
  const privateDraft = applyHostPrivacy(draft, options.previousDraft);
  if (privateDraft.hostBrief?.privacyPreferences?.some((note) => note.kind === "contact_private") && !privateDraft.sourceContext.boundary && privateDraft.currentQuestion !== "date_confirmation") {
    Object.assign(privateDraft, deriveCreationStatus({ ...privateDraft, tone: privateDraft.tone || privateDraft.theme }));
  }
  return privateDraft;
}

function parseAiJson(content: string | null | undefined) {
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

async function extractWithOpenAi(
  request: ConciergeMessageRequest,
  fallback: ConciergeEventDraft,
  deps: Required<Pick<ExtractDeps, "openAiApiKey">> & ExtractDeps,
): Promise<ConciergeEventDraft | null> {
  const apiKey = deps.openAiApiKey;
  if (!apiKey) return null;
  const client = deps.createOpenAiClient?.(apiKey) || new OpenAI({ apiKey });
  const model = resolveConciergeOpenAiExtractionModel({
    override: deps.openAiModel,
    premium: shouldUsePremiumExtractionModel(request),
  });
  const startedAt = Date.now();
  const response = await runWithConciergeOpenAiTimeout((signal) =>
    client.chat.completions.create(
      {
        model,
        ...creationModelBudget(model, "correction"),
        response_format: { type: "json_schema", json_schema: { name: "creation_edits_v2", strict: true, schema: CONCIERGE_EXTRACTION_SCHEMA } },
        messages: [
          {
            role: "system",
            content: CONCIERGE_EXTRACTION_INSTRUCTION,
          },
          {
            role: "user",
            content: JSON.stringify({
              message: request.message || "",
              retryReply: Boolean(request.retryReply),
              retryInstruction: request.retryReply ? "Finish the requested answer or invitation wording using fallbackDraft as the current truth. Return only previewCopy if writing is requested; do not reapply any old date, location, title, RSVP or hostBrief instructions from the original message." : null,
              starterCategory: request.starterCategory || null,
              previousDraft: request.draft || null,
              ocrContext: request.ocrContext || null,
              activeContext: request.activeContext || null,
              fallbackDraft: fallback,
              recentConversation: request.chatMessages?.filter((item) => item.role === "user" || item.role === "assistant").slice(-24).map((item) => ({ role: item.role, text: item.text.slice(0, 2000) })) || [],
            }),
          },
        ],
      } as any,
      { signal } as any,
    ), creationTimeoutMs("correction"),
  );
  const choice = response.choices?.[0];
  const outcome = choice?.message?.refusal ? "refused" : choice?.finish_reason !== "stop" ? "incomplete" : "success";
  recordCreationModelRun({ workload: "correction", model, startedAt, outcome, usage: response.usage });
  if (outcome !== "success") return null;
  const content = choice?.message?.content;
  const parsed = parseAiJson(content);
  if (!parsed) return null;
  const edits = parseConciergeEdits(parsed, request);
  if (!edits) return null;
  const parsedDraft = edits.patch;
  if (!request.retryReply && (typeof parsedDraft.dateText === "string" || typeof parsedDraft.timeText === "string")) {
    const schedule = parseChrono([parsedDraft.dateText ?? fallback.dateText, parsedDraft.timeText ?? fallback.timeText].filter(Boolean).join(" "), { ...fallback, startISO: null, endISO: null, currentQuestion: null });
    parsedDraft.startISO = schedule.startISO;
    parsedDraft.endISO = schedule.endISO;
  }
  const retryCopy = asRecord(parsedDraft.previewCopy);
  const normalized = normalizeConciergeDraft(request.retryReply ? { previewCopy: { body: retryCopy.body, subheadline: retryCopy.subheadline } } : parsedDraft, fallback, {
    message: request.retryReply ? "" : request.message || "",
    previousDraft: request.draft,
  });
  if (!request.retryReply) {
    for (const field of edits.cleared) Object.assign(normalized, { [field]: field === "additionalLocations" ? [] : null });
    if (edits.cleared.includes("dateText")) Object.assign(normalized, { startISO: null, endISO: null });
    if (edits.cleared.includes("location") || edits.cleared.includes("venue")) Object.assign(normalized, { location: null, venue: null });
    Object.assign(normalized, deriveCreationStatus(normalized));
    if (edits.cleared.length) {
      normalized.previewCopy.scheduleLine = [normalized.dateText, normalized.timeText].filter(Boolean).join(" · ");
      normalized.previewCopy.locationLine = normalized.location || normalized.venue || "";
      normalized.copyStatus = "needs_update";
    }
  }
  return attachCreationReadiness(applyHostPrivacy(normalized, request.draft), request.draft, request.retryReply ? "" : request.message);
}

function shouldUsePremiumExtractionModel(request: ConciergeMessageRequest): boolean {
  const fields = request.ocrContext?.sourceEvidence?.fields || request.draft?.sourceMaterial?.sourceEvidence?.fields;
  if (fields && Object.values(fields).some((field) => field.status === "conflicting" || field.status === "inferred")) return true;
  if (request.ocrContext && !fields) return true;
  if (request.draft?.conversationState?.lowConfidenceFields?.length) return true;
  if (/\b(?:actually|instead|correction|bilingual|translate|both languages)\b/i.test(request.message || "")) return true;
  const message = cleanString(request.message) || "";
  return PREMIUM_EXTRACTION_HINT.test(message);
}

export async function extractConciergeDraft(
  request: ConciergeMessageRequest,
  deps: ExtractDeps = {},
): Promise<ExtractionResult> {
  const message = request.message || "";
  const source: ConciergeSource = request.ocrContext
    ? message
      ? "mixed"
      : "upload"
    : request.draft?.source || "text";
  const fallback = request.retryReply && request.draft ? { ...request.draft } : fallbackExtractConciergeDraft({
    message,
    draft: request.draft || null,
    ocrContext: request.ocrContext || null,
    requestedOutputs: request.requestedOutputs || null,
    source,
    activeContext: request.activeContext || null,
    action: request.action || "message",
    starterCategory: request.starterCategory || null,
  });

  const shouldUseDeterministicFastPath =
    (fallback.sourceContext.boundary === "envitefy_question" && !requestsInvitationCopy(message)) ||
    fallback.sourceContext.boundary === "non_creation" ||
    fallback.sourceContext.boundary === "off_domain" ||
    fallback.sourceContext.boundary === "external_action" ||
    fallback.sourceContext.boundary === "secret_detected" ||
    fallback.sourceContext.boundary === "unsafe_guest_data" ||
    fallback.sourceContext.boundary === "ambiguous_edit" ||
    fallback.currentQuestion === "invite_source" ||
    isNonCreationRequest(message) ||
    (isGreetingMessage(message) && !request.draft && !request.ocrContext) ||
    (shouldSkipOpenAiForCreationRequest({ request, fallbackDraft: fallback }) && !requestsInvitationCopy(message));

  if (shouldUseDeterministicFastPath) {
    return {
      draft: fallback,
      assistantMessage: buildAssistantMessage(fallback),
      suggestedReplies: buildSuggestedReplies(fallback),
      canSave: canSaveConciergeDraft(fallback),
      usedAi: false,
    };
  }

  const apiKey = deps.openAiApiKey ?? process.env.OPENAI_API_KEY ?? null;
  if (apiKey) {
    try {
      const aiDraft = await extractWithOpenAi(request, fallback, {
        ...deps,
        openAiApiKey: apiKey,
      });
      if (aiDraft) {
        return {
          draft: aiDraft,
          assistantMessage: buildAssistantMessage(aiDraft),
          suggestedReplies: buildSuggestedReplies(aiDraft),
          canSave: canSaveConciergeDraft(aiDraft),
          usedAi: true,
        };
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[concierge] OpenAI extraction failed; using fallback", error);
      }
    }
  }

  return {
    draft: fallback,
    assistantMessage: buildAssistantMessage(fallback),
    suggestedReplies: buildSuggestedReplies(fallback),
    canSave: canSaveConciergeDraft(fallback),
    usedAi: false,
  };
}
