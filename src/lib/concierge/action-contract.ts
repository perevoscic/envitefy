import {
  isRecord,
  matchesSchema,
  nullableString,
  strictObject,
  stringList,
} from "../creation/source-evidence.ts";
import { validCalendarDate } from "./readiness.ts";
import type { ConciergeEventAction, EventAsset, EventAssetType } from "./types.ts";

const stringFields = [
  "title",
  "headlineTitle",
  "description",
  "startISO",
  "endISO",
  "timezone",
  "dateText",
  "timeText",
  "location",
  "venue",
  "address",
  "category",
  "theme",
  "tone",
  "rsvpDeadline",
  "rsvpName",
  "rsvpEmail",
  "rsvpPhone",
  "rsvpUrl",
  "goodToKnow",
  "honoreeName",
  "birthdayName",
  "childName",
  "age",
];
const assetTypes: EventAssetType[] = [
  "event_page",
  "live_card",
  "signup_form",
  "invitation",
  "rsvp_page",
  "whatsapp",
  "instagram_story",
  "printable_flyer",
  "reminder_message",
  "thank_you_card",
  "menu",
  "welcome_sign",
];
const editSchema = strictObject({
  field: {
    type: "string",
    enum: [...stringFields, "rsvpEnabled", "numberOfGuests", "registryLinks"],
  },
  operation: { type: "string", enum: ["set", "clear"] },
  value: {
    anyOf: [
      nullableString,
      { type: "boolean" },
      { type: "number" },
      {
        type: "array",
        items: strictObject({ label: { type: "string" }, url: { type: "string" } }),
      },
    ],
  },
  sourceText: { type: "string" },
});
export const EVENT_ACTION_SCHEMA = strictObject({
  actions: {
    type: "array",
    items: {
      anyOf: [
        strictObject({
          type: { type: "string", enum: ["update_event"] },
          edits: { type: "array", items: editSchema },
        }),
        strictObject({
          type: { type: "string", enum: ["create_asset"] },
          assetType: { type: "string", enum: assetTypes },
          brief: { type: "string" },
          sourceText: { type: "string" },
        }),
        strictObject({
          type: { type: "string", enum: ["update_asset"] },
          assetId: { type: "string" },
          title: nullableString,
          body: nullableString,
          sourceText: { type: "string" },
        }),
        strictObject({
          type: { type: "string", enum: ["ask_question"] },
          question: { type: "string" },
          suggestedReplies: stringList,
        }),
      ],
    },
  },
  assistantMessage: { type: "string" },
  suggestedReplies: stringList,
});

export function parseEventActionContract(
  value: unknown,
  message: string,
  assets: EventAsset[],
): ConciergeEventAction[] {
  if (
    !matchesSchema(value, EVENT_ACTION_SCHEMA) ||
    !isRecord(value) ||
    !Array.isArray(value.actions)
  )
    return [];
  const actions: ConciergeEventAction[] = [];
  for (const action of value.actions) {
    if (!isRecord(action)) continue;
    const supported =
      typeof action.sourceText === "string" &&
      Boolean(action.sourceText.trim()) &&
      message.includes(action.sourceText);
    if (action.type === "update_event" && Array.isArray(action.edits)) {
      const patch: Record<string, unknown> = {};
      for (const edit of action.edits) {
        if (
          !isRecord(edit) ||
          typeof edit.field !== "string" ||
          typeof edit.sourceText !== "string" ||
          !edit.sourceText.trim() ||
          !message.includes(edit.sourceText)
        )
          continue;
        const field = edit.field;
        if (Object.hasOwn(patch, field)) return [];
        if (edit.operation === "clear") {
          if (edit.value !== null || ["title", "timezone", "category"].includes(field)) continue;
          patch[field] = field === "registryLinks" ? [] : null;
        } else {
          if (stringFields.includes(field) && typeof edit.value !== "string") continue;
          if (field === "rsvpEnabled" && typeof edit.value !== "boolean") continue;
          if (
            field === "numberOfGuests" &&
            (typeof edit.value !== "number" || !Number.isInteger(edit.value) || edit.value < 1)
          )
            continue;
          if (field === "registryLinks" && !Array.isArray(edit.value)) continue;
          if (
            ["startISO", "endISO"].includes(field) &&
            (typeof edit.value !== "string" ||
              !validCalendarDate(edit.value) ||
              !message.includes(edit.value))
          )
            continue;
          if (field === "timezone") {
            try {
              new Intl.DateTimeFormat("en", { timeZone: String(edit.value) });
            } catch {
              continue;
            }
          }
          patch[field] = edit.value;
        }
      }
      if (Object.keys(patch).length) actions.push({ type: "update_event", patch });
    } else if (
      action.type === "create_asset" &&
      supported &&
      assetTypes.includes(action.assetType as EventAssetType) &&
      typeof action.brief === "string"
    ) {
      actions.push({
        type: "create_asset",
        assetType: action.assetType as EventAssetType,
        brief: action.brief,
      });
    } else if (action.type === "update_asset" && supported && typeof action.assetId === "string") {
      const asset = assets.find((item) => item.id === action.assetId);
      if (!asset) continue;
      const patch = {
        ...(typeof action.title === "string" ? { title: action.title } : {}),
        ...(typeof action.body === "string"
          ? { content: { ...asset.content, body: action.body } }
          : {}),
      };
      if (Object.keys(patch).length)
        actions.push({ type: "update_asset", assetId: asset.id, patch });
    } else if (
      action.type === "ask_question" &&
      typeof action.question === "string" &&
      Array.isArray(action.suggestedReplies)
    ) {
      actions.push({
        type: "ask_question",
        question: action.question,
        suggestedReplies: action.suggestedReplies.filter(
          (item): item is string => typeof item === "string",
        ),
      });
    }
  }
  return actions.slice(0, 6);
}
