"use client";

import { forwardRef } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Users,
} from "lucide-react";
import type { EventContextTab } from "@/app/sidebar-context";

type EventSidebarProps = {
  eventTitle: string;
  activeEventTab: EventContextTab;
  onBack: () => void;
  onTabChange: (tab: EventContextTab) => void;
};

const TAB_ITEMS: Array<{
  key: EventContextTab;
  label: string;
  icon: LucideIcon;
}> = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "guests", label: "Guests", icon: Users },
  { key: "communications", label: "Communications", icon: MessageSquare },
  { key: "settings", label: "Settings", icon: Settings },
];

const EventSidebar = forwardRef<HTMLDivElement, EventSidebarProps>(
  (
    { eventTitle, activeEventTab, onBack, onTabChange },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        tabIndex={-1}
        role="region"
        aria-label="Event menu"
        className="flex h-full flex-col"
      >
        <div className="relative flex-shrink-0 px-4 pt-5 pb-4">
          <div className="rounded-3xl border border-white/60 bg-white/80 px-4 py-4 shadow-[0_25px_60px_rgba(101,67,145,0.18)] backdrop-blur-2xl">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onBack}
                aria-label="Back to My Events"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/85 text-[#6d5b9f] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#cdbdff]/70"
              >
                <ArrowLeft size={16} />
              </button>
              <button
                type="button"
                onClick={onBack}
                className="min-w-0 text-left text-sm font-semibold text-[#4a3b76] hover:text-[#2f2453]"
              >
                My Events
              </button>
            </div>
            <div className="mt-3 rounded-2xl border border-white/70 bg-gradient-to-r from-[#f4f2ff] via-[#f7f5ff] to-[#f2f8ff] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
              <p
                className="truncate text-sm font-semibold text-[#2f1d47]"
                title={eventTitle}
              >
                {eventTitle || "Untitled event"}
              </p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-1">
          <div className="rounded-2xl border border-white/60 bg-white/80 px-3 py-3 shadow-[0_18px_40px_rgba(81,54,123,0.15)] backdrop-blur-xl">
            <div className="space-y-2">
              {TAB_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeEventTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onTabChange(item.key)}
                    aria-pressed={isActive}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      isActive
                        ? "bg-gradient-to-r from-[#ece7ff] to-[#edf3ff] text-[#2c1d52] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
                        : "text-[#4b3f72] hover:bg-[#f3efff]"
                    }`}
                  >
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${
                        isActive
                          ? "bg-white/90 text-[#5b44a0] shadow-sm"
                          : "bg-[#f3efff] text-[#7662aa]"
                      }`}
                    >
                      <Icon size={16} />
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

EventSidebar.displayName = "EventSidebar";

export default EventSidebar;
