import sharp from "sharp";
import { readSourceBranding, type SourceBranding } from "./imported-event-theme";

function usefulColor(hex: string) {
  const channels = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));
  return Math.max(...channels) - Math.min(...channels) > 35 && Math.max(...channels) > 55;
}
export function brandingFromCss(css: string, sourceUrl?: string): SourceBranding {
  const votes = new Map<string, number>();
  for (const match of css
    .slice(0, 350_000)
    .matchAll(
      /(?:theme-color["'][^>]*content=["']|(?:--[\w-]*(?:accent|primary|brand|color)[\w-]*|color|background(?:-color)?|fill|stroke)\s*:\s*)(#[\da-f]{3}(?:[\da-f]{3})?(?![\da-f])|rgba?\(\s*\d{1,3}\s*[, ]\s*\d{1,3}\s*[, ]\s*\d{1,3}[^)]*\))/gi,
    )) {
    let color = match[1].toLowerCase();
    if (color.startsWith("rgb"))
      color = `#${(color.match(/\d+/g) || [])
        .slice(0, 3)
        .map((channel) => Math.min(255, Number(channel)).toString(16).padStart(2, "0"))
        .join("")}`;
    if (color.length === 4) color = `#${[...color.slice(1)].map((char) => char + char).join("")}`;
    if (!usefulColor(color)) continue;
    const context = css.slice(Math.max(0, match.index! - 100), match.index);
    votes.set(
      color,
      (votes.get(color) || 0) +
        (/brand|accent|primary|header|navigation|theme-color/i.test(context) ? 5 : 1),
    );
  }
  const colors = [...votes]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([color]) => color);
  const font = css
    .match(/font-family\s*:\s*([^;}<>]{3,100})/i)?.[1]
    .replace(/["']/g, "")
    .trim();
  return readSourceBranding({ version: 1, origin: "website", colors, font, sourceUrl })!;
}

/** Read at most two likely brand stylesheets, including public CDNs, through the URL guard. */
export async function brandingFromWebsite(
  html: string,
  sourceUrl: string,
  signal: AbortSignal | undefined,
  read: (
    url: string,
    signal: AbortSignal,
  ) => Promise<{ bytes: Buffer; mimeType: string; url?: string }>,
) {
  const inline = brandingFromCss(html, sourceUrl);
  const urls: string[] = [];
  for (const tag of html.slice(0, 350_000).matchAll(/<link\b[^>]*>/gi)) {
    if (!/\brel\s*=\s*["'][^"']*stylesheet/i.test(tag[0])) continue;
    const href = tag[0].match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
    try {
      const url = new URL((href || "").replace(/&amp;/gi, "&"), sourceUrl);
      if (
        href &&
        /^https?:$/.test(url.protocol) &&
        !url.username &&
        !url.password &&
        !urls.includes(url.href)
      )
        urls.push(url.href);
    } catch {
      /* Invalid source links are data. */
    }
    if (urls.length === 32) break;
  }
  const score = (url: string) =>
    (/custom|brand|theme|site(?:[-.]|\/)|main|global|app(?:[.-]|\/)/i.test(new URL(url).pathname)
      ? 10
      : 0) +
    (new URL(url).origin === new URL(sourceUrl).origin ? 2 : 0) -
    (/component|vendor|font|icon/i.test(new URL(url).pathname) ? 5 : 0);
  const selected = urls.sort((a, b) => score(b) - score(a)).slice(0, 2);
  const results = await Promise.allSettled(
    selected.map((url) =>
      read(url, AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(3000)])),
    ),
  );
  const css = results.flatMap((result) =>
    result.status === "fulfilled" && /css|text\/plain/.test(result.value.mimeType)
      ? [result.value.bytes.subarray(0, 350_000).toString("utf8")]
      : [],
  );
  const linked = brandingFromCss(css.join("\n"), sourceUrl);
  let colors = [...new Set([...inline.colors, ...linked.colors])].slice(0, 6);
  if (!colors.length) {
    // Some hosts deny standalone CSS reads. A labeled logo is still useful visual evidence.
    const imageUrls = [
      ...new Set(
        [...html.slice(0, 350_000).matchAll(/<img\b[^>]*>/gi)]
          .filter((tag) => /logo|branding|background|banner|[/_-]bk[._-]/i.test(tag[0]))
          .flatMap((tag) => {
            const href = tag[0].match(/\b(?:src|data-src)\s*=\s*["']([^"']+)["']/i)?.[1];
            try {
              const url = new URL((href || "").replace(/&amp;/gi, "&"), sourceUrl);
              return href && /^https?:$/.test(url.protocol) ? [url.href] : [];
            } catch {
              return [];
            }
          }),
      ),
    ].slice(0, 2);
    const images = await Promise.allSettled(
      imageUrls.map((url) =>
        read(url, AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(3000)])),
      ),
    );
    const rasters = images.flatMap((result) =>
      result.status === "fulfilled" && /^image\/(?:png|jpeg|webp)$/.test(result.value.mimeType)
        ? [`data:${result.value.mimeType};base64,${result.value.bytes.toString("base64")}`]
        : [],
    );
    colors = (await brandingFromImages(rasters, "image")).colors;
  }
  return { ...inline, colors, font: inline.font || linked.font };
}
export async function brandingFromImages(
  images: string[],
  origin: "pdf" | "image",
  sourceUrl?: string,
): Promise<SourceBranding> {
  const votes = new Map<string, number>();
  for (const image of images.slice(0, 2)) {
    const data = image.match(/^data:image\/(?:png|jpeg|webp);base64,([\s\S]+)$/)?.[1];
    if (!data) continue;
    try {
      const { data: pixels, info } = await sharp(Buffer.from(data, "base64"), {
        limitInputPixels: 40_000_000,
      })
        .resize(96, 96, { fit: "inside" })
        .toColourspace("srgb")
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      for (let offset = 0; offset < pixels.length; offset += info.channels) {
        const color = `#${[0, 1, 2]
          .map((channel) =>
            Math.min(255, Math.round(pixels[offset + channel] / 32) * 32)
              .toString(16)
              .padStart(2, "0"),
          )
          .join("")}`;
        if (usefulColor(color)) votes.set(color, (votes.get(color) || 0) + 1);
      }
    } catch {
      /* A visual read never discards successfully extracted facts. */
    }
  }
  const colors: string[] = [];
  for (const [color, count] of [...votes].sort((a, b) => b[1] - a[1])) {
    if (
      count < 5 ||
      colors.some(
        (other) =>
          Math.hypot(
            ...[1, 3, 5].map(
              (index) =>
                parseInt(color.slice(index, index + 2), 16) -
                parseInt(other.slice(index, index + 2), 16),
            ),
          ) < 64,
      )
    )
      continue;
    colors.push(color);
    if (colors.length === 6) break;
  }
  return { version: 1, origin, colors, ...(sourceUrl ? { sourceUrl } : {}) };
}
