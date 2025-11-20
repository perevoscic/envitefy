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

type HistoryItem = {
  id: string;
  title: string;
  created_at?: string;
  category?: string;
};

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

const TEMPLATE_LINKS = [
  { label: "Birthdays", href: "/event/birthdays", icon: "🎂" },
  { label: "Weddings", href: "/event/weddings", icon: "💍" },
  { label: "Baby Showers", href: "/event/baby-showers", icon: "🍼" },
  { label: "Gender Reveal", href: "/event/gender-reveal", icon: "🎈" },
  { label: "Sport Events", href: "/event/sport-events", icon: "🏅" },
  { label: "General Events", href: "/event/general", icon: "📅" },
] as const;

const NAV_LINKS: Array<{
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

const MAX_HISTORY = 40;
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

export default function TopNav() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();
  const [history, setHistory] = useState<HistoryItem[]>([]);
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

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const myEventsRef = useRef<HTMLDivElement | null>(null);
  const createDropdownRef = useRef<HTMLDivElement | null>(null);
  const profileDropdownRef = useRef<HTMLDivElement | null>(null);

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
            "/api/google/auth?source=topnav",
            "_blank",
            "noopener,noreferrer"
          );
        } else if (provider === "microsoft") {
          window.open(
            "/api/outlook/auth?source=topnav",
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

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/history?view=summary&limit=40", {
        cache: "no-cache",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({ items: [] }));
      const items = Array.isArray(data?.items) ? data.items : [];
      setHistory(
        items.map((item: any) => ({
          id: item.id,
          title: item.title || "Untitled event",
          created_at: item.created_at,
          category: item.category || "General Events",
        }))
      );
    } catch {
      // ignore
    }
  }, []);

  const groupedEvents = useMemo(() => {
    const grouped: Record<string, HistoryItem[]> = {};
    history.forEach((item) => {
      const cat = item.category || "General Events";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });
    return grouped;
  }, [history]);

  const shouldShowNav = status === "authenticated";

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.style.setProperty(
      "--top-nav-height",
      shouldShowNav ? NAV_HEIGHT : "0px"
    );
  }, [shouldShowNav]);

  useEffect(() => {
    if (!shouldShowNav) return;
    fetchConnectedCalendars();
    let cancelled = false;
    (async () => {
      await loadHistory();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [shouldShowNav, loadHistory, fetchConnectedCalendars]);

  useEffect(() => {
    const onCreated = (event: Event) => {
      const detail = (event as CustomEvent)?.detail;
      if (!detail?.id) return;
      setHistory((prev) => {
        const next = [
          {
            id: detail.id,
            title: detail.title || "Untitled event",
            created_at: detail.created_at,
            category: detail.category || "General Events",
          },
          ...prev.filter((item) => item.id !== detail.id),
        ];
        return next.slice(0, MAX_HISTORY);
      });
    };
    const onDeleted = (event: Event) => {
      const detail = (event as CustomEvent)?.detail;
      if (!detail?.id) return;
      setHistory((prev) => prev.filter((item) => item.id !== detail.id));
    };
    window.addEventListener("history:created", onCreated as EventListener);
    window.addEventListener("history:deleted", onDeleted as EventListener);
    return () => {
      window.removeEventListener("history:created", onCreated as EventListener);
      window.removeEventListener("history:deleted", onDeleted as EventListener);
    };
  }, []);

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
  }, [openRecent, createEventOpen, profileOpen, myEventsOpen]);

  if (!shouldShowNav) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 top-0 z-40 w-full border-b border-white/60 bg-white text-[#1b1540] shadow-sm backdrop-blur-none">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex flex-shrink-0 items-center gap-3">
          <button
            type="button"
            aria-label="Toggle sidebar"
            onClick={() => toggleSidebar()}
            className="inline-flex h-10 w-10 items-center justify-center lg:hidden"
          >
            <span className="flex h-5 w-6 flex-col justify-between">
              <span className="block h-0.75 w-full rounded-full bg-current" />
              <span className="block h-0.75 w-full rounded-full bg-current" />
              <span className="block h-0.75 w-full rounded-full bg-current" />
            </span>
          </button>
        </div>
        <div className="flex flex-1 justify-center lg:justify-start">
          <Link
            href="/"
            className="inline-flex items-center pr-10 gap-2 text-[#7f8cff]"
          >
            <Image
              src="/navElogo.png"
              alt="Envitefy logo"
              width={156}
              height={64}
              priority
            />
          </Link>
        </div>
        <nav className="hidden items-center gap-3 text-sm font-semibold text-[#564d7a] lg:flex">
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
                  <div className="absolute top-full left-0 mt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-left z-50">
                    <div className="rounded-2xl border border-[#ece9ff] bg-white p-2 text-sm shadow-xl">
                      <div className="flex flex-col gap-1">
                        {TEMPLATE_LINKS.map((item) => (
                          <Link
                            key={item.label}
                            href={item.href}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#f6f4ff] transition text-[#2f1d47] font-medium"
                          >
                            <span className="text-lg">{item.icon}</span>
                            <span>{item.label}</span>
                          </Link>
                        ))}
                      </div>
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
            <div
              className={`absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[800px] bg-white rounded-3xl border border-[#ece9ff] shadow-2xl p-8 z-50 transition-all duration-200 origin-top ${
                myEventsOpen
                  ? "opacity-100 visible scale-100"
                  : "opacity-0 invisible scale-95"
              }`}
              onMouseLeave={() => setMyEventsOpen(false)}
            >
              {Object.keys(groupedEvents).length === 0 ? (
                <p className="text-center text-[#7a7595]">No events found.</p>
              ) : (
                <div className="grid grid-cols-4 gap-8">
                  {Object.entries(groupedEvents).map(([category, items]) => (
                    <div key={category} className="flex flex-col gap-3">
                      <h3 className="font-serif text-xl text-[#2f1d47] font-bold border-b border-[#ece9ff] pb-2 mb-1">
                        {category}
                      </h3>
                      <div className="flex flex-col gap-2">
                        {items.slice(0, 8).map((item) => (
                          <Link
                            key={item.id}
                            href={`/event/${item.id}`}
                            className="text-[#564d7a] hover:text-[#7f8cff] text-sm transition-colors truncate block py-1"
                            onClick={() => setMyEventsOpen(false)}
                          >
                            {item.title}
                          </Link>
                        ))}
                        {items.length > 8 && (
                          <span className="text-xs text-[#7a7595] italic pl-1">
                            + {items.length - 8} more...
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
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
              <div className="absolute right-0 mt-2 w-64 rounded-3xl border border-[#ece9ff] bg-white p-2 text-sm shadow-xl z-50">
                <div className="flex flex-col gap-1">
                  {TEMPLATE_LINKS.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setCreateEventOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#f6f4ff] transition text-[#2f1d47] font-medium"
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
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
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-3xl border border-[#ece9ff] bg-white p-2 text-sm shadow-xl z-50">
                <div className="flex flex-col p-1">
                  <Link
                    href="/settings"
                    onClick={() => setProfileOpen(false)}
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
                    onClick={() => setProfileOpen(false)}
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
                    onClick={() => setProfileOpen(false)}
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
                    onClick={() => setProfileOpen(false)}
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
                        setCalendarsOpen((v) => !v);
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
                          <rect
                            x="3"
                            y="4"
                            width="18"
                            height="18"
                            rx="2"
                            ry="2"
                          />
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
                                    active
                                      ? "text-emerald-600"
                                      : "text-[#7a7595]"
                                  }`}
                                >
                                  <button
                                    type="button"
                                    title={
                                      active
                                        ? `${label} connected`
                                        : `Connect ${label}`
                                    }
                                    className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
                                      active
                                        ? "border-emerald-600 bg-emerald-50"
                                        : "border-[#dcd8ff] bg-white hover:border-[#7f8cff]"
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCalendarConnect(key);
                                    }}
                                  >
                                    <Icon className="h-4 w-4" />
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
                    <Link
                      href="/admin"
                      onClick={() => setProfileOpen(false)}
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
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      <span>Admin</span>
                    </Link>
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
