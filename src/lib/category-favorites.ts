import {
  type CreationAccess,
  type CreationCategory,
  type CreationProduct,
  creationAllowed,
} from "./creation-access";
import { normalizeSignupIntent } from "./signup-intent";
import { SPORT_ACTIVITY_PROFILES } from "./sports-discovery/profiles";

export type CategoryFavorite = {
  id: string;
  label: string;
  href: string;
  category?: CreationCategory;
  product?: CreationProduct;
};

// Store stable catalog identities. Destinations and permissions stay app-owned.
export const CATEGORY_FAVORITES: CategoryFavorite[] = [
  { id: "birthdays", label: "Birthdays", href: "/event/birthdays", category: "birthdays" },
  { id: "weddings", label: "Weddings", href: "/event/weddings", category: "weddings" },
  {
    id: "anniversaries",
    label: "Anniversaries",
    href: "/event/anniversaries",
    category: "anniversaries",
  },
  {
    id: "baby-showers",
    label: "Baby showers",
    href: "/event/baby-showers",
    category: "baby-showers",
  },
  {
    id: "bridal-showers",
    label: "Bridal showers",
    href: "/bridal-showers/templates",
    category: "bridal-showers",
  },
  {
    id: "gender-reveal",
    label: "Gender reveals",
    href: "/event/gender-reveal",
    category: "gender-reveal",
  },
  { id: "school", label: "School & classroom", href: "/event/school", category: "general" },
  {
    id: "graduations",
    label: "Graduations",
    href: "/event/general?collection=graduations",
    category: "general",
  },
  {
    id: "housewarming",
    label: "Housewarming",
    href: "/event/general?collection=housewarming",
    category: "general",
  },
  {
    id: "open-house",
    label: "Open house",
    href: "/event/general?collection=open-house",
    category: "general",
  },
  {
    id: "religious-events",
    label: "Religious celebrations",
    href: "/event/general?collection=religious-events",
    category: "general",
  },
  {
    id: "holidays-seasonal",
    label: "Holidays & seasonal",
    href: "/event/general?collection=holidays-seasonal",
    category: "general",
  },
  { id: "general", label: "General events", href: "/event/general", category: "general" },
  ...SPORT_ACTIVITY_PROFILES.map((sport): CategoryFavorite => {
    const id = sport.key === "dance" ? "dance-ballet" : sport.key;
    const category: CreationCategory = [
      "gymnastics",
      "football",
      "soccer",
      "cheerleading",
      "dance-ballet",
    ].includes(id)
      ? (id as CreationCategory)
      : "sport-events";
    return {
      id,
      label: sport.key === "dance" ? "Dance / ballet" : sport.label,
      href:
        sport.key === "gymnastics" || sport.key === "football"
          ? `/event/${sport.key}`
          : `/event/sport-events?sport=${encodeURIComponent(sport.key)}`,
      category,
    };
  }),
  {
    id: "signup-forms",
    label: "Sign-up Form",
    href: "/signup-forms/templates",
    product: "signup_form",
  },
];

const byId = new Map(CATEGORY_FAVORITES.map((favorite) => [favorite.id, favorite]));

export function normalizePinnedCategoryIds(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((id): id is string => typeof id === "string" && byId.has(id)))]
    : [];
}

export function filterPinnedCategoryIds(ids: unknown, access: CreationAccess): string[] {
  return normalizePinnedCategoryIds(ids).filter((id) => {
    const favorite = byId.get(id)!;
    return creationAllowed(access, favorite.product || "event_page", favorite.category);
  });
}

/** Favorites are explicit account choices, independent of the default event type. */
export function resolvePinnedCategoryIds(value: unknown): string[] {
  return normalizePinnedCategoryIds(value);
}

export function defaultCreationCategoryFor(
  signupSource: unknown,
  defaultIntent: unknown,
  access: CreationAccess,
): CategoryFavorite | null {
  const preferredId =
    typeof defaultIntent === "string" && byId.has(defaultIntent)
      ? defaultIntent
      : normalizeSignupIntent(defaultIntent) || normalizeSignupIntent(signupSource);
  const favorite = preferredId ? byId.get(preferredId.replaceAll("_", "-")) : null;
  return favorite &&
    favorite.product !== "signup_form" &&
    creationAllowed(access, "event_page", favorite.category)
    ? favorite
    : null;
}

export function categoryFavoritesFor(ids: unknown, access: CreationAccess): CategoryFavorite[] {
  return filterPinnedCategoryIds(ids, access).map((id) => byId.get(id)!);
}

type SearchParameters = { get: (name: string) => string | null } | null | undefined;
const matchesGallery = (pathname: string, base: string) =>
  pathname === base || pathname === `${base}/customize`;

/** Collection and sport shortcuts share routes, so pathname alone is insufficient. */
export function isCategoryFavoriteActive(
  favorite: CategoryFavorite,
  pathname: string | null,
  search: SearchParameters,
): boolean {
  if (!pathname) return false;
  if (favorite.id === "signup-forms")
    return (
      pathname === "/signup-forms/templates" ||
      /^\/signup-forms\/templates\/[^/]+\/customize$/.test(pathname) ||
      pathname === "/templates/signup" ||
      pathname === "/smart-signup-form"
    );
  if (favorite.id === "bridal-showers") {
    return (
      pathname === "/bridal-showers/templates" ||
      /^\/bridal-showers\/templates\/[^/]+\/customize$/.test(pathname) ||
      (matchesGallery(pathname, "/event/baby-showers") &&
        search?.get("occasion") === "bridal-shower")
    );
  }
  if (favorite.id === "school" && pathname === "/event/school") return true;
  if (favorite.category === "general") {
    if (!matchesGallery(pathname, "/event/general")) return false;
    return (search?.get("collection") || "general") === favorite.id;
  }
  const [base, query] = favorite.href.split("?");
  if (!matchesGallery(pathname, base)) return false;
  if (base === "/event/sport-events") {
    return (search?.get("sport") || "") === (new URLSearchParams(query).get("sport") || "");
  }
  return favorite.id !== "baby-showers" || search?.get("occasion") !== "bridal-shower";
}
