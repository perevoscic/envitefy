export const INSTALL_TOAST_DISMISSED_KEY = "pwa-install-dismissed";
const DISMISSAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const dismissedUntilByWindow = new WeakMap<Window, number>();
const STORAGE_NAMES = ["localStorage", "sessionStorage"] as const;

function writeDismissal(win: Window, dismissedUntil: number) {
  dismissedUntilByWindow.set(win, dismissedUntil);
  for (const storageName of STORAGE_NAMES) {
    try {
      win[storageName].setItem(INSTALL_TOAST_DISMISSED_KEY, String(dismissedUntil));
    } catch {
      // Each storage type can fail independently; memory still covers remounts.
    }
  }
}

export function dismissInstallToast(win: Window, now = Date.now()): void {
  writeDismissal(win, now + DISMISSAL_DURATION_MS);
}

export function isInstallToastDismissed(win: Window, now = Date.now()): boolean {
  let dismissedUntil = dismissedUntilByWindow.get(win) ?? 0;
  const legacyStorageNames: (typeof STORAGE_NAMES)[number][] = [];

  for (const storageName of STORAGE_NAMES) {
    try {
      const storage = win[storageName];
      const value = storage.getItem(INSTALL_TOAST_DISMISSED_KEY);
      if (value === null) continue;
      if (value === "true") {
        legacyStorageNames.push(storageName);
        continue;
      }
      const storedUntil = Number(value);
      if (Number.isSafeInteger(storedUntil) && storedUntil > 0) {
        dismissedUntil = Math.max(dismissedUntil, storedUntil);
        if (storedUntil > now) continue;
      }
      storage.removeItem(INSTALL_TOAST_DISMISSED_KEY);
    } catch {
      // Continue to the other storage type and the in-memory fallback.
    }
  }

  if (legacyStorageNames.length > 0) {
    // The legacy boolean has no date. Start one finite cooldown, or retain an
    // existing expiry if a previous migration could only write to one store.
    if (dismissedUntil === 0) dismissedUntil = now + DISMISSAL_DURATION_MS;
    if (dismissedUntil > now) {
      writeDismissal(win, dismissedUntil);
    } else {
      let legacyRemovalFailed = false;
      for (const storageName of legacyStorageNames) {
        try {
          win[storageName].removeItem(INSTALL_TOAST_DISMISSED_KEY);
        } catch {
          legacyRemovalFailed = true;
        }
      }
      // A read-only legacy store must not restart the cooldown on each reload.
      if (legacyRemovalFailed) writeDismissal(win, dismissedUntil);
    }
  }

  if (dismissedUntil > 0) dismissedUntilByWindow.set(win, dismissedUntil);
  return dismissedUntil > now;
}
