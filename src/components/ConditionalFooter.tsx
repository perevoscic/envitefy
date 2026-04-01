"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
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
  return (
    segments.length === 2 &&
    segments[0] === "event" &&
    !RESERVED_EVENT_PATHS.has(segments[1])
  );
};

type ConditionalFooterProps = {
  serverSession?: any;
};

export default function ConditionalFooter({
  serverSession,
}: ConditionalFooterProps = {}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const isEventShare = pathname && isEventSharePath(pathname);
  const hasNoSession =
    serverSession === null || (!serverSession && status === "unauthenticated");

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

  if (isEventShare && hasNoSession) {
    return null;
  }

  const isMarketingRoot = pathname === "/" && hasNoSession;
  const isMarketingRoute =
    isMarketingRoot ||
    pathname === "/snap" ||
    pathname === "/gymnastics";

  if (isMarketingRoute) {
    return (
      <footer className="border-t border-[#ece3ff] bg-[linear-gradient(180deg,#ffffff_0%,#faf7ff_100%)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_repeat(3,minmax(0,0.7fr))] lg:px-8">
          <div className="pr-4">
            <Link href="/" className="inline-flex items-center">
              <EnvitefyWordmark className="text-[1.9rem] leading-none" />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-7 text-[#615a7c]">
              Turn schedules, PDFs, invites, and flyers into cleaner shareable
              event pages.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#31264f]">
              Product
            </h4>
            <div className="mt-4 space-y-3 text-sm text-[#5b5574]">
              <Link href="/gymnastics" className="block hover:text-[#2a2048]">
                Gymnastics
              </Link>
              <Link href="/snap" className="block hover:text-[#2a2048]">
                Snap
              </Link>
              <Link href="/how-it-works" className="block hover:text-[#2a2048]">
                How it works
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#31264f]">
              Company
            </h4>
            <div className="mt-4 space-y-3 text-sm text-[#5b5574]">
              <Link href="/about" className="block hover:text-[#2a2048]">
                About
              </Link>
              <Link href="/privacy" className="block hover:text-[#2a2048]">
                Privacy
              </Link>
              <Link href="/terms" className="block hover:text-[#2a2048]">
                Terms
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#31264f]">
              Support
            </h4>
            <div className="mt-4 space-y-3 text-sm text-[#5b5574]">
              <Link href="/faq" className="block hover:text-[#2a2048]">
                FAQ
              </Link>
              <Link href="/contact" className="block hover:text-[#2a2048]">
                Contact
              </Link>
              <Link href="/who-its-for" className="block hover:text-[#2a2048]">
                Who it&apos;s for
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-[#efe8ff]">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-[#6b6581] sm:px-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <p>© {new Date().getFullYear()} Envitefy</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <Link href="/gymnastics" className="hover:text-[#2a2048]">
                Start with Gymnastics
              </Link>
              <Link href="/snap" className="hover:text-[#2a2048]">
                Explore Snap
              </Link>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="w-full bg-gradient-to-b from-[#F8F5FF] via-white to-white">
      <div className="mx-auto max-w-7xl px-3 py-6 text-[10px] text-foreground/80 sm:text-xs md:text-sm">
        <div className="w-full">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:whitespace-nowrap">
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
