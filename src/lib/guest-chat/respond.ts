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

export function formatGuestChatHistoryForPrompt(history: GuestChatMessage[]) {
  return history.map((message) => `${message.role}: ${message.text}`).join("\n");
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

function looksEnvitefyRelated(message: string, matchedCount: number) {
  if (matchedCount > 0) return true;
  return /\b(envitefy|event|invite|invitation|rsvp|guest|host|registry|signup|sign-up|calendar|map|flyer|pdf|wedding|birthday|shower)\b/i.test(
    message,
  );
}

function hasDirectAccountCreationIntent(message: string) {
  return (
    /\b(?:create|make|open|start|set up)\s+(?:an?\s+)?account\b/i.test(message) ||
    /\b(?:can|could|should)\s+i\s+(?:create|make|open|start|set up)\s+(?:an?\s+)?account\b/i.test(
      message,
    ) ||
    /\b(?:i|we)\s+(?:am|are|'m|'re|want|would like|ready)\s+(?:to\s+)?(?:try|start|create|make|build|get going)\b/i.test(
      message,
    ) ||
    /\b(?:i|we)\s+(?:need|want)\s+(?:to\s+)?(?:create|make|build)\b/i.test(
      message,
    ) ||
    /\b(?:let'?s|lets)\s+(?:try|start|create|make|build|do it|get going)\b/i.test(message) ||
    /\b(?:sign\s*me\s*up|try\s+now|start\s+now|get\s+started)\b/i.test(message) ||
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

  if (hasDirectAccountCreationIntent(cleaned)) return true;

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

export function appendGuestSignupPrompt(answer: string) {
  const cleaned = cleanText(answer, 1600);
  if (!cleaned) return "Want to try it now? Create an account to start your event page.";
  if (/\b(?:try it now|create an account|start your event page|get started)\b/i.test(cleaned)) {
    return cleaned;
  }
  return `${cleaned}\n\nWant to try it now? Create an account to start your event page.`;
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
        "Yes. If you're ready to create your own event page, create an account to save the draft and publish it. I can still answer planning questions here first.",
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

  if (!looksEnvitefyRelated(cleaned, matches.length)) {
    return {
      answer:
        "I can help with Envitefy questions about hosted event pages, invitations, RSVP, uploads, registry links, calendar saves, maps, and smart sign-ups.",
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
      "Envitefy helps hosts create shareable event pages with details, RSVP, maps, calendar saves, registry links, and sign-up options. For account-specific or event-specific help, contact Envitefy support.",
    handoffSuggested: true,
    signupSuggested: false,
    matchedKnowledgeIds,
    aiAllowed: false,
  };
}
