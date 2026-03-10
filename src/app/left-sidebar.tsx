"use client";
import Link from "next/link";
import Image from "next/image";
import {
  readProfileCache,
  writeProfileCache,
  clearProfileCache,
  PROFILE_CACHE_TTL_MS,
} from "@/utils/profileCache";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useSidebar, type EventContextTab } from "./sidebar-context";
import { signOut, useSession } from "next-auth/react";
import {
  CalendarIconGoogle,
  CalendarIconOutlook,
  CalendarIconApple,
} from "@/components/CalendarIcons";
import { buildEventPath } from "@/utils/event-url";
import { resolveEditHref } from "@/utils/event-edit-route";
import { isSportsPreviewFirstEvent } from "@/utils/event-navigation";
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
  Users,
  LogOut,
} from "lucide-react";
import { useMenu } from "@/contexts/MenuContext";
import EventSidebar from "@/components/navigation/EventSidebar";

type CalendarProviderKey = "google" | "microsoft" | "apple";
type SidebarPage =
  | "root"
  | "createEvent"
  | "myEvents"
  | "invitedEvents"
  | "eventContext";
type EventSidebarMode = "owner" | "guest";
type EventListPage = "myEvents" | "invitedEvents";
type SubscriptionPlan = "freemium" | "free" | "monthly" | "yearly" | "FF" | null;
type HistoryRow = {
  id: string;
  title: string;
  created_at?: string;
  data?: unknown;
};
type GroupedEventItem = {
  row: HistoryRow;
  href: string;
  openMode: "dashboard" | "preview";
  title: string;
  dateLabel: string;
  dateMs: number;
  tintClass: string;
  hoverTintClass: string;
  activeTintClass: string;
  activeCardClass: string;
  swatchClass: string;
  style?: CSSProperties;
};
type GroupedEventSection = {
  category: string;
  items: GroupedEventItem[];
};

function CustomizeIcon({
  size = 16,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 400 400"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M289.17578 0.73828125L54.380859 235.5332L1.0996094 399.26172L165.19336 344.16992L187.53711 321.82617C177.68256 319.88348 158.75128 315.90115 158.21875 315.78906L157.85938 316.14844L84.302734 240.9668L289.17578 36.09375L363.54492 110.46289L316.17773 157.83008L320.19531 189.16797L398.90039 110.46289L289.17578 0.73828125ZM281.83203 163.19336C270.77592 163.19336 269.37826 163.27942 267.94727 164.04688C265.14245 165.55111 264.85252 166.72771 263.74609 181.03125C263.19412 188.16694 262.55189 194.23765 262.32031 194.52148C262.08872 194.8053 260.18213 195.51959 258.08203 196.10742C252.04822 197.79633 246.3826 200.07368 240.19727 203.29883C237.04805 204.9409 234.21892 206.28516 233.91016 206.28516C233.60139 206.28516 229.29567 202.82446 224.34375 198.59375C213.22439 189.09388 212.91077 188.85375 211.04883 188.45898C208.38004 187.89314 206.15654 189.48233 197.63281 198.05664C189.26418 206.47494 187.92021 208.38988 188.49023 211.08203C188.87351 212.89217 189.17315 213.28457 198.61133 224.30664C202.84304 229.24851 206.30469 233.55227 206.30469 233.87109C206.30469 234.18993 204.96238 237.02656 203.32031 240.17578C200.09516 246.36111 197.81585 252.02674 196.12695 258.06055C195.53912 260.16065 194.8268 262.0692 194.54297 262.30078C194.25916 262.53237 188.18842 263.17264 181.05273 263.72461C166.74918 264.83104 165.57065 265.1229 164.06641 267.92773C163.29898 269.35871 163.21289 270.75638 163.21289 281.8125C163.21289 292.86861 163.29896 294.26628 164.06641 295.69727C165.56685 298.495 166.76575 298.79318 180.82031 299.87305C187.82859 300.41151 193.87887 300.94643 194.26562 301.06055C194.70017 301.18876 195.39204 302.81688 196.07617 305.32422C197.74204 311.4296 200.00473 317.0885 203.32031 323.44727C204.96238 326.59647 206.30469 329.43479 206.30469 329.75391C206.30469 330.07307 202.99913 334.19519 198.95898 338.91406C187.30414 352.52676 187.35285 352.44496 189.12109 356.09766C190.51939 358.98616 205.97014 374.16562 208.27539 374.91602C211.2097 375.87112 212.58085 375.0396 223.54688 365.6582L233.74219 356.9375L239.36914 359.89453C246.13777 363.45243 252.99071 366.22091 258.37109 367.57031C261.04072 368.24001 262.41868 368.81502 262.57227 369.32422C262.69797 369.74082 263.23863 375.81602 263.77539 382.82422C264.85185 396.87932 265.15026 398.07803 267.94727 399.57812C269.37826 400.34552 270.77592 400.43164 281.83203 400.43164C292.88815 400.43164 294.2858 400.34562 295.7168 399.57812C298.51381 398.07813 298.81221 396.87932 299.88867 382.82422C300.42542 375.81602 300.96578 369.751 301.08789 369.3457C301.23507 368.857 302.90699 368.18019 306.05078 367.33789C311.91978 365.76539 317.11849 363.65014 323.87891 360.08594C326.74416 358.57534 329.36525 357.33984 329.70312 357.33984C330.04101 357.33984 334.36838 360.8024 339.32031 365.0332C344.27224 369.2638 349.0111 373.2573 349.85156 373.9082C352.02278 375.5888 354.76932 375.58298 357.20898 373.89258C360.31805 371.73818 373.96964 357.62151 374.75 355.75391C376.07812 352.57521 375.58997 351.71735 366.11328 340.59961C361.29867 334.95134 357.35938 330.04628 357.35938 329.69922C357.35938 329.35217 358.59485 326.72464 360.10547 323.85938C363.66968 317.09895 365.78488 311.90025 367.35742 306.03125C368.19976 302.88746 368.8766 301.2136 369.36523 301.06641C369.77059 300.9443 375.83548 300.40589 382.84375 299.86914C396.89881 298.79268 398.09761 298.49428 399.59766 295.69727C400.3651 294.26628 400.45117 292.86861 400.45117 281.8125C400.45117 270.75638 400.36511 269.35871 399.59766 267.92773C398.09245 265.12109 396.91881 264.83106 382.61328 263.73242C374.00527 263.07134 369.43312 262.53903 369.0293 262.15039C368.69455 261.82822 368.01615 259.98367 367.52148 258.05273C366.17059 252.77943 363.67502 246.56088 360.3457 240.17578C358.70363 237.02656 357.35938 234.17822 357.35938 233.8457C357.35938 233.51317 361.19356 228.76372 365.87891 223.29102C375.0543 212.57378 375.89132 211.18414 374.9375 208.25391C374.1919 205.96332 359.00615 190.49851 356.14062 189.11133C352.69841 187.44499 352.05532 187.79341 340.60938 197.5293C334.94838 202.34453 330.06446 206.28516 329.75586 206.28516C329.44726 206.28516 326.60862 204.93527 323.44727 203.28516C317.25857 200.0549 310.0369 197.18463 304.65234 195.81445C302.5931 195.29045 301.21006 194.68372 301.08203 194.25C300.96708 193.86067 300.433 187.80905 299.89453 180.80078C298.81466 166.74621 298.51454 165.54731 295.7168 164.04688C294.28581 163.27944 292.88815 163.19336 281.83203 163.19336ZM283.01172 230.00586C294.06405 230.23279 305.04385 233.9998 314.22266 241.34375C330.35089 254.24794 337.1023 275.01034 331.84961 295.55273C330.51119 300.78705 326.03202 309.55604 322.34766 314.15234C313.97649 324.59547 302.09068 331.30346 288.55078 333.22852C285.58646 333.64994 278.41448 333.79363 276.73633 333.46484C276.35405 333.38996 274.47776 333.07435 272.56641 332.76367C266.07989 331.70922 258.77774 328.75201 252.87305 324.78711C236.71443 313.93697 227.72241 294.03948 230.41602 275.09375C232.18593 262.64488 238.62336 250.60114 247.66602 242.81836C257.86666 234.03893 270.48575 229.74867 283.01172 230.00586ZM70.892578 265.64258L133.67969 328.42969L73.666016 348.71094L51.214844 326.26172L70.892578 265.64258Z" />
    </svg>
  );
}

function isInvitedHistoryEvent(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const record = data as Record<string, unknown>;
  if (Boolean(record.shared)) return true;
  if (Boolean(record.invitedFromScan)) return true;
  const createdVia = String(record.createdVia || "")
    .trim()
    .toLowerCase();
  return createdVia === "ocr";
}

const CALENDAR_TARGETS: Array<{
  key: CalendarProviderKey;
  label: string;
  Icon: typeof CalendarIconGoogle;
}> = [
  { key: "google", label: "Google", Icon: CalendarIconGoogle },
  { key: "apple", label: "Apple", Icon: CalendarIconApple },
  { key: "microsoft", label: "Outlook", Icon: CalendarIconOutlook },
];
const CALENDAR_DEFAULT_STORAGE_KEY = "envitefy:event-actions:calendar-default:v1";

function normalizeCalendarProvider(value: unknown): CalendarProviderKey | null {
  if (typeof value !== "string") return null;
  const provider = value.trim().toLowerCase();
  if (provider === "google" || provider === "microsoft" || provider === "apple") {
    return provider;
  }
  return null;
}

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
  "border border-indigo-100 bg-indigo-50 text-indigo-600",
  "border border-sky-100 bg-sky-50 text-sky-600",
  "border border-emerald-100 bg-emerald-50 text-emerald-600",
  "border border-amber-100 bg-amber-50 text-amber-600",
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

// TEMPLATE_LINKS now imported from TopNav.tsx (shared menu)

const SIDEBAR_CARD_CLASS =
  "rounded-none bg-transparent shadow-none";
const SIDEBAR_ITEM_CARD_CLASS =
  "rounded-xl border border-transparent bg-transparent shadow-none transition-[background-color,color,transform] duration-150 hover:bg-[#e8e8e8]";
const SIDEBAR_BADGE_CLASS =
  "inline-flex min-w-6 items-center justify-center rounded-full bg-[#dcdcdc] px-2 py-0.5 text-[11px] font-semibold text-slate-600";
const SIDEBAR_WIDTH_REM = "20rem";
const SIDEBAR_COLLAPSED_REM = "4.5rem";
const SIDEBAR_WORDMARK_SRC = "/navElogo.png";
const SUBPAGE_STICKY_HEADER_CLASS =
  "sticky top-0 z-20 -mx-4 bg-[#efefef] px-4 pb-3 pt-2";
const SIDEBAR_SECTION_LABEL_CLASS =
  "px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500";
const SIDEBAR_DIVIDER_CLASS = "h-px w-full bg-transparent";
const SIDEBAR_MENU_ROW_CLASS =
  "flex w-full items-center gap-3 px-3 py-2 text-left text-sm font-medium text-slate-700";
const SIDEBAR_BACK_ROW_CLASS =
  "flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-slate-700";
const SIDEBAR_ICON_CHIP_CLASS =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-transparent bg-transparent text-slate-500";
const SIDEBAR_ICON_CHIP_ACCENT_CLASS =
  "border-transparent bg-transparent text-slate-500";
const SIDEBAR_PANEL_CLASS =
  "absolute inset-0 overflow-y-auto no-scrollbar px-4 pb-5";
const SIDEBAR_EVENT_PANEL_CLASS = "absolute inset-0 overflow-hidden bg-[#efefef]";
const SIDEBAR_TOGGLE_CLASS =
  "inline-flex items-center justify-center rounded-full border border-transparent bg-[#e6e6e6] p-2 text-slate-500 shadow-none transition hover:bg-[#dddddd] hover:text-slate-700";
const SIDEBAR_FOOTER_TRIGGER_CLASS =
  "w-full inline-flex items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2 text-slate-700 transition-colors duration-150 hover:bg-[#e8e8e8] focus:outline-none focus:ring-2 focus:ring-slate-300";
const MY_EVENTS_PAST_EXPANDED_STORAGE_KEY = "sidebar:my-events:past-expanded";
const INVITED_EVENTS_PAST_EXPANDED_STORAGE_KEY =
  "sidebar:invited-events:past-expanded";

export default function LeftSidebar() {
  const { data: session, status } = useSession();
  const {
    connectedCalendars,
    handleCalendarConnect,
    refreshConnectedCalendars,
    featureVisibility,
  } = useMenu();
  const profileEmail = (session?.user as any)?.email?.toLowerCase?.() ?? null;
  const profileEmailRef = useRef<string | null>(null);
  useEffect(() => {
    if (profileEmail) {
      profileEmailRef.current = profileEmail;
    }
  }, [profileEmail]);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isEmbeddedEditMode = searchParams?.get("embed") === "1";
  // Event page with inline edit sidebar (discovery gymnastics)
  const isEventPageWithEditSidebar = Boolean(
    pathname?.startsWith("/event/") && searchParams?.get("edit")
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuFloatingView, setMenuFloatingView] = useState<"main" | "calendar">(
    "main"
  );
  const [menuMainHeight, setMenuMainHeight] = useState<number | null>(null);
  const [sidebarPage, setSidebarPage] = useState<SidebarPage>("root");
  const [showPastMyEvents, setShowPastMyEvents] = useState(false);
  const [showPastInvitedEvents, setShowPastInvitedEvents] = useState(false);
  const [eventSidebarMode, setEventSidebarMode] =
    useState<EventSidebarMode>("owner");
  const [eventContextSourcePage, setEventContextSourcePage] =
    useState<EventListPage>("myEvents");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [defaultCalendarProvider, setDefaultCalendarProvider] =
    useState<CalendarProviderKey | null>(null);

  const mirrorLocalCalendarDefault = useCallback(
    (provider: CalendarProviderKey | null) => {
      if (typeof window === "undefined") return;
      try {
        if (!provider) {
          window.localStorage.removeItem(CALENDAR_DEFAULT_STORAGE_KEY);
          return;
        }
        window.localStorage.setItem(CALENDAR_DEFAULT_STORAGE_KEY, provider);
      } catch {}
    },
    []
  );

  const saveCalendarDefault = useCallback(
    async (provider: CalendarProviderKey | null) => {
      if (status !== "authenticated") return;
      try {
        await fetch("/api/user/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ preferredProvider: provider }),
        });
      } catch {}
    },
    [status]
  );

  const toggleCalendarDefault = useCallback(
    async (provider: CalendarProviderKey) => {
      const requiresConnection =
        provider === "google" || provider === "microsoft";
      const isConnected = connectedCalendars[provider];
      if (requiresConnection && !isConnected) {
        handleCalendarConnect(provider);
        return;
      }
      const nextProvider =
        defaultCalendarProvider === provider ? null : provider;
      setDefaultCalendarProvider(nextProvider);
      mirrorLocalCalendarDefault(nextProvider);
      void saveCalendarDefault(nextProvider);
    },
    [
      connectedCalendars,
      defaultCalendarProvider,
      handleCalendarConnect,
      mirrorLocalCalendarDefault,
      saveCalendarDefault,
    ]
  );

  const {
    isCollapsed,
    setIsCollapsed,
    selectedEventId,
    setSelectedEventId,
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
  const overflowClass = "overflow-hidden";
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuMainContentRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const openButtonRef = useRef<HTMLButtonElement | null>(null);
  const openBarButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastSidebarOpenAtRef = useRef(0);
  const openedFromTouchRef = useRef(false);
  const asideRef = useRef<HTMLDivElement | null>(null);
  const eventSidebarRef = useRef<HTMLDivElement | null>(null);
  const invitedNavigationPendingRef = useRef(false);
  const prevSidebarPageRef = useRef<SidebarPage>("root");
  const showEditTopBar = isEventPageWithEditSidebar;
  const showMobileTopBar = Boolean(!isOpen && isScrolled);
  const showFloatingOpenButton = Boolean(!isOpen && !isScrolled);
  const showFloatingCustomizeButton = Boolean(
    !isOpen && showEditTopBar && !isScrolled
  );
  const openSidebarFromTrigger = useCallback(
    (viaTouch: boolean) => {
      lastSidebarOpenAtRef.current = Date.now();
      if (viaTouch) {
        openedFromTouchRef.current = true;
      }
      setIsCollapsed(false);
    },
    [setIsCollapsed]
  );

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
    if (typeof window === "undefined") return;
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setMenuOpen(false);
      return;
    }
    // Track open transitions from any trigger (floating hamburger, top nav,
    // keyboard, etc.) so close handlers can ignore same-gesture events.
    lastSidebarOpenAtRef.current = Date.now();
  }, [isOpen]);

  useEffect(() => {
    if (!openedFromTouchRef.current) return;
    // Reset touch-open guard shortly after open so normal close gestures work.
    const timeout = window.setTimeout(() => {
      openedFromTouchRef.current = false;
    }, 1600);
    return () => window.clearTimeout(timeout);
  }, [isOpen]);

  // Refresh shared calendar status when auth state changes.
  useEffect(() => {
    if (status === "authenticated") {
      void refreshConnectedCalendars();
    }
  }, [status, refreshConnectedCalendars]);

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
      // Ignore the synthetic "outside" click that can fire immediately after
      // opening from the mobile hamburger (especially on iOS).
      if (Date.now() - lastSidebarOpenAtRef.current < 1200) return;
      if (openedFromTouchRef.current) return;
      // Ignore clicks originating from the hamburger open button
      if (
        (openButtonRef.current &&
          openButtonRef.current.contains(target as Node)) ||
        (openBarButtonRef.current &&
          openBarButtonRef.current.contains(target as Node))
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
    if (!menuOpen) setMenuFloatingView("main");
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen || menuFloatingView !== "main") return;
    const node = menuMainContentRef.current;
    if (!node) return;
    const measure = () => {
      setMenuMainHeight(node.offsetHeight || null);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [menuFloatingView, menuOpen]);

  // Always close menus on route change so navigation from a menu item hides the dropdowns.
  useEffect(() => {
    setMenuOpen(false);
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
        setSidebarPage(eventContextSourcePage);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [
    clearEventContext,
    eventContextSourcePage,
    isEventMenuActive,
    setSidebarPage,
  ]);

  useEffect(() => {
    if (!selectedEventId) return;
    if (invitedNavigationPendingRef.current) return;
    const isEventPage = pathname?.startsWith("/event/");
    if (isEventPage) return;
    // When an event is selected we first switch panel state, then route.
    // Avoid clearing context during that transition window.
    if (sidebarPage === "eventContext") return;
    clearEventContext();
    setSidebarPage("root");
  }, [
    clearEventContext,
    pathname,
    selectedEventId,
    setSidebarPage,
    sidebarPage,
  ]);

  useEffect(() => {
    if (invitedNavigationPendingRef.current) return;
    if (pathname !== "/") return;
    const hasEventContext =
      Boolean(selectedEventId) || sidebarPage === "eventContext";
    if (!hasEventContext) return;
    clearEventContext();
    setSidebarPage("root");
  }, [
    clearEventContext,
    pathname,
    selectedEventId,
    setSidebarPage,
    sidebarPage,
  ]);

  useEffect(() => {
    if (!invitedNavigationPendingRef.current) return;
    if (!pathname || pathname === "/") return;
    invitedNavigationPendingRef.current = false;
  }, [pathname]);

  useEffect(() => {
    const prevPage = prevSidebarPageRef.current;
    if (sidebarPage === "invitedEvents" && prevPage !== "invitedEvents") {
      setShowPastInvitedEvents(false);
    }
    prevSidebarPageRef.current = sidebarPage;
  }, [sidebarPage]);

  const displayName =
    (session?.user?.name as string) ||
    (session?.user?.email as string) ||
    "User";
  const userEmail = session?.user?.email as string | undefined;
  const profileInitials = useMemo(() => {
    const source = String(displayName || userEmail || "U").trim();
    if (!source) return "U";
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }, [displayName, userEmail]);
  // Deprecated scanCredits removed; use unified credits state
  const [credits, setCredits] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(
    Boolean((session?.user as any)?.isAdmin)
  );
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    let ignore = false;

    const applyProfile = (plan: SubscriptionPlan, creditsValue: number | null) => {
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
          setDefaultCalendarProvider(
            normalizeCalendarProvider(json.preferredProvider)
          );
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
      setCredits(null);
    }
    return () => {
      ignore = true;
    };
  }, [status, profileEmail, session?.user]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(CALENDAR_DEFAULT_STORAGE_KEY);
      const provider = normalizeCalendarProvider(raw);
      if (provider) setDefaultCalendarProvider(provider);
    } catch {}
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!defaultCalendarProvider) return;
    if (
      defaultCalendarProvider === "google" &&
      !connectedCalendars.google
    ) {
      setDefaultCalendarProvider(null);
      mirrorLocalCalendarDefault(null);
      void saveCalendarDefault(null);
      return;
    }
    if (
      defaultCalendarProvider === "microsoft" &&
      !connectedCalendars.microsoft
    ) {
      setDefaultCalendarProvider(null);
      mirrorLocalCalendarDefault(null);
      void saveCalendarDefault(null);
    }
  }, [
    connectedCalendars.google,
    connectedCalendars.microsoft,
    defaultCalendarProvider,
    mirrorLocalCalendarDefault,
    saveCalendarDefault,
    status,
  ]);

  useEffect(() => {
    setIsAdmin(Boolean((session?.user as any)?.isAdmin));
  }, [session?.user]);

  // Stop showing credits in the UI
  const showCreditsShell = false;
  const creditsAreKnown =
    profileLoaded && typeof credits === "number" && credits >= 0;
  const creditsValue =
    typeof credits === "number" && credits >= 0 ? credits : 0;
  const collapseSidebarOnTouch = useCallback(() => {
    try {
      const isTouch =
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(hover: none), (pointer: coarse)").matches;
      if (isTouch) setIsCollapsed(true);
    } catch {}
  }, [setIsCollapsed]);
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
  const goHomeFromSidebar = useCallback(() => {
    clearEventContext();
    setSidebarPage("root");
    collapseSidebarOnTouch();
  }, [clearEventContext, setSidebarPage, collapseSidebarOnTouch]);
  const visibleTemplateKeys = featureVisibility.visibleTemplateKeys;
  const visibleTemplateLinks = useMemo(
    () => getTemplateLinks(visibleTemplateKeys),
    [visibleTemplateKeys]
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
    return getCreateEventSections(visibleTemplateKeys).flatMap(
      (section) => section.items
    );
  }, [visibleTemplateKeys]);
  const createMenuOptionCount = useMemo(
    () => createMenuItems.length,
    [createMenuItems]
  );

  const [history, setHistory] = useState<HistoryRow[]>([]);
  const isActiveEventRow = useCallback((row: HistoryRow) => {
    if (!row || typeof row !== "object") return false;
    const data: any = row?.data;
    if (!data || typeof data !== "object" || data.signupForm) return false;

    const status = String(data?.status || "")
      .trim()
      .toLowerCase();
    if (
      status === "draft" ||
      status === "cancelled" ||
      status === "canceled" ||
      status === "archived"
    ) {
      return false;
    }

    const dateRaw = String(
      data?.startISO || data?.start || data?.event?.start || row?.created_at || ""
    );
    const parsedDateMs = dateRaw ? new Date(dateRaw).getTime() : NaN;
    if (!Number.isFinite(parsedDateMs)) return true;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return parsedDateMs >= startOfToday.getTime();
  }, []);
  const createdEventsCount = useMemo(() => {
    return history.reduce((acc, row) => {
      if (!row || typeof row !== "object") return acc;
      const data: any = row?.data;
      if (!data || typeof data !== "object") return acc;
      if (isInvitedHistoryEvent(data) || !isActiveEventRow(row)) return acc;
      return acc + 1;
    }, 0);
  }, [history, isActiveEventRow]);
  const invitedEventsCount = useMemo(() => {
    return history.reduce((acc, row) => {
      if (!row || typeof row !== "object") return acc;
      const data: any = row?.data;
      if (!data || typeof data !== "object") return acc;
      if (!isInvitedHistoryEvent(data) || !isActiveEventRow(row)) return acc;
      return acc + 1;
    }, 0);
  }, [history, isActiveEventRow]);
  const calendarEventsCount = createdEventsCount + invitedEventsCount;
  const smartSignupCount = useMemo(() => {
    const myEmail = profileEmail || profileEmailRef.current || null;
    const myUserId = ((session as any)?.user?.id as string | undefined) || null;
    return history.reduce((acc, row) => {
      if (!row || typeof row !== "object") return acc;
      const data: any = row?.data;
      if (!data || typeof data !== "object") return acc;
      const form = (data as any)?.signupForm;
      if (!form || typeof form !== "object") return acc;

      // If it's the owner's item (not invited/shared), always count it as a created form
      if (!isInvitedHistoryEvent(data)) return acc + 1;

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
    [createdEventsCount, smartSignupCount]
  );
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
    try {
      const rawMyEvents = localStorage.getItem(
        MY_EVENTS_PAST_EXPANDED_STORAGE_KEY
      );
      setShowPastMyEvents(rawMyEvents === "1" || rawMyEvents === "true");
    } catch {}
    try {
      const rawInvitedEvents = localStorage.getItem(
        INVITED_EVENTS_PAST_EXPANDED_STORAGE_KEY
      );
      setShowPastInvitedEvents(
        rawInvitedEvents === "1" || rawInvitedEvents === "true"
      );
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

  const colorClasses = (
    color: string
  ): { swatch: string; badge: string; tint: string; hoverTint: string } => {
    switch (color) {
      case "lime":
        return {
          swatch: "bg-lime-500 border-lime-200",
          badge: "border-lime-200 bg-lime-50 text-lime-700",
          tint: "border-lime-100 bg-lime-50/80",
          hoverTint: "hover:border-lime-200 hover:bg-lime-100/80",
        };
      case "zinc":
        return {
          swatch: "bg-zinc-500 border-zinc-200",
          badge: "border-zinc-200 bg-zinc-50 text-zinc-700",
          tint: "border-zinc-100 bg-zinc-50/80",
          hoverTint: "hover:border-zinc-200 hover:bg-zinc-100/80",
        };
      case "neutral":
        return {
          swatch: "bg-neutral-500 border-neutral-200",
          badge: "border-neutral-200 bg-neutral-50 text-neutral-700",
          tint: "border-neutral-100 bg-neutral-50/80",
          hoverTint: "hover:border-neutral-200 hover:bg-neutral-100/80",
        };
      case "stone":
        return {
          swatch: "bg-stone-500 border-stone-200",
          badge: "border-stone-200 bg-stone-50 text-stone-700",
          tint: "border-stone-100 bg-stone-50/80",
          hoverTint: "hover:border-stone-200 hover:bg-stone-100/80",
        };
      case "gray":
        return {
          swatch: "bg-gray-500 border-gray-200",
          badge: "border-gray-200 bg-gray-50 text-gray-700",
          tint: "border-gray-100 bg-gray-50/80",
          hoverTint: "hover:border-gray-200 hover:bg-gray-100/80",
        };
      case "red":
        return {
          swatch: "bg-red-500 border-red-200",
          badge: "border-red-200 bg-red-50 text-red-700",
          tint: "border-red-100 bg-red-50/80",
          hoverTint: "hover:border-red-200 hover:bg-red-100/80",
        };
      case "pink":
        return {
          swatch: "bg-pink-500 border-pink-200",
          badge: "border-pink-200 bg-pink-50 text-pink-700",
          tint: "border-pink-100 bg-pink-50/80",
          hoverTint: "hover:border-pink-200 hover:bg-pink-100/80",
        };
      case "rose":
        return {
          swatch: "bg-rose-500 border-rose-200",
          badge: "border-rose-200 bg-rose-50 text-rose-700",
          tint: "border-rose-100 bg-rose-50/80",
          hoverTint: "hover:border-rose-200 hover:bg-rose-100/80",
        };
      case "fuchsia":
        return {
          swatch: "bg-fuchsia-500 border-fuchsia-200",
          badge: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
          tint: "border-fuchsia-100 bg-fuchsia-50/80",
          hoverTint: "hover:border-fuchsia-200 hover:bg-fuchsia-100/80",
        };
      case "violet":
        return {
          swatch: "bg-violet-500 border-violet-200",
          badge: "border-violet-200 bg-violet-50 text-violet-700",
          tint: "border-violet-100 bg-violet-50/80",
          hoverTint: "hover:border-violet-200 hover:bg-violet-100/80",
        };
      case "purple":
        return {
          swatch: "bg-purple-500 border-purple-200",
          badge: "border-purple-200 bg-purple-50 text-purple-700",
          tint: "border-purple-100 bg-purple-50/80",
          hoverTint: "hover:border-purple-200 hover:bg-purple-100/80",
        };
      case "indigo":
        return {
          swatch: "bg-indigo-500 border-indigo-200",
          badge: "border-indigo-200 bg-indigo-50 text-indigo-700",
          tint: "border-indigo-100 bg-indigo-50/80",
          hoverTint: "hover:border-indigo-200 hover:bg-indigo-100/80",
        };
      case "blue":
        return {
          swatch: "bg-blue-500 border-blue-200",
          badge: "border-blue-200 bg-blue-50 text-blue-700",
          tint: "border-blue-100 bg-blue-50/80",
          hoverTint: "hover:border-blue-200 hover:bg-blue-100/80",
        };
      case "sky":
        return {
          swatch: "bg-sky-500 border-sky-200",
          badge: "border-sky-200 bg-sky-50 text-sky-700",
          tint: "border-sky-100 bg-sky-50/80",
          hoverTint: "hover:border-sky-200 hover:bg-sky-100/80",
        };
      case "cyan":
        return {
          swatch: "bg-cyan-500 border-cyan-200",
          badge: "border-cyan-200 bg-cyan-50 text-cyan-700",
          tint: "border-cyan-100 bg-cyan-50/80",
          hoverTint: "hover:border-cyan-200 hover:bg-cyan-100/80",
        };
      case "teal":
        return {
          swatch: "bg-teal-500 border-teal-200",
          badge: "border-teal-200 bg-teal-50 text-teal-700",
          tint: "border-teal-100 bg-teal-50/80",
          hoverTint: "hover:border-teal-200 hover:bg-teal-100/80",
        };
      case "emerald":
        return {
          swatch: "bg-emerald-500 border-emerald-200",
          badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
          tint: "border-emerald-100 bg-emerald-50/80",
          hoverTint: "hover:border-emerald-200 hover:bg-emerald-100/80",
        };
      case "green":
        return {
          swatch: "bg-green-500 border-green-200",
          badge: "border-green-200 bg-green-50 text-green-700",
          tint: "border-green-100 bg-green-50/80",
          hoverTint: "hover:border-green-200 hover:bg-green-100/80",
        };
      case "yellow":
        return {
          swatch: "bg-yellow-500 border-yellow-200",
          badge: "border-yellow-200 bg-yellow-50 text-yellow-700",
          tint: "border-yellow-100 bg-yellow-50/80",
          hoverTint: "hover:border-yellow-200 hover:bg-yellow-100/80",
        };
      case "amber":
        return {
          swatch: "bg-amber-500 border-amber-200",
          badge: "border-amber-200 bg-amber-50 text-amber-700",
          tint: "border-amber-100 bg-amber-50/80",
          hoverTint: "hover:border-amber-200 hover:bg-amber-100/80",
        };
      case "orange":
        return {
          swatch: "bg-orange-500 border-orange-200",
          badge: "border-orange-200 bg-orange-50 text-orange-700",
          tint: "border-orange-100 bg-orange-50/80",
          hoverTint: "hover:border-orange-200 hover:bg-orange-100/80",
        };
      case "slate":
        return {
          swatch: "bg-slate-500 border-slate-200",
          badge: "border-slate-200 bg-slate-50 text-slate-700",
          tint: "border-slate-100 bg-slate-50/80",
          hoverTint: "hover:border-slate-200 hover:bg-slate-100/80",
        };
      default:
        return {
          swatch: "bg-slate-400 border-slate-200",
          badge: "border-slate-200 bg-slate-50 text-slate-700",
          tint: "border-slate-100 bg-slate-50/80",
          hoverTint: "hover:border-slate-200 hover:bg-slate-100/80",
        };
    }
  };

  const activeEventCardClasses = (color: string): string => {
    switch (color) {
      case "purple":
      case "violet":
      case "fuchsia":
      case "indigo":
      case "pink":
        return "!bg-purple-100 !border-purple-200";
      case "blue":
      case "sky":
      case "cyan":
        return "!bg-blue-100 !border-blue-200";
      case "teal":
      case "emerald":
      case "green":
      case "lime":
        return "!bg-emerald-100 !border-emerald-200";
      case "yellow":
      case "amber":
      case "orange":
        return "!bg-amber-100 !border-amber-200";
      case "red":
      case "rose":
        return "!bg-rose-100 !border-rose-200";
      default:
        return "!bg-slate-100 !border-slate-200";
    }
  };

  const groupedEventLists = useMemo(() => {
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
          ""
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
    const createBuckets = () => ({
      upcoming: new Map<string, GroupedEventItem[]>(),
      past: new Map<string, GroupedEventItem[]>(),
    });
    const bucketsByList: Record<
      EventListPage,
      ReturnType<typeof createBuckets>
    > = {
      myEvents: createBuckets(),
      invitedEvents: createBuckets(),
    };
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayMs = startOfToday.getTime();

    for (const row of history) {
      if (!row || typeof row !== "object") continue;
      const data = (row as any)?.data || {};
      if (data?.signupForm) continue;
      const isInvited = isInvitedHistoryEvent(data);
      const targetList: EventListPage = isInvited
        ? "invitedEvents"
        : "myEvents";

      const isDraft = String(data?.status || "").toLowerCase() === "draft";
      const normalizedCategoryRaw = normalizeCategoryLabel(
        (data?.category as string | null) ||
          guessCategoryFromText(
            `${row.title || ""} ${String(data?.description || "")}`
          )
      );
      const normalizedCategory =
        isInvited &&
        String(normalizedCategoryRaw || "")
          .trim()
          .toLowerCase() === "shared events"
          ? "Invited Events"
          : normalizedCategoryRaw;
      const category = isDraft
        ? "Drafts"
        : normalizedCategory || "General Events";

      const dateRaw = resolveDateRaw(row);
      const parsedDateMs = dateRaw ? new Date(dateRaw).getTime() : NaN;
      const dateMs = Number.isNaN(parsedDateMs)
        ? Number.POSITIVE_INFINITY
        : parsedDateMs;
      const dateLabel = formatDate(dateRaw);
      const href = buildEventPath(row.id, row.title);
      const openMode: GroupedEventItem["openMode"] = isSportsPreviewFirstEvent(data)
        ? "preview"
        : "dashboard";

      const categoryColor =
        categoryColors[category] || defaultCategoryColor(category);
      const palette = colorClasses(isInvited ? "slate" : categoryColor);
      const activePalette = colorClasses(categoryColor);
      const eventHex = String(data?.color || data?.event?.color || "").trim();
      const style =
        !isInvited && isHexColor(eventHex)
          ? {
              backgroundColor: hexToRgba(eventHex, 0.12),
              borderColor: hexToRgba(eventHex, 0.26),
            }
          : undefined;

      const entry = {
        row,
        href,
        openMode,
        title: row.title || "Untitled event",
        dateLabel,
        dateMs,
        tintClass: palette.tint,
        hoverTintClass: palette.hoverTint,
        activeTintClass: activePalette.tint,
        activeCardClass: activeEventCardClasses(categoryColor),
        swatchClass: palette.swatch,
        style,
      };
      const targetBuckets = bucketsByList[targetList];
      const targetGroups =
        Number.isFinite(dateMs) && dateMs < startOfTodayMs
          ? targetBuckets.past
          : targetBuckets.upcoming;
      const existing = targetGroups.get(category) || [];
      existing.push(entry);
      targetGroups.set(category, existing);
    }

    const sortGroups = (
      source: Map<string, GroupedEventItem[]>
    ): GroupedEventSection[] =>
      Array.from(source.entries())
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

    return {
      myEvents: {
        upcoming: sortGroups(bucketsByList.myEvents.upcoming),
        past: sortGroups(bucketsByList.myEvents.past),
      },
      invitedEvents: {
        upcoming: sortGroups(bucketsByList.invitedEvents.upcoming),
        past: sortGroups(bucketsByList.invitedEvents.past),
      },
    };
  }, [categoryColors, history]);
  const myEventsGrouped = groupedEventLists.myEvents;
  const invitedEventsGrouped = groupedEventLists.invitedEvents;

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

  // Item-specific Smart sign-up color helpers
  const getSignupItemGradientId = (historyId: string): string => {
    const val = signupItemColors[historyId];
    const exists = SIGNUP_GRADIENTS.some((g) => g.id === val);
    return exists ? (val as string) : getSignupGradientId();
  };

  const setSignupItemColor = (historyId: string, color: string) => {
    if (!historyId) return;
    setSignupItemColors((prev) => ({ ...prev, [historyId]: color }));
    setColorMenuFor(null);
    setColorMenuPos(null);
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

  useEffect(() => {
    try {
      localStorage.setItem(
        MY_EVENTS_PAST_EXPANDED_STORAGE_KEY,
        showPastMyEvents ? "1" : "0"
      );
    } catch {}
  }, [showPastMyEvents]);

  useEffect(() => {
    try {
      localStorage.setItem(
        INVITED_EVENTS_PAST_EXPANDED_STORAGE_KEY,
        showPastInvitedEvents ? "1" : "0"
      );
    } catch {}
  }, [showPastInvitedEvents]);

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
        const res = await fetch("/api/history?view=sidebar&limit=40", {
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
                `/api/history?view=sidebar&limit=40&t=${Date.now()}`,
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
          const res = await fetch("/api/history?view=sidebar&limit=40", {
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

  useEffect(() => {
    let cancelled = false;
    const pendingTimeouts = new Set<ReturnType<typeof setTimeout>>();

    const onDeleted = async (e: Event) => {
      try {
        const anyEvent = e as any;
        const detail = (anyEvent && anyEvent.detail) || null;
        const deletedId =
          detail && detail.id != null ? String(detail.id).trim() : "";

        if (!deletedId) {
          return;
        }

        // Remove immediately for responsive UI.
        setHistory((prev) => prev.filter((row) => row.id !== deletedId));

        // If the deleted event is currently selected in sidebar context, clear it.
        if (selectedEventId === deletedId) {
          clearEventContext();
        }

        // Refetch shortly after delete to fully sync computed sidebar sections/counts.
        const refetchTimeout = setTimeout(async () => {
          pendingTimeouts.delete(refetchTimeout as any);
          if (cancelled || status !== "authenticated") return;
          try {
            const res = await fetch(
              `/api/history?view=sidebar&limit=40&t=${Date.now()}`,
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
            }
          } catch {}
        }, 350);

        pendingTimeouts.add(refetchTimeout as any);
      } catch {}
    };

    window.addEventListener("history:deleted", onDeleted as EventListener);
    return () => {
      cancelled = true;
      window.removeEventListener("history:deleted", onDeleted as EventListener);
      pendingTimeouts.forEach((timeout) => clearTimeout(timeout as any));
      pendingTimeouts.clear();
    };
  }, [clearEventContext, selectedEventId, status]);

  const buildEventOwnerHref = useCallback(
    (
      baseHref: string | null | undefined,
      eventId: string,
      tab: EventContextTab
    ) => {
      const fallbackPath = `/event/${encodeURIComponent(eventId)}`;
      try {
        const normalizedBase =
          typeof baseHref === "string" && baseHref.trim()
            ? baseHref
            : fallbackPath;
        const parsed = new URL(normalizedBase, "https://envitefy.local");
        parsed.searchParams.set("tab", tab);
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
      } catch {
        return `${fallbackPath}?tab=${encodeURIComponent(tab)}`;
      }
    },
    []
  );

  const buildEventGuestHref = useCallback(
    (baseHref: string | null | undefined, eventId: string) => {
      const fallbackPath = `/event/${encodeURIComponent(eventId)}`;
      try {
        const normalizedBase =
          typeof baseHref === "string" && baseHref.trim()
            ? baseHref
            : fallbackPath;
        const parsed = new URL(normalizedBase, "https://envitefy.local");
        parsed.searchParams.set("tab", "preview");
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
      } catch {
        return `${fallbackPath}?tab=preview`;
      }
    },
    []
  );

  const blurActiveElement = useCallback(() => {
    try {
      const active = document.activeElement;
      if (active instanceof HTMLElement) active.blur();
    } catch {}
  }, []);

  const openOwnerEventContext = useCallback(
    (item: GroupedEventItem) => {
      const { row, href, openMode } = item;
      const title = row.title || "Untitled event";

      blurActiveElement();

      if (openMode === "preview") {
        clearEventContext();
        setSidebarPage("myEvents");
        try {
          router.prefetch(href);
        } catch {}
        router.push(href);
        return;
      }

      setSelectedEventId(row.id);
      setSelectedEventTitle(title);
      setSelectedEventHref(href);
      setSelectedEventEditHref(resolveEditHref(row.id, row.data, title));
      setActiveEventTab("dashboard");
      setEventSidebarMode("owner");
      setEventContextSourcePage("myEvents");
      setSidebarPage("eventContext");
      router.push(buildEventOwnerHref(href, row.id, "dashboard"));
    },
    [
      blurActiveElement,
      buildEventOwnerHref,
      clearEventContext,
      router,
      setEventContextSourcePage,
      setEventSidebarMode,
      setActiveEventTab,
      setSelectedEventEditHref,
      setSelectedEventHref,
      setSelectedEventId,
      setSelectedEventTitle,
      setSidebarPage,
    ]
  );

  const openGuestEventContext = useCallback(
    (row: HistoryRow, href: string) => {
      const nextHref = buildEventGuestHref(href, row.id);
      // Invited events should navigate directly to the event page and never
      // transition into the event context/sidebar preview panel.
      clearEventContext();
      setSidebarPage("invitedEvents");
      invitedNavigationPendingRef.current = true;
      try {
        router.prefetch(nextHref);
      } catch {}
      router.push(nextHref);
    },
    [buildEventGuestHref, clearEventContext, router, setSidebarPage]
  );

  const isHistoryRowActive = useCallback(
    (rowId: string) => {
      if (!rowId) return false;
      if (selectedEventId === rowId) return true;
      const currentPath = String(pathname || "");
      if (!currentPath) return false;
      return (
        currentPath === `/event/${rowId}` ||
        currentPath === `/smart-signup-form/${rowId}` ||
        currentPath.endsWith(`-${rowId}`)
      );
    },
    [pathname, selectedEventId]
  );

  const handleEventTabChange = useCallback(
    (tab: EventContextTab) => {
      if (eventSidebarMode === "guest") {
        setActiveEventTab("dashboard");
        try {
          if (!selectedEventId) return;
          const nextHref = buildEventGuestHref(
            selectedEventHref,
            selectedEventId
          );
          router.push(nextHref);
        } catch {}
        blurActiveElement();
        setSidebarPage("eventContext");
        return;
      }
      setActiveEventTab(tab);
      try {
        if (!selectedEventId) return;
        const nextHref = buildEventOwnerHref(
          selectedEventHref,
          selectedEventId,
          tab
        );
        router.push(nextHref);
      } catch {}
      blurActiveElement();
      setSidebarPage("eventContext");
    },
    [
      blurActiveElement,
      buildEventGuestHref,
      buildEventOwnerHref,
      eventSidebarMode,
      router,
      selectedEventHref,
      selectedEventId,
      setActiveEventTab,
      setSidebarPage,
    ]
  );

  const handleSidebarBackToEvents = useCallback(() => {
    clearEventContext();
    setSidebarPage(eventContextSourcePage);
  }, [clearEventContext, eventContextSourcePage]);

  if (status !== "authenticated") return null;
  // Avoid SSR/client mismatch by rendering sidebar only after hydration
  if (!isHydrated) return null;

  const panelTransitionStyle: CSSProperties = {
    transition:
      "transform 350ms cubic-bezier(0.4, 0, 0.2, 1), opacity 220ms ease-in-out",
  };
  const rootPanelTransform =
    sidebarPage === "root" ? "translateX(0%)" : "translateX(-100%)";
  const createEventPanelTransform =
    sidebarPage === "createEvent" ? "translateX(0%)" : "translateX(100%)";
  const myEventsPanelTransform =
    sidebarPage === "myEvents"
      ? "translateX(0%)"
      : sidebarPage === "eventContext" && eventContextSourcePage === "myEvents"
      ? "translateX(-100%)"
      : "translateX(100%)";
  const invitedEventsPanelTransform =
    sidebarPage === "invitedEvents"
      ? "translateX(0%)"
      : sidebarPage === "eventContext" &&
        eventContextSourcePage === "invitedEvents"
      ? "translateX(-100%)"
      : "translateX(100%)";
  const eventPanelTransform =
    sidebarPage === "eventContext" ? "translateX(0%)" : "translateX(100%)";
  const panelStyle = (transform: string, isActive: boolean): CSSProperties => ({
    ...panelTransitionStyle,
    transform,
    pointerEvents: isActive ? "auto" : "none",
    opacity: isActive ? 1 : 0,
  });

  if (isEmbeddedEditMode) return null;

  return (
    <>
      {!isOpen && (
        <>
          {showFloatingOpenButton && (
            <div className="fixed top-3 left-3 z-[6500] transform transition-all duration-500 lg:hidden scale-100 opacity-100">
              <button
                ref={openButtonRef}
                type="button"
                className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm touch-manipulation cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  openSidebarFromTrigger(false);
                }}
                onPointerDown={(e) => {
                  // Fire immediately on pointer down for reliable mobile touch (iOS Safari
                  // often drops click on fixed elements after scroll). Pointer events unify
                  // touch and mouse, so this works across devices.
                  if (e.pointerType === "touch") {
                    e.preventDefault();
                    e.stopPropagation();
                    openSidebarFromTrigger(true);
                  }
                }}
                onTouchStart={(e) => {
                  // Fallback for browsers/devices that don't consistently emit PointerEvents.
                  e.preventDefault();
                  e.stopPropagation();
                  openSidebarFromTrigger(true);
                }}
                aria-label="Open navigation"
              >
                <Menu size={20} />
              </button>
            </div>
          )}
          {showFloatingCustomizeButton && (
            <div className="fixed top-3 right-3 z-[6500] transform transition-all duration-500 lg:hidden scale-100 opacity-100">
              <button
                type="button"
                onClick={() => {
                  if (typeof window === "undefined") return;
                  window.dispatchEvent(
                    new CustomEvent("envitefy:open-discovery-editor")
                  );
                }}
                className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm touch-manipulation cursor-pointer"
                aria-label="Customize your meet"
              >
                <CustomizeIcon size={16} />
              </button>
            </div>
          )}

          <header
            className={`fixed inset-x-0 top-0 z-[6500] flex items-center justify-between px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] transition-all duration-300 ease-in-out lg:hidden ${
              showMobileTopBar
                ? "translate-y-0 opacity-100 pointer-events-auto bg-[#efefef]/95 backdrop-blur-md"
                : "-translate-y-full opacity-0 pointer-events-none border-transparent bg-transparent"
            }`}
          >
            <button
              ref={openBarButtonRef}
              type="button"
              className="inline-flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm touch-manipulation cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                openSidebarFromTrigger(false);
              }}
              onPointerDown={(e) => {
                if (e.pointerType === "touch") {
                  e.preventDefault();
                  e.stopPropagation();
                  openSidebarFromTrigger(true);
                }
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openSidebarFromTrigger(true);
              }}
              aria-label="Open navigation"
            >
              <Menu size={19} />
            </button>
            <Link
              href="/"
              onClick={goHomeFromSidebar}
              className="inline-flex items-center"
            >
              <Image
                src="/navElogo.png"
                alt="Envitefy logo"
                width={100}
                height={32}
                className="drop-shadow-sm"
              />
            </Link>
            {showEditTopBar ? (
              <button
                type="button"
                onClick={() => {
                  if (typeof window === "undefined") return;
                  window.dispatchEvent(
                    new CustomEvent("envitefy:open-discovery-editor")
                  );
                }}
                className="inline-flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm touch-manipulation cursor-pointer"
                aria-label="Customize your meet"
              >
                <CustomizeIcon size={14} />
              </button>
            ) : (
              <div className="h-10 w-10" aria-hidden="true" />
            )}
          </header>
        </>
      )}
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 z-[5999] bg-black/20 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => {
          if (Date.now() - lastSidebarOpenAtRef.current < 1200) return;
          if (openedFromTouchRef.current) return;
          setIsCollapsed(true);
        }}
        aria-hidden="true"
      />
      <aside
        ref={asideRef}
        className={`fixed left-0 top-0 z-[6000] flex h-full flex-col bg-[#efefef] ${overflowClass} transition-[transform,opacity,width] duration-200 ease-out will-change-transform ${pointerClass} lg:flex`}
        style={{
          width: sidebarWidth,
          transform: sidebarTransform,
          opacity: isDesktop ? 1 : isOpen ? 1 : 0,
          backgroundColor: "#efefef",
          boxShadow: "none",
        }}
        aria-label="Sidebar"
      >
        {isCompact && (
          <div className="flex h-full flex-col items-center gap-4 bg-[#efefef] px-2 py-5">
            <button
              type="button"
              aria-label="Expand navigation"
              onClick={() => setIsCollapsed(false)}
              className={SIDEBAR_TOGGLE_CLASS}
            >
              <ChevronRight size={18} />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCollapsed(false);
                setSidebarPage("createEvent");
              }}
              className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-transparent bg-transparent text-slate-600 transition hover:bg-[#e8e8e8]"
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
                    className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-transparent bg-transparent text-slate-600 transition hover:bg-[#e8e8e8] hover:text-slate-900"
                    title={item.label}
                  >
                    <Icon size={18} />
                    {badgeCount > 0 && (
                      <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-semibold text-white shadow-sm">
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
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-transparent bg-transparent text-red-500 transition hover:bg-[#e8e8e8]"
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
            <div className="absolute inset-0 z-[1] flex h-full flex-col bg-[#efefef]">
              {/* Header with close button */}
              <div className="relative flex-shrink-0 px-4 pb-2 pt-4">
                <div className={`${SIDEBAR_CARD_CLASS} px-1 py-1`}>
                  <button
                    type="button"
                    aria-label={
                      isCollapsed ? "Expand navigation" : "Collapse navigation"
                    }
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`absolute right-3 top-3 ${SIDEBAR_TOGGLE_CLASS}`}
                  >
                    {isCollapsed ? (
                      <ChevronRight size={16} />
                    ) : (
                      <ChevronLeft size={16} />
                    )}
                  </button>
                  <Link
                    href="/"
                    onClick={goHomeFromSidebar}
                    className="inline-flex max-w-[120px] pr-10"
                  >
                    <Image
                      src={SIDEBAR_WORDMARK_SRC}
                      alt="Envitefy"
                      width={106}
                      height={28}
                      className="h-auto w-[106px]"
                    />
                  </Link>
                </div>
              </div>
              {/* Middle: Navigation area */}
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="px-4">
                  <div className={SIDEBAR_DIVIDER_CLASS} />
                </div>

                <div className="relative mt-2 min-h-0 flex-1 overflow-hidden">
                  <div
                    className={`${SIDEBAR_PANEL_CLASS} z-[5]`}
                    style={panelStyle(rootPanelTransform, sidebarPage === "root")}
                    aria-hidden={sidebarPage !== "root"}
                  >
                    <div className="space-y-1.5">
                      <p className={SIDEBAR_SECTION_LABEL_CLASS}>Main Menu</p>
                      <div className="-ml-2 mr-2 space-y-0.5">
                        <Link
                          href="/"
                          onClick={goHomeFromSidebar}
                          className={`${SIDEBAR_ITEM_CARD_CLASS} ${SIDEBAR_MENU_ROW_CLASS} py-1.5 pr-5`}
                        >
                          <span
                            className={`${SIDEBAR_ICON_CHIP_CLASS} ${SIDEBAR_ICON_CHIP_ACCENT_CLASS}`}
                          >
                            <Home size={18} />
                          </span>
                          <span className="truncate">Home</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => setSidebarPage("createEvent")}
                          className={`${SIDEBAR_ITEM_CARD_CLASS} ${SIDEBAR_MENU_ROW_CLASS} py-1.5 pr-5`}
                        >
                          <span
                            className={`${SIDEBAR_ICON_CHIP_CLASS} ${SIDEBAR_ICON_CHIP_ACCENT_CLASS}`}
                          >
                            <Plus size={18} />
                          </span>
                          <span className="truncate">Create Event</span>
                          <span className="ml-auto flex items-center gap-2">
                            <span className={SIDEBAR_BADGE_CLASS}>
                              {createMenuOptionCount}
                            </span>
                            <ChevronRight size={16} className="text-slate-400" />
                          </span>
                        </button>

                        <Link
                          href="/calendar"
                          onClick={collapseSidebarOnTouch}
                          className={`${SIDEBAR_ITEM_CARD_CLASS} ${SIDEBAR_MENU_ROW_CLASS} py-1.5 pr-5`}
                        >
                          <span
                            className={`${SIDEBAR_ICON_CHIP_CLASS} ${SIDEBAR_ICON_CHIP_ACCENT_CLASS}`}
                          >
                            <CalendarDays size={18} />
                          </span>
                          <span className="truncate">Calendar</span>
                          <span className={`ml-auto ${SIDEBAR_BADGE_CLASS}`}>
                            {calendarEventsCount}
                          </span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => setSidebarPage("myEvents")}
                          className={`${SIDEBAR_ITEM_CARD_CLASS} ${SIDEBAR_MENU_ROW_CLASS} py-1.5 pr-5`}
                        >
                          <span
                            className={`${SIDEBAR_ICON_CHIP_CLASS} ${SIDEBAR_ICON_CHIP_ACCENT_CLASS}`}
                          >
                            <Trophy size={18} />
                          </span>
                          <span className="truncate">My Events</span>
                          <span className="ml-auto flex items-center gap-2">
                            <span className={SIDEBAR_BADGE_CLASS}>
                              {createdEventsCount}
                            </span>
                            <ChevronRight size={16} className="text-slate-400" />
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSidebarPage("invitedEvents")}
                          className={`${SIDEBAR_ITEM_CARD_CLASS} ${SIDEBAR_MENU_ROW_CLASS} py-1.5 pr-5`}
                        >
                          <span
                            className={`${SIDEBAR_ICON_CHIP_CLASS} ${SIDEBAR_ICON_CHIP_ACCENT_CLASS}`}
                          >
                            <Users size={18} />
                          </span>
                          <span className="truncate">Invited Events</span>
                          <span className="ml-auto flex items-center gap-2">
                            <span className={SIDEBAR_BADGE_CLASS}>
                              {invitedEventsCount}
                            </span>
                            <ChevronRight size={16} className="text-slate-400" />
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`${SIDEBAR_PANEL_CLASS} z-[10]`}
                    style={panelStyle(
                      createEventPanelTransform,
                      sidebarPage === "createEvent"
                    )}
                    aria-hidden={sidebarPage !== "createEvent"}
                  >
                    <div className="space-y-1.5">
                      <div className={SUBPAGE_STICKY_HEADER_CLASS}>
                        <button
                          type="button"
                          onClick={() => setSidebarPage("root")}
                          className={`${SIDEBAR_ITEM_CARD_CLASS} ${SIDEBAR_BACK_ROW_CLASS}`}
                        >
                          <span
                            className={`${SIDEBAR_ICON_CHIP_CLASS} ${SIDEBAR_ICON_CHIP_ACCENT_CLASS}`}
                          >
                            <ChevronLeft size={16} />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-500">
                              Back to Menu
                            </span>
                            <span className="block truncate text-sm font-semibold text-slate-900">
                              Create Event
                            </span>
                          </span>
                        </button>
                      </div>

                      <p className={SIDEBAR_SECTION_LABEL_CLASS}>Create Event</p>
                      <div className="space-y-1">
                        {createMenuItems.map((item, idx) => {
                          const Icon = ICON_LOOKUP[item.label] || Sparkles;
                          const colorClass =
                            CREATE_SECTION_COLORS[
                              idx % CREATE_SECTION_COLORS.length
                            ];
                          return (
                            <button
                              key={item.label}
                              type="button"
                              className={`${SIDEBAR_ITEM_CARD_CLASS} ${SIDEBAR_MENU_ROW_CLASS}`}
                              onClick={() =>
                                handleCreateModalSelect(item.label, item.href)
                              }
                            >
                              <span
                                className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorClass}`}
                              >
                                <Icon size={16} />
                              </span>
                              <span className="truncate">{item.label}</span>
                              <ChevronRight
                                size={16}
                                className="ml-auto text-slate-400"
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`${SIDEBAR_PANEL_CLASS} z-[15]`}
                    style={panelStyle(
                      myEventsPanelTransform,
                      sidebarPage === "myEvents"
                    )}
                    aria-hidden={sidebarPage !== "myEvents"}
                  >
                    <div className="space-y-1.5">
                      <div className={SUBPAGE_STICKY_HEADER_CLASS}>
                        <button
                          type="button"
                          onClick={() => setSidebarPage("root")}
                          className={`${SIDEBAR_ITEM_CARD_CLASS} ${SIDEBAR_BACK_ROW_CLASS}`}
                        >
                          <span
                            className={`${SIDEBAR_ICON_CHIP_CLASS} ${SIDEBAR_ICON_CHIP_ACCENT_CLASS}`}
                          >
                            <ChevronLeft size={16} />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-500">
                              Back to Menu
                            </span>
                            <span className="block truncate text-sm font-semibold text-slate-900">
                              My Events
                            </span>
                          </span>
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {myEventsGrouped.upcoming.length === 0 &&
                        myEventsGrouped.past.length === 0 ? (
                          <div
                            className={`${SIDEBAR_ITEM_CARD_CLASS} px-4 py-3 text-sm text-slate-500`}
                          >
                            No events yet.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {myEventsGrouped.upcoming.length === 0 ? (
                              <div
                                className={`${SIDEBAR_ITEM_CARD_CLASS} px-4 py-3 text-sm text-slate-500`}
                              >
                                No upcoming events.
                              </div>
                            ) : (
                              myEventsGrouped.upcoming.map((group) => (
                                <section
                                  key={`upcoming-${group.category}`}
                                  className="space-y-1"
                                >
                                  <div className="px-1 pt-1">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                      {group.category}
                                    </p>
                                    <div className={`mt-1 ${SIDEBAR_DIVIDER_CLASS}`} />
                                  </div>
                                  {group.items.map((item) => (
                                    <button
                                      key={item.row.id}
                                      type="button"
                                      onClick={() => openOwnerEventContext(item)}
                                      className={`${SIDEBAR_ITEM_CARD_CLASS} ${
                                        isHistoryRowActive(item.row.id)
                                          ? `${item.activeCardClass} ${item.activeTintClass} ring-1 ring-indigo-100`
                                          : `${item.tintClass} ${item.hoverTintClass}`
                                      } w-full flex items-start gap-3 px-4 py-3 text-left text-slate-700`}
                                      style={item.style}
                                    >
                                      <span
                                        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full border ${item.swatchClass}`}
                                      />
                                      <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm md:text-base font-semibold">
                                          {item.title}
                                        </span>
                                        <span className="mt-0.5 block truncate text-xs text-slate-500">
                                          {item.dateLabel}
                                        </span>
                                      </span>
                                      <ChevronRight
                                        size={16}
                                        className="mt-1 shrink-0 text-slate-400"
                                        aria-hidden="true"
                                      />
                                    </button>
                                  ))}
                                </section>
                              ))
                            )}

                            {myEventsGrouped.past.length > 0 && (
                              <section className="space-y-1">
                                <div className="px-1 pt-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                      Past Events
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setShowPastMyEvents((prev) => !prev)
                                      }
                                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600 transition hover:bg-slate-200"
                                    >
                                      <span>
                                        {showPastMyEvents
                                          ? "Hide past events"
                                          : "Show past events"}
                                      </span>
                                      <ChevronRight
                                        size={12}
                                        className={`transition-transform ${
                                          showPastMyEvents ? "rotate-90" : ""
                                        }`}
                                      />
                                    </button>
                                  </div>
                                  <div className={`mt-1 ${SIDEBAR_DIVIDER_CLASS}`} />
                                </div>

                                {showPastMyEvents &&
                                  myEventsGrouped.past.map((group) => (
                                    <section
                                      key={`past-${group.category}`}
                                      className="space-y-1"
                                    >
                                      <div className="px-1 pt-1">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                          {group.category}
                                        </p>
                                        <div className={`mt-1 ${SIDEBAR_DIVIDER_CLASS}`} />
                                      </div>
                                      {group.items.map((item) => (
                                        <button
                                          key={item.row.id}
                                          type="button"
                                          onClick={() =>
                                            openOwnerEventContext(item)
                                          }
                                          className={`${SIDEBAR_ITEM_CARD_CLASS} ${
                                            isHistoryRowActive(item.row.id)
                                              ? `${item.activeCardClass} ${item.activeTintClass} ring-1 ring-indigo-100`
                                              : `${item.tintClass} ${item.hoverTintClass}`
                                          } w-full flex items-start gap-3 px-4 py-3 text-left text-slate-700 opacity-75 saturate-75`}
                                          style={item.style}
                                        >
                                          <span
                                            className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full border ${item.swatchClass}`}
                                          />
                                          <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm md:text-base font-semibold">
                                              {item.title}
                                            </span>
                                            <span className="mt-0.5 block truncate text-xs text-slate-500">
                                              {item.dateLabel}
                                            </span>
                                          </span>
                                          <ChevronRight
                                            size={16}
                                            className="mt-1 shrink-0 text-slate-400"
                                            aria-hidden="true"
                                          />
                                        </button>
                                      ))}
                                    </section>
                                  ))}
                              </section>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`${SIDEBAR_PANEL_CLASS} z-[20] bg-[#fcfcfd]`}
                    style={panelStyle(
                      invitedEventsPanelTransform,
                      sidebarPage === "invitedEvents"
                    )}
                    aria-hidden={sidebarPage !== "invitedEvents"}
                  >
                    <div className="space-y-1.5">
                      <div className={SUBPAGE_STICKY_HEADER_CLASS}>
                        <button
                          type="button"
                          onClick={() => setSidebarPage("root")}
                          className={`${SIDEBAR_ITEM_CARD_CLASS} ${SIDEBAR_BACK_ROW_CLASS}`}
                        >
                          <span
                            className={`${SIDEBAR_ICON_CHIP_CLASS} ${SIDEBAR_ICON_CHIP_ACCENT_CLASS}`}
                          >
                            <ChevronLeft size={16} />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-500">
                              Back to Menu
                            </span>
                            <span className="block truncate text-sm font-semibold text-slate-900">
                              Invited Events
                            </span>
                          </span>
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {invitedEventsGrouped.upcoming.length === 0 &&
                        invitedEventsGrouped.past.length === 0 ? (
                          <div
                            className={`${SIDEBAR_ITEM_CARD_CLASS} px-4 py-3 text-sm text-slate-500`}
                          >
                            No invited events yet.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {invitedEventsGrouped.upcoming.length === 0 ? (
                              <div
                                className={`${SIDEBAR_ITEM_CARD_CLASS} px-4 py-3 text-sm text-slate-500`}
                              >
                                No upcoming events.
                              </div>
                            ) : (
                              invitedEventsGrouped.upcoming.map((group) => (
                                <section
                                  key={`invited-upcoming-${group.category}`}
                                  className="space-y-1"
                                >
                                  <div className="px-1 pt-1">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                      {group.category}
                                    </p>
                                    <div className={`mt-1 ${SIDEBAR_DIVIDER_CLASS}`} />
                                  </div>
                                  {group.items.map((item) => (
                                    <button
                                      key={item.row.id}
                                      type="button"
                                      onClick={() =>
                                        openGuestEventContext(
                                          item.row,
                                          item.href
                                        )
                                      }
                                      className={`${SIDEBAR_ITEM_CARD_CLASS} ${
                                        isHistoryRowActive(item.row.id)
                                          ? `${item.activeCardClass} ${item.activeTintClass} ring-1 ring-indigo-100`
                                          : `${item.tintClass} ${item.hoverTintClass}`
                                      } w-full flex items-start gap-3 px-4 py-3 text-left text-slate-700`}
                                      style={item.style}
                                    >
                                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full border border-indigo-200 bg-indigo-50" />
                                      <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm md:text-base font-semibold">
                                          {item.title}
                                        </span>
                                        <span className="mt-0.5 block truncate text-xs text-slate-500">
                                          {item.dateLabel}
                                        </span>
                                      </span>
                                      <ChevronRight
                                        size={16}
                                        className="mt-1 shrink-0 text-slate-400"
                                        aria-hidden="true"
                                      />
                                    </button>
                                  ))}
                                </section>
                              ))
                            )}

                            {invitedEventsGrouped.past.length > 0 && (
                              <section className="space-y-1">
                                <div className="px-1 pt-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                      Past Events
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setShowPastInvitedEvents(
                                          (prev) => !prev
                                        )
                                      }
                                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600 transition hover:bg-slate-200"
                                    >
                                      <span>
                                        {showPastInvitedEvents
                                          ? "Hide past events"
                                          : "Show past events"}
                                      </span>
                                      <ChevronRight
                                        size={12}
                                        className={`transition-transform ${
                                          showPastInvitedEvents
                                            ? "rotate-90"
                                            : ""
                                        }`}
                                      />
                                    </button>
                                  </div>
                                  <div className={`mt-1 ${SIDEBAR_DIVIDER_CLASS}`} />
                                </div>

                                {showPastInvitedEvents &&
                                  invitedEventsGrouped.past.map((group) => (
                                    <section
                                      key={`invited-past-${group.category}`}
                                      className="space-y-1"
                                    >
                                      <div className="px-1 pt-1">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                          {group.category}
                                        </p>
                                        <div className={`mt-1 ${SIDEBAR_DIVIDER_CLASS}`} />
                                      </div>
                                      {group.items.map((item) => (
                                        <button
                                          key={item.row.id}
                                          type="button"
                                          onClick={() =>
                                            openGuestEventContext(
                                              item.row,
                                              item.href
                                            )
                                          }
                                          className={`${SIDEBAR_ITEM_CARD_CLASS} ${
                                            isHistoryRowActive(item.row.id)
                                              ? `${item.activeCardClass} ${item.activeTintClass} ring-1 ring-indigo-100`
                                              : `${item.tintClass} ${item.hoverTintClass}`
                                          } w-full flex items-start gap-3 px-4 py-3 text-left text-slate-700 opacity-70 saturate-75`}
                                          style={item.style}
                                        >
                                          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full border border-indigo-200 bg-indigo-50" />
                                          <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm md:text-base font-semibold">
                                              {item.title}
                                            </span>
                                            <span className="mt-0.5 block truncate text-xs text-slate-500">
                                              {item.dateLabel}
                                            </span>
                                          </span>
                                          <ChevronRight
                                            size={16}
                                            className="mt-1 shrink-0 text-slate-400"
                                            aria-hidden="true"
                                          />
                                        </button>
                                      ))}
                                    </section>
                                  ))}
                              </section>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`${SIDEBAR_EVENT_PANEL_CLASS} z-[30]`}
                    style={panelStyle(
                      eventPanelTransform,
                      sidebarPage === "eventContext"
                    )}
                    aria-hidden={sidebarPage !== "eventContext"}
                  >
                    <EventSidebar
                      ref={eventSidebarRef}
                      activeEventTab={activeEventTab}
                      onBack={handleSidebarBackToEvents}
                      onTabChange={handleEventTabChange}
                      mode={eventSidebarMode}
                      backLabel={
                        eventContextSourcePage === "invitedEvents"
                          ? "Invited Events"
                          : "My Events"
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Bottom: User button with dropdown */}
              <div className="bg-[#efefef] px-3 py-3">
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
                    className={SIDEBAR_FOOTER_TRIGGER_CLASS}
                  >
                    <div className="min-w-0 flex-1 inline-flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 text-sm font-semibold text-indigo-700">
                        {profileInitials}
                      </span>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="truncate text-sm font-medium">
                          {displayName}
                        </div>
                        {userEmail && (
                          <div className="truncate text-xs md:text-sm text-slate-500">
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
                      className={`h-4 w-4 text-slate-400 transition-transform ${
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
                        <div
                          ref={menuMainContentRef}
                          className="p-2"
                          style={
                            menuMainHeight
                              ? { minHeight: `${menuMainHeight}px` }
                              : undefined
                          }
                        >
                          {menuFloatingView === "main" && (
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
                              <span className="text-sm md:text-base">
                                Profile
                              </span>
                            </Link>
                          )}

                          {menuFloatingView === "main" ? (
                            <button
                              type="button"
                              onClick={() => setMenuFloatingView("calendar")}
                              className="group mt-1 w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-[#4b3f72] hover:text-[#34275c] hover:bg-[#f1edff] transition-all"
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
                              <ChevronRight
                                size={16}
                                className="text-[#8a7ec0]"
                                aria-hidden="true"
                              />
                            </button>
                          ) : (
                            <div className="mt-1 min-w-full">
                              <div className="flex items-center gap-2 p-3 border-b border-[#ece7fb]">
                                <button
                                  type="button"
                                  onClick={() => setMenuFloatingView("main")}
                                  className="p-1 rounded-full hover:bg-[#f1edff] transition-colors"
                                  aria-label="Back to menu"
                                >
                                  <ChevronLeft
                                    size={18}
                                    className="text-[#6f629d]"
                                  />
                                </button>
                                <span className="font-semibold text-sm text-[#3f335f]">
                                  Calendar Settings
                                </span>
                              </div>
                              <div className="p-4">
                                <h4 className="text-[10px] font-bold text-[#9589b7] uppercase tracking-wider mb-2">
                                  Connection Status
                                </h4>
                                <p className="text-[12px] text-[#7d6fa5] mb-4 leading-snug">
                                  Tap a provider to set default.
                                </p>
                                <div className="flex justify-between items-center px-1">
                                  {CALENDAR_TARGETS.map(({ key, label, Icon }) => {
                                    const isDefault = defaultCalendarProvider === key;
                                    const isConnected = connectedCalendars[key];
                                    return (
                                      <button
                                        key={key}
                                        type="button"
                                        onClick={() => void toggleCalendarDefault(key)}
                                        className="flex flex-col items-center gap-1.5 group"
                                        title={
                                          isDefault
                                            ? `Default is ${label}. Click to clear default`
                                            : isConnected || key === "apple"
                                            ? `Set ${label} as default calendar`
                                            : `Connect ${label} calendar`
                                        }
                                      >
                                        <div
                                          className={`relative w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all ${
                                            isDefault
                                              ? "bg-[#6962c8] border-[#6962c8] text-white shadow-md scale-105"
                                              : "bg-white border-[#e4dcf8] text-[#6f629d] hover:border-[#cfc2f1] hover:bg-[#f8f5ff] shadow-sm"
                                          }`}
                                        >
                                          <Icon className="h-4 w-4" />
                                          {isDefault && (
                                            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#7c67be] text-white border-2 border-white flex items-center justify-center">
                                              <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 12 12"
                                                fill="none"
                                                className="h-2.5 w-2.5"
                                                aria-hidden="true"
                                              >
                                                <path
                                                  d="M10 3L4.5 8.5L2 6"
                                                  stroke="currentColor"
                                                  strokeWidth="2"
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                />
                                              </svg>
                                            </span>
                                          )}
                                        </div>
                                        <span
                                          className={`text-[10px] font-medium ${
                                            isDefault
                                              ? "text-[#645bc1]"
                                              : "text-[#8b80af]"
                                          }`}
                                        >
                                          {label}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}

                          {menuFloatingView === "main" && (
                            <>
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
                            <span className="text-sm md:text-base">
                              About us
                            </span>
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
                            <span className="text-sm md:text-base">
                              Contact us
                            </span>
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
                              <span className="text-sm md:text-base">
                                Admin
                              </span>
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
                            <span className="text-sm md:text-base">
                              Log out
                            </span>
                          </button>
                            </>
                          )}
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
