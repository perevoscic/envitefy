const EMPTY_NOTE =
  /^(?:n\/?a|none|not applicable|tbd|no (?:additional |extra |special |other )?(?:information|info|details|instructions|notes)(?: (?:provided|available|needed))?)[.!]?$/i;
const GENERIC_REMINDER =
  /^(?:bring your appointment details with you|have fun|enjoy (?:the |your )?(?:event|party|celebration)|we (?:look forward to|can['’]?t wait to) see(?:ing)? you|see you there|save the date)[.!]?$/i;
const BOILERPLATE =
  /^(?:please join|join us|come (?:and |to )?(?:join|celebrate)|you(?:['’]re| are) invited|a (?:joyful|special|wonderful|memorable) (?:event|celebration)|(?:event|details|information) (?:from|on|extracted from) (?:the |a )?(?:flyer|invitation|document)|(?:this |the )?event (?:is |was )?scheduled\b)/i;
const PRACTICAL_DETAIL =
  /\b(?:bring|wear|dress|attire|equipment|supplies|rsvp|respond|register|registration|tickets?|admission|fees?|costs?|free|parking|park in|entrance|enter through|check[ -]?in|arrive|arrival|minutes? (?:early|before)|dinner|dancing|reception|lunch|breakfast|refreshments?|food|drinks?|served|provided|gifts?|registry|donations?|ages?|adults? only|children|parents?|guardians?|waivers?|required|must|prohibited|not allowed|rain|weather|cancel\w*|reschedul\w*|fasting|fast|insurance|photo id|medications?|allerg\w*|accessib\w*|wheelchair|proceeds|benefit|deadline|limited|capacity|cash|card only|prizes?|raffle)\b|[$€£]\s*\d/i;

export function hasPracticalScanDetails(value: string): boolean {
  return PRACTICAL_DETAIL.test(value);
}

const key = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

/** Keep additional information, not boilerplate or another copy of the event's main fields. */
export function usefulScanNotes(
  value: string | null | undefined,
  alreadyShown: Array<string | string[] | null | undefined> = [],
): string {
  const rendered = alreadyShown
    .flat()
    .filter((item): item is string => typeof item === "string")
    .map(key)
    .filter(Boolean);
  const seen = new Set<string>();
  return String(value || "")
    .replace(/^\s*(?:good to know|notes?|details)\s*:\s*/i, "")
    .split(/\n+|(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter((part) => {
      const normalized = key(part);
      if (
        !normalized ||
        seen.has(normalized) ||
        EMPTY_NOTE.test(part) ||
        GENERIC_REMINDER.test(part)
      )
        return false;
      seen.add(normalized);
      if (
        rendered.some(
          (field) => field === normalized || (normalized.length > 12 && field.includes(normalized)),
        )
      )
        return false;
      const practical = hasPracticalScanDetails(part);
      if (!practical && BOILERPLATE.test(part)) return false;
      // A sentence restating multiple logistics adds nothing. Preserve a useful
      // instruction even when it references the same venue or event time.
      const repeatedFields = rendered.filter(
        (field) => field.length > 5 && normalized.includes(field),
      );
      return practical || new Set(repeatedFields).size < 2;
    })
    .join("\n\n");
}
