import type { Metadata } from "next";
import { Suspense } from "react";
import SportsLandingPage from "@/components/sports-landing/SportsLandingPage";
import { buildCategoryShareMetadata } from "@/lib/category-share-metadata";

const title = "Envitefy Sports | Team schedules and event pages";
const description =
  "Bring schedules, venues, attendance and team notes together in one shareable sports event page so everyone arrives ready.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/sport-events" },
  ...buildCategoryShareMetadata("sports", { title, description, url: "/sport-events" }),
};

export default function SportEventsMarketingPage() {
  return (
    <Suspense fallback={null}>
      <SportsLandingPage />
    </Suspense>
  );
}
