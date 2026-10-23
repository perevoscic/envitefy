"use client";
import type { EventPageComposition } from "@/lib/event-page-composition";
import EventHeroLayoutPicker from "./EventHeroLayoutPicker";

export default function EventPageLayoutPicker({
  value,
  onChange,
  artwork,
  title,
}: {
  value?: EventPageComposition;
  onChange: (value: EventPageComposition | undefined) => void;
  artwork?: string;
  title?: string;
}) {
  return (
    <EventHeroLayoutPicker
      value={value?.hero}
      artwork={artwork}
      title={title}
      onChange={(hero) => onChange({ version: 1, sections: [], ...value, hero })}
    />
  );
}
