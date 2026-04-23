export function detectSpelledTime(
  raw: string,
): { hour: number; minute: number; meridiem: "am" | "pm" | null } | null {
  const text = (raw || "").toLowerCase();
  const numberMap: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
  };
  const word = "one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve";
  const oc = "o(?:'|’|`)?clock";
  const mer = "(?:in\\s+the\\s+)?(morning|afternoon|evening|night)";
  const re1 = new RegExp(`\\b(${word})\\b(?:\\s+${oc})?(?:\\s+${mer})?`, "i");
  const m = text.match(re1);
  if (!m) return null;
  const numWord = (m[1] || "").toLowerCase();
  const hour = numberMap[numWord];
  if (!hour) return null;
  const meridiemWord = (m[2] || "").toLowerCase();
  let meridiem: "am" | "pm" | null = null;
  if (meridiemWord) {
    if (/(afternoon|evening|night)/i.test(meridiemWord)) meridiem = "pm";
    if (/morning/i.test(meridiemWord)) meridiem = "am";
  }
  return { hour, minute: 0, meridiem };
}

export function cleanAddressLabel(input: string): string {
  let s = input.trim();
  s = s.replace(/^\s*(location|address|venue|where)\s*[:-]?\s*/i, "");
  s = s.replace(/^\s*at\s+/i, "");
  s = s.replace(/[\r\n]+/g, ", ");
  s = s.replace(/\s*,\s*/g, ", ");
  s = s.replace(/\s{2,}/g, " ");
  s = s.replace(/,\s*,+/g, ", ");
  s = s.replace(/^[,\s-]+/, "");
  s = s.replace(/[,\s-]+$/g, "");
  return s.trim();
}

export function pickVenueLabelForSentence(
  location?: string,
  description?: string,
  rawText?: string,
): string {
  try {
    const venueKeywords =
      /\b(Arena|Center|Hall|Gym|Gymnastics|Park|Room|Studio|Lanes|Bowl|Skate|Club|Cafe|Restaurant|Brewery|Church|School|Community|Auditorium|Ballroom|Course|Playground|Aquatic|Aquarium|Zoo|Museum|Stadium|Field|Court|Theater|Theatre)\b/i;
    if (location) {
      const parts = cleanAddressLabel(String(location))
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length) {
        const first = parts[0];
        if (parts.length >= 2) {
          const second = parts[1];
          const secondLooksVenue = second && !/\d/.test(second) && venueKeywords.test(second);
          if (secondLooksVenue && first && !/\d/.test(first)) {
            return `${first}, ${second}`;
          }
        }
        if (first && (!/\d/.test(first) || venueKeywords.test(first))) return first;
      }
    }
    const lineWithAt = (description || "")
      .split("\n")
      .map((l) => l.trim())
      .find((l) => /\bat\s+[^\d].{2,}/i.test(l));
    if (lineWithAt) {
      const m = lineWithAt.match(/\bat\s+([^,.\n]+?)(?:\s*[,.]|$)/i);
      const cand = (m?.[1] || "").replace(/\s{2,}/g, " ").trim();
      if (cand && (!/\d/.test(cand) || venueKeywords.test(cand))) return cand;
    }
    if (rawText) {
      const lines = rawText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      for (const line of lines) {
        if (line.length < 4 || line.length > 80) continue;
        if (!venueKeywords.test(line)) continue;
        const alphaCount = line.replace(/[^A-Za-z\s]/g, "").length;
        if (alphaCount / line.length < 0.6) continue;
        return line.replace(/\s{2,}/g, " ");
      }
    }
  } catch {}
  return "";
}

export function splitVenueFromAddress(
  input: string,
  description?: string,
  rawText?: string,
): { venue: string | null; address: string } {
  const cleaned = cleanAddressLabel(input || "");
  if (!cleaned) return { venue: null, address: "" };
  const segments = cleaned
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (!segments.length) return { venue: null, address: "" };

  const venueKeywords =
    /\b(Arena|Center|Hall|Gym|Gymnastics|Park|Room|Studio|Lanes|Bowl|Skate|Club|Cafe|Restaurant|Brewery|Church|School|Community|Auditorium|Ballroom|Course|Playground|Aquatic|Aquarium|Zoo|Museum|Stadium|Field|Court|Theater|Theatre|Complex|Ballpark|Ball Field)\b/i;
  const suiteKeywords =
    /\b(suite|ste|apt|unit|floor|fl|room|rm|bldg|building|wing|hallway|level|lot)\b/i;
  const candidateRaw = (pickVenueLabelForSentence(cleaned, description, rawText) || "").trim();
  const candidateParts = candidateRaw
    ? candidateRaw
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
    : [];
  const candidateSet = new Set(candidateParts.map((part) => part.toLowerCase()));

  let streetIdx = segments.findIndex((segment) => /\d/.test(segment));
  if (streetIdx === -1) streetIdx = 0;
  const stateRe =
    /\b(?:A[KLRZ]|C[AOT]|D[EC]|F[LM]|G[AU]|HI|I[ADLN]|K[SY]|LA|M[ADEINOST]|N[CDEHJMVY]|O[HKR]|P[AE]|RI|S[CD]|T[NX]|UT|V[AIT]|W[AIVY])\b/;
  const zipRe = /\b\d{5}(?:-\d{4})?\b/;
  let cityIdx = -1;
  for (let i = segments.length - 1; i >= 0; i--) {
    const segment = segments[i];
    if (zipRe.test(segment) || stateRe.test(segment)) {
      cityIdx = i;
      break;
    }
  }
  if (cityIdx === -1 && segments.length > streetIdx + 1) {
    cityIdx = segments.length - 1;
  }

  const venueParts: string[] = [];
  const addressParts: string[] = [];

  segments.forEach((segment, idx) => {
    const lower = segment.toLowerCase();
    const betweenStreetAndCity = idx > streetIdx && (cityIdx === -1 || idx < cityIdx);
    const matchesCandidate =
      candidateSet.has(lower) ||
      (candidateRaw &&
        !/\d/.test(segment) &&
        candidateRaw.toLowerCase().includes(lower) &&
        lower.length >= 3);
    const looksVenue = !/\d/.test(segment) && venueKeywords.test(segment);
    const isSuite = suiteKeywords.test(segment);
    if (!isSuite && (matchesCandidate || (betweenStreetAndCity && looksVenue))) {
      if (!venueParts.some((part) => part.toLowerCase() === lower)) {
        venueParts.push(segment);
      }
      return;
    }
    addressParts.push(segment);
  });

  let venue = venueParts.join(", ");
  if (!venue && candidateRaw) {
    venue = candidateRaw;
  } else if (venue && candidateRaw) {
    const lowerVenue = venue.toLowerCase();
    if (!lowerVenue.includes(candidateRaw.toLowerCase())) {
      venue = `${venue}, ${candidateRaw}`.replace(/,\s*,+/g, ", ");
    }
  }

  let address = addressParts.join(", ").replace(/,\s*,+/g, ", ").trim();
  if (!address && cleaned) {
    address = cleaned;
  }
  return {
    venue: venue ? venue.trim() : null,
    address,
  };
}

export function inferTimezoneFromAddress(addressOrText: string): string | null {
  const s = (addressOrText || "").toLowerCase();
  const has = (...parts: string[]) => parts.some((p) => s.includes(p.toLowerCase()));
  if (has("fresno", "los angeles", "san francisco", "san jose", "sacramento", "oakland", "san diego"))
    return "America/Los_Angeles";
  if (has("phoenix", "mesa", "tucson", "az ", " arizona")) return "America/Phoenix";
  if (has("seattle", "spokane", "wa ", " washington")) return "America/Los_Angeles";
  if (has("portland", "or ", " oregon")) return "America/Los_Angeles";
  if (has("boise", "id ", " idaho")) return "America/Boise";
  if (
    has(
      "denver",
      "co ",
      " colorado",
      "ut ",
      " utah",
      "nm ",
      " new mexico",
      "mt ",
      " montana",
      "wy ",
      " wyoming",
    )
  )
    return "America/Denver";
  if (
    has(
      "chicago",
      "il ",
      " illinois",
      "wi ",
      " wisconsin",
      "mn ",
      " minnesota",
      "ia ",
      " iowa",
      "mo ",
      " missouri",
      "ok ",
      " oklahoma",
      "ks ",
      " kansas",
      "ne ",
      " nebraska",
      "tx ",
      " texas",
      "la ",
      " louisiana",
      "ar ",
      " arkansas",
      "tn ",
      " tennessee",
    )
  )
    return "America/Chicago";
  if (
    has(
      "new york",
      "ny ",
      "nyc",
      "fl ",
      " florida",
      "ga ",
      " georgia",
      "nc ",
      " north carolina",
      "sc ",
      " south carolina",
      "pa ",
      " pennsylvania",
      "nj ",
      " new jersey",
      "oh ",
      " ohio",
      "mi ",
      " michigan",
      "va ",
      " virginia",
      "dc",
      "washington, dc",
      "ma ",
      " massachusetts",
      "ct ",
      " connecticut",
    )
  )
    return "America/New_York";
  if (has("anchorage", "ak ", " alaska")) return "America/Anchorage";
  if (has("honolulu", "hi ", " hawaii")) return "Pacific/Honolulu";
  if (has(" ca ", " california")) return "America/Los_Angeles";
  if (has(" wa ", " washington")) return "America/Los_Angeles";
  if (has(" or ", " oregon")) return "America/Los_Angeles";
  if (has(" nv ", " nevada")) return "America/Los_Angeles";
  if (has(" az ", " arizona")) return "America/Phoenix";
  if (
    has(
      " co ",
      " colorado",
      " ut ",
      " utah",
      " nm ",
      " new mexico",
      " mt ",
      " montana",
      " wy ",
      " wyoming",
      " id ",
      " idaho",
    )
  )
    return "America/Denver";
  if (
    has(
      " il ",
      " illinois",
      " wi ",
      " wisconsin",
      " mn ",
      " minnesota",
      " ia ",
      " iowa",
      " mo ",
      " missouri",
      " ok ",
      " oklahoma",
      " ks ",
      " kansas",
      " ne ",
      " nebraska",
      " la ",
      " louisiana",
      " ar ",
      " arkansas",
      " tx ",
      " texas",
    )
  )
    return "America/Chicago";
  if (
    has(
      " ny ",
      " new york",
      " nj ",
      " new jersey",
      " pa ",
      " pennsylvania",
      " oh ",
      " ohio",
      " mi ",
      " michigan",
      " ga ",
      " georgia",
      " fl ",
      " florida",
      " ma ",
      " massachusetts",
      " ct ",
      " connecticut",
      " dc",
    )
  )
    return "America/New_York";
  return null;
}

export function stripInvitePhrases(s: string): string {
  return s
    .replace(/^\s*(you\s+are\s+invited\s+to[:\s-]*)/i, "")
    .replace(/^\s*(you'?re\s+invited\s+to[:\s-]*)/i, "")
    .replace(/^\s*(you\s+are\s+invited[:\s-]*)/i, "")
    .replace(/^\s*(you'?re\s+invited[:\s-]*)/i, "")
    .replace(/^\s*\b(cordially\s+)?invites?\s+you\s+to(?:\s+join)?\b[:\s,-]*/i, "")
    .replace(
      /^\s*\b(requests?\s+the\s+(honou?r|pleasure)\s+of\s+your\s+(presence|company))\b[:\s,-]*/i,
      "",
    )
    .replace(/^\s*(please\s+)?join\s+us\s*(for)?[:\s,-]*/i, "")
    .trim();
}

export function stripJoinUsLanguage(description: string): string {
  if (!description) return description;
  const cleanedLines = description
    .split("\n")
    .map((line) => stripInvitePhrases(line))
    .map((line) => line.replace(/^\s*(please\s+)?join\s+us\s*(for)?[:\s,-]*/i, ""))
    .map((line) => line.replace(/^\s*(let's\s+)?celebrate\s+with\s+us[:\s,-]*/i, ""))
    .map((line) => line.trim())
    .filter(
      (line, idx, arr) => line.length > 0 || (idx < arr.length - 1 && arr[idx + 1].length > 0),
    );
  return cleanedLines.join("\n");
}

export function improveJoinUsFor(description: string, title: string, location?: string): string {
  try {
    const lines = (description || "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const joinIdx = lines.findIndex((l) => /^join\s+us\s+for\s*$/i.test(l));
    if (joinIdx === -1) return description;

    const possessiveMatch = (title || "").match(
      /\b([A-Z][A-Za-z-]+(?:\s+[A-Z][A-Za-z-]+){0,2})[’']s\b/,
    );
    if (!possessiveMatch) return description;

    const namePossessive = possessiveMatch[0];
    const nextIsBirthdayParty =
      !!lines[joinIdx + 1] && /\bbirthday\s*party\b/i.test(lines[joinIdx + 1]);
    const venueKeywords =
      /\b(Arena|Center|Hall|Gym|Gymnastics|Park|Room|Studio|Lanes|Bowl|Skate|Club|Bar|Cafe|Restaurant|Brewery|Church|School|Community|Auditorium|Ballroom)\b/i;
    const timeToken = /\b\d{1,2}(:\d{2})?\s*(a\.?m\.?|p\.?m\.?)\b/i;
    let usedVenueIdx: number | null = null;
    let venue = "";
    try {
      const loc = cleanAddressLabel(String(location || ""))
        .split(",")[0]
        .trim();
      if (loc && !/\d/.test(loc) && venueKeywords.test(loc)) venue = loc;
    } catch {}
    if (!venue) {
      const candidates: Array<{ idx: number; text: string }> = [];
      const consider = (idx: number) => {
        const s = lines[idx];
        if (!s) return;
        const t = cleanAddressLabel(s);
        if (!t || /\d/.test(t) || timeToken.test(t)) return;
        if (venueKeywords.test(t)) candidates.push({ idx, text: t });
      };
      if (nextIsBirthdayParty) consider(joinIdx + 2);
      consider(joinIdx + 1);
      consider(joinIdx + 3);
      consider(joinIdx - 1);
      if (candidates.length) {
        const pick = candidates[0];
        venue = pick.text;
        usedVenueIdx = pick.idx;
      }
    }

    const replacement =
      `Celebrating ${namePossessive}${nextIsBirthdayParty ? " Birthday Party" : ""}${venue ? ` at ${venue}` : ""}`
        .replace(/\s+/g, " ")
        .trim();

    lines[joinIdx] = replacement;
    if (nextIsBirthdayParty) lines.splice(joinIdx + 1, 1);
    if (usedVenueIdx !== null) {
      const adjustedIdx =
        usedVenueIdx > joinIdx && nextIsBirthdayParty ? usedVenueIdx - 1 : usedVenueIdx;
      if (
        adjustedIdx >= 0 &&
        adjustedIdx < lines.length &&
        lines[adjustedIdx] &&
        /\b(birthday\s*party)\b/i.test(replacement)
      ) {
        lines.splice(adjustedIdx, 1);
      }
    }
    return lines.join("\n");
  } catch {
    return description;
  }
}

export function buildFriendlyBirthdaySentence(title: string, location?: string): string {
  const extractPossessive = (value: string): string | null => {
    const m = (value || "").match(/\b([A-Z][A-Za-z-]+(?:\s+[A-Z][A-Za-z-]+){0,2})[’']s\b/);
    if (m?.[1]) return `${m[1]}'s`;
    const first = (value || "").match(/\b([A-Z][A-Za-z-]+)\b/);
    return first ? `${first[1]}'s` : null;
  };
  const who = extractPossessive(title) || "Our";
  const venue = (location || "").trim();
  const atPart = venue ? ` at ${venue}` : "";
  return `${who} Birthday Party${atPart}.`;
}

export type ExtractedRsvpDetails = {
  contact: string | null;
  url: string | null;
  deadline: string | null;
};

const RSVP_PHONE_REGEX =
  /(?:\+?1[-.\s]?)?(?:\(\s*\d{3}\s*\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}\b/;
const RSVP_EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const RSVP_URL_REGEX =
  /(?:https?:\/\/[^\s)]+|www\.[^\s)]+|(?:[a-z0-9-]+\.)+(?:com|net|org|io|co|us|info|wedding|events)(?:\/[^\s),;!?]*)?)/i;

function trimRsvpUrl(raw: string | null): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[)>.,]+$/g, "").trim();
  if (!cleaned) return null;
  return /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
}

function extractRsvpDeadline(text: string): string | null {
  const patterns = [
    /\brsvp(?:\s+by)?\s+([A-Z][a-z]+\.?\s+\d{1,2}(?:st|nd|rd|th)?(?:,\s*\d{4})?)/i,
    /\brespond(?:\s+by)?\s+([A-Z][a-z]+\.?\s+\d{1,2}(?:st|nd|rd|th)?(?:,\s*\d{4})?)/i,
    /\breply(?:\s+by)?\s+([A-Z][a-z]+\.?\s+\d{1,2}(?:st|nd|rd|th)?(?:,\s*\d{4})?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = (match?.[1] || "").trim().replace(/[.:,]+$/g, "");
    if (value) return value;
  }
  return null;
}

function stripRsvpNoise(value: string, deadline: string | null, url: string | null): string {
  let cleaned = value;
  if (url) {
    cleaned = cleaned.replace(url, " ");
    cleaned = cleaned.replace(url.replace(/^https?:\/\//i, ""), " ");
  }
  if (deadline) {
    const escapedDeadline = deadline.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    cleaned = cleaned.replace(new RegExp(`\\b(?:rsvp|respond|reply)?\\s*by\\s+${escapedDeadline}`, "i"), " ");
    cleaned = cleaned.replace(new RegExp(escapedDeadline, "i"), " ");
  }
  cleaned = cleaned
    .replace(/\brsvp\b\s*:?\s*/gi, " ")
    .replace(/\bat\s*:?\s*/gi, " ")
    .replace(/\b(?:respond|reply)\b\s*:?\s*/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return cleaned.replace(/^[,;:. -]+|[,;:. -]+$/g, "").trim();
}

export function extractRsvpDetails(rawText: string, fallbackText?: string): ExtractedRsvpDetails {
  try {
    const text = [rawText || "", fallbackText || ""].join("\n");
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const deadline = extractRsvpDeadline(text);

    let url: string | null = null;
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const nearby = [line, lines[i + 1] || "", lines[i + 2] || ""].join(" ").trim();
      if (
        !/\b(?:rsvp|respond|reply)\b/i.test(nearby) &&
        !/\b(?:theknot|zola)\b/i.test(nearby)
      ) {
        continue;
      }
      const match = nearby.match(RSVP_URL_REGEX);
      url = trimRsvpUrl(match?.[0] || null);
      if (url) break;
    }
    if (!url) {
      for (const line of lines) {
        const match = line.match(RSVP_URL_REGEX);
        url = trimRsvpUrl(match?.[0] || null);
        if (url && /\b(?:rsvp|respond|reply|theknot|zola)\b/i.test(line)) break;
        url = null;
      }
    }

    const relevantLine =
      lines.find((line) => /\brsvp|respond|reply\b/i.test(line)) ||
      lines.find((line) => {
        const maybeUrl = trimRsvpUrl(line.match(RSVP_URL_REGEX)?.[0] || null);
        return Boolean(maybeUrl);
      }) ||
      "";
    const relevantWindow = relevantLine
      ? [relevantLine, lines[lines.indexOf(relevantLine) + 1] || "", lines[lines.indexOf(relevantLine) + 2] || ""]
          .join(" ")
          .trim()
      : text;

    const phoneMatch = relevantWindow.match(RSVP_PHONE_REGEX) || text.match(RSVP_PHONE_REGEX);
    const emailMatch = relevantWindow.match(RSVP_EMAIL_REGEX) || text.match(RSVP_EMAIL_REGEX);

    let contact: string | null = null;
    if (phoneMatch?.[0]) {
      const nameMatch = relevantWindow.match(/rsvp[^a-z0-9]*to\s+([^:|\d]+?)(?:\s*[-:,.]|$)/i);
      const colonPattern = relevantWindow.match(/rsvp\s*:\s*([^:\d]+?)\s*(\d)/i);
      const withMatch = relevantWindow.match(/\bwith\s+([A-Z][A-Za-z' -]+)\b/i);
      const toMatch = relevantWindow.match(/\bto\s+([A-Z][A-Za-z' -]+)\b/i);
      const rawName =
        (nameMatch?.[1] || colonPattern?.[1] || withMatch?.[1] || toMatch?.[1] || "")
          .replace(/\s{2,}/g, " ")
          .replace(/\s+at\s*$/i, "")
          .replace(/[:,\d]+$/, "")
          .trim();
      contact = rawName ? `RSVP: ${rawName} ${phoneMatch[0]}` : `RSVP: ${phoneMatch[0]}`;
    } else if (emailMatch?.[0]) {
      contact = `RSVP: ${emailMatch[0]}`;
    } else if (relevantWindow && /\b(?:rsvp|respond|reply|theknot|zola)\b/i.test(relevantWindow)) {
      const stripped = stripRsvpNoise(relevantWindow, deadline, url);
      if (
        stripped &&
        !/^(by|reply|respond)$/i.test(stripped) &&
        /[A-Za-z]/.test(stripped) &&
        stripped.length <= 120
      ) {
        contact = stripped;
      }
    }

    return {
      contact: contact || null,
      url,
      deadline,
    };
  } catch {
    return { contact: null, url: null, deadline: null };
  }
}

export function extractRsvpCompact(rawText: string, fallbackText?: string): string | null {
  return extractRsvpDetails(rawText, fallbackText).contact;
}

/**
 * Guest-facing tips often printed at the bottom of invites (cursive or small type), e.g.
 * "don't forget a towel and sunscreen!". Used when the vision model omits goodToKnow.
 */
export function extractGuestReminderFromFlyerText(text: string | null | undefined): string | null {
  if (!text || typeof text !== "string") return null;
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return null;

  const patterns: RegExp[] = [
    /\bdon[''']t forget\b[^.!?\n]{1,220}(?:[.!?]|$)/i,
    /\bdont forget\b[^.!?\n]{1,220}(?:[.!?]|$)/i,
    /\bremember to bring\b[^.!?\n]{1,180}(?:[.!?]|$)/i,
    /\bplease bring\b[^.!?\n]{1,180}(?:[.!?]|$)/i,
  ];

  for (const re of patterns) {
    const m = normalized.match(re);
    if (!m) continue;
    let s = m[0].trim();
    if (s.length < 12) continue;
    s = s
      .replace(/\brsvp\b.*$/i, "")
      .replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b.*$/i, "")
      .trim();
    if (s.length < 12) continue;
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  return null;
}

export function pickTitle(lines: string[], _raw: string): string {
  const cleanedLines = lines
    .map((l) =>
      stripInvitePhrases(
        l
          .replace(/[•·\-–—\s]+$/g, "")
          .replace(/^[•·\-–—\s]+/g, "")
          .trim(),
      ),
    )
    .filter((l) => l.length > 1);

  const weekdays =
    /^(mon(day)?|tue(s(day)?)?|wed(nesday)?|thu(r(s(day)?)?)?|fri(day)?|sat(urday)?|sun(day)?)$/i;
  const months =
    /^(jan(uary)?|feb(ruary)?|mar(ch)?|apr(il)?|may|jun(e)?|jul(y)?|aug(ust)?|sep(t(ember)?)?|oct(ober)?|nov(ember)?)$/i;
  const badHints =
    /(invitation(\s*card)?|rsvp|admission|tickets|door(s)? open|free entry|age|call|visit|www\.|\.com|\b(am|pm)\b|\b\d{1,2}[:.]?\d{0,2}\b)/i;
  const goodHints =
    /(baby\s*shower|bridal\s*shower|shower|birthday|party|anniversary|wedding|marriage|nupti(al)?|concert|festival|meet(ing|up)|ceremony|reception|gala|fundraiser|show|conference|appointment|open\s*house|celebration|quincea?ñera|graduation)/i;
  const ordinal = /\b\d{1,2}(st|nd|rd|th)\b/i;

  type Candidate = { text: string; score: number };
  const candidates: Candidate[] = [];

  const scoreLine = (text: string): number => {
    const t = text.trim();
    if (!t) return -Infinity;
    let score = 0;
    const words = t.split(/\s+/);
    const isOneWord = words.length === 1;
    const isAllCaps = /[A-Z]/.test(t) && !/[a-z]/.test(t);
    const simpleWord =
      (isOneWord && (weekdays.test(t) || months.test(t))) || /^[A-Za-z]{3,10}$/.test(t);
    const hasMonth = months.test(t);

    if (goodHints.test(t)) score += 10;
    if (ordinal.test(t)) score += 2;
    if (/\b\w+[’']s\b/.test(t)) score += 3;
    if (/(birthday.*party|party.*birthday)/i.test(t)) score += 6;
    if (t.length >= 12 && t.length <= 60) score += 2;
    if (t.length >= 8 && t.length <= 80) score += 1;

    if (badHints.test(t)) score -= 4;
    if (simpleWord) score -= 6;
    if (isAllCaps && t.length <= 9) score -= 3;
    if (hasMonth && goodHints.test(t)) score -= 8;
    if (hasMonth && ordinal.test(t) && goodHints.test(t)) score -= 10;

    return score;
  };

  for (const line of cleanedLines) candidates.push({ text: line, score: scoreLine(line) });

  for (let i = 0; i < cleanedLines.length - 1; i++) {
    const combined = `${cleanedLines[i]} ${cleanedLines[i + 1]}`.replace(/\s+/g, " ").trim();
    if (/(birthday|party|wedding|concert|festival|shower)/i.test(combined) && combined.length <= 90) {
      candidates.push({ text: combined, score: scoreLine(combined) + 1 });
    }
  }
  for (let i = 0; i < cleanedLines.length - 2; i++) {
    const triple = `${cleanedLines[i]} ${cleanedLines[i + 1]} ${cleanedLines[i + 2]}`
      .replace(/\s+/g, " ")
      .trim();
    if (/(birthday|party|wedding|concert|festival|shower)/i.test(triple) && triple.length <= 120) {
      let bonus = 2;
      if (/\b\w+(?:[’']s)?\s+birthday\s+party\b/i.test(triple)) bonus += 10;
      candidates.push({ text: triple, score: scoreLine(triple) + bonus });
    }
  }

  candidates.sort((x, y) => y.score - x.score);
  const best = candidates[0];
  if (best && best.score > 0) {
    const monthAlt =
      "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?)";
    const dateTail = new RegExp(
      `(?:\\s*(?:on|,)?\\s*)?(?:${monthAlt})\\b\\s*\\d{1,2}(?:st|nd|rd|th)?(?:\\s*,?\\s*\\d{4})?\\s*$`,
      "i",
    );
    let candidateText = best.text.replace(dateTail, "").trim();
    candidateText = candidateText.replace(/^(?:st|nd|rd|th)\b[\s\-.,:]*/i, "").trim();
    candidateText = candidateText.replace(/\b\d{1,2}(st|nd|rd|th)\b\s*$/i, "").trim();

    return candidateText
      .toLowerCase()
      .replace(/\b([a-z])(\w*)/g, (_m, a, b) => a.toUpperCase() + b)
      .replace(/\b(And|Or|Of|The|To|For|A|An|At|On|In|With)\b/g, (m) => m.toLowerCase())
      .replace(/\bBday\b/i, "Birthday");
  }

  const fallback = cleanedLines.find(
    (line) => line.length > 5 && !badHints.test(line) && !weekdays.test(line) && !months.test(line),
  );
  return fallback || "Event from flyer";
}

export function detectCategory(fullText: string): string | null {
  try {
    const isDoctorLike =
      /(doctor|dr\.|dentist|dental|orthodont|clinic|hospital|pediatric|dermatolog|cardiolog|optomet|eye\s+exam|ascension|sacred\s*heart)/i.test(
        fullText,
      );
    const hasAppt = /(appointment|appt)/i.test(fullText);
    if (isDoctorLike && hasAppt) return "Doctor Appointments";
    if (isDoctorLike) return "Doctor Appointments";
    if (hasAppt) return "Appointments";

    if (/\bbridal\s*shower\b/i.test(fullText)) return "Bridal Showers";
    const hasWedding =
      /(wedding|marriage|marieage|ceremony|reception|bride|groom|nupti(al)?|bridal)/i.test(fullText);
    const hasBirthday = /(birthday\s*party|\b(b-?day)\b|\bturns?\s+\d+|\bbirthday\b)/i.test(fullText);
    if (hasWedding && !hasBirthday) return "Weddings";
    if (hasBirthday && !hasWedding) return "Birthdays";
    if (/(baby\s*shower|baby\s*sprinkle|gender\s*reveal|sip\s*(and|&)\s*see)/i.test(fullText)) {
      return "Baby Showers";
    }
    if (/(engagement\s*(party|celebration)?|she said yes|proposal party)/i.test(fullText)) {
      return "Engagements";
    }
    if (/(anniversary|vow\s*renewal)/i.test(fullText)) return "Anniversaries";
    if (/(graduation|grad\s*party|commencement|class of\s+\d{4})/i.test(fullText)) {
      return "Graduations";
    }
    if (
      /(baptism|christening|communion|first holy communion|confirmation|bar mitzvah|bat mitzvah|baby dedication)/i.test(
        fullText,
      )
    ) {
      return "Religious Events";
    }

    if (
      /(practice\s*schedule|team\s*practice|school\s*year\s*.*practice|group\s+.*\b\d{1,2}:\d{2})/i.test(
        fullText,
      )
    ) {
      return "Sport Events";
    }
    if (
      /(schedule|game|vs\.|tournament|league)/i.test(fullText) &&
      /(soccer|basketball|baseball|hockey|volleyball|gymnastics|swim|tennis|track|softball)/i.test(
        fullText,
      )
    ) {
      return "Sport Events";
    }
    if (/(car\s*pool|carpool|ride\s*share|school\s*pickup|school\s*drop[- ]?off)/i.test(fullText)) {
      return "Car Pool";
    }
    if (
      /(you'?re invited|join us|celebrat(e|ion)|party|open house|fundraiser|gala|cookout|bbq|picnic)/i.test(
        fullText,
      )
    ) {
      return "General Events";
    }
  } catch {}
  return null;
}
