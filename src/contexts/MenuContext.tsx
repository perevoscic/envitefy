"use client";

import {
  createContext,
  useContext,
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

  const value = useMemo(
    () => ({
      session,
      status,
      pathname,
      categories,
      history,
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
