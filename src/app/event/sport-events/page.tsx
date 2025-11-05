"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import SportEventsCreate from "@/components/event-create/SportEventsCreate";

export default function NewSportEventsPage() {
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

  return <SportEventsCreate defaultDate={defaultDate} />;
}
