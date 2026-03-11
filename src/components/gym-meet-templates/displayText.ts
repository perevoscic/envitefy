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
      continue;
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

export const formatGymMeetTime = (value: unknown): string => {
  const text = toDisplayString(value);
  if (!text) return "";

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
