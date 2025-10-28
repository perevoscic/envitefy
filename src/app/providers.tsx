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
import {
  ThemeKey,
  ThemeVariant,
  ThemeOverride,
  resolveThemeCssVariables,
  resolveThemeForDate,
  isValidThemeKey,
  isValidVariant,
} from "@/themes";

const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

type SetThemeOptions = {
  persist?: boolean;
  persistOverride?: boolean;
};

type SetThemeKeyOptions = {
  persist?: boolean;
  variant?: ThemeVariant;
  expiresAt?: string | null;
};

type ThemeContextValue = {
  theme: ThemeVariant;
  themeKey: ThemeKey;
  setTheme: (variant: ThemeVariant, options?: SetThemeOptions) => void;
  toggleTheme: () => void;
  setThemeKey: (key: ThemeKey, options?: SetThemeKeyOptions) => Promise<void>;
  isOverrideActive: boolean;
  override: ThemeOverride | null;
  clearOverride: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

type ThemeProviderProps = {
  children: ReactNode;
  initialTheme?: ThemeVariant;
  initialThemeKey: ThemeKey;
  scheduledThemeKey: ThemeKey;
  initialOverride?: ThemeOverride | null;
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

function ThemeProvider({
  children,
  initialTheme,
  initialThemeKey,
  scheduledThemeKey,
  initialOverride,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeVariant>(
    initialTheme ?? "light"
  );
  const [isThemeHydrated, setIsThemeHydrated] = useState(
    initialTheme !== undefined
  );
  const [userPrefersExplicitTheme, setUserPrefersExplicitTheme] = useState(
    initialTheme !== undefined
  );
  const [themeKey, setThemeKeyState] = useState<ThemeKey>(
    initialOverride?.themeKey ?? initialThemeKey
  );
  const [override, setOverride] = useState<ThemeOverride | null>(
    initialOverride ?? null
  );

  const scheduledThemeKeyRef = useRef<ThemeKey>(scheduledThemeKey);
  const mediaQueryRef = useRef<MediaQueryList | null>(null);
  const mediaListenerRef = useRef<((e: MediaQueryListEvent) => void) | null>(
    null
  );
  const scheduleIntervalRef = useRef<number | null>(null);

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

  const persistOverrideSelection = useCallback(
    async (
      payload: ThemeOverride & { expiresAt?: string | null }
    ): Promise<ThemeOverride | null> => {
      try {
        const res = await fetch("/api/admin/theme-override", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            themeKey: payload.themeKey,
            variant: payload.variant,
            expiresAt: payload.expiresAt ?? null,
          }),
        });
        if (!res.ok) return null;
        const json = (await res.json().catch(() => ({}))) as {
          override?: {
            themeKey?: string;
            variant?: string;
            expiresAt?: string | null;
          };
        };
        const next = json?.override;
        if (!next) return payload;
        const parsedKey = isValidThemeKey(next.themeKey)
          ? next.themeKey
          : payload.themeKey;
        const parsedVariant = isValidVariant(next.variant)
          ? next.variant
          : payload.variant;
        return {
          themeKey: parsedKey,
          variant: parsedVariant,
          expiresAt: next.expiresAt ?? null,
        };
      } catch {
        return null;
      }
    },
    []
  );

  const deleteOverrideOnServer = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/theme-override", {
        method: "DELETE",
        credentials: "same-origin",
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("theme") as ThemeVariant | null;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQueryRef.current = mql;

    if (stored === "light" || stored === "dark") {
      setUserPrefersExplicitTheme(true);
      setThemeState(stored);
      setIsThemeHydrated(true);
      setThemeCookie(stored);
    } else if (initialTheme === "light" || initialTheme === "dark") {
      setUserPrefersExplicitTheme(true);
      setThemeState(initialTheme);
      setIsThemeHydrated(true);
      setThemeCookie(initialTheme);
    } else {
      setUserPrefersExplicitTheme(false);
      setThemeCookie(null);
      setThemeState(mql.matches ? "dark" : "light");
      const onChange = (e: MediaQueryListEvent) => {
        setThemeCookie(null);
        setThemeState(e.matches ? "dark" : "light");
      };
      mediaListenerRef.current = onChange;
      try {
        mql.addEventListener("change", onChange);
      } catch {
        (mql as any).addListener(onChange);
      }
      setIsThemeHydrated(true);
    }

    return () => {
      if (!mediaQueryRef.current || !mediaListenerRef.current) return;
      try {
        mediaQueryRef.current.removeEventListener(
          "change",
          mediaListenerRef.current
        );
      } catch {
        (mediaQueryRef.current as any).removeListener(mediaListenerRef.current);
      }
      mediaListenerRef.current = null;
      mediaQueryRef.current = null;
    };
  }, [initialTheme, setThemeCookie]);

  useEffect(() => {
    if (!isThemeHydrated) return;
    applyCssVariables(themeKey, theme);
  }, [themeKey, theme, isThemeHydrated]);

  useEffect(() => {
    if (!userPrefersExplicitTheme) return;
    if (mediaQueryRef.current && mediaListenerRef.current) {
      try {
        mediaQueryRef.current.removeEventListener(
          "change",
          mediaListenerRef.current
        );
      } catch {
        (mediaQueryRef.current as any).removeListener(mediaListenerRef.current);
      }
      mediaListenerRef.current = null;
    }
  }, [userPrefersExplicitTheme]);

  useEffect(() => {
    scheduledThemeKeyRef.current = scheduledThemeKey;
    if (!override) {
      setThemeKeyState(scheduledThemeKey);
    }
  }, [scheduledThemeKey, override]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (override) return;
    const updateSchedule = () => {
      const nextKey = resolveThemeForDate(new Date());
      scheduledThemeKeyRef.current = nextKey;
      setThemeKeyState(nextKey);
    };
    updateSchedule();
    const id = window.setInterval(updateSchedule, 1000 * 60 * 30);
    scheduleIntervalRef.current = id;
    return () => {
      if (scheduleIntervalRef.current !== null) {
        window.clearInterval(scheduleIntervalRef.current);
      }
      scheduleIntervalRef.current = null;
    };
  }, [override]);

  const setTheme = useCallback(
    (variant: ThemeVariant, options?: SetThemeOptions) => {
      const persist = options?.persist ?? true;
      const persistOverride = options?.persistOverride ?? true;
      setUserPrefersExplicitTheme(true);
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

      if (override && persistOverride) {
        const payload: ThemeOverride = {
          themeKey: override.themeKey,
          variant,
          expiresAt: override.expiresAt ?? null,
        };
        void persistOverrideSelection(payload).then((result) => {
          if (result) setOverride(result);
        });
      }
    },
    [override, persistOverrideSelection, setThemeCookie]
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  const setThemeKey = useCallback(
    async (nextKey: ThemeKey, options?: SetThemeKeyOptions) => {
      const previousKey = themeKey;
      const previousOverride = override;
      setThemeKeyState(nextKey);

      if (options?.variant && options.variant !== theme) {
        setTheme(options.variant, {
          persist: options.persist ?? false,
          persistOverride: false,
        });
      }

      if (options?.persist) {
        const payload: ThemeOverride = {
          themeKey: nextKey,
          variant: options.variant ?? theme,
          expiresAt: options.expiresAt ?? override?.expiresAt ?? null,
        };
        setOverride(payload);
        const result = await persistOverrideSelection(payload);
        if (result) {
          setOverride(result);
          setThemeKeyState(result.themeKey);
          if (result.variant !== theme) {
            setTheme(result.variant, { persist: true, persistOverride: false });
          }
        } else {
          setOverride(previousOverride ?? null);
          setThemeKeyState(previousKey);
        }
      } else if (!override) {
        scheduledThemeKeyRef.current = nextKey;
      }
    },
    [override, persistOverrideSelection, theme, themeKey, setTheme]
  );

  const clearOverride = useCallback(async () => {
    const success = await deleteOverrideOnServer();
    if (success) {
      setOverride(null);
      const next =
        scheduledThemeKeyRef.current ?? resolveThemeForDate(new Date());
      setThemeKeyState(next);
    }
  }, [deleteOverrideOnServer]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      themeKey,
      setTheme,
      toggleTheme,
      setThemeKey,
      isOverrideActive: Boolean(override),
      override,
      clearOverride,
    }),
    [
      theme,
      themeKey,
      setTheme,
      toggleTheme,
      setThemeKey,
      override,
      clearOverride,
    ]
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
  initialThemeKey,
  scheduledThemeKey,
  initialOverride,
}: {
  children: ReactNode;
  session?: Session | null;
  initialTheme?: ThemeVariant;
  initialThemeKey: ThemeKey;
  scheduledThemeKey: ThemeKey;
  initialOverride?: ThemeOverride | null;
}) {
  const pathname = usePathname();
  const installStartExpanded = pathname?.startsWith("/landing") ?? false;

  return (
    <SessionProvider session={session}>
      <SidebarProvider>
        <ThemeProvider
          initialTheme={initialTheme}
          initialThemeKey={initialThemeKey}
          scheduledThemeKey={scheduledThemeKey}
          initialOverride={initialOverride}
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
      } catch {}
      return;
    }
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;
    let hasRegistered = false;
    let idleHandle: number | null = null;

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
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch (e) {
        // Allow a subsequent attempt (e.g., after load) if registration fails.
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
      register();
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", onLoad, { once: true });
    }

    return () => {
      cancelled = true;
      clearIdleHandle();
      window.removeEventListener("load", onLoad);
    };
  }, []);
  return null;
}
