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
  const isLightweightLanding = pathname === "/event" && !isAuthenticated;

  useEffect(() => {
    if (!onMarketing) return;
    if (
      status !== "authenticated" &&
      !(status === "loading" && hasServerSession)
    ) {
      return;
    }
    router.replace("/");
  }, [onMarketing, status, hasServerSession, router]);

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
          <div className="flex-1 min-w-0">{children}</div>
          <ConditionalFooter />
        </MainContentWrapper>
      )}
    </EventCacheProvider>
  );
}
