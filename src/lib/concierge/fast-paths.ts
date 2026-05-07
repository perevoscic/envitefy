import {
  isGreetingMessage,
  isMeaningfulEventText,
  normalizeRequestedOutputs,
} from "./creation-intent.ts";
import { isEnvFlagEnabled } from "./openai-config.ts";
import type { ConciergeEventDraft, ConciergeMessageRequest, RequestedOutput } from "./types.ts";

const STARTER_CHIPS = new Set([
  "birthday",
  "wedding",
  "baby shower",
  "gender reveal",
  "bridal shower",
  "game day",
  "field trip/day",
  "field trip",
  "field day",
  "open house",
  "housewarming",
  "smart signup",
  "smart sign-up",
  "signup form",
  "custom invite",
  "graduation",
  "gym meet",
  "gymnastics meet",
  "corporate",
  "general event",
  "surprise me",
]);

const OUTPUT_SELECTION_PATTERNS: Partial<Record<RequestedOutput, RegExp[]>> = {
  live_card: [/\blive\s*card\b/gi],
  event_page: [/\bevent\s+page\b/gi],
  digital_flyer: [/\bdigital\s+flyer\b/gi, /\bflyer\s+invite\b/gi, /\bflyer\b/gi],
  invitation: [/\binvitation\b/gi, /\binvite\b/gi],
  rsvp_page: [/\brsvp\s+page\b/gi, /\brsvp\b/gi],
  signup_form: [
    /\bsmart\s+sign[-\s]?up(?:\s+form)?\b/gi,
    /\bsign[-\s]?up\s+(?:form|sheet)\b/gi,
    /\bsignup\s+(?:form|sheet)\b/gi,
  ],
};

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned || null;
}

function normalizedMessage(value: unknown): string {
  return cleanString(value)?.toLowerCase() || "";
}

function hasAssetIntent(text: string): boolean {
  return (
    /\b(create|make|build|draft|generate|write|turn|convert)\b/i.test(text) &&
    /\b(whats\s?app|sms|text message|instagram|story|print|printable|flyer|event\s+page|sign[-\s]?up|signup|reminder|thank\s*you|menu|welcome sign|rsvp|invite|invitation|card)\b/i.test(
      text,
    )
  );
}

function hasRsvpDeadlineIntent(text: string): boolean {
  return /\b(?:rsvp|respond)\s+by\s+[^.,;]+/i.test(text);
}

function hasToneOrStyleIntent(text: string): boolean {
  return /\b(make|set|change|update|use|switch|go|more|less)\b[\s\S]{0,80}\b(elegant|luxury|fun|playful|kids|formal|casual|modern|rustic|floral|tone|style|theme)\b/i.test(
    text,
  );
}

function hasObviousStarterCreationIntent(text: string): boolean {
  return (
    /\b(create|make|build|draft|design)\b/i.test(text) &&
    /\b(birthday|wedding|baby\s+shower|gender\s+reveal|bridal\s+shower|game|football|field\s+trip|open\s+house|housewarming|graduation|gymnastics|gym\s+meet)\b/i.test(
      text,
    ) &&
    /\b(live\s*card|flyer|invite|invitation|event\s+page|sign[-\s]?up|signup|rsvp)\b/i.test(text)
  );
}

function stripRequestedOutputLabels(text: string, requestedOutputs: RequestedOutput[]): string {
  let stripped = text;
  for (const output of requestedOutputs) {
    for (const pattern of OUTPUT_SELECTION_PATTERNS[output] || []) {
      stripped = stripped.replace(pattern, " ");
    }
  }
  return stripped.replace(/\s+/g, " ").trim();
}

function isStarterCategoryProductSelection(text: string, requestedOutputs: RequestedOutput[]) {
  if (!requestedOutputs.length) return false;
  const categoryOnly = normalizedMessage(stripRequestedOutputLabels(text, requestedOutputs));
  return Boolean(categoryOnly && STARTER_CHIPS.has(categoryOnly));
}

function hasKnownStarterCategoryContext(args: {
  text: string;
  requestedOutputs: RequestedOutput[];
  starterCategory?: string | null;
}) {
  if (!args.requestedOutputs.length) return false;
  const categoryText = normalizedMessage(
    stripRequestedOutputLabels(args.text, args.requestedOutputs),
  );
  if (!categoryText) return false;

  const structuredCategory = normalizedMessage(args.starterCategory);
  if (structuredCategory && STARTER_CHIPS.has(structuredCategory)) {
    return categoryText === structuredCategory || categoryText.startsWith(`${structuredCategory} `);
  }

  return Array.from(STARTER_CHIPS).some(
    (category) => categoryText === category || categoryText.startsWith(`${category} `),
  );
}

export function isConciergeFastActionsEnabled(): boolean {
  return isEnvFlagEnabled(process.env.CONCIERGE_SKIP_AI_FAST_ACTIONS);
}

export function shouldSkipOpenAiForEventAction(message: string): boolean {
  const text = cleanString(message) || "";
  if (!text) return false;
  return hasAssetIntent(text) || hasRsvpDeadlineIntent(text) || hasToneOrStyleIntent(text);
}

export function shouldSkipOpenAiForCreationRequest(args: {
  request: ConciergeMessageRequest;
  fallbackDraft?: ConciergeEventDraft | null;
}): boolean {
  const message = cleanString(args.request.message) || "";
  const starterCategory = cleanString(args.request.starterCategory);
  const selectionMessage =
    starterCategory && !message.toLowerCase().includes(starterCategory.toLowerCase())
      ? `${starterCategory} ${message}`.trim()
      : message;
  if (isGreetingMessage(message)) return true;
  if (!args.request.draft && !args.request.ocrContext && hasObviousStarterCreationIntent(message)) {
    return true;
  }

  const action = args.request.action || "message";
  const requestedOutputs: RequestedOutput[] = args.fallbackDraft?.requestedOutputs?.length
    ? args.fallbackDraft.requestedOutputs
    : normalizeRequestedOutputs(args.request.requestedOutputs, {
        text: message,
        previous: args.request.draft || null,
        defaultOutput: null,
      });
  if (action === "ocr_result") return true;
  const normalized = normalizedMessage(message);
  if ((action === "chip" || action === "starter_category") && STARTER_CHIPS.has(normalized)) {
    return true;
  }
  if (
    (action === "chip" || action === "starter_category") &&
    isStarterCategoryProductSelection(selectionMessage, requestedOutputs)
  ) {
    return true;
  }
  if (
    action === "starter_category" &&
    !args.request.draft &&
    !args.request.ocrContext &&
    hasKnownStarterCategoryContext({
      text: selectionMessage,
      requestedOutputs,
      starterCategory,
    })
  ) {
    return true;
  }
  if ((action === "chip" || action === "starter_category") && hasAssetIntent(message)) {
    return true;
  }

  if (!isConciergeFastActionsEnabled()) return false;

  return (
    (action === "chip" || action === "starter_category") &&
    requestedOutputs.length > 0 &&
    !isMeaningfulEventText(message, requestedOutputs)
  );
}
