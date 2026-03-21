"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

interface SnapWindow extends Window {
  __snapInstallDeferredPrompt?: BeforeInstallPromptEvent | null;
  __snapInstallBridgeReady?: boolean;
}

const BRIDGE_EVENT_NAME = "envitefy:beforeinstallprompt";

const shouldHideInstallUi = (): boolean => {
  if (typeof window === "undefined") return false;
  let inIframe = false;
  try {
    inIframe = window.self !== window.top;
  } catch {
    inIframe = true;
  }
  let isEmbedQuery = false;
  try {
    isEmbedQuery = new URLSearchParams(window.location.search).get("embed") === "1";
  } catch {
    isEmbedQuery = false;
  }
  return inIframe || isEmbedQuery;
};

// Helper function to check if app is installed
const isAppInstalled = (): boolean => {
  if (typeof window === "undefined") return false;

  // Check for iOS standalone mode
  if ((window.navigator as any).standalone === true) {
    return true;
  }

  // Check for display mode (PWA installed)
  if (window.matchMedia) {
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.matchMedia("(display-mode: minimal-ui)").matches
    ) {
      return true;
    }
  }

  return false;
};

export default function PwaInstallToast() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  // Check if already installed - run on mount and periodically
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkInstalled = () => {
      const installed = isAppInstalled();
      setIsInstalled(installed);
      if (installed) {
        setIsVisible(false);
        setIsAnimating(false);
      }
    };

    // Check immediately
    checkInstalled();

    // Check periodically in case install state changes
    const interval = setInterval(checkInstalled, 1000);

    // Also listen for display mode changes
    if (window.matchMedia) {
      const mediaQueries = [
        window.matchMedia("(display-mode: standalone)"),
        window.matchMedia("(display-mode: fullscreen)"),
        window.matchMedia("(display-mode: minimal-ui)"),
      ];

      const handleChange = () => checkInstalled();
      mediaQueries.forEach((mq) => {
        if (mq.addEventListener) {
          mq.addEventListener("change", handleChange);
        } else {
          // Fallback for older browsers
          mq.addListener(handleChange);
        }
      });

      return () => {
        clearInterval(interval);
        mediaQueries.forEach((mq) => {
          if (mq.removeEventListener) {
            mq.removeEventListener("change", handleChange);
          } else {
            mq.removeListener(handleChange);
          }
        });
      };
    }

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Listen for install prompt
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as SnapWindow;

    const adoptPrompt = (evt: BeforeInstallPromptEvent | null | undefined) => {
      if (!evt) return;

      // Don't show toast if app is already installed
      if (isAppInstalled()) {
        setIsInstalled(true);
        setIsVisible(false);
        return;
      }

      w.__snapInstallDeferredPrompt = evt;
      deferredPromptRef.current = evt;
      setDeferred(evt);

      // Show toast after a short delay, but only if not installed
      setTimeout(() => {
        // Double-check installation status and dismissed state before showing
        const installed = isAppInstalled();
        let dismissed = false;
        try {
          dismissed = localStorage.getItem("pwa-install-dismissed") === "true";
        } catch {
          // ignore
        }

        if (!installed && !dismissed) {
          setIsAnimating(true);
          setTimeout(() => {
            // Final check before showing
            const stillInstalled = isAppInstalled();
            let stillDismissed = false;
            try {
              stillDismissed =
                localStorage.getItem("pwa-install-dismissed") === "true";
            } catch {
              // ignore
            }
            if (!stillInstalled && !stillDismissed) {
              setIsVisible(true);
            }
          }, 50);
        }
      }, 2000);
    };

    // Check if prompt already exists
    adoptPrompt(w.__snapInstallDeferredPrompt ?? null);

    // Listen for new prompt events
    const onPromptReady = (event: Event) => {
      const detail =
        (event as CustomEvent<BeforeInstallPromptEvent | null>).detail ?? null;
      adoptPrompt(detail ?? w.__snapInstallDeferredPrompt ?? null);
    };

    window.addEventListener(BRIDGE_EVENT_NAME, onPromptReady as any);

    return () => {
      window.removeEventListener(BRIDGE_EVENT_NAME, onPromptReady as any);
    };
  }, []);

  // Check localStorage for dismissed state
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      if (dismissed === "true") {
        setIsDismissed(true);
        setIsVisible(false);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleInstall = useCallback(async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) {
      // Fallback: try to open install instructions
      return;
    }

    try {
      await prompt.prompt();
      const choiceResult = await prompt.userChoice;

      if (choiceResult.outcome === "accepted") {
        setIsVisible(false);
        // Clear the prompt
        const w = window as SnapWindow;
        w.__snapInstallDeferredPrompt = null;
        deferredPromptRef.current = null;
        setDeferred(null);
      }
    } catch (error) {
      console.error("Error showing install prompt:", error);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setIsDismissed(true);
    try {
      localStorage.setItem("pwa-install-dismissed", "true");
      // Re-enable after 7 days
      setTimeout(() => {
        try {
          localStorage.removeItem("pwa-install-dismissed");
        } catch {
          // ignore
        }
      }, 7 * 24 * 60 * 60 * 1000);
    } catch {
      // ignore
    }
  }, []);

  if (shouldHideInstallUi()) return null;

  // Don't show if installed, dismissed, no prompt, or not visible
  if (isInstalled || !isVisible || isDismissed || !deferred) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] px-4 pt-2 pb-2 safe-inset-x"
      style={{
        paddingTop: `calc(0.5rem + env(safe-area-inset-top))`,
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div
          className="relative overflow-hidden rounded-[28px] border border-[#e7e1ff] bg-white/95 p-4 shadow-[0_24px_70px_rgba(103,87,255,0.16)] backdrop-blur-xl transition-all duration-300 ease-out"
          style={{
            opacity: isAnimating ? 1 : 0,
            transform: isAnimating ? "translateY(0)" : "translateY(-20px)",
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(123,97,255,0.14),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(55,168,255,0.1),transparent_32%)]" />
          <div className="relative flex items-center gap-4">
            {/* App Icon */}
            <div className="flex-shrink-0">
              <div className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-[#ebe6ff] bg-[linear-gradient(135deg,#f8f5ff_0%,#eef2ff_100%)] shadow-[0_12px_30px_rgba(103,87,255,0.12)]">
                <img
                  src="/icons/icon-192.png"
                  alt="Envitefy"
                  className="h-10 w-10 rounded-lg"
                  onError={(e) => {
                    // Fallback to SVG if image fails
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const svg = target.nextElementSibling as SVGElement;
                    if (svg) svg.style.display = "block";
                  }}
                />
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="hidden text-[#6b3cff]"
                  style={{ display: "none" }}
                >
                  <path
                    d="M12 2L2 7L12 12L22 7L12 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 17L12 22L22 17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 12L12 17L22 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {/* Text Content */}
            <div className="min-w-0 flex-1">
              <div className="text-base font-semibold leading-tight text-[#1f2340]">
                Install Envitefy
              </div>
              <div className="mt-0.5 text-xs text-[#6b7390]">
                envitefy.com
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-shrink-0 items-center gap-2">
              <button
                onClick={handleDismiss}
                className="rounded-full border border-[#ece8ff] bg-white/85 p-2 text-[#7a8098] shadow-sm transition-all hover:bg-[#f6f3ff] hover:text-[#4d3bca]"
                aria-label="Dismiss"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <button
                onClick={handleInstall}
                className="rounded-full bg-[linear-gradient(96deg,#6b3cff_0%,#6757ff_42%,#5a7dff_100%)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(103,87,255,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_34px_rgba(103,87,255,0.34)] active:scale-95"
              >
                Install
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
