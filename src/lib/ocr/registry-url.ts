const AMAZON_BABY_REGISTRY_URL = "https://www.amazon.com/baby-reg/homepage";
const AMAZON_WEDDING_REGISTRY_URL = "https://www.amazon.com/registries/search";
const AMAZON_BIRTHDAY_REGISTRY_URL = "https://www.amazon.com/registries/birthday";

function normalizeCategory(value: string | null | undefined): string {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function hasAmazonRegistryCue(rawText: string | null | undefined): boolean {
  const normalized = String(rawText || "").toLowerCase();
  return /\bregistered\s+at\s+amazon\b/.test(normalized);
}

function isAmazonRootUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    if (!hostname.endsWith("amazon.com")) return false;
    return parsed.pathname === "/" || parsed.pathname === "";
  } catch {
    return false;
  }
}

function chooseAmazonRegistryUrlFromEventType(input: {
  category: string | null | undefined;
  title: string | null | undefined;
  description: string | null | undefined;
  rawText: string | null | undefined;
}): string {
  const category = normalizeCategory(input.category);
  const signals = [input.title, input.description, input.rawText, input.category]
    .map((value) => String(value || "").toLowerCase())
    .join("\n");

  if (category.includes("birthday") || /\bbirthday\b/.test(signals)) {
    return AMAZON_BIRTHDAY_REGISTRY_URL;
  }
  if (category.includes("wedding") || /\b(wedding|bridal)\b/.test(signals)) {
    return AMAZON_WEDDING_REGISTRY_URL;
  }
  if (category.includes("baby") || /\bbaby\s*(shower|sprinkle)?\b/.test(signals)) {
    return AMAZON_BABY_REGISTRY_URL;
  }

  return AMAZON_WEDDING_REGISTRY_URL;
}

export function normalizeRegistryUrlForDetectedEvent(input: {
  category: string | null | undefined;
  title: string | null | undefined;
  description: string | null | undefined;
  rawText: string | null | undefined;
  registryUrl: string | null | undefined;
}): string | null {
  const registryUrl = typeof input.registryUrl === "string" ? input.registryUrl.trim() : "";
  if (!registryUrl && !hasAmazonRegistryCue(input.rawText)) return null;

  if (!registryUrl || isAmazonRootUrl(registryUrl) || hasAmazonRegistryCue(input.rawText)) {
    return chooseAmazonRegistryUrlFromEventType(input);
  }

  return registryUrl;
}
