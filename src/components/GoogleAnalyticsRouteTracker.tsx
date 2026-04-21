"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { GOOGLE_ANALYTICS_MEASUREMENT_ID } from "@/lib/google-analytics";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export default function GoogleAnalyticsRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() || "";

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.gtag !== "function") {
      return;
    }

    const pagePath = search ? `${pathname}?${search}` : pathname;
    window.gtag("event", "page_view", {
      send_to: GOOGLE_ANALYTICS_MEASUREMENT_ID,
      page_title: document.title,
      page_location: window.location.href,
      page_path: pagePath,
    });
  }, [pathname, search]);

  return null;
}
