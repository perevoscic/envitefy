import { getFallbackThumbnail } from "../studio-workspace-builders";
import { sanitizeMediaItems } from "../studio-workspace-sanitize";
import type { MediaItem } from "../studio-workspace-types";

/** Keep remote payloads under API limits; huge data URLs are replaced with theme fallback. */
const MAX_DATA_URL_CHARS = 120_000;

export function prepareStudioLibraryItemsForRemote(items: MediaItem[]): MediaItem[] {
  return items.map((item) => {
    const url = item.url;
    if (typeof url === "string" && url.startsWith("data:") && url.length > MAX_DATA_URL_CHARS) {
      return {
        ...item,
        url: getFallbackThumbnail(item.details),
      };
    }
    return item;
  });
}

/** Stable string for equality checks (same pipeline as PUT body, ids sorted). */
export function canonicalizeLibraryPayloadForCompare(items: MediaItem[]): string {
  const sanitized = sanitizeMediaItems(prepareStudioLibraryItemsForRemote(items));
  const sorted = [...sanitized].sort((a, b) => a.id.localeCompare(b.id));
  return JSON.stringify(sorted);
}

export async function putStudioLibraryRemote(items: MediaItem[]): Promise<{
  ok: boolean;
  status: number;
}> {
  const payload = sanitizeMediaItems(prepareStudioLibraryItemsForRemote(items));
  const body = JSON.stringify({ items: payload });
  try {
    const res = await fetch("/api/studio/library", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (!res.ok) {
      console.warn("[studio-library] PUT failed", res.status);
    }
    return { ok: res.ok, status: res.status };
  } catch (err) {
    console.warn("[studio-library] PUT network error", err);
    return { ok: false, status: 0 };
  }
}
