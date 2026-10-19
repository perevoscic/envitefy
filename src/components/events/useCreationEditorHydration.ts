"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { creationIntakeOwner, readCreationIntake } from "@/lib/create/creation-intake";
import { hydrateCreationValue, informationForCreation } from "@/lib/create/editor-handoff";

/** Direct native editors recover the same intake without creating a server history row. */
export function useCreationEditorHydration({ category, snapshot, restore, onError, eventId }: {
  category: string; snapshot: Record<string, unknown>; restore: (snapshot: Record<string, any>) => void;
  onError: (message: string) => void; eventId?: string;
}) {
  const search = useSearchParams(), intakeId = search?.get("intake");
  const { data: session, status } = useSession();
  const owner = creationIntakeOwner(session?.user);
  const [ready, setReady] = useState(!intakeId || Boolean(eventId));
  const latest = useRef({ snapshot, restore, onError }); latest.current = { snapshot, restore, onError };
  useEffect(() => {
    if (!intakeId || eventId) { setReady(true); return; }
    if (status === "loading") return;
    let active = true;
    void readCreationIntake(owner, intakeId).then(intake => {
      if (!active) return;
      if (!intake) throw new Error("This creation belongs to another account or has expired. Return to Create to start again.");
      const base = latest.current.snapshot;
      const saved = intake.editorSnapshot;
      latest.current.restore(saved || { ...base, data: hydrateCreationValue(category, "data", base.data, informationForCreation(intake), intake.selectedTemplateId) });
      setReady(true);
    }).catch(error => { if (active) latest.current.onError(error instanceof Error ? error.message : "Your progress could not be restored."); });
    return () => { active = false; };
  }, [category, eventId, intakeId, owner, status]);
  return ready;
}
