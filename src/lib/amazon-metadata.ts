const ASIN_REGEXES: RegExp[] = [
  /\/dp\/([A-Z0-9]{10})/i,
  /\/gp\/product\/([A-Z0-9]{10})/i,
  /\/product\/([A-Z0-9]{10})/i,
];

export function extractAsinFromUrl(url: string): string | null {
  for (const re of ASIN_REGEXES) {
    const match = url.match(re);
    if (match?.[1]) return match[1];
  }
  return null;
}

function buildImageUrlFromAsin(asin: string): string {
  // Common pattern for Amazon product images; not guaranteed but works for most items.
  return `https://m.media-amazon.com/images/I/${asin}._AC_.jpg`;
}

export type AmazonMetadata = {
  asin: string | null;
  title: string | null;
  imageUrl: string | null;
  price: string | null;
};

export async function extractAmazonMetadata(url: string): Promise<AmazonMetadata> {
  const asin = extractAsinFromUrl(url);
  let imageUrl = asin ? buildImageUrlFromAsin(asin) : null;
  let title: string | null = null;
  let price: string | null = null;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; EnvitefyBot/1.0; +https://envitefy.com)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`upstream status ${res.status}`);
    }

    const html = await res.text();

    const ogTitleMatch = html.match(
      /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["'][^>]*>/i
    );
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    title = (ogTitleMatch?.[1] || titleMatch?.[1] || "").trim() || null;

    const priceMatch = html.match(/\$\s?(\d{1,4}(?:\.\d{2})?)/);
    if (priceMatch?.[0]) {
      price = priceMatch[0].trim();
    }

    const ogImageMatch = html.match(
      /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["'][^>]*>/i
    );
    if (ogImageMatch?.[1]) {
      imageUrl = ogImageMatch[1].trim() || imageUrl;
    }
  } catch (err) {
    try {
      console.warn(
        "[amazon-metadata] fetch failed, falling back to ASIN-only image",
        (err as any)?.message || err
      );
    } catch {
      // ignore logging failures
    }
  }

  return {
    asin,
    title,
    imageUrl,
    price,
  };
}

