"use client";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import type { ReactNode } from "react";
import {
  createContext,
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

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function ThemeProvider({ children }: { children: ReactNode }) {
  // Ensure SSR and the first client render match by using a fixed initial value.
  // We then read the real preference on mount to avoid hydration mismatches.
  const [theme, setThemeState] = useState<Theme>("light");
  // Track whether the user explicitly chose a theme. If false, we follow system.
  const [userPrefersExplicitTheme, setUserPrefersExplicitTheme] =
    useState(false);
  const mediaQueryRef = useRef<MediaQueryList | null>(null);
  const mediaListenerRef = useRef<((e: MediaQueryListEvent) => void) | null>(
    null
  );

  useEffect(() => {
    const stored = window.localStorage.getItem("theme") as Theme | null;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQueryRef.current = mql;

    if (stored === "light" || stored === "dark") {
      setUserPrefersExplicitTheme(true);
      setThemeState(stored);
    } else {
      // No explicit user preference → follow system and react to changes.
      setUserPrefersExplicitTheme(false);
      setThemeState(mql.matches ? "dark" : "light");
      const onChange = (e: MediaQueryListEvent) => {
        setThemeState(e.matches ? "dark" : "light");
      };
      mediaListenerRef.current = onChange;
      try {
        mql.addEventListener("change", onChange);
      } catch {
        // Safari <14 fallback
        (mql as any).addListener(onChange);
      }
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
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

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
}: {
  children: ReactNode;
  session?: Session | null;
}) {
  return (
    <SessionProvider session={session}>
      <SidebarProvider>
        <ThemeProvider>
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
