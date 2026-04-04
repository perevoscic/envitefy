"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { MenuProvider } from "@/contexts/MenuContext";
import { EventCacheProvider } from "@/app/event-cache-context";
import ConditionalFooter from "@/components/ConditionalFooter";
import { MainContentWrapper } from "@/components/MainContentWrapper";

const LeftSidebar = dynamic(() => import("./left-sidebar"), {
  loading: () => null,
});

/** Must stay aligned with middleware signed-in redirects for marketing URLs. */
const MARKETING_PATHS = new Set(["/snap", "/gymnastics", "/landing"]);

function isMarketingPath(pathname: string) {
  return MARKETING_PATHS.has(pathname);
}

function MarketingSignedInRedirectOverlay() {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-[#F8F5FF]/92 backdrop-blur-[8px]"
      role="status"
      aria-live="polite"
      aria-label="Loading your workspace"
    >
      <div
        className="h-10 w-10 rounded-full border-2 border-foreground/15 border-t-foreground/65 animate-spin"
        aria-hidden
      />
      <p className="text-sm font-medium text-foreground/75">
        Taking you to your workspace…
      </p>
    </div>
  );
}

export default function AppShell({
  children,
  serverSession = null,
}: {
  children: React.ReactNode;
  serverSession?: any;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();
  const wasAuthenticated = useRef(false);
  const hasServerSession = Boolean(serverSession?.user);
  if (status === "authenticated") wasAuthenticated.current = true;
  if (status === "unauthenticated") wasAuthenticated.current = false;

  const isAuthenticated =
    status === "authenticated" ||
    (status === "loading" && hasServerSession) ||
    (status === "loading" && wasAuthenticated.current);
  const onMarketing = isMarketingPath(pathname);
  const showWorkspaceChrome = isAuthenticated && !onMarketing;
  const isRedirectingFromMarketing = onMarketing && isAuthenticated;
  const isLightweightLanding = pathname === "/event" && !isAuthenticated;

  useEffect(() => {
    if (!onMarketing || !isAuthenticated) return;
    router.replace("/");
  }, [onMarketing, isAuthenticated, router]);

  if (isLightweightLanding) {
    return (
      <MainContentWrapper isAuthenticated={true} reserveSidebarSpace={false}>
        <div className="flex-1 min-w-0">{children}</div>
        <ConditionalFooter />
      </MainContentWrapper>
    );
  }

  return (
    <EventCacheProvider>
      {showWorkspaceChrome ? (
        <MenuProvider>
          <LeftSidebar />
          <MainContentWrapper isAuthenticated={true}>
            <div className="flex-1 min-w-0">{children}</div>
            <ConditionalFooter />
          </MainContentWrapper>
        </MenuProvider>
      ) : (
        <MainContentWrapper isAuthenticated={false}>
          {isRedirectingFromMarketing ? (
            <MarketingSignedInRedirectOverlay />
          ) : (
            <>
              <div className="flex-1 min-w-0">{children}</div>
              <ConditionalFooter />
            </>
          )}
        </MainContentWrapper>
      )}
    </EventCacheProvider>
  );
}
