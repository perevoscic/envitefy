export type VenueFactSanitizeMode = "strict" | "balanced" | "raw";

export type SanitizeVenueFactOptions = {
  mode?: VenueFactSanitizeMode;
  maxLines?: number;
  requireAnchor?: boolean;
  excludePatterns?: RegExp[];
};

const BULLET_PREFIX_RE = /^[-\u2022*]+\s*/;
const CONTINUATION_START_RE =
  /^(and|or|but|to|for|with|in|on|at|near|by|of|the|a|an|available|entrance|registration|convention center|guest services|competition area|awards area|located|will|is|are)\b/i;
const STRONG_VENUE_ANCHOR_RE =
  /(awards area|competition area|guest services|registration(?:\s+(?:area|desk|booth))?|check[- ]?in|east hall|west hall|central hall|north hall|south hall|gym\s*[a-z0-9]{1,2}|2nd floor|second floor|3rd floor|third floor|coffee bar|freight door|right door|entrance(?:\s+to)?\s+(?:competition area|hall))/i;
const WEAK_NOISE_RE =
  /(updated\s+[a-z]+\s+\d{1,2},\s+\d{4}|page\s+\d+\s+of\s+\d+|--\s*\d+\s*of\s*\d+\s*--|spectator admission|cash adults?\s*\$|children\s*\(.*\)\s*\$|daylight savings|disney on ice|benchmark(?:\s+international)?\s+arena|traffic can be heavy)/i;
const INVALID_LEADING_TOKEN_RE =
  /^(and|or|to|for|in|on|at|of|the|a|an|available|entrance|registration|competition|awards|guest)\b/i;

function safeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function stripBulletPrefix(value: string): string {
  return value.replace(BULLET_PREFIX_RE, "").trim();
}

function normalizeWhitespace(value: string): string {
  return safeText(value).replace(/\s+/g, " ").trim();
}

function splitLineFragments(line: string): string[] {
  return line
    .split(/\n+/)
    .map((part) => normalizeWhitespace(stripBulletPrefix(part)))
    .filter(Boolean);
}

function containsInvalidSymbols(value: string): boolean {
  const sample = safeText(value);
  if (!sample) return true;
  const invalidChars = (sample.match(/[^A-Za-z0-9\s.,:;'"()\-/&#]/g) || []).length;
  const ratio = invalidChars / Math.max(sample.length, 1);
  return ratio > 0.18;
}

function alphaRatio(value: string): number {
  const text = safeText(value);
  if (!text) return 0;
  const alpha = (text.match(/[A-Za-z]/g) || []).length;
  return alpha / Math.max(text.length, 1);
}

function looksLikeFragment(value: string): boolean {
  const line = normalizeWhitespace(value);
  if (!line) return true;
  const tokenCount = line.split(/\s+/).filter(Boolean).length;
  if (tokenCount <= 1 && !/^(gym\s*[a-z0-9]{1,2}|central hall|east hall|west hall|north hall|south hall)$/i.test(line)) {
    return true;
  }
  if (tokenCount <= 3 && INVALID_LEADING_TOKEN_RE.test(line) && !/[.!?:]$/.test(line)) {
    return true;
  }
  return false;
}

function hasOcrArtifactToken(value: string): boolean {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return true;
  const startsWithMapNumber = /^\d+\s+(entrance|registration|competition area|awards area|guest services|hall|gym\b)/i.test(
    normalized
  );
  if (startsWithMapNumber) return true;

  const allowedNoVowelTokens = new Set([
    "gym",
    "st",
    "rd",
    "nd",
    "f",
  ]);
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const suspicious = tokens.filter((token) => {
    const cleaned = token.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!cleaned) return false;
    if (allowedNoVowelTokens.has(cleaned)) return false;
    if (/^\d+$/.test(cleaned)) return false;
    if (cleaned.length < 3 || cleaned.length > 5) return false;
    if (!/^[a-z]+$/.test(cleaned)) return false;
    if (/[aeiou]/.test(cleaned)) return false;
    return true;
  });
  return suspicious.length > 0;
}

export function normalizeVenueFactForCompare(value: string): string {
  return safeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function isVenueAnchorLine(value: string): boolean {
  return STRONG_VENUE_ANCHOR_RE.test(safeText(value));
}

export function isReadableVenueFactLine(value: string, strict = true): boolean {
  const line = normalizeWhitespace(value);
  if (!line) return false;
  if (line.length < 8 || line.length > 300) return false;
  if (containsInvalidSymbols(line)) return false;
  if (WEAK_NOISE_RE.test(line)) return false;
  if (looksLikeFragment(line)) return false;

  const ratio = alphaRatio(line);
  if (strict) {
    if (hasOcrArtifactToken(line)) return false;
    if (isVenueAnchorLine(line)) return ratio >= 0.2;
    return ratio >= 0.35;
  }
  return ratio >= 0.2;
}

export function stitchVenueContinuationLines(lines: string[]): string[] {
  return lines.reduce((acc: string[], rawLine: string) => {
    const line = normalizeWhitespace(stripBulletPrefix(rawLine));
    if (!line) return acc;
    if (!acc.length) {
      acc.push(line);
      return acc;
    }
    const previous = acc[acc.length - 1];
    const prevEndsSentence = /[.!?:]$/.test(previous);
    const startsLowercase = /^[a-z]/.test(line);
    const startsContinuation = CONTINUATION_START_RE.test(line);
    if (!prevEndsSentence && (startsLowercase || startsContinuation)) {
      acc[acc.length - 1] = `${previous} ${line}`.replace(/\s+/g, " ").trim();
      return acc;
    }
    acc.push(line);
    return acc;
  }, []);
}

function dedupeVenueLines(lines: string[]): string[] {
  const deduped: string[] = [];
  for (const line of lines) {
    const normalized = normalizeVenueFactForCompare(line);
    if (!normalized) continue;
    let skip = false;
    for (let i = 0; i < deduped.length; i += 1) {
      const existing = deduped[i];
      const existingNorm = normalizeVenueFactForCompare(existing);
      if (!existingNorm) continue;
      if (existingNorm === normalized) {
        skip = true;
        break;
      }
      const overlappingLongText = Math.min(existingNorm.length, normalized.length) >= 24;
      if (!overlappingLongText) continue;
      if (existingNorm.includes(normalized)) {
        skip = true;
        break;
      }
      if (normalized.includes(existingNorm) && line.length > existing.length + 6) {
        deduped[i] = line;
        skip = true;
        break;
      }
    }
    if (!skip) deduped.push(line);
  }
  return deduped;
}

export function sanitizeVenueFactLines(
  input: string[],
  options: SanitizeVenueFactOptions = {}
): string[] {
  const mode = options.mode || "strict";
  const maxLines = Number.isFinite(options.maxLines) ? Math.max(1, Number(options.maxLines)) : 14;
  const requireAnchor = options.requireAnchor !== false;
  const excludePatterns = Array.isArray(options.excludePatterns) ? options.excludePatterns : [];

  const normalized = input
    .flatMap((item) => splitLineFragments(item))
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);

  const stitched = stitchVenueContinuationLines(normalized);

  const excludeLine = (line: string) =>
    excludePatterns.some((pattern) => {
      try {
        return pattern.test(line);
      } catch {
        return false;
      }
    });

  let filtered = stitched.filter((line) => !excludeLine(line));

  if (mode !== "raw") {
    const strict = mode === "strict";
    filtered = filtered.filter((line) => isReadableVenueFactLine(line, strict));
  }

  if (requireAnchor) {
    filtered = filtered.filter((line) => isVenueAnchorLine(line));
  }

  return dedupeVenueLines(filtered).slice(0, maxLines);
}
