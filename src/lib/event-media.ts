import { parseDataUrlBase64 } from "../utils/data-url.ts";
import { isRemoteMediaUrl } from "./upload-config.ts";

export type EventMediaIssueKind = "inline-data-url" | "browser-object-url";

export type EventMediaIssue = {
  fieldPath: string;
  kind: EventMediaIssueKind;
  mimeType?: string | null;
  valuePreview: string;
};

export type EventMediaEntry = {
  fieldPath: string;
  pathSegments: Array<string | number>;
  value: string;
};

const STATIC_STRING_PATHS: Array<Array<string | number>> = [
  ["thumbnail"],
  ["hero"],
  ["heroImage"],
  ["customHeroImage"],
  ["customEventPage", "artwork"],
  ["customEventPageDraft", "artwork"],
  ["headlineBg"],
  ["images", "hero"],
  ["images", "headlineBg"],
  ["attachment", "dataUrl"],
  ["attachment", "previewImageUrl"],
  ["attachment", "thumbnailUrl"],
  ["profileImage", "dataUrl"],
  ["openHouse", "realtorImageUrl"],
  ["signupForm", "header", "backgroundImage", "dataUrl"],
  ["advancedSections", "logistics", "gymLayoutImage"],
  ["customFields", "advancedSections", "logistics", "gymLayoutImage"],
  ["builderDraft", "advancedSections", "logistics", "gymLayoutImage"],
  ["builderDraft", "event", "advancedSections", "logistics", "gymLayoutImage"],
  ["builderDraft", "event", "customFields", "advancedSections", "logistics", "gymLayoutImage"],
  ["discoverySource", "extractionMeta", "gymLayoutImageDataUrl"],
];

function getPathLabel(pathSegments: Array<string | number>): string {
  return pathSegments
    .map((segment, index) =>
      typeof segment === "number" ? `[${segment}]` : index === 0 ? segment : `.${segment}`,
    )
    .join("");
}

function getValueAtPath(source: unknown, pathSegments: Array<string | number>): unknown {
  let current: any = source;
  for (const segment of pathSegments) {
    if (current == null) return undefined;
    current = current[segment as any];
  }
  return current;
}

export function setValueAtPath(
  source: Record<string, any>,
  pathSegments: Array<string | number>,
  value: unknown,
): void {
  if (!source || typeof source !== "object" || !pathSegments.length) return;
  let current: any = source;
  for (let index = 0; index < pathSegments.length - 1; index += 1) {
    const segment = pathSegments[index];
    if (current == null || typeof current !== "object") return;
    current = current[segment as any];
  }
  if (current == null || typeof current !== "object") return;
  current[pathSegments[pathSegments.length - 1] as any] = value;
}

function addEntry(
  entries: EventMediaEntry[],
  source: unknown,
  pathSegments: Array<string | number>,
): void {
  const value = getValueAtPath(source, pathSegments);
  if (typeof value !== "string" || !value.trim()) return;
  entries.push({
    fieldPath: getPathLabel(pathSegments),
    pathSegments,
    value: value.trim(),
  });
}

function collectGalleryEntries(entries: EventMediaEntry[], source: any): void {
  const gallery = source?.gallery;
  if (!Array.isArray(gallery)) return;
  for (let index = 0; index < gallery.length; index += 1) {
    for (const key of ["url", "src", "preview"] as const) {
      addEntry(entries, source, ["gallery", index, key]);
    }
  }
}

function collectSignupHeaderEntries(entries: EventMediaEntry[], source: any): void {
  const images = source?.signupForm?.header?.images;
  if (!Array.isArray(images)) return;
  for (let index = 0; index < images.length; index += 1) {
    addEntry(entries, source, ["signupForm", "header", "images", index, "dataUrl"]);
    addEntry(entries, source, ["signupForm", "header", "images", index, "thumbnailUrl"]);
  }
}

function collectSponsorEntries(entries: EventMediaEntry[], source: any): void {
  const sponsors = source?.sponsors;
  if (!Array.isArray(sponsors)) return;
  for (let index = 0; index < sponsors.length; index += 1) {
    addEntry(entries, source, ["sponsors", index, "logo"]);
  }
}

function collectOpenHouseEntries(entries: EventMediaEntry[], source: any): void {
  const images = source?.openHouse?.propertyImages;
  if (!Array.isArray(images)) return;
  for (let index = 0; index < images.length; index += 1) {
    addEntry(entries, source, ["openHouse", "propertyImages", index, "url"]);
  }
}

export function listEventMediaEntries(source: unknown): EventMediaEntry[] {
  if (!source || typeof source !== "object") return [];
  const entries: EventMediaEntry[] = [];
  for (const pathSegments of STATIC_STRING_PATHS) {
    addEntry(entries, source, pathSegments);
  }
  collectGalleryEntries(entries, source);
  collectSignupHeaderEntries(entries, source);
  collectSponsorEntries(entries, source);
  collectOpenHouseEntries(entries, source);
  const privateMedia = (source as any).privateMedia;
  if (privateMedia && typeof privateMedia === "object" && !Array.isArray(privateMedia)) {
    for (const key of Object.keys(privateMedia)) addEntry(entries, source, ["privateMedia", key, "dataUrl"]);
  }
  // Legacy editor snapshots and custom sections can contain media at any depth.
  // Keep the known durable URL paths above, then discover every transient URL.
  const known = new Set(entries.map((entry) => JSON.stringify(entry.pathSegments)));
  const seen = new WeakSet<object>();
  const visit = (value: unknown, path: Array<string | number>): void => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (/^(data:|blob:)/i.test(trimmed) && !known.has(JSON.stringify(path))) {
        entries.push({ fieldPath: getPathLabel(path), pathSegments: path, value: trimmed });
      }
      return;
    }
    if (!value || typeof value !== "object" || seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) value.forEach((item, index) => { visit(item, [...path, index]); });
    else Object.entries(value).forEach(([key, item]) => { visit(item, [...path, key]); });
    seen.delete(value);
  };
  visit(source, []);
  return entries;
}

function buildIssue(entry: EventMediaEntry, kind: EventMediaIssueKind): EventMediaIssue {
  const parsed = kind === "inline-data-url" ? parseDataUrlBase64(entry.value) : null;
  return {
    fieldPath: entry.fieldPath,
    kind,
    mimeType: parsed?.mimeType || null,
    // Validation responses must not echo encoded image/document contents.
    valuePreview: kind === "inline-data-url" ? `data:${parsed?.mimeType || "unknown"};…` : "blob:…",
  };
}

function isBrowserObjectUrl(value: string): boolean {
  return /^blob:/i.test(value);
}

export function isSiteStaticAssetPath(value: string): boolean {
  return (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/api/") &&
    !value.startsWith("/event-media/")
  );
}

export function isAppOwnedBlobUrl(value: string): boolean {
  const proxyPathPrefix = "/api/blob/";
  try {
    const parsed = new URL(value, "https://envitefy.com");
    if (parsed.pathname.startsWith(proxyPathPrefix)) {
      return true;
    }
  } catch {}

  if (!isRemoteMediaUrl(value)) return false;
  try {
    const parsed = new URL(value);
    const pathname = parsed.pathname || "";
    const host = parsed.hostname || "";
    return (
      host.includes("vercel-storage.com") ||
      pathname.includes("/event-media/") ||
      pathname.includes("/discovery-input/")
    );
  } catch {
    return false;
  }
}

export function extractAppOwnedBlobProxyPathname(value: string): string | null {
  try {
    const parsed = new URL(value, "https://envitefy.com");
    if (parsed.pathname.startsWith("/api/blob/")) {
      const pathname = parsed.pathname
        .slice("/api/blob/".length)
        .split("/")
        .filter(Boolean)
        .map((segment) => {
          try {
            return decodeURIComponent(segment);
          } catch {
            return segment;
          }
        })
        .join("/");
      return pathname || null;
    }
  } catch {}

  return null;
}

function extractAppOwnedBlobRef(value: string): string | null {
  const proxyPathname = extractAppOwnedBlobProxyPathname(value);
  if (proxyPathname) return proxyPathname;
  return isAppOwnedBlobUrl(value) ? value : null;
}

export function findInlineEventMedia(source: unknown): EventMediaIssue[] {
  return listEventMediaEntries(source)
    .filter((entry) => /^data:/i.test(entry.value))
    .map((entry) => buildIssue(entry, "inline-data-url"));
}

export function findTransientEventMedia(source: unknown): EventMediaIssue[] {
  return listEventMediaEntries(source)
    .filter((entry) => /^data:/i.test(entry.value) || isBrowserObjectUrl(entry.value))
    .map((entry) =>
      buildIssue(entry, /^data:/i.test(entry.value) ? "inline-data-url" : "browser-object-url"),
    );
}

export function collectAppOwnedBlobUrls(source: unknown): string[] {
  const urls = new Set<string>();
  for (const entry of listEventMediaEntries(source)) {
    const ref = extractAppOwnedBlobRef(entry.value);
    if (ref) urls.add(ref);
  }
  return Array.from(urls);
}

/** Shared write boundary also covers server jobs that bypass the history APIs. */
export function assertPersistableEventMedia(source: unknown): void {
  const issues = findTransientEventMedia(source);
  if (issues.length) {
    throw new Error(`Upload media before saving: ${issues.map((issue) => issue.fieldPath).join(", ")}`);
  }
}

/** Upload a snapshot only on an explicit persistence action, retaining caller state on failure. */
export async function replaceTransientEventMedia<T extends Record<string, any>>(
  source: T,
  upload: (entry: EventMediaEntry) => Promise<string>,
): Promise<T> {
  const entries = listEventMediaEntries(source).filter(entry => /^(data:|blob:)/i.test(entry.value));
  if (!entries.length) return source;
  const next = structuredClone(source);
  const replacements = new Map<string, string>();
  for (const entry of entries) {
    let url = replacements.get(entry.value);
    if (!url) {
      url = await upload(entry);
      if (!url || /^(data:|blob:)/i.test(url)) throw new Error("Media upload did not return a stored file");
      replacements.set(entry.value, url);
    }
    setValueAtPath(next, entry.pathSegments, url);
  }
  assertPersistableEventMedia(next);
  return next;
}
