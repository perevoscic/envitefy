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

type CalendarProviderKey = "google" | "microsoft" | "apple";

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
  handleCalendarConnect: (provider: CalendarProviderKey) => void;
  isAdmin: boolean;
  initials: string;
  displayName: string;
}

const MenuContext = createContext<MenuContextValue | null>(null);

export function MenuProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const { categories, history } = useEventCategories();

  const [connectedCalendars, setConnectedCalendars] = useState<{
    google: boolean;
    microsoft: boolean;
    apple: boolean;
  }>({
    google: false,
    microsoft: false,
    apple: false,
  });

  const isAdmin = Boolean((session?.user as any)?.isAdmin);

  const displayName =
    (session?.user?.name as string) ||
    (session?.user?.email as string) ||
    "User";

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
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json();
      setConnectedCalendars({
        google: Boolean(data?.google),
        microsoft: Boolean(data?.microsoft),
        apple: Boolean(data?.apple),
      });
    } catch (err) {
      console.error("Failed to fetch connected calendars:", err);
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
      handleCalendarConnect,
      isAdmin,
      initials,
      displayName,
    }),
    [
      session,
      status,
      pathname,
      categories,
      history,
      connectedCalendars,
      handleCalendarConnect,
      isAdmin,
      initials,
      displayName,
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
