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
  s = s.replace(/^\s*(?:hosted|sponsored|presented)\s+by\s+(?:the\s+)?/i, "");
  s = s.replace(/^\s*at\s+/i, "");
  s = s.replace(/[\r\n]+/g, ", ");
  s = s.replace(/\s*,\s*/g, ", ");
  s = s.replace(/\s{2,}/g, " ");
  s = s.replace(/,\s*,+/g, ", ");
  s = s.replace(/^[,\s-]+/, "");
  s = s.replace(/[,\s-]+$/g, "");
  return s.trim();
}

export function looksLikeHostOrganizerLine(value: string | null | undefined): boolean {
  return /\b(?:hosted|sponsored|presented)\s+by\b/i.test(String(value || ""));
}

export function stripHostOrganizerPrefix(value: string | null | undefined): string {
  return String(value || "")
    .replace(/^\s*(?:hosted|sponsored|presented)\s+by\s+(?:the\s+)?/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function normalizeLocationCompareKey(value: string | null | undefined): string {
  return stripHostOrganizerPrefix(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function hasStreetAddressLike(value: string | null | undefined): boolean {
  const text = String(value || "");
  return (
    /\b\d{1,6}\s+[A-Za-z0-9]/.test(text) &&
    /\b(st|street|ave|avenue|rd|road|dr|drive|ln|lane|ct|court|blvd|boulevard|way|place|pl|pkwy|parkway|hwy|highway)\b/i.test(
      text,
    )
  );
}

/** True when venue is only the organizer/host and no real street address backs it. */
export function isVenueRedundantWithHost(params: {
  venue?: string | null;
  hostName?: string | null;
  location?: string | null;
}): boolean {
  const rawVenue = String(params.venue || "").trim();
  if (!rawVenue) return false;
  if (hasStreetAddressLike(params.location) || hasStreetAddressLike(rawVenue)) return false;

  if (looksLikeHostOrganizerLine(rawVenue)) return true;

  const venueKey = normalizeLocationCompareKey(rawVenue);
  const hostKey = normalizeLocationCompareKey(params.hostName);
  if (!venueKey || !hostKey) return false;
  return venueKey === hostKey;
}

function looksLikePersonName(value: string): boolean {
  const compact = value.replace(/[.,]+/g, " ").replace(/\s+/g, " ").trim();
  if (!compact) return false;
  const words = compact.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 5) return false;
  if (
    /\b(?:school|academy|college|university|center|centre|hall|church|chapel|campus|theater|theatre|stadium|arena|auditorium|park|room|gym|gymnasium|plaza|library)\b/i.test(
      compact,
    )
  ) {
    return false;
  }
  return words.every((word) => /^[A-Z][A-Za-z'’.-]+$/.test(word));
}

export function cleanGraduationVenueName(input: string | null | undefined): string {
  const cleaned = cleanAddressLabel(String(input || ""));
  if (!cleaned) return "";

  const graduationTerm =
    /\b(?:graduation(?:\s+(?:ceremony|party|celebration))?|commencement(?:\s+ceremony)?|grad\s*party|class\s+of\s+\d{4})\b/i;
  if (!graduationTerm.test(cleaned)) return cleaned;

  const leadingGraduationEvent =
    /^(?:(?:class\s+of\s+\d{4})|(?:graduation|commencement)(?:\s+(?:ceremony|party|celebration))?|grad\s*party)(?:\s*(?:[—–-]|:)|\s*$|\s+(?:for|honoring|celebrating)\b)/i;
  if (leadingGraduationEvent.test(cleaned)) return "";

  const venueSuffix =
    /\s+(?:graduation(?:\s+(?:ceremony|party|celebration))?|commencement(?:\s+ceremony)?|grad\s*party|class\s+of\s+\d{4})(?=\s*(?:[—–-]|:|\bfor\b|\bhonoring\b|\bcelebrating\b|$)).*$/i;
  const stripped = cleaned
    .replace(venueSuffix, "")
    .replace(/\s+/g, " ")
    .replace(/[,\s:—–-]+$/g, "")
    .trim();

  if (stripped && stripped !== cleaned) {
    if (/^class\s+of\s+\d{4}$/i.test(stripped)) return "";
    return looksLikePersonName(stripped) ? "" : stripped;
  }

  const honoreeSuffix = /\s[—–-]\s+[A-Z][A-Za-z'’.-]+(?:\s+[A-Z][A-Za-z'’.-]+){1,5}\s*$/;
  if (honoreeSuffix.test(cleaned)) return "";

  return cleaned;
}

export function pickVenueLabelForSentence(
  location?: string,
  description?: string,
  rawText?: string,
): string {
  try {
    const venueKeywords =
      /\b(Arena|Center|Hall|Gym|Gymnastics|Park|Room|Studio|Lanes|Bowl|Skate|Club|Cafe|Restaurant|Brewery|Church|School|Community|Auditorium|Ballroom|Course|Playground|Aquatic|Aquarium|Zoo|Museum|Stadium|Field|Court|Theater|Theatre|Pavilion|Pier|Boardwalk|Marina)\b/i;
    const beachAccess = /\bbeach\s+access\b/i;
    const looksLikeVenueLine = (line: string) => venueKeywords.test(line) || beachAccess.test(line);
    if (location) {
      const parts = cleanAddressLabel(String(location))
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length) {
        const first = parts[0];
        if (first && looksLikeHostOrganizerLine(first)) {
          // fall through to description/rawText
        } else if (parts.length >= 2) {
          const second = parts[1];
          const secondLooksVenue = second && !/\d/.test(second) && looksLikeVenueLine(second);
          if (secondLooksVenue && first && !/\d/.test(first)) {
            return `${first}, ${second}`;
          }
        }
        if (first && (!/\d/.test(first) || looksLikeVenueLine(first))) return first;
      }
    }
    const lineWithAt = (description || "")
      .split("\n")
      .map((l) => l.trim())
      .find((l) => /\bat\s+[^\d].{2,}/i.test(l) && !looksLikeHostOrganizerLine(l));
    if (lineWithAt) {
      const m = lineWithAt.match(
        /\bat\s+(?:the\s+)?([^,.\n]+?)(?:\s+(?:for|with|on|to)\b|\s*[,.]|$)/i,
      );
      const cand = (m?.[1] || "").replace(/\s{2,}/g, " ").trim();
      if (
        cand &&
        !looksLikeHostOrganizerLine(cand) &&
        (!/\d/.test(cand) || looksLikeVenueLine(cand))
      ) {
        return cand;
      }
    }
    if (rawText) {
      const lines = rawText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      const preferred = lines.find((line) => {
        if (line.length < 4 || line.length > 80) return false;
        if (looksLikeHostOrganizerLine(line)) return false;
        if (/^(?:location|venue|where)\b/i.test(line)) return true;
        if (!beachAccess.test(line)) return false;
        // Prefer a dedicated place label over a long "Join us at … beach access …" sentence.
        return !/\b(?:join|meet|overflow|parking|bring|parents?)\b/i.test(line);
      });
      if (preferred) {
        return cleanAddressLabel(preferred.replace(/\s{2,}/g, " "));
      }
      for (const line of lines) {
        if (line.length < 4 || line.length > 80) continue;
        if (looksLikeHostOrganizerLine(line)) continue;
        if (!looksLikeVenueLine(line)) continue;
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

  let address = addressParts
    .join(", ")
    .replace(/,\s*,+/g, ", ")
    .trim();
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
  if (
    has("fresno", "los angeles", "san francisco", "san jose", "sacramento", "oakland", "san diego")
  )
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

const RSVP_PHONE_REGEX = /(?:\+?1[-.\s]?)?(?:\(\s*\d{3}\s*\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}\b/;
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
    cleaned = cleaned.replace(
      new RegExp(`\\b(?:rsvp|respond|reply)?\\s*by\\s+${escapedDeadline}`, "i"),
      " ",
    );
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
      if (!/\b(?:rsvp|respond|reply)\b/i.test(nearby) && !/\b(?:theknot|zola)\b/i.test(nearby)) {
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

    const rsvpLineIndex = lines.findIndex((line) => /\brsvp|respond|reply\b/i.test(line));
    const contactInstructionLineIndex = lines.findIndex((line, index) => {
      const nearby = [line, lines[index + 1] || ""].join(" ").trim();
      return (
        /\b(?:questions?|text|txt|call|contact|message|email)\b/i.test(nearby) &&
        (RSVP_PHONE_REGEX.test(nearby) || RSVP_EMAIL_REGEX.test(nearby))
      );
    });
    const urlLineIndex = lines.findIndex((line) => {
      const maybeUrl = trimRsvpUrl(line.match(RSVP_URL_REGEX)?.[0] || null);
      return Boolean(maybeUrl);
    });
    const relevantLineIndex =
      rsvpLineIndex >= 0
        ? rsvpLineIndex
        : contactInstructionLineIndex >= 0
          ? contactInstructionLineIndex
          : urlLineIndex;
    const isContactInstructionWindow =
      relevantLineIndex >= 0 && relevantLineIndex === contactInstructionLineIndex;
    const relevantWindow =
      relevantLineIndex >= 0
        ? lines
            .slice(relevantLineIndex, relevantLineIndex + (isContactInstructionWindow ? 2 : 3))
            .join(" ")
            .trim()
        : text;

    const phoneMatch = relevantWindow.match(RSVP_PHONE_REGEX) || text.match(RSVP_PHONE_REGEX);
    const emailMatch = relevantWindow.match(RSVP_EMAIL_REGEX) || text.match(RSVP_EMAIL_REGEX);

    let contact: string | null = null;
    if (phoneMatch?.[0]) {
      const nameMatch = relevantWindow.match(/rsvp[^a-z0-9]*to\s+([^:|\d]+?)(?:\s*[-:,.]|$)/i);
      const colonPattern = relevantWindow.match(/rsvp\s*:\s*([^:\d]+?)\s*(\d)/i);
      const instructionNameMatch = relevantWindow.match(
        /\b(?:text|txt|call|contact|message|email)\s+([A-Z][A-Za-z' -]+?)\s+(?:at\s+)?(?:\(?\d{3}\)?|[A-Z0-9._%+-]+@)/i,
      );
      const canUseLooseRsvpName = /\b(?:rsvp|respond|reply)\b/i.test(relevantWindow);
      const withMatch = canUseLooseRsvpName
        ? relevantWindow.match(/\bwith\s+([A-Z][A-Za-z' -]+)\b/i)
        : null;
      const toMatch = canUseLooseRsvpName
        ? relevantWindow.match(/\bto\s+([A-Z][A-Za-z' -]+)\b/i)
        : null;
      const rawName = (
        nameMatch?.[1] ||
        colonPattern?.[1] ||
        instructionNameMatch?.[1] ||
        withMatch?.[1] ||
        toMatch?.[1] ||
        ""
      )
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

function cleanFlyerFact(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/\s+([+.,;:!?])/g, "$1")
    .replace(/^[•·\-–—\s]+|[•·\-–—\s]+$/g, "")
    .trim();
}

function stripLeadingHostArticle(value: string): string {
  return value.replace(/^the\s+/i, "").trim();
}

function appendUniqueFact(facts: string[], value: string | null | undefined) {
  const cleaned = cleanFlyerFact(String(value || "")).replace(/[.!?]+$/g, "");
  if (!cleaned || cleaned.length < 3) return;
  const key = cleaned
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  if (
    !key ||
    facts.some(
      (item) =>
        item
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, " ")
          .trim() === key,
    )
  ) {
    return;
  }
  facts.push(cleaned.charAt(0).toUpperCase() + cleaned.slice(1));
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
    /\bbring\b[^.!?\n]{1,180}(?:[.!?]|$)/i,
  ];

  for (const re of patterns) {
    const m = normalized.match(re);
    if (!m) continue;
    let s = m[0].trim();
    if (s.length < 12) continue;
    s = s
      .replace(/\brsvp\b.*$/i, "")
      .replace(/\bquestions?\b.*$/i, "")
      .replace(/\bhosted\s+by\b.*$/i, "")
      .replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b.*$/i, "")
      .trim();
    if (s.length < 12) continue;
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  return null;
}

/**
 * Attendance facts such as "All Skill Levels Welcome", "Ages 16+", and
 * "Free to Play" are guest-facing details, not activities or attire.
 */
export function extractGuestAttendanceFactsFromFlyerText(
  text: string | null | undefined,
): string | null {
  if (!text || typeof text !== "string") return null;
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return null;

  const facts: string[] = [];
  appendUniqueFact(facts, normalized.match(/\ball\s+skills?\s+levels?\s+welcome\b/i)?.[0]);
  appendUniqueFact(facts, normalized.match(/\bages?\s*\d{1,2}\s*(?:\+|plus)?/i)?.[0]);
  appendUniqueFact(facts, normalized.match(/\bfree\s+(?:to\s+play|entry|admission)\b/i)?.[0]);

  return facts.length ? facts.join(". ") : null;
}

export type ExtractedOcrFact = {
  label: string;
  value: string;
};

function splitFlyerFactLines(value: string): string[] {
  return value
    .split(/\n+|[•·]/)
    .map((line) => cleanFlyerFact(line))
    .filter(Boolean);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function looksLikeMenuPriceLine(value: string): boolean {
  return /\b[A-Z][A-Za-z0-9' -]{2,34}?\s+\$\s*\d+(?:\.\d{2})?(?:\s*,?\s*\$\s*\d+(?:\.\d{2})?\s*refill)?\b/i.test(
    value,
  );
}

function looksLikeFlavorSectionHeading(value: string): boolean {
  return /^(?:flavo[u]?rs?|flavor\s*wave|flavorwave|syrups?|choices?)\s*:?\s*$/i.test(value);
}

function looksLikeFlavorSectionStop(value: string): boolean {
  if (!value) return true;
  if (looksLikeMenuPriceLine(value)) return true;
  return (
    /\$\s*\d/.test(value) ||
    RSVP_EMAIL_REGEX.test(value) ||
    RSVP_PHONE_REGEX.test(value) ||
    RSVP_URL_REGEX.test(value) ||
    /\b(?:contact|questions?|text|call|rsvp|hosted|sponsored|presented|menu|prices?|refill|phone|email|website|www\.|\.com)\b/i.test(
      value,
    ) ||
    /\b(?:mon|tue|wed|thu|fri|sat|sun)(?:day)?\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{1,2}\b/i.test(
      value,
    ) ||
    /\b(?:academy|school|county|company|llc|inc|corp|organization|foundation)\b/i.test(value)
  );
}

function splitFlavorLine(value: string): string[] {
  return value
    .split(/\s*(?:,|\/|\||\band\b)\s*/i)
    .map((part) => cleanFlyerFact(part))
    .filter((part) => /^[A-Za-z][A-Za-z' -]{2,34}$/.test(part));
}

function extractPrintedFlavors(lines: string[], compact: string): string[] {
  const seen = new Set<string>();
  const flavors: string[] = [];
  const addFlavor = (value: string) => {
    const cleaned = cleanFlyerFact(value);
    if (!cleaned || !/^[A-Za-z][A-Za-z' -]{2,34}$/.test(cleaned)) return;
    const key = cleaned
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    flavors.push(cleaned.charAt(0).toUpperCase() + cleaned.slice(1));
  };

  const knownFlavors = [
    "Blue Raspberry",
    "Tiger's Blood",
    "Groovy Grape",
    "Island Rush",
    "Lucky Lime",
    "Monster Mango",
    "Ninja Cherry",
    "Pina Colada",
    "Strawberry Treasure",
    "Watermelon Wave",
  ];
  for (const flavor of knownFlavors) {
    if (new RegExp(`\\b${escapeRegExp(flavor)}\\b`, "i").test(compact)) addFlavor(flavor);
  }

  for (let index = 0; index < lines.length; index += 1) {
    if (!looksLikeFlavorSectionHeading(lines[index])) continue;
    for (const line of lines.slice(index + 1)) {
      if (looksLikeFlavorSectionStop(line)) break;
      for (const flavor of splitFlavorLine(line)) addFlavor(flavor);
    }
  }

  return flavors.slice(0, 16);
}

export function extractCommonOcrFactsFromFlyerText(
  text: string | null | undefined,
): ExtractedOcrFact[] {
  if (!text || typeof text !== "string") return [];
  const facts: ExtractedOcrFact[] = [];
  const seen = new Set<string>();
  const seenValues = new Set<string>();
  const addFact = (label: string, value: string | null | undefined) => {
    let cleaned = cleanFlyerFact(String(value || ""))
      .replace(/\bquestions?\b.*$/i, "")
      .replace(/\b(?:text|call)\s+\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b.*$/i, "")
      .replace(/[.!?]+$/g, "")
      .trim();
    if (/^host$/i.test(label)) {
      cleaned = stripLeadingHostArticle(cleaned);
    }
    if (!cleaned || cleaned.length < 3 || !/[A-Za-z0-9]/.test(cleaned)) return;
    const key = `${label} ${cleaned}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    const valueKey = cleaned
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    if (!key || !valueKey || seen.has(key) || seenValues.has(valueKey)) return;
    seen.add(key);
    seenValues.add(valueKey);
    facts.push({
      label,
      value: /^(?:email|website)$/i.test(label)
        ? cleaned
        : cleaned.charAt(0).toUpperCase() + cleaned.slice(1),
    });
  };

  const normalized = text.replace(/\r/g, "\n");
  const compact = normalized.replace(/\s+/g, " ").trim();
  const parts = splitFlyerFactLines(normalized);
  const normalizePrintedTime = (value: string | null | undefined) =>
    cleanFlyerFact(String(value || ""))
      .replace(/\./g, "")
      .replace(/\b(am|pm)\b/gi, (period) => period.toUpperCase())
      .replace(/\s+/g, " ");
  const timePattern = "(\\d{1,2}(?::\\d{2})?\\s*(?:a\\.?m\\.?|p\\.?m\\.?|am|pm))";
  const checkInMatch = compact.match(new RegExp(`\\bcheck[-\\s]?in\\s*:?\\s*${timePattern}`, "i"));
  const gameStartMatch = compact.match(
    new RegExp(`\\bgames?\\s+start\\s*:?\\s*${timePattern}`, "i"),
  );
  const entryFeeMatch =
    compact.match(
      /\b(?:entry\s+fee|registration\s+fee|admission|entry)\s*[:-]?\s*(\$\s*\d+(?:\.\d{2})?\s*(?:per\s+(?:person|team)|entry|registration|admission)?)/i,
    ) || compact.match(/(\$\s*\d+(?:\.\d{2})?\s*(?:per\s+(?:person|team)|entry|registration)?)/i);
  const printedPerks = [
    { label: "Prizes", pattern: /\bprizes?\b/i },
    { label: "Music", pattern: /\bmusic\b/i },
    { label: "Refreshments", pattern: /\brefreshments?\b/i },
  ]
    .filter((perk) => perk.pattern.test(compact))
    .map((perk) => perk.label);
  const hasCombinedPerks = printedPerks.length >= 2;
  const printedFlavors = extractPrintedFlavors(parts, compact);
  const menuPriceMatches = [
    ...compact.matchAll(
      /\b([A-Z][A-Za-z0-9' -]{2,34}?)\s+(\$\s*\d+(?:\.\d{2})?(?:\s*,?\s*\$\s*\d+(?:\.\d{2})?\s*refill)?)\b/gi,
    ),
  ]
    .map((match) => `${cleanFlyerFact(match[1])} ${cleanFlyerFact(match[2])}`)
    .filter(
      (value) => !/\b(?:may|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(value),
    )
    .slice(0, 8);

  if (checkInMatch?.[1]) addFact("Check-in", `Check-in ${normalizePrintedTime(checkInMatch[1])}`);
  if (gameStartMatch?.[1]) {
    addFact("Games Start", `Games start ${normalizePrintedTime(gameStartMatch[1])}`);
  }
  if (entryFeeMatch?.[1]) addFact("Entry Fee", normalizePrintedTime(entryFeeMatch[1]));
  if (printedPerks.length) addFact("Perks", printedPerks.join(", "));
  if (menuPriceMatches.length >= 2) addFact("Menu Prices", menuPriceMatches.join("; "));
  if (printedFlavors.length >= 2) addFact("Flavors", printedFlavors.join(", "));
  const contactPhone = compact.match(
    /\b(?:\+?1[-.\s]?)?(?:\(\s*\d{3}\s*\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}\b/,
  )?.[0];
  const contactEmail = compact.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const contactWebsite = compact.match(/\b(?:https?:\/\/|www\.)[^\s,;]+/i)?.[0];
  if (contactPhone) addFact("Phone", contactPhone);
  if (contactEmail) addFact("Email", contactEmail);
  if (contactWebsite) addFact("Website", contactWebsite);
  addFact("Good to Know", compact.match(/\ball\s+skills?\s+levels?\s+welcome\b/i)?.[0]);
  addFact("Good to Know", compact.match(/\bages?\s*\d{1,2}\s*(?:\+|plus)?/i)?.[0]);
  addFact("Good to Know", compact.match(/\bfree\s+(?:to\s+play|entry|admission)\b/i)?.[0]);

  const host = extractHostedByFromFlyerText(text);
  if (host) addFact("Host", host);

  for (const part of parts) {
    if (/\b(?:rsvp|questions?|text|call)\b/i.test(part)) continue;
    if (RSVP_EMAIL_REGEX.test(part) || RSVP_PHONE_REGEX.test(part) || RSVP_URL_REGEX.test(part)) {
      continue;
    }

    if (/\b(?:bring|remember to bring|please bring|don['’]?t forget|supplies?)\b/i.test(part)) {
      addFact("Good to Know", part);
      continue;
    }
    if (/\b(?:parking|park in|garage|lot)\b/i.test(part)) {
      addFact("Parking", part);
      continue;
    }
    if (/\bcheck[-\s]?in\b/i.test(part)) {
      addFact("Check-in", part);
      continue;
    }
    if (/\bgames?\s+start\b/i.test(part)) {
      addFact("Games Start", part);
      continue;
    }
    if (
      /\b(?:fee|cost|admission|donation|free to play|free entry|free admission)\b/i.test(part) ||
      (/\bentry\b/i.test(part) && /\$|\b\d+\s*(?:dollars?|usd)\b/i.test(part))
    ) {
      addFact("Entry Fee", part);
      continue;
    }
    if (/\b(?:prizes?|music|refreshments?)\b/i.test(part)) {
      if (!hasCombinedPerks) addFact("Perks", part);
      continue;
    }
    if (/\b(?:entry|gate|doors open|arrive|arrival)\b/i.test(part)) {
      addFact("Entry", part);
      continue;
    }
    if (/\b(?:ages?|grade|grades|adults only|kids welcome|all skill levels)\b/i.test(part)) {
      addFact("Good to Know", part);
      continue;
    }
    if (/\b(?:hosted by|sponsored by|presented by)\b/i.test(part)) {
      addFact("Host", part.replace(/\b(?:hosted|sponsored|presented)\s+by\b\s*/i, ""));
    }
  }

  return facts.slice(0, 12);
}

export function combineGuestInfoFacts(...values: Array<string | null | undefined>): string | null {
  const facts: string[] = [];
  for (const value of values) {
    if (!value) continue;
    for (const part of String(value).split(/\s*(?:[.;]\s+|\n+)\s*/)) {
      appendUniqueFact(facts, part);
    }
  }
  return facts.length ? facts.join(". ") : null;
}

export function appendVenueToVendorVisitTitle(
  title: string | null | undefined,
  venue: string | null | undefined,
  rawText?: string | null,
): string {
  const cleanTitle = cleanFlyerFact(String(title || ""));
  const cleanVenue = cleanFlyerFact(String(venue || ""));
  if (!cleanTitle || !cleanVenue) return cleanTitle;
  if (cleanTitle.toLowerCase().includes(cleanVenue.toLowerCase())) return cleanTitle;
  const probe = `${cleanTitle}\n${rawText || ""}`;
  const looksLikeVendorVisit =
    /\b(?:is\s+coming|food\s+truck|kona\s+ice|ice\s+cream|shaved\s+ice|snow\s+cone|treats?|menu|flavo[u]?rs?)\b/i.test(
      probe,
    );
  return looksLikeVendorVisit ? `${cleanTitle} — ${cleanVenue}` : cleanTitle;
}

export function extractHostedByFromFlyerText(text: string | null | undefined): string | null {
  if (!text || typeof text !== "string") return null;
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const candidates = lines.length ? lines : [text];

  for (const line of candidates) {
    const match = line.match(/\bhosted\s+by\s+(.{2,90})$/i);
    if (!match?.[1]) continue;
    const cleaned = cleanFlyerFact(match[1])
      .replace(/\b(?:questions?|text|call|rsvp)\b.*$/i, "")
      .replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b.*$/i, "")
      .trim();
    const withoutArticle = stripLeadingHostArticle(cleaned);
    if (withoutArticle && /[A-Za-z]/.test(withoutArticle)) return withoutArticle;
  }

  const normalized = text.replace(/\s+/g, " ").trim();
  const inlineMatch = normalized.match(
    /\bhosted\s+by\s+(.{2,90}?)(?=\s+(?:questions?|text|call|rsvp)\b|$)/i,
  );
  if (!inlineMatch?.[1]) return null;
  const cleaned = stripLeadingHostArticle(cleanFlyerFact(inlineMatch[1]));
  return cleaned && /[A-Za-z]/.test(cleaned) ? cleaned : null;
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
    if (
      /(birthday|party|wedding|concert|festival|shower)/i.test(combined) &&
      combined.length <= 90
    ) {
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
    const hasGraduation = /(graduation|grad\s*party|commencement|class of\s+\d{4})/i.test(fullText);
    const hasWedding =
      /(wedding|marriage|marieage|ceremony|reception|bride|groom|nupti(al)?|bridal)/i.test(
        fullText,
      );
    const hasBirthday = /(birthday\s*party|\b(b-?day)\b|\bturns?\s+\d+|\bbirthday\b)/i.test(
      fullText,
    );
    if (hasGraduation) return "Graduations";
    if (hasWedding && !hasBirthday) return "Weddings";
    if (hasBirthday && !hasWedding) return "Birthdays";
    if (/(baby\s*shower|baby\s*sprinkle|gender\s*reveal|sip\s*(and|&)\s*see)/i.test(fullText)) {
      return "Baby Showers";
    }
    if (/(engagement\s*(party|celebration)?|she said yes|proposal party)/i.test(fullText)) {
      return "Engagements";
    }
    if (/(anniversary|vow\s*renewal)/i.test(fullText)) return "Anniversaries";
    if (/(house\s*warming|housewarming|new\s+home|new\s+place|new\s+house)/i.test(fullText)) {
      return "Housewarming";
    }
    if (isRealEstateOpenHouseText(fullText)) return "Open House";
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
      /(football|kickoff|soccer|basketball|baseball|hockey|volleyball|gymnastics|swim|tennis|track|softball)/i.test(
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

export function isRealEstateOpenHouseText(fullText: string): boolean {
  const text = String(fullText || "");
  if (!/\bopen\s+house\b/i.test(text)) return false;
  const listingSignalCount = [
    /\brealtor\b/i,
    /\breal\s+estate\b/i,
    /\bMLS\b|MLS\s*#/i,
    /\b\d+\s*(?:bed|beds|bedroom|bedrooms)\b/i,
    /\b\d+\s*(?:bath|baths|bathroom|bathrooms)\b/i,
    /\b(?:sq\.?\s*ft\.?|square\s+feet|sqft)\b/i,
    /\$\s*\d[\d,]*(?:\.\d+)?\s*(?:k|m|million)?\b/i,
    /\b(?:for\s+sale|listing|list\s+price|price\s+(?:starts\s+)?at|at\s+\$)\b/i,
    /\b(?:brokerage|broker|agency|homes?|properties|realty)\b/i,
    /\b(?:kitchen|pool|jacuzzi|suite|garage|appliances|bedroom|bathroom|master)\b/i,
    /\b\d{1,6}\s+[A-Za-z0-9 .'-]+\s+(?:st|street|ave|avenue|rd|road|dr|drive|ln|lane|ct|court|blvd|boulevard|way|place|pl)\b/i,
  ].filter((pattern) => pattern.test(text)).length;
  if (listingSignalCount >= 2) return true;
  return /\bopen\s+house\b/i.test(text) && /\brealtor\b|\bMLS\b|\breal\s+estate\b/i.test(text);
}
