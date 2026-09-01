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
import {
  normalizePrimarySignupSource,
  type PrimarySignupSource,
} from "@/lib/product-scopes";

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
  calendarConnectionsLoaded: boolean;
  refreshConnectedCalendars: () => Promise<void>;
  handleCalendarConnect: (provider: CalendarProviderKey) => void;
  isAdmin: boolean;
  initials: string;
  displayName: string;
  primarySignupSource: PrimarySignupSource;
  productScopes: string[];
  visibleTemplateKeys: TemplateKey[];
  defaultCreateIntent: string | null;
  featureVisibility: ReturnType<typeof useFeatureVisibility>;
}

const MenuContext = createContext<MenuContextValue | null>(null);

export function MenuProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const { categories, history } = useEventCategories();
  const featureVisibility = useFeatureVisibility();
  const { visibleTemplateKeys } = featureVisibility;
  const defaultCreateIntent = featureVisibility.defaultCreateIntent;
  const primarySignupSource =
    normalizePrimarySignupSource((session?.user as any)?.primarySignupSource) ||
    "legacy";
  const productScopes = Array.isArray((session?.user as any)?.productScopes)
    ? ((session?.user as any)?.productScopes as string[])
    : ["snap"];

  const [connectedCalendars, setConnectedCalendars] = useState<{
    google: boolean;
    microsoft: boolean;
    apple: boolean;
  }>({
    google: false,
    microsoft: false,
    apple: false,
  });
  const [calendarConnectionsLoaded, setCalendarConnectionsLoaded] = useState(false);

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
    if (status !== "authenticated") {
      setConnectedCalendars({ google: false, microsoft: false, apple: false });
      setCalendarConnectionsLoaded(false);
      return;
    }
    setCalendarConnectionsLoaded(false);
    try {
      const response = await fetch("/api/calendars", {
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Failed to load calendar connections");
      const payload = await response.json().catch(() => ({}));
      setConnectedCalendars({
        google: Boolean(payload?.google),
        microsoft: Boolean(payload?.microsoft),
        apple: Boolean(payload?.apple),
      });
    } catch {
      setConnectedCalendars({ google: false, microsoft: false, apple: false });
    } finally {
      setCalendarConnectionsLoaded(true);
    }
  }, [status]);

  const handleCalendarConnect = useCallback(
    (_provider: CalendarProviderKey) => {
      setConnectedCalendars({
        google: false,
        microsoft: false,
        apple: false,
      });
    },
    [fetchConnectedCalendars]
  );

  useEffect(() => {
    if (status === "authenticated") fetchConnectedCalendars();
  }, [status, fetchConnectedCalendars]);

  const value = useMemo(
    () => ({
      session,
      status,
      pathname,
      categories,
      history,
      connectedCalendars,
      calendarConnectionsLoaded,
      refreshConnectedCalendars: fetchConnectedCalendars,
      handleCalendarConnect,
      isAdmin,
      initials,
      displayName,
      primarySignupSource,
      productScopes,
      visibleTemplateKeys,
      defaultCreateIntent,
      featureVisibility,
    }),
    [
      session,
      status,
      pathname,
      categories,
      history,
      connectedCalendars,
      calendarConnectionsLoaded,
      fetchConnectedCalendars,
      handleCalendarConnect,
      isAdmin,
      initials,
      displayName,
      primarySignupSource,
      productScopes,
      visibleTemplateKeys,
      defaultCreateIntent,
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
