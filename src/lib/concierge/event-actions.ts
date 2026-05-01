import OpenAI from "openai";
import { invalidateUserDashboard } from "@/lib/dashboard-cache";
import { normalizeCanonicalStartFields } from "@/lib/dashboard-data";
import {
  type EventHistoryRow,
  getEventHistoryById,
  updateEventHistoryData,
  updateEventHistoryTitle,
} from "@/lib/db";
import { invalidateUserHistory } from "@/lib/history-cache";
import { buildEventAssetContent } from "./assets.ts";
import {
  createEventAsset,
  isEventAssetType,
  listEventAssets,
  updateEventAsset,
} from "./event-storage.ts";
import { isConciergeFastActionsEnabled, shouldSkipOpenAiForEventAction } from "./fast-paths.ts";
import { resolveConciergeOpenAiModel, runWithConciergeOpenAiTimeout } from "./openai-config.ts";
import type { ConciergeEventAction, EventAsset, EventAssetType } from "./types.ts";

type EventActionPlan = {
  actions: ConciergeEventAction[];
  assistantMessage: string;
  suggestedReplies: string[];
};

const ALLOWED_EVENT_PATCH_FIELDS = new Set([
  "title",
  "headlineTitle",
  "description",
  "startAt",
  "startISO",
  "start",
  "endAt",
  "endISO",
  "end",
  "timezone",
  "tz",
  "date",
  "dateText",
  "time",
  "timeText",
  "location",
  "venue",
  "address",
  "category",
  "status",
  "theme",
  "tone",
  "rsvpEnabled",
  "rsvpDeadline",
  "rsvpName",
  "rsvpEmail",
  "rsvpPhone",
  "rsvpUrl",
  "rsvp",
  "registries",
  "registryLinks",
  "numberOfGuests",
  "goodToKnow",
  "schedule",
  "hosts",
  "honoreeName",
  "birthdayName",
  "childName",
  "age",
  "outputs",
  "liveCard",
  "uploads",
]);

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed || null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function parseAiJson(content: string | null | undefined): unknown {
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function normalizeAssetType(value: unknown): EventAssetType | null {
  if (isEventAssetType(value)) return value;
  const text = cleanString(value)
    ?.toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (isEventAssetType(text)) return text;
  if (text === "story") return "instagram_story";
  if (text === "printable") return "printable_flyer";
  if (text === "reminder") return "reminder_message";
  return null;
}

function normalizePatch(value: unknown): Record<string, unknown> {
  const patch = asRecord(value);
  const out: Record<string, unknown> = {};
  for (const [key, inner] of Object.entries(patch)) {
    if (ALLOWED_EVENT_PATCH_FIELDS.has(key)) out[key] = inner;
  }
  return out;
}

function normalizeAssetPatch(value: unknown): {
  title?: string;
  status?: string;
  content?: Record<string, unknown>;
  design?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
} {
  const patch = asRecord(value);
  return {
    title: cleanString(patch.title) || undefined,
    status: cleanString(patch.status) || undefined,
    content: Object.keys(asRecord(patch.content)).length ? asRecord(patch.content) : undefined,
    design: Object.keys(asRecord(patch.design)).length ? asRecord(patch.design) : undefined,
    metadata: Object.keys(asRecord(patch.metadata)).length ? asRecord(patch.metadata) : undefined,
  };
}

function normalizeActions(value: unknown): ConciergeEventAction[] {
  const rawActions = Array.isArray(value)
    ? value
    : Array.isArray(asRecord(value).actions)
      ? (asRecord(value).actions as unknown[])
      : [];
  const actions: ConciergeEventAction[] = [];
  for (const raw of rawActions) {
    const action = asRecord(raw);
    const type = cleanString(action.type);
    if (type === "update_event") {
      const patch = normalizePatch(action.patch);
      if (Object.keys(patch).length) actions.push({ type, patch });
    } else if (type === "create_asset") {
      const assetType = normalizeAssetType(action.assetType ?? action.asset_type);
      if (assetType) {
        actions.push({
          type,
          assetType,
          brief: cleanString(action.brief) || `Create a ${assetType} for this event.`,
        });
      }
    } else if (type === "update_asset") {
      const assetId = cleanString(action.assetId ?? action.asset_id);
      const patch = asRecord(action.patch);
      if (assetId && Object.keys(patch).length) actions.push({ type, assetId, patch });
    } else if (type === "ask_question") {
      const question = cleanString(action.question);
      const suggestedReplies = Array.isArray(action.suggestedReplies)
        ? action.suggestedReplies.map(cleanString).filter((item): item is string => Boolean(item))
        : [];
      if (question) actions.push({ type, question, suggestedReplies });
    }
  }
  return actions.slice(0, 6);
}

function inferAssetTypeFromMessage(message: string): EventAssetType | null {
  if (/whats\s*app|sms|text message/i.test(message)) return "whatsapp";
  if (/instagram|story|stories/i.test(message)) return "instagram_story";
  if (/print|flyer|5x7/i.test(message)) return "printable_flyer";
  if (/remind|reminder/i.test(message)) return "reminder_message";
  if (/thank/i.test(message)) return "thank_you_card";
  if (/\bmenu\b/i.test(message)) return "menu";
  if (/welcome sign|signage/i.test(message)) return "welcome_sign";
  if (/rsvp/i.test(message)) return "rsvp_page";
  if (/invite|invitation|card/i.test(message)) return "invitation";
  return null;
}

function compactString(value: unknown): string | null {
  const text = cleanString(value);
  if (!text) return null;
  return text.length > 220 ? `${text.slice(0, 217)}...` : text;
}

function firstCompactString(...values: unknown[]): string | null {
  for (const value of values) {
    const text = compactString(value);
    if (text) return text;
  }
  return null;
}

function hasPatchField(patch: Record<string, unknown>, fields: string[]) {
  return fields.some((field) => Object.hasOwn(patch, field));
}

function uniqueDisplayLine(...values: unknown[]) {
  const parts = values.map(cleanString).filter((value): value is string => Boolean(value));
  return parts.filter((value, index) => parts.indexOf(value) === index).join(", ") || null;
}

function scheduleLineFromData(data: Record<string, unknown>) {
  return (
    firstCompactString(data.whenLabel, data.scheduleLine) ||
    uniqueDisplayLine(data.dateText ?? data.date, data.timeText ?? data.time)
  );
}

function locationLineFromData(data: Record<string, unknown>) {
  return (
    firstCompactString(data.locationLabel) ||
    uniqueDisplayLine(data.venue ?? data.placeName, data.location ?? data.address) ||
    firstCompactString(data.location, data.venue, data.placeName)
  );
}

function syncLiveCardCopyFromPatch(
  data: Record<string, unknown>,
  patch: Record<string, unknown>,
) {
  const liveCard = { ...asRecord(data.liveCard) };
  const publicEvent = { ...asRecord(data.publicEvent) };
  const previewCopy = { ...asRecord(data.previewCopy) };

  const assignCopyField = (field: string, value: unknown) => {
    const text = cleanString(value);
    if (!text) return;
    liveCard[field] = text;
    publicEvent[field] = text;
    previewCopy[field] = text;
  };

  if (hasPatchField(patch, ["title", "headlineTitle"])) {
    assignCopyField("headline", firstCompactString(data.headlineTitle, data.title));
  }
  if (hasPatchField(patch, ["description"])) {
    assignCopyField("body", data.description);
  }
  if (hasPatchField(patch, ["theme"])) {
    const theme = cleanString(data.theme);
    assignCopyField("subheadline", theme ? `${theme} theme` : null);
  }
  if (hasPatchField(patch, ["date", "dateText", "time", "timeText", "whenLabel", "scheduleLine"])) {
    assignCopyField("scheduleLine", scheduleLineFromData(data));
  }
  if (hasPatchField(patch, ["location", "venue", "address", "locationLabel", "placeName"])) {
    assignCopyField("locationLine", locationLineFromData(data));
  }

  data.liveCard = liveCard;
  data.publicEvent = publicEvent;
  data.previewCopy = previewCopy;
}

function compactArray(value: unknown, limit = 5): unknown[] | null {
  if (!Array.isArray(value)) return null;
  return value.slice(0, limit).map((item) => {
    if (typeof item === "string") return compactString(item);
    if (!item || typeof item !== "object" || Array.isArray(item)) return item;
    const record = item as Record<string, unknown>;
    return {
      title: firstCompactString(record.title, record.name, record.label),
      url: firstCompactString(record.url, record.href, record.link),
    };
  });
}

function compactLiveCardCopy(data: Record<string, unknown>): Record<string, unknown> {
  const liveCard = asRecord(data.liveCard);
  const copy = asRecord(liveCard.copy);
  const previewCopy = asRecord(data.previewCopy);
  return {
    headline: firstCompactString(
      liveCard.headline,
      copy.headline,
      previewCopy.headline,
      data.headlineTitle,
      data.title,
    ),
    subheadline: firstCompactString(
      liveCard.subheadline,
      copy.subheadline,
      previewCopy.subheadline,
      data.description,
    ),
    body: firstCompactString(liveCard.body, copy.body, previewCopy.body, data.description),
    scheduleLine: firstCompactString(
      liveCard.scheduleLine,
      copy.scheduleLine,
      previewCopy.scheduleLine,
      data.dateText,
      data.timeText,
    ),
    locationLine: firstCompactString(
      liveCard.locationLine,
      copy.locationLine,
      previewCopy.locationLine,
      data.location,
      data.venue,
    ),
    cta: firstCompactString(liveCard.cta, copy.cta, previewCopy.cta),
  };
}

function buildCompactEventContext(event: EventHistoryRow): Record<string, unknown> {
  const data = asRecord(event.data);
  const rsvp = asRecord(data.rsvp);
  const guestList = Array.isArray(data.guests) ? data.guests : null;
  return {
    id: event.id,
    title: firstCompactString(data.title, data.headlineTitle, event.title),
    schedule: {
      startAt: firstCompactString(data.startAt, data.startISO, data.start),
      endAt: firstCompactString(data.endAt, data.endISO, data.end),
      date: firstCompactString(data.date, data.dateText),
      time: firstCompactString(data.time, data.timeText),
      timezone: firstCompactString(data.timezone, data.tz),
      schedule: compactArray(data.schedule, 4),
    },
    location: {
      venue: firstCompactString(data.venue, data.placeName),
      location: firstCompactString(data.location),
      address: firstCompactString(data.address, data.addressLine),
    },
    category: firstCompactString(data.category, data.eventType),
    status: firstCompactString(data.status, data.draftStatus),
    theme: firstCompactString(data.theme, data.themeId),
    tone: firstCompactString(data.tone, data.style),
    rsvp: {
      enabled: data.rsvpEnabled ?? rsvp.isEnabled ?? rsvp.enabled ?? null,
      deadline: firstCompactString(data.rsvpDeadline, rsvp.deadline),
      name: firstCompactString(data.rsvpName, rsvp.name),
      email: firstCompactString(data.rsvpEmail, rsvp.email),
      phone: firstCompactString(data.rsvpPhone, rsvp.phone),
      url: firstCompactString(data.rsvpUrl, rsvp.url),
    },
    registry: {
      links: compactArray(data.registryLinks ?? data.registries, 5),
      url: firstCompactString(data.registryUrl, data.registryLink),
      note: firstCompactString(data.registryNote),
    },
    guestCount:
      data.numberOfGuests ??
      data.guestCount ??
      data.inviteCount ??
      (guestList ? guestList.length : null),
    liveCardCopy: compactLiveCardCopy(data),
  };
}

function fallbackPlan(message: string): EventActionPlan {
  const actions: ConciergeEventAction[] = [];
  const assetType = inferAssetTypeFromMessage(message);
  const rsvpDeadline = message.match(/\b(?:rsvp|respond)\s+by\s+([^.,;]+)/i)?.[1]?.trim();
  if (rsvpDeadline) {
    actions.push({
      type: "update_event",
      patch: {
        rsvpEnabled: true,
        rsvpDeadline,
        rsvp: { isEnabled: true, deadline: rsvpDeadline },
      },
    });
  }
  if (assetType) {
    actions.push({ type: "create_asset", assetType, brief: message });
  }
  if (
    !actions.length &&
    /\belegant|luxury|fun|playful|kids|formal|casual|modern|rustic|floral|tone|style|theme\b/i.test(
      message,
    )
  ) {
    actions.push({
      type: "update_event",
      patch: {
        tone: cleanString(message) || "updated",
        liveCard: { editInstruction: message },
      },
    });
  }
  if (!actions.length) {
    actions.push({
      type: "ask_question",
      question: "What should I change or create for this event?",
      suggestedReplies: ["Create a WhatsApp version", "Add RSVP details", "Make it more elegant"],
    });
  }
  return {
    actions,
    assistantMessage:
      actions[0]?.type === "ask_question" ? actions[0].question : "I updated this event workspace.",
    suggestedReplies: actions[0]?.type === "ask_question" ? actions[0].suggestedReplies : [],
  };
}

async function planWithOpenAi(params: {
  message: string;
  event: EventHistoryRow;
  assets: EventAsset[];
  history: Array<{ role: string; content: string }>;
}): Promise<EventActionPlan | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const client = new OpenAI({ apiKey });
  const response = await runWithConciergeOpenAiTimeout((signal) =>
    client.chat.completions.create(
      {
        model: resolveConciergeOpenAiModel(),
        temperature: 0.1,
        response_format: { type: "json_object" },
        max_completion_tokens: 650,
        messages: [
          {
            role: "system",
            content: [
              "You are Envitefy's event-scoped assistant.",
              "Messages apply only to the provided event.",
              "Return JSON with actions, assistantMessage, and suggestedReplies.",
              "Allowed action types: update_event, create_asset, update_asset, ask_question.",
              "Never choose or accept user_id. Never modify ownership.",
              "Only patch event fields relevant to event details, RSVP, copy, status, and design tone.",
            ].join(" "),
          },
          {
            role: "user",
            content: JSON.stringify({
              message: params.message,
              event: buildCompactEventContext(params.event),
              assets: params.assets.map((asset) => ({
                id: asset.id,
                assetType: asset.asset_type,
                title: asset.title,
                status: asset.status,
              })),
              recentMessages: params.history.slice(-6),
            }),
          },
        ],
      } as any,
      { signal } as any,
    ),
  );
  const parsed = asRecord(parseAiJson(response.choices?.[0]?.message?.content));
  const actions = normalizeActions(parsed.actions);
  if (!actions.length) return null;
  return {
    actions,
    assistantMessage: cleanString(parsed.assistantMessage) || "I updated this event workspace.",
    suggestedReplies: Array.isArray(parsed.suggestedReplies)
      ? parsed.suggestedReplies.map(cleanString).filter((item): item is string => Boolean(item))
      : [],
  };
}

export async function buildEventActionPlan(params: {
  message: string;
  event: EventHistoryRow;
  assets: EventAsset[];
  history: Array<{ role: string; content: string }>;
}): Promise<EventActionPlan> {
  if (isConciergeFastActionsEnabled() && shouldSkipOpenAiForEventAction(params.message)) {
    return fallbackPlan(params.message);
  }
  try {
    const aiPlan = await planWithOpenAi(params);
    if (aiPlan) return aiPlan;
  } catch {
    // Deterministic fallback keeps the workspace useful without model access.
  }
  return fallbackPlan(params.message);
}

export async function applyEventActions(params: {
  userId: string;
  eventId: string;
  event: EventHistoryRow;
  actions: ConciergeEventAction[];
}): Promise<{
  event: EventHistoryRow;
  assets: EventAsset[];
  appliedActions: ConciergeEventAction[];
}> {
  let event = params.event;
  const appliedActions: ConciergeEventAction[] = [];

  for (const action of params.actions) {
    if (action.type === "update_event") {
      const patch = normalizePatch(action.patch);
      if (!Object.keys(patch).length) continue;
      const nextData = { ...asRecord(event.data), ...patch };
      normalizeCanonicalStartFields(nextData);
      syncLiveCardCopyFromPatch(nextData, patch);
      const updated = await updateEventHistoryData(params.eventId, nextData);
      if (updated) {
        event = updated;
        appliedActions.push({ type: "update_event", patch });
        const title = cleanString(patch.title);
        if (title && title !== event.title) {
          const titleUpdated = await updateEventHistoryTitle(params.eventId, title);
          if (titleUpdated) event = titleUpdated;
        }
      }
    } else if (action.type === "create_asset") {
      const generated = buildEventAssetContent({
        eventId: params.eventId,
        eventTitle: event.title,
        eventData: asRecord(event.data),
        assetType: action.assetType,
        brief: action.brief,
      });
      await createEventAsset({
        userId: params.userId,
        eventId: params.eventId,
        assetType: action.assetType,
        title: generated.title,
        content: generated.content,
        design: generated.design,
        metadata: generated.metadata,
      });
      if (action.assetType === "rsvp_page") {
        const nextData = {
          ...asRecord(event.data),
          rsvpEnabled: true,
          rsvp: {
            ...asRecord(asRecord(event.data).rsvp),
            isEnabled: true,
          },
        };
        const updated = await updateEventHistoryData(params.eventId, nextData);
        if (updated) event = updated;
      }
      appliedActions.push(action);
    } else if (action.type === "update_asset") {
      const updated = await updateEventAsset({
        userId: params.userId,
        eventId: params.eventId,
        assetId: action.assetId,
        patch: normalizeAssetPatch(action.patch),
      });
      if (updated) appliedActions.push(action);
    } else if (action.type === "ask_question") {
      appliedActions.push(action);
    }
  }

  if (appliedActions.some((action) => action.type !== "ask_question")) {
    invalidateUserHistory(params.userId);
    invalidateUserDashboard(params.userId);
  }

  const freshEvent = (await getEventHistoryById(params.eventId)) || event;
  const assets = await listEventAssets(params.eventId, params.userId);
  return { event: freshEvent, assets, appliedActions };
}
