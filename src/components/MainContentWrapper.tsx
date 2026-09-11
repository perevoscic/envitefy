"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SIDEBAR_WIDTH_REM } from "@/app/left-sidebar.model";
import { EVENT_SKIN_TOP_OFFSET_VAR } from "@/components/event-skin-layout";
import { isCreateEventRoute } from "@/config/navigation-config";
import { GradientBackgroundLayer } from "@/components/ui/gradient-backgrounds";

/** Clear the mobile navbar in left-sidebar.tsx and leave a 1rem content gap:
 *  safe-area top inset + 2.75rem controls + 1.25rem vertical padding
 *  + 2px borders + 1rem gap. */
const MOBILE_TOPBAR_PT = "calc(5rem + 2px + max(0.75rem, env(safe-area-inset-top, 0px)))";

export function MainContentWrapper({
  children,
  isAuthenticated,
  reserveSidebarSpace = isAuthenticated,
  enableProjectBackground = isAuthenticated,
  className = "",
}: {
  children: React.ReactNode;
  isAuthenticated: boolean;
  reserveSidebarSpace?: boolean;
  enableProjectBackground?: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  const [isDesktop, setIsDesktop] = useState(false);

  const normalizedPath = (pathname || "").replace(/\/+$/, "");
  const pathSegments = normalizedPath.split("/").filter(Boolean);
  const isStudioCardShare = pathSegments.length === 2 && pathSegments[0] === "card";
  const isEventSharePage = pathSegments.length === 2 && pathSegments[0] === "event" && !isCreateEventRoute(normalizedPath);
  const isChatRoute = normalizedPath === "/chat";
  const isSettingsRoute = normalizedPath === "/settings";
  const isAdminRoute = normalizedPath === "/admin" || normalizedPath.startsWith("/admin/");
  const usesOwnLandingBackground =
    normalizedPath === "/gymnastics" || (normalizedPath === "/snap" && !isAuthenticated);

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
      : isChatRoute
        ? "0px"
        : !isDesktop && isAuthenticated
          ? `var(--app-mobile-topbar-offset, ${MOBILE_TOPBAR_PT})`
          : "max(0px, env(safe-area-inset-top))";

  const shellBgClass = isStudioCardShare
    ? "bg-neutral-950"
    : isAdminRoute
      ? "bg-slate-50"
      : "bg-transparent";

  const showProjectGradientBackground =
    enableProjectBackground &&
    !usesOwnLandingBackground &&
    !isAdminRoute &&
    !isEventSharePage &&
    !isStudioCardShare;

  return (
    <div
      className={`relative isolate min-h-[100dvh] text-foreground flex flex-col ${shellBgClass} ${className}`}
      style={{
        minHeight: "100dvh",
        backgroundColor: isEventSharePage
          ? "var(--event-page-background-color, #F8F5FF)"
          : undefined,
        // Settings applies the inset to its cards so its page gradient reaches the navbar.
        paddingTop: isSettingsRoute ? "0px" : paddingTop,
        paddingBottom: "max(0px, env(safe-area-inset-bottom))",
        paddingLeft,
        transition: "padding-left 200ms ease-out",
        ...(isSettingsRoute ? { "--app-content-top-inset": paddingTop } : null),
        ...(isEventSharePage ? { [EVENT_SKIN_TOP_OFFSET_VAR]: eventSkinTopOffset } : null),
      }}
      data-static-illustration="true"
    >
      {showProjectGradientBackground ? (
        <GradientBackgroundLayer />
      ) : null}
      {showProjectGradientBackground ? (
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</div>
      ) : (
        children
      )}
    </div>
  );
}
