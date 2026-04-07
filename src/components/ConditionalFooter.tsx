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

type ConditionalFooterProps = {
  serverSession?: any;
};

export default function ConditionalFooter({ serverSession }: ConditionalFooterProps = {}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const isEventShare = pathname && isEventSharePath(pathname);
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

  if (isEventShare && hasNoSession) {
    return null;
  }

  const isMarketingRoot = pathname === "/" && hasNoSession;
  const isMarketingRoute =
    isMarketingRoot ||
    pathname === "/studio" ||
    pathname === "/landing" ||
    pathname === "/snap" ||
    pathname === "/gymnastics";

  if (isMarketingRoute) {
    return (
      <footer className="relative z-[2] bg-[#f8f5ff] px-4 pb-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl isolate overflow-hidden rounded-[2rem] border border-[#eadfd5] bg-[rgba(255,250,246,0.9)] shadow-[0_30px_80px_rgba(43,27,22,0.10)] backdrop-blur-[12px] [backface-visibility:hidden] [transform:translateZ(0)] [will-change:transform]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.82),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.72),rgba(255,255,255,0.4)_46%,rgba(201,143,107,0.08)_100%)]" />
          <div className="relative grid gap-10 px-6 py-12 sm:px-8 lg:grid-cols-[minmax(0,1.1fr)_repeat(3,minmax(0,0.7fr))] lg:px-10">
            <div className="max-lg:col-span-full pr-4">
              <Link href="/" className="inline-flex items-center overflow-visible">
                <EnvitefyWordmark
                  className="text-[4rem] leading-none sm:text-[3.5rem]"
                  scaled={false}
                  tone="gradient"
                />
              </Link>
              <p className="mt-4 max-w-sm text-sm leading-7 text-[#8b7568]">
                Turn schedules, PDFs, invites, and flyers into cleaner shareable event pages.
              </p>
            </div>

            <div className="col-span-full grid grid-cols-2 gap-x-6 gap-y-8 lg:contents">
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4d352c]">
                  Product
                </h4>
                <div className="mt-4 space-y-3 text-sm text-[#8b7568]">
                  <Link href="/studio" className="block hover:text-[#2b1b16]">
                    Studio
                  </Link>
                  <Link href="/gymnastics" className="block hover:text-[#2b1b16]">
                    Gymnastics
                  </Link>
                  <Link href="/snap" className="block hover:text-[#2b1b16]">
                    Snap
                  </Link>
                  <Link href="/how-it-works" className="block hover:text-[#2b1b16]">
                    How it works
                  </Link>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4d352c]">
                  Company
                </h4>
                <div className="mt-4 space-y-3 text-sm text-[#8b7568]">
                  <Link href="/about" className="block hover:text-[#2b1b16]">
                    About
                  </Link>
                  <Link href="/privacy" className="block hover:text-[#2b1b16]">
                    Privacy
                  </Link>
                  <Link href="/terms" className="block hover:text-[#2b1b16]">
                    Terms
                  </Link>
                </div>
              </div>

              <div className="col-span-2 lg:col-span-1">
                <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4d352c]">
                  Support
                </h4>
                <div className="mt-4 space-y-3 text-sm text-[#8b7568]">
                  <Link href="/faq" className="block hover:text-[#2b1b16]">
                    FAQ
                  </Link>
                  <Link href="/contact" className="block hover:text-[#2b1b16]">
                    Contact
                  </Link>
                  <Link href="/who-its-for" className="block hover:text-[#2b1b16]">
                    Who it&apos;s for
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="relative border-t border-[#eadfd5]">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 py-6 text-sm text-[#9a867a] sm:px-8 lg:px-10">
              <p>© {new Date().getFullYear()} Envitefy</p>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                <Link href="/studio" className="hover:text-[#2b1b16]">
                  Studio
                </Link>
                <Link href="/gymnastics" className="hover:text-[#2b1b16]">
                  Start with Gymnastics
                </Link>
                <Link href="/snap" className="hover:text-[#2b1b16]">
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
            <Link href="/studio" className="hover:text-foreground">
              Studio
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
