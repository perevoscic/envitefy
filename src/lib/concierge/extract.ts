import OpenAI from "openai";
import {
  createCreationSessionId,
  deriveCreationStatus,
  isGreetingMessage,
  normalizeCreationEventType,
  normalizeCreationIntent,
  normalizeRequestedOutputs,
  toLegacyOutputs,
} from "./creation-intent.ts";
import {
  buildAssistantMessage,
  buildSuggestedReplies,
  canSaveConciergeDraft,
  fallbackExtractConciergeDraft,
} from "./fallback.ts";
import { isConciergeFastActionsEnabled, shouldSkipOpenAiForCreationRequest } from "./fast-paths.ts";
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

function nullableString(value: unknown): string | null {
  return cleanString(value);
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

export function normalizeConciergeDraft(
  value: unknown,
  fallback: ConciergeEventDraft,
): ConciergeEventDraft {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const requestedOutputs = normalizeRequestedOutputs(record.requestedOutputs ?? record.outputs, {
    previous: fallback,
    defaultOutput: fallback.requestedOutputs.length ? undefined : null,
  });
  let eventType = normalizeCreationEventType(record.eventType, fallback.eventType);
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
  const eventPurpose = nullableString(record.eventPurpose) || fallback.eventPurpose;
  const title = cleanString(record.title) || fallback.title;
  if (
    eventType === "general" &&
    fallback.eventType === "unknown" &&
    !eventPurpose &&
    !title &&
    !sourceContext.hasUsableContext
  ) {
    eventType = "unknown";
  }
  const dateText = nullableString(record.dateText) || fallback.dateText;
  const startISO = validIsoOrNull(record.startISO) || fallback.startISO;
  const location = nullableString(record.location) || fallback.location;
  const status = deriveCreationStatus({
    sourceContext,
    eventPurpose,
    title,
    eventType,
    requestedOutputs,
    dateText,
    startISO,
    location,
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
    honoreeName: nullableString(record.honoreeName) || fallback.honoreeName,
    relationship: nullableString(record.relationship) || fallback.relationship,
    ageOrMilestone: nullableString(record.ageOrMilestone) || fallback.ageOrMilestone,
    dateText,
    timeText: nullableString(record.timeText) || fallback.timeText,
    startISO,
    endISO: validIsoOrNull(record.endISO) || fallback.endISO,
    timezone: cleanString(record.timezone) || fallback.timezone,
    location,
    venue: nullableString(record.venue) || fallback.venue,
    theme: nullableString(record.theme) || fallback.theme,
    tone: nullableString(record.tone) || fallback.tone,
    outputs: toLegacyOutputs(requestedOutputs),
    missingFields: Array.isArray(record.missingFields)
      ? record.missingFields.map(cleanString).filter((item): item is string => Boolean(item))
      : status.missingFields,
    previewCopy: normalizePreviewCopy(record.previewCopy, fallback.previewCopy),
    source: normalizeSource(record.source, fallback.source),
  };

  draft.missingFields = Array.from(new Set([...status.missingFields, ...draft.missingFields]));
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
              "Return intent, requestedOutputs, sourceContext, eventPurpose, eventType, eventData when useful, missingFields, draftStatus, and nextQuestion/currentQuestion.",
              "Separate requested output from event details: live cards, digital flyers, RSVP pages, printable flyers, stories, WhatsApp, and text copy are outputs.",
              "Resolve 'this' only from supplied activeContext. If no context exists, ask what source or event to use.",
              "Use eventType unknown until the user or source gives a real category. Do not use general as a fallback.",
              "Prioritize eventPurpose/title before strict event type. Do not ask for date/time before event purpose/source.",
              "Do not mark drafts ready when event purpose/source is missing. Do not classify uploads as invited based only on event category.",
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
  });

  const shouldUseDeterministicFastPath =
    (isGreetingMessage(message) && !request.draft && !request.ocrContext) ||
    (isConciergeFastActionsEnabled() &&
      shouldSkipOpenAiForCreationRequest({ request, fallbackDraft: fallback }));

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
