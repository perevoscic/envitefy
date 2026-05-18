"use client";

import { useEffect, useRef } from "react";
import { trackEventInteraction } from "@/utils/event-tracking-client";

type EventViewTrackerProps = {
  eventId: string;
  category?: string | null;
  sourceSurface?: string | null;
};

export default function EventViewTracker({
  eventId,
  category,
  sourceSurface = "public_event_page",
}: EventViewTrackerProps) {
  const recordedRef = useRef(false);

  useEffect(() => {
    if (recordedRef.current) return;
    recordedRef.current = true;
    trackEventInteraction({
      eventId,
      eventName: "public_event_view",
      sourceSurface,
      metadata: {
        category: category || null,
      },
    });
  }, [category, eventId, sourceSurface]);

  return null;
}
