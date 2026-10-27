import type { ReactNode } from "react";
import { hydrateRoot } from "react-dom/client";
import babyStyles from "../../src/app/baby-showers/BabyShowersLandingView.module.css";
import bridalStyles from "../../src/app/bridal-showers/BridalShowersLandingView.module.css";
import celebrationStyles from "../../src/app/category-pages/CelebrationLanding.module.css";
import CelebrationPreview from "../../src/app/category-pages/CelebrationPreview";
import "../../src/app/weddings/wedding-landing.module.css";
import MarketingHero from "../../src/components/marketing/MarketingHero";
import MarketingPage from "../../src/components/marketing/MarketingPage";
import sportsStyles from "../../src/components/marketing/ProductSportsLanding.module.css";
import sportsEditorial from "../../src/components/sports-landing/SportsEditorialSections.module.css";
import publicStyles from "../../src/styles/public-appearance.module.css";

export const categories = [
  "weddings",
  "birthdays",
  "baby-showers",
  "bridal-showers",
  "gender-reveal",
  "signup-forms",
  "anniversaries",
  "sports",
  "football",
] as const;

type Category = (typeof categories)[number];

const copy: Record<Category, [ReactNode, string, string]> = {
  weddings: [
    <>
      The beginning of
      <br />
      <em>your forever.</em>
    </>,
    "Every detail, from yes to I do.",
    "#templates",
  ],
  birthdays: [
    <>
      A little more magic.
      <br />
      <em>A lot less planning.</em>
    </>,
    "A birthday worth getting everyone together.",
    "/event/birthdays",
  ],
  "baby-showers": [
    <>
      A little one.
      <br />
      <em>So much to celebrate.</em>
    </>,
    "A warm welcome, beautifully brought together.",
    "#templates",
  ],
  "bridal-showers": [
    <>
      A beautiful beginning.
      <br />
      <em>Before “I do.”</em>
    </>,
    "Your favorite people. A toast to the bride.",
    "#templates",
  ],
  "gender-reveal": [
    <>
      A little mystery.
      <br />
      <em>A moment together.</em>
    </>,
    "One sweet secret. Everyone together.",
    "/event/gender-reveal",
  ],
  "signup-forms": [
    <>
      Many helping hands.
      <br />
      <em>One simple signup.</em>
    </>,
    "Good people. A clear place to help.",
    "/signup-forms?auth=signup",
  ],
  anniversaries: [
    <>
      Your story.
      <br />
      <em>Still unfolding.</em>
    </>,
    "Your people. Your memories. Another beautiful chapter.",
    "#templates",
  ],
  sports: [
    <>
      Your team. <em>One clear plan.</em>
    </>,
    "More time for the team.",
    "#templates",
  ],
  football: [
    <>
      One team. <em>A whole season together.</em>
    </>,
    "From the first kickoff to the final whistle.",
    "#templates",
  ],
};

const artwork: Partial<Record<Category, string>> = {
  weddings: "/templates/weddings/generated-heroes/blush-linen-romance-hero.webp",
  birthdays: "/themes/flower-fairy-main.jpg",
  "baby-showers": "/templates/baby-showers/pear-orchard-cradle.webp",
  "bridal-showers": "/images/landing/template-proof/rose-garden-bridal-brunch.webp",
  "gender-reveal": "/templates/gender-reveal/collection-2026/secret-greenhouse.webp",
  anniversaries: "/templates/anniversaries/collection-2026/vinyl-love-song-anniversary.webp",
};

export default function CategoryHeroFixture({ category }: { category?: Category }) {
  const [title, lead, href] = category
    ? copy[category]
    : ["Bring everyone together.", "A familiar invitation.", "/create"];
  const sports = category === "sports" || category === "football";
  const pageClasses = sports
    ? `${sportsStyles.editorial} ${sportsEditorial.page} ${category === "football" ? sportsEditorial.football : ""}`
    : category
      ? `${celebrationStyles.editorial} ${category === "bridal-showers" ? bridalStyles.page : category === "anniversaries" ? "" : publicStyles.page} ${category === "baby-showers" ? babyStyles.page : ""} ${category === "weddings" ? "weddings-landing" : ""}`
      : "";
  return (
    <MarketingPage className={pageClasses} tone={sports ? "sports" : "celebration"}>
      <main>
        <MarketingHero
          category={category}
          eyebrow={category ? category.replaceAll("-", " ") : "Envitefy"}
          title={title}
          lead={lead}
          description="The invitation, the details and every guest response, together in one easy link. Give everyone a familiar place to find the latest plan."
          image={
            category ? artwork[category] : "/images/landing/template-proof/generated/wedding.webp"
          }
          imageAlt="Original invitation artwork"
          primaryHref={href}
          primaryLabel={category === "signup-forms" ? "Browse templates" : "Create your page"}
          secondaryHref="#details"
          secondaryLabel="See the details"
        >
          <CelebrationPreview
            title="A gathering to remember"
            meta="Saturday, June 12 · The garden"
            rows={[{ label: "Guest details", value: "Everything in one link" }]}
          />
        </MarketingHero>
        <section id="details" style={{ minHeight: 320, padding: "3rem 1.25rem" }}>
          <h2>The details</h2>
        </section>
        <section id="templates" style={{ minHeight: 320, padding: "3rem 1.25rem" }}>
          <h2>Templates</h2>
        </section>
      </main>
    </MarketingPage>
  );
}

if (typeof document !== "undefined") {
  const requested = new URLSearchParams(location.search).get("category");
  const category = categories.find((item) => item === requested);
  hydrateRoot(document.getElementById("root")!, <CategoryHeroFixture category={category} />);
}
