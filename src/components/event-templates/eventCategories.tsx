"use client";

import type { ReactNode, SVGProps } from "react";

const ICON_BASE: SVGProps<SVGSVGElement> = {
  width: 32,
  height: 32,
  viewBox: "0 0 32 32",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  xmlns: "http://www.w3.org/2000/svg",
};

const createIcon = (children: ReactNode) => (
  <svg {...ICON_BASE}>{children}</svg>
);

const cakeIcon = createIcon(
  <>
    <rect x="7" y="17" width="18" height="7" rx="3" />
    <path d="M7 17c0-2 1-3 3-3h12c2 0 3 1 3 3" />
    <line x1="11" y1="14" x2="11" y2="11" />
    <line x1="15" y1="14" x2="15" y2="11" />
    <line x1="19" y1="14" x2="19" y2="11" />
  </>
);

const ringIcon = createIcon(
  <>
    <circle cx="11.5" cy="18" r="4" />
    <circle cx="20.5" cy="18" r="4" />
    <path d="M13 10l3-4 3 4" />
  </>
);

const babyIcon = createIcon(
  <>
    <circle cx="16" cy="11" r="3.2" />
    <path d="M12.5 17h7" />
    <path d="M15 17v-2" />
    <path d="M10 19h12a2 2 0 0 1 2 2v1.5a1 1 0 0 1-1 1h-12a1 1 0 0 1-1-1V21a2 2 0 0 1 2-2z" />
  </>
);

const sexRevealIcon = createIcon(
  <>
    <circle cx="16" cy="16" r="5.5" />
    <path d="M16 12.5c1.4 0 2.5 1.1 2.5 2.5 0 1.3-1 1.8-1.6 2.2-.8.5-1.3.8-1.3 1.5" />
    <circle cx="16" cy="20.5" r="0.8" fill="currentColor" stroke="none" />
  </>
);

const appointmentIcon = createIcon(
  <>
    <rect x="7" y="8" width="18" height="18" rx="3" />
    <line x1="7" y1="12" x2="25" y2="12" />
    <line x1="11" y1="5" x2="11" y2="9" />
    <line x1="21" y1="5" x2="21" y2="9" />
    <circle cx="17" cy="18" r="3" />
    <path d="M17 16.5v2h1" />
  </>
);

const sportIcon = createIcon(
  <>
    <path d="M10 6h12v4c0 2-1.2 3.5-3 3.5h-6c-1.8 0-3-1.5-3-3.5z" />
    <path d="M11 10h10" />
    <path d="M9 13h14a1 1 0 0 1 1 1v2c0 3-2 5-5 5h-6c-3 0-5-2-5-5v-2a1 1 0 0 1 1-1z" />
    <path d="M12 20h8v3h-8z" />
    <path d="M10 23h12" />
  </>
);

const generalIcon = createIcon(
  <>
    <rect x="6" y="8" width="6" height="6" rx="1" />
    <rect x="13" y="8" width="6" height="6" rx="1" />
    <rect x="20" y="8" width="6" height="6" rx="1" />
    <rect x="6" y="15" width="6" height="6" rx="1" />
    <rect x="13" y="15" width="6" height="6" rx="1" />
    <rect x="20" y="15" width="6" height="6" rx="1" />
  </>
);

const specialIcon = createIcon(
  <>
    <path d="M16 6l2 5 5 1-3.5 3 1 5-4.5-2-4.5 2 1-5-3.5-3 5-.8z" />
    <path d="M7.5 16l1 1.5 2 0.5-2 0.5-1 1.5-1-1.5-2-0.5 2-0.5z" />
    <path d="M24.5 16l1 1 1.5 0.5-1.5 0.5-1 1-1-1-1.5-0.5 1.5-0.5z" />
  </>
);

export type EventCategoryConfig = {
  key: string;
  label: string;
  hint?: string;
  icon: ReactNode;
};

export const EVENT_CATEGORIES: EventCategoryConfig[] = [
  {
    key: "birthdays",
    label: "Birthdays",
    hint: "Registry supported",
    icon: cakeIcon,
  },
  {
    key: "weddings",
    label: "Weddings",
    hint: "Registry supported",
    icon: ringIcon,
  },
  {
    key: "baby_showers",
    label: "Baby Showers",
    hint: "Registry supported",
    icon: babyIcon,
  },
  {
    key: "sex_reveal",
    label: "Sex Reveal",
    hint: "Registry supported",
    icon: sexRevealIcon,
  },
  {
    key: "appointments",
    label: "Appointments",
    icon: appointmentIcon,
  },
  {
    key: "sport_events",
    label: "Sport Events",
    icon: sportIcon,
  },
  {
    key: "general",
    label: "General Events",
    icon: generalIcon,
  },
  {
    key: "special_events",
    label: "Special Events",
    icon: specialIcon,
  },
];
