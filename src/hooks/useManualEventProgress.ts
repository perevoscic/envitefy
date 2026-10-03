"use client";

import { useRef } from "react";
import { useEventProgress } from "@/components/UnsavedProgressProvider";
import { saveManualEventProgress } from "@/lib/manual-event-progress";
import type { EditorSnapshot } from "@/lib/template-draft-storage";

export function useManualEventProgress({
  snapshot,
  category,
  templateId,
  eventId,
  path,
  ready = true,
  busy = false,
  historyFetch,
}: {
  snapshot: object;
  category: string;
  templateId?: string;
  eventId?: string;
  path?: string;
  ready?: boolean;
  busy?: boolean;
  historyFetch?: (input: string, options?: RequestInit) => Promise<Response>;
}) {
  const savedId = useRef(eventId);
  const clientDraftId = useRef<string | null>(null);
  return useEventProgress({
    snapshot,
    ready,
    busy,
    save: async () => {
      clientDraftId.current ||= crypto.randomUUID();
      savedId.current = await saveManualEventProgress({
        snapshot: JSON.parse(JSON.stringify(snapshot)) as EditorSnapshot,
        category,
        templateId,
        eventId: savedId.current,
        path: path || window.location.pathname,
        clientDraftId: clientDraftId.current,
        historyFetch,
      });
    },
  });
}
