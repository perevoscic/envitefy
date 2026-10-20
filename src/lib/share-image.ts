import { isLoopbackHost, sanitizePersistedMediaUrl } from "./public-asset-url.ts";
import { eventArtworkCategory, resolveEventTemplateArtwork } from "./event-template-artwork";
import { resolveBirthdayHeroAsset } from "./birthday-hero-asset";
import { getBabyShowerDesign, resolveBabyShowerHero } from "./baby-shower-designs";
import { resolveFootballHero } from "@/components/football-season-templates/footballDesigns";
import { inflateGymDiscoveryV2EventData } from "./discovery/event-data";
import { importedArtworkSrc } from "./imported-event-design";
import { generatedScanHero, resolveScanMediaPolicy } from "./ocr/scan-media";

export type EventShareImage = {
  url: string;
  width?: number;
  height?: number;
  type?: string;
  sizeBytes?: number;
};

export type EventShareImageContext = {
  eventId?: string;
  pageBlueprint?: unknown;
  media?: {
    heroImageInline?: boolean;
    customHeroImageInline?: boolean;
    heroImageSig?: string | null;
    customHeroImageSig?: string | null;
    signupHeaderInline?: boolean;
    signupHeaderSig?: string | null;
  };
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

function projectedHeroImage(value: unknown): string | null {
  const url = toPublicShareMediaUrl(value);
  if (!url) return null;
  const parsed = new URL(url, "https://envitefy.com");
  return /^\/media\/events\/[^/]+\/thumbnail$/.test(parsed.pathname) &&
    parsed.searchParams.get("variant") === "hero"
    ? url
    : null;
}

function inlineArtworkUrl(context: EventShareImageContext, variant: "hero" | "signup-header"): string | null {
  if (!context.eventId) return null;
  const media = context.media;
  const inline = variant === "hero"
    ? media?.customHeroImageInline || media?.heroImageInline
    : media?.signupHeaderInline;
  if (!inline) return null;
  const signature = variant === "hero"
    ? media?.customHeroImageSig || media?.heroImageSig
    : media?.signupHeaderSig;
  const params = new URLSearchParams({ variant });
  if (signature) params.set("v", signature);
  return `/media/events/${encodeURIComponent(context.eventId)}/thumbnail?${params}`;
}

function blueprintArtwork(value: unknown): unknown {
  if (!isRecord(value) || !Array.isArray(value.sections)) return null;
  const hero = value.sections.find((section) => isRecord(section) && section.type === "hero");
  if (!isRecord(hero) || !Array.isArray(hero.media)) return null;
  return hero.media.find((media) => isRecord(media) && toPublicShareMediaUrl(media.url))?.url;
}

export function resolveEventShareImage(
  value: Record<string, unknown> | null | undefined,
  context: EventShareImageContext = {},
): EventShareImage | null {
  if (!value || typeof value !== "object") return null;

  const data: Record<string, unknown> = inflateGymDiscoveryV2EventData(value);
  const studioCard = isRecord(data.studioCard) ? data.studioCard : null;
  const images = isRecord(data.images) ? data.images : null;
  const theme = isRecord(data.theme) ? data.theme : null;
  const decorations = theme && isRecord(theme.decorations) ? theme.decorations : null;
  const customPage = isRecord(data.customEventPage) ? data.customEventPage : null;
  const form = isRecord(data.signupForm) ? data.signupForm : null;
  const header = form && isRecord(form.header) ? form.header : null;
  const headerImages = header && Array.isArray(header.images) ? header.images : [];
  const headerBackground = header && isRecord(header.backgroundImage) ? header.backgroundImage : null;
  const category = eventArtworkCategory(data);
  const scanPolicy = resolveScanMediaPolicy(data, readText(data.title));
  const isScan = Boolean(scanPolicy || data.ocrSkin || data.scanSourceKind || data.invitedFromScan ||
    /^(?:ocr|scan|snap|upload)/i.test(readText(data.createdVia)));
  const scanHero = scanPolicy?.heroMode === "generated" ? generatedScanHero(data) : null;
  const templateArtwork = isScan ? null : resolveEventTemplateArtwork(data);
  const inlineHero = inlineArtworkUrl(context, "hero") || projectedHeroImage(data.coverImageUrl);
  const savedHero = decorations?.heroImage || theme?.heroImage;
  const customHero = ["birthdays", "anniversaries", "weddings"].includes(category)
    ? data.customHeroImage || images?.hero || data.heroImage || inlineHero || data.hero
    : data.heroImage || data.customHeroImage || images?.hero || inlineHero || data.hero;
  let pageHero = readText(customHero || savedHero) || undefined;
  if (!isScan && ["birthdays", "anniversaries"].includes(category)) {
    pageHero = resolveBirthdayHeroAsset({
      customHero: readText(customHero), savedHero: readText(savedHero), catalogHero: templateArtwork,
    });
  } else if (!isScan && category === "baby-showers") {
    pageHero = resolveBabyShowerHero(pageHero, getBabyShowerDesign(readText(data.templateId)));
  } else if (!isScan && category === "football") {
    pageHero = resolveFootballHero(readText(data.pageTemplateId), pageHero);
  }
  const renderedArtwork = importedArtworkSrc(data.importedTheme, pageHero, templateArtwork);
  const attachment = isRecord(data.attachment) ? data.attachment : null;
  const attachmentThumbnail = toPublicShareMediaUrl(attachment?.thumbnailUrl);

  const candidates: unknown[] = [
    // Live Cards share this resolver with Event Pages and retain their finished artwork.
    ...(toPublicShareMediaUrl(studioCard?.imageUrl) ? [data.coverImageUrl, studioCard?.imageUrl] : []),
    blueprintArtwork(context.pageBlueprint),
    customPage?.artwork,
    ...headerImages.map((image) => isRecord(image) ? image.dataUrl : null),
    inlineArtworkUrl(context, "signup-header"),
    headerBackground?.dataUrl,
    scanHero,
    ...(isScan ? [data.coverImageUrl, data.thumbnail, attachment?.thumbnailUrl,
      attachment?.previewImageUrl, attachment?.dataUrl] : []),
    blueprintArtwork(data.eventPageBlueprint),
    renderedArtwork,
    customHero,
    savedHero,
    templateArtwork,
    data.coverImageUrl,
    studioCard?.imageUrl,
    data.thumbnail,
    attachment?.previewImageUrl,
    attachment?.thumbnailUrl,
    attachment?.dataUrl,
  ];
  // Private medical source documents are never a public share-preview fallback.
  const selectedValue = (scanPolicy?.medical ? [scanHero] : candidates)
    .find((candidate) => {
      const url = toPublicShareMediaUrl(candidate);
      return url && new URL(url, "https://envitefy.com").pathname !== "/og-default.jpg";
    }) ?? null;
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
