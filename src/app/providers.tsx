"use client";

import { SessionProvider, useSession } from "next-auth/react";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarProvider } from "./sidebar-context";
import GlobalEventCreate from "./GlobalEventCreate";
import GlobalSmartSignup from "./GlobalSmartSignup";
import GoogleAnalyticsRouteTracker from "@/components/GoogleAnalyticsRouteTracker";
import PwaInstallToast from "@/components/PwaInstallToast";
import ThemeColorSync from "@/components/ThemeColorSync";
import { ThemeKey, ThemeVariant, resolveThemeCssVariables } from "@/themes";

type ThemeContextValue = {
  theme: ThemeVariant;
  themeKey: ThemeKey;
  setTheme: (variant: ThemeVariant) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const GYMNASTICS_DEMO_DRAFT_STORAGE_KEY =
  "envitefy:gymnastics-demo-draft:v1";

type ThemeProviderProps = {
  children: ReactNode;
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
  root.classList.remove("dark");
  root.style.colorScheme = "light";
}

function ThemeProvider({ children }: ThemeProviderProps) {
  const themeKey: ThemeKey = "general";
  const theme: ThemeVariant = "light";

  useEffect(() => {
    applyCssVariables(themeKey, theme);
  }, [themeKey, theme]);

  const setTheme = useCallback((_variant: ThemeVariant) => {}, []);

  const toggleTheme = useCallback(() => {}, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      themeKey,
      setTheme,
      toggleTheme,
    }),
    [themeKey, setTheme, toggleTheme]
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
  session = null,
}: {
  children: ReactNode;
  session?: any;
}) {
  return (
    <SessionProvider
      session={session}
      refetchOnWindowFocus={process.env.NODE_ENV === "production"}
    >
      <SidebarProvider>
        <ThemeProvider>
          <RegisterServiceWorker />
          <GoogleAnalyticsRouteTracker />
          <PwaInstallToast />
          <ThemeColorSync />
          <GymnasticsDemoDraftClaimListener />
          {children}
          <GlobalEventCreate />
          <GlobalSmartSignup />
        </ThemeProvider>
      </SidebarProvider>
    </SessionProvider>
  );
}

function GymnasticsDemoDraftClaimListener() {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const claimedEventIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (typeof window === "undefined") return;

    const raw = window.localStorage.getItem(
      GYMNASTICS_DEMO_DRAFT_STORAGE_KEY
    );
    const eventId = typeof raw === "string" ? raw.trim() : "";
    if (!eventId) return;
    if (claimedEventIdRef.current === eventId) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/history/${encodeURIComponent(eventId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ claim: true }),
        });
        if (cancelled) return;
        if (!res.ok) {
          if (res.status === 403 || res.status === 404) {
            window.localStorage.removeItem(GYMNASTICS_DEMO_DRAFT_STORAGE_KEY);
          }
          return;
        }

        claimedEventIdRef.current = eventId;
        window.localStorage.removeItem(GYMNASTICS_DEMO_DRAFT_STORAGE_KEY);
        const targetUrl = `/event/gymnastics/customize?edit=${encodeURIComponent(
          eventId
        )}`;
        if (pathname !== targetUrl) {
          router.replace(targetUrl);
        }
      } catch {
        // Retry on the next authenticated render if the network is transiently unavailable.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router, status]);

  return null;
}

function RegisterServiceWorker() {
  useEffect(() => {
    const DEBUG_STORE_KEY = "__snapInstallDebugLog";
    const MAX_DEBUG_ENTRIES = 50;
    const pushDebug = (message: string, meta?: Record<string, unknown>) => {
      try {
        const w = window as any;
        const payload = { message, meta: meta ?? null, ts: Date.now() };
        if (!Array.isArray(w[DEBUG_STORE_KEY])) {
          w[DEBUG_STORE_KEY] = [];
        }
        w[DEBUG_STORE_KEY].push(payload);
        if (w[DEBUG_STORE_KEY].length > MAX_DEBUG_ENTRIES) {
          w[DEBUG_STORE_KEY].splice(
            0,
            w[DEBUG_STORE_KEY].length - MAX_DEBUG_ENTRIES
          );
        }
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
