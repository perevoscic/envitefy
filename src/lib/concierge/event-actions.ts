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
import {
  openAiChatTemperatureParam,
  resolveConciergeOpenAiPlannerModel,
  runWithConciergeOpenAiTimeout,
} from "./openai-config.ts";
import { sanitizeConciergePublicEventData } from "./public-copy.ts";
import type {
  ConciergeEventAction,
  ConciergeWeatherContext,
  EventAsset,
  EventAssetType,
} from "./types.ts";
import { shouldResolveConciergeWeatherContext } from "./weather-context.ts";

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

const PREMIUM_PLANNING_HINT =
  /\b(complex|messy|validate|missing fields?|final copy|polished|premium|multi[-\s]?section|multi[-\s]?day|full live[-\s]?card|gymnastics|meet schedule|packet|flyer|uploaded|ocr)\b/i;

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
  if (/event\s+page/i.test(message)) return "event_page";
  if (/sign[-\s]?up|signup/i.test(message)) return "signup_form";
  if (/whats\s*app|sms|text message/i.test(message)) return "whatsapp";
  if (/instagram|story|stories/i.test(message)) return "instagram_story";
  if (/print|flyer|5x7/i.test(message)) return "printable_flyer";
  if (/remind|reminder/i.test(message)) return "reminder_message";
  if (/thank/i.test(message)) return "thank_you_card";
  if (/\bmenu\b/i.test(message)) return "menu";
  if (/welcome sign|signage/i.test(message)) return "welcome_sign";
  if (/rsvp/i.test(message)) return "rsvp_page";
  if (/invite|invitation/i.test(message)) return "printable_flyer";
  if (/card/i.test(message)) return "live_card";
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

function isSecretLikeEventRequest(message: string): boolean {
  return (
    /\b(api[_\s-]?key|secret|token|password|private key|credential)\b/i.test(message) ||
    /\b(?:sk|pk)_(?:live|test)[A-Za-z0-9_-]*/.test(message) ||
    /\bsk-[A-Za-z0-9_-]{6,}/.test(message)
  );
}

function isUnsafeGuestDataEventRequest(message: string): boolean {
  return (
    /\b(scrap(?:e|ing)|harvest|export|dump|download|steal|collect)\b[\s\S]{0,80}\b(private|rsvp|guest|email|phone|contact)/i.test(
      message,
    ) ||
    /\b(delete|remove|wipe|clear)\b[\s\S]{0,80}\b(guest list|guests?|rsvps?|responses?)\b/i.test(
      message,
    ) ||
    /\bmark\b[\s\S]{0,80}\b(everyone|all guests?|all rsvps?)\b[\s\S]{0,80}\b(yes|no|maybe|attending|declined)\b/i.test(
      message,
    )
  );
}

function isOffDomainEventAssistantRequest(message: string): boolean {
  if (shouldResolveConciergeWeatherContext(message)) return false;
  if (inferAssetTypeFromMessage(message)) return false;
  if (/\b(?:rsvp|respond)\s+by\s+[^.,;]+/i.test(message)) return false;
  if (
    /\b(?:make|set|change|update|use|switch|go|more|less)\b[\s\S]{0,80}\b(?:elegant|luxury|fun|playful|kids|formal|casual|modern|rustic|floral|tone|style|theme)\b/i.test(
      message,
    )
  ) {
    return false;
  }
  const asksForGeneralHelp =
    /^(?:can|could|would|will)\s+you\s+(?:help|fix|write|explain|tell|make|create)\b/i.test(
      message,
    ) ||
    /^(?:tell|write|explain|show)\s+me\b/i.test(message) ||
    /^(?:what|why|how)\b/i.test(message) ||
    /\bhelp\s+me\b/i.test(message);
  if (!asksForGeneralHelp && !/[?]$/.test(message.trim())) return false;
  return /\b(?:jokes?|toasts?|speeches?|vows?|recipe|homework|essay|resume|tax(?:es)?|spreadsheet|printer|wifi|wi-fi|router|computer|laptop|phone|code|bug|debug|script|database)\b/i.test(
    message,
  );
}

function guardedEventAssistantPlan(message: string): EventActionPlan | null {
  if (isSecretLikeEventRequest(message)) {
    return {
      actions: [
        {
          type: "ask_question",
          question:
            "Do not put API keys, passwords, or secrets in an invite. I can help add a public RSVP link, host contact, or guest-facing note instead.",
          suggestedReplies: ["Add RSVP link", "Add host contact", "Add guest note"],
        },
      ],
      assistantMessage:
        "Do not put API keys, passwords, or secrets in an invite. I can help add a public RSVP link, host contact, or guest-facing note instead.",
      suggestedReplies: ["Add RSVP link", "Add host contact", "Add guest note"],
    };
  }
  if (isUnsafeGuestDataEventRequest(message)) {
    return {
      actions: [
        {
          type: "ask_question",
          question:
            "I can't help scrape private RSVP data or bulk-change guest responses. I can help edit invitation copy, RSVP settings, or guest-facing details.",
          suggestedReplies: ["Edit RSVP settings", "Update invite copy", "Create a reminder"],
        },
      ],
      assistantMessage:
        "I can't help scrape private RSVP data or bulk-change guest responses. I can help edit invitation copy, RSVP settings, or guest-facing details.",
      suggestedReplies: ["Edit RSVP settings", "Update invite copy", "Create a reminder"],
    };
  }
  if (isOffDomainEventAssistantRequest(message)) {
    const question =
      "I can help edit this event, RSVP settings, guest-facing copy, assets, or weather planning. What should I change for this event?";
    const suggestedReplies = ["Update invite copy", "Add RSVP details", "Create an event asset"];
    return {
      actions: [
        {
          type: "ask_question",
          question,
          suggestedReplies,
        },
      ],
      assistantMessage: question,
      suggestedReplies,
    };
  }
  return null;
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

function syncLiveCardCopyFromPatch(data: Record<string, unknown>, patch: Record<string, unknown>) {
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

function buildWeatherPlan(
  weatherContext: ConciergeWeatherContext | null | undefined,
): EventActionPlan {
  const message =
    weatherContext?.message ||
    "I can help with a weather plan once the event has a date, time, and location.";
  return {
    actions: [
      {
        type: "ask_question",
        question: `${message}\nWould you like me to add a simple rain or indoor backup note to the event?`,
        suggestedReplies: ["Add a rain plan", "Add indoor backup note", "Leave it off"],
      },
    ],
    assistantMessage: message,
    suggestedReplies: ["Add a rain plan", "Add indoor backup note", "Leave it off"],
  };
}

function fallbackPlan(
  message: string,
  weatherContext?: ConciergeWeatherContext | null,
): EventActionPlan {
  if (shouldResolveConciergeWeatherContext(message)) return buildWeatherPlan(weatherContext);
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
      actions[0]?.type === "ask_question" ? actions[0].question : "I updated this event invite.",
    suggestedReplies: actions[0]?.type === "ask_question" ? actions[0].suggestedReplies : [],
  };
}

async function planWithOpenAi(params: {
  message: string;
  event: EventHistoryRow;
  assets: EventAsset[];
  history: Array<{ role: string; content: string }>;
  weatherContext?: ConciergeWeatherContext | null;
}): Promise<EventActionPlan | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const client = new OpenAI({ apiKey });
  const simple = shouldSkipOpenAiForEventAction(params.message);
  const premium = shouldUsePremiumPlannerModel(params);
  const model = resolveConciergeOpenAiPlannerModel({ simple, premium });
  const response = await runWithConciergeOpenAiTimeout((signal) =>
    client.chat.completions.create(
      {
        model,
        ...openAiChatTemperatureParam(model, 0.1),
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
              "Use concise, warm, professional language. Never use markdown, bullets, numbered lists, star separators, or raw snake_case identifiers. Ask at most two short questions. Do not use slang, emojis, excessive exclamation, or over-familiar compliments.",
              "Do not claim an action was completed unless it is represented in the returned actions.",
              "Do not execute destructive guest response changes; ask the host to use RSVP tools or clarify a supported event setting.",
              "Theme, tone, style, and editInstruction are internal creative direction. Do not copy raw user vibe, prompt, or instruction text into visible title, headlineTitle, description, liveCard, publicEvent, or previewCopy fields; only patch those fields with polished guest-facing copy.",
              "If the user asks about weather, use only weatherContext. If it is unavailable, ask for the missing date/location or suggest adding a backup note without inventing a forecast.",
            ].join(" "),
          },
          {
            role: "user",
            content: JSON.stringify({
              message: params.message,
              event: buildCompactEventContext(params.event),
              weatherContext: params.weatherContext || null,
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
    assistantMessage: cleanString(parsed.assistantMessage) || "I updated this event invite.",
    suggestedReplies: Array.isArray(parsed.suggestedReplies)
      ? parsed.suggestedReplies.map(cleanString).filter((item): item is string => Boolean(item))
      : [],
  };
}

function shouldUsePremiumPlannerModel(params: {
  message: string;
  event: EventHistoryRow;
  assets: EventAsset[];
}): boolean {
  const data = asRecord(params.event.data);
  const context = [
    params.message,
    cleanString(params.event.title),
    cleanString(data.category),
    cleanString(data.eventType),
    cleanString(data.source),
  ]
    .filter(Boolean)
    .join(" ");
  if (PREMIUM_PLANNING_HINT.test(context)) return true;
  return params.assets.length >= 3;
}

export async function buildEventActionPlan(params: {
  message: string;
  event: EventHistoryRow;
  assets: EventAsset[];
  history: Array<{ role: string; content: string }>;
  weatherContext?: ConciergeWeatherContext | null;
}): Promise<EventActionPlan> {
  const guardedPlan = guardedEventAssistantPlan(params.message);
  if (guardedPlan) return guardedPlan;
  if (shouldResolveConciergeWeatherContext(params.message)) {
    return buildWeatherPlan(params.weatherContext);
  }
  if (isConciergeFastActionsEnabled() && shouldSkipOpenAiForEventAction(params.message)) {
    return fallbackPlan(params.message, params.weatherContext);
  }
  try {
    const aiPlan = await planWithOpenAi(params);
    if (aiPlan) return aiPlan;
  } catch {
    // Deterministic fallback keeps the event invite useful without model access.
  }
  return fallbackPlan(params.message, params.weatherContext);
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
  if (params.event.user_id !== params.userId) {
    throw new Error("Event not found.");
  }
  let event = params.event;
  const appliedActions: ConciergeEventAction[] = [];

  for (const action of params.actions) {
    if (action.type === "update_event") {
      const patch = normalizePatch(action.patch);
      if (!Object.keys(patch).length) continue;
      const nextData = { ...asRecord(event.data), ...patch };
      normalizeCanonicalStartFields(nextData);
      syncLiveCardCopyFromPatch(nextData, patch);
      sanitizeConciergePublicEventData(nextData);
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
      const eventAssistantActionKey = [
        "event_assistant_create_asset",
        action.assetType,
        cleanString(action.brief)?.toLowerCase().slice(0, 500) || "",
      ].join(":");
      const existingAssets = await listEventAssets(params.eventId, params.userId);
      const existingAsset = existingAssets.find(
        (asset) =>
          asset.asset_type === action.assetType &&
          asset.metadata?.eventAssistantActionKey === eventAssistantActionKey,
      );
      if (existingAsset) {
        appliedActions.push(action);
        continue;
      }
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
        metadata: {
          ...generated.metadata,
          eventAssistantActionKey,
        },
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
