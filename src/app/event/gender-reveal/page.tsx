"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import BabyShowersCreate from "@/components/event-create/BabyShowersCreate";

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

  return (
    <BabyShowersCreate
      defaultDate={defaultDate}
      editEventId={editEventId}
      variant="gender_reveal"
    />
  );
}
