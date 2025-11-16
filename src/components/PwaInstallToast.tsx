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

export default function PwaInstallToast() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  // Check if already installed
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isStandalone =
      (window.navigator as any).standalone === true ||
      (window.matchMedia &&
        window.matchMedia("(display-mode: standalone)").matches) ||
      (window.matchMedia &&
        window.matchMedia("(display-mode: fullscreen)").matches) ||
      (window.matchMedia &&
        window.matchMedia("(display-mode: minimal-ui)").matches);

    if (isStandalone) {
      setIsVisible(false);
      return;
    }
  }, []);

  // Listen for install prompt
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as SnapWindow;

    const adoptPrompt = (evt: BeforeInstallPromptEvent | null | undefined) => {
      if (!evt) return;
      w.__snapInstallDeferredPrompt = evt;
      deferredPromptRef.current = evt;
      setDeferred(evt);
      // Show toast after a short delay
      setTimeout(() => {
        setIsAnimating(true);
        setTimeout(() => {
          setIsVisible(true);
        }, 50);
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

  if (!isVisible || isDismissed || !deferred) {
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
          className="bg-surface/98 backdrop-blur-lg border border-border/50 rounded-2xl shadow-2xl p-4 flex items-center gap-4 transition-all duration-300 ease-out"
          style={{
            opacity: isAnimating ? 1 : 0,
            transform: isAnimating ? "translateY(0)" : "translateY(-20px)",
          }}
        >
          {/* App Icon */}
          <div className="flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-border/30">
              <img
                src="/icons/icon-192.png"
                alt="Envitefy"
                className="w-10 h-10 rounded-lg"
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
                className="text-primary hidden"
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
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-foreground text-base leading-tight">
              Install Envitefy
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              envitefy.com
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-surface-alt"
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
              className="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg"
            >
              Install
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
