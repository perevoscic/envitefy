export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function readNullableString(value: unknown): string | null {
  const next = readString(value);
  return next || null;
}
