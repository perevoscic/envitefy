"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import BabyShowersCreate from "@/components/event-create/BabyShowersCreate";
import BabyShowersCreateTemplate from "@/components/event-create/BabyShowersCreateTemplate";

export default function NewBabyShowerEventPage() {
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
  const templateId = search?.get("templateId");
  const variationId = search?.get("variationId") ?? undefined;

  if (!editEventId && !templateId) {
    return <BabyShowersCreateTemplate defaultDate={defaultDate} />;
  }

  return (
    <BabyShowersCreate
      defaultDate={defaultDate}
      editEventId={editEventId}
      templateId={templateId || undefined}
      templateVariationId={variationId}
    />
  );
}
