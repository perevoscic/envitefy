"use client";
import React from "react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

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
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => true);
  const STORAGE_KEY = "sidebar:collapsed";

  // Restore persisted state on mount
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "0" || stored === "false") {
        setIsCollapsed(false);
      } else if (stored === "1" || stored === "true") {
        setIsCollapsed(true);
      } else {
        // No stored preference → collapse by default on mobile/tablet (touch or narrow)
        const supportsMatchMedia = typeof window.matchMedia === "function";
        const isTouch = supportsMatchMedia
          ? window.matchMedia("(hover: none), (pointer: coarse)").matches
          : false;
        const isNarrow = supportsMatchMedia
          ? window.matchMedia("(max-width: 1023px)").matches
          : false;
        const shouldCollapse = isTouch || isNarrow;
        setIsCollapsed(shouldCollapse);
        try {
          window.localStorage.setItem(STORAGE_KEY, shouldCollapse ? "1" : "0");
        } catch {}
      }
    } catch {}
  }, []);

  const setIsCollapsedAndPersist = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    try {
      window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {}
  };

  const toggleSidebar = () => {
    setIsCollapsed((previous) => {
      const next = !previous;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed: setIsCollapsedAndPersist,
        toggleSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
