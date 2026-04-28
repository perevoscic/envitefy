const RSVP_OPTION_START_REGEX = /[????]/;
const RSVP_OPTION_PHRASES = [
  /\bwill\s+attend\b/gi,
  /\bwill\s+not\s+attend\b/gi,
  /\bwill\s+not\s+be\s+able\s+to\s+attend\b/gi,
  /\bwon't\s+be\s+able\s+to\s+attend\b/gi,
  /\bmight\s+be\s+able\s+to\s+attend\b/gi,
  /\bmay\s+be\s+able\s+to\s+attend\b/gi,
  /\bpossibly\b/gi,
  /\bmaybe\b/gi,
];

const RSVP_GENERIC_LABEL_TOKENS = new Set([
  "at",
  "by",
  "call",
  "contact",
  "details",
  "email",
  "for",
  "host",
  "info",
  "information",
  "me",
  "message",
  "organizer",
  "phone",
  "please",
  "question",
  "questions",
  "reply",
  "respond",
  "rsvp",
  "text",
  "the",
  "to",
  "txt",
  "us",
  "with",
]);

export function isGenericRsvpContactLabel(raw: string): boolean {
  const normalized = raw
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  if (!normalized) return true;
  const tokens = normalized.split(/\s+/).filter(Boolean);
  return tokens.length > 0 && tokens.every((token) => RSVP_GENERIC_LABEL_TOKENS.has(token));
}

export function stripLeadingHostArticle(raw: string): string {
  return raw.replace(/^the\s+/i, "").trim();
}

export function cleanRsvpContactLabel(raw: string): string {
  let working = raw;
  const optionIndex = working.search(RSVP_OPTION_START_REGEX);
  if (optionIndex >= 0) {
    working = working.slice(0, optionIndex);
  }
  for (const pattern of RSVP_OPTION_PHRASES) {
    working = working.replace(pattern, "");
  }
  working = working
    .replace(/\bhttps?:\/\/\S+\b/gi, "")
    .replace(/\bwww\.\S+\b/gi, "")
    .replace(/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi, "")
    .replace(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, "")
    .replace(/\b\d{10,}\b/g, "");
  working = working.replace(/[????]/g, "");
  working = working
    .replace(/^RSVP:?\s*/i, "")
    .replace(/^hosted\s+by\s+/i, "")
    .replace(/^to\s+/i, "")
    .replace(/\s+at\s*$/i, "")
    .replace(/^[,;:. -]+|[,;:. -]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  working = working.replace(/^(?:for\s+)?questions?\??\s*/i, "").trim();
  const instructionStripped = working
    .replace(
      /^(?:please\s+)?(?:text|txt|call|contact|message|email)\b\s*(?:the\s+)?(?:host|organizer)?\s*(?:at|to)?\s*/i,
      "",
    )
    .trim();
  if (instructionStripped) {
    working = instructionStripped;
  }
  working = working.replace(/^(?:information|info|details)\s*[:.-]?\s*/i, "").trim();
  working = stripLeadingHostArticle(working);
  working = working.replace(/\s{2,}/g, " ").trim();
  working = working.replace(/^[,;:. -]+|[,;:. -]+$/g, "").trim();
  if (isGenericRsvpContactLabel(working)) return "";
  return working;
}
