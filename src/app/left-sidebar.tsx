"use client";
import Link from "next/link";
import Image from "next/image";
import {
  readProfileCache,
  writeProfileCache,
  clearProfileCache,
  PROFILE_CACHE_TTL_MS,
} from "@/utils/profileCache";
import { usePathname, useRouter } from "next/navigation";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "./providers";
import { useSidebar } from "./sidebar-context";
import { signOut, useSession } from "next-auth/react";
import {
  CalendarIconGoogle,
  CalendarIconOutlook,
  CalendarIconApple,
} from "@/components/CalendarIcons";
import {
  TEMPLATE_LINKS,
  NAV_LINKS,
  useUnifiedMenu,
} from "@/components/navigation/TopNav";
import { CREATE_EVENT_SECTIONS } from "@/config/navigation-config";
import {
  Baby,
  Cake,
  CalendarDays,
  Camera,
  Dumbbell,
  FileEdit,
  Footprints,
  GraduationCap,
  Home,
  ChevronLeft,
  ChevronRight,
  Heart,
  Settings,
  Menu,
  Music,
  PartyPopper,
  Plus,
  Sparkles,
  Stethoscope,
  Trophy,
  Upload,
  User,
  LogOut,
  X,
} from "lucide-react";
import { useEventCategories } from "@/hooks/useEventCategories";

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

const CATEGORY_DEFAULT_COLOR_MAP: Record<string, string> = {
  Birthdays: "pink",
  Weddings: "purple",
  "Baby Showers": "fuchsia",
  "DR Appointments": "red",
  Appointments: "amber",
  "Sport Events": "indigo",
  "General Events": "orange",
  "Car Pool": "cyan",
  "Play Days": "lime",
  "Doctor Appointments": "rose",
  Meetings: "sky",
  Education: "teal",
  Concerts: "blue",
  Family: "emerald",
  Healthcare: "green",
  Gymnastics: "violet",
  "Football Season": "green",
  Cheerleading: "amber",
  "Dance / Ballet": "slate",
  "Workshop / Class": "teal",
  "Gender Reveal": "fuchsia",
  "General Event": "orange",
  Soccer: "cyan",
};

const CATEGORY_FALLBACK_COLORS = [
  "stone",
  "gray",
  "zinc",
  "neutral",
  "slate",
  "yellow",
  "lime",
  "cyan",
  "sky",
  "teal",
  "emerald",
  "blue",
  "indigo",
  "violet",
  "purple",
  "pink",
  "fuchsia",
  "red",
  "orange",
  "amber",
];

const CREATE_SECTION_COLORS = [
  "bg-blue-100 text-blue-600",
  "bg-pink-100 text-pink-600",
  "bg-orange-100 text-orange-600",
  "bg-purple-100 text-purple-600",
];

const ICON_LOOKUP: Record<string, any> = {
  "Snap Event": Camera,
  "Upload Event": Upload,
  "Smart sign-up forms": FileEdit,
  Birthdays: Cake,
  Weddings: Heart,
  "Baby Showers": Baby,
  "Gender Reveal": PartyPopper,
  "Football Season": Trophy,
  "Sport Football Season": Trophy,
  "General Event": CalendarDays,
  "Gymnastics Schedule": Dumbbell,
  Gymnastics: Dumbbell,
  Cheerleading: Sparkles,
  "Dance / Ballet": Footprints,
  Soccer: Trophy,
  "Sport Events": Trophy,
  "Doctor Appointments": Stethoscope,
  "Workshops / Classes": GraduationCap,
  "Workshop / Class": GraduationCap,
  "General Events": CalendarDays,
  "Special Events": Music,
};

// TEMPLATE_LINKS now imported from TopNav.tsx (shared menu)

const SIDEBAR_GRADIENT =
  "linear-gradient(180deg, rgba(252,248,255,0.98) 0%, rgba(242,244,255,0.95) 50%, rgba(236,248,255,0.92) 100%)";
const SIDEBAR_CARD_CLASS =
  "rounded-3xl border border-white/60 bg-white/80 shadow-[0_25px_60px_rgba(101,67,145,0.18)] backdrop-blur-2xl";
const SIDEBAR_ITEM_CARD_CLASS =
  "rounded-2xl border border-white/60 bg-white/80 shadow-[0_18px_40px_rgba(81,54,123,0.15)] backdrop-blur-xl transition hover:shadow-[0_22px_55px_rgba(81,54,123,0.25)] hover:-translate-y-0.5";
const SIDEBAR_TAG_CLASS =
  "inline-flex items-center justify-center rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[10px] md:text-xs md:text-sm font-semibold tracking-[0.4em] text-[#a08ac6]";
const SIDEBAR_PRIMARY_PILL_CLASS =
  "inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#8468ff] via-[#a66cff] to-[#ff9ad5] px-4 py-2 text-sm md:text-base font-semibold text-white shadow-[0_18px_38px_rgba(132,104,255,0.55)] transition hover:shadow-[0_22px_48px_rgba(132,104,255,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80";
const SIDEBAR_SECONDARY_PILL_CLASS =
  "inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/70 bg-white/85 px-4 py-2 text-sm md:text-base font-semibold text-[#5b3d73] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6c5ff]";
const SIDEBAR_BADGE_CLASS =
  "inline-flex items-center rounded-full border border-white/70 bg-white/90 px-2 py-0.5 text-[11px] md:text-xs md:text-sm font-semibold text-[#6a4a83] shadow-inner";
const SIDEBAR_WIDTH_REM = "20rem";
const SIDEBAR_COLLAPSED_REM = "4.5rem";

export default function LeftSidebar() {
  const { data: session, status } = useSession();
  const profileEmail = (session?.user as any)?.email?.toLowerCase?.() ?? null;
  const profileEmailRef = useRef<string | null>(null);
  useEffect(() => {
    if (profileEmail) {
      profileEmailRef.current = profileEmail;
    }
  }, [profileEmail]);
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  // When building a Smart sign-up, hide Rename/Change actions to avoid confusing edits
  const hideRenameAndChange = (() => {
    try {
      const p = String(pathname || "");
      return (
        p.startsWith("/smart-signup-form") || p.startsWith("/templates/signup")
      );
    } catch {
      return false;
    }
  })();
  const [myEventsOpen, setMyEventsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [calendarsOpenFloating, setCalendarsOpenFloating] = useState(false);
  const [adminOpenFloating, setAdminOpenFloating] = useState(false);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [connectedCalendars, setConnectedCalendars] = useState<{
    google: boolean;
    microsoft: boolean;
    apple: boolean;
  }>({
    google: false,
    microsoft: false,
    apple: false,
  });

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
            "/api/google/auth?source=sidebar",
            "_blank",
            "noopener,noreferrer"
          );
        } else if (provider === "microsoft") {
          window.open(
            "/api/outlook/auth?source=sidebar",
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
  const [itemMenuId, setItemMenuId] = useState<string | null>(null);
  const [itemMenuPos, setItemMenuPos] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const [itemMenuOpensUpward, setItemMenuOpensUpward] = useState(false);
  const [itemMenuCategoryOpenFor, setItemMenuCategoryOpenFor] = useState<
    string | null
  >(null);
  const [itemMenuScope, setItemMenuScope] = useState<string | null>(null);

  const { isCollapsed, setIsCollapsed, toggleSidebar } = useSidebar();
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(min-width: 1024px)").matches;
  });
  const isOpen = isDesktop ? true : !isCollapsed;
  const isCompact = isDesktop && isCollapsed;
  const sidebarWidth = isDesktop
    ? isCollapsed
      ? SIDEBAR_COLLAPSED_REM
      : SIDEBAR_WIDTH_REM
    : SIDEBAR_WIDTH_REM;
  const sidebarTransform = isDesktop
    ? "translateX(0)"
    : isOpen
    ? "translateX(0)"
    : "translateX(-100%)";
  const pointerClass = isDesktop
    ? "pointer-events-auto"
    : isOpen
    ? "pointer-events-auto"
    : "pointer-events-none";
  const overflowClass = isCompact
    ? "overflow-hidden"
    : isDesktop || isOpen
    ? "overflow-visible"
    : "overflow-hidden";
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const openButtonRef = useRef<HTMLButtonElement | null>(null);
  const asideRef = useRef<HTMLDivElement | null>(null);
  const categoriesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(min-width: 1024px)");
    const update = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsDesktop(event.matches);
    };
    update(mql);
    const handler = (event: MediaQueryListEvent) => update(event);
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handler);
    } else if (typeof mql.addListener === "function") {
      mql.addListener(handler);
    }
    return () => {
      if (typeof mql.removeEventListener === "function") {
        mql.removeEventListener("change", handler);
      } else if (typeof mql.removeListener === "function") {
        mql.removeListener(handler);
      }
    };
  }, []);
  useEffect(() => {
    if (!isOpen) {
      setMenuOpen(false);
    }
  }, [isOpen]);

  // Fetch connected calendars status
  useEffect(() => {
    if (status === "authenticated") {
      fetchConnectedCalendars();
    }
  }, [status, fetchConnectedCalendars]);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

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
        setCreateEventOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    };
    // Use capture phase so it still triggers if inner handlers stop propagation
    document.addEventListener("pointerdown", onOutside, true);
    document.addEventListener("mousedown", onOutside, true);
    // Mark touchstart as passive so Safari can keep edge-swipe back navigation responsive
    document.addEventListener("touchstart", onOutside as any, {
      capture: true,
      passive: true,
    });
    document.addEventListener("click", onOutside, true);
    document.addEventListener("focusin", onOutside, true);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("pointerdown", onOutside, true);
      document.removeEventListener("mousedown", onOutside, true);
      document.removeEventListener("touchstart", onOutside as any, {
        capture: true,
      });
      document.removeEventListener("click", onOutside, true);
      document.removeEventListener("focusin", onOutside, true);
      document.removeEventListener("keydown", onEsc);
    };
  }, [menuOpen]);

  useEffect(() => {
    const onDocClick = (e: Event) => {
      try {
        const target = e.target as Element | null;
        // If click is inside the open item's container OR the menu popover itself, ignore
        const itemEl = target?.closest(
          "[data-history-item]"
        ) as HTMLElement | null;
        const inSameItem =
          itemEl && itemEl.getAttribute("data-history-item") === itemMenuId;
        const inMenuPopover = (target as HTMLElement | null)?.closest(
          "[data-popover=item-menu]"
        );
        if (inSameItem || inMenuPopover) return;
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
    "freemium" | "free" | "monthly" | "yearly" | "FF" | null
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
            p === "freemium" ||
            p === "free" ||
            p === "monthly" ||
            p === "yearly" ||
            p === "FF"
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

  // Stop showing credits in the UI
  const showCreditsShell = false;
  const creditsAreKnown =
    profileLoaded && typeof credits === "number" && credits >= 0;
  const creditsValue =
    typeof credits === "number" && credits >= 0 ? credits : 0;
  const shouldBlockNewSnap = () => false;
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
      router.push("/event/new");
    } catch {}
  };
  const handleSnapShortcutClick = (
    event: ReactMouseEvent<HTMLElement>,
    mode: "camera" | "upload"
  ) => {
    const win = window as any;
    const fn = mode === "camera" ? win.__openSnapCamera : win.__openSnapUpload;
    if (typeof fn === "function") {
      event.preventDefault();
      collapseSidebarOnTouch();
      try {
        fn();
      } catch {}
    } else {
      collapseSidebarOnTouch();
      triggerCreateEvent();
    }
  };

  const launchSnapFromMenu = (mode: "camera" | "upload") => {
    const win = window as any;
    const fn = mode === "camera" ? win.__openSnapCamera : win.__openSnapUpload;
    collapseSidebarOnTouch();
    setCreateEventOpen(false);
    try {
      if (typeof fn === "function") {
        fn();
        return;
      }
    } catch {}
    triggerCreateEvent();
  };

  const templateHrefMap = useMemo(() => {
    const map = new Map<string, string>();
    TEMPLATE_LINKS.forEach((t) => map.set(t.label, t.href));
    return map;
  }, []);

  const handleCreateModalSelect = (label: string, fallbackHref?: string) => {
    if (label === "Snap Event") {
      launchSnapFromMenu("camera");
      return;
    }
    if (label === "Upload Event") {
      launchSnapFromMenu("upload");
      return;
    }
    if (label === "Smart sign-up forms") {
      collapseSidebarOnTouch();
      setCreateEventOpen(false);
      router.push("/smart-signup-form");
      return;
    }
    const href = templateHrefMap.get(label) || fallbackHref;
    if (href) {
      collapseSidebarOnTouch();
      setCreateEventOpen(false);
      router.push(href);
      return;
    }
    setCreateEventOpen(false);
    triggerCreateEvent();
  };

  const createModalSections = CREATE_EVENT_SECTIONS.filter(
    (section) => section.title.toLowerCase() !== "quick access"
  ).map((section, idx) => ({
    title: section.title,
    items: section.items,
    color: CREATE_SECTION_COLORS[idx % CREATE_SECTION_COLORS.length],
  }));

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
  const smartSignupCount = useMemo(() => {
    const myEmail = profileEmail || profileEmailRef.current || null;
    const myUserId = ((session as any)?.user?.id as string | undefined) || null;
    return history.reduce((acc, row) => {
      if (!row || typeof row !== "object") return acc;
      const data: any = row?.data;
      if (!data || typeof data !== "object") return acc;
      const form = (data as any)?.signupForm;
      if (!form || typeof form !== "object") return acc;

      // If it's the owner's item (not marked shared), always count it as a created form
      if (!data.shared) return acc + 1;

      // For shared items, count only if the current user has an active (non-cancelled) response
      const responses: any[] = Array.isArray(form.responses)
        ? form.responses
        : [];
      const hasMyActiveResponse = responses.some((r) => {
        if (!r || typeof r !== "object") return false;
        if (String(r.status || "").toLowerCase() === "cancelled") return false;
        const emailMatches =
          myEmail &&
          typeof r.email === "string" &&
          r.email.toLowerCase() === myEmail;
        const userIdMatches =
          myUserId && typeof r.userId === "string" && r.userId === myUserId;
        return Boolean(emailMatches || userIdMatches);
      });
      if (hasMyActiveResponse) return acc + 1;
      return acc;
    }, 0);
  }, [history, profileEmail, session]);
  const compactNavItems = useMemo(
    () => [
      { icon: Camera, label: "Snap", action: "snap" },
      { icon: Upload, label: "Upload", action: "upload" },
      { icon: Home, label: "Home", href: "/" },
      { icon: Plus, label: "Create Event", action: "create" },
      {
        icon: FileEdit,
        label: "Smart sign-up",
        href: "/smart-signup-form",
        badge: smartSignupCount,
      },
      { icon: CalendarDays, label: "Calendar", href: "/calendar" },
      {
        icon: Trophy,
        label: "My Events",
        href: "/history",
        badge: createdEventsCount,
      },
      { icon: User, label: "Profile", href: "/profile" },
      { icon: Settings, label: "Settings", href: "/settings" },
    ],
    [createdEventsCount, smartSignupCount]
  );
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>(
    {}
  );
  // Per Smart sign-up item gradient selections (keyed by history id)
  const [signupItemColors, setSignupItemColors] = useState<
    Record<string, string>
  >({});
  const [colorMenuFor, setColorMenuFor] = useState<string | null>(null);
  const [colorMenuPos, setColorMenuPos] = useState<{
    left: number;
    top: number;
  } | null>(null);

  const defaultCategoryColor = (c: string): string => {
    const trimmed = String(c || "").trim();
    if (!trimmed) return "gray";
    const preset = CATEGORY_DEFAULT_COLOR_MAP[trimmed];
    if (preset) return preset;
    const hash = trimmed
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return CATEGORY_FALLBACK_COLORS[hash % CATEGORY_FALLBACK_COLORS.length];
  };

  const CATEGORY_LABEL_OVERRIDES: Record<string, string> = {
    "sport_football_season": "Football Season",
    "sport football season": "Football Season",
    "football season": "Football Season",
    "sport_gymnastics_schedule": "Gymnastics",
    "sport_gymnastics": "Gymnastics",
    "gymnastics schedule": "Gymnastics",
    "sport_cheerleading": "Cheerleading",
    "sport cheerleading": "Cheerleading",
    "sport_dance_ballet": "Dance / Ballet",
    "sport dance ballet": "Dance / Ballet",
    "sport_soccer": "Soccer",
    "sport soccer": "Soccer",
    "sport_event": "Sport Event",
    "sport events": "Sport Events",
    "general_event": "General Event",
    "workshop_class": "Workshop / Class",
    "gender_reveal": "Gender Reveal",
    "dr_appointment": "Doctor Appointments",
    "doctor_appointment": "Doctor Appointments",
    "special_event": "Special Events",
  };

  const titleCase = (phrase: string) =>
    phrase
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  // Normalize freeform/variant labels to our canonical sidebar categories
  const normalizeCategoryLabel = (
    raw: string | null | undefined
  ): string | null => {
    const s = String(raw || "").trim();
    if (!s) return null;
    const deslugged = s.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
    const l = deslugged.toLowerCase();

    const override = CATEGORY_LABEL_OVERRIDES[l];
    if (override) return override;
    // Weddings
    if (/^wedding(s)?$/.test(l)) return "Weddings";
    // Birthdays
    if (/^birthday(s)?$/.test(l) || /birthday\s*party/.test(l))
      return "Birthdays";
    // Baby Showers
    if (/^baby\s*shower(s)?$/.test(l) || /\bbaby[-\s]?shower(s)?\b/.test(l))
      return "Baby Showers";
    // Gender Reveal
    if (/gender\s*reveal/.test(l)) return "Gender Reveal";
    // Doctor Appointments (medical)
    if (
      /^(doctor|dr|medical|dental)\s*appointment(s)?$/.test(l) ||
      /\b(doctor|dr|medical|dental)\b.*\bappointment(s)?\b/.test(l)
    )
      return "Doctor Appointments";
    // Generic appointments
    if (/^appointment(s)?$/.test(l)) return "Appointments";
    // Gymnastics
    if (/gymnastic(s)?/.test(l)) return "Gymnastics";
    // Football Season
    if (/football\s+season/.test(l)) return "Football Season";
    // Cheer / Dance / Soccer variants
    if (/cheerleading|cheer leader|cheer\b/.test(l)) return "Cheerleading";
    if (/dance|ballet/.test(l)) return "Dance / Ballet";
    if (/soccer/.test(l)) return "Soccer";
    // Sports/Games
    if (
      /^sport(s)?\s*event(s)?$/.test(l) ||
      /\b(sport|game|tournament|match)\b/.test(l)
    )
      return "Sport Events";
    // Workshops / Classes
    if (/workshop|class/.test(l)) return "Workshop / Class";
    // Play Days
    if (/^play\s*day(s)?$/.test(l) || /playdate(s)?/.test(l))
      return "Play Days";
    // Car Pool
    if (/car\s*pool|carpool/.test(l)) return "Car Pool";
    // General
    if (/^general(\s*events?)?$/.test(l)) return "General Events";
    // Fallback: title case the deslugged string (covers new categories)
    return titleCase(deslugged);
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
    try {
      const rawItems = localStorage.getItem("signupItemColors");
      if (rawItems) {
        const parsed = JSON.parse(rawItems);
        if (parsed && typeof parsed === "object") setSignupItemColors(parsed);
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
        // Do not collapse when clicking anywhere inside the sidebar (including Smart sign-up section)
        if (asideRef.current && asideRef.current.contains(target)) {
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

  // Smart sign-up gradient palette — reuse Shared Events palette to keep it simple
  const SIGNUP_GRADIENTS: {
    id: string;
    swatch: string;
    lightRow: string;
    darkRow: string;
  }[] = SHARED_GRADIENTS;

  const getSignupGradientId = (): string => {
    const val = categoryColors["Smart sign-up"];
    const exists = SIGNUP_GRADIENTS.some((g) => g.id === val);
    return exists ? (val as string) : "shared-g1";
  };

  const signupGradientRowClass = (): string => {
    const id = getSignupGradientId();
    const found = SIGNUP_GRADIENTS.find((g) => g.id === id);
    if (!found) {
      return theme === "dark"
        ? SIGNUP_GRADIENTS[0].darkRow
        : SIGNUP_GRADIENTS[0].lightRow;
    }
    return theme === "dark" ? found.darkRow : found.lightRow;
  };

  const signupGradientSwatchClass = (): string => {
    const id = getSignupGradientId();
    const found = SIGNUP_GRADIENTS.find((g) => g.id === id);
    return found?.swatch || SIGNUP_GRADIENTS[0].swatch;
  };

  // Item-specific Smart sign-up color helpers
  const getSignupItemGradientId = (historyId: string): string => {
    const val = signupItemColors[historyId];
    const exists = SIGNUP_GRADIENTS.some((g) => g.id === val);
    return exists ? (val as string) : getSignupGradientId();
  };
  const signupItemGradientRowClass = (historyId: string): string => {
    const id = getSignupItemGradientId(historyId);
    const found = SIGNUP_GRADIENTS.find((g) => g.id === id);
    if (!found) {
      return theme === "dark"
        ? SIGNUP_GRADIENTS[0].darkRow
        : SIGNUP_GRADIENTS[0].lightRow;
    }
    return theme === "dark" ? found.darkRow : found.lightRow;
  };
  const signupItemGradientSwatchClass = (historyId: string): string => {
    const id = getSignupItemGradientId(historyId);
    const found = SIGNUP_GRADIENTS.find((g) => g.id === id);
    return found?.swatch || SIGNUP_GRADIENTS[0].swatch;
  };

  const setSignupItemColor = (historyId: string, color: string) => {
    if (!historyId) return;
    setSignupItemColors((prev) => ({ ...prev, [historyId]: color }));
    setColorMenuFor(null);
    setColorMenuPos(null);
  };

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

  // Persist per-item Smart sign-up colors locally
  useEffect(() => {
    try {
      localStorage.setItem(
        "signupItemColors",
        JSON.stringify(signupItemColors)
      );
    } catch {}
  }, [signupItemColors]);

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
        const res = await fetch("/api/history?view=summary&limit=40", {
          cache: "no-cache",
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
    const pendingTimeouts = new Set<ReturnType<typeof setTimeout>>();

    const onCreated = async (e: Event) => {
      try {
        const anyEvent = e as any;
        const detail = (anyEvent && anyEvent.detail) || null;
        try {
          console.debug("[sidebar] history:created event", detail);
        } catch {}
        if (detail && detail.id) {
          // Optimistically prepend; avoid duplicates
          // Use immediate state update (React 18+ auto-batches, but we ensure it happens)
          setHistory((prev) => {
            const exists = prev.some((r) => r.id === detail.id);
            if (exists) return prev; // Already added, skip duplicate
            const detailData =
              detail.data && typeof detail.data === "object" ? detail.data : {};
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
            const next = [nextItem, ...prev];
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

          // Background refetch to ensure counts stay in sync with server
          // This ensures category counts and other computed values are accurate
          // Use a small delay to let server-side cache invalidation propagate
          const refetchTimeout = setTimeout(async () => {
            pendingTimeouts.delete(refetchTimeout as any);
            if (cancelled) return;
            try {
              // Add cache-busting query param to force fresh fetch (slim view)
              const res = await fetch(
                `/api/history?view=summary&limit=40&t=${Date.now()}`,
                {
                  cache: "no-cache",
                  credentials: "include",
                }
              );
              const j = await res.json().catch(() => ({ items: [] }));
              if (!cancelled) {
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
                try {
                  console.debug("[sidebar] history refreshed from server", {
                    count: j.items?.length || 0,
                  });
                } catch {}
              }
            } catch (err) {
              try {
                console.debug("[sidebar] background refetch failed", err);
              } catch {}
            }
          }, 1000); // 1 second delay - enough for cache invalidation, fast enough for UX

          pendingTimeouts.add(refetchTimeout as any);
        } else {
          // Fallback: slim refetch
          const res = await fetch("/api/history?view=summary&limit=40", {
            cache: "no-cache",
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
        }
      } catch {}
    };
    window.addEventListener("history:created", onCreated as any);
    return () => {
      cancelled = true;
      window.removeEventListener("history:created", onCreated as any);
      // Clear any pending timeouts
      pendingTimeouts.forEach((timeout) => clearTimeout(timeout as any));
      pendingTimeouts.clear();
    };
  }, []);

  const shareHistoryItem = async (prettyHref: string) => {
    try {
      const url = new URL(prettyHref, window.location.origin).toString();
      if ((navigator as any).share) {
        await (navigator as any).share({ title: "Envitefy", url });
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
          (currentPath === `/event/${id}` ||
            currentPath === `/smart-signup-form/${id}` ||
            currentPath.endsWith(`-${id}`))
        ) {
          router.replace("/");
        }
      } catch {}
    } catch {}
  };

  const MenuItems = (props: { onCloseMenu: () => void; isAdmin: boolean }) => {
    const { onCloseMenu, isAdmin } = props;
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
            <circle cx="12" cy="7" r="4" />
            <path d="M5.5 21v-2a6.5 6.5 0 0 1 13 0v2" />
          </svg>
          <span className="text-sm md:text-base">Profile</span>
        </Link>

        <Link
          href="/calendar"
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
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="text-sm md:text-base">Calendar</span>
        </Link>

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
          <span className="text-sm md:text-base">About us</span>
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
          <span className="text-sm md:text-base">Contact us</span>
        </Link>

        <div className="mt-1 relative">
          <button
            type="button"
            onClick={() => {
              setCalendarsOpenFloating((v) => !v);
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
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className="text-sm md:text-base">Calendars</span>
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
                calendarsOpenFloating ? "rotate-0" : "rotate-90"
              }`}
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          {calendarsOpenFloating && (
            <div className="mt-2 px-3 pb-2 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs md:text-sm font-semibold uppercase tracking-wide text-foreground/70">
                  Connection status
                </p>
              </div>
              <div className="flex items-center gap-3">
                {CALENDAR_TARGETS.map(({ key, label, Icon }) => {
                  const active = connectedCalendars[key];
                  return (
                    <div
                      key={key}
                      className={`flex flex-col items-center gap-1 text-[11px] ${
                        active ? "text-emerald-600" : "text-foreground/60"
                      }`}
                    >
                      <button
                        type="button"
                        aria-pressed={active}
                        title={
                          active
                            ? `${label} calendar connected`
                            : `Connect ${label} calendar`
                        }
                        className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition ${
                          active
                            ? "border-emerald-600 bg-emerald-50 hover:border-emerald-500 shadow-md shadow-emerald-600/20"
                            : "border-border bg-surface hover:border-primary hover:bg-primary/10"
                        }`}
                        onClick={() => handleCalendarConnect(key)}
                      >
                        <Icon
                          className={`h-4 w-4 ${
                            active ? "text-emerald-700" : ""
                          }`}
                        />
                        {active && (
                          <div className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-600 flex items-center justify-center border-2 border-white shadow-sm">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 12 12"
                              fill="none"
                              className="h-2.5 w-2.5 text-white"
                            >
                              <path
                                d="M10 3L4.5 8.5L2 6"
                                stroke="currentColor"
                                strokeWidth="2"
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
              {!connectedCalendars.google &&
                !connectedCalendars.apple &&
                !connectedCalendars.microsoft && (
                  <p className="text-[11px] text-foreground/60">
                    Connect calendars from Settings to sync events in one tap.
                  </p>
                )}
            </div>
          )}
        </div>

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
              <span className="text-sm md:text-base">Admin</span>
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
          <span className="text-sm md:text-base">Log out</span>
        </button>
      </div>
    );
  };

  if (status !== "authenticated") return null;
  // Avoid SSR/client mismatch by rendering sidebar only after hydration
  if (!isHydrated) return null;

  return (
    <>
      {!isOpen && (
        <button
          ref={openButtonRef}
          type="button"
          className="fixed top-3 left-3 z-[6500] lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#4a4170] shadow-md border border-white/70"
          onClick={() => setIsCollapsed(false)}
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
      )}
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 z-[5999] bg-black/20 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsCollapsed(true)}
        aria-hidden="true"
      />
      <aside
        ref={asideRef}
        className={`fixed left-0 top-0 h-full z-[6000] border border-white/60 dark:border-white/10 backdrop-blur-2xl flex flex-col rounded-tr-[2.75rem] rounded-br-[2.75rem] shadow-[0_35px_90px_rgba(72,44,116,0.28)] ${
          overflowClass
        } transition-[transform,opacity,width] duration-200 ease-out will-change-transform ${
          pointerClass
        } lg:flex`}
        style={{
          width: sidebarWidth,
          transform: sidebarTransform,
          opacity: isDesktop ? 1 : isOpen ? 1 : 0,
          backgroundImage: SIDEBAR_GRADIENT,
          backgroundColor: "rgba(255, 255, 255, 0.78)",
          boxShadow: "0 30px 90px rgba(84, 56, 125, 0.35)",
        }}
        aria-label="Sidebar"
      >
        {isCompact && (
          <div className="flex h-full flex-col items-center gap-4 py-6 px-2">
            <button
              type="button"
              aria-label="Expand navigation"
              onClick={() => setIsCollapsed(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#7f8cff] shadow-md border border-white/70 hover:bg-white transition"
            >
              <ChevronRight size={18} />
            </button>
            <Image
              src="/E.png"
              alt="Envitefy"
              width={36}
              height={36}
              className="opacity-90 drop-shadow"
            />
            <button
              type="button"
              onClick={() => {
                setIsCollapsed(false);
                setCreateEventOpen(true);
              }}
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f4f4ff] to-white text-[#7d5ec2] shadow-[0_12px_30px_rgba(109,87,184,0.25)] hover:scale-105 transition"
              title="Create event"
            >
              <Plus size={18} />
            </button>
            <div className="flex-1 flex flex-col items-center gap-3">
              {compactNavItems.map((item) => {
                const Icon = item.icon;
                const badgeCount = item.badge || 0;
                return (
                  <button
                    key={item.href || item.label}
                    type="button"
                    onClick={() => {
                      setIsCollapsed(false);
                      if (item.action === "snap") return launchSnapFromMenu("camera");
                      if (item.action === "upload") return launchSnapFromMenu("upload");
                      if (item.action === "create") {
                        setCreateEventOpen(true);
                        return;
                      }
                      if (item.href) {
                        try {
                          router.push(item.href);
                        } catch {}
                      }
                    }}
                    className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/85 text-[#4a4170] shadow-[0_12px_30px_rgba(109,87,184,0.15)] hover:bg-white hover:-translate-y-0.5 transition"
                    title={item.label}
                  >
                    <Icon size={18} />
                    {badgeCount > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-[#8468ff] px-1 text-[10px] font-semibold text-white shadow-md">
                        {badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-red-500 shadow-md hover:bg-white transition"
              title="Log out"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}

        <div
          className={`${
            isCompact
              ? "opacity-0 pointer-events-none select-none"
              : "flex flex-col h-full"
          } transition-opacity duration-150`}
          aria-hidden={isCompact}
        >
          {/* Header with close button */}
          <div className="relative flex-shrink-0 px-4 pt-5 pb-5">
            {/* Hero-esque intro */}
            <div className={`${SIDEBAR_CARD_CLASS} px-4 py-5`}>
              <button
                type="button"
                aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
                onClick={() => setIsCollapsed((prev) => !prev)}
                className="absolute top-1.5 right-2 inline-flex items-center justify-center rounded-full bg-white/90 p-1 text-[#7f8cff] shadow-md hover:bg-white transition"
              >
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
              <div className="flex flex-col items-center gap-3 text-center">
                <Link
                  href="/"
                  onClick={collapseSidebarOnTouch}
                  className="flex h-12 w-12 items-center justify-center]"
                >
                  <Image
                    src="/E.png"
                    alt="Envitefy"
                    width={64}
                    height={64}
                    className="opacity-95 drop-shadow-[0_10px_35px_rgba(103,74,150,0.35)]"
                  />
                </Link>
                <div className="text-xs md:text-sm font-semibold tracking-widest text-[#7f8cff]">
                  CREATE | SHARE | ENJOY
                </div>
              </div>
            </div>
          </div>
          {/* Middle: Event history */}
          <div className="flex-1 overflow-y-auto overflow-x-visible no-scrollbar">
            <div className="px-4 pt-0 pb-5 space-y-4">
            {/* Separator line */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#d9ccff] to-transparent"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    launchSnapFromMenu("camera");
                  }}
                  className="flex flex-col items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-[#2f1d47] rounded-2xl bg-gradient-to-br from-[#eef1ff] via-white to-[#e6f0ff] border border-white/70 shadow-[0_12px_30px_rgba(109,87,184,0.12)] hover:-translate-y-0.5 transition"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#89c4ff] to-[#7a5ec0] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
                    <Camera size={18} />
                  </span>
                  <span>Snap</span>
                </button>

                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    launchSnapFromMenu("upload");
                  }}
                  className="flex flex-col items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-[#2f1d47] rounded-2xl bg-gradient-to-br from-[#eef1ff] via-white to-[#e6f0ff] border border-white/70 shadow-[0_12px_30px_rgba(109,87,184,0.12)] hover:-translate-y-0.5 transition"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7cd3ff] to-[#6f8dff] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
                    <Upload size={18} />
                  </span>
                  <span>Upload</span>
                </button>
              </div>

              <Link
                href="/"
                onClick={collapseSidebarOnTouch}
                className={`${SIDEBAR_ITEM_CARD_CLASS} flex items-center gap-3 px-4 py-3 text-sm md:text-base font-semibold text-[#2f1d47]`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f5efff] to-white text-[#7a5ec0] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                  <Home size={18} />
                </span>
                <span>Home</span>
              </Link>

              <div
                className={`${SIDEBAR_ITEM_CARD_CLASS} flex flex-col px-4 py-3 ${
                  createEventOpen ? "ring-2 ring-[#d9ccff]" : ""
                }`}
              >
                <div className="flex items-center gap-3 w-full">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      setCreateEventOpen(!createEventOpen);
                    }}
                  className="flex flex-1 items-center gap-3 text-left text-sm md:text-base font-semibold text-[#2f1d47] focus:outline-none"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f4f4ff] to-white text-[#7d5ec2] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                    <Plus size={18} />
                  </span>
                  <span>Create Event</span>
                </button>
                  <div className="ml-auto flex items-center gap-2">
                    <span className={SIDEBAR_BADGE_CLASS}>
                      {createdEventsCount}
                    </span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        setCreateEventOpen(!createEventOpen);
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-[#7a5fc0] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:bg-white"
                      aria-label="Toggle create menu"
                    >
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
                  </div>
                </div>
              </div>

              <div
                className={`${SIDEBAR_ITEM_CARD_CLASS} flex items-center gap-3 px-4 py-3 ${
                  activeCategory === "Smart sign-up"
                    ? "ring-2 ring-[#d9ccff]"
                    : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory((prev) =>
                      prev === "Smart sign-up" ? null : "Smart sign-up"
                    );
                  }}
                  className="flex flex-1 items-center gap-3 text-left text-sm md:text-base font-semibold text-[#2f1d47] focus:outline-none"
                  aria-pressed={activeCategory === "Smart sign-up"}
                  title="Smart sign-up"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f6faff] to-white text-[#4f84d6] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                    <FileEdit size={18} />
                  </span>
                  <span>Smart sign-up</span>
                </button>
                <div className="ml-auto flex items-center gap-2">
                  <span className={SIDEBAR_BADGE_CLASS}>
                    {smartSignupCount}
                  </span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      try {
                        (window as any).__openSmartSignup?.();
                      } catch {}
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-[#4f84d6] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:bg-white"
                    aria-label="Open Smart sign-up"
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
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </div>
              </div>
              {activeCategory === "Smart sign-up" && (
                <div className="mt-1 mb-2">
                  {(() => {
                    const myEmail = (profileEmail ||
                      profileEmailRef.current ||
                      "") as string;
                    const myUserId =
                      ((session as any)?.user?.id as string | undefined) ||
                      null;
                    const items = sortHistoryRows(
                      history.filter((h) => {
                        const data: any = (h as any)?.data;
                        const form = data?.signupForm;
                        if (!form || typeof form !== "object") return false;
                        if (!data?.shared) return true;
                        const responses: any[] = Array.isArray(form.responses)
                          ? form.responses
                          : [];
                        const hasMyActiveResponse = responses.some((r) => {
                          if (!r || typeof r !== "object") return false;
                          if (
                            String(r.status || "").toLowerCase() === "cancelled"
                          )
                            return false;
                          const emailMatches =
                            myEmail &&
                            typeof r.email === "string" &&
                            r.email.toLowerCase() === myEmail;
                          const userIdMatches =
                            myUserId &&
                            typeof r.userId === "string" &&
                            r.userId === myUserId;
                          return Boolean(emailMatches || userIdMatches);
                        });
                        return hasMyActiveResponse;
                      }) as any
                    );
                    if (items.length === 0)
                      return (
                        <div className="text-xs md:text-sm text-foreground/60 px-1 py-0.5">
                          No forms
                        </div>
                      );
                    return (
                      <div className="space-y-1">
                        {items.map((h: any) => {
                          const slug = (h.title || "")
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/^-+|-+$/g, "");
                          const prettyHref = `/smart-signup-form/${h.id}`;
                          // Item-specific gradient row style (falls back to Smart sign-up default)
                          const signupRowClass = `${signupItemGradientRowClass(
                            h.id
                          )} ${sharedTextClass}`;
                          return (
                            <div
                              key={h.id}
                              data-history-item={h.id}
                              className={`relative px-2 py-2 rounded-md text-sm ${signupRowClass}`}
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
                                    {h.title || "Untitled form"}
                                  </span>
                                </div>
                                <div className="text-xs md:text-sm text-foreground/60">
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
                                aria-label={`Edit form color`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  // Ensure Smart sign-up stays expanded when opening the color menu
                                  try {
                                    setActiveCategory("Smart sign-up");
                                  } catch {}
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
                                  setColorMenuFor(`signup-item:${h.id}`);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    (e.currentTarget as HTMLElement).click();
                                  }
                                }}
                                className={`absolute right-8 top-2 inline-flex h-4 w-4 rounded-[4px] ${signupItemGradientSwatchClass(
                                  h.id
                                )} border-0`}
                                title="Edit color"
                              />
                              <button
                                type="button"
                                aria-label="Item options"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  // Keep Smart sign-up expanded while the item menu is open
                                  try {
                                    setActiveCategory("Smart sign-up");
                                  } catch {}
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
                                    const rect = target.getBoundingClientRect();
                                    const viewportHeight = window.innerHeight;
                                    const menuHeight = 200;
                                    const spaceBelow =
                                      viewportHeight - rect.top;
                                    const shouldOpenUpward =
                                      spaceBelow < menuHeight + 50;
                                    setItemMenuOpensUpward(shouldOpenUpward);
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
                                className="absolute top-1.5 right-1.5 inline-flex items-center justify-center h-6 w-6 rounded hover:bg-surface/70"
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
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              <div
                className={`${SIDEBAR_ITEM_CARD_CLASS} flex items-center gap-3 px-4 py-3`}
              >
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
                  className="flex flex-1 items-center gap-3 text-sm md:text-base font-semibold text-[#2f1d47]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f2f5ff] to-white text-[#5e6bcb] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                    <CalendarDays size={18} />
                  </span>
                  <span className="flex items-center gap-2">
                    <span>Calendar</span>
                  </span>
                </Link>
                <div className="ml-auto flex items-center gap-2">
                  <span className={SIDEBAR_BADGE_CLASS}>{history.length}</span>
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
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-[#5e6bcb] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:bg-white"
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
                const sharedCount = 0; // Shared events disabled
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
                              <div className="text-xs md:text-sm text-foreground/60 px-1 py-0.5">
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
                                const prettyHref = `/smart-signup-form/${h.id}`;
                                const explicitCat = (h as any)?.data
                                  ?.category as string | null;
                                const effectiveCategory = (() => {
                                  const explicit =
                                    normalizeCategoryLabel(explicitCat);
                                  if (explicit) return explicit;
                                  try {
                                    const text = [
                                      String((h as any)?.title || ""),
                                      String(
                                        (h as any)?.data?.description || ""
                                      ),
                                      String((h as any)?.data?.rsvp || ""),
                                      String((h as any)?.data?.location || ""),
                                    ]
                                      .filter(Boolean)
                                      .join(" ");
                                    const guessed = guessCategoryFromText(text);
                                    return normalizeCategoryLabel(guessed);
                                  } catch {
                                    return null;
                                  }
                                })();
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
                                  if (!effectiveCategory)
                                    return {
                                      row: "",
                                      badge:
                                        "bg-surface/70 text-foreground/70 border-border/70",
                                    };
                                  const color =
                                    categoryColors[effectiveCategory] ||
                                    defaultCategoryColor(effectiveCategory);
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
                                        // Keep Smart sign-up expanded while the item menu is open
                                        try {
                                          setActiveCategory("Smart sign-up");
                                        } catch {}
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
                                          data-popover="item-menu"
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
                                            <span className="text-sm md:text-base">
                                              Share
                                            </span>
                                          </button>
                                          {!hideRenameAndChange && (
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
                                              <span className="text-sm md:text-base">
                                                Rename
                                              </span>
                                            </button>
                                          )}
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
                                            <span className="text-sm md:text-base">
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
              {/* My Events Section */}
              <div
                className={`${SIDEBAR_ITEM_CARD_CLASS} flex flex-col px-4 py-3 mt-3 ${
                  myEventsOpen ? "ring-2 ring-[#d9ccff]" : ""
                }`}
              >
                <div className="flex items-center gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => setMyEventsOpen((v) => !v)}
                    className="flex flex-1 items-center gap-3 text-left text-sm md:text-base font-semibold text-[#2f1d47] focus:outline-none"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f4f4ff] to-white text-[#7d5ec2] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                      <Trophy size={18} />
                    </span>
                    <span>My Events</span>
                  </button>
                  <div className="ml-auto flex items-center gap-2">
                    <span className={SIDEBAR_BADGE_CLASS}>
                      {history.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => setMyEventsOpen((v) => !v)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-[#7a5fc0] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:bg-white"
                      aria-label="Toggle My Events"
                    >
                      <span
                        className={`text-lg leading-none transition-transform ${
                          myEventsOpen ? "rotate-180" : ""
                        }`}
                        aria-hidden="true"
                      >
                        ▾
                      </span>
                    </button>
                  </div>
                </div>

                <div
                  className={`pl-2 mt-3 border-l-2 border-border/40 ml-2 ${
                    myEventsOpen ? "" : "hidden"
                  }`}
                >
                  {(() => {
                    const categories = Array.from(
                      new Set(
                        history
                          .map((h) => {
                            try {
                              const explicit = normalizeCategoryLabel(
                                (h as any)?.data?.category as string | null
                              );
                              if (explicit) return explicit;
                              const text = [
                                String((h as any)?.title || ""),
                                String((h as any)?.data?.description || ""),
                                String((h as any)?.data?.rsvp || ""),
                                String((h as any)?.data?.location || ""),
                              ]
                                .filter(Boolean)
                                .join(" ");
                              const guessed = guessCategoryFromText(text);
                              return normalizeCategoryLabel(guessed);
                            } catch {
                              return null;
                            }
                          })
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
                              return history.filter((h) => {
                                const explicit = normalizeCategoryLabel(
                                  (h as any)?.data?.category as string | null
                                );
                                if (explicit) return explicit === c;
                                const text = [
                                  String((h as any)?.title || ""),
                                  String((h as any)?.data?.description || ""),
                                  String((h as any)?.data?.rsvp || ""),
                                  String((h as any)?.data?.location || ""),
                                ]
                                  .filter(Boolean)
                                  .join(" ");
                                const guessed = normalizeCategoryLabel(
                                  guessCategoryFromText(text)
                                );
                                return guessed === c;
                              });
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
                                <span className="truncate">{c}</span>
                                {(() => {
                                  const color =
                                    categoryColors[c] ||
                                    defaultCategoryColor(c);
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
                                          if (
                                            e.key === "Enter" ||
                                            e.key === " "
                                          ) {
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
                                    <div className="text-xs md:text-sm text-foreground/60 px-1 py-0.5">
                                      No events
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      {categoryItems.map((h, index) => {
                                        const slug = (h.title || "")
                                          .toLowerCase()
                                          .replace(/[^a-z0-9]+/g, "-")
                                          .replace(/^-+|-+$/g, "");
                                        const dataObj: any =
                                          (h as any)?.data || {};
                                        const prettyHref = dataObj?.signupForm
                                          ? `/smart-signup-form/${h.id}`
                                          : `/event/${slug}-${h.id}`;
                                        const explicitCat = (h as any)?.data
                                          ?.category as string | null;
                                        const effectiveCategory = (() => {
                                          const explicit =
                                            normalizeCategoryLabel(explicitCat);
                                          if (explicit) return explicit;
                                          try {
                                            const text = [
                                              String((h as any)?.title || ""),
                                              String(
                                                (h as any)?.data?.description ||
                                                  ""
                                              ),
                                              String(
                                                (h as any)?.data?.rsvp || ""
                                              ),
                                              String(
                                                (h as any)?.data?.location || ""
                                              ),
                                            ]
                                              .filter(Boolean)
                                              .join(" ");
                                            const guessed =
                                              guessCategoryFromText(text);
                                            return normalizeCategoryLabel(
                                              guessed
                                            );
                                          } catch {
                                            return null;
                                          }
                                        })();
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
                                          if (!effectiveCategory)
                                            return {
                                              row: "",
                                              badge:
                                                "bg-surface/70 text-foreground/70 border-border/70",
                                            };
                                          const color =
                                            categoryColors[effectiveCategory] ||
                                            defaultCategoryColor(
                                              effectiveCategory
                                            );
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
                                                    {h.title ||
                                                      "Untitled event"}
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
                                                    setItemMenuOpensUpward(
                                                      false
                                                    );
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
                                                      spaceBelow <
                                                      menuHeight + 50;
                                                    setItemMenuOpensUpward(
                                                      shouldOpenUpward
                                                    );
                                                    setItemMenuPos({
                                                      left: Math.round(
                                                        rect.right + 8
                                                      ),
                                                      top: shouldOpenUpward
                                                        ? Math.round(
                                                            rect.top - 10
                                                          )
                                                        : Math.round(
                                                            rect.top +
                                                              rect.height / 2
                                                          ),
                                                    });
                                                  }
                                                  setItemMenuCategoryOpenFor(
                                                    null
                                                  );
                                                  setItemMenuId(h.id);
                                                }}
                                                className="absolute top-2 right-2 inline-flex items-center justify-center h-6 w-6 rounded hover:bg-surface/70"
                                              >
                                                <span
                                                  className="text-lg font-normal leading-none"
                                                  aria-hidden="true"
                                                >
                                                  ⋮
                                                </span>
                                              </button>
                                              {itemMenuId === h.id &&
                                                itemMenuPos &&
                                                createPortal(
                                                  <div
                                                    data-popover="item-menu"
                                                    onClick={(e) =>
                                                      e.stopPropagation()
                                                    }
                                                    style={{
                                                      position: "fixed",
                                                      left: itemMenuPos.left,
                                                      top: itemMenuPos.top,
                                                      transform:
                                                        itemMenuOpensUpward
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
                                                      <span className="text-sm md:text-base">
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
              </div>
            </div>
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
                  <div className="truncate text-sm font-medium">
                    {displayName}
                  </div>
                  {userEmail && (
                    <div className="truncate text-xs md:text-sm text-foreground/60">
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
                    <Link
                      href="/settings"
                      onClick={() => {
                        setMenuOpen(false);
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
                        <circle cx="12" cy="7" r="4" />
                        <path d="M5.5 21v-2a6.5 6.5 0 0 1 13 0v2" />
                      </svg>
                      <span className="text-sm md:text-base">Profile</span>
                    </Link>

                    <div className="mt-1 relative">
                      <button
                        type="button"
                        onClick={() => {}}
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
                          <span className="text-sm md:text-base">Calendar</span>
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
                            false ? "rotate-0" : "rotate-90"
                          }`}
                          aria-hidden="true"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                      {false && (
                        <div className="mt-2 px-3 pb-2 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs md:text-sm font-semibold uppercase tracking-wide text-foreground/70">
                              Connection status
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            {CALENDAR_TARGETS.map(({ key, label, Icon }) => {
                              const active = connectedCalendars[key];
                              return (
                                <div
                                  key={key}
                                  className={`flex flex-col items-center gap-1 text-[11px] ${
                                    active
                                      ? "text-emerald-600"
                                      : "text-foreground/60"
                                  }`}
                                >
                                  <button
                                    type="button"
                                    aria-pressed={active}
                                    title={
                                      active
                                        ? `${label} calendar connected`
                                        : `Connect ${label} calendar`
                                    }
                                    className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition ${
                                      active
                                        ? "border-emerald-600 bg-emerald-100 hover:border-emerald-500 shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-600/20"
                                        : "border-border bg-surface hover:border-primary hover:bg-primary/10"
                                    }`}
                                    onClick={() => handleCalendarConnect(key)}
                                  >
                                    <Icon
                                      className={`h-4 w-4 ${
                                        active ? "text-emerald-700" : ""
                                      }`}
                                    />
                                    {active && (
                                      <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-emerald-600 flex items-center justify-center border-2 border-white shadow-lg z-10">
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
                      )}
                    </div>

                    <Link
                      href="/about"
                      onClick={() => {
                        setMenuOpen(false);
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
                      <span className="text-sm md:text-base">About us</span>
                    </Link>

                    <Link
                      href="/contact"
                      onClick={() => {
                        setMenuOpen(false);
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
                      <span className="text-sm md:text-base">Contact us</span>
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
                            <span className="text-sm md:text-base">Admin</span>
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
                          <div className="absolute top-1/2 left-full ml-2 -translate-y-1/2 w-44 rounded-lg border border-border bg-surface/95 backdrop-blur shadow-2xl p-2 z-[999]">
                            <Link
                              href="/admin"
                              onClick={() => {
                                setMenuOpen(false);
                                setAdminOpenFloating(false);
                              }}
                              className="flex items-center gap-3 px-3 py-2 rounded-md text-foreground/90 hover:text-foreground hover:bg-surface"
                            >
                              <span className="text-sm md:text-base">
                                Dashboard
                              </span>
                            </Link>
                            <Link
                              href="/admin/emails"
                              onClick={() => {
                                setMenuOpen(false);
                                setAdminOpenFloating(false);
                              }}
                              className="flex items-center gap-3 px-3 py-2 rounded-md text-foreground/90 hover:text-foreground hover:bg-surface"
                            >
                              <span className="text-sm md:text-base">
                                Emails
                              </span>
                            </Link>
                            <Link
                              href="/admin/campaigns"
                              onClick={() => {
                                setMenuOpen(false);
                                setAdminOpenFloating(false);
                              }}
                              className="flex items-center gap-3 px-3 py-2 rounded-md text-foreground/90 hover:text-foreground hover:bg-surface"
                            >
                              <span className="text-sm md:text-base">
                                Campaigns
                              </span>
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
                      <span className="text-sm md:text-base">Log out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </aside>

      {createEventOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[11500] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setCreateEventOpen(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] md:h-auto overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Create New Event</h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Choose a category to get started quickly
                  </p>
                </div>
                <button
                  onClick={() => setCreateEventOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close create event menu"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {createModalSections.map((cat, idx) => (
                    <div key={`${cat.title}-${idx}`} className="space-y-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${cat.color.replace("text-", "bg-opacity-20 ")}`}
                        >
                          {cat.items.length}
                        </span>
                        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">
                          {cat.title}
                        </h3>
                      </div>
                      <div className="space-y-2">
                        {cat.items.map((item) => {
                          const Icon = ICON_LOOKUP[item.label] || Sparkles;
                          return (
                            <button
                              key={item.label}
                              className="w-full flex items-center space-x-3 p-3 bg-white hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-xl transition-all duration-200 group text-left shadow-sm hover:shadow-md"
                              onClick={() =>
                                handleCreateModalSelect(
                                  item.label,
                                  (item as any).href
                                )
                              }
                            >
                              <div
                                className={`p-2 rounded-lg ${cat.color} group-hover:scale-110 transition-transform`}
                              >
                                <Icon size={18} />
                              </div>
                              <span className="text-gray-700 font-medium text-sm group-hover:text-indigo-700">
                                {item.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
                <button
                  onClick={() => {
                    setCreateEventOpen(false);
                    collapseSidebarOnTouch();
                    try {
                      router.push("/templates");
                    } catch (err) {
                      console.debug("[sidebar] templates nav failed", err);
                      triggerCreateEvent();
                    }
                  }}
                  className="text-sm text-gray-500 hover:text-gray-900 font-medium px-4"
                >
                  View All Templates
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

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
            ) : (colorMenuFor || "").startsWith("signup-item:") ? (
              <div className="grid grid-cols-4 gap-2 px-2 pb-2 pt-2 mt-1 place-items-center">
                {SHARED_GRADIENTS.map((g) => {
                  const historyId = String(
                    (colorMenuFor || "").split(":")[1] || ""
                  );
                  const selected = getSignupItemGradientId(historyId) === g.id;
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
                        const hid = String(
                          (colorMenuFor || "").split(":")[1] || ""
                        );
                        setSignupItemColor(hid, g.id);
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
