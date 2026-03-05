"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  useMemo,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEventCategories } from "@/hooks/useEventCategories";
import { useFeatureVisibility } from "@/hooks/useFeatureVisibility";
import type { TemplateKey } from "@/config/feature-visibility";

type CalendarProviderKey = "google" | "microsoft" | "apple";
type SessionUserWithAdmin = {
  isAdmin?: boolean;
  name?: string | null;
  email?: string | null;
};

interface MenuContextValue {
  session: ReturnType<typeof useSession>["data"];
  status: ReturnType<typeof useSession>["status"];
  pathname: string | null;
  categories: ReturnType<typeof useEventCategories>["categories"];
  history: ReturnType<typeof useEventCategories>["history"];
  connectedCalendars: {
    google: boolean;
    microsoft: boolean;
    apple: boolean;
  };
  refreshConnectedCalendars: () => Promise<void>;
  handleCalendarConnect: (provider: CalendarProviderKey) => void;
  isAdmin: boolean;
  initials: string;
  displayName: string;
  visibleTemplateKeys: TemplateKey[];
  featureVisibility: ReturnType<typeof useFeatureVisibility>;
}

const MenuContext = createContext<MenuContextValue | null>(null);

export function MenuProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const { categories, history } = useEventCategories();
  const featureVisibility = useFeatureVisibility();
  const { visibleTemplateKeys } = featureVisibility;

  const [connectedCalendars, setConnectedCalendars] = useState<{
    google: boolean;
    microsoft: boolean;
    apple: boolean;
  }>({
    google: false,
    microsoft: false,
    apple: false,
  });

  const sessionUser = (session?.user || null) as SessionUserWithAdmin | null;
  const isAdmin = Boolean(sessionUser?.isAdmin);

  const displayName = sessionUser?.name || sessionUser?.email || "User";

  const initials = useMemo(() => {
    if (!displayName) return "?";
    const parts = displayName.split(" ").filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    const first = parts[0][0];
    const last = parts[parts.length - 1][0];
    return (first + last).toUpperCase();
  }, [displayName]);

  const fetchConnectedCalendars = useCallback(async () => {
    try {
      const res = await fetch("/api/calendars", { credentials: "include" });
      if (!res.ok) {
        console.warn(`[menu-context] /api/calendars returned status ${res.status}`);
        setConnectedCalendars({
          google: false,
          microsoft: false,
          apple: false,
        });
        return;
      }
      const data = await res.json().catch(() => ({}));
      setConnectedCalendars({
        google: Boolean(data?.google),
        microsoft: Boolean(data?.microsoft),
        apple: Boolean(data?.apple),
      });
    } catch (err) {
      console.error(
        "Failed to fetch connected calendars:",
        err instanceof Error ? err.message : String(err)
      );
    }
  }, []);

  const handleCalendarConnect = useCallback(
    (provider: CalendarProviderKey) => {
      if (typeof window === "undefined") return;
      try {
        if (provider === "google") {
          window.open(
            "/api/google/auth?source=menu",
            "_blank",
            "noopener,noreferrer"
          );
        } else if (provider === "microsoft") {
          window.open(
            "/api/outlook/auth?source=menu",
            "_blank",
            "noopener,noreferrer"
          );
        } else {
          window.open(
            "https://support.apple.com/guide/calendar/welcome/mac",
            "_blank",
            "noopener,noreferrer"
          );
        }
        window.setTimeout(() => {
          fetchConnectedCalendars();
        }, 4000);
      } catch (err) {
        console.error("Failed to initiate calendar connection:", err);
      }
    },
    [fetchConnectedCalendars]
  );

  useEffect(() => {
    if (status === "authenticated") {
      fetchConnectedCalendars();
    }
  }, [status, fetchConnectedCalendars]);

  const value = useMemo(
    () => ({
      session,
      status,
      pathname,
      categories,
      history,
      connectedCalendars,
      refreshConnectedCalendars: fetchConnectedCalendars,
      handleCalendarConnect,
      isAdmin,
      initials,
      displayName,
      visibleTemplateKeys,
      featureVisibility,
    }),
    [
      session,
      status,
      pathname,
      categories,
      history,
      connectedCalendars,
      fetchConnectedCalendars,
      handleCalendarConnect,
      isAdmin,
      initials,
      displayName,
      visibleTemplateKeys,
      featureVisibility,
    ]
  );

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error("useMenu must be used within MenuProvider");
  }
  return context;
}

export function useMenuOptional() {
  return useContext(MenuContext);
}
