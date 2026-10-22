"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import type { CreationAccess } from "@/lib/creation-access";
import { loadCreationAccess, type InitialCreationAccess } from "@/lib/create/creation-access-client";
import { notifyFeatureVisibilityChanged } from "./useFeatureVisibility";
export const CREATION_ACCESS_UPDATED_EVENT = "envitefy:creation-access-updated";
export function useCreationAccess(initialCreationAccess?: InitialCreationAccess) {
  const { data: session, status } = useSession();
  const identity = session?.user?.email || (session?.user as { id?: string } | undefined)?.id || "";
  const initial = status === "authenticated" && identity && initialCreationAccess?.identity === identity
    ? initialCreationAccess.access : null;
  const [access, setAccess] = useState<CreationAccess | null>(initial);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState("");
  const sequence = useRef(0);
  const previousAccess = useRef(initial ? JSON.stringify(initial) : "");
  const accessIdentity = useRef(initial ? identity : "");
  const reload = useCallback(async () => {
    const current = ++sequence.current;
    if (status !== "authenticated" || !identity) { setAccess(null); setError(""); setLoading(status === "loading"); return; }
    setLoading(true); setError("");
    try {
      const nextAccess = await loadCreationAccess(identity);
      if (current === sequence.current) {
        const signature = JSON.stringify(nextAccess);
        if (previousAccess.current && previousAccess.current !== signature) notifyFeatureVisibilityChanged();
        previousAccess.current = signature;
        accessIdentity.current = identity;
        setAccess(nextAccess);
      }
    } catch (failure) { if (current === sequence.current) setError(failure instanceof Error ? failure.message : "Could not load your event access."); }
    finally { if (current === sequence.current) setLoading(false); }
  }, [identity, status]);
  useEffect(() => {
    if (accessIdentity.current !== identity) {
      previousAccess.current = "";
      setAccess(null);
    }
    void reload();
    return () => { sequence.current += 1; };
  }, [identity, reload]);
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
