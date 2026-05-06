"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SIDEBAR_WIDTH_REM } from "@/app/left-sidebar.model";
import { EVENT_SKIN_TOP_OFFSET_VAR } from "@/components/event-skin-layout";
import { GradientBackgroundLayer } from "@/components/ui/gradient-backgrounds";

/** Must match the mobile <header> in left-sidebar.tsx:
 *  pt-[max(0.75rem,env(safe-area-inset-top))] + h-10 button + pb-2
 *  = max(0.75rem, safe-area) + 3rem */
const MOBILE_TOPBAR_PT = "calc(3rem + max(0.75rem, env(safe-area-inset-top, 0px)))";

export function MainContentWrapper({
  children,
  isAuthenticated,
  reserveSidebarSpace = isAuthenticated,
  className = "",
}: {
  children: React.ReactNode;
  isAuthenticated: boolean;
  reserveSidebarSpace?: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  const [isDesktop, setIsDesktop] = useState(false);

  const normalizedPath = (pathname || "").replace(/\/+$/, "");
  const pathSegments = normalizedPath.split("/").filter(Boolean);
  const isStudioCardShare = pathSegments.length === 2 && pathSegments[0] === "card";
  const isEventSharePage = pathSegments.length === 2 && pathSegments[0] === "event";
  const isChatWorkspace = normalizedPath === "/chat";
  const usesOwnLandingBackground = normalizedPath === "/snap" || normalizedPath === "/gymnastics";

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.matchMedia("(min-width: 1024px)").matches);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  const paddingLeft = reserveSidebarSpace && isDesktop ? SIDEBAR_WIDTH_REM : "0";

  const eventSkinTopOffset =
    !isDesktop && isAuthenticated
      ? `var(--app-mobile-topbar-offset, ${MOBILE_TOPBAR_PT})`
      : "max(0px, env(safe-area-inset-top))";

  const paddingTop = isStudioCardShare
    ? "0px"
    : isEventSharePage
      ? "0px"
      : isChatWorkspace
        ? "0px"
      : !isDesktop && isAuthenticated
        ? `var(--app-mobile-topbar-offset, ${MOBILE_TOPBAR_PT})`
        : "max(0px, env(safe-area-inset-top))";

  const shellBgClass = isStudioCardShare ? "bg-neutral-950" : "bg-transparent";

  const showProjectGradientBackground = !usesOwnLandingBackground;
  const backgroundLeft = reserveSidebarSpace && isDesktop ? SIDEBAR_WIDTH_REM : "0px";

  return (
    <div
      className={`relative isolate min-h-[100dvh] text-foreground flex flex-col ${shellBgClass} ${className}`}
      style={{
        minHeight: "100dvh",
        backgroundColor: isEventSharePage
          ? "var(--event-page-background-color, #F8F5FF)"
          : undefined,
        paddingTop,
        paddingBottom: "max(0px, env(safe-area-inset-bottom))",
        paddingLeft,
        transition: "padding-left 200ms ease-out",
        ...(isEventSharePage ? { [EVENT_SKIN_TOP_OFFSET_VAR]: eventSkinTopOffset } : null),
      }}
      data-static-illustration="true"
    >
      {showProjectGradientBackground ? (
        <GradientBackgroundLayer style={{ left: backgroundLeft }} />
      ) : null}
      {showProjectGradientBackground ? (
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</div>
      ) : (
        children
      )}
    </div>
  );
}
