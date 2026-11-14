import { readPublicCreateUrl } from "./create/read-source";
import { readVenuePhotoReference, type VenuePhotoReference } from "./venue-photo-source";
import { verifyVenuePhotoPermission, type VenuePhotoPermission } from "./venue-photo-permission";

export type PermittedVenuePhoto = { sourceUrl: string; imageUrl: string; permission: VenuePhotoPermission };
export const venuePhotoPermissionDeps = { read: readPublicCreateUrl };
const cache = new Map<string, { expires: number; result: Promise<PermittedVenuePhoto | null> }>();
const normalized = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const absolute = (value: string, base: string): string | undefined => {
  try { const url = new URL(value.replace(/&amp;/gi, "&"), base); if (url.protocol === "https:" && !url.username && !url.password) return url.href; } catch {}
};
function images(html: string, base: string): string[] {
  return [...new Set([...html.matchAll(/<(?:img|source|a|meta)\b[^>]*>/gi)].flatMap(tag =>
    [...tag[0].matchAll(/\b(?:src|href|content|data-src|srcset)\s*=\s*["']([^"']+)["']/gi)]
      .flatMap(attribute => attribute[1].split(/,\s*/).map(part => absolute(part.trim().split(/\s+/)[0], base))).filter((url): url is string => Boolean(url))))];
}

/** Search a bounded set of official media/usage pages; never assume credit is permission. */
export async function findPermittedVenuePhoto(venue: string, input: unknown,
  options: { html?: string; signal?: AbortSignal; cache?: boolean } = {}): Promise<PermittedVenuePhoto | null> {
  const reference = readVenuePhotoReference(input);
  if (!reference || normalized(reference.venue) !== normalized(venue)) return null;
  const key = JSON.stringify([normalized(venue), reference.sourceUrl, reference.imageUrl]);
  if (options.cache !== false) {
    const existing = cache.get(key);
    if (existing && existing.expires > Date.now()) return existing.result;
  }
  const result = search(reference, options).catch(() => null);
  if (options.cache !== false) {
    if (cache.size >= 200) cache.delete(cache.keys().next().value!);
    cache.set(key, { expires: Date.now() + 15 * 60_000, result });
    void result.then(photo => { const entry = cache.get(key); if (entry?.result === result) entry.expires = Date.now() + (photo ? 24 * 60 * 60_000 : 15 * 60_000); });
  }
  return result;
}

async function search(reference: VenuePhotoReference, options: { html?: string; signal?: AbortSignal }): Promise<PermittedVenuePhoto | null> {
  const signal = AbortSignal.any([...(options.signal ? [options.signal] : []), AbortSignal.timeout(10000)]);
  const origin = new URL(reference.sourceUrl).origin;
  const queue = [reference.sourceUrl], seen = new Set<string>();
  while (queue.length && seen.size < 4 && !signal.aborted) {
    const url = queue.shift()!;
    if (seen.has(url)) continue;
    seen.add(url);
    try {
      let html = url === reference.sourceUrl ? options.html : undefined;
      let pageUrl = url;
      if (html === undefined) {
        const page = await venuePhotoPermissionDeps.read(url, AbortSignal.any([signal, AbortSignal.timeout(4000)]));
        if (!/text\/html/i.test(page.mimeType) || page.bytes.length > 1_000_000) continue;
        pageUrl = page.url || url;
        if (new URL(pageUrl).origin !== origin) continue;
        html = page.bytes.toString("utf8");
      }
      const visible = normalized(html.replace(/<(script|style|template|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " "));
      if (!normalized(reference.venue).split(" ").filter(word => word.length > 2).every(word => visible.includes(word))) continue;
      const assets = images(html, pageUrl);
      const alternatives = assets.filter(asset => /(?:exterior|building|entrance|facade|aerial|front|interior|ballroom|lobby)[^/]*\.(?:jpe?g|png|webp|avif)(?:$|\?)/i.test(asset) && !/logo|icon|floor.?plan|map|sculpture/i.test(asset));
      for (const imageUrl of [...new Set([...(assets.includes(reference.imageUrl) ? [reference.imageUrl] : []), ...alternatives])].slice(0, 4)) {
        const permission = verifyVenuePhotoPermission(html, pageUrl, imageUrl);
        if (permission) return { sourceUrl: pageUrl, imageUrl, permission };
      }
      const links = [...html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
        .filter(match => /media|press|photo|gallery|image.?use|licen[sc]|terms|copyright/i.test(`${match[1]} ${match[2].replace(/<[^>]+>/g, " ")}`))
        .map(match => absolute(match[1], pageUrl)).filter((href): href is string => Boolean(href && new URL(href).origin === origin));
      const priority = (href: string) => /media.?kit|image.?use|photo.?use|licen[sc]/i.test(href) ? 3 : /media|press/i.test(href) ? 2 : /photo|gallery/i.test(href) ? 1 : 0;
      links.sort((a, b) => priority(b) - priority(a));
      queue.push(...links.filter(link => !seen.has(link)).slice(0, 4 - seen.size));
    } catch { /* One blocked media page must not stop the other permitted sources. */ }
  }
  return null;
}
