import OpenAI from "openai";
import {
  createCreationSessionId,
  deriveCreationStatus,
  isGreetingMessage,
  isNonCreationRequest,
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
import { updateConversationState } from "./conversation-state.ts";
import { shouldSkipOpenAiForCreationRequest } from "./fast-paths.ts";
import {
  openAiChatTemperatureParam,
  resolveConciergeOpenAiExtractionModel,
  runWithConciergeOpenAiTimeout,
} from "./openai-config.ts";
import { sanitizeConciergePreviewCopy } from "./public-copy.ts";
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
  if (draft.timeText || draft.startISO) missing.delete("time");
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
  options: { message?: string | null } = {},
): ConciergeEventDraft {
  const record = asRecord(value);
  const eventData = asRecord(record.eventData);
  let requestedOutputs = normalizeRequestedOutputs(record.requestedOutputs ?? record.outputs, {
    previous: fallback,
    defaultOutput: fallback.requestedOutputs.length ? undefined : null,
  });
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
    firstDraftString(record.honoreeName, eventData.honoreeName, eventData.birthdayName) ||
    fallback.honoreeName;
  const ageOrMilestone =
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
  const rsvpEnabled =
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
        ) ?? fallback.rsvpEnabled);
  const numberOfGuests =
    rsvpEnabled === false
      ? null
      : positiveNumberOrNull(
          record.numberOfGuests,
          eventData.numberOfGuests,
          eventData.guestCount,
        ) || fallback.numberOfGuests;
  const rsvpDeadline =
    firstDraftString(
      record.rsvpDeadline,
      eventData.rsvpDeadline,
      rsvpRecord.deadline,
      eventRsvpRecord.deadline,
    ) ||
    fallback.rsvpDeadline ||
    null;
  const rsvpName =
    firstDraftString(record.rsvpName, eventData.rsvpName, rsvpRecord.name, eventRsvpRecord.name) ||
    fallback.rsvpName ||
    null;
  const rsvpContact =
    firstDraftString(
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
  const model = resolveConciergeOpenAiExtractionModel({
    override: deps.openAiModel,
    premium: shouldUsePremiumExtractionModel(request),
  });
  const response = await runWithConciergeOpenAiTimeout((signal) =>
    client.chat.completions.create(
      {
        model,
        ...openAiChatTemperatureParam(model, 0.1),
        response_format: { type: "json_object" },
        max_completion_tokens: 650,
        messages: [
          {
            role: "system",
            content: [
              "You are Envitefy's event creation concierge.",
              "Only handle event, flyer invitation, RSVP, and event asset creation or editing.",
              "Return one JSON object matching the draft shape. Do not include markdown.",
              "Return extracted event fields at the top level: title, eventPurpose, eventType, dateText, timeText, startISO, endISO, timezone, location, venue, additionalLocations, honoreeName, ageOrMilestone, ageOrMilestoneSkipped, rsvpEnabled, rsvpDeadline, rsvpName, rsvpContact, numberOfGuests, registryLink, giftNote, giftPreferenceNote, theme, tone, requestedOutputs, sourceContext, missingFields, draftStatus, and currentQuestion.",
              "Also include conversationState when useful: track inferredFields, confirmedFields, lowConfidenceFields, alreadyAskedFields, registrySkipped, locationTentative, finalSummaryShown, readyToGenerate, and role-specific names such as momToBe, parentsToBe, graduateName, birthdayPerson, and coupleNames.",
              "Infer obvious roles from natural phrases: 'Mia baby shower' likely means Mia is the mom-to-be or featured shower name; 'Leo class of 2026 graduation party' means Leo is the graduate; 'Taylor and Morgan gender reveal' means Taylor and Morgan are the parents-to-be; 'John and Sarah wedding' means John and Sarah are the couple. Use high confidence for these but mark needsConfirmation when the displayed role could vary.",
              "When RSVP is enabled for an owned event, collect the host or organizer display name in rsvpName and a phone number or email for RSVP follow-up in rsvpContact. Do not invent either value.",
              "If you include nested eventData for convenience, duplicate the same extracted fields at the top level.",
              "Separate requested output from event details: live cards, flyer invitations, RSVP pages, printable flyers, stories, WhatsApp, and text copy are outputs.",
              "Never copy the user's whole creation request into title, eventPurpose, headline, theme, or tone; distill guest-facing names like matchups, honorees, couples, venues, or concise event labels.",
              "Event pages are full guest-facing websites with navigation/menu, detail sections, RSVP form when enabled, calendar/location actions, and registry or gift-list sections when supplied.",
              "For birthdays, weddings, baby showers, gender reveals, bridal showers, housewarmings, anniversaries, and graduations, preserve any registry, gift-list, wishlist, gift preference, or no-gifts note.",
              "Resolve 'this' only from supplied activeContext. If no context exists, ask what source or event to use.",
              "When activeContext.selectedCategory is supplied, preserve it as the event category unless the uploaded or typed content clearly conflicts; mention the conflict instead of silently switching.",
              "When activeContext.selectedProduct is supplied, preserve it as the requested output unless the user explicitly changes the product.",
              "Use eventType unknown until the user or source gives a real category. Supported eventType values are unknown, birthday, wedding, baby_shower, gender_reveal, bridal_shower, graduation, gym_meet, game_day, football, sport_event, field_trip, open_house, housewarming, appointment, workshop, special_event, smart_signup, and general. Do not use general as a fallback.",
              "Prioritize eventPurpose/title before strict event type. Do not ask for date/time before event purpose/source.",
              "When the previous draft is asking for a specific missing field, treat a short user reply as the answer to that field unless it clearly changes topics.",
              "Treat venue as satisfying the location requirement; if only one of venue or location is known, return it in both fields.",
              "If the user gives multiple event places, preserve the primary place in venue/location and put every other place in additionalLocations as objects with label, venue, location/address, optional timeText, and optional description. Examples include ceremony and reception venues, dinner then after-party, check-in then main event, or pickup/dropoff places. Do not drop secondary locations from event pages, live cards, or final products.",
              "If the previous draft asks whether Envitefy should collect RSVPs, set rsvpEnabled true for yes/include/collect/track replies and false for no/skip/not needed replies.",
              "If the previous draft asks for RSVP guest count or RSVP choice, a numeric or yes/no reply must not satisfy theme or tone. Visual products still need a later vibe/image direction question unless the user already supplied concrete visual direction.",
              "Do not mark drafts ready when event purpose/source is missing. Do not classify uploads as invited based only on event category.",
              "When the user says they received, got, or were sent an invite and wants to save it, set sourceContext.detectedSourceIntent to received_invite and ownership to invited.",
              "If that received-invite request has no invite image/text or concrete event details, ask for an upload or pasted invite text before asking host-authoring questions.",
              "Ask for the minimum missing fields. Produce preview copy even when details are missing.",
              "Theme, tone, style, vibe, and edit instructions are internal creative direction. Never put raw user vibe/prompt/instruction text into guest-facing title, previewCopy.headline, previewCopy.subheadline, previewCopy.body, liveCard, or publicEvent copy.",
              "Preview copy must read like polished guest-facing invitation text. Do not include product phrases such as live card of, event page for, complete Envitefy product, guest-facing call to action, or repeated prompt fragments.",
              "Never choose a user id, owner id, or fetch private user data.",
            ].join(" "),
          },
          {
            role: "user",
            content: JSON.stringify({
              message: request.message || "",
              starterCategory: request.starterCategory || null,
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
  return normalizeConciergeDraft(parsed.draft || parsed, fallback, {
    message: request.message || "",
  });
}

function shouldUsePremiumExtractionModel(request: ConciergeMessageRequest): boolean {
  if (request.ocrContext) return true;
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
  const fallback = fallbackExtractConciergeDraft({
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
    fallback.sourceContext.boundary === "envitefy_question" ||
    fallback.sourceContext.boundary === "non_creation" ||
    fallback.sourceContext.boundary === "off_domain" ||
    fallback.sourceContext.boundary === "external_action" ||
    fallback.sourceContext.boundary === "secret_detected" ||
    fallback.sourceContext.boundary === "unsafe_guest_data" ||
    fallback.sourceContext.boundary === "ambiguous_edit" ||
    fallback.currentQuestion === "invite_source" ||
    isNonCreationRequest(message) ||
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
