"use client";

import { useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import BirthdaysCreate from "@/components/event-create/BirthdaysCreate";

export default function NewBirthdayEventPage() {
  const search = useSearchParams();
  const router = useRouter();
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

  // If editing, use the old component. Otherwise redirect to customize with default template.
  useEffect(() => {
    if (!editEventId) {
      const params = new URLSearchParams();
      if (defaultDate) params.set("d", defaultDate.toISOString().split("T")[0]);
      params.set("templateId", "rainbow-bash"); // Default template
      const query = params.toString();
      router.replace(`/event/birthdays/customize?${query}`);
    }
  }, [editEventId, defaultDate, router]);

  if (editEventId) {
    return (
      <BirthdaysCreate defaultDate={defaultDate} editEventId={editEventId} />
    );
  }

  return null; // Will redirect
}
