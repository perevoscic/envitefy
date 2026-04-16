"use client";

import { forwardRef } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Eye,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Users,
} from "lucide-react";
import type { EventContextTab } from "@/app/sidebar-context";

type EventSidebarMode = "owner" | "guest";

type EventSidebarProps = {
  activeEventTab: EventContextTab;
  onBack: () => void;
  onTabChange: (tab: EventContextTab) => void;
  mode?: EventSidebarMode;
  backLabel?: string;
};

const OWNER_TAB_ITEMS: Array<{
  key: EventContextTab;
  label: string;
  icon: LucideIcon;
}> = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "guests", label: "Guests", icon: Users },
  { key: "communications", label: "Communications", icon: MessageSquare },
  { key: "settings", label: "Settings", icon: Settings },
];

const GUEST_TAB_ITEMS: Array<{
  key: EventContextTab;
  label: string;
  icon: LucideIcon;
}> = [{ key: "dashboard", label: "Preview", icon: Eye }];

const EventSidebar = forwardRef<HTMLDivElement, EventSidebarProps>(
  (
    {
      activeEventTab,
      onBack,
      onTabChange,
      mode = "owner",
      backLabel = "My Events",
    },
    ref,
  ) => {
    const tabItems = mode === "guest" ? GUEST_TAB_ITEMS : OWNER_TAB_ITEMS;

    return (
      <div
        ref={ref}
        tabIndex={-1}
        role="region"
        aria-label="Event menu"
        className="nav-chrome-sidebar-surface flex h-full flex-col"
      >
        <div className="relative flex-shrink-0 px-5 pt-5 pb-4">
          <button
            type="button"
            onClick={onBack}
            aria-label={`Back to ${backLabel}`}
            className="flex items-center gap-3 rounded-full bg-white px-4 py-3 text-left text-[0.86rem] font-semibold uppercase tracking-[0.12em] text-[#6c60db] shadow-[0_16px_34px_rgba(120,105,214,0.16)]"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full">
              <ArrowLeft size={16} strokeWidth={1.9} />
            </span>
            <span className="truncate">{backLabel}</span>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-1">
          <div className="space-y-2">
            {tabItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeEventTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onTabChange(item.key)}
                  aria-pressed={isActive}
                  className={`nav-chrome-motion flex w-full items-center gap-3 rounded-full px-4 py-3 text-left text-[0.86rem] font-semibold uppercase tracking-[0.12em] ${
                    isActive
                      ? "nav-chrome-sidebar-row-active text-[#6c60db]"
                      : "nav-chrome-sidebar-row text-[#c1bcf0]"
                  }`}
                >
                  <span className={`${isActive ? "text-[#6c60db]" : "text-[#c1bcf0]"}`}>
                    <Icon size={16} strokeWidth={1.9} />
                  </span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  },
);

EventSidebar.displayName = "EventSidebar";

export default EventSidebar;
