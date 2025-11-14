"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { SidebarProvider } from "./sidebar-context";
import GlobalEventCreate from "./GlobalEventCreate";
import GlobalSmartSignup from "./GlobalSmartSignup";
import PwaInstallButton from "@/components/PwaInstallButton";
import { ThemeKey, ThemeVariant, resolveThemeCssVariables } from "@/themes";

const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

type SetThemeOptions = {
  persist?: boolean;
};

type ThemeContextValue = {
  theme: ThemeVariant;
  themeKey: ThemeKey;
  setTheme: (variant: ThemeVariant, options?: SetThemeOptions) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

type ThemeProviderProps = {
  children: ReactNode;
  initialTheme?: ThemeVariant;
};

function applyCssVariables(themeKey: ThemeKey, variant: ThemeVariant) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const tokens = resolveThemeCssVariables(themeKey, variant);
  for (const [cssVar, value] of Object.entries(tokens)) {
    root.style.setProperty(cssVar, value);
  }
  root.setAttribute("data-theme", `${themeKey}-${variant}`);
  root.setAttribute("data-theme-key", themeKey);
  root.classList.toggle("dark", variant === "dark");
  root.style.colorScheme = variant;
}

function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  const themeKey: ThemeKey = "general";
  const [theme, setThemeState] = useState<ThemeVariant>(
    initialTheme ?? "light"
  );
  const [isThemeHydrated, setIsThemeHydrated] = useState(
    initialTheme !== undefined
  );
  const setThemeCookie = useCallback((value: ThemeVariant | null) => {
    if (typeof document === "undefined") return;
    try {
      if (value) {
        document.cookie = `theme=${value}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
      } else {
        document.cookie = "theme=; path=/; max-age=0; SameSite=Lax";
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("theme") as ThemeVariant | null;

    if (stored === "light" || stored === "dark") {
      setThemeState(stored);
      setIsThemeHydrated(true);
      setThemeCookie(stored);
      return;
    }

    if (initialTheme === "light" || initialTheme === "dark") {
      setThemeState(initialTheme);
      setIsThemeHydrated(true);
      setThemeCookie(initialTheme);
      return;
    }

    setThemeCookie(null);
    setThemeState("light");
    setIsThemeHydrated(true);
  }, [initialTheme, setThemeCookie]);

  useEffect(() => {
    if (!isThemeHydrated) return;
    applyCssVariables(themeKey, theme);
  }, [themeKey, theme, isThemeHydrated]);

  const setTheme = useCallback(
    (variant: ThemeVariant, options?: SetThemeOptions) => {
      const persist = options?.persist ?? true;
      setThemeState(variant);
      if (persist) {
        try {
          window.localStorage.setItem("theme", variant);
        } catch {}
        setThemeCookie(variant);
      } else {
        try {
          window.localStorage.removeItem("theme");
        } catch {}
        setThemeCookie(null);
      }
      setIsThemeHydrated(true);
    },
    [setThemeCookie]
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      themeKey,
      setTheme,
      toggleTheme,
    }),
    [theme, themeKey, setTheme, toggleTheme]
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

export default function Providers({
  children,
  session,
  initialTheme,
}: {
  children: ReactNode;
  session?: Session | null;
  initialTheme?: ThemeVariant;
}) {
  const pathname = usePathname();
  const installStartExpanded = pathname?.startsWith("/landing") ?? false;

  return (
    <SessionProvider session={session}>
      <SidebarProvider>
        <ThemeProvider
          initialTheme={initialTheme}
        >
          <RegisterServiceWorker />
          {children}
          <GlobalEventCreate />
          <GlobalSmartSignup />
          <PwaInstallButton startExpanded={installStartExpanded} />
        </ThemeProvider>
      </SidebarProvider>
    </SessionProvider>
  );
}

function RegisterServiceWorker() {
  useEffect(() => {
    const pushDebug = (message: string, meta?: Record<string, unknown>) => {
      try {
        const w = window as any;
        const payload = { message, meta: meta ?? null, ts: Date.now() };
        if (!Array.isArray(w.__snapInstallDebugLog)) {
          w.__snapInstallDebugLog = [];
        }
        w.__snapInstallDebugLog.push(payload);
      } catch {
        // ignore
      }
    };

    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV !== "production"
    ) {
      try {
        if (
          "serviceWorker" in navigator &&
          navigator.serviceWorker.getRegistrations
        ) {
          navigator.serviceWorker.getRegistrations().then((regs) => {
            regs.forEach((reg) => {
              try {
                reg.unregister();
              } catch {}
            });
          });
        }
        pushDebug("dev-mode unregistering existing SWs");
      } catch {}
      return;
    }
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;
    let hasRegistered = false;
    let idleHandle: number | null = null;
    let controllerCleanup: (() => void) | null = null;

    const setupControllerReload = () => {
      const nav = navigator.serviceWorker;
      if (!nav) return null;
      if (nav.controller) {
        try {
          sessionStorage.removeItem("__snap_sw_reloaded__");
        } catch {
          // ignore
        }
        pushDebug("sw already controlling page");
        return null;
      }
      let alreadyReloaded = false;
      try {
        alreadyReloaded =
          sessionStorage.getItem("__snap_sw_reloaded__") === "1";
      } catch {
        // ignore
      }
      if (alreadyReloaded) return null;
      const onControllerChange = () => {
        pushDebug("sw controllerchange -> hard reload");
        try {
          nav.removeEventListener("controllerchange", onControllerChange);
        } catch {
          // ignore
        }
        if (process.env.NODE_ENV === "production") {
          // eslint-disable-next-line no-console
          console.info("[sw] controller change detected; reloading");
        }
        try {
          sessionStorage.setItem("__snap_sw_reloaded__", "1");
        } catch {
          // ignore
        }
        window.location.reload();
      };
      try {
        nav.addEventListener("controllerchange", onControllerChange);
      } catch {
        return null;
      }
      return () => {
        try {
          nav.removeEventListener("controllerchange", onControllerChange);
        } catch {
          // ignore
        }
      };
    };

    const clearIdleHandle = () => {
      if (idleHandle === null) return;
      const anyWindow = window as any;
      if (typeof anyWindow.cancelIdleCallback === "function") {
        anyWindow.cancelIdleCallback(idleHandle);
      } else {
        window.clearTimeout(idleHandle);
      }
      idleHandle = null;
    };

    const register = async () => {
      if (cancelled || hasRegistered) return;
      hasRegistered = true;
      try {
        pushDebug("attempting sw register");
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        pushDebug("sw registered", { scope: registration.scope });
        controllerCleanup = setupControllerReload();
      } catch (e) {
        // Allow a subsequent attempt (e.g., after load) if registration fails.
        pushDebug("sw registration failed", {
          error: e instanceof Error ? e.message : String(e),
        });
        hasRegistered = false;
      } finally {
        clearIdleHandle();
      }
    };

    const scheduleIdleRegistration = () => {
      if (idleHandle !== null) return;
      const anyWindow = window as any;
      if (typeof anyWindow.requestIdleCallback === "function") {
        idleHandle = anyWindow.requestIdleCallback(
          () => {
            idleHandle = null;
            register();
          },
          { timeout: 1500 }
        );
      } else {
        idleHandle = window.setTimeout(() => {
          idleHandle = null;
          register();
        }, 200);
      }
    };

    scheduleIdleRegistration();

    const onLoad = () => {
      pushDebug("window load -> forcing sw register");
      register();
    };

    if (document.readyState === "complete") {
      pushDebug("document already complete -> immediate sw register");
      register();
    } else {
      window.addEventListener("load", onLoad, { once: true });
    }

    return () => {
      cancelled = true;
      clearIdleHandle();
      window.removeEventListener("load", onLoad);
      if (controllerCleanup) {
        controllerCleanup();
        controllerCleanup = null;
      }
    };
  }, []);
  return null;
}
