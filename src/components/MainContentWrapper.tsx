"use client";

import { useSidebar } from "@/app/sidebar-context";
import { useEffect, useState } from "react";

const SIDEBAR_WIDTH_REM = "20rem";
const SIDEBAR_COLLAPSED_REM = "4.5rem";
/** Must match the mobile <header> in left-sidebar.tsx:
 *  pt-[max(0.5rem,env(safe-area-inset-top))] + h-10 button + pb-2
 *  = max(0.5rem, safe-area) + 3rem */
const MOBILE_TOPBAR_PT =
  "calc(3rem + max(0.5rem, env(safe-area-inset-top, 0px)))";

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
  const { isCollapsed } = useSidebar();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.matchMedia("(min-width: 1024px)").matches);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  const paddingLeft =
    reserveSidebarSpace && isDesktop
      ? isCollapsed
        ? SIDEBAR_COLLAPSED_REM
        : SIDEBAR_WIDTH_REM
      : "0";

  const paddingTop =
    !isDesktop && isAuthenticated
      ? MOBILE_TOPBAR_PT
      : "max(0px, env(safe-area-inset-top))";

  return (
    <div
      className={`min-h-[100dvh] text-foreground flex flex-col ${
        isAuthenticated ? "bg-[#F8F5FF]" : "bg-[#F8F5FF] landing-dark-gradient"
      } ${className}`}
      style={{
        minHeight: "100dvh",
        paddingTop,
        paddingBottom: "max(0px, env(safe-area-inset-bottom))",
        paddingLeft,
        transition: "padding-left 200ms ease-out",
      }}
      data-static-illustration="true"
    >
      {children}
    </div>
  );
}
