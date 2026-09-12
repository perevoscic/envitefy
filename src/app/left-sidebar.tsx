"use client";

import {
  Baby,
  BarChart3,
  Bot,
  Cake,
  CalendarDays,
  Camera,
  Car,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileEdit,
  Footprints,
  Gauge,
  GraduationCap,
  HeartPulse,
  HeartHandshake,
  Home,
  Info,
  LayoutDashboard,
  LogOut,
  Mail,
  Music,
  PartyPopper,
  PanelLeftOpen,
  Pin,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Stethoscope,
  Trash2,
  Trophy,
  Upload,
  User,
  Users,
  WandSparkles,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  type ComponentType,
  type CSSProperties,
  type Dispatch,
  type MouseEvent,
  type ReactNode,
  type RefObject,
  type SetStateAction,
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useEventCache } from "@/app/event-cache-context";
import conciergeMenuIcon from "../../public/brand/concierge-chat.webp";
import sidebarBrandIcon from "../../public/brand/e-only.png";
import sidebarBrandWordmark from "../../public/brand/envitefy-wordmark.png";
import { adminNavItems, type AdminNavItemId } from "@/components/admin/nav";
import EnvitefySocialLinks from "@/components/branding/EnvitefySocialLinks";
import EventSidebar from "@/components/navigation/EventSidebar";
import MobileNavHeader from "@/components/navigation/MobileNavHeader";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { useMenu } from "@/contexts/MenuContext";
import type { CreationThreadSummary, CreationThreadsResponse } from "@/lib/concierge/types";
import { isInvitedEventLikeRecord } from "@/lib/dashboard-data";
import { buildEditLink } from "@/utils/event-edit-route";
import { secureSignOut } from "@/utils/secureSignOut";
import { useLeftSidebarController } from "./left-sidebar.controller";
import {
  buildSidebarDraftItems,
  type SidebarDraftItem,
  CREATE_SECTION_COLORS,
  createSidebarIconLookup,
  GroupedEventItem,
  GroupedEventSection,
  getCreateMenuActiveAccent,
  getChronologicalEventItems,
  SIDEBAR_BADGE_CLASS,
  SIDEBAR_COLLAPSED_REM,
  SIDEBAR_DIVIDER_CLASS,
  SIDEBAR_EVENT_PANEL_CLASS,
  SIDEBAR_FOOTER_TRIGGER_CLASS,
  SIDEBAR_ICON_CHIP_CLASS,
  SIDEBAR_LIST_PANEL_CLASS,
  SIDEBAR_PANEL_CLASS,
  SIDEBAR_WIDTH_REM,
} from "./left-sidebar.model";
import { useSidebar } from "./sidebar-context";


const SIDEBAR_GYM_MASK_STYLE = (size: number): CSSProperties => ({
  width: size,
  height: size,
  WebkitMaskImage: "url(/icons/sidebar-gymnastics.png)",
  WebkitMaskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  maskImage: "url(/icons/sidebar-gymnastics.png)",
  maskSize: "contain",
  maskRepeat: "no-repeat",
  maskPosition: "center",
});

const SIDEBAR_FB_MASK_STYLE = (size: number): CSSProperties => ({
  width: size,
  height: size,
  WebkitMaskImage: "url(/icons/sidebar-football.png)",
  WebkitMaskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  maskImage: "url(/icons/sidebar-football.png)",
  maskSize: "contain",
  maskRepeat: "no-repeat",
  maskPosition: "center",
});

function SidebarWeddingMenuIcon({
  size = 16,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="8" cy="15" r="6" />
      <circle cx="16" cy="15" r="6" />
      <path d="m16 2 3 3-3 3-3-3Z" />
    </svg>
  );
}

function SidebarGymnasticsMenuIcon({
  size = 22,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={["inline-block shrink-0 bg-current", className]
        .filter(Boolean)
        .join(" ")}
      style={SIDEBAR_GYM_MASK_STYLE(size)}
      aria-hidden
    />
  );
}

function SidebarFootballMenuIcon({
  size = 22,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={["inline-block shrink-0 bg-current", className]
        .filter(Boolean)
        .join(" ")}
      style={SIDEBAR_FB_MASK_STYLE(size)}
      aria-hidden
    />
  );
}

function ConciergeLogoIcon({ size = 17, isActive = true }: { size?: number; isActive?: boolean }) {
  return (
    <Image
      src={conciergeMenuIcon}
      alt=""
      width={size}
      height={size}
      aria-hidden="true"
      className={`block shrink-0 object-contain transition-opacity ${
        isActive ? "opacity-100" : "opacity-55 group-hover:opacity-80"
      }`}
      draggable={false}
    />
  );
}

function DraftThreadIcon({ size = 17, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M17,21 L17,23 L15,23 L15,21 L17,21 Z M19,21 L21,21 C21,22.1045695 20.1045695,23 19,23 L19,21 Z M13,21 L13,23 L11,23 L11,21 L13,21 Z M9,21 L9,23 L7,23 L7,21 L9,21 Z M5,21 L5,23 C3.8954305,23 3,22.1045695 3,21 L5,21 Z M19,13 L21,13 L21,15 L19,15 L19,13 Z M19,11 L19,9 L15,9 C13.8954305,9 13,8.1045695 13,7 L13,3 L5,3 L5,11 L3,11 L3,3 C3,1.8954305 3.8954305,1 5,1 L15.4142136,1 L21,6.58578644 L21,11 L19,11 Z M5,13 L5,15 L3,15 L3,13 L5,13 Z M19,17 L21,17 L21,19 L19,19 L19,17 Z M5,17 L5,19 L3,19 L3,17 L5,17 Z M15,3.41421356 L15,7 L18.5857864,7 L15,3.41421356 Z"
      />
    </svg>
  );
}

function isDraftCreationThreadStatus(status: string) {
  const normalized = status.trim().toLowerCase();
  return normalized !== "published" && normalized !== "publishing";
}

function SidebarMyEventsMenuIcon({
  size = 22,
  className,
  active = false,
}: {
  size?: number;
  className?: string;
  active?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={["shrink-0", "text-current", className].filter(Boolean).join(" ")}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 2.75V5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 2.75V5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.75 4.5H17.25C19.0449 4.5 20.5 5.95507 20.5 7.75V17.25C20.5 19.0449 19.0449 20.5 17.25 20.5H6.75C4.95507 20.5 3.5 19.0449 3.5 17.25V7.75C3.5 5.95507 4.95507 4.5 6.75 4.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.75 8.5H20.25"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 11.25L15.5 14.1V18H13.25V15.7H10.75V18H8.5V14.1L12 11.25Z" fill="currentColor" />
    </svg>
  );
}

const sidebarIconLookup = createSidebarIconLookup({
  Baby,
  Cake,
  CalendarDays,
  Camera,
  Car,
  Clock,
  FileEdit,
  Footprints,
  GraduationCap,
  HeartHandshake,
  Home,
  Music,
  PartyPopper,
  SidebarFootballMenuIcon,
  SidebarGymnasticsMenuIcon,
  SidebarWeddingMenuIcon,
  Stethoscope,
  WandSparkles,
  Trophy,
  Upload,
});

const footerItemIcons: Record<string, ComponentType<{ size?: number }>> = {
  Profile: User,
  "About us": Info,
  "Contact us": Mail,
};

const SIDEBAR_SUBMENU_CARD_CLASS =
  "nav-chrome-menu-card nav-chrome-motion rounded-[24px] border border-[rgba(235,231,255,0.94)] bg-white/84 shadow-[0_16px_32px_rgba(103,88,160,0.12)]";
const SIDEBAR_SUBMENU_ENTRY_CLASS =
  "nav-chrome-motion group flex w-full items-center gap-3.5 rounded-[18px] border border-transparent px-2.5 py-2.5 text-left transition-[transform,background-color,box-shadow,border-color] hover:border-[rgba(226,220,255,0.98)] hover:bg-white/82 hover:shadow-[0_14px_28px_rgba(103,88,160,0.1)]";
const SIDEBAR_SUBMENU_ROW_CLASS =
  "nav-chrome-motion group flex w-full items-center gap-3 rounded-[20px] border border-transparent px-2 py-2.5 text-left transition-[background-color,border-color,box-shadow,color,transform]";
const SIDEBAR_SUBMENU_ICON_CLASS =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-[background-color,color,border-color,box-shadow]";
const SIDEBAR_SUBMENU_LABEL_CLASS =
  "nav-chrome-menu-label flex-1 truncate transition-colors";
const SIDEBAR_SUBMENU_ROW_ACTIVE_CLASS =
  "bg-white/92 border-[rgba(236,231,255,0.98)] shadow-[0_16px_32px_rgba(103,88,160,0.12)]";
const SIDEBAR_SUBMENU_ROW_INACTIVE_CLASS = "text-[color:var(--nav-sidebar-icon-muted,#beb9e8)] hover:bg-white/28";
const SIDEBAR_SUBMENU_LABEL_ACTIVE_CLASS = "text-[#6b5fc2]";
const SIDEBAR_SUBMENU_LABEL_INACTIVE_CLASS =
  "text-[color:var(--nav-sidebar-label-muted,rgba(107,95,194,0.64))] group-hover:text-[#6b5fc2]";
const SIDEBAR_SUBMENU_ICON_ACTIVE_CLASS =
  "border-[rgba(236,231,255,0.98)] bg-white text-[#6e59db] shadow-[0_10px_20px_rgba(103,88,160,0.1)]";
const SIDEBAR_SUBPAGE_TITLE_CLASS =
  "font-[var(--font-josefin-sans)] text-[1.25rem] font-bold uppercase tracking-[0.13em] leading-none text-[#6b5fc2]";
const SIDEBAR_SUBMENU_ICON_INACTIVE_CLASS =
  "border-transparent bg-transparent text-[color:var(--nav-sidebar-icon-muted,#beb9e8)] group-hover:text-[color:var(--nav-sidebar-icon-muted,#aba4e3)]";

function PanelBackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="nav-chrome-motion flex w-full items-center gap-3 rounded-[22px] px-2 py-2 text-left hover:bg-white/24"
    >
      <span className={`${SIDEBAR_ICON_CHIP_CLASS} text-[#7c76c7]`}>
        <ChevronLeft size={16} />
      </span>
      <span className="font-[var(--font-josefin-sans)] min-w-0 block text-[0.82rem] font-bold uppercase tracking-[0.13em] leading-none text-[#6b5fc2]">
        Back
      </span>
    </button>
  );
}

function animateSidebarPress(event: MouseEvent<HTMLDivElement>) {
  if (!(event.target instanceof Element) || event.button !== 0) return;
  const control = event.target.closest<HTMLButtonElement | HTMLAnchorElement>("button, a[href]");
  if (
    !control ||
    !event.currentTarget.contains(control) ||
    control.matches(':disabled, [aria-disabled="true"], [aria-label="Envitefy home"]') ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  for (const animation of control.getAnimations()) {
    if (animation.id === "sidebar-press-feedback") animation.cancel();
  }
  const animation = control.animate(
    [
      {
        transform: "translateY(2px) scale(0.95)",
        backgroundColor: "rgba(224, 215, 255, 0.78)",
        boxShadow: "inset 0 2px 7px rgba(90, 71, 160, 0.24)",
        offset: 0,
      },
      { transform: "translateY(0) scale(1.01)", offset: 0.65 },
      { transform: "translateY(0) scale(1)", offset: 1 },
    ],
    { duration: 280, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
  );
  animation.id = "sidebar-press-feedback";
}

function SidebarListPanel({
  title,
  titleClassName = "",
  onBack,
  children,
}: {
  title: string;
  titleClassName?: string;
  onBack: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4 pt-2">
      <div className="shrink-0 px-5 pb-4 pt-2">
        <PanelBackButton onClick={onBack} />
        <div className="px-2 pb-1 pt-1">
          <p className={`${SIDEBAR_SUBPAGE_TITLE_CLASS} ${titleClassName}`}>{title}</p>
        </div>
      </div>

      <div
        className="nav-chrome-sidebar-scroll-region no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-36 touch-pan-y lg:pb-40"
        role="region"
        aria-label={`${title} list`}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: the scrollable list needs focus for keyboard scrolling.
        tabIndex={0}
      >
        {children}
      </div>
    </div>
  );
}

function isPlainPrimaryLinkClick(event: MouseEvent<HTMLAnchorElement>) {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.shiftKey
  );
}

function SidebarNavigationMenuIcon({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="4" cy="5" r="2" />
      <rect x="9" y="3" width="13" height="4" rx="2" />
      <circle cx="4" cy="12" r="2" />
      <rect x="9" y="10" width="13" height="4" rx="2" />
      <circle cx="4" cy="19" r="2" />
      <rect x="9" y="17" width="13" height="4" rx="2" />
    </svg>
  );
}

function RootNavigationPanel({
  pathname,
  sidebarPage,
  eventContextSourcePage,
  hasCreateEventAccess,
  createEntryLabel,
  isCreateEntryActive,
  isSnapUploadActive,
  isAdmin,
  createdEventsCount,
  draftsCount,
  onHome,
  onSnapUpload,
  onAiThreads,
  onCreate,
  onMyEvents,
  onDrafts,
  onAdmin,
}: {
  pathname: string | null;
  sidebarPage: string;
  eventContextSourcePage: string;
  hasCreateEventAccess: boolean;
  createEntryLabel: string;
  isCreateEntryActive: boolean;
  isSnapUploadActive: boolean;
  isAdmin: boolean;
  createdEventsCount: number;
  draftsCount: number;
  onHome: () => void;
  onSnapUpload: () => void;
  onAiThreads: () => void;
  onCreate: () => void;
  onMyEvents: () => void;
  onDrafts: () => void;
  onAdmin: () => void;
}) {
  const isHomeActive = pathname === "/" && sidebarPage === "root";
  const isChatActive = (pathname === "/chat" || sidebarPage === "aiThreads") && !isSnapUploadActive;
  const isViewingEventFromListInRoot =
    sidebarPage === "root" &&
    !isCreateEntryActive &&
    Boolean(
      pathname && (pathname.startsWith("/event/") || pathname.startsWith("/smart-signup-form/")),
    );
  const isMyEventsActive =
    sidebarPage === "myEvents" ||
    (sidebarPage === "eventContext" && eventContextSourcePage === "myEvents") ||
    (isViewingEventFromListInRoot && eventContextSourcePage === "myEvents");
  const isAdminActive =
    sidebarPage === "admin" || (Boolean(pathname?.startsWith("/admin")) && sidebarPage === "root");
  const isDraftsActive = sidebarPage === "drafts";

  return (
    <nav aria-label="Main navigation" className="space-y-5 pt-2">
      <div className="space-y-1.5">
        <SidebarLink link={{ label: "Home", href: "/", icon: <Home />, onClick: onHome, active: isHomeActive }} />
        <SidebarLink link={{ label: "Snap / Upload", icon: <Upload />, onClick: onSnapUpload, active: isSnapUploadActive }} />
        <SidebarLink link={{ label: "Envitefy Concierge", icon: <ConciergeLogoIcon size={20} isActive={isChatActive} />, onClick: onAiThreads, active: isChatActive }} />
        {hasCreateEventAccess ? (
          <SidebarLink link={{ label: createEntryLabel, icon: <Plus />, onClick: onCreate, active: isCreateEntryActive }} />
        ) : null}
      </div>
      <div className="space-y-1.5 border-t border-violet-200/40 pt-4">
        <SidebarLink link={{ label: "My Events", icon: <SidebarMyEventsMenuIcon size={20} active={isMyEventsActive} />, onClick: onMyEvents, active: isMyEventsActive, badge: createdEventsCount }} />
        <SidebarLink link={{ label: "Drafts", icon: <FileEdit />, onClick: onDrafts, active: isDraftsActive, badge: draftsCount }} />
      </div>
      {isAdmin ? (
        <div className="border-t border-violet-200/40 pt-4">
          <SidebarLink link={{ label: "Admin", icon: <ShieldCheck />, onClick: onAdmin, active: isAdminActive }} />
        </div>
      ) : null}
    </nav>
  );
}

const adminSidebarIcons: Record<
  AdminNavItemId,
  ComponentType<{ size?: number; strokeWidth?: number }>
> = {
  dashboard: LayoutDashboard,
  users: Users,
  events: Gauge,
  concierge: Bot,
  scans: Search,
  emails: Mail,
  "ad-studio": WandSparkles,
  analytics: BarChart3,
  settings: Settings,
  health: HeartPulse,
};

function isAdminNavItemActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function AdminNavigationPanel({
  pathname,
  onBack,
}: {
  pathname: string | null;
  onBack: () => void;
}) {
  return (
    <SidebarListPanel title="Admin" onBack={onBack}>
      <div className="space-y-2">
        {adminNavItems.map((item) => {
          const Icon = adminSidebarIcons[item.id];
          const isActive = isAdminNavItemActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${SIDEBAR_SUBMENU_ROW_CLASS} ${
                isActive ? SIDEBAR_SUBMENU_ROW_ACTIVE_CLASS : SIDEBAR_SUBMENU_ROW_INACTIVE_CLASS
              }`}
            >
              <span
                className={`${SIDEBAR_SUBMENU_ICON_CLASS} ${
                  isActive ? SIDEBAR_SUBMENU_ICON_ACTIVE_CLASS : SIDEBAR_SUBMENU_ICON_INACTIVE_CLASS
                }`}
              >
                <Icon size={16} strokeWidth={1.9} />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`${SIDEBAR_SUBMENU_LABEL_CLASS} ${
                    isActive
                      ? SIDEBAR_SUBMENU_LABEL_ACTIVE_CLASS
                      : SIDEBAR_SUBMENU_LABEL_INACTIVE_CLASS
                  }`}
                >
                  {item.label}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </SidebarListPanel>
  );
}

function CreateMenuButton({
  item,
  index,
  isActive,
  onSelect,
}: {
  item: { label: string; href: string };
  index: number;
  isActive: boolean;
  onSelect: (label: string, href?: string) => void;
}) {
  const Icon =
    ((sidebarIconLookup as Record<string, ComponentType<any> | undefined>)[item.label] as
      | ComponentType<any>
      | undefined) || WandSparkles;
  const colorClass = CREATE_SECTION_COLORS[index % CREATE_SECTION_COLORS.length];
  const activeAccent = getCreateMenuActiveAccent(item.label);

  return (
    <button
      type="button"
      className={`${SIDEBAR_SUBMENU_ROW_CLASS} ${
        isActive ? SIDEBAR_SUBMENU_ROW_ACTIVE_CLASS : SIDEBAR_SUBMENU_ROW_INACTIVE_CLASS
      }`}
      onClick={() => onSelect(item.label, item.href)}
    >
      <span
        className={`${SIDEBAR_SUBMENU_ICON_CLASS} ${
          isActive
            ? SIDEBAR_SUBMENU_ICON_ACTIVE_CLASS
            : `${colorClass} ${SIDEBAR_SUBMENU_ICON_INACTIVE_CLASS}`
        }`}
      >
        {Icon === SidebarGymnasticsMenuIcon ? (
          <SidebarGymnasticsMenuIcon size={18} />
        ) : Icon === SidebarFootballMenuIcon ? (
          <SidebarFootballMenuIcon size={18} />
        ) : (
          <Icon size={18} />
        )}
      </span>
      <span
        className={`${SIDEBAR_SUBMENU_LABEL_CLASS} ${
          isActive ? SIDEBAR_SUBMENU_LABEL_ACTIVE_CLASS : SIDEBAR_SUBMENU_LABEL_INACTIVE_CLASS
        }`}
      >
        {item.label}
      </span>
      <ChevronRight
        size={16}
        className={`ml-auto transition-all ${
          isActive ? activeAccent.chevronClass : "text-[color:var(--nav-sidebar-icon-muted,#b5afe8)] group-hover:text-[#7b73d2]"
        }`}
      />
    </button>
  );
}

function CreatePanel({
  title,
  onBack,
  items,
  isItemActive,
  onSelect,
  otherItems,
  isOtherEventsActive,
  onOpenOther,
}: {
  title: string;
  onBack: () => void;
  items: Array<{ label: string; href: string }>;
  isItemActive: (item: { label: string; href: string }) => boolean;
  onSelect: (label: string, href?: string) => void;
  otherItems: Array<{ label: string; href: string }>;
  isOtherEventsActive: boolean;
  onOpenOther: () => void;
}) {
  return (
    <SidebarListPanel title={title} onBack={onBack}>
      <div className="space-y-1.5">
        {items.map((item, index) => (
          <CreateMenuButton
            key={item.label}
            item={item}
            index={index}
            isActive={isItemActive(item)}
            onSelect={onSelect}
          />
        ))}
        {otherItems.length > 0 ? (
          <button
            type="button"
            onClick={onOpenOther}
            className={`${SIDEBAR_SUBMENU_ROW_CLASS} ${
              isOtherEventsActive
                ? SIDEBAR_SUBMENU_ROW_ACTIVE_CLASS
                : SIDEBAR_SUBMENU_ROW_INACTIVE_CLASS
            }`}
          >
            <span
              className={`${SIDEBAR_SUBMENU_ICON_CLASS} ${
                isOtherEventsActive
                  ? SIDEBAR_SUBMENU_ICON_ACTIVE_CLASS
                  : `${CREATE_SECTION_COLORS[0]} ${SIDEBAR_SUBMENU_ICON_INACTIVE_CLASS}`
              }`}
            >
              <CalendarDays size={17} />
            </span>
            <span
              className={`${SIDEBAR_SUBMENU_LABEL_CLASS} ${
                isOtherEventsActive
                  ? SIDEBAR_SUBMENU_LABEL_ACTIVE_CLASS
                  : SIDEBAR_SUBMENU_LABEL_INACTIVE_CLASS
              }`}
            >
              Other Events
            </span>
            <span className="ml-auto flex items-center gap-2">
              <span className={SIDEBAR_BADGE_CLASS}>{otherItems.length}</span>
              <ChevronRight
                size={16}
                className={`transition-all ${
                  isOtherEventsActive
                    ? "text-[#655ec0]"
                    : "text-[#b5afe8] group-hover:text-[#7b73d2]"
                }`}
              />
            </span>
          </button>
        ) : null}
      </div>
    </SidebarListPanel>
  );
}

function EventListPanel({
  title,
  grouped,
  emptyStateCopy,
  emptyPastCopy,
  isHistoryRowActive,
  onRowClick,
  pastExpanded,
  setPastExpanded,
  showPendingBadge,
  pastRowOpacityClass,
  onBack,
}: {
  title: string;
  grouped: { upcoming: GroupedEventSection[]; past: GroupedEventSection[] };
  emptyStateCopy: string;
  emptyPastCopy: string;
  isHistoryRowActive: (rowId: string) => boolean;
  onRowClick: (item: GroupedEventItem) => void;
  pastExpanded: boolean;
  setPastExpanded: Dispatch<SetStateAction<boolean>>;
  showPendingBadge: boolean;
  pastRowOpacityClass: string;
  onBack: () => void;
}) {
  const getMonthLabel = (item: GroupedEventItem) =>
    Number.isFinite(item.dateMs)
      ? new Date(item.dateMs).toLocaleDateString(undefined, { month: "short", year: "numeric" })
      : "Draft";

  const renderRows = (items: GroupedEventItem[], muted: boolean) =>
    items.map((item, index) => {
      const isActive = isHistoryRowActive(item.row.id);
      const CategoryIcon =
        sidebarIconLookup[item.category as keyof typeof sidebarIconLookup] || PartyPopper;
      const monthLabel = getMonthLabel(item);
      const dateLabel = Number.isFinite(item.dateMs)
        ? `${item.dateLabel}${item.isDraft ? " · Draft" : ""}`
        : "Draft";
      const showMonthDivider = index === 0 || monthLabel !== getMonthLabel(items[index - 1]);
      return (
        <Fragment key={item.row.id}>
          {showMonthDivider ? (
            <div className={`flex items-center gap-2 px-3 pb-1 ${index === 0 ? "pt-1" : "pt-4"}`}>
              <p className="font-[var(--font-josefin-sans)] shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] leading-none text-[color:var(--nav-sidebar-detail-muted,#9188bd)]">
                {monthLabel}
              </p>
              <span aria-hidden="true" className="h-px flex-1 bg-[#ded8f0]/70" />
            </div>
          ) : null}
          <button
            type="button"
            data-sidebar-press-surface
            onClick={() => onRowClick(item)}
            aria-current={isActive ? "page" : undefined}
            className={`${SIDEBAR_SUBMENU_ROW_CLASS} relative min-w-0 items-start px-2 py-2.5 ${
              isActive ? SIDEBAR_SUBMENU_ROW_ACTIVE_CLASS : SIDEBAR_SUBMENU_ROW_INACTIVE_CLASS
            } ${muted ? pastRowOpacityClass : ""}`}
          >
            <span
              className={`${SIDEBAR_SUBMENU_ICON_CLASS} mt-0.5 ${
                isActive
                  ? SIDEBAR_SUBMENU_ICON_ACTIVE_CLASS
                  : `${item.tintClass} ${SIDEBAR_SUBMENU_ICON_INACTIVE_CLASS}`
              }`}
              aria-hidden="true"
              title={item.category}
            >
              <CategoryIcon size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="sr-only">{item.category}: </span>
              {showPendingBadge || item.isInvited ? (
                <span className="flex items-center gap-2">
                  <span
                    className={`font-[var(--font-josefin-sans)] min-w-0 flex-1 truncate text-[0.98rem] font-bold leading-snug md:text-[1.02rem] ${
                      isActive
                        ? SIDEBAR_SUBMENU_LABEL_ACTIVE_CLASS
                        : SIDEBAR_SUBMENU_LABEL_INACTIVE_CLASS
                    }`}
                  >
                    {item.title}
                  </span>
                  {item.shareStatus === "pending" ? (
                    <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-amber-700">
                      Pending
                    </span>
                  ) : null}
                </span>
              ) : (
                <span
                  className={`font-[var(--font-josefin-sans)] block truncate text-[0.98rem] font-bold leading-snug md:text-[1.02rem] ${
                    isActive
                      ? SIDEBAR_SUBMENU_LABEL_ACTIVE_CLASS
                      : SIDEBAR_SUBMENU_LABEL_INACTIVE_CLASS
                  }`}
                >
                  {item.title}
                </span>
              )}
              <span
                className={`mt-0.5 block truncate text-xs ${
                  isActive
                    ? "text-[color:var(--nav-sidebar-detail-muted,#9d95db)]"
                    : "text-[color:var(--nav-sidebar-detail-muted,#c1bcf0)] group-hover:text-[color:var(--nav-sidebar-detail-muted,#b0aae4)]"
                }`}
              >
                {dateLabel}
              </span>
            </span>
          </button>
        </Fragment>
      );
    });

  return (
    <SidebarListPanel title={title} onBack={onBack}>
      <div className="space-y-3">
        {grouped.upcoming.length === 0 && grouped.past.length === 0 ? (
          <div
            className={`${SIDEBAR_SUBMENU_CARD_CLASS} rounded-[24px] border-dashed px-4 py-6 text-center text-sm text-[#7e76b9]`}
          >
            {emptyStateCopy}
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.upcoming.length === 0 ? (
              <div
                className={`${SIDEBAR_SUBMENU_CARD_CLASS} rounded-[24px] border-dashed px-4 py-6 text-center text-sm text-[#7e76b9]`}
              >
                No upcoming events.
              </div>
            ) : (
              <div className="space-y-1">
                {renderRows(getChronologicalEventItems(grouped.upcoming), false)}
              </div>
            )}

            {grouped.past.length > 0 ? (
              <section className="space-y-1">
                <div className="px-1 pt-2">
                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setPastExpanded((prev) => !prev)}
                      className="nav-chrome-menu-card nav-chrome-motion inline-flex items-center gap-1 rounded-full border border-[rgba(117,103,177,0.18)] bg-white/88 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[var(--nav-chrome-muted)] shadow-[0_10px_22px_rgba(96,81,154,0.08)] hover:bg-white"
                    >
                      <span>{pastExpanded ? "Hide past events" : "Show past events"}</span>
                      <ChevronRight
                        size={12}
                        className={`transition-transform ${pastExpanded ? "rotate-90" : ""}`}
                      />
                    </button>
                  </div>
                  <div className={`mt-1 ${SIDEBAR_DIVIDER_CLASS}`} />
                </div>

                {pastExpanded ? (
                  grouped.past.length === 0 ? (
                    <div
                      className={`${SIDEBAR_SUBMENU_CARD_CLASS} rounded-[24px] border-dashed px-4 py-6 text-center text-sm text-[#7e76b9]`}
                    >
                      {emptyPastCopy}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {renderRows(getChronologicalEventItems(grouped.past, "past"), true)}
                    </div>
                  )
                ) : null}
              </section>
            ) : null}
          </div>
        )}
      </div>
    </SidebarListPanel>
  );
}

function DraftsPanel({
  drafts,
  onBack,
  onNavigate,
}: {
  drafts: SidebarDraftItem[];
  onBack: () => void;
  onNavigate: () => void;
}) {
  const router = useRouter();
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function openDraft(draft: SidebarDraftItem) {
    if (openingId) return;
    setOpeningId(draft.id);
    setError(null);
    try {
      let href = draft.href;
      if (draft.eventId) {
        // The sidebar projection omits some editor metadata. Resolve the saved
        // record before navigating so manual and older template drafts resume correctly.
        const response = await fetch(`/api/history/${encodeURIComponent(draft.eventId)}`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Unable to open this draft. Please try again.");
        const row = (await response.json()) as { id: string; title: string; data: Record<string, unknown> };
        href = buildEditLink(row.id, row.data, row.title);
      }
      onNavigate();
      router.push(href);
    } catch {
      setError("Unable to open this draft. Please try again.");
    } finally {
      setOpeningId(null);
    }
  }

  return (
    <SidebarListPanel title="Drafts" onBack={onBack}>
      <div className="space-y-1">
        {error ? <p role="alert" className="px-4 py-2 text-sm text-red-600">{error}</p> : null}
        {drafts.length ? drafts.map((draft) => (
          <Link
            key={draft.id}
            href={draft.href}
            onClick={(event) => {
              if (!isPlainPrimaryLinkClick(event)) return;
              event.preventDefault();
              void openDraft(draft);
            }}
            aria-label={`Resume ${draft.title}`}
            aria-busy={openingId === draft.id}
            className={`${SIDEBAR_SUBMENU_ROW_CLASS} ${SIDEBAR_SUBMENU_ROW_INACTIVE_CLASS}`}
          >
            <span className={`${SIDEBAR_SUBMENU_ICON_CLASS} text-[#beb9e8] group-hover:text-[#aba4e3]`}>
              <FileEdit size={18} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className={`${SIDEBAR_SUBMENU_LABEL_CLASS} ${SIDEBAR_SUBMENU_LABEL_INACTIVE_CLASS}`}>
                {draft.title}
              </span>
              <span className="mt-0.5 block text-xs text-[#9d95db]">
                {openingId === draft.id ? "Opening…" : "Continue editing"}
              </span>
            </span>
          </Link>
        )) : (
          <div className={`${SIDEBAR_SUBMENU_CARD_CLASS} rounded-[24px] border-dashed px-4 py-6 text-center text-sm text-[#7e76b9]`}>
            No saved drafts yet.
          </div>
        )}
      </div>
    </SidebarListPanel>
  );
}

function AiThreadsPanel({
  threads,
  activeThreadId,
  onBack,
  onNewChat,
  onOpenThread,
  onDeleteThread,
}: {
  threads: CreationThreadSummary[];
  activeThreadId: string | null;
  onBack: () => void;
  onNewChat: () => void;
  onOpenThread: (threadId: string) => void;
  onDeleteThread: (thread: CreationThreadSummary) => void;
}) {
  return (
    <SidebarListPanel
      title="Envitefy Concierge"
      titleClassName="!text-[1.1rem] !tracking-[0.06em]"
      onBack={onBack}
    >
      <div className="space-y-3">
        <Link
          href="/chat"
          onClick={onNewChat}
          className={`${SIDEBAR_SUBMENU_ROW_CLASS} ${SIDEBAR_SUBMENU_ROW_ACTIVE_CLASS}`}
        >
          <span className={`${SIDEBAR_SUBMENU_ICON_CLASS} ${SIDEBAR_SUBMENU_ICON_ACTIVE_CLASS}`}>
            <Plus size={18} />
          </span>
          <span className={`${SIDEBAR_SUBMENU_LABEL_CLASS} ${SIDEBAR_SUBMENU_LABEL_ACTIVE_CLASS}`}>
            New chat
          </span>
        </Link>

        <section className="space-y-1">
          <div className="px-1 pt-1">
            <p className="font-[var(--font-josefin-sans)] text-[0.82rem] font-bold uppercase tracking-[0.13em] leading-none text-[#6b5fc2]">
              Drafts
            </p>
            <div className={`mt-1 ${SIDEBAR_DIVIDER_CLASS}`} />
          </div>

          {threads.length ? (
            threads.map((thread) => {
              const isActiveThread = activeThreadId === thread.id;
              const isDraftThread = isDraftCreationThreadStatus(thread.status);
              return (
                <div key={thread.id} className="group flex items-center gap-2">
                  <Link
                    href={`/chat?thread=${encodeURIComponent(thread.id)}`}
                    onClick={(event) => {
                      if (!isPlainPrimaryLinkClick(event)) return;
                      event.preventDefault();
                      onOpenThread(thread.id);
                    }}
                    className={`${SIDEBAR_SUBMENU_ROW_CLASS} min-w-0 flex-1 ${
                      isActiveThread
                        ? SIDEBAR_SUBMENU_ROW_ACTIVE_CLASS
                        : SIDEBAR_SUBMENU_ROW_INACTIVE_CLASS
                    }`}
                  >
                    {isDraftThread ? (
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center ${
                          isActiveThread
                            ? "text-[#6e59db]"
                            : "text-[#beb9e8] group-hover:text-[#aba4e3]"
                        }`}
                      >
                        <DraftThreadIcon size={17} />
                      </span>
                    ) : null}
                    <span
                      className={`${SIDEBAR_SUBMENU_LABEL_CLASS} ${
                        isActiveThread
                          ? SIDEBAR_SUBMENU_LABEL_ACTIVE_CLASS
                          : SIDEBAR_SUBMENU_LABEL_INACTIVE_CLASS
                      }`}
                    >
                      {thread.title}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => onDeleteThread(thread)}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-100 bg-white/90 text-red-500 opacity-0 shadow-[0_10px_20px_rgba(220,38,38,0.08)] transition group-hover:opacity-100 group-focus-within:opacity-100 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Delete ${thread.title}`}
                    title="Delete chat"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })
          ) : (
            <div
              className={`${SIDEBAR_SUBMENU_CARD_CLASS} rounded-[24px] border-dashed px-4 py-6 text-center text-sm text-[#7e76b9]`}
            >
              No AI chats yet.
            </div>
          )}
        </section>
      </div>
    </SidebarListPanel>
  );
}

function FooterProfileMenu({
  isOpen,
  menuOpen,
  setMenuOpen,
  buttonRef,
  menuRef,
  profileInitials,
  profileAvatarUrl,
  userTitleLabel,
  userEmail,
  footerMenuItems,
  isCompact,
}: {
  isOpen: boolean;
  menuOpen: boolean;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
  buttonRef: RefObject<HTMLButtonElement | null>;
  menuRef: RefObject<HTMLDivElement | null>;
  profileInitials: string;
  profileAvatarUrl?: string | null;
  userTitleLabel: string;
  userEmail?: string;
  footerMenuItems: Array<{
    href: string;
    label: string;
    colorClass: string;
    bgClass: string;
  }>;
  isCompact: boolean;
}) {
  return (
    <div
      className={`absolute bottom-0 left-0 right-0 z-[40] bg-transparent pb-[max(1rem,env(safe-area-inset-bottom))] pt-6 ${
        isCompact ? "px-[17px]" : "px-4"
      }`}
    >
      <div className="relative z-[900]">
        <button
          ref={buttonRef}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen((value) => !value);
          }}
          onMouseDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          aria-expanded={menuOpen}
          aria-label={`Account menu for ${userTitleLabel}`}
          title={isCompact ? userTitleLabel : undefined}
          className={`${isCompact ? "inline-flex h-11 w-11 items-center justify-center rounded-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500" : SIDEBAR_FOOTER_TRIGGER_CLASS} ${
            menuOpen
              ? "ring-2 ring-[rgba(110,94,181,0.14)] shadow-[0_22px_40px_rgba(123,112,206,0.18)]"
              : ""
          }`}
        >
          <div className="min-w-0 flex-1 inline-flex items-center gap-3.5">
            <span className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-[linear-gradient(135deg,#7f67ff_0%,#6f7aff_100%)] text-[15px] font-bold text-white shadow-[0_12px_22px_rgba(102,93,219,0.22)]">
              {profileAvatarUrl ? (
                <Image
                  src={profileAvatarUrl}
                  alt=""
                  fill
                  sizes="44px"
                  unoptimized
                  className="object-cover"
                />
              ) : (
                profileInitials
              )}
            </span>
            <div className={isCompact ? "hidden" : "min-w-0 flex-1 text-left"}>
              <div className="truncate text-[13px] font-bold leading-tight text-[#5e54b7]">
                {userTitleLabel}
              </div>
              {userEmail ? (
                <div className="truncate text-[11px] text-[#77718f]">{userEmail}</div>
              ) : null}
            </div>
          </div>
          <span className={isCompact ? "hidden" : "pr-1 text-[#8a80df]"} aria-hidden="true">
            <ChevronRight size={16} />
          </span>
        </button>

        {isOpen ? (
          <div
            ref={menuRef}
            inert={!menuOpen}
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            className={`nav-chrome-menu-card pointer-events-auto !absolute z-[1000] max-h-[calc(100dvh-8rem)] w-full max-w-[18rem] origin-bottom-right !overflow-y-auto rounded-[24px] p-1.5 transition-all duration-300 ease-out ${
              menuOpen
                ? "translate-y-0 scale-100 opacity-100"
                : "pointer-events-none translate-y-4 scale-90 opacity-0"
            }`}
            style={{
              right: 0,
              bottom: "calc(100% + 0.5rem)",
            }}
          >
            <div className="flex flex-col space-y-0.5">
              {footerMenuItems.map(({ href, label, colorClass, bgClass }) => {
                const Icon = footerItemIcons[label] || User;
                return (
                  <Link
                    key={label}
                    href={href}
                    onClick={() => {
                      setMenuOpen(false);
                    }}
                    className={SIDEBAR_SUBMENU_ENTRY_CLASS}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/70 ${bgClass} ${colorClass} shadow-[0_10px_20px_rgba(103,88,160,0.08)] transition-transform group-hover:scale-105`}
                    >
                      <Icon size={16} />
                    </span>
                    <span className="text-[13px] font-medium text-[var(--nav-chrome-ink)]">
                      {label}
                    </span>
                  </Link>
                );
              })}

              <div className="nav-chrome-divider mx-2 my-1 h-px" />

              <button
                type="button"
                onClick={() => {
                  void secureSignOut("/");
                }}
                className={SIDEBAR_SUBMENU_ENTRY_CLASS}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/70 bg-red-50 text-red-400 shadow-[0_10px_20px_rgba(103,88,160,0.08)] transition-transform group-hover:scale-105">
                  <LogOut size={16} />
                </span>
                <span className="text-[13px] font-medium text-red-400">Log out</span>
              </button>
              <div className="nav-chrome-divider mx-2 my-1 h-px" />
              <div className="px-1.5 pb-3 pt-3">
                <EnvitefySocialLinks placement="menu" />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function LeftSidebar() {
  const { data: session, status } = useSession();
  const menu = useMenu();
  const { historySidebarItems } = useEventCache();
  const sidebar = useSidebar();
  const desktopHoverRef = useRef(false);
  const desktopFocusRef = useRef(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isChatPath = (pathname || "").replace(/\/+$/, "") === "/chat";
  const activeAiThreadId = searchParams.get("thread")?.trim() || null;
  const isSnapUploadStartActive = (pathname || "").replace(/\/+$/, "") === "/snap";
  const [aiThreads, setAiThreads] = useState<CreationThreadSummary[]>([]);
  const drafts = useMemo(() => buildSidebarDraftItems({
    history: historySidebarItems,
    threads: aiThreads,
    buildEditLink,
    isInvitedEventLikeRecord,
  }), [historySidebarItems, aiThreads]);

  useEffect(() => {
    if (status !== "authenticated") {
      setAiThreads([]);
      return;
    }

    let cancelled = false;
    async function loadAiThreads() {
      try {
        const response = await fetch("/api/creation/threads?limit=20", {
          cache: "no-store",
          credentials: "include",
        });
        const json = (await response.json().catch(() => null)) as CreationThreadsResponse | null;
        if (cancelled || !response.ok || !json?.ok) return;
        setAiThreads(json.threads);
      } catch {}
    }

    void loadAiThreads();
    window.addEventListener("envitefy:creation-threads-changed", loadAiThreads);
    return () => {
      cancelled = true;
      window.removeEventListener("envitefy:creation-threads-changed", loadAiThreads);
    };
  }, [status, pathname]);

  const viewModel = useLeftSidebarController({
    session,
    status,
    menu,
    historySidebarItems: historySidebarItems as any,
    sidebar,
    router,
    pathname,
    searchParams,
  });

  useEffect(() => {
    if (!viewModel.isDesktop) {
      desktopHoverRef.current = false;
      desktopFocusRef.current = false;
      return;
    }
    sidebar.setDesktopPeek(viewModel.menuOpen || desktopHoverRef.current || desktopFocusRef.current);
  }, [viewModel.isDesktop, viewModel.menuOpen, sidebar.setDesktopPeek]);

  if (!viewModel.isReady) return null;
  if (viewModel.isEmbeddedEditMode) return null;

  const panelTransitionStyle: CSSProperties = {
    transition: "transform 400ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 220ms ease-in-out",
  };
  const showRootPanel = viewModel.isCompact || viewModel.sidebarPage === "root";
  const rootPanelTransform = showRootPanel ? "translateX(0%)" : "translateX(-2rem)";
  const createEventPanelTransform =
    viewModel.sidebarPage === "createEvent"
      ? "translateX(0%)"
      : viewModel.sidebarPage === "createEventOther"
        ? "translateX(-2rem)"
        : "translateX(100%)";
  const createEventOtherPanelTransform =
    viewModel.sidebarPage === "createEventOther" ? "translateX(0%)" : "translateX(100%)";
  const aiThreadsPanelTransform =
    viewModel.sidebarPage === "aiThreads" ? "translateX(0%)" : "translateX(100%)";
  const adminPanelTransform =
    viewModel.sidebarPage === "admin" ? "translateX(0%)" : "translateX(100%)";
  const draftsPanelTransform =
    viewModel.sidebarPage === "drafts" ? "translateX(0%)" : "translateX(100%)";
  const showOwnerEventsPanel =
    viewModel.sidebarPage === "myEvents" ||
    (viewModel.sidebarPage === "eventContext" &&
      viewModel.eventContextSourcePage === "myEvents" &&
      viewModel.eventSidebarMode === "owner");
  const showEventContextPanel =
    viewModel.sidebarPage === "eventContext" &&
    !(viewModel.eventContextSourcePage === "myEvents" && viewModel.eventSidebarMode === "owner");
  const myEventsPanelTransform = showOwnerEventsPanel
    ? "translateX(0%)"
    : viewModel.sidebarPage === "eventContext" && viewModel.eventContextSourcePage === "myEvents"
      ? "translateX(-2rem)"
      : "translateX(100%)";
  const invitedEventsPanelTransform =
    viewModel.sidebarPage === "invitedEvents"
      ? "translateX(0%)"
      : viewModel.sidebarPage === "eventContext" &&
          viewModel.eventContextSourcePage === "invitedEvents"
        ? "translateX(-2rem)"
        : "translateX(100%)";
  const eventPanelTransform = showEventContextPanel ? "translateX(0%)" : "translateX(100%)";
  const panelStyle = (transform: string, isActive: boolean): CSSProperties => ({
    ...panelTransitionStyle,
    transform,
    pointerEvents: isActive ? "auto" : "none",
    opacity: isActive ? 1 : 0,
  });

  async function deleteAiThread(thread: CreationThreadSummary) {
    const previousThreads = aiThreads;
    setAiThreads((current) => current.filter((item) => item.id !== thread.id));
    try {
      const response = await fetch(`/api/creation/threads/${encodeURIComponent(thread.id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        setAiThreads(previousThreads);
        return;
      }
      if (activeAiThreadId === thread.id) {
        router.push("/chat");
      }
      window.dispatchEvent(new CustomEvent("envitefy:creation-threads-changed"));
    } catch {
      setAiThreads(previousThreads);
    }
  }

  const showFullMobileTopBar = viewModel.showMobileTopBar && !isChatPath;
  const showChatTopBarReveal = viewModel.showMobileTopBar && isChatPath;

  return (
    <Sidebar open={viewModel.isOpen}>
      {showChatTopBarReveal ? (
        <button
          data-app-navigation="reveal"
          type="button"
          className="nav-chrome-pill-secondary nav-chrome-motion fixed left-3 top-[max(0.35rem,env(safe-area-inset-top))] z-[6600] inline-flex h-10 w-10 min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation items-center justify-center rounded-full lg:hidden"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            viewModel.openSidebarFromTrigger();
          }}
          aria-label="Open navigation"
        >
          <SidebarNavigationMenuIcon size={24} />
        </button>
      ) : null}
      {!viewModel.isOpen ? (
        <MobileNavHeader
          visible={showFullMobileTopBar}
          onOpenNavigation={viewModel.openSidebarFromTrigger}
          onHome={viewModel.goHomeFromSidebar}
          openButtonRef={viewModel.openBarButtonRef}
          menuIcon={<SidebarNavigationMenuIcon />}
        />
      ) : null}

      <div
        data-app-navigation="drawer-backdrop"
        className={`nav-chrome-mobile-drawer-backdrop nav-chrome-sidebar-backdrop fixed inset-0 z-[5999] transition-opacity duration-200 lg:hidden ${
          viewModel.isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => {
          if (viewModel.isDesktop) return;
          viewModel.closeSidebarFromBackdrop();
        }}
        aria-hidden="true"
      />

      <SidebarBody
        ref={viewModel.asideRef}
        data-app-navigation="sidebar"
        data-sidebar-state={viewModel.isCompact ? "collapsed" : "expanded"}
        data-sidebar-pinned={sidebar.desktopPinned}
        width={viewModel.sidebarWidth}
        onPointerEnter={(event) => {
          if (!viewModel.isDesktop || event.pointerType !== "mouse") return;
          desktopHoverRef.current = true;
          sidebar.setDesktopPeek(true);
        }}
        onPointerLeave={() => {
          if (!viewModel.isDesktop) return;
          desktopHoverRef.current = false;
          sidebar.setDesktopPeek(desktopFocusRef.current || viewModel.menuOpen);
        }}
        onFocusCapture={(event) => {
          if (!viewModel.isDesktop || !event.target.matches(":focus-visible")) return;
          desktopFocusRef.current = true;
          sidebar.setDesktopPeek(true);
        }}
        onPointerDownCapture={() => {
          desktopFocusRef.current = false;
        }}
        onKeyDownCapture={(event) => {
          if (!viewModel.isDesktop || !["Tab", "Enter", " "].includes(event.key)) return;
          desktopFocusRef.current = true;
          sidebar.setDesktopPeek(true);
        }}
        onBlurCapture={(event) => {
          if (!viewModel.isDesktop || event.currentTarget.contains(event.relatedTarget)) return;
          // Switching a keyboard-selected menu makes its old panel inert.
          // Move focus into the new panel before allowing the rail to close.
          if (desktopFocusRef.current && !event.relatedTarget) {
            window.requestAnimationFrame(() => {
              const aside = viewModel.asideRef.current;
              if (!aside) return;
              if (document.activeElement === document.body) {
                aside.querySelector<HTMLElement>('[data-sidebar-detail-panel]:not([inert]) button, [data-sidebar-root-panel]:not([inert]) a[href]')?.focus();
              }
              desktopFocusRef.current = aside.contains(document.activeElement);
              sidebar.setDesktopPeek(desktopFocusRef.current || desktopHoverRef.current);
            });
            return;
          }
          desktopFocusRef.current = false;
          sidebar.setDesktopPeek(desktopHoverRef.current);
        }}
        onClickCapture={animateSidebarPress}
        role={!viewModel.isDesktop && viewModel.isOpen ? "dialog" : undefined}
        aria-modal={!viewModel.isDesktop && viewModel.isOpen ? true : undefined}
        aria-hidden={!viewModel.isDesktop && !viewModel.isOpen ? true : undefined}
        inert={!viewModel.isDesktop && !viewModel.isOpen}
        tabIndex={-1}
        className={`nav-chrome-sidebar-surface fixed left-0 top-0 z-[6000] flex h-full max-w-[100vw] flex-col border-r border-[rgba(112,97,168,0.14)] ${viewModel.overflowClass} transition-[transform,opacity] duration-200 motion-reduce:transition-none ${viewModel.pointerClass} lg:flex`}
        style={{
          height: viewModel.isDesktop ? "100%" : "100dvh",
          transform: viewModel.sidebarTransform,
          opacity: viewModel.isDesktop ? 1 : viewModel.isOpen ? 1 : 0,
          boxShadow: viewModel.isCompact ? "none" : "8px 0 40px rgba(88, 71, 171, 0.06)",
        }}
        aria-label="Sidebar"
      >
        <div className="relative h-full w-full transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]">
          <div
            className="relative h-full max-w-[100vw] overflow-hidden"
            data-sidebar-content-canvas
            style={{ width: viewModel.isDesktop ? SIDEBAR_WIDTH_REM : "100%" }}
          >
            <div className="nav-chrome-sidebar-surface absolute inset-0 z-[1] flex h-full flex-col">
              <div className={`relative z-10 flex h-[116px] shrink-0 items-start pt-[calc(1.25rem+env(safe-area-inset-top,0px))] lg:pt-5 ${viewModel.isCompact ? "px-[17px]" : "px-6"}`}>
                <Link
                  href="/"
                  onClick={viewModel.goHomeFromSidebar}
                  className="inline-flex h-14 max-w-full items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                  aria-label="Envitefy home"
                >
                  {viewModel.isCompact ? (
                    <Image src={sidebarBrandIcon} alt="" className="h-11 w-11 shrink-0 object-contain" priority />
                  ) : (
                    <Image src={sidebarBrandWordmark} alt="" className="h-auto w-[196px] object-contain" priority />
                  )}
                </Link>
                {viewModel.isDesktop ? (
                  <button
                    type="button"
                    aria-label={sidebar.desktopPinned ? "Collapse sidebar" : "Keep sidebar open"}
                    aria-pressed={sidebar.desktopPinned}
                    onClick={() => {
                      const pinned = !sidebar.desktopPinned;
                      sidebar.setDesktopPinned(pinned);
                      if (!pinned) {
                        desktopFocusRef.current = false;
                        sidebar.setDesktopPeek(false);
                      }
                    }}
                    className={`absolute inline-flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:bg-white hover:text-[#6b5fc2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${sidebar.desktopPinned ? "bg-white/70 text-[#6b5fc2]" : "text-[rgba(107,95,194,0.64)]"} ${viewModel.isCompact ? "bottom-0 left-[17px]" : "right-4 top-7"}`}
                  >
                    {viewModel.isCompact ? <PanelLeftOpen size={18} aria-hidden="true" /> : <Pin size={18} aria-hidden="true" className={sidebar.desktopPinned ? "fill-current" : undefined} />}
                  </button>
                ) : (
                  <button type="button" aria-label="Close navigation" onClick={() => sidebar.setIsCollapsed(true)} className="absolute right-3 top-7 flex h-11 w-11 items-center justify-center rounded-xl text-[#77718f] hover:bg-white focus-visible:ring-2 focus-visible:ring-violet-500">
                    <X size={20} aria-hidden="true" />
                  </button>
                )}
              </div>

              <div className="flex min-h-0 flex-1 flex-col">
                <div className="relative min-h-0 flex-1 overflow-clip">
                  <div
                    className={`${SIDEBAR_PANEL_CLASS} !px-3 z-[5]`}
                    data-sidebar-root-panel
                    style={{
                      ...panelStyle(rootPanelTransform, showRootPanel),
                      width: viewModel.isCompact ? SIDEBAR_COLLAPSED_REM : "100%",
                    }}
                    aria-hidden={!showRootPanel}
                    inert={!showRootPanel}
                  >
                    <RootNavigationPanel
                      pathname={pathname}
                      sidebarPage={viewModel.sidebarPage}
                      eventContextSourcePage={viewModel.eventContextSourcePage}
                      hasCreateEventAccess={viewModel.hasCreateEventAccess}
                      createEntryLabel={viewModel.createEntryLabel}
                      isCreateEntryActive={viewModel.isCreateEntryActive}
                      isSnapUploadActive={isSnapUploadStartActive}
                      isAdmin={viewModel.isAdmin}
                      createdEventsCount={viewModel.createdEventsCount}
                      draftsCount={drafts.length}
                      onHome={viewModel.goHomeFromSidebar}
                      onSnapUpload={viewModel.handleRootSnapNavigate}
                      onAiThreads={viewModel.openAiThreadsPage}
                      onCreate={viewModel.openCreateEventPage}
                      onMyEvents={viewModel.openMyEventsPage}
                      onDrafts={viewModel.openDraftsPage}
                      onAdmin={viewModel.openAdminPage}
                    />
                  </div>

                  <div
                    className={`${SIDEBAR_LIST_PANEL_CLASS} z-[9]`}
                    style={panelStyle(adminPanelTransform, viewModel.sidebarPage === "admin")}
                    data-sidebar-detail-panel
                    inert={viewModel.isCompact || (viewModel.sidebarPage !== "admin")}
                    aria-hidden={viewModel.sidebarPage !== "admin"}
                  >
                    <AdminNavigationPanel pathname={pathname} onBack={viewModel.backToRoot} />
                  </div>

                  <div
                    className={`${SIDEBAR_LIST_PANEL_CLASS} z-[9]`}
                    style={panelStyle(
                      aiThreadsPanelTransform,
                      viewModel.sidebarPage === "aiThreads",
                    )}
                    data-sidebar-detail-panel
                    inert={viewModel.isCompact || (viewModel.sidebarPage !== "aiThreads")}
                    aria-hidden={viewModel.sidebarPage !== "aiThreads"}
                  >
                    <AiThreadsPanel
                      threads={aiThreads}
                      activeThreadId={activeAiThreadId}
                      onBack={viewModel.backToRoot}
                      onNewChat={viewModel.startNewAiChat}
                      onOpenThread={viewModel.openAiThread}
                      onDeleteThread={deleteAiThread}
                    />
                  </div>

                  <div
                    className={`${SIDEBAR_LIST_PANEL_CLASS} z-[10]`}
                    style={panelStyle(
                      createEventPanelTransform,
                      viewModel.sidebarPage === "createEvent",
                    )}
                    data-sidebar-detail-panel
                    inert={viewModel.isCompact || (viewModel.sidebarPage !== "createEvent")}
                    aria-hidden={viewModel.sidebarPage !== "createEvent"}
                  >
                    <CreatePanel
                      title="Create Event"
                      onBack={viewModel.backToCreateEvent}
                      items={viewModel.createMenuItems}
                      isItemActive={viewModel.isCreateMenuButtonActive}
                      onSelect={viewModel.handleCreateModalSelect}
                      otherItems={viewModel.otherCreateMenuItems}
                      isOtherEventsActive={viewModel.isOtherEventsActive}
                      onOpenOther={viewModel.openCreateEventOther}
                    />
                  </div>

                  <div
                    className={`${SIDEBAR_LIST_PANEL_CLASS} z-[12]`}
                    style={panelStyle(
                      createEventOtherPanelTransform,
                      viewModel.sidebarPage === "createEventOther",
                    )}
                    data-sidebar-detail-panel
                    inert={viewModel.isCompact || (viewModel.sidebarPage !== "createEventOther")}
                    aria-hidden={viewModel.sidebarPage !== "createEventOther"}
                  >
                    <CreatePanel
                      title="Other Events"
                      onBack={viewModel.backToCreateEventOther}
                      items={viewModel.otherCreateMenuItems}
                      isItemActive={viewModel.isCreateMenuButtonActive}
                      onSelect={viewModel.handleCreateModalSelect}
                      otherItems={[]}
                      isOtherEventsActive={false}
                      onOpenOther={() => {}}
                    />
                  </div>

                  <div
                    className={`${SIDEBAR_LIST_PANEL_CLASS} z-[15]`}
                    style={panelStyle(myEventsPanelTransform, showOwnerEventsPanel)}
                    data-sidebar-detail-panel
                    inert={viewModel.isCompact || (!showOwnerEventsPanel)}
                    aria-hidden={!showOwnerEventsPanel}
                  >
                    <EventListPanel
                      title="My Events"
                      grouped={viewModel.myEventsGrouped}
                      emptyStateCopy="No events yet."
                      emptyPastCopy="No past events."
                      isHistoryRowActive={viewModel.isHistoryRowActive}
                      onRowClick={viewModel.openOwnerEventContext}
                      pastExpanded={viewModel.showPastMyEvents}
                      setPastExpanded={viewModel.setShowPastMyEvents}
                      showPendingBadge={false}
                      pastRowOpacityClass="opacity-75 saturate-75"
                      onBack={viewModel.backToRoot}
                    />
                  </div>

                  <div
                    className={`${SIDEBAR_LIST_PANEL_CLASS} z-[20]`}
                    style={panelStyle(
                      invitedEventsPanelTransform,
                      viewModel.sidebarPage === "invitedEvents",
                    )}
                    data-sidebar-detail-panel
                    inert={viewModel.isCompact || (viewModel.sidebarPage !== "invitedEvents")}
                    aria-hidden={viewModel.sidebarPage !== "invitedEvents"}
                  >
                    <EventListPanel
                      title="Invited Events"
                      grouped={viewModel.invitedEventsGrouped}
                      emptyStateCopy="No invited events yet."
                      emptyPastCopy="No past invited events."
                      isHistoryRowActive={viewModel.isHistoryRowActive}
                      onRowClick={viewModel.openGuestEventContext}
                      pastExpanded={viewModel.showPastInvitedEvents}
                      setPastExpanded={viewModel.setShowPastInvitedEvents}
                      showPendingBadge
                      pastRowOpacityClass="opacity-70 saturate-75"
                      onBack={viewModel.backToRoot}
                    />
                  </div>

                  <div
                    className={`${SIDEBAR_LIST_PANEL_CLASS} z-[20]`}
                    style={panelStyle(draftsPanelTransform, viewModel.sidebarPage === "drafts")}
                    data-sidebar-detail-panel
                    inert={viewModel.isCompact || (viewModel.sidebarPage !== "drafts")}
                    aria-hidden={viewModel.sidebarPage !== "drafts"}
                  >
                    <DraftsPanel
                      drafts={drafts}
                      onBack={viewModel.backToRoot}
                      onNavigate={viewModel.onDraftNavigate}
                    />
                  </div>

                  <div
                    className={`${SIDEBAR_EVENT_PANEL_CLASS} z-[30]`}
                    style={panelStyle(eventPanelTransform, showEventContextPanel)}
                    data-sidebar-detail-panel
                    inert={viewModel.isCompact || (!showEventContextPanel)}
                    aria-hidden={!showEventContextPanel}
                  >
                    <EventSidebar
                      ref={viewModel.eventSidebarRef}
                      activeEventTab={viewModel.activeEventTab}
                      onBack={viewModel.handleSidebarBackToEvents}
                      onTabChange={viewModel.handleEventTabChange}
                      mode={viewModel.eventSidebarMode}
                      backLabel={
                        viewModel.eventContextSourcePage === "invitedEvents"
                          ? "Invited Events"
                          : "My Events"
                      }
                    />
                  </div>
                </div>
              </div>

              <FooterProfileMenu
                isOpen={viewModel.isOpen}
                menuOpen={viewModel.menuOpen}
                setMenuOpen={(next) => {
                  const open = typeof next === "function" ? next(viewModel.menuOpen) : next;
                  viewModel.setMenuOpen(open);
                  if (viewModel.isDesktop) sidebar.setDesktopPeek(open || desktopHoverRef.current || desktopFocusRef.current);
                }}
                buttonRef={viewModel.buttonRef}
                menuRef={viewModel.menuRef}
                profileInitials={viewModel.profileInitials}
                profileAvatarUrl={viewModel.profileAvatarUrl}
                userTitleLabel={viewModel.userTitleLabel}
                userEmail={viewModel.userEmail}
                footerMenuItems={viewModel.footerMenuItems}
                isCompact={viewModel.isCompact}
              />
            </div>
          </div>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}
