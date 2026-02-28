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
import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { useTheme } from "./providers";
import { useSidebar, type EventContextTab } from "./sidebar-context";
import { signOut, useSession } from "next-auth/react";
import {
  CalendarIconGoogle,
  CalendarIconOutlook,
  CalendarIconApple,
} from "@/components/CalendarIcons";
import { resolveEditHref } from "@/utils/event-edit-route";
import {
  getCreateEventSections,
  getTemplateLinks,
} from "@/config/navigation-config";
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
} from "lucide-react";
import { useFeatureVisibility } from "@/hooks/useFeatureVisibility";
import EventSidebar from "@/components/navigation/EventSidebar";

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
type SidebarPage = "root" | "createEvent" | "myEvents" | "eventContext";

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
  "Sign up": FileEdit,
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

type DraftsSectionProps = {
  drafts: { id: string; title: string; created_at?: string; data?: any }[];
  draftsCount: number;
  collapseSidebarOnTouch: () => void;
  onDeleteDraft: (id: string, title?: string) => void;
  embedded?: boolean;
};

function DraftsSection({
  drafts,
  draftsCount,
  collapseSidebarOnTouch,
  onDeleteDraft,
  embedded = false,
}: DraftsSectionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (draftsCount === 0) {
    return null;
  }

  const getDraftLabel = (row: {
    id: string;
    title: string;
    created_at?: string;
    data?: any;
  }): string => {
    const data: any = row.data || {};
    const category = String(data.category || "")
      .trim()
      .toLowerCase();
    const templateId: string =
      (data.templateId as string | undefined) ||
      (data.theme?.themeId as string | undefined) ||
      "";

    if (category.includes("wedding")) {
      const templateNameMap: Record<string, string> = {
        "ethereal-classic": "Ethereal Classic",
        "modern-editorial": "Modern Editorial",
        "rustic-boho": "Rustic Boho",
        "cinematic-wedding": "Cinematic",
        "celestial-wedding": "Celestial",
        "gilded-wedding": "Gilded",
        "museum-wedding": "Museum",
        "ethereal-wedding": "Ethereal",
        "noir-luxury": "Noir Luxury",
        "retro-70s": "Retro 70s",
      };
      const templateName = templateNameMap[templateId] || "Wedding";
      const names =
        (data.partner1 && data.partner2
          ? `${data.partner1} & ${data.partner2}`
          : data.partner1 || data.partner2) || "";
      if (names) {
        return `${templateName} — ${names}`;
      }
      return `${templateName} (draft)`;
    }

    return (row.title || "Event") + " (draft)";
  };

  return (
    <div
      className={
        embedded
          ? "flex flex-col"
          : `${SIDEBAR_ITEM_CARD_CLASS} flex flex-col px-4 py-3`
      }
    >
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          setOpen((prev) => !prev);
        }}
        className={
          embedded
            ? "w-full flex items-center justify-between gap-2 px-2.5 py-2.5 text-left text-sm font-medium text-[#3e315c] bg-[#f1f3f5] hover:bg-[#e9edf2] transition-all duration-150"
            : "flex items-center justify-between gap-3 text-sm md:text-base font-semibold text-[#2f1d47]"
        }
      >
        <span>Drafts</span>
        <div className="flex items-center gap-2">
          <span
            className={
              embedded
                ? "inline-flex items-center px-1.5 py-0.5 text-[10px] rounded-full border border-border bg-surface/60 text-foreground/80"
                : SIDEBAR_BADGE_CLASS
            }
          >
            {draftsCount}
          </span>
          {embedded && (
            <span
              className="inline-flex items-center justify-center h-5 w-5 rounded-[4px] border border-[#d1d5db] bg-[#e5e7eb]"
              aria-hidden="true"
              title="Draft color"
            />
          )}
        </div>
      </button>
      {open && (
        <div className={embedded ? "border-t border-[#eee7ff]" : "mt-2 space-y-1"}>
          {drafts.map((row) => {
            const href = resolveEditHref(
              row.id,
              row.data,
              row.title || "Event",
            );
            const dateStr =
              (row.data && (row.data.startISO || row.data.start)) ||
              row.created_at ||
              null;
            const formattedDate = dateStr
              ? new Date(dateStr).toLocaleDateString()
              : "";
            return (
              <div
                key={row.id}
                onClick={(event) => {
                  event.preventDefault();
                  collapseSidebarOnTouch();
                  router.push(href);
                }}
                className={
                  embedded
                    ? "w-full flex items-center justify-between gap-2 px-2.5 py-2 text-sm text-[#3e315c] bg-[#f1f3f5] hover:bg-[#e9edf2] cursor-pointer border-b border-[#e5e7eb] last:border-b-0"
                    : "w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-xs md:text-sm text-foreground/80 bg-[#f1f3f5] hover:bg-[#e9edf2] cursor-pointer"
                }
              >
                <div className="flex-1 min-w-0">
                  <div className="truncate">{getDraftLabel(row)}</div>
                  {formattedDate && (
                    <div className={embedded ? "text-[11px] text-foreground/50" : "text-[10px] text-foreground/50"}>
                      {formattedDate}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Delete draft"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDeleteDraft(row.id, row.title);
                  }}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full text-foreground/60 hover:bg-red-50 hover:text-red-500"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
const SIDEBAR_LOGO_SRC = "/E.png";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [calendarsOpenFloating, setCalendarsOpenFloating] = useState(false);
  const [sidebarPage, setSidebarPage] = useState<SidebarPage>("root");
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
      if (!res.ok) {
        console.warn(
          `[left-sidebar] /api/calendars returned status ${res.status}`,
        );
        setConnectedCalendars({
          google: false,
          microsoft: false,
          apple: false,
        });
        return;
      }
      const data = await res.json().catch(() => ({}));
      setConnectedCalendars({
        google: Boolean(data?.google),
        microsoft: Boolean(data?.microsoft),
        apple: Boolean(data?.apple),
      });
    } catch (err) {
      console.error(
        "Failed to fetch connected calendars:",
        err instanceof Error ? err.message : String(err),
      );
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
            "noopener,noreferrer",
          );
        } else if (provider === "microsoft") {
          window.open(
            "/api/outlook/auth?source=sidebar",
            "_blank",
            "noopener,noreferrer",
          );
        } else {
          window.open(
            "https://support.apple.com/guide/calendar/welcome/mac",
            "_blank",
            "noopener,noreferrer",
          );
        }
        window.setTimeout(() => {
          fetchConnectedCalendars();
        }, 4000);
      } catch (err) {
        console.error("Failed to initiate calendar connection:", err);
      }
    },
    [fetchConnectedCalendars],
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

  const {
    isCollapsed,
    setIsCollapsed,
    toggleSidebar,
    selectedEventId,
    setSelectedEventId,
    selectedEventTitle,
    setSelectedEventTitle,
    selectedEventHref,
    setSelectedEventHref,
    setSelectedEventEditHref,
    activeEventTab,
    setActiveEventTab,
    clearEventContext,
  } = useSidebar();
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
  const isEventMenuActive = Boolean(selectedEventId);
  const overflowClass = isCompact
    ? "overflow-hidden"
    : isEventMenuActive
      ? "overflow-hidden"
    : isDesktop || isOpen
      ? "overflow-visible"
      : "overflow-hidden";
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const openButtonRef = useRef<HTMLButtonElement | null>(null);
  const asideRef = useRef<HTMLDivElement | null>(null);
  const categoriesRef = useRef<HTMLDivElement | null>(null);
  const eventSidebarRef = useRef<HTMLDivElement | null>(null);

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
          "[data-history-item]",
        ) as HTMLElement | null;
        const inSameItem =
          itemEl && itemEl.getAttribute("data-history-item") === itemMenuId;
        const inMenuPopover = (target as HTMLElement | null)?.closest(
          "[data-popover=item-menu]",
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
    // On small screens, auto-collapse the sidebar after navigation, unless the
    // user just selected an event and is in Event Menu context.
    try {
      const isNarrow =
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(max-width: 1023px)").matches;
      const currentPath =
        typeof window !== "undefined" ? window.location.pathname : pathname;
      const keepEventMenuOpen =
        Boolean(selectedEventId) &&
        Boolean(currentPath) &&
        String(currentPath).includes(String(selectedEventId));
      if (isNarrow && !keepEventMenuOpen) setIsCollapsed(true);
    } catch {}
  }, [pathname, selectedEventId, setIsCollapsed]);

  useEffect(() => {
    if (!isEventMenuActive) return;
    eventSidebarRef.current?.focus();
  }, [isEventMenuActive]);

  useEffect(() => {
    if (!isEventMenuActive) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        clearEventContext();
        setSidebarPage("myEvents");
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [clearEventContext, isEventMenuActive, setSidebarPage]);

  useEffect(() => {
    const isEventPage = pathname?.startsWith("/event/");
    if (!isEventPage && selectedEventId) {
      clearEventContext();
      setSidebarPage("root");
    }
  }, [clearEventContext, pathname, selectedEventId, setSidebarPage]);

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
    Boolean((session?.user as any)?.isAdmin),
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
      creditsValue: number | null,
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
            nextCredits,
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

  const openSnapFromSidebar = (mode: "camera" | "upload") => {
    try {
      router.push(`/?action=${mode}`);
      return;
    } catch {}
    triggerCreateEvent();
  };
  const handleSnapShortcutClick = (
    event: ReactMouseEvent<HTMLElement>,
    mode: "camera" | "upload",
  ) => {
    const win = window as any;
    const fn = mode === "camera" ? win.__openSnapCamera : win.__openSnapUpload;
    event.preventDefault();
    collapseSidebarOnTouch();
    try {
      if (typeof fn === "function") {
        fn();
        return;
      }
    } catch {}
    openSnapFromSidebar(mode);
  };

  const launchSnapFromMenu = (mode: "camera" | "upload") => {
    const win = window as any;
    const fn = mode === "camera" ? win.__openSnapCamera : win.__openSnapUpload;
    collapseSidebarOnTouch();
    setSidebarPage("root");
    try {
      if (typeof fn === "function") {
        fn();
        return;
      }
    } catch {}
    openSnapFromSidebar(mode);
  };
  const { visibleTemplateKeys } = useFeatureVisibility();
  const visibleTemplateLinks = useMemo(
    () => getTemplateLinks(visibleTemplateKeys),
    [visibleTemplateKeys],
  );

  const templateHrefMap = useMemo(() => {
    const map = new Map<string, string>();
    visibleTemplateLinks.forEach((t) => map.set(t.label, t.href));
    return map;
  }, [visibleTemplateLinks]);

  const handleCreateModalSelect = (label: string, fallbackHref?: string) => {
    if (label === "Snap Event") {
      launchSnapFromMenu("camera");
      return;
    }
    if (label === "Upload Event") {
      launchSnapFromMenu("upload");
      return;
    }
    if (label === "Smart sign-up forms" || label === "Sign up") {
      collapseSidebarOnTouch();
      setSidebarPage("root");
      router.push("/smart-signup-form");
      return;
    }
    const href = templateHrefMap.get(label) || fallbackHref;
    if (href) {
      collapseSidebarOnTouch();
      setSidebarPage("root");
      router.push(href);
      return;
    }
    setSidebarPage("root");
    triggerCreateEvent();
  };

  const createMenuItems = useMemo(() => {
    return getCreateEventSections(visibleTemplateKeys)
      .filter((section) => section.title.toLowerCase() !== "quick access")
      .flatMap((section) => section.items);
  }, [visibleTemplateKeys]);
  const createMenuOptionCount = useMemo(
    () => createMenuItems.length,
    [createMenuItems],
  );

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
  const drafts = useMemo(() => {
    const byId = new Map<
      string,
      { id: string; title: string; created_at?: string; data?: any }
    >();
    for (const row of history) {
      if (!row || typeof row !== "object") continue;
      const data: any = row.data || {};
      const status = String(data.status || "").toLowerCase();
      if (status !== "draft" || data.shared) continue;
      if (!byId.has(row.id)) {
        byId.set(row.id, row);
      }
    }
    return Array.from(byId.values());
  }, [history]);
  const draftsCount = drafts.length;
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
              data.practiceSchedule.groups.length > 0)),
        ) ||
        Boolean(
          data.schedule &&
          (data.schedule.detected ||
            (Array.isArray(data.schedule?.games) &&
              data.schedule.games.length > 0)),
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
      { icon: Home, label: "Home", href: "/" },
      { icon: Camera, label: "Snap", action: "snap" },
      { icon: Upload, label: "Upload", action: "upload" },
      {
        icon: FileEdit,
        label: "Sign up",
        href: "/smart-signup-form",
        badge: smartSignupCount,
      },
      { icon: Plus, label: "Create Event", action: "create" },
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
    [createdEventsCount, smartSignupCount],
  );
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>(
    {},
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
    sport_football_season: "Football Season",
    "sport football season": "Football Season",
    "football season": "Football Season",
    sport_gymnastics_schedule: "Gymnastics",
    sport_gymnastics: "Gymnastics",
    "gymnastics schedule": "Gymnastics",
    sport_cheerleading: "Cheerleading",
    "sport cheerleading": "Cheerleading",
    sport_dance_ballet: "Dance / Ballet",
    "sport dance ballet": "Dance / Ballet",
    sport_soccer: "Soccer",
    "sport soccer": "Soccer",
    sport_event: "Sport Event",
    "sport events": "Sport Events",
    general_event: "General Event",
    workshop_class: "Workshop / Class",
    gender_reveal: "Gender Reveal",
    dr_appointment: "Doctor Appointments",
    doctor_appointment: "Doctor Appointments",
    special_event: "Special Events",
  };

  const titleCase = (phrase: string) =>
    phrase
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  // Normalize freeform/variant labels to our canonical sidebar categories
  const normalizeCategoryLabel = (
    raw: string | null | undefined,
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
        s,
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
            .filter((c): c is string => Boolean(c)),
        ),
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
    color: string,
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

  const myEventsGrouped = useMemo(() => {
    const priority = new Map<string, number>([
      ["drafts", 0],
      ["birthdays", 1],
      ["general events", 2],
      ["weddings", 3],
    ]);

    const isHexColor = (value: string) =>
      /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
    const hexToRgba = (hex: string, alpha: number) => {
      const normalized =
        hex.length === 4
          ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
          : hex;
      const r = Number.parseInt(normalized.slice(1, 3), 16);
      const g = Number.parseInt(normalized.slice(3, 5), 16);
      const b = Number.parseInt(normalized.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    const resolveDateRaw = (row: { created_at?: string; data?: any }) =>
      String(
        row?.data?.startISO ||
          row?.data?.start ||
          row?.data?.event?.start ||
          row?.created_at ||
          "",
      );
    const formatDate = (raw: string) => {
      if (!raw) return "No date";
      const dt = new Date(raw);
      if (Number.isNaN(dt.getTime())) return "No date";
      return dt.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    };

    const groups = new Map<
      string,
      Array<{
        row: { id: string; title: string; created_at?: string; data?: any };
        href: string;
        title: string;
        dateLabel: string;
        dateMs: number;
        tintClass: string;
        hoverTintClass: string;
        swatchClass: string;
        style?: CSSProperties;
      }>
    >();

    for (const row of history) {
      if (!row || typeof row !== "object") continue;
      const data = (row as any)?.data || {};
      if (data?.signupForm) continue;

      const isDraft = String(data?.status || "").toLowerCase() === "draft";
      const normalizedCategory = normalizeCategoryLabel(
        (data?.category as string | null) ||
          guessCategoryFromText(
            `${row.title || ""} ${String(data?.description || "")}`,
          ),
      );
      const category = isDraft
        ? "Drafts"
        : normalizedCategory || "General Events";

      const dateRaw = resolveDateRaw(row);
      const parsedDateMs = dateRaw ? new Date(dateRaw).getTime() : NaN;
      const dateMs = Number.isNaN(parsedDateMs)
        ? Number.POSITIVE_INFINITY
        : parsedDateMs;
      const dateLabel = formatDate(dateRaw);
      const slug = String(row.title || "event")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const href = `/event/${slug || "event"}-${row.id}`;

      const categoryColor = categoryColors[category] || defaultCategoryColor(category);
      const palette = colorClasses(categoryColor);
      const eventHex = String(data?.color || data?.event?.color || "").trim();
      const style = isHexColor(eventHex)
        ? {
            backgroundColor: hexToRgba(eventHex, 0.12),
            borderColor: hexToRgba(eventHex, 0.26),
          }
        : undefined;

      const entry = {
        row,
        href,
        title: row.title || "Untitled event",
        dateLabel,
        dateMs,
        tintClass: palette.tint,
        hoverTintClass: palette.hoverTint,
        swatchClass: palette.swatch,
        style,
      };
      const existing = groups.get(category) || [];
      existing.push(entry);
      groups.set(category, existing);
    }

    return Array.from(groups.entries())
      .map(([category, items]) => ({
        category,
        items: [...items].sort((a, b) => {
          if (a.dateMs !== b.dateMs) return a.dateMs - b.dateMs;
          return a.title.localeCompare(b.title);
        }),
      }))
      .sort((a, b) => {
        const pa = priority.get(a.category.toLowerCase());
        const pb = priority.get(b.category.toLowerCase());
        if (typeof pa === "number" && typeof pb === "number") return pa - pb;
        if (typeof pa === "number") return -1;
        if (typeof pb === "number") return 1;
        return a.category.localeCompare(b.category);
      });
  }, [categoryColors, history]);

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
        }) as Record<string, string>,
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
        new CustomEvent("categoryColorsUpdated", { detail: categoryColors }),
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
        JSON.stringify(signupItemColors),
      );
    } catch {}
  }, [signupItemColors]);

  const sortHistoryRows = (
    rows: Array<{
      id: string;
      title: string;
      created_at?: string;
      data?: any;
    }>,
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
        const res = await fetch("/api/history?view=full&limit=40", {
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
              })),
            ),
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
                `/api/history?view=full&limit=40&t=${Date.now()}`,
                {
                  cache: "no-cache",
                  credentials: "include",
                },
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
                    })),
                  ),
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
                })),
              ),
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

  const shareHistoryItem = useCallback(async (prettyHref: string) => {
    try {
      const url = new URL(prettyHref, window.location.origin).toString();
      if ((navigator as any).share) {
        await (navigator as any).share({ title: "Envitefy", url });
      } else {
        await navigator.clipboard.writeText(url);
        alert("Link copied to clipboard");
      }
    } catch {}
  }, []);

  const withEventTab = useCallback(
    (href: string, tab: EventContextTab) => {
      try {
        const url = new URL(href, window.location.origin);
        url.searchParams.set("tab", tab);
        return `${url.pathname}${url.search}${url.hash}`;
      } catch {
        return href;
      }
    },
    [],
  );

  const openEventContext = useCallback(
    (row: { id: string; title: string; data?: any }, href: string) => {
      const title = row.title || "Untitled event";
      setSelectedEventId(row.id);
      setSelectedEventTitle(title);
      setSelectedEventHref(href);
      setSelectedEventEditHref(resolveEditHref(row.id, row.data, title));
      setActiveEventTab("dashboard");
      setSidebarPage("eventContext");
      router.push(withEventTab(href, "dashboard"));
    },
    [
      router,
      setActiveEventTab,
      setSelectedEventEditHref,
      setSelectedEventHref,
      setSelectedEventId,
      setSelectedEventTitle,
      setSidebarPage,
      withEventTab,
    ],
  );

  const handleEventTabChange = useCallback(
    (tab: EventContextTab) => {
      setActiveEventTab(tab);
      if (selectedEventHref) {
        router.push(withEventTab(selectedEventHref, tab));
      }
    },
    [router, selectedEventHref, setActiveEventTab, withEventTab],
  );

  const handleSidebarBackToMyEvents = useCallback(() => {
    clearEventContext();
    setSidebarPage("myEvents");
  }, [clearEventContext]);

  const renameHistoryItem = async (id: string, currentTitle: string) => {
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
        prev.map((r) => (r.id === id ? { ...r, title } : r)),
      );
    } catch {}
  };

  const deleteHistoryItem = async (id: string, title?: string) => {
    const ok = confirm(
      `Are you sure you want to delete this event?\n\n${
        title || "Untitled event"
      }`,
    );
    if (!ok) return;
    try {
      await fetch(`/api/history/${id}`, { method: "DELETE" });
      setHistory((prev) => prev.filter((r) => r.id !== id));
      if (selectedEventId === id) {
        clearEventContext();
      }
      // Notify other views (e.g., calendar) to remove events for this history id
      try {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("history:deleted", { detail: { id } }),
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
                        active ? "text-[#4b3f72]" : "text-[#8f86b3]"
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
                            ? "border-[#b9a7ea] bg-[#f7f3ff] hover:border-[#a892e3] shadow-[0_6px_16px_rgba(119,92,191,0.22)] ring-1 ring-[#d8ccf6]"
                            : "border-[#ddd3f5] bg-white hover:border-[#c7b7ee] hover:bg-[#f8f5ff]"
                        }`}
                        onClick={() => handleCalendarConnect(key)}
                      >
                        <Icon
                          className={`h-4 w-4 ${
                            active ? "text-[#5a4699]" : "text-[#8677b4]"
                          }`}
                        />
                        {active && (
                          <div className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#7c67be] flex items-center justify-center border-2 border-white shadow-sm">
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
                      {active ? (
                        <span className="rounded-full bg-[#efe9ff] px-1.5 py-0.5 text-[10px] font-medium leading-none text-[#5a4699]">
                          Connected
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              {!connectedCalendars.google &&
                !connectedCalendars.apple &&
                !connectedCalendars.microsoft && (
                  <p className="text-[11px] text-[#8f86b3]">
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

  const selectedHistoryRow = selectedEventId
    ? history.find((row) => row.id === selectedEventId)
    : null;
  const selectedEventLabel =
    selectedEventTitle || selectedHistoryRow?.title || "Untitled event";

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
        className={`fixed left-0 top-0 h-full z-[6000] border border-white/60 dark:border-white/10 backdrop-blur-2xl flex flex-col rounded-tr-[2.75rem] rounded-br-[2.75rem] shadow-[0_35px_90px_rgba(72,44,116,0.28)] ${overflowClass} transition-[transform,opacity,width] duration-200 ease-out will-change-transform ${pointerClass} lg:flex`}
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
            <Link
              href="/"
              onClick={collapseSidebarOnTouch}
              className="flex items-center justify-center cursor-pointer hover:opacity-100 transition-opacity"
            >
              <Image
                src={SIDEBAR_LOGO_SRC}
                alt="Envitefy"
                width={36}
                height={36}
                className="opacity-90 drop-shadow"
              />
            </Link>
            <button
              type="button"
              onClick={() => {
                setIsCollapsed(false);
                setSidebarPage("createEvent");
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
                      if (item.action === "snap")
                        return launchSnapFromMenu("camera");
                      if (item.action === "upload")
                        return launchSnapFromMenu("upload");
                      if (item.action === "create") {
                        setSidebarPage("createEvent");
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
              : "flex h-full w-full"
          } relative`}
          aria-hidden={isCompact}
        >
          <div className="relative h-full w-full overflow-hidden">
            <div className="absolute inset-0 z-[1] flex h-full flex-col">
          {/* Header with close button */}
          <div className="relative flex-shrink-0 px-4 pt-5 pb-5">
            {/* Hero-esque intro */}
            <div className={`${SIDEBAR_CARD_CLASS} px-4 py-5`}>
              <button
                type="button"
                aria-label={
                  isCollapsed ? "Expand navigation" : "Collapse navigation"
                }
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute top-1.5 right-2 inline-flex items-center justify-center rounded-full bg-white/90 p-1 text-[#7f8cff] shadow-md hover:bg-white transition"
              >
                {isCollapsed ? (
                  <ChevronRight size={16} />
                ) : (
                  <ChevronLeft size={16} />
                )}
              </button>
              <div className="flex flex-col items-center gap-3 text-center">
                <Link
                  href="/"
                  onClick={collapseSidebarOnTouch}
                  className="flex h-12 w-12 items-center justify-center"
                >
                  <Image
                    src={SIDEBAR_LOGO_SRC}
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
          {/* Middle: Navigation area */}
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex-shrink-0 px-4 pb-3">
              <div className="grid grid-cols-4 gap-3">
                <Link
                  href="/"
                  onClick={collapseSidebarOnTouch}
                  className="flex flex-col items-center justify-center gap-1 px-3 py-2 text-[10px] leading-tight font-semibold text-[#2f1d47] rounded-2xl bg-gradient-to-br from-[#eef1ff] via-white to-[#e6f0ff] border border-white/70 shadow-[0_12px_30px_rgba(109,87,184,0.12)] hover:-translate-y-0.5 transition"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-br from-[#9e88ff] to-[#6f8dff] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
                    <Home size={16} />
                  </span>
                  <span>Home</span>
                </Link>

                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    launchSnapFromMenu("camera");
                  }}
                  className="flex flex-col items-center justify-center gap-1 px-3 py-2 text-[10px] leading-tight font-semibold text-[#2f1d47] rounded-2xl bg-gradient-to-br from-[#eef1ff] via-white to-[#e6f0ff] border border-white/70 shadow-[0_12px_30px_rgba(109,87,184,0.12)] hover:-translate-y-0.5 transition"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-br from-[#89c4ff] to-[#7a5ec0] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
                    <Camera size={16} />
                  </span>
                  <span>Snap</span>
                </button>

                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    launchSnapFromMenu("upload");
                  }}
                  className="flex flex-col items-center justify-center gap-1 px-3 py-2 text-[10px] leading-tight font-semibold text-[#2f1d47] rounded-2xl bg-gradient-to-br from-[#eef1ff] via-white to-[#e6f0ff] border border-white/70 shadow-[0_12px_30px_rgba(109,87,184,0.12)] hover:-translate-y-0.5 transition"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7cd3ff] to-[#6f8dff] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
                    <Upload size={16} />
                  </span>
                  <span>Upload</span>
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      collapseSidebarOnTouch();
                      setSidebarPage("root");
                      router.push("/smart-signup-form");
                    }}
                    className="flex w-full flex-col items-center justify-center gap-1 px-3 py-2 text-[10px] leading-tight font-semibold text-[#2f1d47] rounded-2xl bg-gradient-to-br from-[#eef1ff] via-white to-[#e6f0ff] border border-white/70 shadow-[0_12px_30px_rgba(109,87,184,0.12)] hover:-translate-y-0.5 transition"
                    title="Sign up"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7bdc97] to-[#44bb63] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
                      <FileEdit size={16} />
                    </span>
                    <span>Sign up</span>
                  </button>
                  {smartSignupCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-[#8468ff] px-1 text-[10px] font-semibold text-white shadow-md">
                      {smartSignupCount}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="px-4">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-[#d9ccff] to-transparent" />
            </div>

            <div className="relative mt-3 min-h-0 flex-1 overflow-hidden">
              <div
                className={`absolute inset-0 overflow-y-auto no-scrollbar px-4 pb-5 transition-transform duration-[240ms] ease-in-out ${
                  sidebarPage === "root"
                    ? "translate-x-0 pointer-events-auto"
                    : "-translate-x-full pointer-events-none"
                }`}
                aria-hidden={sidebarPage !== "root"}
              >
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setSidebarPage("createEvent")}
                    className={`${SIDEBAR_ITEM_CARD_CLASS} w-full flex items-center gap-3 px-4 py-3 text-left text-sm md:text-base font-semibold text-[#2f1d47]`}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f4f4ff] to-white text-[#7d5ec2] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                      <Plus size={18} />
                    </span>
                    <span className="truncate">Create Event</span>
                    <span className="ml-auto flex items-center gap-2">
                      <span className={SIDEBAR_BADGE_CLASS}>{createMenuOptionCount}</span>
                      <ChevronRight size={16} className="text-[#7a5fc0]" />
                    </span>
                  </button>

                  <Link
                    href="/calendar"
                    onClick={collapseSidebarOnTouch}
                    className={`${SIDEBAR_ITEM_CARD_CLASS} w-full flex items-center gap-3 px-4 py-3 text-left text-sm md:text-base font-semibold text-[#2f1d47]`}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f4f4ff] to-white text-[#6f84ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                      <CalendarDays size={18} />
                    </span>
                    <span className="truncate">Calendar</span>
                    <span className="ml-auto inline-flex items-center rounded-full border border-white/70 bg-white/90 px-2 py-0.5 text-[11px] md:text-xs md:text-sm font-semibold text-[#6a4a83] shadow-inner">
                      {history.length}
                    </span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setSidebarPage("myEvents")}
                    className={`${SIDEBAR_ITEM_CARD_CLASS} w-full flex items-center gap-3 px-4 py-3 text-left text-sm md:text-base font-semibold text-[#2f1d47]`}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f4f4ff] to-white text-[#7d5ec2] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                      <Trophy size={18} />
                    </span>
                    <span className="truncate">My Events</span>
                    <span className="ml-auto flex items-center gap-2">
                      <span className={SIDEBAR_BADGE_CLASS}>{createdEventsCount}</span>
                      <ChevronRight size={16} className="text-[#7a5fc0]" />
                    </span>
                  </button>
                </div>
              </div>

              <div
                className={`absolute inset-0 overflow-y-auto no-scrollbar px-4 pb-5 transition-transform duration-[240ms] ease-in-out ${
                  sidebarPage === "createEvent"
                    ? "translate-x-0 pointer-events-auto"
                    : "translate-x-full pointer-events-none"
                }`}
                aria-hidden={sidebarPage !== "createEvent"}
              >
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setSidebarPage("root")}
                    className={`${SIDEBAR_ITEM_CARD_CLASS} w-full flex items-center gap-3 px-4 py-3 text-left text-sm md:text-base font-semibold text-[#2f1d47]`}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f4f4ff] to-white text-[#7d5ec2] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                      <ChevronLeft size={16} />
                    </span>
                    <span className="truncate">Create Event</span>
                  </button>

                  <div className="space-y-2">
                    {createMenuItems.map((item, idx) => {
                      const Icon = ICON_LOOKUP[item.label] || Sparkles;
                      const colorClass =
                        CREATE_SECTION_COLORS[idx % CREATE_SECTION_COLORS.length];
                      return (
                        <button
                          key={item.label}
                          type="button"
                          className={`${SIDEBAR_ITEM_CARD_CLASS} w-full flex items-center gap-3 px-4 py-3 text-left text-sm md:text-base font-semibold text-[#2f1d47]`}
                          onClick={() =>
                            handleCreateModalSelect(item.label, (item as any).href)
                          }
                        >
                          <span
                            className={`flex h-9 w-9 items-center justify-center rounded-2xl ${colorClass}`}
                          >
                            <Icon size={16} />
                          </span>
                          <span className="truncate">{item.label}</span>
                          <ChevronRight size={16} className="ml-auto text-[#7a5fc0]" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div
                className={`absolute inset-0 overflow-y-auto no-scrollbar px-4 pb-5 transition-transform duration-[240ms] ease-in-out ${
                  sidebarPage === "myEvents"
                    ? "translate-x-0 pointer-events-auto"
                    : sidebarPage === "eventContext"
                      ? "-translate-x-full pointer-events-none"
                      : "translate-x-full pointer-events-none"
                }`}
                aria-hidden={sidebarPage !== "myEvents"}
              >
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setSidebarPage("root")}
                    className={`${SIDEBAR_ITEM_CARD_CLASS} w-full flex items-center gap-3 px-4 py-3 text-left text-sm md:text-base font-semibold text-[#2f1d47]`}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f4f4ff] to-white text-[#7d5ec2] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                      <ChevronLeft size={16} />
                    </span>
                    <span className="truncate">My Events</span>
                  </button>

                  <div className="space-y-3">
                    {myEventsGrouped.length === 0 ? (
                      <div className={`${SIDEBAR_ITEM_CARD_CLASS} px-4 py-3 text-sm text-[#6b5a92]`}>
                        No events yet.
                      </div>
                    ) : (
                      myEventsGrouped.map((group) => (
                        <section key={group.category} className="space-y-2">
                          <div className="px-1 pt-2">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8c80b3]">
                              {group.category}
                            </p>
                            <div className="mt-1 h-px w-full bg-gradient-to-r from-[#e8e0fb] via-[#eee7ff] to-transparent" />
                          </div>
                          {group.items.map((item) => (
                            <button
                              key={item.row.id}
                              type="button"
                              onClick={() => openEventContext(item.row, item.href)}
                              className={`${SIDEBAR_ITEM_CARD_CLASS} ${item.tintClass} ${item.hoverTintClass} w-full flex items-start gap-3 px-4 py-3 text-left text-[#2f1d47]`}
                              style={item.style}
                            >
                              <span
                                className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full border border-white/70 ${item.swatchClass}`}
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm md:text-base font-semibold">
                                  {item.title}
                                </span>
                                <span className="mt-0.5 block truncate text-xs text-[#7f72a7]">
                                  {item.dateLabel}
                                </span>
                              </span>
                              <ChevronRight
                                size={16}
                                className="mt-1 shrink-0 text-[#7a5fc0]"
                                aria-hidden="true"
                              />
                            </button>
                          ))}
                        </section>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div
                className={`absolute inset-0 overflow-hidden transition-transform duration-[240ms] ease-in-out ${
                  sidebarPage === "eventContext"
                    ? "translate-x-0 pointer-events-auto"
                    : "translate-x-full pointer-events-none"
                }`}
                aria-hidden={sidebarPage !== "eventContext"}
              >
                <EventSidebar
                  ref={eventSidebarRef}
                  eventTitle={selectedEventLabel}
                  activeEventTab={activeEventTab}
                  onBack={handleSidebarBackToMyEvents}
                  onTabChange={handleEventTabChange}
                />
              </div>
            </div>
          </div>

          {/* Bottom: User button with dropdown */}
          <div className="border-t border-[#ddd6f5] py-2 px-3">
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
                className="w-full inline-flex items-center justify-between gap-3 px-3 py-1.5 rounded-md text-[#4b3f72] transition-colors duration-150 hover:text-[#34275c] hover:bg-[#f1edff] active:bg-[#eae3ff] focus:outline-none focus:ring-2 focus:ring-[#b8aae8]/60"
              >
                <div className="min-w-0 flex-1 inline-flex items-center gap-2">
                  <div className="min-w-0 flex-1 text-left">
                    <div className="truncate text-sm font-medium">
                      {displayName}
                    </div>
                    {userEmail && (
                      <div className="truncate text-xs md:text-sm text-[#8d84b3]">
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
                  className={`h-4 w-4 text-[#8a7ec0] transition-transform ${
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
                    className="pointer-events-auto w-56 rounded-2xl border border-[#d9d3f3] bg-[linear-gradient(180deg,#ffffff_0%,#f3efff_100%)] shadow-[0_20px_44px_rgba(92,67,156,0.18)] overflow-visible"
                  >
                    <div className="p-2">
                      <Link
                        href="/settings"
                        onClick={() => {
                          setMenuOpen(false);
                        }}
                        className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#4b3f72] hover:text-[#34275c] hover:bg-[#f1edff] transition-all"
                      >
                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#efebff] text-[#7264a7] group-hover:bg-[#e7e1ff]">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          >
                            <circle cx="12" cy="7" r="4" />
                            <path d="M5.5 21v-2a6.5 6.5 0 0 1 13 0v2" />
                          </svg>
                        </span>
                        <span className="text-sm md:text-base">Profile</span>
                      </Link>

                      <div className="mt-1 relative">
                        <button
                          type="button"
                          onClick={() => {
                            setCalendarsOpenFloating((v) => !v);
                          }}
                          className="group w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-[#4b3f72] hover:text-[#34275c] hover:bg-[#f1edff] transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#efebff] text-[#7264a7] group-hover:bg-[#e7e1ff]">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-3.5 w-3.5"
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
                            </span>
                            <span className="text-sm md:text-base">
                              Calendar
                            </span>
                          </div>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`h-4 w-4 text-[#8a7ec0] transition-transform ${
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
                                      active
                                        ? "text-[#4b3f72]"
                                        : "text-[#8f86b3]"
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
                                          ? "border-[#b9a7ea] bg-[#f7f3ff] hover:border-[#a892e3] shadow-[0_6px_16px_rgba(119,92,191,0.22)] ring-1 ring-[#d8ccf6]"
                                          : "border-[#ddd3f5] bg-white hover:border-[#c7b7ee] hover:bg-[#f8f5ff]"
                                      }`}
                                      onClick={() => handleCalendarConnect(key)}
                                    >
                                      <Icon
                                        className={`h-4 w-4 ${
                                          active
                                            ? "text-[#5a4699]"
                                            : "text-[#8677b4]"
                                        }`}
                                      />
                                      {active && (
                                        <div className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#7c67be] flex items-center justify-center border-2 border-white shadow-sm">
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
                                    {active ? (
                                      <span className="rounded-full bg-[#efe9ff] px-1.5 py-0.5 text-[10px] font-medium leading-none text-[#5a4699]">
                                        Connected
                                      </span>
                                    ) : null}
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
                        className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#4b3f72] hover:text-[#34275c] hover:bg-[#f1edff] transition-all"
                      >
                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#efebff] text-[#7264a7] group-hover:bg-[#e7e1ff]">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                          </svg>
                        </span>
                        <span className="text-sm md:text-base">About us</span>
                      </Link>

                      <Link
                        href="/contact"
                        onClick={() => {
                          setMenuOpen(false);
                        }}
                        className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#4b3f72] hover:text-[#34275c] hover:bg-[#f1edff] transition-all"
                      >
                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#efebff] text-[#7264a7] group-hover:bg-[#e7e1ff]">
                          <svg
                            fill="currentColor"
                            viewBox="0 0 492.014 492.014"
                            className="h-3.5 w-3.5"
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
                        </span>
                        <span className="text-sm md:text-base">Contact us</span>
                      </Link>

                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => {
                            setMenuOpen(false);
                          }}
                          className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#4b3f72] hover:text-[#34275c] hover:bg-[#f1edff] transition-all"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4 text-[#6e655f]"
                            aria-hidden="true"
                          >
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                          <span className="text-sm md:text-base">Admin</span>
                        </Link>
                      )}

                      <div className="my-1 h-px bg-gradient-to-r from-transparent via-[#d8d2f3] to-transparent" />
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#f0618a] hover:text-[#e44a79] hover:bg-[#ffeef5] transition-all"
                      >
                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#ffe8f0] text-current group-hover:bg-[#ffdce9]">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3.5 w-3.5 text-current"
                            aria-hidden="true"
                          >
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                          </svg>
                        </span>
                        <span className="text-sm md:text-base">Log out</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
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
            ) : (colorMenuFor || "").startsWith("signup-item:") ? (
              <div className="grid grid-cols-4 gap-2 px-2 pb-2 pt-2 mt-1 place-items-center">
                {SHARED_GRADIENTS.map((g) => {
                  const historyId = String(
                    (colorMenuFor || "").split(":")[1] || "",
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
                          (colorMenuFor || "").split(":")[1] || "",
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
          document.body,
        )}
    </>
  );
}

