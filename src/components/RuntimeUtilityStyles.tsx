"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { RUNTIME_UTILITY_STYLESHEET } from "@/lib/runtime-utility-stylesheet";

/** Root CSS keeps homepage/chrome/widget utilities; every other route retains the full original set. */
export default function RuntimeUtilityStyles() {
  const pathname = usePathname();
  const { status } = useSession();
  if (process.env.NODE_ENV !== "production") return null;
  if ((pathname === "/" || pathname === "/landing") && status !== "authenticated") return null;
  return <link rel="stylesheet" href={RUNTIME_UTILITY_STYLESHEET} precedence="runtime-utilities" />;
}
