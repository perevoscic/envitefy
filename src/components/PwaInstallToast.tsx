"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useInstalledAppState } from "@/lib/pwa/install-state";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

interface SnapWindow extends Window {
  __snapInstallDeferredPrompt?: BeforeInstallPromptEvent | null;
  __snapInstallBridgeReady?: boolean;
}

const BRIDGE_EVENT_NAME = "envitefy:beforeinstallprompt";
const APP_ICON_SRC = "/icons/icon-192.png?v=v8";

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

export default function PwaInstallToast() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const { installState, markInstalled } = useInstalledAppState();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (installState.status !== "installed") return;
    setIsVisible(false);
    setIsAnimating(false);
    deferredPromptRef.current = null;
    setDeferred(null);
    try {
      (window as SnapWindow).__snapInstallDeferredPrompt = null;
    } catch {
      // ignore prompt cleanup failures
    }
  }, [installState.status]);

  // Listen for install prompt
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as SnapWindow;

    const adoptPrompt = (evt: BeforeInstallPromptEvent | null | undefined) => {
      if (!evt) return;

      w.__snapInstallDeferredPrompt = evt;
      deferredPromptRef.current = evt;
      setDeferred(evt);
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (installState.status !== "not_installed" || isDismissed || !deferred) {
      setIsVisible(false);
      setIsAnimating(false);
      return;
    }

    let revealTimer = 0;
    let visibleTimer = 0;
    revealTimer = window.setTimeout(() => {
      setIsAnimating(true);
      visibleTimer = window.setTimeout(() => {
        setIsVisible(true);
      }, 50);
    }, 2000);

    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(visibleTimer);
    };
  }, [deferred, installState.status, isDismissed]);

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
        markInstalled("install toast accepted", {
          platform: choiceResult.platform ?? "unknown",
        });
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
  }, [markInstalled]);

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
  if (
    installState.status === "checking" ||
    installState.status === "installed" ||
    !isVisible ||
    isDismissed ||
    !deferred
  ) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] px-3 pt-1.5 pb-1.5 safe-inset-x"
      style={{
        paddingTop: `calc(0.35rem + env(safe-area-inset-top))`,
      }}
    >
      <div className="mx-auto max-w-6xl">
        <div
          className="relative overflow-hidden rounded-[22px] border border-[#e7e1ff] bg-white/95 px-3.5 py-2.5 shadow-[0_18px_48px_rgba(103,87,255,0.14)] backdrop-blur-xl transition-all duration-300 ease-out"
          style={{
            opacity: isAnimating ? 1 : 0,
            transform: isAnimating ? "translateY(0)" : "translateY(-20px)",
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(123,97,255,0.14),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(55,168,255,0.1),transparent_32%)]" />
          <div className="relative flex items-center gap-3">
            {/* App Icon */}
            <div className="flex-shrink-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-[#ebe6ff] bg-[linear-gradient(135deg,#f8f5ff_0%,#eef2ff_100%)] shadow-[0_10px_24px_rgba(103,87,255,0.1)]">
                <img
                  src={APP_ICON_SRC}
                  alt="Envitefy"
                  className="h-8 w-8 rounded-md"
                  onError={(e) => {
                    // Fallback to SVG if image fails
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const svg = target.nextElementSibling as SVGElement;
                    if (svg) svg.style.display = "block";
                  }}
                />
                <svg
                  width="22"
                  height="22"
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
              <div className="text-sm font-semibold leading-tight text-[#1f2340] sm:text-[15px]">
                Install Envitefy
              </div>
              <div className="mt-0.5 text-[11px] leading-none text-[#6b7390] sm:text-xs">
                envitefy.com
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-shrink-0 items-center gap-2">
              <button
                onClick={handleInstall}
                className="rounded-full bg-[linear-gradient(96deg,#6b3cff_0%,#6757ff_42%,#5a7dff_100%)] px-4 py-2 text-xs font-semibold text-white shadow-[0_14px_26px_rgba(103,87,255,0.28)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_30px_rgba(103,87,255,0.32)] active:scale-95 sm:text-sm"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-full border border-[#ece8ff] bg-white/85 p-1.5 text-[#7a8098] shadow-sm transition-all hover:bg-[#f6f3ff] hover:text-[#4d3bca]"
                aria-label="Dismiss"
              >
                <svg
                  width="16"
                  height="16"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
