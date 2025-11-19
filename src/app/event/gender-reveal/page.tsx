"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import GenderRevealCreateTemplate from "@/components/event-create/GenderRevealCreateTemplate";
import GenderRevealCreate from "@/components/event-create/GenderRevealCreate";

export default function NewGenderRevealEventPage() {
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
  const editEventId = useMemo(() => {
    const id = search?.get("edit");
    return id && id.trim() ? id.trim() : undefined;
  }, [search]);

  if (editEventId) {
    return (
      <GenderRevealCreate defaultDate={defaultDate} editEventId={editEventId} />
    );
  }

  return <GenderRevealCreateTemplate defaultDate={defaultDate} />;
}
