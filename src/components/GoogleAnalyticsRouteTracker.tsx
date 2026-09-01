"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { GOOGLE_ANALYTICS_MEASUREMENT_ID } from "@/lib/google-analytics";
import { ANALYTICS_READY_EVENT, hasAnalyticsConsent } from "@/lib/privacy-preferences";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export default function GoogleAnalyticsRouteTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const sendPageView = () => {
      if (!hasAnalyticsConsent() || typeof window.gtag !== "function") return;
      window.gtag("event", "page_view", {
        send_to: GOOGLE_ANALYTICS_MEASUREMENT_ID,
        page_title: document.title,
        page_location: `${window.location.origin}${pathname}`,
        page_path: pathname,
      });
    };
    sendPageView();
    window.addEventListener(ANALYTICS_READY_EVENT, sendPageView);
    return () => window.removeEventListener(ANALYTICS_READY_EVENT, sendPageView);
  }, [pathname]);

  return null;
}
