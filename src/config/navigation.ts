import {
  Eye,
  LayoutTemplate,
  Menu,
  PlusCircle,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type SignedOutBottomNavAction = "concierge" | "create" | "menu";

export type SignedOutBottomNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  purpose: string;
  action?: SignedOutBottomNavAction;
  featured?: boolean;
};

export type SignedOutMobileMenuLink = {
  label: string;
  href: string;
};

export const signedOutBottomNav: SignedOutBottomNavItem[] = [
  {
    label: "Templates",
    href: "#examples",
    icon: LayoutTemplate,
    purpose: "Browse event categories and templates.",
  },
  {
    label: "Examples",
    href: "#showcase",
    icon: Eye,
    purpose:
      "Show finished live cards, RSVP pages, registry examples, sports examples, weddings, birthdays, and baby showers.",
  },
  {
    label: "Concierge",
    href: "#concierge",
    icon: Sparkles,
    purpose: "Open Envitefy Concierge for signed-out users.",
    action: "concierge",
    featured: true,
  },
  {
    label: "Create",
    href: "#creation-paths",
    icon: PlusCircle,
    purpose: "Open signed-out creation choices.",
    action: "create",
  },
  {
    label: "Menu",
    href: "#menu",
    icon: Menu,
    purpose: "Open the signed-out mobile menu.",
    action: "menu",
  },
];

export const signedOutMobileMenuLinks: SignedOutMobileMenuLink[] = [
  // TODO: Switch to /pricing when public pricing has a dedicated route.
  { label: "Pricing", href: "/contact" },
  { label: "About", href: "/about" },
  // TODO: Switch to /help if a help center route is added.
  { label: "Help", href: "/faq" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];
