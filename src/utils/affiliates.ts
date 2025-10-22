export type AffiliatePlacement =
  | "target_confirm"
  | "target_email"
  | "amazon_confirm"
  | "amazon_email"
  | "oriental_confirm"
  | "oriental_email";

export type AffiliateLinks = {
  target?: string | null;
  amazon?: string | null;
  oriental?: string | null;
};

const getEnv = (key: string): string | null => {
  try {
    const v = process.env[key];
    if (typeof v === "string") {
      const trimmed = v.trim();
      return trimmed ? trimmed : null;
    }
    return null;
  } catch {
    return null;
  }
};

const isHttpsUrl = (value: string | null | undefined): boolean => {
  if (!value) return false;
  try {
    const u = new URL(value);
    return u.protocol === "https:";
  } catch {
    return false;
  }
};

export function getAffiliateLinks(
  placement: AffiliatePlacement,
  opts?: { category?: string | null; viewer?: "owner" | "guest" }
): AffiliateLinks {
  const category = (opts?.category || "").trim().toLowerCase();
  const viewer = opts?.viewer || null;
  // Prefer placement-specific envs; fall back to generic
  const targetSpecific = getEnv(
    placement.startsWith("target_")
      ? `NEXT_PUBLIC_AFFILIATE_TARGET_${placement.split("_")[1].toUpperCase()}`
      : ""
  );
  const amazonSpecific = getEnv(
    placement.startsWith("amazon_")
      ? `NEXT_PUBLIC_AFFILIATE_AMAZON_${placement.split("_")[1].toUpperCase()}`
      : ""
  );
  const orientalSpecific = getEnv(
    placement.startsWith("oriental_")
      ? `NEXT_PUBLIC_AFFILIATE_ORIENTAL_${placement.split("_")[1].toUpperCase()}`
      : ""
  );

  const target =
    targetSpecific || getEnv("NEXT_PUBLIC_AFFILIATE_TARGET_DEFAULT") || null;
  // Category-specific Amazon overrides
  const amazonCategoryOverride = (() => {
    if (!category) return null;
    if (category.includes("birthday")) {
      const owner =
        getEnv("NEXT_PUBLIC_AFFILIATE_AMAZON_BIRTHDAYS_OWNER") || null;
      const guest =
        getEnv("NEXT_PUBLIC_AFFILIATE_AMAZON_BIRTHDAYS_GUEST") || null;
      const any =
        getEnv("NEXT_PUBLIC_AFFILIATE_AMAZON_DEFAULT_BIRTHDAYS") ||
        getEnv("NEXT_PUBLIC_AFFILIATE_AMAZON_BIRTHDAYS") ||
        null;
      return viewer === "owner" ? owner || any : viewer === "guest" ? guest || any : any;
    }
    if (category.includes("wedding")) {
      const owner =
        getEnv("NEXT_PUBLIC_AFFILIATE_AMAZON_WEDDINGS_OWNER") || null;
      const guest =
        getEnv("NEXT_PUBLIC_AFFILIATE_AMAZON_WEDDINGS_GUEST") || null;
      const any =
        getEnv("NEXT_PUBLIC_AFFILIATE_AMAZON_DEFAULT_WEDDINGS") ||
        getEnv("NEXT_PUBLIC_AFFILIATE_AMAZON_WEDDINGS") ||
        null;
      return viewer === "owner" ? owner || any : viewer === "guest" ? guest || any : any;
    }
    if (category.includes("baby shower") || category.includes("baby")) {
      const owner =
        getEnv("NEXT_PUBLIC_AFFILIATE_AMAZON_BABYSHOWERS_OWNER") || null;
      const guest =
        getEnv("NEXT_PUBLIC_AFFILIATE_AMAZON_BABYSHOWERS_GUEST") || null;
      const any =
        getEnv("NEXT_PUBLIC_AFFILIATE_AMAZON_DEFAULT_BABYSHOWERS") ||
        getEnv("NEXT_PUBLIC_AFFILIATE_AMAZON_BABYSHOWERS") ||
        null;
      return viewer === "owner" ? owner || any : viewer === "guest" ? guest || any : any;
    }
    return null;
  })();

  const amazon =
    amazonSpecific ||
    amazonCategoryOverride ||
    getEnv("NEXT_PUBLIC_AFFILIATE_AMAZON_DEFAULT") ||
    null;
  const oriental =
    orientalSpecific || getEnv("NEXT_PUBLIC_AFFILIATE_ORIENTAL_DEFAULT") || null;

  return {
    target: isHttpsUrl(target) ? target : null,
    amazon: isHttpsUrl(amazon) ? amazon : null,
    oriental: isHttpsUrl(oriental) ? oriental : null,
  };
}

export function shouldShowSponsored(): boolean {
  // Feature flag to enable/disable block globally
  const flag = getEnv("NEXT_PUBLIC_AFFILIATE_ENABLE");
  return flag === "1" || flag === "true";
}

function extractAmazonTagFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return null;
    const host = u.hostname.toLowerCase();
    if (!/amazon\./.test(host)) return null;
    const tag = u.searchParams.get("tag");
    return tag && tag.trim() ? tag.trim() : null;
  } catch {
    return null;
  }
}

export function getAmazonTagFromConfig(opts?: {
  category?: string | null;
  viewer?: "owner" | "guest";
}): string | null {
  const links = getAffiliateLinks("amazon_confirm", {
    category: opts?.category || null,
    viewer: opts?.viewer,
  });
  if (!links.amazon) return null;
  return extractAmazonTagFromUrl(links.amazon) || null;
}

export function decorateAmazonUrl(
  originalUrl: string,
  opts?: { category?: string | null; viewer?: "owner" | "guest"; placement?: string }
): string {
  try {
    const u = new URL(originalUrl);
    if (u.protocol !== "https:") return originalUrl;
    const host = u.hostname.toLowerCase();
    if (!/amazon\./.test(host)) return originalUrl;

    // Respect existing tag if present
    const existingTag = u.searchParams.get("tag");
    if (!existingTag) {
      const tag = getAmazonTagFromConfig({
        category: opts?.category || null,
        viewer: opts?.viewer,
      });
      if (tag) u.searchParams.set("tag", tag);
    }

    // Add ascsubtag for placement attribution
    if (opts?.placement) {
      u.searchParams.set("ascsubtag", String(opts.placement));
    }
    return u.toString();
  } catch {
    return originalUrl;
  }
}


