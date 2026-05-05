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
  "bridal shower",
  "game day",
  "field trip/day",
  "open house",
  "housewarming",
  "custom invite",
  "graduation",
  "gym meet",
  "gymnastics meet",
  "corporate",
  "general event",
  "surprise me",
]);

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
    /\b(whats\s?app|sms|text message|instagram|story|print|printable|flyer|event\s+page|reminder|thank\s*you|menu|welcome sign|rsvp|invite|invitation|card)\b/i.test(
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
    /\b(birthday|wedding|baby\s+shower|bridal\s+shower|game|graduation|gymnastics|gym\s+meet)\b/i.test(
      text,
    ) &&
    /\b(live\s*card|flyer|invite|invitation|event\s+page|rsvp)\b/i.test(text)
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
  if (isGreetingMessage(message)) return true;
  if (!args.request.draft && !args.request.ocrContext && hasObviousStarterCreationIntent(message)) {
    return true;
  }

  const action = args.request.action || "message";
  if (action === "ocr_result") return true;
  const normalized = normalizedMessage(message);
  if ((action === "chip" || action === "starter_category") && STARTER_CHIPS.has(normalized)) {
    return true;
  }
  if ((action === "chip" || action === "starter_category") && hasAssetIntent(message)) {
    return true;
  }

  if (!isConciergeFastActionsEnabled()) return false;

  const requestedOutputs: RequestedOutput[] = args.fallbackDraft?.requestedOutputs?.length
    ? args.fallbackDraft.requestedOutputs
    : normalizeRequestedOutputs(args.request.requestedOutputs, {
        text: message,
        previous: args.request.draft || null,
        defaultOutput: null,
      });
  return (
    (action === "chip" || action === "starter_category") &&
    requestedOutputs.length > 0 &&
    !isMeaningfulEventText(message, requestedOutputs)
  );
}
