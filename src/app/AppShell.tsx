"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { MenuProvider } from "@/contexts/MenuContext";
import { EventCacheProvider } from "@/app/event-cache-context";
import ConditionalFooter from "@/components/ConditionalFooter";
import { MainContentWrapper } from "@/components/MainContentWrapper";

const LeftSidebar = dynamic(() => import("./left-sidebar"), {
  ssr: false,
  loading: () => null,
});

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isLightweightLanding = pathname === "/event" && !isAuthenticated;

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
      {isAuthenticated ? (
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
