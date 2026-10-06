import { rankGuestChatKnowledge } from "./knowledge.ts";

export type GuestChatRole = "user" | "assistant";

export type GuestChatMessage = {
  role: GuestChatRole;
  text: string;
};

export type GuestChatAnswer = {
  answer: string;
  handoffSuggested: boolean;
  signupSuggested: boolean;
  matchedKnowledgeIds: string[];
  aiAllowed: boolean;
};

const MAX_HISTORY_MESSAGES = 10;

export const GUEST_CHAT_OUT_OF_SCOPE_ANSWER =
  "I can only help with Envitefy, like creating Live Cards, Event Pages and Sign-up Forms, RSVPs, uploads, registries and what guests can do. What would you like to know?";
const MAX_HISTORY_TEXT_LENGTH = 1200;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function cleanText(value: unknown, maxLength = MAX_HISTORY_TEXT_LENGTH): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function normalizeGuestChatHistory(value: unknown): GuestChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry): GuestChatMessage | null => {
      if (!isRecord(entry)) return null;
      const role = entry.role;
      const text = cleanText(entry.text);
      if ((role !== "user" && role !== "assistant") || !text) return null;
      return { role, text };
    })
    .filter((entry): entry is GuestChatMessage => Boolean(entry))
    .slice(-MAX_HISTORY_MESSAGES);
}

function asksForHuman(message: string) {
  return /\b(contact|support|human|person|team|email|call|help desk|sales|partnership)\b/i.test(
    message,
  );
}

function asksAboutPricing(message: string) {
  return /\b(price|pricing|cost|billing|plan|subscription|trial|refund|invoice)\b/i.test(message);
}

function asksForPrivateDetails(message: string) {
  return /\b(guest list|who is coming|who'?s coming|who attended|rsvp responses?|private data|account password|password|api key|secret|session token|access token|door code|gate code)\b/i.test(
    message,
  );
}

function asksSpecificEventQuestion(message: string) {
  return (
    /\b(where|when|what time|what should i wear|can i bring|is there|how do i get)\b[\s\S]{0,80}\b(my|this|the)\s+(event|party|wedding|invite|invitation|rsvp)\b/i.test(
      message,
    ) ||
    /\b(my|this|the)\s+(event|party|wedding|invite|invitation)\b[\s\S]{0,80}\b(address|location|time|date|dress code|parking|host)\b/i.test(
      message,
    )
  );
}

const ENVITEFY_TOPIC_PATTERN =
  /\b(envitefy|concierge|live\s*cards?|event\s*pages?|events?|sign[-\s]?ups?|signup\s*forms?|invites?|invitations?|rsvps?|guests?|hosts?|hosting|registry|registries|gifts?|wishlist|templates?|designs?|artwork|flyers?|uploads?|snap|scan|photo|pdf|calendar|maps?|directions|publish|share|link|account|sign\s*in|log\s*in|price|pricing|cost|free|cards?|qr|party|parties|wedding|birthday|shower|reveal|reunion|meet|game|volunteer)\b/i;

function looksEnvitefyRelated(message: string) {
  return ENVITEFY_TOPIC_PATTERN.test(message);
}

/** Only an explicit request to make an account gets the fixed signup answer. */
function hasDirectAccountCreationIntent(message: string) {
  return (
    /\b(?:create|make|open|start|set up)\s+(?:an?\s+|my\s+)?account\b/i.test(message) ||
    /\b(?:sign\s*me\s*up|register\s+me)\b/i.test(message)
  );
}

/** Creation intent still gets a real answer, followed by a signup suggestion. */
function hasCreationIntent(message: string) {
  return (
    /\b(?:i|we)\s+(?:am|are|'m|'re|want|would like|ready)\s+(?:to\s+)?(?:try|start|create|make|build|get going)\b/i.test(
      message,
    ) ||
    /\b(?:i|we)\s+(?:need|want)\s+(?:to\s+)?(?:create|make|build)\b/i.test(message) ||
    /\b(?:let'?s|lets)\s+(?:try|start|create|make|build|do it|get going)\b/i.test(message) ||
    /\b(?:try\s+now|start\s+now|get\s+started)\b/i.test(message) ||
    /\bhow\s+(?:do|can)\s+i\s+(?:start|get started|create|try|make)\b/i.test(message)
  );
}

function isAffirmativeReadyReply(message: string) {
  const normalized = message
    .toLowerCase()
    .replace(/[^\w\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return /^(?:yes|yeah|yep|sure|ok|okay|sounds good|looks good|great|perfect|cool|nice|ready|that works|i'm ready|im ready|we're ready|were ready|let's do it|lets do it)(?:\s+(?:please|thanks|now))?$/.test(
    normalized,
  );
}

function hasCreationContext(text: string) {
  return /\b(?:envitefy|event page|hosted event|live card|invitation|invite|rsvp|registry|gift link|wishlist|smart sign[-\s]?up|signup form|event details|publish|shared link|shareable link)\b/i.test(
    text,
  );
}

export function shouldSuggestGuestSignup(
  message: string,
  history: GuestChatMessage[] = [],
  options: { handoffSuggested?: boolean } = {},
) {
  const cleaned = cleanText(message, 1000);
  if (!cleaned || options.handoffSuggested) return false;
  if (
    asksForPrivateDetails(cleaned) ||
    asksSpecificEventQuestion(cleaned) ||
    asksAboutPricing(cleaned) ||
    asksForHuman(cleaned)
  ) {
    return false;
  }

  if (hasDirectAccountCreationIntent(cleaned) || hasCreationIntent(cleaned)) return true;

  const latestAssistant =
    [...history].reverse().find((entry) => entry.role === "assistant")?.text || "";
  if (isAffirmativeReadyReply(cleaned) && hasCreationContext(latestAssistant)) return true;

  const recentConversation = history.map((entry) => entry.text).join(" ");
  const userCreationTurns = [
    ...history.filter((entry) => entry.role === "user").map((entry) => entry.text),
    cleaned,
  ].filter(hasCreationContext).length;

  return (
    userCreationTurns >= 2 &&
    hasCreationContext(recentConversation) &&
    /\b(?:next|what else|anything else|that helps|sounds good|ready|try it|start)\b/i.test(cleaned)
  );
}

export const GUEST_SIGNUP_PROMPT = "Want to try it now? Create an account to get started.";

/** The text to add after an answer so it ends with the signup prompt ("" if it already does). */
export function guestSignupPromptSuffix(answer: string) {
  const trimmed = answer.trim();
  if (!trimmed) return GUEST_SIGNUP_PROMPT;
  if (/\b(?:try it now|create an account|start your event page|get started)\b/i.test(trimmed)) {
    return "";
  }
  return `\n\n${GUEST_SIGNUP_PROMPT}`;
}

export function appendGuestSignupPrompt(answer: string) {
  const trimmed = answer.trim().slice(0, 1600);
  return `${trimmed}${guestSignupPromptSuffix(trimmed)}`;
}

export function buildDeterministicGuestChatAnswer(message: string): GuestChatAnswer {
  const cleaned = cleanText(message, 1000);
  const matches = rankGuestChatKnowledge(cleaned, 3);
  const matchedKnowledgeIds = matches.map((item) => item.id);

  if (!cleaned) {
    return {
      answer: "Ask me a question about Envitefy event pages, RSVPs, uploads, or guest actions.",
      handoffSuggested: false,
      signupSuggested: false,
      matchedKnowledgeIds,
      aiAllowed: false,
    };
  }

  if (hasDirectAccountCreationIntent(cleaned)) {
    return {
      answer:
        "Select Create account below to sign up. Once you're in, you can start a Live Card, an Event Page, or a Sign-up Form, save it as a draft, and publish when you're ready.",
      handoffSuggested: false,
      signupSuggested: true,
      matchedKnowledgeIds,
      aiAllowed: false,
    };
  }

  if (asksForPrivateDetails(cleaned)) {
    return {
      answer:
        "I cannot access or share private event, account, guest-list, RSVP, password, or access-code details. If you are a guest, use the event link and any code the host gave you. For account help, contact Envitefy support.",
      handoffSuggested: true,
      signupSuggested: false,
      matchedKnowledgeIds,
      aiAllowed: false,
    };
  }

  if (asksSpecificEventQuestion(cleaned)) {
    return {
      answer:
        "I can explain how Envitefy works, but I cannot see the private details of a specific event from this chat. Open the shared event link to check the host's visible details, RSVP action, map, calendar, registry, or sign-up options.",
      handoffSuggested: false,
      signupSuggested: false,
      matchedKnowledgeIds,
      aiAllowed: false,
    };
  }

  if (asksAboutPricing(cleaned)) {
    const pricing = matches.find((item) => item.id === "pricing");
    return {
      answer:
        pricing?.answer ||
        "I do not have confirmed pricing details in this chat. Use the contact option and the Envitefy team can follow up.",
      handoffSuggested: true,
      signupSuggested: false,
      matchedKnowledgeIds,
      aiAllowed: false,
    };
  }

  if (asksForHuman(cleaned)) {
    const support = matches.find((item) => item.id === "support");
    return {
      answer:
        support?.answer ||
        "Use the contact option in this chat or visit the Contact page, and include what you need help with.",
      handoffSuggested: true,
      signupSuggested: false,
      matchedKnowledgeIds,
      aiAllowed: false,
    };
  }

  if (!looksEnvitefyRelated(cleaned)) {
    return {
      answer: GUEST_CHAT_OUT_OF_SCOPE_ANSWER,
      handoffSuggested: false,
      signupSuggested: false,
      matchedKnowledgeIds,
      aiAllowed: false,
    };
  }

  const best = matches[0];
  if (best) {
    return {
      answer: best.answer,
      handoffSuggested: best.id === "support" || best.id === "pricing",
      signupSuggested: false,
      matchedKnowledgeIds,
      aiAllowed: best.id !== "support" && best.id !== "pricing",
    };
  }

  return {
    answer:
      "Envitefy helps hosts create Live Cards, Event Pages and Sign-up Forms, each shared with one link where guests can RSVP, get directions, save the date and open registry links.",
    handoffSuggested: false,
    signupSuggested: false,
    matchedKnowledgeIds,
    aiAllowed: true,
  };
}
