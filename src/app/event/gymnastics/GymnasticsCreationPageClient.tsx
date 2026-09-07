"use client";

import { useSearchParams } from "next/navigation";
import GymnasticsDesignGallery from "@/components/gym-meet-templates/GymnasticsDesignGallery";
import SportCreationGate from "@/components/event-create/SportCreationGate";

export default function GymnasticsCreationPageClient({
  forwardQueryString: _forwardQueryString,
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
      {() => <GymnasticsDesignGallery />}
    </SportCreationGate>
  );
}
