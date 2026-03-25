"use client";
import React from "react";
import {
  createContext,
  useCallback,
  useContext,
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
  const STORAGE_KEY = "sidebar:collapsed";
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "0" || stored === "false") return false;
      if (stored === "1" || stored === "true") return true;
    } catch {}
    const supportsMatchMedia = typeof window.matchMedia === "function";
    const isTouch = supportsMatchMedia
      ? window.matchMedia("(hover: none), (pointer: coarse)").matches
      : false;
    const isNarrow = supportsMatchMedia
      ? window.matchMedia("(max-width: 1023px)").matches
      : false;
    return isTouch || isNarrow;
  });
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

  const setIsCollapsedAndPersist = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
    try {
      window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {}
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((previous) => {
      const next = !previous;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  }, []);

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
