"use client";

import { useSidebar } from "@/app/sidebar-context";
import { useEffect, useState } from "react";

const SIDEBAR_WIDTH_REM = "20rem";
const SIDEBAR_COLLAPSED_REM = "4.5rem";

export function MainContentWrapper({
  children,
  isAuthenticated,
  className = "",
}: {
  children: React.ReactNode;
  isAuthenticated: boolean;
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
    isAuthenticated && isDesktop
      ? isCollapsed
        ? SIDEBAR_COLLAPSED_REM
        : SIDEBAR_WIDTH_REM
      : "0";

  return (
    <div
      className={`min-h-[100dvh] text-foreground flex flex-col ${
        isAuthenticated ? "bg-[#F8F5FF]" : "bg-[#F8F5FF] landing-dark-gradient"
      } ${className}`}
      style={{
        minHeight: "100dvh",
        paddingTop: "max(0px, env(safe-area-inset-top))",
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
