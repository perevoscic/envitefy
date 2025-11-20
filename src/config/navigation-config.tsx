import React from "react";

export type NavItem = {
  label: string;
  href: string;
  icon?: React.ReactNode;
  match?: (path: string) => boolean;
  isAction?: boolean; // If true, may trigger a modal/dropdown instead of navigation
};

export const TEMPLATE_LINKS = [
  { label: "Birthdays", href: "/event/birthdays", icon: "🎂" },
  { label: "Weddings", href: "/event/weddings", icon: "💍" },
  { label: "Baby Showers", href: "/event/baby-showers", icon: "🍼" },
  { label: "Gender Reveal", href: "/event/gender-reveal", icon: "🎈" },
  { label: "Sport Events", href: "/event/sport-events", icon: "🏅" },
  { label: "General Events", href: "/event/general", icon: "📅" },
] as const;

export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    label: "Home",
    href: "/",
    match: (path) => path === "/",
    icon: (
      <svg
        viewBox="0 0 1920 1920"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M960.16 0 28 932.16l79 78.777 853.16-853.16 853.16 853.16 78.889-78.777L960.16 0Zm613.693 1027.34v781.078h-334.86v-557.913h-557.8v557.912H346.445V1027.34H234.751V1920h1450.684v-892.66h-111.582Zm-446.33 334.748v446.441H792.775v-446.441h334.748ZM960.127 692.604c61.593 0 111.582 49.989 111.582 111.582 0 61.594-49.989 111.583-111.582 111.583-61.594 0-111.583-49.99-111.583-111.583 0-61.593 49.99-111.582 111.583-111.582Zm223.165 111.582c0-123.075-100.09-223.165-223.165-223.165-123.076 0-223.165 100.09-223.165 223.165 0 123.076 100.09 223.165 223.165 223.165 123.075 0 223.165-100.09 223.165-223.165"
        ></path>
      </svg>
    ),
  },
  {
    label: "Create Event",
    href: "/event/new", // Fallback
    isAction: true,
    match: (path) =>
      path.startsWith("/event") && !path.startsWith("/event/new"),
    icon: (
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
    ),
  },
  {
    label: "Smart sign-up",
    href: "/smart-signup-form",
    match: (path) => path.startsWith("/smart-signup-form"),
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M17 16v3" />
        <path d="M15.5 17.5h3" />
      </svg>
    ),
  },
  {
    label: "Calendar",
    href: "/calendar",
    match: (path) => path.startsWith("/calendar"),
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
];

export const PROFILE_MENU_ITEMS: NavItem[] = [
  {
    label: "Profile",
    href: "/settings",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <circle cx="12" cy="7" r="4" />
        <path d="M5.5 21v-2a6.5 6.5 0 0 1 13 0v2" />
      </svg>
    ),
  },
  {
    label: "Calendar",
    href: "/calendar",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    label: "About us",
    href: "/about",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
  {
    label: "Contact us",
    href: "/contact",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
];

