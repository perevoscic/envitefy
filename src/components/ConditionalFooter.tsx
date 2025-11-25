"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

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
  const { data: clientSession, status } = useSession();

  // Use server session if available (more reliable), otherwise fall back to client session
  const session = serverSession !== undefined ? serverSession : clientSession;

  // Hide footer when not logged in and viewing a shared event page
  const isEventShare = pathname && isEventSharePath(pathname);

  // Hide if:
  // 1. We're on an event share path
  // 2. AND there's no session (server session is null/undefined, or client confirms unauthenticated)
  const hasNoSession =
    serverSession === null || (!serverSession && status === "unauthenticated");

  if (isEventShare && hasNoSession) {
    return null;
  }

  return (
    <footer className="bg-gradient-to-b from-[#F8F5FF] via-white to-white w-full">
      <div className="max-w-7xl mx-auto px-3 py-6 text-[10px] sm:text-xs md:text-sm text-foreground/80">
        <div className="w-full">
          <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-1 sm:whitespace-nowrap">
            <Link href="/how-it-works" className="hover:text-foreground">
              How it works
            </Link>
            <span className="opacity-40 hidden sm:inline">•</span>
            <Link href="/who-its-for" className="hover:text-foreground">
              Who it's for
            </Link>
            <span className="opacity-40 hidden sm:inline">•</span>
            <Link href="/faq" className="hover:text-foreground">
              FAQ
            </Link>
            <span className="opacity-40 hidden sm:inline">•</span>
            <Link
              href="https://envitefy.com/terms"
              className="hover:text-foreground"
            >
              Terms of Use
            </Link>
            <span className="opacity-40 hidden sm:inline">•</span>
            <Link
              href="https://envitefy.com/privacy"
              className="hover:text-foreground"
            >
              Privacy Policy
            </Link>
            <span className="opacity-40 hidden sm:inline">•</span>
            <span>© {new Date().getFullYear()} Envitefy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
