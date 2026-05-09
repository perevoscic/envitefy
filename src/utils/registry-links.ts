export type EventRegistryLink = {
  label: string;
  url: string;
};

export type RegistryInput = {
  registryProvider?: string | null;
  registryUrl?: string | null;
  registryName?: string | null;
  eventType?: string | null;
  city?: string | null;
  state?: string | null;
};

export type RegistryAction = {
  url: string | null;
  label: string | null;
  helperText: string | null;
};

export type RegistrySectionCopy = {
  allowsLinks: boolean;
  sectionLabel: string;
  sectionHeading: string;
  linksLabel: string;
  itemFallbackLabel: string;
  invalidLinksAlert: string;
  emptyState: string;
  publicNote: string;
};

type RegistryBrandId = "amazon" | "target" | "walmart" | "babylist" | "myregistry";

type RegistryBrandMetadata = {
  id: RegistryBrandId;
  hostSuffixes: readonly string[];
  defaultLabel: string;
  accentColor: string; // Hex string for background accents
  foregroundColor: string; // Hex string for text/icons on top of accentColor
};

export type RegistryLinkContext = {
  category?: string | null;
  city?: string | null;
  title?: string | null;
  description?: string | null;
  eventType?: string | null;
  location?: string | null;
  ocrText?: string | null;
  registryName?: string | null;
  registryProvider?: string | null;
  state?: string | null;
};

export const AMAZON_REGISTRY_SEARCH_URL = "https://www.amazon.com/registries/search";

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

export const MAX_REGISTRY_LINKS = 3;

const normalizeCategoryKey = (category: string): string =>
  category.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

const registryContextText = (context: RegistryLinkContext): string =>
  [
    context.category,
    context.eventType,
    context.registryProvider,
    context.registryName,
    context.title,
    context.description,
    context.ocrText,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const REGISTRY_SECTION_COPY_BY_CATEGORY: Record<string, RegistrySectionCopy> = {
  birthday: {
    allowsLinks: true,
    sectionLabel: "Gift List",
    sectionHeading: "Gift List",
    linksLabel: "Gift list links",
    itemFallbackLabel: "Gift list link",
    invalidLinksAlert: "Fix the highlighted gift list links before saving.",
    emptyState: `No gift list links yet. Use "Add link" to include up to ${MAX_REGISTRY_LINKS} retailers.`,
    publicNote:
      "These links open in a new tab. Gift lists must stay public or shareable so guests can view them.",
  },
  birthdays: {
    allowsLinks: true,
    sectionLabel: "Gift List",
    sectionHeading: "Gift List",
    linksLabel: "Gift list links",
    itemFallbackLabel: "Gift list link",
    invalidLinksAlert: "Fix the highlighted gift list links before saving.",
    emptyState: `No gift list links yet. Use "Add link" to include up to ${MAX_REGISTRY_LINKS} retailers.`,
    publicNote:
      "These links open in a new tab. Gift lists must stay public or shareable so guests can view them.",
  },
  wedding: {
    allowsLinks: true,
    sectionLabel: "Registry",
    sectionHeading: "Registries",
    linksLabel: "Registry links",
    itemFallbackLabel: "Registry link",
    invalidLinksAlert: "Fix the highlighted registry links before saving.",
    emptyState: `No registry links yet. Use "Add link" to include up to ${MAX_REGISTRY_LINKS} retailers.`,
    publicNote:
      "These links open in a new tab. Registries must stay public or shareable so guests can view them.",
  },
  weddings: {
    allowsLinks: true,
    sectionLabel: "Registry",
    sectionHeading: "Registries",
    linksLabel: "Registry links",
    itemFallbackLabel: "Registry link",
    invalidLinksAlert: "Fix the highlighted registry links before saving.",
    emptyState: `No registry links yet. Use "Add link" to include up to ${MAX_REGISTRY_LINKS} retailers.`,
    publicNote:
      "These links open in a new tab. Registries must stay public or shareable so guests can view them.",
  },
  "baby shower": {
    allowsLinks: true,
    sectionLabel: "Registry",
    sectionHeading: "Registries",
    linksLabel: "Registry links",
    itemFallbackLabel: "Registry link",
    invalidLinksAlert: "Fix the highlighted registry links before saving.",
    emptyState: `No registry links yet. Use "Add link" to include up to ${MAX_REGISTRY_LINKS} retailers.`,
    publicNote:
      "These links open in a new tab. Registries must stay public or shareable so guests can view them.",
  },
  "baby showers": {
    allowsLinks: true,
    sectionLabel: "Registry",
    sectionHeading: "Registries",
    linksLabel: "Registry links",
    itemFallbackLabel: "Registry link",
    invalidLinksAlert: "Fix the highlighted registry links before saving.",
    emptyState: `No registry links yet. Use "Add link" to include up to ${MAX_REGISTRY_LINKS} retailers.`,
    publicNote:
      "These links open in a new tab. Registries must stay public or shareable so guests can view them.",
  },
  "bridal shower": {
    allowsLinks: true,
    sectionLabel: "Registry",
    sectionHeading: "Registries",
    linksLabel: "Registry links",
    itemFallbackLabel: "Registry link",
    invalidLinksAlert: "Fix the highlighted registry links before saving.",
    emptyState: `No registry links yet. Use "Add link" to include up to ${MAX_REGISTRY_LINKS} retailers.`,
    publicNote:
      "These links open in a new tab. Registries must stay public or shareable so guests can view them.",
  },
  "bridal showers": {
    allowsLinks: true,
    sectionLabel: "Registry",
    sectionHeading: "Registries",
    linksLabel: "Registry links",
    itemFallbackLabel: "Registry link",
    invalidLinksAlert: "Fix the highlighted registry links before saving.",
    emptyState: `No registry links yet. Use "Add link" to include up to ${MAX_REGISTRY_LINKS} retailers.`,
    publicNote:
      "These links open in a new tab. Registries must stay public or shareable so guests can view them.",
  },
  "gender reveal": {
    allowsLinks: true,
    sectionLabel: "Registry",
    sectionHeading: "Registries",
    linksLabel: "Registry links",
    itemFallbackLabel: "Registry link",
    invalidLinksAlert: "Fix the highlighted registry links before saving.",
    emptyState: `No registry links yet. Use "Add link" to include up to ${MAX_REGISTRY_LINKS} retailers.`,
    publicNote:
      "These links open in a new tab. Registries must stay public or shareable so guests can view them.",
  },
  "gender reveals": {
    allowsLinks: true,
    sectionLabel: "Registry",
    sectionHeading: "Registries",
    linksLabel: "Registry links",
    itemFallbackLabel: "Registry link",
    invalidLinksAlert: "Fix the highlighted registry links before saving.",
    emptyState: `No registry links yet. Use "Add link" to include up to ${MAX_REGISTRY_LINKS} retailers.`,
    publicNote:
      "These links open in a new tab. Registries must stay public or shareable so guests can view them.",
  },
  housewarming: {
    allowsLinks: true,
    sectionLabel: "Gift List",
    sectionHeading: "Gift List",
    linksLabel: "Gift list links",
    itemFallbackLabel: "Gift list link",
    invalidLinksAlert: "Fix the highlighted gift list links before saving.",
    emptyState: `No gift list links yet. Use "Add link" to include up to ${MAX_REGISTRY_LINKS} links.`,
    publicNote:
      "These links open in a new tab. Gift lists must stay public or shareable so guests can view them.",
  },
  housewarmings: {
    allowsLinks: true,
    sectionLabel: "Gift List",
    sectionHeading: "Gift List",
    linksLabel: "Gift list links",
    itemFallbackLabel: "Gift list link",
    invalidLinksAlert: "Fix the highlighted gift list links before saving.",
    emptyState: `No gift list links yet. Use "Add link" to include up to ${MAX_REGISTRY_LINKS} links.`,
    publicNote:
      "These links open in a new tab. Gift lists must stay public or shareable so guests can view them.",
  },
  anniversary: {
    allowsLinks: true,
    sectionLabel: "Gift List",
    sectionHeading: "Gift List",
    linksLabel: "Gift list links",
    itemFallbackLabel: "Gift list link",
    invalidLinksAlert: "Fix the highlighted gift list links before saving.",
    emptyState: `No gift list links yet. Use "Add link" to include up to ${MAX_REGISTRY_LINKS} links.`,
    publicNote:
      "These links open in a new tab. Gift lists must stay public or shareable so guests can view them.",
  },
  anniversaries: {
    allowsLinks: true,
    sectionLabel: "Gift List",
    sectionHeading: "Gift List",
    linksLabel: "Gift list links",
    itemFallbackLabel: "Gift list link",
    invalidLinksAlert: "Fix the highlighted gift list links before saving.",
    emptyState: `No gift list links yet. Use "Add link" to include up to ${MAX_REGISTRY_LINKS} links.`,
    publicNote:
      "These links open in a new tab. Gift lists must stay public or shareable so guests can view them.",
  },
  graduation: {
    allowsLinks: true,
    sectionLabel: "Gift List",
    sectionHeading: "Gift List",
    linksLabel: "Gift list links",
    itemFallbackLabel: "Gift list link",
    invalidLinksAlert: "Fix the highlighted gift list links before saving.",
    emptyState: `No gift list links yet. Use "Add link" to include up to ${MAX_REGISTRY_LINKS} links.`,
    publicNote:
      "These links open in a new tab. Gift lists must stay public or shareable so guests can view them.",
  },
  graduations: {
    allowsLinks: true,
    sectionLabel: "Gift List",
    sectionHeading: "Gift List",
    linksLabel: "Gift list links",
    itemFallbackLabel: "Gift list link",
    invalidLinksAlert: "Fix the highlighted gift list links before saving.",
    emptyState: `No gift list links yet. Use "Add link" to include up to ${MAX_REGISTRY_LINKS} links.`,
    publicNote:
      "These links open in a new tab. Gift lists must stay public or shareable so guests can view them.",
  },
};

const registryHostMatches = (host: string, suffix: string): boolean => {
  const normalizedHost = host.toLowerCase();
  const normalizedSuffix = suffix.toLowerCase();
  return normalizedHost === normalizedSuffix || normalizedHost.endsWith(`.${normalizedSuffix}`);
};

const isAmazonHost = (host: string): boolean =>
  REGISTRY_BRANDS.find((entry) => entry.id === "amazon")?.hostSuffixes.some((suffix) =>
    registryHostMatches(host, suffix),
  ) || false;

const isAmazonRegistryProvider = (value: string | null | undefined): boolean =>
  String(value || "")
    .trim()
    .toLowerCase() === "amazon";

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

const hasAmazonRegistryMention = (value: string): boolean => {
  const normalized = value.toLowerCase();
  return (
    /\bamazon(?:\.com)?\b/.test(normalized) &&
    /\b(?:registered|registry|registries|wishlist|wish\s+list|gift\s+(?:list|registry))\b/.test(
      normalized,
    )
  );
};

const isAmazonHomepageUrl = (parsed: URL): boolean => {
  if (!isAmazonHost(parsed.hostname)) return false;
  const path = parsed.pathname.replace(/\/+$/g, "");
  return path === "";
};

const isBareAmazonBrand = (value: string): boolean => {
  const normalized = value
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "")
    .trim();
  return normalized === "amazon";
};

const cleanRegistryValue = (value: string | null | undefined): string | null => {
  const cleaned = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || null;
};

const formatEventType = (value: string | null | undefined): string | null => {
  const cleaned = cleanRegistryValue(value);
  if (!cleaned) return null;
  return cleaned
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bShowers\b/g, "Shower")
    .replace(/\bWeddings\b/g, "Wedding");
};

function buildRegistryHelperText(input: RegistryInput): string {
  const cityState = [cleanRegistryValue(input.city), cleanRegistryValue(input.state)]
    .filter(Boolean)
    .join(", ");
  const searchUsing = [
    cleanRegistryValue(input.registryName),
    formatEventType(input.eventType),
    cleanRegistryValue(cityState),
  ].filter(Boolean);
  const base =
    "This invite mentions an Amazon registry, but the direct registry link was not included.";
  return searchUsing.length ? [base, "Search using:", ...searchUsing].join("\n") : base;
}

function isAmazonMissingLinkUrl(rawUrl: string): boolean {
  if (isBareAmazonBrand(rawUrl)) return true;
  const parsed = normalizeUrl(rawUrl);
  return Boolean(parsed && isAmazonHomepageUrl(parsed));
}

function registryProviderFromInput(input: RegistryInput): string | null {
  if (isAmazonRegistryProvider(input.registryProvider)) return "Amazon";
  const rawUrl = cleanRegistryValue(input.registryUrl);
  if (rawUrl && isAmazonMissingLinkUrl(rawUrl)) return "Amazon";
  return null;
}

export function inferRegistryUrlFromTextForContext(
  text: string | null | undefined,
  context: RegistryLinkContext = {},
): string | null {
  void text;
  void context;
  return null;
}

export function inferRegistryProviderFromTextForContext(
  text: string | null | undefined,
  context: RegistryLinkContext = {},
): "Amazon" | null {
  const rawText = String(text || "").trim();
  if (hasAmazonRegistryMention(rawText)) return "Amazon";
  if (isAmazonRegistryProvider(context.registryProvider)) return "Amazon";
  return hasAmazonRegistryMention(registryContextText(context)) ? "Amazon" : null;
}

export function normalizeRegistryUrlForContext(
  rawUrl: string | null | undefined,
  context: RegistryLinkContext = {},
): string | null {
  const raw = String(rawUrl || "").trim();
  if (!raw) return null;
  if (isAmazonMissingLinkUrl(raw)) return null;

  if (!normalizeUrl(raw) && hasAmazonRegistryMention(raw)) return null;

  void context;
  const validation = validateRegistryUrl(raw);
  return validation.ok && validation.normalizedUrl ? validation.normalizedUrl : null;
}

export function getRegistryAction(input: RegistryInput): RegistryAction {
  const registryUrl = cleanRegistryValue(input.registryUrl);
  if (registryUrl && !isAmazonMissingLinkUrl(registryUrl)) {
    const validation = validateRegistryUrl(registryUrl);
    if (validation.ok && validation.normalizedUrl) {
      return {
        url: /^https:\/\//i.test(registryUrl) ? registryUrl : validation.normalizedUrl,
        label: "Open Registry",
        helperText: null,
      };
    }
  }

  if (registryProviderFromInput(input) === "Amazon") {
    return {
      url: AMAZON_REGISTRY_SEARCH_URL,
      label: "Find Registry on Amazon",
      helperText: buildRegistryHelperText(input),
    };
  }

  return {
    url: null,
    label: null,
    helperText: null,
  };
}

export type RegistryValidationResult = {
  ok: boolean;
  error?: string;
  brand?: RegistryBrandMetadata;
  normalizedUrl?: string;
};

export function getRegistrySectionCopyForCategory(category: string): RegistrySectionCopy {
  return (
    REGISTRY_SECTION_COPY_BY_CATEGORY[normalizeCategoryKey(category)] || {
      allowsLinks: false,
      sectionLabel: "Registry",
      sectionHeading: "Registries",
      linksLabel: "Registry links",
      itemFallbackLabel: "Registry link",
      invalidLinksAlert: "Fix the highlighted registry links before saving.",
      emptyState: `No registry links yet. Use "Add link" to include up to ${MAX_REGISTRY_LINKS} retailers.`,
      publicNote:
        "These links open in a new tab. Registries must stay public or shareable so guests can view them.",
    }
  );
}

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
    entry.hostSuffixes.some((suffix) => registryHostMatches(host, suffix)),
  );

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
  maxOrContext: number | RegistryLinkContext = MAX_REGISTRY_LINKS,
  context: RegistryLinkContext = {},
): EventRegistryLink[] {
  if (!Array.isArray(rawEntries) || rawEntries.length === 0) return [];
  const max = typeof maxOrContext === "number" ? maxOrContext : MAX_REGISTRY_LINKS;
  const registryContext = typeof maxOrContext === "number" ? context : maxOrContext;
  const dedupe = new Set<string>();
  const results: EventRegistryLink[] = [];
  for (const entry of rawEntries) {
    if (!entry?.url) continue;
    const normalizedUrl = normalizeRegistryUrlForContext(entry.url, registryContext);
    if (!normalizedUrl) continue;
    const validation = validateRegistryUrl(normalizedUrl);
    if (!validation.ok || !validation.normalizedUrl) continue;
    if (dedupe.has(normalizedUrl)) continue;
    const rawLabel = (entry.label || "").trim();
    const fallbackLabel = validation.brand?.defaultLabel || new URL(normalizedUrl).hostname;
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
        entry.hostSuffixes.some((suffix) => registryHostMatches(host, suffix)),
      ) || null
    );
  } catch {
    return null;
  }
}
