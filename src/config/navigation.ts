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

export const publicUseCaseNavLinks: SignedOutMobileMenuLink[] = [
  { label: "Birthdays", href: "/birthdays" },
  { label: "Anniversaries", href: "/anniversaries" },
  { label: "Weddings", href: "/weddings" },
  { label: "Baby Showers", href: "/baby-showers" },
  { label: "Bridal Showers", href: "/bridal-showers" },
  { label: "Gender Reveals", href: "/gender-reveal" },
  { label: "Signup Forms", href: "/signup-forms" },
  { label: "Sports", href: "/sport-events" },
  { label: "Gymnastics", href: "/gymnastics" },
  { label: "Football", href: "/football" },
];

export const publicUseCasePrimaryNavLinks: SignedOutMobileMenuLink[] = [
  ...publicUseCaseNavLinks,
];

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
    label: "Create",
    href: "#concierge",
    icon: Sparkles,
    purpose: "Open Envitefy Create for signed-out users.",
    action: "concierge",
    featured: true,
  },
  {
    label: "More ways",
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
  { label: "Envitefy Create", href: "/envitefy-create" },
  { label: "Invitation Maker", href: "/invitation-maker" },
  ...publicUseCaseNavLinks,
  { label: "Guides", href: "/guides" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

const marketingSectionLinks: Record<string, SignedOutMobileMenuLink[]> = {
  "/signup-forms": [
    { label: "Templates", href: "#templates" },
    { label: "How it works", href: "#how-it-works" },
    { label: "FAQ", href: "#faq" },
  ],
  "/birthdays": [
    { label: "Templates", href: "#templates" },
    { label: "Live preview", href: "#birthday-live-page" },
    { label: "How it works", href: "#birthday-start" },
  ],
  "/anniversaries": [{ label: "Templates", href: "#templates" }],
  "/weddings": [
    { label: "Templates", href: "#templates" },
    { label: "Collections", href: "#collections" },
    { label: "Planning", href: "#timeline" },
    { label: "Reviews", href: "#reviews" },
  ],
  "/baby-showers": [
    { label: "Templates", href: "#templates" },
    { label: "Registries", href: "#registries" },
    { label: "How it works", href: "#how-it-works" },
  ],
  "/bridal-showers": [
    { label: "Templates", href: "#templates" },
    { label: "Design studio", href: "#bridal-studio" },
    { label: "Collections", href: "#bridal-collections" },
  ],
  "/gender-reveal": [
    { label: "Templates", href: "#templates" },
    { label: "How it works", href: "#reveal-start" },
  ],
  "/sport-events": [{ label: "Templates", href: "#templates" }],
  "/football": [
    { label: "Templates", href: "#templates" },
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
  ],
  "/gymnastics": [
    { label: "Templates", href: "/gymnastics/templates" },
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Preview", href: "#preview" },
    { label: "FAQ", href: "#faq" },
  ],
  "/snap": [
    { label: "How it works", href: "#how-it-works" },
    { label: "Use cases", href: "#use-cases" },
    { label: "FAQ", href: "#faq" },
  ],
};

/** Keep the full product directory on the main landing; other pages stay local. */
export function marketingPageNavLinks(pathname: string): SignedOutMobileMenuLink[] {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/" || path === "/landing") return [...signedOutMobileMenuLinks];

  const categoryPath = `/${path.split("/")[1]}`;
  const sectionLinks = marketingSectionLinks[categoryPath] ?? [];
  return [
    { label: "Home", href: "/" },
    ...sectionLinks.map((link) => ({
      ...link,
      href: path !== categoryPath && link.href.startsWith("#")
        ? `${categoryPath}${link.href}`
        : link.href,
    })),
  ];
}
