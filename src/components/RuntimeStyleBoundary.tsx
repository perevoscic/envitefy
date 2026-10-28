"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import type { ReactNode } from "react";
import styles from "@/generated/runtime-styles.json";

export default function RuntimeStyleBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { status } = useSession();
  const scope = status === "unauthenticated" && (pathname === "/" || pathname === "/landing")
    ? "landing"
    : "application";
  if (process.env.NODE_ENV !== "production") return children;

  // Layout server components persist across client navigation. Router/session
  // state selects the destination CSS here; React waits for this resource before
  // committing the updated workspace, including after an account transition.
  return <><link rel="stylesheet" href={styles[scope].href} precedence="envitefy-base" />{children}</>;
}
