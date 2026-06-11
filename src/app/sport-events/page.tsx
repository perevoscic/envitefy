import { Suspense } from "react";
import SportsLandingPage from "./SportsLandingPage";

export default function SportEventsMarketingPage() {
  return (
    <Suspense fallback={null}>
      <SportsLandingPage />
    </Suspense>
  );
}
