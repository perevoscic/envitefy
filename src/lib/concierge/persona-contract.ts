import type { ConciergeEventDraft } from "./types.ts";

const trackedFields = [
  "title", "eventPurpose", "eventType", "honoreeName", "ageOrMilestone",
  "dateText", "timeText", "startISO", "endISO", "timezone", "venue", "location",
  "additionalLocations", "rsvpEnabled", "rsvpName", "rsvpContact", "rsvpDeadline",
  "numberOfGuests", "theme", "tone", "giftPreferenceNote", "giftNote",
  "registryLink", "giftRegistryLink", "previewCopy", "hostBrief", "requestedOutputs",
  "publicContent", "semanticKind",
] as const;

/** Intake computes in-memory state. Only explicit persistence operations may claim a save. */
export function buildPersonaTurnReceipt(draft: ConciergeEventDraft, previous?: ConciergeEventDraft | null) {
  const changedFields: string[] = previous
    ? trackedFields.filter(field => JSON.stringify(previous[field] ?? null) !== JSON.stringify(draft[field] ?? null))
      .map(field => field === "requestedOutputs" ? "selectedProducts" : field)
    : [];
  const headline = (value: ConciergeEventDraft) => value.titleConfirmed && value.title ? value.title : value.previewCopy.headline || value.title;
  const eventDate = (value: ConciergeEventDraft) => {
    if (!value.startISO || !Number.isFinite(Date.parse(value.startISO))) return value.dateText;
    try {
      return new Intl.DateTimeFormat("en-CA", { timeZone: value.timezone || "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value.startISO));
    } catch { return value.dateText; }
  };
  if (previous && headline(previous) !== headline(draft)) changedFields.push("displayHeadline");
  if (previous && eventDate(previous) !== eventDate(draft)) changedFields.push("eventDate");
  return {
    persistence: "in_memory" as const,
    hasPreviousDraft: Boolean(previous),
    changedFields,
    artworkCreatedByThisTurn: false,
    publicationPerformedByThisTurn: false,
  };
}

/** Reject mashed tokens the model sometimes streams, such as have4 or Whatdate. */
export function looksGarbledPersonaCopy(text: string, draft?: Pick<ConciergeEventDraft, "honoreeName"> | null): boolean {
  const stripped = text
    .replace(/\bhttps?:\/\/\S+/gi, " ")
    .replace(/\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, " ")
    .replace(/\b\d{1,2}:\d{2}\b/g, " ")
    .replace(/\b\d{1,2}\s*[ap]\.?m\.?\b/gi, " ")
    .replace(/\b\d{1,2}(?:st|nd|rd|th)\b/gi, " ");
  if (/[a-z]\d|\d[a-z]/.test(stripped)) return true;
  if (/([A-Za-z])\1{2,}/.test(stripped)) return true;
  if (/\bWhat(?!ever\b|sApp\b|['’]s\b)[a-z]{4,}\b/.test(text)) return true;
  const honoree = (draft?.honoreeName || "").replace(/[^\p{L}'’]/gu, "");
  if (honoree.length >= 3) {
    const escaped = honoree.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}[A-Za-z]{2,}\\b`, "i").test(text)) return true;
  }
  return false;
}

/** Guard complete sentences before emitting them, including words split over stream chunks. */
export function guardPersonaSentence(text: string, draft: ConciergeEventDraft, receipt: ReturnType<typeof buildPersonaTurnReceipt>): string {
  const trailing = text.match(/\s*$/)?.[0] || "";
  const replace = (value: string) => `${value}${trailing}`;
  if (looksGarbledPersonaCopy(text, draft)) return "";
  if (/\b(?:I(?:['’]ve| have)?|we(?:['’]ve| have)?)\s+(?:successfully\s+)?(?:saved|published|sent|generated)\b|\b(?:is|are|was|has been|have been|already)\s+(?:now\s+)?(?:saved|published)\b/i.test(text)) {
    return replace("Your progress is in this chat. Use Save progress to save it, or Publish when you are ready.");
  }
  if (receipt.hasPreviousDraft && receipt.changedFields.length === 0 &&
    /\bI(?:['’]ve| have)?\s+(?:updated|changed|corrected|fixed|added|removed|set)\b/i.test(text)) {
    return replace("The event details in this chat are unchanged.");
  }
  if (receipt.hasPreviousDraft && /\bI(?:['’]ve| have)?\s+(?:updated|changed|corrected|fixed|added|removed|set)\b/i.test(text)) {
    const fieldClaims = [
      { pattern: /\btitle\b/i, fields: ["title"] },
      { pattern: /\bheadline\b/i, fields: ["displayHeadline"] },
      { pattern: /\b(?:date|day)\b/i, fields: ["dateText", "eventDate"] },
      { pattern: /\b(?:time|clock|schedule)\b/i, fields: ["timeText", "startISO", "endISO", "additionalLocations"] },
      { pattern: /\b(?:venue|location|address|room)\b/i, fields: ["venue", "location", "additionalLocations"] },
      { pattern: /\b(?:format|output|product)\b/i, fields: ["selectedProducts"] },
    ];
    if (fieldClaims.some(({ pattern, fields }) => pattern.test(text) && !fields.some(field => receipt.changedFields.some(changed => changed === field)))) {
      return replace("That requested detail is unchanged in this chat.");
    }
  }
  if (draft.currentQuestion !== "date_confirmation" && draft.dateText &&
    /^\s*(?:what|which)\s+date\b[^?]*\?/i.test(text)) {
    return replace(`I have ${draft.dateText} in this chat.`);
  }
  if (draft.timeText && /^\s*(?:what|which)\s+(?:start\s+)?time\b[^?]*\?/i.test(text)) {
    return replace(`I have ${draft.timeText} in this chat.`);
  }
  if ((draft.venue || draft.location) && /^\s*(?:where\s+(?:will|should|is)|what(?:'s| is)\s+the\s+(?:venue|location))\b[^?]*\?/i.test(text)) {
    return replace(`I have ${[...new Set([draft.venue, draft.location].filter(Boolean))].join(", ")} in this chat.`);
  }
  return text;
}

/** A sentence buffer prevents a false completed-action claim appearing briefly in the UI. */
export function createPersonaSentenceStream(transform: (text: string) => string, emit: (text: string) => void) {
  let pending = "";
  const delivered: string[] = [];
  const flushText = (text: string) => {
    const safe = transform(text);
    if (safe) { delivered.push(safe); emit(safe); }
  };
  return {
    push(text: string) {
      pending += text;
      // Do not break inside an email, number, abbreviation, or unfinished token.
      const boundary = /[!?](?:\s+|$)|\.(?:\s+|$)|\n+/g;
      let end = 0;
      for (const match of pending.matchAll(boundary)) {
        const next = match.index + match[0].length;
        flushText(pending.slice(end, next));
        end = next;
      }
      if (end) pending = pending.slice(end);
    },
    finish() { if (pending) flushText(pending); pending = ""; return delivered.join(""); },
  };
}
