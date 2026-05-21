import type {
  ConciergeConversationState,
  ConciergeEventDraft,
  ConciergeEventType,
  ConciergeExtractedField,
  ConciergeHonoreeRole,
  RequestedOutput,
} from "./types.ts";

type ConversationStateArgs = {
  draft: ConciergeEventDraft;
  previous?: ConciergeEventDraft | null;
  message: string;
};

const ROLE_BY_EVENT_TYPE: Partial<Record<ConciergeEventType, ConciergeHonoreeRole>> = {
  baby_shower: "momToBe",
  bridal_shower: "honoree",
  birthday: "birthdayPerson",
  gender_reveal: "parentsToBe",
  graduation: "graduate",
  wedding: "couple",
};

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned || null;
}

function uniqueStrings(values: unknown[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => cleanString(value))
        .filter((value): value is string => Boolean(value)),
    ),
  );
}

function normalizeMessage(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function hashConversationMessage(value: string) {
  const normalized = normalizeMessage(value);
  let hash = 2166136261;
  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${normalized.length}:${(hash >>> 0).toString(16)}`;
}

export function detectDuplicateUserMessage(message: string, state?: ConciergeConversationState | null) {
  const hash = hashConversationMessage(message);
  return Boolean(state?.lastUserMessageHash && state.lastUserMessageHash === hash);
}

export function detectDuplicateAction(message: string, state?: ConciergeConversationState | null) {
  const text = normalizeMessage(message);
  if (
    state?.registrySkipped &&
    /^(skip|skip it|skip gift link|skip registry|no gift link|no registry|none|no thanks)$/.test(
      text,
    )
  ) {
    return "skip_gift_link";
  }
  if (state?.lastCompletedAction === "generate" && /^(generate|create it|create it now)$/.test(text)) {
    return "generate";
  }
  return null;
}

export function handleSideComment(message: string, state?: ConciergeConversationState | null) {
  const text = cleanString(message) || "";
  if (
    /\b(?:might|may|probably|maybe)\s+change\b[\s\S]{0,60}\b(?:location|venue|address)\b/i.test(
      text,
    ) ||
    /\b(?:not sure|unsure|tbd|to be determined)\b[\s\S]{0,60}\b(?:location|venue|address)\b/i.test(
      text,
    ) ||
    /\b(?:location|venue|address)\s+(?:tbd|may be updated|might change|can change)\b/i.test(text)
  ) {
    return {
      locationTentative: true,
      acknowledgement: "No problem — I’ll keep the location flexible for now.",
      state: state ? { ...state, locationTentative: true } : undefined,
    };
  }
  return null;
}

export function extractedField<T>(
  value: T | null | undefined,
  options: {
    sourceText?: string | null;
    confidence?: number;
    inferred?: boolean;
    confirmed?: boolean;
    needsConfirmation?: boolean;
  } = {},
): ConciergeExtractedField<T> | undefined {
  if (value == null) return undefined;
  if (typeof value === "string" && !cleanString(value)) return undefined;
  return {
    value,
    ...(options.sourceText ? { sourceText: options.sourceText } : {}),
    confidence: options.confidence ?? 0.9,
    inferred: options.inferred ?? true,
    confirmed: options.confirmed ?? false,
    needsConfirmation: options.needsConfirmation ?? false,
  };
}

function namesFromPair(value: string | null | undefined) {
  const cleaned = cleanString(value);
  if (!cleaned) return null;
  const pair = cleaned.match(
    /^\s*([A-Z][a-zA-Z'-]{1,40})\s+(?:and|&)\s+([A-Z][a-zA-Z'-]{1,40})\s*$/,
  );
  return pair ? [pair[1], pair[2]] : null;
}

export function inferEventRole(eventType: ConciergeEventType, title?: string | null, message?: string | null) {
  void title;
  void message;
  return ROLE_BY_EVENT_TYPE[eventType] || "honoree";
}

export function getRequiredFieldsForEventType(
  eventType: ConciergeEventType,
  productType?: RequestedOutput | string | null,
) {
  void productType;
  if (eventType === "baby_shower") return ["momToBe", "date", "time", "location"];
  if (eventType === "graduation") return ["graduateName", "date", "time", "location"];
  if (eventType === "birthday") return ["birthdayPerson", "date", "time", "location"];
  if (eventType === "wedding") return ["coupleNames", "date", "time", "location"];
  if (eventType === "gender_reveal") return ["parentsToBe", "date", "time", "location"];
  return ["title", "date", "time", "location"];
}

export function getMissingFields(state: ConciergeConversationState) {
  return state.missingFields || [];
}

export function hasAlreadyAsked(state: ConciergeConversationState | null | undefined, field: string) {
  return Boolean(state?.alreadyAskedFields?.[field]);
}

export function markQuestionAsked(state: ConciergeConversationState, field: string | null | undefined) {
  if (!field) return state;
  return {
    ...state,
    alreadyAskedFields: {
      ...state.alreadyAskedFields,
      [field]: (state.alreadyAskedFields[field] || 0) + 1,
    },
  };
}

export function getNextQuestion(state: ConciergeConversationState) {
  return state.missingFields[0] || null;
}

export function shouldAskConfirmationForInferredField(field?: ConciergeExtractedField | null) {
  return Boolean(field?.needsConfirmation || (field?.inferred && field.confidence < 0.86));
}

function stateFieldNames(state: ConciergeConversationState) {
  const inferredFields: string[] = [];
  const confirmedFields: string[] = [];
  const lowConfidenceFields: string[] = [];
  const fields: Array<[string, ConciergeExtractedField<unknown> | undefined]> = [
    ["title", state.title],
    ["date", state.date],
    ["time", state.time],
    ["location", state.location],
    ["honoree", state.honoree],
    ["momToBe", state.momToBe],
    ["parentsToBe", state.parentsToBe],
    ["babyName", state.babyName],
    ["graduateName", state.graduateName],
    ["birthdayPerson", state.birthdayPerson],
    ["coupleNames", state.coupleNames],
    ["registryLink", state.registryLink],
  ];
  for (const [name, field] of fields) {
    if (!field) continue;
    if (field.inferred) inferredFields.push(name);
    if (field.confirmed) confirmedFields.push(name);
    if (field.confidence < 0.75) lowConfidenceFields.push(name);
  }
  return { inferredFields, confirmedFields, lowConfidenceFields };
}

export function updateConversationState(args: ConversationStateArgs): ConciergeConversationState {
  const previousState = args.previous?.conversationState || null;
  const role = inferEventRole(args.draft.eventType, args.draft.title, args.message);
  const honoree = extractedField(args.draft.honoreeName, {
    sourceText: args.message,
    confidence: args.draft.honoreeName ? 0.92 : 0,
    needsConfirmation: args.draft.eventType === "baby_shower",
  });
  const couple = namesFromPair(args.draft.honoreeName);

  let state: ConciergeConversationState = {
    eventType: args.draft.eventType,
    productType: args.draft.requestedOutputs[0],
    title: extractedField(args.draft.title, { sourceText: args.message, confidence: 0.88 }),
    date: extractedField(args.draft.dateText || args.draft.startISO, {
      sourceText: args.message,
      confidence: 0.9,
    }),
    time: extractedField(args.draft.timeText || args.draft.startISO, {
      sourceText: args.message,
      confidence: 0.9,
    }),
    location: extractedField(args.draft.location || args.draft.venue, {
      sourceText: args.message,
      confidence: 0.9,
    }),
    locationTentative: previousState?.locationTentative || false,
    honoree,
    honoreeRole: role,
    momToBe:
      args.draft.eventType === "baby_shower"
        ? extractedField(args.draft.honoreeName, {
            sourceText: args.message,
            confidence: 0.84,
            needsConfirmation: true,
          })
        : previousState?.momToBe,
    parentsToBe:
      args.draft.eventType === "gender_reveal"
        ? extractedField(couple || uniqueStrings([args.draft.honoreeName]), {
            sourceText: args.message,
            confidence: couple ? 0.92 : 0.8,
            needsConfirmation: !couple,
          })
        : previousState?.parentsToBe,
    babyName: previousState?.babyName,
    graduateName:
      args.draft.eventType === "graduation"
        ? extractedField(args.draft.honoreeName, { sourceText: args.message, confidence: 0.92 })
        : previousState?.graduateName,
    birthdayPerson:
      args.draft.eventType === "birthday"
        ? extractedField(args.draft.honoreeName, { sourceText: args.message, confidence: 0.9 })
        : previousState?.birthdayPerson,
    coupleNames:
      args.draft.eventType === "wedding"
        ? extractedField(couple || uniqueStrings([args.draft.honoreeName]), {
            sourceText: args.message,
            confidence: couple ? 0.92 : 0.8,
            needsConfirmation: !couple,
          })
        : previousState?.coupleNames,
    registryLink: extractedField(args.draft.registryLink || args.draft.giftRegistryLink, {
      sourceText: args.message,
      confidence: 0.96,
      confirmed: true,
    }),
    registrySkipped: Boolean(args.draft.giftPromptDismissed || previousState?.registrySkipped),
    rsvpRequired:
      typeof args.draft.rsvpEnabled === "boolean" ? args.draft.rsvpEnabled : previousState?.rsvpRequired,
    missingFields: [...args.draft.missingFields],
    confirmedFields: previousState?.confirmedFields || [],
    inferredFields: previousState?.inferredFields || [],
    lowConfidenceFields: previousState?.lowConfidenceFields || [],
    alreadyAskedFields: { ...(previousState?.alreadyAskedFields || {}) },
    lastUserMessageHash: hashConversationMessage(args.message),
    lastAssistantMessageHash: previousState?.lastAssistantMessageHash,
    lastCompletedAction: previousState?.lastCompletedAction,
    finalSummaryShown: previousState?.finalSummaryShown || false,
    readyToGenerate: args.draft.canPersist && !args.draft.currentQuestion && !args.draft.missingFields.length,
    currentStep: args.draft.currentQuestion || args.draft.missingFields[0] || "ready",
  };

  const sideComment = handleSideComment(args.message, state);
  if (sideComment?.locationTentative) state = { ...state, locationTentative: true };
  if (args.draft.currentQuestion || args.draft.missingFields[0]) {
    state = markQuestionAsked(state, args.draft.currentQuestion || args.draft.missingFields[0]);
  }
  if (state.registrySkipped) state.lastCompletedAction = "skip_gift_link";
  if (state.readyToGenerate && !previousState?.finalSummaryShown) {
    state = { ...state, finalSummaryShown: true, currentStep: "ready_first" };
  }

  const fieldNames = stateFieldNames(state);
  return {
    ...state,
    inferredFields: uniqueStrings([...state.inferredFields, ...fieldNames.inferredFields]),
    confirmedFields: uniqueStrings([...state.confirmedFields, ...fieldNames.confirmedFields]),
    lowConfidenceFields: uniqueStrings([...state.lowConfidenceFields, ...fieldNames.lowConfidenceFields]),
  };
}
