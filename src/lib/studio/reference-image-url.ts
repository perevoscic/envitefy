import { resolvePublicAssetOrigin } from "../public-asset-url.ts";

function referenceAppOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // Fall back to the app's other configured public origins.
    }
  }
  return resolvePublicAssetOrigin();
}

/**
 * Only fetch remote URLs we trust for studio reference images (SSRF-safe).
 * Uploads use Vercel Blob public URLs; same-site assets may also be allowed.
 */
export function isAllowedStudioReferenceImageUrl(raw: string): boolean {
  return resolveStudioReferenceImageUrl(raw) !== null;
}

/** Saved private-store artwork uses the same-origin /api/blob/ media proxy. */
export function resolveStudioReferenceImageUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.startsWith("//") || trimmed.includes("\\")) return null;
  try {
    const appOrigin = referenceAppOrigin();
    const u = trimmed.startsWith("/") ? new URL(trimmed, appOrigin) : new URL(trimmed);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (u.username || u.password) return null;
    const host = u.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") {
      return process.env.NODE_ENV !== "production" ? u.href : null;
    }
    if (process.env.NODE_ENV === "production" && u.protocol !== "https:") return null;
    if (host.endsWith(".public.blob.vercel-storage.com") && !u.port) return u.href;
    return u.origin === appOrigin ? u.href : null;
  } catch {
    return null;
  }
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Fetch an allowed reference image as inline data (base64, no data: prefix). */
export async function fetchStudioReferenceImage(
  raw: string,
): Promise<{ mimeType: string; data: string } | null> {
  let url = resolveStudioReferenceImageUrl(raw);
  if (!url) return null;
  try {
    // Keep the media proxy's access checks; never read private storage directly
    // and validate every redirect, including older thumbnail proxy URLs.
    let response = await fetch(url, { redirect: "manual" });
    for (let redirects = 0; [301, 302, 303, 307, 308].includes(response.status); redirects++) {
      const location = response.headers.get("location");
      if (!location || redirects >= 3) return null;
      url = resolveStudioReferenceImageUrl(new URL(location, url).href);
      if (!url) return null;
      response = await fetch(url, { redirect: "manual" });
    }
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

/** Resolve allowed reference URLs to inline image payloads. */
export async function resolveStudioReferenceImages(
  urls: string[] | undefined,
): Promise<Array<{ mimeType: string; data: string }>> {
  if (!urls?.length) return [];
  const slice = urls.slice(0, STUDIO_REFERENCE_IMAGES_MAX);
  const settled = await Promise.all(slice.map((u) => fetchStudioReferenceImage(u)));
  return settled.filter((x): x is NonNullable<typeof x> => x != null);
}
