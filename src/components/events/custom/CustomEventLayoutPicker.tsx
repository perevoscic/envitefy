"use client";

import EventHeroLayoutPicker from "@/components/events/EventHeroLayoutPicker";
import type { CustomEventPage } from "@/lib/event-custom-design";
import type { EventHeroLayout } from "@/lib/event-hero-layout";

export default function CustomEventLayoutPicker({
  page,
  onChange,
}: {
  page: CustomEventPage;
  onChange: (hero: EventHeroLayout | undefined) => void;
}) {
  return (
    <EventHeroLayoutPicker
      value={page.design.hero}
      artwork={page.artwork}
      title={page.details.title}
      onChange={onChange}
    />
  );
}
