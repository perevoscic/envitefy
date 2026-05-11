import {
  buildLegacyEventSlugSegment,
  buildPublicEventSlugSegment,
  normalizePublicSlug,
} from "./event-public-slug";

const slugifyTitle = (value: string | null | undefined): string => {
  return normalizePublicSlug(value);
};

export function buildEventSlug(title?: string | null): string {
  return slugifyTitle(typeof title === "string" ? title : null);
}

export function buildEventSlugSegment(
  id: string,
  title?: string | null,
  publicSlug?: string | null,
): string {
  return buildPublicEventSlugSegment(id, title, publicSlug);
}

export function buildLegacyEventSlugIdSegment(id: string, title?: string | null): string {
  return buildLegacyEventSlugSegment(id, title);
}

type EventPathParams = Record<string, string | number | boolean | null | undefined>;

export function buildEventPath(
  id: string,
  title?: string | null,
  params?: EventPathParams,
  publicSlug?: string | null,
): string {
  const segment = buildEventSlugSegment(id, title, publicSlug);
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

export function buildStudioCardPath(
  id: string,
  title?: string | null,
  params?: EventPathParams,
  publicSlug?: string | null,
): string {
  const segment = buildEventSlugSegment(id, title, publicSlug);
  const base = `/card/${segment}`;
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

const UUID_SEGMENT_REGEX =
  /(?:^|-)(([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}))$/i;

export function isEventDetailPath(pathname?: string | null): boolean {
  const path = String(pathname || "").trim();
  if (!path.startsWith("/event/")) return false;
  const match = path.match(/^\/event\/([^/]+)$/);
  if (!match) return false;
  const segment = match[1] || "";
  return UUID_SEGMENT_REGEX.test(segment);
}

export function isStudioCardDetailPath(pathname?: string | null): boolean {
  const path = String(pathname || "").trim();
  if (!path.startsWith("/card/")) return false;
  const match = path.match(/^\/card\/([^/]+)$/);
  if (!match) return false;
  const segment = match[1] || "";
  return UUID_SEGMENT_REGEX.test(segment);
}
