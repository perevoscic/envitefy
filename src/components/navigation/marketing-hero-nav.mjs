/** @typedef {import("./HeroTopNav").HeroTopNavLink} HeroTopNavLink */

/** @typedef {"landing" | "studio" | "snap" | "gymnastics"} MarketingHeroNavPageKey */

const MARKETING_PRODUCT_LINKS = [
  { page: "birthdays", label: "Birthdays", href: "/birthdays" },
  { page: "weddings", label: "Weddings", href: "/weddings" },
  { page: "baby-showers", label: "Baby Showers", href: "/baby-showers" },
  { page: "bridal-showers", label: "Bridal Showers", href: "/bridal-showers" },
  { page: "gender-reveal", label: "Gender Reveals", href: "/gender-reveal" },
  { page: "signup-forms", label: "Signup Forms", href: "/signup-forms" },
  { page: "sports", label: "Sports", href: "/sport-events" },
  { page: "gymnastics", label: "Gymnastics", href: "/gymnastics" },
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
