"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  type DashboardLayout,
  resolveVisibility,
  type TemplateKey,
  type UserPersona,
  type QuickAccessKey,
} from "@/config/feature-visibility";
import {
  EMPTY_SPORT_PREFERENCES,
  normalizeSportPreferences,
  type SportPreferences,
  type SportPreferenceSuggestion,
} from "@/lib/sports-preferences";
import { invalidateFeatureVisibility, loadFeatureVisibility } from "@/lib/feature-visibility-client";
import { normalizePinnedCategoryIds } from "@/lib/category-favorites";

type FeatureVisibilityState = {
  persona: UserPersona | null;
  personas: UserPersona[];
  visibleTemplateKeys: TemplateKey[];
  dashboardLayout: DashboardLayout;
  defaultCreateIntent: string | null;
  sportPreferences: SportPreferences;
  sportPreferenceSuggestion: SportPreferenceSuggestion | null;
  quickAccess: QuickAccessKey[];
  pinnedCategoryIds?: string[];
};

const DEFAULT_STATE: FeatureVisibilityState = {
  persona: null,
  personas: [],
  visibleTemplateKeys: [],
  dashboardLayout: "default",
  defaultCreateIntent: null,
  sportPreferences: { ...EMPTY_SPORT_PREFERENCES },
  sportPreferenceSuggestion: null,
  quickAccess: ["snap", "upload", "smart_signup"],
};

const FEATURE_VISIBILITY_UPDATED_EVENT = "envitefy:feature-visibility-updated";
export function notifyFeatureVisibilityChanged() {
  if (typeof window === "undefined") return;
  invalidateFeatureVisibility();
  window.dispatchEvent(new Event(FEATURE_VISIBILITY_UPDATED_EVENT));
}

export function useFeatureVisibility() {
  const { data: session, status } = useSession();
  const identity = session?.user?.email || (session?.user as { id?: string } | undefined)?.id || "";
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<{ identity: string; value: FeatureVisibilityState } | null>(null);
  const [failure, setFailure] = useState({ identity: "", message: "" });
  const sequence = useRef(0);
  const activeIdentity = useRef<string | null>(null);
  activeIdentity.current = status === "authenticated" ? identity : null;
  const hasLoadedPreferences = status === "authenticated" && snapshot?.identity === identity;

  const refresh = useCallback(async () => {
    const current = ++sequence.current;
    if (status !== "authenticated") { setLoading(status === "loading"); return; }
    setLoading(true);
    setFailure({ identity, message: "" });
    try {
      const json = await loadFeatureVisibility(identity);
      if (current !== sequence.current || identity !== activeIdentity.current) return;
      const resolved = resolveVisibility({
        persona: json?.persona,
        personas: json?.personas,
        visibleTemplateKeys: json?.visibleTemplateKeys,
        defaultCreateIntent: json?.defaultCreateIntent,
        sportPreferences: json?.sportPreferences,
      });
      setSnapshot({ identity, value: {
        persona: resolved.persona,
        personas: resolved.personas,
        visibleTemplateKeys: resolved.visibleTemplateKeys,
        dashboardLayout: resolved.dashboardLayout,
        defaultCreateIntent: resolved.defaultCreateIntent,
        sportPreferences: normalizeSportPreferences(json?.sportPreferences),
        quickAccess: Array.isArray(json.quickAccess) ? json.quickAccess.filter((key): key is QuickAccessKey => key === "snap" || key === "upload" || key === "smart_signup") : ["snap", "upload", "smart_signup"],
        pinnedCategoryIds: Array.isArray(json.pinnedCategoryIds)
          ? normalizePinnedCategoryIds(json.pinnedCategoryIds)
          : undefined,
        sportPreferenceSuggestion:
          json?.sportPreferenceSuggestion &&
          typeof json.sportPreferenceSuggestion === "object"
            ? (json.sportPreferenceSuggestion as SportPreferenceSuggestion)
            : null,
      } });
    } catch {
      if (current === sequence.current && identity === activeIdentity.current) {
        setFailure({ identity, message: "Could not load your workspace preferences. Please retry." });
      }
    } finally {
      if (current === sequence.current && identity === activeIdentity.current) setLoading(false);
    }
  }, [status, identity]);

  useEffect(() => {
    setSnapshot((previous) => previous?.identity === identity && status === "authenticated" ? previous : null);
    void refresh();
    return () => { sequence.current += 1; };
  }, [refresh]);

  useEffect(() => {
    const handleUpdated = () => void refresh();
    window.addEventListener(FEATURE_VISIBILITY_UPDATED_EVENT, handleUpdated);
    return () => window.removeEventListener(FEATURE_VISIBILITY_UPDATED_EVENT, handleUpdated);
  }, [refresh]);

  useEffect(() => {
    if (status !== "authenticated" || hasLoadedPreferences || loading) return;
    const recover = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener("online", recover);
    window.addEventListener("focus", recover);
    document.addEventListener("visibilitychange", recover);
    return () => {
      window.removeEventListener("online", recover);
      window.removeEventListener("focus", recover);
      document.removeEventListener("visibilitychange", recover);
    };
  }, [status, hasLoadedPreferences, loading, refresh]);

  return {
    loading,
    hasLoadedPreferences,
    // A failed background refresh must not replace a usable account snapshot
    // with a persistent warning. Initial failures retain the explicit retry UI.
    error: !hasLoadedPreferences && failure.identity === identity ? failure.message : "",
    ...(hasLoadedPreferences ? snapshot.value : DEFAULT_STATE),
    refresh,
  };
}

export type { FeatureVisibilityState };
