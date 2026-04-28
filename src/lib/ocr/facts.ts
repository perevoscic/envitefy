export type OcrFact = {
  label: string;
  value: string;
};

function cleanText(value: unknown): string {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([+.,;:!?])/g, "$1")
    .replace(/^[•·\-–—\s]+|[•·\-–—\s]+$/g, "")
    .trim();
}

function factKey(label: string, value: string): string {
  return `${label} ${value}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function valueKey(value: string): string {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const DUPLICATE_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "at",
  "come",
  "cost",
  "costs",
  "details",
  "event",
  "fee",
  "for",
  "game",
  "in",
  "is",
  "join",
  "of",
  "on",
  "open",
  "opens",
  "out",
  "support",
  "the",
  "to",
  "with",
]);

const SEMANTIC_TIMING_FACT_LABELS = /^(?:check[-\s]?in|games?\s+start)$/i;

function stripFactLabelPrefix(label: string, value: string): string {
  const cleaned = cleanText(value);
  if (!cleaned) return "";

  const labelWords = cleanText(label).replace(/[^A-Za-z0-9]+/g, "\\s+");
  const prefixAlternates = [
    labelWords,
    "entry\\s+fee",
    "registration\\s+fee",
    "admission",
    "entry",
    "fee",
    "cost",
    "check[-\\s]?in",
    "games?\\s+start",
    "perks?",
    "activities",
    "details",
  ]
    .filter(Boolean)
    .join("|");

  return cleaned
    .replace(new RegExp(`^(?:${prefixAlternates})\\s*[:\\-]\\s*`, "i"), "")
    .replace(
      /^(?:entry\s+fee|registration\s+fee|admission|entry|fee|cost)\s+(?=\$|\d)/i,
      "",
    )
    .replace(/\.{2,}/g, ".")
    .trim();
}

function normalizeFactLabel(label: string, value: string): string {
  const normalizedLabel = cleanText(label) || "Details";
  const combined = `${normalizedLabel} ${value}`.toLowerCase();
  if (
    /\b(?:entry\s+fee|registration\s+fee|admission|cost|fee)\b/.test(combined) ||
    (/\bentry\b/.test(combined) && /\$/.test(value))
  ) {
    return "Entry Fee";
  }
  if (/\bcheck[-\s]?in\b/.test(combined)) return "Check-in";
  if (/\bgames?\s+start\b/.test(combined)) return "Games Start";
  return normalizedLabel;
}

function valueTokens(value: string): string[] {
  return valueKey(value)
    .split(/\s+/)
    .map((token) => token.replace(/^(\d+)(?:st|nd|rd|th)$/i, "$1"))
    .filter((token) => token && !DUPLICATE_STOP_WORDS.has(token));
}

function isNearDuplicateValue(value: string, renderedValue: string): boolean {
  if (renderedValue === value) return true;
  if (renderedValue.length >= value.length && renderedValue.includes(value)) return true;
  if (value.length > renderedValue.length && value.includes(renderedValue)) return true;

  const valueTokenSet = new Set(valueTokens(value));
  if (valueTokenSet.size < 2) return false;
  const renderedTokenSet = new Set(valueTokens(renderedValue));
  let overlap = 0;
  for (const token of valueTokenSet) {
    if (renderedTokenSet.has(token)) overlap += 1;
  }
  return (
    overlap === valueTokenSet.size ||
    (valueTokenSet.size >= 4 && overlap / valueTokenSet.size >= 0.75)
  );
}

function splitFactValue(value: string): string[] {
  return cleanText(value)
    .split(/\s*(?:[.;]\s+|\n+)\s*/)
    .map(cleanText)
    .filter((part) => part.length >= 3);
}

export function normalizeOcrFacts(value: unknown): OcrFact[] {
  if (!Array.isArray(value)) return [];
  const facts: OcrFact[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    const label =
      item && typeof item === "object" && "label" in item ? cleanText((item as any).label) : "";
    const rawValue =
      item && typeof item === "object" && "value" in item ? cleanText((item as any).value) : "";
    const normalizedLabel = normalizeFactLabel(label, rawValue);

    for (const part of splitFactValue(stripFactLabelPrefix(normalizedLabel, rawValue))) {
      const key = factKey(normalizedLabel, part);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      facts.push({ label: normalizedLabel, value: part });
    }
  }

  return facts.slice(0, 12);
}

export function buildOcrFacts(
  items: Array<{ label: string; value?: string | null | undefined }>,
): OcrFact[] {
  return normalizeOcrFacts(
    items
      .filter((item) => cleanText(item.value))
      .map((item) => ({
        label: item.label,
        value: item.value,
      })),
  );
}

export function mergeOcrFacts(...groups: Array<OcrFact[] | null | undefined>): OcrFact[] {
  const facts: OcrFact[] = [];
  const seen = new Set<string>();
  const seenValues: string[] = [];

  for (const group of groups) {
    for (const fact of group || []) {
      const label = normalizeFactLabel(fact.label, fact.value);
      const value = stripFactLabelPrefix(label, fact.value);
      if (!value) continue;
      const key = factKey(label, value);
      const canonicalValue = valueKey(value);
      if (
        !key ||
        !canonicalValue ||
        seen.has(key) ||
        seenValues.some((seenValue) => isNearDuplicateValue(canonicalValue, seenValue))
      ) {
        continue;
      }
      seen.add(key);
      seenValues.push(canonicalValue);
      facts.push({ label, value });
    }
  }

  return facts.slice(0, 12);
}

export function filterRenderedOcrFacts(
  facts: OcrFact[] | null | undefined,
  renderedValues: Array<string | string[] | null | undefined>,
): OcrFact[] {
  const rendered: string[] = [];
  for (const value of renderedValues) {
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      const cleaned = cleanText(item);
      const normalized = valueKey(cleaned);
      if (!normalized) continue;
      rendered.push(normalized);
      for (const part of splitFactValue(cleaned)) {
        const partKey = valueKey(part);
        if (partKey) rendered.push(partKey);
      }
    }
  }
  const combinedRendered = valueKey(rendered.join(" "));
  if (combinedRendered) rendered.push(combinedRendered);

  const seenValues: string[] = [];
  return (facts || []).filter((fact) => {
    const value = valueKey(fact.value);
    if (!value || seenValues.some((seenValue) => isNearDuplicateValue(value, seenValue))) {
      return false;
    }
    seenValues.push(value);
    if (SEMANTIC_TIMING_FACT_LABELS.test(cleanText(fact.label))) return true;
    return !rendered.some((renderedValue) => isNearDuplicateValue(value, renderedValue));
  });
}

export function filterRenderedTextValues(
  values: string[] | null | undefined,
  renderedValues: Array<string | string[] | null | undefined>,
): string[] {
  const rendered = renderedValues.flatMap((value) => (Array.isArray(value) ? value : [value]));
  const combinedRendered = rendered.map((value) => valueKey(String(value || ""))).join(" ");
  if (combinedRendered.trim()) rendered.push(combinedRendered);
  const seen = new Set<string>();
  return (values || []).filter((item) => {
    const value = valueKey(item);
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return !rendered.some((renderedValue) =>
      isNearDuplicateValue(value, valueKey(String(renderedValue || ""))),
    );
  });
}
