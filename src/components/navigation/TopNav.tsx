"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useSidebar } from "@/app/sidebar-context";

type HistoryItem = {
  id: string;
  title: string;
  created_at?: string;
};

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

const MAX_HISTORY = 8;
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
  const { status } = useSession();
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [openRecent, setOpenRecent] = useState(false);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const createDropdownRef = useRef<HTMLDivElement | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/history?view=summary&limit=40", {
        cache: "no-cache",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({ items: [] }));
      const items = Array.isArray(data?.items) ? data.items : [];
      setHistory(
        items.slice(0, MAX_HISTORY).map((item: any) => ({
          id: item.id,
          title: item.title || "Untitled event",
          created_at: item.created_at,
        }))
      );
    } catch {
      // ignore
    }
  }, []);

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
    let cancelled = false;
    (async () => {
      await loadHistory();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [shouldShowNav, loadHistory]);

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
    if (!openRecent && !createEventOpen) return;
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
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenRecent(false);
        setCreateEventOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [openRecent, createEventOpen]);

  if (!shouldShowNav) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 top-0 z-40 w-full border-b border-white/60 bg-white/95 text-[#1b1540] shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex flex-shrink-0 items-center gap-3">
          <button
            type="button"
            aria-label="Toggle sidebar"
            onClick={() => toggleSidebar()}
            className="inline-flex h-10 w-10 items-center justify-center "
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
                    <div className="rounded-2xl border border-[#ece9ff] bg-white/95 p-2 text-sm shadow-xl backdrop-blur-md">
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
              <div className="absolute right-0 mt-2 w-80 rounded-3xl border border-[#ece9ff] bg-white/95 p-4 text-sm shadow-xl">
                {history.length === 0 ? (
                  <p className="text-[#7a7595]">No history yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {history.map((item) => (
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
              <div className="absolute right-0 mt-2 w-64 rounded-3xl border border-[#ece9ff] bg-white/95 p-2 text-sm shadow-xl">
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
        </div>
      </div>
    </div>
  );
}
