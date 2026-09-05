import {
  isRecord,
  matchesSchema,
  nullableString,
  strictObject,
} from "../creation/source-evidence.ts";
import type { ConciergeMessageRequest } from "./types.ts";

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
      source: { type: "string", enum: ["latest_user_message", "source_text"] },
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
  "You extract event facts and propose field edits for Envitefy. Return the strict schema with edits and optional previewCopy. Each edit is set or clear and cites an exact span of the latest user message or supplied source transcript.",
  "Only change fields explicitly supplied or corrected now; preserve all unrelated facts. clear requires an explicit retraction in the latest user message and value null. Never clear from an upload. A source upload fills missing facts; it never overwrites a host correction. Conflicting source evidence stays unresolved. Do not choose between conflicting dates or infer age from decorative size alone.",
  "Date interpretation, readiness, questions, permissions, ownership, source intent, requested products, hostBrief planning memory and publishing belong to application code. Do not return or edit them. startISO/endISO may only be set from an explicitly supplied ISO timestamp; use dateText/timeText for natural language dates so code can resolve them. timezone only when explicitly supplied.",
  "Resolve short replies using the current question and references using the provided active context. Preserve joint honorees and exact confirmed titles. Return each field once. Keep additionalLocations as the full updated list when explicitly changed, including every ceremony/reception/after-party location. Questions, examples, assistant suggestions, sidebar complaints and negated formats are not new event facts.",
  "PRIVATE_DIRECTION (theme/tone) is separate from public event facts. Never leak prompts, budgets, workload, access codes or private contact details into guest copy. Respect hostBrief privacy preferences and requested languages. Do not add features or actions the app has not performed.",
  "When explicitly asked to write/translate/revise wording, return actual polished previewCopy now in every requested language; keep missing logistics empty and preserve approved wording on unrelated edits. Otherwise previewCopy is null. Never invent guest facts, contact instructions, venue brands or gift preferences. If online RSVP is off, preserve only explicitly requested manual replies.",
].join("\n");

export function parseConciergeEdits(value: unknown, request: ConciergeMessageRequest) {
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
  for (const edit of value.edits) {
    if (!isRecord(edit) || typeof edit.field !== "string" || typeof edit.sourceText !== "string")
      continue;
    const field = edit.field;
    if (seen.has(field)) return null;
    seen.add(field);
    const source = edit.source === "latest_user_message" ? request.message || "" : transcript;
    if (!edit.sourceText.trim() || !source.includes(edit.sourceText)) continue;
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
