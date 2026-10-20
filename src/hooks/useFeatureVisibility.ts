"use client";

import { useCallback, useEffect, useState } from "react";
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

type FeatureVisibilityState = {
  persona: UserPersona | null;
  personas: UserPersona[];
  visibleTemplateKeys: TemplateKey[];
  dashboardLayout: DashboardLayout;
  defaultCreateIntent: string | null;
  sportPreferences: SportPreferences;
  sportPreferenceSuggestion: SportPreferenceSuggestion | null;
  quickAccess: QuickAccessKey[];
};

type FeatureVisibilityApiPayload = {
  persona?: unknown;
  personas?: unknown;
  visibleTemplateKeys?: unknown;
  dashboardLayout?: unknown;
  defaultCreateIntent?: unknown;
  sportPreferences?: unknown;
  sportPreferenceSuggestion?: unknown;
  quickAccess?: unknown;
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
let featureVisibilityRequest: Promise<FeatureVisibilityApiPayload> | null = null;
let featureVisibilityIdentity = "";
let featureVisibilityGeneration = 0;

async function loadFeatureVisibility(): Promise<FeatureVisibilityApiPayload> {
  if (featureVisibilityRequest) return featureVisibilityRequest;
  const requestGeneration = featureVisibilityGeneration;
  const request = (async () => {
    const response = await fetch("/api/user/feature-visibility", {
      credentials: "include",
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Could not load feature visibility");
    const payload = (await response.json()) as FeatureVisibilityApiPayload;
    if (requestGeneration !== featureVisibilityGeneration) return loadFeatureVisibility();
    return payload;
  })().finally(() => {
    if (featureVisibilityRequest === request) featureVisibilityRequest = null;
  });
  featureVisibilityRequest = request;
  return request;
}

export function notifyFeatureVisibilityChanged() {
  if (typeof window === "undefined") return;
  featureVisibilityGeneration += 1;
  featureVisibilityRequest = null;
  window.dispatchEvent(new Event(FEATURE_VISIBILITY_UPDATED_EVENT));
}

export function useFeatureVisibility() {
  const { data: session, status } = useSession();
  const identity = session?.user?.email || "";
  const [loading, setLoading] = useState(true);
  const [hasLoadedPreferences, setHasLoadedPreferences] = useState(false);
  const [state, setState] = useState<FeatureVisibilityState>(DEFAULT_STATE);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (status !== "authenticated") { setLoading(status === "loading"); return; }
    setLoading(true);
    setError("");
    try {
      const json = await loadFeatureVisibility();
      if (identity !== featureVisibilityIdentity) return;
      const resolved = resolveVisibility({
        persona: json?.persona,
        personas: json?.personas,
        visibleTemplateKeys: json?.visibleTemplateKeys,
        defaultCreateIntent: json?.defaultCreateIntent,
        sportPreferences: json?.sportPreferences,
      });
      setState({
        persona: resolved.persona,
        personas: resolved.personas,
        visibleTemplateKeys: resolved.visibleTemplateKeys,
        dashboardLayout: resolved.dashboardLayout,
        defaultCreateIntent: resolved.defaultCreateIntent,
        sportPreferences: normalizeSportPreferences(json?.sportPreferences),
        quickAccess: Array.isArray(json.quickAccess) ? json.quickAccess.filter((key): key is QuickAccessKey => key === "snap" || key === "upload" || key === "smart_signup") : ["snap", "upload", "smart_signup"],
        sportPreferenceSuggestion:
          json?.sportPreferenceSuggestion &&
          typeof json.sportPreferenceSuggestion === "object"
            ? (json.sportPreferenceSuggestion as SportPreferenceSuggestion)
            : null,
      });
      setHasLoadedPreferences(true);
    } catch {
      // Retain the last successful preferences rather than revealing every category.
      if (identity === featureVisibilityIdentity) setError("Could not load your workspace preferences. Please retry.");
    } finally {
      if (identity === featureVisibilityIdentity) setLoading(false);
    }
  }, [status, identity]);

  useEffect(() => {
    if (featureVisibilityIdentity !== identity) {
      featureVisibilityIdentity = identity;
      featureVisibilityGeneration += 1;
      featureVisibilityRequest = null;
    }
    setState(DEFAULT_STATE);
    setHasLoadedPreferences(false);
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handleUpdated = () => void refresh();
    window.addEventListener(FEATURE_VISIBILITY_UPDATED_EVENT, handleUpdated);
    return () => window.removeEventListener(FEATURE_VISIBILITY_UPDATED_EVENT, handleUpdated);
  }, [refresh]);

  return {
    loading,
    hasLoadedPreferences,
    error,
    ...state,
    refresh,
  };
}

export type { FeatureVisibilityState };
