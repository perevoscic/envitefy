export type EventSectionExtras = {
  kind?: "photos" | "links";
  photos?: Array<{ url: string; caption: string }>;
  links?: Array<{ label: string; url: string }>;
};

const record = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

function cleanUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 2000 || /[\\\u0000-\u001f\u007f]/.test(value))
    return undefined;
  return value.trim() || undefined;
}

/** Guest links must remain ordinary web addresses, including after URL parsing. */
export function safeEventSectionLink(value: unknown): string | undefined {
  const text = cleanUrl(value);
  if (!text || !/^https?:\/\//i.test(text)) return undefined;
  try {
    const url = new URL(text);
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

/** Uploaded photos may also use the app's same-origin media address. */
export function safeEventSectionPhotoUrl(value: unknown): string | undefined {
  const text = cleanUrl(value);
  if (!text) return undefined;
  if (text.startsWith("/") && !text.startsWith("//")) return text;
  return safeEventSectionLink(text);
}

/** Extras are optional so older heading/body sections keep their exact shape. */
export function normalizeEventSectionExtras(value: unknown): EventSectionExtras {
  const raw = record(value);
  if (!raw) return {};
  const kind = raw.kind === "photos" || raw.kind === "links" ? raw.kind : undefined;
  const extras: EventSectionExtras = kind ? { kind } : {};
  if (Array.isArray(raw.photos) || kind === "photos") {
    extras.photos = [];
    for (const item of (Array.isArray(raw.photos) ? raw.photos : []).slice(0, 20)) {
      const photo = record(item);
      const url = safeEventSectionPhotoUrl(photo?.url);
      if (!photo || !url) continue;
      extras.photos.push({ url, caption: typeof photo.caption === "string" ? photo.caption.slice(0, 240) : "" });
    }
  }
  if (Array.isArray(raw.links) || kind === "links") {
    extras.links = [];
    for (const item of (Array.isArray(raw.links) ? raw.links : []).slice(0, 20)) {
      const link = record(item);
      if (!link) continue;
      const url = safeEventSectionLink(link.url);
      // An unfinished label with a blank address is still an editable draft row.
      if (!url && !(typeof link.url === "string" && !link.url.trim())) continue;
      extras.links.push({ label: typeof link.label === "string" ? link.label.slice(0, 240) : "", url: url || "" });
    }
  }
  return extras;
}
