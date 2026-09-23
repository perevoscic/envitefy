"use client";
import { Suspense } from "react";
import EventCustomEditor from "@/components/events/custom/EventCustomEditor";

export default function CustomEventDesignPage() {
  return (
    <Suspense
      fallback={
        <p role="status" className="p-10">
          Opening your event page…
        </p>
      }
    >
      <EventCustomEditor />
    </Suspense>
  );
}
