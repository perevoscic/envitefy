"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
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

  return <BirthdaysCreate defaultDate={defaultDate} />;
}
