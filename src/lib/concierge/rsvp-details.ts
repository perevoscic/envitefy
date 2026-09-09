export const RSVP_PHONE_PATTERN = /(?<!\d)(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}(?!\d)/;
const RSVP_EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

type RsvpContactDetails = { name: string | null; contact: string };

function contactName(value: string): string | null {
  const name = value
    .replace(/^(?:contact|host)(?:\s+name)?\s*(?:(?:should\s+be|is)\s*|:\s*)?/i, "")
    .replace(/^(?:to|at|with|via|by)\s+/i, "")
    .replace(/\s+(?:at|via|by|on|phone|email)\s*$/i, "")
    .replace(/^[\s,:()–—-]+|[\s,:()–—-]+$/g, "");
  if (!/^[\p{L}][\p{L}'’-]*(?:\s+[\p{L}][\p{L}'’-]*){0,3}$/u.test(name)) return null;
  if (/\b(?:at|to|by|via|with|contact|host|phone|email|text|call|only|please|rsvp|no|gifts?|guests?|deadline|before|after|party|venue)\b/i.test(name)) return null;
  return name;
}

/** Scope contact details to the RSVP clause, including "RSVP at [phone], [name]". */
export function extractRsvpContactDetails(message: string): RsvpContactDetails | null {
  let details: RsvpContactDetails | null = null;
  for (const match of message.matchAll(/(?<![\w.@+-])rsvps?\b(?![@+-])/gi)) {
    const index = match.index || 0;
    const before = message.slice(0, index).split(/[.;!?\n]/).at(-1) || "";
    if (/\b(?:no|without|remove|skip|disable|don['’]?t|do not|should I|can I|could I|would|whether|example|for instance)\b/i.test(before)) continue;
    const clause = message.slice(index + match[0].length, index + 240).split(/[;!?\n]|\.(?=\s|$)/)[0];
    const contactMatch = clause.match(RSVP_EMAIL_PATTERN) || clause.match(RSVP_PHONE_PATTERN);
    if (!contactMatch) continue;
    const contactIndex = contactMatch.index || 0;
    const prefix = clause.slice(0, contactIndex).trim();
    // A later venue or planning clause must not lend its phone number to RSVP.
    if (/\b(?:venue|theat(?:er|re)|cinema|location|cost|budget|not|maybe|instead)\b/i.test(prefix)) continue;
    const suffix = clause.slice(contactIndex + contactMatch[0].length);
    const trailingName = suffix.match(/^\s*(?:,|[-–—]|\()\s*([^,.;!?\n)]+)/)?.[1] || "";
    details = {
      name: contactName(prefix) || contactName(trailingName),
      contact: contactMatch[0],
    };
  }
  return details;
}
