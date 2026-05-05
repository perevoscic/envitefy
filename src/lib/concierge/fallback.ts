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
  gym_meet: "gym meet",
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

function firstMissingField(previous?: ConciergeEventDraft | null) {
  return cleanString(previous?.currentQuestion) || cleanString(previous?.missingFields?.[0]);
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
  if (/\b(gymnastics|gym\s+meet|meet\s+schedule)\b/.test(haystack)) return "gym_meet";
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
  const expectsAge =
    previous?.eventType === "birthday" &&
    (previous.currentQuestion === "ageOrMilestone" ||
      previous.missingFields?.includes("ageOrMilestone"));
  if (expectsAge) {
    const plainAge = text.match(/^\s*(\d{1,3})(?:\s*(?:years?\s*old|yrs?|yo))?\s*$/i);
    if (plainAge?.[1] && Number(plainAge[1]) <= 120) return plainAge[1];
  }
  const turning = text.match(/\b(?:turning|turns|is turning|turn)\s+(\d{1,3})\b/i);
  if (turning?.[1] && Number(turning[1]) <= 120) return turning[1];
  const commaAge = text.match(/,\s*(\d{1,3})\s*(?:$|[.,;!?])/);
  if (commaAge?.[1] && Number(commaAge[1]) <= 120) return commaAge[1];
  const ordinal = text.match(/\b(\d{1,3})(?:st|nd|rd|th)\s+birthday\b/i);
  if (ordinal?.[1] && Number(ordinal[1]) <= 120) return ordinal[1];
  return previous?.ageOrMilestone || null;
}

function detectHonoreeName(text: string, previous?: ConciergeEventDraft | null) {
  const named = text.match(/\b(?:her|his|their|the)?\s*name\s+is\s+([A-Z][a-zA-Z'-]{1,30})\b/);
  if (named?.[1]) return named[1];

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

function titleCaseName(value: string) {
  return value.replace(/\b([a-z])([a-zA-Z'-]*)/g, (_match, first: string, rest: string) => {
    return `${first.toUpperCase()}${rest}`;
  });
}

function detectHonoreeFollowUp(text: string, previous?: ConciergeEventDraft | null) {
  if (!previous || previous.honoreeName || !previous.missingFields?.includes("honoreeName")) {
    return null;
  }
  const expectsName =
    previous.currentQuestion === "honoreeName" ||
    previous.currentQuestion === "ageOrMilestone" ||
    previous.missingFields[0] === "honoreeName";
  if (!expectsName) return null;
  const cleaned = cleanString(text?.replace(/[.!?]+$/g, ""));
  if (!cleaned || cleaned.length > 60) return null;
  if (
    /\b(at|@|venue|location|home|house|park|gym|school|restaurant|saturday|sunday|monday|tuesday|wednesday|thursday|friday|january|february|march|april|may|june|july|august|september|october|november|december|birthday|party|theme)\b/i.test(
      cleaned,
    )
  ) {
    return null;
  }
  if (!/^[a-zA-Z][a-zA-Z' -]{0,58}$/.test(cleaned)) return null;
  return titleCaseName(cleaned);
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

function shouldStartFreshEvent(message: string, previous?: ConciergeEventDraft | null) {
  if (!previous) return false;
  const text = cleanString(message) || "";
  if (/\b(i|we)\s+(got|received|have)\b[\s\S]{0,80}\b(invite|invitation)\b/i.test(text)) {
    return true;
  }
  if (!/\b(create|make|build|design|generate|draft)\b/i.test(text)) return false;
  if (
    /\b(this|that|current|existing|same|matching|add|switch|change|refine|update|edit)\b/i.test(
      text,
    )
  ) {
    return false;
  }
  return /\b(birthday|wedding|baby\s+shower|graduation|gymnastics|gym\s+meet|party|event|ceremony|fundraiser|meeting)\b/i.test(
    text,
  );
}

function stripLeadingTimeFromLocation(value: string | null) {
  const cleaned = cleanString(value);
  if (!cleaned) return null;
  const withoutTime = cleaned.replace(
    /^\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?\s+(?:at|@)\s+/i,
    "",
  );
  const withoutTrailingIntent = withoutTime
    .replace(
      /\s+(?:and\s+)?(?:(?:i|we)\s+)?(?:want|need|would\s+like)\s+to\s+(?:save|add|keep)\s+(?:it|this|the\s+invite)?$/i,
      "",
    )
    .replace(/\s+and\s+(?:save|add|keep)\s+(?:it|this|the\s+invite)?$/i, "");
  if (/^\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?$/i.test(withoutTrailingIntent)) {
    return null;
  }
  return cleanString(withoutTrailingIntent);
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

  const afterTimeMatch = text.match(
    /\b(?:at|@)\s+\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?\s+(?:at|@)\s+([^.\n]{2,120})(?:[.\n]|$)/i,
  );
  const afterTimeLocation = stripLeadingTimeFromLocation(afterTimeMatch?.[1] || null);
  if (afterTimeLocation) return afterTimeLocation;

  const atMatches = Array.from(text.matchAll(/\b(?:at|@)\s+([^.\n]{2,120})(?:[.\n]|$)/gi));
  for (let index = atMatches.length - 1; index >= 0; index -= 1) {
    const location = stripLeadingTimeFromLocation(atMatches[index]?.[1] || null);
    if (location) return location;
  }

  return null;
}

function detectLocationFollowUp(text: string, previous?: ConciergeEventDraft | null) {
  if (!previous) return null;
  const missing = firstMissingField(previous);
  if (missing !== "location") return null;
  const cleaned = cleanString(text?.replace(/[.!?]+$/g, ""));
  if (!cleaned || cleaned.length > 140) return null;
  if (/^(yes|no|ok|okay|thanks?|not sure)$/i.test(cleaned)) return null;
  if (/^\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?$/i.test(cleaned)) return null;
  const stripped = cleaned
    .replace(/^(?:it'?s|it is|they should go to|guests should go to)\s+/i, "")
    .replace(/^(?:the\s+)?(?:location|venue|place|address)\s+(?:is|will be|should be)\s+/i, "")
    .replace(/^(?:at|@|to)\s+/i, "");
  return stripLeadingTimeFromLocation(stripped);
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
  const dateTextHasTime = Boolean(
    args.dateText &&
      /\b(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\b/i.test(args.dateText),
  );
  const scheduleLine = [args.dateText || "Date TBD", dateTextHasTime ? null : args.timeText || null]
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

function isReceivedInviteDraft(draft: ConciergeEventDraft) {
  return draft.sourceContext.detectedSourceIntent === "received_invite";
}

function receivedInviteLabel(draft: ConciergeEventDraft) {
  const label = EVENT_TYPE_LABELS[draft.eventType];
  if (!label || draft.eventType === "unknown" || draft.eventType === "general") return "an invite";
  return `a ${label} invite`;
}

function receivedInviteSourcePrompt(draft: ConciergeEventDraft) {
  return [
    `Got it - you're saving ${receivedInviteLabel(draft)} you received.`,
    "Upload the invite image/PDF or paste the invite text, and I will extract the exact title, date, time, location, and RSVP details.",
    "If you only remember the details, type them in and I will keep it as an invited event.",
  ].join("\n");
}

function compactIntakePrompt(...questions: string[]) {
  return ["Let's start small.", ...questions].join("\n");
}

function categoryIntakeMessage(draft: ConciergeEventDraft): string | null {
  if (isReceivedInviteDraft(draft)) return null;
  if (!draft.missingFields.length || hasStartedCategoryDetails(draft)) return null;

  if (draft.eventType === "birthday") {
    return compactIntakePrompt(
      "Who is the birthday for, and what age or milestone?",
      "When and where should it happen?",
    );
  }

  if (draft.eventType === "wedding") {
    return compactIntakePrompt(
      "What wedding event is this for, and whose names should be featured?",
      "When and where should it happen?",
    );
  }

  if (draft.eventType === "baby_shower") {
    return compactIntakePrompt(
      "Who are we celebrating, and what kind of shower is it?",
      "When and where should guests go?",
    );
  }

  if (draft.eventType === "graduation") {
    return compactIntakePrompt(
      "Who is graduating, and is this a ceremony, party, or open house?",
      "When and where should it happen?",
    );
  }

  if (draft.eventType === "gym_meet") {
    return compactIntakePrompt(
      "What team, gym, or meet name should be featured?",
      "When and where should guests go?",
    );
  }

  return null;
}

export function buildAssistantMessage(draft: ConciergeEventDraft): string {
  if (draft.currentQuestion === "which_source") {
    return "Should I use the uploaded image or the current event details?";
  }
  if (draft.currentQuestion === "invite_source") {
    return receivedInviteSourcePrompt(draft);
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
    if (isReceivedInviteDraft(draft)) {
      return "I have the invite details ready. I can save it as an invited event and open the workspace now.";
    }
    if (draft.requestedOutputs.includes("live_card")) {
      return "Your live card details are ready. I can open the workspace now.";
    }
    return "This is ready to create.";
  }
  if (isReceivedInviteDraft(draft)) {
    if (firstMissing === "sourceContext") return receivedInviteSourcePrompt(draft);
    if (firstMissing === "honoreeName" || firstMissing === "ageOrMilestone") {
      return "I have this as an invite you received. What name or milestone is shown on the invite? You can also upload or paste it so I can read it exactly.";
    }
    if (firstMissing === "date" || firstMissing === "time") {
      return "I have this as an invite you received. What date and time are shown on the invite?";
    }
    if (firstMissing === "location") {
      return "I have this as an invite you received. What location is shown on the invite?";
    }
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
  if (draft.currentQuestion === "invite_source" || firstMissing === "sourceContext") {
    if (isReceivedInviteDraft(draft)) return ["Upload invite", "Paste invite text", "Type details"];
  }
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
  const sessionDraft = args.draft || null;
  const previous = shouldStartFreshEvent(message, sessionDraft) ? null : sessionDraft;
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
    detectHonoreeFollowUp(message, previous) ||
    firstString(args.ocrContext?.fieldsGuess?.name, args.ocrContext?.fieldsGuess?.honoreeName);
  const ageOrMilestone = detectAge(text, previous);
  const chronoResult = parseChrono(text, previous);
  const fieldsGuess = args.ocrContext?.fieldsGuess || {};
  const fieldStartIso = isoFromField(fieldsGuess.start);
  const fieldEndIso = isoFromField(fieldsGuess.end);
  const location =
    detectVenueOrLocation(text, args.ocrContext) ||
    detectLocationFollowUp(message, previous) ||
    previous?.location ||
    previous?.venue ||
    null;
  const theme = detectTheme(text, previous);
  const receivedInviteWithoutSource =
    sourceContext.detectedSourceIntent === "received_invite" && !sourceContext.hasUsableContext;
  const hasConcreteReceivedInviteDetails = Boolean(
    firstString(fieldsGuess.eventPurpose, fieldsGuess.title) ||
      honoreeName ||
      ageOrMilestone ||
      chronoResult.dateText ||
      chronoResult.startISO ||
      location,
  );
  const eventPurpose =
    receivedInviteWithoutSource && !hasConcreteReceivedInviteDetails
      ? null
      : firstString(fieldsGuess.eventPurpose, fieldsGuess.title) ||
        previous?.eventPurpose ||
        (isMeaningfulEventText(message, requestedOutputs) ? cleanCreationString(message) : null);
  const titleCandidate =
    firstString(fieldsGuess.title) ||
    buildTitle({ eventType, honoreeName, ageOrMilestone, eventPurpose, previous });
  const title =
    receivedInviteWithoutSource && !hasConcreteReceivedInviteDetails ? null : titleCandidate;
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
    creationSessionId: createCreationSessionId(sessionDraft),
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
