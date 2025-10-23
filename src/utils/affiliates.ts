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

function inferGenderFromText(text: string): "girl" | "boy" | null {
  const t = text.toLowerCase();
  const isGirl = /\b(girl|girls|princess|unicorn|mermaid|pink|her|she)\b/.test(t);
  const isBoy = /\b(boy|boys|superhero|ninja|dinosaur|blue|his|he)\b/.test(t);
  if (isGirl && !isBoy) return "girl";
  if (isBoy && !isGirl) return "boy";
  return null;
}

export function getAffiliateLinks(
  placement: AffiliatePlacement,
  opts?: {
    category?: string | null;
    viewer?: "owner" | "guest";
    title?: string | null;
    description?: string | null;
  }
): AffiliateLinks {
  const category = (opts?.category || "").trim().toLowerCase();
  const viewer = opts?.viewer || null;
  const gender = (() => {
    const base = `${opts?.title || ""} ${opts?.description || ""}`.trim();
    return base ? inferGenderFromText(base) : null;
  })();
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
        // gender-specific first
        (gender === "girl"
          ? getEnv("NEXT_PUBLIC_AFFILIATE_AMAZON_BIRTHDAYS_OWNER_GIRL")
          : gender === "boy"
          ? getEnv("NEXT_PUBLIC_AFFILIATE_AMAZON_BIRTHDAYS_OWNER_BOY")
          : null) || getEnv("NEXT_PUBLIC_AFFILIATE_AMAZON_BIRTHDAYS_OWNER") || null;
      const guest =
        (gender === "girl"
          ? getEnv("NEXT_PUBLIC_AFFILIATE_AMAZON_BIRTHDAYS_GUEST_GIRL")
          : gender === "boy"
          ? getEnv("NEXT_PUBLIC_AFFILIATE_AMAZON_BIRTHDAYS_GUEST_BOY")
          : null) || getEnv("NEXT_PUBLIC_AFFILIATE_AMAZON_BIRTHDAYS_GUEST") || null;
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
  // Feature flag to enable/disable block globally. In development, default to on
  const flag = getEnv("NEXT_PUBLIC_AFFILIATE_ENABLE");
  if (flag === "0" || flag === "false") return false;
  if (flag === "1" || flag === "true") return true;
  return process.env.NODE_ENV !== "production";
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
  opts?: {
    category?: string | null;
    viewer?: "owner" | "guest";
    placement?: string;
    strictCategoryOnly?: boolean;
  }
): string {
  try {
    const u = new URL(originalUrl);
    if (u.protocol !== "https:") return originalUrl;
    const host = u.hostname.toLowerCase();
    if (!/amazon\./.test(host)) return originalUrl;

    // Respect existing tag if present
    const existingTag = u.searchParams.get("tag");
    if (!existingTag) {
      const tag = (() => {
        const category = (opts?.category || "").trim().toLowerCase();
        const viewer = opts?.viewer || null;
        const get = (k: string) => getEnv(k);
        const wantStrict = Boolean(opts?.strictCategoryOnly);
        // Build ordered keys based on category and viewer
        const keys: string[] = [];
        if (category.includes("birthday")) {
          if (viewer === "owner") keys.push("NEXT_PUBLIC_AFFILIATE_AMAZON_BIRTHDAYS_OWNER");
          if (viewer === "guest") keys.push("NEXT_PUBLIC_AFFILIATE_AMAZON_BIRTHDAYS_GUEST");
          if (!wantStrict) {
            keys.push(
              "NEXT_PUBLIC_AFFILIATE_AMAZON_DEFAULT_BIRTHDAYS",
              "NEXT_PUBLIC_AFFILIATE_AMAZON_BIRTHDAYS"
            );
          }
        } else if (category.includes("wedding")) {
          if (viewer === "owner") keys.push("NEXT_PUBLIC_AFFILIATE_AMAZON_WEDDINGS_OWNER");
          if (viewer === "guest") keys.push("NEXT_PUBLIC_AFFILIATE_AMAZON_WEDDINGS_GUEST");
          if (!wantStrict) {
            keys.push(
              "NEXT_PUBLIC_AFFILIATE_AMAZON_DEFAULT_WEDDINGS",
              "NEXT_PUBLIC_AFFILIATE_AMAZON_WEDDINGS"
            );
          }
        } else if (category.includes("baby shower") || category.includes("baby")) {
          if (viewer === "owner") keys.push("NEXT_PUBLIC_AFFILIATE_AMAZON_BABYSHOWERS_OWNER");
          if (viewer === "guest") keys.push("NEXT_PUBLIC_AFFILIATE_AMAZON_BABYSHOWERS_GUEST");
          if (!wantStrict) {
            keys.push(
              "NEXT_PUBLIC_AFFILIATE_AMAZON_DEFAULT_BABYSHOWERS",
              "NEXT_PUBLIC_AFFILIATE_AMAZON_BABYSHOWERS"
            );
          }
        }
        if (!wantStrict) {
          keys.push("NEXT_PUBLIC_AFFILIATE_AMAZON_DEFAULT");
        }
        for (const k of keys) {
          const v = get(k);
          if (isHttpsUrl(v)) {
            const t = extractAmazonTagFromUrl(v!);
            if (t) return t;
          }
        }
        // Fallback: allow specifying a tag directly via env without a full URL
        const directTag = get("NEXT_PUBLIC_AFFILIATE_AMAZON_TAG");
        if (directTag && directTag.trim()) return directTag.trim();
        return null;
      })();
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

// Curated image cards for the Sponsored block
// Env value format per key: JSON array of
//   [{ "src": "https://...jpg", "alt": "Balloons", "href": "https://www.amazon.com/..." }]
// Keys per category/viewer:
//   NEXT_PUBLIC_AFFILIATE_IMAGES_BIRTHDAYS_OWNER
//   NEXT_PUBLIC_AFFILIATE_IMAGES_BIRTHDAYS_GUEST
//   NEXT_PUBLIC_AFFILIATE_IMAGES_WEDDINGS_OWNER
//   NEXT_PUBLIC_AFFILIATE_IMAGES_WEDDINGS_GUEST
//   (optionally BABYSHOWERS_OWNER / _GUEST)
export type AffiliateImageCard = { src: string; alt: string; href: string };

function parseImageCardsJson(raw: string | null): AffiliateImageCard[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    const out: AffiliateImageCard[] = [];
    for (const item of arr) {
      const src = typeof item?.src === "string" ? item.src.trim() : "";
      const alt = typeof item?.alt === "string" ? item.alt.trim() : "";
      const href = typeof item?.href === "string" ? item.href.trim() : "";
      if (isHttpsUrl(src) && isHttpsUrl(href)) {
        out.push({ src, alt: alt || "", href });
      }
    }
    return out;
  } catch {
    return [];
  }
}

export function getAffiliateImageCards(opts?: {
  category?: string | null;
  viewer?: "owner" | "guest";
  title?: string | null;
  description?: string | null;
}): AffiliateImageCard[] {
  const category = (opts?.category || "").trim().toLowerCase();
  const viewer = (opts?.viewer || "owner").toLowerCase();
  const gender = (() => {
    const base = `${opts?.title || ""} ${opts?.description || ""}`.trim();
    return base ? inferGenderFromText(base) : null;
  })();
  const keys: string[] = [];
  if (category.includes("birthday")) {
    if (viewer === "guest") {
      if (gender === "girl") keys.push("NEXT_PUBLIC_AFFILIATE_IMAGES_BIRTHDAYS_GUEST_GIRL");
      if (gender === "boy") keys.push("NEXT_PUBLIC_AFFILIATE_IMAGES_BIRTHDAYS_GUEST_BOY");
      keys.push("NEXT_PUBLIC_AFFILIATE_IMAGES_BIRTHDAYS_GUEST");
    } else {
      if (gender === "girl") keys.push("NEXT_PUBLIC_AFFILIATE_IMAGES_BIRTHDAYS_OWNER_GIRL");
      if (gender === "boy") keys.push("NEXT_PUBLIC_AFFILIATE_IMAGES_BIRTHDAYS_OWNER_BOY");
      keys.push("NEXT_PUBLIC_AFFILIATE_IMAGES_BIRTHDAYS_OWNER");
    }
  } else if (category.includes("wedding")) {
    keys.push(
      viewer === "guest"
        ? "NEXT_PUBLIC_AFFILIATE_IMAGES_WEDDINGS_GUEST"
        : "NEXT_PUBLIC_AFFILIATE_IMAGES_WEDDINGS_OWNER"
    );
  } else if (category.includes("baby shower") || category.includes("baby")) {
    keys.push(
      viewer === "guest"
        ? "NEXT_PUBLIC_AFFILIATE_IMAGES_BABYSHOWERS_GUEST"
        : "NEXT_PUBLIC_AFFILIATE_IMAGES_BABYSHOWERS_OWNER"
    );
  }
  let cards: AffiliateImageCard[] = [];
  for (const k of keys) {
    const raw = getEnv(k);
    cards = parseImageCardsJson(raw);
    if (cards.length) break;
  }
  // Decorate each href with tag if missing and add ascsubtag for image index
  return cards.map((c, idx) => ({
    src: c.src,
    alt: c.alt,
    href: decorateAmazonUrl(c.href, {
      category,
      viewer: viewer as any,
      placement: `img_${idx}`,
      strictCategoryOnly: true,
    }),
  }));
}

