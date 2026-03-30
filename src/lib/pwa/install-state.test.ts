import test from "node:test";
import assert from "node:assert/strict";
import {
  getInitialInstalledAppState,
  INSTALLED_FLAG_KEY,
  LEGACY_INSTALLED_FLAG_KEY,
  markInstalledInStorage,
  resolveInstalledAppState,
} from "./install-state.ts";

type MockWindowOptions = {
  stored?: Record<string, string>;
  standalone?: boolean;
  userAgent?: string;
  referrer?: string;
  mediaMatches?: Record<string, boolean>;
  relatedApps?: unknown[] | null;
  relatedAppsError?: string | null;
};

const createStorage = (seed: Record<string, string> = {}) => {
  const values = new Map(Object.entries(seed));
  return {
    getItem(key: string) {
      return values.has(key) ? values.get(key) ?? null : null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
};

const createMockWindow = (options: MockWindowOptions = {}) => {
  const storage = createStorage(options.stored);
  const mediaMatches = options.mediaMatches ?? {};
  const navigatorValue: Record<string, unknown> = {
    userAgent: options.userAgent ?? "",
    standalone: options.standalone ?? false,
  };

  if (options.relatedApps !== null) {
    navigatorValue.getInstalledRelatedApps = async () => {
      if (options.relatedAppsError) {
        throw new Error(options.relatedAppsError);
      }
      return options.relatedApps ?? [];
    };
  }

  return {
    localStorage: storage,
    navigator: navigatorValue,
    document: {
      referrer: options.referrer ?? "",
    },
    matchMedia(query: string) {
      return {
        matches: Boolean(mediaMatches[query]),
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
      };
    },
  } as any;
};

test("detects the new installed storage flag immediately", () => {
  const win = createMockWindow({
    stored: { [INSTALLED_FLAG_KEY]: "1" },
    relatedApps: null,
  });

  const state = getInitialInstalledAppState(win);

  assert.equal(state.status, "installed");
  assert.equal(state.signal, "storage");
});

test("detects the legacy installed storage flag immediately", () => {
  const win = createMockWindow({
    stored: { [LEGACY_INSTALLED_FLAG_KEY]: "1" },
    relatedApps: null,
  });

  const state = getInitialInstalledAppState(win);

  assert.equal(state.status, "installed");
  assert.equal(state.signal, "legacy-storage");
});

test("detects standalone display mode immediately", () => {
  const win = createMockWindow({
    mediaMatches: {
      "(display-mode: standalone)": true,
    },
    relatedApps: null,
  });

  const state = getInitialInstalledAppState(win);

  assert.equal(state.status, "installed");
  assert.equal(state.signal, "display-mode-standalone");
});

test("detects Android standalone referrer immediately", () => {
  const win = createMockWindow({
    userAgent: "Mozilla/5.0 (Linux; Android 14)",
    referrer: "android-app://com.android.chrome",
    relatedApps: null,
  });

  const state = getInitialInstalledAppState(win);

  assert.equal(state.status, "installed");
  assert.equal(state.signal, "android-referrer");
});

test("returns checking first when installed-related-apps must be queried", () => {
  const win = createMockWindow({
    relatedApps: [],
  });

  const state = getInitialInstalledAppState(win);

  assert.equal(state.status, "checking");
  assert.equal(state.signal, "related-apps");
});

test("resolves installed when related apps are present", async () => {
  const win = createMockWindow({
    relatedApps: [{ id: "envitefy" }],
  });

  const state = await resolveInstalledAppState(win);

  assert.equal(state.status, "installed");
  assert.equal(state.signal, "related-apps");
  assert.deepEqual(state.meta, { count: 1 });
});

test("resolves not_installed when related apps are absent", async () => {
  const win = createMockWindow({
    relatedApps: [],
  });

  const state = await resolveInstalledAppState(win);

  assert.equal(state.status, "not_installed");
  assert.equal(state.signal, "related-apps");
  assert.deepEqual(state.meta, { count: 0 });
});

test("writes both install persistence keys", () => {
  const win = createMockWindow({
    relatedApps: null,
  });

  markInstalledInStorage(win);

  assert.equal(win.localStorage.getItem(INSTALLED_FLAG_KEY), "1");
  assert.equal(win.localStorage.getItem(LEGACY_INSTALLED_FLAG_KEY), "1");
});
