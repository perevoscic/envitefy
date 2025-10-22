"use client";
import { useEffect, useRef, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function PwaInstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [canInstall, setCanInstall] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);
  const [showIosOverlay, setShowIosOverlay] = useState(false);
  const [allowedDevice, setAllowedDevice] = useState(false);
  const [maybeInstallable, setMaybeInstallable] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [heroOutOfView, setHeroOutOfView] = useState(false);
  const [recaptchaOffset, setRecaptchaOffset] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);

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

    // Heuristic: mark as maybe-installable for fallback flows on browsers
    // that don't expose beforeinstallprompt or haven't fired it yet
    try {
      const hasManifest = !!document.querySelector('link[rel="manifest"]');
      const isSecure =
        window.isSecureContext || location.hostname === "localhost";
      const hasSW = "serviceWorker" in navigator;
      const isStandaloneNow = isStandalone();
      if (hasManifest && isSecure && hasSW && !isStandaloneNow) {
        setMaybeInstallable(true);
      }
    } catch {}

    return () => {
      try {
        mql?.removeEventListener("change", onChange);
      } catch {
        (mql as any)?.removeListener?.(onChange);
      }
    };
  }, []);

  // Nudge the FAB above the reCAPTCHA badge when present
  useEffect(() => {
    if (typeof window === "undefined") return;
    let raf = 0 as number;
    const compute = () => {
      try {
        const el = document.querySelector(
          ".grecaptcha-badge"
        ) as HTMLElement | null;
        if (!el) {
          setRecaptchaOffset(0);
          return;
        }
        const rect = el.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;
        // Add a small gap above the badge
        setRecaptchaOffset(isVisible ? Math.ceil(rect.height) + 12 : 0);
      } catch {
        // best effort only
      }
    };
    compute();

    const mo = new MutationObserver(() => {
      try {
        cancelAnimationFrame(raf);
      } catch {}
      raf = window.requestAnimationFrame(compute);
    });
    try {
      mo.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "class"],
      });
    } catch {}
    window.addEventListener("resize", compute);
    const interval = window.setInterval(compute, 2000);
    return () => {
      try {
        mo.disconnect();
      } catch {}
      window.removeEventListener("resize", compute);
      window.clearInterval(interval);
      try {
        cancelAnimationFrame(raf);
      } catch {}
    };
  }, []);

  // Only show on iPads and smaller screens; hide on laptops/desktops
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent || (navigator as any).vendor || "";
    const isIOS =
      /iPhone|iPad|iPod/.test(ua) ||
      (/\bMacintosh\b/.test(ua) && "ontouchend" in document);
    const mql = window.matchMedia("(max-width: 1024px)");
    const update = () => setAllowedDevice(isIOS || mql.matches);
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
      setShowIosTip(false);
    };
    window.addEventListener(
      "beforeinstallprompt",
      onBeforeInstallPrompt as any
    );

    // iOS/iPadOS Safari never fires beforeinstallprompt; show a clear fallback
    const ua = navigator.userAgent || (navigator as any).vendor || "";
    const isIOS =
      /iPhone|iPad|iPod/.test(ua) ||
      (/\bMacintosh\b/.test(ua) && "ontouchend" in document);
    const isStandalone =
      (window.navigator as any).standalone === true ||
      (window.matchMedia &&
        window.matchMedia("(display-mode: standalone)").matches);
    if (isIOS && !isStandalone && !deferred) {
      setShowIosTip(true);
      // Guard in case UA parsing runs before iOS paints toolbar
      const t = window.setTimeout(() => {
        if (!deferred) setShowIosTip(true);
      }, 1200);
      return () => window.clearTimeout(t);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        onBeforeInstallPrompt as any
      );
    };
  }, []);

  useEffect(() => {
    const onInstalled = () => {
      setCanInstall(false);
      setShowIosTip(false);
      setShowIosOverlay(false);
      setMaybeInstallable(false);
      setExpanded(false);
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  // Observe hero visibility
  useEffect(() => {
    if (typeof window === "undefined") return;
    const target = document.getElementById("landing-hero");
    if (!target) {
      setHeroOutOfView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const ratio = entry.intersectionRatio ?? 0;
        setHeroOutOfView(ratio <= 0.5);
      },
      { root: null, threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    observer.observe(target);
    return () => {
      try {
        observer.disconnect();
      } catch {}
    };
  }, []);

  // Show native install button whenever eligible (regardless of viewport/device)
  // iOS tip gated to mobile-ish devices; generic fallback shown when heuristically installable
  const showIosFallback = !canInstall && showIosTip && allowedDevice;
  const showGenericFallback =
    !canInstall && !showIosFallback && maybeInstallable;

  useEffect(() => {
    if (
      !heroOutOfView ||
      (!canInstall && !showIosFallback && !showGenericFallback)
    ) {
      setExpanded(false);
    }
  }, [heroOutOfView, canInstall, showIosFallback, showGenericFallback]);
  if (
    (!canInstall && !showIosFallback && !showGenericFallback) ||
    !heroOutOfView
  )
    return null;

  return (
    <div
      className="fixed right-4 z-[1000] pointer-events-auto flex flex-col items-end gap-2"
      style={{ bottom: 16 + recaptchaOffset }}
    >
      {!expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
          aria-label="Open install options"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 16V3" />
            <path d="M7 8l5-5 5 5" />
            <rect x="4" y="12" width="16" height="8" rx="2" ry="2" />
          </svg>
        </button>
      )}
      {expanded && (
        <div className="relative w-[min(92vw,320px)]">
          <div className="rounded-2xl bg-surface text-foreground border border-border shadow-2xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-base">
                  {showIosFallback ? "Install to Home Screen" : "Install app"}
                </div>
                <div className="text-xs opacity-70">
                  Keep Snap My Date handy on your device.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground transition"
                aria-label="Collapse install options"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {canInstall && (
              <button
                onClick={async () => {
                  if (!deferred) return;
                  await deferred.prompt();
                  try {
                    await deferred.userChoice;
                  } finally {
                    setDeferred(null);
                    setCanInstall(false);
                    setShowIosTip(false);
                  }
                }}
                className="w-full rounded-full bg-primary text-primary-foreground px-4 py-2 shadow-lg"
              >
                Install app
              </button>
            )}
            {showIosFallback && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowIosOverlay(true)}
                  className="w-full rounded-full bg-primary text-primary-foreground px-4 py-2 shadow-lg"
                >
                  Install to Home Screen
                </button>
                <div className="text-sm opacity-80">
                  Follow the guided steps to add Snap My Date to your iOS home
                  screen.
                </div>
              </div>
            )}
            {!canInstall && !showIosFallback && showGenericFallback && (
              <div className="rounded-xl bg-surface text-foreground border border-border shadow-inner p-3 text-sm">
                <div className="font-medium mb-1">Install this app</div>
                <div className="opacity-80">
                  Open your browser menu and choose{" "}
                  <span className="font-semibold">Install app</span>.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {showIosOverlay && (
        <div className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowIosOverlay(false)}
            aria-hidden
          />
          <div className="relative z-[1101] w-full sm:w-auto max-w-[92vw] sm:max-w-md rounded-2xl bg-surface text-foreground border border-border shadow-2xl p-4 sm:p-5 m-3">
            <div className="flex items-start gap-3">
              <div className="shrink-0 h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M12 16V3" />
                  <path d="M7 8l5-5 5 5" />
                  <rect x="4" y="12" width="16" height="8" rx="2" ry="2" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-base mb-1">
                  Add to Home Screen
                </div>
                <ol className="list-decimal ml-5 space-y-1 text-sm">
                  <li>Tap the Share button in Safari (square with arrow).</li>
                  <li>
                    Choose{" "}
                    <span className="font-semibold">Add to Home Screen</span>.
                  </li>
                  <li>
                    Tap <span className="font-semibold">Add</span> to confirm.
                  </li>
                </ol>
                <div className="text-xs opacity-70 mt-2">
                  Tip: If you opened this in another browser on iOS, open in
                  Safari to install.
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowIosOverlay(false)}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground shadow"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
