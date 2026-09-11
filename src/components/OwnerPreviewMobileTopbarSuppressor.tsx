"use client";

import { useLayoutEffect } from "react";
import { suppressEventPreviewChrome } from "@/lib/event-preview-chrome";

/** Suppress desktop and mobile navigation without unmounting the editor behind the preview. */
export default function OwnerPreviewMobileTopbarSuppressor() {
  useLayoutEffect(() => suppressEventPreviewChrome(document.documentElement), []);

  return null;
}
