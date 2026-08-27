import { isLoopbackHost, sanitizePersistedMediaUrl } from "./public-asset-url.ts";

export type EventShareImage = {
  url: string;
  width?: number;
  height?: number;
  type?: string;
  sizeBytes?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readPositiveNumber(value: unknown): number | undefined {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : undefined;
}

function isEnvitefyMediaHost(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();
  return (
    normalized === "envitefy.com" ||
    normalized === "www.envitefy.com" ||
    isLoopbackHost(normalized)
  );
}

function rewritePublicMediaPath(pathname: string): string | null {
  if (pathname.startsWith("/api/blob/event-media/")) {
    return `/media/event-media/${pathname.slice("/api/blob/event-media/".length)}`;
  }

  const thumbnailMatch = pathname.match(/^\/api\/events\/([^/]+)\/thumbnail$/);
  if (thumbnailMatch) {
    return `/media/events/${thumbnailMatch[1]}/thumbnail`;
  }

  return null;
}

export function toPublicShareMediaUrl(value: unknown): string | null {
  const sanitized = sanitizePersistedMediaUrl(readText(value));
  if (!sanitized || /^data:/i.test(sanitized)) return null;

  if (sanitized.startsWith("/") && !sanitized.startsWith("//")) {
    try {
      const parsed = new URL(sanitized, "https://envitefy.com");
      const publicPath = rewritePublicMediaPath(parsed.pathname);
      return publicPath ? `${publicPath}${parsed.search}${parsed.hash}` : sanitized;
    } catch {
      return null;
    }
  }

  if (!/^https?:\/\//i.test(sanitized)) return null;
  try {
    const parsed = new URL(sanitized);
    const publicPath = isEnvitefyMediaHost(parsed.hostname)
      ? rewritePublicMediaPath(parsed.pathname)
      : null;
    return publicPath ? `${publicPath}${parsed.search}${parsed.hash}` : parsed.toString();
  } catch {
    return null;
  }
}

function comparableMediaUrl(value: unknown): string {
  const publicUrl = toPublicShareMediaUrl(value);
  if (!publicUrl) return "";
  try {
    const parsed = new URL(publicUrl, "https://envitefy.com");
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return publicUrl;
  }
}

function sameMediaUrl(left: unknown, right: unknown): boolean {
  const leftComparable = comparableMediaUrl(left);
  return Boolean(leftComparable && leftComparable === comparableMediaUrl(right));
}

function inferImageType(url: string): string | undefined {
  let pathname = url;
  try {
    pathname = new URL(url, "https://envitefy.com").pathname;
  } catch {
    // Keep the raw URL for extension inspection.
  }
  if (/\.webp$/i.test(pathname)) return "image/webp";
  if (/\.png$/i.test(pathname)) return "image/png";
  if (/\.jpe?g$/i.test(pathname)) return "image/jpeg";
  if (/\.gif$/i.test(pathname)) return "image/gif";
  return undefined;
}

function resolveImageMetadata(
  data: Record<string, unknown>,
  attachment: Record<string, unknown> | null,
  selectedValue: unknown,
  selectedUrl: string,
): Omit<EventShareImage, "url"> {
  if (attachment && sameMediaUrl(selectedValue, attachment.thumbnailUrl)) {
    return {
      width: readPositiveNumber(attachment.thumbnailWidth),
      height: readPositiveNumber(attachment.thumbnailHeight),
      type: readText(attachment.thumbnailMimeType) || inferImageType(selectedUrl),
      sizeBytes: readPositiveNumber(attachment.thumbnailSizeBytes),
    };
  }

  const thumbnailMeta = isRecord(data.thumbnailMeta) ? data.thumbnailMeta : null;
  if (thumbnailMeta && sameMediaUrl(selectedValue, data.thumbnail)) {
    return {
      width: readPositiveNumber(thumbnailMeta.width),
      height: readPositiveNumber(thumbnailMeta.height),
      type: readText(thumbnailMeta.mimeType) || inferImageType(selectedUrl),
      sizeBytes: readPositiveNumber(thumbnailMeta.sizeBytes),
    };
  }

  return { type: inferImageType(selectedUrl) };
}

export function resolveEventShareImage(
  value: Record<string, unknown> | null | undefined,
): EventShareImage | null {
  if (!value || typeof value !== "object") return null;

  const data = value;
  const studioCard = isRecord(data.studioCard) ? data.studioCard : null;
  const attachment = isRecord(data.attachment) ? data.attachment : null;
  const attachmentThumbnail = toPublicShareMediaUrl(attachment?.thumbnailUrl);

  const candidates: unknown[] = [
    data.coverImageUrl,
    studioCard?.imageUrl,
    data.customHeroImage,
    data.heroImage,
    data.thumbnail,
    attachment?.previewImageUrl,
    attachment?.thumbnailUrl,
    attachment?.dataUrl,
  ];
  const selectedValue = candidates.find((candidate) => toPublicShareMediaUrl(candidate)) ?? null;
  if (!selectedValue) return null;

  const selectedRepresentsAttachmentArtwork =
    attachment &&
    (sameMediaUrl(selectedValue, attachment.previewImageUrl) ||
      sameMediaUrl(selectedValue, attachment.dataUrl));
  const optimizedValue =
    attachmentThumbnail && selectedRepresentsAttachmentArtwork
      ? attachment?.thumbnailUrl
      : selectedValue;
  const selectedUrl = toPublicShareMediaUrl(optimizedValue);
  if (!selectedUrl) return null;

  return {
    url: selectedUrl,
    ...resolveImageMetadata(data, attachment, optimizedValue, selectedUrl),
  };
}
