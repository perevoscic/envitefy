export type GenderRevealGuess = "pink" | "blue";
export type GenderRevealTallyVisibility = "live" | "hidden" | "lock_at_deadline";
export type GenderRevealResult = GenderRevealGuess;

export type GenderRevealConfig = {
  guessesEnabled: boolean;
  tallyVisibility: GenderRevealTallyVisibility;
  revealed: boolean;
  revealedResult: GenderRevealResult | null;
  revealedAt: string | null;
  revealMethod: string;
  dressCode: string;
  parking: string;
  virtualOption: string;
  rainPlan: string;
  spoilersNote: string;
};

export type GenderRevealGuessCounts = {
  pink: number;
  blue: number;
  total: number;
};

export type GenderRevealLiveStrip = {
  coming: number;
  pending: number;
  guesses: number;
};

export type GenderRevealRsvpAnswers = {
  genderGuess: GenderRevealGuess | null;
  giftNote: string;
  bringingGift: boolean | null;
  partySize: number | null;
};

const GENDER_REVEAL_CATEGORY_RE = /\bgender\s*reveal/;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readTrimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  const normalized = readTrimmed(value).toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") return true;
  if (normalized === "false" || normalized === "0" || normalized === "no") return false;
  return fallback;
}

export function isGenderRevealCategory(value: unknown): boolean {
  return GENDER_REVEAL_CATEGORY_RE.test(readTrimmed(value).toLowerCase());
}

export function isGenderRevealEventData(data: unknown): boolean {
  const record = asRecord(data);
  if (!record) return false;
  if (isGenderRevealCategory(record.category)) return true;
  if (asRecord(record.genderReveal)) return true;
  const templateId = readTrimmed(record.templateId).toLowerCase();
  if (templateId.includes("gender") && templateId.includes("reveal")) return true;
  return false;
}

export function normalizeGenderRevealGuess(value: unknown): GenderRevealGuess | null {
  const normalized = readTrimmed(value).toLowerCase();
  if (!normalized) return null;
  if (
    normalized === "pink" ||
    normalized === "girl" ||
    normalized === "team_pink" ||
    normalized === "teampink" ||
    normalized === "team pink"
  ) {
    return "pink";
  }
  if (
    normalized === "blue" ||
    normalized === "boy" ||
    normalized === "team_blue" ||
    normalized === "teamblue" ||
    normalized === "team blue"
  ) {
    return "blue";
  }
  return null;
}

export function normalizeGenderRevealTallyVisibility(
  value: unknown,
): GenderRevealTallyVisibility {
  const normalized = readTrimmed(value)
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (normalized === "hidden" || normalized === "hidden_until_reveal") return "hidden";
  if (normalized === "lock_at_deadline" || normalized === "lock") return "lock_at_deadline";
  return "live";
}

export function parseGenderRevealConfig(data: unknown): GenderRevealConfig {
  const record = asRecord(data);
  const nested = asRecord(record?.genderReveal) || {};
  const eventDetails = asRecord(record?.eventDetails) || {};
  return {
    guessesEnabled: readBoolean(nested.guessesEnabled ?? nested.enabled, true),
    tallyVisibility: normalizeGenderRevealTallyVisibility(nested.tallyVisibility),
    revealed: readBoolean(nested.revealed, false),
    revealedResult: normalizeGenderRevealGuess(nested.revealedResult),
    revealedAt: readTrimmed(nested.revealedAt) || null,
    revealMethod: readTrimmed(nested.revealMethod || eventDetails.revealMethod),
    dressCode: readTrimmed(nested.dressCode || eventDetails.dressCode || record?.attire),
    parking: readTrimmed(nested.parking || eventDetails.parking),
    virtualOption: readTrimmed(nested.virtualOption || eventDetails.virtualOption),
    rainPlan: readTrimmed(nested.rainPlan || eventDetails.rainPlan),
    spoilersNote: readTrimmed(nested.spoilersNote || eventDetails.spoilersNote),
  };
}

export function genderRevealGuessLabel(guess: GenderRevealGuess | null): string {
  if (guess === "pink") return "Team Pink";
  if (guess === "blue") return "Team Blue";
  return "";
}

export function genderRevealResultLabel(result: GenderRevealGuess | null): string {
  if (result === "pink") return "girl";
  if (result === "blue") return "boy";
  return "";
}

export function parseGenderRevealRsvpAnswers(value: unknown): GenderRevealRsvpAnswers {
  const record = asRecord(value) || {};
  const partyRaw = record.partySize ?? record.party_size ?? record.adult_count;
  const partyParsed = typeof partyRaw === "number" ? partyRaw : Number(partyRaw);
  const bringingRaw = record.bringingGift ?? record.bringing_gift;
  return {
    genderGuess: normalizeGenderRevealGuess(record.genderGuess ?? record.gender_guess),
    giftNote: readTrimmed(record.giftNote ?? record.gift_note ?? record.message),
    bringingGift:
      typeof bringingRaw === "boolean"
        ? bringingRaw
        : bringingRaw == null || bringingRaw === ""
          ? null
          : readBoolean(bringingRaw, false),
    partySize:
      Number.isFinite(partyParsed) && partyParsed > 0 ? Math.min(99, Math.floor(partyParsed)) : null,
  };
}

export function buildGenderRevealRsvpAnswers(input: {
  genderGuess?: unknown;
  giftNote?: unknown;
  bringingGift?: unknown;
  partySize?: unknown;
}): Record<string, string | number | boolean | null> {
  const parsed = parseGenderRevealRsvpAnswers(input);
  const out: Record<string, string | number | boolean | null> = {};
  if (parsed.genderGuess) out.genderGuess = parsed.genderGuess;
  if (parsed.giftNote) out.giftNote = parsed.giftNote;
  if (parsed.bringingGift !== null) out.bringingGift = parsed.bringingGift;
  if (parsed.partySize) out.partySize = parsed.partySize;
  return out;
}

export function emptyGenderRevealGuessCounts(): GenderRevealGuessCounts {
  return { pink: 0, blue: 0, total: 0 };
}

export function tallyGenderRevealGuesses(
  rows: Array<{ answersJson?: unknown; answers_json?: unknown } | null | undefined>,
): GenderRevealGuessCounts {
  const counts = emptyGenderRevealGuessCounts();
  for (const row of rows) {
    const answers = parseGenderRevealRsvpAnswers(row?.answersJson ?? row?.answers_json);
    if (answers.genderGuess === "pink") counts.pink += 1;
    else if (answers.genderGuess === "blue") counts.blue += 1;
  }
  counts.total = counts.pink + counts.blue;
  return counts;
}

export function isGenderRevealRsvpDeadlinePassed(
  deadline: unknown,
  now: Date = new Date(),
): boolean {
  const raw = readTrimmed(deadline);
  if (!raw) return false;
  const parsed = new Date(raw.includes("T") ? raw : `${raw}T23:59:59`);
  if (Number.isNaN(parsed.getTime())) return false;
  return now.getTime() > parsed.getTime();
}

export function areGenderRevealGuessesLocked(
  config: GenderRevealConfig,
  deadline: unknown,
  now: Date = new Date(),
): boolean {
  if (config.revealed) return true;
  if (config.tallyVisibility !== "lock_at_deadline") return false;
  return isGenderRevealRsvpDeadlinePassed(deadline, now);
}

export function shouldCollectGenderRevealGuess(params: {
  config: GenderRevealConfig;
  response: "yes" | "no" | "maybe" | string | null;
  deadline?: unknown;
  now?: Date;
}): boolean {
  if (!params.config.guessesEnabled) return false;
  if (params.response === "no") return false;
  if (areGenderRevealGuessesLocked(params.config, params.deadline, params.now)) return false;
  return params.response === "yes" || params.response === "maybe";
}

export function isGenderRevealGuessRequired(params: {
  config: GenderRevealConfig;
  response: "yes" | "no" | "maybe" | string | null;
  deadline?: unknown;
  now?: Date;
}): boolean {
  return (
    shouldCollectGenderRevealGuess(params) && params.response === "yes"
  );
}

export function canGuestSeeGenderRevealTally(config: GenderRevealConfig): boolean {
  if (!config.guessesEnabled) return false;
  if (config.revealed) return true;
  return config.tallyVisibility !== "hidden";
}

export function buildGenderRevealLiveStrip(params: {
  yes: number;
  maybe?: number;
  filled: number;
  numberOfGuests: number;
  guesses: number;
}): GenderRevealLiveStrip {
  const cap = Number.isFinite(params.numberOfGuests)
    ? Math.max(0, Math.floor(params.numberOfGuests))
    : 0;
  const pendingFromCap = cap > 0 ? Math.max(0, cap - params.filled) : 0;
  return {
    coming: Math.max(0, Math.floor(params.yes || 0)),
    pending: pendingFromCap,
    guesses: Math.max(0, Math.floor(params.guesses || 0)),
  };
}

export function genderRevealMemoryLine(params: {
  config: GenderRevealConfig;
  counts: GenderRevealGuessCounts;
}): string {
  if (!params.config.revealed || !params.config.revealedResult) return "";
  const result = genderRevealResultLabel(params.config.revealedResult);
  const winnerCount =
    params.config.revealedResult === "pink" ? params.counts.pink : params.counts.blue;
  const total = params.counts.total;
  if (!total) return `It's a ${result}.`;
  return `The room guessed ${result} — ${winnerCount} of ${total} ${
    total === 1 ? "guess" : "guesses"
  }.`;
}

export function serializeGenderRevealConfig(config: GenderRevealConfig): GenderRevealConfig {
  return {
    guessesEnabled: Boolean(config.guessesEnabled),
    tallyVisibility: normalizeGenderRevealTallyVisibility(config.tallyVisibility),
    revealed: Boolean(config.revealed),
    revealedResult: config.revealedResult,
    revealedAt: config.revealedAt,
    revealMethod: readTrimmed(config.revealMethod),
    dressCode: readTrimmed(config.dressCode),
    parking: readTrimmed(config.parking),
    virtualOption: readTrimmed(config.virtualOption),
    rainPlan: readTrimmed(config.rainPlan),
    spoilersNote: readTrimmed(config.spoilersNote),
  };
}
