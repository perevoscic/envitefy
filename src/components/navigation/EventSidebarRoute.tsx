"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSidebar } from "@/app/sidebar-context";

/** Associate an alternate event view with its saved event in the sidebar. */
export default function EventSidebarRoute({ eventHref }: { eventHref: string }) {
  const pathname = usePathname();
  const { setEventRouteAlias } = useSidebar();

  useEffect(() => {
    if (!pathname) return;
    setEventRouteAlias({ pathname, eventHref });
    return () => setEventRouteAlias(null);
  }, [eventHref, pathname, setEventRouteAlias]);

  return null;
}
