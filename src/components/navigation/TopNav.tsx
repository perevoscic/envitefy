"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useSidebar } from "@/app/sidebar-context";
import {
  CalendarIconGoogle,
  CalendarIconOutlook,
  CalendarIconApple,
} from "@/components/CalendarIcons";
import { useEventCategories } from "@/hooks/useEventCategories";
import { useMenu } from "@/contexts/MenuContext";
import {
  CREATE_EVENT_SECTIONS,
  TEMPLATE_LINKS,
} from "@/config/navigation-config";

type CalendarProviderKey = "google" | "microsoft" | "apple";

const CALENDAR_TARGETS: Array<{
  key: CalendarProviderKey;
  label: string;
  Icon: typeof CalendarIconGoogle;
}> = [
  { key: "google", label: "Google", Icon: CalendarIconGoogle },
  { key: "apple", label: "Apple", Icon: CalendarIconApple },
  { key: "microsoft", label: "Outlook", Icon: CalendarIconOutlook },
];

// Re-export TEMPLATE_LINKS for backward compatibility with left-sidebar
export { TEMPLATE_LINKS };

export const NAV_LINKS: Array<{
  label: string;
  href: string;
  match: (path: string) => boolean;
  icon?: string;
}> = [
  { label: "Home", href: "/", match: (path) => path === "/" },
  {
    label: "Create Event",
    href: "/event/new",
    match: (path) =>
      path.startsWith("/event") && !path.startsWith("/event/new"),
  },
  {
    label: "Smart sign-up",
    href: "/smart-signup-form",
    match: (path) => path.startsWith("/smart-signup-form"),
  },
  {
    label: "Calendar",
    href: "/calendar",
    match: (path) => path.startsWith("/calendar"),
  },
];

const NAV_HEIGHT = "4.5rem";

function formatRelative(date?: string) {
  if (!date) return "";
  try {
    const dt = new Date(date);
    if (Number.isNaN(dt.getTime())) return "";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(dt);
  } catch {
    return "";
  }
}

// Shared menu hook that both TopNav and Sidebar use
export function useUnifiedMenu() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const { categories, history } = useEventCategories();

  const [openRecent, setOpenRecent] = useState(false);
  const [myEventsOpen, setMyEventsOpen] = useState(false);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [calendarsOpen, setCalendarsOpen] = useState(false);
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

  useEffect(() => {
    if (calendarsOpen && status === "authenticated") {
      fetchConnectedCalendars();
    }
  }, [calendarsOpen, status, fetchConnectedCalendars]);

  return {
    session,
    status,
    pathname,
    categories,
    history,
    openRecent,
    setOpenRecent,
    myEventsOpen,
    setMyEventsOpen,
    createEventOpen,
    setCreateEventOpen,
    profileOpen,
    setProfileOpen,
    calendarsOpen,
    setCalendarsOpen,
    connectedCalendars,
    handleCalendarConnect,
    isAdmin,
    initials,
    displayName,
    formatRelative,
  };
}

// Shared menu components
export function MyEventsDropdown({
  categories,
  history,
  isOpen,
  onClose,
  variant = "topnav",
}: {
  categories: ReturnType<typeof useEventCategories>["categories"];
  history: ReturnType<typeof useEventCategories>["history"];
  isOpen: boolean;
  onClose: () => void;
  variant?: "topnav" | "sidebar";
}) {
  const myEventsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (
        myEventsRef.current &&
        event.target instanceof Node &&
        !myEventsRef.current.contains(event.target)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose]);

  if (variant === "topnav") {
    return (
      <div
        ref={myEventsRef}
        className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max max-w-[90vw] bg-white rounded-2xl border border-[#ece9ff] shadow-2xl p-6 z-50 transition-all duration-200 origin-top ${
          isOpen
            ? "opacity-100 visible scale-100"
            : "opacity-0 invisible scale-95"
        }`}
        onMouseLeave={onClose}
      >
        <div className="flex flex-row flex-wrap gap-8">
          {categories
            .filter((cat) => cat.items.length > 0)
            .map((category) => (
              <div key={category.name} className="flex flex-col min-w-[160px]">
                <h3 className="font-serif text-xl font-bold text-[#1b1540] mb-3 flex items-center gap-2 whitespace-nowrap">
                  {category.name}
                  <span className="text-xs font-normal bg-[#ece9ff] text-[#6b5b95] px-2 py-0.5 rounded-full">
                    {category.items.length}
                  </span>
                </h3>
                <div className="flex flex-col gap-1">
                  {category.items.slice(0, 5).map((item) => (
                    <Link
                      key={item.id}
                      href={`/event/${item.id}`}
                      className="text-sm text-[#564d7a] hover:text-[#2f1d47] hover:bg-[#f3f0ff] px-2 py-1 -mx-2 rounded-lg transition-colors truncate max-w-[200px]"
                      onClick={onClose}
                    >
                      {item.title}
                    </Link>
                  ))}
                  {category.items.length > 5 && (
                    <span className="text-xs text-[#9ca3af] px-2 py-1">
                      +{category.items.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          {categories.filter((cat) => cat.items.length > 0).length === 0 && (
            <div className="px-4 py-2 text-[#9ca3af]">No events yet</div>
          )}
        </div>
      </div>
    );
  }

  // Sidebar variant
  return null; // Sidebar will handle its own rendering
}

export function CreateEventMenu({ onSelect }: { onSelect?: () => void }) {
  return (
    <div className="flex min-w-[1260px] max-w-[1400px] flex-row flex-nowrap gap-10 overflow-x-auto px-2">
      {CREATE_EVENT_SECTIONS.map((section) => (
        <div
          key={section.title}
          className="flex min-w-[215px] max-w-[255px] flex-col gap-3"
        >
          <div className="flex items-center gap-2">
            <h3 className="whitespace-nowrap font-sans text-[13px] font-semibold uppercase tracking-[0.14em] text-[#1b1540]/85">
              {section.title}
            </h3>
            <span className="rounded-full bg-[#ece9ff] px-2 py-0.5 text-xs font-medium text-[#6b5b95]">
              {section.items.length}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {section.items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-start gap-3 rounded-xl px-3 py-2 font-medium text-[#2f1d47] transition hover:bg-[#f6f4ff]"
                onClick={onSelect}
              >
                <span className="text-lg leading-none">{item.icon ?? "•"}</span>
                <div className="flex flex-col leading-tight">
                  <span>{item.label}</span>
                  {item.description && (
                    <span className="text-xs text-[#7a7595]">
                      {item.description}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfileMenu({
  isOpen,
  onClose,
  isAdmin,
  initials,
  connectedCalendars,
  calendarsOpen,
  setCalendarsOpen,
  handleCalendarConnect,
  variant = "topnav",
}: {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  initials: string;
  connectedCalendars: {
    google: boolean;
    microsoft: boolean;
    apple: boolean;
  };
  calendarsOpen: boolean;
  setCalendarsOpen: (open: boolean) => void;
  handleCalendarConnect: (provider: CalendarProviderKey) => void;
  variant?: "topnav" | "sidebar";
}) {
  const profileRef = useRef<HTMLDivElement | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (
        profileRef.current &&
        event.target instanceof Node &&
        !profileRef.current.contains(event.target)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={profileRef}
      className={`${
        variant === "topnav"
          ? "absolute right-0 mt-2 w-64 rounded-3xl border border-[#ece9ff] bg-white p-2 text-sm shadow-xl z-50"
          : "p-2"
      }`}
    >
      <div className="flex flex-col p-1">
        <Link
          href="/settings"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#f6f4ff] transition text-[#2f1d47] font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <circle cx="12" cy="7" r="4" />
            <path d="M5.5 21v-2a6.5 6.5 0 0 1 13 0v2" />
          </svg>
          <span>Profile</span>
        </Link>
        <Link
          href="/calendar"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#f6f4ff] transition text-[#2f1d47] font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>Calendar</span>
        </Link>
        <Link
          href="/about"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#f6f4ff] transition text-[#2f1d47] font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>About us</span>
        </Link>
        <Link
          href="/contact"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#f6f4ff] transition text-[#2f1d47] font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          <span>Contact us</span>
        </Link>

        {/* Calendars Submenu Toggle */}
        <div className="mt-1 relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCalendarsOpen(!calendarsOpen);
            }}
            className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl hover:bg-[#f6f4ff] transition text-[#2f1d47] font-medium"
          >
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Calendars</span>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-4 w-4 transition-transform ${
                calendarsOpen ? "rotate-0" : "-rotate-90"
              }`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {calendarsOpen && (
            <div className="px-2 pb-2">
              <div className="rounded-xl border border-[#ece9ff] bg-white/50 p-2">
                <div className="flex justify-around">
                  {CALENDAR_TARGETS.map(({ key, label, Icon }) => {
                    const active = connectedCalendars[key];
                    return (
                      <div
                        key={key}
                        className={`flex flex-col items-center gap-1 text-[10px] ${
                          active ? "text-emerald-600" : "text-[#7a7595]"
                        }`}
                      >
                        <button
                          type="button"
                          title={
                            active ? `${label} connected` : `Connect ${label}`
                          }
                          className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition ${
                            active
                              ? "border-emerald-600 bg-emerald-100 ring-2 ring-emerald-600/20 shadow-lg shadow-emerald-600/25"
                              : "border-[#dcd8ff] bg-white hover:border-[#7f8cff]"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCalendarConnect(key);
                          }}
                        >
                          <Icon
                            className={`h-4 w-4 ${
                              active ? "text-emerald-700" : ""
                            }`}
                          />
                          {active && (
                            <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-emerald-600 flex items-center justify-center border-2 border-white shadow-md">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 12 12"
                                fill="none"
                                className="h-3 w-3 text-white"
                              >
                                <path
                                  d="M10 3L4.5 8.5L2 6"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          )}
                        </button>
                        <span>{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="mt-1 relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setAdminOpen(!adminOpen);
              }}
              className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl hover:bg-[#f6f4ff] transition text-[#2f1d47] font-medium"
            >
              <div className="flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>Admin</span>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`h-4 w-4 transition-transform ${
                  adminOpen ? "rotate-0" : "-rotate-90"
                }`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {adminOpen && (
              <div className="px-2 pb-2">
                <div className="rounded-xl border border-[#ece9ff] bg-white/50 p-2 space-y-1">
                  <Link
                    href="/admin"
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#f6f4ff] transition text-[#2f1d47] text-sm"
                  >
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    href="/admin/emails"
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#f6f4ff] transition text-[#2f1d47] text-sm"
                  >
                    <span>Emails</span>
                  </Link>
                  <Link
                    href="/admin/campaigns"
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#f6f4ff] transition text-[#2f1d47] text-sm"
                  >
                    <span>Campaigns</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#ece9ff] to-transparent my-1"></div>

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 transition font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Log out</span>
        </button>
      </div>
    </div>
  );
}

// TopNav Component - Desktop only
export default function TopNav() {
  const { toggleSidebar } = useSidebar();
  const {
    status,
    pathname,
    categories,
    history,
    connectedCalendars,
    handleCalendarConnect,
    isAdmin,
    initials,
  } = useMenu();

  const [openRecent, setOpenRecent] = useState(false);
  const [myEventsOpen, setMyEventsOpen] = useState(false);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [calendarsOpen, setCalendarsOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isInitialMount, setIsInitialMount] = useState(true);
  const isDashboardView = pathname === "/";
  const navIsScrolled = isDashboardView ? isScrolled : true;
  const createMenuTop = navIsScrolled ? 72 : 90;

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const myEventsRef = useRef<HTMLDivElement | null>(null);
  const createDropdownRef = useRef<HTMLDivElement | null>(null);
  const profileDropdownRef = useRef<HTMLDivElement | null>(null);

  const shouldShowNav = status === "authenticated";

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isDashboardView) {
      setIsInitialMount(false);
      return;
    }

    setIsInitialMount(true);
    const handleScroll = () => {
      // Show logo after scrolling past the big dashboard logo (approx 300px)
      setIsScrolled(window.scrollY > 300);
    };

    // Check initial scroll position immediately
    handleScroll();

    // For iOS Safari: check again after a frame to ensure scroll position is available
    requestAnimationFrame(() => {
      handleScroll();
      // After first check, enable transitions
      setTimeout(() => setIsInitialMount(false), 50);
    });

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isDashboardView]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.style.setProperty(
      "--top-nav-height",
      shouldShowNav ? NAV_HEIGHT : "0px"
    );
  }, [shouldShowNav]);

  useEffect(() => {
    if (!openRecent && !createEventOpen && !profileOpen && !myEventsOpen)
      return;
    const handleClick = (event: MouseEvent) => {
      if (
        openRecent &&
        dropdownRef.current &&
        event.target instanceof Node &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpenRecent(false);
      }
      if (
        createEventOpen &&
        createDropdownRef.current &&
        event.target instanceof Node &&
        !createDropdownRef.current.contains(event.target)
      ) {
        setCreateEventOpen(false);
      }
      if (
        profileOpen &&
        profileDropdownRef.current &&
        event.target instanceof Node &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
        setCalendarsOpen(false);
      }
      if (
        myEventsOpen &&
        myEventsRef.current &&
        event.target instanceof Node &&
        !myEventsRef.current.contains(event.target)
      ) {
        setMyEventsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenRecent(false);
        setCreateEventOpen(false);
        setProfileOpen(false);
        setCalendarsOpen(false);
        setMyEventsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [
    openRecent,
    createEventOpen,
    profileOpen,
    myEventsOpen,
    setOpenRecent,
    setCreateEventOpen,
    setProfileOpen,
    setCalendarsOpen,
    setMyEventsOpen,
  ]);

  if (!shouldShowNav) {
    return null;
  }

  return (
    <>
      {/* Mobile/Tablet Header with Hamburger */}
      <div
        className={`fixed inset-x-0 top-0 z-40 w-full text-[#1b1540] lg:hidden bg-[#F8F5FF] ${
          !isInitialMount ? "transition-all duration-300" : ""
        } ${
          navIsScrolled
            ? "border-b border-white/60 backdrop-blur-md shadow-sm"
            : ""
        }`}
        suppressHydrationWarning
      >
        <div
          className={`flex items-center justify-between px-4 ${
            navIsScrolled ? "py-3" : "py-5"
          }`}
          suppressHydrationWarning
        >
          <button
            type="button"
            aria-label="Toggle sidebar"
            onClick={() => toggleSidebar()}
            className="inline-flex h-10 w-10 items-center justify-center"
          >
            <span className="flex h-5 w-6 flex-col justify-between">
              <span className="block h-0.5 w-full rounded-full bg-current" />
              <span className="block h-0.5 w-full rounded-full bg-current" />
              <span className="block h-0.5 w-full rounded-full bg-current" />
            </span>
          </button>
          <Link
            href="/"
            className={`inline-flex items-center gap-2 text-[#7f8cff] transition-opacity duration-300 ${
              navIsScrolled ? "opacity-100" : "opacity-0"
            }`}
            suppressHydrationWarning
          >
            <Image
              src="/navElogo.png"
              alt="Envitefy logo"
              width={120}
              height={48}
              priority
            />
          </Link>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Desktop TopNav */}
      <div
        className={`fixed inset-x-0 top-0 z-40 w-full text-[#1b1540] hidden lg:block bg-[#F8F5FF] ${
          !isInitialMount ? "transition-all duration-300" : ""
        } ${
          navIsScrolled
            ? "border-b border-white/60 backdrop-blur-md shadow-sm"
            : ""
        }`}
        suppressHydrationWarning
      >
        <div
          className={`mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 ${
            navIsScrolled ? "py-3" : "py-5"
          }`}
          suppressHydrationWarning
        >
          <div className="flex flex-shrink-0 items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center pr-10 gap-2 text-[#7f8cff] opacity-100"
              suppressHydrationWarning
            >
              <Image
                src="/E.png"
                alt="Envitefy logo"
                width={64}
                height={64}
                priority
              />
            </Link>
          </div>
          <nav className="flex items-center gap-3 text-sm font-semibold text-[#564d7a]">
            {NAV_LINKS.map((link) => {
              const active = link.match(pathname || "");
              if (link.label === "Create Event") {
                return (
                  <div key={link.href} className="relative group">
                    <button
                      className={`rounded-full px-4 py-1.5 transition flex items-center gap-1 ${
                        active
                          ? "bg-[#ece9ff] text-[#281f52] shadow-sm"
                          : "hover:bg-white/70"
                      }`}
                    >
                      {link.label}
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="opacity-50 group-hover:opacity-100 transition-opacity"
                      >
                        <path
                          d="M2.5 4.5L6 8L9.5 4.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                  </svg>
                </button>
                <div
                  style={{ top: `${createMenuTop}px` }}
                  className="fixed left-1/2 -translate-x-1/2 mt-2 w-full max-w-[95vw] origin-top transform opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 flex justify-center"
                  suppressHydrationWarning
                >
                  <div className="rounded-3xl border border-[#ece9ff] bg-white p-4 text-sm shadow-2xl">
                    {isHydrated && <CreateEventMenu />}
                  </div>
                </div>
              </div>
            );
              }
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-4 py-1.5 transition ${
                    active
                      ? "bg-[#ece9ff] text-[#281f52] shadow-sm"
                      : "hover:bg-white/70"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* My Events Dropdown */}
            <div className="relative group" ref={myEventsRef}>
              <button
                className="rounded-full px-4 py-1.5 transition hover:bg-white/70 flex items-center gap-1"
                onMouseEnter={() => setMyEventsOpen(true)}
                onClick={() => setMyEventsOpen((prev) => !prev)}
              >
                My events
              </button>
              <MyEventsDropdown
                categories={categories}
                history={history}
                isOpen={myEventsOpen}
                onClose={() => setMyEventsOpen(false)}
                variant="topnav"
              />
            </div>
          </nav>
          <div className="flex items-center gap-3">
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setOpenRecent((prev) => !prev)}
                className="rounded-full border border-[#dcd8ff] bg-white px-4 py-1.5 text-sm font-semibold text-[#4a4170] shadow-sm transition hover:border-[#bfb6ff]"
                aria-haspopup="true"
                aria-expanded={openRecent}
              >
                Recent events
              </button>
              {openRecent && (
                <div className="absolute right-0 mt-2 w-80 rounded-3xl border border-[#ece9ff] bg-white p-4 text-sm shadow-xl z-50">
                  {history.length === 0 ? (
                    <p className="text-[#7a7595]">No history yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {history.slice(0, 5).map((item) => (
                        <li key={item.id}>
                          <Link
                            href={`/event/${item.id}`}
                            className="flex flex-col rounded-2xl border border-transparent px-3 py-2 transition hover:border-[#ded8ff] hover:bg-[#f6f4ff]"
                            onClick={() => setOpenRecent(false)}
                          >
                            <span className="font-semibold text-[#291f52]">
                              {item.title}
                            </span>
                            <span className="text-xs text-[#8078a3]">
                              {formatRelative(item.created_at)}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div className="relative" ref={createDropdownRef}>
              <button
                type="button"
                onClick={() => setCreateEventOpen((prev) => !prev)}
                className="rounded-full bg-[#7f8cff] px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-[#7f8cff]/30 transition hover:-translate-y-0.5 flex items-center gap-2"
                aria-haspopup="true"
                aria-expanded={createEventOpen}
              >
                <span>New event</span>
                <svg
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`h-4 w-4 transition-transform ${
                    createEventOpen ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {createEventOpen && (
                <div
                  style={{ top: `${createMenuTop}px` }}
                  className="fixed left-1/2 -translate-x-1/2 mt-2 w-full max-w-[95vw] rounded-3xl border border-[#ece9ff] bg-white p-4 text-sm shadow-2xl z-50 origin-top"
                  suppressHydrationWarning
                >
                  <CreateEventMenu onSelect={() => setCreateEventOpen(false)} />
                </div>
              )}
            </div>

            {/* Profile Menu Button */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((prev) => !prev)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dcd8ff] bg-[#FBF7F2] text-[#4a4170] shadow-sm transition hover:border-[#bfb6ff]"
                aria-label="Profile menu"
                aria-expanded={profileOpen}
              >
                <span className="text-sm font-bold">{initials}</span>
              </button>
              <ProfileMenu
                isOpen={profileOpen}
                onClose={() => {
                  setProfileOpen(false);
                  setCalendarsOpen(false);
                }}
                isAdmin={isAdmin}
                initials={initials}
                connectedCalendars={connectedCalendars}
                calendarsOpen={calendarsOpen}
                setCalendarsOpen={setCalendarsOpen}
                handleCalendarConnect={handleCalendarConnect}
                variant="topnav"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
