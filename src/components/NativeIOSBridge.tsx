"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useProgressNavigation } from "./UnsavedProgressProvider";
import { mobileReturnPath } from "@/lib/mobile-auth-contract";
import { guardNativeIOSSignIn } from "@/lib/native-ios";
import { normalizeSignupIntent } from "@/lib/signup-intent";

/** Native controls use the same explicit-save guard as links in the website. */
export default function NativeIOSBridge() {
  const { requestLeave } = useProgressNavigation();
  const { update } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (!/EnvitefyIOS\//.test(navigator.userAgent)) return;
    const onNavigation = (event: Event) => {
      const detail: unknown = (event as CustomEvent).detail;
      if (!detail || typeof detail !== "object" || !("action" in detail)) return;
      if (detail.action === "authentication-request") {
        guardNativeIOSSignIn(
          {
            returnTo: "path" in detail && typeof detail.path === "string" ? detail.path : "/",
            mode: "mode" in detail && detail.mode === "signup" ? "signup" : "login",
            intent: normalizeSignupIntent("intent" in detail ? detail.intent : null) || undefined,
            calendar:
              "calendar" in detail &&
              (detail.calendar === "google" || detail.calendar === "outlook")
                ? detail.calendar
                : undefined,
          },
          requestLeave,
        );
      }
      if (detail.action === "back") requestLeave(() => window.history.back());
      if (detail.action === "reload") requestLeave(() => window.location.reload());
      if (detail.action === "navigate" && "path" in detail && typeof detail.path === "string") {
        const path = mobileReturnPath(detail.path);
        requestLeave(() => router.push(path));
      }
      if (
        detail.action === "authenticated" &&
        "path" in detail &&
        typeof detail.path === "string"
      ) {
        const path = mobileReturnPath(detail.path);
        void update()
          .then(() => {
            if (path === `${location.pathname}${location.search}${location.hash}`) router.refresh();
            else requestLeave(() => router.push(path));
          })
          .catch(() => {
            window.alert(
              "Your account could not refresh. Keep this page open and try signing in again.",
            );
          });
      }
    };
    window.addEventListener("envitefy-native-navigation", onNavigation);
    document.documentElement.dataset.envitefyNativeReady = "true";
    return () => {
      window.removeEventListener("envitefy-native-navigation", onNavigation);
      delete document.documentElement.dataset.envitefyNativeReady;
    };
  }, [requestLeave, router, update]);
  return null;
}
