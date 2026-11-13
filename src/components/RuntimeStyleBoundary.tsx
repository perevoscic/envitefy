"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import type { ReactNode } from "react";

export default function RuntimeStyleBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { status } = useSession();
  const scope = status === "unauthenticated" && (pathname === "/" || pathname === "/landing")
    ? "landing"
    : "application";
  if (process.env.NODE_ENV === "production") {
    // A concurrent production build must not invalidate development navigation.
    const styles: typeof import("@/generated/runtime-styles.json") = require("@/generated/runtime-styles.json");
    // Router/session state selects CSS before the destination commits.
    return <><link rel="stylesheet" href={styles[scope].href} precedence="envitefy-base" />{children}</>;
  }
  return children;
}
