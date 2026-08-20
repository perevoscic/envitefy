"use client";

import { useSearchParams } from "next/navigation";
import GymnasticsLauncher from "@/components/event-create/GymnasticsLauncher";
import SportCreationGate from "@/components/event-create/SportCreationGate";

export default function GymnasticsCreationPageClient({
  forwardQueryString,
}: {
  forwardQueryString?: string;
}) {
  const search = useSearchParams();
  return (
    <SportCreationGate
      requestedSport="gymnastics"
      surface="gymnastics"
      unavailableSport={search?.get("unavailableSport")}
    >
      {() => <GymnasticsLauncher forwardQueryString={forwardQueryString} />}
    </SportCreationGate>
  );
}
