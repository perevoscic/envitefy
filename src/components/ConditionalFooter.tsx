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
    pathname === "/landing" ||
    pathname === "/snap" ||
    pathname === "/gymnastics";

  if (isMarketingRoute) {
    return (
      <footer className="relative z-10 px-4 pb-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl isolate overflow-hidden rounded-[2rem] border-x border-b border-white/12 bg-white/[0.1] shadow-[0_30px_80px_rgba(4,1,14,0.32)] backdrop-blur-[16px] [backface-visibility:hidden] [transform:translateZ(0)] [will-change:transform]">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03)_42%,rgba(89,28,135,0.08)_100%)]" />
          <div className="relative grid gap-10 px-6 py-12 sm:px-8 lg:grid-cols-[minmax(0,1.1fr)_repeat(3,minmax(0,0.7fr))] lg:px-10">
          <div className="pr-4">
            <Link
              href="/"
              className="inline-flex items-center overflow-visible"
            >
              <EnvitefyWordmark
                className="text-[4rem] leading-none sm:text-[3.5rem]"
                scaled={false}
                tone="light"
              />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-7 text-white/68">
              Turn schedules, PDFs, invites, and flyers into cleaner shareable
              event pages.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/82">
              Product
            </h4>
            <div className="mt-4 space-y-3 text-sm text-white/64">
              <Link href="/gymnastics" className="block hover:text-white">
                Gymnastics
              </Link>
              <Link href="/snap" className="block hover:text-white">
                Snap
              </Link>
              <Link href="/how-it-works" className="block hover:text-white">
                How it works
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/82">
              Company
            </h4>
            <div className="mt-4 space-y-3 text-sm text-white/64">
              <Link href="/about" className="block hover:text-white">
                About
              </Link>
              <Link href="/privacy" className="block hover:text-white">
                Privacy
              </Link>
              <Link href="/terms" className="block hover:text-white">
                Terms
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/82">
              Support
            </h4>
            <div className="mt-4 space-y-3 text-sm text-white/64">
              <Link href="/faq" className="block hover:text-white">
                FAQ
              </Link>
              <Link href="/contact" className="block hover:text-white">
                Contact
              </Link>
              <Link href="/who-its-for" className="block hover:text-white">
                Who it&apos;s for
              </Link>
            </div>
          </div>
          </div>
          <div className="relative border-t border-white/10">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 py-6 text-sm text-white/58 sm:px-8 lg:px-10">
              <p>© {new Date().getFullYear()} Envitefy</p>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                <Link href="/gymnastics" className="hover:text-white">
                Start with Gymnastics
              </Link>
                <Link href="/snap" className="hover:text-white">
                Explore Snap
              </Link>
              </div>
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
            <Link
              href="https://envitefy.com/terms"
              className="hover:text-foreground"
            >
              Terms of Use
            </Link>
            <span className="hidden opacity-40 sm:inline">•</span>
            <Link
              href="https://envitefy.com/privacy"
              className="hover:text-foreground"
            >
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
