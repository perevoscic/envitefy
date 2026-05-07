import * as chrono from "chrono-node";
import {
  cleanCreationString,
  createCreationSessionId,
  deriveCreationStatus,
  getOutputRequirement,
  isGreetingMessage,
  isMeaningfulEventText,
  isNonCreationRequest,
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
    text.length > 90 &&
    /\b(create|make|build|draft|design|generate|product|envitefy|event\s+page|live\s*card|digital\s+flyer|guest-facing|call\s+to\s+action)\b/i.test(
      text,
    )
  );
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
  const plain = expectsGuestCount ? text.match(/^\s*(\d{1,4})\s*$/) : null;
  const raw = explicit?.[1] || plain?.[1];
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
  if (direct) return direct;
  if (!/\b(registry|gift\s*list|wishlist|wish\s*list|babylist|zola|target|amazon)\b/i.test(text)) {
    return null;
  }
  const url = text.match(/\bhttps?:\/\/[^\s<>"')]+|\bwww\.[^\s<>"')]+/i)?.[0];
  return cleanString(url || "");
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
    /\b(?:no gifts?|your presence is (?:our|the) gift|gift cards? preferred)\b[^.!,;]*/i,
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
    if (cleaned && cleaned.length <= 80) return cleaned;
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
  tone: string | null;
}): ConciergePreviewCopy {
  const headline = args.title || "Event draft";
  const themeLine = args.theme
    ? `${args.theme} theme`
    : args.tone
      ? `${args.tone} vibe`
      : "Details coming soon";
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
    subheadline: themeLine,
    body,
    scheduleLine,
    locationLine,
    cta: "RSVP",
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

function detailConfirmationQuestion(draft: ConciergeEventDraft, question: string) {
  const lines = compactVerificationLines(draft).filter(
    (line) => !/^RSVP(?: guest count)?:/i.test(line),
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
  if (draft.sourceContext.boundary === "non_creation") {
    return "Got it. I won't create an event from that.";
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
    return questionForRequirementField(firstMissing, plan);
  }
  if (firstMissing === "date" || firstMissing === "time") {
    return questionForRequirementField(firstMissing, plan);
  }
  if (firstMissing === "location") return questionForRequirementField(firstMissing, plan);
  if (firstMissing === "rsvpEnabled") {
    return detailConfirmationQuestion(draft, questionForRequirementField(firstMissing, plan));
  }
  if (firstMissing === "numberOfGuests") {
    return detailConfirmationQuestion(draft, questionForRequirementField(firstMissing, plan));
  }
  if (firstMissing === "tone") {
    return detailConfirmationQuestion(draft, questionForRequirementField(firstMissing, plan));
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
  const hasExplicitOutputs =
    Array.isArray(args.requestedOutputs) && args.requestedOutputs.length > 0;
  const requestedOutputs = nonCreationRequest
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
    : nonCreationRequest
      ? { ...resolvedSourceContext, boundary: "non_creation" as const }
      : resolvedSourceContext;
  if (privateDataMutationRequest && previous) {
    return {
      ...previous,
      sourceContext: {
        ...previous.sourceContext,
        ...sourceContext,
      },
    };
  }
  const source: ConciergeSource =
    args.source || (args.ocrContext ? (message ? "mixed" : "upload") : previous?.source || "text");
  const eventType = nonCreationRequest ? "unknown" : detectEventType(text, previous);
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
  const messageEventPurpose = isMeaningfulEventText(message, requestedOutputs)
    ? cleanCreationString(message)
    : null;
  const eventPurpose =
    nonCreationRequest ||
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
  const status = nonCreationRequest
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
        tone,
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
      tone,
    }),
    source,
  } satisfies Omit<ConciergeEventDraft, "missingFields">;

  return {
    ...base,
    missingFields: Array.from(
      new Set([...(needsDateConfirmation ? ["date"] : []), ...status.missingFields]),
    ),
  };
}
