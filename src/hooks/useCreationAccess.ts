"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import type { CreationAccess } from "@/lib/creation-access";
import { notifyFeatureVisibilityChanged } from "./useFeatureVisibility";
export const CREATION_ACCESS_UPDATED_EVENT = "envitefy:creation-access-updated";
export function useCreationAccess() {
  const { data: session, status } = useSession();
  const identity = session?.user?.email || "";
  const [access, setAccess] = useState<CreationAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const sequence = useRef(0);
  const previousAccess = useRef("");
  const accessIdentity = useRef("");
  const reload = useCallback(async () => {
    const current = ++sequence.current;
    if (status !== "authenticated") { setAccess(null); setLoading(status === "loading"); return; }
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/user/creation-access", { credentials: "include", cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.access) throw new Error(payload.error || "Could not load your event access.");
      if (current === sequence.current) {
        const signature = JSON.stringify(payload.access);
        if (previousAccess.current && previousAccess.current !== signature) notifyFeatureVisibilityChanged();
        previousAccess.current = signature;
        accessIdentity.current = identity;
        setAccess(payload.access);
      }
    } catch (failure) { if (current === sequence.current) setError(failure instanceof Error ? failure.message : "Could not load your event access."); }
    finally { if (current === sequence.current) setLoading(false); }
  }, [identity, status]);
  useEffect(() => { previousAccess.current = ""; setAccess(null); void reload(); return () => { sequence.current += 1; }; }, [reload]);
  useEffect(() => { const update = () => void reload(); window.addEventListener(CREATION_ACCESS_UPDATED_EVENT, update); return () => window.removeEventListener(CREATION_ACCESS_UPDATED_EVENT, update); }, [reload]);
  useEffect(() => {
    if (status !== "authenticated") return;
    const update = () => { if (document.visibilityState === "visible") void reload(); };
    window.addEventListener("focus", update); document.addEventListener("visibilitychange", update);
    const timer = access?.policy === "restricted" ? window.setInterval(update, 30_000) : undefined;
    return () => { window.removeEventListener("focus", update); document.removeEventListener("visibilitychange", update); if (timer) window.clearInterval(timer); };
  }, [status, access?.policy, reload]);
  // Session changes render before effect cleanup; never admit a new account with
  // the preceding account's last successful grant snapshot during that render.
  return { access: status === "authenticated" && accessIdentity.current === identity ? access : null, loading, error, reload };
}
