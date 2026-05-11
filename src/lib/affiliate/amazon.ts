const AMAZON_HOST_PATTERNS = ["amazon.com", "www.amazon.com"] as const;

export function getAmazonAssociateTag(): string | null {
  const tag = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG;
  return typeof tag === "string" && tag.trim() ? tag.trim() : null;
}

export function isAmazonUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    return (
      AMAZON_HOST_PATTERNS.includes(hostname as (typeof AMAZON_HOST_PATTERNS)[number]) ||
      hostname.endsWith(".amazon.com")
    );
  } catch {
    return false;
  }
}

export function attachAmazonAffiliateTag(
  url: string,
  tag: string | null | undefined = getAmazonAssociateTag(),
): string {
  if (!url || !tag) return url;

  try {
    const parsed = new URL(url);

    if (!isAmazonUrl(parsed.toString())) {
      return url;
    }

    parsed.searchParams.set("tag", tag);

    return parsed.toString();
  } catch {
    return url;
  }
}

export function buildAmazonSearchUrl(
  searchTerm: string,
  tag: string | null | undefined = getAmazonAssociateTag(),
): string {
  const parsed = new URL("https://www.amazon.com/s");

  parsed.searchParams.set("k", searchTerm);

  if (tag) {
    parsed.searchParams.set("tag", tag);
  }

  return parsed.toString();
}
