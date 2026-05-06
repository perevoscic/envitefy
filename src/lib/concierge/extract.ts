import OpenAI from "openai";
import {
  createCreationSessionId,
  deriveCreationStatus,
  isGreetingMessage,
  normalizeCreationEventType,
  normalizeCreationIntent,
  normalizeRequestedOutputs,
  rsvpTrackingEnabled,
  toLegacyOutputs,
} from "./creation-intent.ts";
import {
  buildAssistantMessage,
  buildSuggestedReplies,
  canSaveConciergeDraft,
  fallbackExtractConciergeDraft,
} from "./fallback.ts";
import { shouldSkipOpenAiForCreationRequest } from "./fast-paths.ts";
import { resolveConciergeOpenAiModel, runWithConciergeOpenAiTimeout } from "./openai-config.ts";
import type {
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

function normalizeSource(value: unknown, fallback: ConciergeSource): ConciergeSource {
  const normalized = cleanString(value)?.toLowerCase();
  if (normalized === "text" || normalized === "upload" || normalized === "mixed") {
    return normalized;
  }
  return fallback;
}

function validIsoOrNull(value: unknown): string | null {
  const raw = cleanString(value);
  if (!raw) return null;
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
    body: cleanString(record.body) || fallback.body,
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
    | "dateText"
    | "timeText"
    | "startISO"
    | "location"
    | "venue"
    | "numberOfGuests"
    | "tone"
  >,
) {
  const missing = new Set(fields);
  if (draft.sourceContext.hasUsableContext || draft.eventPurpose || draft.title) {
    missing.delete("eventPurpose");
  }
  if (draft.sourceContext.hasUsableContext) missing.delete("sourceContext");
  if (draft.honoreeName) missing.delete("honoreeName");
  if (draft.ageOrMilestone) missing.delete("ageOrMilestone");
  if (draft.dateText || draft.startISO) missing.delete("date");
  if (draft.timeText || draft.startISO) missing.delete("time");
  if (draft.location || draft.venue) missing.delete("location");
  if (typeof draft.rsvpEnabled === "boolean") missing.delete("rsvpEnabled");
  if (!rsvpTrackingEnabled(draft)) missing.delete("numberOfGuests");
  if (draft.numberOfGuests) missing.delete("numberOfGuests");
  if (draft.tone) missing.delete("tone");
  return Array.from(missing);
}

export function normalizeConciergeDraft(
  value: unknown,
  fallback: ConciergeEventDraft,
): ConciergeEventDraft {
  const record = asRecord(value);
  const eventData = asRecord(record.eventData);
  const requestedOutputs = normalizeRequestedOutputs(record.requestedOutputs ?? record.outputs, {
    previous: fallback,
    defaultOutput: fallback.requestedOutputs.length ? undefined : null,
  });
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
  const eventPurpose =
    firstDraftString(record.eventPurpose, eventData.eventPurpose, eventData.purpose) ||
    fallback.eventPurpose;
  const title =
    firstDraftString(record.title, eventData.title, eventData.headlineTitle) || fallback.title;
  if (
    eventType === "general" &&
    fallback.eventType === "unknown" &&
    !eventPurpose &&
    !title &&
    !sourceContext.hasUsableContext
  ) {
    eventType = "unknown";
  }
  const dateText =
    firstDraftString(record.dateText, eventData.dateText, eventData.date) || fallback.dateText;
  const timeText =
    firstDraftString(record.timeText, eventData.timeText, eventData.time) || fallback.timeText;
  const startISO =
    validIsoOrNull(record.startISO) ||
    validIsoOrNull(record.startAt) ||
    validIsoOrNull(record.start) ||
    validIsoOrNull(eventData.startISO) ||
    validIsoOrNull(eventData.startAt) ||
    validIsoOrNull(eventData.start) ||
    fallback.startISO;
  const endISO =
    validIsoOrNull(record.endISO) ||
    validIsoOrNull(record.endAt) ||
    validIsoOrNull(record.end) ||
    validIsoOrNull(eventData.endISO) ||
    validIsoOrNull(eventData.endAt) ||
    validIsoOrNull(eventData.end) ||
    fallback.endISO;
  const location = firstDraftString(record.location, eventData.location, eventData.address);
  const venue = firstDraftString(record.venue, eventData.venue, eventData.placeName);
  const resolvedLocation = location || fallback.location || venue || fallback.venue;
  const resolvedVenue = venue || fallback.venue || location || fallback.location;
  const honoreeName =
    firstDraftString(record.honoreeName, eventData.honoreeName, eventData.birthdayName) ||
    fallback.honoreeName;
  const ageOrMilestone =
    firstDraftString(record.ageOrMilestone, eventData.ageOrMilestone, eventData.age) ||
    fallback.ageOrMilestone;
  const theme = firstDraftString(record.theme, eventData.theme) || fallback.theme;
  const tone = firstDraftString(record.tone, eventData.tone) || fallback.tone;
  const rsvpRecord =
    record.rsvp && typeof record.rsvp === "object" && !Array.isArray(record.rsvp)
      ? (record.rsvp as Record<string, unknown>)
      : {};
  const eventRsvpRecord =
    eventData.rsvp && typeof eventData.rsvp === "object" && !Array.isArray(eventData.rsvp)
      ? (eventData.rsvp as Record<string, unknown>)
      : {};
  const rsvpEnabled =
    booleanOrNull(
      record.rsvpEnabled,
      record.isRsvpEnabled,
      rsvpRecord.enabled,
      rsvpRecord.isEnabled,
      eventData.rsvpEnabled,
      eventData.isRsvpEnabled,
      eventRsvpRecord.enabled,
      eventRsvpRecord.isEnabled,
    ) ?? fallback.rsvpEnabled;
  const numberOfGuests =
    positiveNumberOrNull(record.numberOfGuests, eventData.numberOfGuests, eventData.guestCount) ||
    fallback.numberOfGuests;
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
    rsvpEnabled,
    numberOfGuests,
    tone,
    draftStatus: record.draftStatus,
  });
  const draft: ConciergeEventDraft = {
    creationSessionId: cleanString(record.creationSessionId) || createCreationSessionId(fallback),
    intent: normalizeCreationIntent(record.intent ?? fallback.intent, "", requestedOutputs),
    requestedOutputs,
    sourceContext,
    eventPurpose,
    eventType,
    title,
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
    dateText,
    timeText,
    startISO,
    endISO,
    timezone:
      firstDraftString(record.timezone, eventData.timezone, eventData.tz) || fallback.timezone,
    location: resolvedLocation || null,
    venue: resolvedVenue || null,
    rsvpEnabled,
    numberOfGuests,
    theme,
    tone,
    outputs: toLegacyOutputs(requestedOutputs),
    missingFields: Array.isArray(record.missingFields)
      ? record.missingFields.map(cleanString).filter((item): item is string => Boolean(item))
      : status.missingFields,
    previewCopy: normalizePreviewCopy(
      record.previewCopy ?? eventData.previewCopy ?? eventData.liveCard,
      fallback.previewCopy,
    ),
    source: normalizeSource(record.source, fallback.source),
  };

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
  return draft;
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
  const model = resolveConciergeOpenAiModel(deps.openAiModel);
  const response = await runWithConciergeOpenAiTimeout((signal) =>
    client.chat.completions.create(
      {
        model,
        temperature: 0.1,
        response_format: { type: "json_object" },
        max_completion_tokens: 650,
        messages: [
          {
            role: "system",
            content: [
              "You are Envitefy's event creation concierge.",
              "Only handle event, invitation, RSVP, and event asset creation or editing.",
              "Return one JSON object matching the draft shape. Do not include markdown.",
              "Return extracted event fields at the top level: title, eventPurpose, eventType, dateText, timeText, startISO, endISO, timezone, location, venue, honoreeName, ageOrMilestone, rsvpEnabled, numberOfGuests, theme, tone, requestedOutputs, sourceContext, missingFields, draftStatus, and currentQuestion.",
              "If you include nested eventData for convenience, duplicate the same extracted fields at the top level.",
              "Separate requested output from event details: live cards, digital flyers, RSVP pages, printable flyers, stories, WhatsApp, and text copy are outputs.",
              "Resolve 'this' only from supplied activeContext. If no context exists, ask what source or event to use.",
              "Use eventType unknown until the user or source gives a real category. Supported eventType values are unknown, birthday, wedding, baby_shower, gender_reveal, bridal_shower, graduation, gym_meet, game_day, football, sport_event, field_trip, open_house, housewarming, appointment, workshop, special_event, smart_signup, and general. Do not use general as a fallback.",
              "Prioritize eventPurpose/title before strict event type. Do not ask for date/time before event purpose/source.",
              "When the previous draft is asking for a specific missing field, treat a short user reply as the answer to that field unless it clearly changes topics.",
              "Treat venue as satisfying the location requirement; if only one of venue or location is known, return it in both fields.",
              "If the previous draft asks whether Envitefy should collect RSVPs, set rsvpEnabled true for yes/include/collect/track replies and false for no/skip/not needed replies.",
              "Do not mark drafts ready when event purpose/source is missing. Do not classify uploads as invited based only on event category.",
              "When the user says they received, got, or were sent an invite and wants to save it, set sourceContext.detectedSourceIntent to received_invite and ownership to invited.",
              "If that received-invite request has no invite image/text or concrete event details, ask for an upload or pasted invite text before asking host-authoring questions.",
              "Ask for the minimum missing fields. Produce preview copy even when details are missing.",
              "Never choose a user id, owner id, or fetch private user data.",
            ].join(" "),
          },
          {
            role: "user",
            content: JSON.stringify({
              message: request.message || "",
              previousDraft: request.draft || null,
              ocrContext: request.ocrContext || null,
              activeContext: request.activeContext || null,
              fallbackDraft: fallback,
            }),
          },
        ],
      } as any,
      { signal } as any,
    ),
  );
  const content = response.choices?.[0]?.message?.content;
  const parsed = parseAiJson(content);
  if (!parsed) return null;
  return normalizeConciergeDraft(parsed.draft || parsed, fallback);
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
  const fallback = fallbackExtractConciergeDraft({
    message,
    draft: request.draft || null,
    ocrContext: request.ocrContext || null,
    requestedOutputs: request.requestedOutputs || null,
    source,
    activeContext: request.activeContext || null,
    action: request.action || "message",
  });

  const shouldUseDeterministicFastPath =
    fallback.currentQuestion === "invite_source" ||
    (isGreetingMessage(message) && !request.draft && !request.ocrContext) ||
    shouldSkipOpenAiForCreationRequest({ request, fallbackDraft: fallback });

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
