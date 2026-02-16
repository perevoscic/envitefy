"use client";

import { useCallback, useEffect, useState } from "react";
import {
  TEMPLATE_KEYS,
  type TemplateKey,
  type UserPersona,
  type DashboardLayout,
  resolveVisibility,
} from "@/config/feature-visibility";

type OnboardingState = {
  required: boolean;
  completed: boolean;
  persona: UserPersona | null;
  personas: UserPersona[];
  promptDismissedAt: string | null;
  visibleTemplateKeys: TemplateKey[];
  dashboardLayout: DashboardLayout;
};

const DEFAULT_STATE: OnboardingState = {
  required: false,
  completed: false,
  persona: null,
  personas: [],
  promptDismissedAt: null,
  visibleTemplateKeys: [...TEMPLATE_KEYS],
  dashboardLayout: "default",
};

export function useFeatureVisibility() {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<OnboardingState>(DEFAULT_STATE);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/onboarding", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        setState(DEFAULT_STATE);
        return;
      }
      const json = await res.json();
      const resolved = resolveVisibility({
        persona: json?.persona,
        personas: json?.personas,
        visibleTemplateKeys: json?.visibleTemplateKeys,
      });
      setState({
        required: Boolean(json?.required),
        completed: Boolean(json?.completed),
        persona: resolved.persona,
        personas: resolved.personas,
        promptDismissedAt: json?.promptDismissedAt || null,
        visibleTemplateKeys: resolved.visibleTemplateKeys,
        dashboardLayout: resolved.dashboardLayout,
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

  return {
    loading,
    ...state,
    refresh,
  };
}

export type { OnboardingState };
