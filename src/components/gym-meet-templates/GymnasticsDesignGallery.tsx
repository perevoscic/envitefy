"use client";

import { useSearchParams } from "next/navigation";
import EventDesignGallery from "@/components/events/EventDesignGallery";
import GymnasticsThumbnail from "./GymnasticsThumbnail";
import { GYM_MEET_TEMPLATE_LIBRARY } from "./registry";

export default function GymnasticsDesignGallery() {
  const search = useSearchParams();
  const date = search?.get("d");
  return (
    <EventDesignGallery
      title="Gymnastics"
      description="First, find your meet’s style. Then upload a packet, paste a meet link, or add your details by hand. We’ll bring it all together in your chosen design."
      designs={GYM_MEET_TEMPLATE_LIBRARY}
      getHref={(design) => {
        const params = new URLSearchParams({ templateId: design.id });
        if (date) params.set("d", date);
        if (search?.get("demo") === "1") params.set("demo", "1");
        return `/event/gymnastics/customize?${params.toString()}`;
      }}
      renderPreview={(design) => <GymnasticsThumbnail design={design} />}
    />
  );
}
