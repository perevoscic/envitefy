"use client";

import { useId } from "react";
import { useTheme } from "@/components/AppearanceProvider";
import type { ThemePreference } from "@/themes";

export default function AppearanceSelector({ compact = false }: { compact?: boolean }) {
  const { preference, setPreference } = useTheme();
  const id = useId();
  return (
    <div className={`appearance-selector ${compact ? "appearance-selector-compact" : ""}`}>
      <label htmlFor={id} className={compact ? "sr-only" : "mb-2 block text-sm font-semibold"}>Appearance</label>
      <select id={id} aria-label="Appearance" value={preference}
        onChange={(event) => setPreference(event.target.value as ThemePreference)}
        className="min-h-11 max-w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
      {!compact && <p className="mt-3 text-sm text-muted-foreground">System follows your device. Your choice is remembered in this browser and does not change your event designs.</p>}
    </div>
  );
}
