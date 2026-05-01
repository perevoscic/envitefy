import type {
  ConciergeActiveContext,
  ConciergeEventDraft,
  ConciergeEventType,
  ConciergeOcrContext,
  ConciergeOutput,
  CreationDraftStatus,
  CreationIntent,
  CreationSourceContext,
  DetectedSourceIntent,
  RequestedOutput,
  SourceIntentResolution,
  SourceContextType,
} from "./types.ts";

const REQUESTED_OUTPUTS = new Set<RequestedOutput>([
  "event_page",
  "live_card",
  "digital_flyer",
  "invitation",
  "rsvp_page",
  "whatsapp",
  "text_message",
  "printable_flyer",
  "instagram_story",
  "reminder",
  "thank_you_card",
  "menu",
  "welcome_sign",
]);

const EVENT_TYPES = new Set<ConciergeEventType>([
  "unknown",
  "birthday",
  "wedding",
  "baby_shower",
  "graduation",
  "general",
]);

export function cleanCreationString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned || null;
}

function hasThisReference(text: string): boolean {
  return /\b(this|that|it|these|the upload|the image|the photo|the invite|the flyer)\b/i.test(text);
}

function hasCreateVerb(text: string): boolean {
  return /\b(make|create|build|turn|convert|draft|design|generate|write|promote|publish)\b/i.test(
    text,
  );
}

export function isGreetingMessage(text: string): boolean {
  return /^(hi|hello|hey|yo|sup|howdy|good morning|good afternoon|good evening)[!.\s]*$/i.test(
    text.trim(),
  );
}

export function createCreationSessionId(previous?: ConciergeEventDraft | null): string {
  return previous?.creationSessionId || `session_${Date.now().toString(36)}`;
}

export function normalizeRequestedOutputs(
  value: unknown,
  options: {
    text?: string;
    previous?: ConciergeEventDraft | null;
    defaultOutput?: RequestedOutput | null;
  } = {},
): RequestedOutput[] {
  const found = new Set<RequestedOutput>();
  const add = (output: unknown) => {
    const normalized = cleanCreationString(output)?.toLowerCase();
    if (!normalized) return;
    const canonical =
      normalized === "printable"
        ? "printable_flyer"
        : normalized === "story"
          ? "instagram_story"
          : normalized === "sms"
            ? "text_message"
            : normalized;
    if (REQUESTED_OUTPUTS.has(canonical as RequestedOutput)) {
      found.add(canonical as RequestedOutput);
    }
  };

  if (Array.isArray(value)) value.forEach(add);
  options.previous?.requestedOutputs?.forEach(add);
  options.previous?.outputs?.forEach(add);

  const text = options.text || "";
  if (/\blive\s*card\b/i.test(text)) found.add("live_card");
  if (/\bdigital\s+flyer\b/i.test(text)) found.add("digital_flyer");
  if (/\bflyer\b/i.test(text) && !/\b(print|printable)\b/i.test(text)) found.add("digital_flyer");
  if (/\b(invitation|invite)\b/i.test(text) && hasCreateVerb(text)) found.add("invitation");
  if (/\brsvp\b/i.test(text)) found.add("rsvp_page");
  if (/\bwhats\s?app\b/i.test(text)) found.add("whatsapp");
  if (/\b(text message|sms)\b/i.test(text)) found.add("text_message");
  if (/\b(print|printable|poster)\b/i.test(text)) found.add("printable_flyer");
  if (/\b(instagram|ig)\s+story\b|\bstory\b/i.test(text)) found.add("instagram_story");
  if (/\breminder\b/i.test(text)) found.add("reminder");
  if (/\bthank\s*you\b/i.test(text)) found.add("thank_you_card");
  if (/\bmenu\b/i.test(text)) found.add("menu");
  if (/\bwelcome\s+sign\b/i.test(text)) found.add("welcome_sign");
  if (/\bevent\s+page\b/i.test(text)) found.add("event_page");

  if (!found.size && options.defaultOutput !== null) {
    found.add(options.defaultOutput || "live_card");
  }
  return Array.from(found);
}

export function toLegacyOutputs(requestedOutputs: RequestedOutput[]): ConciergeOutput[] {
  const mapped = requestedOutputs.map((output): ConciergeOutput => {
    if (output === "printable_flyer") return "printable";
    if (output === "instagram_story") return "story";
    return output;
  });
  const outputs = Array.from(new Set(mapped));
  if (outputs.includes("live_card")) {
    return ["live_card", ...outputs.filter((output) => output !== "live_card")];
  }
  return outputs;
}

export function normalizeCreationIntent(value: unknown, text: string, outputs: RequestedOutput[]): CreationIntent {
  const normalized = cleanCreationString(value)?.toLowerCase();
  if (isGreetingMessage(text)) return "unknown";
  if (
    normalized === "create_output" ||
    normalized === "create_event" ||
    normalized === "edit_event" ||
    normalized === "convert_source" ||
    normalized === "unknown"
  ) {
    return normalized;
  }
  if (/\b(edit|change|update|revise)\b/i.test(text)) return "edit_event";
  if (outputs.length && /\b(make|create|build|turn|convert|draft|design|generate|write)\b/i.test(text)) {
    return "create_output";
  }
  if (text.trim()) return "create_event";
  return "unknown";
}

export function normalizeCreationEventType(value: unknown, fallback: ConciergeEventType = "unknown") {
  const normalized = cleanCreationString(value)?.toLowerCase();
  if (normalized && EVENT_TYPES.has(normalized as ConciergeEventType)) {
    return normalized as ConciergeEventType;
  }
  return fallback;
}

function activeContextEntries(activeContext?: ConciergeActiveContext | null) {
  const entries: Array<{ type: SourceContextType; id: string; label: string }> = [];
  const add = (type: SourceContextType, value: unknown) => {
    const id = cleanCreationString(value);
    if (!id) return;
    const labels: Record<SourceContextType, string> = {
      none: "No source",
      current_event: "Current event",
      current_draft: "Current draft",
      upload: "Uploaded image",
      snap: "Snap",
      ocr_text: "OCR text",
      selected_template: "Selected template",
      pasted_text: "Pasted text",
      existing_asset: "Current asset",
    };
    entries.push({ type, id, label: labels[type] });
  };
  add("current_event", activeContext?.currentEventId);
  add("current_draft", activeContext?.currentDraftId);
  add("upload", activeContext?.selectedUploadId);
  add("selected_template", activeContext?.selectedTemplateId);
  add("existing_asset", activeContext?.currentAssetId);
  return entries;
}

export function resolveSourceIntent(args: {
  text?: string | null;
  category?: string | null;
  explicit?: unknown;
}): SourceIntentResolution {
  const explicit = cleanCreationString(args.explicit)?.toLowerCase();
  if (
    explicit === "received_invite" ||
    explicit === "authoring_source" ||
    explicit === "reference_material" ||
    explicit === "unknown"
  ) {
    return {
      detectedSourceIntent: explicit,
      confidence: explicit === "unknown" ? "low" : "high",
      signals: [{ code: "explicit_source_intent", label: `Explicit ${explicit}` }],
      requiresUserConfirmation: false,
    };
  }

  const text = cleanCreationString(args.text)?.toLowerCase() || "";
  const category = cleanCreationString(args.category)?.toLowerCase() || "";
  const signals: SourceIntentResolution["signals"] = [];
  if (/\b(i got|i received|was invited|invitation i received|someone sent me)\b/.test(text)) {
    signals.push({ code: "received_invite_phrase", label: "User says they received an invite" });
    return {
      detectedSourceIntent: "received_invite",
      confidence: "high",
      signals,
      requiresUserConfirmation: false,
    };
  }
  if (
    /\b(make|create|edit|promote|publish|design|turn this into|build)\b/.test(text) ||
    /\b(schedule|open house|appointment|public notice|meet packet|menu|school flyer|sports flyer)\b/.test(
      `${text} ${category}`,
    )
  ) {
    signals.push({ code: "authoring_phrase_or_material", label: "User is creating/editing or source is authoring material" });
    return {
      detectedSourceIntent: "authoring_source",
      confidence: "high",
      signals,
      requiresUserConfirmation: false,
    };
  }
  if (/\b(birthday|birthdays|wedding|weddings|baby shower|baby showers|gender reveal|invite|invitation)\b/.test(`${text} ${category}`)) {
    signals.push({ code: "invite_like_category_only", label: "Invite-like category without ownership intent" });
    return {
      detectedSourceIntent: "unknown",
      confidence: "low",
      signals,
      requiresUserConfirmation: true,
    };
  }
  return {
    detectedSourceIntent: "unknown",
    confidence: "low",
    signals,
    requiresUserConfirmation: false,
  };
}

export function inferSourceIntent(args: {
  text?: string | null;
  category?: string | null;
  explicit?: unknown;
}): DetectedSourceIntent {
  return resolveSourceIntent(args).detectedSourceIntent;
}

export function resolveCreationSourceContext(args: {
  message: string;
  activeContext?: ConciergeActiveContext | null;
  previous?: ConciergeEventDraft | null;
  ocrContext?: ConciergeOcrContext | null;
}): CreationSourceContext {
  const originalCategory = cleanCreationString(args.ocrContext?.category);
  if (args.ocrContext) {
    const sourceIntent = resolveSourceIntent({
      text: [args.message, args.ocrContext.ocrText].filter(Boolean).join("\n"),
      category: originalCategory,
      explicit: args.ocrContext.metadata?.detectedSourceIntent,
    });
    return {
      type: args.ocrContext.ocrText ? "ocr_text" : "upload",
      hasUsableContext: true,
      ambiguity: "none",
      originalCategory,
      ...sourceIntent,
    };
  }

  const entries = activeContextEntries(args.activeContext);
  if (hasThisReference(args.message) || /^use\s+/i.test(args.message.trim())) {
    if (entries.length === 1) {
      return {
        type: entries[0].type,
        resolvedId: entries[0].id,
        hasUsableContext: true,
        ambiguity: "none",
        detectedSourceIntent: "unknown",
      };
    }
    if (entries.length > 1) {
      return {
        type: "none",
        hasUsableContext: false,
        ambiguity: "multiple",
        detectedSourceIntent: "unknown",
        candidates: entries,
      };
    }
    return {
      type: "none",
      hasUsableContext: false,
      ambiguity: "missing",
      detectedSourceIntent: "unknown",
    };
  }

  if (args.previous?.sourceContext?.hasUsableContext) return args.previous.sourceContext;
  if (args.previous) {
    return {
      type: "none",
      resolvedId: args.previous.creationSessionId,
      hasUsableContext: false,
      ambiguity: "none",
      detectedSourceIntent: "unknown",
    };
  }

  return {
    type: "none",
    hasUsableContext: false,
    ambiguity: "none",
    detectedSourceIntent: "unknown",
  };
}

type OutputRequirement = {
  label: string;
  requiredAny: string[];
  optional: string[];
  firstQuestion: string;
  previewCta: string;
};

const OUTPUT_REQUIREMENTS: Record<RequestedOutput, OutputRequirement> = {
  event_page: {
    label: "Event page",
    requiredAny: ["eventPurpose", "title", "sourceContext"],
    optional: ["date", "location"],
    firstQuestion: "What should this event page be for?",
    previewCta: "Create first preview",
  },
  live_card: {
    label: "Live card",
    requiredAny: ["eventPurpose", "title", "sourceContext"],
    optional: ["date", "location"],
    firstQuestion: "What should this live card be for? Tell me what you're celebrating, or upload an invite/photo and I'll build the first version.",
    previewCta: "Create first preview",
  },
  digital_flyer: {
    label: "Digital flyer",
    requiredAny: ["eventPurpose", "title", "sourceContext"],
    optional: ["date", "location"],
    firstQuestion: "What should this flyer promote?",
    previewCta: "Create first preview",
  },
  invitation: {
    label: "Invitation",
    requiredAny: ["eventPurpose", "title", "sourceContext"],
    optional: ["date", "location"],
    firstQuestion: "What are we inviting people to?",
    previewCta: "Create first preview",
  },
  rsvp_page: {
    label: "RSVP page",
    requiredAny: ["eventPurpose", "title", "sourceContext"],
    optional: ["date", "location"],
    firstQuestion: "Which event should collect RSVPs?",
    previewCta: "Create first preview",
  },
  whatsapp: {
    label: "WhatsApp",
    requiredAny: ["eventPurpose", "title", "sourceContext"],
    optional: ["date", "location"],
    firstQuestion: "What event or source should I use?",
    previewCta: "Write copy",
  },
  text_message: {
    label: "Text message",
    requiredAny: ["eventPurpose", "title", "sourceContext"],
    optional: ["date", "location"],
    firstQuestion: "What event or source should I use?",
    previewCta: "Write copy",
  },
  printable_flyer: {
    label: "Printable flyer",
    requiredAny: ["eventPurpose", "title", "sourceContext"],
    optional: ["date", "location"],
    firstQuestion: "What event or source should I use?",
    previewCta: "Create first preview",
  },
  instagram_story: {
    label: "Instagram story",
    requiredAny: ["eventPurpose", "title", "sourceContext"],
    optional: ["date", "location"],
    firstQuestion: "What event or source should I use?",
    previewCta: "Create first preview",
  },
  reminder: {
    label: "Reminder",
    requiredAny: ["eventPurpose", "title", "sourceContext"],
    optional: ["date"],
    firstQuestion: "What event should this reminder be for?",
    previewCta: "Write reminder",
  },
  thank_you_card: {
    label: "Thank you card",
    requiredAny: ["eventPurpose", "title", "sourceContext"],
    optional: [],
    firstQuestion: "What should this thank you card be for?",
    previewCta: "Create first preview",
  },
  menu: {
    label: "Menu",
    requiredAny: ["eventPurpose", "title", "sourceContext"],
    optional: ["location"],
    firstQuestion: "What event or source should I use for this menu?",
    previewCta: "Create first preview",
  },
  welcome_sign: {
    label: "Welcome sign",
    requiredAny: ["eventPurpose", "title", "sourceContext"],
    optional: ["date", "location"],
    firstQuestion: "What event or source should I use for this welcome sign?",
    previewCta: "Create first preview",
  },
};

export function getOutputRequirement(output: RequestedOutput): OutputRequirement {
  return OUTPUT_REQUIREMENTS[output] || OUTPUT_REQUIREMENTS.live_card;
}

export function canPersistCreationDraft(draft: Pick<ConciergeEventDraft, "sourceContext" | "eventPurpose" | "title" | "eventType">): boolean {
  return Boolean(
    draft.sourceContext.hasUsableContext ||
      cleanCreationString(draft.eventPurpose) ||
      cleanCreationString(draft.title) ||
      draft.eventType !== "unknown",
  );
}

export function isMeaningfulEventText(text: string, requestedOutputs: RequestedOutput[]) {
  const cleaned = cleanCreationString(text);
  if (!cleaned) return false;
  let stripped = cleaned
    .replace(/\b(make|create|build|turn|convert|draft|design|generate|write)\b/gi, " ")
    .replace(/\b(this|that|it|a|an|the|please|for me|into|as)\b/gi, " ");
  for (const output of requestedOutputs) {
    stripped = stripped.replace(new RegExp(output.replace(/_/g, "\\s*"), "gi"), " ");
  }
  stripped = stripped
    .replace(/\blive\s*card\b/gi, " ")
    .replace(/\bdigital\s+flyer\b/gi, " ")
    .replace(/\brsvp\s+page\b/gi, " ")
    .replace(/\btext\s+message\b/gi, " ")
    .replace(/\binstagram\s+story\b/gi, " ")
    .replace(/\bprintable\s+flyer\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.length >= 3;
}

export function deriveCreationStatus(args: {
  sourceContext: CreationSourceContext;
  eventPurpose: string | null;
  title: string | null;
  eventType: ConciergeEventType;
  requestedOutputs: RequestedOutput[];
  dateText?: string | null;
  startISO?: string | null;
  location?: string | null;
  draftStatus?: unknown;
}): { draftStatus: CreationDraftStatus; missingFields: string[]; currentQuestion: string | null; canPersist: boolean } {
  const hasEventPurpose = Boolean(cleanCreationString(args.eventPurpose) || cleanCreationString(args.title));
  const canPersist = canPersistCreationDraft(args);
  const hasMeaningfulContext = canPersist;
  const missingFields: string[] = [];
  const requirement = getOutputRequirement(args.requestedOutputs[0] || "live_card");

  if (args.sourceContext.ambiguity === "multiple") {
    missingFields.push("sourceContext");
    return {
      draftStatus: "needs_source_or_event",
      missingFields,
      currentQuestion: "which_source",
      canPersist,
    };
  }

  if (!hasMeaningfulContext) {
    missingFields.push("eventPurpose");
    return {
      draftStatus: args.requestedOutputs.length ? "needs_event_details" : "needs_source_or_event",
      missingFields,
      currentQuestion: "what_are_we_celebrating",
      canPersist,
    };
  }

  if (!hasEventPurpose && !args.sourceContext.hasUsableContext && requirement.requiredAny.length) {
    missingFields.push("eventPurpose");
  }
  if (!args.dateText && !args.startISO) missingFields.push("date");
  if (!args.location) missingFields.push("location");

  const canPreview =
    args.sourceContext.hasUsableContext ||
    (hasEventPurpose && Boolean(args.dateText || args.startISO || args.location));
  return {
    draftStatus: canPreview ? "preview_ready" : "drafting",
    missingFields,
    currentQuestion: missingFields[0] || null,
    canPersist,
  };
}

export function outputQuestion(output: RequestedOutput): string {
  return getOutputRequirement(output).firstQuestion;
}
