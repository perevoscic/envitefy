/** @typedef {import("./HeroTopNav").HeroTopNavLink} HeroTopNavLink */

/** @typedef {"landing" | "studio" | "snap" | "gymnastics"} MarketingHeroNavPageKey */

const MARKETING_PRODUCT_LINKS = [
  { page: "studio", label: "Studio", href: "/studio" },
  { page: "snap", label: "Snap", href: "/snap" },
  { page: "gymnastics", label: "Gymnastics", href: "/gymnastics" },
];

const MARKETING_HOME_LINK = { label: "Home", href: "/landing" };

/**
 * Builds the shared guest marketing navigation for `/landing`, `/studio`, `/snap`, and `/gymnastics`.
 *
 * @param {MarketingHeroNavPageKey} page
 * @param {HeroTopNavLink[]} sectionLinks
 * @returns {HeroTopNavLink[]}
 */
export function buildMarketingHeroNav(page, sectionLinks) {
  const productLinks = MARKETING_PRODUCT_LINKS.filter((link) => link.page !== page).map(
    ({ label, href }) => ({ label, href }),
  );

  if (page === "landing") {
    return [...productLinks, ...sectionLinks];
  }

  return [MARKETING_HOME_LINK, ...productLinks, ...sectionLinks];
}
