"use client";

import { usePathname } from "next/navigation";
import { SIDEBAR_WIDTH_REM } from "@/app/left-sidebar.model";
import { useEffect, useState } from "react";

/** Must match the mobile <header> in left-sidebar.tsx:
 *  pt-[max(0.75rem,env(safe-area-inset-top))] + h-10 button + pb-2
 *  = max(0.75rem, safe-area) + 3rem */
const MOBILE_TOPBAR_PT =
  "calc(3rem + max(0.75rem, env(safe-area-inset-top, 0px)))";

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

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.matchMedia("(min-width: 1024px)").matches);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  const paddingLeft =
    reserveSidebarSpace && isDesktop ? SIDEBAR_WIDTH_REM : "0";

  const paddingTop = isStudioCardShare
    ? "0px"
    : !isDesktop && isAuthenticated
      ? MOBILE_TOPBAR_PT
      : "max(0px, env(safe-area-inset-top))";

  const shellBgClass = isStudioCardShare
    ? "bg-neutral-950"
    : isAuthenticated
      ? "bg-[#F8F5FF]"
      : "bg-[#F8F5FF] landing-dark-gradient";

  return (
    <div
      className={`min-h-[100dvh] text-foreground flex flex-col ${shellBgClass} ${className}`}
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
