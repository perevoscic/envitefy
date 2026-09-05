export const CREATION_PROMPT_VERSION = "creation-v2-2026-09-05";

export type EvidenceStatus = "observed" | "inferred" | "missing" | "conflicting";
export type FieldEvidence = { status: EvidenceStatus; sourceText: string[] };
export type SourceEvidence = {
  version: typeof CREATION_PROMPT_VERSION;
  sourceText: string;
  fields: Record<string, FieldEvidence>;
};

export const nullableString = { type: ["string", "null"] } as const;
export const stringList = { type: "array", items: { type: "string" } } as const;
export function strictObject(properties: Record<string, object>) {
  return {
    type: "object",
    additionalProperties: false,
    required: Object.keys(properties),
    properties,
  };
}
export const fieldEvidenceSchema = strictObject({
  status: { type: "string", enum: ["observed", "inferred", "missing", "conflicting"] },
  sourceText: stringList,
});

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** A source quote must actually occur in the transcript; model labels alone are not evidence. */
export function normalizeSourceEvidence(value: unknown): SourceEvidence | null {
  if (!isRecord(value) || typeof value.sourceText !== "string" || !isRecord(value.fields))
    return null;
  const fields: Record<string, FieldEvidence> = {};
  for (const [field, item] of Object.entries(value.fields)) {
    if (!isRecord(item) || !Array.isArray(item.sourceText)) continue;
    const quotes = item.sourceText.filter(
      (quote): quote is string =>
        typeof quote === "string" &&
        quote.trim().length > 0 &&
        value.sourceText !== undefined &&
        (value.sourceText as string).includes(quote),
    );
    const status: EvidenceStatus =
      item.status === "missing" || item.status === "conflicting"
        ? item.status
        : item.status === "observed" && quotes.length > 0
          ? "observed"
          : "inferred";
    fields[field] = { status, sourceText: quotes };
  }
  return { version: CREATION_PROMPT_VERSION, sourceText: value.sourceText, fields };
}

/** Small validator for the JSON Schema subset used at our external model boundaries. */
export function matchesSchema(value: unknown, schema: object): boolean {
  const rule = schema as Record<string, unknown>;
  if (Array.isArray(rule.enum) && !rule.enum.includes(value)) return false;
  if (Array.isArray(rule.anyOf))
    return rule.anyOf.some((item) => isRecord(item) && matchesSchema(value, item));
  const types = Array.isArray(rule.type) ? rule.type : [rule.type];
  const kind = value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
  if (
    !types.includes(kind) &&
    !(kind === "number" && types.includes("integer") && Number.isInteger(value))
  )
    return false;
  if (Array.isArray(value) && isRecord(rule.items))
    return value.every((item) => matchesSchema(item, rule.items as object));
  if (isRecord(value) && isRecord(rule.properties)) {
    const properties = rule.properties;
    if (
      Array.isArray(rule.required) &&
      rule.required.some((key) => typeof key === "string" && !(key in value))
    )
      return false;
    return Object.entries(value).every(([key, item]) =>
      isRecord(properties[key])
        ? matchesSchema(item, properties[key])
        : rule.additionalProperties !== false,
    );
  }
  return true;
}
