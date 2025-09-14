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
  const openButtonRef = useRef<HTMLButtonElement | null>(null);
  const asideRef = useRef<HTMLDivElement | null>(null);
  const categoriesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) setMenuOpen(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const isPhoneHiddenViewport = () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      // Phone mockup is only shown at lg (≥1024px); below that it's hidden
      window.matchMedia("(max-width: 1023px)").matches;

    const onClick = (e: MouseEvent) => {
      if (!isPhoneHiddenViewport()) return; // Desktop: ignore outside clicks
      const target = e.target as Node | null;
      if (!asideRef.current) return;
      // Ignore clicks originating from the hamburger open button
      if (
        openButtonRef.current &&
        openButtonRef.current.contains(target as Node)
      ) {
        return;
      }
      if (!asideRef.current.contains(target)) setIsCollapsed(true);
    };
    const onKey = (e: KeyboardEvent) => {
      if (!isPhoneHiddenViewport()) return; // Desktop: only close via X button
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

  // Always close menus on route change so navigation from a menu item hides the dropdowns.
  useEffect(() => {
    setMenuOpen(false);
    setResourcesOpen(false);
    setResourcesOpenFloating(false);
    setItemMenuId(null);
    setItemMenuPos(null);
    // On small screens, auto-collapse the sidebar after navigation
    try {
      const isNarrow =
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(max-width: 1023px)").matches;
      if (isNarrow) setIsCollapsed(true);
    } catch {}
  }, [pathname]);

  const displayName =
    (session?.user?.name as string) ||
    (session?.user?.email as string) ||
    "User";
  // Deprecated scanCredits removed; use unified credits state
  const [subscriptionPlan, setSubscriptionPlan] = useState<
    "free" | "monthly" | "yearly" | null
  >(null);
  const [credits, setCredits] = useState<number>(0);
  useEffect(() => {
    let ignore = false;
    async function loadProfile() {
      try {
        const res = await fetch("/api/user/profile", {
          cache: "no-store",
          credentials: "include",
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) return;
        if (!ignore) {
          const p = json.subscriptionPlan;
          setSubscriptionPlan(
            p === "free" || p === "monthly" || p === "yearly" ? p : null
          );
          if (typeof json.credits === "number") setCredits(json.credits);
        }
      } catch {}
    }
    if (status === "authenticated") loadProfile();
    return () => {
      ignore = true;
    };
  }, [status]);
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
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>(
    {}
  );
  const [colorMenuFor, setColorMenuFor] = useState<string | null>(null);
  const [colorMenuPos, setColorMenuPos] = useState<{
    left: number;
    top: number;
  } | null>(null);

  // Default color per known category
  const defaultCategoryColor = (c: string): string => {
    if (c === "Birthdays") return "green"; // default palette expectation
    if (c === "Doctor Appointments") return "red";
    if (c === "Appointments") return "amber";
    if (c === "Weddings") return "blue";
    if (c === "Sport Events") return "indigo";
    if (c === "Play Days") return "rose";
    return "slate"; // neutral fallback
  };

  // Basic keyword-based category guesser when OCR did not set one
  const guessCategoryFromText = (text: string): string | null => {
    const s = String(text || "").toLowerCase();
    if (!s) return null;
    if (/birthday|b-day|turns\s+\d+|party for/.test(s)) return "Birthdays";
    if (/wedding|bridal|ceremony|reception/.test(s)) return "Weddings";
    if (/doctor|dentist|appointment|check[- ]?up|clinic/.test(s))
      return "Doctor Appointments";
    if (/game|match|vs\.|at\s+[A-Z]|tournament|championship|league/.test(s))
      return "Sport Events";
    if (/playdate|play\s*day|kids?\s*play/.test(s)) return "Play Days";
    if (/appointment|meeting|consult/.test(s)) return "Appointments";
    return null;
  };

  const predefinedCategories = [
    "Birthdays",
    "Doctor Appointments",
    "Appointments",
    "Weddings",
    "Sport Events",
    "Play Days",
  ];

  useEffect(() => {
    // Load stored colors once
    try {
      const raw = localStorage.getItem("categoryColors");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") setCategoryColors(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const onDocClick = () => {
      setColorMenuFor(null);
      setColorMenuPos(null);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setColorMenuFor(null);
        setColorMenuPos(null);
      }
    };
    if (colorMenuFor) {
      document.addEventListener("click", onDocClick);
      document.addEventListener("keydown", onEsc);
    }
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [colorMenuFor]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!activeCategory) return;
      try {
        const target = e.target as Node | null;
        if (categoriesRef.current && categoriesRef.current.contains(target)) {
          return;
        }
      } catch {}
      setActiveCategory(null);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [activeCategory]);

  useEffect(() => {
    // Ensure categories present in history have defaults
    try {
      const categories = Array.from(
        new Set(
          history
            .map((h) => {
              const explicit = (h as any)?.data?.category as string | null;
              if (explicit) return explicit;
              const blob = `${h.title || ""} ${
                (h as any)?.data?.description || ""
              }`;
              return guessCategoryFromText(blob);
            })
            .filter((c): c is string => Boolean(c))
        )
      );
      if (categories.length === 0) return;
      setCategoryColors((prev) => {
        const next = { ...prev } as Record<string, string>;
        let changed = false;
        for (const c of categories)
          if (!next[c]) {
            next[c] = defaultCategoryColor(c);
            changed = true;
          }
        if (changed) {
          try {
            localStorage.setItem("categoryColors", JSON.stringify(next));
          } catch {}
        }
        return next;
      });
    } catch {}
  }, [history]);

  const cycleCategoryColor = (category: string) => {
    const palette = [
      // 16 distinct hues
      "red",
      "orange",
      "amber",
      "yellow",
      "lime",
      "green",
      "emerald",
      "teal",
      "cyan",
      "sky",
      "blue",
      "indigo",
      "violet",
      "purple",
      "fuchsia",
      "pink",
    ];
    setCategoryColors((prev) => {
      const current = prev[category] || defaultCategoryColor(category);
      const idx = palette.indexOf(current);
      const nextColor = palette[(idx + 1) % palette.length];
      const next = { ...prev, [category]: nextColor };
      try {
        localStorage.setItem("categoryColors", JSON.stringify(next));
        try {
          window.dispatchEvent(
            new CustomEvent("categoryColorsUpdated", { detail: next })
          );
        } catch {}
      } catch {}
      return next;
    });
  };

  const colorClasses = (
    color: string
  ): { swatch: string; badge: string; tint: string; hoverTint: string } => {
    switch (color) {
      case "lime":
        return {
          swatch: "bg-lime-500 border-lime-400",
          badge: "bg-lime-500/20 text-lime-300 border-lime-400/30",
          tint: "bg-lime-500/10",
          hoverTint: "hover:bg-lime-500/15",
        };
      case "zinc":
        return {
          swatch: "bg-zinc-500 border-zinc-400",
          badge: "bg-zinc-500/20 text-zinc-300 border-zinc-400/30",
          tint: "bg-zinc-500/10",
          hoverTint: "hover:bg-zinc-500/15",
        };
      case "neutral":
        return {
          swatch: "bg-neutral-500 border-neutral-400",
          badge: "bg-neutral-500/20 text-neutral-300 border-neutral-400/30",
          tint: "bg-neutral-500/10",
          hoverTint: "hover:bg-neutral-500/15",
        };
      case "stone":
        return {
          swatch: "bg-stone-500 border-stone-400",
          badge: "bg-stone-500/20 text-stone-300 border-stone-400/30",
          tint: "bg-stone-500/10",
          hoverTint: "hover:bg-stone-500/15",
        };
      case "gray":
        return {
          swatch: "bg-gray-500 border-gray-400",
          badge: "bg-gray-500/20 text-gray-300 border-gray-400/30",
          tint: "bg-gray-500/10",
          hoverTint: "hover:bg-gray-500/15",
        };
      case "red":
        return {
          swatch: "bg-red-500 border-red-400",
          badge: "bg-red-500/20 text-red-300 border-red-400/30",
          tint: "bg-red-500/10",
          hoverTint: "hover:bg-red-500/15",
        };
      case "pink":
        return {
          swatch: "bg-pink-500 border-pink-400",
          badge: "bg-pink-500/20 text-pink-300 border-pink-400/30",
          tint: "bg-pink-500/10",
          hoverTint: "hover:bg-pink-500/15",
        };
      case "rose":
        return {
          swatch: "bg-rose-500 border-rose-400",
          badge: "bg-rose-500/20 text-rose-300 border-rose-400/30",
          tint: "bg-rose-500/10",
          hoverTint: "hover:bg-rose-500/15",
        };
      case "fuchsia":
        return {
          swatch: "bg-fuchsia-500 border-fuchsia-400",
          badge: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400/30",
          tint: "bg-fuchsia-500/10",
          hoverTint: "hover:bg-fuchsia-500/15",
        };
      case "violet":
        return {
          swatch: "bg-violet-500 border-violet-400",
          badge: "bg-violet-500/20 text-violet-300 border-violet-400/30",
          tint: "bg-violet-500/10",
          hoverTint: "hover:bg-violet-500/15",
        };
      case "purple":
        return {
          swatch: "bg-purple-500 border-purple-400",
          badge: "bg-purple-500/20 text-purple-300 border-purple-400/30",
          tint: "bg-purple-500/10",
          hoverTint: "hover:bg-purple-500/15",
        };
      case "indigo":
        return {
          swatch: "bg-indigo-500 border-indigo-400",
          badge: "bg-indigo-500/20 text-indigo-300 border-indigo-400/30",
          tint: "bg-indigo-500/10",
          hoverTint: "hover:bg-indigo-500/15",
        };
      case "blue":
        return {
          swatch: "bg-blue-500 border-blue-400",
          badge: "bg-blue-500/20 text-blue-300 border-blue-400/30",
          tint: "bg-blue-500/10",
          hoverTint: "hover:bg-blue-500/15",
        };
      case "sky":
        return {
          swatch: "bg-sky-500 border-sky-400",
          badge: "bg-sky-500/20 text-sky-300 border-sky-400/30",
          tint: "bg-sky-500/10",
          hoverTint: "hover:bg-sky-500/15",
        };
      case "cyan":
        return {
          swatch: "bg-cyan-500 border-cyan-400",
          badge: "bg-cyan-500/20 text-cyan-300 border-cyan-400/30",
          tint: "bg-cyan-500/10",
          hoverTint: "hover:bg-cyan-500/15",
        };
      case "teal":
        return {
          swatch: "bg-teal-500 border-teal-400",
          badge: "bg-teal-500/20 text-teal-300 border-teal-400/30",
          tint: "bg-teal-500/10",
          hoverTint: "hover:bg-teal-500/15",
        };
      case "emerald":
        return {
          swatch: "bg-emerald-500 border-emerald-400",
          badge: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
          tint: "bg-emerald-500/10",
          hoverTint: "hover:bg-emerald-500/15",
        };
      case "green":
        return {
          swatch: "bg-green-500 border-green-400",
          badge: "bg-green-500/20 text-green-300 border-green-400/30",
          tint: "bg-green-500/10",
          hoverTint: "hover:bg-green-500/15",
        };
      case "lime":
        return {
          swatch: "bg-lime-500 border-lime-400",
          badge: "bg-lime-500/20 text-lime-300 border-lime-400/30",
          tint: "bg-lime-500/10",
          hoverTint: "hover:bg-lime-500/15",
        };
      case "yellow":
        return {
          swatch: "bg-yellow-500 border-yellow-400",
          badge: "bg-yellow-500/20 text-yellow-300 border-yellow-400/30",
          tint: "bg-yellow-500/10",
          hoverTint: "hover:bg-yellow-500/15",
        };
      case "amber":
        return {
          swatch: "bg-amber-500 border-amber-400",
          badge: "bg-amber-500/20 text-amber-300 border-amber-400/30",
          tint: "bg-amber-500/10",
          hoverTint: "hover:bg-amber-500/15",
        };
      case "orange":
        return {
          swatch: "bg-orange-500 border-orange-400",
          badge: "bg-orange-500/20 text-orange-300 border-orange-400/30",
          tint: "bg-orange-500/10",
          hoverTint: "hover:bg-orange-500/15",
        };
      case "slate":
        return {
          swatch: "bg-slate-500 border-slate-400",
          badge: "bg-slate-500/20 text-slate-300 border-slate-400/30",
          tint: "bg-slate-500/10",
          hoverTint: "hover:bg-slate-500/15",
        };
      default:
        return {
          swatch: "bg-foreground/40 border-border/60",
          badge: "bg-surface/70 text-foreground/70 border-border/70",
          tint: "bg-surface/60",
          hoverTint: "hover:bg-surface/70",
        };
    }
  };

  const setCategoryColor = (category: string, color: string) => {
    if (!category) return;
    setCategoryColors((prev) => {
      const next = { ...prev, [category]: color } as Record<string, string>;
      try {
        localStorage.setItem("categoryColors", JSON.stringify(next));
        try {
          window.dispatchEvent(
            new CustomEvent("categoryColorsUpdated", { detail: next })
          );
        } catch {}
      } catch {}
      return next;
    });
    setColorMenuFor(null);
    setColorMenuPos(null);
  };

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
              data: {
                ...(detail.start ? { start: String(detail.start) } : {}),
                ...(detail.category
                  ? { category: String(detail.category) }
                  : {}),
              },
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

  const deleteHistoryItem = async (id: string, title?: string) => {
    // eslint-disable-next-line no-alert
    const ok = confirm(
      `Are you sure you want to delete this event?\n\n${
        title || "Untitled event"
      }`
    );
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

  const MenuItems = (props: {
    isDark: boolean;
    toggleTheme: () => void;
    onCloseMenu: () => void;
    resourcesOpen: boolean;
    toggleResources: () => void;
    closeResources: () => void;
    resourcesPanelClass: string;
    chevronOpenClass: string;
    chevronClosedClass: string;
  }) => {
    const {
      isDark,
      toggleTheme,
      onCloseMenu,
      resourcesOpen,
      toggleResources,
      closeResources,
      resourcesPanelClass,
      chevronOpenClass,
      chevronClosedClass,
    } = props;
    return (
      <div className="p-2">
        <Link
          href="/settings"
          onClick={onCloseMenu}
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
          onClick={onCloseMenu}
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
            onClick={toggleResources}
            className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-foreground/90 hover:text-foreground hover:bg-surface"
          >
            <div className="flex items-center gap-3">
              <Image
                src="https://static.thenounproject.com/png/privacy-settings-icon-1512233-512.png"
                alt="Resources"
                width={16}
                height={16}
                className="h-4 w-4 object-contain"
                style={{
                  filter: isDark ? "invert(1)" : "invert(0)",
                }}
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
                resourcesOpen ? chevronOpenClass : chevronClosedClass
              }`}
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {resourcesOpen && (
            <div className={resourcesPanelClass}>
              <Link
                href="/about"
                onClick={() => {
                  onCloseMenu();
                  closeResources();
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
                  onCloseMenu();
                  closeResources();
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
                  <rect x="3" y="11" width="18" height="10" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span className="text-sm">Privacy</span>
              </Link>

              <Link
                href="/terms"
                onClick={() => {
                  onCloseMenu();
                  closeResources();
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
          onClick={onCloseMenu}
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
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20"
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
    );
  };

  if (status !== "authenticated") return null;

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          aria-label="Open menu"
          ref={openButtonRef}
          onClick={(e) => {
            e.stopPropagation();
            setIsCollapsed(false);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="fixed top-3 left-3 z-[400] inline-flex items-center justify-center h-9 w-9"
          suppressHydrationWarning
        >
          <svg
            viewBox="0 0 64 64"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            className="h-15 w-15 text-foreground"
            aria-hidden="true"
            suppressHydrationWarning
          >
            <g transform="translate(0,64) scale(1,-1)">
              <rect x="10" y="14" width="14" height="6" fill="currentColor" />
              <rect x="10" y="29" width="28" height="6" fill="currentColor" />
              <rect x="10" y="44" width="42" height="6" fill="currentColor" />
            </g>
          </svg>
        </button>
      )}

      {/* Floating profile button (when collapsed) */}
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
            className="inline-flex fixed bottom-3 left-3 z-[400] items-center justify-center h-10 w-10 rounded-full border border-border bg-surface/90 text-foreground/90 hover:bg-surface shadow"
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
              className="block fixed bottom-16 left-3 z-[1000] w-45 rounded-xl border border-border bg-surface/95 backdrop-blur shadow-lg overflow-visible"
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
                        style={{
                          filter: isDark ? "invert(1)" : "invert(0)",
                        }}
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
                        resourcesOpenFloating ? "rotate-0" : "rotate-90"
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
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20"
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
                    const isTouch =
                      typeof window !== "undefined" &&
                      typeof window.matchMedia === "function" &&
                      window.matchMedia("(hover: none), (pointer: coarse)")
                        .matches;
                    if (isTouch) setIsCollapsed(true);
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
              <Link
                href="/calendar"
                onClick={() => {
                  try {
                    const isTouch =
                      typeof window !== "undefined" &&
                      typeof window.matchMedia === "function" &&
                      window.matchMedia("(hover: none), (pointer: coarse)")
                        .matches;
                    if (isTouch) setIsCollapsed(true);
                  } catch {}
                }}
                className="mt-1 block px-2 py-2 rounded-md hover:bg-surface/70 text-sm"
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
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>Calendar</span>
                </div>
              </Link>
              {(() => {
                const categories = Array.from(
                  new Set(
                    history
                      .map((h) => (h as any)?.data?.category as string | null)
                      .filter((c): c is string => Boolean(c))
                  )
                );
                // Sort categories A → Z for consistent display
                const sortedCategories = [...categories].sort((a, b) =>
                  a.localeCompare(b)
                );
                if (categories.length === 0) return null;
                const buttonClass = (_c: string) => {
                  return `hover:bg-surface/70`;
                };
                return (
                  <div ref={categoriesRef} className="mt-2 space-y-1">
                    {sortedCategories.map((c) => {
                      // Show total count of items in the category (not only future-dated)
                      const totalCount = (() => {
                        try {
                          return history.filter(
                            (h) => (h as any)?.data?.category === c
                          ).length;
                        } catch {
                          return 0;
                        }
                      })();
                      return (
                        <div key={c} className="">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveCategory((prev) =>
                                prev === c ? null : c
                              );
                            }}
                            className={`w-full flex items-center justify-between gap-2 px-2 py-2 rounded-md text-sm ${buttonClass(
                              c
                            )}`}
                            aria-pressed={activeCategory === c}
                            title={c}
                          >
                            <span className="truncate inline-flex items-center gap-2">
                              {/* Category icons */}
                              {c === "Birthdays" ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                >
                                  <path d="M18,8H13V5H11V8H6a4,4,0,0,0-4,4v9H22V12A4,4,0,0,0,18,8Zm2,11H4V16a3.78,3.78,0,0,0,2.71-1.3,1.54,1.54,0,0,1,2.58,0,3.49,3.49,0,0,0,5.42,0,1.54,1.54,0,0,1,2.58,0A3.78,3.78,0,0,0,20,16Zm0-5a2,2,0,0,1-1.29-.7,3.49,3.49,0,0,0-5.42,0,1.54,1.54,0,0,1-2.58,0,3.49,3.49,0,0,0-5.42,0A2,2,0,0,1,4,14V12a2,2,0,0,1,2-2H18a2,2,0,0,1,2,2ZM12,4.19a1.55,1.55,0,0,0,1.55-1.55C13.55,1.4,12,0,12,0s-1.55,1.4-1.55,2.64A1.55,1.55,0,0,0,12,4.19Z" />
                                </svg>
                              ) : c === "Weddings" ? (
                                <svg
                                  fill="currentColor"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 512 512"
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                >
                                  <path d="M371.769,176.364l30.47-30.47l-21.71-25.265h-52.305l-21.71,25.265l30.47,30.47 c-29.557,3.279-57.658,14.863-80.982,33.507c-23.324-18.644-51.425-30.228-80.982-33.507l30.47-30.47l-21.71-25.265h-52.305 l-21.71,25.265l30.47,30.47C61.471,185.049,0,251.988,0,333.024c0,86.914,70.71,157.625,157.625,157.625 c35.834,0,70.513-12.2,98.375-34.472c27.862,22.272,62.542,34.472,98.375,34.472C441.29,490.649,512,419.938,512,333.024 C512,251.988,450.529,185.049,371.769,176.364z M327.237,145.11l7.97-9.275h38.337l7.969,9.275l-27.138,27.138L327.237,145.11z M130.486,145.11l7.97-9.275h38.337l7.969,9.275l-27.138,27.138L130.486,145.11z M157.625,475.441 c-78.529,0-142.417-63.888-142.417-142.417s63.888-142.417,142.417-142.417c34.337,0,67.503,12.392,93.387,34.894 c8.035,6.984,15.308,14.898,21.618,23.522c17.933,24.508,27.412,53.555,27.412,84.002c0,27.573-7.775,54-22.563,76.946 c-0.192-0.192-0.376-0.39-0.566-0.583c-0.834-0.847-1.659-1.702-2.465-2.574c-0.357-0.386-0.705-0.781-1.055-1.172 c-0.661-0.736-1.315-1.479-1.955-2.233c-0.368-0.433-0.731-0.869-1.092-1.308c-0.618-0.751-1.225-1.513-1.823-2.28 c-0.337-0.432-0.675-0.863-1.005-1.3c-0.655-0.867-1.293-1.748-1.921-2.636c-0.195-0.275-0.396-0.545-0.589-0.823 c10.887-18.81,16.619-40.153,16.619-62.037c0-21.925-5.759-43.301-16.685-62.137l0.061-0.096l-2.58-4.072 c-4.983-7.859-10.817-15.117-17.407-21.662c-2.197-2.182-4.478-4.285-6.839-6.304l-6.234-5.332l-0.161,0.22 c-21.339-15.929-47.37-24.62-74.156-24.62c-68.375,0-124.002,55.628-124.002,124.002s55.627,124.001,124.002,124.001 c26.853,0,52.947-8.733,74.315-24.737c0.095,0.118,0.196,0.231,0.291,0.348c0.539,0.661,1.092,1.311,1.641,1.964 c0.423,0.501,0.841,1.007,1.269,1.503c0.586,0.677,1.185,1.342,1.782,2.01c0.409,0.457,0.812,0.92,1.226,1.372 c0.656,0.716,1.326,1.418,1.995,2.122c0.37,0.389,0.734,0.787,1.108,1.172c0.815,0.841,1.646,1.666,2.48,2.488 c0.228,0.225,0.449,0.456,0.677,0.68C219.606,465.022,189.107,475.441,157.625,475.441z M289.077,246.04 c18.767-14.095,41.689-21.81,65.298-21.81c59.989,0,108.794,48.805,108.794,108.794c0,59.989-48.805,108.792-108.794,108.792 c-23.608,0-46.531-7.715-65.298-21.81c17.142-25.819,26.172-55.735,26.172-86.984C315.249,301.775,306.22,271.858,289.077,246.04z M256,379.489c-6.834-14.454-10.418-30.285-10.418-46.465c0-16.18,3.584-32.012,10.418-46.465 c6.834,14.454,10.418,30.285,10.418,46.465C266.418,349.204,262.834,365.035,256,379.489z M222.923,246.04 c-17.142,25.819-26.172,55.735-26.172,86.984c0,31.248,9.029,61.165,26.172,86.984c-18.767,14.095-41.69,21.81-65.298,21.81 c-59.989,0-108.794-48.804-108.794-108.793S97.636,224.23,157.625,224.23C181.234,224.23,204.156,231.945,222.923,246.04z M354.375,475.441c-34.337,0-67.503-12.392-93.387-34.894c-8.034-6.983-15.308-14.898-21.618-23.522 c-17.933-24.508-27.412-53.555-27.412-84.001c0-27.573,7.775-54.001,22.562-76.946c0.194,0.194,0.38,0.394,0.572,0.589 c0.833,0.845,1.656,1.698,2.46,2.569c0.355,0.384,0.701,0.778,1.05,1.167c0.664,0.739,1.32,1.485,1.964,2.243 c0.364,0.429,0.724,0.862,1.082,1.296c0.622,0.756,1.233,1.522,1.835,2.294c0.334,0.428,0.669,0.855,0.997,1.289 c0.655,0.867,1.292,1.748,1.921,2.635c0.196,0.277,0.398,0.548,0.591,0.827c-10.887,18.81-16.619,40.153-16.619,62.038 c0,21.925,5.759,43.3,16.685,62.136l-0.062,0.096l2.581,4.072c6.643,10.478,14.8,19.888,24.245,27.966l6.234,5.332l0.161-0.221 c21.34,15.929,47.369,24.62,74.156,24.62c68.375,0,124.002-55.626,124.002-124.001s-55.626-124.001-124.002-124.001 c-26.853,0-52.947,8.733-74.315,24.738c-0.095-0.118-0.196,0.231-0.291,0.348c-0.538,0.66-1.089,1.309-1.638,1.96 c-0.424,0.503-0.844,1.011-1.274,1.508c-0.58,0.67-1.173,1.329-1.764,1.989c-0.416,0.464-0.825,0.935-1.246,1.394 c-0.642,0.701-1.298,1.387-1.951,2.075c-0.385,0.406-0.763,0.818-1.153,1.221c-0.781,0.805-1.577,1.594-2.373,2.382 c-0.262,0.259-0.516,0.525-0.78,0.783c24.804-19.075,55.302-29.493,86.786-29.493c78.529,0,142.417,63.888,142.417,142.417 C496.792,411.554,432.904,475.441,354.375,475.441z"></path>
                                  <rect
                                    x="248.396"
                                    y="21.351"
                                    width="15.208"
                                    height="47.344"
                                  ></rect>
                                  <rect
                                    x="294.983"
                                    y="52.217"
                                    transform="matrix(0.4198 -0.9076 0.9076 0.4198 130.5873 323.9224)"
                                    width="47.343"
                                    height="15.207"
                                  ></rect>
                                  <rect
                                    x="185.738"
                                    y="36.156"
                                    transform="matrix(0.9076 -0.4198 0.4198 0.9076 -7.2537 86.6932)"
                                    width="15.207"
                                    height="47.343"
                                  ></rect>
                                </svg>
                              ) : c === "Sport Events" ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 512 512"
                                  fill="currentColor"
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                >
                                  <path d="M367.918,69.237H129.781h-9.365l-7.227,5.949L9.514,160.546L0,168.382v12.322v79.167v21.874l21.534,3.824 l106.199,18.9c11.706,2.082,21.551,9.824,26.335,20.71l0.425,0.96l0.498,0.927c0.008,0.016,3.059,5.753,5.119,11.676 c21.993,63.19,76.312,104.023,138.385,104.023c44.031,0,84.652-19.019,111.437-52.186l67.359-84.359l0.624-0.782l0.566-0.832 l0.212-0.314l11.119-14.616l0.867-1.139l0.74-1.232C504.884,264.867,512,239.289,512,213.319 C512,133.872,447.365,69.237,367.918,69.237z M403.516,356.781l-13.894,17.395c-21.627,26.778-54.021,42.482-91.127,42.482 c-54.255,0-96.72-37.63-113.728-86.501c-2.821-8.106-6.798-15.483-6.798-15.483c-8.277-18.84-25.404-32.309-45.664-35.912 L26.106,259.87v-70.397H247.06c17.404,0,35.135,0,54.876,0c31.655,0,60.233,12.807,80.989,33.55 c20.739,20.752,33.541,49.331,33.546,80.986C416.466,323.078,411.738,340.975,403.516,356.781z M469.034,273.867l-11.726,15.415 l-0.417,0.646l-24.109,30.193c0.646-5.294,1.092-10.648,1.092-16.112c-0.004-72.87-59.065-131.931-131.938-131.94 c-19.741,0-37.472,0-54.876,0H36.592l93.188-76.727c0,0,202.62,0,238.137,0c65.158,0,117.976,52.823,117.976,117.977 C485.894,235.49,479.67,256.149,469.034,273.867z" />
                                  <polygon points="240.836,154.853 315.673,154.853 369.809,109.466 294.972,109.466 " />
                                </svg>
                              ) : c === "Doctor Appointments" ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="-2.5 0 19 19"
                                  fill="currentColor"
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                >
                                  <path d="M11.56 10.11v2.046a3.827 3.827 0 1 1-7.655 0v-.45A3.61 3.61 0 0 1 .851 8.141V5.25a1.682 1.682 0 0 1 .763-1.408 1.207 1.207 0 1 1 .48 1.04.571.571 0 0 0-.135.368v2.89a2.5 2.5 0 0 0 5 0V5.25a.57.57 0 0 0-.108-.334 1.208 1.208 0 1 1 .533-1.018 1.681 1.681 0 0 1 .683 1.352v2.89a3.61 3.61 0 0 1-3.054 3.565v.45a2.719 2.719 0 0 0 5.438 0V10.11a2.144 2.144 0 1 1 1.108 0zm.48-2.07a1.035 1.035 0 1 0-1.035 1.035 1.037 1.037 0 0 0 1.036-1.035z" />
                                </svg>
                              ) : c === "Appointments" ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                >
                                  <path d="M18,5V3a1,1,0,0,0-2,0V5H8V3A1,1,0,0,0,6,3V5H2V21H22V5Zm2,14H4V7H20ZM9,10H7v2H9Zm0,4H7v2H9Zm8-4H11v2h6Zm0,4H11v2h6Z" />
                                </svg>
                              ) : c === "Play Days" ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 512 512"
                                  fill="currentColor"
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                >
                                  <path d="M504.984,407.552c-4.486-4.37-10.547-6.739-16.809-6.578c-33.187,0.855-64.219-6.478-92.22-26.71 c-25.3-18.279-45.075-44.849-61.547-71.479c-9.209-14.888-17.894-33.443-42.745-52.21c-30.764-23.236-71.898-33.537-109.531-33.63 v-50.912l55.611,41.751c25.235,6.452,49.633,17.687,70.077,34.915c18.506,15.595,27.542,30.093,35.339,43.223l10.051-4.423 l5.98,29.697c12.223,17.828,24.964,32.867,39.287,44.615c1.685-3.255,2.321-7.08,1.541-10.952l-18.14-90.084 c-0.993-4.926-4.152-9.143-8.601-11.481c-4.449-2.336-9.714-2.544-14.333-0.566l-23.457,10.049 c-6.28-25.238-8.436-33.902-14.58-58.596l56.505-77.152c4.538-6.196,3.194-14.9-3.003-19.439 c-6.197-4.539-14.898-3.194-19.44,3.003l-57.133,78.01l-38.956,10.266l-76.747-57.619v-9.2c0-5.202-2.352-10.126-6.399-13.395 l-75.536-61.009c-5.327-4.302-12.935-4.302-18.263,0L6.399,108.655C2.353,111.925,0,116.848,0,122.05v337.033 c0,4.693,3.805,8.497,8.497,8.497h20.366c4.693,0,8.498-3.805,8.498-8.497v-90.074h107.411v90.074 c0,4.693,3.805,8.497,8.497,8.497h4.179c0.21,0,0.275,0,0.266,0h15.921c4.693,0,8.498-3.805,8.498-8.497V284.537 c18.986,2.052,43.324,7.407,65.79,20.479c18.565,10.803,33.309,25.424,43.879,43.523c23.311,39.917,44.09,65.968,67.373,84.471 c38.645,30.711,83.079,38.657,132.495,32.511c0.009-0.001,0.019-0.002,0.029-0.003C503.326,464.062,512,454.201,512,442.482v-18.3 C512,417.919,509.469,411.922,504.984,407.552z M144.772,339.822L144.772,339.822H37.361v-40.863h107.411V339.822z M144.772,269.771L144.772,269.771H37.361v-42.007h107.411V269.771z" />
                                  <path d="M448.619,294.203c-58.083-46.371-53.978-43.173-55.356-44.016c0.486,1.719-0.339-2.18,10.325,50.777l24.206,19.325 c7.204,5.752,17.706,4.571,23.456-2.631C457.001,310.456,455.823,299.954,448.619,294.203z" />
                                  <circle cx="271.262" cy="146.57" r="32.45" />
                                </svg>
                              ) : (
                                <span className="inline-block h-2 w-2 rounded-full bg-foreground/70" />
                              )}
                              {c}
                            </span>
                            {(() => {
                              const color =
                                categoryColors[c] || defaultCategoryColor(c);
                              const ccls = colorClasses(color);
                              return (
                                <span className="inline-flex items-center gap-2">
                                  {totalCount > 0 && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] rounded-full border border-border bg-surface/60 text-foreground/80">
                                      {totalCount}
                                    </span>
                                  )}
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Edit ${c} color`}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      try {
                                        const rect = (
                                          e.currentTarget as HTMLElement
                                        ).getBoundingClientRect();
                                        const menuWidth = 220;
                                        const viewportPadding = 8;
                                        const idealLeft =
                                          rect.left +
                                          rect.width / 2 -
                                          menuWidth / 2;
                                        const clampedLeft = Math.max(
                                          viewportPadding,
                                          Math.min(
                                            idealLeft,
                                            window.innerWidth -
                                              menuWidth -
                                              viewportPadding
                                          )
                                        );
                                        setColorMenuPos({
                                          left: Math.round(clampedLeft),
                                          top: Math.round(rect.bottom + 12),
                                        });
                                      } catch {
                                        setColorMenuPos(null);
                                      }
                                      setColorMenuFor(c);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        (
                                          e.currentTarget as HTMLElement
                                        ).click();
                                      }
                                    }}
                                    className={`inline-flex items-center justify-center h-5 w-5 rounded-[4px] ${ccls.swatch} border`}
                                    title="Edit color"
                                  />
                                </span>
                              );
                            })()}
                          </button>
                          {activeCategory === c && (
                            <div className="mt-1 mb-2">
                              {(() => {
                                const items = history.filter(
                                  (h) => (h as any)?.data?.category === c
                                );
                                if (items.length === 0)
                                  return (
                                    <div className="text-xs text-foreground/60 px-1 py-0.5">
                                      No events
                                    </div>
                                  );
                                return (
                                  <div className="space-y-1">
                                    {items.map((h) => {
                                      const slug = (h.title || "")
                                        .toLowerCase()
                                        .replace(/[^a-z0-9]+/g, "-")
                                        .replace(/^-+|-+$/g, "");
                                      const prettyHref = `/event/${slug}-${h.id}`;
                                      const category = (h as any)?.data
                                        ?.category as string | null;
                                      const rowAndBadge = (() => {
                                        if (!category)
                                          return {
                                            row: "",
                                            badge:
                                              "bg-surface/70 text-foreground/70 border-border/70",
                                          };
                                        const color =
                                          categoryColors[category] ||
                                          defaultCategoryColor(category);
                                        const ccls = colorClasses(color);
                                        const row = ccls.tint;
                                        return { row, badge: ccls.badge };
                                      })();
                                      return (
                                        <div
                                          key={h.id}
                                          data-history-item={h.id}
                                          className={`relative px-2 py-2 rounded-md text-sm ${rowAndBadge.row}`}
                                        >
                                          <Link
                                            href={prettyHref}
                                            onClick={() => {
                                              try {
                                                const isTouch =
                                                  typeof window !==
                                                    "undefined" &&
                                                  typeof window.matchMedia ===
                                                    "function" &&
                                                  window.matchMedia(
                                                    "(hover: none), (pointer: coarse)"
                                                  ).matches;
                                                if (isTouch)
                                                  setIsCollapsed(true);
                                              } catch {}
                                            }}
                                            className="block pr-8"
                                            title={h.title}
                                          >
                                            <div className="truncate flex items-center gap-2">
                                              <span className="truncate">
                                                {h.title || "Untitled event"}
                                              </span>
                                            </div>
                                            <div className="text-xs text-foreground/60">
                                              {(() => {
                                                const start =
                                                  (h as any)?.data?.start ||
                                                  (h as any)?.data?.event
                                                    ?.start;
                                                const dateStr =
                                                  start || h.created_at;
                                                return dateStr
                                                  ? new Date(
                                                      dateStr
                                                    ).toLocaleDateString()
                                                  : "";
                                              })()}
                                            </div>
                                          </Link>
                                          {/* Options menu removed for category list items */}
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
            <div className="border-t border-border mx-2 my-3" />
            <div className="px-2 text-xs uppercase tracking-wide text-foreground/60">
              Recent Snapped
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
                const category = (h as any)?.data?.category as string | null;
                const rowAndBadge = (() => {
                  if (!category)
                    return {
                      row: "",
                      badge:
                        "bg-surface/70 text-foreground/70 border-border/70",
                    };
                  const color =
                    categoryColors[category] || defaultCategoryColor(category);
                  const ccls = colorClasses(color);
                  const row = ccls.tint; // tint all categories, not just Birthdays
                  return { row, badge: ccls.badge };
                })();
                return (
                  <div
                    key={h.id}
                    data-history-item={h.id}
                    className={`relative px-2 py-2 rounded-md text-sm ${rowAndBadge.row}`}
                  >
                    <Link
                      href={prettyHref}
                      onClick={() => {
                        try {
                          const isTouch =
                            typeof window !== "undefined" &&
                            typeof window.matchMedia === "function" &&
                            window.matchMedia(
                              "(hover: none), (pointer: coarse)"
                            ).matches;
                          if (isTouch) setIsCollapsed(true);
                        } catch {}
                      }}
                      className="block pr-8"
                      title={h.title}
                    >
                      <div className="truncate flex items-center gap-2">
                        <span className="truncate">
                          {h.title || "Untitled event"}
                        </span>
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
                          className="z-[10000] w-40 rounded-lg border border-border bg-surface/95 backdrop-blur shadow-lg p-2"
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
                          <div className="my-1 h-px bg-border" />
                          {["Birthdays", "Weddings", "Doctor Appointments", "Appointments", "Sport Events", "General Events"].map(
                            (label) => (
                              <button
                                key={label}
                                type="button"
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setItemMenuId(null);
                                  setItemMenuPos(null);
                                  try {
                                    await fetch(`/api/history/${h.id}`, {
                                      method: "PATCH",
                                      headers: { "content-type": "application/json" },
                                      body: JSON.stringify({ category: label }),
                                    });
                                    setHistory((prev) =>
                                      prev.map((r) =>
                                        r.id === h.id
                                          ? {
                                              ...r,
                                              data: {
                                                ...(r.data || {}),
                                                category: label,
                                              },
                                            }
                                          : r
                                      )
                                    );
                                    setCategoryColors((prev) => {
                                      const next = { ...prev } as Record<
                                        string,
                                        string
                                      >;
                                      if (!next[label])
                                        next[label] = defaultCategoryColor(label);
                                      try {
                                        localStorage.setItem(
                                          "categoryColors",
                                          JSON.stringify(next)
                                        );
                                        window.dispatchEvent(
                                          new CustomEvent(
                                            "categoryColorsUpdated",
                                            { detail: next }
                                          )
                                        );
                                      } catch {}
                                      return next;
                                    });
                                  } catch {}
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
                                  <path d="M20 6L9 17l-5-5" />
                                </svg>
                                <span className="text-sm">Mark as {label}</span>
                              </button>
                            )
                          )}
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setItemMenuId(null);
                              setItemMenuPos(null);
                              await deleteHistoryItem(h.id, h.title);
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
              <div className="min-w-0 flex-1 inline-flex items-center gap-2">
                <span className="truncate text-sm font-medium">
                  {displayName}
                </span>
                {credits >= 0 && (
                  <span className="shrink-0 inline-flex items-center rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {credits}
                  </span>
                )}
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
                          style={{
                            filter: isDark ? "invert(1)" : "invert(0)",
                          }}
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
                          resourcesOpen ? "rotate-0" : "rotate-90"
                        }`}
                        aria-hidden="true"
                      >
                        <polyline points="9 18 15 12 9 6" />
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
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20"
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
      {colorMenuFor &&
        colorMenuPos &&
        createPortal(
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              left: colorMenuPos.left,
              top: colorMenuPos.top,
              transform: "none",
            }}
            className="z-[12000] w-[220px] rounded-xl border border-border bg-surface/95 backdrop-blur shadow-lg p-2"
          >
            <div className="px-2 py-1 text-xs uppercase tracking-wide text-foreground/60 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-3.5 w-3.5"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8.56078 20.2501L20.5608 8.25011L15.7501 3.43945L3.75012 15.4395V20.2501H8.56078ZM15.7501 5.56077L18.4395 8.25011L16.5001 10.1895L13.8108 7.50013L15.7501 5.56077ZM12.7501 8.56079L15.4395 11.2501L7.93946 18.7501H5.25012L5.25012 16.0608L12.7501 8.56079Z"
                />
              </svg>
              Edit color
            </div>
            <div className="grid grid-cols-4 gap-2 px-2 pb-2 pt-2 mt-1 place-items-center">
              {(
                [
                  "red",
                  "orange",
                  "amber",
                  "yellow",
                  "lime",
                  "green",
                  "emerald",
                  "teal",
                  "cyan",
                  "sky",
                  "blue",
                  "indigo",
                  "violet",
                  "purple",
                  "fuchsia",
                  "pink",
                ] as const
              ).map((name) => {
                const ccls = colorClasses(name);
                const selected =
                  (categoryColors[colorMenuFor] ||
                    defaultCategoryColor(colorMenuFor)) === name;
                return (
                  <button
                    key={name}
                    type="button"
                    className={`h-6 w-6 rounded-[5px] border ${ccls.swatch} ${
                      selected ? "ring-2 ring-foreground/80" : ""
                    }`}
                    aria-label={`Choose ${name}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const cat = colorMenuFor as string;
                      setCategoryColor(cat, name);
                    }}
                  />
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
