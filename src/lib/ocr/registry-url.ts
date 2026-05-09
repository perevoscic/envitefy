function isAmazonRootUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const candidate = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const parsed = new URL(candidate);
    const hostname = parsed.hostname.toLowerCase();
    if (!(hostname === "amazon.com" || hostname.endsWith(".amazon.com"))) return false;
    return parsed.pathname === "/" || parsed.pathname === "";
  } catch {
    return false;
  }
}

export function normalizeRegistryUrlForDetectedEvent(input: {
  category: string | null | undefined;
  title: string | null | undefined;
  description: string | null | undefined;
  rawText: string | null | undefined;
  registryUrl: string | null | undefined;
}): string | null {
  void input.category;
  void input.title;
  void input.description;
  void input.rawText;

  const registryUrl = typeof input.registryUrl === "string" ? input.registryUrl.trim() : "";
  if (!registryUrl || isAmazonRootUrl(registryUrl)) return null;
  return registryUrl;
}
