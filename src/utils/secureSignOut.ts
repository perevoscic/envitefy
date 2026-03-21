"use client";

import { signOut } from "next-auth/react";
import { emitEventCacheReset } from "@/app/event-cache-context";
import { clearAppBrowserState } from "@/utils/clearAppBrowserState";

export async function secureSignOut(callbackUrl = "/") {
  clearAppBrowserState();
  emitEventCacheReset();
  await signOut({ callbackUrl });
}
