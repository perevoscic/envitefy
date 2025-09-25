"use client";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function PwaInstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [canInstall, setCanInstall] = useState(false);
  const [allowedDevice, setAllowedDevice] = useState(false);

  // Hide if already installed or running in standalone
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isStandalone = () => {
      try {
        if ((window.navigator as any).standalone === true) return true; // iOS
        if (
          window.matchMedia &&
          window.matchMedia("(display-mode: standalone)").matches
        )
          return true;
        if (
          window.matchMedia &&
          window.matchMedia("(display-mode: fullscreen)").matches
        )
          return true;
      } catch {}
      return false;
    };

    if (isStandalone()) {
      setCanInstall(false);
      return;
    }

    // Listen for display-mode changes
    const mql = window.matchMedia
      ? window.matchMedia("(display-mode: standalone)")
      : null;
    const onChange = () => {
      if (mql && mql.matches) setCanInstall(false);
    };
    try {
      mql?.addEventListener("change", onChange);
    } catch {
      (mql as any)?.addListener?.(onChange);
    }

    // Optional: check for installed related apps (best-effort)
    const maybeCheckRelated = async () => {
      try {
        const anyNav = navigator as any;
        if (anyNav.getInstalledRelatedApps) {
          const related = await anyNav.getInstalledRelatedApps();
          if (Array.isArray(related) && related.length > 0)
            setCanInstall(false);
        }
      } catch {}
    };
    maybeCheckRelated();

    return () => {
      try {
        mql?.removeEventListener("change", onChange);
      } catch {
        (mql as any)?.removeListener?.(onChange);
      }
    };
  }, []);

  // Only show on iPads and smaller screens; hide on laptops/desktops
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent || (navigator as any).vendor || "";
    const isiPad =
      /iPad/.test(ua) || (/\bMacintosh\b/.test(ua) && "ontouchend" in document);
    const mql = window.matchMedia("(max-width: 1024px)");
    const update = () => setAllowedDevice(isiPad || mql.matches);
    update();
    try {
      mql.addEventListener("change", update);
    } catch {
      (mql as any).addListener?.(update);
    }
    return () => {
      try {
        mql.removeEventListener("change", update);
      } catch {
        (mql as any).removeListener?.(update);
      }
    };
  }, []);

  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault?.();
      const bip = e as BeforeInstallPromptEvent;
      setDeferred(bip);
      setCanInstall(true);
    };
    window.addEventListener(
      "beforeinstallprompt",
      onBeforeInstallPrompt as any
    );
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        onBeforeInstallPrompt as any
      );
    };
  }, []);

  useEffect(() => {
    const onInstalled = () => setCanInstall(false);
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  if (!canInstall || !allowedDevice) return null;

  return (
    <button
      onClick={async () => {
        if (!deferred) return;
        await deferred.prompt();
        try {
          await deferred.userChoice;
        } finally {
          setDeferred(null);
          setCanInstall(false);
        }
      }}
      className="fixed bottom-4 right-4 z-50 rounded-full bg-primary text-primary-foreground px-4 py-2 shadow-lg"
    >
      Install app
    </button>
  );
}
