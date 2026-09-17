"use client";

import { useEffect } from "react";
import { useEventCache } from "@/app/event-cache-context";

/** Only rendered after the server confirms the event no longer exists. */
export default function RemoveUnavailableEventFromLists({ eventKey }: { eventKey: string }) {
  const { removeUnavailableEvent } = useEventCache();
  useEffect(() => {
    removeUnavailableEvent(eventKey);
  }, [eventKey, removeUnavailableEvent]);
  return null;
}
