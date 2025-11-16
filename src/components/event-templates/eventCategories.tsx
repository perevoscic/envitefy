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

// Birthday cake icon - more detailed with layers and candles
const cakeIcon = createIcon(
  <>
    {/* Base layer */}
    <rect x="6" y="20" width="20" height="4" rx="2" />
    {/* Middle layer */}
    <rect x="8" y="16" width="16" height="4" rx="2" />
    {/* Top layer */}
    <rect x="10" y="12" width="12" height="4" rx="2" />
    {/* Candles */}
    <line x1="13" y1="12" x2="13" y2="8" />
    <line x1="16" y1="12" x2="16" y2="7" />
    <line x1="19" y1="12" x2="19" y2="8" />
    {/* Flame on middle candle */}
    <path d="M16 7c0-1 0.5-1.5 0.5-1.5s0.5 0.5 0.5 1.5" />
  </>
);

// Wedding rings icon - elegant interlocked rings
const ringIcon = createIcon(
  <>
    {/* Left ring */}
    <circle cx="12" cy="16" r="5" />
    {/* Right ring */}
    <circle cx="20" cy="16" r="5" />
    {/* Diamond on left ring */}
    <path d="M12 11l1.5 2-1.5 2-1.5-2z" />
    {/* Diamond on right ring */}
    <path d="M20 11l1.5 2-1.5 2-1.5-2z" />
    {/* Decorative lines */}
    <path d="M7 16h2M23 16h2" />
  </>
);

// Baby icon - pacifier and rattle
const babyIcon = createIcon(
  <>
    {/* Pacifier */}
    <circle cx="16" cy="10" r="3.5" />
    <path d="M16 13.5v2M14 15.5h4" />
    {/* Rattle handle */}
    <line x1="22" y1="8" x2="22" y2="14" />
    {/* Rattle top */}
    <circle cx="22" cy="6" r="2" />
    <circle cx="22" cy="6" r="1" />
    {/* Rattle bottom */}
    <rect x="20.5" y="14" width="3" height="4" rx="1" />
    <line x1="22" y1="18" x2="22" y2="20" />
  </>
);

// Sex reveal icon - confetti/party popper
const sexRevealIcon = createIcon(
  <>
    {/* Party popper base */}
    <rect x="12" y="18" width="8" height="6" rx="1" />
    {/* Streamers */}
    <path d="M14 18l-2-4M16 18l-1-3M18 18l1-3M20 18l2-4" />
    {/* Confetti pieces - using circles with stroke */}
    <circle cx="10" cy="10" r="1" />
    <circle cx="22" cy="12" r="1" />
    <path d="M8 14l1-1M24 15l1-1" />
    {/* Question mark */}
    <path d="M16 8c0-1.5 1-2.5 2-2.5s2 1 2 2.5c0 1-0.5 1.5-1 2" />
    <circle cx="16" cy="12" r="0.8" />
  </>
);

// Appointment icon - calendar with clock
const appointmentIcon = createIcon(
  <>
    {/* Calendar base */}
    <rect x="6" y="7" width="20" height="20" rx="2" />
    {/* Calendar header */}
    <rect x="6" y="7" width="20" height="6" rx="2" />
    {/* Calendar grid lines */}
    <line x1="6" y1="13" x2="26" y2="13" />
    <line x1="12" y1="7" x2="12" y2="27" />
    <line x1="18" y1="7" x2="18" y2="27" />
    <line x1="24" y1="7" x2="24" y2="27" />
    {/* Clock overlay */}
    <circle cx="16" cy="19" r="4" />
    <line x1="16" y1="19" x2="16" y2="17" strokeWidth="1.2" />
    <line x1="16" y1="19" x2="18" y2="19" strokeWidth="1.2" />
  </>
);

// Sport icon - trophy
const sportIcon = createIcon(
  <>
    {/* Trophy base */}
    <rect x="11" y="22" width="10" height="3" rx="1" />
    {/* Trophy stem */}
    <rect x="15" y="19" width="2" height="3" />
    {/* Trophy cup */}
    <path d="M9 19h14v-6c0-2-1.5-3-3-3h-8c-1.5 0-3 1-3 3z" />
    {/* Trophy handles */}
    <path d="M9 15c-1 0-2-1-2-2v-1c0-1 1-2 2-2" />
    <path d="M23 15c1 0 2-1 2-2v-1c0-1-1-2-2-2" />
    {/* Star on trophy */}
    <path d="M16 10l1 2 2 0.5-1.5 1.5 0.5 2-2-1.5-2 1.5 0.5-2-1.5-1.5z" />
  </>
);

// General events icon - calendar grid with event dots
const generalIcon = createIcon(
  <>
    {/* Calendar frame */}
    <rect x="5" y="6" width="22" height="22" rx="2" />
    {/* Header */}
    <rect x="5" y="6" width="22" height="5" />
    {/* Grid lines */}
    <line x1="5" y1="11" x2="27" y2="11" />
    <line x1="12" y1="6" x2="12" y2="28" />
    <line x1="19" y1="6" x2="19" y2="28" />
    {/* Event dots - using filled circles for better visibility */}
    <circle cx="9" cy="16" r="1.5" fill="currentColor" />
    <circle cx="16" cy="20" r="1.5" fill="currentColor" />
    <circle cx="23" cy="18" r="1.5" fill="currentColor" />
  </>
);

// Special events icon - sparkles and stars
const specialIcon = createIcon(
  <>
    {/* Central star */}
    <path d="M16 6l1.5 4.5 4.5 1.5-3.5 3 1 4.5-3.5-2.5-3.5 2.5 1-4.5-3.5-3 4.5-1.5z" />
    {/* Top sparkle */}
    <path d="M16 4l0.5 1.5 1.5 0.5-1 1 0.5 1.5-1.5-1-1.5 1 0.5-1.5-1-1 1.5-0.5z" />
    {/* Bottom sparkle */}
    <path d="M16 26l0.5 1.5 1.5 0.5-1 1 0.5 1.5-1.5-1-1.5 1 0.5-1.5-1-1 1.5-0.5z" />
    {/* Left sparkle */}
    <path d="M6 16l1.5 0.5 0.5 1.5-1 1-1.5 0.5 1-1.5 1 1.5-1.5-0.5-1-1z" />
    {/* Right sparkle */}
    <path d="M26 16l-1.5 0.5-0.5 1.5 1 1 1.5 0.5-1-1.5-1 1.5 1.5-0.5 1-1z" />
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
