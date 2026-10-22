"use client";

import { Moon, Sun } from "lucide-react";
import { useId } from "react";
import { useTheme } from "@/components/AppearanceProvider";
import styles from "./appearance-selector.module.css";

export default function AppearanceSelector({ compact = false }: { compact?: boolean }) {
  const { theme, setPreference } = useTheme();
  const id = useId();
  const isDark = theme === "dark";
  return (
    <fieldset
      className={`appearance-selector ${styles.selector} ${compact ? styles.compact : ""}`}
      aria-describedby={compact ? undefined : `${id}-description`}
    >
      <legend className={compact ? "sr-only" : styles.label}>Appearance</legend>
      <div className={styles.controls}>
        <button
          type="button"
          role="switch"
          aria-label="Dark mode"
          aria-checked={isDark}
          data-state={isDark ? "checked" : "unchecked"}
          title={isDark ? "Use light theme" : "Use dark theme"}
          className={styles.switch}
          onClick={() => setPreference(isDark ? "light" : "dark")}
        >
          <span className={styles.track} aria-hidden="true">
            <span className={styles.thumb} />
            <span className={styles.sun}>
              <Sun size={14} strokeWidth={1.75} />
            </span>
            <span className={styles.moon}>
              <Moon size={14} strokeWidth={1.75} />
            </span>
          </span>
        </button>
      </div>
      {!compact && (
        <p id={`${id}-description`} className={styles.description}>
          Follows your device’s appearance until you choose a theme. Your choice is remembered in
          this browser.
        </p>
      )}
    </fieldset>
  );
}
