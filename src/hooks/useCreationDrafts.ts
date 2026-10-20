"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CREATION_INTAKE_MAX_AGE,
  CREATION_INTAKES_UPDATED_EVENT,
  listCreationIntakes,
  type CreationIntake,
} from "@/lib/create/creation-intake";

/** Keep Drafts current while never exposing a preceding account's recovery. */
export function useCreationDrafts(ownerId: string, refreshKey = "", enabled = true) {
  const [snapshot, setSnapshot] = useState<{ ownerId: string; intakes: CreationIntake[] }>({ ownerId: "", intakes: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const sequence = useRef(0);
  const refresh = useCallback(async () => {
    const version = ++sequence.current;
    if (!enabled || !ownerId) {
      setSnapshot({ ownerId: "", intakes: [] });
      setLoading(false);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const intakes = await listCreationIntakes(ownerId);
      if (version === sequence.current) setSnapshot({ ownerId, intakes });
    } catch (failure) {
      if (version === sequence.current) {
        setSnapshot({ ownerId, intakes: [] });
        setError(failure instanceof Error ? failure.message : "Your browser drafts could not be loaded.");
      }
    } finally {
      if (version === sequence.current) setLoading(false);
    }
  }, [enabled, ownerId]);

  useEffect(() => {
    void refresh();
    return () => { sequence.current++; };
  }, [refresh, refreshKey]);

  useEffect(() => {
    if (!enabled || !ownerId) return;
    let timer: number | undefined;
    const updated = (event: Event) => {
      const changedOwner = (event as CustomEvent<{ ownerId?: string }>).detail?.ownerId;
      if (changedOwner && changedOwner !== ownerId) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => { void refresh(); }, 150);
    };
    const focused = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener(CREATION_INTAKES_UPDATED_EVENT, updated);
    window.addEventListener("focus", focused);
    document.addEventListener("visibilitychange", focused);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(CREATION_INTAKES_UPDATED_EVENT, updated);
      window.removeEventListener("focus", focused);
      document.removeEventListener("visibilitychange", focused);
    };
  }, [enabled, ownerId, refresh]);

  const current = enabled && !!ownerId && snapshot.ownerId === ownerId;
  useEffect(() => {
    if (!current || !snapshot.intakes.length) return;
    const expiresAt = Math.min(...snapshot.intakes.map((intake) => intake.updatedAt + CREATION_INTAKE_MAX_AGE + 1));
    const timer = window.setTimeout(() => { void refresh(); }, Math.max(0, expiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [current, snapshot, refresh]);

  return { intakes: current ? snapshot.intakes : [], loading: enabled && !!ownerId && loading, error: current ? error : "", refresh };
}
