"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import EnvitefyWordmark from "@/components/branding/EnvitefyWordmark";

const RESERVED_EVENT_PATHS = new Set([
  "new",
  "appointments",
  "baby-showers",
  "birthdays",
  "sport-events",
  "weddings",
]);

const isEventSharePath = (pathname: string) => {
  const normalized = pathname.replace(/\/+$/, "");
  if (!normalized.startsWith("/event/")) return false;
  const segments = normalized.split("/").filter(Boolean);
  return segments.length === 2 && segments[0] === "event" && !RESERVED_EVENT_PATHS.has(segments[1]);
};

const isStudioCardSharePath = (pathname: string) => {
  const normalized = pathname.replace(/\/+$/, "");
  const segments = normalized.split("/").filter(Boolean);
  return segments.length === 2 && segments[0] === "card";
};

const isLandingShowcasePath = (pathname: string) => {
  const normalized = pathname.replace(/\/+$/, "");
  const segments = normalized.split("/").filter(Boolean);
  return segments.length === 2 && segments[0] === "showcase";
};

type ConditionalFooterProps = {
  serverSession?: any;
};

type FooterLink = {
  label: string;
  href: string;
};

type FooterGroup = {
  title: string;
  links: FooterLink[];
};

const MARKETING_ROUTE_PATHS = new Set([
  "/about",
  "/contact",
  "/faq",
  "/guides",
  "/gymnastics",
  "/how-it-works",
  "/landing",
  "/privacy",
  "/showcase",
  "/snap",
  "/terms",
  "/who-its-for",
]);

const MARKETING_FOOTER_GROUPS: FooterGroup[] = [
  {
    title: "Create",
    links: [
      { label: "Concierge", href: "/landing#concierge" },
      { label: "Templates", href: "/landing#examples" },
      { label: "Live cards", href: "/showcase" },
      { label: "Snap uploads", href: "/snap" },
      { label: "Start your event", href: "/landing#creation-paths" },
    ],
  },
  {
    title: "Event Pages",
    links: [
      { label: "Public event pages", href: "/landing#guest-flow" },
      { label: "RSVP event pages", href: "/guides/rsvp-event-page" },
      { label: "Live card invitations", href: "/guides/live-card-invitations" },
      { label: "Guest action flow", href: "/landing#guest-flow" },
      { label: "Share without an app", href: "/guides/share-event-page-without-app" },
    ],
  },
  {
    title: "Use Cases",
    links: [
      { label: "Birthdays", href: "/landing#examples" },
      { label: "Weddings", href: "/landing#examples" },
      { label: "Baby showers", href: "/landing#examples" },
      { label: "School events", href: "/landing#examples" },
      { label: "Sports teams", href: "/landing#examples" },
      { label: "Gymnastics meets", href: "/gymnastics" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Guides hub", href: "/guides" },
      { label: "PDF to event page", href: "/guides/pdf-to-event-page" },
      { label: "Flyer to event page", href: "/guides/flyer-to-event-page" },
      { label: "RSVP event page", href: "/guides/rsvp-event-page" },
      { label: "Live card invitations", href: "/guides/live-card-invitations" },
      { label: "Gymnastics meet page", href: "/guides/gymnastics-meet-page" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "FAQ", href: "/faq" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

const MARKETING_FOOTER_UTILITY_LINKS: FooterLink[] = [
  { label: "Invites", href: "/guides/live-card-invitations" },
  { label: "RSVP", href: "/guides/rsvp-event-page" },
  { label: "Event Pages", href: "/landing#guest-flow" },
  { label: "Sign-ups", href: "/landing#guest-flow" },
  { label: "Upload", href: "/snap" },
  { label: "Guides", href: "/guides" },
];

export default function ConditionalFooter({ serverSession }: ConditionalFooterProps = {}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const normalizedPathname = pathname && pathname !== "/" ? pathname.replace(/\/+$/, "") : pathname;

  const isEventShare = pathname && isEventSharePath(pathname);
  const isStudioCardShare = pathname && isStudioCardSharePath(pathname);
  const isLandingShowcase = pathname && isLandingShowcasePath(pathname);
  const hasNoSession = serverSession === null || (!serverSession && status === "unauthenticated");

  let isInIframe = false;
  if (typeof window !== "undefined") {
    try {
      isInIframe = window.self !== window.top;
    } catch {
      isInIframe = true;
    }
  }
  const isEmbedMode = searchParams?.get("embed") === "1";

  if (isInIframe || isEmbedMode) {
    return null;
  }

  if ((isEventShare && hasNoSession) || isStudioCardShare || isLandingShowcase) {
    return null;
  }

  const isStudioPath = pathname === "/studio" || (pathname?.startsWith("/studio/") ?? false);
  if (isStudioPath) {
    return null;
  }

  const isMarketingRoot = normalizedPathname === "/" && hasNoSession;
  const isMarketingRoute =
    isMarketingRoot ||
    (normalizedPathname ? MARKETING_ROUTE_PATHS.has(normalizedPathname) : false) ||
    (normalizedPathname?.startsWith("/guides/") ?? false);

  if (isMarketingRoute) {
    return (
      <footer className="relative z-[2] w-full bg-[#fcfbf7]">
        <div className="isolate w-full overflow-hidden border-y border-[#d7c5a5] bg-[#fcfbf7]/96 shadow-[0_30px_80px_rgba(33,26,35,0.10)] backdrop-blur-[12px] [backface-visibility:hidden] [transform:translateZ(0)] [will-change:transform]">
          <div className="relative grid gap-10 px-6 py-12 sm:px-8 lg:grid-cols-[minmax(0,1.05fr)_repeat(5,minmax(0,0.62fr))] lg:px-10">
            <div className="max-lg:col-span-full pr-4">
              <Link href="/" className="inline-flex items-center overflow-visible">
                <EnvitefyWordmark
                  className="text-[4rem] leading-none sm:text-[3.5rem]"
                  scaled={false}
                  tone="gradient"
                />
              </Link>
              <p className="mt-4 max-w-sm text-sm leading-7 text-[#665d68]">
                Create polished hosted event pages with live invitations, RSVP, registries, calendar
                saves, maps, sign-ups, and guest updates from one shareable link.
              </p>
            </div>

            <div className="col-span-full grid grid-cols-2 gap-x-6 gap-y-8 lg:contents">
              {MARKETING_FOOTER_GROUPS.map((group) => (
                <div
                  key={group.title}
                  className={group.title === "Company" ? "col-span-2 lg:col-span-1" : ""}
                >
                  <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#241c2b]">
                    {group.title}
                  </h4>
                  <div className="mt-4 space-y-3 text-sm text-[#62586a]">
                    {group.links.map((link) => (
                      <Link
                        key={`${group.title}-${link.href}-${link.label}`}
                        href={link.href}
                        className="block hover:text-[#2b1b16]"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative border-t border-[#d7c5a5]">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 py-6 text-sm text-[#665d68] sm:px-8 lg:px-10">
              <p>© {new Date().getFullYear()} Envitefy</p>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                {MARKETING_FOOTER_UTILITY_LINKS.map((link) => (
                  <Link
                    key={`utility-${link.href}-${link.label}`}
                    href={link.href}
                    className="hover:text-[#2b1b16]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="w-full bg-transparent">
      <div className="mx-auto max-w-7xl px-3 py-6 text-[10px] text-foreground/80 sm:text-xs md:text-sm">
        <div className="w-full">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:whitespace-nowrap">
            <Link href="/" className="hover:text-foreground">
              Envitefy
            </Link>
            <span className="hidden opacity-40 sm:inline">•</span>
            <Link href="/how-it-works" className="hover:text-foreground">
              How it works
            </Link>
            <span className="hidden opacity-40 sm:inline">•</span>
            <Link href="/who-its-for" className="hover:text-foreground">
              Who it&apos;s for
            </Link>
            <span className="hidden opacity-40 sm:inline">•</span>
            <Link href="/faq" className="hover:text-foreground">
              FAQ
            </Link>
            <span className="hidden opacity-40 sm:inline">•</span>
            <Link href="/guides" className="hover:text-foreground">
              Guides
            </Link>
            <span className="hidden opacity-40 sm:inline">•</span>
            <Link href="https://envitefy.com/terms" className="hover:text-foreground">
              Terms of Use
            </Link>
            <span className="hidden opacity-40 sm:inline">•</span>
            <Link href="https://envitefy.com/privacy" className="hover:text-foreground">
              Privacy Policy
            </Link>
            <span className="hidden opacity-40 sm:inline">•</span>
            <span>© {new Date().getFullYear()} Envitefy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
