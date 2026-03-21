"use client";

const LOCAL_STORAGE_KEYS = new Set([
  "categoryColors",
  "signupItemColors",
  "welcomeAfterSignup",
  "envitefy:dashboard:last-origin:v1",
  "envitefy:event-actions:calendar-default:v1",
  "envitefy:snap:auto-add:v1",
  "pwa-install-dismissed",
]);

const SESSION_STORAGE_KEYS = new Set([
  "__snap_sw_reloaded__",
]);

const STORAGE_PREFIXES = [
  "envitefy:",
  "profile-cache:",
  "sidebar:",
  "snapmydate:",
];

function clearMatchingStorage(storage: Storage, exactKeys: Set<string>) {
  const keysToRemove: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key) continue;
    if (exactKeys.has(key) || STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      keysToRemove.push(key);
    }
  }
  for (const key of keysToRemove) {
    storage.removeItem(key);
  }
}

export function clearAppBrowserState() {
  if (typeof window === "undefined") return;
  try {
    clearMatchingStorage(window.localStorage, LOCAL_STORAGE_KEYS);
  } catch {
    // Ignore storage access failures.
  }
  try {
    clearMatchingStorage(window.sessionStorage, SESSION_STORAGE_KEYS);
  } catch {
    // Ignore storage access failures.
  }
}
