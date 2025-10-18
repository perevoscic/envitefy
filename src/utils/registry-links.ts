export type EventRegistryLink = {
  label: string;
  url: string;
};

type RegistryBrandId =
  | "amazon"
  | "target"
  | "walmart"
  | "babylist"
  | "myregistry";

type RegistryBrandMetadata = {
  id: RegistryBrandId;
  hostSuffixes: readonly string[];
  defaultLabel: string;
  accentColor: string; // Hex string for background accents
  foregroundColor: string; // Hex string for text/icons on top of accentColor
};

export const REGISTRY_BRANDS: readonly RegistryBrandMetadata[] = [
  {
    id: "amazon",
    hostSuffixes: ["amazon.com", "www.amazon.com", "smile.amazon.com"],
    defaultLabel: "Amazon",
    accentColor: "#232F3E",
    foregroundColor: "#FFFFFF",
  },
  {
    id: "target",
    hostSuffixes: ["target.com", "www.target.com"],
    defaultLabel: "Target",
    accentColor: "#CC0000",
    foregroundColor: "#FFFFFF",
  },
  {
    id: "walmart",
    hostSuffixes: ["walmart.com", "www.walmart.com"],
    defaultLabel: "Walmart",
    accentColor: "#0071CE",
    foregroundColor: "#FFFFFF",
  },
  {
    id: "babylist",
    hostSuffixes: ["babylist.com", "www.babylist.com"],
    defaultLabel: "Babylist",
    accentColor: "#E91E63",
    foregroundColor: "#FFFFFF",
  },
  {
    id: "myregistry",
    hostSuffixes: ["myregistry.com", "www.myregistry.com"],
    defaultLabel: "MyRegistry",
    accentColor: "#009688",
    foregroundColor: "#FFFFFF",
  },
];

const MAX_LABEL_LENGTH = 60;

const HTTPS_PROTOCOL = "https:";

const registryHostMatches = (host: string, suffix: string): boolean => {
  const normalizedHost = host.toLowerCase();
  const normalizedSuffix = suffix.toLowerCase();
  return (
    normalizedHost === normalizedSuffix ||
    normalizedHost.endsWith(`.${normalizedSuffix}`)
  );
};

const normalizeUrl = (rawUrl: string): URL | null => {
  if (!rawUrl) return null;
  let candidate = rawUrl.trim();
  if (!candidate) return null;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }
  if (parsed.protocol !== HTTPS_PROTOCOL) return null;
  return parsed;
};

export const MAX_REGISTRY_LINKS = 3;

export type RegistryValidationResult = {
  ok: boolean;
  error?: string;
  brand?: RegistryBrandMetadata;
  normalizedUrl?: string;
};

export function validateRegistryUrl(rawUrl: string): RegistryValidationResult {
  const parsed = normalizeUrl(rawUrl || "");
  if (!parsed) {
    return {
      ok: false,
      error: "Enter a valid https:// link",
    };
  }
  const host = parsed.hostname.toLowerCase();
  const brand = REGISTRY_BRANDS.find((entry) =>
    entry.hostSuffixes.some((suffix) => registryHostMatches(host, suffix))
  );
  if (!brand) {
    return {
      ok: false,
      error: "Only Amazon, Target, Walmart, Babylist, or MyRegistry links are allowed",
    };
  }

  // Remove fragment identifiers to avoid leaking tracking parameters via hashes
  parsed.hash = "";

  return {
    ok: true,
    brand,
    normalizedUrl: parsed.toString(),
  };
}

export function normalizeRegistryLinks(
  rawEntries: ReadonlyArray<Partial<EventRegistryLink>>,
  max: number = MAX_REGISTRY_LINKS
): EventRegistryLink[] {
  if (!Array.isArray(rawEntries) || rawEntries.length === 0) return [];
  const dedupe = new Set<string>();
  const results: EventRegistryLink[] = [];
  for (const entry of rawEntries) {
    if (!entry?.url) continue;
    const validation = validateRegistryUrl(entry.url);
    if (!validation.ok || !validation.normalizedUrl) continue;
    const normalizedUrl = validation.normalizedUrl;
    if (dedupe.has(normalizedUrl)) continue;
    const rawLabel = (entry.label || "").trim();
    const fallbackLabel = validation.brand?.defaultLabel ||
      new URL(normalizedUrl).hostname;
    const label = (rawLabel || fallbackLabel).slice(0, MAX_LABEL_LENGTH);
    results.push({ label, url: normalizedUrl });
    dedupe.add(normalizedUrl);
    if (results.length >= max) break;
  }
  return results;
}

export function getRegistryBrandByUrl(url: string): RegistryBrandMetadata | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return (
      REGISTRY_BRANDS.find((entry) =>
        entry.hostSuffixes.some((suffix) => registryHostMatches(host, suffix))
      ) || null
    );
  } catch {
    return null;
  }
}

