import * as chrono from "chrono-node";
import {
  cleanCreationString,
  createCreationSessionId,
  deriveCreationStatus,
  isGreetingMessage,
  isMeaningfulEventText,
  normalizeCreationIntent,
  normalizeRequestedOutputs,
  outputQuestion,
  resolveCreationSourceContext,
  toLegacyOutputs,
} from "./creation-intent.ts";
import type {
  ConciergeActiveContext,
  ConciergeEventDraft,
  ConciergeEventType,
  ConciergeOcrContext,
  ConciergePreviewCopy,
  RequestedOutput,
  ConciergeSource,
} from "./types.ts";

const DEFAULT_TIMEZONE = "America/Chicago";

const EVENT_TYPE_LABELS: Record<ConciergeEventType, string> = {
  unknown: "event",
  birthday: "birthday",
  wedding: "wedding",
  baby_shower: "baby shower",
  graduation: "graduation",
  general: "event",
};

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned || null;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    const cleaned = cleanString(value);
    if (cleaned) return cleaned;
  }
  return null;
}

function mergeText(message: string, ocrContext?: ConciergeOcrContext | null) {
  return [message, ocrContext?.ocrText, ocrContext?.category]
    .map((value) => cleanString(value))
    .filter(Boolean)
    .join("\n");
}

function detectEventType(text: string, previous?: ConciergeEventDraft | null): ConciergeEventType {
  const haystack = text.toLowerCase();
  if (/\b(birthday|turning|turns|bday)\b/.test(haystack)) return "birthday";
  if (/\b(wedding|married|marriage|bride|groom)\b/.test(haystack)) return "wedding";
  if (/\b(baby shower|sprinkle|baby\s+boy|baby\s+girl)\b/.test(haystack)) {
    return "baby_shower";
  }
  if (/\b(graduation|graduate|commencement|class of)\b/.test(haystack)) return "graduation";
  if (/\bgeneral\s+event\b|\bjust\s+an\s+event\b/.test(haystack)) return "general";
  return previous?.eventType || "unknown";
}

function detectRelationship(text: string, previous?: ConciergeEventDraft | null) {
  const match = text.match(
    /\b(my|our)\s+(daughter|son|kid|child|mom|mother|dad|father|sister|brother|friend|wife|husband|partner)\b/i,
  );
  return match?.[2]?.toLowerCase() || previous?.relationship || null;
}

function detectAge(text: string, previous?: ConciergeEventDraft | null) {
  const turning = text.match(/\b(?:turning|turns|is turning|turn)\s+(\d{1,3})\b/i);
  if (turning?.[1]) return turning[1];
  const commaAge = text.match(/,\s*(\d{1,3})(?:\b|$)/);
  if (commaAge?.[1]) return commaAge[1];
  const ordinal = text.match(/\b(\d{1,3})(?:st|nd|rd|th)\s+birthday\b/i);
  if (ordinal?.[1]) return ordinal[1];
  return previous?.ageOrMilestone || null;
}

function detectHonoreeName(text: string, previous?: ConciergeEventDraft | null) {
  const possessive = text.match(
    /\b([A-Z][a-zA-Z'-]{1,30})'s\s+(?:\d{1,3}(?:st|nd|rd|th)\s+)?(?:birthday|graduation|party|shower)\b/,
  );
  if (possessive?.[1]) return possessive[1];

  const turning = text.match(/\b([A-Z][a-zA-Z'-]{1,30})\s+(?:is\s+)?turning\s+\d{1,3}\b/);
  if (turning?.[1]) return turning[1];

  const commaName = text.match(/^\s*([A-Z][a-zA-Z'-]{1,30})\s*,\s*\d{1,3}\b/);
  if (commaName?.[1]) return commaName[1];

  return previous?.honoreeName || null;
}

function detectTheme(text: string, previous?: ConciergeEventDraft | null) {
  const themeMatch =
    text.match(/\b(?:make it|theme|style|with a)\s+([a-z0-9][a-z0-9 '&-]{1,50})(?:\s+theme)?\b/i) ||
    text.match(
      /\b(unicorn|princess|dinosaur|space|garden|floral|rustic|modern|sparkle|rainbow|sports|football|basketball|ballet)\b/i,
    );
  const raw = themeMatch?.[1] || themeMatch?.[0];
  return cleanString(raw)?.replace(/\s+theme$/i, "") || previous?.theme || null;
}

function detectVenueOrLocation(text: string, ocrContext?: ConciergeOcrContext | null) {
  const fields = ocrContext?.fieldsGuess || {};
  const fromFields = firstString(
    fields.location,
    fields.venue,
    fields.address,
    fields.place,
    fields.locationText,
  );
  if (fromFields) return fromFields;

  const atMatch = text.match(/\b(?:at|@)\s+([^.\n,]{2,80})(?:[.,\n]|$)/i);
  if (atMatch?.[1]) return cleanString(atMatch[1]);

  return null;
}

function parseChrono(text: string, previous?: ConciergeEventDraft | null) {
  const parsed = chrono.parse(text, new Date(), { forwardDate: true });
  const first = parsed[0];
  if (!first) {
    return {
      dateText: previous?.dateText || null,
      timeText: previous?.timeText || null,
      startISO: previous?.startISO || null,
      endISO: previous?.endISO || null,
    };
  }

  const start = first.start.date();
  const end = first.end?.date() || new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const hasHour = first.start.isCertain("hour");
  return {
    dateText: cleanString(first.text) || previous?.dateText || null,
    timeText: hasHour
      ? start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      : previous?.timeText || null,
    startISO: start.toISOString(),
    endISO: end.toISOString(),
  };
}

function isoFromField(value: unknown) {
  const raw = cleanString(value);
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function buildTitle(args: {
  eventType: ConciergeEventType;
  honoreeName: string | null;
  ageOrMilestone: string | null;
  eventPurpose: string | null;
  previous?: ConciergeEventDraft | null;
}) {
  const previousTitle = cleanString(args.previous?.title);
  const label = EVENT_TYPE_LABELS[args.eventType];
  const genericTitle = `${label[0].toUpperCase()}${label.slice(1)} draft`;
  if (args.eventType === "birthday" && args.honoreeName && args.ageOrMilestone) {
    return `${args.honoreeName} is turning ${args.ageOrMilestone}`;
  }
  if (args.eventType === "birthday" && args.honoreeName) return `${args.honoreeName}'s birthday`;
  if (args.eventType === "wedding" && args.honoreeName) return `${args.honoreeName}'s wedding`;
  if (args.eventType === "graduation" && args.honoreeName)
    return `${args.honoreeName}'s graduation`;
  if (previousTitle && previousTitle !== "Event draft" && previousTitle !== genericTitle) {
    return previousTitle;
  }
  if (args.eventPurpose) return args.eventPurpose;
  if (args.eventType === "unknown") return null;
  return genericTitle;
}

function buildPreviewCopy(args: {
  eventType: ConciergeEventType;
  title: string;
  honoreeName: string | null;
  ageOrMilestone: string | null;
  dateText: string | null;
  timeText: string | null;
  location: string | null;
  theme: string | null;
}): ConciergePreviewCopy {
  const headline = args.title || "Event draft";
  const themeLine = args.theme ? `${args.theme} theme` : "Details coming soon";
  const scheduleLine = [args.dateText || "Date TBD", args.timeText || null]
    .filter(Boolean)
    .join(" at ");
  const locationLine = args.location || "Location TBD";
  const body =
    args.eventType === "birthday"
      ? `Join us for ${args.honoreeName || "the guest of honor"}${args.ageOrMilestone ? ` as they turn ${args.ageOrMilestone}` : ""}.`
      : `Join us for this ${EVENT_TYPE_LABELS[args.eventType]}.`;
  return {
    headline,
    subheadline: themeLine,
    body,
    scheduleLine,
    locationLine,
    cta: "RSVP",
  };
}

function computeMissingFields(draft: Omit<ConciergeEventDraft, "missingFields">) {
  const missing: string[] = [];
  if (draft.eventType === "birthday" && !draft.honoreeName) missing.push("honoreeName");
  if (draft.eventType === "birthday" && !draft.ageOrMilestone) missing.push("ageOrMilestone");
  if (!draft.startISO && !draft.dateText) missing.push("date");
  if (!draft.timeText && !draft.startISO) missing.push("time");
  if (!draft.location && !draft.venue) missing.push("location");
  return missing;
}

function hasStartedCategoryDetails(draft: ConciergeEventDraft) {
  return Boolean(
    draft.honoreeName ||
      draft.ageOrMilestone ||
      draft.dateText ||
      draft.timeText ||
      draft.startISO ||
      draft.location ||
      draft.venue ||
      draft.theme,
  );
}

function categoryIntakeMessage(draft: ConciergeEventDraft): string | null {
  if (!draft.missingFields.length || hasStartedCategoryDetails(draft)) return null;

  if (draft.eventType === "birthday") {
    return [
      "Welcome to Envitefy. I am your Concierge AI, here to help craft an elegant birthday event page or digital flyer.",
      "",
      "To get started, please share a few details:",
      "What kind of birthday celebration is it?",
      "Who is the guest of honor, and what age or milestone are we celebrating?",
      "What date, time, and location should guests know?",
      "Do you have a specific theme, color palette, or vibe in mind?",
      "",
      "Once I have those details, I can generate the live card or flyer.",
    ].join("\n");
  }

  if (draft.eventType === "wedding") {
    return [
      "Welcome to Envitefy. I am your Concierge AI, here to help craft an elegant wedding event page or digital flyer.",
      "",
      "To get started, please share a few details:",
      "Is this for the wedding, rehearsal dinner, shower, or another wedding event?",
      "What names should be featured?",
      "What date, time, and venue should guests know?",
      "Do you have a style, palette, dress code, or registry detail in mind?",
      "",
      "Once I have those details, I can generate the live card or flyer.",
    ].join("\n");
  }

  if (draft.eventType === "baby_shower") {
    return [
      "Welcome to Envitefy. I am your Concierge AI, here to help craft a polished baby shower event page or digital flyer.",
      "",
      "To get started, please share a few details:",
      "What type of shower or sprinkle are you hosting?",
      "Who are we celebrating, and should a baby name be included?",
      "What date, time, and location should guests know?",
      "Do you have a theme, color palette, registry, or gift note in mind?",
      "",
      "Once I have those details, I can generate the live card or flyer.",
    ].join("\n");
  }

  if (draft.eventType === "graduation") {
    return [
      "Welcome to Envitefy. I am your Concierge AI, here to help craft a graduation event page or digital flyer.",
      "",
      "To get started, please share a few details:",
      "Is this for a ceremony, party, open house, or dinner?",
      "Who is the graduate, and should we include school or class year?",
      "What date, time, and location should guests know?",
      "Do you have school colors, a photo style, or a specific vibe in mind?",
      "",
      "Once I have those details, I can generate the live card or flyer.",
    ].join("\n");
  }

  return null;
}

export function buildAssistantMessage(draft: ConciergeEventDraft): string {
  if (draft.currentQuestion === "which_source") {
    return "Should I use the uploaded image or the current event details?";
  }
  const intakeMessage = categoryIntakeMessage(draft);
  if (intakeMessage) return intakeMessage;
  if (
    draft.currentQuestion === "what_are_we_celebrating" ||
    draft.missingFields[0] === "eventPurpose"
  ) {
    if (!draft.requestedOutputs.length) {
      return "Hi — what would you like to create? You can describe an event, ask for a flyer, live card, or RSVP page, or upload an invite/photo.";
    }
    return outputQuestion(draft.requestedOutputs[0] || "live_card");
  }
  const firstMissing = draft.missingFields[0];
  if (!firstMissing) {
    if (draft.requestedOutputs.includes("live_card")) {
      return "Your live card details are ready. I can open the workspace now.";
    }
    return "This is ready to create.";
  }
  if (firstMissing === "honoreeName" || firstMissing === "ageOrMilestone") {
    return "What's the name and milestone?";
  }
  if (firstMissing === "date" || firstMissing === "time") {
    return "When should this happen?";
  }
  if (firstMissing === "location") return "Where should guests go?";
  return "What detail should we add next?";
}

export function buildSuggestedReplies(draft: ConciergeEventDraft): string[] {
  const firstMissing = draft.missingFields[0];
  if (firstMissing === "eventPurpose") {
    if (!draft.requestedOutputs.length) {
      return ["Make a flyer", "Create a live card", "Upload an invite"];
    }
    return ["A school fundraiser", "A birthday party", "Use an upload"];
  }
  if (firstMissing === "sourceContext") {
    return ["Use current draft", "Use upload"];
  }
  if (firstMissing === "honoreeName" || firstMissing === "ageOrMilestone") {
    return ["Ava, 7", "Make it a surprise"];
  }
  if (firstMissing === "date" || firstMissing === "time") {
    return ["Saturday at 3", "Next Friday evening"];
  }
  if (firstMissing === "location") return ["At home", "At Sky Zone"];
  if (draft.requestedOutputs.includes("live_card")) return ["Open workspace", "Add RSVP page"];
  return ["Create workspace", "Add RSVP page"];
}

export function canSaveConciergeDraft(draft: ConciergeEventDraft): boolean {
  return draft.canPersist;
}

export function fallbackExtractConciergeDraft(args: {
  message: string;
  draft?: ConciergeEventDraft | null;
  ocrContext?: ConciergeOcrContext | null;
  requestedOutputs?: RequestedOutput[] | null;
  source?: ConciergeSource;
  activeContext?: ConciergeActiveContext | null;
}): ConciergeEventDraft {
  const message = cleanString(args.message) || "";
  const combined = mergeText(message, args.ocrContext);
  const text = combined || message;
  const previous = args.draft || null;
  const hasExplicitOutputs =
    Array.isArray(args.requestedOutputs) && args.requestedOutputs.length > 0;
  const requestedOutputs = normalizeRequestedOutputs(
    hasExplicitOutputs ? args.requestedOutputs : previous?.requestedOutputs || previous?.outputs,
    {
      text,
      previous: hasExplicitOutputs ? null : previous,
      defaultOutput: !previous && isGreetingMessage(message) ? null : undefined,
    },
  );
  const sourceContext = resolveCreationSourceContext({
    message,
    activeContext: args.activeContext || null,
    previous,
    ocrContext: args.ocrContext || null,
  });
  const source: ConciergeSource =
    args.source || (args.ocrContext ? (message ? "mixed" : "upload") : previous?.source || "text");
  const eventType = detectEventType(text, previous);
  const relationship = detectRelationship(text, previous);
  const honoreeName =
    detectHonoreeName(text, previous) ||
    firstString(args.ocrContext?.fieldsGuess?.name, args.ocrContext?.fieldsGuess?.honoreeName);
  const ageOrMilestone = detectAge(text, previous);
  const chronoResult = parseChrono(text, previous);
  const fieldsGuess = args.ocrContext?.fieldsGuess || {};
  const fieldStartIso = isoFromField(fieldsGuess.start);
  const fieldEndIso = isoFromField(fieldsGuess.end);
  const location =
    detectVenueOrLocation(text, args.ocrContext) || previous?.location || previous?.venue || null;
  const theme = detectTheme(text, previous);
  const eventPurpose =
    firstString(fieldsGuess.eventPurpose, fieldsGuess.title) ||
    previous?.eventPurpose ||
    (isMeaningfulEventText(message, requestedOutputs) ? cleanCreationString(message) : null);
  const title =
    firstString(fieldsGuess.title) ||
    buildTitle({ eventType, honoreeName, ageOrMilestone, eventPurpose, previous });
  const dateText = chronoResult.dateText || firstString(fieldsGuess.date);
  const timeText = chronoResult.timeText || firstString(fieldsGuess.time);
  const startISO = fieldStartIso || chronoResult.startISO;
  const endISO = fieldEndIso || chronoResult.endISO;
  const status = deriveCreationStatus({
    sourceContext,
    eventPurpose,
    title,
    eventType,
    requestedOutputs,
    dateText,
    startISO,
    location,
  });
  const base = {
    creationSessionId: createCreationSessionId(previous),
    intent: normalizeCreationIntent(previous?.intent, message, requestedOutputs),
    requestedOutputs,
    sourceContext,
    eventPurpose,
    eventType,
    title,
    ownership:
      sourceContext.detectedSourceIntent === "received_invite"
        ? "invited"
        : sourceContext.detectedSourceIntent === "unknown"
          ? previous?.ownership || "unknown"
          : "owned",
    draftStatus: status.draftStatus,
    currentQuestion: status.currentQuestion,
    canPersist: status.canPersist,
    honoreeName,
    relationship,
    ageOrMilestone,
    dateText,
    timeText,
    startISO,
    endISO,
    timezone: firstString(fieldsGuess.timezone) || previous?.timezone || DEFAULT_TIMEZONE,
    location,
    venue: location,
    theme,
    tone: previous?.tone || null,
    outputs: toLegacyOutputs(requestedOutputs),
    previewCopy: buildPreviewCopy({
      eventType,
      title: title || eventPurpose || "Event draft",
      honoreeName,
      ageOrMilestone,
      dateText,
      timeText,
      location,
      theme,
    }),
    source,
  } satisfies Omit<ConciergeEventDraft, "missingFields">;

  return {
    ...base,
    missingFields: Array.from(new Set([...status.missingFields, ...computeMissingFields(base)])),
  };
}
