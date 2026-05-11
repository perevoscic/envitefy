import {
  attachAmazonAffiliateTag,
  buildAmazonSearchUrl,
  getAmazonAssociateTag,
  isAmazonUrl,
} from "../lib/affiliate/amazon.ts";

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

type AffiliateLinkOptions = {
  category?: string | null;
  viewer?: "owner" | "guest";
  title?: string | null;
  description?: string | null;
};

const getEnv = (key: string): string | null => {
  try {
    const value = process.env[key];
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  } catch {
    return null;
  }
};

const isHttpsUrl = (value: string | null | undefined): boolean => {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
};

function inferGenderFromText(text: string): "girl" | "boy" | null {
  const normalized = text.toLowerCase();
  const isGirl = /\b(girl|girls|princess|unicorn|mermaid|pink|her|she)\b/.test(normalized);
  const isBoy = /\b(boy|boys|superhero|ninja|dinosaur|blue|his|he)\b/.test(normalized);
  if (isGirl && !isBoy) return "girl";
  if (isBoy && !isGirl) return "boy";
  return null;
}

function normalizeCategory(value: string | null | undefined): string {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function titleCaseCategory(value: string): string {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildAmazonSearchTerm(opts: AffiliateLinkOptions = {}): string {
  const category = normalizeCategory(opts.category);
  const viewer = opts.viewer || "guest";
  const gender = (() => {
    const text = `${opts.title || ""} ${opts.description || ""}`.trim();
    return text ? inferGenderFromText(text) : null;
  })();

  if (category.includes("birthday")) {
    if (viewer === "guest") {
      if (gender === "girl") return "birthday gifts for girls";
      if (gender === "boy") return "birthday gifts for boys";
      return "birthday gifts";
    }
    if (gender === "girl") return "girls birthday party supplies";
    if (gender === "boy") return "boys birthday party supplies";
    return "birthday party supplies";
  }

  if (category.includes("bridal shower")) {
    return viewer === "guest" ? "bridal shower gifts" : "bridal shower decorations";
  }

  if (category.includes("wedding")) {
    return viewer === "guest" ? "wedding gifts" : "wedding decor and supplies";
  }

  if (category.includes("gender reveal")) {
    return viewer === "guest" ? "gender reveal gifts" : "gender reveal party supplies";
  }

  if (category.includes("baby shower") || category.includes("baby")) {
    return viewer === "guest" ? "baby shower gifts" : "baby shower decorations and supplies";
  }

  if (
    category.includes("housewarming") ||
    category.includes("house warming") ||
    category.includes("homewarming") ||
    category.includes("home warming")
  ) {
    return viewer === "guest" ? "housewarming gifts" : "housewarming party supplies";
  }

  if (category.includes("graduation")) {
    return viewer === "guest" ? "graduation gifts" : "graduation party supplies";
  }

  if (
    category.includes("sport") ||
    category.includes("football") ||
    category.includes("soccer") ||
    category.includes("basketball") ||
    category.includes("game day") ||
    category.includes("team")
  ) {
    return "sports party supplies";
  }

  return category ? `${titleCaseCategory(category)} party supplies` : "party supplies";
}

export function getAffiliateLinks(
  placement: AffiliatePlacement,
  opts?: AffiliateLinkOptions,
): AffiliateLinks {
  const placementKey = placement.split("_")[1]?.toUpperCase() || "";
  const targetSpecific = placement.startsWith("target_")
    ? getEnv(`NEXT_PUBLIC_AFFILIATE_TARGET_${placementKey}`)
    : null;
  const orientalSpecific = placement.startsWith("oriental_")
    ? getEnv(`NEXT_PUBLIC_AFFILIATE_ORIENTAL_${placementKey}`)
    : null;
  const target = targetSpecific || getEnv("NEXT_PUBLIC_AFFILIATE_TARGET_DEFAULT") || null;
  const oriental = orientalSpecific || getEnv("NEXT_PUBLIC_AFFILIATE_ORIENTAL_DEFAULT") || null;
  const amazon =
    placement.startsWith("amazon_") && getAmazonAssociateTag()
      ? buildAmazonSearchUrl(buildAmazonSearchTerm(opts), getAmazonAssociateTag())
      : null;

  return {
    target: isHttpsUrl(target) ? target : null,
    amazon,
    oriental: isHttpsUrl(oriental) ? oriental : null,
  };
}

export function shouldShowSponsored(): boolean {
  const flag = getEnv("NEXT_PUBLIC_AFFILIATE_ENABLE");
  if (flag === "0" || flag === "false") return false;
  if (flag === "1" || flag === "true") return true;
  return process.env.NODE_ENV !== "production";
}

export function getAmazonTagFromConfig(_opts?: {
  category?: string | null;
  viewer?: "owner" | "guest";
}): string | null {
  return getAmazonAssociateTag();
}

export function decorateAmazonUrl(
  originalUrl: string,
  opts?: {
    category?: string | null;
    viewer?: "owner" | "guest";
    placement?: string;
    strictCategoryOnly?: boolean;
  },
): string {
  const taggedUrl = attachAmazonAffiliateTag(originalUrl);
  if (!opts?.placement || !isAmazonUrl(taggedUrl)) {
    return taggedUrl;
  }

  try {
    const parsed = new URL(taggedUrl);
    parsed.searchParams.set("ascsubtag", String(opts.placement));
    return parsed.toString();
  } catch {
    return taggedUrl;
  }
}

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

export function getAffiliateImageCards(opts?: AffiliateLinkOptions): AffiliateImageCard[] {
  const category = normalizeCategory(opts?.category);
  const viewer = opts?.viewer || "owner";
  const gender = (() => {
    const text = `${opts?.title || ""} ${opts?.description || ""}`.trim();
    return text ? inferGenderFromText(text) : null;
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
  } else if (category.includes("wedding") || category.includes("bridal shower")) {
    keys.push(
      viewer === "guest"
        ? "NEXT_PUBLIC_AFFILIATE_IMAGES_WEDDINGS_GUEST"
        : "NEXT_PUBLIC_AFFILIATE_IMAGES_WEDDINGS_OWNER",
    );
  } else if (category.includes("baby shower") || category.includes("baby")) {
    keys.push(
      viewer === "guest"
        ? "NEXT_PUBLIC_AFFILIATE_IMAGES_BABYSHOWERS_GUEST"
        : "NEXT_PUBLIC_AFFILIATE_IMAGES_BABYSHOWERS_OWNER",
    );
  }

  let cards: AffiliateImageCard[] = [];
  for (const key of keys) {
    cards = parseImageCardsJson(getEnv(key));
    if (cards.length) break;
  }

  return cards.map((card, index) => ({
    src: card.src,
    alt: card.alt,
    href: decorateAmazonUrl(card.href, {
      category,
      viewer,
      placement: `img_${index}`,
      strictCategoryOnly: true,
    }),
  }));
}
