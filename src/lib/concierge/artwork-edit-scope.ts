import {
  extractExplicitEventLocation,
  extractExplicitEventTitle,
  extractExplicitRsvpEnabled,
  extractNamedAge,
  hasExplicitEventSchedule,
} from "./conversation-edits.ts";
import { isArtworkRedesignRequest } from "./artwork-redesign-intent.ts";
import type { ConciergeEventDraft } from "./types.ts";
import { hasVisualChangeWords } from "./visual-direction.ts";

const APPEARANCE_WORDS =
  /\b(?:purple|purplish|lavender|lilac|blue|pink|red|green|yellow|orange|gold|silver|black|white|pastel|colorful|colourful|elegant|minimal(?:ist)?|simple|floral|balloons?|confetti|decorations?)\b/i;

/** A new look is not a new event, including short requests without the word "artwork". */
export function isArtworkDirection(message: string): boolean {
  return (
    hasVisualChangeWords(message) ||
    isArtworkRedesignRequest(message) ||
    (APPEARANCE_WORDS.test(message) &&
      /\b(?:make|create|generate|design|use|add|remove|change|card|invitation|invite|flyer)\b/i.test(
        message,
      ))
  );
}

export function isSameCreationEvent(
  previous: ConciergeEventDraft,
  next: ConciergeEventDraft,
): boolean {
  return (
    previous.creationSessionId === next.creationSessionId &&
    previous.contextStartMessage === next.contextStartMessage
  );
}

/**
 * Only lock facts when the turn changes appearance alone. Mixed requests still
 * go through fact extraction, so "make it purple and move it to 6pm" works.
 * These checks deliberately include additions, corrections, removals and privacy.
 */
export type ArtworkEventIdentity = Pick<
  ConciergeEventDraft,
  "eventType" | "honoreeName" | "ageOrMilestone"
>;

export function isArtworkOnlyEdit(message: string, previous: ArtworkEventIdentity): boolean {
  if (!isArtworkDirection(message)) return false;
  // Removing printed information from an image does not retract the event fact.
  const facts = message.replace(
    /\b(?:remove|hide|omit)\s+(?:the\s+)?(?:date|time|location|venue|address|rsvp|name|age)\s+(?:text|line|label)\s+from\s+(?:the\s+)?(?:image|artwork|background|picture)\b/gi,
    "",
  );
  const explicitTitle = extractExplicitEventTitle(facts);
  if (
    explicitTitle &&
    !/^(?:cursive|bold|italic|script|calligraphy|purple|gold|blue|pink)$/i.test(explicitTitle)
  )
    return false;
  const nameAndAge = extractNamedAge(facts, { allowBareAge: previous.eventType === "birthday" });
  if (
    nameAndAge &&
    (nameAndAge.name.toLowerCase() !== previous.honoreeName?.toLowerCase() ||
      nameAndAge.age !== previous.ageOrMilestone)
  )
    return false;
  if (
    /\b(?:name\s+is|names\s+are|(?:rename|correct|change|replace|set)\s+(?:the\s+)?(?:name|honoree|age)\s+(?:to|with)|(?:turning|turns)\s+\d+)\b|\b(?:name|honoree)\s*:/i.test(
      facts,
    ) &&
    !nameAndAge
  )
    return false;
  const couple = facts.match(
    /^(?:\s*(?:for|names are|wedding for)\s+)?([A-Z][\p{L}'’-]+\s+(?:and|&)\s+[A-Z][\p{L}'’-]+)/u,
  )?.[1];
  if (couple && couple !== previous.honoreeName) return false;
  if (hasExplicitEventSchedule(facts)) return false;
  if (
    /\b(?:clear|remove|forget|cancel|change|move|reschedule)\s+(?:the\s+)?(?:date|time|schedule|event|party|ceremony|reception|dinner|after[- ]?party)\b/i.test(
      facts,
    )
  )
    return false;
  if (
    extractExplicitEventLocation(facts) ||
    /\b(?:location|venue|address)\s*(?::|\bis\b|\bwill be\b|\bshould be\b)|\b(?:change|move|set|switch|correct|update|clear|remove)\s+(?:the\s+)?(?:location|venue|address)\b/i.test(
      facts,
    ) ||
    /\b(?:party|event|ceremony|reception|dinner|pizza|after[- ]?party)\s+(?:(?:is|will be|will happen)\s+)?(?:at|in|to)\b|\bat\s+[A-Z][\p{L}'’-]+(?:\s+[A-Z][\p{L}'’-]+)+/u.test(
      facts,
    )
  )
    return false;
  if (
    extractExplicitRsvpEnabled(facts) !== null ||
    /\brsvps?\s*(?::|\bis\b|\b(?:yes|no|on|off|by|at|to|contact|deadline)\b)|\b\d+\s+(?:guests?|people|kids?|attendees)\b/i.test(
      facts,
    )
  )
    return false;
  if (
    /https?:\/\/|\b(?:registry|gift (?:link|note|preference)|no gifts|budget|allerg(?:y|ies)|dietary|wheelchair|step[- ]free|private|privately|phone|email|manual replies|English|Spanish|French|Portuguese|German|Italian|Arabic|Hebrew|Hindi|Mandarin|Chinese|Japanese|Korean)\b/i.test(
      facts,
    )
  )
    return false;
  if (
    /\b(?:event type|event category|it['’]s (?:a|an)|it is (?:a|an)|actually (?:a|an))\b/i.test(
      facts,
    )
  )
    return false;
  return true;
}
