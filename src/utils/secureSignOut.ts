"use client";

import { signOut } from "next-auth/react";
import { emitEventCacheReset } from "@/app/event-cache-context";
import { hideAuthTransition, showAuthTransition } from "@/utils/authTransition";
import { clearAppBrowserState } from "@/utils/clearAppBrowserState";
import { clearCreationIntakes, suspendCreationIntakeWrites } from "@/lib/create/creation-intake";

export async function secureSignOut(callbackUrl = "/") {
  showAuthTransition("Signing you out...");
  suspendCreationIntakeWrites();
  try {
    await clearCreationIntakes().catch(() => {});
    clearAppBrowserState();
    emitEventCacheReset();
    const result = await signOut({ callbackUrl, redirect: false });
    window.location.replace(result.url || callbackUrl);
  } catch (err) {
    hideAuthTransition();
    throw err;
  }
}
