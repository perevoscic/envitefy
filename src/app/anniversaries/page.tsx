import MarketingHero from "@/components/marketing/MarketingHero";
import MarketingPage from "@/components/marketing/MarketingPage";
import SignedOutPageChrome from "@/components/navigation/SignedOutPageChrome";
import PublicTemplateGallery from "@/components/templates/PublicTemplateGallery";
import { buildCategoryShareMetadata } from "@/lib/category-share-metadata";
import styles from "../category-pages/CelebrationLanding.module.css";
import CelebrationPreview from "../category-pages/CelebrationPreview";

export const metadata = {
  title: "Anniversary invitations and event pages | Envitefy",
  description:
    "Celebrate your years together. Customize an anniversary invitation with your names, photos, celebration details, and RSVP.",
  alternates: { canonical: "/anniversaries" },
  ...buildCategoryShareMetadata("anniversaries", {
    title: "Anniversary invitations and event pages | Envitefy",
    description:
      "Celebrate your years together. Customize an anniversary invitation with your names, photos, celebration details, and RSVP.",
    url: "/anniversaries",
  }),
};

export default function AnniversariesLandingPage() {
  return (
    <MarketingPage className={styles.editorial}>
      <SignedOutPageChrome />
      <main>
        <MarketingHero
          category="anniversaries"
          eyebrow="Every chapter deserves a celebration"
          title={
            <>
              Your story.
              <br />
              <em>Still unfolding.</em>
            </>
          }
          description="From your first year to a golden anniversary, make an invitation that feels like you. Bring your favorite people together around the story you share."
          lead="Your people. Your memories. Another beautiful chapter."
          image="/templates/anniversaries/collection-2026/vinyl-love-song-anniversary.webp"
          imageAlt="Original illustrated anniversary invitation with a vintage record player"
          primaryHref="#templates"
          primaryLabel="Browse anniversary designs"
          secondaryHref="#your-celebration"
          secondaryLabel="Make it your celebration"
        >
          <CelebrationPreview
            title="Twenty-five years of us"
            meta="An anniversary celebration with our favorite people"
            rows={[{ label: "The occasion", value: "Still making memories" }]}
          />
        </MarketingHero>
        <PublicTemplateGallery category="anniversaries" featured />
        <section id="your-celebration" className={styles.chapter}>
          <h2>Made for the people who shared the journey.</h2>
          <p>
            Keep your celebration details, registry links, and guest replies in one place. Add your
            names, photos, and favorite memories. Save a private draft when you create an account,
            and publish when you are ready.
          </p>
        </section>
      </main>
    </MarketingPage>
  );
}
