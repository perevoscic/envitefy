/** @typedef {import("./HeroTopNav").HeroTopNavLink} HeroTopNavLink */

/** @typedef {"landing" | "studio" | "snap" | "gymnastics"} MarketingHeroNavPageKey */

const MARKETING_PRODUCT_LINKS = [
  { page: "weddings", label: "Weddings", href: "/weddings" },
  { page: "bridal-showers", label: "Bridal Showers", href: "/bridal-showers" },
  { page: "baby-showers", label: "Baby Showers", href: "/baby-showers" },
  { page: "gymnastics", label: "Gymnastics", href: "/gymnastics" },
  { page: "signup-forms", label: "Signup Forms", href: "/signup-forms" },
  { page: "gender-reveal", label: "Gender Reveals", href: "/gender-reveal" },
  { page: "birthdays", label: "Birthdays", href: "/birthdays" },
];

const MARKETING_HOME_LINK = { label: "Home", href: "/landing" };

/**
 * Builds the shared guest marketing navigation for `/landing`, `/studio`, `/snap`, and `/gymnastics`.
 *
 * @param {MarketingHeroNavPageKey} _page
 * @param {HeroTopNavLink[]} sectionLinks
 * @returns {HeroTopNavLink[]}
 */
export function buildMarketingHeroNav(_page, sectionLinks) {
  const productLinks = MARKETING_PRODUCT_LINKS.map(({ label, href }) => ({ label, href }));

  if (_page === "landing") {
    return [...productLinks, ...sectionLinks];
  }

  return [MARKETING_HOME_LINK, ...productLinks, ...sectionLinks];
}
