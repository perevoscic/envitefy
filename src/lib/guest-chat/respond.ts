import { rankGuestChatKnowledge } from "./knowledge.ts";

export type GuestChatRole = "user" | "assistant";

export type GuestChatMessage = {
  role: GuestChatRole;
  text: string;
};

export type GuestChatAnswer = {
  answer: string;
  handoffSuggested: boolean;
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

export function buildDeterministicGuestChatAnswer(message: string): GuestChatAnswer {
  const cleaned = cleanText(message, 1000);
  const matches = rankGuestChatKnowledge(cleaned, 3);
  const matchedKnowledgeIds = matches.map((item) => item.id);

  if (!cleaned) {
    return {
      answer: "Ask me a question about Envitefy event pages, RSVPs, uploads, or guest actions.",
      handoffSuggested: false,
      matchedKnowledgeIds,
      aiAllowed: false,
    };
  }

  if (asksForPrivateDetails(cleaned)) {
    return {
      answer:
        "I cannot access or share private event, account, guest-list, RSVP, password, or access-code details. If you are a guest, use the event link and any code the host gave you. For account help, contact Envitefy support.",
      handoffSuggested: true,
      matchedKnowledgeIds,
      aiAllowed: false,
    };
  }

  if (asksSpecificEventQuestion(cleaned)) {
    return {
      answer:
        "I can explain how Envitefy works, but I cannot see the private details of a specific event from this chat. Open the shared event link to check the host's visible details, RSVP action, map, calendar, registry, or sign-up options.",
      handoffSuggested: false,
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
      matchedKnowledgeIds,
      aiAllowed: false,
    };
  }

  if (!looksEnvitefyRelated(cleaned, matches.length)) {
    return {
      answer:
        "I can help with Envitefy questions about hosted event pages, invitations, RSVP, uploads, registry links, calendar saves, maps, and smart sign-ups.",
      handoffSuggested: false,
      matchedKnowledgeIds,
      aiAllowed: false,
    };
  }

  const best = matches[0];
  if (best) {
    return {
      answer: best.answer,
      handoffSuggested: best.id === "support" || best.id === "pricing",
      matchedKnowledgeIds,
      aiAllowed: best.id !== "support" && best.id !== "pricing",
    };
  }

  return {
    answer:
      "Envitefy helps hosts create shareable event pages with details, RSVP, maps, calendar saves, registry links, and sign-up options. For account-specific or event-specific help, contact Envitefy support.",
    handoffSuggested: true,
    matchedKnowledgeIds,
    aiAllowed: false,
  };
}
