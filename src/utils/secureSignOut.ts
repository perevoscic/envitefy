"use client";

import { signOut } from "next-auth/react";
import { emitEventCacheReset } from "@/app/event-cache-context";
import { hideAuthTransition, showAuthTransition } from "@/utils/authTransition";
import { clearAppBrowserState } from "@/utils/clearAppBrowserState";

export async function secureSignOut(callbackUrl = "/") {
  showAuthTransition("Signing you out...");
  try {
    clearAppBrowserState();
    emitEventCacheReset();
    await signOut({ callbackUrl });
  } catch (err) {
    hideAuthTransition();
    throw err;
  }
}
