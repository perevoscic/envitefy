"use client";
import Link from "next/link";
import {
  readProfileCache,
  writeProfileCache,
  clearProfileCache,
  PROFILE_CACHE_TTL_MS,
} from "@/utils/profileCache";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "./providers";
import { useSidebar } from "./sidebar-context";
import { signOut, useSession } from "next-auth/react";
import Logo from "@/assets/logo.png";
import { getCategoryIcon } from "@/lib/event-colors";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const ADSENSE_CLIENT_ID = "ca-pub-8853590530457369";
const ADSENSE_SLOT_SIDEBAR = "8155405384";
const ADS_DISABLED_BY_ENV =
  process.env.NEXT_PUBLIC_DISABLE_ADS === "1" ||
  process.env.NODE_ENV !== "production";
const LOCAL_AD_HOST_PATTERN =
  /(^|\.)localhost$|(^|\.)127\.0\.0\.1$|^0\.0\.0\.0$|(^|\.)::1$|\.local$/i;

type SidebarAdUnitProps = {
  className?: string;
};

function SidebarAdUnit({ className }: SidebarAdUnitProps) {
  const adRef = useRef<HTMLModElement | null>(null);
  const [hasContent, setHasContent] = useState(false);
  const [hidden, setHidden] = useState(false);

  if (
    ADS_DISABLED_BY_ENV ||
    (typeof window !== "undefined" &&
      LOCAL_AD_HOST_PATTERN.test(window.location.hostname))
  ) {
    return null;
  }

  useEffect(() => {
    const node = adRef.current;
    if (!node) return;

    let hideTimer: number | null = null;
    let cancelled = false;
    let observer: MutationObserver | null = null;

    const detectContent = () => {
      const el = adRef.current;
      if (!el) return false;
      const populated =
        el.childElementCount > 0 ||
        !!el.querySelector("iframe") ||
        el.getAttribute("data-ad-status") === "filled";
      if (!cancelled) {
        setHasContent(populated);
      }
      if (populated && hideTimer !== null) {
        window.clearTimeout(hideTimer);
        hideTimer = null;
      }
      return populated;
    };

    try {
      const queue = (window.adsbygoogle = window.adsbygoogle || []);
      queue.push({});
    } catch (error) {
      console.debug("[adsense] failed to enqueue ad", error);
    }

    detectContent();

    if (typeof MutationObserver !== "undefined") {
      observer = new MutationObserver(() => {
        if (detectContent() && observer) {
          observer.disconnect();
          observer = null;
        }
      });
      observer.observe(node, { childList: true, subtree: true });
    }

    hideTimer = window.setTimeout(() => {
      if (!detectContent() && !cancelled) {
        if (observer) {
          observer.disconnect();
          observer = null;
        }
        setHidden(true);
      }
    }, 4000);

    return () => {
      if (hideTimer !== null) {
        window.clearTimeout(hideTimer);
      }
      if (observer) observer.disconnect();
      cancelled = true;
    };
  }, []);

  if (hidden) return null;

  const containerClass = ["px-2", hasContent ? "py-2" : "py-0", className || ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClass}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-format="fluid"
        data-ad-layout-key="-gw-3+1f-3d+2z"
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={ADSENSE_SLOT_SIDEBAR}
      />
    </div>
  );
}

const CATEGORY_OPTIONS = [
  "Birthdays",
  "Weddings",
  "Baby Showers",
  "DR Appointments",
  "Appointments",
  "Sport Events",
  "General Events",
  "Car Pool",
] as const;

export default function LeftSidebar() {
  const { data: session, status } = useSession();
  const profileEmail = (session?.user as any)?.email?.toLowerCase?.() ?? null;
  const profileEmailRef = useRef<string | null>(null);
  useEffect(() => {
    if (profileEmail) {
      profileEmailRef.current = profileEmail;
    }
  }, [profileEmail]);
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsOpenFloating, setSettingsOpenFloating] = useState(false);
  const [adminOpenFloating, setAdminOpenFloating] = useState(false);
  const [itemMenuId, setItemMenuId] = useState<string | null>(null);
  const [itemMenuPos, setItemMenuPos] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const [itemMenuOpensUpward, setItemMenuOpensUpward] = useState(false);
  const [itemMenuCategoryOpenFor, setItemMenuCategoryOpenFor] = useState<
    string | null
  >(null);

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

    const onClick = (e: Event) => {
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
        setSettingsOpen(false);
        setSettingsOpenFloating(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setSettingsOpen(false);
        setSettingsOpenFloating(false);
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
    const onDocClick = (e: Event) => {
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
      setItemMenuOpensUpward(false);
      setItemMenuPos(null);
      setItemMenuCategoryOpenFor(null);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setItemMenuId(null);
        setItemMenuOpensUpward(false);
        setItemMenuPos(null);
        setItemMenuCategoryOpenFor(null);
      }
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
    setSettingsOpen(false);
    setSettingsOpenFloating(false);
    setItemMenuId(null);
    setItemMenuPos(null);
    setItemMenuCategoryOpenFor(null);
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
  const userEmail = session?.user?.email as string | undefined;
  // Deprecated scanCredits removed; use unified credits state
  const [subscriptionPlan, setSubscriptionPlan] = useState<
    "free" | "monthly" | "yearly" | "FF" | null
  >(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(
    Boolean((session?.user as any)?.isAdmin)
  );
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [isClientLoaded, setIsClientLoaded] = useState(false);
  useEffect(() => {
    setIsClientLoaded(true);
  }, []);

  useEffect(() => {
    let ignore = false;

    const applyProfile = (
      plan: typeof subscriptionPlan,
      creditsValue: number | null
    ) => {
      setSubscriptionPlan(plan);
      setCredits(plan === "FF" ? Infinity : creditsValue);
    };

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
          const plan =
            p === "free" || p === "monthly" || p === "yearly" || p === "FF"
              ? p
              : null;
          const nextCredits =
            plan === "FF"
              ? Infinity
              : typeof json.credits === "number"
              ? (json.credits as number)
              : null;
          applyProfile(plan, nextCredits === Infinity ? null : nextCredits);
          writeProfileCache(
            profileEmailRef.current || profileEmail,
            plan,
            nextCredits
          );
          if (typeof json.isAdmin === "boolean") {
            setIsAdmin(json.isAdmin);
          }
          if (
            json &&
            typeof json.categoryColors === "object" &&
            json.categoryColors
          ) {
            setCategoryColors((prev) => ({
              ...prev,
              ...(json.categoryColors as Record<string, string>),
            }));
          }
        }
      } catch {
      } finally {
        if (!ignore) setProfileLoaded(true);
      }
    }

    if (status === "authenticated") {
      const cached = readProfileCache(profileEmailRef.current || profileEmail);
      const hasFreshCache =
        cached && Date.now() - cached.timestamp < PROFILE_CACHE_TTL_MS;
      if (cached) {
        applyProfile(cached.plan, cached.credits);
        setIsAdmin(Boolean((session?.user as any)?.isAdmin));
        setProfileLoaded(true);
        if (hasFreshCache) {
          return () => {
            ignore = true;
          };
        }
      } else {
        setProfileLoaded(false);
      }
      loadProfile();
    } else if (status === "unauthenticated") {
      clearProfileCache(profileEmailRef.current || profileEmail);
      profileEmailRef.current = null;
      setProfileLoaded(true);
      setSubscriptionPlan(null);
      setCredits(null);
    }
    return () => {
      ignore = true;
    };
  }, [status, profileEmail, session?.user]);

  useEffect(() => {
    setIsAdmin(Boolean((session?.user as any)?.isAdmin));
  }, [session?.user]);

  const showCreditsShell =
    profileLoaded &&
    subscriptionPlan !== "monthly" &&
    subscriptionPlan !== "yearly" &&
    subscriptionPlan !== "FF";
  const creditsAreKnown =
    profileLoaded && typeof credits === "number" && credits >= 0;
  const creditsValue =
    typeof credits === "number" && credits >= 0 ? credits : 0;
  const shouldBlockNewSnap = () => {
    const isFreePlan = subscriptionPlan == null || subscriptionPlan === "free";
    return isFreePlan && typeof credits === "number" && credits <= 0;
  };
  const collapseSidebarOnTouch = () => {
    try {
      const isTouch =
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(hover: none), (pointer: coarse)").matches;
      if (isTouch) setIsCollapsed(true);
    } catch {}
  };
  const triggerCreateEvent = () => {
    collapseSidebarOnTouch();
    try {
      (window as any).__openCreateEvent?.();
    } catch {}
  };
  const handleSnapShortcutClick = (
    event: React.MouseEvent<HTMLAnchorElement>
  ) => {
    if (shouldBlockNewSnap()) {
      event.preventDefault();
      router.push("/subscription");
      collapseSidebarOnTouch();
      return;
    }
    collapseSidebarOnTouch();
  };
  const profileMenuItemClass =
    "w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm text-foreground/90 transition duration-150 ease-out transform hover:text-foreground hover:bg-surface/80 active:bg-surface/60 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-primary/30";
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
  const createdEventsCount = useMemo(() => {
    return history.reduce((acc, row) => {
      if (!row || typeof row !== "object") return acc;
      const data: any = row?.data;
      if (!data || typeof data !== "object") return acc;
      if (data.shared) return acc;

      const manualFlag =
        data.createdVia === "manual" ||
        data.createdManually === true ||
        data.manual === true ||
        data.savedVia === "manual";

      const hasManualFields =
        typeof data.startISO === "string" ||
        typeof data.endISO === "string" ||
        typeof data.recurrence === "string";

      const hasOcrSignature =
        Boolean(data.ocrText || data.fieldsGuess || data.ocrSource) ||
        (Array.isArray(data.events) && data.events.length > 0) ||
        Boolean(
          data.practiceSchedule &&
            (data.practiceSchedule.detected ||
              (Array.isArray(data.practiceSchedule.groups) &&
                data.practiceSchedule.groups.length > 0))
        ) ||
        Boolean(
          data.schedule &&
            (data.schedule.detected ||
              (Array.isArray(data.schedule?.games) &&
                data.schedule.games.length > 0))
        );

      if (manualFlag || (hasManualFields && !hasOcrSignature)) {
        return acc + 1;
      }

      return acc;
    }, 0);
  }, [history]);
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
    if (c === "Baby Showers") return "pink";
    if (c === "Sport Events") return "indigo";
    if (c === "Play Days") return "rose";
    if (c === "Car Pool") return "cyan";
    return "slate"; // neutral fallback
  };

  // Basic keyword-based category guesser when OCR did not set one
  const guessCategoryFromText = (text: string): string | null => {
    const s = String(text || "").toLowerCase();
    if (!s) return null;
    if (/birthday|b-day|turns\s+\d+|party for/.test(s)) return "Birthdays";
    if (/wedding|bridal|ceremony|reception/.test(s)) return "Weddings";
    if (/\b(baby[-\s]?shower|sprinkle)\b/.test(s)) return "Baby Showers";
    if (/doctor|dentist|appointment|check[- ]?up|clinic/.test(s))
      return "Doctor Appointments";
    if (/game|match|vs\.|at\s+[A-Z]|tournament|championship|league/.test(s))
      return "Sport Events";
    if (/playdate|play\s*day|kids?\s*play/.test(s)) return "Play Days";
    if (
      /(car\s*pool|carpool|ride\s*share|school\s*pickup|school\s*drop[- ]?off)/.test(
        s
      )
    )
      return "Car Pool";
    if (/appointment|meeting|consult/.test(s)) return "Appointments";
    return null;
  };

  const predefinedCategories = [
    "Birthdays",
    "Doctor Appointments",
    "Appointments",
    "Weddings",
    "Baby Showers",
    "Sport Events",
    "Play Days",
    "Car Pool",
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
    const onDocClick = (e: Event) => {
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
        for (const c of categories)
          if (!next[c]) {
            next[c] = defaultCategoryColor(c);
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
          badge: "bg-lime-500/30 text-lime-300 border-lime-400/40",
          tint: "bg-lime-500/20",
          hoverTint: "hover:bg-lime-500/30",
        };
      case "zinc":
        return {
          swatch: "bg-zinc-500 border-zinc-400",
          badge: "bg-zinc-500/30 text-zinc-300 border-zinc-400/40",
          tint: "bg-zinc-500/20",
          hoverTint: "hover:bg-zinc-500/30",
        };
      case "neutral":
        return {
          swatch: "bg-neutral-500 border-neutral-400",
          badge: "bg-neutral-500/30 text-neutral-300 border-neutral-400/40",
          tint: "bg-neutral-500/20",
          hoverTint: "hover:bg-neutral-500/30",
        };
      case "stone":
        return {
          swatch: "bg-stone-500 border-stone-400",
          badge: "bg-stone-500/30 text-stone-300 border-stone-400/40",
          tint: "bg-stone-500/20",
          hoverTint: "hover:bg-stone-500/30",
        };
      case "gray":
        return {
          swatch: "bg-gray-500 border-gray-400",
          badge: "bg-gray-500/30 text-gray-300 border-gray-400/40",
          tint: "bg-gray-500/20",
          hoverTint: "hover:bg-gray-500/30",
        };
      case "red":
        return {
          swatch: "bg-red-500 border-red-400",
          badge: "bg-red-500/30 text-red-300 border-red-400/40",
          tint: "bg-red-500/20",
          hoverTint: "hover:bg-red-500/30",
        };
      case "pink":
        return {
          swatch: "bg-pink-500 border-pink-400",
          badge: "bg-pink-500/30 text-pink-300 border-pink-400/40",
          tint: "bg-pink-500/20",
          hoverTint: "hover:bg-pink-500/30",
        };
      case "rose":
        return {
          swatch: "bg-rose-500 border-rose-400",
          badge: "bg-rose-500/30 text-rose-300 border-rose-400/40",
          tint: "bg-rose-500/20",
          hoverTint: "hover:bg-rose-500/30",
        };
      case "fuchsia":
        return {
          swatch: "bg-fuchsia-500 border-fuchsia-400",
          badge: "bg-fuchsia-500/30 text-fuchsia-300 border-fuchsia-400/40",
          tint: "bg-fuchsia-500/20",
          hoverTint: "hover:bg-fuchsia-500/30",
        };
      case "violet":
        return {
          swatch: "bg-violet-500 border-violet-400",
          badge: "bg-violet-500/30 text-violet-300 border-violet-400/40",
          tint: "bg-violet-500/20",
          hoverTint: "hover:bg-violet-500/30",
        };
      case "purple":
        return {
          swatch: "bg-purple-500 border-purple-400",
          badge: "bg-purple-500/30 text-purple-300 border-purple-400/40",
          tint: "bg-purple-500/20",
          hoverTint: "hover:bg-purple-500/30",
        };
      case "indigo":
        return {
          swatch: "bg-indigo-500 border-indigo-400",
          badge: "bg-indigo-500/30 text-indigo-300 border-indigo-400/40",
          tint: "bg-indigo-500/20",
          hoverTint: "hover:bg-indigo-500/30",
        };
      case "blue":
        return {
          swatch: "bg-blue-500 border-blue-400",
          badge: "bg-blue-500/30 text-blue-300 border-blue-400/40",
          tint: "bg-blue-500/20",
          hoverTint: "hover:bg-blue-500/30",
        };
      case "sky":
        return {
          swatch: "bg-sky-500 border-sky-400",
          badge: "bg-sky-500/30 text-sky-300 border-sky-400/40",
          tint: "bg-sky-500/20",
          hoverTint: "hover:bg-sky-500/30",
        };
      case "cyan":
        return {
          swatch: "bg-cyan-500 border-cyan-400",
          badge: "bg-cyan-500/30 text-cyan-300 border-cyan-400/40",
          tint: "bg-cyan-500/20",
          hoverTint: "hover:bg-cyan-500/30",
        };
      case "teal":
        return {
          swatch: "bg-teal-500 border-teal-400",
          badge: "bg-teal-500/30 text-teal-300 border-teal-400/40",
          tint: "bg-teal-500/20",
          hoverTint: "hover:bg-teal-500/30",
        };
      case "emerald":
        return {
          swatch: "bg-emerald-500 border-emerald-400",
          badge: "bg-emerald-500/30 text-emerald-300 border-emerald-400/40",
          tint: "bg-emerald-500/20",
          hoverTint: "hover:bg-emerald-500/30",
        };
      case "green":
        return {
          swatch: "bg-green-500 border-green-400",
          badge: "bg-green-500/30 text-green-300 border-green-400/40",
          tint: "bg-green-500/20",
          hoverTint: "hover:bg-green-500/30",
        };
      case "yellow":
        return {
          swatch: "bg-yellow-500 border-yellow-400",
          badge: "bg-yellow-500/30 text-yellow-300 border-yellow-400/40",
          tint: "bg-yellow-500/20",
          hoverTint: "hover:bg-yellow-500/30",
        };
      case "amber":
        return {
          swatch: "bg-amber-500 border-amber-400",
          badge: "bg-amber-500/30 text-amber-300 border-amber-400/40",
          tint: "bg-amber-500/20",
          hoverTint: "hover:bg-amber-500/30",
        };
      case "orange":
        return {
          swatch: "bg-orange-500 border-orange-400",
          badge: "bg-orange-500/30 text-orange-300 border-orange-400/40",
          tint: "bg-orange-500/20",
          hoverTint: "hover:bg-orange-500/30",
        };
      case "slate":
        return {
          swatch: "bg-slate-500 border-slate-400",
          badge: "bg-slate-500/30 text-slate-300 border-slate-400/40",
          tint: "bg-slate-500/20",
          hoverTint: "hover:bg-slate-500/30",
        };
      default:
        return {
          swatch: "bg-foreground/40 border-border/60",
          badge: "bg-surface/75 text-foreground/80 border-border/70",
          tint: "bg-surface/70",
          hoverTint: "hover:bg-surface/80",
        };
    }
  };

  const recentAdIndex = useMemo<number | null>(() => {
    if (!history || history.length <= 1) return null;
    const choice = Math.random() < 0.5 ? 1 : 2;
    return Math.min(history.length - 1, choice);
  }, [history.length]);

  const categoryAdPositions = useMemo<Map<string, number | null>>(() => {
    const counts = new Map<string, number>();
    for (const row of history) {
      const category = (row as any)?.data?.category as string | null;
      if (!category) continue;
      if (category.trim().toLowerCase() === "shared events") continue;
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
    const map = new Map<string, number | null>();
    counts.forEach((count, category) => {
      if (count <= 1) {
        map.set(category, null);
        return;
      }
      const choice = Math.random() < 0.5 ? 1 : 2;
      map.set(category, Math.min(count - 1, choice));
    });
    return map;
  }, [history]);

  // Shared Events gradient palette (8 options)
  const SHARED_GRADIENTS: {
    id: string;
    swatch: string; // compact square
    lightRow: string; // list item background when theme = light
    darkRow: string; // list item background when theme = dark
  }[] = [
    {
      id: "shared-g1",
      swatch: "bg-gradient-to-br from-cyan-400 to-fuchsia-400",
      lightRow: "bg-gradient-to-br from-cyan-200 via-sky-200 to-fuchsia-200",
      darkRow: "bg-gradient-to-br from-cyan-950 via-slate-900 to-fuchsia-900",
    },
    {
      id: "shared-g2",
      swatch: "bg-gradient-to-br from-rose-400 to-indigo-400",
      lightRow: "bg-gradient-to-br from-rose-200 via-fuchsia-200 to-indigo-200",
      darkRow: "bg-gradient-to-br from-rose-950 via-fuchsia-900 to-indigo-900",
    },
    {
      id: "shared-g3",
      swatch: "bg-gradient-to-br from-emerald-400 to-sky-400",
      lightRow: "bg-gradient-to-br from-emerald-200 via-teal-200 to-sky-200",
      darkRow: "bg-gradient-to-br from-emerald-950 via-teal-900 to-sky-900",
    },
    {
      id: "shared-g4",
      swatch: "bg-gradient-to-br from-amber-400 to-pink-400",
      lightRow: "bg-gradient-to-br from-amber-200 via-orange-200 to-pink-200",
      darkRow: "bg-gradient-to-br from-amber-950 via-rose-900 to-pink-900",
    },
    {
      id: "shared-g5",
      swatch: "bg-gradient-to-r from-indigo-400 to-cyan-400",
      lightRow: "bg-gradient-to-r from-indigo-200 via-blue-200 to-cyan-200",
      darkRow: "bg-gradient-to-r from-indigo-950 via-blue-900 to-cyan-900",
    },
    {
      id: "shared-g6",
      swatch: "bg-gradient-to-br from-lime-400 to-emerald-400",
      lightRow: "bg-gradient-to-br from-lime-200 via-green-200 to-emerald-200",
      darkRow:
        "bg-gradient-to-br from-emerald-950 via-green-900 to-emerald-800",
    },
    {
      id: "shared-g7",
      swatch: "bg-gradient-to-br from-purple-400 to-pink-400",
      lightRow: "bg-gradient-to-br from-purple-200 via-fuchsia-200 to-pink-200",
      darkRow: "bg-gradient-to-br from-purple-950 via-fuchsia-900 to-pink-900",
    },
    {
      id: "shared-g8",
      swatch: "bg-gradient-to-br from-slate-400 to-sky-400",
      lightRow: "bg-gradient-to-br from-slate-200 via-zinc-200 to-sky-200",
      darkRow: "bg-gradient-to-br from-slate-950 via-zinc-900 to-sky-900",
    },
  ];
  const getSharedGradientId = (): string => {
    const val = categoryColors["Shared events"];
    const exists = SHARED_GRADIENTS.some((g) => g.id === val);
    return exists ? (val as string) : "shared-g1";
  };

  const sharedGradientRowClass = (): string => {
    const id = getSharedGradientId();
    const found = SHARED_GRADIENTS.find((g) => g.id === id);
    if (!found) {
      return theme === "dark"
        ? SHARED_GRADIENTS[0].darkRow
        : SHARED_GRADIENTS[0].lightRow;
    }
    return theme === "dark" ? found.darkRow : found.lightRow;
  };

  const sharedTextClass = "text-neutral-900 dark:text-foreground";
  const sharedMutedTextClass = "text-neutral-600 dark:text-foreground/70";

  const sharedGradientSwatchClass = (): string => {
    const id = getSharedGradientId();
    const found = SHARED_GRADIENTS.find((g) => g.id === id);
    return found?.swatch || SHARED_GRADIENTS[0].swatch;
  };

  const persistCategoryColors = async (map: Record<string, string>) => {
    if (status !== "authenticated") return;
    try {
      await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ categoryColors: map }),
      });
    } catch {}
  };

  const setCategoryColor = (category: string, color: string) => {
    if (!category) return;
    setCategoryColors(
      (prev) =>
        ({
          ...prev,
          [category]: color,
        } as Record<string, string>)
    );
    setColorMenuFor(null);
    setColorMenuPos(null);
  };

  // Persist and broadcast category colors after commit to avoid cross-component updates during render
  useEffect(() => {
    try {
      if (categoryColors && Object.keys(categoryColors).length > 0) {
        localStorage.setItem("categoryColors", JSON.stringify(categoryColors));
      }
    } catch {}
    try {
      window.dispatchEvent(
        new CustomEvent("categoryColorsUpdated", { detail: categoryColors })
      );
    } catch {}
    try {
      if (categoryColors && Object.keys(categoryColors).length > 0) {
        persistCategoryColors(categoryColors);
      }
    } catch {}
  }, [categoryColors]);

  const sortHistoryRows = (
    rows: Array<{
      id: string;
      title: string;
      created_at?: string;
      data?: any;
    }>
  ) => {
    return [...(rows || [])].sort((a, b) => {
      const at = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (bt !== at) return bt - at; // newer first
      // Tie-breaker to match server: id desc
      return String(b.id).localeCompare(String(a.id));
    });
  };

  useEffect(() => {
    let cancelled = false;
    if (status !== "authenticated") return;
    (async () => {
      try {
        const res = await fetch("/api/history", {
          cache: "no-store",
          credentials: "include",
        });
        const j = await res.json().catch(() => ({ items: [] }));
        try {
          const items = Array.isArray(j?.items) ? j.items : [];
          const top = items?.[0] || null;
          console.debug("[sidebar] fetched history", {
            count: items.length,
            top: top ? { id: top.id, created_at: top.created_at } : null,
          });
        } catch {}
        if (!cancelled)
          setHistory(
            sortHistoryRows(
              (j.items || []).map((r: any) => ({
                id: r.id,
                title: r.title,
                created_at: r.created_at || undefined,
                data: r.data,
              }))
            )
          );
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  useEffect(() => {
    let cancelled = false;
    const onCreated = async (e: Event) => {
      try {
        const anyEvent = e as any;
        const detail = (anyEvent && anyEvent.detail) || null;
        try {
          console.debug("[sidebar] history:created event", detail);
        } catch {}
        if (detail && detail.id) {
          // Optimistically prepend; avoid duplicates
          setHistory((prev) => {
            const exists = prev.some((r) => r.id === detail.id);
            const detailData =
              detail.data && typeof detail.data === "object"
                ? detail.data
                : {};
            const nextItem = {
              id: String(detail.id),
              title: String(detail.title || "Event"),
              created_at: String(detail.created_at || new Date().toISOString()),
              data: {
                ...detailData,
                ...(detail.start ? { start: String(detail.start) } : {}),
                ...(detail.category
                  ? { category: String(detail.category) }
                  : {}),
              },
            } as { id: string; title: string; created_at?: string; data?: any };
            const next = exists ? prev : [nextItem, ...prev];
            const sorted = sortHistoryRows(next as any).slice(0, 200);
            try {
              const top = sorted?.[0] || null;
              console.debug("[sidebar] history updated (optimistic)", {
                count: sorted.length,
                top: top ? { id: top.id, created_at: top.created_at } : null,
              });
            } catch {}
            return sorted;
          });
          return;
        }
        // Fallback: full refetch
        const res = await fetch("/api/history", {
          cache: "no-store",
          credentials: "include",
        });
        const j = await res.json().catch(() => ({ items: [] }));
        if (!cancelled)
          setHistory(
            sortHistoryRows(
              (j.items || []).map((r: any) => ({
                id: r.id,
                title: r.title,
                created_at: r.created_at || undefined,
                data: r.data,
              }))
            )
          );
      } catch {}
    };
    window.addEventListener("history:created", onCreated as any);
    return () => {
      cancelled = true;
      window.removeEventListener("history:created", onCreated as any);
    };
  }, []);

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
      // Notify other views (e.g., calendar) to remove events for this history id
      try {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("history:deleted", { detail: { id } })
          );
        }
      } catch {}
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
    isAdmin: boolean;
  }) => {
    const { isDark, toggleTheme, onCloseMenu, isAdmin } = props;
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
          <span className="text-sm">Settings</span>
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
          <span className="text-sm">Subscription</span>
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

        <Link
          href="/about"
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
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span className="text-sm">About us</span>
        </Link>

        <Link
          href="/contact"
          onClick={onCloseMenu}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-foreground/90 hover:text-foreground hover:bg-surface"
        >
          <svg
            fill="currentColor"
            viewBox="0 0 492.014 492.014"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M339.277,459.566H34.922V32.446h304.354v105.873l32.446-32.447V16.223C371.723,7.264,364.458,0,355.5,0 H18.699C9.739,0,2.473,7.264,2.473,16.223v459.568c0,8.959,7.265,16.223,16.226,16.223H355.5c8.958,0,16.223-7.264,16.223-16.223 V297.268l-32.446,32.447V459.566z" />
            <path d="M291.446,71.359H82.751c-6.843,0-12.396,5.553-12.396,12.398c0,6.844,5.553,12.397,12.396,12.397h208.694 c6.845,0,12.397-5.553,12.397-12.397C303.843,76.912,298.29,71.359,291.446,71.359z" />
            <path d="M303.843,149.876c0-6.844-5.553-12.398-12.397-12.398H82.751c-6.843,0-12.396,5.554-12.396,12.398 c0,6.845,5.553,12.398,12.396,12.398h208.694C298.29,162.274,303.843,156.722,303.843,149.876z" />
            <path d="M274.004,203.6H82.751c-6.843,0-12.396,5.554-12.396,12.398c0,6.845,5.553,12.397,12.396,12.397h166.457 L274.004,203.6z" />
            <path d="M204.655,285.79c1.678-5.618,4.076-11.001,6.997-16.07h-128.9c-6.843,0-12.396,5.553-12.396,12.398 c0,6.844,5.553,12.398,12.396,12.398h119.304L204.655,285.79z" />
            <path d="M82.751,335.842c-6.843,0-12.396,5.553-12.396,12.398c0,6.843,5.553,12.397,12.396,12.397h108.9 c-3.213-7.796-4.044-16.409-1.775-24.795H82.751z" />
            <path d="M479.403,93.903c-6.496-6.499-15.304-10.146-24.48-10.146c-9.176,0-17.982,3.647-24.471,10.138 L247.036,277.316c-5.005,5.003-8.676,11.162-10.703,17.942l-14.616,48.994c-0.622,2.074-0.057,4.318,1.477,5.852 c1.122,1.123,2.624,1.727,4.164,1.727c0.558,0,1.13-0.08,1.688-0.249l48.991-14.618c6.782-2.026,12.941-5.699,17.943-10.702 l183.422-183.414c6.489-6.49,10.138-15.295,10.138-24.472C489.54,109.197,485.892,100.392,479.403,93.903z" />
          </svg>
          <span className="text-sm">Contact us</span>
        </Link>

        {isAdmin && (
          <>
            <Link
              href="/admin"
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
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className="text-sm">Admin</span>
            </Link>
            <Link
              href="/admin/theme-toggle"
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
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span className="text-sm">Theme Toggle</span>
            </Link>
          </>
        )}

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
              setMenuOpen((v) => {
                const next = !v;
                setSettingsOpen(false);
                setSettingsOpenFloating(false);
                setAdminOpenFloating(false);
                return next;
              });
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="inline-flex fixed bottom-3 left-3 z-[400] items-center justify-center h-10 w-10 rounded-full border border-border bg-surface/90 text-foreground/90 hover:bg-surface shadow-lg"
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
              className="block fixed bottom-16 left-3 z-[1000] w-45 rounded-xl border border-border bg-surface/95 backdrop-blur shadow-2xl overflow-visible"
            >
              <div className="p-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsOpenFloating((v) => {
                        const next = !v;
                        return next;
                      });
                    }}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-foreground/90 hover:text-foreground hover:bg-surface"
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
                        aria-hidden="true"
                      >
                        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0A1.65 1.65 0 0 0 9 3.09V3a2 2 0 1 1 4 0v.09c0 .66.39 1.26 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.47.47-.61 1.17-.33 1.78h0A1.65 1.65 0 0 0 20.91 12H21a2 2 0 1 1 0 4h-.09c-.66 0-1.26.39-1.51 1z" />
                      </svg>
                      <span className="text-sm">Settings</span>
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
                        settingsOpenFloating ? "rotate-0" : "rotate-90"
                      }`}
                      aria-hidden="true"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>

                  {settingsOpenFloating && (
                    <div className="absolute top-1/2 left-full ml-2 -translate-y-1/2 w-40 rounded-lg border border-border bg-surface/95 backdrop-blur shadow-2xl p-2 z-[1100]">
                      <Link
                        href="/settings"
                        onClick={() => {
                          setMenuOpen(false);
                          setSettingsOpenFloating(false);
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
                          <circle cx="12" cy="7" r="4" />
                          <path d="M5.5 21v-2a6.5 6.5 0 0 1 13 0v2" />
                        </svg>
                        <span className="text-sm">Profile</span>
                      </Link>

                      <Link
                        href="/subscription"
                        onClick={() => {
                          setMenuOpen(false);
                          setSettingsOpenFloating(false);
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
                            x="2"
                            y="5"
                            width="20"
                            height="14"
                            rx="2"
                            ry="2"
                          />
                          <line x1="2" y1="10" x2="22" y2="10" />
                          <line x1="7" y1="15" x2="7.01" y2="15" />
                          <line x1="11" y1="15" x2="13" y2="15" />
                        </svg>
                        <span className="text-sm">Subscription</span>
                      </Link>
                    </div>
                  )}
                </div>

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

                <Link
                  href="/about"
                  onClick={() => {
                    setMenuOpen(false);
                    setSettingsOpenFloating(false);
                    setAdminOpenFloating(false);
                  }}
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
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span className="text-sm">About us</span>
                </Link>

                <Link
                  href="/contact"
                  onClick={() => {
                    setMenuOpen(false);
                    setSettingsOpenFloating(false);
                    setAdminOpenFloating(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-foreground/90 hover:text-foreground hover:bg-surface"
                >
                  <svg
                    fill="currentColor"
                    viewBox="0 0 492.014 492.014"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M339.277,459.566H34.922V32.446h304.354v105.873l32.446-32.447V16.223C371.723,7.264,364.458,0,355.5,0 H18.699C9.739,0,2.473,7.264,2.473,16.223v459.568c0,8.959,7.265,16.223,16.226,16.223H355.5c8.958,0,16.223-7.264,16.223-16.223 V297.268l-32.446,32.447V459.566z" />
                    <path d="M291.446,71.359H82.751c-6.843,0-12.396,5.553-12.396,12.398c0,6.844,5.553,12.397,12.396,12.397h208.694 c6.845,0,12.397-5.553,12.397-12.397C303.843,76.912,298.29,71.359,291.446,71.359z" />
                    <path d="M303.843,149.876c0-6.844-5.553-12.398-12.397-12.398H82.751c-6.843,0-12.396,5.554-12.396,12.398 c0,6.845,5.553,12.398,12.396,12.398h208.694C298.29,162.274,303.843,156.722,303.843,149.876z" />
                    <path d="M274.004,203.6H82.751c-6.843,0-12.396,5.554-12.396,12.398c0,6.845,5.553,12.397,12.396,12.397h166.457 L274.004,203.6z" />
                    <path d="M204.655,285.79c1.678-5.618,4.076-11.001,6.997-16.07h-128.9c-6.843,0-12.396,5.553-12.396,12.398 c0,6.844,5.553,12.398,12.396,12.398h119.304L204.655,285.79z" />
                    <path d="M82.751,335.842c-6.843,0-12.396,5.553-12.396,12.398c0,6.843,5.553,12.397,12.396,12.397h108.9 c-3.213-7.796-4.044-16.409-1.775-24.795H82.751z" />
                    <path d="M479.403,93.903c-6.496-6.499-15.304-10.146-24.48-10.146c-9.176,0-17.982,3.647-24.471,10.138 L247.036,277.316c-5.005,5.003-8.676,11.162-10.703,17.942l-14.616,48.994c-0.622,2.074-0.057,4.318,1.477,5.852 c1.122,1.123,2.624,1.727,4.164,1.727c0.558,0,1.13-0.08,1.688-0.249l48.991-14.618c6.782-2.026,12.941-5.699,17.943-10.702 l183.422-183.414c6.489-6.49,10.138-15.295,10.138-24.472C489.54,109.197,485.892,100.392,479.403,93.903z" />
                  </svg>
                  <span className="text-sm">Contact us</span>
                </Link>

                {isAdmin && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setAdminOpenFloating((v) => !v);
                      }}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-foreground/90 hover:text-foreground hover:bg-surface"
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
                          aria-hidden="true"
                        >
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        <span className="text-sm">Admin</span>
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
                          adminOpenFloating ? "rotate-0" : "rotate-90"
                        }`}
                        aria-hidden="true"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                    {adminOpenFloating && (
                      <div className="absolute top-1/2 left-full ml-2 -translate-y-1/2 w-44 rounded-lg border border-border bg-surface/95 backdrop-blur shadow-2xl p-2 z-[1100]">
                        <Link
                          href="/admin"
                          onClick={() => {
                            setMenuOpen(false);
                            setAdminOpenFloating(false);
                          }}
                          className="flex items-center gap-3 px-3 py-2 rounded-md text-foreground/90 hover:text-foreground hover:bg-surface"
                        >
                          <span className="text-sm">Dashboard</span>
                        </Link>
                        <Link
                          href="/admin/emails"
                          onClick={() => {
                            setMenuOpen(false);
                            setAdminOpenFloating(false);
                          }}
                          className="flex items-center gap-3 px-3 py-2 rounded-md text-foreground/90 hover:text-foreground hover:bg-surface"
                        >
                          <span className="text-sm">Emails</span>
                        </Link>
                        <Link
                          href="/admin/campaigns"
                          onClick={() => {
                            setMenuOpen(false);
                            setAdminOpenFloating(false);
                          }}
                          className="flex items-center gap-3 px-3 py-2 rounded-md text-foreground/90 hover:text-foreground hover:bg-surface"
                        >
                          <span className="text-sm">Campaigns</span>
                        </Link>
                        <Link
                          href="/admin/theme-toggle"
                          onClick={() => {
                            setMenuOpen(false);
                            setAdminOpenFloating(false);
                          }}
                          className="flex items-center gap-3 px-3 py-2 rounded-md text-foreground/90 hover:text-foreground hover:bg-surface"
                        >
                          <span className="text-sm">Theme Toggle</span>
                        </Link>
                      </div>
                    )}
                  </div>
                )}

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
            <div className="min-w-0 leading-tight">
              <span className="text-base text-foreground truncate block">
                <span className="font-pacifico">Snap</span>
                <span> </span>
                <span className="font-montserrat font-semibold">My Date</span>
              </span>
              <span className="text-xs text-foreground/60 block truncate">
                Snap it. Save it. Done.
              </span>
            </div>
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
              <div className="block px-2 py-2 rounded-md hover:bg-surface/70 text-sm">
                <div className="flex items-center justify-between pl-0">
                  <Link
                    href="/"
                    onClick={collapseSidebarOnTouch}
                    className="flex items-center gap-2"
                  >
                    <svg
                      viewBox="0 0 16 16"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                      <g strokeLinecap="round" strokeLinejoin="round"></g>
                      <g id="SVGRepo_iconCarrier">
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M9.5 1.1l3.4 3.5.1.4v2h-1V6H8V2H3v11h4v1H2.5l-.5-.5v-12l.5-.5h6.7l.3.1zM9 2v3h2.9L9 2zm4 14h-1v-3H9v-1h3V9h1v3h3v1h-3v3z"
                        ></path>
                      </g>
                    </svg>
                    <span>New Snap</span>
                  </Link>
                  <div className="flex items-center gap-1">
                    <Link
                      href="/snap?action=camera"
                      onClick={handleSnapShortcutClick}
                      className="p-1 rounded hover:bg-surface/50"
                      aria-label="Snap with camera"
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
                        <path d="M12 16C13.6569 16 15 14.6569 15 13C15 11.3431 13.6569 10 12 10C10.3431 10 9 11.3431 9 13C9 14.6569 10.3431 16 12 16Z" />
                        <path d="M3 16.8V9.2C3 8.0799 3 7.51984 3.21799 7.09202C3.40973 6.71569 3.71569 6.40973 4.09202 6.21799C4.51984 6 5.0799 6 6.2 6H7.25464C7.37758 6 7.43905 6 7.49576 5.9935C7.79166 5.95961 8.05705 5.79559 8.21969 5.54609C8.25086 5.49827 8.27836 5.44328 8.33333 5.33333C8.44329 5.11342 8.49827 5.00346 8.56062 4.90782C8.8859 4.40882 9.41668 4.08078 10.0085 4.01299C10.1219 4 10.2448 4 10.4907 4H13.5093C13.7552 4 13.8781 4 13.9915 4.01299C14.5833 4.08078 15.1141 4.40882 15.4394 4.90782C15.5017 5.00345 15.5567 5.11345 15.6667 5.33333C15.7216 5.44329 15.7491 5.49827 15.7803 5.54609C15.943 5.79559 16.2083 5.95961 16.5042 5.9935C16.561 6 16.6224 6 16.7454 6H17.8C18.9201 6 19.4802 6 19.908 6.21799C20.2843 6.40973 20.5903 6.71569 20.782 7.09202C21 7.51984 21 8.0799 21 9.2V16.8C21 17.9201 21 18.4802 20.782 18.908C20.5903 19.2843 20.2843 19.5903 19.908 19.782C19.4802 20 18.9201 20 17.8 20H6.2C5.0799 20 4.51984 20 4.09202 19.782C3.71569 19.5903 3.40973 19.2843 3.21799 18.908C3 18.4802 3 17.9201 3 16.8Z" />
                      </svg>
                    </Link>
                    <Link
                      href="/snap?action=upload"
                      onClick={handleSnapShortcutClick}
                      className="p-1 rounded hover:bg-surface/50"
                      aria-label="Upload file"
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
                        <path d="M18.5 20L18.5 14M18.5 14L21 16.5M18.5 14L16 16.5" />
                        <path d="M12 19H5C3.89543 19 3 18.1046 3 17V7C3 5.89543 3.89543 5 5 5H9.58579C9.851 5 10.1054 5.10536 10.2929 5.29289L12 7H19C20.1046 7 21 7.89543 21 9V11" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
              <div className="mt-1 flex items-center justify-between px-2 py-2 rounded-md hover:bg-surface/70 text-sm">
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    triggerCreateEvent();
                  }}
                  className="flex flex-1 items-center gap-2 pl-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <svg
                    viewBox="0 0 32 32"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M18 31h2v-2a1.0006 1.0006 0 0 1 1-1h6a1.0006 1.0006 0 0 1 1 1v2h2v-2a3.0033 3.0033 0 0 0-3-3H21a3.0033 3.0033 0 0 0-3 3Z" />
                    <path d="M24 25a4 4 0 1 1 4-4 4.0039 4.0039 0 0 1-4 4Zm0-6a2 2 0 1 0 2 2 2.0027 2.0027 0 0 0-2-2Z" />
                    <path d="M2 31h2v-2a1.0009 1.0009 0 0 1 1-1h6a1.0009 1.0009 0 0 1 1 1v2h2v-2a3.0033 3.0033 0 0 0-3-3H5a3.0033 3.0033 0 0 0-3 3Z" />
                    <path d="M8 25a4 4 0 1 1 4-4 4.0042 4.0042 0 0 1-4 4Zm0-6a2 2 0 1 0 2 2 2.0023 2.0023 0 0 0-2-2Z" />
                    <path d="M18 16h2v-2a1.0009 1.0009 0 0 1 1-1h6a1.0009 1.0009 0 0 1 1 1v2h2V14a3.0033 3.0033 0 0 0-3-3H21a3.0033 3.0033 0 0 0-3 3Z" />
                    <path d="M24 10a4 4 0 1 1 4-4 4.0042 4.0042 0 0 1-4 4Zm0-6a2 2 0 1 0 2 2A2.0023 2.0023 0 0 0 24 4Z" />
                    <path d="M2 16h2v-2a1.0013 1.0013 0 0 1 1-1h6a1.0013 1.0013 0 0 1 1 1v2h2V14a3.0033 3.0033 0 0 0-3-3H5a3.0033 3.0033 0 0 0-3 3Z" />
                    <path d="M8 10a4 4 0 1 1 4-4 4.0045 4.0045 0 0 1-4 4Zm0-6a2 2 0 1 0 2 2A2.002 2.002 0 0 0 8 4Z" />
                  </svg>
                  <span>Create Event</span>
                </button>
                <div className="ml-auto flex items-center gap-1">
                  <span className="inline-flex items-center rounded-full border border-border bg-surface/60 px-1.5 py-0.5 text-[10px] text-foreground/80">
                    {createdEventsCount}
                  </span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      triggerCreateEvent();
                    }}
                    className="p-1 rounded hover:bg-surface/50"
                    aria-label="Create event"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path d="M4 13.9999L5.57465 20.2985C5.61893 20.4756 5.64107 20.5642 5.66727 20.6415C5.92317 21.397 6.60352 21.9282 7.39852 21.9933C7.4799 21.9999 7.5712 21.9999 7.75379 21.9999C7.98244 21.9999 8.09677 21.9999 8.19308 21.9906C9.145 21.8982 9.89834 21.1449 9.99066 20.193C10 20.0967 10 19.9823 10 19.7537V5.49991M18.5 13.4999C20.433 13.4999 22 11.9329 22 9.99991C22 8.06691 20.433 6.49991 18.5 6.49991M10.25 5.49991H6.5C4.01472 5.49991 2 7.51463 2 9.99991C2 12.4852 4.01472 14.4999 6.5 14.4999H10.25C12.0164 14.4999 14.1772 15.4468 15.8443 16.3556C16.8168 16.8857 17.3031 17.1508 17.6216 17.1118C17.9169 17.0756 18.1402 16.943 18.3133 16.701C18.5 16.4401 18.5 15.9179 18.5 14.8736V5.1262C18.5 4.08191 18.5 3.55976 18.3133 3.2988C18.1402 3.05681 17.9169 2.92421 17.6216 2.88804C17.3031 2.84903 16.8168 3.11411 15.8443 3.64427C14.1772 4.55302 12.0164 5.49991 10.25 5.49991Z" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="mt-1 flex items-center justify-between px-2 py-2 rounded-md hover:bg-surface/70 text-sm">
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
                  className="flex items-center gap-2 pl-0"
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
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span className="flex items-center gap-2">
                    <span>Calendar</span>
                  </span>
                </Link>
                <div className="ml-auto flex items-center">
                  <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] rounded-full border border-border bg-surface/60 text-foreground/80">
                    {history.length}
                  </span>
                  <button
                    type="button"
                    title="New event"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      try {
                        (window as any).__openCreateEvent?.();
                      } catch {}
                    }}
                    className="ml-1 p-1 rounded hover:bg-surface/50"
                    aria-label="New event"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="miter"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <rect x="2" y="4" width="20" height="18" rx="0"></rect>
                      <line x1="7" y1="2" x2="7" y2="6"></line>
                      <line x1="17" y1="2" x2="17" y2="6"></line>
                      <line x1="8" y1="13" x2="16" y2="13"></line>
                      <line x1="12" y1="9" x2="12" y2="17"></line>
                    </svg>
                  </button>
                </div>
              </div>
              {(() => {
                const sharedCount = (() => {
                  try {
                    return history.filter((h) =>
                      Boolean(
                        (h as any)?.data?.shared ||
                          (h as any)?.data?.sharedOut ||
                          (h as any)?.data?.category === "Shared events"
                      )
                    ).length;
                  } catch {
                    return 0;
                  }
                })();
                if (sharedCount === 0) return null;
                return (
                  <div className="">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCategory((prev) =>
                          prev === "Shared events" ? null : "Shared events"
                        );
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-2 py-2 rounded-md text-sm ${
                        activeCategory === "Shared events"
                          ? "sticky top-0 z-10 bg-surface/95 backdrop-blur border-b border-border/50"
                          : ""
                      } hover:bg-surface/70`}
                      aria-pressed={activeCategory === "Shared events"}
                      title="Shared events"
                    >
                      <span className="truncate inline-flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                          aria-hidden="true"
                          aria-label="Shared events"
                        >
                          <title>Shared events</title>
                          <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <span>Shared Events</span>
                      </span>
                      <span className="inline-flex items-center gap-2">
                        {sharedCount > 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] rounded-full border border-border bg-surface/60 text-foreground/80">
                            {sharedCount}
                          </span>
                        )}
                        <span
                          role="button"
                          tabIndex={0}
                          aria-label={`Edit Shared events color`}
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
                                rect.left + rect.width / 2 - menuWidth / 2;
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
                            setColorMenuFor("Shared events");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              (e.currentTarget as HTMLElement).click();
                            }
                          }}
                          className={`inline-flex items-center justify-center h-5 w-5 rounded-[4px] ${sharedGradientSwatchClass()} border-0`}
                          title="Edit color"
                        />
                      </span>
                    </button>
                    {activeCategory === "Shared events" && (
                      <div className="mt-1 mb-2">
                        {(() => {
                          const items = sortHistoryRows(
                            history.filter((h) =>
                              Boolean(
                                (h as any)?.data?.shared ||
                                  (h as any)?.data?.sharedOut ||
                                  (h as any)?.data?.category === "Shared events"
                              )
                            )
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
                                const category = (h as any)?.data?.category as
                                  | string
                                  | null;
                                const isShared = Boolean(
                                  (h as any)?.data?.shared ||
                                    (h as any)?.data?.sharedOut ||
                                    (h as any)?.data?.category ===
                                      "Shared events"
                                );
                                const rowAndBadge = (() => {
                                  if (isShared) {
                                    return {
                                      row: `${sharedGradientRowClass()} ${sharedTextClass}`,
                                      badge: `bg-surface/60 ${sharedMutedTextClass} border-border`,
                                    };
                                  }
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
                                            typeof window !== "undefined" &&
                                            typeof window.matchMedia ===
                                              "function" &&
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
                                      <div
                                        className={`text-xs ${
                                          isShared
                                            ? sharedMutedTextClass
                                            : "text-foreground/60"
                                        }`}
                                      >
                                        {(() => {
                                          const start =
                                            (h as any)?.data?.start ||
                                            (h as any)?.data?.event?.start;
                                          const dateStr = start || h.created_at;
                                          return dateStr
                                            ? new Date(
                                                dateStr
                                              ).toLocaleDateString()
                                            : "";
                                        })()}
                                      </div>
                                    </Link>
                                    {Boolean(
                                      (h as any)?.data &&
                                        (((h as any).data.shared as any) ||
                                          ((h as any).data.sharedOut as any))
                                    ) && (
                                      <svg
                                        viewBox="0 0 25.274 25.274"
                                        fill="currentColor"
                                        className="h-3.5 w-3.5 text-zinc-900 dark:text-foreground absolute right-2 bottom-2"
                                        aria-hidden="true"
                                        aria-label="Shared event"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <title>Shared event</title>
                                        <path d="M24.989,15.893c-0.731-0.943-3.229-3.73-4.34-4.96c0.603-0.77,0.967-1.733,0.967-2.787c0-2.503-2.03-4.534-4.533-4.534 c-2.507,0-4.534,2.031-4.534,4.534c0,1.175,0.455,2.24,1.183,3.045l-1.384,1.748c-0.687-0.772-1.354-1.513-1.792-2.006 c0.601-0.77,0.966-1.733,0.966-2.787c-0.001-2.504-2.03-4.535-4.536-4.535c-2.507,0-4.536,2.031-4.536,4.534 c0,1.175,0.454,2.24,1.188,3.045L0.18,15.553c0,0-0.406,1.084,0,1.424c0.36,0.3,0.887,0.81,1.878,0.258 c-0.107,0.974-0.054,2.214,0.693,2.924c0,0,0.749,1.213,2.65,1.456c0,0,2.1,0.244,4.543-0.367c0,0,1.691-0.312,2.431-1.794 c0.113,0.263,0.266,0.505,0.474,0.705c0,0,0.751,1.213,2.649,1.456c0,0,2.103,0.244,4.54-0.367c0,0,2.102-0.38,2.65-2.339 c0.297-0.004,0.663-0.097,1.149-0.374C24.244,18.198,25.937,17.111,24.989,15.893z M13.671,8.145c0-1.883,1.527-3.409,3.409-3.409 c1.884,0,3.414,1.526,3.414,3.409c0,1.884-1.53,3.411-3.414,3.411C15.198,11.556,13.671,10.029,13.671,8.145z M13.376,12.348 l0.216,0.516c0,0-0.155,0.466-0.363,1.069c-0.194-0.217-0.388-0.437-0.585-0.661L13.376,12.348z M3.576,8.145 c0-1.883,1.525-3.409,3.41-3.409c1.881,0,3.408,1.526,3.408,3.409c0,1.884-1.527,3.411-3.408,3.411 C5.102,11.556,3.576,10.029,3.576,8.145z M2.186,16.398c-0.033,0.07-0.065,0.133-0.091,0.177c-0.801,0.605-1.188,0.216-1.449,0 c-0.259-0.216,0-0.906,0-0.906l2.636-3.321l0.212,0.516c0,0-0.227,0.682-0.503,1.47l-0.665,1.49 C2.325,15.824,2.257,16.049,2.186,16.398z M9.299,20.361c-2.022,0.507-3.758,0.304-3.758,0.304 c-1.574-0.201-2.196-1.204-2.196-1.204c-1.121-1.066-0.348-3.585-0.348-3.585l1.699-3.823c0.671,0.396,1.451,0.627,2.29,0.627 c0.584,0,1.141-0.114,1.656-0.316l2.954,5.417C11.482,19.968,9.299,20.361,9.299,20.361z M9.792,12.758l0.885-0.66 c0,0,2.562,2.827,3.181,3.623c0.617,0.794-0.49,1.501-0.75,1.723c-0.259,0.147-0.464,0.206-0.635,0.226L9.792,12.758z M19.394,20.361c-2.018,0.507-3.758,0.304-3.758,0.304c-1.569-0.201-2.191-1.204-2.191-1.204c-0.182-0.175-0.311-0.389-0.403-0.624 c0.201-0.055,0.433-0.15,0.698-0.301c0.405-0.337,2.102-1.424,1.154-2.643c-0.24-0.308-0.678-0.821-1.184-1.405l1.08-2.435 c0.674,0.396,1.457,0.627,2.293,0.627c0.585,0,1.144-0.114,1.654-0.316l2.955,5.417C21.582,19.968,19.394,20.361,19.394,20.361z M23.201,17.444c-0.255,0.147-0.461,0.206-0.63,0.226l-2.68-4.912l0.879-0.66c0,0,2.562,2.827,3.181,3.623 C24.57,16.516,23.466,17.223,23.201,17.444z"></path>
                                      </svg>
                                    )}
                                    <button
                                      type="button"
                                      aria-label="Item options"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const target =
                                          e.currentTarget as HTMLElement | null;
                                        if (itemMenuId === h.id) {
                                          setItemMenuId(null);
                                          setItemMenuOpensUpward(false);
                                          setItemMenuPos(null);
                                          setItemMenuCategoryOpenFor(null);
                                          return;
                                        }
                                        if (target) {
                                          const rect =
                                            target.getBoundingClientRect();
                                          const viewportHeight =
                                            window.innerHeight;
                                          const menuHeight = 200;
                                          const spaceBelow =
                                            viewportHeight - rect.top;
                                          const shouldOpenUpward =
                                            spaceBelow < menuHeight + 50;
                                          setItemMenuOpensUpward(
                                            shouldOpenUpward
                                          );
                                          setItemMenuPos({
                                            left: Math.round(rect.right + 8),
                                            top: shouldOpenUpward
                                              ? Math.round(rect.top - 10)
                                              : Math.round(
                                                  rect.top + rect.height / 2
                                                ),
                                          });
                                        }
                                        setItemMenuCategoryOpenFor(null);
                                        setItemMenuId(h.id);
                                      }}
                                      className="absolute top-2 right-2 inline-flex items-center justify-center h-6 w-6 rounded hover:bg-surface/70"
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
                                            transform: itemMenuOpensUpward
                                              ? "translateY(-100%)"
                                              : "translateY(-10%)",
                                          }}
                                          className="z-[10000] w-44 rounded-lg border border-border bg-surface/95 text-foreground backdrop-blur shadow-lg p-2"
                                        >
                                          <button
                                            type="button"
                                            onClick={async (e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              setItemMenuId(null);
                                              setItemMenuOpensUpward(false);
                                              setItemMenuPos(null);
                                              await shareHistoryItem(
                                                prettyHref
                                              );
                                            }}
                                            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-foreground hover:bg-foreground/10"
                                          >
                                            <svg
                                              viewBox="0 0 25.274 25.274"
                                              fill="currentColor"
                                              className="h-4 w-4"
                                              aria-hidden="true"
                                              xmlns="http://www.w3.org/2000/svg"
                                            >
                                              <path d="M24.989,15.893c-0.731-0.943-3.229-3.73-4.34-4.96c0.603-0.77,0.967-1.733,0.967-2.787c0-2.503-2.03-4.534-4.533-4.534 c-2.507,0-4.534,2.031-4.534,4.534c0,1.175,0.455,2.24,1.183,3.045l-1.384,1.748c-0.687-0.772-1.354-1.513-1.792-2.006 c0.601-0.77,0.966-1.733,0.966-2.787c-0.001-2.504-2.03-4.535-4.536-4.535c-2.507,0-4.536,2.031-4.536,4.534 c0,1.175,0.454,2.24,1.188,3.045L0.18,15.553c0,0-0.406,1.084,0,1.424c0.36,0.3,0.887,0.81,1.878,0.258 c-0.107,0.974-0.054,2.214,0.693,2.924c0,0,0.749,1.213,2.65,1.456c0,0,2.1,0.244,4.543-0.367c0,0,1.691-0.312,2.431-1.794 c0.113,0.263,0.266,0.505,0.474,0.705c0,0,0.751,1.213,2.649,1.456c0,0,2.103,0.244,4.54-0.367c0,0,2.102-0.38,2.65-2.339 c0.297-0.004,0.663-0.097,1.149-0.374C24.244,18.198,25.937,17.111,24.989,15.893z M13.671,8.145c0-1.883,1.527-3.409,3.409-3.409 c1.884,0,3.414,1.526,3.414,3.409c0,1.884-1.53,3.411-3.414,3.411C15.198,11.556,13.671,10.029,13.671,8.145z M13.376,12.348 l0.216,0.516c0,0-0.155,0.466-0.363,1.069c-0.194-0.217-0.388-0.437-0.585-0.661L13.376,12.348z M3.576,8.145 c0-1.883,1.525-3.409,3.41-3.409c1.881,0,3.408,1.526,3.408,3.409c0,1.884-1.527,3.411-3.408,3.411 C5.102,11.556,3.576,10.029,3.576,8.145z M2.186,16.398c-0.033,0.07-0.065,0.133-0.091,0.177c-0.801,0.605-1.188,0.216-1.449,0 c-0.259-0.216,0-0.906,0-0.906l2.636-3.321l0.212,0.516c0,0-0.227,0.682-0.503,1.47l-0.665,1.49 C2.325,15.824,2.257,16.049,2.186,16.398z M9.299,20.361c-2.022,0.507-3.758,0.304-3.758,0.304 c-1.574-0.201-2.196-1.204-2.196-1.204c-1.121-1.066-0.348-3.585-0.348-3.585l1.699-3.823c0.671,0.396,1.451,0.627,2.29,0.627 c0.584,0,1.141-0.114,1.656-0.316l2.954,5.417C11.482,19.968,9.299,20.361,9.299,20.361z M9.792,12.758l0.885-0.66 c0,0,2.562,2.827,3.181,3.623c0.617,0.794-0.49,1.501-0.75,1.723c-0.259,0.147-0.464,0.206-0.635,0.226L9.792,12.758z M19.394,20.361c-2.018,0.507-3.758,0.304-3.758,0.304c-1.569-0.201-2.191-1.204-2.191-1.204c-0.182-0.175-0.311-0.389-0.403-0.624 c0.201-0.055,0.433-0.15,0.698-0.301c0.405-0.337,2.102-1.424,1.154-2.643c-0.24-0.308-0.678-0.821-1.184-1.405l1.08-2.435 c0.674,0.396,1.457,0.627,2.293,0.627c0.585,0,1.144-0.114,1.654-0.316l2.955,5.417C21.582,19.968,19.394,20.361,19.394,20.361z M23.201,17.444c-0.255,0.147-0.461,0.206-0.63,0.226l-2.68-4.912l0.879-0.66c0,0,2.562,2.827,3.181,3.623 C24.57,16.516,23.466,17.223,23.201,17.444z"></path>
                                            </svg>
                                            <span className="text-sm">
                                              Share
                                            </span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={async (e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              setItemMenuId(null);
                                              setItemMenuOpensUpward(false);
                                              setItemMenuPos(null);
                                              await renameHistoryItem(
                                                h.id,
                                                h.title
                                              );
                                            }}
                                            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-foreground hover:bg-foreground/10"
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
                                              <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
                                            </svg>
                                            <span className="text-sm">
                                              Rename
                                            </span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={async (e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              setItemMenuId(null);
                                              setItemMenuOpensUpward(false);
                                              setItemMenuPos(null);
                                              await deleteHistoryItem(h.id);
                                            }}
                                            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-foreground hover:bg-foreground/10"
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
                                              <polyline points="3 6 5 6 21 6" />
                                              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                                              <path d="M10 11v6" />
                                              <path d="M14 11v6" />
                                              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                                            </svg>
                                            <span className="text-sm">
                                              Delete
                                            </span>
                                          </button>
                                        </div>,
                                        document.body
                                      )}
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
              })()}
              {(() => {
                const categories = Array.from(
                  new Set(
                    history
                      .map((h) => (h as any)?.data?.category as string | null)
                      .filter((c): c is string => Boolean(c))
                  )
                ).filter((c) => c.trim().toLowerCase() !== "shared events"); // Shared events section renders above with gradient treatment
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
                      // Gather items under this category once to reuse below
                      const categoryItems = (() => {
                        try {
                          return history.filter(
                            (h) => (h as any)?.data?.category === c
                          );
                        } catch {
                          return [] as typeof history;
                        }
                      })();
                      const totalCount = categoryItems.length;
                      const categoryAdIndex =
                        categoryAdPositions.get(c) ?? null;
                      return (
                        <div key={c} className="">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveCategory((prev) =>
                                prev === c ? null : c
                              );
                            }}
                            className={`w-full flex items-center justify-between gap-2 px-2 py-2 rounded-md text-sm ${
                              activeCategory === c
                                ? "sticky top-0 z-10 bg-surface/95 backdrop-blur border-b border-border/50"
                                : ""
                            } ${buttonClass(c)}`}
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
                              ) : c === "Baby Showers" ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 512.93 512.93"
                                  fill="currentColor"
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                >
                                  <g transform="translate(1 1)">
                                    <g>
                                      <g>
                                        <path d="M485.865,101.4H317.332l-45.043-38.608c10.313-5.89,17.31-16.993,17.31-29.659C289.599,14.36,274.239-1,255.465-1c-18.773,0-34.133,15.36-34.133,34.133c0,12.018,6.301,22.63,15.756,28.716L184.354,101.4H25.065c-14.507,0-25.6,11.093-25.6,25.6v17.067c0,14.507,11.093,25.6,25.6,25.6h59.733v17.067c0,5.12,3.413,8.533,8.533,8.533c5.12,0,8.533-3.413,8.533-8.533v-17.067h145.067v17.067c0,5.12,3.413,8.533,8.533,8.533s8.533-3.413,8.533-8.533v-17.067h145.067v17.067c0,5.12,3.413,8.533,8.533,8.533s8.533-3.413,8.533-8.533v-17.067h59.733c14.507,0,25.6-11.093,25.6-25.6V127C511.465,112.493,500.372,101.4,485.865,101.4z M291.305,101.4h-27.307V77.994L291.305,101.4z M255.465,16.067c9.387,0,17.067,7.68,17.067,17.067c0,9.387-7.68,17.067-17.067,17.067s-17.067-7.68-17.067-17.067C238.398,23.747,246.078,16.067,255.465,16.067z M246.932,75.8v25.6h-34.133L246.932,75.8z M494.398,144.067c0,5.12-3.413,8.533-8.533,8.533h-460.8c-5.12,0-8.533-3.413-8.533-8.533V127c0-5.12,3.413-8.533,8.533-8.533h460.8c5.12,0,8.533,3.413,8.533,8.533V144.067z" />
                                        <path d="M470.505,431.64l-31.573-1.707l-12.8-23.893v-5.973c0-5.12-3.413-8.533-8.533-8.533s-8.533,3.413-8.533,8.533v8.533c0,0.198,0.014,0.388,0.024,0.58l-11.118,20.753l-31.573,1.707c-3.413,0-6.827,2.56-7.68,5.12s-0.853,5.973,1.707,8.533l22.187,24.747l-6.827,30.72c-0.853,3.413,0,6.827,2.56,8.533c0.853,0.853,3.413,1.707,5.12,1.707c0.853,0,2.56,0,3.413-0.853l30.72-13.653L450.025,511c2.56,1.707,5.973,0.853,8.533-0.853c1.707-1.707,3.413-5.12,2.56-8.533l-6.827-31.573l22.187-24.747c2.56-1.707,2.56-5.12,1.707-8.533C476.479,434.2,473.919,431.64,470.505,431.64z M435.519,469.187l4.267,18.773l-18.773-8.533c-0.853-0.853-2.56-0.853-3.413-0.853s-2.56,0-4.267,0.853l-18.773,8.533l4.267-18.773c0.853-2.56,0-5.973-1.707-7.68L384.318,447l18.773-0.853c2.56,0,5.12-1.707,6.827-4.267l7.68-14.507l6.827,14.507c0.853,2.56,3.413,4.267,6.827,4.267L450.025,447l-12.8,14.507C435.519,464.067,434.665,466.627,435.519,469.187z" />
                                        <path d="M93.332,255c5.12,0,8.533-3.413,8.533-8.533v-25.6c0-5.12-3.413-8.533-8.533-8.533c-5.12,0-8.533,3.413-8.533,8.533v25.6C84.798,251.587,88.212,255,93.332,255z" />
                                        <path d="M84.798,365.933c0,5.12,3.413,8.533,8.533,8.533c5.12,0,8.533-3.413,8.533-8.533v-25.6c0-5.12-3.413-8.533-8.533-8.533c-5.12,0-8.533,3.413-8.533,8.533V365.933z" />
                                        <path d="M84.798,306.2c0,5.12,3.413,8.533,8.533,8.533c5.12,0,8.533-3.413,8.533-8.533v-25.6c0-5.12-3.413-8.533-8.533-8.533c-5.12,0-8.533,3.413-8.533,8.533V306.2z" />
                                        <path d="M417.599,255c5.12,0,8.533-3.413,8.533-8.533v-25.6c0-5.12-3.413-8.533-8.533-8.533s-8.533,3.413-8.533,8.533v25.6C409.065,251.587,412.479,255,417.599,255z" />
                                        <path d="M409.065,306.2c0,5.12,3.413,8.533,8.533,8.533s8.533-3.413,8.533-8.533v-25.6c0-5.12-3.413-8.533-8.533-8.533s-8.533,3.413-8.533,8.533V306.2z" />
                                        <path d="M409.065,365.933c0,5.12,3.413,8.533,8.533,8.533s8.533-3.413,8.533-8.533v-25.6c0-5.12-3.413-8.533-8.533-8.533s-8.533,3.413-8.533,8.533V365.933z" />
                                        <path d="M101.865,409.33v-9.263c0-5.12-3.413-8.533-8.533-8.533c-5.12,0-8.533,3.413-8.533,8.533v9.263c-24.134,4.095-42.667,25.217-42.667,50.47c0,28.16,23.04,51.2,51.2,51.2c28.16,0,51.2-23.04,51.2-51.2C144.532,434.547,125.999,413.425,101.865,409.33z M93.332,493.933c-18.773,0-34.133-15.36-34.133-34.133c0-18.773,15.36-34.133,34.133-34.133c18.773,0,34.133,15.36,34.133,34.133C127.465,478.573,112.105,493.933,93.332,493.933z" />
                                        <path d="M246.932,340.333c0,5.12,3.413,8.533,8.533,8.533s8.533-3.413,8.533-8.533v-25.6c0-5.12-3.413-8.533-8.533-8.533s-8.533,3.413-8.533,8.533V340.333z" />
                                        <path d="M255.465,246.467c5.12,0,8.533-3.413,8.533-8.533v-25.6c0-5.12-3.413-8.533-8.533-8.533s-8.533,3.413-8.533,8.533v25.6C246.932,243.053,250.345,246.467,255.465,246.467z" />
                                        <path d="M246.932,289.133c0,5.12,3.413,8.533,8.533,8.533s8.533-3.413,8.533-8.533v-25.6c0-5.12-3.413-8.533-8.533-8.533s-8.533,3.413-8.533,8.533V289.133z" />
                                        <path d="M298.132,481.987c-16.213-11.093-25.6-29.867-25.6-48.64c0-18.773,9.387-37.547,25.6-48.64c2.56-1.707,3.413-4.267,3.413-7.68s-2.56-5.973-5.12-6.827c-7.68-2.56-16.213-4.267-23.893-4.267c-2.891,0-5.735,0.203-8.533,0.556v-0.556c0-5.12-3.413-8.533-8.533-8.533s-8.533,3.413-8.533,8.533v5.027c-24.955,10.182-42.667,34.736-42.667,63.239c0,37.547,30.72,68.267,68.267,68.267c7.68,0,16.213-1.707,23.893-5.973c2.56-0.853,5.12-3.413,5.12-6.827C302.398,487.107,300.692,483.693,298.132,481.987z M272.532,485.4c-28.16,0-51.2-23.04-51.2-51.2c0-22.78,15.08-42.204,35.749-48.796c0.57-0.107,1.112-0.269,1.624-0.479c4.404-1.244,9.039-1.925,13.827-1.925c0.853,0,1.707,0,2.56,0c-12.8,13.653-19.627,32.427-19.627,51.2c0,18.773,6.827,37.547,19.627,51.2C274.239,485.4,273.385,485.4,272.532,485.4z" />
                                      </g>
                                    </g>
                                  </g>
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
                              ) : c === "Car Pool" ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 256 158"
                                  fill="currentColor"
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                >
                                  <path d="M54.4,155.7c-14.7,0-26.6-11.9-26.6-26.6s11.9-26.6,26.6-26.6S81,114.5,81,129.2S69.1,155.7,54.4,155.7z M54.4,120.3 c-4.9,0-8.9,4-8.9,8.9s4,8.9,8.9,8.9s8.9-4,8.9-8.9S59.3,120.3,54.4,120.3z M186.2,155.7c-14.7,0-26.6-11.9-26.6-26.6 s11.9-26.6,26.6-26.6s26.6,11.9,26.6,26.6S200.8,155.7,186.2,155.7z M186.2,120.3c-4.9,0-8.9,4-8.9,8.9s4,8.9,8.9,8.9s8.9-4,8.9-8.9 S191,120.3,186.2,120.3z M233.3,61.3H207l-47-47.9c-6.9-7-16.5-11.1-26.3-11.1H39.6c-7.9,0-15,4.7-18,12L2,61.3l0,62.9h16.3 c2.4-17.8,17.7-31.4,36.1-31.4s33.6,13.7,36.1,31.4h59.6c2.4-17.8,17.7-31.4,36.1-31.4s33.6,13.7,36.1,31.4H254V81.9 C254,70.5,244.7,61.3,233.3,61.3z M18,61.3l17.2-41.3c0.7-1.8,2.5-2.9,4.4-2.9h50.9v44.2H18z M105.3,61.3V17h28.5 c5.9,0,11.6,2.4,15.7,6.6l36.8,37.6H105.3z M129.5,30.2c7.5,0,13.6,6.1,13.6,13.6s-6.1,13.6-13.6,13.6s-13.6-6.1-13.6-13.6 S122,30.2,129.5,30.2z M58,30.2c7.5,0,13.6,6.1,13.6,13.6S65.4,57.4,58,57.4s-13.6-6.1-13.6-13.6S50.5,30.2,58,30.2z" />
                                </svg>
                              ) : (
                                (() => {
                                  const lower = c.toLowerCase();

                                  // Sports - Soccer/Football
                                  if (
                                    lower.includes("soccer") ||
                                    lower.includes("football") ||
                                    lower.includes("futbol")
                                  ) {
                                    return (
                                      <svg
                                        viewBox="0 0 64 64"
                                        fill="currentColor"
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                      >
                                        <path d="M61.934 31.992c.021-.713.209-10.904-5.822-17.538c-.268-.593-1.539-2.983-5.641-5.904a41.959 41.959 0 0 0-5.775-3.763l-.008-.004C44.432 4.646 39.43 2 33.359 2c-.461 0-.917.027-1.368.058V2.05c-4.629-.101-9.227 1.09-11.998 2.341c-2.458 1.11-5.187 2.971-5.384 3.115C11.205 9.41 4.75 17.051 4.239 21.1c-2.063 2.637-3.787 14.482.004 21.697c2.658 10.027 12.664 15.045 13.46 15.43c.484.309 5.937 3.68 12.636 3.68c.281 0 1.98.094 2.586.094c7.241 0 17.971-5.104 20.217-9.102c6.171-4.514 9.37-16.147 8.792-20.907M17.758 47.055c-2.869-4.641-4.504-10.705-4.854-12.098c.908-1.361 5.387-7.965 7.939-9.952c1.445.266 7.479 1.374 13.17 2.404c.715 1.853 3.852 10.029 4.75 13.185c-.99 1.174-4.879 5.702-8.708 9.248c-4.065.019-10.979-2.326-12.297-2.787M53.824 14.58c-.012.45-.119 2.05-.885 3.887c-1.521-.777-5.344-2.441-10.584-2.722c-.793-1.171-3.777-5.254-8.49-8.086c.645-1.262 1.543-2.801 2.068-3.27c.17-.048.434-.092.836-.092c2.527 0 6.893 1.655 7.273 1.802c.403.213 8.251 4.439 9.782 8.481M11.773 34.012c-3.423-.584-5.458-1.648-6.066-2.008c-1.273-4.617-.248-9.607-.09-10.322c1.256-2.246 4.832-7.971 7.191-9.058c2.445-.499 5.494.121 6.736.424c-.117 1.615-.342 6.127.326 10.862c-2.706 2.178-6.989 8.447-8.097 10.102M31.685 3.53c.768.057 1.895.225 2.667.454c-.77 1.024-1.559 2.542-1.932 3.292c-1.57.257-7.533 1.397-12.211 4.43c-.943-.25-3.791-.917-6.488-.687c.668-1.293 1.666-2.249 1.773-2.347c.371-.266 7.513-5.263 16.191-5.155v.013m19.096 38.093c-1.17-.048-5.678-.305-10.621-1.466c-.947-3.302-4.074-11.444-4.789-13.296a556.586 556.586 0 0 1 6.928-9.654c5.688.312 9.682 2.387 10.455 2.82c3.295 5.299 4.018 10.711 4.117 11.615c-1.75 5.446-5.211 9.113-6.09 9.981M3.655 28.519c.084 1.266.287 2.599.654 3.917a11.738 11.738 0 0 0-.682 2.651a33.039 33.039 0 0 1 .028-6.568m9.644 23.359c1.508-1.453 3.367-2.867 4.088-3.401c1.63.574 8.324 2.837 12.591 2.837c.727.975 3.104 4.028 6.018 6.362c-1.814 1.775-4.434 2.613-4.897 2.752c-8.127.218-16.042-4.35-17.8-8.55m21.463 8.538c.922-.537 1.883-1.244 2.678-2.139c1.297-.179 6.863-1.137 11.893-4.832c.332.036.879.08 1.49.063c-3.018 2.957-10.382 6.26-16.061 6.908m15.424-8.376c1.807-4.708 1.73-8.258 1.641-9.392c.992-.972 4.396-4.599 6.285-10.113c1.018.17 1.68.429 1.994.574c.109.4.291 1.324.188 2.725c-.77 5.043-3.428 12.6-8.084 15.941c-.468.239-1.292.291-2.024.265" />
                                      </svg>
                                    );
                                  }

                                  // Sports - Basketball
                                  if (
                                    lower.includes("basketball") ||
                                    lower.includes("bball")
                                  ) {
                                    return (
                                      <svg
                                        viewBox="0 0 64 64"
                                        fill="currentColor"
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                      >
                                        <path d="M54.627,9.373c-12.496-12.495-32.758-12.495-45.254,0c-12.497,12.496-12.497,32.758,0,45.255 c12.496,12.496,32.758,12.496,45.254,0C67.124,42.131,67.124,21.869,54.627,9.373z M53.213,10.787 c4.428,4.428,7.179,9.895,8.261,15.615c-9.549-0.729-19.344,2.539-26.646,9.84c-1.283,1.283-2.437,2.646-3.471,4.066 c-2.487-1.862-4.873-3.926-7.136-6.188c-0.568-0.568-1.106-1.156-1.648-1.74c1.785-2.346,3.748-4.602,5.892-6.744 c7.077-7.078,15.369-12.184,24.198-15.373C52.847,10.438,53.033,10.606,53.213,10.787z M50.973,8.76 c-8.719,3.308-16.901,8.44-23.922,15.462c-2.117,2.117-4.065,4.34-5.845,6.65c-2.224-2.542-4.227-5.21-5.993-7.985 c4.333-5.684,6.633-12.416,6.904-19.218C31.742,0.319,42.732,2.016,50.973,8.76z M10.787,10.787 c2.755-2.756,5.915-4.854,9.285-6.312c-0.395,5.848-2.387,11.605-5.978,16.566c-1.728-2.922-3.208-5.945-4.448-9.047 C10.014,11.585,10.393,11.182,10.787,10.787z M8.193,13.755c1.291,3.084,2.818,6.087,4.582,8.989 c-0.625,0.75-1.285,1.481-1.988,2.185c-2.626,2.626-5.599,4.687-8.766,6.208C2.196,24.985,4.254,18.882,8.193,13.755z M2.031,33.34 c3.688-1.646,7.145-3.972,10.17-6.996c0.588-0.589,1.142-1.199,1.678-1.819c1.809,2.778,3.848,5.447,6.104,7.993 c-4.463,6.175-7.752,12.933-9.889,19.967C5.03,47.076,2.34,40.253,2.031,33.34z M11.712,54.093 c2.021-7.069,5.231-13.87,9.654-20.074c0.479,0.507,0.945,1.021,1.441,1.517c2.351,2.352,4.832,4.487,7.419,6.422 c-3.73,5.818-5.498,12.526-5.329,19.193C20.114,59.99,15.563,57.635,11.712,54.093z M53.213,53.213 c-7.156,7.157-17.028,9.934-26.299,8.347c-0.253-6.388,1.382-12.835,4.933-18.423c6.625,4.654,13.896,7.979,21.445,9.994 C53.265,53.157,53.24,53.187,53.213,53.213z M32.979,41.482c0.974-1.337,2.057-2.619,3.263-3.826 c6.99-6.989,16.407-10.049,25.538-9.219c0.961,8.076-1.356,16.463-6.953,23.016C47.13,49.531,39.712,46.213,32.979,41.482z" />
                                      </svg>
                                    );
                                  }

                                  // Sports - Baseball
                                  if (lower.includes("baseball")) {
                                    return (
                                      <svg
                                        viewBox="0 0 1024 1024"
                                        fill="currentColor"
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                      >
                                        <path d="M195.2 828.8a448 448 0 1 1 633.6-633.6 448 448 0 0 1-633.6 633.6zm45.248-45.248a384 384 0 1 0 543.104-543.104 384 384 0 0 0-543.104 543.104z" />
                                        <path d="M497.472 96.896c22.784 4.672 44.416 9.472 64.896 14.528a256.128 256.128 0 0 0 350.208 350.208c5.056 20.48 9.856 42.112 14.528 64.896A320.128 320.128 0 0 1 497.472 96.896zM108.48 491.904a320.128 320.128 0 0 1 423.616 423.68c-23.04-3.648-44.992-7.424-65.728-11.52a256.128 256.128 0 0 0-346.496-346.432 1736.64 1736.64 0 0 1-11.392-65.728z" />
                                      </svg>
                                    );
                                  }

                                  // Sports - Tennis
                                  if (lower.includes("tennis")) {
                                    return (
                                      <svg
                                        viewBox="0 0 512 512"
                                        fill="currentColor"
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                      >
                                        <path d="M327.634,230.704c0.812-5.301,1.243-10.734,1.288-16.284l-12.602-12.604l10.617-10.617 c-0.836-4.783-1.916-9.56-3.265-14.316l-16.138,16.146l-32.917-32.919l28.191-28.184c-2.295-3.486-4.735-6.91-7.296-10.278 l-29.685,29.675l-35.025-35.024l30.19-30.186c-3.252-2.679-6.534-5.274-9.86-7.718l-29.117,29.116l-33.616-33.617l19.524-19.521 c-4.397-1.712-8.78-3.175-13.146-4.431L179.61,65.106l-20.329-20.329c-5.529,0.042-10.948,0.49-16.228,1.346l27.767,27.77 l-36.916,36.916L93.405,70.318c-1.37,1.243-2.733,2.512-4.076,3.852c-1.629,1.636-3.18,3.3-4.67,4.977l40.457,40.457L88.2,156.52 l-27.121-27.128c-0.797,5.364-1.212,10.83-1.153,16.429l19.483,19.48l-14.33,14.33c1.256,4.377,2.734,8.767,4.431,13.15 l18.69-18.686l33.613,33.617L93.56,235.957c2.45,3.341,5.004,6.64,7.69,9.892l29.354-29.351l35.025,35.025l-28.847,28.847 c3.376,2.561,6.802,4.997,10.289,7.289l27.346-27.348l32.916,32.912l-15.303,15.304c4.78,1.36,9.553,2.451,14.295,3.286 l9.795-9.795l11.769,11.769c5.598,0.028,11.103-0.338,16.494-1.09l-19.473-19.473l36.917-36.916l33.665,33.671 c1.718-1.484,3.403-3.009,5.022-4.624c1.325-1.332,2.606-2.692,3.845-4.087l-33.745-33.74l36.92-36.923L327.634,230.704z M257.039,160.109l-36.916,36.923l-35.028-35.031l36.919-36.91L257.039,160.109z M179.61,82.688l33.614,33.61l-36.917,36.916 l-33.616-33.61L179.61,82.688z M96.988,165.3l36.916-36.917l33.617,33.617l-36.916,36.916L96.988,165.3z M139.391,207.704 l36.916-36.91l35.025,35.025l-36.913,36.916L139.391,207.704z M216.123,284.442l-32.916-32.919l36.916-36.916l32.916,32.919 L216.123,284.442z M261.827,238.732L228.91,205.82l36.917-36.916l32.916,32.913L261.827,238.732z" />
                                        <path d="M490.999,433.985c-1.981-1.982-10.458-10.271-20.236-19.846c-13.619-13.33-22.348-21.73-27.369-26.748 c-0.949-0.953-1.888-1.905-2.81-2.858c-16.898-17.402-31.946-40.602-43.491-67.081c-12.701-29.089-20.691-60.607-23.746-93.692 l-0.014-0.187l0.01-0.193c1.201-19.494-1.073-39.415-6.751-59.206c-9.829-34.238-29.557-66.868-57.048-94.361 c-18.696-18.7-39.09-34.065-60.614-45.69c-16.2-8.739-32.815-15.206-49.39-19.231c-26.034-6.31-51.277-6.516-75.044-0.622 C99.7,10.394,76.635,23.585,57.8,42.416l-0.193,0.194c-17.009,17.008-29.095,36.75-35.932,58.68 c-4.905,15.684-7.052,32.332-6.388,49.493c0.962,24.781,7.637,49.99,19.842,74.93c11.98,24.484,28.75,47.595,49.832,68.682 c36.595,36.585,81.956,59.095,127.74,63.396c8.728,0.814,17.619,0.939,26.424,0.359h0.283c34.507,1.67,66.574,9.236,95.32,22.524 c23.836,11.024,45.69,26.085,64.952,44.764c0.959,0.932,1.919,1.878,2.875,2.837c5.022,5.018,13.423,13.744,26.755,27.363 c9.564,9.782,17.862,18.258,19.846,20.239c3.932,3.934,14.51,11.645,27.76-1.609l10.744-10.74l-0.024-0.02l1.76-1.761 C502.648,448.494,494.934,437.919,490.999,433.985z M188.239,320.378c-28.985-8.311-56.792-25.195-80.424-48.837 c-16.481-16.47-29.969-34.341-40.102-53.117c-7.423-13.75-12.894-27.763-16.256-41.644c-5.07-20.923-5.294-40.996-0.67-59.654 c4.843-19.39,14.855-36.798,29.748-51.729l0.004-0.007c13.305-13.281,28.63-22.71,45.545-28.019 c12.145-3.789,25.132-5.452,38.6-4.935c20.243,0.774,41.092,6.35,61.974,16.567c21.274,10.409,41.472,25.092,60.037,43.667 c31.304,31.29,50.504,69.608,54.066,107.891c1.691,18.085-0.146,35.348-5.45,51.322c-5.381,16.146-14.134,30.372-26.017,42.266 c-11.894,11.88-26.113,20.626-42.27,26.017C242.926,328.178,215.684,328.254,188.239,320.378z M383.501,371.038 c-11.224-7.455-23.072-14.088-35.211-19.701c-11.272-5.218-23.183-9.726-35.397-13.398l-4.98-1.498l4.297-2.94 c7.189-4.908,13.888-10.451,19.963-16.526c6.606-6.606,12.65-14.074,17.964-22.199l2.909-4.439l1.554,5.081 c3.672,12.052,8.007,23.814,12.874,34.963c5.743,13.136,12.311,25.678,19.518,37.275L383.501,371.038z" />
                                        <path d="M107.445,387.598c-34.355,0.007-62.194,27.839-62.201,62.201c0.007,34.356,27.842,62.194,62.201,62.201 c34.359-0.007,62.195-27.846,62.201-62.201C169.639,415.437,141.8,387.605,107.445,387.598z M133.434,475.788 c-6.692,6.675-15.801,10.761-25.99,10.768c-10.188-0.007-19.296-4.093-25.988-10.768c-6.672-6.696-10.762-15.801-10.769-25.99 c0.007-10.188,4.097-19.3,10.769-25.996c6.692-6.668,15.8-10.755,25.988-10.762c10.189,0.007,19.297,4.093,25.99,10.762 c6.671,6.695,10.762,15.807,10.768,25.996C144.196,459.988,140.105,469.092,133.434,475.788z" />
                                      </svg>
                                    );
                                  }

                                  // Sports - Golf
                                  if (lower.includes("golf")) {
                                    return (
                                      <svg
                                        viewBox="0 0 512 512"
                                        fill="currentColor"
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                      >
                                        <path d="M275.076,93.952c2.991-24.117-14.126-46.108-38.252-49.108c-24.126-3-46.107,14.117-49.107,38.252 c-3,24.126,14.126,46.108,38.256,49.107C250.085,135.195,272.076,118.078,275.076,93.952z" />
                                        <path d="M384.588,229.743c-20.572-32.927-36.882-70.296-41.076-77.557c-2.487-4.316-2.73-7.361-0.78-11.622 c8.4-12.144,16.991-24.197,25.685-36.125c7.54-10.352,18.319-21.802,14.202-35.9c-2.364-8.108-9.541-11.486-15.604-16.424 c-15.23-12.441-30.414-24.982-45.742-37.333c-4.292-3.45-8.436-7.08-12.783-10.45c-7.068-6.288-17.897-5.658-24.18,1.424 c-5.297,5.964-5.617,14.576-1.361,20.9L266.932,43.34c3.928,3.1,7.446,6.658,10.436,10.648l15.987-16.648l40.324,39.126 l-31.878,33.954c-17.613,17.252-59.472,42.072-49.891,77.035c7.302,26.648,32.418,72.404,32.418,85.323 c0,17.892-9.81,108.287-9.81,108.287c-0.064,0.352-0.081,0.703-0.126,1.063l-28.396,98.143c-3.225,10.612,2.775,21.838,13.4,25.054 c10.617,3.225,21.842-2.766,25.063-13.396l34.162-90.873c0.473-1.054,0.892-2.153,1.225-3.297l0.37-0.982 c0.518-1.721,18.468-86.8,18.468-86.8l0.798-7.91l-8.586,85.324c-0.248,1.504-0.41,3.027-0.41,4.613l4.207,97.665 c0,12.333,9.991,22.333,22.324,22.333c12.33,0,22.333-10,22.333-22.333l5.77-94.134l13.792-86.927 C401.889,281.768,405.155,262.67,384.588,229.743z" />
                                        <path d="M187.676,125.879l-73.224,76.242c-3.734,3.901-4.631,9.712-2.239,14.55l18.554,37.531 c1.464,2.991,4.162,5.171,7.379,6.036c3.216,0.847,6.64,0.279,9.396-1.586l13.936-9.397c2.753-1.864,4.568-4.819,4.987-8.117 c0.419-3.297-0.608-6.612-2.815-9.099l-24.972-33.594l60.035-62.53C194.64,133.104,190.951,129.717,187.676,125.879z" />
                                      </svg>
                                    );
                                  }

                                  // Sports - Swimming
                                  if (lower.includes("swim")) {
                                    return (
                                      <svg
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                      >
                                        <path d="M21 7.5C21 8.88071 19.8807 10 18.5 10C17.1193 10 16 8.88071 16 7.5C16 6.11929 17.1193 5 18.5 5C19.8807 5 21 6.11929 21 7.5Z" />
                                        <path d="M19.754 13.1283L12.354 6.96169C10.9095 5.75794 8.9118 5.46638 7.18351 6.20708L3.59222 7.7462C3.23294 7.90017 3 8.25344 3 8.64432C3 9.31126 3.6534 9.78221 4.28612 9.5713L7.82736 8.39089C8.54603 8.15133 9.33837 8.33838 9.87403 8.87404L11 10L5.72973 13.2939C5.87157 13.3782 6.00088 13.4783 6.11842 13.5911C6.42799 13.8883 6.65137 14.2865 6.76607 14.47C6.98521 14.8206 7.17253 15 7.60557 15C8.36469 15 9.01052 14.5286 9.61533 14.1249C10.3276 13.6493 11.2998 13 12.6056 13C13.2851 13 13.8472 13.1758 14.2876 13.5533C14.6634 13.8753 14.8675 14.2863 14.9818 14.5162C15.1485 14.8511 15.2073 15 15.6056 15C16.2877 15 16.9383 14.6595 17.769 14.1484C18.1839 13.893 18.5948 13.629 19.0329 13.4144C19.2526 13.3069 19.4942 13.2044 19.754 13.1283Z" />
                                        <path d="M23.4472 18.8944C22.9536 19.1413 22.3534 18.9415 22.1061 18.4482C21.9575 18.1653 21.77 17.8986 21.5599 17.6585C21.1747 17.2183 20.8036 17 20.5 17C20.3434 17 20.128 17.0534 19.8071 17.2106C19.427 17.3967 19.0713 17.6296 18.7116 17.8517C17.9173 18.3405 16.8178 19 15.5 19C14.8205 19 14.2584 18.8242 13.818 18.4468C13.4996 18.1739 13.29 17.8176 13.1056 17.4472C12.9501 17.1363 12.8571 17 12.5 17C11.7409 17 11.0951 17.4714 10.4902 17.8751C9.77797 18.3508 8.8058 19 7.5 19C6.81825 19 6.26147 18.8244 5.81027 18.4962C5.38546 18.1873 5.12877 17.7928 4.9645 17.53C4.63557 17.0022 4.31057 16.9517 3.74611 17.2173C3.42379 17.369 3.08894 17.5809 2.77567 17.8087C2.4002 18.0818 2.03744 18.3806 1.70687 18.7073C1.31631 19.0974 0.68327 19.0975 0.292893 18.7071C-0.0976311 18.3166 -0.0976311 17.6834 0.292893 17.2929C0.696649 16.892 1.13966 16.5256 1.59933 16.1913C1.97356 15.9191 2.41996 15.631 2.89452 15.4077C3.35859 15.1893 3.91795 15 4.5 15C5.14106 15 5.63708 15.2304 6.01284 15.5911C6.28231 15.8498 6.48609 16.1843 6.61007 16.3878C6.71551 16.5609 6.81996 16.7576 6.98661 16.8788C7.05103 16.9256 7.18175 17 7.5 17C8.15438 17 8.66304 16.6895 9.4453 16.168C10.3754 15.5472 11.3467 15 12.5 15C13.1795 15 13.7416 15.1758 14.182 15.5532C14.5578 15.8753 14.762 16.2863 14.8762 16.5162C15.038 16.8411 15.1219 17 15.5 17C16.1822 17 16.8327 16.6595 17.6634 16.1483C18.0783 15.893 18.4892 15.629 18.9273 15.4144C19.372 15.1967 19.9066 15 20.5 15C21.6964 15 22.5753 15.7817 23.0651 16.3415C23.3854 16.7076 23.6681 17.1144 23.8916 17.5471C24.134 18.0276 23.9295 18.6533 23.4472 18.8944Z" />
                                      </svg>
                                    );
                                  }

                                  // Sports - Gym/Workout
                                  if (
                                    lower.includes("gym") ||
                                    lower.includes("workout") ||
                                    lower.includes("fitness")
                                  ) {
                                    return (
                                      <svg
                                        viewBox="0 0 181.115 181.115"
                                        fill="currentColor"
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                      >
                                        <path d="M11.688,181.115c-0.641,0-1.281-0.245-1.768-0.732l-9.188-9.188c-0.943-0.943-0.979-2.459-0.084-3.447l13.332-14.699 l-9.001-9.001c-2.364-2.364-2.364-6.21,0-8.574l7.404-7.404c0.255-0.255,0.527-0.484,0.816-0.687l-4.397-4.397 c-2.363-2.364-2.363-6.209-0.001-8.573l10.66-10.659c1.146-1.146,2.668-1.776,4.287-1.776s3.142,0.631,4.287,1.776l17.536,17.536 l75.716-75.716l-17.536-17.536c-1.146-1.145-1.776-2.667-1.776-4.287s0.631-3.142,1.776-4.287l10.659-10.659 c1.146-1.146,2.668-1.776,4.287-1.776c1.618,0,3.141,0.63,4.286,1.775l4.398,4.399c0.201-0.288,0.43-0.562,0.686-0.818l7.404-7.404 c1.146-1.146,2.668-1.776,4.287-1.776s3.143,0.631,4.287,1.777l9.001,9l14.699-13.332c0.988-0.895,2.506-0.859,3.447,0.084 l9.188,9.188c0.943,0.943,0.979,2.459,0.084,3.447l-13.332,14.699l9.001,9.001c2.364,2.364,2.364,6.21,0,8.574l-7.404,7.404 c-0.255,0.255-0.527,0.484-0.816,0.687l4.397,4.397c2.363,2.364,2.363,6.209,0.001,8.573l-10.66,10.659 c-1.146,1.146-2.668,1.776-4.287,1.776s-3.142-0.631-4.287-1.776l-17.536-17.536l-75.716,75.716l17.536,17.536 c1.146,1.145,1.776,2.667,1.776,4.287s-0.631,3.142-1.776,4.287l-10.659,10.659c-1.146,1.146-2.668,1.776-4.287,1.776 c-1.618,0-3.141-0.63-4.286-1.775l-4.398-4.399c-0.201,0.288-0.43,0.562-0.686,0.818l-7.404,7.404 c-1.146,1.146-2.668,1.776-4.287,1.776s-3.143-0.631-4.287-1.777l-9.001-9l-14.699,13.332 C12.891,180.9,12.289,181.115,11.688,181.115z" />
                                      </svg>
                                    );
                                  }

                                  // Sports - Yoga
                                  if (
                                    lower.includes("yoga") ||
                                    lower.includes("meditation")
                                  ) {
                                    return (
                                      <svg
                                        viewBox="0 0 512 512"
                                        fill="currentColor"
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                      >
                                        <path d="M482.752,435.574c-6.928-8.1-23.127-40.492-23.127-40.492s2.676-3.448,0-15.051 c-3.48-15.035-18.514-13.886-21.978-17.349c-3.479-3.472-33.549-58.424-35.863-64.792c-2.314-6.369-27.772-78.662-27.772-78.662 c-8.549-37.604-24.308-53.221-45.121-57.85c-20.64-4.581-31.817-3.471-41.075-11.571c-5.778-5.054-5.573-8.809-5.573-24.056 c0,0,6.235-5.927,10.784-14.122c5.195-9.375,7.746-22.907,7.746-22.907c5.211-2.086,5.274-4.684,7.525-12.965 c3.118-11.461,2.897-19.317-5.431-19.317C304.836,19.066,286.085,0,256,0c-30.07,0-48.821,19.066-46.853,56.441 c-8.328,0-8.564,7.856-5.432,19.317c2.251,8.281,2.314,10.879,7.51,12.965c0,0,2.55,13.532,7.762,22.907 c4.55,8.194,10.784,14.122,10.784,14.122c0,15.247,0.189,19.002-5.589,24.056c-9.242,8.1-20.435,6.99-41.059,11.571 c-20.828,4.628-36.572,20.246-45.12,57.85c0,0-25.457,72.294-27.771,78.662c-2.314,6.368-32.401,61.32-35.864,64.792 c-3.464,3.463-18.514,2.314-21.978,17.349c-2.676,11.603,0,15.051,0,15.051s-16.2,32.392-23.143,40.492 c-6.942,8.092,5.794,13.878,13.886,3.464c0.944,1.409,4.156,2.424,7.793,2.912c-28.228,31.251-12.138,71.964,31.55,69.98 C118.291,510.3,256,485.316,256,485.316S393.707,510.3,429.54,511.93c43.688,1.984,59.778-38.729,31.534-69.98 c3.652-0.488,6.864-1.503,7.808-2.912C476.974,449.452,489.695,443.666,482.752,435.574z M183.123,383.849 c0,0-59.274,17.626-96.192,34.234c7.604-14.154,16.357-33.423,16.357-33.423l37.029-53.212l29.504-64.218 c0,0,9.257,34.714,12.138,39.917C184.855,312.35,183.123,383.849,183.123,383.849z M328.891,383.849c0,0-1.732-71.498,1.149-76.702 c2.897-5.203,12.154-39.917,12.154-39.917l29.504,64.218l37.013,53.212c0,0,8.769,19.27,16.373,33.423 C388.165,401.474,328.891,383.849,328.891,383.849z" />
                                      </svg>
                                    );
                                  }

                                  // Sports - Cycling
                                  if (
                                    lower.includes("cycl") ||
                                    lower.includes("bike") ||
                                    lower.includes("biking")
                                  ) {
                                    return (
                                      <svg
                                        viewBox="0 0 512 512"
                                        fill="currentColor"
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                      >
                                        <path d="M99.407,259.965C44.587,259.965,0,304.552,0,359.372c0,54.811,44.587,99.398,99.407,99.398 c54.811,0,99.406-44.587,99.406-99.398C198.813,304.552,154.218,259.965,99.407,259.965z M99.407,431.538 c-39.793,0-72.157-32.374-72.157-72.166c0-39.801,32.364-72.175,72.157-72.175c39.792,0,72.174,32.374,72.174,72.175 C171.581,399.165,139.199,431.538,99.407,431.538z" />
                                        <path d="M412.602,259.965c-54.82,0-99.407,44.587-99.407,99.407c0,54.811,44.587,99.398,99.407,99.398 c54.811,0,99.398-44.587,99.398-99.398C512,304.552,467.413,259.965,412.602,259.965z M412.602,431.538 c-39.801,0-72.175-32.374-72.175-72.166c0-39.801,32.374-72.175,72.175-72.175c39.792,0,72.166,32.374,72.166,72.175 C484.768,399.165,452.394,431.538,412.602,431.538z" />
                                        <path d="M267.288,63.74l-142.7,24.504c-11.179,1.486-19.552,8.747-19.552,19.553l2.38,54.134l3.17,72.174 c0,7.731,6.272,13.994,14.002,13.994c7.74,0,14.002-6.263,14.002-13.994l3.301-77.083l68.605-18.537 c0,0-25.243,29.96-27.336,32.574c-10.459,13.072-14.246,37.039,2.614,49.678l73.009,53.021l4.144,63.532 c0,10.519,8.53,19.049,19.04,19.049c10.51,0,19.04-8.53,19.04-19.049c0-0.417,16.773-203.573,16.773-203.573 C322.637,91.363,298.254,58.867,267.288,63.74z M228.825,204.755c-3.648-2.71-2.728-6.341,0-9.972 c2.718-3.648,24.512-21.785,24.512-21.785l4.535,57.173L228.825,204.755z" />
                                        <path d="M53.986,123.85c19.492,0,35.302-15.809,35.302-35.301c0-19.51-15.81-35.319-35.302-35.319 c-19.501,0-35.31,15.809-35.31,35.319C18.676,108.041,34.484,123.85,53.986,123.85z" />
                                      </svg>
                                    );
                                  }

                                  // Sports - Hiking
                                  if (lower.includes("hik")) {
                                    return (
                                      <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                      >
                                        <path d="M14 22V16L12 14M12 14L13 8M12 14H10M13 8C14 9.16667 15.6 11 18 11M13 8L12.8212 7.82124C12.2565 7.25648 11.2902 7.54905 11.1336 8.33223L10 14M10 14L8 22M18 9.5V22M8 7H7.72076C7.29033 7 6.90819 7.27543 6.77208 7.68377L5.5 11.5L7 12L8 7ZM14.5 3.5C14.5 4.05228 14.0523 4.5 13.5 4.5C12.9477 4.5 12.5 4.05228 12.5 3.5C12.5 2.94772 12.9477 2.5 13.5 2.5C14.0523 2.5 14.5 2.94772 14.5 3.5Z" />
                                      </svg>
                                    );
                                  }

                                  // Food - Dinner/Lunch/Breakfast/Meal
                                  if (
                                    lower.includes("dinner") ||
                                    lower.includes("lunch") ||
                                    lower.includes("breakfast") ||
                                    lower.includes("brunch") ||
                                    lower.includes("meal")
                                  ) {
                                    return (
                                      <svg
                                        viewBox="0 0 512 512"
                                        fill="currentColor"
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                      >
                                        <path d="M264.181,76.909c-93.646,0-169.561,75.915-169.561,169.561s75.915,169.561,169.561,169.561 s169.561-75.915,169.561-169.561S357.827,76.909,264.181,76.909z M264.18,375.129c-70.942,0-128.658-57.716-128.658-128.658 s57.716-128.658,128.658-128.658s128.658,57.716,128.658,128.658S335.123,375.129,264.18,375.129z" />
                                        <path d="M264.18,152.299c-51.926,0-94.171,42.245-94.171,94.171c0,51.926,42.245,94.171,94.171,94.171 c51.926,0,94.171-42.245,94.171-94.171S316.107,152.299,264.18,152.299z" />
                                        <path d="M501.315,260.687V54.64c0-1.988-1.269-3.755-3.155-4.39c-1.884-0.634-3.963,0.007-5.166,1.591 c-25.708,33.903-39.622,75.283-39.622,117.83v75.378c0,8.645,7.008,15.654,15.654,15.654h6.526 c-6.433,66.443-10.684,159.37-10.684,170.251c0,17.142,10.551,31.038,23.566,31.038c13.015,0,23.566-13.897,23.566-31.038 C512,420.072,507.749,327.13,501.315,260.687z" />
                                        <path d="M68.417,219.843c13.042-7.9,21.759-22.224,21.759-38.586l-6.46-105.621c-0.247-4.026-3.584-7.165-7.618-7.165 c-4.363,0-7.839,3.655-7.622,8.01l4.201,84.709c0,4.762-3.861,8.621-8.621,8.621c-4.761,0-8.621-3.861-8.621-8.621l-2.099-84.674 c-0.111-4.475-3.77-8.044-8.247-8.044c-4.477,0-8.135,3.57-8.247,8.044l-2.099,84.674c0,4.762-3.861,8.621-8.621,8.621 c-4.761,0-8.621-3.861-8.621-8.621l4.201-84.709c0.216-4.357-3.262-8.01-7.622-8.01c-4.034,0-7.371,3.139-7.617,7.165L0,181.258 c0,16.362,8.716,30.685,21.759,38.586c8.488,5.141,13.22,14.753,12.126,24.617c-7.363,66.358-12.363,174.693-12.363,186.494 c0,17.142,10.551,31.038,23.566,31.038c13.015,0,23.566-13.897,23.566-31.038c0-11.801-5.001-120.136-12.363-186.494 C55.196,234.602,59.933,224.982,68.417,219.843z" />
                                      </svg>
                                    );
                                  }

                                  // Food - Restaurant
                                  if (lower.includes("restaurant")) {
                                    return (
                                      <svg
                                        viewBox="0 0 1024 1024"
                                        fill="currentColor"
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                      >
                                        <path d="M979.845 615.424c0-7.252-19.662-21.198-57.386-32.516-43.739-13.122-103.707-20.732-167.894-20.732s-124.155 7.61-167.894 20.732c-37.724 11.318-57.386 25.263-57.386 32.516s19.662 21.198 57.386 32.516c43.739 13.122 103.707 20.732 167.894 20.732s124.155-7.61 167.894-20.732c37.724-11.318 57.386-25.263 57.386-32.516zm40.96 0c0 58.643-118.543 94.208-266.24 94.208s-266.24-35.565-266.24-94.208 118.543-94.208 266.24-94.208 266.24 35.565 266.24 94.208zm-59.65 98.918c-38.954 21.718-118.316 36.248-206.593 36.248-83.81 0-159.758-13.065-200.861-33.251-10.153-4.986-22.425-.798-27.411 9.355s-.798 22.425 9.355 27.411c47.597 23.375 129.39 37.446 218.917 37.446 94.63 0 180.385-15.701 226.539-41.433 9.879-5.508 13.423-17.982 7.915-27.861s-17.982-13.423-27.861-7.915zM437.125 225.28c0 51.479-93.865 81.92-209.92 81.92s-209.92-30.441-209.92-81.92 93.865-81.92 209.92-81.92 209.92 30.441 209.92 81.92zm-40.96 0c0-1.02-1.683-3.687-6.869-7.664-7.433-5.7-19.229-11.362-34.455-16.3-33.106-10.737-78.734-16.995-127.635-16.995s-94.529 6.259-127.635 16.995c-15.227 4.938-27.022 10.6-34.455 16.3-5.187 3.977-6.869 6.644-6.869 7.664s1.683 3.687 6.869 7.664c7.433 5.7 19.229 11.362 34.455 16.3 33.106 10.737 78.734 16.995 127.635 16.995s94.529-6.259 127.635-16.995c15.227-4.938 27.022-10.6 34.455-16.3 5.187-3.977 6.869-6.644 6.869-7.664zM305.58 727.714c58.473 10.948 94.741 34.161 94.741 52.594 0 27.759-73.152 58.921-165.919 58.921S68.483 808.067 68.483 780.308c0-17.805 34.087-40.332 89.994-51.67 11.085-2.248 18.249-13.057 16.001-24.142s-13.057-18.249-24.142-16.001c-73.024 14.809-122.813 47.714-122.813 91.813 0 59.938 93.765 99.881 206.879 99.881s206.879-39.943 206.879-99.881c0-45.176-52.302-78.651-128.163-92.855-11.118-2.082-21.818 5.243-23.899 16.361s5.243 21.818 16.361 23.899z" />
                                        <path d="M396.864 229.741l15.841 162.826c11.252 115.688-72.366 215.627-182.89 215.627h-4.966c-110.525 0-194.142-99.939-182.89-215.628L57.8 229.74c1.095-11.258-7.143-21.272-18.401-22.367s-21.272 7.143-22.367 18.401L1.191 388.6C-12.332 527.636 89.34 649.153 224.849 649.153h4.966c135.509 0 237.181-121.518 223.658-260.553l-15.841-162.827c-1.095-11.258-11.109-19.496-22.367-18.401s-19.496 11.109-18.401 22.367z" />
                                        <path d="M209.336 628.675V768c0 11.311 9.169 20.48 20.48 20.48s20.48-9.169 20.48-20.48V628.675c0-11.311-9.169-20.48-20.48-20.48s-20.48 9.169-20.48 20.48z" />
                                      </svg>
                                    );
                                  }

                                  // Food - Coffee/Cafe
                                  if (
                                    lower.includes("coffee") ||
                                    lower.includes("cafe") ||
                                    lower.includes("espresso") ||
                                    lower.includes("latte")
                                  ) {
                                    return (
                                      <svg
                                        viewBox="-5 0 32 32"
                                        fill="currentColor"
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                      >
                                        <path d="M12.406 14.75c-0.094-2.094-0.219-3.219-1.469-4.594-1.594-1.781-2.188-3.5-0.875-6.156 0.344 1.781 0.469 3.375 1.719 4.344s2.281 3.594 0.625 6.406zM10.063 14.75c-0.063-1.125-0.125-1.688-0.813-2.469-0.844-0.938-1.188-1.844-0.469-3.281 0.188 0.969 0.219 1.813 0.906 2.313s1.281 1.938 0.375 3.438zM15.719 24.625h5.688c0.344 0 0.469 0.25 0.25 0.531 0 0-2.219 2.844-5.281 2.844h-10.969s-5.281-2.844-5.281-2.844c-0.219-0.281-0.125-0.531 0.219-0.531h5.625c-0.781-0.406-1.938-2.188-1.938-4.406v-4.688h13.688v0.375c0.438-0.375 0.969-0.563 1.531-0.563 0.781 0 2.25 0.813 2.25 2.219 0 2.031-1.344 2.781-2.125 3.313 0 0-1.469 1.156-2.5 2.5-0.344 0.594-0.75 1.063-1.156 1.25zM19.25 16.188c-0.5 0-1.125 0.219-1.531 1.219v2.594c0 0.344-0.031 0.75-0.094 1.094 0.688-0.688 1.5-1.156 1.5-1.156 0.5-0.344 1.5-1 1.5-2.281 0.031-0.906-0.813-1.469-1.375-1.469zM6.406 16.563h-0.875v1.281h0.875v-1.281zM6.406 18.594h-0.875v2.094s0.25 2.813 2.031 3.656c-1.094-1.281-1.156-2.75-1.156-3.656v-2.094z" />
                                      </svg>
                                    );
                                  }

                                  // Pet/Dog/Cat
                                  if (
                                    lower.includes("pet") ||
                                    lower.includes("dog") ||
                                    lower.includes("cat") ||
                                    lower.includes("vet")
                                  ) {
                                    return (
                                      <svg
                                        viewBox="-1.5 0 19 19"
                                        fill="currentColor"
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                      >
                                        <path d="M4.086 7.9a1.91 1.91 0 0 1-.763 2.52c-.81.285-1.782-.384-2.17-1.492a1.91 1.91 0 0 1 .762-2.521c.81-.285 1.782.384 2.171 1.492zm6.521 7.878a2.683 2.683 0 0 1-1.903-.788.996.996 0 0 0-1.408 0 2.692 2.692 0 0 1-3.807-3.807 6.377 6.377 0 0 1 9.022 0 2.692 2.692 0 0 1-1.904 4.595zM7.73 6.057c.127 1.337-.563 2.496-1.54 2.588-.977.092-1.872-.917-1.998-2.254-.127-1.336.563-2.495 1.54-2.587.977-.093 1.871.916 1.998 2.253zm.54 0c-.127 1.337.563 2.496 1.54 2.588.977.092 1.871-.917 1.998-2.254.127-1.336-.563-2.495-1.54-2.587-.977-.093-1.872.916-1.998 2.253zm3.644 1.842a1.91 1.91 0 0 0 .763 2.522c.81.284 1.782-.385 2.17-1.493a1.91 1.91 0 0 0-.762-2.521c-.81-.285-1.782.384-2.171 1.492z" />
                                      </svg>
                                    );
                                  }

                                  // Travel - Flight/Airplane
                                  if (
                                    lower.includes("flight") ||
                                    lower.includes("airplane") ||
                                    lower.includes("plane") ||
                                    lower.includes("travel") ||
                                    lower.includes("trip")
                                  ) {
                                    return (
                                      <svg
                                        viewBox="-2.5 0 19 19"
                                        fill="currentColor"
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                      >
                                        <path d="M12.382 5.304 10.096 7.59l.006.02L11.838 14a.908.908 0 0 1-.211.794l-.573.573a.339.339 0 0 1-.566-.08l-2.348-4.25-.745-.746-1.97 1.97a3.311 3.311 0 0 1-.75.504l.44 1.447a.875.875 0 0 1-.199.79l-.175.176a.477.477 0 0 1-.672 0l-1.04-1.039-.018-.02-.788-.786-.02-.02-1.038-1.039a.477.477 0 0 1 0-.672l.176-.176a.875.875 0 0 1 .79-.197l1.447.438a3.322 3.322 0 0 1 .504-.75l1.97-1.97-.746-.744-4.25-2.348a.339.339 0 0 1-.08-.566l.573-.573a.909.909 0 0 1 .794-.211l6.39 1.736.02.006 2.286-2.286c.37-.372 1.621-1.02 1.993-.65.37.372-.279 1.622-.65 1.993z" />
                                      </svg>
                                    );
                                  }

                                  // Halloween/Pumpkin
                                  if (
                                    lower.includes("halloween") ||
                                    lower.includes("pumpkin")
                                  ) {
                                    return (
                                      <svg
                                        viewBox="0 0 512 512"
                                        fill="currentColor"
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                      >
                                        <path d="M366.313,58.34c-32.779-4.382-64.158,2.121-86.979,6.297V35.006c0-5.948-4.825-10.766-10.774-10.766h-25.13 c-5.94,0-10.765,4.817-10.765,10.766v29.631c-22.821-4.176-54.2-10.679-86.987-6.297C32.612,73.464,0,152.872,0,246.401 c0,115.273,76.197,203.035,180.989,231.503c23.722,6.439,48.916,9.856,75.01,9.856c26.095,0,51.289-3.417,75.003-9.856 C435.803,449.436,512,361.674,512,246.401C512,152.872,479.387,73.464,366.313,58.34z M366.479,146.703l49.216,68.477 l-104.08,10.868L366.479,146.703z M254.695,218.091l33.016,41.717c-3.915,0-66.982,0-66.982,0L254.695,218.091z M140.063,146.703 l54.856,79.346L90.846,215.18L140.063,146.703z M355.113,408.857v-22.488h-44.929v38.933c-30.667,8.329-54.302,9.572-54.302,9.572 s-22.251,0.719-51.62-5.664v-42.84h-44.937v28.144c-44.494-20.218-88.972-60.417-95.553-140.292c0,0,24.932,11.058,85.966,18.003 v42.524h57.427v-38.094c14.365,0.68,31.443,1.076,49.122,1.076c20.012,0,37.042-0.506,54.991-1.36v38.379h55.639v-43.236 c57.434-6.96,80.635-17.291,80.635-17.291C445.667,347.072,400.896,387.018,355.113,408.857z" />
                                      </svg>
                                    );
                                  }

                                  // Easter/Egg
                                  if (lower.includes("easter")) {
                                    return (
                                      <svg
                                        viewBox="0 0 512 512"
                                        fill="currentColor"
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                      >
                                        <path d="M395.631,98.837C358.783,45.867,309.195,16.696,256,16.696S153.217,45.867,116.369,98.837 c-35.565,51.124-55.151,118.797-55.151,190.554c0,113.54,87.379,205.913,194.783,205.913s194.783-92.373,194.783-205.913 C450.783,217.635,431.196,149.962,395.631,98.837z M256,461.913c-85.995,0-156.491-72.271-161.141-162.976l61.911-35.377 l30.95,13.756l14.949-29.896l-47.786-21.239l-59.058,33.747c4.457-53.789,21.09-103.404,47.954-142.021 c30.424-43.735,70.276-67.82,112.22-67.82c41.944,0,81.796,24.085,112.22,67.82c27.182,39.073,43.883,89.411,48.1,143.935 l-71.277-35.64l-89.463,44.731l-22.369-9.942l-14.948,29.896l38.155,16.957l88.625-44.309l72.06,36.03 C412.159,389.976,341.796,461.913,256,461.913z" />
                                        <rect
                                          y="128"
                                          width="55.652"
                                          height="33.391"
                                        />
                                        <rect
                                          x="24.183"
                                          y="40.811"
                                          transform="matrix(0.3333 -0.9428 0.9428 0.3333 -37.458 84.2995)"
                                          width="33.391"
                                          height="55.65"
                                        />
                                        <rect
                                          x="456.348"
                                          y="128"
                                          width="55.652"
                                          height="33.391"
                                        />
                                        <rect
                                          x="443.282"
                                          y="51.937"
                                          transform="matrix(0.9428 -0.3333 0.3333 0.9428 4.0631 160.9478)"
                                          width="55.65"
                                          height="33.391"
                                        />
                                      </svg>
                                    );
                                  }

                                  // Christmas/Holiday icons
                                  if (
                                    lower.includes("christmas") ||
                                    lower.includes("xmas") ||
                                    lower.includes("holiday")
                                  ) {
                                    return (
                                      <svg
                                        viewBox="0 0 512 512"
                                        fill="currentColor"
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                      >
                                        <polygon points="223.959,97.177 255.541,78.498 287.111,97.177 279.104,61.374 306.633,37.117 270.105,33.671 255.541,0 240.977,33.671 204.449,37.117 231.966,61.374" />
                                        <path d="M464.267,406.172c-0.434-5.528-3.917-10.331-9.024-12.469c-32.766-13.666-63.71-35.32-85.432-53.299 c12.841-3.018,27.102-7.765,39.776-15.178c4.505-2.652,7.276-7.492,7.276-12.711l-0.012-0.601 c-0.224-5.466-3.44-10.332-8.336-12.692c-15.332-7.381-31.074-19.485-44.61-31.856c-8.379-7.647-15.933-15.388-22.168-22.156 c8.906-2.163,19.169-5.732,30.164-11.639c4.815-2.584,7.778-7.592,7.778-13.002l-0.031-0.917v-0.025 c-0.372-5.752-4.06-10.765-9.452-12.835c-12.116-4.617-24.728-12.506-36.664-21.84c-35.914-27.988-65.427-68.618-65.544-68.842 l0.012,0.019c-2.776-3.874-7.238-6.16-11.992-6.16c-4.754,0-9.228,2.293-11.999,6.179l0.038-0.062 c-0.148,0.211-13.194,18.258-32.612,38.623c-9.699,10.17-20.984,20.904-32.933,30.232c-11.937,9.333-24.561,17.229-36.69,21.852 l-0.025,0.006c-5.373,2.064-9.06,7.077-9.432,12.829l-0.031,0.942c0,5.41,2.969,10.418,7.784,13.009 c10.994,5.9,21.263,9.47,30.169,11.632c-6.241,6.768-13.796,14.509-22.175,22.156c-13.542,12.371-29.277,24.474-44.61,31.856 c-4.89,2.361-8.112,7.226-8.33,12.692v-0.025l-0.012,0.626c0,5.224,2.77,10.059,7.264,12.704l0.012,0.006 c12.668,7.412,26.928,12.159,39.769,15.178c-21.734,17.985-52.691,39.646-85.438,53.299c-5.107,2.138-8.59,6.941-9.024,12.463 l-0.043,1.153c0,5.1,2.646,9.854,6.996,12.55l0.018,0.013c10.368,6.376,23.446,12.128,38.474,17.334 c30.814,10.635,69.889,18.89,109.144,23.054l10.982,47.516c0.57,2.473,2.622,4.214,4.983,4.214h75.417 c2.355,0,4.412-1.742,4.982-4.214l10.976-47.541c20.142-2.144,40.234-5.329,59.18-9.383c17.998-3.849,34.96-8.453,49.977-13.647 c15.029-5.206,28.106-10.958,38.474-17.334l0.006-0.006c4.369-2.702,7.009-7.456,7.009-12.556L464.267,406.172z" />
                                      </svg>
                                    );
                                  }

                                  // Running/Exercise icons
                                  if (
                                    lower.includes("running") ||
                                    lower.includes("run") ||
                                    lower.includes("jog") ||
                                    lower.includes("exercise")
                                  ) {
                                    return (
                                      <svg
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                      >
                                        <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z" />
                                      </svg>
                                    );
                                  }

                                  // Religious/Jesus/Church icons
                                  if (
                                    lower.includes("jesus") ||
                                    lower.includes("church") ||
                                    lower.includes("prayer")
                                  ) {
                                    return (
                                      <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                      >
                                        <path d="M12.0002 8L8.79795 9.5611C8.14576 9.87904 7.81967 10.038 7.58124 10.278C7.37041 10.4903 7.20988 10.7471 7.11148 11.0297C7.0002 11.3492 7.0002 11.7119 7.0002 12.4375V21H17.0002V12.4375C17.0002 11.7119 17.0002 11.3492 16.8889 11.0297C16.7905 10.7471 16.63 10.4903 16.4192 10.278C16.1807 10.038 15.8546 9.87904 15.2024 9.5611L12.0002 8ZM12.0002 8V3M14.0002 5H10.0002M7.0002 13L4.76897 14.1156C4.12683 14.4366 3.80576 14.5971 3.57118 14.8366C3.36374 15.0484 3.20598 15.3037 3.10931 15.5839C3 15.9009 3 16.2598 3 16.9778V21H21V16.9777C21 16.2598 21 15.9008 20.8907 15.5839C20.794 15.3037 20.6363 15.0484 20.4289 14.8366C20.1943 14.5971 19.8732 14.4366 19.2311 14.1155L17.0002 13M14.0002 21V17C14.0002 15.8954 13.1048 15 12.0002 15C10.8956 15 10.0002 15.8954 10.0002 17V21H14.0002Z" />
                                      </svg>
                                    );
                                  }

                                  // Default icon for any other custom category
                                  return (
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
                                      <path d="M12 6v6l4 2" />
                                    </svg>
                                  );
                                })()
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
                          {activeCategory === c ? (
                            <div className="mt-1 mb-2">
                              {categoryItems.length === 0 ? (
                                <div className="text-xs text-foreground/60 px-1 py-0.5">
                                  No events
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  {categoryItems.map((h, index) => {
                                    const slug = (h.title || "")
                                      .toLowerCase()
                                      .replace(/[^a-z0-9]+/g, "-")
                                      .replace(/^-+|-+$/g, "");
                                    const prettyHref = `/event/${slug}-${h.id}`;
                                    const category = (h as any)?.data?.category as string | null;
                                    const isShared = Boolean(
                                      (h as any)?.data?.shared ||
                                        (h as any)?.data?.sharedOut ||
                                        (h as any)?.data?.category === "Shared events"
                                    );
                                    const rowAndBadge = (() => {
                                      if (isShared) {
                                        return {
                                          row: `${sharedGradientRowClass()} ${sharedTextClass}`,
                                          badge: `bg-surface/60 ${sharedMutedTextClass} border-border`,
                                        };
                                      }
                                      if (!category)
                                        return {
                                          row: "",
                                          badge: "bg-surface/70 text-foreground/70 border-border/70",
                                        };
                                      const color =
                                        categoryColors[category] ||
                                        defaultCategoryColor(category);
                                      const ccls = colorClasses(color);
                                      const row = ccls.tint;
                                      return { row, badge: ccls.badge };
                                    })();
                                    return (
                                      <Fragment key={h.id}>
                                        <div
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
                                            <div
                                              className={`text-xs ${
                                                isShared
                                                  ? sharedMutedTextClass
                                                  : "text-foreground/60"
                                              }`}
                                            >
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
                                          {Boolean(
                                            (h as any)?.data &&
                                              (((h as any).data.shared as any) ||
                                                ((h as any).data.sharedOut as any))
                                          ) && (
                                            <svg
                                              viewBox="0 0 25.274 25.274"
                                              fill="currentColor"
                                              className="h-3.5 w-3.5 text-zinc-900 dark:text-foreground absolute right-2 bottom-2"
                                              aria-hidden="true"
                                              aria-label="Shared event"
                                              xmlns="http://www.w3.org/2000/svg"
                                            >
                                              <title>Shared event</title>
                                              <path d="M24.989,15.893c-0.731-0.943-3.229-3.73-4.34-4.96c0.603-0.77,0.967-1.733,0.967-2.787c0-2.503-2.03-4.534-4.533-4.534 c-2.507,0-4.534,2.031-4.534,4.534c0,1.175,0.455,2.24,1.183,3.045l-1.384,1.748c-0.687-0.772-1.354-1.513-1.792-2.006 c0.601-0.77,0.966-1.733,0.966-2.787c-0.001-2.504-2.03-4.535-4.536-4.535c-2.507,0-4.536,2.031-4.536,4.534 c0,1.175,0.454,2.24,1.188,3.045L0.18,15.553c0,0-0.406,1.084,0,1.424c0.36,0.3,0.887,0.81,1.878,0.258 c-0.107,0.974-0.054,2.214,0.693,2.924c0,0,0.749,1.213,2.65,1.456c0,0,2.1,0.244,4.543-0.367c0,0,1.691-0.312,2.431-1.794 c0.113,0.263,0.266,0.505,0.474,0.705c0,0,0.751,1.213,2.649,1.456c0,0,2.103,0.244,4.54-0.367c0,0,2.102-0.38,2.65-2.339 c0.297-0.004,0.663-0.097,1.149-0.374C24.244,18.198,25.937,17.111,24.989,15.893z M13.671,8.145c0-1.883,1.527-3.409,3.409-3.409 c1.884,0,3.414,1.526,3.414,3.409c0,1.884-1.53,3.411-3.414,3.411C15.198,11.556,13.671,10.029,13.671,8.145z M13.376,12.348 l0.216,0.516c0,0-0.155,0.466-0.363,1.069c-0.194-0.217-0.388-0.437-0.585-0.661L13.376,12.348z M3.576,8.145 c0-1.883,1.525-3.409,3.41-3.409c1.881,0,3.408,1.526,3.408,3.409c0,1.884-1.527,3.411-3.408,3.411 C5.102,11.556,3.576,10.029,3.576,8.145z M2.186,16.398c-0.033,0.07-0.065,0.133-0.091,0.177c-0.801,0.605-1.188,0.216-1.449,0 c-0.259-0.216,0-0.906,0-0.906l2.636-3.321l0.212,0.516c0,0-0.227,0.682-0.503,1.47l-0.665,1.49 C2.325,15.824,2.257,16.049,2.186,16.398z M9.299,20.361c-2.022,0.507-3.758,0.304-3.758,0.304 c-1.574-0.201-2.196-1.204-2.196-1.204c-1.121-1.066-0.348-3.585-0.348-3.585l1.699-3.823c0.671,0.396,1.451,0.627,2.29,0.627 c0.584,0,1.141-0.114,1.656-0.316l2.954,5.417C11.482,19.968,9.299,20.361,9.299,20.361z M9.792,12.758l0.885-0.66 c0,0,2.562,2.827,3.181,3.623c0.617,0.794-0.49,1.501-0.75,1.723c-0.259,0.147-0.464,0.206-0.635,0.226L9.792,12.758z M19.394,20.361c-2.018,0.507-3.758,0.304-3.758,0.304c-1.569-0.201-2.191-1.204-2.191-1.204c-0.182-0.175-0.311-0.389-0.403-0.624 c0.201-0.055,0.433-0.15,0.698-0.301c0.405-0.337,2.102-1.424,1.154-2.643c-0.24-0.308-0.678-0.821-1.184-1.405l1.08-2.435 c0.674,0.396,1.457,0.627,2.293,0.627c0.585,0,1.144-0.114,1.654-0.316l2.955,5.417C21.582,19.968,19.394,20.361,19.394,20.361z M23.201,17.444c-0.255,0.147-0.461,0.206-0.63,0.226l-2.68-4.912l0.879-0.66c0,0,2.562,2.827,3.181,3.623 C24.57,16.516,23.466,17.223,23.201,17.444z"></path>
                                            </svg>
                                          )}
                                          <button
                                            type="button"
                                            aria-label="Item options"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              const target =
                                                e.currentTarget as HTMLElement | null;
                                              if (itemMenuId === h.id) {
                                                setItemMenuId(null);
                                                setItemMenuOpensUpward(false);
                                                setItemMenuPos(null);
                                                setItemMenuCategoryOpenFor(
                                                  null
                                                );
                                                return;
                                              }
                                              if (target) {
                                                const rect =
                                                  target.getBoundingClientRect();
                                                const viewportHeight =
                                                  window.innerHeight;
                                                const menuHeight = 200;
                                                const spaceBelow =
                                                  viewportHeight - rect.top;
                                                const shouldOpenUpward =
                                                  spaceBelow < menuHeight + 50;
                                                setItemMenuOpensUpward(
                                                  shouldOpenUpward
                                                );
                                                setItemMenuPos({
                                                  left: Math.round(rect.right + 8),
                                                  top: shouldOpenUpward
                                                    ? Math.round(rect.top - 10)
                                                    : Math.round(
                                                        rect.top +
                                                          rect.height / 2
                                                      ),
                                                });
                                              }
                                              setItemMenuCategoryOpenFor(null);
                                              setItemMenuId(h.id);
                                            }}
                                            className="absolute top-2 right-2 inline-flex items-center justify-center h-6 w-6 rounded hover:bg-surface/70"
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
                                                onClick={(e) =>
                                                  e.stopPropagation()
                                                }
                                                style={{
                                                  position: "fixed",
                                                  left: itemMenuPos.left,
                                                  top: itemMenuPos.top,
                                                  transform: itemMenuOpensUpward
                                                    ? "translateY(-100%)"
                                                    : "translateY(-10%)",
                                                }}
                                                className="z-[10000] w-44 rounded-lg border border-border bg-surface/95 text-foreground backdrop-blur shadow-lg p-2"
                                              >
                                                <button
                                                  type="button"
                                                  onClick={async (e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setItemMenuId(null);
                                                    setItemMenuOpensUpward(
                                                      false
                                                    );
                                                    setItemMenuPos(null);
                                                    await shareHistoryItem(
                                                      prettyHref
                                                    );
                                                  }}
                                                  className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-foreground hover:bg-foreground/10"
                                                >
                                                  <svg
                                                    viewBox="0 0 25.274 25.274"
                                                    fill="currentColor"
                                                    className="h-4 w-4"
                                                    aria-hidden="true"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                  >
                                                    <path d="M24.989,15.893c-0.731-0.943-3.229-3.73-4.34-4.96c0.603-0.77,0.967-1.733,0.967-2.787c0-2.503-2.03-4.534-4.533-4.534 c-2.507,0-4.534,2.031-4.534,4.534c0,1.175,0.455,2.24,1.183,3.045l-1.384,1.748c-0.687-0.772-1.354-1.513-1.792-2.006 c0.601-0.77,0.966-1.733,0.966-2.787c-0.001-2.504-2.03-4.535-4.536-4.535c-2.507,0-4.536,2.031-4.536,4.534 c0,1.175,0.454,2.24,1.188,3.045L0.18,15.553c0,0-0.406,1.084,0,1.424c0.36,0.3,0.887,0.81,1.878,0.258 c-0.107,0.974-0.054,2.214,0.693,2.924c0,0,0.749,1.213,2.65,1.456c0,0,2.1,0.244,4.543-0.367c0,0,1.691-0.312,2.431-1.794 c0.113,0.263,0.266,0.505,0.474,0.705c0,0,0.751,1.213,2.649,1.456c0,0,2.103,0.244,4.54-0.367c0,0,2.102-0.38,2.65-2.339 c0.297-0.004,0.663-0.097,1.149-0.374C24.244,18.198,25.937,17.111,24.989,15.893z M13.671,8.145c0-1.883,1.527-3.409,3.409-3.409 c1.884,0,3.414,1.526,3.414,3.409c0,1.884-1.53,3.411-3.414,3.411C15.198,11.556,13.671,10.029,13.671,8.145z M13.376,12.348 l0.216,0.516c0,0-0.155,0.466-0.363,1.069c-0.194-0.217-0.388-0.437-0.585-0.661L13.376,12.348z M3.576,8.145 c0-1.883,1.525-3.409,3.41-3.409c1.881,0,3.408,1.526,3.408,3.409c0,1.884-1.527,3.411-3.408,3.411 C5.102,11.556,3.576,10.029,3.576,8.145z M2.186,16.398c-0.033,0.07-0.065,0.133-0.091,0.177c-0.801,0.605-1.188,0.216-1.449,0 c-0.259-0.216,0-0.906,0-0.906l2.636-3.321l0.212,0.516c0,0-0.227,0.682-0.503,1.47l-0.665,1.49 C2.325,15.824,2.257,16.049,2.186,16.398z M9.299,20.361c-2.022,0.507-3.758,0.304-3.758,0.304 c-1.574-0.201-2.196-1.204-2.196-1.204c-1.121-1.066-0.348-3.585-0.348-3.585l1.699-3.823c0.671,0.396,1.451,0.627,2.29,0.627 c0.584,0,1.141-0.114,1.656-0.316l2.954,5.417C11.482,19.968,9.299,20.361,9.299,20.361z M9.792,12.758l0.885-0.66 c0,0,2.562,2.827,3.181,3.623c0.617,0.794-0.49,1.501-0.75,1.723c-0.259,0.147-0.464,0.206-0.635,0.226L9.792,12.758z M19.394,20.361c-2.018,0.507-3.758,0.304-3.758,0.304c-1.569-0.201-2.191-1.204-2.191-1.204c-0.182-0.175-0.311-0.389-0.403-0.624 c0.201-0.055,0.433-0.15,0.698-0.301c0.405-0.337,2.102-1.424,1.154-2.643c-0.24-0.308-0.678-0.821-1.184-1.405l1.08-2.435 c0.674,0.396,1.457,0.627,2.293,0.627c0.585,0,1.144-0.114,1.654-0.316l2.955,5.417C21.582,19.968,19.394,20.361,19.394,20.361z M23.201,17.444c-0.255,0.147-0.461,0.206-0.63,0.226l-2.68-4.912l0.879-0.66c0,0,2.562,2.827,3.181,3.623 C24.57,16.516,23.466,17.223,23.201,17.444z"></path>
                                                  </svg>
                                                  <span className="text-sm">
                                                    Delete
                                                  </span>
                                                </button>
                                              </div>,
                                              document.body
                                            )}
                                        </div>
                                        {categoryAdIndex !== null &&
                                        categoryAdIndex === index ? (
                                          <SidebarAdUnit />
                                        ) : null}
                                      </Fragment>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ) : null}

                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
            <div className="border-t border-border mx-2 my-3" />
            <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur border-b border-border/50 pb-1 mb-2">
              <div className="px-2 py-1 text-xs uppercase tracking-wide text-foreground/60">
                Recent Snapped
              </div>
            </div>
            <nav className="space-y-1">
              {history.length === 0 && (
                <div className="px-2 py-2 text-foreground/60 text-sm">
                  No history yet
                </div>
              )}
              {history.map((h, index) => {
                const slug = (h.title || "")
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-+|-+$/g, "");
                const prettyHref = `/event/${slug}-${h.id}`;
                const category = (h as any)?.data?.category as string | null;
                const isShared = Boolean(
                  (h as any)?.data?.shared ||
                    (h as any)?.data?.sharedOut ||
                    (h as any)?.data?.category === "Shared events"
                );
                const rowAndBadge = (() => {
                  if (isShared) {
                    return {
                      row: `${sharedGradientRowClass()} ${sharedTextClass}`,
                      badge: `bg-surface/60 ${sharedMutedTextClass} border-border`,
                    };
                  }
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
                const categoryMenuOpen = itemMenuCategoryOpenFor === h.id;
                return (
                  <Fragment key={h.id}>
                    <div
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
                      <div
                        className={`text-xs ${
                          isShared ? sharedMutedTextClass : "text-foreground/60"
                        }`}
                      >
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
                          setItemMenuOpensUpward(false);
                          setItemMenuPos(null);
                          setItemMenuOpensUpward(false);
                          setItemMenuCategoryOpenFor(null);
                          return;
                        }
                        if (target) {
                          const rect = target.getBoundingClientRect();
                          const viewportHeight = window.innerHeight;
                          const menuHeight = 280; // Increased height for expanded menu with categories
                          const spaceBelow = viewportHeight - rect.top;
                          const spaceAbove = rect.top;

                          // Open upward if there's not enough space below (with buffer) or if we're in bottom half of screen
                          const shouldOpenUpward = spaceBelow < menuHeight + 50; // Only open upward if not enough space below
                          setItemMenuOpensUpward(shouldOpenUpward);

                          setItemMenuPos({
                            left: Math.round(rect.right + 8),
                            top: shouldOpenUpward
                              ? Math.round(rect.top - 10) // Just 10px above the item
                              : Math.round(rect.top + rect.height / 2),
                          });
                        }
                        setItemMenuCategoryOpenFor(null);
                        setItemMenuId(h.id);
                      }}
                      className="absolute top-2 right-2 inline-flex items-center justify-center h-6 w-6 rounded hover:bg-surface/70"
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
                            transform: itemMenuOpensUpward
                              ? "translateY(-100%)"
                              : "translateY(-10%)",
                          }}
                          className="z-[10000] w-44 rounded-lg border border-border bg-surface/95 text-foreground backdrop-blur shadow-lg p-2"
                        >
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setItemMenuCategoryOpenFor(null);
                              setItemMenuId(null);
                              setItemMenuOpensUpward(false);
                              setItemMenuPos(null);
                              await shareHistoryItem(prettyHref);
                            }}
                            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-foreground hover:bg-foreground/10"
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
                              setItemMenuCategoryOpenFor(null);
                              setItemMenuId(null);
                              setItemMenuOpensUpward(false);
                              setItemMenuPos(null);
                              await renameHistoryItem(h.id, h.title);
                            }}
                            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-foreground hover:bg-foreground/10"
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
                          <button
                            type="button"
                            aria-expanded={categoryMenuOpen}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setItemMenuCategoryOpenFor(
                                categoryMenuOpen ? null : h.id
                              );
                            }}
                            className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-foreground hover:bg-foreground/10"
                          >
                            <span className="inline-flex items-center gap-3">
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
                                <path d="M4 6h16" />
                                <path d="M7 12h13" />
                                <path d="M10 18h10" />
                              </svg>
                              <span className="text-sm">Change to</span>
                            </span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={`h-3.5 w-3.5 transition-transform ${
                                categoryMenuOpen ? "rotate-90" : ""
                              }`}
                              aria-hidden="true"
                            >
                              <path d="m9 6 6 6-6 6" />
                            </svg>
                          </button>
                          {categoryMenuOpen && (
                            <div className="mt-1 space-y-1 rounded-md border border-border/60 bg-surface/80 p-1.5 min-w-[180px]">
                              {CATEGORY_OPTIONS.map((label) => {
                                const isActive = category === label;
                                return (
                                  <button
                                    key={label}
                                    type="button"
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setItemMenuCategoryOpenFor(null);
                                      setItemMenuId(null);
                                      setItemMenuOpensUpward(false);
                                      setItemMenuPos(null);
                                      try {
                                        await fetch(`/api/history/${h.id}`, {
                                          method: "PATCH",
                                          headers: {
                                            "content-type": "application/json",
                                          },
                                          body: JSON.stringify({
                                            category: label,
                                          }),
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
                                          const next = {
                                            ...prev,
                                          } as Record<string, string>;
                                          if (!next[label])
                                            next[label] =
                                              defaultCategoryColor(label);
                                          return next;
                                        });
                                      } catch {}
                                    }}
                                    className={`flex w-full items-center gap-3 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                                      isActive
                                        ? "bg-foreground/10 text-foreground"
                                        : "text-foreground/80 hover:bg-foreground/10 hover:text-foreground"
                                    }`}
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className={`h-4 w-4 ${
                                        isActive ? "" : "opacity-40"
                                      }`}
                                      aria-hidden="true"
                                    >
                                      <path d="M20 6L9 17l-5-5" />
                                    </svg>
                                    <span className="text-sm">{label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          <div className="my-1 h-px bg-border" />
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setItemMenuCategoryOpenFor(null);
                              setItemMenuId(null);
                              setItemMenuOpensUpward(false);
                              setItemMenuPos(null);
                              await deleteHistoryItem(h.id, h.title);
                            }}
                            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-red-500 hover:bg-red-500/10"
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
                            <span className="hidden sm:inline text-sm">
                              Delete
                            </span>
                          </button>
                        </div>,
                        document.body
                      )}
                    {Boolean(
                      (h as any)?.data &&
                        (((h as any).data.shared as any) ||
                          ((h as any).data.sharedOut as any))
                    ) && (
                      <svg
                        viewBox="0 0 25.274 25.274"
                        fill="currentColor"
                        className="h-3.5 w-3.5 text-zinc-900 dark:text-foreground absolute right-2 bottom-2"
                        aria-hidden="true"
                        aria-label="Shared event"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <title>Shared event</title>
                        <path d="M24.989,15.893c-0.731-0.943-3.229-3.73-4.34-4.96c0.603-0.77,0.967-1.733,0.967-2.787c0-2.503-2.03-4.534-4.533-4.534 c-2.507,0-4.534,2.031-4.534,4.534c0,1.175,0.455,2.24,1.183,3.045l-1.384,1.748c-0.687-0.772-1.354-1.513-1.792-2.006 c0.601-0.77,0.966-1.733,0.966-2.787c-0.001-2.504-2.03-4.535-4.536-4.535c-2.507,0-4.536,2.031-4.536,4.534 c0,1.175,0.454,2.24,1.188,3.045L0.18,15.553c0,0-0.406,1.084,0,1.424c0.36,0.3,0.887,0.81,1.878,0.258 c-0.107,0.974-0.054,2.214,0.693,2.924c0,0,0.749,1.213,2.65,1.456c0,0,2.1,0.244,4.543-0.367c0,0,1.691-0.312,2.431-1.794 c0.113,0.263,0.266,0.505,0.474,0.705c0,0,0.751,1.213,2.649,1.456c0,0,2.103,0.244,4.54-0.367c0,0,2.102-0.38,2.65-2.339 c0.297-0.004,0.663-0.097,1.149-0.374C24.244,18.198,25.937,17.111,24.989,15.893z M13.671,8.145c0-1.883,1.527-3.409,3.409-3.409 c1.884,0,3.414,1.526,3.414,3.409c0,1.884-1.53,3.411-3.414,3.411C15.198,11.556,13.671,10.029,13.671,8.145z M13.376,12.348 l0.216,0.516c0,0-0.155,0.466-0.363,1.069c-0.194-0.217-0.388-0.437-0.585-0.661L13.376,12.348z M3.576,8.145 c0-1.883,1.525-3.409,3.41-3.409c1.881,0,3.408,1.526,3.408,3.409c0,1.884-1.527,3.411-3.408,3.411 C5.102,11.556,3.576,10.029,3.576,8.145z M2.186,16.398c-0.033,0.07-0.065,0.133-0.091,0.177c-0.801,0.605-1.188,0.216-1.449,0 c-0.259-0.216,0-0.906,0-0.906l2.636-3.321l0.212,0.516c0,0-0.227,0.682-0.503,1.47l-0.665,1.49 C2.325,15.824,2.257,16.049,2.186,16.398z M9.299,20.361c-2.022,0.507-3.758,0.304-3.758,0.304 c-1.574-0.201-2.196-1.204-2.196-1.204c-1.121-1.066-0.348-3.585-0.348-3.585l1.699-3.823c0.671,0.396,1.451,0.627,2.29,0.627 c0.584,0,1.141-0.114,1.656-0.316l2.954,5.417C11.482,19.968,9.299,20.361,9.299,20.361z M9.792,12.758l0.885-0.66 c0,0,2.562,2.827,3.181,3.623c0.617,0.794-0.49,1.501-0.75,1.723c-0.259,0.147-0.464,0.206-0.635,0.226L9.792,12.758z M19.394,20.361c-2.018,0.507-3.758,0.304-3.758,0.304c-1.569-0.201-2.191-1.204-2.191-1.204c-0.182-0.175-0.311-0.389-0.403-0.624 c0.201-0.055,0.433-0.15,0.698-0.301c0.405-0.337,2.102-1.424,1.154-2.643c-0.24-0.308-0.678-0.821-1.184-1.405l1.08-2.435 c0.674,0.396,1.457,0.627,2.293,0.627c0.585,0,1.144-0.114,1.654-0.316l2.955,5.417C21.582,19.968,19.394,20.361,19.394,20.361z M23.201,17.444c-0.255,0.147-0.461,0.206-0.63,0.226l-2.68-4.912l0.879-0.66c0,0,2.562,2.827,3.181,3.623 C24.57,16.516,23.466,17.223,23.201,17.444z"></path>
                      </svg>
                    )}
                  </div>
                  {recentAdIndex !== null && index === recentAdIndex ? (
                    <SidebarAdUnit />
                  ) : null}
                </Fragment>
              );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom: User button with dropdown */}
        <div className="border-t border-border py-2 px-3">
          <div className="relative z-[900]">
            <button
              ref={buttonRef}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => {
                  const next = !v;
                  setSettingsOpen(false);
                  setSettingsOpenFloating(false);
                  return next;
                });
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              aria-expanded={menuOpen}
              className="w-full inline-flex items-center justify-between gap-3 px-3 py-1.5 rounded-md text-foreground/90 transition-colors duration-150 hover:text-foreground hover:bg-surface/70 active:bg-surface/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <div className="min-w-0 flex-1 inline-flex items-center gap-2">
                <div className="min-w-0 flex-1 text-left">
                  {subscriptionPlan === "FF" && (
                    <div className="mb-1">
                      <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-amber-500 to-yellow-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                        ⭐ Lifetime
                      </span>
                    </div>
                  )}
                  <div className="truncate text-sm font-medium">
                    {displayName}
                  </div>
                  {userEmail && (
                    <div className="truncate text-xs text-foreground/60">
                      {userEmail}
                    </div>
                  )}
                </div>
                {showCreditsShell && creditsAreKnown && (
                  <span className="shrink-0 inline-flex items-center rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {creditsValue}
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
              <div className="pointer-events-none absolute bottom-full right-0 mb-3 z-[1000]">
                <div
                  ref={menuRef}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="pointer-events-auto w-45 rounded-xl border border-border bg-surface/95 backdrop-blur shadow-2xl overflow-visible"
                >
                  <div className="p-2">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setSettingsOpen((v) => {
                            const next = !v;
                            return next;
                          });
                        }}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-foreground/90 hover:text-foreground hover:bg-surface"
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
                            aria-hidden="true"
                          >
                            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0A1.65 1.65 0 0 0 9 3.09V3a2 2 0 1 1 4 0v.09c0 .66.39 1.26 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.47.47-.61 1.17-.33 1.78h0A1.65 1.65 0 0 0 20.91 12H21a2 2 0 1 1 0 4h-.09c-.66 0-1.26.39-1.51 1z" />
                          </svg>
                          <span className="text-sm">Settings</span>
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
                            settingsOpen ? "rotate-0" : "rotate-90"
                          }`}
                          aria-hidden="true"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>

                      {settingsOpen && (
                        <div className="absolute top-1/2 left-full ml-2 -translate-y-1/2 w-40 rounded-lg border border-border bg-surface/95 backdrop-blur shadow-2xl p-2 z-[1100]">
                          <Link
                            href="/settings"
                            onClick={() => {
                              setMenuOpen(false);
                              setSettingsOpen(false);
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
                              <circle cx="12" cy="7" r="4" />
                              <path d="M5.5 21v-2a6.5 6.5 0 0 1 13 0v2" />
                            </svg>
                            <span className="text-sm">Profile</span>
                          </Link>

                          <Link
                            href="/subscription"
                            onClick={() => {
                              setMenuOpen(false);
                              setSettingsOpen(false);
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
                                x="2"
                                y="5"
                                width="20"
                                height="14"
                                rx="2"
                                ry="2"
                              />
                              <line x1="2" y1="10" x2="22" y2="10" />
                              <line x1="7" y1="15" x2="7.01" y2="15" />
                              <line x1="11" y1="15" x2="13" y2="15" />
                            </svg>
                            <span className="text-sm">Subscription</span>
                          </Link>
                        </div>
                      )}
                    </div>

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

                    <Link
                      href="/about"
                      onClick={() => {
                        setMenuOpen(false);
                        setSettingsOpen(false);
                      }}
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
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      <span className="text-sm">About us</span>
                    </Link>

                    <Link
                      href="/contact"
                      onClick={() => {
                        setMenuOpen(false);
                        setSettingsOpen(false);
                      }}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-foreground/90 hover:text-foreground hover:bg-surface"
                    >
                      <svg
                        fill="currentColor"
                        viewBox="0 0 492.014 492.014"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <path d="M339.277,459.566H34.922V32.446h304.354v105.873l32.446-32.447V16.223C371.723,7.264,364.458,0,355.5,0 H18.699C9.739,0,2.473,7.264,2.473,16.223v459.568c0,8.959,7.265,16.223,16.226,16.223H355.5c8.958,0,16.223-7.264,16.223-16.223 V297.268l-32.446,32.447V459.566z" />
                        <path d="M291.446,71.359H82.751c-6.843,0-12.396,5.553-12.396,12.398c0,6.844,5.553,12.397,12.396,12.397h208.694 c6.845,0,12.397-5.553,12.397-12.397C303.843,76.912,298.29,71.359,291.446,71.359z" />
                        <path d="M303.843,149.876c0-6.844-5.553-12.398-12.397-12.398H82.751c-6.843,0-12.396,5.554-12.396,12.398 c0,6.845,5.553,12.398,12.396,12.398h208.694C298.29,162.274,303.843,156.722,303.843,149.876z" />
                        <path d="M274.004,203.6H82.751c-6.843,0-12.396,5.554-12.396,12.398c0,6.845,5.553,12.397,12.396,12.397h166.457 L274.004,203.6z" />
                        <path d="M204.655,285.79c1.678-5.618,4.076-11.001,6.997-16.07h-128.9c-6.843,0-12.396,5.553-12.396,12.398 c0,6.844,5.553,12.398,12.396,12.398h119.304L204.655,285.79z" />
                        <path d="M82.751,335.842c-6.843,0-12.396,5.553-12.396,12.398c0,6.843,5.553,12.397,12.396,12.397h108.9 c-3.213-7.796-4.044-16.409-1.775-24.795H82.751z" />
                        <path d="M479.403,93.903c-6.496-6.499-15.304-10.146-24.48-10.146c-9.176,0-17.982,3.647-24.471,10.138 L247.036,277.316c-5.005,5.003-8.676,11.162-10.703,17.942l-14.616,48.994c-0.622,2.074-0.057,4.318,1.477,5.852 c1.122,1.123,2.624,1.727,4.164,1.727c0.558,0,1.13-0.08,1.688-0.249l48.991-14.618c6.782-2.026,12.941-5.699,17.943-10.702 l183.422-183.414c6.489-6.49,10.138-15.295,10.138-24.472C489.54,109.197,485.892,100.392,479.403,93.903z" />
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
            {colorMenuFor === "Shared events" ? (
              <div className="grid grid-cols-4 gap-2 px-2 pb-2 pt-2 mt-1 place-items-center">
                {SHARED_GRADIENTS.map((g) => {
                  const selected = getSharedGradientId() === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      className={`h-6 w-6 rounded-[5px] border-0 ${g.swatch} ${
                        selected ? "ring-2 ring-foreground/80" : ""
                      }`}
                      aria-label={`Choose gradient`}
                      title={g.id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCategoryColor("Shared events", g.id);
                      }}
                    />
                  );
                })}
              </div>
            ) : (
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
            )}
          </div>,
          document.body
        )}
    </>
  );
}
