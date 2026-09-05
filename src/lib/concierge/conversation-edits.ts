import * as chrono from "chrono-node";
import type { ConciergeEventDraft, RequestedOutput } from "./types.ts";

const PRODUCT_NAMES: Array<[RequestedOutput, string]> = [
  ["event_page", "event\\s+page"],
  ["live_card", "live\\s*card"],
  ["digital_flyer", "(?:digital\\s+)?flyer(?:\\s*[/&]\\s*invitation)?|invitation"],
  ["signup_form", "(?:smart\\s+)?sign[-\\s]?up\\s+(?:form|sheet)"],
  ["rsvp_page", "rsvp\\s+page"],
  ["whatsapp", "whats\\s?app(?:\\s+(?:message|copy))?"],
  ["text_message", "text\\s+message|sms"],
  ["printable_flyer", "printable\\s+(?:flyer|poster)"],
  ["instagram_story", "(?:instagram|ig)\\s+story"],
  ["reminder", "reminder"],
  ["thank_you_card", "thank[-\\s]*you\\s+card"],
  ["menu", "menu"],
  ["welcome_sign", "welcome\\s+sign"],
];

/** A format mentioned in a question is not a format the customer ordered. */
export function isProductAdviceQuestion(message: string): boolean {
  return (
    /\b(?:which|whether|difference|compare|enough|better|do I need|should (?:I|we) use|(?:can|does|is|would) (?:a|an|the|one))\b/i.test(
      message,
    ) && PRODUCT_NAMES.some(([, pattern]) => new RegExp(`\\b(?:${pattern})\\b`, "i").test(message))
  );
}

export function requestedProductEdits(message: string): {
  selected: RequestedOutput[];
  removed: RequestedOutput[];
  replace: boolean;
} {
  const selected: RequestedOutput[] = [];
  const removed: RequestedOutput[] = [];
  const choiceClauses: string[] = [];
  let replace = false;
  for (const [output, pattern] of PRODUCT_NAMES) {
    const product = `(?:${pattern})`;
    if (
      new RegExp(
        `\\b(?:no|not|without|remove|drop|skip|don['’]?t (?:want|need)|do not (?:want|need))\\s+(?:(?:a|an|the|any)\\s+)?${product}\\b`,
        "i",
      ).test(message)
    ) {
      removed.push(output);
    }
    const choice = new RegExp(
      `(?:\\b(?:only|just)\\s+(?:(?:a|an|the|one)\\s+)?${product}\\b|\\b${product}\\s+only\\b|\\b(?:use|choose|select|switch to|change (?:it|this) to|go with|let['’]?s (?:do|use)|want)\\s+(?:(?:only|just)\\s+)?(?:(?:a|an|the|one)\\s+)?${product}\\b|^\\s*(?:okay|ok|yes)[, ]+(?:an?\\s+)?${product}\\b)`,
      "i",
    );
    const match = message.match(choice);
    if (
      match &&
      !/\b(?:don['’]?t|do not|not|why|whether|should (?:I|we)|can (?:I|we)|better to)\s*$/i.test(
        message.slice(Math.max(0, (match.index || 0) - 20), match.index),
      )
    ) {
      selected.push(output);
      replace = true;
      choiceClauses.push(message.slice(match.index).split(/[.!?;\n]/)[0]);
    }
    // Explicitly requesting another deliverable is different from changing format.
    if (
      new RegExp(
        `\\b(?:also|add|include)\\s+(?:(?:make|create|an?|the)\\s+)*${product}\\b`,
        "i",
      ).test(message)
    ) {
      selected.push(output);
    }
  }
  if (replace) {
    for (const [output, pattern] of PRODUCT_NAMES) {
      if (choiceClauses.some((clause) => new RegExp(`\\b(?:and|plus)\\s+(?:an?\\s+|the\\s+)?(?:${pattern})\\b`, "i").test(clause))) selected.push(output);
    }
  }
  return { selected: [...new Set(selected)], removed, replace };
}

/** Extract only the requested value, including apostrophes inside quoted names. */
export function extractExplicitEventTitle(message: string): string | null {
  const titleContext =
    /\b(?:title|rename|call (?:it|this|the event)|name (?:it|the event))\b/i.test(message);
  const starts = [
    /\btitle\s+(?:it|this|the event)\s+(?:as\s+)?(?:exactly\s+)?/gi,
    /\b(?:event\s+)?title\s+(?:must be|should be|to read)\s*(?:exactly\s*)?[:=]?\s*/gi,
    /\b(?:rename\s+(?:this\s+event|the\s+event|it)|(?:set|change|fix|update|keep)\s+(?:the\s+)?(?:event\s+)?title)\s+(?:to|as)\s*(?:exactly\s*)?/gi,
    /\b(?:call\s+(?:it|this|the event)|name\s+(?:it|the event))\s+/gi,
    ...(titleContext ? [/\b(?:it should be|use exactly|asked for|title\s*:)\s*/gi] : []),
    /\b(?:event\s+)?title\s+is\s*(?:exactly\s*)?[:=]?\s*/gi,
  ];
  for (const start of starts) {
    const matches = [...message.matchAll(start)];
    for (const match of matches.reverse()) {
      const rest = message.slice((match.index || 0) + match[0].length).trim();
      const quoted = rest.match(/^["“‘'](.{1,140}?)["”’'](?=\s*(?:[.,;!?]|$|and\b|but\b))/);
      const raw = quoted?.[1] || rest.split(/[.!?\n;:]|,\s*(?:and|with|on)\b/)[0];
      const title = (quoted ? raw : raw?.replace(/^the\s+/i, "").replace(/["“”‘’']$/g, ""))?.trim();
      if (
        title &&
        title.length <= 140 &&
        !/\b(?:sidebar|please|you used|whole message|should|must|starts|still says)\b/i.test(title)
        && !/^(?:wrong|incorrect|broken|not right)[.! ]*$/i.test(title)
      )
        return title;
    }
  }
  return null;
}

/** Quoted field values stay intact even when the rest of the message changes other fields. */
export function extractExplicitEventLocation(message: string): string | null {
  const field = "(?:location|venue|place|address)";
  const quoted = "[\"“‘'](.{1,180}?)[\"”’']";
  const patterns = [
    new RegExp(`\\b(?:set|change|update|keep|use)\\s+(?:the\\s+)?${field}\\s+(?:to|as)\\s+(?:exactly\\s+|only\\s+)?${quoted}(?=\\s*(?:[.,;!?]|$|and\\b|but\\b))`, "gi"),
    new RegExp(`\\b${field}\\s+(?:should (?:be|say)|must (?:be|say)|is|will be)\\s+(?:exactly\\s+|only\\s+)?${quoted}(?=\\s*(?:[.,;!?]|$|and\\b|but\\b))`, "gi"),
    new RegExp(`\\b(?:keep|use|put)\\s+${quoted}\\s+(?:as|for)\\s+(?:the\\s+)?${field}\\b`, "gi"),
  ];
  const matches = patterns.flatMap((pattern) => [...message.matchAll(pattern)]);
  const latest = matches.sort((a, b) => (b.index || 0) - (a.index || 0))[0];
  return latest?.[1]?.trim() || null;
}

export function extractExplicitRsvpEnabled(message: string): boolean | null {
  const subject = "(?:(?:the|our|my)\\s+)?(?:(?:online|envitefy)\\s+)?rsvps?";
  const choices: Array<{ index: number; enabled: boolean }> = [];
  for (const [pattern, enabled] of [
    [`\\b(?:turn|switch)\\s+${subject}\\s+(?:off|on)\\b`, null],
    [`\\b(?:turn|switch)\\s+(?:off|on)\\s+${subject}\\b`, null],
    [`\\bset\\s+${subject}\\s+to\\s+(?:off|on)\\b`, null],
    [`\\b(?:disable|remove|skip|without|no)\\s+${subject}\\b`, false],
    [`\\b(?:enable|add)\\s+${subject}\\b`, true],
  ] as const) {
    for (const match of message.matchAll(new RegExp(pattern, "gi"))) {
      const before = message.slice(Math.max(0, (match.index || 0) - 25), match.index);
      if (/\b(?:don['’]?t|do not|should I|can I|could I|whether to)\s*$/i.test(before)) continue;
      choices.push({ index: match.index || 0, enabled: enabled ?? /\bon\b/i.test(match[0]) });
    }
  }
  return choices.sort((a, b) => b.index - a.index)[0]?.enabled ?? null;
}

export function possessiveBirthdayMilestone(message: string): { name: string; age: string } | null {
  const match = message.match(/(?<![\p{L}])([\p{Lu}][\p{L}'’-]{1,30})['’]s\s+(\d{1,3})(?:st|nd|rd|th)\b(?!\s+(?:anniversary|wedding))/u);
  return match && Number(match[2]) <= 120 ? { name: match[1], age: match[2] } : null;
}

/** A person's stated age is an event fact, not a relative date or a start time. */
export function extractNamedAge(message: string, options: { allowBareAge?: boolean } = {}): { name: string; age: string } | null {
  const name = "([\\p{L}][\\p{L}'’-]{1,30}(?:\\s+[\\p{Lu}][\\p{L}'’-]{1,30}){0,2})";
  const patterns = [
    new RegExp(`(?<![\\p{L}])${name}\\s*,?\\s*(?:is\\s+)?(\\d{1,3})\\s*(?:[- ]\\s*)?(?:years?|yrs?)\\s*(?:[- ]\\s*)?old\\b`, "gu"),
    new RegExp(`(?<![\\p{L}])${name}\\s*,?\\s+(?:(?:is\\s+)?turning|turns|aged?|age is)\\s*:?\\s*(\\d{1,3})\\b`, "gu"),
    ...(options.allowBareAge ? [new RegExp(`(?<![\\p{L}])${name}\\s*,\\s*(\\d{1,3})(?=\\s*(?:,|on\\b|$))`, "gu")] : []),
  ];
  const matches = patterns.flatMap((pattern) => [...message.matchAll(pattern)]).sort((a, b) => (a.index || 0) - (b.index || 0));
  for (const match of matches) {
    const candidate = match[1].replace(/^(?:(?:birthday|bday|event(?:\s+page)?|live\s*card|flyer(?:\s+invitation)?|invitation|for|fro|honoree|name|daughter|son|mum|mom|dad)\s+)+/i, "");
    if (!candidate || /^(?:I|she|he|they|it|we|our|my|the|is|are|for|turning|birthday|bday|event|party|workshop|company|business|anniversary|January|February|March|April|May|June|July|August|September|October|November|December)$/i.test(candidate)) continue;
    if (Number(match[2]) > 120 || /\b(?:anniversary|hours?|minutes?|days?)\b/i.test(match[0])) continue;
    return { name: candidate[0].toUpperCase() + candidate.slice(1), age: match[2] };
  }
  return null;
}

function isSingleMonthTypo(word: string, month: string): boolean {
  if (word === month) return false;
  if (word.length === month.length) {
    const different = [...word].map((letter, index) => letter !== month[index] ? index : -1).filter((index) => index >= 0);
    return different.length === 1 || different.length === 2 && different[1] === different[0] + 1 && word[different[0]] === month[different[1]] && word[different[1]] === month[different[0]];
  }
  const [shorter, longer] = word.length < month.length ? [word, month] : [month, word];
  return longer.length === shorter.length + 1 && [...longer].some((_letter, index) => longer.slice(0, index) + longer.slice(index + 1) === shorter);
}

/** Normalize date spelling only beside a day number, and remove non-schedule age/duration phrases. */
export function normalizeEventScheduleText(message: string, options: { allowBareAge?: boolean } = {}): string {
  const months = ["January", "February", "August", "September", "October", "November", "December"];
  let text = message.replace(/\b([a-z]{5,10})(?=\s+\d{1,2}(?:st|nd|rd|th)?\b)/gi, (word: string) => {
    const matches = months.filter((month) => isSingleMonthTypo(word.toLowerCase(), month.toLowerCase()));
    return matches.length === 1 ? matches[0] : word;
  });
  text = text
    .replace(/\b\d{1,3}\s*(?:[- ]\s*)?(?:years?|yrs?)\s*(?:[- ]\s*)?old\b/gi, "")
    .replace(/\b(?:(?:is\s+)?turning|turns|aged?|age is)\s*:?\s*\d{1,3}\b/gi, "")
    .replace(/\b\d{1,3}(?:st|nd|rd|th)?(?:[- ]+years?)?[- ]+(?=(?:birthday|anniversary)\b)/gi, "")
    .replace(/\b(?:lasts?|lasting|duration(?: of)?|runs? for|for)\s+\d+(?:\.\d+)?[- ]*(?:hours?|hrs?|minutes?|mins?|days?|weeks?|months?|years?)\b/gi, "");
  if (options.allowBareAge) text = text.replace(/\b([\p{L}][\p{L}'’-]{1,30})\s*,\s*\d{1,3}(?=\s*(?:,|on\b|$))/gu, "$1");
  return text;
}

export function hasExplicitEventSchedule(message: string): boolean {
  return chrono.parse(normalizeEventScheduleText(message), new Date(), { forwardDate: true })
    .some((result) => !result.tags().has("result/relativeDate") && (result.start.isCertain("day") || result.start.isCertain("hour")));
}

export type PreviewCopyFacts = Pick<ConciergeEventDraft,
  "startISO" | "endISO" | "timezone" | "location" | "venue" | "rsvpContact" | "rsvpDeadline" | "rsvpEnabled"
>;

/** Reject prose only when it still states a known fact that this edit changed or removed. */
export function hasStalePreviewFacts(body: string, previous: PreviewCopyFacts, next: PreviewCopyFacts): boolean {
  const normalized = (value: string | null | undefined) => (value || "").replace(/\s+/g, " ").trim().toLowerCase();
  const copy = normalized(body);
  const repeatsRemovedText = (before: string | null | undefined, after: string | null | undefined) => {
    const oldValue = normalized(before);
    const newValue = normalized(after);
    return Boolean(oldValue && oldValue !== newValue && !newValue.includes(oldValue) && copy.includes(oldValue));
  };
  if (
    repeatsRemovedText(previous.location || previous.venue, next.location || next.venue) ||
    repeatsRemovedText(previous.rsvpContact, next.rsvpContact) ||
    repeatsRemovedText(previous.rsvpDeadline, next.rsvpDeadline)
  ) return true;
  const oldPhone = (previous.rsvpContact || "").replace(/\D/g, "");
  if (oldPhone.length >= 7 && oldPhone !== (next.rsvpContact || "").replace(/\D/g, "") && body.replace(/\D/g, "").includes(oldPhone)) return true;
  if (previous.rsvpEnabled === true && next.rsvpEnabled === false && /\b(?:rsvp\s+(?:online|below)|(?:click|tap|use)\s+(?:the\s+)?rsvp\s+(?:button|link))\b/i.test(body)) return true;

  const parsed = [...chrono.parse(body), ...chrono.es.parse(body)];
  const validDate = (value: string | null | undefined) => {
    const date = new Date(value || "");
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const eventClock = (date: Date | null, timezone: string) => {
    if (!date) return null;
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone || "UTC", year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric", hourCycle: "h23",
    };
    let formatter: Intl.DateTimeFormat;
    try { formatter = new Intl.DateTimeFormat("en-US", options); }
    catch { formatter = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }); }
    const parts = formatter.formatToParts(date);
    const number = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
    return { year: number("year"), month: number("month"), day: number("day"), hour: number("hour"), minute: number("minute") };
  };
  type EventClock = ReturnType<typeof eventClock>;
  const matchesDay = (part: chrono.ParsedComponents, date: EventClock) => Boolean(date &&
    part.isCertain("month") && part.isCertain("day") &&
    part.get("month") === date.month && part.get("day") === date.day &&
    (!part.isCertain("year") || part.get("year") === date.year));
  const matchesTime = (part: chrono.ParsedComponents, date: EventClock) => Boolean(date &&
    part.isCertain("hour") && part.get("hour") === date.hour && (part.get("minute") || 0) === date.minute);
  const currentClocks = [next.startISO, next.endISO].map((value) => eventClock(validDate(value), next.timezone));
  for (const field of ["startISO", "endISO"] as const) {
    const beforeDate = validDate(previous[field]);
    const afterDate = validDate(next[field]);
    if (!beforeDate || (beforeDate.getTime() === afterDate?.getTime() && previous.timezone === next.timezone)) continue;
    const before = eventClock(beforeDate, previous.timezone);
    for (const result of parsed) {
      for (const part of [result.start, result.end]) {
        if (!part) continue;
        if (matchesDay(part, before) && !currentClocks.some((clock) => matchesDay(part, clock))) return true;
        if (matchesTime(part, before) && !currentClocks.some((clock) => matchesTime(part, clock))) return true;
      }
    }
  }
  return false;
}

export function pairedHonorees(message: string): string | null {
  const pair = "([\\p{Lu}][\\p{L}'’-]{1,30})\\s+(?:and|&)\\s+([\\p{Lu}][\\p{L}'’-]{1,30}?)";
  const match =
    message.match(new RegExp(`\\b(?:twins|children|kids)[:,]?\\s+${pair}(?=[, .]|$)`, "u")) ||
    message.match(
      new RegExp(
        `\\b${pair}(?:['’]s)?\\s+(?:\\d{1,3}(?:st|nd|rd|th)\\s+)?(?:[Bb]irthday|[Pp]arty)\\b`,
        "u",
      ),
    ) ||
    message.match(new RegExp(`\\b${pair}\\s+(?:are\\s+)?(?:turning|turn|turns)\\s+\\d`, "u"));
  return match ? `${match[1]} & ${match[2]}` : null;
}
