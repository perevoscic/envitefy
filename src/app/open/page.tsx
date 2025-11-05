"use client";
import type { Metadata } from "next";
import { useEffect } from "react";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Open() {
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const url = sp.get("url");
      if (url) {
        const newWindow = window.open(url, "_blank");
        // If the browser blocked the popup, navigate in the current tab
        if (!newWindow) {
          window.location.replace(url);
          return;
        }
      }
    } catch {}
    // Always return home after attempting to open
    window.location.replace("/");
  }, []);
  return null;
}
