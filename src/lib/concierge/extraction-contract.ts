import {
  isRecord,
  matchesSchema,
  nullableString,
  strictObject,
} from "../creation/source-evidence.ts";
import type { ConciergeEventDraft, ConciergeMessageRequest } from "./types.ts";

const STRING_FIELDS = [
  "title",
  "eventPurpose",
  "eventType",
  "dateText",
  "timeText",
  "startISO",
  "endISO",
  "timezone",
  "location",
  "venue",
  "honoreeName",
  "ageOrMilestone",
  "rsvpDeadline",
  "rsvpName",
  "rsvpContact",
  "registryLink",
  "giftNote",
  "giftPreferenceNote",
  "theme",
  "tone",
];
const BOOLEAN_FIELDS = ["rsvpEnabled", "ageOrMilestoneSkipped", "giftPromptDismissed"];
const EDIT_FIELDS = [...STRING_FIELDS, ...BOOLEAN_FIELDS, "numberOfGuests", "additionalLocations"];
// Recover stable intake facts; historical relative dates need their original time reference.
const HISTORY_RECOVERABLE_FIELDS = new Set([
  "location", "venue", "honoreeName", "ageOrMilestone", "theme", "tone",
]);
const locationSchema = strictObject(
  Object.fromEntries(
    ["label", "venue", "location", "address", "timeText", "description", "mapQuery"].map((key) => [
      key,
      nullableString,
    ]),
  ),
);
export const CONCIERGE_EXTRACTION_SCHEMA = strictObject({
  edits: {
    type: "array",
    items: strictObject({
      field: { type: "string", enum: EDIT_FIELDS },
      operation: { type: "string", enum: ["set", "clear"] },
      value: {
        anyOf: [
          nullableString,
          { type: "boolean" },
          { type: "number" },
          { type: "array", items: locationSchema },
        ],
      },
      source: {
        type: "string",
        enum: ["latest_user_message", "source_text", "conversation_user_message"],
      },
      sourceText: { type: "string" },
    }),
  },
  previewCopy: {
    anyOf: [
      { type: "null" },
      strictObject(
        Object.fromEntries(
          ["headline", "subheadline", "body", "scheduleLine", "locationLine", "cta"].map((key) => [
            key,
            { type: "string" },
          ]),
        ),
      ),
    ],
  },
});

export const CONCIERGE_EXTRACTION_INSTRUCTION = [
  "You extract event facts and propose field edits for Envitefy. Return the strict schema with edits and optional previewCopy. Each edit is set or clear and cites an exact span of the latest user message, supplied source transcript, or an earlier USER message in recentConversation.",
  "Capture EVERY supplied fact immediately on the turn it arrives. The current question is only context for short replies, never a filter on which fields to extract. Prefill all supplied names, age, date, time, venue, theme, RSVP and gift details before application code chooses its next question; never defer a supplied fact until its question comes up. This includes fragments without labels or prepositions. For example, 'Maya, 8, maple plaza cinema, space adventure movie theme' supplies honoreeName=Maya, ageOrMilestone=8, location and venue=maple plaza cinema, and theme=space adventure movie theme. A named venue satisfies location; do not require a street address or invent one. Persist these as field edits, not only in invitation wording or a conversational acknowledgement.",
  "Change fields explicitly supplied or corrected now; preserve all unrelated saved facts. Before leaving honoreeName, ageOrMilestone, location, venue, theme or tone missing, review recentConversation for an earlier explicit user answer that extraction missed. Use source=conversation_user_message only for these missing fields in fallbackDraft, citing that user's exact words. Never use assistant messages as evidence, overwrite a current value, restore explicitlyClearedFields, or revive a fact superseded or retracted in a later user message. Latest user corrections take priority over older context. Do not carry facts between different events or reinterpret old relative dates against today's date.",
  "clear requires an explicit retraction in the latest user message and value null. Never clear from history or an upload. A source upload fills missing facts; it never overwrites a host correction. Conflicting source evidence stays unresolved. Do not choose between conflicting dates or infer age from decorative size alone.",
  "Date interpretation, readiness, questions, permissions, ownership, source intent, requested products, hostBrief planning memory and publishing belong to application code. Do not return or edit them. startISO/endISO may only be set from an explicitly supplied ISO timestamp; use dateText/timeText for natural language dates so code can resolve them. timezone only when explicitly supplied.",
  "Resolve short replies using the current question and references using the provided active context. Preserve joint honorees and exact confirmed titles. Return each field once. Keep additionalLocations as the full updated list when explicitly changed, including every ceremony/reception/after-party location. Questions, examples, assistant suggestions, sidebar complaints and negated formats are not new event facts.",
  "PRIVATE_DIRECTION (theme/tone) is separate from public event facts. Never leak prompts, budgets, workload, access codes or private contact details into guest copy. Respect hostBrief privacy preferences and requested languages. Do not add features or actions the app has not performed.",
  "When explicitly asked to write/translate/revise wording, return actual polished previewCopy now in every requested language; keep missing logistics empty and preserve approved wording on unrelated edits. Otherwise previewCopy is null. Never invent guest facts, contact instructions, venue brands or gift preferences. If online RSVP is off, preserve only explicitly requested manual replies.",
].join("\n");

export function conciergeExtractionConversation(
  request: ConciergeMessageRequest,
  currentDraft: ConciergeEventDraft | null | undefined = request.draft,
) {
  if (!request.draft || request.draft.creationSessionId !== currentDraft?.creationSessionId) return [];
  const conversation = (request.chatMessages || [])
    .filter((item) => item.role === "user" || item.role === "assistant")
    .map((item) => ({ role: item.role, text: item.text.slice(0, 2000) }));
  const startMessage = currentDraft.contextStartMessage;
  const startIndex = startMessage
    ? conversation.findLastIndex((item) => item.role === "user" && item.text === startMessage)
    : 0;
  return startIndex < 0 ? [] : conversation.slice(startIndex).slice(-24);
}

function hasSavedValue(value: ConciergeEventDraft[keyof ConciergeEventDraft]) {
  return value != null && value !== "" && (!Array.isArray(value) || value.length > 0);
}

export function parseConciergeEdits(
  value: unknown,
  request: ConciergeMessageRequest,
  currentDraft: ConciergeEventDraft | null | undefined = request.draft,
) {
  if (
    !matchesSchema(value, CONCIERGE_EXTRACTION_SCHEMA) ||
    !isRecord(value) ||
    !Array.isArray(value.edits)
  )
    return null;
  const patch: Record<string, unknown> = {};
  const cleared: string[] = [];
  const accepted: string[] = [];
  const transcript =
    request.ocrContext?.sourceEvidence?.sourceText || request.ocrContext?.ocrText || "";
  const seen = new Set<string>();
  const conversation = conciergeExtractionConversation(request, currentDraft);
  for (const edit of value.edits) {
    if (!isRecord(edit) || typeof edit.field !== "string" || typeof edit.sourceText !== "string")
      continue;
    const field = edit.field;
    const sourceText = edit.sourceText;
    if (seen.has(field)) return null;
    seen.add(field);
    const fromHistory = edit.source === "conversation_user_message";
    const source = edit.source === "latest_user_message"
      ? request.message || ""
      : fromHistory
        ? conversation.findLast((item) => item.role === "user" && item.text.includes(sourceText))?.text || ""
        : transcript;
    if (!edit.sourceText.trim() || !source.includes(edit.sourceText)) continue;
    if (fromHistory) {
      const relatedFields = field === "location" || field === "venue" ? ["location", "venue"] : [field];
      if (
        edit.operation !== "set" || !HISTORY_RECOVERABLE_FIELDS.has(field) ||
        relatedFields.some((key) =>
          hasSavedValue(currentDraft?.[key as keyof ConciergeEventDraft]) ||
          hasSavedValue(request.draft?.[key as keyof ConciergeEventDraft]) ||
          currentDraft?.explicitlyClearedFields?.includes(key) ||
          request.draft?.explicitlyClearedFields?.includes(key)
        )
      ) continue;
    }
    const priorValue = request.draft?.[field as keyof NonNullable<typeof request.draft>];
    if (
      edit.source === "source_text" &&
      priorValue != null &&
      priorValue !== "" &&
      (!Array.isArray(priorValue) || priorValue.length > 0)
    )
      continue;
    if (edit.operation === "clear") {
      if (
        edit.source !== "latest_user_message" ||
        edit.value !== null ||
        field === "eventType" ||
        field === "timezone"
      )
        continue;
      patch[field] = field === "additionalLocations" ? [] : null;
      cleared.push(field);
    } else {
      if (STRING_FIELDS.includes(field) && (typeof edit.value !== "string" || !edit.value.trim()))
        continue;
      if (BOOLEAN_FIELDS.includes(field) && typeof edit.value !== "boolean") continue;
      if (
        field === "numberOfGuests" &&
        (typeof edit.value !== "number" || !Number.isInteger(edit.value) || edit.value <= 0)
      )
        continue;
      if (field === "additionalLocations" && !Array.isArray(edit.value)) continue;
      if (
        ["startISO", "endISO", "timezone"].includes(field) &&
        (typeof edit.value !== "string" || !source.includes(edit.value))
      )
        continue;
      patch[field] = edit.value;
    }
    accepted.push(field);
  }
  if (isRecord(value.previewCopy)) patch.previewCopy = value.previewCopy;
  return { patch, cleared, accepted };
}
