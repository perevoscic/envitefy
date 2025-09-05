"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "./providers";
import { useSidebar } from "./sidebar-context";
import { signOut, useSession } from "next-auth/react";
import Logo from "@/assets/logo.png";

export default function LeftSidebar() {
  const { data: session, status } = useSession();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [resourcesOpenFloating, setResourcesOpenFloating] = useState(false);
  const [itemMenuId, setItemMenuId] = useState<string | null>(null);
  const [itemMenuPos, setItemMenuPos] = useState<{
    left: number;
    top: number;
  } | null>(null);

  const { isCollapsed, setIsCollapsed, toggleSidebar } = useSidebar();
  const isOpen = !isCollapsed;
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const asideRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) setMenuOpen(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const isDesktop = () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(min-width: 768px)").matches;

    const onClick = (e: MouseEvent) => {
      if (isDesktop()) return; // Desktop: ignore outside clicks
      const target = e.target as Node | null;
      if (!asideRef.current) return;
      if (!asideRef.current.contains(target)) setIsCollapsed(true);
    };
    const onKey = (e: KeyboardEvent) => {
      if (isDesktop()) return; // Desktop: only close via X button
      if (e.key === "Escape") setIsCollapsed(true);
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, setIsCollapsed]);

  useEffect(() => {
    const onOutside = (e: Event) => {
      if (!menuOpen) return;
      const target = e.target as Node | null;
      const withinMenu = menuRef.current
        ? menuRef.current.contains(target as Node)
        : false;
      const withinButton = buttonRef.current
        ? buttonRef.current.contains(target as Node)
        : false;
      if (!withinMenu && !withinButton) {
        setMenuOpen(false);
        setResourcesOpen(false);
        setResourcesOpenFloating(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setResourcesOpen(false);
        setResourcesOpenFloating(false);
      }
    };
    // Use capture phase so it still triggers if inner handlers stop propagation
    document.addEventListener("pointerdown", onOutside, true);
    document.addEventListener("mousedown", onOutside, true);
    document.addEventListener("touchstart", onOutside, true);
    document.addEventListener("click", onOutside, true);
    document.addEventListener("focusin", onOutside, true);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("pointerdown", onOutside, true);
      document.removeEventListener("mousedown", onOutside, true);
      document.removeEventListener("touchstart", onOutside, true);
      document.removeEventListener("click", onOutside, true);
      document.removeEventListener("focusin", onOutside, true);
      document.removeEventListener("keydown", onEsc);
    };
  }, [menuOpen]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      try {
        const target = e.target as Element | null;
        const itemEl = target?.closest(
          "[data-history-item]"
        ) as HTMLElement | null;
        if (itemEl && itemEl.getAttribute("data-history-item") === itemMenuId) {
          return; // Click inside the currently open item's area → ignore
        }
      } catch {}
      setItemMenuId(null);
      setItemMenuPos(null);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setItemMenuId(null);
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [itemMenuId]);

  const displayName =
    (session?.user?.name as string) ||
    (session?.user?.email as string) ||
    "User";
  const isDark = theme === "dark";
  const initials = (() => {
    const base =
      (session?.user?.name as string) ||
      (session?.user?.email as string) ||
      "User";
    const parts = base.trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || base[0] || "U";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase();
  })();

  const [history, setHistory] = useState<
    { id: string; title: string; created_at?: string; data?: any }[]
  >([]);

  useEffect(() => {
    let cancelled = false;
    if (status !== "authenticated") return;
    (async () => {
      try {
        const res = await fetch("/api/history", { cache: "no-store" });
        const j = await res.json().catch(() => ({ items: [] }));
        if (!cancelled)
          setHistory(
            (j.items || []).map((r: any) => ({
              id: r.id,
              title: r.title,
              created_at: r.created_at,
              data: r.data,
            }))
          );
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    const onCreated = async (e: Event) => {
      try {
        const anyEvent = e as any;
        const detail = (anyEvent && anyEvent.detail) || null;
        if (detail && detail.id) {
          // Optimistically prepend; avoid duplicates
          setHistory((prev) => {
            const exists = prev.some((r) => r.id === detail.id);
            const nextItem = {
              id: String(detail.id),
              title: String(detail.title || "Event"),
              created_at: String(detail.created_at || new Date().toISOString()),
              data: detail.start ? { start: String(detail.start) } : undefined,
            } as { id: string; title: string; created_at?: string; data?: any };
            const next = exists ? prev : [nextItem, ...prev];
            return next.slice(0, 200);
          });
          return;
        }
        // Fallback: full refetch
        const res = await fetch("/api/history", { cache: "no-store" });
        const j = await res.json().catch(() => ({ items: [] }));
        if (!cancelled)
          setHistory(
            (j.items || []).map((r: any) => ({
              id: r.id,
              title: r.title,
              created_at: r.created_at,
              data: r.data,
            }))
          );
      } catch {}
    };
    window.addEventListener("history:created", onCreated as any);
    return () => {
      cancelled = true;
      window.removeEventListener("history:created", onCreated as any);
    };
  }, [status]);

  const shareHistoryItem = async (prettyHref: string) => {
    try {
      const url = new URL(prettyHref, window.location.origin).toString();
      if ((navigator as any).share) {
        await (navigator as any).share({ title: "Snap My Date", url });
      } else {
        await navigator.clipboard.writeText(url);
        // eslint-disable-next-line no-alert
        alert("Link copied to clipboard");
      }
    } catch {}
  };

  const renameHistoryItem = async (id: string, currentTitle: string) => {
    // eslint-disable-next-line no-alert
    const next = prompt("Rename event", currentTitle || "");
    if (next == null) return; // cancelled
    const title = next.trim();
    if (!title) return;
    try {
      await fetch(`/api/history/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title }),
      });
      setHistory((prev) =>
        prev.map((r) => (r.id === id ? { ...r, title } : r))
      );
    } catch {}
  };

  const deleteHistoryItem = async (id: string) => {
    // eslint-disable-next-line no-alert
    const ok = confirm("Delete this event? This cannot be undone.");
    if (!ok) return;
    try {
      await fetch(`/api/history/${id}`, { method: "DELETE" });
      setHistory((prev) => prev.filter((r) => r.id !== id));
      // If the user is currently viewing this event, navigate back to home
      try {
        const currentPath =
          typeof window !== "undefined" ? window.location.pathname : pathname;
        if (
          currentPath &&
          (currentPath === `/event/${id}` || currentPath.endsWith(`-${id}`))
        ) {
          router.replace("/");
        }
      } catch {}
    } catch {}
  };

  if (status !== "authenticated") return null;

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setIsCollapsed(false)}
          className="fixed top-3 left-3 z-[400] inline-flex items-center justify-center h-9 w-9 rounded-md border border-border bg-surface/80 hover:bg-surface"
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
            aria-hidden="true"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}

      {/* Desktop-only floating profile button (when collapsed) */}
      {!isOpen && (
        <>
          <button
            ref={buttonRef}
            type="button"
            aria-label="Open profile menu"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="hidden md:inline-flex fixed bottom-3 left-3 z-[400] items-center justify-center h-10 w-10 rounded-full border border-border bg-surface/90 text-foreground/90 hover:bg-surface shadow"
          >
            <span className="text-xs font-semibold select-none">
              {initials}
            </span>
          </button>

          {/* Floating dropdown anchored to the profile button */}
          {!isOpen && menuOpen && (
            <div
              ref={menuRef}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="hidden md:block fixed bottom-16 left-3 z-[1000] w-64 rounded-xl border border-border bg-surface/95 backdrop-blur shadow-lg overflow-visible"
            >
              <div className="p-2">
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-foreground/90 hover:text-foreground hover:bg-surface"
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
                    aria-hidden="true"
                  >
                    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0A1.65 1.65 0 0 0 9 3.09V3a2 2 0 1 1 4 0v.09c0 .66.39 1.26 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.47.47-.61 1.17-.33 1.78h0A1.65 1.65 0 0 0 20.91 12H21a2 2 0 1 1 0 4h-.09c-.66 0-1.26.39-1.51 1z" />
                  </svg>
                  <span className="text-sm">Profile settings</span>
                </Link>

                <Link
                  href="/subscription"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-foreground/90 hover:text-foreground hover:bg-surface"
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
                    aria-hidden="true"
                  >
                    <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                    <line x1="7" y1="15" x2="7.01" y2="15" />
                    <line x1="11" y1="15" x2="13" y2="15" />
                  </svg>
                  <span className="text-sm">Subscription plan</span>
                </Link>

                <div className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-foreground/90 hover:text-foreground hover:bg-surface">
                  <div className="flex items-center gap-3">
                    {isDark ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2v2M12 20v2M22 12h-2M4 12H2M17.657 6.343l-1.414 1.414M7.757 16.243l-1.414 1.414M17.657 17.657l-1.414-1.414M7.757 7.757L6.343 6.343" />
                      </svg>
                    )}
                    <span className="text-sm">Theme</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isDark}
                    aria-label="Toggle theme"
                    onClick={() => toggleTheme()}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isDark ? "bg-primary/60" : "bg-foreground/20"
                    }`}
                  >
                    <span
                      className={`inline-flex items-center justify-center h-5 w-5 transform rounded-full bg-background shadow transition-transform ${
                        isDark ? "translate-x-5" : "translate-x-1"
                      }`}
                    >
                      {isDark ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        >
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        >
                          <circle cx="12" cy="12" r="4" />
                        </svg>
                      )}
                    </span>
                  </button>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setResourcesOpenFloating((v) => !v)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-foreground/90 hover:text-foreground hover:bg-surface"
                  >
                    <div className="flex items-center gap-3">
                      <Image
                        src="https://static.thenounproject.com/png/privacy-settings-icon-1512233-512.png"
                        alt="Resources"
                        width={16}
                        height={16}
                        className="h-4 w-4 object-contain"
                      />
                      <span className="text-sm">Resources</span>
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
                        resourcesOpenFloating ? "rotate-90" : "rotate-0"
                      }`}
                      aria-hidden="true"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>

                  {resourcesOpenFloating && (
                    <div className="hidden md:block absolute top-0 left-full ml-2 w-64 rounded-lg border border-border bg-surface/95 backdrop-blur shadow-lg p-2 z-[1100]">
                      <Link
                        href="/about"
                        onClick={() => {
                          setMenuOpen(false);
                          setResourcesOpenFloating(false);
                        }}
                        className="flex items-center gap-3 px-3 py-2 rounded-md text-foreground/90 hover:text-foreground hover:bg-surface"
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
                          aria-hidden="true"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                        <span className="text-sm">About us</span>
                      </Link>

                      <Link
                        href="/privacy"
                        onClick={() => {
                          setMenuOpen(false);
                          setResourcesOpenFloating(false);
                        }}
                        className="flex items-center gap-3 px-3 py-2 rounded-md text-foreground/90 hover:text-foreground hover:bg-surface"
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
                          aria-hidden="true"
                        >
                          <rect
                            x="3"
                            y="11"
                            width="18"
                            height="10"
                            rx="2"
                            ry="2"
                          />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <span className="text-sm">Privacy</span>
                      </Link>

                      <Link
                        href="/terms"
                        onClick={() => {
                          setMenuOpen(false);
                          setResourcesOpenFloating(false);
                        }}
                        className="flex items-center gap-3 px-3 py-2 rounded-md text-foreground/90 hover:text-foreground hover:bg-surface"
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
                          aria-hidden="true"
                        >
                          <path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
                          <path d="M14 2v6h6" />
                        </svg>
                        <span className="text-sm">Terms of use</span>
                      </Link>
                    </div>
                  )}
                </div>

                <Link
                  href="/contact"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-foreground/90 hover:text-foreground hover:bg-surface"
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
                    aria-hidden="true"
                  >
                    <path d="M4 4h16v16H4z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <span className="text-sm">Contact us</span>
                </Link>

                <button
                  onClick={() => signOut({ callbackUrl: "/landing" })}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-500/10"
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
                    aria-hidden="true"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span className="text-sm">Log out</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <aside
        ref={asideRef}
        className={`fixed left-0 top-0 h-full z-[6000] border-r border-border bg-surface/70 backdrop-blur supports-[backdrop-filter]:bg-surface/70 flex flex-col ${
          isOpen ? "overflow-visible" : "overflow-hidden"
        } transition-[width,opacity] duration-200 ${
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        style={{ width: isOpen ? "16rem" : "0rem", opacity: isOpen ? 1 : 0 }}
        aria-label="Sidebar"
      >
        {/* Top: Logo + App name + close button */}
        <div className="h-16 border-b border-border flex items-center gap-2 px-4">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <Image src={Logo} alt="Snap My Date" width={32} height={32} />
            <span className="text-base text-foreground truncate">
              <span className="font-pacifico">Snap</span>
              <span> </span>
              <span className="font-montserrat font-semibold">My Date</span>
            </span>
          </Link>
          <div className="ml-auto">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setIsCollapsed(true)}
              className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-border bg-surface/80 hover:bg-surface"
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
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Middle: Event history */}
        <div className="flex-1 overflow-y-auto overflow-x-visible no-scrollbar">
          <div className="p-3 space-y-2">
            <div className="px-0">
              <Link
                href="/"
                onClick={() => {
                  try {
                    const isDesktop =
                      typeof window !== "undefined" &&
                      typeof window.matchMedia === "function" &&
                      window.matchMedia("(min-width: 768px)").matches;
                    if (!isDesktop) setIsCollapsed(true);
                  } catch {}
                }}
                className="block px-2 py-2 rounded-md hover:bg-surface/70 text-sm"
              >
                <div className="flex items-center gap-2 pl-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <rect x="3" y="7" width="18" height="14" rx="2" ry="2" />
                    <path d="M16 7l-1.5-2h-5L8 7" />
                    <circle cx="12" cy="14" r="3" />
                  </svg>
                  <span>New snap</span>
                </div>
              </Link>
            </div>
            <div className="border-t border-border mx-2 my-3" />
            <div className="px-2 text-xs uppercase tracking-wide text-foreground/60">
              Recent events
            </div>
            <nav className="space-y-1">
              {history.length === 0 && (
                <div className="px-2 py-2 text-foreground/60 text-sm">
                  No history yet
                </div>
              )}
              {history.map((h) => {
                const slug = (h.title || "")
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-+|-+$/g, "");
                const prettyHref = `/event/${slug}-${h.id}`;
                return (
                  <div
                    key={h.id}
                    data-history-item={h.id}
                    className="relative px-2 py-2 rounded-md hover:bg-surface/70 text-sm"
                  >
                    <Link
                      href={prettyHref}
                      className="block pr-8"
                      title={h.title}
                    >
                      <div className="truncate">
                        {h.title || "Untitled event"}
                      </div>
                      <div className="text-xs text-foreground/60">
                        {(() => {
                          const start =
                            (h as any)?.data?.start ||
                            (h as any)?.data?.event?.start;
                          const dateStr = start || h.created_at;
                          return dateStr
                            ? new Date(dateStr).toLocaleDateString()
                            : "";
                        })()}
                      </div>
                    </Link>
                    <button
                      type="button"
                      aria-label="Item options"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const target = e.currentTarget as HTMLElement | null;
                        if (itemMenuId === h.id) {
                          setItemMenuId(null);
                          setItemMenuPos(null);
                          return;
                        }
                        if (target) {
                          const rect = target.getBoundingClientRect();
                          setItemMenuPos({
                            left: Math.round(rect.right + 8),
                            top: Math.round(rect.top + rect.height / 2),
                          });
                        }
                        setItemMenuId(h.id);
                      }}
                      className="absolute top-2 right-2 inline-flex items-center justify-center h-6 w-6 rounded hover:bg-surface/70 z-[8000]"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <circle cx="5" cy="12" r="1.5" />
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="19" cy="12" r="1.5" />
                      </svg>
                    </button>
                    {itemMenuId === h.id &&
                      itemMenuPos &&
                      createPortal(
                        <div
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            position: "fixed",
                            left: itemMenuPos.left,
                            top: itemMenuPos.top,
                            transform: "translateY(-10%)",
                          }}
                          className="z-[10000] w-32 rounded-lg border border-border bg-surface/95 backdrop-blur shadow-lg p-2"
                        >
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setItemMenuId(null);
                              setItemMenuPos(null);
                              await shareHistoryItem(prettyHref);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-foreground/90 hover:text-foreground hover:bg-surface"
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
                              aria-hidden="true"
                            >
                              <circle cx="18" cy="5" r="3" />
                              <circle cx="6" cy="12" r="3" />
                              <circle cx="18" cy="19" r="3" />
                              <line
                                x1="8.59"
                                y1="13.51"
                                x2="15.42"
                                y2="17.49"
                              />
                              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                            </svg>
                            <span className="text-sm">Share</span>
                          </button>
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setItemMenuId(null);
                              setItemMenuPos(null);
                              await renameHistoryItem(h.id, h.title);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-foreground/90 hover:text-foreground hover:bg-surface"
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
                              aria-hidden="true"
                            >
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                            <span className="text-sm">Rename</span>
                          </button>
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setItemMenuId(null);
                              setItemMenuPos(null);
                              await deleteHistoryItem(h.id);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-500/10"
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
                              aria-hidden="true"
                            >
                              <path d="M3 6h18" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                            <span className="text-sm">Delete</span>
                          </button>
                        </div>,
                        document.body
                      )}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom: User button with dropdown */}
        <div className="border-t border-border p-3">
          <div className="relative z-[900]">
            <button
              ref={buttonRef}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              aria-expanded={menuOpen}
              className="w-full inline-flex items-center justify-between gap-3 px-3 py-2 text-foreground/90 hover:text-foreground hover:bg-surface/70 focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-md"
            >
              <span className="truncate text-sm font-medium">
                {displayName}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`h-4 w-4 transition-transform ${
                  menuOpen ? "rotate-180" : "rotate-0"
                }`}
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {isOpen && menuOpen && (
              <div
                ref={menuRef}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute bottom-12 left-0 z-[1000] w-45 rounded-xl border border-border bg-surface/95 backdrop-blur shadow-lg overflow-visible"
              >
                <div className="p-2">
                  <Link
                    href="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-foreground/90 hover:text-foreground hover:bg-surface"
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
                      aria-hidden="true"
                    >
                      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0A1.65 1.65 0 0 0 9 3.09V3a2 2 0 1 1 4 0v.09c0 .66.39 1.26 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.47.47-.61 1.17-.33 1.78h0A1.65 1.65 0 0 0 20.91 12H21a2 2 0 1 1 0 4h-.09c-.66 0-1.26.39-1.51 1z" />
                    </svg>
                    <span className="text-sm">Profile settings</span>
                  </Link>

                  <Link
                    href="/subscription"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-foreground/90 hover:text-foreground hover:bg-surface"
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
                      aria-hidden="true"
                    >
                      <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                      <line x1="7" y1="15" x2="7.01" y2="15" />
                      <line x1="11" y1="15" x2="13" y2="15" />
                    </svg>
                    <span className="text-sm">Subscription plan</span>
                  </Link>

                  <div className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-foreground/90 hover:text-foreground hover:bg-surface">
                    <div className="flex items-center gap-3">
                      {isDark ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                          aria-hidden="true"
                        >
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                          aria-hidden="true"
                        >
                          <circle cx="12" cy="12" r="4" />
                          <path d="M12 2v2M12 20v2M22 12h-2M4 12H2M17.657 6.343l-1.414 1.414M7.757 16.243l-1.414 1.414M17.657 17.657l-1.414-1.414M7.757 7.757L6.343 6.343" />
                        </svg>
                      )}
                      <span className="text-sm">Theme</span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isDark}
                      aria-label="Toggle theme"
                      onClick={() => toggleTheme()}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isDark ? "bg-primary/60" : "bg-foreground/20"
                      }`}
                    >
                      <span
                        className={`inline-flex items-center justify-center h-5 w-5 transform rounded-full bg-background shadow transition-transform ${
                          isDark ? "translate-x-5" : "translate-x-1"
                        }`}
                      >
                        {isDark ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          >
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          >
                            <circle cx="12" cy="12" r="4" />
                          </svg>
                        )}
                      </span>
                    </button>
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setResourcesOpen((v) => !v)}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-foreground/90 hover:text-foreground hover:bg-surface"
                    >
                      <div className="flex items-center gap-3">
                        <Image
                          src="https://static.thenounproject.com/png/privacy-settings-icon-1512233-512.png"
                          alt="Resources"
                          width={16}
                          height={16}
                          className="h-4 w-4 object-contain"
                        />
                        <span className="text-sm">Resources</span>
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
                          resourcesOpen ? "rotate-180 md:rotate-90" : "rotate-0"
                        }`}
                        aria-hidden="true"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {resourcesOpen && (
                      <div className="absolute left-0 bottom-full mb-2 md:bottom-auto md:top-0 md:left-full md:ml-2 w-40 rounded-lg border border-border bg-surface/95 backdrop-blur shadow-lg p-2 z-[1100]">
                        <Link
                          href="/about"
                          onClick={() => {
                            setMenuOpen(false);
                            setResourcesOpen(false);
                          }}
                          className="flex items-center gap-3 px-3 py-2 rounded-md text-foreground/90 hover:text-foreground hover:bg-surface"
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
                            aria-hidden="true"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                          </svg>
                          <span className="text-sm">About us</span>
                        </Link>

                        <Link
                          href="/privacy"
                          onClick={() => {
                            setMenuOpen(false);
                            setResourcesOpen(false);
                          }}
                          className="flex items-center gap-3 px-3 py-2 rounded-md text-foreground/90 hover:text-foreground hover:bg-surface"
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
                            aria-hidden="true"
                          >
                            <rect
                              x="3"
                              y="11"
                              width="18"
                              height="10"
                              rx="2"
                              ry="2"
                            />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          <span className="text-sm">Privacy</span>
                        </Link>

                        <Link
                          href="/terms"
                          onClick={() => {
                            setMenuOpen(false);
                            setResourcesOpen(false);
                          }}
                          className="flex items-center gap-3 px-3 py-2 rounded-md text-foreground/90 hover:text-foreground hover:bg-surface"
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
                            aria-hidden="true"
                          >
                            <path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
                            <path d="M14 2v6h6" />
                          </svg>
                          <span className="text-sm">Terms of use</span>
                        </Link>
                      </div>
                    )}
                  </div>

                  <Link
                    href="/contact"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-foreground/90 hover:text-foreground hover:bg-surface"
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
                      aria-hidden="true"
                    >
                      <path d="M4 4h16v16H4z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <span className="text-sm">Contact us</span>
                  </Link>

                  <button
                    onClick={() => signOut({ callbackUrl: "/landing" })}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-500/10"
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
                      aria-hidden="true"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span className="text-sm">Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
