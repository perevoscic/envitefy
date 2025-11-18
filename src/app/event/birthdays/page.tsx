"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import BirthdaysCreateTemplate from "@/components/event-create/BirthdaysCreateTemplate";
import BirthdaysCreate from "@/components/event-create/BirthdaysCreate";

export default function NewBirthdayEventPage() {
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

  // If editing, use the old component. Otherwise show template gallery first.
  if (editEventId) {
    return (
      <BirthdaysCreate defaultDate={defaultDate} editEventId={editEventId} />
    );
  }

  return <BirthdaysCreateTemplate defaultDate={defaultDate} />;
}
