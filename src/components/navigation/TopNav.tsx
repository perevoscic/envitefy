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

const NAV_LINKS: Array<{
  label: string;
  href: string;
  match: (path: string) => boolean;
}> = [
  { label: "Home", href: "/", match: (path) => path === "/" },
  {
    label: "Create Event",
    href: "/event/new",
    match: (path) => path.startsWith("/event"),
  },
  {
    label: "Calendar",
    href: "/calendar",
    match: (path) => path.startsWith("/calendar"),
  },
  {
    label: "Smart sign-up",
    href: "/smart-signup-form",
    match: (path) => path.startsWith("/smart-signup-form"),
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
  const dropdownRef = useRef<HTMLDivElement | null>(null);

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
    if (!openRecent) return;
    const handleClick = (event: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (
        event.target instanceof Node &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpenRecent(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenRecent(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [openRecent]);

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
          <Link
            href="/event/new"
            className="rounded-full bg-[#7f8cff] px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-[#7f8cff]/30 transition hover:-translate-y-0.5"
          >
            New event
          </Link>
        </div>
      </div>
    </div>
  );
}
