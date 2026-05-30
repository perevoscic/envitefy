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

export default function ConditionalFooter({ serverSession }: ConditionalFooterProps = {}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status } = useSession();

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

  const isMarketingRoot = pathname === "/" && hasNoSession;
  const isMarketingRoute =
    isMarketingRoot ||
    pathname === "/landing" ||
    pathname === "/snap" ||
    pathname === "/gymnastics" ||
    pathname === "/guides" ||
    (pathname?.startsWith("/guides/") ?? false);

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
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#241c2b]">
                  Create
                </h4>
                <div className="mt-4 space-y-3 text-sm text-[#62586a]">
                  <Link href="/landing#concierge" className="block hover:text-[#2b1b16]">
                    Concierge
                  </Link>
                  <Link href="/landing#creation-paths" className="block hover:text-[#2b1b16]">
                    Templates
                  </Link>
                  <Link href="/landing#showcase" className="block hover:text-[#2b1b16]">
                    Live cards
                  </Link>
                  <Link href="/landing#event-pages" className="block hover:text-[#2b1b16]">
                    Smart sign-ups
                  </Link>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#241c2b]">
                  Event Pages
                </h4>
                <div className="mt-4 space-y-3 text-sm text-[#62586a]">
                  <Link href="/landing#event-pages" className="block hover:text-[#2b1b16]">
                    Public event pages
                  </Link>
                  <Link href="/landing#event-pages" className="block hover:text-[#2b1b16]">
                    RSVP pages
                  </Link>
                  <Link href="/landing#rsvp-tracking" className="block hover:text-[#2b1b16]">
                    RSVP state
                  </Link>
                  <Link href="/landing#event-pages" className="block hover:text-[#2b1b16]">
                    Registry links
                  </Link>
                  <Link href="/landing#event-pages" className="block hover:text-[#2b1b16]">
                    Calendar and maps
                  </Link>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#241c2b]">
                  Use Cases
                </h4>
                <div className="mt-4 space-y-3 text-sm text-[#62586a]">
                  <Link href="/landing#examples" className="block hover:text-[#2b1b16]">
                    Birthdays
                  </Link>
                  <Link href="/landing#examples" className="block hover:text-[#2b1b16]">
                    Weddings
                  </Link>
                  <Link href="/landing#examples" className="block hover:text-[#2b1b16]">
                    Baby showers
                  </Link>
                  <Link href="/landing#examples" className="block hover:text-[#2b1b16]">
                    School events
                  </Link>
                  <Link href="/landing#examples" className="block hover:text-[#2b1b16]">
                    Sports teams
                  </Link>
                  <Link href="/landing#examples" className="block hover:text-[#2b1b16]">
                    Community events
                  </Link>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#241c2b]">
                  Resources
                </h4>
                <div className="mt-4 space-y-3 text-sm text-[#62586a]">
                  <Link href="/guides" className="block hover:text-[#2b1b16]">
                    Guides hub
                  </Link>
                  <Link href="/guides/pdf-to-event-page" className="block hover:text-[#2b1b16]">
                    PDF to event page
                  </Link>
                  <Link href="/guides/flyer-to-event-page" className="block hover:text-[#2b1b16]">
                    Flyer to event page
                  </Link>
                  <Link href="/guides/rsvp-event-page" className="block hover:text-[#2b1b16]">
                    RSVP event page
                  </Link>
                  <Link href="/guides/live-card-invitations" className="block hover:text-[#2b1b16]">
                    Live card invitations
                  </Link>
                </div>
              </div>

              <div className="col-span-2 lg:col-span-1">
                <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#241c2b]">
                  Company
                </h4>
                <div className="mt-4 space-y-3 text-sm text-[#62586a]">
                  <Link href="/about" className="block hover:text-[#2b1b16]">
                    About
                  </Link>
                  <Link href="/contact" className="block hover:text-[#2b1b16]">
                    Contact
                  </Link>
                  <Link href="/faq" className="block hover:text-[#2b1b16]">
                    FAQ
                  </Link>
                  <Link href="/privacy" className="block hover:text-[#2b1b16]">
                    Privacy
                  </Link>
                  <Link href="/terms" className="block hover:text-[#2b1b16]">
                    Terms
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="relative border-t border-[#d7c5a5]">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 py-6 text-sm text-[#665d68] sm:px-8 lg:px-10">
              <p>© {new Date().getFullYear()} Envitefy</p>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                <Link href="/landing#showcase" className="hover:text-[#2b1b16]">
                  Invites
                </Link>
                <Link href="/landing#event-pages" className="hover:text-[#2b1b16]">
                  RSVP
                </Link>
                <Link href="/landing#rsvp-tracking" className="hover:text-[#2b1b16]">
                  RSVP State
                </Link>
                <Link href="/landing#event-pages" className="hover:text-[#2b1b16]">
                  Event Pages
                </Link>
                <Link href="/landing#event-pages" className="hover:text-[#2b1b16]">
                  Sign-ups
                </Link>
                <Link href="/landing#upload" className="hover:text-[#2b1b16]">
                  Upload
                </Link>
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
