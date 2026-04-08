/**
 * Only fetch remote URLs we trust for studio reference images (SSRF-safe).
 * Uploads use Vercel Blob public URLs; same-site assets may also be allowed.
 */
export function isAllowedStudioReferenceImageUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  try {
    const u = new URL(trimmed);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    const host = u.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") {
      return process.env.NODE_ENV !== "production";
    }
    if (process.env.NODE_ENV === "production" && u.protocol !== "https:") return false;
    if (host.endsWith(".public.blob.vercel-storage.com")) return true;
    const appBase = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (appBase) {
      try {
        const appHost = new URL(appBase).hostname.toLowerCase();
        if (appHost && host === appHost) return true;
      } catch {
        /* ignore */
      }
    }
    return false;
  } catch {
    return false;
  }
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Fetch an allowed reference image for Gemini inlineData (base64, no data: prefix). */
export async function fetchStudioReferenceImage(
  raw: string,
): Promise<{ mimeType: string; data: string } | null> {
  const trimmed = raw.trim();
  if (!isAllowedStudioReferenceImageUrl(trimmed)) return null;
  try {
    const response = await fetch(trimmed);
    if (!response.ok) return null;
    const mimeTypeHeader = safeString(response.headers.get("content-type"));
    const mimeType = mimeTypeHeader.split(";")[0]?.trim() || "image/png";
    if (!mimeType.startsWith("image/")) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    const maxBytes = 12 * 1024 * 1024;
    if (bytes.length > maxBytes) return null;
    return {
      mimeType,
      data: bytes.toString("base64"),
    };
  } catch {
    return null;
  }
}

const STUDIO_REFERENCE_IMAGES_MAX = 6;

/** Resolve allowed reference URLs to inline image payloads (for Gemini). */
export async function resolveStudioReferenceImages(
  urls: string[] | undefined,
): Promise<Array<{ mimeType: string; data: string }>> {
  if (!urls?.length) return [];
  const slice = urls.slice(0, STUDIO_REFERENCE_IMAGES_MAX);
  const settled = await Promise.all(slice.map((u) => fetchStudioReferenceImage(u)));
  return settled.filter((x): x is NonNullable<typeof x> => x != null);
}
