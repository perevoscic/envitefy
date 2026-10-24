"use client";

import { Moon, Sun } from "lucide-react";
import { useId, useSyncExternalStore } from "react";
import { useTheme } from "@/components/AppearanceProvider";
import styles from "./appearance-selector.module.css";

const subscribeToHydration = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function AppearanceSelector({ compact = false }: { compact?: boolean }) {
  const { theme, setPreference } = useTheme();
  const id = useId();
  // A deferred page may hydrate after the provider has resolved browser appearance.
  const hydrated = useSyncExternalStore(subscribeToHydration, getClientSnapshot, getServerSnapshot);
  const isDark = hydrated && theme === "dark";
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
