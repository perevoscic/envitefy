"use client";

import { useSearchParams } from "next/navigation";
import GymnasticsDesignGallery from "@/components/gym-meet-templates/GymnasticsDesignGallery";
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
      {() => search?.get("mode") === "import" ? <GymnasticsLauncher forwardQueryString={forwardQueryString} /> : <GymnasticsDesignGallery />}
    </SportCreationGate>
  );
}
