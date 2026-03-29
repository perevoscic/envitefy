const toDisplayString = (value: unknown): string =>
  typeof value === "string"
    ? value.trim()
    : value == null
    ? ""
    : String(value).trim();

const normalizeCompareText = (value: string) =>
  toDisplayString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const stripTokenForCompare = (value: string) =>
  value.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, "").toLowerCase();

const collapseRepeatedTokenChunks = (value: string) => {
  const tokens = toDisplayString(value).split(/\s+/).filter(Boolean);
  if (tokens.length < 2) return toDisplayString(value);

  const normalizedTokens = tokens.map(stripTokenForCompare);
  const output: string[] = [];

  for (let index = 0; index < tokens.length; ) {
    let repeatedChunkSize = 0;
    const maxChunkSize = Math.min(6, Math.floor((tokens.length - index) / 2));

    for (let size = maxChunkSize; size >= 1; size -= 1) {
      const first = normalizedTokens.slice(index, index + size).join(" ");
      const second = normalizedTokens.slice(index + size, index + size * 2).join(" ");
      if (!first || first !== second) continue;
      repeatedChunkSize = size;
      break;
    }

    if (!repeatedChunkSize) {
      output.push(tokens[index]);
      index += 1;
      continue;
    }

    output.push(...tokens.slice(index, index + repeatedChunkSize));
    index += repeatedChunkSize * 2;

    while (
      index + repeatedChunkSize <= tokens.length &&
      normalizedTokens.slice(index - repeatedChunkSize, index).join(" ") ===
        normalizedTokens.slice(index, index + repeatedChunkSize).join(" ")
    ) {
      index += repeatedChunkSize;
    }
  }

  return output.join(" ");
};

const dedupeDelimitedSegments = (value: string) => {
  const text = toDisplayString(value);
  if (!text.includes(",")) return text;

  const seen = new Set<string>();
  const parts = text
    .split(",")
    .map((part) => collapseRepeatedTokenChunks(part).trim())
    .filter(Boolean)
    .filter((part) => {
      const key = normalizeCompareText(part);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return parts.join(", ");
};

export const collapseRepeatedDisplayText = (value: unknown): string =>
  dedupeDelimitedSegments(collapseRepeatedTokenChunks(toDisplayString(value)))
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();

export const joinUniqueDisplayParts = (
  parts: Array<unknown>,
  separator = ", "
): string => {
  const output: string[] = [];

  for (const rawPart of parts) {
    const part = collapseRepeatedDisplayText(rawPart);
    const normalizedPart = normalizeCompareText(part);
    if (!normalizedPart) continue;

    const existingIndex = output.findIndex((candidate) => {
      const normalizedCandidate = normalizeCompareText(candidate);
      return (
        normalizedCandidate === normalizedPart ||
        normalizedCandidate.includes(normalizedPart) ||
        normalizedPart.includes(normalizedCandidate)
      );
    });

    if (existingIndex < 0) {
      output.push(part);
      continue;
    }

    const existing = output[existingIndex];
    if (normalizeCompareText(part).length > normalizeCompareText(existing).length) {
      output[existingIndex] = part;
    }
  }

  return output.join(separator);
};

const extractLinkedDomains = (links: Array<string | { url?: unknown }>) => {
  const domains = new Set<string>();

  for (const item of Array.isArray(links) ? links : []) {
    const rawUrl = typeof item === "string" ? item : toDisplayString(item?.url);
    if (!rawUrl) continue;

    try {
      const url = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
      const hostname = url.hostname.replace(/^www\./i, "").toLowerCase();
      if (hostname) domains.add(hostname);
    } catch {
    }
  }

  return [...domains];
};

const cleanupDomainStrippedText = (value: string) =>
  toDisplayString(value)
    .replace(/\(\s*\)/g, "")
    .replace(/\[\s*\]/g, "")
    .replace(/\b(?:at|on|via|through|from|visit|see|check|find)\s*(?=[,.;:!?)]|$)/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([:;,-])\s*([,.;:!?])/g, "$2")
    .replace(/(?:\s*[-,;:]\s*){2,}/g, " ")
    .trim();

const isLowSignalLinkedText = (value: string) => {
  const normalized = normalizeCompareText(value);
  return (
    !normalized ||
    /^(official results?|results?|live scoring|tickets?|ticket sales?|spectator admission|spectator presale|spectator pre sale|admission|online|available online|here)$/i.test(
      normalized
    )
  );
};

export const stripLinkedDomainMentions = (
  value: unknown,
  links: Array<string | { url?: unknown }>
): string => {
  const text = toDisplayString(value);
  const domains = extractLinkedDomains(links);
  if (!text || domains.length === 0) return text;

  const lines = text
    .split(/\n+/)
    .map((line) => {
      let next = line;
      for (const domain of domains) {
        const escapedDomain = domain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const pattern = new RegExp(
          `(?:https?:\\/\\/)?(?:www\\.)?${escapedDomain}(?:\\/[^\\s),;]*)?`,
          "ig"
        );
        next = next.replace(pattern, "");
      }
      next = cleanupDomainStrippedText(next);
      return isLowSignalLinkedText(next) ? "" : next;
    })
    .filter(Boolean);

  if (lines.length > 0) return lines.join("\n");

  let fallback = text;
  for (const domain of domains) {
    const escapedDomain = domain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(?:https?:\\/\\/)?(?:www\\.)?${escapedDomain}`, "ig");
    fallback = fallback.replace(pattern, "");
  }
  fallback = cleanupDomainStrippedText(fallback);
  return isLowSignalLinkedText(fallback) ? "" : fallback;
};

const ISO_DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const formatGymMeetTime = (value: unknown): string => {
  const text = toDisplayString(value);
  if (!text) return "";

  const trimmed = text.trim();
  // Date-only ISO or midnight placeholder from pipelines when PDF had no real start time
  if (ISO_DATE_ONLY_PATTERN.test(trimmed)) return "";
  if (
    /^\d{4}-\d{2}-\d{2}[T\s]00:00:00(?:\.0+)?(?:Z|[+-]\d{2}:?\d{2})?$/i.test(
      trimmed
    )
  ) {
    return "";
  }
  if (/^\d{4}-\d{2}-\d{2}T00:00:00(?:\.0+)?$/i.test(trimmed)) return "";
  if (/^0{0,2}:00$/i.test(trimmed)) return "";

  const meridianMatch = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*([AaPp])\.?\s*M\.?\b/);
  if (meridianMatch) {
    const hour = Number(meridianMatch[1] || 0);
    const minute = meridianMatch[2] || "00";
    const meridian = `${(meridianMatch[3] || "").toUpperCase()}M`;
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute} ${meridian}`;
  }

  const twentyFourHourMatch = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (!twentyFourHourMatch) return "";

  const hour = Number(twentyFourHourMatch[1] || 0);
  const minute = twentyFourHourMatch[2] || "00";
  const meridian = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute} ${meridian}`;
};

const ISO_DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?$/i;
const MONTH_NAME_DATE_RANGE_PATTERN =
  /\b(?:january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec)\s+\d{1,2}(?:\s*[–-]\s*\d{1,2})?,?\s+\d{4}\b/i;
const MONTH_NAME_DATE_SINGLE_PATTERN =
  /\b(?:january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec)\s+\d{1,2},?\s+\d{4}\b/i;
const SLASH_DATE_RANGE_PATTERN =
  /\b\d{1,2}\/\d{1,2}\/\d{4}\s*[–-]\s*\d{1,2}\/\d{1,2}\/\d{4}\b/;
const SLASH_DATE_SINGLE_PATTERN = /\b\d{1,2}\/\d{1,2}\/\d{4}\b/;

const parseStrictGymMeetDate = (value: unknown): Date | null => {
  const text = toDisplayString(value);
  if (!text) return null;

  if (ISO_DATE_ONLY_PATTERN.test(text)) {
    const candidate = new Date(`${text}T00:00:00`);
    return Number.isNaN(candidate.getTime()) ? null : candidate;
  }

  if (ISO_DATE_TIME_PATTERN.test(text)) {
    const normalized = text.includes("T") ? text : text.replace(" ", "T");
    const candidate = new Date(normalized);
    return Number.isNaN(candidate.getTime()) ? null : candidate;
  }

  return null;
};

export const sanitizeGymMeetDisplayDateLabel = (value: unknown): string => {
  const text = collapseRepeatedDisplayText(value);
  if (!text) return "";
  if (MONTH_NAME_DATE_RANGE_PATTERN.test(text)) return text;
  if (MONTH_NAME_DATE_SINGLE_PATTERN.test(text)) return text;
  if (SLASH_DATE_RANGE_PATTERN.test(text)) return text;
  if (SLASH_DATE_SINGLE_PATTERN.test(text)) return text;
  return "";
};

export const formatGymMeetDate = (
  value: unknown,
  options?: { withWeekday?: boolean }
): string => {
  const date = parseStrictGymMeetDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    ...(options?.withWeekday ? { weekday: "short" } : {}),
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};
