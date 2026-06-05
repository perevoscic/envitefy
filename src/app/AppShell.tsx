"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { EventCacheProvider } from "@/app/event-cache-context";
import EnvitefyWordmark from "@/components/branding/EnvitefyWordmark";
import ConditionalFooter from "@/components/ConditionalFooter";
import { MainContentWrapper } from "@/components/MainContentWrapper";
import { MenuProvider } from "@/contexts/MenuContext";
import { AUTH_TRANSITION_CLEAR_EVENT, AUTH_TRANSITION_EVENT } from "@/utils/authTransition";

const LeftSidebar = dynamic(() => import("./left-sidebar"), {
  loading: () => null,
});

/** Must stay aligned with middleware signed-in redirects for marketing URLs. */
const MARKETING_PATHS = new Set(["/gymnastics", "/landing"]);

function isMarketingPath(pathname: string) {
  return MARKETING_PATHS.has(pathname);
}

function isStudioCardSharePath(pathname: string) {
  const normalized = pathname.replace(/\/+$/, "");
  const segments = normalized.split("/").filter(Boolean);
  return segments.length === 2 && segments[0] === "card";
}

function AuthTransitionOverlay({ message = "Opening Envitefy..." }: { message?: string }) {
  return (
    <div
      className="auth-transition-overlay fixed inset-0 z-[14000] flex cursor-progress touch-none select-none flex-col items-center justify-center gap-5 bg-[#f8f5ff]/90 px-6 backdrop-blur-xl"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div
        className="auth-transition-mark relative flex h-24 w-56 items-center justify-center overflow-hidden rounded-[2rem]"
        aria-hidden
      >
        <EnvitefyWordmark className="relative z-10 text-[4rem] leading-none" scaled={false} shine />
      </div>
      <p className="text-sm font-semibold text-[#51456d]">{message}</p>
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
  const [authTransitionMessage, setAuthTransitionMessage] = useState<string | null>(null);
  const hasServerSession = Boolean(serverSession?.user);
  if (status === "authenticated") wasAuthenticated.current = true;
  if (status === "unauthenticated") wasAuthenticated.current = false;

  const isAuthenticated =
    status === "authenticated" ||
    (status === "loading" && hasServerSession) ||
    (status === "loading" && wasAuthenticated.current);
  const onMarketing = isMarketingPath(pathname);
  const isStudioCardShare = isStudioCardSharePath(pathname);
  const isChatPath = pathname.replace(/\/+$/, "") === "/chat";
  const showAppChrome = isAuthenticated && !onMarketing && !isStudioCardShare;
  const isRedirectingFromMarketing = onMarketing && isAuthenticated;
  const isLightweightLanding = pathname === "/event" && !isAuthenticated;

  useEffect(() => {
    const onTransition = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      setAuthTransitionMessage(detail?.message || "Loading...");
    };
    const onClear = () => setAuthTransitionMessage(null);

    window.addEventListener(AUTH_TRANSITION_EVENT, onTransition);
    window.addEventListener(AUTH_TRANSITION_CLEAR_EVENT, onClear);
    return () => {
      window.removeEventListener(AUTH_TRANSITION_EVENT, onTransition);
      window.removeEventListener(AUTH_TRANSITION_CLEAR_EVENT, onClear);
    };
  }, []);

  useEffect(() => {
    if (!authTransitionMessage) {
      document.documentElement.removeAttribute("data-auth-transition");
      return;
    }

    document.documentElement.setAttribute("data-auth-transition", "true");
    return () => {
      document.documentElement.removeAttribute("data-auth-transition");
    };
  }, [authTransitionMessage]);

  useEffect(() => {
    if (!onMarketing || !isAuthenticated) return;
    router.replace("/");
  }, [onMarketing, isAuthenticated, router]);

  if (isLightweightLanding) {
    return (
      <MainContentWrapper
        isAuthenticated={true}
        reserveSidebarSpace={false}
        enableProjectBackground={false}
      >
        <div className="flex-1 min-w-0">{children}</div>
        <ConditionalFooter />
      </MainContentWrapper>
    );
  }

  return (
    <EventCacheProvider>
      {authTransitionMessage ? <AuthTransitionOverlay message={authTransitionMessage} /> : null}
      {showAppChrome ? (
        <MenuProvider>
          <LeftSidebar />
          <MainContentWrapper
            isAuthenticated={true}
            enableProjectBackground={true}
            className={isChatPath ? "h-[100dvh] overflow-hidden" : ""}
          >
            <div className="min-h-0 flex-1 min-w-0">{children}</div>
          </MainContentWrapper>
        </MenuProvider>
      ) : (
        <MainContentWrapper
          isAuthenticated={false}
          enableProjectBackground={false}
          className={isChatPath ? "h-[100dvh] overflow-hidden" : ""}
        >
          {isRedirectingFromMarketing ? (
            <AuthTransitionOverlay message="Opening Envitefy..." />
          ) : (
            <>
              <div className="min-h-0 flex-1 min-w-0">{children}</div>
              {isChatPath ? null : <ConditionalFooter />}
            </>
          )}
        </MainContentWrapper>
      )}
    </EventCacheProvider>
  );
}
