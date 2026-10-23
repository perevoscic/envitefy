"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { invalidateCreationAccess, loadCreationAccess, type InitialCreationAccess } from "@/lib/create/creation-access-client";
import { notifyFeatureVisibilityChanged } from "./useFeatureVisibility";

export const CREATION_ACCESS_UPDATED_EVENT = "envitefy:creation-access-updated";

export function useCreationAccess(initialCreationAccess?: InitialCreationAccess) {
  const { data: session, status } = useSession();
  const identity = session?.user?.email || (session?.user as { id?: string } | undefined)?.id || "";
  // Keep the verified server snapshot through session hydration. It is exposed
  // only once the authenticated browser account matches its identity.
  const [snapshot, setSnapshot] = useState<InitialCreationAccess | null>(initialCreationAccess || null);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState({ identity: "", message: "" });
  const sequence = useRef(0);
  const activeIdentity = useRef<string | null>(null);
  activeIdentity.current = status === "authenticated" ? identity : null;
  const requestedIdentity = useRef("");
  const previousAccess = useRef(initialCreationAccess
    ? { identity: initialCreationAccess.identity, signature: JSON.stringify(initialCreationAccess.access) } : null);
  const access = status === "authenticated" && snapshot?.identity === identity ? snapshot.access : null;

  const reload = useCallback(async () => {
    const current = ++sequence.current;
    if (status !== "authenticated" || !identity) {
      setLoading(status === "loading");
      return;
    }
    setLoading(true);
    setFailure({ identity, message: "" });
    try {
      const nextAccess = await loadCreationAccess(identity);
      if (current !== sequence.current || identity !== activeIdentity.current) return;
      const signature = JSON.stringify(nextAccess);
      const changed = previousAccess.current?.identity === identity && previousAccess.current.signature !== signature;
      previousAccess.current = { identity, signature };
      setSnapshot({ identity, access: nextAccess });
      if (changed) notifyFeatureVisibilityChanged();
    } catch (error) {
      if (current === sequence.current && identity === activeIdentity.current) {
        setFailure({ identity, message: error instanceof Error ? error.message : "Could not load your event access." });
      }
    } finally {
      if (current === sequence.current && identity === activeIdentity.current) setLoading(false);
    }
  }, [identity, status]);

  useEffect(() => {
    const nextIdentity = status === "authenticated" ? identity : "";
    if (requestedIdentity.current && requestedIdentity.current !== nextIdentity) {
      invalidateCreationAccess(requestedIdentity.current);
      previousAccess.current = null;
    }
    requestedIdentity.current = nextIdentity;
    if (status !== "loading") {
      setSnapshot(previous => status === "authenticated" && previous?.identity === identity ? previous : null);
    }
    void reload();
    return () => { sequence.current += 1; };
  }, [identity, status, reload]);

  useEffect(() => {
    const update = () => void reload();
    window.addEventListener(CREATION_ACCESS_UPDATED_EVENT, update);
    return () => window.removeEventListener(CREATION_ACCESS_UPDATED_EVENT, update);
  }, [reload]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const update = () => { if (document.visibilityState === "visible") void reload(); };
    window.addEventListener("online", update);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    const timer = access?.policy === "restricted" ? window.setInterval(update, 30_000) : undefined;
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
      if (timer) window.clearInterval(timer);
    };
  }, [status, access?.policy, reload]);

  // Background failures retain the current account's verified choices. Initial
  // failures still expose a retry, without ever fabricating creation grants.
  return { access, loading, error: !access && activeIdentity.current && failure.identity === identity ? failure.message : "", reload };
}
