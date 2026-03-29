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
  ["heroImage"],
  ["customHeroImage"],
  ["headlineBg"],
  ["images", "hero"],
  ["images", "headlineBg"],
  ["attachment", "dataUrl"],
  ["attachment", "previewImageUrl"],
  ["attachment", "thumbnailUrl"],
  ["profileImage", "dataUrl"],
  ["signupForm", "header", "backgroundImage", "dataUrl"],
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

export function listEventMediaEntries(source: unknown): EventMediaEntry[] {
  if (!source || typeof source !== "object") return [];
  const entries: EventMediaEntry[] = [];
  for (const pathSegments of STATIC_STRING_PATHS) {
    addEntry(entries, source, pathSegments);
  }
  collectGalleryEntries(entries, source);
  return entries;
}

function buildIssue(entry: EventMediaEntry, kind: EventMediaIssueKind): EventMediaIssue {
  const parsed = kind === "inline-data-url" ? parseDataUrlBase64(entry.value) : null;
  return {
    fieldPath: entry.fieldPath,
    kind,
    mimeType: parsed?.mimeType || null,
    valuePreview: entry.value.slice(0, 80),
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

function extractAppOwnedBlobRef(value: string): string | null {
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

  return isAppOwnedBlobUrl(value) ? value : null;
}

export function findInlineEventMedia(source: unknown): EventMediaIssue[] {
  return listEventMediaEntries(source)
    .filter((entry) => entry.value.startsWith("data:"))
    .map((entry) => buildIssue(entry, "inline-data-url"));
}

export function findTransientEventMedia(source: unknown): EventMediaIssue[] {
  return listEventMediaEntries(source)
    .filter((entry) => entry.value.startsWith("data:") || isBrowserObjectUrl(entry.value))
    .map((entry) =>
      buildIssue(entry, entry.value.startsWith("data:") ? "inline-data-url" : "browser-object-url"),
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
