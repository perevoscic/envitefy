"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import BirthdayDesignGallery from "@/components/birthdays/BirthdayDesignGallery";
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
    return id?.trim() ? id.trim() : undefined;
  }, [search]);

  if (editEventId) {
    return <BirthdaysCreate defaultDate={defaultDate} editEventId={editEventId} />;
  }

  return <BirthdayDesignGallery />;
}
