"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useMemo, useState, type ReactNode } from "react";
import type { ThemeKey, ThemeVariant, ThemePreference } from "@/themes";
import { APPEARANCE_STORAGE_KEY, applyAppearance, normalizeAppearance } from "@/lib/appearance";

type ThemeContextValue = {
  theme: ThemeVariant;
  themeKey: ThemeKey;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  setTheme: (variant: ThemeVariant) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

type ThemeProviderProps = {
  children: ReactNode;
};

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const themeKey: ThemeKey = "general";
  const [theme, setResolvedTheme] = useState<ThemeVariant>("light");
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const preferenceRef = useRef<ThemePreference>("system");

  const updateAppearance = useCallback((next: ThemePreference) => {
    preferenceRef.current = next;
    setPreferenceState(next);
    setResolvedTheme(applyAppearance(next, window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false));
  }, []);

  useEffect(() => {
    const device = window.matchMedia("(prefers-color-scheme: dark)");
    let initial = normalizeAppearance(document.documentElement.dataset.appearancePreference);
    try { initial = normalizeAppearance(window.localStorage.getItem(APPEARANCE_STORAGE_KEY)); } catch { /* Keep the bootstrapped preference. */ }
    updateAppearance(initial);
    const onDeviceChange = () => {
      if (preferenceRef.current === "system") updateAppearance("system");
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === APPEARANCE_STORAGE_KEY || event.key === null) updateAppearance(normalizeAppearance(event.newValue));
    };
    device.addEventListener("change", onDeviceChange);
    window.addEventListener("storage", onStorage);
    return () => {
      device.removeEventListener("change", onDeviceChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [updateAppearance]);

  const setPreference = useCallback((next: ThemePreference) => {
    const normalized = normalizeAppearance(next);
    try { window.localStorage.setItem(APPEARANCE_STORAGE_KEY, normalized); } catch { /* The current tab still works when storage is unavailable. */ }
    updateAppearance(normalized);
  }, [updateAppearance]);

  const setTheme = useCallback((variant: ThemeVariant) => setPreference(variant), [setPreference]);
  const toggleTheme = useCallback(() => setPreference(theme === "dark" ? "light" : "dark"), [setPreference, theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      themeKey,
      preference,
      setPreference,
      setTheme,
      toggleTheme,
    }),
    [theme, themeKey, preference, setPreference, setTheme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
