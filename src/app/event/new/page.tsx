"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import EventCreateForm from "@/components/EventCreateForm";

export default function NewEventPage() {
  const search = useSearchParams();
  const defaultDate = useMemo(() => {
    const d = search?.get("d");
    if (!d) return undefined;
    try {
      const parsed = new Date(d);
      return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    } catch {
      return undefined;
    }
  }, [search]);

  return (
    <div className="min-h-[60vh] p-4 sm:p-6">
      <div className="mx-auto w-full sm:max-w-lg rounded-xl border border-border bg-surface shadow">
        <EventCreateForm defaultDate={defaultDate} />
      </div>
    </div>
  );
}
