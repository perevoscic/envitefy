"use client";
import React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  selectedEventId: string | null;
  setSelectedEventId: (eventId: string | null) => void;
  selectedEventTitle: string | null;
  setSelectedEventTitle: (title: string | null) => void;
  selectedEventHref: string | null;
  setSelectedEventHref: (href: string | null) => void;
  selectedEventEditHref: string | null;
  setSelectedEventEditHref: (href: string | null) => void;
  activeEventTab: EventContextTab;
  setActiveEventTab: (tab: EventContextTab) => void;
  clearEventContext: () => void;
}

export type EventContextTab =
  | "dashboard"
  | "guests"
  | "communications"
  | "settings";

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);
export const SIDEBAR_STORAGE_KEY = "sidebar:collapsed";

function isDesktopViewport() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(min-width: 1024px)").matches
  );
}

function readStoredSidebarCollapsed() {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored === "0" || stored === "false") return false;
    if (stored === "1" || stored === "true") return true;
  } catch {}
  return null;
}

function readInitialMobileSidebarCollapsed() {
  const stored = readStoredSidebarCollapsed();
  if (stored !== null) return stored;
  if (typeof window === "undefined") return false;
  const supportsMatchMedia = typeof window.matchMedia === "function";
  const isTouch = supportsMatchMedia
    ? window.matchMedia("(hover: none), (pointer: coarse)").matches
    : false;
  const isNarrow = supportsMatchMedia
    ? window.matchMedia("(max-width: 1023px)").matches
    : false;
  return isTouch || isNarrow;
}

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

interface SidebarProviderProps {
  children: ReactNode;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({
  children,
}) => {
  const [mobileCollapsed, setMobileCollapsed] = useState<boolean>(
    readInitialMobileSidebarCollapsed,
  );
  const [isDesktop, setIsDesktop] = useState<boolean>(isDesktopViewport);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEventTitle, setSelectedEventTitle] = useState<string | null>(
    null,
  );
  const [selectedEventHref, setSelectedEventHref] = useState<string | null>(
    null,
  );
  const [selectedEventEditHref, setSelectedEventEditHref] = useState<
    string | null
  >(null);
  const [activeEventTab, setActiveEventTab] =
    useState<EventContextTab>("dashboard");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updateDesktop = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsDesktop(event.matches);
    };
    updateDesktop(mediaQuery);
    const handler = (event: MediaQueryListEvent) => updateDesktop(event);
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handler);
    } else if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(handler);
    }
    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", handler);
      } else if (typeof mediaQuery.removeListener === "function") {
        mediaQuery.removeListener(handler);
      }
    };
  }, []);

  const setMobileCollapsedAndPersist = useCallback((collapsed: boolean) => {
    setMobileCollapsed(collapsed);
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? "1" : "0");
    } catch {}
  }, []);

  const setIsCollapsedAndPersist = useCallback(
    (collapsed: boolean) => {
      if (isDesktop) return;
      setMobileCollapsedAndPersist(collapsed);
    },
    [isDesktop, setMobileCollapsedAndPersist],
  );

  const toggleSidebar = useCallback(() => {
    if (isDesktop) return;
    setMobileCollapsed((previous) => {
      const next = !previous;
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  }, [isDesktop]);

  const isCollapsed = useMemo(
    () => (isDesktop ? false : mobileCollapsed),
    [isDesktop, mobileCollapsed],
  );

  const clearEventContext = () => {
    setSelectedEventId(null);
    setSelectedEventTitle(null);
    setSelectedEventHref(null);
    setSelectedEventEditHref(null);
    setActiveEventTab("dashboard");
  };

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed: setIsCollapsedAndPersist,
        toggleSidebar,
        selectedEventId,
        setSelectedEventId,
        selectedEventTitle,
        setSelectedEventTitle,
        selectedEventHref,
        setSelectedEventHref,
        selectedEventEditHref,
        setSelectedEventEditHref,
        activeEventTab,
        setActiveEventTab,
        clearEventContext,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
