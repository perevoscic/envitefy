"use client";

import { useEffect, useMemo } from "react";
import Dashboard from "@/components/Dashboard";
import { useSidebar, type EventContextTab } from "@/app/sidebar-context";
import { resolveEditHref } from "@/utils/event-edit-route";

type EventOwnerWorkspaceProps = {
  eventId: string;
  eventTitle: string;
  eventData: Record<string, unknown> | null;
  eventHref: string;
  initialTab: EventContextTab;
};

export default function EventOwnerWorkspace({
  eventId,
  eventTitle,
  eventData,
  eventHref,
  initialTab,
}: EventOwnerWorkspaceProps) {
  const {
    setSelectedEventId,
    setSelectedEventTitle,
    setSelectedEventHref,
    setSelectedEventEditHref,
    setActiveEventTab,
  } = useSidebar();

  const resolvedEditHref = useMemo(
    () => resolveEditHref(eventId, eventData, eventTitle),
    [eventData, eventId, eventTitle],
  );

  useEffect(() => {
    setSelectedEventId(eventId);
    setSelectedEventTitle(eventTitle || "Untitled event");
    setSelectedEventHref(eventHref);
    setSelectedEventEditHref(resolvedEditHref);
    setActiveEventTab(initialTab);
  }, [
    eventHref,
    eventId,
    eventTitle,
    initialTab,
    resolvedEditHref,
    setActiveEventTab,
    setSelectedEventEditHref,
    setSelectedEventHref,
    setSelectedEventId,
    setSelectedEventTitle,
  ]);

  return (
    <Dashboard
      initialEventContext={{
        eventId,
        eventTitle: eventTitle || "Untitled event",
        eventHref,
        eventEditHref: resolvedEditHref,
        activeEventTab: initialTab,
      }}
    />
  );
}
