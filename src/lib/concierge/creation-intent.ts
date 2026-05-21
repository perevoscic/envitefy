import {
  getOutputRequirement as getRequirementForOutput,
  getRequirementPlan,
  requirementFieldSatisfied,
} from "./requirements.ts";
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
  SourceContextType,
  SourceIntentResolution,
} from "./types.ts";

export { getOutputRequirement } from "./requirements.ts";

const REQUESTED_OUTPUTS = new Set<RequestedOutput>([
  "event_page",
  "live_card",
  "digital_flyer",
  "signup_form",
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

export function outputsUseRsvp(requestedOutputs: RequestedOutput[]) {
  return requestedOutputs.includes("rsvp_page");
}

const RSVP_CAPABLE_OUTPUTS = new Set<RequestedOutput>([
  "event_page",
  "live_card",
  "digital_flyer",
  "invitation",
  "rsvp_page",
  "printable_flyer",
  "instagram_story",
]);

const ALWAYS_RSVP_EVENT_TYPES = new Set<ConciergeEventType>([
  "birthday",
  "wedding",
  "baby_shower",
  "gender_reveal",
  "bridal_shower",
  "game_day",
  "football",
  "sport_event",
  "housewarming",
]);

export function outputsCanCollectRsvp(requestedOutputs: RequestedOutput[]) {
  return requestedOutputs.some((output) => RSVP_CAPABLE_OUTPUTS.has(output));
}

function hasRsvpEventLanguage(text: string) {
  return /\b(rsvp|invite|invitation|party|shower|wedding|reception|open\s+house|housewarming|gender\s+reveal|anniversary|dinner|brunch)\b/i.test(
    text,
  );
}

export function eventImpliesRsvp(eventType: ConciergeEventType, text = "") {
  if (ALWAYS_RSVP_EVENT_TYPES.has(eventType)) return true;
  if (eventType === "graduation") {
    return /\b(rsvp|party|open\s+house|celebration|reception|invite|invitation)\b/i.test(text);
  }
  if (eventType === "open_house") {
    return /\b(rsvp|sign\s*up|register|appointment|showing|attend|guest|visitor|invite|invitation)\b/i.test(
      text,
    );
  }
  if (eventType === "unknown" || eventType === "general") return hasRsvpEventLanguage(text);
  return false;
}

export function rsvpTrackingEnabled(args: {
  requestedOutputs: RequestedOutput[];
  rsvpEnabled?: boolean | null;
}) {
  if (args.rsvpEnabled === false) return false;
  if (args.rsvpEnabled === true) return true;
  return args.requestedOutputs.includes("rsvp_page");
}

export function shouldAskRsvpDecision(args: {
  sourceContext: Pick<CreationSourceContext, "detectedSourceIntent">;
  eventType: ConciergeEventType;
  requestedOutputs: RequestedOutput[];
  eventPurpose?: string | null;
  title?: string | null;
  rsvpEnabled?: boolean | null;
}) {
  if (args.sourceContext.detectedSourceIntent === "received_invite") return false;
  if (typeof args.rsvpEnabled === "boolean") return false;
  if (args.requestedOutputs.includes("rsvp_page")) return false;
  if (!outputsCanCollectRsvp(args.requestedOutputs)) return false;
  const text = [args.eventPurpose, args.title].filter(Boolean).join(" ");
  return eventImpliesRsvp(args.eventType, text);
}

export function shouldAskRsvpGuestCount(args: {
  requestedOutputs: RequestedOutput[];
  rsvpEnabled?: boolean | null;
  numberOfGuests?: number | null;
}) {
  return (
    rsvpTrackingEnabled(args) &&
    !(typeof args.numberOfGuests === "number" && args.numberOfGuests > 0)
  );
}

const EVENT_TYPES = new Set<ConciergeEventType>([
  "unknown",
  "birthday",
  "wedding",
  "baby_shower",
  "gender_reveal",
  "bridal_shower",
  "graduation",
  "gym_meet",
  "game_day",
  "football",
  "sport_event",
  "field_trip",
  "open_house",
  "housewarming",
  "appointment",
  "workshop",
  "special_event",
  "smart_signup",
  "general",
]);

const EVENT_TYPE_ALIASES: Record<string, ConciergeEventType> = {
  "birthday invite": "birthday",
  "birthday party": "birthday",
  birthdays: "birthday",
  "baby shower": "baby_shower",
  "baby showers": "baby_shower",
  "baby sprinkle": "baby_shower",
  "gender reveal": "gender_reveal",
  "bridal shower": "bridal_shower",
  "bridal showers": "bridal_shower",
  weddings: "wedding",
  wedding: "wedding",
  "gym meet": "gym_meet",
  "gymnastics meet": "gym_meet",
  gymnastics: "gym_meet",
  "game day": "game_day",
  gameday: "game_day",
  football: "football",
  "football game": "football",
  "sport event": "sport_event",
  "sports event": "sport_event",
  "field trip": "field_trip",
  "field trip/day": "field_trip",
  "field day": "field_trip",
  "open house": "open_house",
  "open houses": "open_house",
  housewarming: "housewarming",
  housewarmings: "housewarming",
  appointment: "appointment",
  appointments: "appointment",
  workshop: "workshop",
  class: "workshop",
  "special event": "special_event",
  "smart signup": "smart_signup",
  "smart sign-up": "smart_signup",
  "signup form": "smart_signup",
  "sign-up form": "smart_signup",
  "general event": "general",
};

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

function hasNegatedRsvpIntent(text: string): boolean {
  return (
    /\b(?:no|without|skip|disable)\s+(?:envitefy\s+)?rsvps?\b/i.test(text) ||
    /\b(?:do\s+not|don't|dont)\s+(?:need|want|include|collect|track|add|enable)\s+(?:an?\s+)?(?:envitefy\s+)?rsvps?\b/i.test(
      text,
    ) ||
    /\brsvps?\s+(?:not\s+needed|off|disabled)\b/i.test(text)
  );
}

function asksForCoreProductBundle(text: string): boolean {
  return (
    /\b(?:all|every)\s+(?:core\s+)?(?:product\s+formats?|products?|formats?)\b/i.test(text) ||
    /\b(?:combo|bundle)\s+of\s+(?:all|everything)\b/i.test(text)
  );
}

function isSourceFlyerReference(text: string): boolean {
  return (
    /\b(?:from|using|based\s+on|use)\s+(?:this|that|the|my|an?\s+uploaded|uploaded)?\s*(?:event\s+)?flyer\b/i.test(
      text,
    ) ||
    /\b(?:this|that|the|my|uploaded)\s+(?:event\s+)?flyer\s+(?:as|for|to|into|source|reference|upload)\b/i.test(
      text,
    )
  );
}

function asksForFlyerProduct(text: string): boolean {
  return (
    /\b(?:make|create|build|design|generate|draft)\s+(?:an?\s+)?(?:digital\s+)?flyer(?:\s+(?:invite|invitation))?\b/i.test(
      text,
    ) || /\bflyer\s+(?:invite|invitation)\b/i.test(text)
  );
}

function asksForInvitationProduct(text: string): boolean {
  if (hasReceivedInviteLanguage(text)) return false;
  return (
    /\binvitation\s+for\b/i.test(text) ||
    /\b(?:birthday|wedding|baby\s+shower|bridal\s+shower|gender\s+reveal|graduation)\s+(?:invitation|invite)\b/i.test(
      text,
    ) ||
    /\b(?:make|create|build|design|generate|draft)\s+(?:an?\s+)?(?:[a-z]+\s+)?(?:invitation|invite)\b/i.test(
      text,
    )
  );
}

function asksForRsvpProduct(text: string): boolean {
  return (
    /\brsvp\s+page\b/i.test(text) ||
    /\b(?:make|create|build|generate|draft)\s+(?:an?\s+)?rsvp\b/i.test(text)
  );
}

function asksForRsvpFeature(text: string): boolean {
  return (
    /\b(?:with|include|enable|collect|track|add)\s+(?:envitefy\s+)?rsvps?\b/i.test(text) ||
    /\brsvp\s+(?:tracking|collection|responses?)\b/i.test(text) ||
    /\brsvps?\s+(?:directly|on|through)\b/i.test(text)
  );
}

function hasReceivedInviteLanguage(text: string): boolean {
  return (
    /\b(i|we)\s+(got|received|have)\b[\s\S]{0,80}\b(invite|invitation)\b/i.test(text) ||
    /\b(invite|invitation)\b[\s\S]{0,80}\b(i|we)\s+(got|received|have)\b/i.test(text) ||
    /\b(was|were)\s+invited\b/i.test(text) ||
    /\b(someone|they|he|she)\s+(sent|forwarded)\s+(me|us)\b[\s\S]{0,80}\b(invite|invitation)\b/i.test(
      text,
    ) ||
    /\b(save|add)\b[\s\S]{0,80}\b(invite|invitation)\b[\s\S]{0,80}\b(received|got|sent|forwarded)\b/i.test(
      text,
    )
  );
}

function asksForEnvitefyProductOrEdit(text: string): boolean {
  if (hasReceivedInviteLanguage(text)) return true;
  if (
    asksForCoreProductBundle(text) ||
    asksForFlyerProduct(text) ||
    asksForInvitationProduct(text) ||
    asksForRsvpProduct(text) ||
    asksForRsvpFeature(text)
  ) {
    return true;
  }
  return (
    hasCreateVerb(text) &&
    /\b(?:envitefy|invite|invitation|flyer|live\s*card|event\s+page|rsvp\s+page|smart\s+sign[-\s]?up|signup|sign[-\s]?up|printable\s+flyer|instagram\s+story|whats\s?app|sms|text message|reminder|thank\s*you|menu|welcome sign)\b/i.test(
      text,
    )
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
            : normalized === "invitation" ||
                normalized === "invite" ||
                normalized === "flyer_invite" ||
                normalized === "flyer_invitation" ||
                normalized === "flyer/invitation"
              ? "digital_flyer"
              : normalized;
    if (REQUESTED_OUTPUTS.has(canonical as RequestedOutput)) {
      found.add(canonical as RequestedOutput);
    }
  };

  if (Array.isArray(value)) value.forEach(add);
  options.previous?.requestedOutputs?.forEach(add);
  options.previous?.outputs?.forEach(add);

  const text = options.text || "";
  if (asksForCoreProductBundle(text)) {
    found.add("live_card");
    found.add("digital_flyer");
    found.add("event_page");
  }
  if (/\blive\s*card\b/i.test(text)) found.add("live_card");
  if (/\bdigital\s+flyer\b/i.test(text)) found.add("digital_flyer");
  if (/\bflyer\s*(?:\/|&|\+|and)\s*invitation\b/i.test(text)) found.add("digital_flyer");
  if (
    /\bflyer\b/i.test(text) &&
    !/\b(print|printable)\b/i.test(text) &&
    (!isSourceFlyerReference(text) || asksForFlyerProduct(text))
  ) {
    found.add("digital_flyer");
  }
  if (
    /\b(smart\s+sign[-\s]?up|sign[-\s]?up\s+form|signup\s+form|sign[-\s]?up\s+sheet)\b/i.test(text)
  ) {
    found.add("signup_form");
  }
  if (
    asksForInvitationProduct(text) ||
    (/\b(invitation|invite)\b/i.test(text) && hasCreateVerb(text))
  ) {
    found.add("digital_flyer");
  }
  if (asksForRsvpProduct(text)) {
    found.add("rsvp_page");
  } else if (
    asksForRsvpFeature(text) &&
    !hasNegatedRsvpIntent(text) &&
    !Array.from(found).some((output) => RSVP_CAPABLE_OUTPUTS.has(output))
  ) {
    found.add("rsvp_page");
  }
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
    if (output === "invitation") return "digital_flyer";
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

export function normalizeCreationIntent(
  value: unknown,
  text: string,
  outputs: RequestedOutput[],
): CreationIntent {
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
  if (
    outputs.length &&
    /\b(make|create|build|turn|convert|draft|design|generate|write)\b/i.test(text)
  ) {
    return "create_output";
  }
  if (text.trim()) return "create_event";
  return "unknown";
}

export function normalizeCreationEventType(
  value: unknown,
  fallback: ConciergeEventType = "unknown",
) {
  const normalized = cleanCreationString(value)?.toLowerCase();
  if (normalized && EVENT_TYPE_ALIASES[normalized]) {
    return EVENT_TYPE_ALIASES[normalized];
  }
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
  if (hasReceivedInviteLanguage(text)) {
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
    signals.push({
      code: "authoring_phrase_or_material",
      label: "User is creating/editing or source is authoring material",
    });
    return {
      detectedSourceIntent: "authoring_source",
      confidence: "high",
      signals,
      requiresUserConfirmation: false,
    };
  }
  if (
    /\b(birthday|birthdays|wedding|weddings|baby shower|baby showers|gender reveal|bridal shower|invite|invitation)\b/.test(
      `${text} ${category}`,
    )
  ) {
    signals.push({
      code: "invite_like_category_only",
      label: "Invite-like category without ownership intent",
    });
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
  const textSourceIntent = resolveSourceIntent({ text: args.message });
  const contextualSourceIntent: SourceIntentResolution =
    textSourceIntent.detectedSourceIntent === "unknown" &&
    args.previous?.sourceContext.detectedSourceIntent
      ? {
          detectedSourceIntent: args.previous.sourceContext.detectedSourceIntent,
          confidence: args.previous.sourceContext.confidence || "low",
          signals: args.previous.sourceContext.signals || [],
          requiresUserConfirmation: Boolean(args.previous.sourceContext.requiresUserConfirmation),
        }
      : textSourceIntent;
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
        ...contextualSourceIntent,
      };
    }
    if (entries.length > 1) {
      return {
        type: "none",
        hasUsableContext: false,
        ambiguity: "multiple",
        ...contextualSourceIntent,
        candidates: entries,
      };
    }
    return {
      type: "none",
      hasUsableContext: false,
      ambiguity: "missing",
      ...contextualSourceIntent,
    };
  }

  if (args.previous?.sourceContext?.hasUsableContext) return args.previous.sourceContext;
  if (args.previous) {
    return {
      type: "none",
      resolvedId: args.previous.creationSessionId,
      hasUsableContext: false,
      ambiguity: "none",
      ...contextualSourceIntent,
    };
  }

  return {
    type: "none",
    hasUsableContext: false,
    ambiguity: "none",
    ...contextualSourceIntent,
  };
}

export function canPersistCreationDraft(
  draft: Pick<ConciergeEventDraft, "sourceContext" | "eventPurpose" | "title" | "eventType"> & {
    canPersist?: boolean;
  },
): boolean {
  if (draft.canPersist === false) return false;
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
    .replace(/\bflyer\s*(?:\/|&|\+|and)\s*invitation\b/gi, " ")
    .replace(/\bflyer\s+(?:invite|invitation)\b/gi, " ")
    .replace(/\bsmart\s+sign[-\s]?up\b/gi, " ")
    .replace(/\bsign[-\s]?up\s+(?:form|sheet)\b/gi, " ")
    .replace(/\brsvp\s+page\b/gi, " ")
    .replace(/\btext\s+message\b/gi, " ")
    .replace(/\binstagram\s+story\b/gi, " ")
    .replace(/\bprintable\s+flyer\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.length >= 3;
}

export function isNonCreationRequest(text: string) {
  const cleaned = cleanCreationString(text);
  if (!cleaned) return false;
  if (isWeatherSideQuestion(cleaned)) return false;
  return (
    /\bdo\s+not\s+create\s+(?:an?\s+)?(?:event|invite|invitation|card|flyer|page|product)\b/i.test(
      cleaned,
    ) ||
    /\bdon't\s+create\s+(?:an?\s+)?(?:event|invite|invitation|card|flyer|page|product)\b/i.test(
      cleaned,
    ) ||
    /\b(?:qa\s+)?ping\s+only\b/i.test(cleaned)
  );
}

function isWeatherSideQuestion(text: string) {
  return /\b(weather|forecast|temperature|temp|rain|raining|storm|snow|wind|hot|cold|humid|outdoor|outside)\b/i.test(
    text,
  );
}

function hasActiveEventContext(activeContext?: ConciergeActiveContext | null) {
  return Boolean(
    cleanCreationString(activeContext?.currentEventId) ||
      cleanCreationString(activeContext?.currentDraftId) ||
      cleanCreationString(activeContext?.selectedUploadId) ||
      cleanCreationString(activeContext?.selectedTemplateId) ||
      cleanCreationString(activeContext?.currentAssetId),
  );
}

export function isSecretLikeRequest(text: string) {
  const cleaned = cleanCreationString(text);
  if (!cleaned) return false;
  return (
    /\b(?:api\s*key|secret|password|auth\s*token|session\s*token|access\s*token|bearer\s+token|private\s*key|credential)s?\b/i.test(
      cleaned,
    ) ||
    /\b(?:sk-(?:test|live|proj|[a-z0-9_-]{4,})|ghp_[a-z0-9_]{8,}|github_pat_[a-z0-9_]{8,}|xox[baprs]-[a-z0-9-]{8,}|AIza[0-9A-Za-z_-]{8,}|AKIA[0-9A-Z]{8,})\b/i.test(
      cleaned,
    )
  );
}

export function isUnsafeGuestDataRequest(text: string) {
  const cleaned = cleanCreationString(text);
  if (!cleaned) return false;
  return (
    /\b(?:scrape|harvest|extract|export|download|dump|collect)\b[\s\S]{0,80}\b(?:private\s+)?(?:rsvp|guest|attendee)[\s\S]{0,40}\b(?:emails?|phone|contacts?|data)\b/i.test(
      cleaned,
    ) ||
    /\b(?:delete|remove|wipe)\b[\s\S]{0,80}\b(?:all\s+)?(?:of\s+)?(?:[A-Z][a-z]+['’]s\s+)?(?:guest\s+list|guests?|rsvp\s+responses?)\b/i.test(
      cleaned,
    ) ||
    /\bclear\b[\s\S]{0,80}\b(?:all\s+)?(?:of\s+)?(?:[A-Z][a-z]+['’]s\s+)?(?:guest\s+list|rsvp\s+responses?)\b/i.test(
      cleaned,
    ) ||
    /\bmark\s+(?:everyone|everybody|all|all\s+guests?|guests?|attendees?)\s+(?:as\s+)?(?:yes|no|maybe|attending|declined)\b/i.test(
      cleaned,
    )
  );
}

export function isExternalPlatformActionRequest(text: string) {
  const cleaned = cleanCreationString(text);
  if (!cleaned) return false;
  const platform =
    "(?:facebook|instagram|tiktok|tik\\s*tok|x|twitter|linkedin|youtube|whats\\s*app|whatsapp|messenger)";
  const audience =
    "(?:everyone|everybody|anyone|people|guests?|attendees?|contacts?|friends?|followers?|group)";
  return (
    new RegExp(
      `\\b(?:post|publish|upload|share)\\b[\\s\\S]{0,80}\\b(?:on|to|through|via)?\\s*${platform}\\b`,
      "i",
    ).test(cleaned) ||
    new RegExp(
      `\\b(?:send|message|dm|text|email|invite|notify|contact|forward|distribute)\\b[\\s\\S]{0,100}\\b(?:${audience}|${platform})\\b`,
      "i",
    ).test(cleaned) ||
    new RegExp(`\\b${platform}\\b[\\s\\S]{0,80}\\b${audience}\\b`, "i").test(cleaned) ||
    new RegExp(
      `\\b(?:create|make|set\\s+up|put)\\b[\\s\\S]{0,60}\\b${platform}\\b[\\s\\S]{0,30}\\b(?:event|event\\s+page|page|post)\\b`,
      "i",
    ).test(cleaned) ||
    new RegExp(`\\b${platform}\\b[\\s\\S]{0,40}\\b(?:event\\s+page|event)\\b`, "i").test(cleaned)
  );
}

export function isAmbiguousEditRequest(
  text: string,
  options: {
    activeContext?: ConciergeActiveContext | null;
    previous?: ConciergeEventDraft | null;
  } = {},
) {
  const cleaned = cleanCreationString(text);
  if (!cleaned || options.previous || hasActiveEventContext(options.activeContext)) return false;
  if (
    /\b(birthday|bday|turning|turns|wedding|getting\s+married|baby\s+shower|gender\s+reveal|bridal\s+shower|graduation|game\s+day|football|open\s+house|housewarming|appointment|workshop|party|celebration|ceremony|reception|fundraiser)\b/i.test(
      cleaned,
    ) &&
    /\b(?:on|at)\b/i.test(cleaned)
  ) {
    return false;
  }
  return (
    /\b(?:make|change|update|edit|revise|refine|polish)\b[\s\S]{0,80}\b(?:it|this|the\s+)?(?:invite|invitation|card|flyer|event\s+page)\b[\s\S]{0,80}\b(?:elegant|prettier|nicer|modern|formal|fun|playful|style|vibe|tone|theme|color|colors|design)\b/i.test(
      cleaned,
    ) ||
    /\b(?:make|change|update|edit|revise|refine|polish)\b[\s\S]{0,80}\b(?:elegant|prettier|nicer|modern|formal|fun|playful)\b[\s\S]{0,80}\b(?:invite|invitation|card|flyer|event\s+page)\b/i.test(
      cleaned,
    )
  );
}

export function isOffDomainRequest(text: string) {
  const cleaned = cleanCreationString(text);
  if (!cleaned) return false;
  if (isWeatherSideQuestion(cleaned)) return false;
  const eventAdjacent =
    /\b(birthday|bday|wedding|bridal|bride|groom|shower|graduation|party|event|invite|invitation|rsvp|guest|ceremony|reception|housewarming|open\s+house)\b/i.test(
      cleaned,
    );
  const offTopicRequest =
    /\b(jokes?|toasts?|speeches?|vows?|recipe|cake recipe|homework|essay|resume|tax(?:es)?|spreadsheet|printer|wifi|wi-fi|router|computer|laptop|phone|code|bug|debug|script|database)\b/i.test(
      cleaned,
    );
  if (eventAdjacent && offTopicRequest && !asksForEnvitefyProductOrEdit(cleaned)) return true;
  if (
    /\b(envitefy|event|invite|invitation|rsvp|guest|guests|calendar|upload|snap|ocr|flyer|live\s*card|event\s+page|sign[-\s]?up|signup|registry|gift\s*list|wishlist|birthday|wedding|shower|party|graduation|open\s+house|housewarming|game\s+day|football|gym\s+meet|gymnastics|workshop|appointment)\b/i.test(
      cleaned,
    )
  ) {
    return false;
  }
  const asksForHelp =
    /^(?:can|could|would|will)\s+you\s+(?:help|fix|write|explain|tell|make|create)\b/i.test(
      cleaned,
    ) ||
    /^(?:tell|write|explain|show)\s+me\b/i.test(cleaned) ||
    /^(?:what|why|how)\b/i.test(cleaned) ||
    /\bhelp\s+me\b/i.test(cleaned);
  if (!asksForHelp && !/[?]$/.test(cleaned)) return false;
  return /\b(printer|wifi|wi-fi|router|computer|laptop|phone|homework|essay|recipe|tax|taxes|resume|math|code|bug|browser|password|account|spreadsheet|document|joke|database|databases|script|debug)\b/i.test(
    cleaned,
  );
}

export function classifyCreationBoundary(
  text: string,
  options: {
    activeContext?: ConciergeActiveContext | null;
    previous?: ConciergeEventDraft | null;
  } = {},
): Exclude<CreationSourceContext["boundary"], null | undefined> | null {
  if (isSecretLikeRequest(text)) return "secret_detected";
  if (isUnsafeGuestDataRequest(text)) return "unsafe_guest_data";
  if (isExternalPlatformActionRequest(text)) return "external_action";
  if (isNonCreationRequest(text)) return "non_creation";
  if (isAmbiguousEditRequest(text, options)) return "ambiguous_edit";
  if (isOffDomainRequest(text)) return "off_domain";
  return null;
}

export function hasClearCreationSignal(text: string) {
  const cleaned = cleanCreationString(text);
  if (!cleaned || isGreetingMessage(cleaned)) return false;
  if (hasReceivedInviteLanguage(cleaned)) return true;
  if (
    /\b(birthday|bday|turning|turns|wedding|baby\s+shower|gender\s+reveal|bridal\s+shower|graduation|graduate|gymnastics|gym\s+meet|meet\s+schedule|invitational|game\s+day|gameday|football|sports?\s+event|field\s+trip|field\s+day|open\s+house|housewarming|appointment|consultation|workshop|class|seminar|training|party|celebration|ceremony|reception|fundraiser|dinner|brunch|luncheon|breakfast|potluck|book\s+club|teacher\s+appreciation|meeting|event)\b/i.test(
      cleaned,
    )
  ) {
    return true;
  }
  return (
    hasCreateVerb(cleaned) &&
    /\b(event|invite|invitation|flyer|card|live\s*card|event\s+page|rsvp\s+page|sign[-\s]?up|signup|instagram\s+story|text\s+message|whats\s?app|poster|menu|welcome\s+sign)\b/i.test(
      cleaned,
    )
  );
}

export function deriveCreationStatus(args: {
  sourceContext: CreationSourceContext;
  eventPurpose: string | null;
  title: string | null;
  eventType: ConciergeEventType;
  requestedOutputs: RequestedOutput[];
  dateText?: string | null;
  timeText?: string | null;
  startISO?: string | null;
  location?: string | null;
  honoreeName?: string | null;
  ageOrMilestone?: string | null;
  ageOrMilestoneSkipped?: boolean | null;
  rsvpEnabled?: boolean | null;
  numberOfGuests?: number | null;
  rsvpName?: string | null;
  rsvpContact?: string | null;
  tone?: string | null;
  draftStatus?: unknown;
}): {
  draftStatus: CreationDraftStatus;
  missingFields: string[];
  currentQuestion: string | null;
  canPersist: boolean;
} {
  const hasEventPurpose = Boolean(
    cleanCreationString(args.eventPurpose) || cleanCreationString(args.title),
  );
  const receivedInviteNeedsSource =
    args.sourceContext.detectedSourceIntent === "received_invite" &&
    !args.sourceContext.hasUsableContext &&
    !cleanCreationString(args.eventPurpose) &&
    !cleanCreationString(args.title) &&
    !args.dateText &&
    !args.startISO &&
    !args.location;
  if (receivedInviteNeedsSource) {
    return {
      draftStatus: "needs_source_or_event",
      missingFields: ["sourceContext"],
      currentQuestion: "invite_source",
      canPersist: false,
    };
  }
  const canPersist = canPersistCreationDraft(args);
  const hasMeaningfulContext = canPersist;
  const missingFields: string[] = [];
  const plan = getRequirementPlan({
    eventType: args.eventType,
    requestedOutputs: args.requestedOutputs,
    sourceContext: args.sourceContext,
  });

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

  const fieldDraft = {
    ...args,
    honoreeName: args.honoreeName ?? null,
    ageOrMilestone: args.ageOrMilestone ?? null,
    ageOrMilestoneSkipped: args.ageOrMilestoneSkipped ?? null,
    dateText: args.dateText ?? null,
    timeText: args.timeText ?? null,
    startISO: args.startISO ?? null,
    location: args.location ?? null,
    rsvpEnabled: args.rsvpEnabled ?? null,
    numberOfGuests: args.numberOfGuests ?? null,
    rsvpName: args.rsvpName ?? null,
    rsvpContact: args.rsvpContact ?? null,
    tone: args.tone ?? null,
    venue: null,
  };
  for (const field of plan.requiredFields) {
    if (!requirementFieldSatisfied(field, fieldDraft)) {
      missingFields.push(field);
    }
  }
  if (
    !missingFields.length &&
    shouldAskRsvpDecision({
      sourceContext: args.sourceContext,
      eventType: args.eventType,
      requestedOutputs: args.requestedOutputs,
      eventPurpose: args.eventPurpose,
      title: args.title,
      rsvpEnabled: args.rsvpEnabled,
    })
  ) {
    missingFields.push("rsvpEnabled");
  }
  if (
    !missingFields.length &&
    shouldAskRsvpGuestCount({
      requestedOutputs: args.requestedOutputs,
      rsvpEnabled: args.rsvpEnabled,
      numberOfGuests: args.numberOfGuests,
    })
  ) {
    missingFields.push("numberOfGuests");
  }
  if (
    !missingFields.length &&
    rsvpTrackingEnabled(args) &&
    args.sourceContext.detectedSourceIntent !== "received_invite" &&
    !requirementFieldSatisfied("rsvpName", fieldDraft)
  ) {
    missingFields.push("rsvpName");
  }
  if (
    !missingFields.length &&
    rsvpTrackingEnabled(args) &&
    args.sourceContext.detectedSourceIntent !== "received_invite" &&
    !requirementFieldSatisfied("rsvpContact", fieldDraft)
  ) {
    missingFields.push("rsvpContact");
  }
  if (
    !missingFields.length &&
    plan.shouldAskTone &&
    !requirementFieldSatisfied("tone", fieldDraft)
  ) {
    missingFields.push("tone");
  }

  const canPreview =
    args.sourceContext.hasUsableContext ||
    (hasEventPurpose && Boolean(args.dateText || args.startISO || args.location));
  const hasMissingRequiredDetails = missingFields.some((field) =>
    plan.requiredFields.includes(field as (typeof plan.requiredFields)[number]),
  );
  return {
    draftStatus: !hasMissingRequiredDetails && canPreview ? "preview_ready" : "drafting",
    missingFields,
    currentQuestion: missingFields[0] || null,
    canPersist,
  };
}

export function outputQuestion(output: RequestedOutput): string {
  return getRequirementForOutput(output).firstQuestion;
}
