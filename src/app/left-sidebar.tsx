"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  type ComponentType,
  type CSSProperties,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import EnvitefyWordmark from "@/components/branding/EnvitefyWordmark";
import EventSidebar from "@/components/navigation/EventSidebar";
import { useMenu } from "@/contexts/MenuContext";
import { secureSignOut } from "@/utils/secureSignOut";
import { useEventCache } from "@/app/event-cache-context";
import {
  Baby,
  Cake,
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  FileEdit,
  Footprints,
  GraduationCap,
  Heart,
  Home,
  Info,
  LogOut,
  Mail,
  Music,
  PartyPopper,
  Plus,
  ShieldCheck,
  Stethoscope,
  WandSparkles,
  Trophy,
  Upload,
  User,
  Users,
} from "lucide-react";
import { useSidebar } from "./sidebar-context";
import {
  createSidebarIconLookup,
  CREATE_SECTION_COLORS,
  getCreateMenuActiveAccent,
  getSidebarPrimaryActiveAccent,
  GroupedEventItem,
  GroupedEventSection,
  SIDEBAR_BADGE_CLASS,
  SIDEBAR_DIVIDER_CLASS,
  SIDEBAR_EVENT_PANEL_CLASS,
  SIDEBAR_FOOTER_TRIGGER_CLASS,
  SIDEBAR_ICON_CHIP_ACCENT_CLASS,
  SIDEBAR_ICON_CHIP_CLASS,
  SIDEBAR_ITEM_CARD_CLASS,
  SIDEBAR_MENU_ROW_CLASS,
  SIDEBAR_PANEL_CLASS,
  SUBPAGE_STICKY_HEADER_CLASS,
} from "./left-sidebar.model";
import { useLeftSidebarController } from "./left-sidebar.controller";

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
      className={["shrink-0", "text-current", className]
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

const sidebarIconLookup = createSidebarIconLookup({
  Baby,
  Cake,
  CalendarDays,
  Camera,
  FileEdit,
  Footprints,
  GraduationCap,
  Heart,
  Music,
  PartyPopper,
  SidebarFootballMenuIcon,
  SidebarGymnasticsMenuIcon,
  Stethoscope,
  WandSparkles,
  Trophy,
  Upload,
});

const footerItemIcons: Record<string, ComponentType<{ size?: number }>> = {
  Profile: User,
  "About us": Info,
  "Contact us": Mail,
  Admin: ShieldCheck,
};

const SIDEBAR_SUBMENU_CARD_CLASS =
  "nav-chrome-menu-card nav-chrome-motion rounded-[24px] border border-[rgba(235,231,255,0.94)] bg-white/84 shadow-[0_16px_32px_rgba(103,88,160,0.12)]";
const SIDEBAR_SUBMENU_ENTRY_CLASS =
  "nav-chrome-motion group flex w-full items-center gap-3.5 rounded-[18px] border border-transparent px-2.5 py-2.5 text-left transition-[transform,background-color,box-shadow,border-color] hover:border-[rgba(226,220,255,0.98)] hover:bg-white/82 hover:shadow-[0_14px_28px_rgba(103,88,160,0.1)]";
const SIDEBAR_SUBMENU_ROW_CLASS =
  "nav-chrome-motion group flex w-full items-center gap-3 rounded-[20px] border border-transparent px-2 py-2.5 text-left transition-[background-color,border-color,box-shadow,color,transform]";
const SIDEBAR_SUBMENU_ICON_CLASS =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-[background-color,color,border-color,box-shadow]";
const SIDEBAR_SUBMENU_LABEL_CLASS =
  "font-[var(--font-josefin-sans)] flex-1 truncate text-[0.95rem] font-bold uppercase tracking-[0.13em] leading-none transition-colors";
const SIDEBAR_SUBMENU_ROW_ACTIVE_CLASS =
  "bg-white/92 border-[rgba(236,231,255,0.98)] shadow-[0_16px_32px_rgba(103,88,160,0.12)]";
const SIDEBAR_SUBMENU_ROW_INACTIVE_CLASS =
  "text-[#beb9e8] hover:bg-white/28";
const SIDEBAR_SUBMENU_LABEL_ACTIVE_CLASS = "text-[#6b5fc2]";
const SIDEBAR_SUBMENU_LABEL_INACTIVE_CLASS =
  "text-[rgba(107,95,194,0.64)] group-hover:text-[#6b5fc2]";
const SIDEBAR_SUBMENU_ICON_ACTIVE_CLASS =
  "border-[rgba(236,231,255,0.98)] bg-white text-[#6e59db] shadow-[0_10px_20px_rgba(103,88,160,0.1)]";
const SIDEBAR_SUBPAGE_TITLE_CLASS =
  "font-[var(--font-josefin-sans)] text-[1.25rem] font-bold uppercase tracking-[0.13em] leading-none text-[#6b5fc2]";
const SIDEBAR_SUBMENU_ICON_INACTIVE_CLASS =
  "border-transparent bg-transparent text-[#beb9e8] group-hover:text-[#aba4e3]";

function PanelBackButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="nav-chrome-motion flex w-full items-center gap-3 rounded-[22px] px-2 py-2 text-left hover:bg-white/24"
    >
      <span
        className={`${SIDEBAR_ICON_CHIP_CLASS} text-[#7c76c7]`}
      >
        <ChevronLeft size={16} />
      </span>
      <span className="font-[var(--font-josefin-sans)] min-w-0 block text-[0.82rem] font-bold uppercase tracking-[0.13em] leading-none text-[#6b5fc2]">
        Back
      </span>
    </button>
  );
}

function RootNavigationPanel({
  pathname,
  sidebarPage,
  eventContextSourcePage,
  hasCreateEventAccess,
  isCreateEntryActive,
  useGymnasticsDirectCreate,
  createdEventsCount,
  invitedEventsCount,
  onHome,
  onStudio,
  onSnap,
  onCreate,
  onMyEvents,
  onInvitedEvents,
}: {
  pathname: string | null;
  sidebarPage: string;
  eventContextSourcePage: string;
  hasCreateEventAccess: boolean;
  isCreateEntryActive: boolean;
  useGymnasticsDirectCreate: boolean;
  createdEventsCount: number;
  invitedEventsCount: number;
  onHome: () => void;
  onStudio: () => void;
  onSnap: () => void;
  onCreate: () => void;
  onMyEvents: () => void;
  onInvitedEvents: () => void;
}) {
  const isHomeActive = pathname === "/" && sidebarPage === "root";
  const isStudioActive = pathname === "/studio" && sidebarPage === "root";
  const isSnapActive = pathname === "/event" && sidebarPage === "root";
  const isViewingEventFromListInRoot =
    sidebarPage === "root" &&
    Boolean(
      pathname &&
        (pathname.startsWith("/event/") ||
          pathname.startsWith("/smart-signup-form/"))
    );
  const isMyEventsActive =
    sidebarPage === "myEvents" ||
    (sidebarPage === "eventContext" && eventContextSourcePage === "myEvents") ||
    (isViewingEventFromListInRoot && eventContextSourcePage === "myEvents");
  const isInvitedEventsActive =
    sidebarPage === "invitedEvents" ||
    (sidebarPage === "eventContext" &&
      eventContextSourcePage === "invitedEvents") ||
    (isViewingEventFromListInRoot && eventContextSourcePage === "invitedEvents");
  const mainActiveAccent = getSidebarPrimaryActiveAccent();
  const rootMenuActiveChipClass = "nav-chrome-sidebar-chip-active";
  const rootMenuChipClass = SIDEBAR_ICON_CHIP_ACCENT_CLASS;

  const activeRowClass = `${mainActiveAccent.buttonClass} group`;
  const inactiveRowClass = "group";
  const rootRowTextClass =
    "font-[var(--font-josefin-sans)] text-[0.95rem] font-bold uppercase tracking-[0.13em] leading-none";
  const rootInactiveTextClass = "text-[#beb9e8]";
  const rootActiveTextClass = "text-[#6e59db]";
  const rootHoverTextClass = "group-hover:text-[#aba4e3]";
  const rootIconClass = (isActive: boolean) =>
    `transition-colors ${
      isActive
        ? rootActiveTextClass
        : `${rootInactiveTextClass} ${rootHoverTextClass}`
    }`;

  return (
    <div className="space-y-7 pt-3">
      <div className="space-y-2">
        <Link
          href="/"
          onClick={onHome}
          className={`${SIDEBAR_ITEM_CARD_CLASS} ${SIDEBAR_MENU_ROW_CLASS} ${
            isHomeActive ? activeRowClass : inactiveRowClass
          } py-3 pl-4 pr-4`}
          style={
            isHomeActive
              ? (mainActiveAccent.buttonStyle as CSSProperties)
              : undefined
          }
        >
          <span
            className={`${SIDEBAR_ICON_CHIP_CLASS} ${
              isHomeActive ? rootMenuActiveChipClass : rootMenuChipClass
            } ${rootIconClass(isHomeActive)}`}
          >
            <Home size={17} strokeWidth={1.9} />
          </span>
          <span
            className={`truncate ${rootRowTextClass} ${
              isHomeActive
                ? rootActiveTextClass
                : `${rootInactiveTextClass} ${rootHoverTextClass}`
            }`}
          >
            Home
          </span>
        </Link>

        <Link
          href="/studio"
          onClick={onStudio}
          className={`${SIDEBAR_ITEM_CARD_CLASS} ${SIDEBAR_MENU_ROW_CLASS} ${
            isStudioActive ? activeRowClass : inactiveRowClass
          } py-3 pl-4 pr-4`}
          style={
            isStudioActive
              ? (mainActiveAccent.buttonStyle as CSSProperties)
              : undefined
          }
        >
          <span
            className={`${SIDEBAR_ICON_CHIP_CLASS} ${
              isStudioActive ? rootMenuActiveChipClass : rootMenuChipClass
            } ${rootIconClass(isStudioActive)}`}
          >
            <WandSparkles size={17} strokeWidth={1.9} />
          </span>
          <span
            className={`truncate ${rootRowTextClass} ${
              isStudioActive
                ? rootActiveTextClass
                : `${rootInactiveTextClass} ${rootHoverTextClass}`
            }`}
          >
            Studio
          </span>
        </Link>

        {!useGymnasticsDirectCreate ? (
          <Link
            href="/event"
            onClick={onSnap}
            className={`${SIDEBAR_ITEM_CARD_CLASS} ${SIDEBAR_MENU_ROW_CLASS} ${
              isSnapActive ? activeRowClass : inactiveRowClass
            } py-3 pl-4 pr-4`}
            style={
              isSnapActive
                ? (mainActiveAccent.buttonStyle as CSSProperties)
                : undefined
            }
          >
            <span
              className={`${SIDEBAR_ICON_CHIP_CLASS} ${
                isSnapActive ? rootMenuActiveChipClass : rootMenuChipClass
              } ${rootIconClass(isSnapActive)}`}
            >
              <Camera size={17} strokeWidth={1.9} />
            </span>
            <span
              className={`truncate ${rootRowTextClass} ${
                isSnapActive
                  ? rootActiveTextClass
                  : `${rootInactiveTextClass} ${rootHoverTextClass}`
              }`}
            >
              Snap Event
            </span>
          </Link>
        ) : null}

        {hasCreateEventAccess ? (
          <button
            type="button"
            onClick={onCreate}
            className={`${SIDEBAR_ITEM_CARD_CLASS} ${SIDEBAR_MENU_ROW_CLASS} ${
              isCreateEntryActive ? activeRowClass : inactiveRowClass
            } py-3 pl-4 pr-4`}
            style={
              isCreateEntryActive
                ? (mainActiveAccent.buttonStyle as CSSProperties)
                : undefined
            }
          >
            <span
              className={`${SIDEBAR_ICON_CHIP_CLASS} ${
                isCreateEntryActive
                  ? rootMenuActiveChipClass
                  : rootMenuChipClass
              } ${rootIconClass(isCreateEntryActive)}`}
            >
              <Plus size={17} strokeWidth={1.9} />
            </span>
            <span
              className={`truncate ${rootRowTextClass} ${
                isCreateEntryActive
                  ? rootActiveTextClass
                  : `${rootInactiveTextClass} ${rootHoverTextClass}`
              }`}
            >
              Create Event
            </span>
          </button>
        ) : null}

        <button
          type="button"
          onClick={onMyEvents}
          className={`${SIDEBAR_ITEM_CARD_CLASS} ${SIDEBAR_MENU_ROW_CLASS} ${
            isMyEventsActive ? activeRowClass : inactiveRowClass
          } py-3 pl-4 pr-4`}
          style={
            isMyEventsActive
              ? (mainActiveAccent.buttonStyle as CSSProperties)
              : undefined
          }
        >
          <span
            className={`${SIDEBAR_ICON_CHIP_CLASS} ${
              isMyEventsActive ? rootMenuActiveChipClass : rootMenuChipClass
            } ${rootIconClass(isMyEventsActive)}`}
          >
            <SidebarMyEventsMenuIcon size={18} active={isMyEventsActive} />
          </span>
          <span
            className={`truncate ${rootRowTextClass} ${
              isMyEventsActive
                ? rootActiveTextClass
                : `${rootInactiveTextClass} ${rootHoverTextClass}`
            }`}
          >
            My Events
          </span>
          {createdEventsCount > 0 ? (
            <span className={`ml-auto ${SIDEBAR_BADGE_CLASS}`}>
              {createdEventsCount}
            </span>
          ) : null}
        </button>

        <button
          type="button"
          onClick={onInvitedEvents}
          className={`${SIDEBAR_ITEM_CARD_CLASS} ${SIDEBAR_MENU_ROW_CLASS} ${
            isInvitedEventsActive ? activeRowClass : inactiveRowClass
          } py-3 pl-4 pr-4`}
          style={
            isInvitedEventsActive
              ? (mainActiveAccent.buttonStyle as CSSProperties)
              : undefined
          }
        >
          <span
            className={`${SIDEBAR_ICON_CHIP_CLASS} ${
              isInvitedEventsActive
                ? rootMenuActiveChipClass
                : rootMenuChipClass
            } ${rootIconClass(isInvitedEventsActive)}`}
          >
            <Users size={17} strokeWidth={1.9} />
          </span>
          <span
            className={`truncate ${rootRowTextClass} ${
              isInvitedEventsActive
                ? rootActiveTextClass
                : `${rootInactiveTextClass} ${rootHoverTextClass}`
            }`}
          >
            Invited Events
          </span>
          {invitedEventsCount > 0 ? (
            <span className={`ml-auto ${SIDEBAR_BADGE_CLASS}`}>
              {invitedEventsCount}
            </span>
          ) : null}
        </button>
      </div>
    </div>
  );
}

function CreateMenuButton({
  item,
  index,
  isActive,
  onSelect,
}: {
  item: { label: string; href: string };
  index: number;
  isActive: boolean;
  onSelect: (label: string, href?: string) => void;
}) {
  const Icon =
    (sidebarIconLookup[item.label] as ComponentType<any>) || WandSparkles;
  const colorClass =
    CREATE_SECTION_COLORS[index % CREATE_SECTION_COLORS.length];
  const activeAccent = getCreateMenuActiveAccent(item.label);

  return (
    <button
      type="button"
      className={`${SIDEBAR_SUBMENU_ROW_CLASS} ${
        isActive
          ? SIDEBAR_SUBMENU_ROW_ACTIVE_CLASS
          : SIDEBAR_SUBMENU_ROW_INACTIVE_CLASS
      }`}
      onClick={() => onSelect(item.label, item.href)}
    >
      <span
        className={`${SIDEBAR_SUBMENU_ICON_CLASS} ${
          isActive
            ? SIDEBAR_SUBMENU_ICON_ACTIVE_CLASS
            : `${colorClass} ${SIDEBAR_SUBMENU_ICON_INACTIVE_CLASS}`
        }`}
      >
        {Icon === SidebarGymnasticsMenuIcon ? (
          <SidebarGymnasticsMenuIcon size={18} active={isActive} />
        ) : Icon === SidebarFootballMenuIcon ? (
          <SidebarFootballMenuIcon size={18} active={isActive} />
        ) : (
          <Icon size={18} />
        )}
      </span>
      <span
        className={`${SIDEBAR_SUBMENU_LABEL_CLASS} ${
          isActive
            ? SIDEBAR_SUBMENU_LABEL_ACTIVE_CLASS
            : SIDEBAR_SUBMENU_LABEL_INACTIVE_CLASS
        }`}
      >
        {item.label}
      </span>
      <ChevronRight
        size={16}
        className={`ml-auto transition-all ${
          isActive
            ? activeAccent.chevronClass
            : "text-[#b5afe8] group-hover:text-[#7b73d2]"
        }`}
      />
    </button>
  );
}

function CreatePanel({
  title,
  onBack,
  items,
  isItemActive,
  onSelect,
  otherItems,
  isOtherEventsActive,
  onOpenOther,
}: {
  title: string;
  onBack: () => void;
  items: Array<{ label: string; href: string }>;
  isItemActive: (item: { label: string; href: string }) => boolean;
  onSelect: (label: string, href?: string) => void;
  otherItems: Array<{ label: string; href: string }>;
  isOtherEventsActive: boolean;
  onOpenOther: () => void;
}) {
  return (
    <div className="space-y-4 pt-2">
      <div className={SUBPAGE_STICKY_HEADER_CLASS}>
        <PanelBackButton onClick={onBack} />
        <div className="px-2 pb-1 pt-1">
          <p className={SIDEBAR_SUBPAGE_TITLE_CLASS}>{title}</p>
        </div>
      </div>
      <div className="space-y-1.5">
        {items.map((item, index) => (
          <CreateMenuButton
            key={item.label}
            item={item}
            index={index}
            isActive={isItemActive(item)}
            onSelect={onSelect}
          />
        ))}
        {otherItems.length > 0 ? (
          <button
            type="button"
            onClick={onOpenOther}
            className={`${SIDEBAR_SUBMENU_ROW_CLASS} ${
              isOtherEventsActive
                ? SIDEBAR_SUBMENU_ROW_ACTIVE_CLASS
                : SIDEBAR_SUBMENU_ROW_INACTIVE_CLASS
            }`}
          >
            <span
              className={`${SIDEBAR_SUBMENU_ICON_CLASS} ${
                isOtherEventsActive
                  ? SIDEBAR_SUBMENU_ICON_ACTIVE_CLASS
                  : `${CREATE_SECTION_COLORS[0]} ${SIDEBAR_SUBMENU_ICON_INACTIVE_CLASS}`
              }`}
            >
              <CalendarDays size={17} />
            </span>
            <span
              className={`${SIDEBAR_SUBMENU_LABEL_CLASS} ${
                isOtherEventsActive
                  ? SIDEBAR_SUBMENU_LABEL_ACTIVE_CLASS
                  : SIDEBAR_SUBMENU_LABEL_INACTIVE_CLASS
              }`}
            >
              Other Events
            </span>
            <span className="ml-auto flex items-center gap-2">
              <span className={SIDEBAR_BADGE_CLASS}>{otherItems.length}</span>
              <ChevronRight
                size={16}
                className={`transition-all ${
                  isOtherEventsActive
                    ? "text-[#655ec0]"
                    : "text-[#b5afe8] group-hover:text-[#7b73d2]"
                }`}
              />
            </span>
          </button>
        ) : null}
      </div>
    </div>
  );
}

function EventListPanel({
  title,
  grouped,
  emptyStateCopy,
  emptyPastCopy,
  isHistoryRowActive,
  onRowClick,
  pastExpanded,
  setPastExpanded,
  showPendingBadge,
  pastRowOpacityClass,
  onBack,
}: {
  title: string;
  grouped: { upcoming: GroupedEventSection[]; past: GroupedEventSection[] };
  emptyStateCopy: string;
  emptyPastCopy: string;
  isHistoryRowActive: (rowId: string) => boolean;
  onRowClick: (item: GroupedEventItem) => void;
  pastExpanded: boolean;
  setPastExpanded: Dispatch<SetStateAction<boolean>>;
  showPendingBadge: boolean;
  pastRowOpacityClass: string;
  onBack: () => void;
}) {
  const renderRows = (items: GroupedEventItem[], muted: boolean) =>
    items.map((item) => (
      <button
        key={item.row.id}
        type="button"
        onClick={() => onRowClick(item)}
        className={`${SIDEBAR_SUBMENU_ROW_CLASS} items-start px-2 py-2.5 ${
          isHistoryRowActive(item.row.id)
            ? SIDEBAR_SUBMENU_ROW_ACTIVE_CLASS
            : SIDEBAR_SUBMENU_ROW_INACTIVE_CLASS
        } ${muted ? pastRowOpacityClass : ""}`}
      >
        <span
          className={`${SIDEBAR_SUBMENU_ICON_CLASS} mt-0.5 ${
            isHistoryRowActive(item.row.id)
              ? SIDEBAR_SUBMENU_ICON_ACTIVE_CLASS
              : `${item.tintClass} ${SIDEBAR_SUBMENU_ICON_INACTIVE_CLASS}`
          }`}
        >
          <CalendarDays size={16} />
        </span>
        <span className="min-w-0 flex-1">
          {showPendingBadge ? (
            <span className="flex items-center gap-2">
              <span
                className={`font-[var(--font-josefin-sans)] block truncate text-[0.98rem] font-bold leading-none md:text-[1.02rem] ${
                  isHistoryRowActive(item.row.id)
                    ? SIDEBAR_SUBMENU_LABEL_ACTIVE_CLASS
                    : SIDEBAR_SUBMENU_LABEL_INACTIVE_CLASS
                }`}
              >
                {item.title}
              </span>
              {item.shareStatus === "pending" ? (
                <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-amber-700">
                  Pending
                </span>
              ) : null}
            </span>
          ) : (
            <span
              className={`font-[var(--font-josefin-sans)] block truncate text-[0.98rem] font-bold leading-none md:text-[1.02rem] ${
                isHistoryRowActive(item.row.id)
                  ? SIDEBAR_SUBMENU_LABEL_ACTIVE_CLASS
                  : SIDEBAR_SUBMENU_LABEL_INACTIVE_CLASS
              }`}
            >
              {item.title}
            </span>
          )}
          <span
            className={`mt-0.5 block truncate text-xs ${
              isHistoryRowActive(item.row.id)
                ? "text-[#9d95db]"
                : "text-[#c1bcf0] group-hover:text-[#b0aae4]"
            }`}
          >
            {item.dateLabel}
          </span>
        </span>
      </button>
    ));

  const renderGroupSections = (
    sections: GroupedEventSection[],
    muted: boolean
  ) =>
    sections.map((group, index) => (
      <section
        key={`${muted ? "past" : "upcoming"}-${group.category}-${index}`}
        className="space-y-1"
      >
        <div className="px-1 pt-1">
          <p className="font-[var(--font-josefin-sans)] text-[0.82rem] font-bold uppercase tracking-[0.13em] leading-none text-[#6b5fc2]">
            {group.category}
          </p>
          <div className={`mt-1 ${SIDEBAR_DIVIDER_CLASS}`} />
        </div>
        {renderRows(group.items, muted)}
      </section>
    ));

  return (
    <div className="space-y-4 pt-2">
      <div className={SUBPAGE_STICKY_HEADER_CLASS}>
        <PanelBackButton onClick={onBack} />
        <div className="px-2 pb-1 pt-1">
          <p className={SIDEBAR_SUBPAGE_TITLE_CLASS}>{title}</p>
        </div>
      </div>

      <div className="space-y-3">
        {grouped.upcoming.length === 0 && grouped.past.length === 0 ? (
          <div
            className={`${SIDEBAR_SUBMENU_CARD_CLASS} rounded-[24px] border-dashed px-4 py-6 text-center text-sm text-[#7e76b9]`}
          >
            {emptyStateCopy}
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.upcoming.length === 0 ? (
              <div
                className={`${SIDEBAR_SUBMENU_CARD_CLASS} rounded-[24px] border-dashed px-4 py-6 text-center text-sm text-[#7e76b9]`}
              >
                No upcoming events.
              </div>
            ) : (
              renderGroupSections(grouped.upcoming, false)
            )}

            {grouped.past.length > 0 ? (
              <section className="space-y-1">
                <div className="px-1 pt-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9f98d7]">
                      Past Events
                    </p>
                    <button
                      type="button"
                      onClick={() => setPastExpanded((prev) => !prev)}
                      className="nav-chrome-menu-card nav-chrome-motion inline-flex items-center gap-1 rounded-full border border-[rgba(117,103,177,0.18)] bg-white/88 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[var(--nav-chrome-muted)] shadow-[0_10px_22px_rgba(96,81,154,0.08)] hover:bg-white"
                    >
                      <span>
                        {pastExpanded ? "Hide past events" : "Show past events"}
                      </span>
                      <ChevronRight
                        size={12}
                        className={`transition-transform ${
                          pastExpanded ? "rotate-90" : ""
                        }`}
                      />
                    </button>
                  </div>
                  <div className={`mt-1 ${SIDEBAR_DIVIDER_CLASS}`} />
                </div>

                {pastExpanded ? (
                  grouped.past.length === 0 ? (
                    <div
                      className={`${SIDEBAR_SUBMENU_CARD_CLASS} rounded-[24px] border-dashed px-4 py-6 text-center text-sm text-[#7e76b9]`}
                    >
                      {emptyPastCopy}
                    </div>
                  ) : (
                    renderGroupSections(grouped.past, true)
                  )
                ) : null}
              </section>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function FooterProfileMenu({
  isOpen,
  menuOpen,
  setMenuOpen,
  buttonRef,
  menuRef,
  profileInitials,
  userTitleLabel,
  userEmail,
  footerMenuItems,
  isCompact,
}: {
  isOpen: boolean;
  menuOpen: boolean;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
  buttonRef: RefObject<HTMLButtonElement | null>;
  menuRef: RefObject<HTMLDivElement | null>;
  profileInitials: string;
  userTitleLabel: string;
  userEmail?: string;
  footerMenuItems: Array<{
    href: string;
    label: string;
    colorClass: string;
    bgClass: string;
  }>;
  isCompact: boolean;
}) {
  return (
    <div
      className={`absolute bottom-0 left-0 right-0 z-[40] bg-transparent px-5 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-6 ${
        isCompact ? "pointer-events-none" : ""
      }`}
    >
      <div className="relative z-[900]">
        <button
          ref={buttonRef}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen((value) => !value);
          }}
          onMouseDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          aria-expanded={menuOpen}
          className={`${SIDEBAR_FOOTER_TRIGGER_CLASS} ${
            menuOpen
              ? "ring-2 ring-[rgba(110,94,181,0.14)] shadow-[0_22px_40px_rgba(123,112,206,0.18)]"
              : ""
          }`}
        >
          <div className="min-w-0 flex-1 inline-flex items-center gap-3.5">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,#7f67ff_0%,#6f7aff_100%)] text-[15px] font-bold text-white shadow-[0_12px_22px_rgba(102,93,219,0.22)]">
              {profileInitials}
            </span>
            <div className="min-w-0 flex-1 text-left">
              <div className="truncate text-[13px] font-bold leading-tight text-[#5e54b7]">
                {userTitleLabel}
              </div>
              {userEmail ? (
                <div className="truncate text-[11px] text-[#b7b1e8]">
                  {userEmail}
                </div>
              ) : null}
            </div>
          </div>
          <span className="pr-1 text-[#8a80df]" aria-hidden="true">
            <ChevronRight size={16} />
          </span>
        </button>

        {isOpen ? (
          <div
            ref={menuRef}
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            className={`nav-chrome-menu-card pointer-events-auto !absolute z-[1000] w-[75%] origin-bottom-right rounded-[24px] p-1.5 transition-all duration-300 ease-out ${
              menuOpen
                ? "translate-y-0 scale-100 opacity-100"
                : "pointer-events-none translate-y-4 scale-90 opacity-0"
            }`}
            style={{
              right: 0,
              bottom: "calc(100% + 0.5rem)",
            }}
          >
            <div className="flex flex-col space-y-0.5">
              {footerMenuItems.map(({ href, label, colorClass, bgClass }) => {
                const Icon = footerItemIcons[label] || User;
                return (
                  <Link
                    key={label}
                    href={href}
                    onClick={() => {
                      setMenuOpen(false);
                    }}
                    className={SIDEBAR_SUBMENU_ENTRY_CLASS}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/70 ${bgClass} ${colorClass} shadow-[0_10px_20px_rgba(103,88,160,0.08)] transition-transform group-hover:scale-105`}
                    >
                      <Icon size={16} />
                    </span>
                    <span className="text-[13px] font-medium text-[var(--nav-chrome-ink)]">
                      {label}
                    </span>
                  </Link>
                );
              })}

              <div className="nav-chrome-divider mx-2 my-1 h-px" />

              <button
                type="button"
                onClick={() => {
                  void secureSignOut("/");
                }}
                className={SIDEBAR_SUBMENU_ENTRY_CLASS}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/70 bg-red-50 text-red-400 shadow-[0_10px_20px_rgba(103,88,160,0.08)] transition-transform group-hover:scale-105">
                  <LogOut size={16} />
                </span>
                <span className="text-[13px] font-medium text-red-400">
                  Log out
                </span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function LeftSidebar() {
  const { data: session, status } = useSession();
  const menu = useMenu();
  const { historySidebarItems } = useEventCache();
  const sidebar = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const viewModel = useLeftSidebarController({
    session,
    status,
    menu,
    historySidebarItems: historySidebarItems as any,
    sidebar,
    router,
    pathname,
    searchParams,
  });

  if (!viewModel.isReady) return null;
  if (viewModel.isEmbeddedEditMode) return null;

  const panelTransitionStyle: CSSProperties = {
    transition:
      "transform 400ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 220ms ease-in-out",
  };
  const rootPanelTransform =
    viewModel.sidebarPage === "root" ? "translateX(0%)" : "translateX(-2rem)";
  const createEventPanelTransform =
    viewModel.sidebarPage === "createEvent"
      ? "translateX(0%)"
      : viewModel.sidebarPage === "createEventOther"
      ? "translateX(-2rem)"
      : "translateX(100%)";
  const createEventOtherPanelTransform =
    viewModel.sidebarPage === "createEventOther"
      ? "translateX(0%)"
      : "translateX(100%)";
  const myEventsPanelTransform =
    viewModel.sidebarPage === "myEvents"
      ? "translateX(0%)"
      : viewModel.sidebarPage === "eventContext" &&
        viewModel.eventContextSourcePage === "myEvents"
      ? "translateX(-2rem)"
      : "translateX(100%)";
  const invitedEventsPanelTransform =
    viewModel.sidebarPage === "invitedEvents"
      ? "translateX(0%)"
      : viewModel.sidebarPage === "eventContext" &&
        viewModel.eventContextSourcePage === "invitedEvents"
      ? "translateX(-2rem)"
      : "translateX(100%)";
  const eventPanelTransform =
    viewModel.sidebarPage === "eventContext"
      ? "translateX(0%)"
      : "translateX(100%)";
  const panelStyle = (transform: string, isActive: boolean): CSSProperties => ({
    ...panelTransitionStyle,
    transform,
    pointerEvents: isActive ? "auto" : "none",
    opacity: isActive ? 1 : 0,
  });

  return (
    <>
      {!viewModel.isOpen ? (
        <header
          data-app-mobile-topbar="workspace"
          className={`fixed inset-x-0 top-0 z-[6500] px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] transition-all duration-300 ease-in-out lg:hidden ${
            viewModel.showMobileTopBar
              ? "translate-y-0 opacity-100 pointer-events-auto"
              : "-translate-y-full opacity-0 pointer-events-none"
          }`}
        >
          <div className="nav-chrome-glass-header nav-chrome-motion flex items-center justify-between gap-3 rounded-[1.65rem] px-3 py-2.5">
            <button
              ref={viewModel.openBarButtonRef}
              type="button"
              className="nav-chrome-pill-secondary nav-chrome-motion inline-flex h-10 w-10 min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation items-center justify-center rounded-full"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                viewModel.openSidebarFromTrigger();
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
            <div className="ml-auto flex min-w-0 items-center gap-2">
              {viewModel.showEditTopBar ? (
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window === "undefined") return;
                    window.dispatchEvent(
                      new CustomEvent("envitefy:open-discovery-editor")
                    );
                  }}
                  className="nav-chrome-pill-secondary nav-chrome-motion inline-flex h-10 w-10 min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation items-center justify-center rounded-full"
                  aria-label="Customize your meet"
                >
                  <CustomizeIcon size={14} />
                </button>
              ) : null}
              <Link
                href="/"
                onClick={viewModel.goHomeFromSidebar}
                className="flex h-11 min-w-0 items-center justify-end"
              >
                <EnvitefyWordmark
                  className="text-[1.55rem] leading-none sm:text-[1.65rem]"
                  scaled={false}
                />
              </Link>
            </div>
          </div>
        </header>
      ) : null}

      <div
        className={`nav-chrome-mobile-drawer-backdrop fixed inset-0 z-[5999] transition-opacity duration-200 lg:hidden ${
          viewModel.isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => {
          if (viewModel.isDesktop) return;
          viewModel.closeSidebarFromBackdrop();
        }}
        aria-hidden="true"
      />

      <aside
        ref={viewModel.asideRef}
        className={`nav-chrome-sidebar-surface fixed left-0 top-0 z-[6000] flex h-full flex-col border-r border-[rgba(112,97,168,0.14)] ${viewModel.overflowClass} transition-[transform,opacity,width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${viewModel.pointerClass} lg:flex`}
        style={{
          width: viewModel.sidebarWidth,
          height: viewModel.isDesktop ? "100%" : "100dvh",
          transform: viewModel.sidebarTransform,
          opacity: viewModel.isDesktop ? 1 : viewModel.isOpen ? 1 : 0,
          boxShadow: "0 24px 60px rgba(88, 71, 171, 0.18)",
        }}
        aria-label="Sidebar"
      >
        <div className="relative h-full w-full transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]">
          <div className="relative h-full w-full overflow-hidden">
            <div className="nav-chrome-sidebar-surface absolute inset-0 z-[1] flex h-full flex-col">
              <div className="relative z-10 flex-shrink-0 px-5 pb-4 pt-5">
                <Link
                  href="/"
                  onClick={viewModel.goHomeFromSidebar}
                  className="inline-flex min-h-11 max-w-full items-center"
                  aria-label="Workspace home"
                >
                  <EnvitefyWordmark
                    className="text-[3.15rem] leading-none"
                    scaled={false}
                  />
                </Link>
              </div>

              <div className="flex min-h-0 flex-1 flex-col">
                <div className="relative min-h-0 flex-1 overflow-hidden">
                  <div
                    className={`${SIDEBAR_PANEL_CLASS} z-[5]`}
                    style={panelStyle(
                      rootPanelTransform,
                      viewModel.sidebarPage === "root"
                    )}
                    aria-hidden={viewModel.sidebarPage !== "root"}
                  >
                    <RootNavigationPanel
                      pathname={pathname}
                      sidebarPage={viewModel.sidebarPage}
                      eventContextSourcePage={viewModel.eventContextSourcePage}
                      hasCreateEventAccess={viewModel.hasCreateEventAccess}
                      isCreateEntryActive={viewModel.isCreateEntryActive}
                      useGymnasticsDirectCreate={
                        viewModel.useGymnasticsDirectCreate
                      }
                      createdEventsCount={viewModel.createdEventsCount}
                      invitedEventsCount={viewModel.invitedEventsCount}
                      onHome={viewModel.goHomeFromSidebar}
                      onStudio={viewModel.goStudioFromSidebar}
                      onSnap={viewModel.handleRootSnapNavigate}
                      onCreate={viewModel.openCreateEventPage}
                      onMyEvents={viewModel.openMyEventsPage}
                      onInvitedEvents={viewModel.openInvitedEventsPage}
                    />
                  </div>

                  <div
                    className={`${SIDEBAR_PANEL_CLASS} z-[10]`}
                    style={panelStyle(
                      createEventPanelTransform,
                      viewModel.sidebarPage === "createEvent"
                    )}
                    aria-hidden={viewModel.sidebarPage !== "createEvent"}
                  >
                    <CreatePanel
                      title="Create Event"
                      onBack={viewModel.backToCreateEvent}
                      items={viewModel.createMenuItems}
                      isItemActive={viewModel.isCreateMenuButtonActive}
                      onSelect={viewModel.handleCreateModalSelect}
                      otherItems={viewModel.otherCreateMenuItems}
                      isOtherEventsActive={viewModel.isOtherEventsActive}
                      onOpenOther={viewModel.openCreateEventOther}
                    />
                  </div>

                  <div
                    className={`${SIDEBAR_PANEL_CLASS} z-[12]`}
                    style={panelStyle(
                      createEventOtherPanelTransform,
                      viewModel.sidebarPage === "createEventOther"
                    )}
                    aria-hidden={viewModel.sidebarPage !== "createEventOther"}
                  >
                    <CreatePanel
                      title="Other Events"
                      onBack={viewModel.backToCreateEventOther}
                      items={viewModel.otherCreateMenuItems}
                      isItemActive={viewModel.isCreateMenuButtonActive}
                      onSelect={viewModel.handleCreateModalSelect}
                      otherItems={[]}
                      isOtherEventsActive={false}
                      onOpenOther={() => {}}
                    />
                  </div>

                  <div
                    className={`${SIDEBAR_PANEL_CLASS} z-[15]`}
                    style={panelStyle(
                      myEventsPanelTransform,
                      viewModel.sidebarPage === "myEvents"
                    )}
                    aria-hidden={viewModel.sidebarPage !== "myEvents"}
                  >
                    <EventListPanel
                      title="My Events"
                      grouped={viewModel.myEventsGrouped}
                      emptyStateCopy="No events yet."
                      emptyPastCopy="No past events."
                      isHistoryRowActive={viewModel.isHistoryRowActive}
                      onRowClick={viewModel.openOwnerEventContext}
                      pastExpanded={viewModel.showPastMyEvents}
                      setPastExpanded={viewModel.setShowPastMyEvents}
                      showPendingBadge={false}
                      pastRowOpacityClass="opacity-75 saturate-75"
                      onBack={viewModel.backToRoot}
                    />
                  </div>

                  <div
                    className={`${SIDEBAR_PANEL_CLASS} z-[20]`}
                    style={panelStyle(
                      invitedEventsPanelTransform,
                      viewModel.sidebarPage === "invitedEvents"
                    )}
                    aria-hidden={viewModel.sidebarPage !== "invitedEvents"}
                  >
                    <EventListPanel
                      title="Invited Events"
                      grouped={viewModel.invitedEventsGrouped}
                      emptyStateCopy="No invited events yet."
                      emptyPastCopy="No past invited events."
                      isHistoryRowActive={viewModel.isHistoryRowActive}
                      onRowClick={viewModel.openGuestEventContext}
                      pastExpanded={viewModel.showPastInvitedEvents}
                      setPastExpanded={viewModel.setShowPastInvitedEvents}
                      showPendingBadge
                      pastRowOpacityClass="opacity-70 saturate-75"
                      onBack={viewModel.backToRoot}
                    />
                  </div>

                  <div
                    className={`${SIDEBAR_EVENT_PANEL_CLASS} z-[30]`}
                    style={panelStyle(
                      eventPanelTransform,
                      viewModel.sidebarPage === "eventContext"
                    )}
                    aria-hidden={viewModel.sidebarPage !== "eventContext"}
                  >
                    <EventSidebar
                      ref={viewModel.eventSidebarRef}
                      activeEventTab={viewModel.activeEventTab}
                      onBack={viewModel.handleSidebarBackToEvents}
                      onTabChange={viewModel.handleEventTabChange}
                      mode={viewModel.eventSidebarMode}
                      backLabel={
                        viewModel.eventContextSourcePage === "invitedEvents"
                          ? "Invited Events"
                          : "My Events"
                      }
                    />
                  </div>
                </div>
              </div>

              <FooterProfileMenu
                isOpen={viewModel.isOpen}
                menuOpen={viewModel.menuOpen}
                setMenuOpen={viewModel.setMenuOpen}
                buttonRef={viewModel.buttonRef}
                menuRef={viewModel.menuRef}
                profileInitials={viewModel.profileInitials}
                userTitleLabel={viewModel.userTitleLabel}
                userEmail={viewModel.userEmail}
                footerMenuItems={viewModel.footerMenuItems}
                isCompact={viewModel.isCompact}
              />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
