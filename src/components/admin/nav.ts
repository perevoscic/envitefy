export type AdminNavItemId =
  | "dashboard"
  | "users"
  | "events"
  | "concierge"
  | "scans"
  | "emails"
  | "marketing-assets"
  | "analytics"
  | "settings"
  | "health";

export type AdminNavItem = {
  id: AdminNavItemId;
  label: string;
  href: string;
  description: string;
};

export const adminNavItems: AdminNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/admin",
    description: "Executive platform overview",
  },
  {
    id: "users",
    label: "Users",
    href: "/admin/users",
    description: "Accounts, usage, and debug links",
  },
  {
    id: "events",
    label: "Events",
    href: "/admin/events",
    description: "Created events and RSVP health",
  },
  {
    id: "concierge",
    label: "AI Concierge",
    href: "/admin/concierge",
    description: "Draft sessions and conversation activity",
  },
  {
    id: "scans",
    label: "Scans & Traffic",
    href: "/admin/scans",
    description: "Upload, share, and RSVP flow",
  },
  {
    id: "emails",
    label: "Emails",
    href: "/admin/emails",
    description: "Campaigns and templates",
  },
  {
    id: "marketing-assets",
    label: "Marketing Assets",
    href: "/admin/marketing-images",
    description: "Storyboard runs and generated media",
  },
  {
    id: "analytics",
    label: "Analytics",
    href: "/admin/analytics",
    description: "GA4 status and tracking plan",
  },
  {
    id: "settings",
    label: "Settings",
    href: "/admin/settings",
    description: "Admin configuration",
  },
  {
    id: "health",
    label: "Logs / Health",
    href: "/admin/health",
    description: "Runtime and data-source checks",
  },
];
