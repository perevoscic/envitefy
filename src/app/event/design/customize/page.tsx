"use client";
import { Suspense } from "react";
import EventCustomEditor from "@/components/events/custom/EventCustomEditor";
import EventPageLoading from "@/components/events/custom/EventPageLoading";

export default function CustomEventDesignPage() {
  return (
    <Suspense fallback={<EventPageLoading />}>
      <EventCustomEditor />
    </Suspense>
  );
}
