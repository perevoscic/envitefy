"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ScheduleReviewDialog from "@/components/ScheduleReviewDialog";
import { normalizeScanSchedule, type ScanSchedule } from "@/lib/scan-schedule";
import { isEventDraft } from "@/lib/event-draft-access";
import { buildEventPath } from "@/utils/event-url";

function ScheduleEditor() {
  const search = useSearchParams();
  const router = useRouter();
  const id = search?.get("edit") || "";
  const [schedule, setSchedule] = useState<ScanSchedule | null>(null);
  const [error, setError] = useState("");
  const [savedStatus, setSavedStatus] = useState<"draft" | "published">("draft");
  const [eventHref, setEventHref] = useState("/");
  useEffect(() => {
    const controller = new AbortController();
    setSchedule(null);
    setError("");
    async function load() {
      try {
        if (!id) throw new Error("Choose a saved schedule to edit.");
        const response = await fetch(`/api/history/${encodeURIComponent(id)}`, {
          signal: controller.signal,
          credentials: "include",
          cache: "no-store",
        });
        const row = await response.json();
        if (!response.ok) throw new Error(row.error || "Could not open the schedule.");
        const next = normalizeScanSchedule(row.data?.scanSchedule);
        if (!next) throw new Error("This event does not have an editable schedule.");
        setSchedule(next);
        setSavedStatus(isEventDraft(row.data) ? "draft" : "published");
        setEventHref(
          buildEventPath(id, row.title || next.title, { tab: "event" }, row.public_slug),
        );
      } catch (cause) {
        if (!controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : "Could not open the schedule.");
      }
    }
    void load();
    return () => controller.abort();
  }, [id]);
  if (!schedule)
    return (
      <main className="p-8 pt-28">
        <p role={error ? "alert" : "status"}>{error || "Opening schedule…"}</p>
      </main>
    );
  return (
    <ScheduleReviewDialog
      key={id}
      initialSchedule={schedule}
      saved
      savedStatus={savedStatus}
      onDiscard={() => router.push(eventHref)}
      onSave={async (next, status) => {
        const response = await fetch(`/api/history/${encodeURIComponent(id)}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: next.title,
            data: {
              title: next.title,
              scanSchedule: next,
              scheduleItems: next.items,
              status,
              draftStatus: status,
              ownership: "owned",
              invitedFromScan: false,
            },
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not save the schedule.");
        window.dispatchEvent(new CustomEvent("history:updated", { detail: { id } }));
        return eventHref;
      }}
    />
  );
}

export default function ScheduleEditorPage() {
  return (
    <Suspense fallback={<p className="p-8">Opening schedule…</p>}>
      <ScheduleEditor />
    </Suspense>
  );
}
