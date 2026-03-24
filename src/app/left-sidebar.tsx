"use client";
import Link from "next/link";
import EnvitefyWordmark from "@/components/branding/EnvitefyWordmark";
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
import { useSidebar, type EventContextTab } from "./sidebar-context";
import { useEventCache } from "@/app/event-cache-context";
import { useSession } from "next-auth/react";
import {
  CalendarIconGoogle,
  CalendarIconOutlook,
  CalendarIconApple,
} from "@/components/CalendarIcons";
import { secureSignOut } from "@/utils/secureSignOut";
import { buildEventPath } from "@/utils/event-url";
import { resolveEditHref } from "@/utils/event-edit-route";
import { isSportsPreviewFirstEvent } from "@/utils/event-navigation";
import {
  getCreateEventSections,
  getTemplateLinks,
} from "@/config/navigation-config";
import { getEventStartIso, isInvitedEventLikeRecord } from "@/lib/dashboard-data";
import {
  Baby,
  Cake,
  CalendarDays,
  Camera,
  ChevronUp,
  Info,
  Mail,
  ShieldCheck,
  FileEdit,
  Footprints,
  GraduationCap,
  Home,
  ChevronLeft,
  ChevronRight,
  Heart,
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
  | "createEventOther"
  | "myEvents"
  | "invitedEvents"
  | "eventContext";
type EventSidebarMode = "owner" | "guest";
type EventListPage = "myEvents" | "invitedEvents";
type SubscriptionPlan =
  | "freemium"
  | "free"
  | "monthly"
  | "yearly"
  | "FF"
  | null;
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
  shareStatus: "accepted" | "pending" | null;
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

/** Raster assets in /public/icons; tinted via mask to match category colors. */
const SIDEBAR_GYM_MASK_STYLE = (size: number): CSSProperties => ({
  width: size,
  height: size,
  WebkitMaskImage: "url(/icons/sidebar-gymnastics.png)",
  WebkitMaskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  maskImage: "url(/icons/sidebar-gymnastics.png)",
  maskSize: "contain",
  maskRepeat: "no-repeat",
  maskPosition: "center",
});

const SIDEBAR_FB_MASK_STYLE = (size: number): CSSProperties => ({
  width: size,
  height: size,
  WebkitMaskImage: "url(/icons/sidebar-football.png)",
  WebkitMaskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  maskImage: "url(/icons/sidebar-football.png)",
  maskSize: "contain",
  maskRepeat: "no-repeat",
  maskPosition: "center",
});

function SidebarGymnasticsMenuIcon({
  size = 22,
  className,
  active = false,
}: {
  size?: number;
  className?: string;
  /** Category violet only when the menu row is selected / current route. */
  active?: boolean;
}) {
  return (
    <span
      className={[
        "inline-block shrink-0",
        active ? "bg-violet-600" : "bg-slate-500",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={SIDEBAR_GYM_MASK_STYLE(size)}
      aria-hidden
    />
  );
}

function SidebarFootballMenuIcon({
  size = 22,
  className,
  active = false,
}: {
  size?: number;
  className?: string;
  /** Brand orange only when the menu row is selected / current route. */
  active?: boolean;
}) {
  return (
    <span
      className={[
        "inline-block shrink-0",
        active ? "bg-[#d44f19]" : "bg-slate-500",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={SIDEBAR_FB_MASK_STYLE(size)}
      aria-hidden
    />
  );
}

function SidebarMyEventsMenuIcon({
  size = 22,
  className,
  active = false,
}: {
  size?: number;
  className?: string;
  active?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={[
        "shrink-0",
        active ? "text-indigo-600" : "text-slate-500",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 2.75V5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 2.75V5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.75 4.5H17.25C19.0449 4.5 20.5 5.95507 20.5 7.75V17.25C20.5 19.0449 19.0449 20.5 17.25 20.5H6.75C4.95507 20.5 3.5 19.0449 3.5 17.25V7.75C3.5 5.95507 4.95507 4.5 6.75 4.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.75 8.5H20.25"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 11.25L15.5 14.1V18H13.25V15.7H10.75V18H8.5V14.1L12 11.25Z"
        fill="currentColor"
      />
    </svg>
  );
}

function isInvitedHistoryEvent(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const record = data as Record<string, unknown>;
  return Boolean(record.shared) || isInvitedEventLikeRecord(record);
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
const CALENDAR_DEFAULT_STORAGE_KEY =
  "envitefy:event-actions:calendar-default:v1";

function normalizeCalendarProvider(value: unknown): CalendarProviderKey | null {
  if (typeof value !== "string") return null;
  const provider = value.trim().toLowerCase();
  if (
    provider === "google" ||
    provider === "microsoft" ||
    provider === "apple"
  ) {
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

function getCreateMenuActiveAccent(label: string): {
  buttonClass: string;
  buttonStyle: CSSProperties;
  chipClass: string;
  chevronClass: string;
} {
  if (label === "Football Season") {
    return {
      buttonClass:
        "border-orange-200 bg-orange-50 text-orange-900 shadow-[0_16px_30px_rgba(234,88,12,0.12),inset_0_0_0_1px_rgba(234,88,12,0.18)]",
      buttonStyle: {
        backgroundColor: "#fff7ed",
        borderColor: "#fed7aa",
        boxShadow:
          "0 16px 30px rgba(234, 88, 12, 0.12), inset 0 0 0 1px rgba(234, 88, 12, 0.18)",
      },
      chipClass: "border-orange-200 bg-white text-orange-700",
      chevronClass: "text-orange-400",
    };
  }
  return {
    buttonClass:
      "border-purple-200 bg-purple-50 text-purple-800 shadow-[0_16px_30px_rgba(147,51,234,0.12),inset_0_0_0_1px_rgba(147,51,234,0.18)]",
    buttonStyle: {
      backgroundColor: "#F3E8FF",
      borderColor: "#E9D5FF",
      boxShadow:
        "0 16px 30px rgba(147, 51, 234, 0.12), inset 0 0 0 1px rgba(147, 51, 234, 0.18)",
    },
    chipClass: "border-purple-200 bg-white text-purple-700",
    chevronClass: "text-purple-400",
  };
}

const ICON_LOOKUP: Record<string, any> = {
  "Snap Event": Camera,
  "Upload Event": Upload,
  "Smart sign-up forms": FileEdit,
  "Sign up": FileEdit,
  Birthdays: Cake,
  Weddings: Heart,
  "Baby Showers": Baby,
  "Gender Reveal": PartyPopper,
  "Football Season": SidebarFootballMenuIcon,
  "Sport Football Season": SidebarFootballMenuIcon,
  "General Event": CalendarDays,
  "Gymnastics Schedule": SidebarGymnasticsMenuIcon,
  Gymnastics: SidebarGymnasticsMenuIcon,
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
  "rounded-[28px] border border-white/70 bg-white/90 shadow-[0_20px_40px_rgba(15,23,42,0.06)] backdrop-blur";
const SIDEBAR_ITEM_CARD_CLASS =
  "rounded-2xl border border-transparent bg-transparent shadow-none transition-all duration-200 ease-out";
const SIDEBAR_BADGE_CLASS =
  "inline-flex min-w-[24px] items-center justify-center rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500";
const SIDEBAR_WIDTH_REM = "21.25rem";
const SIDEBAR_COLLAPSED_REM = "5.25rem";
const SUBPAGE_STICKY_HEADER_CLASS =
  "sticky top-0 z-20 -mx-6 bg-[#f8f9fb]/95 px-6 pb-4 pt-2 backdrop-blur";
const SIDEBAR_SECTION_LABEL_CLASS =
  "px-1 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400";
const SIDEBAR_DIVIDER_CLASS = "h-px w-full bg-transparent";
const SIDEBAR_MENU_ROW_CLASS =
  "flex w-full items-center gap-4 px-5 py-4 text-left text-[17px] font-bold text-slate-700";
const SIDEBAR_BACK_ROW_CLASS =
  "flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left text-sm text-slate-700 shadow-sm transition-all hover:bg-white/85";
const SIDEBAR_ICON_CHIP_CLASS =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm";
const SIDEBAR_ICON_CHIP_ACCENT_CLASS =
  "border-slate-200 bg-slate-100 text-slate-500";
const SIDEBAR_PANEL_CLASS =
  "absolute inset-0 overflow-y-auto no-scrollbar px-6 pb-6";
const SIDEBAR_EVENT_PANEL_CLASS =
  "absolute inset-0 overflow-hidden bg-[#f8f9fb]";
const SIDEBAR_TOGGLE_CLASS =
  "inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-200/60 p-2.5 text-slate-500 shadow-sm transition-all hover:bg-slate-200 hover:text-slate-700";
const SIDEBAR_FOOTER_TRIGGER_CLASS =
  "w-full inline-flex items-center justify-between gap-3 rounded-[20px] border border-indigo-100 bg-white px-3 py-3 text-slate-700 shadow-lg transition-all duration-200 hover:shadow-xl active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-50/50";
const MY_EVENTS_PAST_EXPANDED_STORAGE_KEY = "sidebar:my-events:past-expanded";
const INVITED_EVENTS_PAST_EXPANDED_STORAGE_KEY =
  "sidebar:invited-events:past-expanded";
const CREATE_ACTIVE_STORAGE_KEY = "sidebar:create-event:last-selection";

export default function LeftSidebar() {
  const { data: session, status } = useSession();
  const {
    connectedCalendars,
    handleCalendarConnect,
    refreshConnectedCalendars,
    featureVisibility,
  } = useMenu();
  const { historySidebarItems, historyDiagnostics } = useEventCache();
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
  const [lastCreateSelection, setLastCreateSelection] = useState<string | null>(
    null
  );
  const [forcedCreateActiveLabel, setForcedCreateActiveLabel] = useState<
    string | null
  >(null);
  const savedCalendarProviderRef = useRef<CalendarProviderKey | null | "__unset">(
    "__unset"
  );

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
  const showMobileTopBar = Boolean(!isOpen);
  const showFloatingCustomizeButton = false;
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
  const footerMenuItems = useMemo(
    () =>
      [
        {
          href: "/settings",
          label: "Profile",
          Icon: User,
          colorClass: "text-indigo-500",
          bgClass: "bg-indigo-50",
        },
        {
          href: "/about",
          label: "About us",
          Icon: Info,
          colorClass: "text-blue-500",
          bgClass: "bg-blue-50",
        },
        {
          href: "/contact",
          label: "Contact us",
          Icon: Mail,
          colorClass: "text-purple-500",
          bgClass: "bg-purple-50",
        },
        ...(isAdmin
          ? [
              {
                href: "/admin",
                label: "Admin",
                Icon: ShieldCheck,
                colorClass: "text-slate-500",
                bgClass: "bg-slate-50",
              },
            ]
          : []),
      ] as Array<{
        href: string;
        label: string;
        Icon: typeof User;
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
        cached && Date.now() - cached.timestamp < PROFILE_CACHE_TTL_MS;
      setIsAdmin(Boolean((session?.user as any)?.isAdmin));
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
      scheduleProfileLoad();
    } else if (status === "unauthenticated") {
      cancelScheduledLoad();
      clearProfileCache(profileEmailRef.current || profileEmail);
      profileEmailRef.current = null;
      savedCalendarProviderRef.current = "__unset";
      setProfileLoaded(true);
      setCredits(null);
    }
    return () => {
      ignore = true;
      cancelScheduledLoad();
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
  const triggerCreateEvent = useCallback(() => {
    collapseSidebarOnTouch();
    try {
      router.push("/event/new");
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
    visibleTemplateLinks.forEach((t) => {
      map.set(t.label, t.href);
    });
    return map;
  }, [visibleTemplateLinks]);
  const activeTemplateLabel = useMemo(() => {
    if (!pathname) return null;
    const match = visibleTemplateLinks.find((t) => {
      const baseHref = t.href.split("?")[0];
      if (!baseHref) return false;
      return pathname === baseHref || pathname.startsWith(`${baseHref}/`);
    });
    return match?.label ?? null;
  }, [pathname, visibleTemplateLinks]);

  const handleCreateModalSelect = (label: string, fallbackHref?: string) => {
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
  };

  const createMenuItems = useMemo(() => {
    return getCreateEventSections(visibleTemplateKeys).flatMap(
      (section) => section.items
    );
  }, [visibleTemplateKeys]);
  const gymnasticsCreateItem = useMemo(
    () => createMenuItems.find((item) => item.label === "Gymnastics") ?? null,
    [createMenuItems]
  );
  const footballCreateItem = useMemo(
    () =>
      createMenuItems.find((item) => item.label === "Football Season") ?? null,
    [createMenuItems]
  );
  const otherCreateMenuItems = useMemo(
    () =>
      createMenuItems.filter(
        (item) =>
          item.label !== "Gymnastics" && item.label !== "Football Season"
      ),
    [createMenuItems]
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
  const isOtherEventsActive = useMemo(
    () => sidebarPage === "createEventOther",
    [sidebarPage]
  );
  const createMenuOptionCount = useMemo(
    () =>
      Number(Boolean(gymnasticsCreateItem)) +
      Number(Boolean(footballCreateItem)) +
      Number(otherCreateMenuItems.length > 0),
    [gymnasticsCreateItem, footballCreateItem, otherCreateMenuItems.length]
  );

  useEffect(() => {
    if (activeCreateItem) {
      setLastCreateSelection(activeCreateItem.label);
      return;
    }
    // Avoid leaving Gymnastics/Football highlighted on /event/... routes that
    // are not a create-template path (e.g. published event by id).
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
  const history = historySidebarItems as HistoryRow[];
  const createdEventsCount = useMemo(() => {
    return history.reduce((acc, row) => {
      if (!row || typeof row !== "object") return acc;
      const data: any = row?.data;
      if (!data || typeof data !== "object") return acc;
      if (isInvitedHistoryEvent(data)) return acc;
      return acc + 1;
    }, 0);
  }, [history]);
  const invitedEventsCount = useMemo(() => {
    return history.reduce((acc, row) => {
      if (!row || typeof row !== "object") return acc;
      const data: any = row?.data;
      if (!data || typeof data !== "object") return acc;
      if (!isInvitedHistoryEvent(data)) return acc;
      return acc + 1;
    }, 0);
  }, [history]);
  const calendarEventsCount = createdEventsCount + invitedEventsCount;
  const showDevDiagnostics = process.env.NODE_ENV !== "production";
  const openCompactEventsPage = useCallback(
    (page: "myEvents" | "invitedEvents") => {
      clearEventContext();
      setIsCollapsed(false);
      setSidebarPage(page);
    },
    [clearEventContext, setIsCollapsed, setSidebarPage]
  );
  const openCreateEventPage = useCallback(() => {
    setIsCollapsed(false);
    setSidebarPage("createEvent");
  }, [setIsCollapsed, setSidebarPage]);
  const compactNavItems = useMemo(
    () => [
      { icon: Home, label: "Home", onClick: goHomeFromSidebar },
      {
        icon: Camera,
        label: "Snap event",
        onClick: () => {
          clearEventContext();
          setSidebarPage("root");
          collapseSidebarOnTouch();
          openSnapFromSidebar("camera");
        },
      },
      {
        icon: Plus,
        label: "Create event",
        onClick: openCreateEventPage,
      },
      {
        icon: SidebarMyEventsMenuIcon,
        label: "My events",
        onClick: () => openCompactEventsPage("myEvents"),
        badge: createdEventsCount,
      },
      {
        icon: Users,
        label: "Invited events",
        onClick: () => openCompactEventsPage("invitedEvents"),
        badge: invitedEventsCount,
      },
    ],
    [
      clearEventContext,
      collapseSidebarOnTouch,
      createdEventsCount,
      invitedEventsCount,
      goHomeFromSidebar,
      openCompactEventsPage,
      openCreateEventPage,
      openSnapFromSidebar,
      setSidebarPage,
    ]
  );
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
    try {
      const rawItems = localStorage.getItem("signupItemColors");
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
      getEventStartIso(row?.data) || String(row?.created_at || "");
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
      const isInvited = isInvitedHistoryEvent(data);
      if (data?.signupForm && !isInvited) continue;
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
      const openMode: GroupedEventItem["openMode"] = isSportsPreviewFirstEvent(
        data
      )
        ? "preview"
        : "dashboard";
      const shareStatus =
        String(data?.shareStatus || "")
          .trim()
          .toLowerCase() === "accepted"
          ? "accepted"
          : String(data?.shareStatus || "")
              .trim()
              .toLowerCase() === "pending"
          ? "pending"
          : null;

      const categoryColor = defaultCategoryColor(category);
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

      const entry: GroupedEventItem = {
        row,
        href,
        openMode,
        title: row.title || "Untitled event",
        dateLabel,
        dateMs,
        shareStatus,
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
  }, [history]);
  const myEventsGrouped = groupedEventLists.myEvents;
  const invitedEventsGrouped = groupedEventLists.invitedEvents;
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

  useEffect(() => {
    const onDeleted = async (e: Event) => {
      try {
        const anyEvent = e as any;
        const detail = (anyEvent && anyEvent.detail) || null;
        const deletedId =
          detail && detail.id != null ? String(detail.id).trim() : "";

        if (!deletedId) {
          return;
        }

        // If the deleted event is currently selected in sidebar context, clear it.
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
      "transform 400ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 220ms ease-in-out",
  };
  const rootPanelTransform =
    sidebarPage === "root" ? "translateX(0%)" : "translateX(-2rem)";
  const createEventPanelTransform =
    sidebarPage === "createEvent"
      ? "translateX(0%)"
      : sidebarPage === "createEventOther"
      ? "translateX(-2rem)"
      : "translateX(100%)";
  const createEventOtherPanelTransform =
    sidebarPage === "createEventOther" ? "translateX(0%)" : "translateX(100%)";
  const myEventsPanelTransform =
    sidebarPage === "myEvents"
      ? "translateX(0%)"
      : sidebarPage === "eventContext" && eventContextSourcePage === "myEvents"
      ? "translateX(-2rem)"
      : "translateX(100%)";
  const invitedEventsPanelTransform =
    sidebarPage === "invitedEvents"
      ? "translateX(0%)"
      : sidebarPage === "eventContext" &&
        eventContextSourcePage === "invitedEvents"
      ? "translateX(-2rem)"
      : "translateX(100%)";
  const eventPanelTransform =
    sidebarPage === "eventContext" ? "translateX(0%)" : "translateX(100%)";
  const panelStyle = (transform: string, isActive: boolean): CSSProperties => ({
    ...panelTransitionStyle,
    transform,
    pointerEvents: isActive ? "auto" : "none",
    opacity: isActive ? 1 : 0,
  });
  const renderCreateMenuButton = (
    item: { label: string; href: string },
    idx: number
  ) => {
    const Icon = ICON_LOOKUP[item.label] || Sparkles;
    const colorClass =
      CREATE_SECTION_COLORS[idx % CREATE_SECTION_COLORS.length];
    const isActive =
      isCreateItemActive(item) ||
      (forcedCreateActiveLabel !== null &&
        forcedCreateActiveLabel.toLowerCase() === item.label.toLowerCase()) ||
      (lastCreateSelection !== null &&
        lastCreateSelection.toLowerCase() === item.label.toLowerCase());

    const activeAccent = getCreateMenuActiveAccent(item.label);

    return (
      <button
        key={item.label}
        type="button"
        className={`${SIDEBAR_ITEM_CARD_CLASS} ${SIDEBAR_MENU_ROW_CLASS} group border py-3 pl-3 pr-4 ${
          isActive
            ? activeAccent.buttonClass
            : "border-slate-100 bg-white hover:bg-slate-50 hover:shadow-md"
        }`}
        style={isActive ? activeAccent.buttonStyle : undefined}
        onClick={() => handleCreateModalSelect(item.label, item.href)}
      >
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl border shadow-sm ${
            isActive ? activeAccent.chipClass : colorClass
          }`}
        >
          {Icon === SidebarGymnasticsMenuIcon ? (
            <SidebarGymnasticsMenuIcon size={22} active={isActive} />
          ) : Icon === SidebarFootballMenuIcon ? (
            <SidebarFootballMenuIcon size={22} active={isActive} />
          ) : (
            <Icon size={22} />
          )}
        </span>
        <span className="flex-1 truncate">{item.label}</span>
        <ChevronRight
          size={16}
          className={`ml-auto transition-all ${
            isActive
              ? activeAccent.chevronClass
              : "text-slate-300 group-hover:text-indigo-500"
          }`}
        />
      </button>
    );
  };

  if (isEmbeddedEditMode) return null;

  return (
    <>
      {!isOpen && (
        <>
          <header
            className={`fixed inset-x-0 top-0 z-[6500] flex items-center justify-between px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] transition-all duration-300 ease-in-out lg:hidden ${
              showMobileTopBar
                ? "translate-y-0 opacity-100 pointer-events-auto bg-[#F8F5FF]/95 backdrop-blur-md shadow-sm"
                : "-translate-y-full opacity-0 pointer-events-none border-transparent bg-transparent"
            }`}
          >
            <button
              ref={openBarButtonRef}
              type="button"
              className="inline-flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center text-slate-700 touch-manipulation cursor-pointer"
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
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="4" cy="5" r="2" />
                <rect x="9" y="3" width="13" height="4" rx="2" />
                <circle cx="4" cy="12" r="2" />
                <rect x="9" y="10" width="13" height="4" rx="2" />
                <circle cx="4" cy="19" r="2" />
                <rect x="9" y="17" width="13" height="4" rx="2" />
              </svg>
            </button>
            <Link
              href="/"
              onClick={goHomeFromSidebar}
              className="flex h-11 min-w-0 flex-1 items-center justify-end pr-1"
            >
              <EnvitefyWordmark className="text-[1.55rem] leading-none drop-shadow-sm sm:text-[1.65rem]" />
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
        className={`fixed left-0 top-0 z-[6000] flex h-full flex-col border-r border-slate-200 bg-[#f8f9fb] ${overflowClass} transition-[transform,opacity,width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-transform ${pointerClass} lg:flex`}
        style={{
          width: sidebarWidth,
          transform: sidebarTransform,
          opacity: isDesktop ? 1 : isOpen ? 1 : 0,
          backgroundColor: "#f8f9fb",
          boxShadow: "0 24px 60px rgba(15, 23, 42, 0.08)",
        }}
        aria-label="Sidebar"
      >
        <div
          className={`absolute inset-0 flex h-full flex-col items-center gap-4 bg-[#f8f9fb] px-3 py-5 transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
            isCompact
              ? "translate-x-0 opacity-100"
              : "-translate-x-3 opacity-0 pointer-events-none"
          }`}
          aria-hidden={!isCompact}
        >
          <div className="flex h-full flex-col items-center gap-4">
            <button
              type="button"
              aria-label="Expand navigation"
              onClick={() => setIsCollapsed(false)}
              className={SIDEBAR_TOGGLE_CLASS}
            >
              <ChevronRight size={18} />
            </button>
            <div className="flex-1 flex flex-col items-center gap-3">
              {compactNavItems.map((item) => {
                const Icon = item.icon;
                const badgeCount = item.badge || 0;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.onClick}
                    className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:text-slate-900 hover:shadow-md"
                    title={item.label}
                    aria-label={item.label}
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
              onClick={() => {
                void secureSignOut("/");
              }}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-transparent bg-transparent text-red-500 transition hover:bg-[#e8e8e8]"
              title="Log out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <div
          className={`relative h-full w-full transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
            isCompact
              ? "translate-x-3 opacity-0 pointer-events-none select-none"
              : "translate-x-0 opacity-100"
          }`}
          aria-hidden={isCompact}
        >
          <div className="relative h-full w-full overflow-hidden">
            <div className="absolute inset-0 z-[1] flex h-full flex-col bg-[#f8f9fb]">
              {/* Header with close button */}
              <div className="relative z-10 flex-shrink-0 px-5 pb-3 pt-5">
                <div className={`relative ${SIDEBAR_CARD_CLASS} px-5 py-4`}>
                  <button
                    type="button"
                    aria-label={
                      isCollapsed ? "Expand navigation" : "Collapse navigation"
                    }
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`absolute right-4 top-4 ${SIDEBAR_TOGGLE_CLASS}`}
                  >
                    {isCollapsed ? (
                      <ChevronRight size={16} />
                    ) : (
                      <ChevronLeft size={16} />
                    )}
                  </button>
                  <div className="flex w-full justify-start pr-12">
                    <Link
                      href="/"
                      onClick={goHomeFromSidebar}
                      className="inline-flex max-w-[190px] translate-y-1 items-center pl-8"
                    >
                      <EnvitefyWordmark className="text-[1.75rem] leading-none" />
                    </Link>
                  </div>
                </div>
              </div>
              {/* Middle: Navigation area */}
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="px-5">
                  <div className={SIDEBAR_DIVIDER_CLASS} />
                </div>

                <div className="relative mt-1 min-h-0 flex-1 overflow-hidden">
                  <div
                    className={`${SIDEBAR_PANEL_CLASS} z-[5]`}
                    style={panelStyle(
                      rootPanelTransform,
                      sidebarPage === "root"
                    )}
                    aria-hidden={sidebarPage !== "root"}
                  >
                    <div className="space-y-3 pt-2">
                      <div className="-ml-2 space-y-2">
                        <Link
                          href="/"
                          onClick={goHomeFromSidebar}
                          className={`${SIDEBAR_ITEM_CARD_CLASS} ${SIDEBAR_MENU_ROW_CLASS} ${
                            pathname === "/" && sidebarPage === "root"
                              ? "border border-indigo-100 bg-white text-indigo-600 shadow-[0_16px_30px_rgba(99,102,241,0.14)]"
                              : "hover:bg-slate-200/40 text-slate-500"
                          } py-3 pl-3 pr-4`}
                        >
                          <span
                            className={`${SIDEBAR_ICON_CHIP_CLASS} ${
                              pathname === "/" && sidebarPage === "root"
                                ? "border-indigo-100 bg-indigo-50 text-indigo-600"
                                : SIDEBAR_ICON_CHIP_ACCENT_CLASS
                            }`}
                          >
                            <Home size={18} />
                          </span>
                          <span className="truncate">Home</span>
                        </Link>
                        <Link
                          href="/event"
                          onClick={() => {
                            clearEventContext();
                            setSidebarPage("root");
                            collapseSidebarOnTouch();
                          }}
                          className={`${SIDEBAR_ITEM_CARD_CLASS} ${SIDEBAR_MENU_ROW_CLASS} ${
                            pathname === "/event" && sidebarPage === "root"
                              ? "border border-indigo-100 bg-white text-indigo-600 shadow-[0_16px_30px_rgba(99,102,241,0.14)]"
                              : "hover:bg-slate-200/40 text-slate-500"
                          } py-3 pl-3 pr-4`}
                        >
                          <span
                            className={`${SIDEBAR_ICON_CHIP_CLASS} ${
                              pathname === "/event" && sidebarPage === "root"
                                ? "border-indigo-100 bg-indigo-50 text-indigo-600"
                                : SIDEBAR_ICON_CHIP_ACCENT_CLASS
                            }`}
                          >
                            <Camera size={18} />
                          </span>
                          <span className="truncate">Snap event</span>
                        </Link>
                        <button
                          type="button"
                          onClick={openCreateEventPage}
                          className={`${SIDEBAR_ITEM_CARD_CLASS} ${SIDEBAR_MENU_ROW_CLASS} ${
                            sidebarPage === "createEvent" ||
                            sidebarPage === "createEventOther"
                              ? "border border-indigo-100 bg-white text-indigo-600 shadow-[0_16px_30px_rgba(99,102,241,0.14)]"
                              : "text-slate-500 hover:bg-slate-200/40"
                          } py-3 pl-3 pr-4`}
                        >
                          <span
                            className={`${SIDEBAR_ICON_CHIP_CLASS} ${
                              sidebarPage === "createEvent" ||
                              sidebarPage === "createEventOther"
                                ? "border-indigo-100 bg-indigo-50 text-indigo-600"
                                : SIDEBAR_ICON_CHIP_ACCENT_CLASS
                            }`}
                          >
                            <Plus size={18} />
                          </span>
                          <span className="truncate">Create Event</span>
                          <span className="ml-auto flex items-center gap-2">
                            <span className={SIDEBAR_BADGE_CLASS}>
                              {createMenuOptionCount}
                            </span>
                            <ChevronRight
                              size={16}
                              className="text-slate-400"
                            />
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSidebarPage("myEvents")}
                          className={`${SIDEBAR_ITEM_CARD_CLASS} ${SIDEBAR_MENU_ROW_CLASS} ${
                            sidebarPage === "myEvents" ||
                            (sidebarPage === "eventContext" &&
                              eventContextSourcePage === "myEvents")
                              ? "border border-indigo-100 bg-white text-indigo-600 shadow-[0_16px_30px_rgba(99,102,241,0.14)]"
                              : "text-slate-500 hover:bg-slate-200/40"
                          } py-3 pl-3 pr-4`}
                        >
                          <span
                            className={`${SIDEBAR_ICON_CHIP_CLASS} ${
                              sidebarPage === "myEvents" ||
                              (sidebarPage === "eventContext" &&
                                eventContextSourcePage === "myEvents")
                                ? "border-indigo-100 bg-indigo-50 text-indigo-600"
                                : SIDEBAR_ICON_CHIP_ACCENT_CLASS
                            }`}
                          >
                            <SidebarMyEventsMenuIcon
                              size={18}
                              active={
                                sidebarPage === "myEvents" ||
                                (sidebarPage === "eventContext" &&
                                  eventContextSourcePage === "myEvents")
                              }
                            />
                          </span>
                          <span className="truncate">My Events</span>
                          <span className="ml-auto flex items-center gap-2">
                            <span className={SIDEBAR_BADGE_CLASS}>
                              {createdEventsCount}
                            </span>
                            <ChevronRight
                              size={16}
                              className="text-slate-400"
                            />
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSidebarPage("invitedEvents")}
                          className={`${SIDEBAR_ITEM_CARD_CLASS} ${SIDEBAR_MENU_ROW_CLASS} ${
                            sidebarPage === "invitedEvents" ||
                            (sidebarPage === "eventContext" &&
                              eventContextSourcePage === "invitedEvents")
                              ? "border border-indigo-100 bg-white text-indigo-600 shadow-[0_16px_30px_rgba(99,102,241,0.14)]"
                              : "text-slate-500 hover:bg-slate-200/40"
                          } py-3 pl-3 pr-4`}
                        >
                          <span
                            className={`${SIDEBAR_ICON_CHIP_CLASS} ${
                              sidebarPage === "invitedEvents" ||
                              (sidebarPage === "eventContext" &&
                                eventContextSourcePage === "invitedEvents")
                                ? "border-indigo-100 bg-indigo-50 text-indigo-600"
                                : SIDEBAR_ICON_CHIP_ACCENT_CLASS
                            }`}
                          >
                            <Users size={18} />
                          </span>
                          <span className="truncate">Invited Events</span>
                          <span className="ml-auto flex items-center gap-2">
                            <span className={SIDEBAR_BADGE_CLASS}>
                              {invitedEventsCount}
                            </span>
                            <ChevronRight
                              size={16}
                              className="text-slate-400"
                            />
                          </span>
                        </button>
                        {showDevDiagnostics ? (
                          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-[11px] font-medium text-amber-950">
                            <div className="flex flex-wrap gap-x-3 gap-y-1">
                              <span>history rows: {history.length}</span>
                              <span>itemCount: {String(historyDiagnostics?.itemCount ?? "-")}</span>
                              <span>source: {String(historyDiagnostics?.source ?? "-")}</span>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-amber-900/80">
                              <span>empty: {String(historyDiagnostics?.emptyReason ?? "-")}</span>
                              <span>degraded: {String(historyDiagnostics?.degradedReason ?? "-")}</span>
                              <span>view: {String(historyDiagnostics?.view ?? "-")}</span>
                            </div>
                          </div>
                        ) : null}
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
                    <div className="space-y-3 pt-2">
                      <div className={SUBPAGE_STICKY_HEADER_CLASS}>
                        <button
                          type="button"
                          onClick={() => {
                            setForcedCreateActiveLabel(null);
                            setSidebarPage("root");
                          }}
                          className={`${SIDEBAR_ITEM_CARD_CLASS} ${SIDEBAR_BACK_ROW_CLASS}`}
                        >
                          <span
                            className={`${SIDEBAR_ICON_CHIP_CLASS} ${SIDEBAR_ICON_CHIP_ACCENT_CLASS}`}
                          >
                            <ChevronLeft size={16} />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-500">
                              Return
                            </span>
                            <span className="block truncate text-xl font-extrabold text-slate-900">
                              Create Event
                            </span>
                          </span>
                        </button>
                      </div>
                      <div className="space-y-3">
                        {gymnasticsCreateItem
                          ? renderCreateMenuButton(gymnasticsCreateItem, 0)
                          : null}
                        {footballCreateItem
                          ? renderCreateMenuButton(footballCreateItem, 1)
                          : null}
                        {otherCreateMenuItems.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setSidebarPage("createEventOther")}
                            className={`${SIDEBAR_ITEM_CARD_CLASS} ${SIDEBAR_MENU_ROW_CLASS} group border py-3 pl-3 pr-4 ${
                              isOtherEventsActive
                                ? "border-purple-200 bg-purple-50 text-purple-800 shadow-[0_16px_30px_rgba(147,51,234,0.12),inset_0_0_0_1px_rgba(147,51,234,0.18)]"
                                : "border-slate-100 bg-white hover:bg-slate-50 hover:shadow-md"
                            }`}
                            style={
                              isOtherEventsActive
                                ? {
                                    backgroundColor: "#F3E8FF",
                                    borderColor: "#E9D5FF",
                                    boxShadow:
                                      "0 16px 30px rgba(147, 51, 234, 0.12), inset 0 0 0 1px rgba(147, 51, 234, 0.18)",
                                  }
                                : undefined
                            }
                          >
                            <span
                              className={`flex h-11 w-11 items-center justify-center rounded-xl border shadow-sm ${
                                isOtherEventsActive
                                  ? "border-purple-200 bg-white text-purple-700"
                                  : CREATE_SECTION_COLORS[
                                      gymnasticsCreateItem && footballCreateItem
                                        ? 2
                                        : gymnasticsCreateItem ||
                                          footballCreateItem
                                        ? 1
                                        : 0
                                    ]
                              }`}
                            >
                              <CalendarDays size={17} />
                            </span>
                            <span className="flex-1 truncate">
                              Other Events
                            </span>
                            <span className="ml-auto flex items-center gap-2">
                              <span className={SIDEBAR_BADGE_CLASS}>
                                {otherCreateMenuItems.length}
                              </span>
                              <ChevronRight
                                size={16}
                                className={`transition-all ${
                                  isOtherEventsActive
                                    ? "text-purple-400"
                                    : "text-slate-300 group-hover:text-indigo-500"
                                }`}
                              />
                            </span>
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`${SIDEBAR_PANEL_CLASS} z-[12]`}
                    style={panelStyle(
                      createEventOtherPanelTransform,
                      sidebarPage === "createEventOther"
                    )}
                    aria-hidden={sidebarPage !== "createEventOther"}
                  >
                    <div className="space-y-3 pt-2">
                      <div className={SUBPAGE_STICKY_HEADER_CLASS}>
                        <button
                          type="button"
                          onClick={() => {
                            setForcedCreateActiveLabel(null);
                            setSidebarPage("createEvent");
                          }}
                          className={`${SIDEBAR_ITEM_CARD_CLASS} ${SIDEBAR_BACK_ROW_CLASS}`}
                        >
                          <span
                            className={`${SIDEBAR_ICON_CHIP_CLASS} ${SIDEBAR_ICON_CHIP_ACCENT_CLASS}`}
                          >
                            <ChevronLeft size={16} />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-500">
                              Return
                            </span>
                            <span className="block truncate text-xl font-extrabold text-slate-900">
                              Other Events
                            </span>
                          </span>
                        </button>
                      </div>
                      <div className="space-y-3">
                        {otherCreateMenuItems.map((item, idx) =>
                          renderCreateMenuButton(item, idx)
                        )}
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
                    <div className="space-y-3 pt-2">
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
                              Return
                            </span>
                            <span className="block truncate text-xl font-extrabold text-slate-900">
                              My Events
                            </span>
                          </span>
                        </button>
                      </div>

                      <div className="space-y-4">
                        {myEventsGrouped.upcoming.length === 0 &&
                        myEventsGrouped.past.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500 shadow-sm">
                            No events yet.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {myEventsGrouped.upcoming.length === 0 ? (
                              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500 shadow-sm">
                                No upcoming events.
                              </div>
                            ) : (
                              myEventsGrouped.upcoming.map((group) => (
                                <section
                                  key={`upcoming-${group.category}`}
                                  className="space-y-2"
                                >
                                  <div className="px-1 pt-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                      {group.category}
                                    </p>
                                    <div
                                      className={`mt-1 ${SIDEBAR_DIVIDER_CLASS}`}
                                    />
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
                                      } w-full border border-slate-100 bg-white px-4 py-3 text-left text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md`}
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
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                      Past Events
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setShowPastMyEvents((prev) => !prev)
                                      }
                                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-slate-600 shadow-sm transition hover:bg-slate-50"
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
                                  <div
                                    className={`mt-1 ${SIDEBAR_DIVIDER_CLASS}`}
                                  />
                                </div>

                                {showPastMyEvents &&
                                  (myEventsGrouped.past.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500 shadow-sm">
                                      No past events.
                                    </div>
                                  ) : (
                                    myEventsGrouped.past.map((group) => (
                                      <section
                                        key={`past-${group.category}`}
                                        className="space-y-2"
                                      >
                                        <div className="px-1 pt-1">
                                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                            {group.category}
                                          </p>
                                          <div
                                            className={`mt-1 ${SIDEBAR_DIVIDER_CLASS}`}
                                          />
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
                                            } w-full border border-slate-100 bg-white px-4 py-3 text-left text-slate-700 opacity-75 shadow-sm saturate-75 transition-all hover:-translate-y-0.5 hover:shadow-md`}
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
                                  ))}
                              </section>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`${SIDEBAR_PANEL_CLASS} z-[20]`}
                    style={panelStyle(
                      invitedEventsPanelTransform,
                      sidebarPage === "invitedEvents"
                    )}
                    aria-hidden={sidebarPage !== "invitedEvents"}
                  >
                    <div className="space-y-3 pt-2">
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
                              Return
                            </span>
                            <span className="block truncate text-xl font-extrabold text-slate-900">
                              Invited Events
                            </span>
                          </span>
                        </button>
                      </div>

                      <div className="space-y-4">
                        {invitedEventsGrouped.upcoming.length === 0 &&
                        invitedEventsGrouped.past.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500 shadow-sm">
                            No invited events yet.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {invitedEventsGrouped.upcoming.length === 0 ? (
                              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500 shadow-sm">
                                No upcoming events.
                              </div>
                            ) : (
                              invitedEventsGrouped.upcoming.map((group) => (
                                <section
                                  key={`invited-upcoming-${group.category}`}
                                  className="space-y-2"
                                >
                                  <div className="px-1 pt-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                      {group.category}
                                    </p>
                                    <div
                                      className={`mt-1 ${SIDEBAR_DIVIDER_CLASS}`}
                                    />
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
                                      } w-full border border-slate-100 bg-white px-4 py-3 text-left text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md`}
                                      style={item.style}
                                    >
                                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full border border-indigo-200 bg-indigo-50" />
                                      <span className="min-w-0 flex-1">
                                        <span className="flex items-center gap-2">
                                          <span className="block truncate text-sm md:text-base font-semibold">
                                            {item.title}
                                          </span>
                                          {item.shareStatus === "pending" ? (
                                            <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-amber-700">
                                              Pending
                                            </span>
                                          ) : null}
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
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                      Past Events
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setShowPastInvitedEvents(
                                          (prev) => !prev
                                        )
                                      }
                                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-slate-600 shadow-sm transition hover:bg-slate-50"
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
                                  <div
                                    className={`mt-1 ${SIDEBAR_DIVIDER_CLASS}`}
                                  />
                                </div>

                                {showPastInvitedEvents &&
                                  (invitedEventsGrouped.past.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500 shadow-sm">
                                      No past invited events.
                                    </div>
                                  ) : (
                                    invitedEventsGrouped.past.map((group) => (
                                      <section
                                        key={`invited-past-${group.category}`}
                                        className="space-y-2"
                                      >
                                        <div className="px-1 pt-1">
                                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                            {group.category}
                                          </p>
                                          <div
                                            className={`mt-1 ${SIDEBAR_DIVIDER_CLASS}`}
                                          />
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
                                            } w-full border border-slate-100 bg-white px-4 py-3 text-left text-slate-700 opacity-70 shadow-sm saturate-75 transition-all hover:-translate-y-0.5 hover:shadow-md`}
                                            style={item.style}
                                          >
                                            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full border border-indigo-200 bg-indigo-50" />
                                            <span className="min-w-0 flex-1">
                                              <span className="flex items-center gap-2">
                                                <span className="block truncate text-sm md:text-base font-semibold">
                                                  {item.title}
                                                </span>
                                                {item.shareStatus ===
                                                "pending" ? (
                                                  <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-amber-700">
                                                    Pending
                                                  </span>
                                                ) : null}
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
              <div className="border-t border-slate-200 bg-[#f8f9fb] px-5 py-4">
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
                    className={`${SIDEBAR_FOOTER_TRIGGER_CLASS} ${
                      menuOpen ? "ring-2 ring-indigo-50/60 shadow-xl" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1 inline-flex items-center gap-3.5">
                      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 text-[15px] font-bold text-indigo-700">
                        {profileInitials}
                      </span>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="truncate text-[14px] font-bold leading-tight text-slate-700">
                          {displayName}
                        </div>
                        {userEmail && (
                          <div className="truncate text-[12px] text-slate-400">
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
                    <span
                      className={`pr-1 text-slate-300 transition-transform duration-300 ${
                        menuOpen ? "rotate-180" : "rotate-0"
                      }`}
                      aria-hidden="true"
                    >
                      <ChevronUp size={18} />
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      ref={menuRef}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      className={`pointer-events-auto absolute bottom-full right-0 z-[1000] mb-2 w-[75%] origin-bottom-right rounded-[22px] border border-indigo-50 bg-white p-1.5 shadow-xl transition-all duration-300 ease-out ${
                        menuOpen
                          ? "translate-y-0 scale-100 opacity-100"
                          : "pointer-events-none translate-y-4 scale-90 opacity-0"
                      }`}
                    >
                      <div className="flex flex-col space-y-0.5">
                        {footerMenuItems.map(
                          ({ href, label, Icon, colorClass, bgClass }) => (
                            <Link
                              key={label}
                              href={href}
                              onClick={() => {
                                setMenuOpen(false);
                              }}
                              className="group flex w-full items-center gap-3.5 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-slate-50"
                            >
                              <span
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bgClass} ${colorClass} transition-transform group-hover:scale-105`}
                              >
                                <Icon size={16} />
                              </span>
                              <span className="text-[13px] font-medium text-slate-600">
                                {label}
                              </span>
                            </Link>
                          )
                        )}

                        <div className="mx-2 my-1 h-px bg-slate-100" />

                        <button
                          onClick={() => {
                            void secureSignOut("/");
                          }}
                          className="group flex w-full items-center gap-3.5 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-red-50"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-400 transition-transform group-hover:scale-105">
                            <LogOut size={16} />
                          </span>
                          <span className="text-[13px] font-medium text-red-400">
                            Log out
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

    </>
  );
}
