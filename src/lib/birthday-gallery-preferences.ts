export const BIRTHDAY_GALLERY_BATCH_SIZE = 24;
export const BIRTHDAY_FAVORITES_KEY = "envitefy:birthday-template-favorites:v1";

export function parseBirthdayFavorites(raw: string | null, validIds: ReadonlySet<string>): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter((id): id is string => typeof id === "string" && validIds.has(id)))];
  } catch {
    return [];
  }
}

export function toggleBirthdayFavorite(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((saved) => saved !== id) : [...ids, id];
}
