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

/** Max optional honoree / event photos on the live card Event Details tab (sanitize + UI). */
export const STUDIO_GUEST_IMAGE_URL_MAX = 6;

export function sanitizeGuestImageUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of value) {
    const s = readString(entry);
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
    if (out.length >= STUDIO_GUEST_IMAGE_URL_MAX) break;
  }
  return out;
}
