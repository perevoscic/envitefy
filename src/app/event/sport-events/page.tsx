import { Suspense } from "react";
import SportEventsPageClient from "./SportEventsPageClient";

export default function NewSportEventsPage() {
  return (
    <Suspense fallback={null}>
      <SportEventsPageClient />
    </Suspense>
  );
}
