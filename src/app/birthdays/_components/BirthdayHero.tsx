import MarketingHero from "@/components/marketing/MarketingHero";
import CelebrationPreview from "../../category-pages/CelebrationPreview";
import type { UseCasePage } from "../../category-pages/category-page-data";

export default function BirthdayHero({
  page,
  primaryHref,
}: {
  page: UseCasePage;
  primaryHref: string;
}) {
  return (
    <MarketingHero
      eyebrow="Birthday invitations & party pages"
      title={
        <>
          A little more magic.
          <br />
          <em>A lot less planning.</em>
        </>
      }
      description="Make an invitation as memorable as the birthday. Keep RSVPs, directions, and every party detail together in one easy link."
      image="/themes/flower-fairy-main.jpg"
      imageAlt="Original storybook flower fairy birthday invitation artwork"
      primaryHref={primaryHref}
      primaryLabel="Create a birthday page"
      secondaryHref="#birthday-prompt-studio"
      secondaryLabel="See what a prompt creates"
    >
      <CelebrationPreview
        title={page.preview.eventTitle}
        meta={page.preview.eventMeta}
        rows={[{ label: "Guest details", value: "Kids, adults & allergy notes" }]}
      />
    </MarketingHero>
  );
}
