import assert from "node:assert/strict";
import test from "node:test";
import {
  dismissInstallToast,
  isInstallToastDismissed,
} from "./install-toast-dismissal.ts";

const KEY = "pwa-install-dismissed";
const WEEK = 7 * 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 24, 12);

function createStorage(seed: Record<string, string> = {}) {
  const values = new Map(Object.entries(seed));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

type TestStorage = ReturnType<typeof createStorage>;

function createWindow(
  localStorage: TestStorage | null = createStorage(),
  sessionStorage: TestStorage | null = createStorage(),
) {
  return Object.defineProperties({}, {
    localStorage: { get() { if (!localStorage) throw new Error("Local storage blocked"); return localStorage; } },
    sessionStorage: { get() { if (!sessionStorage) throw new Error("Session storage blocked"); return sessionStorage; } },
  }) as Window;
}

test("dismissal lasts seven days across reloads and separate browser sessions", () => {
  const local = createStorage();
  const session = createStorage();
  const original = createWindow(local, session);
  assert.equal(isInstallToastDismissed(original, NOW), false);

  dismissInstallToast(original, NOW);
  assert.equal(local.getItem(KEY), String(NOW + WEEK));
  assert.equal(session.getItem(KEY), String(NOW + WEEK));
  assert.equal(isInstallToastDismissed(original, NOW + 1), true);
  assert.equal(isInstallToastDismissed(createWindow(local, session), NOW + 1000), true);
  assert.equal(isInstallToastDismissed(createWindow(local), NOW + WEEK - 1), true);
});

test("dismissal expires at the stored deadline and cleans up both stores", () => {
  const local = createStorage();
  const session = createStorage();
  const win = createWindow(local, session);
  dismissInstallToast(win, NOW);

  assert.equal(isInstallToastDismissed(win, NOW + WEEK), false);
  assert.equal(local.getItem(KEY), null);
  assert.equal(session.getItem(KEY), null);
  assert.equal(isInstallToastDismissed(createWindow(local, session), NOW + WEEK + 1), false);
});

test("legacy boolean migrates once to a finite deadline that reloads retain", () => {
  const local = createStorage({ [KEY]: "true" });
  const session = createStorage();
  assert.equal(isInstallToastDismissed(createWindow(local, session), NOW), true);
  assert.equal(local.getItem(KEY), String(NOW + WEEK));
  assert.equal(session.getItem(KEY), String(NOW + WEEK));
  assert.equal(isInstallToastDismissed(createWindow(local), NOW + 1000), true);
  assert.equal(local.getItem(KEY), String(NOW + WEEK));
  assert.equal(isInstallToastDismissed(createWindow(local), NOW + WEEK), false);
});

test("invalid and expired stored values never suppress the prompt", () => {
  for (const value of ["", "false", "not-a-date", "NaN", "Infinity", "-1", "1.5", String(Number.MAX_SAFE_INTEGER + 1), String(NOW - 1)]) {
    const local = createStorage({ [KEY]: value });
    const session = createStorage({ [KEY]: value });
    assert.equal(isInstallToastDismissed(createWindow(local, session), NOW), false, value);
    assert.equal(local.getItem(KEY), null, value);
    assert.equal(session.getItem(KEY), null, value);
  }
});

test("session storage preserves dismissal through reload when local storage is blocked", () => {
  const session = createStorage();
  dismissInstallToast(createWindow(null, session), NOW);
  assert.equal(session.getItem(KEY), String(NOW + WEEK));
  assert.equal(isInstallToastDismissed(createWindow(null, session), NOW + 1), true);
  assert.equal(isInstallToastDismissed(createWindow(null, session), NOW + WEEK), false);
});

test("blocked session storage does not prevent durable local dismissal", () => {
  const local = createStorage();
  dismissInstallToast(createWindow(local, null), NOW);
  assert.equal(isInstallToastDismissed(createWindow(local, null), NOW + 1), true);
});

test("storage method failures independently fall back to session storage", () => {
  const local = {
    getItem() { throw new Error("Read blocked"); },
    setItem() { throw new Error("Write blocked"); },
    removeItem() { throw new Error("Remove blocked"); },
  };
  const session = createStorage();
  dismissInstallToast(createWindow(local, session), NOW);
  assert.equal(isInstallToastDismissed(createWindow(local, session), NOW + 1), true);
});

test("memory suppresses remounts with both stores blocked without leaking across windows", () => {
  const win = createWindow(null, null);
  assert.equal(isInstallToastDismissed(win, NOW), false);
  dismissInstallToast(win, NOW);
  assert.equal(isInstallToastDismissed(win, NOW + 1), true);
  assert.equal(isInstallToastDismissed(createWindow(null, null), NOW + 1), false);
  assert.equal(isInstallToastDismissed(win, NOW + WEEK), false);
});

test("a partially migrated read-only legacy flag cannot restart an expired cooldown", () => {
  const local = {
    getItem() { return "true"; },
    setItem() { throw new Error("Write blocked"); },
    removeItem() { throw new Error("Remove blocked"); },
  };
  const session = createStorage();
  assert.equal(isInstallToastDismissed(createWindow(local, session), NOW), true);
  const reloaded = createWindow(local, session);
  assert.equal(isInstallToastDismissed(reloaded, NOW + WEEK), false);
  assert.equal(isInstallToastDismissed(reloaded, NOW + WEEK + 1), false);
  assert.equal(isInstallToastDismissed(createWindow(local, session), NOW + WEEK + 2), false);
});
