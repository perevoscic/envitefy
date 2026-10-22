"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { type CSSProperties, useId } from "react";
import { useTheme } from "@/components/AppearanceProvider";
import type { ThemePreference } from "@/themes";
import styles from "./appearance-selector.module.css";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "Device", icon: Monitor },
] as const satisfies ReadonlyArray<{
  value: ThemePreference;
  label: string;
  icon: typeof Sun;
}>;

export default function AppearanceSelector({ compact = false }: { compact?: boolean }) {
  const { preference, setPreference } = useTheme();
  const id = useId();
  return (
    <fieldset
      className={`appearance-selector ${styles.selector} ${compact ? styles.compact : ""}`}
      aria-describedby={compact ? undefined : `${id}-description`}
    >
      <legend className={compact ? "sr-only" : styles.label}>Appearance</legend>
      <div className={styles.track}>
        <div
          className={styles.options}
          style={{ "--appearance-index": OPTIONS.findIndex((option) => option.value === preference) } as CSSProperties}
        >
          <span className={styles.indicator} aria-hidden="true" />
          {OPTIONS.map(({ value, label, icon: Icon }) => (
            <label key={value} className={styles.option} title={compact ? label : undefined}>
              <input
                className={styles.input}
                type="radio"
                name={`${id}-appearance`}
                value={value}
                checked={preference === value}
                onChange={() => setPreference(value)}
              />
              <span className={styles.content}>
                <Icon className={styles.icon} size={18} strokeWidth={1.75} aria-hidden="true" />
                <span className={compact ? "sr-only" : undefined}>{label}</span>
              </span>
            </label>
          ))}
        </div>
      </div>
      {!compact && (
        <p id={`${id}-description`} className={styles.description}>
          Device follows your device’s appearance. Your choice is remembered in this browser.
        </p>
      )}
    </fieldset>
  );
}
