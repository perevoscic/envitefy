import { useCallback, useEffect, useState } from "react";

export const INSTALLED_FLAG_KEY = "envitefy:pwa-installed";
export const LEGACY_INSTALLED_FLAG_KEY = "snapmydate:pwa-installed";

type InstallStatus = "checking" | "installed" | "not_installed";
type InstallSignal =
  | "storage"
  | "legacy-storage"
  | "navigator-standalone"
  | "display-mode-standalone"
  | "display-mode-fullscreen"
  | "display-mode-minimal-ui"
  | "android-referrer"
  | "related-apps"
  | "related-apps-error"
  | "appinstalled"
  | "accepted"
  | "none";

export type InstalledAppState = {
  status: InstallStatus;
  signal: InstallSignal | null;
  meta: Record<string, unknown> | null;
};

type InstallDebugLogger = (
  message: string,
  meta?: Record<string, unknown>
) => void;

type MediaModeConfig = {
  query: string;
  signal: Extract<
    InstallSignal,
    | "display-mode-standalone"
    | "display-mode-fullscreen"
    | "display-mode-minimal-ui"
  >;
};

const DISPLAY_MODE_CONFIGS: MediaModeConfig[] = [
  {
    query: "(display-mode: standalone)",
    signal: "display-mode-standalone",
  },
  {
    query: "(display-mode: fullscreen)",
    signal: "display-mode-fullscreen",
  },
  {
    query: "(display-mode: minimal-ui)",
    signal: "display-mode-minimal-ui",
  },
];

const CHECKING_STATE: InstalledAppState = {
  status: "checking",
  signal: null,
  meta: null,
};

const createState = (
  status: InstallStatus,
  signal: InstallSignal | null,
  meta?: Record<string, unknown> | null
): InstalledAppState => ({
  status,
  signal,
  meta: meta ?? null,
});

const getStoredInstallState = (win: Window): InstalledAppState | null => {
  try {
    if (win.localStorage.getItem(INSTALLED_FLAG_KEY) === "1") {
      return createState("installed", "storage");
    }
    if (win.localStorage.getItem(LEGACY_INSTALLED_FLAG_KEY) === "1") {
      return createState("installed", "legacy-storage");
    }
  } catch {
    // ignore storage access failures
  }
  return null;
};

const getDisplayModeInstallState = (win: Window): InstalledAppState | null => {
  if (!win.matchMedia) return null;
  for (const { query, signal } of DISPLAY_MODE_CONFIGS) {
    try {
      if (win.matchMedia(query).matches) {
        return createState("installed", signal);
      }
    } catch {
      // ignore matchMedia failures for individual queries
    }
  }
  return null;
};

const hasInstalledRelatedAppsApi = (win: Window): boolean =>
  typeof (win.navigator as any)?.getInstalledRelatedApps === "function";

export const getInitialInstalledAppState = (
  win?: Window
): InstalledAppState => {
  if (!win) return CHECKING_STATE;

  const storedState = getStoredInstallState(win);
  if (storedState) return storedState;

  try {
    if ((win.navigator as any).standalone === true) {
      return createState("installed", "navigator-standalone");
    }
  } catch {
    // ignore navigator access failure
  }

  const displayModeState = getDisplayModeInstallState(win);
  if (displayModeState) return displayModeState;

  try {
    const isAndroid = /Android/i.test(win.navigator.userAgent || "");
    if (isAndroid) {
      const referrer = win.document.referrer || "";
      if (
        referrer.startsWith("android-app://") ||
        referrer.startsWith("chrome-extension://")
      ) {
        return createState("installed", "android-referrer", {
          referrer,
        });
      }
    }
  } catch {
    // ignore document or navigator access failure
  }

  if (hasInstalledRelatedAppsApi(win)) {
    return createState("checking", "related-apps");
  }

  return createState("not_installed", "none");
};

export const resolveInstalledAppState = async (
  win?: Window
): Promise<InstalledAppState> => {
  if (!win) return CHECKING_STATE;

  const initialState = getInitialInstalledAppState(win);
  if (initialState.status !== "checking") {
    return initialState;
  }

  try {
    const related = await (win.navigator as any).getInstalledRelatedApps();
    if (Array.isArray(related) && related.length > 0) {
      return createState("installed", "related-apps", {
        count: related.length,
      });
    }
    return createState("not_installed", "related-apps", {
      count: Array.isArray(related) ? related.length : 0,
    });
  } catch (error) {
    return createState("not_installed", "related-apps-error", {
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

export const markInstalledInStorage = (win?: Window) => {
  if (!win) return;
  try {
    win.localStorage.setItem(INSTALLED_FLAG_KEY, "1");
    win.localStorage.setItem(LEGACY_INSTALLED_FLAG_KEY, "1");
  } catch {
    // ignore storage access failures
  }
};

const installStatesEqual = (
  left: InstalledAppState,
  right: InstalledAppState
): boolean =>
  left.status === right.status &&
  left.signal === right.signal &&
  JSON.stringify(left.meta ?? null) === JSON.stringify(right.meta ?? null);

const getDisplayModeQueries = (win: Window) =>
  DISPLAY_MODE_CONFIGS.map(({ query }) => {
    try {
      return win.matchMedia(query);
    } catch {
      return null;
    }
  }).filter(Boolean) as MediaQueryList[];

export const useInstalledAppState = (debug?: InstallDebugLogger) => {
  const [installState, setInstallState] = useState<InstalledAppState>(() =>
    getInitialInstalledAppState(
      typeof window === "undefined" ? undefined : window
    )
  );

  const applyInstallState = useCallback(
    (nextState: InstalledAppState, reason: string) => {
      setInstallState((currentState) =>
        installStatesEqual(currentState, nextState) ? currentState : nextState
      );
      debug?.("install state updated", {
        reason,
        status: nextState.status,
        signal: nextState.signal,
        ...(nextState.meta ?? {}),
      });
      return nextState;
    },
    [debug]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    let requestId = 0;

    const refreshInstallState = async (reason: string) => {
      const immediateState = getInitialInstalledAppState(window);
      if (immediateState.status !== "checking") {
        applyInstallState(immediateState, reason);
        return;
      }

      applyInstallState(immediateState, `${reason}:checking`);
      const currentRequestId = ++requestId;
      const resolvedState = await resolveInstalledAppState(window);
      if (cancelled || currentRequestId !== requestId) return;
      applyInstallState(resolvedState, `${reason}:resolved`);
    };

    void refreshInstallState("mount");

    const mediaQueries = getDisplayModeQueries(window);
    const onDisplayModeChange = () => {
      void refreshInstallState("display-mode-change");
    };
    const onFocus = () => {
      void refreshInstallState("focus");
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshInstallState("visibilitychange");
      }
    };
    const onInstalled = () => {
      markInstalledInStorage(window);
      applyInstallState(createState("installed", "appinstalled"), "appinstalled");
    };

    for (const mediaQuery of mediaQueries) {
      try {
        mediaQuery.addEventListener("change", onDisplayModeChange);
      } catch {
        (mediaQuery as any).addListener?.(onDisplayModeChange);
      }
    }

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      cancelled = true;
      for (const mediaQuery of mediaQueries) {
        try {
          mediaQuery.removeEventListener("change", onDisplayModeChange);
        } catch {
          (mediaQuery as any).removeListener?.(onDisplayModeChange);
        }
      }
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [applyInstallState]);

  const markInstalled = useCallback(
    (reason: string, meta?: Record<string, unknown>) => {
      if (typeof window !== "undefined") {
        markInstalledInStorage(window);
      }
      return applyInstallState(createState("installed", "accepted", meta), reason);
    },
    [applyInstallState]
  );

  return { installState, markInstalled };
};
