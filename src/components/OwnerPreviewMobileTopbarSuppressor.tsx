"use client";

import { useEffect } from "react";

export default function OwnerPreviewMobileTopbarSuppressor() {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.mobileTopbarHidden = "true";
    root.style.setProperty("--app-mobile-topbar-offset", "0px");

    return () => {
      if (root.dataset.mobileTopbarHidden === "true") {
        delete root.dataset.mobileTopbarHidden;
      }
      root.style.removeProperty("--app-mobile-topbar-offset");
    };
  }, []);

  return null;
}
