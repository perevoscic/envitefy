"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { FONT_CATALOG_STYLESHEET } from "@/lib/font-catalog-stylesheet";

/**
 * The homepage uses its bundled marketing/brand faces. Other pages can render
 * any saved font selection, so register the complete unchanged catalog there.
 * React's stylesheet resource survives navigation and coordinates loading with
 * Suspense; a direct page request also receives the link in server HTML.
 */
export default function FontCatalogStyles() {
  const pathname = usePathname();
  const { status } = useSession();
  if ((pathname === "/" || pathname === "/landing") && status !== "authenticated") return null;
  return <link rel="stylesheet" href={FONT_CATALOG_STYLESHEET} precedence="font-catalog" />;
}
