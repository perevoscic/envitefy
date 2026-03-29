"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type DashboardLayout,
  resolveVisibility,
  TEMPLATE_KEYS,
  type TemplateKey,
  type UserPersona,
} from "@/config/feature-visibility";

type FeatureVisibilityState = {
  persona: UserPersona | null;
  personas: UserPersona[];
  visibleTemplateKeys: TemplateKey[];
  dashboardLayout: DashboardLayout;
};

const DEFAULT_STATE: FeatureVisibilityState = {
  persona: null,
  personas: [],
  visibleTemplateKeys: [...TEMPLATE_KEYS],
  dashboardLayout: "default",
};

export function useFeatureVisibility() {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<FeatureVisibilityState>(DEFAULT_STATE);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/feature-visibility", {
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
        persona: resolved.persona,
        personas: resolved.personas,
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

export type { FeatureVisibilityState };
