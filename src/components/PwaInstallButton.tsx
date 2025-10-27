"use client";
import { useEffect, useRef, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

interface SnapWindow extends Window {
  __snapInstallDeferredPrompt?: BeforeInstallPromptEvent | null;
  __snapInstallBridgeReady?: boolean;
}

const BRIDGE_EVENT_NAME = "snapmydate:beforeinstallprompt";

if (typeof window !== "undefined") {
  const w = window as SnapWindow;
  if (!w.__snapInstallBridgeReady) {
    w.__snapInstallBridgeReady = true;
    window.addEventListener("beforeinstallprompt", (event: Event) => {
      const bip = event as BeforeInstallPromptEvent;
      bip.preventDefault?.();
      w.__snapInstallDeferredPrompt = bip;
      window.dispatchEvent(
        new CustomEvent<BeforeInstallPromptEvent | null>(BRIDGE_EVENT_NAME, {
          detail: bip,
        })
      );
    });
  }
}

export default function PwaInstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [canInstall, setCanInstall] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);
  const [allowedDevice, setAllowedDevice] = useState(false);
  const [maybeInstallable, setMaybeInstallable] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [heroOutOfView, setHeroOutOfView] = useState(false);
  const [recaptchaOffset, setRecaptchaOffset] = useState(0);
  const [isAndroid, setIsAndroid] = useState(false);
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
    const androidUA = /Android|Windows Phone|Silk\//i.test(ua);
    const mql = window.matchMedia("(max-width: 1024px)");
    const update = () => setAllowedDevice(isIOS || mql.matches);
    update();
    setIsAndroid(androidUA);
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
    if (typeof window === "undefined") return;
    const w = window as SnapWindow;
    const adoptPrompt = (evt: BeforeInstallPromptEvent | null | undefined) => {
      if (!evt) return;
      w.__snapInstallDeferredPrompt = evt;
      setDeferred(evt);
      setCanInstall(true);
      setShowIosTip(false);
    };
    adoptPrompt(w.__snapInstallDeferredPrompt ?? null);
    const onPromptReady = (event: Event) => {
      const detail =
        (event as CustomEvent<BeforeInstallPromptEvent | null>).detail ?? null;
      adoptPrompt(detail ?? w.__snapInstallDeferredPrompt ?? null);
    };
    window.addEventListener(BRIDGE_EVENT_NAME, onPromptReady as any);
    // iOS/iPadOS Safari never fires beforeinstallprompt; show a clear fallback
    const ua = navigator.userAgent || (navigator as any).vendor || "";
    const isIOS =
      /iPhone|iPad|iPod/.test(ua) ||
      (/\bMacintosh\b/.test(ua) && "ontouchend" in document);
    const isStandalone =
      (window.navigator as any).standalone === true ||
      (window.matchMedia &&
        window.matchMedia("(display-mode: standalone)").matches);
    let iosTimeout: number | undefined;
    if (isIOS && !isStandalone && !w.__snapInstallDeferredPrompt) {
      setShowIosTip(true);
      // Guard in case UA parsing runs before iOS paints toolbar
      iosTimeout = window.setTimeout(() => {
        if (!w.__snapInstallDeferredPrompt) setShowIosTip(true);
      }, 1200);
    }

    return () => {
      window.removeEventListener(BRIDGE_EVENT_NAME, onPromptReady as any);
      if (iosTimeout) window.clearTimeout(iosTimeout);
    };
  }, []);

  useEffect(() => {
    const onInstalled = () => {
      setCanInstall(false);
      setShowIosTip(false);
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
                  <div className="mt-2 text-xs opacity-70">
                    If nothing happens, open the Chrome menu and tap
                    <span className="font-semibold"> Install app</span>.
                  </div>
                </div>
                <div className="text-xs opacity-70">
                  {showIosFallback
                    ? "Follow these steps to add Envitefy to your iOS home screen."
                    : "Keep Envitefy handy on your device."}
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
                    try {
                      (window as SnapWindow).__snapInstallDeferredPrompt = null;
                    } catch {}
                  }
                }}
                className="w-full rounded-full bg-primary text-primary-foreground px-4 py-2 shadow-lg"
              >
                Install app
              </button>
            )}
            {showIosFallback && (
              <div className="rounded-xl border border-border bg-surface/80 p-3 text-sm shadow-inner">
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
                  <div className="space-y-2">
                    <div className="font-medium">
                      Add Envitefy to your Home Screen
                    </div>
                    <ol className="list-decimal ml-5 space-y-1">
                      <li>
                        Tap the Share button in Safari (square with arrow).
                      </li>
                      <li>
                        Choose{" "}
                        <span className="font-semibold">
                          Add to Home Screen
                        </span>
                        .
                      </li>
                      <li>
                        Tap <span className="font-semibold">Add</span> to
                        confirm.
                      </li>
                    </ol>
                    <div className="text-xs opacity-70">
                      Tip: If you opened this in another browser on iOS, open in
                      Safari to install.
                    </div>
                  </div>
                </div>
              </div>
            )}
            {!canInstall &&
              !showIosFallback &&
              showGenericFallback &&
              (isAndroid ? (
                <div className="pt-1">
                  <button
                    onClick={async () => {
                      if (deferred) {
                        await deferred.prompt();
                        try {
                          await deferred.userChoice;
                        } finally {
                          setDeferred(null);
                          setCanInstall(false);
                          setShowIosTip(false);
                          try {
                            (window as SnapWindow).__snapInstallDeferredPrompt =
                              null;
                          } catch {}
                        }
                      } else {
                        try {
                          setExpanded(true);
                        } catch {}
                      }
                    }}
                    className="w-full rounded-full bg-primary text-primary-foreground px-4 py-2 shadow-lg"
                  >
                    Install app
                  </button>
                </div>
              ) : (
                <div className="rounded-xl bg-surface text-foreground border border-border shadow-inner p-3 text-sm">
                  <div className="font-medium mb-2">Install this app</div>
                  <button
                    onClick={async () => {
                      if (deferred) {
                        await deferred.prompt();
                        try {
                          await deferred.userChoice;
                        } finally {
                          setDeferred(null);
                          setCanInstall(false);
                          setShowIosTip(false);
                          try {
                            (window as SnapWindow).__snapInstallDeferredPrompt =
                              null;
                          } catch {}
                        }
                      } else {
                        try {
                          setExpanded(true);
                        } catch {}
                      }
                    }}
                    className="w-full rounded-full bg-primary text-primary-foreground px-4 py-2 shadow-lg mb-3"
                  >
                    Install app
                  </button>
                  <div className="opacity-80">
                    Open your browser menu and choose{" "}
                    <span className="font-semibold">Install app</span>.
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
