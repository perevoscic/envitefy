import {
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  clearProfileCache,
  PROFILE_CACHE_TTL_MS,
  readProfileCache,
  writeProfileCache,
} from "@/utils/profileCache";
import { buildEventPath } from "@/utils/event-url";
import { resolveEditHref } from "@/utils/event-edit-route";
import { isSportsPreviewFirstEvent } from "@/utils/event-navigation";
import { normalizePrimarySignupSource } from "@/lib/product-scopes";
import {
  getCreateEventSections,
  getTemplateLinks,
  isCreateEventRoute,
} from "@/config/navigation-config";
import {
  getEventStartIso,
  isInvitedEventLikeRecord,
} from "@/lib/dashboard-data";
import type { EventContextTab } from "./sidebar-context";
import {
  buildGroupedEventLists,
  CALENDAR_DEFAULT_STORAGE_KEY,
  CalendarProviderKey,
  CompactNavItemId,
  countGroupedEventItems,
  CREATE_ACTIVE_STORAGE_KEY,
  EventListPage,
  EventSidebarMode,
  GroupedEventItem,
  HistoryRow,
  INVITED_EVENTS_PAST_EXPANDED_STORAGE_KEY,
  MY_EVENTS_PAST_EXPANDED_STORAGE_KEY,
  normalizeCalendarProvider,
  SIDEBAR_WIDTH_REM,
  SidebarPage,
  SubscriptionPlan,
} from "./left-sidebar.model";

const MOBILE_SIDEBAR_SCROLL_LOCK_CLASS = "sidebar-mobile-open";

type LeftSidebarControllerArgs = {
  session: any;
  status: string;
  menu: {
    connectedCalendars: Record<string, boolean>;
    refreshConnectedCalendars: () => Promise<unknown> | unknown;
    featureVisibility: { visibleTemplateKeys: string[] };
    primarySignupSource: "snap" | "gymnastics" | "legacy" | null;
    productScopes: unknown;
  };
  historySidebarItems: HistoryRow[];
  sidebar: {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
    selectedEventId: string | null;
    setSelectedEventId: (value: string) => void;
    setSelectedEventTitle: (value: string) => void;
    selectedEventHref: string | null;
    setSelectedEventHref: (value: string) => void;
    setSelectedEventEditHref: (value: string) => void;
    activeEventTab: EventContextTab;
    setActiveEventTab: (value: EventContextTab) => void;
    clearEventContext: () => void;
  };
  router: {
    push: (href: string) => void;
    prefetch?: (href: string) => Promise<unknown> | undefined;
  };
  pathname: string | null;
  searchParams: { get: (name: string) => string | null } | null;
};

export type LeftSidebarControllerViewModel = {
  isHydrated: boolean;
  isReady: boolean;
  isEmbeddedEditMode: boolean;
  showEditTopBar: boolean;
  showMobileTopBar: boolean;
  isDesktop: boolean;
  isOpen: boolean;
  isCompact: boolean;
  sidebarWidth: string;
  sidebarTransform: string;
  pointerClass: string;
  overflowClass: string;
  sidebarPage: SidebarPage;
  eventContextSourcePage: EventListPage;
  eventSidebarMode: EventSidebarMode;
  activeEventTab: EventContextTab;
  menuOpen: boolean;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
  hasCreateEventAccess: boolean;
  useGymnasticsDirectCreate: boolean;
  createMenuOptionCount: number;
  createMenuItems: Array<{ label: string; href: string }>;
  otherCreateMenuItems: Array<{ label: string; href: string }>;
  isOtherEventsActive: boolean;
  isCreateEntryActive: boolean;
  createdEventsCount: number;
  invitedEventsCount: number;
  myEventsGrouped: ReturnType<typeof buildGroupedEventLists>["myEvents"];
  invitedEventsGrouped: ReturnType<typeof buildGroupedEventLists>["invitedEvents"];
  showPastMyEvents: boolean;
  setShowPastMyEvents: React.Dispatch<React.SetStateAction<boolean>>;
  showPastInvitedEvents: boolean;
  setShowPastInvitedEvents: React.Dispatch<React.SetStateAction<boolean>>;
  profileInitials: string;
  userTitleLabel: string;
  userEmail?: string;
  footerMenuItems: Array<{
    href: string;
    label: string;
    colorClass: string;
    bgClass: string;
  }>;
  showCreditsShell: boolean;
  creditsAreKnown: boolean;
  creditsValue: number;
  asideRef: RefObject<HTMLDivElement | null>;
  eventSidebarRef: RefObject<HTMLDivElement | null>;
  menuRef: RefObject<HTMLDivElement | null>;
  buttonRef: RefObject<HTMLButtonElement | null>;
  openBarButtonRef: RefObject<HTMLButtonElement | null>;
  openSidebarFromTrigger: () => void;
  closeSidebarFromBackdrop: () => void;
  goHomeFromSidebar: () => void;
  goStudioFromSidebar: () => void;
  handleRootSnapNavigate: () => void;
  openCreateEventPage: () => void;
  openMyEventsPage: () => void;
  openInvitedEventsPage: () => void;
  backToRoot: () => void;
  backToCreateEvent: () => void;
  backToCreateEventOther: () => void;
  openCreateEventOther: () => void;
  handleCreateModalSelect: (label: string, fallbackHref?: string) => void;
  isCreateMenuButtonActive: (item: { label: string; href: string }) => boolean;
  isCompactNavActive: (id: CompactNavItemId) => boolean;
  openOwnerEventContext: (item: GroupedEventItem) => void;
  openGuestEventContext: (item: GroupedEventItem) => void;
  isHistoryRowActive: (rowId: string) => boolean;
  handleEventTabChange: (tab: EventContextTab) => void;
  handleSidebarBackToEvents: () => void;
};

export function useLeftSidebarController({
  session,
  status,
  menu,
  historySidebarItems,
  sidebar,
  router,
  pathname,
  searchParams,
}: LeftSidebarControllerArgs): LeftSidebarControllerViewModel {
  const {
    connectedCalendars,
    refreshConnectedCalendars,
    featureVisibility,
    primarySignupSource,
    productScopes,
  } = menu;
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
  } = sidebar;

  const profileEmail = (session?.user as any)?.email?.toLowerCase?.() ?? null;
  const profileEmailRef = useRef<string | null>(null);
  useEffect(() => {
    if (profileEmail) {
      profileEmailRef.current = profileEmail;
    }
  }, [profileEmail]);

  const isEmbeddedEditMode = searchParams?.get("embed") === "1";
  const isEventPageWithEditSidebar = Boolean(
    pathname?.startsWith("/event/") && searchParams?.get("edit")
  );

  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarPage, setSidebarPage] = useState<SidebarPage>("root");
  const [showPastMyEvents, setShowPastMyEvents] = useState(false);
  const [showPastInvitedEvents, setShowPastInvitedEvents] = useState(false);
  const [eventSidebarMode, setEventSidebarMode] =
    useState<EventSidebarMode>("owner");
  const [eventContextSourcePage, setEventContextSourcePage] =
    useState<EventListPage>("myEvents");
  const [isHydrated, setIsHydrated] = useState(false);
  const [defaultCalendarProvider, setDefaultCalendarProvider] =
    useState<CalendarProviderKey | null>(null);
  const [lastCreateSelection, setLastCreateSelection] = useState<string | null>(
    null
  );
  const [forcedCreateActiveLabel, setForcedCreateActiveLabel] = useState<
    string | null
  >(null);
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(min-width: 1024px)").matches;
  });
  const [credits, setCredits] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(
    Boolean((session?.user as any)?.isAdmin)
  );
  const [profilePrimarySignupSource, setProfilePrimarySignupSource] = useState<
    "snap" | "gymnastics" | "legacy" | null
  >(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const savedCalendarProviderRef = useRef<CalendarProviderKey | null | "__unset">(
    "__unset"
  );
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const openBarButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastSidebarOpenAtRef = useRef(0);
  const asideRef = useRef<HTMLDivElement | null>(null);
  const eventSidebarRef = useRef<HTMLDivElement | null>(null);
  const invitedNavigationPendingRef = useRef(false);
  const prevSidebarPageRef = useRef<SidebarPage>("root");

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
      if (savedCalendarProviderRef.current === provider) return;
      try {
        await fetch("/api/user/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ preferredProvider: provider }),
        });
        savedCalendarProviderRef.current = provider;
      } catch {}
    },
    [status]
  );

  const effectivePrimarySignupSource =
    profilePrimarySignupSource ?? primarySignupSource;
  const useGymnasticsDirectCreate =
    effectivePrimarySignupSource === "gymnastics";
  const isOpen = isDesktop ? true : !isCollapsed;
  const isCompact = false;
  const sidebarWidth = SIDEBAR_WIDTH_REM;
  const sidebarTransform = isDesktop
    ? "none"
    : isOpen
      ? "none"
      : "translateX(-100%)";
  const pointerClass = isDesktop
    ? "pointer-events-auto"
    : isOpen
      ? "pointer-events-auto"
      : "pointer-events-none";
  const overflowClass = "overflow-hidden";
  const showEditTopBar = isEventPageWithEditSidebar;
  const showMobileTopBar = !isDesktop && !isOpen;
  const isEventMenuActive = Boolean(selectedEventId);

  const openSidebarFromTrigger = useCallback(() => {
    lastSidebarOpenAtRef.current = Date.now();
    setIsCollapsed(false);
  }, [setIsCollapsed]);

  const closeSidebarFromBackdrop = useCallback(() => {
    if (Date.now() - lastSidebarOpenAtRef.current < 1200) return;
    setIsCollapsed(true);
  }, [setIsCollapsed]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const update = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsDesktop(event.matches);
    };
    update(mediaQuery);
    const handler = (event: MediaQueryListEvent) => update(event);
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handler);
    } else if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(handler);
    }
    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", handler);
      } else if (typeof mediaQuery.removeListener === "function") {
        mediaQuery.removeListener(handler);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setMenuOpen(false);
      return;
    }
    lastSidebarOpenAtRef.current = Date.now();
  }, [isOpen]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof document === "undefined" ||
      isDesktop ||
      !isOpen
    ) {
      return;
    }

    const scrollY = window.scrollY;
    const { body, documentElement } = document;
    documentElement.style.setProperty("--nav-sidebar-scroll-y", `${scrollY}px`);
    documentElement.classList.add(MOBILE_SIDEBAR_SCROLL_LOCK_CLASS);
    body.classList.add(MOBILE_SIDEBAR_SCROLL_LOCK_CLASS);

    return () => {
      documentElement.classList.remove(MOBILE_SIDEBAR_SCROLL_LOCK_CLASS);
      body.classList.remove(MOBILE_SIDEBAR_SCROLL_LOCK_CLASS);
      documentElement.style.removeProperty("--nav-sidebar-scroll-y");
      window.scrollTo(0, scrollY);
    };
  }, [isDesktop, isOpen]);

  useEffect(() => {
    if (status === "authenticated") {
      void refreshConnectedCalendars();
    }
  }, [refreshConnectedCalendars, status]);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const isPhoneHiddenViewport = () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(max-width: 1023px)").matches;

    const onClick = (event: Event) => {
      if (!isPhoneHiddenViewport()) return;
      const target = event.target as Node | null;
      if (!asideRef.current) return;
      if (Date.now() - lastSidebarOpenAtRef.current < 1200) return;
      if (openBarButtonRef.current?.contains(target as Node)) {
        return;
      }
      if (!asideRef.current.contains(target)) {
        setIsCollapsed(true);
      }
    };

    const onKey = (event: KeyboardEvent) => {
      if (!isPhoneHiddenViewport()) return;
      if (event.key === "Escape") setIsCollapsed(true);
    };

    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, setIsCollapsed]);

  useEffect(() => {
    const onOutside = (event: Event) => {
      if (!menuOpen) return;
      const target = event.target as Node | null;
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

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", onOutside, true);
    document.addEventListener("mousedown", onOutside, true);
    document.addEventListener("touchstart", onOutside as EventListener, {
      capture: true,
      passive: true,
    });
    document.addEventListener("click", onOutside, true);
    document.addEventListener("focusin", onOutside, true);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("pointerdown", onOutside, true);
      document.removeEventListener("mousedown", onOutside, true);
      document.removeEventListener("touchstart", onOutside as EventListener, {
        capture: true,
      });
      document.removeEventListener("click", onOutside, true);
      document.removeEventListener("focusin", onOutside, true);
      document.removeEventListener("keydown", onEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
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
    if (pathname?.startsWith("/event/")) return;
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
  const userTitleLabel = useMemo(
    () => (isAdmin ? `${displayName} (Admin)` : displayName),
    [displayName, isAdmin]
  );

  const footerMenuItems = useMemo(
    () =>
      [
        {
          href: "/settings",
          label: "Profile",
          colorClass: "text-indigo-500",
          bgClass: "bg-indigo-50",
        },
        {
          href: "/about",
          label: "About us",
          colorClass: "text-blue-500",
          bgClass: "bg-blue-50",
        },
        {
          href: "/contact",
          label: "Contact us",
          colorClass: "text-purple-500",
          bgClass: "bg-purple-50",
        },
        ...(isAdmin
          ? [
              {
                href: "/admin",
                label: "Admin",
                colorClass: "text-slate-500",
                bgClass: "bg-slate-50",
              },
            ]
          : []),
      ] as Array<{
        href: string;
        label: string;
        colorClass: string;
        bgClass: string;
      }>,
    [isAdmin]
  );

  useEffect(() => {
    let ignore = false;
    let idleId: number | null = null;
    let timeoutId: number | null = null;

    const cancelScheduledLoad = () => {
      if (typeof window === "undefined") return;
      if (idleId !== null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };

    const applyProfile = (
      plan: SubscriptionPlan,
      creditsValue: number | null
    ) => {
      setCredits(plan === "FF" ? Number.POSITIVE_INFINITY : creditsValue);
    };

    async function loadProfile() {
      try {
        const response = await fetch("/api/user/profile", {
          cache: "no-store",
          credentials: "include",
        });
        const json = await response.json().catch(() => ({}));
        if (!response.ok) return;
        if (!ignore) {
          const planRaw = json.subscriptionPlan;
          const plan =
            planRaw === "freemium" ||
            planRaw === "free" ||
            planRaw === "monthly" ||
            planRaw === "yearly" ||
            planRaw === "FF"
              ? planRaw
              : null;
          const nextCredits =
            plan === "FF"
              ? Number.POSITIVE_INFINITY
              : typeof json.credits === "number"
                ? (json.credits as number)
                : null;
          applyProfile(plan, nextCredits === Number.POSITIVE_INFINITY ? null : nextCredits);
          writeProfileCache(
            profileEmailRef.current || profileEmail,
            plan,
            nextCredits
          );
          if (typeof json.isAdmin === "boolean") {
            setIsAdmin(json.isAdmin);
          }
          setProfilePrimarySignupSource(
            normalizePrimarySignupSource(json.primarySignupSource) || "legacy"
          );
          setDefaultCalendarProvider(
            normalizeCalendarProvider(json.preferredProvider)
          );
          savedCalendarProviderRef.current = normalizeCalendarProvider(
            json.preferredProvider
          );
        }
      } catch {
      } finally {
        if (!ignore) setProfileLoaded(true);
      }
    }

    const scheduleProfileLoad = () => {
      if (typeof window === "undefined") {
        void loadProfile();
        return;
      }
      const run = () => {
        if (!ignore) {
          void loadProfile();
        }
      };
      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(run, { timeout: 1500 });
        return;
      }
      timeoutId = window.setTimeout(run, 250);
    };

    if (status === "authenticated") {
      const cached = readProfileCache(profileEmailRef.current || profileEmail);
      const hasFreshCache =
        Boolean(cached) &&
        Date.now() - cached.timestamp < PROFILE_CACHE_TTL_MS;
      setIsAdmin(Boolean((session?.user as any)?.isAdmin));
      setProfilePrimarySignupSource(null);
      setProfileLoaded(true);
      if (cached) {
        applyProfile(cached.plan, cached.credits);
        if (hasFreshCache) {
          return () => {
            ignore = true;
            cancelScheduledLoad();
          };
        }
      } else {
        setCredits(null);
      }
      if (primarySignupSource === "legacy") {
        void loadProfile();
        return () => {
          ignore = true;
          cancelScheduledLoad();
        };
      }
      scheduleProfileLoad();
    } else if (status === "unauthenticated") {
      cancelScheduledLoad();
      clearProfileCache(profileEmailRef.current || profileEmail);
      profileEmailRef.current = null;
      savedCalendarProviderRef.current = "__unset";
      setProfilePrimarySignupSource(null);
      setProfileLoaded(true);
      setCredits(null);
    }

    return () => {
      ignore = true;
      cancelScheduledLoad();
    };
  }, [primarySignupSource, profileEmail, session?.user, status]);

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
    if (defaultCalendarProvider === "google" && !connectedCalendars.google) {
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

  const triggerCreateEvent = useCallback(() => {
    collapseSidebarOnTouch();
    try {
      router.push("/event/gymnastics");
    } catch {}
  }, [collapseSidebarOnTouch, router]);

  const openSnapFromSidebar = useCallback(
    (mode: "camera" | "upload") => {
      try {
        router.push(`/?action=${mode}`);
        return;
      } catch {}
      triggerCreateEvent();
    },
    [router, triggerCreateEvent]
  );

  const launchSnapFromMenu = useCallback(
    (mode: "camera" | "upload") => {
      const runtimeWindow = window as any;
      const openFn =
        mode === "camera"
          ? runtimeWindow.__openSnapCamera
          : runtimeWindow.__openSnapUpload;
      collapseSidebarOnTouch();
      setSidebarPage("root");
      try {
        if (typeof openFn === "function") {
          openFn();
          return;
        }
      } catch {}
      openSnapFromSidebar(mode);
    },
    [collapseSidebarOnTouch, openSnapFromSidebar]
  );

  const resetSidebarToRoot = useCallback(() => {
    clearEventContext();
    setSidebarPage("root");
    collapseSidebarOnTouch();
  }, [clearEventContext, collapseSidebarOnTouch]);

  const goHomeFromSidebar = useCallback(() => {
    resetSidebarToRoot();
  }, [resetSidebarToRoot]);

  const goStudioFromSidebar = useCallback(() => {
    resetSidebarToRoot();
    try {
      if (pathname !== "/studio") {
        router.push("/studio");
      }
    } catch {}
  }, [pathname, resetSidebarToRoot, router]);

  const handleRootSnapNavigate = useCallback(() => {
    resetSidebarToRoot();
  }, [resetSidebarToRoot]);

  const visibleTemplateKeys = featureVisibility.visibleTemplateKeys;
  const visibleTemplateLinks = useMemo(
    () => getTemplateLinks(visibleTemplateKeys, productScopes),
    [productScopes, visibleTemplateKeys]
  );

  const templateHrefMap = useMemo(() => {
    const map = new Map<string, string>();
    visibleTemplateLinks.forEach((template) => {
      map.set(template.label, template.href);
    });
    return map;
  }, [visibleTemplateLinks]);

  const createMenuItems = useMemo(
    () =>
      getCreateEventSections(visibleTemplateKeys, productScopes).flatMap(
        (section) => section.items
      ),
    [productScopes, visibleTemplateKeys]
  );
  const otherCreateMenuItems = useMemo(() => [], []);
  const isCreateRouteActive = useMemo(
    () => isCreateEventRoute(pathname),
    [pathname]
  );
  const isCreateItemActive = useCallback(
    (item: { href: string }) => {
      if (!pathname) return false;
      const baseHref = item.href.split("?")[0];
      if (!baseHref) return false;
      if (baseHref === "/") return pathname === "/";
      return pathname === baseHref || pathname.startsWith(`${baseHref}/`);
    },
    [pathname]
  );
  const activeCreateItem = useMemo(
    () => createMenuItems.find((item) => isCreateItemActive(item)) ?? null,
    [createMenuItems, isCreateItemActive]
  );
  const isOtherEventsActive = sidebarPage === "createEventOther";
  const createMenuOptionCount = createMenuItems.length;
  const hasCreateEventAccess = useMemo(
    () => useGymnasticsDirectCreate || createMenuOptionCount > 0,
    [createMenuOptionCount, useGymnasticsDirectCreate]
  );

  useEffect(() => {
    if (activeCreateItem) {
      setLastCreateSelection(activeCreateItem.label);
      return;
    }
    if (pathname?.startsWith("/event")) {
      setLastCreateSelection(null);
    }
  }, [activeCreateItem, pathname]);

  useEffect(() => {
    if (!pathname?.startsWith("/event")) {
      setLastCreateSelection(null);
      setForcedCreateActiveLabel(null);
    }
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.sessionStorage.getItem(CREATE_ACTIVE_STORAGE_KEY);
      if (stored) setLastCreateSelection(stored);
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (lastCreateSelection) {
        window.sessionStorage.setItem(
          CREATE_ACTIVE_STORAGE_KEY,
          lastCreateSelection
        );
      } else {
        window.sessionStorage.removeItem(CREATE_ACTIVE_STORAGE_KEY);
      }
    } catch {}
  }, [lastCreateSelection]);

  useEffect(() => {
    if (
      hasCreateEventAccess ||
      (sidebarPage !== "createEvent" && sidebarPage !== "createEventOther")
    ) {
      return;
    }
    setForcedCreateActiveLabel(null);
    setSidebarPage("root");
  }, [hasCreateEventAccess, setSidebarPage, sidebarPage]);

  const openCompactEventsPage = useCallback(
    (page: EventListPage) => {
      clearEventContext();
      setIsCollapsed(false);
      setSidebarPage(page);
    },
    [clearEventContext, setIsCollapsed]
  );

  const openCreateEventPage = useCallback(() => {
    if (!hasCreateEventAccess) {
      setForcedCreateActiveLabel(null);
      setSidebarPage("root");
      return;
    }
    if (useGymnasticsDirectCreate) {
      clearEventContext();
      setSidebarPage("root");
      collapseSidebarOnTouch();
      router.push("/event/gymnastics");
      return;
    }
    setIsCollapsed(false);
    setSidebarPage("createEvent");
  }, [
    clearEventContext,
    collapseSidebarOnTouch,
    hasCreateEventAccess,
    router,
    setIsCollapsed,
    setSidebarPage,
    useGymnasticsDirectCreate,
  ]);

  const openMyEventsPage = useCallback(
    () => openCompactEventsPage("myEvents"),
    [openCompactEventsPage]
  );
  const openInvitedEventsPage = useCallback(
    () => openCompactEventsPage("invitedEvents"),
    [openCompactEventsPage]
  );

  const isCompactNavActive = useCallback(
    (id: CompactNavItemId) => {
      switch (id) {
        case "home":
          return pathname === "/" && sidebarPage === "root";
        case "studio":
          return pathname === "/studio" && sidebarPage === "root";
        case "snap":
          return pathname === "/event" && sidebarPage === "root";
        case "create":
          return (
            isCreateRouteActive ||
            sidebarPage === "createEvent" ||
            sidebarPage === "createEventOther"
          );
        case "myEvents":
          return (
            sidebarPage === "myEvents" ||
            (sidebarPage === "eventContext" &&
              eventContextSourcePage === "myEvents")
          );
        case "invitedEvents":
          return (
            sidebarPage === "invitedEvents" ||
            (sidebarPage === "eventContext" &&
              eventContextSourcePage === "invitedEvents")
          );
        default:
          return false;
      }
    },
    [eventContextSourcePage, isCreateRouteActive, pathname, sidebarPage]
  );

  useEffect(() => {
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

  const handleCreateModalSelect = useCallback(
    (label: string, fallbackHref?: string) => {
      setForcedCreateActiveLabel(label);
      setLastCreateSelection(label);
      if (label === "Snap Event") {
        collapseSidebarOnTouch();
        setSidebarPage("root");
        router.push("/event");
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
        const keepCreatePanel = href.startsWith("/event/");
        if (!keepCreatePanel) {
          setSidebarPage("root");
        }
        router.push(href);
        return;
      }
      setSidebarPage("root");
      triggerCreateEvent();
    },
    [
      collapseSidebarOnTouch,
      launchSnapFromMenu,
      router,
      templateHrefMap,
      triggerCreateEvent,
    ]
  );

  const isCreateMenuButtonActive = useCallback(
    (item: { label: string; href: string }) =>
      isCreateItemActive(item) ||
      (forcedCreateActiveLabel !== null &&
        forcedCreateActiveLabel.toLowerCase() === item.label.toLowerCase()) ||
      (lastCreateSelection !== null &&
        lastCreateSelection.toLowerCase() === item.label.toLowerCase()),
    [forcedCreateActiveLabel, isCreateItemActive, lastCreateSelection]
  );

  const history = (historySidebarItems || []) as HistoryRow[];
  const groupedEventLists = useMemo(
    () =>
      buildGroupedEventLists({
        history,
        getEventStartIso,
        buildEventPath,
        isSportsPreviewFirstEvent,
        isInvitedEventLikeRecord,
      }),
    [history]
  );
  const myEventsGrouped = groupedEventLists.myEvents;
  const invitedEventsGrouped = groupedEventLists.invitedEvents;
  const createdEventsCount = useMemo(
    () => countGroupedEventItems(myEventsGrouped.upcoming),
    [myEventsGrouped.upcoming]
  );
  const invitedEventsCount = useMemo(
    () =>
      countGroupedEventItems(invitedEventsGrouped.upcoming) +
      countGroupedEventItems(invitedEventsGrouped.past),
    [invitedEventsGrouped.past, invitedEventsGrouped.upcoming]
  );
  const isCreateEntryActive =
    isCreateRouteActive ||
    sidebarPage === "createEvent" ||
    sidebarPage === "createEventOther";

  useEffect(() => {
    const onDeleted = (event: Event) => {
      try {
        const detail = (event as CustomEvent<{ id?: string }>).detail || null;
        const deletedId =
          detail && detail.id != null ? String(detail.id).trim() : "";
        if (!deletedId) return;
        if (selectedEventId === deletedId) {
          clearEventContext();
        }
      } catch {}
    };

    window.addEventListener("history:deleted", onDeleted as EventListener);
    return () => {
      window.removeEventListener("history:deleted", onDeleted as EventListener);
    };
  }, [clearEventContext, selectedEventId]);

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
          router.prefetch?.(href);
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
      setActiveEventTab,
      setSelectedEventEditHref,
      setSelectedEventHref,
      setSelectedEventId,
      setSelectedEventTitle,
    ]
  );

  const openGuestEventContext = useCallback(
    (item: GroupedEventItem) => {
      const nextHref = buildEventGuestHref(item.href, item.row.id);
      blurActiveElement();
      clearEventContext();
      setEventContextSourcePage("invitedEvents");
      if (isDesktop) {
        setSidebarPage("invitedEvents");
      } else {
        setSidebarPage("root");
        setIsCollapsed(true);
      }
      invitedNavigationPendingRef.current = true;
      try {
        router.prefetch?.(nextHref);
      } catch {}
      router.push(nextHref);
    },
    [
      blurActiveElement,
      buildEventGuestHref,
      clearEventContext,
      isDesktop,
      router,
      setEventContextSourcePage,
      setIsCollapsed,
    ]
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
    ]
  );

  const handleSidebarBackToEvents = useCallback(() => {
    clearEventContext();
    setSidebarPage(eventContextSourcePage);
  }, [clearEventContext, eventContextSourcePage]);

  return {
    isHydrated,
    isReady: status === "authenticated" && isHydrated,
    isEmbeddedEditMode,
    showEditTopBar,
    showMobileTopBar,
    isDesktop,
    isOpen,
    isCompact,
    sidebarWidth,
    sidebarTransform,
    pointerClass,
    overflowClass,
    sidebarPage,
    eventContextSourcePage,
    eventSidebarMode,
    activeEventTab,
    menuOpen,
    setMenuOpen,
    hasCreateEventAccess,
    useGymnasticsDirectCreate,
    createMenuOptionCount,
    createMenuItems,
    otherCreateMenuItems,
    isOtherEventsActive,
    isCreateEntryActive,
    createdEventsCount,
    invitedEventsCount,
    myEventsGrouped,
    invitedEventsGrouped,
    showPastMyEvents,
    setShowPastMyEvents,
    showPastInvitedEvents,
    setShowPastInvitedEvents,
    profileInitials,
    userTitleLabel,
    userEmail,
    footerMenuItems,
    showCreditsShell,
    creditsAreKnown,
    creditsValue,
    asideRef,
    eventSidebarRef,
    menuRef,
    buttonRef,
    openBarButtonRef,
    openSidebarFromTrigger,
    closeSidebarFromBackdrop,
    goHomeFromSidebar,
    goStudioFromSidebar,
    handleRootSnapNavigate,
    openCreateEventPage,
    openMyEventsPage,
    openInvitedEventsPage,
    backToRoot: () => setSidebarPage("root"),
    backToCreateEvent: () => {
      setForcedCreateActiveLabel(null);
      setSidebarPage("root");
    },
    backToCreateEventOther: () => {
      setForcedCreateActiveLabel(null);
      setSidebarPage("createEvent");
    },
    openCreateEventOther: () => setSidebarPage("createEventOther"),
    handleCreateModalSelect,
    isCreateMenuButtonActive,
    isCompactNavActive,
    openOwnerEventContext,
    openGuestEventContext,
    isHistoryRowActive,
    handleEventTabChange,
    handleSidebarBackToEvents,
  };
}
