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
import { SidebarProvider } from "./sidebar-context";
import GlobalEventCreate from "./GlobalEventCreate";
import PwaInstallButton from "@/components/PwaInstallButton";

type Theme = "light" | "dark";

const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

type ThemeProviderProps = {
  children: ReactNode;
  initialTheme?: Theme;
};

function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(initialTheme ?? "light");
  const [isThemeHydrated, setIsThemeHydrated] = useState(
    initialTheme !== undefined
  );
  // Track whether the user explicitly chose a theme. If false, we follow system.
  const [userPrefersExplicitTheme, setUserPrefersExplicitTheme] = useState(
    initialTheme !== undefined
  );
  const mediaQueryRef = useRef<MediaQueryList | null>(null);
  const mediaListenerRef = useRef<((e: MediaQueryListEvent) => void) | null>(
    null
  );

  const setThemeCookie = useCallback((value: Theme | null) => {
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
    const stored = window.localStorage.getItem("theme") as Theme | null;
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
      // No explicit user preference → follow system and react to changes.
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
        // Safari <14 fallback
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
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  }, [theme, isThemeHydrated]);

  // If we were following system and the user now makes a choice, stop following system.
  useEffect(() => {
    if (userPrefersExplicitTheme) {
      // Remove system listener if attached
      if (mediaQueryRef.current && mediaListenerRef.current) {
        try {
          mediaQueryRef.current.removeEventListener(
            "change",
            mediaListenerRef.current
          );
        } catch {
          (mediaQueryRef.current as any).removeListener(
            mediaListenerRef.current
          );
        }
        mediaListenerRef.current = null;
      }
    }
  }, [userPrefersExplicitTheme]);

  const applyUserTheme = (next: Theme) => {
    setUserPrefersExplicitTheme(true);
    setThemeState(next);
    try {
      window.localStorage.setItem("theme", next);
    } catch {}
    setThemeCookie(next);
    setIsThemeHydrated(true);
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: applyUserTheme,
      toggleTheme: () => applyUserTheme(theme === "light" ? "dark" : "light"),
    }),
    [theme]
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
  initialTheme?: Theme;
}) {
  return (
    <SessionProvider session={session}>
      <SidebarProvider>
        <ThemeProvider initialTheme={initialTheme}>
          <RegisterServiceWorker />
          {children}
          <GlobalEventCreate />
          <PwaInstallButton />
        </ThemeProvider>
      </SidebarProvider>
    </SessionProvider>
  );
}

function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch (e) {
        // noop
      }
    };
    const idle =
      (self as any).requestIdleCallback || ((fn: any) => setTimeout(fn, 100));
    idle(register);
  }, []);
  return null;
}
