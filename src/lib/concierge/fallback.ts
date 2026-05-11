import * as chrono from "chrono-node";
import {
  cleanCreationString,
  createCreationSessionId,
  deriveCreationStatus,
  getOutputRequirement,
  isGreetingMessage,
  isMeaningfulEventText,
  isNonCreationRequest,
  isOffDomainRequest,
  normalizeCreationIntent,
  normalizeRequestedOutputs,
  outputQuestion,
  resolveCreationSourceContext,
  toLegacyOutputs,
} from "./creation-intent.ts";
import type { RequirementField } from "./requirements.ts";
import {
  getEventTypeLabel,
  getRequirementPlan,
  questionForRequirementField,
  suggestedRepliesForRequirementField,
} from "./requirements.ts";
import {
  guestSubheadlineForEvent,
  looksLikeInternalCreativeDirection,
  sanitizeConciergePreviewCopy,
} from "./public-copy.ts";
import type {
  ConciergeAction,
  ConciergeActiveContext,
  ConciergeEventDraft,
  ConciergeEventType,
  ConciergeOcrContext,
  ConciergePreviewCopy,
  ConciergeSource,
  RequestedOutput,
} from "./types.ts";

const DEFAULT_TIMEZONE = "America/Chicago";
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

function cleanUrlString(value: unknown): string | null {
  return cleanString(value)?.replace(/[),.;!?]+$/g, "") || null;
}

function firstPositiveNumber(...values: unknown[]) {
  for (const value of values) {
    const numeric =
      typeof value === "number"
        ? value
        : typeof value === "string"
          ? Number.parseInt(value, 10)
          : Number.NaN;
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
  }
  return null;
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
  if (/\b(gymnastics|gym\s+meet|meet\s+schedule)\b/.test(haystack)) return "gym_meet";
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
    const birthdayForName = text.match(
      /\b(?:birthday|bday)(?:\s+(?:live\s*card|event\s+page|flyer(?:\/invitation)?|flyer\s+invitation|invitation|invite|party|product))*\s+(?:for|fro)\s+([a-z][a-zA-Z'-]{1,30})(?=\s*(?:,|\d{1,3}\b|\b(?:turning|turns|is turning|on|at|for|fro)\b|$))/i,
    );
    if (birthdayForName?.[1]) return titleCaseName(birthdayForName[1]);
  }

  if (previous?.eventType === "baby_shower" || /\b(?:baby\s+shower|sprinkle)\b/i.test(text)) {
    const showerFor =
      text.match(
        /\b(?:baby\s+shower|sprinkle)(?:\s+(?:product|event\s+page|live\s*card|flyer(?:\/invitation)?|flyer\s+invitation|invitation|invite))?\s+for\s+(.{2,80}?)(?=\s+(?:on|at|with|make|this|theme|tone|no\s+rsvps?|without|include|gift|registry)\b|[.;]|$)/i,
      ) || text.match(/\bfor\s+(.{2,80}?)\s+(?:baby\s+shower|sprinkle)\b/i);
    const honoree = cleanHonoreePhrase(showerFor?.[1]);
    if (honoree) return honoree;
  }

  const possessive = text.match(
    /\b([A-Z][a-zA-Z'-]{1,30})'s\s+(?:\d{1,3}(?:st|nd|rd|th)\s+)?(?:(?:baby|bridal)\s+)?(?:birthday|graduation|party|shower|gender\s+reveal|housewarming)\b/,
  );
  if (possessive?.[1]) return possessive[1];

  const turning = text.match(/\b([A-Z][a-zA-Z'-]{1,30})\s+(?:(?:is\s+)?turning|turns)\s+\d{1,3}\b/);
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

function cleanHonoreePhrase(value: string | null | undefined) {
  const cleaned = cleanString(
    value
      ?.replace(/[.!?]+$/g, "")
      .replace(/^(?:for|of)\s+/i, "")
      .replace(/^(?:QA\s+|test\s+)/i, ""),
  );
  if (!cleaned || cleaned.length > 80) return null;
  if (looksLikeCreationPrompt(cleaned) || isInstructionFragment(cleaned)) return null;
  if (/\b(?:date|time|location|venue|rsvp|registry|http|www|theme|tone)\b/i.test(cleaned)) {
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

function detectGuestCount(text: string, previous?: ConciergeEventDraft | null) {
  const expectsGuestCount = firstMissingField(previous) === "numberOfGuests";
  const explicit =
    text.match(
      /\brsvps?\s+for\s+(\d{1,4})\s*(?:guests?|kids?|children|people|attendees|invitees|famil(?:y|ies))\b/i,
    ) ||
    text.match(
      /\b(?:guest count|guest list|guests?|kids?|children|people|attendees|invitees)\s*(?:is|should be|:)?\s*(\d{1,4})\b/i,
    ) ||
    text.match(/\b(\d{1,4})\s*(?:guests?|kids?|children|people|attendees|invitees)\b/i);
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
      /^(yes|yep|yeah|sure|please|yes please|include it|add it|turn it on|enable it|collect rsvps?|track rsvps?)$/i.test(
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

function detectRsvpDeadline(text: string, previous?: ConciergeEventDraft | null) {
  const match =
    text.match(/\brsvp\s+(?:deadline|due|responses?\s+due)\s*:?\s*([^.\n;]{2,80})/i) ||
    text.match(/\b(?:rsvp|respond)\s+by\s+([^.\n;]{2,80})/i);
  const deadline = cleanString(match?.[1]?.replace(/[.!?]+$/g, ""));
  return deadline || previous?.rsvpDeadline || null;
}

function detectRsvpContact(
  text: string,
  fieldsGuess: Record<string, unknown>,
  previous?: ConciergeEventDraft | null,
) {
  const direct = firstString(fieldsGuess.rsvpContact, fieldsGuess.rsvpEmail, fieldsGuess.rsvpPhone);
  if (direct) return direct;
  const explicitEmail = text.match(
    /\brsvp\s+contact\s*:?\s*([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i,
  );
  if (explicitEmail?.[1]) return explicitEmail[1];
  const explicit = text.match(/\brsvp\s+contact\s*:?\s*([^.\n;]{3,120})/i);
  const email = explicit?.[1]?.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const contact = cleanString(email || explicit?.[1]?.replace(/[.!?]+$/g, ""));
  return contact || previous?.rsvpContact || null;
}

function detectRegistryLink(text: string, fieldsGuess: Record<string, unknown>) {
  const direct = firstString(
    fieldsGuess.registryLink,
    fieldsGuess.registryUrl,
    fieldsGuess.giftRegistryLink,
    fieldsGuess.giftListLink,
    fieldsGuess.wishlistLink,
  );
  if (direct) return cleanUrlString(direct);
  if (!/\b(registry|gift\s*list|wishlist|wish\s*list|babylist|zola|target|amazon)\b/i.test(text)) {
    return null;
  }
  const url = text.match(/\bhttps?:\/\/[^\s<>"')]+|\bwww\.[^\s<>"')]+/i)?.[0];
  return cleanUrlString(url || "");
}

function detectGiftPreferenceNote(text: string, fieldsGuess: Record<string, unknown>) {
  const direct = firstString(
    fieldsGuess.giftPreferenceNote,
    fieldsGuess.giftNote,
    fieldsGuess.registryNote,
    fieldsGuess.giftPreference,
  );
  if (direct) return direct;
  const noGifts = text.match(
    /\b(?:no gifts?|gifts?\s+(?:are\s+)?optional|your presence is (?:our|the) gift|gift cards? preferred)\b[^.!,;]*/i,
  );
  return cleanString(noGifts?.[0] || "");
}

function detectTone(text: string, previous?: ConciergeEventDraft | null) {
  const expectsTone = firstMissingField(previous) === "tone";
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

function isPrivateDataMutationRequest(message: string) {
  const text = cleanString(message) || "";
  return (
    /\b(change|update|set|modify|switch|show|reveal|expose|give|send|tell|what\s+is|what's)\b/i.test(
      text,
    ) &&
    /\b(user[_\s-]?id|owner[_\s-]?id|ownership|account owner|private data|guest emails?|password|api\s*key|private\s*key|session\s*token|auth\s*token|secret)\b/i.test(
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
  return (
    /^(are you here|you there|hello\??|hi\??|who are you|what are you|why would i do that)\??$/i.test(
      text,
    ) ||
    /\b(i\s+(already\s+)?gave\s+you\s+the\s+name|you\s+already\s+(asked|have)\s+(for\s+)?rsvp|forgot\s+rsvp|dropped\s+(the\s+)?rsvp|you\s+(lost|dropped|forgot)\s+(the\s+)?(?:rsvp|name|guest count|details?))\b/i.test(
      text,
    )
  );
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
  if (previousTitle && previousTitle !== "Event draft" && previousTitle !== genericTitle) {
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
      ? `Join us for ${args.honoreeName || "the guest of honor"}${args.ageOrMilestone ? ` as they turn ${args.ageOrMilestone}` : ""}.`
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
  if (draft.rsvpEnabled === true) lines.push("RSVP: Envitefy tracking");
  if (draft.rsvpEnabled === false) lines.push("RSVP: Not needed");
  if (draft.numberOfGuests) lines.push(`RSVP guest count: ${draft.numberOfGuests}`);
  if (draft.tone) lines.push(`Vibe: ${draft.tone}`);
  return lines;
}

function readyVerificationMessage(draft: ConciergeEventDraft) {
  if (isReceivedInviteDraft(draft)) {
    return [
      "Invite details are ready.",
      ...compactVerificationLines(draft, { includeProducts: false }),
      "I can save this to Invited events now.",
    ].join("\n");
  }

  const actionLabel = outputActionLabel(draft);
  return [
    "Details are ready.",
    ...compactVerificationLines(draft),
    actionLabel === "products"
      ? "I can generate the selected products now."
      : `I can generate the ${actionLabel === "live card" ? "invite" : actionLabel} now.`,
  ].join("\n");
}

function detailConfirmationQuestion(
  draft: ConciergeEventDraft,
  question: string,
  options: { includeRsvp?: boolean } = {},
) {
  const includeRsvp = options.includeRsvp !== false;
  const lines = compactVerificationLines(draft).filter(
    (line) => includeRsvp || !/^RSVP(?: guest count)?:/i.test(line),
  );
  if (lines.length < 2) return question;
  return ["I have these details.", ...lines, question].join("\n");
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
  if (draft.sourceContext.boundary === "private_data") {
    return "I can't change owners, user IDs, or private account data here. I can help with event details, RSVP, copy, design, or weather planning.";
  }
  if (draft.currentQuestion === "which_source") {
    return "Should I use the uploaded image or the current event details?";
  }
  if (draft.currentQuestion === "invite_source") {
    return receivedInviteSourcePrompt(draft);
  }
  if (draft.currentQuestion === "date_confirmation") {
    const candidate = draft.dateText || "that date";
    return `Just to confirm, did you mean ${candidate}, or another date?`;
  }
  const intakeMessage = categoryIntakeMessage(draft);
  if (intakeMessage) return intakeMessage;
  if (
    draft.currentQuestion === "what_are_we_celebrating" ||
    draft.missingFields[0] === "eventPurpose"
  ) {
    if (!draft.requestedOutputs.length) {
      return "Hi, what are we celebrating?\nPick a category or describe the event.";
    }
    return outputQuestion(draft.requestedOutputs[0] || "live_card");
  }
  const firstMissing = draft.missingFields[0];
  if (!firstMissing) {
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
    const candidate = draft.dateText || "that date";
    return [`Yes, ${candidate}`, "No, another date"];
  }
  if (draft.currentQuestion === "invite_source" || firstMissing === "sourceContext") {
    if (isReceivedInviteDraft(draft)) return ["Upload invite", "Paste invite text", "Type details"];
  }
  if (firstMissing === "eventPurpose") {
    if (!draft.requestedOutputs.length) {
      return ["Create a live card", "Create a flyer invitation", "Create an event page"];
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
  const inferenceMessage = mergeStarterCategory(message, args.starterCategory);
  const combined = mergeText(inferenceMessage, args.ocrContext);
  const text = combined || message;
  const sessionDraft = args.draft || null;
  const previous = shouldStartFreshEvent(message, sessionDraft) ? null : sessionDraft;
  const nonCreationRequest = isNonCreationRequest(message);
  const offDomainRequest = isOffDomainRequest(message);
  const hasExplicitOutputs =
    Array.isArray(args.requestedOutputs) && args.requestedOutputs.length > 0;
  const requestedOutputs =
    nonCreationRequest || offDomainRequest
      ? []
      : normalizeRequestedOutputs(
          hasExplicitOutputs
            ? args.requestedOutputs
            : previous?.requestedOutputs || previous?.outputs,
          {
            text,
            previous: hasExplicitOutputs ? null : previous,
            defaultOutput: !previous && isGreetingMessage(message) ? null : undefined,
          },
        );
  const resolvedSourceContext = resolveCreationSourceContext({
    message,
    activeContext: args.activeContext || null,
    previous,
    ocrContext: args.ocrContext || null,
  });
  const privateDataMutationRequest = isPrivateDataMutationRequest(message);
  const sourceContext = privateDataMutationRequest
    ? { ...resolvedSourceContext, boundary: "private_data" as const }
    : offDomainRequest
      ? { ...resolvedSourceContext, boundary: "off_domain" as const }
      : nonCreationRequest
        ? { ...resolvedSourceContext, boundary: "non_creation" as const }
        : resolvedSourceContext;
  if (!privateDataMutationRequest && isStatePreservingConversationMessage(message, previous)) {
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
  if (!privateDataMutationRequest && asksEnvitefyKnowledgeQuestion(message)) {
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
    return {
      intent: "unknown",
      creationSessionId: createCreationSessionId(sessionDraft),
      requestedOutputs,
      sourceContext: {
        ...sourceContext,
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
      dateText: null,
      timeText: null,
      startISO: null,
      endISO: null,
      timezone: DEFAULT_TIMEZONE,
      location: null,
      venue: null,
      rsvpEnabled: null,
      rsvpDeadline: null,
      rsvpName: null,
      rsvpContact: null,
      numberOfGuests: null,
      registryLink: null,
      giftPreferenceNote: null,
      theme: null,
      tone: null,
      knowledgeAnswer,
      assistantGuidance: null,
      outputs: toLegacyOutputs(requestedOutputs),
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
  if (privateDataMutationRequest && previous) {
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
  const eventType =
    nonCreationRequest || offDomainRequest ? "unknown" : detectEventType(text, previous);
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
  const extractedEventPurpose = firstString(fieldsGuess.eventPurpose, fieldsGuess.title);
  const sportEventPurpose = deriveSportEventTitle(text, eventType);
  const rawMessageEventPurpose = isMeaningfulEventText(message, requestedOutputs)
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
        : rawMessageEventPurpose
      : null;
  const eventPurpose =
    nonCreationRequest ||
    offDomainRequest ||
    privateDataMutationRequest ||
    (receivedInviteWithoutSource && !hasConcreteReceivedInviteDetails)
      ? null
      : extractedEventPurpose || sportEventPurpose || previous?.eventPurpose || messageEventPurpose;
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
    nonCreationRequest ||
    offDomainRequest ||
    privateDataMutationRequest ||
    (receivedInviteWithoutSource && !hasConcreteReceivedInviteDetails)
      ? null
      : titleCandidate;
  const dateText = chronoResult.dateText || firstString(fieldsGuess.date);
  const timeText = chronoResult.timeText || firstString(fieldsGuess.time);
  const startISO = fieldStartIso || chronoResult.startISO;
  const endISO = fieldEndIso || chronoResult.endISO;
  const numberOfGuests =
    detectGuestCount(message, previous) ||
    firstPositiveNumber(fieldsGuess.numberOfGuests, fieldsGuess.guestCount);
  const rsvpEnabled = detectRsvpEnabled(message, previous, requestedOutputs, fieldsGuess);
  const rsvpDeadline = detectRsvpDeadline(text, previous);
  const rsvpContact = detectRsvpContact(text, fieldsGuess, previous);
  const registryLink =
    detectRegistryLink(text, fieldsGuess) ||
    previous?.registryLink ||
    previous?.giftRegistryLink ||
    null;
  const giftPreferenceNote =
    detectGiftPreferenceNote(text, fieldsGuess) ||
    previous?.giftPreferenceNote ||
    previous?.giftNote ||
    null;
  const tone =
    detectTone(text, previous) ||
    firstString(fieldsGuess.tone) ||
    (isSportEventType(eventType) ? theme : null);
  const toneForStatus = tone || theme;
  const status =
    nonCreationRequest || offDomainRequest
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
          rsvpEnabled,
          numberOfGuests,
          tone: toneForStatus,
        });
  const needsDateConfirmation = Boolean(chronoResult.needsConfirmation);
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
    draftStatus: needsDateConfirmation ? "drafting" : status.draftStatus,
    currentQuestion: needsDateConfirmation ? "date_confirmation" : status.currentQuestion,
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
    rsvpEnabled,
    rsvpDeadline,
    rsvpName: previous?.rsvpName || null,
    rsvpContact,
    numberOfGuests,
    registryLink,
    giftPreferenceNote,
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
  return {
    ...draft,
    assistantGuidance: buildUnresolvedFieldGuidance({
      message,
      draft,
      previous,
    }),
  };
}
