import * as chrono from "chrono-node";
import {
  classifyCreationBoundary,
  cleanCreationString,
  createCreationSessionId,
  deriveCreationStatus,
  getOutputRequirement,
  hasClearCreationSignal,
  isGreetingMessage,
  isMeaningfulEventText,
  normalizeCreationIntent,
  normalizeRequestedOutputs,
  outputQuestion,
  resolveCreationSourceContext,
  toLegacyOutputs,
} from "./creation-intent.ts";
import {
  guestSubheadlineForEvent,
  looksLikeInternalCreativeDirection,
  sanitizeConciergePreviewCopy,
} from "./public-copy.ts";
import {
  detectDuplicateAction,
  detectDuplicateUserMessage,
  handleSideComment,
  hasAlreadyAsked,
  updateConversationState,
} from "./conversation-state.ts";
import type { RequirementField } from "./requirements.ts";
import {
  getEventTypeLabel,
  getRequirementPlan,
  questionForRequirementField,
  suggestedRepliesForRequirementField,
} from "./requirements.ts";
import type {
  ConciergeAction,
  ConciergeActiveContext,
  ConciergeAdditionalLocation,
  ConciergeEventDraft,
  ConciergeEventType,
  ConciergeOcrContext,
  ConciergePreviewCopy,
  ConciergeSource,
  RequestedOutput,
} from "./types.ts";

const DEFAULT_TIMEZONE = "America/Chicago";
const GIFT_FRIENDLY_EVENT_TYPES = new Set<ConciergeEventType>([
  "birthday",
  "wedding",
  "baby_shower",
  "gender_reveal",
  "bridal_shower",
  "graduation",
  "housewarming",
]);
const GIFT_REGISTRY_OUTPUTS = new Set<RequestedOutput>([
  "event_page",
  "live_card",
  "digital_flyer",
  "invitation",
  "printable_flyer",
]);
const GIFT_LIST_EVENT_TYPES = new Set<ConciergeEventType>([
  "birthday",
  "graduation",
  "housewarming",
]);
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

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

function stringFromKnownValue(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) return String(Math.round(value));
  return firstString(value);
}

function recordValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function cleanUrlString(value: unknown): string | null {
  return cleanString(value)?.replace(/[),.;!?]+$/g, "") || null;
}

const SPORT_EVENT_TYPES = new Set<ConciergeEventType>(["game_day", "football", "sport_event"]);

function isSportEventType(eventType: ConciergeEventType) {
  return SPORT_EVENT_TYPES.has(eventType);
}

function looksLikeCreationPrompt(value: string | null) {
  const text = cleanString(value);
  if (!text) return false;
  return (
    /\b(create|make|build|draft|design|generate)\b[\s\S]{0,80}\b(product|envitefy|event\s+page|live\s*card|digital\s+flyer|flyer|invitation|invite|rsvp\s+page|guest-facing|call\s+to\s+action)\b/i.test(
      text,
    ) ||
    (text.length > 90 &&
      /\b(create|make|build|draft|design|generate|product|envitefy|event\s+page|live\s*card|digital\s+flyer|guest-facing|call\s+to\s+action)\b/i.test(
        text,
      ))
  );
}

function cleanMessageEventPurpose(value: string | null, requestedOutputs: RequestedOutput[]) {
  let cleaned = cleanString(value);
  if (!cleaned) return null;
  cleaned = cleaned
    .replace(
      /^(?:please\s+)?(?:make|create|build|turn|convert|draft|design|generate|write)\s+(?:me\s+)?(?:a|an|the)?\s*/i,
      "",
    )
    .replace(
      /^(?:as\s+)?(?:a|an|the)?\s*(?:live\s*card|event\s*page|digital\s+flyer|flyer\s*(?:\/|&|\+|and)?\s*(?:invite|invitation)?|invite|invitation|rsvp\s+page|smart\s+sign[-\s]?up|signup\s+form|product)\s*(?:of|for|about|from|with)?\s*(?:a|an|the)?\s*/i,
      "",
    )
    .replace(/^(?:of|for|about)\s+(?:a|an|the)?\s*/i, "");
  for (const output of requestedOutputs) {
    cleaned = cleaned.replace(new RegExp(output.replace(/_/g, "\\s*"), "gi"), " ");
  }
  cleaned = cleaned
    .replace(/\b(?:no|without|skip|disable)\s+(?:envitefy\s+)?rsvps?\b[\s\S]*$/i, "")
    .replace(/\b(?:with|include|enable|collect|track|add)\s+(?:envitefy\s+)?rsvps?\b[\s\S]*$/i, "")
    .replace(
      /\s+\b(?:on|at)\s+(?:today|tomorrow|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday|jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?)\b[\s\S]*$/i,
      "",
    )
    .replace(
      /\s+\b(?:warm|cozy|fun|playful|elegant|modern|classic|bright|soft)\b[\s\S]*\b(?:style|vibe|theme|tone)\b[\s\S]*$/i,
      "",
    )
    .replace(/[.!?;:,]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned || cleaned.length < 3 || cleaned.length > 80) return null;
  if (looksLikeCreationPrompt(cleaned) || isInstructionFragment(cleaned)) return null;
  return cleaned;
}

function cleanScheduledEventPurpose(value: string | null) {
  const text = cleanString(value);
  if (!text) return null;
  const scheduled = text.match(
    /^\s*(.{3,80}?)\s+\bon\s+(?:(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+)?(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?(?=\s+(?:at|from)\b|[.,;]|$)/i,
  );
  const cleaned = cleanString(scheduled?.[1]?.replace(/[.!?;:,]+$/g, ""));
  if (!cleaned || cleaned.length < 3 || looksLikeCreationPrompt(cleaned)) return null;
  return cleaned;
}

function isInstructionFragment(value: string | null) {
  const text = cleanString(value);
  if (!text) return true;
  if (
    /^(theme|tone|style|vibe|event|product|invite|invitation|event page|live card)$/i.test(text)
  ) {
    return true;
  }
  return /\b(complete\s+envitefy|envitefy\s+product|clear\s+headline|guest-facing|call\s+to\s+action|rsvp\s+(?:contact|deadline)|rsvps?\s+for|make\s+this|create\s+this|schedule|location)\b/i.test(
    text,
  );
}

function isCommandOnlyDraftUpdate(value: string | null) {
  const text = cleanString(value?.replace(/[.!?]+$/g, ""));
  if (!text) return false;
  return (
    /^(?:actually\s+)?(?:make|change|set|move)\s+(?:it|the\s+time|time)?\s*(?:to|for)?\s*\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?$/i.test(
      text,
    ) ||
    /^(?:make|use|switch\s+to|turn\s+it\s+into)\s+(?:it\s+)?(?:as\s+)?(?:a|an)?\s*(?:smart\s+sign[-\s]?up(?:\s+form)?|signup\s+form|sign[-\s]?up\s+form|rsvp\s+page|live\s*card|event\s+page|digital\s+flyer|flyer|invitation|invite)$/i.test(
      text,
    ) ||
    /^(?:yes|yep|yeah|sure|please|yes please)(?:\s+(?:collect|track|include|enable|add)\s+(?:rsvps?|responses?))?(?:\s+for\s+\d{1,4})?$/i.test(
      text,
    ) ||
    /^(?:yes\s+)?(?:collect|track|include|enable|add)\s+(?:rsvps?\s+)?(?:for\s+)?\d{1,4}$/i.test(
      text,
    ) ||
    /^(?:no|nope|skip|skip it|not needed|no rsvps?(?:\s+needed)?|do not collect rsvps?|don't collect rsvps?|leave it off)$/i.test(
      text,
    ) ||
    /^(?:no\s+gifts?(?:\s+please)?|gifts?\s+optional|no\s+gift\s+link)$/i.test(text) ||
    isAgeOrMilestoneSkipReply(text) ||
    isGiftPromptSkipReply(text) ||
    /^https?:\/\/\S+$/i.test(text)
  );
}

function isBirthdayClarificationOnly(value: string | null, previous?: ConciergeEventDraft | null) {
  if (!previous) return false;
  const text = cleanString(value?.replace(/[.!?]+$/g, ""));
  if (!text) return false;
  return /^(?:it|this|that)\s+(?:is|was|'s)\s+for\s+(?:her|his|their)\s+birthday$/i.test(text);
}

function isProductSwitchCommand(value: string | null) {
  const text = cleanString(value?.replace(/[.!?]+$/g, ""));
  if (!text) return false;
  return /^(?:make|use|switch\s+to|turn\s+it\s+into)\s+(?:it\s+)?(?:as\s+)?(?:a|an)?\s*(?:smart\s+sign[-\s]?up(?:\s+form)?|signup\s+form|sign[-\s]?up\s+form|rsvp\s+page|live\s*card|event\s+page|digital\s+flyer|flyer|invitation|invite)$/i.test(
    text,
  );
}

function cleanSportsName(value: string | null | undefined) {
  const cleaned = cleanString(
    value
      ?.replace(/^(?:the|a|an)\s+/i, "")
      .replace(
        /\s+(?:football|basketball|baseball|softball|soccer|volleyball|hockey|lacrosse|tennis|pickleball)\s*$/i,
        "",
      )
      .replace(/\s+(?:game|match|matchup|event|product|invite|invitation|event\s+page)\s*$/i, "")
      .replace(/\s+\b(?:on|at|with|for)\b[\s\S]*$/i, "")
      .replace(/[.,;:]+$/g, ""),
  );
  if (!cleaned || isInstructionFragment(cleaned)) return null;
  return cleaned;
}

function deriveSportEventTitle(text: string, eventType: ConciergeEventType) {
  if (!isSportEventType(eventType)) return null;

  const matchupPatterns = [
    /\b(?:for|featuring|about)\s+(?:the\s+)?(.{2,90}?)\s+(?:(?:football|basketball|baseball|softball|soccer|volleyball|hockey|lacrosse|tennis|pickleball)\s+)?(?:game|match|matchup)\s+(?:against|versus|vs\.?)\s+(?:the\s+)?(.{2,90}?)(?=\s+(?:on|at|with|for)\b|[.,;]|$)/i,
    /\b(?:for|featuring|about)\s+(?:the\s+)?(.{2,90}?)\s+(?:against|versus|vs\.?)\s+(?:the\s+)?(.{2,90}?)(?=\s+(?:on|at|with|for)\b|[.,;]|$)/i,
  ];
  for (const pattern of matchupPatterns) {
    const match = text.match(pattern);
    const team = cleanSportsName(match?.[1]);
    const opponent = cleanSportsName(match?.[2]);
    if (team && opponent) return `${team} vs ${opponent}`;
  }

  const directVs = text.match(
    /\b(?:the\s+)?([A-Z][a-zA-Z0-9' -]{1,70}?)\s+(?:vs\.?|versus)\s+(?:the\s+)?([A-Z][a-zA-Z0-9' -]{1,70}?)(?=\s+(?:on|at|with|for)\b|[.,;]|$)/,
  );
  const directTeam = cleanSportsName(directVs?.[1]);
  const directOpponent = cleanSportsName(directVs?.[2]);
  if (directTeam && directOpponent) return `${directTeam} vs ${directOpponent}`;

  const watchParty = text.match(
    /\b(?:for|featuring|about)\s+(?:the\s+)?(.{2,70}?)\s+watch\s+party\b/i,
  );
  const watchTeam = cleanSportsName(watchParty?.[1]);
  if (watchTeam) return `${watchTeam} Watch Party`;

  const teamGame = text.match(
    /\b(?:for|featuring|about)\s+(?:the\s+)?(.{2,70}?)\s+(?:(?:football|basketball|baseball|softball|soccer|volleyball|hockey|lacrosse|tennis|pickleball)\s+)?(?:game|game\s+day|match|matchup)\b/i,
  );
  const team = cleanSportsName(teamGame?.[1]);
  if (team) return `${team} Game Day`;

  return null;
}

function firstBoolean(...values: unknown[]): boolean | null {
  for (const value of values) {
    if (typeof value === "boolean") return value;
    if (typeof value !== "string") continue;
    const normalized = value.trim().toLowerCase();
    if (/^(true|yes|y|enabled?|on|1)$/.test(normalized)) return true;
    if (/^(false|no|n|disabled?|off|0)$/.test(normalized)) return false;
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

function mergeStarterCategory(message: string, starterCategory?: string | null) {
  const category = cleanString(starterCategory);
  if (!category) return message;
  if (!message) return category;
  if (message.toLowerCase().startsWith(category.toLowerCase())) return message;
  return `${category} ${message}`;
}

function detectEventType(text: string, previous?: ConciergeEventDraft | null): ConciergeEventType {
  if (
    firstMissingField(previous) === "tone" &&
    previous?.eventType &&
    previous.eventType !== "unknown"
  ) {
    return previous.eventType;
  }
  const haystack = text.toLowerCase();
  if (/\b(birthday|turning|turns|bday)\b/.test(haystack)) return "birthday";
  if (/\b(wedding|married|marriage|bride|groom)\b/.test(haystack)) return "wedding";
  if (/\bbridal\s+shower\b/.test(haystack)) return "bridal_shower";
  if (/\b(baby shower|sprinkle|baby\s+boy|baby\s+girl)\b/.test(haystack)) {
    return "baby_shower";
  }
  if (/\bgender\s+reveal\b/.test(haystack)) return "gender_reveal";
  if (/\b(graduation|graduate|commencement|class of)\b/.test(haystack)) return "graduation";
  if (
    /\b(gymnastics|gym\s+meet|meet\s+schedule)\b/.test(haystack) ||
    (/\bgym\b/.test(haystack) && /\b(?:invitational|classic|meet)\b/.test(haystack))
  ) {
    return "gym_meet";
  }
  if (/\b(football|touchdown|tailgate)\b/.test(haystack)) return "football";
  if (/\b(game\s+day|gameday|watch\s+party)\b/.test(haystack)) return "game_day";
  if (
    /\b(sports?\s+event|soccer|basketball|baseball|volleyball|pickleball|tennis)\b/.test(haystack)
  ) {
    return "sport_event";
  }
  if (/\b(field\s+trip\/day|field\s+trip|field\s+day)\b/.test(haystack)) return "field_trip";
  if (/\bopen\s+house\b/.test(haystack)) return "open_house";
  if (/\bhousewarming\b/.test(haystack)) return "housewarming";
  if (/\b(appointment|appointments|booking|consultation)\b/.test(haystack)) return "appointment";
  if (/\b(workshop|class|seminar|training)\b/.test(haystack)) return "workshop";
  if (/\b(smart\s+sign[-\s]?up|sign[-\s]?up\s+form|signup\s+form)\b/.test(haystack)) {
    return "smart_signup";
  }
  if (/\bspecial\s+event\b/.test(haystack)) return "special_event";
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
  const birthdayForAge = text.match(
    /\b(?:birthday|bday)(?:\s+(?:live\s*card|event\s+page|flyer(?:\/invitation)?|flyer\s+invitation|invitation|invite|party|product))*\s+(?:for|fro)\s+[a-z][a-zA-Z'-]{1,30}\s*,?\s+(\d{1,3})(?=\s*(?:,|\b(?:for|fro|on|at|turning|turns)\b|$))/i,
  );
  if (birthdayForAge?.[1] && Number(birthdayForAge[1]) <= 120) return birthdayForAge[1];
  const commaAge = text.match(/,\s*(\d{1,3})\s*(?:$|[.,;!?])/);
  if (commaAge?.[1] && Number(commaAge[1]) <= 120) return commaAge[1];
  const ordinal = text.match(/\b(\d{1,3})(?:st|nd|rd|th)\s+birthday\b/i);
  if (ordinal?.[1] && Number(ordinal[1]) <= 120) return ordinal[1];
  return previous?.ageOrMilestone || null;
}

function isAgeOrMilestoneSkipReply(message: string) {
  const normalized = cleanString(message.replace(/[.!?]+$/g, "")) || "";
  return /^(?:no|none|skip|skip it|not needed|leave it off|do not show it|don't show it|dont show it)$/i.test(
    normalized,
  )
    ? false
    : /^(?:no\s+(?:age|milestone)(?:\s+(?:shown|needed|please))?|skip\s+(?:age|milestone)|leave\s+(?:the\s+)?(?:age|milestone)\s+off|(?:age|milestone)\s+(?:not\s+needed|optional)|(?:do\s+not|don't|dont)\s+show\s+(?:the\s+)?(?:age|milestone))$/i.test(
        normalized,
      );
}

function detectAgeOrMilestoneSkipped(message: string, previous?: ConciergeEventDraft | null) {
  if (!previous || previous.eventType !== "birthday") return false;
  if (firstMissingField(previous) !== "ageOrMilestone") return false;
  return isAgeOrMilestoneSkipReply(message);
}

function detectHonoreeName(text: string, previous?: ConciergeEventDraft | null) {
  if (
    previous?.eventType === "wedding" ||
    /\b(wedding|reception|ceremony|married|marriage)\b/i.test(text)
  ) {
    const couple =
      text.match(
        /\b(?:for\s+)?([A-Z][a-zA-Z'-]{1,30})\s+(?:and|&)\s+([A-Z][a-zA-Z'-]{1,30})(?:'s)?\s+(?:wedding|ceremony|reception|marriage)\b/,
      ) ||
      text.match(
        /\bwedding(?:\s+(?:invitation|invite|event\s+page|live\s+card|flyer\s+invite))?\s+for\s+(?:QA\s+|test\s+)?([A-Z][a-zA-Z'-]{1,30})\s+(?:and|&)\s+([A-Z][a-zA-Z'-]{1,30})\b/i,
      ) ||
      text.match(
        /\b(?:wedding|ceremony|reception)\s+(?:for|of)\s+([A-Z][a-zA-Z'-]{1,30})\s+(?:and|&)\s+([A-Z][a-zA-Z'-]{1,30})\b/,
      ) ||
      text.match(/^\s*([A-Z][a-zA-Z'-]{1,30})\s+(?:and|&)\s+([A-Z][a-zA-Z'-]{1,30})(?:\b|$)/);
    if (couple?.[1] && couple?.[2]) return `${couple[1]} and ${couple[2]}`;
  }

  const named = text.match(/\b(?:her|his|their|the)?\s*name\s+is\s+([A-Z][a-zA-Z'-]{1,30})\b/);
  if (named?.[1]) return named[1];

  if (previous?.eventType === "birthday" || /\b(?:birthday|bday)\b/i.test(text)) {
    const directBirthdayName = text.match(
      /\b([A-Z][a-zA-Z'-]{1,30})(?:\s+(?:and|&)\s+[A-Z][a-zA-Z'-]{1,30})?\s+(?:\d{1,3}(?:st|nd|rd|th)\s+)?(?:birthday|bday)\b/,
    );
    if (directBirthdayName?.[1] && !/\s+(?:and|&)\s+/i.test(directBirthdayName[0])) {
      return directBirthdayName[1].replace(/['’]s$/i, "");
    }

    const birthdayFromPreviousSubject =
      previous?.eventPurpose || previous?.title || previous?.previewCopy?.headline || null;
    if (birthdayFromPreviousSubject && /\b(?:her|his|their)\s+birthday\b/i.test(text)) {
      const previousSubject = birthdayFromPreviousSubject.match(
        /^\s*([A-Z][a-zA-Z'-]{1,30})(?=\s+\b(?:pool|party|event|celebration|birthday|bday|book|club|potluck|breakfast)\b|\s*$)/,
      );
      if (previousSubject?.[1]) return previousSubject[1];
    }

    const birthdayForName = text.match(
      /\b(?:birthday|bday)(?:\s+(?:live\s*card|event\s+page|flyer(?:\/invitation)?|flyer\s+invitation|invitation|invite|party|product))*\s+(?:for|fro)\s+([a-z][a-zA-Z'-]{1,30})(?=\s*(?:['’]s\b|,|\d{1,3}\b|\b(?:turning|turns|is turning|on|at|for|fro)\b|$))/i,
    );
    if (birthdayForName?.[1]) return titleCaseName(birthdayForName[1]);

    const birthdayProductNameAge = text.match(
      /\b(?:birthday|bday)(?:\s+(?:live\s*card|event\s+page|flyer(?:\/invitation)?|flyer\s+invitation|invitation|invite|product))+\s+([a-z][a-zA-Z'-]{1,30})\s*,?\s+\d{1,3}\b/i,
    );
    if (birthdayProductNameAge?.[1]) return titleCaseName(birthdayProductNameAge[1]);
  }

  if (previous?.eventType === "baby_shower" || /\b(?:baby\s+shower|sprinkle)\b/i.test(text)) {
    const showerFor =
      text.match(
        /\b(?:baby\s+shower|sprinkle)(?:\s+(?:product|event\s+page|live\s*card|flyer(?:\/invitation)?|flyer\s+invitation|invitation|invite))?\s+for\s+(.{2,80}?)(?=\s+(?:on|at|with|make|this|theme|tone|no\s+rsvps?|without|include|gift|registry)\b|[.;]|$)/i,
      ) ||
      text.match(/\bfor\s+(.{2,80}?)\s+(?:baby\s+shower|sprinkle)\b/i) ||
      text.match(/\b([A-Z][a-zA-Z' -]{1,60}?)\s+(?:baby\s+shower|sprinkle)\b/);
    const honoree = cleanHonoreePhrase(showerFor?.[1]);
    if (honoree) return honoree;
  }

  if (previous?.eventType === "bridal_shower" || /\bbridal\s+shower\b/i.test(text)) {
    const bridalFor =
      text.match(/\bbridal\s+shower\s+for\s+(.{2,80}?)(?=\s+(?:on|at|with|make|this|theme|tone|no\s+rsvps?|without|include|gift|registry)\b|[.;]|$)/i) ||
      text.match(/\bfor\s+(.{2,80}?)\s+bridal\s+shower\b/i) ||
      text.match(/\b([A-Z][a-zA-Z' -]{1,60}?)\s+bridal\s+shower\b/);
    const honoree = cleanHonoreePhrase(bridalFor?.[1]);
    if (honoree) return honoree;
  }

  if (previous?.eventType === "gender_reveal" || /\bgender\s+reveal\b/i.test(text)) {
    const revealFor =
      text.match(/\bgender\s+reveal\s+for\s+(.{2,80}?)(?=\s+(?:on|at|with|make|this|theme|tone|no\s+rsvps?|without|include|gift|registry)\b|[.;]|$)/i) ||
      text.match(/\bfor\s+(.{2,80}?)\s+gender\s+reveal\b/i) ||
      text.match(/\b([A-Z][a-zA-Z'-]{1,30}\s+(?:and|&)\s+[A-Z][a-zA-Z'-]{1,30})\s+gender\s+reveal\b/) ||
      text.match(/\b([A-Z][a-zA-Z' -]{1,60}?)\s+gender\s+reveal\b/);
    const honoree = cleanHonoreePhrase(revealFor?.[1]);
    if (honoree) return honoree;
  }

  if (previous?.eventType === "graduation" || /\b(?:graduation|graduate|class of)\b/i.test(text)) {
    const graduationFor =
      text.match(/\bgraduation(?:\s+(?:party|open\s+house|celebration))?\s+for\s+(.{2,80}?)(?=\s+(?:on|at|with|make|this|theme|tone|no\s+rsvps?|without|include|gift|registry)\b|[.;]|$)/i) ||
      text.match(/\bfor\s+(.{2,80}?)\s+(?:class\s+of\s+\d{4}\s+)?graduation\b/i) ||
      text.match(/\b([A-Z][a-zA-Z'-]{1,30})\s+(?:class\s+of\s+\d{4}\s+)?graduation\b/);
    const honoree = cleanHonoreePhrase(graduationFor?.[1]);
    if (honoree) return honoree;
  }

  const possessive = text.match(
    /\b([A-Z][a-zA-Z'-]{1,30})['’]s\s+(?:\d{1,3}(?:st|nd|rd|th)\s+)?(?:(?:baby|bridal)\s+)?(?:birthday|graduation|party|shower|gender\s+reveal|housewarming)\b/,
  );
  if (possessive?.[1]) return possessive[1];

  const turning = text.match(
    /\b([A-Z][a-zA-Z'-]{1,30})\s*,?\s+(?:(?:is\s+)?turning|turns)\s+\d{1,3}\b/i,
  );
  if (turning?.[1]) return titleCaseName(turning[1]);

  const commaName = text.match(/^\s*([A-Z][a-zA-Z'-]{1,30})\s*,\s*\d{1,3}\b/);
  if (commaName?.[1]) return commaName[1];

  return previous?.honoreeName || null;
}

function titleCaseName(value: string) {
  return value.replace(/\b([a-z])([a-zA-Z'-]*)/g, (_match, first: string, rest: string) => {
    return `${first.toUpperCase()}${rest}`;
  });
}

function cleanHonoreePhrase(value: string | null | undefined) {
  const cleaned = cleanString(
    value
      ?.replace(/[.!?]+$/g, "")
      .replace(/^(?:for|of)\s+/i, "")
      .replace(/^(?:baby\s+shower|bridal\s+shower|gender\s+reveal|graduation)\s+/i, "")
      .replace(/^(?:QA\s+|test\s+)/i, ""),
  );
  if (!cleaned || cleaned.length > 80) return null;
  if (isCommandOnlyDraftUpdate(cleaned)) return null;
  if (looksLikeCreationPrompt(cleaned) || isInstructionFragment(cleaned)) return null;
  if (
    /\b(?:date|time|location|venue|rsvp|registry|http|www|theme|tone|gift|gifts?|link|collect|skip|yes|no)\b/i.test(
      cleaned,
    )
  ) {
    return null;
  }
  return titleCaseName(cleaned)
    .replace(/\bAnd\b/g, "and")
    .replace(/\bOf\b/g, "of");
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
  if (isCommandOnlyDraftUpdate(cleaned)) return null;
  if (/^(?:yes|no|yep|yeah|nope|ok|okay|sure|please)$/i.test(cleaned)) return null;
  if (/\b(?:ignore|last|weird|request|keep going|continue|nevermind|never mind)\b/i.test(cleaned)) {
    return null;
  }
  if (
    /\b(at|@|venue|location|home|house|park|gym|school|restaurant|saturday|sunday|monday|tuesday|wednesday|thursday|friday|january|february|march|april|may|june|july|august|september|october|november|december|birthday|party|theme|rsvp|registry|gift|gifts?|link|collect|guests?|family)\b/i.test(
      cleaned,
    )
  ) {
    return null;
  }
  if (
    /\b(vibe|tone|style|theme|balloons?|rainbow|pastels?|elegant|luxury|formal|classic|romantic|soft|sweet|fun|playful|colorful|modern|minimal|bold|whimsical|rustic|floral|bright|simple|casual|sporty|neon|dinosaur|princess|space)\b/i.test(
      cleaned,
    )
  ) {
    return null;
  }
  if (!/^[a-zA-Z][a-zA-Z' -]{0,58}$/.test(cleaned)) return null;
  return titleCaseName(cleaned);
}

function birthdayHonoreeCandidatesFromDraft(draft: ConciergeEventDraft) {
  if (draft.eventType !== "birthday") return [];
  const text = [draft.eventPurpose, draft.title, draft.previewCopy?.headline]
    .map((value) => cleanString(value))
    .filter(Boolean)
    .join(" ");
  const match = text.match(
    /\b([A-Z][a-zA-Z'-]{1,30})\s+(?:and|&)\s+([A-Z][a-zA-Z'-]{1,30})\s+(?:\d{1,3}(?:st|nd|rd|th)\s+)?(?:birthday|bday)\b/,
  );
  const first = cleanString(match?.[1]);
  const second = cleanString(match?.[2]);
  return first && second ? [first, second] : [];
}

function detectTheme(text: string, previous?: ConciergeEventDraft | null) {
  const labeledTheme = findLabeledDetailValue(text, ["theme"]);
  if (labeledTheme && !isInstructionFragment(labeledTheme)) return labeledTheme;

  const themeAndTone = text.match(/\btheme\s+and\s+tone\s*:\s*([^.\n;]{2,160})/i);
  const themeAndToneValue = cleanString(themeAndTone?.[1]?.replace(/[.!?]+$/g, ""));
  if (themeAndToneValue && !isInstructionFragment(themeAndToneValue)) {
    return themeAndToneValue;
  }

  const interestParts = [
    text.match(/\b(?:watch|see)\s+([^,.;\n]{2,70}?)\s+(?:at|@)\b/i)?.[1],
    text.match(/\b(?:likes?|loves?|is\s+into)\s+([^.;\n]{2,90})/i)?.[1],
  ]
    .map((value) =>
      cleanString(value?.replace(/[.!?]+$/g, "").replace(/\s+(?:theme|style|vibe)$/i, "")),
    )
    .filter((value): value is string =>
      Boolean(
        value &&
          !/^(?:you|everyone|guests?|friends?|family|us)$/i.test(value) &&
          !isInstructionFragment(value),
      ),
    );
  if (interestParts.length) return Array.from(new Set(interestParts)).join(", ");

  const teamEnergy = text.match(
    /\bwith\s+([a-z]+(?:\s+and\s+[a-z]+)?(?:\s+(?:team|school))?\s+(?:energy|colors?|spirit|vibe|theme|style))\b/i,
  );
  if (teamEnergy?.[1] && !isInstructionFragment(teamEnergy[1])) {
    return cleanString(teamEnergy[1]) || previous?.theme || null;
  }

  const themeMatch =
    text.match(/\b(?:make it|theme|style|with a)\s+([a-z0-9][a-z0-9 '&-]{1,50})(?:\s+theme)?\b/i) ||
    text.match(
      /\b(unicorn|princess|dinosaur|space|garden|floral|rustic|modern|sparkle|rainbow|sports|football|basketball|ballet)\b/i,
    );
  const raw = themeMatch?.[1] || themeMatch?.[0];
  const cleaned = cleanString(raw)?.replace(/\s+theme$/i, "") || null;
  if (!cleaned || isInstructionFragment(cleaned)) return previous?.theme || null;
  return cleaned;
}

function joinCreativeDirectionParts(parts: string[]) {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const part of parts) {
    const cleaned = cleanString(part);
    if (!cleaned || isInstructionFragment(cleaned)) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(cleaned);
  }
  return unique.join(" ");
}

function detectLabeledCreativeDirection(text: string) {
  const movie = findLabeledDetailValue(text, ["movie"]);
  const theme = findLabeledDetailValue(text, ["theme"]);
  const scene = findLabeledDetailValue(text, ["scene"]);
  const style = findLabeledDetailValue(text, ["style"]);
  const layout = findLabeledDetailValue(text, ["layout"]);
  const direction = joinCreativeDirectionParts(
    [
      movie ? `Movie: ${movie}.` : "",
      theme ? `Theme: ${theme}.` : "",
      scene ? `Scene: ${scene}.` : "",
      style ? `Style: ${style}.` : "",
      layout ? `Layout: ${layout}.` : "",
    ].filter(Boolean),
  );
  return direction || null;
}

function detectGuestCount(text: string, previous?: ConciergeEventDraft | null) {
  const expectsGuestCount = firstMissingField(previous) === "numberOfGuests";
  const explicit =
    text.match(
      /\brsvps?\s+for\s+(\d{1,4})\s*(?:guests?|kids?|children|peoples?|attendees|invitees|famil(?:y|ies))\b/i,
    ) ||
    text.match(
      /\b(?:guest count|guest list|guests?|kids?|children|peoples?|attendees|invitees)\s*(?:is|should be|:)?\s*(\d{1,4})\b/i,
    ) ||
    text.match(/\b(\d{1,4})\s*(?:guests?|kids?|children|peoples?|attendees|invitees)\b/i) ||
    text.match(/\b(?:yes\s+)?(?:collect|track|include|enable|add)\s+(?:rsvps?\s+)?(?:for\s+)?(?:about\s+)?(\d{1,4})\b/i);
  const contextual = expectsGuestCount
    ? text.match(
        /\b(?:yes\s+)?(?:collect|track|include|cap|count)\s+(?:rsvps?\s+)?(?:for\s+)?(?:about\s+)?(\d{1,4})\b/i,
      ) || text.match(/^\s*(?:yes[, ]+)?(?:about\s+)?(\d{1,4})\s*$/i)
    : null;
  const plain = expectsGuestCount ? text.match(/^\s*(\d{1,4})\s*$/) : null;
  const raw = explicit?.[1] || contextual?.[1] || plain?.[1];
  if (raw) {
    const count = Number.parseInt(raw, 10);
    if (Number.isFinite(count) && count > 0 && count <= 9999) return count;
  }
  return previous?.numberOfGuests || null;
}

function detectRsvpEnabled(
  text: string,
  previous: ConciergeEventDraft | null,
  requestedOutputs: RequestedOutput[],
  fieldsGuess: Record<string, unknown>,
): boolean | null {
  const nestedRsvp =
    fieldsGuess.rsvp && typeof fieldsGuess.rsvp === "object" && !Array.isArray(fieldsGuess.rsvp)
      ? (fieldsGuess.rsvp as Record<string, unknown>)
      : {};
  const fieldsValue = firstBoolean(
    fieldsGuess.rsvpEnabled,
    fieldsGuess.isRsvpEnabled,
    nestedRsvp.enabled,
    nestedRsvp.isEnabled,
  );
  if (fieldsValue !== null) return fieldsValue;

  const cleaned = cleanString(text.replace(/[.!?]+$/g, "")) || "";
  if (
    /^(no|nope|skip|skip it|not needed|no rsvp|no rsvps|don't|do not|leave it off)$/i.test(
      cleaned,
    ) ||
    /\b(?:without|no|skip|disable|don't|do not)\s+(?:envitefy\s+)?rsvps?\b/i.test(text)
  ) {
    return false;
  }

  if (requestedOutputs.includes("rsvp_page")) return true;

  const expectsRsvpDecision = firstMissingField(previous) === "rsvpEnabled";
  if (expectsRsvpDecision) {
    if (
      /^(yes|yep|yeah|sure|please|yes please)\b/i.test(cleaned) ||
      /^(yes|yep|yeah|sure|please|yes please|include it|add it|turn it on|enable it|collect rsvps?|track rsvps?)$/i.test(
        cleaned,
      ) ||
      /^(?:yes|yep|yeah|sure|please|yes please)[,\s]+(?:for\s+)?\d{1,4}\s*(?:guests?|kids?|children|peoples?|attendees|invitees|famil(?:y|ies))?$/i.test(
        cleaned,
      )
    ) {
      return true;
    }
    if (
      /^(no|nope|skip|skip it|not needed|no rsvp|no rsvps|don't|do not|leave it off)$/i.test(
        cleaned,
      )
    ) {
      return false;
    }
  }

  if (
    /\b(?:with|include|enable|collect|track|add)\s+(?:envitefy\s+)?rsvps?\b/i.test(text) ||
    /\b(?:yes\s+)?(?:collect|track|include|enable|add)\s+(?:rsvps?\s+)?(?:for\s+)?\d{1,4}\b/i.test(
      text,
    ) ||
    /\brsvps?\s+for\s+\d{1,4}\b/i.test(text) ||
    /\brsvp\s+(?:page|tracking|collection|responses?)\b/i.test(text) ||
    /\brsvp\s+(?:contact|deadline)\b/i.test(text) ||
    /\b(?:rsvp|respond)\s+by\b/i.test(text) ||
    /\brsvps?\s+(?:directly|on|through)\b/i.test(text)
  ) {
    return true;
  }

  return previous?.rsvpEnabled ?? null;
}

const RSVP_PHONE_PATTERN = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/;
const RSVP_GUEST_COUNT_UNIT_PATTERN =
  "guests?|kids?|children|peoples?|attendees|invitees|famil(?:y|ies)";

function extractRsvpIdentityParts(value: unknown): { name: string | null; contact: string | null } {
  const source = cleanString(value);
  if (!source) return { name: null, contact: null };

  const email = source.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || null;
  const phone = source.match(RSVP_PHONE_PATTERN)?.[0] || null;
  const contact = email || phone;
  if (!contact) return { name: null, contact: null };

  const contactIndex = source.toLowerCase().indexOf(contact.toLowerCase());
  const beforeContact = contactIndex > 0 ? source.slice(0, contactIndex) : "";
  const explicitRsvpPrefix = new RegExp(
    `\\brsvps?\\s+(?:for\\s+)?\\d{1,4}\\s*(?:${RSVP_GUEST_COUNT_UNIT_PATTERN})?\\b\\s*,?\\s*(?:to|for|with|by|at)?\\s*([^,.;\\n]{2,80}?)\\s*(?:at|by|via|phone|email)?\\s*$`,
    "i",
  );
  const rsvpTailName = cleanString(beforeContact.match(explicitRsvpPrefix)?.[1]);
  const name = cleanString(
    (rsvpTailName || beforeContact)
      .replace(/^(?:yes|yep|yeah|sure|please|yes please)\b[\s,]*/i, "")
      .replace(
        new RegExp(
          `^(?:for\\s+)?\\d{1,4}\\s*(?:${RSVP_GUEST_COUNT_UNIT_PATTERN})?\\b[\\s,]*`,
          "i",
        ),
        "",
      )
      .replace(/^(?:rsvps?|rsvp)?\s*(?:contact|host|name)?\s*(?:at|is|:)?\s*/i, "")
      .replace(/^(?:at|by|for|to)\s+/i, "")
      .replace(/\b(?:at|is|for|rsvp|contact|host|name)\s*$/i, "")
      .replace(/[,:;\s]+$/g, ""),
  );

  return { name, contact };
}

function detectRsvpDeadline(text: string, previous?: ConciergeEventDraft | null) {
  const match =
    text.match(/\brsvp\s+(?:deadline|due|responses?\s+due)\s*:?\s*([^.\n;]{2,80})/i) ||
    text.match(/\b(?:rsvp|respond)\s+by\s+([^.\n;]{2,80})/i);
  const deadline = cleanString(match?.[1]?.replace(/[.!?]+$/g, ""));
  return deadline || previous?.rsvpDeadline || null;
}

function detectRsvpName(
  text: string,
  fieldsGuess: Record<string, unknown>,
  previous?: ConciergeEventDraft | null,
) {
  if (isLocationCorrectionMessage(text)) return previous?.rsvpName || null;
  const rsvpContactCorrectionName = text.match(/\brsvp\s+contact\s+should\s+be\s+([^@\d,.;]+?)(?:\s+at\s+|\s+\d|[,.;]|$)/i)?.[1];
  if (rsvpContactCorrectionName) return cleanString(rsvpContactCorrectionName);
  const direct = firstString(fieldsGuess.rsvpName, fieldsGuess.hostName, fieldsGuess.host);
  if (direct) return direct;
  if (previous?.rsvpName && previous.currentQuestion !== "rsvpName") return previous.rsvpName;
  const explicit =
    text.match(
      /\b(?:rsvp\s+name|rsvp\s+contact\s+name|hosted\s+by|host|organizer)\s*:?\s*([^.\n;]{2,80})/i,
    ) ||
    text.match(/\bhosted\s+by\s+([^.\n;]{2,80})/i);
  const explicitIdentity = extractRsvpIdentityParts(explicit?.[1]);
  const explicitName =
    explicitIdentity.name || cleanString(explicit?.[1]?.replace(/[.!?]+$/g, ""));
  if (explicitName) return explicitName;

  const identity = extractRsvpIdentityParts(text);
  if (
    identity.name &&
    (/\brsvps?\s+for\s+\d{1,4}\b/i.test(text) ||
      previous?.currentQuestion === "rsvpName" ||
      previous?.currentQuestion === "rsvpEnabled" ||
      previous?.currentQuestion === "numberOfGuests")
  ) {
    return identity.name;
  }
  if (previous?.currentQuestion === "rsvpName") {
    const reply = cleanString(
      text.replace(/^(?:hosted\s+by|host|organizer|rsvp\s+name)\s*:?\s*/i, ""),
    );
    if (reply && !/@/.test(reply) && !/\d{3}/.test(reply)) return reply;
  }
  return previous?.rsvpName || null;
}

function detectRsvpContact(
  text: string,
  fieldsGuess: Record<string, unknown>,
  previous?: ConciergeEventDraft | null,
) {
  if (isLocationCorrectionMessage(text)) return previous?.rsvpContact || null;
  const direct = firstString(fieldsGuess.rsvpContact, fieldsGuess.rsvpEmail, fieldsGuess.rsvpPhone);
  if (direct) return extractRsvpIdentityParts(direct).contact || direct;
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const phoneMatch = text.match(RSVP_PHONE_PATTERN)?.[0];
  if (previous?.currentQuestion === "rsvpContact") {
    const reply = cleanString(emailMatch || phoneMatch || text);
    if (reply) return reply;
  }
  const explicitEmail = text.match(
    /\brsvp\s+contact\s*:?\s*([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i,
  );
  if (explicitEmail?.[1]) return explicitEmail[1];
  const explicit = text.match(/\brsvp\s+contact\s*:?\s*([^.\n;]{3,120})/i);
  const email = explicit?.[1]?.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const contact = cleanString(
    email ||
      extractRsvpIdentityParts(explicit?.[1]).contact ||
      phoneMatch ||
      explicit?.[1]?.replace(/[.!?]+$/g, ""),
  );
  return contact || previous?.rsvpContact || null;
}

function detectRegistryLink(
  text: string,
  fieldsGuess: Record<string, unknown>,
  previous?: ConciergeEventDraft | null,
) {
  const direct = firstString(
    fieldsGuess.registryLink,
    fieldsGuess.registryUrl,
    fieldsGuess.giftRegistryLink,
    fieldsGuess.giftListLink,
    fieldsGuess.wishlistLink,
  );
  if (direct) return cleanUrlString(direct);
  const url = text.match(/\bhttps?:\/\/[^\s<>"')]+|\bwww\.[^\s<>"')]+/i)?.[0];
  if (url && previous && shouldOfferGiftRegistryPrompt(previous)) return cleanUrlString(url);
  if (!/\b(registry|gift\s*list|wishlist|wish\s*list|babylist|zola|target|amazon)\b/i.test(text)) {
    return null;
  }
  return cleanUrlString(url || "");
}

function detectGiftPreferenceNote(
  text: string,
  fieldsGuess: Record<string, unknown>,
  options: { allowBroadGiftNotes?: boolean } = {},
) {
  const direct = firstString(
    fieldsGuess.giftPreferenceNote,
    fieldsGuess.giftNote,
    fieldsGuess.registryNote,
    fieldsGuess.giftPreference,
  );
  if (direct) return direct;
  const noGifts = text.match(
    /\b(?:no gifts?|gifts?\s+(?:are\s+)?optional|your presence is (?:our|the) gift|gift cards?(?:\s+(?:are\s+)?(?:preferred|welcome|okay|ok|fine))?)\b[^.!,;]*/i,
  );
  if (noGifts?.[0]) return cleanString(noGifts[0]);
  if (!options.allowBroadGiftNotes) return null;
  const giftNote = text.match(
    /\b(?:books?|art supplies|diapers?|board books?|gift cards?|snacks?|side dish|bring yourself|bring a snack|supplies)\b[^.!,;]*/i,
  );
  return cleanString(giftNote?.[0] || "");
}

function hasGiftDetails(draft: ConciergeEventDraft | null | undefined) {
  return Boolean(
    draft?.registryLink || draft?.giftRegistryLink || draft?.giftPreferenceNote || draft?.giftNote,
  );
}

function shouldOfferGiftRegistryPrompt(draft: ConciergeEventDraft | null | undefined) {
  if (!draft) return false;
  return Boolean(
    draft.ownership !== "invited" &&
      draft.sourceContext.detectedSourceIntent !== "received_invite" &&
      draft.draftStatus === "preview_ready" &&
      !draft.currentQuestion &&
      draft.missingFields.length === 0 &&
      GIFT_FRIENDLY_EVENT_TYPES.has(draft.eventType) &&
      draft.requestedOutputs.some((output) => GIFT_REGISTRY_OUTPUTS.has(output)) &&
      !hasGiftDetails(draft) &&
      !draft.giftPromptDismissed,
  );
}

function giftRegistryLabel(draft: ConciergeEventDraft) {
  return GIFT_LIST_EVENT_TYPES.has(draft.eventType) ? "Gift list" : "Registry";
}

function optionalGiftRegistryPrompt(draft: ConciergeEventDraft) {
  if (!shouldOfferGiftRegistryPrompt(draft)) return null;
  const noun = GIFT_LIST_EVENT_TYPES.has(draft.eventType)
    ? "gift list, wishlist, gift-card preference, or no-gifts note"
    : "registry, gift list, wishlist, gift-card preference, or no-gifts note";
  return `Optional: do you have a ${noun} to include? Paste a link, mention gift cards, create one on Amazon, or skip it for now.`;
}

function isGiftPromptSkipReply(message: string) {
  const normalized = message.trim().replace(/[.!?]+$/g, "");
  return /^(?:skip|skip it|skip gift link|skip registry|not now|no thanks|leave it off|no link|no registry|no gift link|no wishlist|none)$/i.test(
    normalized,
  );
}

function isAmazonRegistryCreateReply(message: string) {
  const trimmed = message.trim();
  return (
    /^create on amazon$/i.test(trimmed) ||
    /\b(?:create|open|start|make|set up)\b.+\bamazon\b.+\b(?:registry|gift\s*list|wishlist|wish\s*list|list)\b/i.test(
      trimmed,
    ) ||
    /\bamazon\b.+\b(?:registry|gift\s*list|wishlist|wish\s*list)\b/i.test(trimmed)
  );
}

function isVagueCreativeRefinement(message: string) {
  const text = cleanString(message) || "";
  return (
    /\b(?:less generic|more premium|more polished|make it better|make it nicer|improve it|not so generic|look better)\b/i.test(
      text,
    ) ||
    /^can you make it\b/i.test(text)
  );
}

function isDraftLogisticsAside(message: string) {
  const text = cleanString(message) || "";
  return (
    /\b(?:might|may|probably|maybe)\s+change\b[\s\S]{0,60}\b(?:location|date|time|venue|address)\b/i.test(
      text,
    ) ||
    /\b(?:not sure|unsure)\b[\s\S]{0,60}\b(?:location|venue|address)\b/i.test(text) ||
    /\b(?:location|venue|address)\s+(?:tbd|may be updated|might change|can change)\b/i.test(text)
  );
}

function isIgnorePreviousRequestAside(message: string) {
  const text = cleanString(message) || "";
  return /\b(?:ignore|forget|drop)\b[\s\S]{0,60}\b(?:last|previous|weird)\b[\s\S]{0,60}\b(?:request|thing|message)?\b/i.test(
    text,
  );
}

function isReadyStatusQuestion(message: string) {
  const text = cleanString(message) || "";
  return /\b(?:anything else|what else|need anything else|all set|are we done|ready)\b/i.test(text);
}

function conversationStateFor(
  draft: ConciergeEventDraft,
  previous: ConciergeEventDraft | null | undefined,
  message: string,
) {
  return updateConversationState({ draft, previous, message });
}

function withConversationState(
  draft: ConciergeEventDraft,
  previous: ConciergeEventDraft | null | undefined,
  message: string,
): ConciergeEventDraft {
  return {
    ...draft,
    conversationState: conversationStateFor(draft, previous, message),
  };
}

function missingDetailForUser(field: string | null | undefined) {
  if (field === "rsvpEnabled") return "whether you want RSVPs";
  if (field === "numberOfGuests") return "the RSVP guest count";
  if (field === "rsvpName") return "the RSVP host name";
  if (field === "rsvpContact") return "the RSVP contact";
  if (field === "honoreeName") return "the name to feature";
  if (field === "ageOrMilestone") return "the age or milestone";
  if (field === "date") return "the date";
  if (field === "time") return "the time";
  if (field === "location") return "the location";
  if (field === "tone") return "the vibe";
  return field || "one detail";
}

function duplicateEventInputMessage(draft: ConciergeEventDraft) {
  const missing = draft.currentQuestion || draft.missingFields[0];
  if (missing) {
    return `I already have those details saved — we’re just missing ${missingDetailForUser(missing)}.`;
  }
  return draft.canPersist
    ? "I already have those details saved — everything still looks ready."
    : "I already have that saved. We’re almost there.";
}

function detectTone(text: string, previous?: ConciergeEventDraft | null) {
  const expectsTone = firstMissingField(previous) === "tone";
  if (
    isVagueCreativeRefinement(text) ||
    isDraftLogisticsAside(text) ||
    isIgnorePreviousRequestAside(text)
  ) {
    return previous?.tone || null;
  }
  if (
    expectsTone &&
    /\b(?:yes|no|yep|nope|collect|track|include|enable|skip|no\s+rsvps?|rsvps?)\b/i.test(text)
  ) {
    return previous?.tone || null;
  }
  if (expectsTone) {
    const cleaned = cleanString(
      text
        .replace(/[.!?]+$/g, "")
        .replace(/^(?:make|keep|use)\s+(?:it|this|the\s+invite|the\s+card)?\s*/i, ""),
    );
    if (cleaned && cleaned.length <= 140 && !isInstructionFragment(cleaned)) {
      return cleaned;
    }
  }
  const labeledCreativeDirection = detectLabeledCreativeDirection(text);
  if (labeledCreativeDirection) return labeledCreativeDirection;

  const explicit =
    text.match(
      /\b(?:vibe|tone|feel|mood)\s*(?:is|should be|as|:)?\s+([a-z0-9][a-z0-9 '&-]{1,70})\b/i,
    ) ||
    text.match(
      /\b(?:make it|keep it|make the invite|make the card)\s+([a-z0-9][a-z0-9 '&-]{1,70})\b/i,
    );
  const known = text.match(
    /\b(elegant|luxury|formal|classic|romantic|soft|sweet|fun|playful|colorful|modern|minimal|bold|whimsical|rustic|floral|bright|simple|casual|sporty)\b(?:\s+(?:and|&)\s+\b(elegant|luxury|formal|classic|romantic|soft|sweet|fun|playful|colorful|modern|minimal|bold|whimsical|rustic|floral|bright|simple|casual|sporty)\b)?/i,
  );
  const raw = explicit?.[1] || (known ? known[0] : null);
  const cleanedRaw = raw ? cleanString(raw.replace(/[.!?]+$/g, "")) : null;
  if (cleanedRaw && !isInstructionFragment(cleanedRaw)) return cleanedRaw;
  if (expectsTone) {
    const cleaned = cleanString(text.replace(/[.!?]+$/g, ""));
    if (
      cleaned &&
      cleaned.length <= 80 &&
      !looksLikeInternalCreativeDirection(cleaned) &&
      !/\b(?:vibe|tone|theme|style)\b/i.test(cleaned)
    ) {
      return cleaned;
    }
  }
  return previous?.tone || null;
}

function shouldStartFreshEvent(message: string, previous?: ConciergeEventDraft | null) {
  if (!previous) return false;
  const text = cleanString(message) || "";
  if (isWeatherSideQuestion(text)) return false;
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
  return /\b(birthday|wedding|baby\s+shower|gender\s+reveal|bridal\s+shower|graduation|gymnastics|gym\s+meet|game\s+day|football|field\s+trip|open\s+house|housewarming|party|event|ceremony|fundraiser|meeting|workshop|appointment)\b/i.test(
    text,
  );
}

function isOffTopicInterruption(message: string) {
  const text = cleanString(message) || "";
  return /\b(?:database\s+joke|capital\s+of|breakup\s+text|recipe|pancakes?)\b/i.test(text);
}

function isWeatherSideQuestion(message: string) {
  const text = cleanString(message) || "";
  return /\b(weather|forecast|temperature|temp|rain|raining|storm|snow|wind|hot|cold|humid|outdoor|outside)\b/i.test(
    text,
  );
}

function isPrivateDataMutationRequest(message: string) {
  const text = cleanString(message) || "";
  return (
    /\b(change|update|set|modify|switch|show|reveal|expose|give|send|tell|put|include|add|publish|bypass|make|what\s+is|what's)\b/i.test(
      text,
    ) &&
    /\b(user[_\s-]?id|owner[_\s-]?id|ownership|account owner|private data|guest emails?|password|api\s*key|private\s*key|session\s*token|auth\s*token|secret|door\s+code|access\s+code|gate\s+code|bypass\s+login|another\s+user\s+account|spouse\s+account|creator\s+email|belong\s+to\s+another\s+user)\b/i.test(
      text,
    )
  );
}

const GENERATE_CONFIRMATION_RE =
  /^(yes|yep|yeah|sure|please|go ahead|generate|generate it|create it|make it|do it|let'?s go)$/i;

function isGenerateConfirmationReply(message: string) {
  return GENERATE_CONFIRMATION_RE.test((cleanString(message) || "").replace(/[.!?]+$/g, ""));
}

function isDeferralOrUnclearReply(message: string) {
  const text = (cleanString(message) || "").replace(/[.!?]+$/g, "");
  return /^(not sure|i'?m not sure|unsure|i don'?t know|dont know|idk|unknown|tbd|later|not yet|skip for now|leave it blank|decide later|we can decide later)$/i.test(
    text,
  );
}

function asksEnvitefyKnowledgeQuestion(message: string) {
  const text = cleanString(message) || "";
  if (!text) return false;
  if (isGenerateConfirmationReply(text)) return false;
  const hasQuestionShape =
    /[?]$/.test(text) ||
    /^(what|how|can|could|does|do|is|are|will|where|why|tell me|explain)\b/i.test(text);
  if (!hasQuestionShape) return false;
  if (/\b(create|make|build|generate|draft|design|publish|turn this into)\b/i.test(text)) {
    return false;
  }
  return /\b(envitefy|concierge|rsvp|live\s*card|event\s+page|flyer|invitation|invite|registry|gift\s*list|wishlist|smart\s+sign[-\s]?up|signup|upload|snap|ocr|my\s+events|invited\s+events|guest\s+page|public\s+event|calendar|passcode)\b/i.test(
    text,
  );
}

function isStatePreservingConversationMessage(
  message: string,
  previous?: ConciergeEventDraft | null,
) {
  if (!previous) return false;
  const text = cleanString(message) || "";
  if (!text) return false;
  if (/\b(create|make|build|generate|draft|design|change|update|set|switch)\b/i.test(text)) {
    return false;
  }
  if (hasLikelyAnswerForCurrentDraftQuestion(text, previous)) return false;
  return (
    /^(are you here|you there|hello\??|hi\??|who are you|what are you|why would i do that)\??$/i.test(
      text,
    ) ||
    /\b(i\s+(already\s+)?gave\s+you\s+the\s+name|you\s+already\s+(asked|have)\s+(for\s+)?rsvp|forgot\s+rsvp|dropped\s+(the\s+)?rsvp|you\s+(lost|dropped|forgot)\s+(the\s+)?(?:rsvp|name|guest count|details?))\b/i.test(
      text,
    )
  );
}

function hasLikelyAnswerForCurrentDraftQuestion(message: string, previous?: ConciergeEventDraft | null) {
  const field = firstMissingField(previous);
  const text = cleanString(message) || "";
  if (!field || !text) return false;
  if (field === "date" || field === "time" || field === "date_confirmation") {
    return /\b(?:today|tomorrow|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday|jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)|\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?))\b/i.test(
      text,
    );
  }
  if (field === "location") {
    return Boolean(detectVenueOrLocation(text) || detectLocationFollowUp(text, previous));
  }
  if (field === "numberOfGuests") {
    return /\b\d{1,4}\s*(?:guests?|peoples?|kids|children|attendees|invitees)\b/i.test(text);
  }
  return false;
}

function pendingDetailLine(previous?: ConciergeEventDraft | null) {
  const field = cleanString(previous?.currentQuestion) || cleanString(previous?.missingFields?.[0]);
  if (!field) return null;
  const label =
    field === "honoreeName"
      ? "featured name"
      : field === "ageOrMilestone"
        ? "age or milestone"
        : field === "what_are_we_celebrating"
          ? "event to celebrate"
          : field === "rsvpEnabled"
            ? "RSVP choice"
            : field === "numberOfGuests"
              ? "RSVP guest count"
              : field === "eventPurpose"
                ? "event purpose"
                : field;
  return `For this draft, I still need the ${label}.`;
}

function currentDraftContinuation(draft: ConciergeEventDraft) {
  if (!draft.currentQuestion) {
    return readyVerificationMessage(draft);
  }
  return buildAssistantMessage({
    ...draft,
    knowledgeAnswer: null,
    assistantGuidance: null,
    sourceContext: {
      ...draft.sourceContext,
      boundary:
        draft.sourceContext.boundary === "envitefy_question" ? null : draft.sourceContext.boundary,
    },
  });
}

function buildStatePreservingConversationAnswer(message: string, previous: ConciergeEventDraft) {
  const text = cleanString(message) || "";
  let opener = "I still have the current draft details.";
  if (/^(are you here|you there|hello\??|hi\??)$/i.test(text)) {
    opener = "Yes - I'm here.";
  } else if (/^(who are you|what are you)\??$/i.test(text)) {
    opener = "I'm Envitefy's event concierge, here to shape this event product with you.";
  } else if (/\bi\s+(already\s+)?gave\s+you\s+the\s+name\b/i.test(text)) {
    opener = previous.honoreeName
      ? `You're right - I have ${previous.honoreeName} as the featured name.`
      : "You're right to call that out. I do not have a usable featured name saved yet.";
  } else if (
    /\b(?:you\s+already\s+(?:asked|have)\s+(?:for\s+)?rsvp|forgot\s+rsvp|dropped\s+(?:the\s+)?rsvp|you\s+(?:lost|dropped|forgot)\s+(?:the\s+)?rsvp)\b/i.test(
      text,
    )
  ) {
    opener =
      previous.rsvpEnabled === true
        ? previous.numberOfGuests
          ? `You're right - I have RSVP enabled with a guest count of ${previous.numberOfGuests}.`
          : "You're right - I have RSVP enabled."
        : previous.rsvpEnabled === false
          ? "You're right - I have RSVP turned off."
          : "You're right to check. I do not have an RSVP choice saved yet.";
  } else if (/^why would i do that\??$/i.test(text)) {
    opener =
      "Generating creates the actual shareable invite from these saved details, including the visual style once you provide it.";
  }
  return [opener, currentDraftContinuation(previous)].filter(Boolean).join("\n\n");
}

function buildEnvitefyKnowledgeAnswer(message: string, previous?: ConciergeEventDraft | null) {
  const text = cleanString(message) || "";
  const lower = text.toLowerCase();
  let answer: string;
  if (/\brsvp|respond|response|guest count|yes,?\s*no,?\s*or maybe\b/i.test(lower)) {
    answer =
      "Envitefy RSVP lets guests respond from the event link with yes, no, or maybe. For hosts, it keeps the count attached to the event instead of buried in texts or group chats.";
  } else if (/\bevent\s+page|website|guest\s+page|public\s+event\b/i.test(lower)) {
    answer =
      "An Envitefy event page is a public guest-facing website for the event: details, schedule, location, calendar actions, RSVP when enabled, and registry or gift links when you provide them.";
  } else if (/\blive\s*card|card\b/i.test(lower)) {
    answer =
      "A live card is the polished invite surface guests open from a link. It keeps the visual invitation, event details, calendar/location actions, and RSVP together.";
  } else if (/\bflyer|invitation|invite\b/i.test(lower)) {
    answer =
      "Flyer/invitation products are visual invites built from your event details and style direction. They can still connect guests to the live event details instead of being only a static image.";
  } else if (/\bregistry|gift\s*list|wishlist|no gifts?|gift\b/i.test(lower)) {
    answer =
      "Envitefy can show registry, wishlist, gift-list, or no-gifts notes on supported social event pages and invites when you provide the link or wording.";
  } else if (/\bsmart\s+sign[-\s]?up|signup|sign[-\s]?up\b/i.test(lower)) {
    answer =
      "Smart sign-up is for collecting volunteers, items, time slots, or responses around an event. It is separate from a simple RSVP because guests can claim specific spots or needs.";
  } else if (/\bupload|snap|ocr|photo|pdf|image\b/i.test(lower)) {
    answer =
      "Uploads and snaps help Envitefy read existing event material. Classic received invite cards belong in Invited events; flyers, schedules, and authoring material for your own event become My events.";
  } else if (/\bmy\s+events|invited\s+events|owned|received\b/i.test(lower)) {
    answer =
      "My events are events you are creating or hosting. Invited events are received invite-card cases, like a birthday, wedding, or gender reveal invite someone sent you.";
  } else if (/\bcalendar|google|apple|outlook\b/i.test(lower)) {
    answer =
      "Envitefy event links can give guests a clean place to view the date, time, and location, then add the event to their calendar when those details are available.";
  } else if (/\bpasscode|private|access\b/i.test(lower)) {
    answer =
      "Event passcodes restrict access to a shared event page. Guests unlock the page with the code, while owners can still manage the event from their workspace.";
  } else {
    answer =
      "Envitefy helps create and manage guest-facing event products: live cards, event pages, flyer invitations, RSVP pages, smart sign-ups, reminders, and related event assets.";
  }
  const pending = pendingDetailLine(previous);
  return pending ? `${answer}\n${pending}` : answer;
}

function isStandaloneLostContextReply(message: string) {
  const text = cleanString(message) || "";
  if (!text) return false;
  return /\b(?:you\s+already\s+asked|already\s+answered|already\s+told\s+you|i\s+already\s+gave|you\s+(?:lost|forgot|dropped)|earlier\s+draft|previous\s+draft)\b/i.test(
    text,
  );
}

function buildStandaloneLostContextAnswer(message: string) {
  const chronoResult = parseChrono(message);
  const location = detectVenueOrLocation(message);
  const details = [
    chronoResult.timeText || chronoResult.dateText,
    location ? `at ${location}` : null,
  ].filter(Boolean);
  const caught = details.length ? `, but I caught ${details.join(" ")}` : "";
  return `I do not have the earlier draft loaded here${caught}. What event should I attach that to?`;
}

function buildEmptyConversationDraft(args: {
  sessionDraft?: ConciergeEventDraft | null;
  requestedOutputs: RequestedOutput[];
  sourceContext: ConciergeEventDraft["sourceContext"];
  knowledgeAnswer: string;
}): ConciergeEventDraft {
  return {
    intent: "unknown",
    creationSessionId: createCreationSessionId(args.sessionDraft),
    requestedOutputs: args.requestedOutputs,
    sourceContext: {
      ...args.sourceContext,
      boundary: "envitefy_question",
    },
    eventPurpose: null,
    eventType: "unknown",
    title: null,
    ownership: "unknown",
    draftStatus: "needs_source_or_event",
    currentQuestion: null,
    canPersist: false,
    honoreeName: null,
    relationship: null,
    ageOrMilestone: null,
    ageOrMilestoneSkipped: null,
    dateText: null,
    timeText: null,
    startISO: null,
    endISO: null,
    timezone: DEFAULT_TIMEZONE,
    location: null,
    venue: null,
    additionalLocations: [],
    rsvpEnabled: null,
    rsvpDeadline: null,
    rsvpName: null,
    rsvpContact: null,
    numberOfGuests: null,
    registryLink: null,
    giftPreferenceNote: null,
    giftPromptDismissed: null,
    theme: null,
    tone: null,
    knowledgeAnswer: args.knowledgeAnswer,
    assistantGuidance: null,
    outputs: toLegacyOutputs(args.requestedOutputs),
    missingFields: [],
    previewCopy: {
      headline: "Envitefy Concierge",
      subheadline: "Ask about event products, RSVP, uploads, or guest pages.",
      body: "Envitefy helps turn event details into shareable guest-facing products.",
      scheduleLine: "Date TBD",
      locationLine: "Location TBD",
      cta: "View details",
    },
    source: "text",
  };
}

function missingFieldLabel(field: string) {
  if (field === "honoreeName") return "featured name";
  if (field === "ageOrMilestone") return "age or milestone";
  if (field === "rsvpEnabled") return "whether RSVP should be on";
  if (field === "numberOfGuests") return "RSVP guest count";
  if (field === "eventPurpose") return "what the event is for";
  if (field === "sourceContext") return "source to use";
  return field;
}

function followUpForUnresolvedField(field: string, plan: ReturnType<typeof getRequirementPlan>) {
  if (field === "honoreeName") {
    return "Give me the name that should be featured on the invite, even if the rest stays flexible.";
  }
  if (field === "ageOrMilestone") {
    return "What age or milestone should I show, if any?";
  }
  if (field === "date") {
    return 'Even a rough date works, like "next Saturday" or "TBD for now."';
  }
  if (field === "time") {
    return 'A rough time is enough, like "afternoon," "6 PM," or "TBD for now."';
  }
  if (field === "location") {
    return 'Tell me the place, city, or venue. If it is not final, say the rough area or "TBD."';
  }
  if (field === "rsvpEnabled") {
    return "Should guests RSVP through Envitefy: yes or no?";
  }
  if (field === "numberOfGuests") {
    return 'A rough RSVP cap is enough here, like "10 guests" or "about 25."';
  }
  if (field === "tone") {
    return 'Give me a few words for the vibe and image direction, like "pink balloons," "movie theater neon," or "sweet pastels."';
  }
  return questionForRequirementField(field as RequirementField, plan);
}

function buildUnresolvedFieldGuidance(args: {
  message: string;
  draft: ConciergeEventDraft;
  previous?: ConciergeEventDraft | null;
}) {
  const previousField =
    cleanString(args.previous?.currentQuestion) || cleanString(args.previous?.missingFields?.[0]);
  const firstMissing = cleanString(args.draft.missingFields[0]);
  if (!previousField || !firstMissing || previousField !== firstMissing) return null;
  if (!cleanString(args.message)) return null;
  if (!isGenerateConfirmationReply(args.message) && !isDeferralOrUnclearReply(args.message)) {
    return null;
  }

  const missing = args.draft.missingFields.map(missingFieldLabel);
  const detailList =
    missing.length <= 1
      ? missing[0]
      : `${missing.slice(0, -1).join(", ")} and ${missing[missing.length - 1]}`;
  const verification = compactVerificationLines(args.draft).join("\n");
  const prefix = isGenerateConfirmationReply(args.message)
    ? `I can generate this once the missing detail is filled in. I still need ${detailList}.`
    : `No problem. I can keep this flexible, but I still need ${detailList} before generating.`;
  const plan = getRequirementPlan({
    eventType: args.draft.eventType,
    requestedOutputs: args.draft.requestedOutputs,
    sourceContext: args.draft.sourceContext,
  });
  const question = followUpForUnresolvedField(firstMissing, plan);
  return verification ? `${prefix}\n${verification}\n${question}` : `${prefix}\n${question}`;
}

function questionForMissingField(
  field: string,
  draft: ConciergeEventDraft,
  plan: ReturnType<typeof getRequirementPlan>,
) {
  if (field === "honoreeName" && draft.eventType === "birthday") {
    const candidates = birthdayHonoreeCandidatesFromDraft(draft);
    if (candidates.length === 2) {
      return `Should I feature ${candidates[0]}, ${candidates[1]}, or both for the birthday?`;
    }
  }
  if (hasAlreadyAsked(draft.conversationState, field)) {
    if (field === "honoreeName" && draft.eventType === "baby_shower") {
      return "Should I list the name already mentioned as the mom-to-be, or use the parents-to-be or baby’s name?";
    }
    if (field === "honoreeName" && draft.eventType === "graduation") {
      return "What graduate name should I feature on the invite?";
    }
  }
  if (
    draft.assistantGuidance &&
    cleanString(field) ===
      (cleanString(draft.currentQuestion) || cleanString(draft.missingFields[0]))
  ) {
    return followUpForUnresolvedField(field, plan);
  }
  return questionForRequirementField(field as RequirementField, plan);
}

function stripLeadingTimeFromLocation(value: string | null) {
  const cleaned = cleanString(value);
  if (!cleaned) return null;
  const withoutTime = cleaned.replace(
    /^\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?\s+(?:at|@)\s+/i,
    "",
  ).replace(
    /^\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?\s+(?:on\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow)\s+(?:at|@)\s+/i,
    "",
  );
  const withoutTrailingIntent = withoutTime
    .replace(
      /\s+(?:for|with)\s+(?:about\s+)?\d{1,4}\s*(?:guests?|kids?|children|peoples?|attendees|invitees)\b[\s\S]*$/i,
      "",
    )
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

type LabeledInviteDetails = {
  whenText: string | null;
  location: string | null;
  honoreeName: string | null;
};

const DETAIL_LABEL_PATTERN =
  "movie|when|date|time|where|venue|location|place|address|for|honoree|birthday\\s+for|name|after\\s+the\\s+movie|after\\s+movie|after|style|layout|theme|scene|invitation\\s+details";

function cleanLabeledDetailValue(value: unknown) {
  const cleaned = cleanString(value);
  if (!cleaned) return null;
  return (
    cleanString(
      cleaned
        .replace(new RegExp(`\\s+\\b(?:${DETAIL_LABEL_PATTERN})\\s*:[\\s\\S]*$`, "i"), "")
        .replace(/^[\s"'([]+|[\s"').,\]]+$/g, ""),
    ) || null
  );
}

function findLabeledDetailValue(text: string, labels: string[]) {
  if (!text) return null;
  const labelPattern = labels.join("|");
  const linePattern = new RegExp(`(?:^|[\\r\\n])\\s*(?:${labelPattern})\\s*:\\s*([^\\r\\n]+)`, "i");
  const lineMatch = text.match(linePattern);
  if (lineMatch?.[1]) return cleanLabeledDetailValue(lineMatch[1]);

  const inlinePattern = new RegExp(
    `\\b(?:${labelPattern})\\s*:\\s*([\\s\\S]{2,180}?)(?=\\s+\\b(?:${DETAIL_LABEL_PATTERN})\\s*:|[\\r\\n]|$)`,
    "i",
  );
  const inlineMatch = text.match(inlinePattern);
  return cleanLabeledDetailValue(inlineMatch?.[1]);
}

function detectLabeledInviteDetails(text: string): LabeledInviteDetails {
  const when = findLabeledDetailValue(text, ["when"]);
  const date = findLabeledDetailValue(text, ["date"]);
  const time = findLabeledDetailValue(text, ["time"]);
  const location = findLabeledDetailValue(text, ["where", "venue", "location", "place", "address"]);
  const honoreeName = cleanHonoreePhrase(
    findLabeledDetailValue(text, ["for", "honoree", "birthday\\s+for", "name"]),
  );
  const whenText =
    when ||
    (date && time ? `${date} at ${time}` : null) ||
    date ||
    time ||
    null;

  return {
    whenText,
    location,
    honoreeName,
  };
}

function isLocationCorrectionMessage(text: string) {
  return /\b(?:actually|instead|correction|change|update|move|switch)\b[\s\S]{0,120}\b(?:location|venue|place|address|where)\b/i.test(text) || /\b(?:correction|actually|instead)\b[\s\S]{0,40}\b(?:move|switch|change|update)\s+it\s+(?:to|at|@)\b/i.test(text);
}

function detectLocationCorrection(text: string) {
  if (!isLocationCorrectionMessage(text)) return null;
  const cleaned = cleanString(text?.replace(/[.!?]+$/g, "")) || "";
  const direct = cleaned.match(/\b(?:change|update|move|switch)\s+(?:the\s+)?(?:location|venue|place|address|where)\s+(?:to|as)\s+(.+)$/i)?.[1] || cleaned.match(/\b(?:location|venue|place|address)\s+(?:should\s+be|is|will\s+be)\s+(.+)$/i)?.[1] || cleaned.match(/\b(?:move|switch|change|update)\s+it\s+(?:to|at|@)\s+(.+)$/i)?.[1] ||
    cleaned.match(/\b(?:instead|actually)\s+(?:make\s+it\s+)?(?:at|@|to)\s+(.+)$/i)?.[1];
  const fallback = direct || detectVenueOrLocation(cleaned);
  return stripLeadingTimeFromLocation(fallback || null);
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

  const activityLocation = text.match(
    /\b(?:watch|see|meet|celebrate|party|gather|dinner|brunch|lunch)\b[^.\n]{0,90}?\b(?:at|@)\s+([^,.;\n]{2,100}(?:\s+in\s+[^,.;\n]{2,80})?)/i,
  );
  const activityLocationValue = stripLeadingTimeFromLocation(activityLocation?.[1] || null);
  if (activityLocationValue) return activityLocationValue;

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

const MULTI_LOCATION_LABELS =
  "ceremony|reception|cocktail\\s+hour|after[-\\s]?party|dinner|lunch|brunch|breakfast|pizza|meal|check[-\\s]?in|registration|pickup|drop[-\\s]?off|photos?";

function eventFactTextForLocationExtraction(value: string) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!cleanString(text)) return "";
  const invitationDetailsIndex = text.search(/\binvitation\s+details\s*:/i);
  if (invitationDetailsIndex >= 0) return text.slice(invitationDetailsIndex);
  return (
    cleanString(
      text
        .replace(/\b(?:she|he|they|[A-Z][a-z]+)\s+likes\b[\s\S]*$/i, "")
        .replace(/\b(?:theme|style|scene|visual\s+direction)\s*:[\s\S]*$/i, "")
        .replace(
          /(?:^|[,.]\s*)have\s+the\s+[^.\n,]{1,80}?\b(?:drinking|hugging|eating|holding|wearing|playing)\b[\s\S]*$/i,
          "",
        )
        .replace(
          /(?:^|[,.]\s*)(?:show|include|make)\s+[^.\n,]{1,80}?\b(?:drinking|hugging|eating|holding|wearing|playing)\b[\s\S]*$/i,
          "",
        ),
    ) || text
  );
}

function shouldPreservePreviousLocationDuringRsvpReply(
  message: string,
  previous?: ConciergeEventDraft | null,
) {
  if (!previous?.location && !previous?.venue) return false;
  if (isLocationCorrectionMessage(message)) return false;
  const currentField = firstMissingField(previous);
  if (
    currentField !== "rsvpEnabled" &&
    currentField !== "numberOfGuests" &&
    currentField !== "rsvpName" &&
    currentField !== "rsvpContact"
  ) {
    return false;
  }
  return !/\b(?:location|venue|where|place|address)\b\s*(?:is|:|will be|should be)?/i.test(
    message,
  );
}

function titleCaseLocationLabel(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeLocationCompare(value: string) {
  return value
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function cleanDetectedLocation(value: string | null) {
  const withoutLeadingTime = stripLeadingTimeFromLocation(cleanString(value) || null);
  return (
    cleanString(withoutLeadingTime)
      ?.replace(/\s+(?:and|then|next)\s*$/i, "")
      .replace(/^[\s"'([]+|[\s"').,\]]+$/g, "")
      .trim() || null
  );
}

function detectAdditionalLocations(
  text: string,
  primaryLocation: string | null,
  previous?: ConciergeEventDraft | null,
): ConciergeAdditionalLocation[] {
  const existing = Array.isArray(previous?.additionalLocations)
    ? previous.additionalLocations
    : [];
  const primaryKey = primaryLocation ? normalizeLocationCompare(primaryLocation) : "";
  const seen = new Set<string>();
  const locations: ConciergeAdditionalLocation[] = [];

  const add = (location: ConciergeAdditionalLocation) => {
    const display = [location.venue, location.location || location.address]
      .filter((value, index, values) => value && values.indexOf(value) === index)
      .join(", ");
    const key = normalizeLocationCompare(display || location.label || "");
    if (!key || key === primaryKey || seen.has(key)) return;
    seen.add(key);
    locations.push(location);
  };

  for (const location of existing) add(location);

  const pattern = new RegExp(
    `\\b(${MULTI_LOCATION_LABELS})\\b[^.\\n;]{0,80}?\\b(?:at|@)\\s+([^.\\n;]+?)(?=\\s+(?:and|then|next)\\s+(?:the\\s+)?(?:${MULTI_LOCATION_LABELS})\\b[^.\\n;]{0,40}?\\b(?:at|@)|[.;\\n]|$)`,
    "gi",
  );
  for (const match of text.matchAll(pattern)) {
    const label = titleCaseLocationLabel(match[1] || "Location");
    const location = cleanDetectedLocation(match[2] || "");
    if (!location) continue;
    add({
      label,
      venue: location,
      location,
      address: null,
      timeText: null,
      description: null,
      mapQuery: location,
    });
  }

  if (locations.length <= 1) return locations.slice(0, 8);
  const primaryDetectedKey = locations[0]
    ? normalizeLocationCompare(locations[0].location || locations[0].venue || "")
    : "";
  return locations
    .filter((location, index) => {
      if (index === 0 && primaryKey === primaryDetectedKey) return false;
      return true;
    })
    .slice(0, 8);
}

function detectPrimaryLabeledLocation(text: string) {
  const locations = detectAdditionalLocations(eventFactTextForLocationExtraction(text), null, null);
  if (locations.length < 2) return null;
  return locations[0]?.location || locations[0]?.venue || null;
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

function ordinalDay(day: number) {
  const suffix =
    day % 100 >= 11 && day % 100 <= 13
      ? "th"
      : day % 10 === 1
        ? "st"
        : day % 10 === 2
          ? "nd"
          : day % 10 === 3
            ? "rd"
            : "th";
  return `${day}${suffix}`;
}

function dateFromMonthDay(month: number, day: number) {
  const reference = new Date();
  let year = reference.getFullYear();
  let start = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (start.getMonth() !== month - 1 || start.getDate() !== day) return null;

  const today = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  if (start < today) {
    year += 1;
    start = new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return {
    dateText: `${MONTH_NAMES[month - 1]} ${ordinalDay(day)}`,
    timeText: null,
    startISO: start.toISOString(),
    endISO: end.toISOString(),
  };
}

function isDateConfirmationAffirmation(text: string) {
  return /^(yes|yep|yeah|correct|right|that'?s right|that is right|yes please|sounds right)$/i.test(
    text,
  );
}

function isDateConfirmationRejection(text: string) {
  return /^(no|nope|not quite|wrong|another date|something else|different date)$/i.test(text);
}

function detectAmbiguousDateConfirmation(
  text: string,
  previous?: ConciergeEventDraft | null,
): (ReturnType<typeof dateFromMonthDay> & { needsConfirmation: boolean }) | null {
  const cleaned = cleanString(text?.replace(/[.!?]+$/g, ""));
  if (!cleaned) return null;

  const activeQuestion = firstMissingField(previous);
  const expectsDate =
    activeQuestion === "date" ||
    activeQuestion === "time" ||
    previous?.currentQuestion === "date_confirmation";
  if (!expectsDate) return null;

  const mayTypo = cleaned.match(/^(my|may)\s+(\d{1,2})(d|st|nd|rd|th)?$/i);
  if (mayTypo) {
    const monthWord = mayTypo[1]?.toLowerCase();
    const suffix = mayTypo[3]?.toLowerCase() || "";
    const looksTypo = monthWord === "my" || suffix === "d";
    if (!looksTypo) return null;
    const day = Number.parseInt(mayTypo[2] || "", 10);
    const parsed = dateFromMonthDay(5, day);
    return parsed ? { ...parsed, needsConfirmation: true } : null;
  }

  const bareOrdinalTypo = cleaned.match(/^(\d{1,2})d$/i);
  if (bareOrdinalTypo) {
    const day = Number.parseInt(bareOrdinalTypo[1] || "", 10);
    const referenceMonth = new Date().getMonth() + 1;
    const parsed = dateFromMonthDay(referenceMonth, day);
    return parsed ? { ...parsed, needsConfirmation: true } : null;
  }

  return null;
}

function shouldPreferPmForBareHour(parsedText: string, hour: number) {
  if (hour < 1 || hour > 7) return false;
  if (/\b(?:a\.?m\.?|p\.?m\.?|morning|afternoon|evening|night|noon|midnight)\b/i.test(parsedText)) {
    return false;
  }
  return /\b(?:at|@)\s+\d{1,2}(?::\d{2})?\b/i.test(parsedText);
}

function parsedHasCalendarDate(parsed: chrono.ParsedResult) {
  return (
    parsed.start.isCertain("day") ||
    parsed.start.isCertain("month") ||
    parsed.start.isCertain("year") ||
    /\b(?:today|tomorrow|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday|jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i.test(
      parsed.text,
    )
  );
}

function combinePreviousDateWithParsedTime(args: {
  previous: ConciergeEventDraft;
  parsedStart: Date;
  parsedEnd: Date;
}) {
  const previousStart = new Date(args.previous.startISO || "");
  if (Number.isNaN(previousStart.getTime())) return null;

  const nextStart = new Date(previousStart);
  nextStart.setHours(args.parsedStart.getHours(), args.parsedStart.getMinutes(), 0, 0);
  const previousEnd = new Date(args.previous.endISO || "");
  const durationMs =
    !Number.isNaN(previousEnd.getTime()) && previousEnd.getTime() > previousStart.getTime()
      ? previousEnd.getTime() - previousStart.getTime()
      : args.parsedEnd.getTime() > args.parsedStart.getTime()
        ? args.parsedEnd.getTime() - args.parsedStart.getTime()
        : 2 * 60 * 60 * 1000;
  const nextEnd = new Date(nextStart.getTime() + durationMs);

  return {
    dateText: args.previous.dateText || null,
    timeText: nextStart.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    startISO: nextStart.toISOString(),
    endISO: nextEnd.toISOString(),
    needsConfirmation: false,
  };
}

function parseChrono(text: string, previous?: ConciergeEventDraft | null) {
  const cleaned = cleanString(text?.replace(/[.!?]+$/g, "")) || "";
  if (previous?.currentQuestion === "date_confirmation") {
    if (isDateConfirmationAffirmation(cleaned)) {
      return {
        dateText: previous.dateText || null,
        timeText: previous.timeText || null,
        startISO: previous.startISO || null,
        endISO: previous.endISO || null,
        needsConfirmation: false,
      };
    }
    if (isDateConfirmationRejection(cleaned)) {
      return {
        dateText: null,
        timeText: null,
        startISO: null,
        endISO: null,
        needsConfirmation: false,
      };
    }
  }

  const ambiguousDate = detectAmbiguousDateConfirmation(text, previous);
  if (ambiguousDate) return ambiguousDate;

  const parsed = chrono.parse(text, new Date(), { forwardDate: true });
  const first = parsed[0];
  if (!first) {
    return {
      dateText: previous?.dateText || null,
      timeText: previous?.timeText || null,
      startISO: previous?.startISO || null,
      endISO: previous?.endISO || null,
      needsConfirmation: false,
    };
  }

  const start = first.start.date();
  const end = first.end?.date() || new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const hasHour = first.start.isCertain("hour");
  const preferPm = hasHour && shouldPreferPmForBareHour(first.text, start.getHours());
  const displayStart = preferPm ? new Date(start.getTime() + 12 * 60 * 60 * 1000) : start;
  const displayEnd = preferPm ? new Date(end.getTime() + 12 * 60 * 60 * 1000) : end;
  if (previous?.startISO && hasHour && !parsedHasCalendarDate(first)) {
    const combined = combinePreviousDateWithParsedTime({
      previous,
      parsedStart: displayStart,
      parsedEnd: displayEnd,
    });
    if (combined) return combined;
  }
  return {
    dateText: cleanString(first.text) || previous?.dateText || null,
    timeText: hasHour
      ? displayStart.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      : previous?.timeText || null,
    startISO: displayStart.toISOString(),
    endISO: displayEnd.toISOString(),
    needsConfirmation: false,
  };
}

function isBeforeToday(iso: string | null | undefined) {
  if (!iso) return false;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return date < today;
}

function shouldConfirmPastDate(args: {
  startISO: string | null;
  message: string;
  previous?: ConciergeEventDraft | null;
}) {
  if (!isBeforeToday(args.startISO)) return false;
  const cleaned = cleanString(args.message?.replace(/[.!?]+$/g, "")) || "";
  if (
    args.previous?.currentQuestion === "date_confirmation" &&
    (isDateConfirmationAffirmation(cleaned) || isDateConfirmationRejection(cleaned))
  ) {
    return false;
  }
  return true;
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
  sourceText?: string | null;
  previous?: ConciergeEventDraft | null;
}) {
  const previousTitle = cleanString(args.previous?.title);
  const label = getEventTypeLabel(args.eventType);
  const genericTitle = `${label[0].toUpperCase()}${label.slice(1)} draft`;
  const sportTitle = deriveSportEventTitle(args.sourceText || "", args.eventType);
  if (sportTitle) return sportTitle;
  if (args.eventType === "birthday" && args.honoreeName && args.ageOrMilestone) {
    return `${args.honoreeName} is turning ${args.ageOrMilestone}`;
  }
  if (args.eventType === "birthday" && args.honoreeName) return `${args.honoreeName}'s birthday`;
  if (args.eventType === "wedding" && args.honoreeName) return `${args.honoreeName} wedding`;
  if (args.eventType === "bridal_shower" && args.honoreeName)
    return `${args.honoreeName}'s bridal shower`;
  if (args.eventType === "baby_shower" && args.honoreeName)
    return `${args.honoreeName}'s baby shower`;
  if (args.eventType === "gender_reveal" && args.honoreeName)
    return `${args.honoreeName}'s gender reveal`;
  if (args.eventType === "graduation" && args.honoreeName)
    return `${args.honoreeName}'s graduation`;
  if (
    args.eventPurpose &&
    !looksLikeCreationPrompt(args.eventPurpose) &&
    (!previousTitle || previousTitle === genericTitle || looksLikeCreationPrompt(previousTitle))
  ) {
    return args.eventPurpose;
  }
  if (
    previousTitle &&
    previousTitle !== "Event draft" &&
    previousTitle !== genericTitle &&
    !looksLikeCreationPrompt(previousTitle)
  ) {
    return previousTitle;
  }
  if (args.eventPurpose && !looksLikeCreationPrompt(args.eventPurpose)) return args.eventPurpose;
  if (isSportEventType(args.eventType)) {
    if (args.eventType === "football") return "Football Game Day";
    return "Game Day";
  }
  if (args.eventPurpose && !looksLikeCreationPrompt(args.eventPurpose)) return args.eventPurpose;
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
  tone: string | null;
  rsvpEnabled: boolean | null;
}): ConciergePreviewCopy {
  const headline = args.title || "Event draft";
  const subheadline = guestSubheadlineForEvent({
    eventType: args.eventType,
    title: headline,
    honoreeName: args.honoreeName,
    ageOrMilestone: args.ageOrMilestone,
  });
  const dateTextHasTime = Boolean(
    args.dateText &&
      /\b(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\b/i.test(args.dateText),
  );
  const scheduleLine = [args.dateText || "Date TBD", dateTextHasTime ? null : args.timeText || null]
    .filter(Boolean)
    .join(" at ");
  const locationLine = args.location || "Location TBD";
  const sportMatchup = isSportEventType(args.eventType) ? headline.split(/\s+vs\.?\s+/i) : [];
  const body =
    args.eventType === "birthday"
      ? `Join us to celebrate ${args.honoreeName || "the guest of honor"}${args.ageOrMilestone ? ` turning ${args.ageOrMilestone}` : ""}.`
      : args.eventType === "wedding"
        ? `Join us to celebrate ${args.honoreeName || "the couple"}.`
        : sportMatchup.length === 2
          ? `Cheer on ${sportMatchup[0]} as they take on ${sportMatchup[1]}.`
          : isSportEventType(args.eventType) && headline && !looksLikeCreationPrompt(headline)
            ? `Join us for ${headline}.`
            : `Join us for this ${getEventTypeLabel(args.eventType)}.`;
  return {
    headline,
    subheadline,
    body,
    scheduleLine,
    locationLine,
    cta: args.rsvpEnabled === true ? "RSVP" : "View details",
  };
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
      draft.numberOfGuests ||
      draft.theme,
  );
}

function isReceivedInviteDraft(draft: ConciergeEventDraft) {
  return draft.sourceContext.detectedSourceIntent === "received_invite";
}

function receivedInviteLabel(draft: ConciergeEventDraft) {
  const label = getEventTypeLabel(draft.eventType);
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

function primaryOutput(draft: ConciergeEventDraft): RequestedOutput {
  return draft.requestedOutputs[0] || "live_card";
}

function outputLabels(draft: ConciergeEventDraft) {
  const outputs = draft.requestedOutputs.length ? draft.requestedOutputs : ["live_card" as const];
  return outputs.map((output) => getOutputRequirement(output).label);
}

function outputActionLabel(draft: ConciergeEventDraft) {
  if (draft.requestedOutputs.length > 1) return "products";
  const output = primaryOutput(draft);
  if (output === "digital_flyer" || output === "invitation") return "flyer invitation";
  return getOutputRequirement(output).label.toLowerCase();
}

function readyActionSentence(draft: ConciergeEventDraft) {
  if (draft.requestedOutputs.length > 1) return "The selected products are ready to generate.";
  const output = primaryOutput(draft);
  if (output === "digital_flyer" || output === "invitation") {
    return "Your Flyer/Invitation is ready to generate.";
  }
  return `Your ${outputActionLabel(draft)} is ready to generate.`;
}

function nextActionSentence(draft: ConciergeEventDraft) {
  if (draft.currentQuestion === "date_confirmation") {
    const candidate = dateConfirmationCandidate(draft);
    return `Just to confirm, did you mean ${candidate}, or another date?`;
  }
  const firstMissing = draft.missingFields[0];
  if (!firstMissing && draft.canPersist && !draft.currentQuestion) return readyActionSentence(draft);
  if (firstMissing) {
    const plan = getRequirementPlan({
      eventType: draft.eventType,
      requestedOutputs: draft.requestedOutputs,
      sourceContext: draft.sourceContext,
    });
    return questionForMissingField(firstMissing, draft, plan);
  }
  return readyActionSentence(draft);
}

function safeDateFromValue(value: unknown) {
  const raw = cleanString(value);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateOnlyForDisplay(value: unknown, timezone?: string | null) {
  const parsed = safeDateFromValue(value);
  if (!parsed) return null;
  const options: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
  };
  const tz = cleanString(timezone);
  try {
    return new Intl.DateTimeFormat("en-US", tz ? { ...options, timeZone: tz } : options).format(
      parsed,
    );
  } catch {
    return new Intl.DateTimeFormat("en-US", options).format(parsed);
  }
}

function displayDateWithoutDuplicateTime(draft: ConciergeEventDraft) {
  const isoDateText = formatDateOnlyForDisplay(draft.dateText, draft.timezone);
  if (isoDateText) return isoDateText;
  const dateTextHasTime = Boolean(
    draft.dateText &&
      /\b(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\b/i.test(draft.dateText),
  );
  return dateTextHasTime && draft.timeText
    ? draft.dateText?.replace(
        /\s+(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\b\s*$/i,
        "",
      )
    : draft.dateText;
}

function dateConfirmationCandidate(draft: ConciergeEventDraft) {
  const displayDate = displayDateWithoutDuplicateTime(draft);
  if (displayDate && draft.timeText) return `${displayDate}, ${draft.timeText}`;
  return displayDate || draft.timeText || "that date";
}

function buildLocationChangeAcknowledgement(
  draft: ConciergeEventDraft,
  previous?: ConciergeEventDraft | null,
) {
  if (!previous) return null;
  const nextLocation = cleanString(draft.location || draft.venue);
  const previousLocation = cleanString(previous.location || previous.venue);
  if (!nextLocation || !previousLocation || nextLocation === previousLocation) return null;
  return `Got it - updated the location to ${nextLocation}. ${nextActionSentence(draft)}`;
}

function buildRsvpChangeAcknowledgement(
  draft: ConciergeEventDraft,
  previous?: ConciergeEventDraft | null,
) {
  if (!previous) return null;
  const rsvpChanged =
    typeof draft.rsvpEnabled === "boolean" && draft.rsvpEnabled !== previous.rsvpEnabled;
  const guestCountChanged =
    typeof draft.numberOfGuests === "number" &&
    draft.numberOfGuests > 0 &&
    draft.numberOfGuests !== previous.numberOfGuests;
  if (!rsvpChanged && !guestCountChanged) return null;
  const detail =
    draft.rsvpEnabled === false
      ? "RSVPs are off"
      : draft.rsvpEnabled === true && draft.numberOfGuests
        ? `RSVPs are on for ${draft.numberOfGuests} guests`
        : draft.rsvpEnabled === true
          ? "RSVPs are on"
          : draft.numberOfGuests
            ? `RSVP guest count is ${draft.numberOfGuests}`
            : null;
  if (!detail) return null;
  return `Got it - ${detail}. ${nextActionSentence(draft)}`;
}

function buildAgeSkipAcknowledgement(
  draft: ConciergeEventDraft,
  previous?: ConciergeEventDraft | null,
) {
  if (!previous || previous.ageOrMilestoneSkipped || !draft.ageOrMilestoneSkipped) return null;
  return `Got it - I will not show an age or birthday milestone. ${nextActionSentence(draft)}`;
}

function compactVerificationLines(
  draft: ConciergeEventDraft,
  options: { includeProducts?: boolean } = {},
) {
  const lines: string[] = [];
  const includeProducts = options.includeProducts !== false;
  const products = outputLabels(draft);
  const event = draft.title || draft.eventPurpose || draft.previewCopy.headline;
  const date = draft.dateText || draft.startISO;
  const time = draft.timeText;
  const location = draft.venue || draft.location;

  if (includeProducts) {
    lines.push(
      products.length > 1 ? `Products: ${products.join(", ")}` : `Product: ${products[0]}`,
    );
  }
  if (event) lines.push(`Event: ${event}`);
  if (draft.honoreeName || draft.ageOrMilestone) {
    const honoreeLabel = draft.eventType === "wedding" ? "Names" : "Honoree";
    lines.push(
      `${honoreeLabel}: ${[draft.honoreeName, draft.ageOrMilestone].filter(Boolean).join(", ")}`,
    );
  }
  if (date) lines.push(`Date: ${date}`);
  if (time) lines.push(`Time: ${time}`);
  if (location) lines.push(`Location: ${location}`);
  if (draft.rsvpEnabled === true) lines.push("RSVPs: Yes");
  if (draft.rsvpEnabled === false) lines.push("RSVPs: No");
  if (draft.numberOfGuests) lines.push(`RSVP guest count: ${draft.numberOfGuests}`);
  if (draft.rsvpName) lines.push(`RSVP host: ${draft.rsvpName}`);
  if (draft.rsvpContact) lines.push(`RSVP contact: ${draft.rsvpContact}`);
  if (draft.registryLink || draft.giftRegistryLink) {
    lines.push(`${giftRegistryLabel(draft)}: ${draft.registryLink || draft.giftRegistryLink}`);
  }
  if (draft.giftPreferenceNote || draft.giftNote) {
    lines.push(`Gift note: ${draft.giftPreferenceNote || draft.giftNote}`);
  }
  if (draft.tone) lines.push(`Vibe: ${draft.tone}`);
  return lines;
}

function readyVerificationMessage(draft: ConciergeEventDraft) {
  if (isReceivedInviteDraft(draft)) {
    const event = draft.title || draft.eventPurpose || draft.previewCopy.headline || "the invite";
    const displayDate = displayDateWithoutDuplicateTime(draft);
    const when = [displayDate, draft.timeText].filter(Boolean).join(" at ");
    const details = [event, when, draft.venue || draft.location].filter(Boolean).join(", ");
    return `Invite details are ready: ${details}. I can save this to Invited events now.`;
  }

  const actionLabel = outputActionLabel(draft);
  if (draft.conversationState?.finalSummaryShown && draft.conversationState.currentStep !== "ready_first") {
    return "Still ready — no changes needed.";
  }
  const event = draft.title || draft.eventPurpose || draft.previewCopy.headline || "the event";
  const displayDate = displayDateWithoutDuplicateTime(draft);
  const details = [event, displayDate, draft.timeText, draft.venue || draft.location]
    .filter(Boolean)
    .join(", ");
  const readyLine =
    actionLabel === "products"
      ? "Want me to generate them?"
      : `Want me to generate the ${actionLabel}?`;
  return `Everything looks ready: ${details}. ${readyLine}`;
}

function detailConfirmationQuestion(
  draft: ConciergeEventDraft,
  question: string,
  options: { includeRsvp?: boolean } = {},
) {
  void draft;
  void options;
  return question;
}

function categoryIntakeMessage(draft: ConciergeEventDraft): string | null {
  if (isReceivedInviteDraft(draft)) return null;
  if (!draft.missingFields.length || hasStartedCategoryDetails(draft)) return null;

  const plan = getRequirementPlan({
    eventType: draft.eventType,
    requestedOutputs: draft.requestedOutputs,
    sourceContext: draft.sourceContext,
  });
  return plan.intakeQuestions.length ? compactIntakePrompt(...plan.intakeQuestions) : null;
}

export function buildAssistantMessage(draft: ConciergeEventDraft): string {
  if (draft.sourceContext.boundary === "envitefy_question" && draft.knowledgeAnswer) {
    return draft.knowledgeAnswer;
  }
  if (draft.assistantGuidance) return draft.assistantGuidance;
  if (draft.sourceContext.boundary === "non_creation") {
    return "Got it. I won't create an event from that.";
  }
  if (draft.sourceContext.boundary === "off_domain") {
    return "I can help with Envitefy event products, RSVP, uploads, guest pages, and event edits. Tell me what you're creating or choose a category.";
  }
  if (draft.sourceContext.boundary === "external_action") {
    return "I can help with that, but I can't post to Facebook, create social media event pages, or contact people for you. I can write the post copy or help create an Envitefy event link you can share yourself.";
  }
  if (draft.sourceContext.boundary === "private_data") {
    return "I can't change owners, user IDs, or private account data here. I can help with event details, RSVP, copy, design, or weather planning.";
  }
  if (draft.sourceContext.boundary === "secret_detected") {
    return "Do not put API keys, passwords, or private credentials in an invite. Remove the secret, then tell me the event details you want guests to see.";
  }
  if (draft.sourceContext.boundary === "unsafe_guest_data") {
    return "I can't help scrape private RSVP data or bulk-change guest responses from chat. I can help with RSVP settings, guest-facing copy, or event management.";
  }
  if (draft.sourceContext.boundary === "ambiguous_edit") {
    return "Which invite should I update, or do you want to start a new one?";
  }
  if (draft.currentQuestion === "which_source") {
    return "Should I use the uploaded image or the current event details?";
  }
  if (draft.currentQuestion === "invite_source") {
    return receivedInviteSourcePrompt(draft);
  }
  if (draft.currentQuestion === "date_confirmation") {
    const candidate = dateConfirmationCandidate(draft);
    return `Just to confirm, did you mean ${candidate}, or another date?`;
  }
  const intakeMessage = categoryIntakeMessage(draft);
  if (intakeMessage) return intakeMessage;
  if (
    draft.currentQuestion === "what_are_we_celebrating" ||
    draft.missingFields[0] === "eventPurpose"
  ) {
    if (!draft.requestedOutputs.length) {
      return "What are we celebrating?\nUpload from the main menu, choose a category, or describe the event.";
    }
    return outputQuestion(draft.requestedOutputs[0] || "live_card");
  }
  const firstMissing = draft.missingFields[0];
  if (!firstMissing) {
    const optionalPrompt = optionalGiftRegistryPrompt(draft);
    if (optionalPrompt) return optionalPrompt;
    return readyVerificationMessage(draft);
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
  const plan = getRequirementPlan({
    eventType: draft.eventType,
    requestedOutputs: draft.requestedOutputs,
    sourceContext: draft.sourceContext,
  });
  if (firstMissing === "honoreeName" || firstMissing === "ageOrMilestone") {
    return questionForMissingField(firstMissing, draft, plan);
  }
  if (firstMissing === "date" || firstMissing === "time") {
    return questionForMissingField(firstMissing, draft, plan);
  }
  if (firstMissing === "location") return questionForMissingField(firstMissing, draft, plan);
  if (firstMissing === "rsvpEnabled") {
    return detailConfirmationQuestion(draft, questionForMissingField(firstMissing, draft, plan), {
      includeRsvp: false,
    });
  }
  if (firstMissing === "numberOfGuests") {
    return detailConfirmationQuestion(draft, questionForMissingField(firstMissing, draft, plan), {
      includeRsvp: false,
    });
  }
  if (firstMissing === "rsvpName" || firstMissing === "rsvpContact") {
    return detailConfirmationQuestion(draft, questionForMissingField(firstMissing, draft, plan), {
      includeRsvp: true,
    });
  }
  if (firstMissing === "tone") {
    return detailConfirmationQuestion(draft, questionForMissingField(firstMissing, draft, plan), {
      includeRsvp: true,
    });
  }
  return "What detail should we add next?";
}

export function buildSuggestedReplies(draft: ConciergeEventDraft): string[] {
  const firstMissing = draft.missingFields[0];
  const plan = getRequirementPlan({
    eventType: draft.eventType,
    requestedOutputs: draft.requestedOutputs,
    sourceContext: draft.sourceContext,
  });
  if (draft.currentQuestion === "date_confirmation") {
    const candidate = dateConfirmationCandidate(draft);
    return [`Yes, ${candidate}`, "No, another date"];
  }
  if (draft.currentQuestion === "invite_source" || firstMissing === "sourceContext") {
    if (isReceivedInviteDraft(draft)) return ["Upload invite", "Paste invite text", "Type details"];
  }
  if (firstMissing === "eventPurpose") {
    if (!draft.requestedOutputs.length) {
      return ["Create a live card", "Create a flyer invitation", "Let's create"];
    }
    return ["A school fundraiser", "A birthday party", "Use an upload"];
  }
  if (firstMissing === "sourceContext") {
    return ["Use current draft", "Use upload"];
  }
  if (firstMissing) {
    const replies = suggestedRepliesForRequirementField(firstMissing as RequirementField, plan);
    if (replies.length) return replies;
  }
  if (shouldOfferGiftRegistryPrompt(draft)) {
    return ["Paste a link", "Create on Amazon", "Skip gift link"];
  }
  return [`Create ${outputActionLabel(draft)}`, "Add RSVP page"];
}

export function canSaveConciergeDraft(draft: ConciergeEventDraft): boolean {
  return Boolean(draft.canPersist && !draft.currentQuestion && draft.missingFields.length === 0);
}

export function fallbackExtractConciergeDraft(args: {
  message: string;
  draft?: ConciergeEventDraft | null;
  ocrContext?: ConciergeOcrContext | null;
  requestedOutputs?: RequestedOutput[] | null;
  source?: ConciergeSource;
  activeContext?: ConciergeActiveContext | null;
  action?: ConciergeAction;
  starterCategory?: string | null;
}): ConciergeEventDraft {
  const message = cleanString(args.message) || "";
  const selectedCategory = cleanString(args.activeContext?.selectedCategory);
  const inferenceMessage = mergeStarterCategory(
    message,
    args.starterCategory || selectedCategory,
  );
  const combined = mergeText(inferenceMessage, args.ocrContext);
  const text = combined || message;
  const detailText =
    [args.message, args.ocrContext?.ocrText]
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter(Boolean)
      .join("\n") || text;
  const labeledDetails = detectLabeledInviteDetails(detailText);
  const sessionDraft = args.draft || null;
  const previous = shouldStartFreshEvent(message, sessionDraft) ? null : sessionDraft;
  const privateDataMutationRequest = isPrivateDataMutationRequest(message);
  const classifiedBoundary = classifyCreationBoundary(message, {
    activeContext: args.activeContext || null,
    previous,
  });
  const blockingBoundary = privateDataMutationRequest
    ? ("private_data" as const)
    : classifiedBoundary;
  const blocksCreation = Boolean(blockingBoundary);
  const duplicateAction = previous
    ? detectDuplicateAction(message, previous.conversationState || null)
    : null;
  if (previous && duplicateAction === "skip_gift_link" && !privateDataMutationRequest) {
    const next = {
      ...previous,
      giftPromptDismissed: true,
      knowledgeAnswer: null,
      assistantGuidance: "Already skipped — we’re good there.",
    };
    return withConversationState(next, previous, message);
  }
  if (previous && !privateDataMutationRequest && !blockingBoundary && isOffTopicInterruption(message)) {
    const next = {
      ...previous,
      knowledgeAnswer: null,
      assistantGuidance: `I will stay focused on the event. ${nextActionSentence(previous)}`,
    };
    return withConversationState(next, previous, message);
  }
  if (previous && !privateDataMutationRequest && !blockingBoundary && isWeatherSideQuestion(message)) {
    const next = {
      ...previous,
      sourceContext: {
        ...previous.sourceContext,
        boundary: null,
      },
      knowledgeAnswer: null,
      assistantGuidance: null,
    };
    return withConversationState(next, previous, message);
  }
  if (
    previous &&
    !privateDataMutationRequest &&
    !blockingBoundary &&
    detectDuplicateUserMessage(message, previous.conversationState || null)
  ) {
    const next = {
      ...previous,
      knowledgeAnswer: null,
      assistantGuidance: duplicateEventInputMessage(previous),
    };
    return withConversationState(next, previous, message);
  }
  const hasCreationSignal =
    Boolean(args.ocrContext) ||
    Boolean(previous) ||
    Boolean(args.starterCategory) ||
    args.action === "starter_category" ||
    hasClearCreationSignal(text);
  const hasExplicitOutputs =
    Array.isArray(args.requestedOutputs) && args.requestedOutputs.length > 0;
  const replacesPreviousOutputs = Boolean(previous && isProductSwitchCommand(message));
  const requestedOutputs = blocksCreation
    ? []
    : normalizeRequestedOutputs(
        hasExplicitOutputs
          ? args.requestedOutputs
          : replacesPreviousOutputs
            ? null
            : previous?.requestedOutputs || previous?.outputs,
        {
          text,
          previous: hasExplicitOutputs || replacesPreviousOutputs ? null : previous,
          defaultOutput:
            !previous && (isGreetingMessage(message) || (!hasCreationSignal && !hasExplicitOutputs))
              ? null
              : undefined,
        },
      );
  const resolvedSourceContext = resolveCreationSourceContext({
    message,
    activeContext: args.activeContext || null,
    previous,
    ocrContext: args.ocrContext || null,
  });
  const sourceContext = blockingBoundary
    ? { ...resolvedSourceContext, boundary: blockingBoundary }
    : resolvedSourceContext;
  if (!previous && !privateDataMutationRequest && isStandaloneLostContextReply(message)) {
    return buildEmptyConversationDraft({
      sessionDraft,
      requestedOutputs,
      sourceContext,
      knowledgeAnswer: buildStandaloneLostContextAnswer(message),
    });
  }
  if (
    previous &&
    !privateDataMutationRequest &&
    (!blockingBoundary || blockingBoundary === "ambiguous_edit") &&
    (isVagueCreativeRefinement(message) ||
      isDraftLogisticsAside(message) ||
      isIgnorePreviousRequestAside(message))
  ) {
    const sideComment = handleSideComment(message, previous.conversationState || null);
    const assistantGuidance = isVagueCreativeRefinement(message)
      ? "Absolutely. Give me a concrete direction so I can make it feel more premium, for example: editorial and minimal, warm handmade, bold team energy, luxury florals, or playful kid-party."
      : isDraftLogisticsAside(message)
        ? sideComment?.acknowledgement ||
          "No problem — I’ll keep the current details flexible for now."
        : "Got it. I’ll ignore that and keep going with the current draft.";
    const next = {
      ...previous,
      sourceContext: {
        ...previous.sourceContext,
        boundary: null,
      },
      knowledgeAnswer: null,
      assistantGuidance,
    };
    return withConversationState(next, previous, message);
  }
  if (
    previous?.canPersist &&
    !previous.currentQuestion &&
    !privateDataMutationRequest &&
    !blockingBoundary &&
    isReadyStatusQuestion(message)
  ) {
    const next = {
      ...previous,
      knowledgeAnswer: null,
      assistantGuidance: previous.conversationState?.finalSummaryShown
        ? "Still ready — no changes needed."
        : `No, this is ready. ${readyActionSentence(previous)}`,
    };
    return withConversationState(next, previous, message);
  }
  if (
    !blockingBoundary &&
    !privateDataMutationRequest &&
    isStatePreservingConversationMessage(message, previous)
  ) {
    return {
      ...previous!,
      sourceContext: {
        ...previous!.sourceContext,
        boundary: "envitefy_question",
      },
      knowledgeAnswer: buildStatePreservingConversationAnswer(message, previous!),
      assistantGuidance: null,
    };
  }
  if (!blockingBoundary && !privateDataMutationRequest && asksEnvitefyKnowledgeQuestion(message)) {
    const knowledgeAnswer = buildEnvitefyKnowledgeAnswer(message, previous);
    if (previous) {
      return {
        ...previous,
        sourceContext: {
          ...previous.sourceContext,
          boundary: "envitefy_question",
        },
        knowledgeAnswer,
        assistantGuidance: null,
      };
    }
    return buildEmptyConversationDraft({
      sessionDraft,
      requestedOutputs,
      sourceContext,
      knowledgeAnswer,
    });
  }
  if (blockingBoundary && previous) {
    return {
      ...previous,
      sourceContext: {
        ...previous.sourceContext,
        ...sourceContext,
      },
      knowledgeAnswer: null,
      assistantGuidance: null,
    };
  }
  const source: ConciergeSource =
    args.source || (args.ocrContext ? (message ? "mixed" : "upload") : previous?.source || "text");
  const eventType = blocksCreation ? "unknown" : detectEventType(text, previous);
  const relationship = detectRelationship(text, previous);
  const fieldsGuess = args.ocrContext?.fieldsGuess || {};
  const sourceMaterial = args.ocrContext
    ? {
        ocrText: args.ocrContext.ocrText || null,
        fieldsGuess: args.ocrContext.fieldsGuess || null,
        category: args.ocrContext.category || null,
      }
    : previous?.sourceMaterial || null;
  const birthdayTemplateHint = recordValue(args.ocrContext?.birthdayTemplateHint);
  const honoreeName =
    detectHonoreeName(text, previous) ||
    labeledDetails.honoreeName ||
    detectHonoreeFollowUp(message, previous) ||
    firstString(fieldsGuess.name, fieldsGuess.honoreeName, birthdayTemplateHint.honoreeName);
  const ageOrMilestone =
    detectAge(text, previous) ||
    stringFromKnownValue(
      fieldsGuess.ageOrMilestone || fieldsGuess.age || birthdayTemplateHint.age,
    );
  const ageOrMilestoneSkipped = ageOrMilestone
    ? false
    : Boolean(previous?.ageOrMilestoneSkipped || detectAgeOrMilestoneSkipped(message, previous));
  const chronoResult = parseChrono(labeledDetails.whenText || text, previous);
  const fieldStartIso = isoFromField(fieldsGuess.start);
  const fieldEndIso = isoFromField(fieldsGuess.end);
  const shouldKeepPreviousLocation = shouldPreservePreviousLocationDuringRsvpReply(
    message,
    previous,
  );
  const locationFactText = eventFactTextForLocationExtraction(detailText);
  const inferenceLocationText = eventFactTextForLocationExtraction(text);
  const location = shouldKeepPreviousLocation
    ? previous?.location || previous?.venue || null
    : labeledDetails.location ||
      detectPrimaryLabeledLocation(locationFactText) ||
      detectLocationCorrection(message) ||
      detectVenueOrLocation(inferenceLocationText, args.ocrContext) ||
      detectLocationFollowUp(message, previous) ||
      previous?.location ||
      previous?.venue ||
      null;
  const additionalLocations = shouldKeepPreviousLocation
    ? previous?.additionalLocations || []
    : detectAdditionalLocations(locationFactText, location, previous);
  const theme = detectTheme(detailText, previous);
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
  const extractedEventPurpose = firstString(fieldsGuess.eventPurpose, fieldsGuess.title);
  const sportEventPurpose = deriveSportEventTitle(text, eventType);
  const previousEventPurpose = looksLikeCreationPrompt(previous?.eventPurpose || null)
    ? null
    : previous?.eventPurpose || null;
  const clarifiedBirthdayEventPurpose =
    eventType === "birthday" &&
    isBirthdayClarificationOnly(message, previous) &&
    previousEventPurpose &&
    !/\b(?:birthday|bday)\b/i.test(previousEventPurpose)
      ? honoreeName &&
        previousEventPurpose.toLowerCase().startsWith(`${honoreeName.toLowerCase()} `)
        ? `${honoreeName} birthday ${previousEventPurpose.slice(honoreeName.length).trim()}`
        : `${previousEventPurpose} birthday`
      : null;
  const commandOnlyDraftUpdate = Boolean(
    previous && (isCommandOnlyDraftUpdate(message) || isBirthdayClarificationOnly(message, previous)),
  );
  const canUseRawMessageAsEventPurpose =
    !commandOnlyDraftUpdate && (hasCreationSignal || requestedOutputs.length > 0);
  const rawMessageEventPurpose =
    canUseRawMessageAsEventPurpose && isMeaningfulEventText(message, requestedOutputs)
      ? cleanCreationString(message)
      : null;
  const shouldSuppressRawCreationPrompt = Boolean(
    rawMessageEventPurpose &&
      looksLikeCreationPrompt(rawMessageEventPurpose) &&
      eventType !== "unknown" &&
      eventType !== "general",
  );
  const messageEventPurpose =
    rawMessageEventPurpose && !shouldSuppressRawCreationPrompt
      ? looksLikeCreationPrompt(rawMessageEventPurpose)
        ? cleanMessageEventPurpose(rawMessageEventPurpose, requestedOutputs) ||
          rawMessageEventPurpose
        : cleanScheduledEventPurpose(rawMessageEventPurpose) || rawMessageEventPurpose
      : null;
  const eventPurpose =
    blocksCreation || (receivedInviteWithoutSource && !hasConcreteReceivedInviteDetails)
      ? null
      : extractedEventPurpose ||
        sportEventPurpose ||
        messageEventPurpose ||
        clarifiedBirthdayEventPurpose ||
        previousEventPurpose;
  const titleCandidate =
    firstString(fieldsGuess.title) ||
    buildTitle({
      eventType,
      honoreeName,
      ageOrMilestone,
      eventPurpose,
      sourceText: text,
      previous,
    });
  const title =
    blocksCreation || (receivedInviteWithoutSource && !hasConcreteReceivedInviteDetails)
      ? null
      : titleCandidate;
  const dateText = chronoResult.dateText || firstString(fieldsGuess.date);
  const timeText = chronoResult.timeText || firstString(fieldsGuess.time);
  const startISO = fieldStartIso || chronoResult.startISO;
  const endISO = fieldEndIso || chronoResult.endISO;
  const numberOfGuests = detectGuestCount(message, previous);
  const rsvpEnabled = detectRsvpEnabled(message, previous, requestedOutputs, fieldsGuess);
  const rsvpDeadline = detectRsvpDeadline(text, previous);
  const rsvpName = detectRsvpName(text, fieldsGuess, previous);
  const rsvpContact = detectRsvpContact(text, fieldsGuess, previous);
  const giftPromptSkip = Boolean(
    previous && shouldOfferGiftRegistryPrompt(previous) && isGiftPromptSkipReply(message),
  );
  const repeatedGiftPromptSkip = Boolean(
    previous?.giftPromptDismissed && isGiftPromptSkipReply(message),
  );
  const irrelevantGiftPromptSkip = Boolean(
    previous &&
      !shouldOfferGiftRegistryPrompt(previous) &&
      !previous.giftPromptDismissed &&
      isGiftPromptSkipReply(message),
  );
  const amazonRegistryCreate = Boolean(
    previous && shouldOfferGiftRegistryPrompt(previous) && isAmazonRegistryCreateReply(message),
  );
  const registryLink =
    detectRegistryLink(text, fieldsGuess, previous) ||
    previous?.registryLink ||
    previous?.giftRegistryLink ||
    null;
  const giftPreferenceNote =
    detectGiftPreferenceNote(text, fieldsGuess, {
      allowBroadGiftNotes: Boolean(previous && shouldOfferGiftRegistryPrompt(previous)),
    }) ||
    previous?.giftPreferenceNote ||
    previous?.giftNote ||
    null;
  const giftPromptDismissed = Boolean(
    previous?.giftPromptDismissed ||
      giftPromptSkip ||
      repeatedGiftPromptSkip ||
      irrelevantGiftPromptSkip ||
      amazonRegistryCreate,
  );
  const tone =
    detectTone(detailText, previous) ||
    firstString(fieldsGuess.tone) ||
    (isSportEventType(eventType) ? theme : null);
  const toneForStatus = tone || theme;
  const status = blocksCreation
    ? {
        draftStatus: "needs_source_or_event" as const,
        missingFields: [],
        currentQuestion: null,
        canPersist: false,
      }
    : deriveCreationStatus({
        sourceContext,
        eventPurpose,
        title,
        eventType,
        requestedOutputs,
        dateText,
        timeText,
        startISO,
        location,
        honoreeName,
        ageOrMilestone,
        ageOrMilestoneSkipped,
        rsvpEnabled,
        numberOfGuests,
        rsvpName,
        rsvpContact,
        tone: toneForStatus,
      });
  const needsDateConfirmation = Boolean(
    chronoResult.needsConfirmation ||
      shouldConfirmPastDate({
        startISO,
        message,
        previous,
      }),
  );
  const base = {
    creationSessionId: createCreationSessionId(sessionDraft),
    intent: blocksCreation
      ? ("unknown" as const)
      : normalizeCreationIntent(previous?.intent, message, requestedOutputs),
    requestedOutputs,
    sourceContext,
    sourceMaterial,
    eventPurpose,
    eventType,
    title,
    ownership:
      sourceContext.detectedSourceIntent === "received_invite"
        ? "invited"
        : sourceContext.detectedSourceIntent === "unknown"
          ? previous?.ownership || "unknown"
          : "owned",
    draftStatus: needsDateConfirmation ? "drafting" : status.draftStatus,
    currentQuestion: needsDateConfirmation ? "date_confirmation" : status.currentQuestion,
    canPersist: status.canPersist,
    honoreeName,
    relationship,
    ageOrMilestone,
    ageOrMilestoneSkipped,
    dateText,
    timeText,
    startISO,
    endISO,
    timezone: firstString(fieldsGuess.timezone) || previous?.timezone || DEFAULT_TIMEZONE,
    location,
    venue: location,
    additionalLocations,
    rsvpEnabled,
    rsvpDeadline,
    rsvpName,
    rsvpContact,
    numberOfGuests,
    registryLink,
    giftPreferenceNote,
    giftPromptDismissed,
    theme,
    tone,
    knowledgeAnswer: null,
    assistantGuidance: null,
    outputs: toLegacyOutputs(requestedOutputs),
    previewCopy: sanitizeConciergePreviewCopy(
      buildPreviewCopy({
        eventType,
        title: title || eventPurpose || "Event draft",
        honoreeName,
        ageOrMilestone,
        dateText,
        timeText,
        location,
        theme,
        tone,
        rsvpEnabled,
      }),
      {
        eventType,
        title,
        eventPurpose,
        honoreeName,
        ageOrMilestone,
      },
    ),
    source,
  } satisfies Omit<ConciergeEventDraft, "missingFields">;

  const draft = {
    ...base,
    missingFields: Array.from(
      new Set([...(needsDateConfirmation ? ["date"] : []), ...status.missingFields]),
    ),
  };
  const addedGiftPreferenceNote = Boolean(
    previous &&
      shouldOfferGiftRegistryPrompt(previous) &&
      giftPreferenceNote &&
      giftPreferenceNote !== previous.giftPreferenceNote &&
      giftPreferenceNote !== previous.giftNote,
  );
  const addedRegistryLink = Boolean(
    previous &&
      registryLink &&
      registryLink !== previous.registryLink &&
      registryLink !== previous.giftRegistryLink,
  );
  const locationAcknowledgement = buildLocationChangeAcknowledgement(draft, previous);
  const rsvpAcknowledgement = buildRsvpChangeAcknowledgement(draft, previous);
  const ageSkipAcknowledgement = buildAgeSkipAcknowledgement(draft, previous);
  const assistantGuidance =
    amazonRegistryCreate
      ? "Create the list on Amazon, then paste the public or shareable link here and I’ll add it. You can also generate now and add the link later."
      : giftPromptSkip || repeatedGiftPromptSkip || irrelevantGiftPromptSkip
        ? repeatedGiftPromptSkip
          ? "Already skipped — we’re good there."
          : `Got it — no gift link added. ${nextActionSentence(draft)}`
        : addedRegistryLink
          ? `Got it — Registry: ${registryLink}. ${nextActionSentence(draft)}`
        : addedGiftPreferenceNote
          ? `Got it — Gift note: ${giftPreferenceNote}. ${nextActionSentence(draft)}`
        : locationAcknowledgement
          ? locationAcknowledgement
        : ageSkipAcknowledgement
          ? ageSkipAcknowledgement
        : rsvpAcknowledgement
          ? rsvpAcknowledgement
          : isVagueCreativeRefinement(message)
            ? "Absolutely. Give me a concrete direction so I can make it feel more premium, for example: editorial and minimal, warm handmade, bold team energy, luxury florals, or playful kid-party."
            : isDraftLogisticsAside(message)
              ? handleSideComment(message, previous?.conversationState || null)?.acknowledgement ||
                "No problem — I’ll keep the current details flexible for now."
              : buildUnresolvedFieldGuidance({
                  message,
                  draft,
                  previous,
                });
  const finalDraft = {
    ...draft,
    assistantGuidance: assistantGuidance || null,
  };
  return withConversationState(finalDraft, previous, message);
}
