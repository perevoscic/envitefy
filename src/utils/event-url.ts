const DEFAULT_SLUG = "event";

const slugifyTitle = (value: string | null | undefined): string => {
  if (!value) return DEFAULT_SLUG;
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || DEFAULT_SLUG;
};

export function buildEventSlug(title?: string | null): string {
  return slugifyTitle(typeof title === "string" ? title : null);
}

export function buildEventSlugSegment(
  id: string,
  title?: string | null
): string {
  const safeId = String(id || "").trim();
  const slug = buildEventSlug(title);
  return safeId ? `${slug}-${safeId}` : slug;
}

type EventPathParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export function buildEventPath(
  id: string,
  title?: string | null,
  params?: EventPathParams
): string {
  const segment = buildEventSlugSegment(id, title);
  const base = `/event/${segment}`;
  if (!params) return base;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue;
    if (typeof value === "boolean") {
      if (value) search.set(key, "1");
      continue;
    }
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}
