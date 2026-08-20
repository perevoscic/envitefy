"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type DashboardLayout,
  resolveVisibility,
  TEMPLATE_KEYS,
  type TemplateKey,
  type UserPersona,
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
};

type FeatureVisibilityApiPayload = {
  persona?: unknown;
  personas?: unknown;
  visibleTemplateKeys?: unknown;
  dashboardLayout?: unknown;
  defaultCreateIntent?: unknown;
  sportPreferences?: unknown;
  sportPreferenceSuggestion?: unknown;
};

const DEFAULT_STATE: FeatureVisibilityState = {
  persona: null,
  personas: [],
  visibleTemplateKeys: [...TEMPLATE_KEYS],
  dashboardLayout: "default",
  defaultCreateIntent: null,
  sportPreferences: { ...EMPTY_SPORT_PREFERENCES },
  sportPreferenceSuggestion: null,
};

const FEATURE_VISIBILITY_UPDATED_EVENT = "envitefy:feature-visibility-updated";
let featureVisibilityRequest: Promise<FeatureVisibilityApiPayload> | null = null;
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
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<FeatureVisibilityState>(DEFAULT_STATE);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const json = await loadFeatureVisibility();
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
        sportPreferenceSuggestion:
          json?.sportPreferenceSuggestion &&
          typeof json.sportPreferenceSuggestion === "object"
            ? (json.sportPreferenceSuggestion as SportPreferenceSuggestion)
            : null,
      });
    } catch {
      setState(DEFAULT_STATE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handleUpdated = () => void refresh();
    window.addEventListener(FEATURE_VISIBILITY_UPDATED_EVENT, handleUpdated);
    return () => window.removeEventListener(FEATURE_VISIBILITY_UPDATED_EVENT, handleUpdated);
  }, [refresh]);

  return {
    loading,
    ...state,
    refresh,
  };
}

export type { FeatureVisibilityState };
