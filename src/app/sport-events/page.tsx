import { Suspense } from "react";
import SportsLandingPage from "@/components/sports-landing/SportsLandingPage";

export default function SportEventsMarketingPage() {
  return (
    <Suspense fallback={null}>
      <SportsLandingPage />
    </Suspense>
  );
}
